'use client';

import { useCallback, useState } from 'react';
import { useEditorStore } from '@/lib/stores';
import { validateFile } from '@/lib/utils/file-validation';
import { detectFormatFromBlob } from '@/lib/utils/format-detection';

interface FileValidationResult {
  file: File;
  isValid: boolean;
  error?: string;
}

const SUPPORTED_FORMATS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  documents: ['.pdf', '.doc', '.docx', '.txt'],
  archives: ['.zip'],
};

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
];

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setPendingFiles] = useState<FileValidationResult[]>([]);
  const addFile = useEditorStore((state) => state.addFile);
  const setError = useEditorStore((state) => state.setError);

  const validateFileType = useCallback((file: File): FileValidationResult => {
    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allSupportedExtensions = [
      ...SUPPORTED_FORMATS.images,
      ...SUPPORTED_FORMATS.documents,
      ...SUPPORTED_FORMATS.archives,
    ];

    if (!allSupportedExtensions.includes(extension)) {
      return {
        file,
        isValid: false,
        error: `Unsupported file type "${extension}". Supported formats: ${allSupportedExtensions.join(', ')}`,
      };
    }

    // Check MIME type if available
    if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type)) {
      return {
        file,
        isValid: false,
        error: `Unsupported MIME type "${file.type}". Please use standard ${extension} files.`,
      };
    }

    // Check file size (50MB for free tier)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        file,
        isValid: false,
        error: `File "${file.name}" exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      };
    }

    // Additional validation
    const validation = validateFile(file, 'free');
    if (!validation.valid) {
      return {
        file,
        isValid: false,
        error: validation.error || 'File validation failed',
      };
    }

    return {
      file,
      isValid: true,
    };
  }, []);

  const handleFilesSelected = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);
      const validationResults = files.map(validateFileType);

      // Show errors for invalid files immediately
      const invalidFiles = validationResults.filter((r) => !r.isValid);
      if (invalidFiles.length > 0) {
        invalidFiles.forEach((result) => {
          setError(result.error || 'Invalid file');
        });
      }

      // Only set pending files if there are valid ones
      const validFiles = validationResults.filter((r) => r.isValid);
      if (validFiles.length > 0) {
        setPendingFiles(validFiles);
        // Auto-process valid files
        processValidFiles(validFiles);
      }
    },
    [validateFileType, setError]
  );

  const processValidFiles = useCallback(
    async (validationResults: FileValidationResult[]) => {
      setIsProcessing(true);

      for (const result of validationResults) {
        try {
          // Detect format
          const format = await detectFormatFromBlob(result.file);
          if (!format) {
            setError(`Unable to detect format for ${result.file.name}`);
            continue;
          }

          // Read file data
          const arrayBuffer = await result.file.arrayBuffer();

          // Add to store
          addFile({
            name: result.file.name,
            size: result.file.size,
            type: result.file.type,
            format,
            data: arrayBuffer,
            originalFile: result.file,
          });
        } catch (error) {
          console.error('Error processing file:', error);
          setError(`Error processing ${result.file.name}`);
        }
      }

      setIsProcessing(false);
      setPendingFiles([]);
    },
    [addFile, setError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const { files } = e.dataTransfer;
      if (files.length > 0) {
        handleFilesSelected(files);
      }
    },
    [handleFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        handleFilesSelected(files);
      }
    },
    [handleFilesSelected]
  );

  return (
    <label
      htmlFor="file-upload"
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'disabled' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      title="Click anywhere to upload files or drag and drop them here"
    >
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        className="sr-only"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileInput}
        disabled={isProcessing}
      />

      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
        <svg
          className="h-10 w-10 text-indigo-600"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mb-4">
        <span className="text-2xl font-bold text-gray-900">
          {isProcessing ? 'Processing...' : 'Drop files here'}
        </span>
        <p className="mt-2 text-base text-gray-600">
          {isDragging ? 'Release to upload' : 'or click to browse'}
        </p>
      </div>

      <p className="text-sm text-gray-500 font-medium mb-4">
        Images, PDFs, Documents • Max 50MB per file
      </p>

      {/* Privacy Badge */}
      <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
        <svg
          className="h-4 w-4 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span className="text-xs font-semibold text-green-700">
          100% Client-Side Processing
        </span>
      </div>
    </label>
  );
}
