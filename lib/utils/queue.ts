/**
 * Operation Queue System
 *
 * Manages queuing, prioritization, and sequential/parallel execution
 * of file processing operations.
 *
 * Features:
 * - Priority-based queue
 * - Concurrent operation limiting
 * - Retry logic with exponential backoff
 * - Queue persistence (in-memory only, per constitution)
 */

import {
  Operation,
  QueuedOperation,
  OperationPriority,
  OperationResult,
  OperationError,
  OperationErrorCode,
  sortByPriority,
} from '../types/operations';
import { PROCESSING_LIMITS } from '../constants/limits';

/**
 * Queue configuration
 */
export interface QueueConfig {
  maxConcurrent: number; // Maximum concurrent operations
  retryAttempts: number; // Number of retry attempts
  retryDelay: number; // Initial retry delay in ms
  retryBackoffFactor: number; // Exponential backoff multiplier
  timeout: number; // Operation timeout in ms
}

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxConcurrent: PROCESSING_LIMITS.MAX_CONCURRENT_OPERATIONS,
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  retryBackoffFactor: 2, // Double delay each retry
  timeout: PROCESSING_LIMITS.OPERATION_TIMEOUT,
};

/**
 * Operation processor function type
 */
export type OperationProcessor = (
  operation: Operation
) => Promise<OperationResult>;

/**
 * Queue event handlers
 */
export interface QueueEventHandlers {
  onOperationStart?: (operation: Operation) => void;
  onOperationComplete?: (result: OperationResult) => void;
  onOperationError?: (operation: Operation, error: OperationError) => void;
  onQueueEmpty?: () => void;
  onQueueProgress?: (progress: { completed: number; total: number }) => void;
}

