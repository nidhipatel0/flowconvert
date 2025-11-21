/**
 * Editor Store (Zustand)
 *
 * Central state management for file editing workflow.
 * Manages files, operations, preview state, and batch processing.
 *
 * Per constitution: Privacy-first (all state in-memory only, no persistence)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { File } from '@/lib/types/file';
import { FileState } from '@/lib/types/file';
import type { Operation, OperationParameters } from '@/lib/types/operation';
import { OperationType, OperationStatus } from '@/lib/types/operation';
import { v4 as uuidv4 } from 'uuid';

/**
 * Editor state interface
 */
export interface EditorState {
  // Files
  files: Map<string, File>;
  activeFileId: string | null;
  selectedFileIds: string[];

  // Operations
  operations: Map<string, Operation>;
  operationQueue: string[]; // Array of operation IDs to execute in order

  // History for undo/redo
  fileHistory: Map<string, Blob[]>; // Undo stack for each file
  fileRedoHistory: Map<string, Blob[]>; // Redo stack for each file

  // UI state
  isProcessing: boolean;
  processingProgress: number; // 0-100
  previewMode: 'before' | 'after' | 'split';
  showGrid: boolean;
  zoomLevel: number; // 10-200 (percentage)

  // Error handling
  lastError: string | null;

  // OCR state
  ocrResult: string | null;
  ocrConfidence: number;
  ocrProcessingTime: number;
  ocrSelectedPage: number;
  ocrIsProcessing: boolean;
  ocrProgress: number;

  // Actions - File management
  addFile: (file: Omit<File, 'id' | 'uploadedAt' | 'state' | 'operations'>) => string;
  addFiles: (files: Omit<File, 'id' | 'uploadedAt' | 'state' | 'operations'>[]) => string[];
  removeFile: (fileId: string) => void;
  removeFiles: (fileIds: string[]) => void;
  clearFiles: () => void;
  setActiveFile: (fileId: string | null) => void;
  setSelectedFiles: (fileIds: string[]) => void;
  toggleFileSelection: (fileId: string) => void;

  // Actions - File state updates
  updateFileState: (fileId: string, state: FileState) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  updateFileError: (fileId: string, error: string) => void;
  updateFileData: (fileId: string, data: Blob | ArrayBuffer) => void;

  // Actions - Operations
  addOperation: (
    fileId: string,
    type: OperationType,
    parameters: OperationParameters
  ) => string;
  removeOperation: (operationId: string) => void;
  clearOperations: (fileId: string) => void;
  reorderOperations: (fileId: string, operationIds: string[]) => void;

  // Actions - Processing
  processFile: (fileId: string) => Promise<void>;
  processBatch: () => Promise<void>;
  cancelProcessing: () => void;
  undoOperation: (fileId: string) => void;
  redoOperation: (fileId: string) => void;
  resetFile: (fileId: string) => void;

  // Actions - UI
  setPreviewMode: (mode: 'before' | 'after' | 'split') => void;
  setZoomLevel: (level: number) => void;
  toggleGrid: () => void;
  setError: (error: string | null) => void;

  // Actions - OCR
  setOCRResult: (result: string | null, confidence: number, processingTime: number) => void;
  setOCRProgress: (progress: number) => void;
  setOCRProcessing: (isProcessing: boolean) => void;
  clearOCRResult: () => void;

  // Getters
  getFile: (fileId: string) => File | undefined;
  getActiveFile: () => File | undefined;
  getSelectedFiles: () => File[];
  getFileOperations: (fileId: string) => Operation[];
  getTotalFileSize: () => number;
  getProcessingFiles: () => File[];
}

/**
 * Create Editor Store
 */
