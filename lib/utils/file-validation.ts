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
  ConversionOptions,
  Operation,
  OperationType,
  OperationStatus,
  isImageFormat,
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

/**
 * Validate conversion options
 */
export function validateConversionOptions(
  options: ConversionOptions,
  sourceFormat: FileFormat
): ValidationResult {
  // Validate output format
  if (!isSupportedFormat(options.outputFormat)) {
    return {
      valid: false,
      error: `Unsupported output format: ${options.outputFormat}`,
      details: { outputFormat: options.outputFormat },
    };
  }

  // Validate quality (0-100)
  if (options.quality !== undefined && (options.quality < 0 || options.quality > 100)) {
    return {
      valid: false,
      error: 'Quality must be between 0 and 100',
      details: { quality: options.quality },
    };
  }

  // Validate dimensions
  if (options.width !== undefined || options.height !== undefined) {
    const width = options.width ?? FILE_VALIDATION_RULES.MAX_DIMENSION;
    const height = options.height ?? FILE_VALIDATION_RULES.MAX_DIMENSION;

    const dimensionValidation = validateDimensions(width, height);
    if (!dimensionValidation.valid) {
      return dimensionValidation;
    }
  }

  // Validate compression level (0-100)
  if (
    options.compressionLevel !== undefined &&
    (options.compressionLevel < 0 || options.compressionLevel > 100)
  ) {
    return {
      valid: false,
      error: 'Compression level must be between 0 and 100',
      details: { compressionLevel: options.compressionLevel },
    };
  }

  // Validate that both clientSide and serverSide aren't true
  if (options.clientSide && options.serverSide) {
    return {
      valid: false,
      error: 'Cannot specify both clientSide and serverSide as true',
      details: { clientSide: options.clientSide, serverSide: options.serverSide },
    };
  }

  // Validate image-specific options are only used for image formats
  const imageOnlyOptions = [
    'removeMetadata',
    'removeLocation',
    'stripExif',
  ] as const;
  const hasImageOptions = imageOnlyOptions.some((opt) => options[opt] !== undefined);

  if (hasImageOptions && !isImageFormat(sourceFormat)) {
    return {
      valid: false,
      error: 'Image-specific options can only be used with image formats',
      details: { sourceFormat },
    };
  }

  return { valid: true };
}

/**
 * Validate operation
 */
export function validateOperation(operation: Operation): ValidationResult {
  // Validate operation type
  if (!Object.values(OperationType).includes(operation.type)) {
    return {
      valid: false,
      error: `Invalid operation type: ${operation.type}`,
      details: { type: operation.type },
    };
  }

  // Validate status
  if (!Object.values(OperationStatus).includes(operation.status)) {
    return {
      valid: false,
      error: `Invalid operation status: ${operation.status}`,
      details: { status: operation.status },
    };
  }

  // Validate timestamps
  if (operation.completedAt && operation.completedAt < operation.startedAt) {
    return {
      valid: false,
      error: 'Completion time cannot be before start time',
      details: { startedAt: operation.startedAt, completedAt: operation.completedAt },
    };
  }

  // Validate progress (0-100)
  if (operation.progress !== undefined && (operation.progress < 0 || operation.progress > 100)) {
    return {
      valid: false,
      error: 'Progress must be between 0 and 100',
      details: { progress: operation.progress },
    };
  }

  return { valid: true };
}

/**
 * Security check: Validate file header matches MIME type
 * (Basic check to detect file type spoofing)
 */
export async function validateFileHeader(
  blob: Blob,
  declaredMimeType: string
): Promise<ValidationResult> {
  try {
    const buffer = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // File signature checks (magic numbers)
    const signatures: Record<string, number[][]> = {
      'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
      'image/jpeg': [
        [0xff, 0xd8, 0xff, 0xe0],
        [0xff, 0xd8, 0xff, 0xe1],
        [0xff, 0xd8, 0xff, 0xe2],
      ],
      'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
      ],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (also check WEBP at offset 8)
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
      'application/zip': [
        [0x50, 0x4b, 0x03, 0x04], // ZIP (also DOCX, XLSX, PPTX)
        [0x50, 0x4b, 0x05, 0x06],
        [0x50, 0x4b, 0x07, 0x08],
      ],
    };

    // Normalize MIME type for comparison
    const normalizedMimeType = declaredMimeType.toLowerCase();

    // Check if we have signatures for this MIME type
    const expectedSignatures = signatures[normalizedMimeType];
    if (!expectedSignatures) {
      // No signature check available, allow it
      return { valid: true };
    }

    // Check if file header matches any of the expected signatures
    const matches = expectedSignatures.some((signature) =>
      signature.every((byte, index) => bytes[index] === byte)
    );

    if (!matches) {
      return {
        valid: false,
        error: `File header does not match declared MIME type: ${declaredMimeType}`,
        details: {
          declaredMimeType,
          actualHeader: Array.from(bytes.slice(0, 8))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(' '),
        },
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read file header: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Security check: Detect potential malicious patterns in filenames
 */
export function validateSecureFilename(filename: string): ValidationResult {
  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      valid: false,
      error: 'Filename contains path traversal characters',
      details: { filename },
    };
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return {
      valid: false,
      error: 'Filename contains null bytes',
      details: { filename },
    };
  }

  // Check for executable extensions (additional security)
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.dll',
    '.scr',
    '.vbs',
    '.js',
    '.msi',
  ];
  const extension = filename.toLowerCase().split('.').pop();
  if (extension && dangerousExtensions.includes(`.${extension}`)) {
    return {
      valid: false,
      error: 'Executable file types are not allowed',
      details: { filename, extension },
    };
  }

  return { valid: true };
}
