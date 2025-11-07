/**
 * File Type Definitions
 *
 * Represents user-uploaded files with their current state, operations applied,
 * and preview data. All file processing is in-memory only (no database persistence).
 *
 * Per constitution: Privacy-first, client-side processing where possible.
 */

/**
 * Supported file formats for conversion and editing
 */
export enum FileFormat {
  // Images
  PNG = 'PNG',
  JPG = 'JPG',
  WEBP = 'WEBP',
  GIF = 'GIF',
  BMP = 'BMP',
  TIFF = 'TIFF',
  SVG = 'SVG',
  HEIC = 'HEIC',

  // Documents
  PDF = 'PDF',
  DOCX = 'DOCX',
  TXT = 'TXT',
  RTF = 'RTF',
  XLSX = 'XLSX',
  PPTX = 'PPTX',
}

/**
 * File processing state
 */
export enum FileState {
  UPLOADED = 'UPLOADED', // Just uploaded, no operations
  PROCESSING = 'PROCESSING', // Operation in progress
  READY = 'READY', // Operation complete, ready for download
  ERROR = 'ERROR', // Operation failed
}

/**
 * Image dimensions
 */
export interface FileDimensions {
  width: number;
  height: number;
}

/**
 * Main File entity representing an uploaded file
 */
export interface File {
  id: string; // UUID v4
  name: string; // Original filename
  size: number; // File size in bytes
  type: string; // MIME type (image/png, application/pdf, etc.)
  format: FileFormat; // Enum: PNG, JPG, PDF, DOCX, etc.
  data: Blob | ArrayBuffer; // File content (in-memory only)
  dimensions?: FileDimensions; // For images only
  metadata?: Record<string, unknown>; // EXIF data for images
  uploadedAt: Date;
  state: FileState; // UPLOADED, PROCESSING, READY, ERROR
  operations: string[]; // Array of operation IDs (references to Operation entities)
  previewUrl?: string; // Blob URL for preview
  originalFile: Blob; // Pristine original for undo
  processingProgress?: number; // 0-100 for progress tracking
  errorMessage?: string; // Error details if state is ERROR
}

/**
 * Validation rules for File entity
 */
export const FILE_VALIDATION_RULES = {
  // File size limits (per constitution)
  MAX_FILE_SIZE_FREE: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE_PREMIUM: 500 * 1024 * 1024, // 500MB
  MAX_BATCH_FILES_FREE: 5,
  MAX_BATCH_FILES_PREMIUM: 25,
  MAX_TOTAL_BATCH_SIZE_FREE: 150 * 1024 * 1024, // 150MB
  MAX_TOTAL_BATCH_SIZE_PREMIUM: 5 * 1024 * 1024 * 1024, // 5GB

  // Filename
  MAX_FILENAME_LENGTH: 255,

  // Operations
  MAX_OPERATIONS_PER_FILE: 50, // Prevent memory overflow

  // Dimensions
  MIN_DIMENSION: 1,
  MAX_DIMENSION: 10000,
} as const;

/**
 * MIME type mapping for FileFormat
 */
export const MIME_TYPE_MAP: Record<FileFormat, string[]> = {
  [FileFormat.PNG]: ['image/png'],
  [FileFormat.JPG]: ['image/jpeg', 'image/jpg'],
  [FileFormat.WEBP]: ['image/webp'],
  [FileFormat.GIF]: ['image/gif'],
  [FileFormat.BMP]: ['image/bmp', 'image/x-windows-bmp'],
  [FileFormat.TIFF]: ['image/tiff', 'image/x-tiff'],
  [FileFormat.SVG]: ['image/svg+xml'],
  [FileFormat.HEIC]: ['image/heic', 'image/heif'],
  [FileFormat.PDF]: ['application/pdf'],
  [FileFormat.DOCX]: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  [FileFormat.TXT]: ['text/plain'],
  [FileFormat.RTF]: ['application/rtf', 'text/rtf'],
  [FileFormat.XLSX]: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  [FileFormat.PPTX]: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

/**
 * File format categories for easier filtering
 */
export enum FileCategory {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  SPREADSHEET = 'SPREADSHEET',
  PRESENTATION = 'PRESENTATION',
}

/**
 * Category mapping for formats
 */
export const FORMAT_CATEGORY_MAP: Record<FileFormat, FileCategory> = {
  [FileFormat.PNG]: FileCategory.IMAGE,
  [FileFormat.JPG]: FileCategory.IMAGE,
  [FileFormat.WEBP]: FileCategory.IMAGE,
  [FileFormat.GIF]: FileCategory.IMAGE,
  [FileFormat.BMP]: FileCategory.IMAGE,
  [FileFormat.TIFF]: FileCategory.IMAGE,
  [FileFormat.SVG]: FileCategory.IMAGE,
  [FileFormat.HEIC]: FileCategory.IMAGE,
  [FileFormat.PDF]: FileCategory.DOCUMENT,
  [FileFormat.DOCX]: FileCategory.DOCUMENT,
  [FileFormat.TXT]: FileCategory.DOCUMENT,
  [FileFormat.RTF]: FileCategory.DOCUMENT,
  [FileFormat.XLSX]: FileCategory.SPREADSHEET,
  [FileFormat.PPTX]: FileCategory.PRESENTATION,
};

/**
 * Helper type for file creation (omit auto-generated fields)
 */
export type CreateFileInput = Omit<
  File,
  'id' | 'uploadedAt' | 'state' | 'operations' | 'originalFile'
> & {
  id?: string;
  uploadedAt?: Date;
  state?: FileState;
  operations?: string[];
};

/**
 * Helper type for file updates
 */
export type UpdateFileInput = Partial<Omit<File, 'id' | 'originalFile'>>;

/**
 * File state transition map (for validation)
 */
export const VALID_STATE_TRANSITIONS: Record<FileState, FileState[]> = {
  [FileState.UPLOADED]: [FileState.PROCESSING, FileState.ERROR],
  [FileState.PROCESSING]: [FileState.READY, FileState.ERROR],
  [FileState.READY]: [FileState.PROCESSING], // Can apply new operations
  [FileState.ERROR]: [FileState.UPLOADED], // Retry/reset
};

/**
 * Type guard to check if a format is an image format
 */
export function isImageFormat(format: FileFormat): boolean {
  return FORMAT_CATEGORY_MAP[format] === FileCategory.IMAGE;
}

/**
 * Type guard to check if a format is a document format
 */
export function isDocumentFormat(format: FileFormat): boolean {
  return FORMAT_CATEGORY_MAP[format] === FileCategory.DOCUMENT;
}

/**
 * Get FileFormat from MIME type
 */
export function getFormatFromMimeType(mimeType: string): FileFormat | null {
  for (const [format, mimes] of Object.entries(MIME_TYPE_MAP)) {
    if (mimes.includes(mimeType)) {
      return format as FileFormat;
    }
  }
  return null;
}

/**
 * Get MIME type from FileFormat (returns first match)
 */
export function getMimeTypeFromFormat(format: FileFormat): string {
  return MIME_TYPE_MAP[format]?.[0] ?? 'application/octet-stream';
}

/**
 * Validate file size against tier limits
 */
export function isValidFileSize(
  size: number,
  isPremium: boolean = false
): boolean {
  const limit = isPremium
    ? FILE_VALIDATION_RULES.MAX_FILE_SIZE_PREMIUM
    : FILE_VALIDATION_RULES.MAX_FILE_SIZE_FREE;
  return size > 0 && size <= limit;
}

/**
 * Validate state transition
 */
export function isValidStateTransition(
  from: FileState,
  to: FileState
): boolean {
  return VALID_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}
