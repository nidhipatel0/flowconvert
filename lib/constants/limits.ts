/**
 * Application Limits and Constants
 *
 * Centralized definition of all size limits, quotas, and constraints
 * per FlowConvert constitution.
 *
 * Per constitution Phase V (Quality Assurance):
 * - Free tier: 50MB/file, 5 batch, 150MB total
 * - Premium tier: 500MB/file, 25 batch, 5GB total
 */

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  // Free tier limits
  FREE: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_BATCH_FILES: 5,
    MAX_TOTAL_BATCH_SIZE: 150 * 1024 * 1024, // 150MB
  },

  // Premium tier limits
  PREMIUM: {
    MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
    MAX_BATCH_FILES: 25,
    MAX_TOTAL_BATCH_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
  },
} as const;

/**
 * Filename constraints
 */
export const FILENAME_LIMITS = {
  MAX_LENGTH: 255, // Standard filesystem limit
  MIN_LENGTH: 1,
} as const;

/**
 * Image dimension limits (in pixels)
 */
export const DIMENSION_LIMITS = {
  MIN_WIDTH: 1,
  MIN_HEIGHT: 1,
  MAX_WIDTH: 10000,
  MAX_HEIGHT: 10000,
  MAX_PIXELS: 100_000_000, // 100 megapixels (e.g., 10000x10000)
} as const;

/**
 * Quality and compression defaults
 */
export const QUALITY_DEFAULTS = {
  // Image quality (0-100)
  LOSSY_DEFAULT: 90, // JPG, WebP
  LOSSLESS_DEFAULT: 100, // PNG, BMP
  WEB_OPTIMIZED: 85, // For web use case
  PRINT_QUALITY: 95, // For print use case

  // Compression levels (0-100)
  COMPRESSION_LOW: 25,
  COMPRESSION_MEDIUM: 50,
  COMPRESSION_HIGH: 75,
  COMPRESSION_MAX: 100,

  // DPI (dots per inch)
  SCREEN_DPI: 72, // Standard screen resolution
  PRINT_DPI: 300, // Standard print resolution
  HIGH_QUALITY_PRINT_DPI: 600, // High-quality print
} as const;

/**
 * Preview and thumbnail limits
 */
export const PREVIEW_LIMITS = {
  MAX_THUMBNAIL_SIZE: 400, // Max dimension for thumbnails (px)
  MAX_PREVIEW_SIZE: 1200, // Max dimension for previews (px)
  THUMBNAIL_QUALITY: 80, // Quality for thumbnail generation
  PREVIEW_QUALITY: 85, // Quality for preview generation
} as const;

/**
 * Processing limits
 */
export const PROCESSING_LIMITS = {
  MAX_OPERATIONS_PER_FILE: 50, // Prevent memory overflow
  MAX_CONCURRENT_OPERATIONS: 3, // Max parallel operations
  OPERATION_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for streaming
} as const;

/**
 * API rate limits (per user session)
 */
export const API_RATE_LIMITS = {
  FREE: {
    CONVERSIONS_PER_HOUR: 20,
    CONVERSIONS_PER_DAY: 100,
  },
  PREMIUM: {
    CONVERSIONS_PER_HOUR: 200,
    CONVERSIONS_PER_DAY: 1000,
  },
} as const;

/**
 * Temporary file storage limits
 */
export const STORAGE_LIMITS = {
  // Time-to-live for temporary files (per constitution: 5 minutes)
  TTL_MILLISECONDS: 5 * 60 * 1000, // 5 minutes
  TTL_SECONDS: 5 * 60, // 5 minutes

  // Maximum in-memory cache size
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_CACHED_FILES: 50,
} as const;

/**
 * PDF-specific limits
 */
export const PDF_LIMITS = {
  MAX_PAGES: 500, // Maximum pages to process
  MAX_MERGE_FILES: 10, // Maximum PDFs to merge
  MAX_PAGE_DIMENSION: 14400, // 200 inches at 72 DPI
} as const;

/**
 * Video/Audio limits (for future use)
 */
export const MEDIA_LIMITS = {
  MAX_VIDEO_DURATION: 10 * 60, // 10 minutes
  MAX_AUDIO_DURATION: 30 * 60, // 30 minutes
  MAX_VIDEO_RESOLUTION: 1920 * 1080, // Full HD
} as const;

/**
 * Helper function to get limits for a tier
 */
export function getLimitsForTier(tier: 'free' | 'premium') {
  return {
    fileSize: FILE_SIZE_LIMITS[tier.toUpperCase() as 'FREE' | 'PREMIUM'],
    apiRate: API_RATE_LIMITS[tier.toUpperCase() as 'FREE' | 'PREMIUM'],
  };
}

/**
 * Helper function to format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Helper function to check if file size is within tier limits
 */
export function isFileSizeAllowed(
  size: number,
  tier: 'free' | 'premium' = 'free'
): boolean {
  const limit = FILE_SIZE_LIMITS[tier.toUpperCase() as 'FREE' | 'PREMIUM'].MAX_FILE_SIZE;
  return size > 0 && size <= limit;
}

/**
 * Helper function to check if batch is within tier limits
 */
export function isBatchAllowed(
  fileCount: number,
  totalSize: number,
  tier: 'free' | 'premium' = 'free'
): { allowed: boolean; reason?: string } {
  const limits = FILE_SIZE_LIMITS[tier.toUpperCase() as 'FREE' | 'PREMIUM'];

  if (fileCount === 0) {
    return { allowed: false, reason: 'Batch must contain at least one file' };
  }

  if (fileCount > limits.MAX_BATCH_FILES) {
    return {
      allowed: false,
      reason: `Batch exceeds ${tier} tier limit of ${limits.MAX_BATCH_FILES} files`,
    };
  }

  if (totalSize > limits.MAX_TOTAL_BATCH_SIZE) {
    return {
      allowed: false,
      reason: `Total size ${formatBytes(totalSize)} exceeds ${tier} tier limit of ${formatBytes(limits.MAX_TOTAL_BATCH_SIZE)}`,
    };
  }

  return { allowed: true };
}

/**
 * Helper function to calculate estimated processing time
 */
export function estimateProcessingTime(
  fileSize: number,
  operation: 'convert' | 'compress' | 'resize' | 'other'
): number {
  // Rough estimates in milliseconds based on file size
  const baseTime = 100; // 100ms base overhead
  const sizeInMB = fileSize / (1024 * 1024);

  switch (operation) {
    case 'convert':
      return baseTime + sizeInMB * 500; // ~500ms per MB
    case 'compress':
      return baseTime + sizeInMB * 300; // ~300ms per MB
    case 'resize':
      return baseTime + sizeInMB * 200; // ~200ms per MB
    case 'other':
    default:
      return baseTime + sizeInMB * 400; // ~400ms per MB
  }
}