export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      // Initial state
      files: new Map(),
      activeFileId: null,
      selectedFileIds: [],
      operations: new Map(),
      operationQueue: [],
      fileHistory: new Map(),
      fileRedoHistory: new Map(),
      isProcessing: false,
      processingProgress: 0,
      previewMode: 'split',
      showGrid: false,
      zoomLevel: 100,
      lastError: null,
      ocrResult: null,
      ocrConfidence: 0,
      ocrProcessingTime: 0,
      ocrSelectedPage: 1,
      ocrIsProcessing: false,
      ocrProgress: 0,

      // File management actions
      addFile: (fileInput) => {
        const fileId = uuidv4();
        // Use originalFile if provided (File object), otherwise create Blob from data
        let originalFile: Blob;
        if ((fileInput as any).originalFile instanceof File) {
          // If originalFile is a File, use it directly (File extends Blob)
          originalFile = (fileInput as any).originalFile;
          console.log('Preserving File object as originalFile:', {
            name: originalFile instanceof globalThis.File ? (originalFile as globalThis.File).name : 'N/A',
            size: originalFile.size,
            type: originalFile.type
          });
        } else if ((fileInput as any).originalFile instanceof Blob) {
          // If originalFile is already a Blob, use it
          originalFile = (fileInput as any).originalFile;
        } else {
          // Otherwise, create Blob from data
          originalFile = fileInput.data instanceof Blob 
            ? fileInput.data 
            : new Blob([fileInput.data], { type: fileInput.type });
        }
        
        // Create file object, ensuring originalFile is set correctly
        const { originalFile: _, ...restInput } = fileInput as any;
        const file: File = {
          ...restInput,
          id: fileId,
          uploadedAt: new Date(),
          state: FileState.UPLOADED,
          operations: [],
          originalFile: originalFile,
          // Generate preview URL if not provided
          previewUrl: fileInput.previewUrl || URL.createObjectURL(originalFile),
        };

        console.log('File added to store:', {
          id: fileId,
          name: file.name,
          format: file.format,
          hasOriginalFile: !!file.originalFile,
          originalFileType: file.originalFile?.constructor?.name,
          originalFileSize: file.originalFile?.size
        });

        set((state) => {
          const newFiles = new Map(state.files);
          newFiles.set(fileId, file);
          return {
            files: newFiles,
            activeFileId: state.activeFileId ?? fileId, // Auto-select first file
          };
        });

        return fileId;
      },

      addFiles: (fileInputs) => {
        const fileIds: string[] = [];

        set((state) => {
          const newFiles = new Map(state.files);

          fileInputs.forEach((fileInput) => {
            const fileId = uuidv4();
            // Use originalFile if provided (File object), otherwise create Blob from data
            let originalFile: Blob;
            if ((fileInput as any).originalFile instanceof File) {
              // If originalFile is a File, use it directly (File extends Blob)
              originalFile = (fileInput as any).originalFile;
              console.log('Preserving File object as originalFile:', {
                name: originalFile instanceof globalThis.File ? (originalFile as globalThis.File).name : 'N/A',
                size: originalFile.size,
                type: originalFile.type
              });
            } else if ((fileInput as any).originalFile instanceof Blob) {
              // If originalFile is already a Blob, use it
              originalFile = (fileInput as any).originalFile;
            } else {
              // Otherwise, create Blob from data
              originalFile = fileInput.data instanceof Blob 
                ? fileInput.data 
                : new Blob([fileInput.data], { type: fileInput.type });
            }
            
            // Create file object, ensuring originalFile is set correctly
            const { originalFile: _, ...restInput } = fileInput as any;
            const file: File = {
              ...restInput,
              id: fileId,
              uploadedAt: new Date(),
              state: FileState.UPLOADED,
              operations: [],
              originalFile: originalFile,
              // Generate preview URL if not provided
              previewUrl: fileInput.previewUrl || URL.createObjectURL(originalFile),
            };

            console.log('File added to store:', {
              id: fileId,
              name: file.name,
              format: file.format,
              hasOriginalFile: !!file.originalFile,
              originalFileType: file.originalFile?.constructor?.name,
              originalFileSize: file.originalFile?.size
            });

            newFiles.set(fileId, file);
            fileIds.push(fileId);
          });

          return {
            files: newFiles,
            activeFileId: state.activeFileId ?? fileIds[0], // Auto-select first file
          };
        });

        return fileIds;
      },

      removeFile: (fileId) => {
        set((state) => {
          const newFiles = new Map(state.files);
          const file = state.files.get(fileId);
          
          // Revoke preview URL to free memory
          if (file?.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }
          
          newFiles.delete(fileId);

          // Remove file's operations
          const newOperations = new Map(state.operations);
          file?.operations.forEach((opId) => newOperations.delete(opId));

          // Update active file if removed
          let newActiveFileId = state.activeFileId;
          if (state.activeFileId === fileId) {
            const remainingFiles = Array.from(newFiles.keys());
            newActiveFileId = remainingFiles[0] ?? null;
          }

          // Update selected files
          const newSelectedFileIds = state.selectedFileIds.filter(
            (id) => id !== fileId
          );

          return {
            files: newFiles,
            operations: newOperations,
            activeFileId: newActiveFileId,
            selectedFileIds: newSelectedFileIds,
          };
        });
      },

      removeFiles: (fileIds) => {
        fileIds.forEach((fileId) => get().removeFile(fileId));
      },

      clearFiles: () => {
        // Revoke all preview URLs before clearing
        const { files } = get();
        files.forEach((file) => {
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }
        });
        
        set({
          files: new Map(),
          operations: new Map(),
          operationQueue: [],
          activeFileId: null,
          selectedFileIds: [],
          isProcessing: false,
          processingProgress: 0,
        });
      },

      setActiveFile: (fileId) => {
        set({ activeFileId: fileId });
      },

      setSelectedFiles: (fileIds) => {
        set({ selectedFileIds: fileIds });
      },

      toggleFileSelection: (fileId) => {
        set((state) => {
          const isSelected = state.selectedFileIds.includes(fileId);
          const newSelectedFileIds = isSelected
            ? state.selectedFileIds.filter((id) => id !== fileId)
            : [...state.selectedFileIds, fileId];

          return { selectedFileIds: newSelectedFileIds };
        });
      },

      // File state updates
      updateFileState: (fileId, fileState) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const updatedFile = { ...file, state: fileState };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return { files: newFiles };
        });
      },

      updateFileProgress: (fileId, progress) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const updatedFile = { ...file, processingProgress: progress };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return { files: newFiles };
        });
      },

      updateFileError: (fileId, error) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const updatedFile = {
            ...file,
            state: FileState.ERROR,
            errorMessage: error,
          };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return { files: newFiles, lastError: error };
        });
      },

      updateFileData: (fileId, data) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          // Save current state to history before updating
          const currentBlob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: file.type });
          const history = state.fileHistory.get(fileId) || [];
          const newHistory = [...history, currentBlob].slice(-10); // Keep last 10 states
          const newFileHistory = new Map(state.fileHistory);
          newFileHistory.set(fileId, newHistory);

          // Clear redo history when new change is made
          const newFileRedoHistory = new Map(state.fileRedoHistory);
          newFileRedoHistory.delete(fileId);

          // Revoke old preview URL to prevent memory leaks
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }

          // Create new preview URL from updated data
          const blob = data instanceof Blob ? data : new Blob([data], { type: file.type });
          const newPreviewUrl = URL.createObjectURL(blob);

          const updatedFile = {
            ...file,
            data,
            originalFile: blob, // Update originalFile as well so download uses cropped version
            previewUrl: newPreviewUrl,
            state: FileState.READY,
          };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return { 
            files: newFiles,
            fileHistory: newFileHistory,
            fileRedoHistory: newFileRedoHistory,
          };
        });
      },

      // Operation actions
      addOperation: (fileId, type, parameters) => {
        const operationId = uuidv4();
        const operation: Operation = {
          id: operationId,
          type,
          parameters,
          timestamp: new Date(),
          status: OperationStatus.PENDING,
        };

        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const updatedFile = {
            ...file,
            operations: [...file.operations, operationId],
          };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          const newOperations = new Map(state.operations);
          newOperations.set(operationId, operation);

          return { files: newFiles, operations: newOperations };
        });

        return operationId;
      },

      removeOperation: (operationId) => {
        set((state) => {
          // Find file containing this operation
          let fileId: string | null = null;
          for (const [fId, file] of state.files.entries()) {
            if (file.operations.includes(operationId)) {
              fileId = fId;
              break;
            }
          }

          if (!fileId) {
            return state;
          }

          const file = state.files.get(fileId)!;
          const updatedFile = {
            ...file,
            operations: file.operations.filter((id) => id !== operationId),
          };

          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          const newOperations = new Map(state.operations);
          newOperations.delete(operationId);

          return { files: newFiles, operations: newOperations };
        });
      },

      clearOperations: (fileId) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const newOperations = new Map(state.operations);
          file.operations.forEach((opId) => newOperations.delete(opId));

          const updatedFile = { ...file, operations: [] };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return { files: newFiles, operations: newOperations };
        });
      },

      reorderOperations: (fileId, operationIds) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const updatedFile = { ...file, operations: operationIds };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return { files: newFiles };
        });
      },

      // Processing actions (stub implementations - will be implemented in Phase 2)
      processFile: async (fileId) => {
        set({ isProcessing: true, processingProgress: 0 });
        get().updateFileState(fileId, FileState.PROCESSING);

        // TODO: Implement actual processing logic in Phase 2
        await new Promise((resolve) => setTimeout(resolve, 1000));

        get().updateFileState(fileId, FileState.READY);
        set({ isProcessing: false, processingProgress: 100 });
      },

      processBatch: async () => {
        const selectedFiles = get().getSelectedFiles();
        set({ isProcessing: true, processingProgress: 0 });

        for (let i = 0; i < selectedFiles.length; i++) {
          await get().processFile(selectedFiles[i]!.id);
          const progress = ((i + 1) / selectedFiles.length) * 100;
          set({ processingProgress: progress });
        }

        set({ isProcessing: false });
      },

      cancelProcessing: () => {
        set({ isProcessing: false, processingProgress: 0 });
      },

      undoOperation: (fileId) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const history = state.fileHistory.get(fileId);
          if (!history || history.length === 0) {
            return state;
          }

          // Get previous state from history
          const previousBlob = history[history.length - 1];
          const newHistory = history.slice(0, -1);

          // Save current state to redo history
          const currentBlob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: file.type });
          const redoHistory = state.fileRedoHistory.get(fileId) || [];
          const newRedoHistory = [...redoHistory, currentBlob].slice(-10);

          // Update file with previous state
          const newFileHistory = new Map(state.fileHistory);
          newFileHistory.set(fileId, newHistory);

          const newFileRedoHistory = new Map(state.fileRedoHistory);
          newFileRedoHistory.set(fileId, newRedoHistory);

          // Revoke old preview URL
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }

          // Create new preview URL from previous state
          const newPreviewUrl = previousBlob ? URL.createObjectURL(previousBlob) : file.previewUrl;

          const updatedFile = {
            ...file,
            data: previousBlob || file.data,
            originalFile: previousBlob || file.originalFile,
            previewUrl: newPreviewUrl,
            state: FileState.READY,
          };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return {
            files: newFiles,
            fileHistory: newFileHistory,
            fileRedoHistory: newFileRedoHistory,
          };
        });
      },

      redoOperation: (fileId) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const redoHistory = state.fileRedoHistory.get(fileId);
          if (!redoHistory || redoHistory.length === 0) {
            return state;
          }

          // Get next state from redo history
          const nextBlob = redoHistory[redoHistory.length - 1];
          const newRedoHistory = redoHistory.slice(0, -1);

          // Save current state back to undo history
          const currentBlob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: file.type });
          const history = state.fileHistory.get(fileId) || [];
          const newHistory = [...history, currentBlob].slice(-10);

          // Update file with next state
          const newFileHistory = new Map(state.fileHistory);
          newFileHistory.set(fileId, newHistory);

          const newFileRedoHistory = new Map(state.fileRedoHistory);
          newFileRedoHistory.set(fileId, newRedoHistory);

          // Revoke old preview URL
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }

          // Create new preview URL from next state
          const newPreviewUrl = nextBlob ? URL.createObjectURL(nextBlob) : file.previewUrl;

          const updatedFile = {
            ...file,
            data: nextBlob || file.data,
            originalFile: nextBlob || file.originalFile,
            previewUrl: newPreviewUrl,
            state: FileState.READY,
          };
          const newFiles = new Map(state.files);
          newFiles.set(fileId, updatedFile);

          return {
            files: newFiles,
            fileHistory: newFileHistory,
            fileRedoHistory: newFileRedoHistory,
          };
        });
      },

      resetFile: (fileId) => {
        set((state) => {
          const file = state.files.get(fileId);
          if (!file) {
            return state;
          }

          const resetFile = {
            ...file,
            data: file.originalFile,
            state: FileState.UPLOADED,
            processingProgress: 0,
            errorMessage: undefined,
          };

          const newFiles = new Map(state.files);
          newFiles.set(fileId, resetFile);

          // Clear operations for this file
          const newOperations = new Map(state.operations);
          file.operations.forEach((opId) => newOperations.delete(opId));
          resetFile.operations = [];

          return { files: newFiles, operations: newOperations };
        });
      },

      // UI actions
      setPreviewMode: (mode) => {
        set({ previewMode: mode });
      },

      setZoomLevel: (level) => {
        const clampedLevel = Math.max(10, Math.min(200, level));
        set({ zoomLevel: clampedLevel });
      },

      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      setError: (error) => {
        set({ lastError: error });
      },

      // OCR actions
      setOCRResult: (result, confidence, processingTime) => {
        set({
          ocrResult: result,
          ocrConfidence: confidence,
          ocrProcessingTime: processingTime,
          ocrIsProcessing: false,
          ocrProgress: 100,
        });
      },

      setOCRProgress: (progress) => {
        set({ ocrProgress: progress });
      },

      setOCRProcessing: (isProcessing) => {
        set({ ocrIsProcessing: isProcessing });
        if (isProcessing) {
          set({ ocrProgress: 0 });
        }
      },

      clearOCRResult: () => {
        set({
          ocrResult: null,
          ocrConfidence: 0,
          ocrProcessingTime: 0,
          ocrProgress: 0,
          ocrIsProcessing: false,
        });
      },

      // Getters
      getFile: (fileId) => {
        return get().files.get(fileId);
      },

      getActiveFile: () => {
        const { activeFileId, files } = get();
        return activeFileId ? files.get(activeFileId) : undefined;
      },

      getSelectedFiles: () => {
        const { selectedFileIds, files } = get();
        return selectedFileIds
          .map((id) => files.get(id))
          .filter((file): file is File => file !== undefined);
      },

      getFileOperations: (fileId) => {
        const { files, operations } = get();
        const file = files.get(fileId);
        if (!file) {
          return [];
        }

        return file.operations
          .map((opId) => operations.get(opId))
          .filter((op): op is Operation => op !== undefined);
      },

      getTotalFileSize: () => {
        const { files } = get();
        return Array.from(files.values()).reduce(
          (total, file) => total + file.size,
          0
        );
      },

      getProcessingFiles: () => {
        const { files } = get();
        return Array.from(files.values()).filter(
          (file) => file.state === FileState.PROCESSING
        );
      },
    }),
    {
      name: 'editor-store',
    }
  )
);