/**
 * Operation Queue class
 */
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private running: Set<string> = new Set();
  private completed: Map<string, OperationResult> = new Map();
  private config: QueueConfig;
  private processor: OperationProcessor;
  private eventHandlers: QueueEventHandlers;
  private isProcessing: boolean = false;

  constructor(
    processor: OperationProcessor,
    config: Partial<QueueConfig> = {},
    eventHandlers: QueueEventHandlers = {}
  ) {
    this.processor = processor;
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    this.eventHandlers = eventHandlers;
  }

  /**
   * Add operation to queue
   */
  public enqueue(
    operation: Operation,
    priority: OperationPriority = OperationPriority.NORMAL
  ): void {
    const queuedOp: QueuedOperation = {
      operation,
      priority,
      addedAt: new Date(),
      retryCount: 0,
      maxRetries: this.config.retryAttempts,
    };

    this.queue.push(queuedOp);
    this.sortQueue();

    // Auto-start processing if not already running
    if (!this.isProcessing) {
      void this.processQueue();
    }
  }

  /**
   * Add multiple operations to queue
   */
  public enqueueBatch(
    operations: Operation[],
    priority: OperationPriority = OperationPriority.NORMAL
  ): void {
    operations.forEach((op) => this.enqueue(op, priority));
  }

  /**
   * Remove operation from queue
   */
  public dequeue(operationId: string): boolean {
    const index = this.queue.findIndex((qop) => qop.operation.id === operationId);
    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    return true;
  }

  /**
   * Clear all pending operations
   */
  public clear(): void {
    this.queue = [];
  }

  /**
   * Cancel running operation
   */
  public cancel(operationId: string): boolean {
    // Remove from queue if pending
    if (this.dequeue(operationId)) {
      return true;
    }

    // Mark as cancelled if running
    if (this.running.has(operationId)) {
      this.running.delete(operationId);
      return true;
    }

    return false;
  }

  /**
   * Get queue status
   */
  public getStatus(): {
    pending: number;
    running: number;
    completed: number;
    total: number;
  } {
    return {
      pending: this.queue.length,
      running: this.running.size,
      completed: this.completed.size,
      total: this.queue.length + this.running.size + this.completed.size,
    };
  }

  /**
   * Get operation result
   */
  public getResult(operationId: string): OperationResult | undefined {
    return this.completed.get(operationId);
  }

  /**
   * Get all completed results
   */
  public getAllResults(): OperationResult[] {
    return Array.from(this.completed.values());
  }

  /**
   * Check if queue is empty
   */
  public isEmpty(): boolean {
    return this.queue.length === 0 && this.running.size === 0;
  }

  /**
   * Wait for all operations to complete
   */
  public async waitForCompletion(): Promise<OperationResult[]> {
    while (!this.isEmpty()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return this.getAllResults();
  }

  /**
   * Process queue (internal)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 || this.running.size > 0) {
      // Process operations while we have capacity
      while (
        this.queue.length > 0 &&
        this.running.size < this.config.maxConcurrent
      ) {
        const queuedOp = this.queue.shift();
        if (!queuedOp) break;

        void this.processOperation(queuedOp);
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.isProcessing = false;

    // Notify queue empty
    this.eventHandlers.onQueueEmpty?.();
  }

  /**
   * Process single operation (internal)
   */
  private async processOperation(queuedOp: QueuedOperation): Promise<void> {
    const { operation } = queuedOp;
    this.running.add(operation.id);

    // Notify start
    this.eventHandlers.onOperationStart?.(operation);

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<OperationResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Operation timeout'));
        }, this.config.timeout);
      });

      // Race between actual processing and timeout
      const result = await Promise.race([
        this.processor(operation),
        timeoutPromise,
      ]);

      // Mark as completed
      this.running.delete(operation.id);
      this.completed.set(operation.id, result);

      // Notify completion
      this.eventHandlers.onOperationComplete?.(result);
      this.notifyProgress();
    } catch (error) {
      // Handle error
      const operationError: OperationError = {
        code:
          error instanceof Error && error.message === 'Operation timeout'
            ? OperationErrorCode.TIMEOUT
            : OperationErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : String(error),
        recoverable: true,
        stack: error instanceof Error ? error.stack : undefined,
      };

      // Retry if attempts remain
      if (queuedOp.retryCount < queuedOp.maxRetries) {
        await this.retryOperation(queuedOp, operationError);
      } else {
        // Max retries exceeded, mark as failed
        this.running.delete(operation.id);
        const failedResult: OperationResult = {
          operation,
          success: false,
          error: operationError,
        };
        this.completed.set(operation.id, failedResult);

        // Notify error
        this.eventHandlers.onOperationError?.(operation, operationError);
        this.notifyProgress();
      }
    }
  }

  /**
   * Retry operation with exponential backoff (internal)
   */
  private async retryOperation(
    queuedOp: QueuedOperation,
    _error: OperationError
  ): Promise<void> {
    // Calculate backoff delay
    const delay =
      this.config.retryDelay *
      Math.pow(this.config.retryBackoffFactor, queuedOp.retryCount);

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Increment retry count
    queuedOp.retryCount++;

    // Re-add to queue with higher priority
    queuedOp.priority = Math.min(
      queuedOp.priority + 1,
      OperationPriority.URGENT
    );

    this.queue.push(queuedOp);
    this.sortQueue();

    // Remove from running
    this.running.delete(queuedOp.operation.id);
  }

  /**
   * Sort queue by priority (internal)
   */
  private sortQueue(): void {
    this.queue.sort(sortByPriority);
  }

  /**
   * Notify progress (internal)
   */
  private notifyProgress(): void {
    const status = this.getStatus();
    this.eventHandlers.onQueueProgress?.({
      completed: status.completed,
      total: status.total,
    });
  }
}

/**
 * Create a simple operation queue
 */
export function createQueue(
  processor: OperationProcessor,
  config?: Partial<QueueConfig>,
  eventHandlers?: QueueEventHandlers
): OperationQueue {
  return new OperationQueue(processor, config, eventHandlers);
}

/**
 * Batch processor with automatic queue management
 */
export async function processBatch(
  operations: Operation[],
  processor: OperationProcessor,
  config?: Partial<QueueConfig>
): Promise<OperationResult[]> {
  return new Promise((resolve) => {
    const results: OperationResult[] = [];

    const queue = createQueue(
      processor,
      config,
      {
        onOperationComplete: (result) => {
          results.push(result);
        },
        onQueueEmpty: () => {
          resolve(results);
        },
      }
    );

    queue.enqueueBatch(operations);
  });
}
