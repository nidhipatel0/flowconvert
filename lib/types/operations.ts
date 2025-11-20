/**
 * Operation Types and Utilities
 *
 * Extended operation types for managing file processing operations,
 * queues, history, and results.
 */

import {
  Operation,
  OperationType,
  OperationStatus,
  ConversionOptions,
} from './file';

/**
 * Re-export core operation types from file.ts for convenience
 */
export type { Operation, OperationType, OperationStatus, ConversionOptions };

/**
 * Operation result with output data
 */
export interface OperationResult {
  operation: Operation;
  success: boolean;
  output?: Blob | ArrayBuffer;
  error?: OperationError;
  metadata?: {
    originalSize: number;
    finalSize: number;
    compressionRatio?: number; // e.g., 0.6 for 60% compression
    processingTime: number; // in milliseconds
    quality?: number; // 0-100
  };
}

/**
 * Operation error details
 */
export interface OperationError {
  code: OperationErrorCode;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  recoverable: boolean; // Can the operation be retried?
  suggestedAction?: string; // User-friendly suggestion
}

/**
 * Operation error codes
 */
export enum OperationErrorCode {
  // Input errors
  INVALID_INPUT = 'INVALID_INPUT',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  CORRUPTED_FILE = 'CORRUPTED_FILE',

  // Processing errors
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  DIMENSION_INVALID = 'DIMENSION_INVALID',
  QUALITY_INVALID = 'QUALITY_INVALID',

  // Resource errors
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  TIMEOUT = 'TIMEOUT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // System errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Operation queue item with priority
 */
export interface QueuedOperation {
  operation: Operation;
  priority: OperationPriority;
  addedAt: Date;
  retryCount: number;
  maxRetries: number;
}

/**
 * Operation priority levels
 */
export enum OperationPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

/**
 * Operation history entry
 */
export interface OperationHistoryEntry {
  operation: Operation;
  result: OperationResult;
  timestamp: Date;
}

/**
 * Operation filter for querying
 */
export interface OperationFilter {
  fileId?: string;
  type?: OperationType | OperationType[];
  status?: OperationStatus | OperationStatus[];
  startedAfter?: Date;
  startedBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
}

/**
 * Operation statistics
 */
export interface OperationStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageProcessingTime: number; // in milliseconds
  totalProcessingTime: number; // in milliseconds
  successRate: number; // 0-1 (e.g., 0.95 for 95%)
}

/**
 * Batch operation configuration
 */
export interface BatchOperationConfig {
  operations: Operation[];
  concurrency: number; // Max parallel operations
  stopOnError: boolean; // Stop batch if any operation fails
  retryFailedOperations: boolean;
  maxRetries: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  results: OperationResult[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    duration: number; // in milliseconds
  };
  errors: OperationError[];
}

/**
 * Operation progress update
 */
export interface OperationProgress {
  operationId: string;
  progress: number; // 0-100
  stage?: string; // e.g., "reading file", "converting", "compressing"
  estimatedTimeRemaining?: number; // in milliseconds
}

/**
 * Helper: Create a new operation
 */
export function createOperation(
  fileId: string,
  type: OperationType,
  options: ConversionOptions
): Operation {
  return {
    id: crypto.randomUUID(),
    type,
    fileId,
    status: OperationStatus.PENDING,
    options,
    startedAt: new Date(),
    progress: 0,
  };
}

/**
 * Helper: Check if operation is terminal (completed, failed, or cancelled)
 */
export function isTerminalStatus(status: OperationStatus): boolean {
  return [
    OperationStatus.COMPLETED,
    OperationStatus.FAILED,
    OperationStatus.CANCELLED,
  ].includes(status);
}

/**
 * Helper: Check if operation is active (pending or in progress)
 */
export function isActiveStatus(status: OperationStatus): boolean {
  return [OperationStatus.PENDING, OperationStatus.IN_PROGRESS].includes(status);
}

/**
 * Helper: Calculate operation statistics
 */
export function calculateOperationStats(operations: Operation[]): OperationStats {
  const total = operations.length;
  const pending = operations.filter((op) => op.status === OperationStatus.PENDING).length;
  const inProgress = operations.filter(
    (op) => op.status === OperationStatus.IN_PROGRESS
  ).length;
  const completed = operations.filter((op) => op.status === OperationStatus.COMPLETED).length;
  const failed = operations.filter((op) => op.status === OperationStatus.FAILED).length;
  const cancelled = operations.filter((op) => op.status === OperationStatus.CANCELLED).length;

  // Calculate average processing time for completed operations
  const completedOps = operations.filter(
    (op) => op.status === OperationStatus.COMPLETED && op.processingTime
  );
  const totalProcessingTime = completedOps.reduce(
    (sum, op) => sum + (op.processingTime ?? 0),
    0
  );
  const averageProcessingTime =
    completedOps.length > 0 ? totalProcessingTime / completedOps.length : 0;

  // Calculate success rate
  const finishedOps = completed + failed;
  const successRate = finishedOps > 0 ? completed / finishedOps : 0;

  return {
    total,
    pending,
    inProgress,
    completed,
    failed,
    cancelled,
    averageProcessingTime,
    totalProcessingTime,
    successRate,
  };
}

/**
 * Helper: Filter operations
 */
export function filterOperations(
  operations: Operation[],
  filter: OperationFilter
): Operation[] {
  return operations.filter((op) => {
    // Filter by fileId
    if (filter.fileId && op.fileId !== filter.fileId) {
      return false;
    }

    // Filter by type
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (!types.includes(op.type)) {
        return false;
      }
    }

    // Filter by status
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      if (!statuses.includes(op.status)) {
        return false;
      }
    }

    // Filter by start time
    if (filter.startedAfter && op.startedAt < filter.startedAfter) {
      return false;
    }
    if (filter.startedBefore && op.startedAt > filter.startedBefore) {
      return false;
    }

    // Filter by completion time
    if (filter.completedAfter && op.completedAt && op.completedAt < filter.completedAfter) {
      return false;
    }
    if (filter.completedBefore && op.completedAt && op.completedAt > filter.completedBefore) {
      return false;
    }

    return true;
  });
}

/**
 * Helper: Sort operations by priority
 */
export function sortByPriority(a: QueuedOperation, b: QueuedOperation): number {
  // Higher priority first
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }
  // Earlier added first for same priority
  return a.addedAt.getTime() - b.addedAt.getTime();
}

/**
 * Helper: Get user-friendly error message
 */
export function getErrorMessage(error: OperationError): string {
  return error.suggestedAction
    ? `${error.message}. ${error.suggestedAction}`
    : error.message;
}

/**
 * Helper: Check if error is recoverable
 */
export function isRecoverableError(errorCode: OperationErrorCode): boolean {
  const recoverableErrors = [
    OperationErrorCode.NETWORK_ERROR,
    OperationErrorCode.TIMEOUT,
    OperationErrorCode.SERVER_ERROR,
  ];
  return recoverableErrors.includes(errorCode);
}
