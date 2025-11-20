/**
 * Undo/Redo History Stack
 *
 * Manages file operation history with undo/redo capabilities.
 * Stores file snapshots and operations for rollback functionality.
 *
 * Features:
 * - Unlimited undo/redo (limited by memory)
 * - File state snapshots
 * - Operation history tracking
 * - Branching history support
 */

import { File } from '../types/file';
import { Operation } from '../types/operations';

/**
 * History entry representing a file state snapshot
 */
export interface HistoryEntry {
  id: string; // UUID v4
  fileId: string;
  timestamp: Date;
  operation?: Operation; // Operation that led to this state
  snapshot: File; // Complete file state
  description: string; // Human-readable description (e.g., "Resize to 800x600")
}

/**
 * History stack configuration
 */
export interface HistoryConfig {
  maxEntries: number; // Maximum entries per file (0 = unlimited)
  autoSnapshot: boolean; // Auto-create snapshots after operations
  compressOldSnapshots: boolean; // Compress old snapshots to save memory
}

/**
 * Default history configuration
 */
export const DEFAULT_HISTORY_CONFIG: HistoryConfig = {
  maxEntries: 50, // Reasonable limit to prevent memory issues
  autoSnapshot: true,
  compressOldSnapshots: false, // Disabled for simplicity (can enable later)
};

/**
 * History stack for a single file
 */
export class FileHistory {
  private fileId: string;
  private entries: HistoryEntry[] = [];
  private currentIndex: number = -1; // -1 means no entries
  private config: HistoryConfig;

  constructor(fileId: string, config: Partial<HistoryConfig> = {}) {
    this.fileId = fileId;
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
  }

  /**
   * Add new history entry (snapshot)
   */
  public push(entry: Omit<HistoryEntry, 'id' | 'fileId' | 'timestamp'>): void {
    // If we're not at the end of history, discard forward history
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    // Create new entry
    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      fileId: this.fileId,
      timestamp: new Date(),
      ...entry,
    };

    this.entries.push(newEntry);
    this.currentIndex++;

    // Enforce max entries limit
    if (this.config.maxEntries > 0 && this.entries.length > this.config.maxEntries) {
      const excess = this.entries.length - this.config.maxEntries;
      this.entries = this.entries.slice(excess);
      this.currentIndex -= excess;
    }
  }

  /**
   * Undo to previous state
   */
  public undo(): HistoryEntry | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return this.entries[this.currentIndex] ?? null;
  }

  /**
   * Redo to next state
   */
  public redo(): HistoryEntry | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return this.entries[this.currentIndex] ?? null;
  }

  /**
   * Get current state
   */
  public current(): HistoryEntry | null {
    return this.entries[this.currentIndex] ?? null;
  }

  /**
   * Check if can undo
   */
  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if can redo
   */
  public canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  /**
   * Get all entries
   */
  public getAllEntries(): HistoryEntry[] {
    return [...this.entries];
  }

  /**
   * Get undo stack (entries before current)
   */
  public getUndoStack(): HistoryEntry[] {
    return this.entries.slice(0, this.currentIndex);
  }

  /**
   * Get redo stack (entries after current)
   */
  public getRedoStack(): HistoryEntry[] {
    return this.entries.slice(this.currentIndex + 1);
  }

  /**
   * Jump to specific entry
   */
  public jumpTo(entryId: string): HistoryEntry | null {
    const index = this.entries.findIndex((e) => e.id === entryId);
    if (index === -1) {
      return null;
    }

    this.currentIndex = index;
    return this.entries[index] ?? null;
  }

  /**
   * Clear all history
   */
  public clear(): void {
    this.entries = [];
    this.currentIndex = -1;
  }

  /**
   * Get history size (number of entries)
   */
  public size(): number {
    return this.entries.length;
  }

  /**
   * Get current index
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }
}

/**
 * History manager for multiple files
 */
export class HistoryManager {
  private histories: Map<string, FileHistory> = new Map();
  private config: HistoryConfig;

  constructor(config: Partial<HistoryConfig> = {}) {
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
  }

  /**
   * Get history for a file (creates if doesn't exist)
   */
  public getHistory(fileId: string): FileHistory {
    let history = this.histories.get(fileId);
    if (!history) {
      history = new FileHistory(fileId, this.config);
      this.histories.set(fileId, history);
    }
    return history;
  }

  /**
   * Add snapshot for a file
   */
  public snapshot(
    fileId: string,
    snapshot: File,
    description: string,
    operation?: Operation
  ): void {
    const history = this.getHistory(fileId);
    history.push({ snapshot, description, operation });
  }

  /**
   * Undo for a file
   */
  public undo(fileId: string): HistoryEntry | null {
    const history = this.histories.get(fileId);
    return history ? history.undo() : null;
  }

  /**
   * Redo for a file
   */
  public redo(fileId: string): HistoryEntry | null {
    const history = this.histories.get(fileId);
    return history ? history.redo() : null;
  }

  /**
   * Check if can undo for a file
   */
  public canUndo(fileId: string): boolean {
    const history = this.histories.get(fileId);
    return history ? history.canUndo() : false;
  }

  /**
   * Check if can redo for a file
   */
  public canRedo(fileId: string): boolean {
    const history = this.histories.get(fileId);
    return history ? history.canRedo() : false;
  }

  /**
   * Get current state for a file
   */
  public current(fileId: string): HistoryEntry | null {
    const history = this.histories.get(fileId);
    return history ? history.current() : null;
  }

  /**
   * Clear history for a file
   */
  public clearFile(fileId: string): void {
    this.histories.delete(fileId);
  }

  /**
   * Clear all histories
   */
  public clearAll(): void {
    this.histories.clear();
  }

  /**
   * Get all file IDs with history
   */
  public getFileIds(): string[] {
    return Array.from(this.histories.keys());
  }

  /**
   * Get total memory usage estimate (in bytes)
   */
  public estimateMemoryUsage(): number {
    let total = 0;
    for (const history of this.histories.values()) {
      const entries = history.getAllEntries();
      for (const entry of entries) {
        // Rough estimate: file size + metadata
        total += entry.snapshot.size + 1024; // 1KB overhead per entry
      }
    }
    return total;
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalFiles: number;
    totalEntries: number;
    estimatedMemory: number;
  } {
    let totalEntries = 0;
    for (const history of this.histories.values()) {
      totalEntries += history.size();
    }

    return {
      totalFiles: this.histories.size,
      totalEntries,
      estimatedMemory: this.estimateMemoryUsage(),
    };
  }
}

/**
 * Create a global history manager instance
 */
let globalHistoryManager: HistoryManager | null = null;

/**
 * Get or create global history manager
 */
export function getHistoryManager(
  config?: Partial<HistoryConfig>
): HistoryManager {
  if (!globalHistoryManager) {
    globalHistoryManager = new HistoryManager(config);
  }
  return globalHistoryManager;
}

/**
 * Helper: Create file snapshot with description
 */
export function createSnapshot(
  file: File,
  description: string,
  operation?: Operation
): Omit<HistoryEntry, 'id' | 'fileId' | 'timestamp'> {
  return {
    snapshot: { ...file },
    description,
    operation,
  };
}

/**
 * Helper: Generate description from operation
 */
export function descriptionFromOperation(operation: Operation): string {
  // This would be expanded with more detailed descriptions per operation type
  return `${operation.type} operation`;
}
