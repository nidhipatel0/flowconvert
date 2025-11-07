/**
 * File Validation Utilities
 *
 * Validates uploaded files against size limits, format restrictions,
 * and other constraints per FlowConvert constitution.
 *
 * Per constitution:
 * - Free tier: 50MB/file, 5 files batch, 150MB total
 * - Premium tier: 500MB/file, 25 files batch, 5GB total
 */

import {
  FileFormat,
  FILE_VALIDATION_RULES,
  getFormatFromMimeType,
  MIME_TYPE_MAP,
} from '@/lib/types/file';

/**
 * Validation result with error details
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * User tier for determining limits
 */
export type UserTier = 'free' | 'premium';

/**
 * Validate single file size
 */
export function validateFileSize(
  size: number,
  tier: UserTier = 'free'
): ValidationResult {
  const limit =
    tier === 'premium'
      ? FILE_VALIDATION_RULES.MAX_FILE_SIZE_PREMIUM
      : FILE_VALIDATION_RULES.MAX_FILE_SIZE_FREE;

  if (size <= 0) {
    return {
      valid: false,
      error: 'File cannot be empty (0 bytes)',
      details: { size, limit },
    };
  }

  if (size > limit) {
    const limitMB = Math.round(limit / (1024 * 1024));
    const sizeMB = Math.round(size / (1024 * 1024));
    return {
      valid: false,
      error: `File size (${sizeMB} MB) exceeds ${tier} tier limit of ${limitMB} MB`,
      details: { size, limit, sizeMB, limitMB, tier },
    };
  }

  return { valid: true };
}

/**
 * Validate file format
 */
export function validateFileFormat(mimeType: string): ValidationResult {
  // Normalize MIME type to lowercase for case-insensitive comparison
  const normalizedMimeType = mimeType.toLowerCase();
  const format = getFormatFromMimeType(normalizedMimeType);

  if (!format) {
    const supportedFormats = Object.keys(FileFormat).join(', ');
    return {
      valid: false,
      error: `Unsupported file format: ${mimeType}`,
      details: { mimeType, supportedFormats },
    };
  }

  return { valid: true, details: { format } };
}

/**
 * Validate filename
 */
export function validateFilename(filename: string): ValidationResult {
  if (!filename || filename.trim().length === 0) {
    return {
      valid: false,
      error: 'Filename cannot be empty',
    };
  }

  if (filename.length > FILE_VALIDATION_RULES.MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: `Filename exceeds maximum length of ${FILE_VALIDATION_RULES.MAX_FILENAME_LENGTH} characters`,
      details: {
        length: filename.length,
        maxLength: FILE_VALIDATION_RULES.MAX_FILENAME_LENGTH,
      },
    };
  }

  // Check for invalid characters (basic sanitization)
  const invalidChars = /[<>:"|?*\x00-\x1F]/g;
  if (invalidChars.test(filename)) {
    return {
      valid: false,
      error: 'Filename contains invalid characters',
      details: { invalidChars: filename.match(invalidChars) },
    };
  }

  return { valid: true };
}

/**
 * Validate batch upload
 */
export function validateBatch(
  files: { size: number }[],
  tier: UserTier = 'free'
): ValidationResult {
  const maxFiles =
    tier === 'premium'
      ? FILE_VALIDATION_RULES.MAX_BATCH_FILES_PREMIUM
      : FILE_VALIDATION_RULES.MAX_BATCH_FILES_FREE;

  const maxTotalSize =
    tier === 'premium'
      ? FILE_VALIDATION_RULES.MAX_TOTAL_BATCH_SIZE_PREMIUM
      : FILE_VALIDATION_RULES.MAX_TOTAL_BATCH_SIZE_FREE;

  // Check for empty batch
  if (files.length === 0) {
    return {
      valid: false,
      error: 'Batch must contain at least one file',
      details: { fileCount: 0 },
    };
  }

  // Check file count
  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Batch upload exceeds ${tier} tier limit of ${maxFiles} files`,
      details: { fileCount: files.length, maxFiles, tier },
    };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    const totalMB = Math.round(totalSize / (1024 * 1024));
    const limitMB = Math.round(maxTotalSize / (1024 * 1024));
    return {
      valid: false,
      error: `Total batch size (${totalMB}MB) exceeds ${tier} tier limit of ${limitMB}MB`,
      details: { totalSize, maxTotalSize, totalMB, limitMB, tier },
    };
  }

  return { valid: true, details: { fileCount: files.length, totalSize } };
}

/**
 * Validate image dimensions
 */
export function validateDimensions(
  width: number,
  height: number
): ValidationResult {
  const { MIN_DIMENSION, MAX_DIMENSION } = FILE_VALIDATION_RULES;

  if (width < MIN_DIMENSION) {
    return {
      valid: false,
      error: `Width must be between ${MIN_DIMENSION} and ${MAX_DIMENSION} pixels`,
      details: { width, height, minDimension: MIN_DIMENSION, maxDimension: MAX_DIMENSION },
    };
  }

  if (height < MIN_DIMENSION) {
    return {
      valid: false,
      error: `Height must be between ${MIN_DIMENSION} and ${MAX_DIMENSION} pixels`,
      details: { width, height, minDimension: MIN_DIMENSION, maxDimension: MAX_DIMENSION },
    };
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      valid: false,
      error: `Dimensions cannot exceed ${MAX_DIMENSION}x${MAX_DIMENSION} pixels`,
      details: { width, height, maxDimension: MAX_DIMENSION },
    };
  }

  return { valid: true, details: { width, height } };
}

/**
 * Comprehensive file validation (combines all checks)
 */
export function validateFile(
  file: {
    name: string;
    size: number;
    type: string;
  },
  tier: UserTier = 'free'
): ValidationResult {
  // Validate filename
  const filenameValidation = validateFilename(file.name);
  if (!filenameValidation.valid) {
    return filenameValidation;
  }

  // Validate format
  const formatValidation = validateFileFormat(file.type);
  if (!formatValidation.valid) {
    return formatValidation;
  }

  // Validate size
  const sizeValidation = validateFileSize(file.size, tier);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return {
    valid: true,
    details: {
      filename: file.name,
      size: file.size,
      format: formatValidation.details?.format,
    },
  };
}

/**
 * Get supported MIME types as array
 */
export function getSupportedMimeTypes(): string[] {
  return Object.values(MIME_TYPE_MAP).flat();
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(FileFormat).map((format) => `.${format.toLowerCase()}`);
}

/**
 * Check if file extension is supported
 */
export function isSupportedExtension(filename: string): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) {
    return false;
  }
  return getSupportedExtensions().some(
    (ext) => ext === `.${extension}`
  );
}

/**
 * Check if a FileFormat is supported
 */
export function isSupportedFormat(format: FileFormat): boolean {
  return Object.values(FileFormat).includes(format);
}
