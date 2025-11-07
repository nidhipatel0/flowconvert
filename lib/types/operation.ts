/**
 * Operation Type Definitions
 *
 * Represents single edit actions applied to files (resize, crop, compress, convert, etc.)
 * with their parameters, status, and execution metrics.
 *
 * Per constitution: TDD mandatory - tests written before implementation.
 */

import { FileFormat } from './file';

/**
 * Supported operation types
 */
export enum OperationType {
  // Image operations (client-side)
  RESIZE = 'RESIZE',
  CROP = 'CROP',
  ROTATE = 'ROTATE',
  FLIP = 'FLIP',
  COMPRESS = 'COMPRESS',
  CONVERT_FORMAT = 'CONVERT_FORMAT',
  REMOVE_METADATA = 'REMOVE_METADATA',

  // PDF operations (client-side)
  MERGE_PDF = 'MERGE_PDF',
  SPLIT_PDF = 'SPLIT_PDF',
  EXTRACT_PAGES = 'EXTRACT_PAGES',
  REARRANGE_PAGES = 'REARRANGE_PAGES',
  ADD_PAGE_NUMBERS = 'ADD_PAGE_NUMBERS',

  // Document operations (server-side Phase 1, client-side Phase 2)
  REPLACE_FIELDS = 'REPLACE_FIELDS',

  // Government templates
  APPLY_TEMPLATE = 'APPLY_TEMPLATE',

  // Advanced features
  OCR = 'OCR',
  EDGE_DETECTION = 'EDGE_DETECTION',
  APPLY_FILTER = 'APPLY_FILTER',
}

/**
 * Operation execution status
 */
export enum OperationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Social media preset dimensions
 */
export type DimensionPreset =
  | 'instagram-story'
  | 'instagram-post'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'custom';

/**
 * Aspect ratio presets
 */
export type AspectRatio = '1:1' | '4:3' | '16:9' | '3:2' | '9:16' | 'freeform';

/**
 * Image resize parameters
 */
export interface ResizeParameters {
  width: number; // 1-10000 pixels
  height: number; // 1-10000 pixels
  maintainAspectRatio: boolean;
  preset?: DimensionPreset;
  percentage?: number; // For percentage-based resizing (25%, 50%, 75%, etc.)
}

/**
 * Image crop parameters
 */
export interface CropParameters {
  x: number; // Top-left x coordinate
  y: number; // Top-left y coordinate
  width: number;
  height: number;
  aspectRatio?: AspectRatio;
}

/**
 * Image rotation parameters
 */
export interface RotateParameters {
  degrees: 90 | 180 | 270; // Only 90-degree increments
}

/**
 * Image flip parameters
 */
export interface FlipParameters {
  direction: 'horizontal' | 'vertical';
}

/**
 * Image compression parameters
 */
export interface CompressParameters {
  quality: number; // 1-100
  targetSize?: number; // Target file size in bytes (smart compression)
}

/**
 * Format conversion parameters
 */
export interface ConvertParameters {
  targetFormat: FileFormat;
  quality?: number; // For lossy formats (1-100)
}

/**
 * Metadata removal parameters
 */
export interface RemoveMetadataParameters {
  removeAll: boolean;
  removeLocation: boolean; // GPS data (default: true)
  preserveTitle: boolean;
  preserveAuthor: boolean;
  preserveCopyright: boolean;
}

/**
 * PDF merge parameters
 */
export interface MergePDFParameters {
  fileIds: string[]; // Order matters, minimum 2 files
}

/**
 * PDF split parameters
 */
export interface SplitPDFParameters {
  splitMethod: 'every-page' | 'page-ranges' | 'page-numbers';
  ranges?: Array<{ start: number; end: number }>; // For page-ranges method
  pageNumbers?: number[]; // For page-numbers method
}

/**
 * PDF page extraction parameters
 */
export interface ExtractPagesParameters {
  pageNumbers: number[]; // 1-based page numbers
}

/**
 * PDF page rearrangement parameters
 */
export interface RearrangePagesParameters {
  pageOrder: number[]; // New order of pages (1-based)
  insertBlankPages?: Array<{ position: number }>; // Insert blank pages at positions
}

/**
 * PDF page numbering parameters
 */
export interface AddPageNumbersParameters {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  fontSize: number; // 8-24
  transparency: number; // 0-100 (0 = fully transparent, 100 = opaque)
  startNumber?: number; // Starting page number (default: 1)
}

/**
 * Document field replacement parameters
 */
export interface ReplaceFieldsParameters {
  replacements: Array<{
    fieldId: string; // DetectedField ID
    oldValue: string;
    newValue: string;
  }>;
}

/**
 * Government template parameters
 */
export interface ApplyTemplateParameters {
  templateId:
    | 'driving-license'
    | 'passport'
    | 'aadhar'
    | 'pan-card'
    | 'oci-application';
}

/**
 * OCR parameters
 */
export interface OCRParameters {
  language: string; // e.g., 'eng', 'hin', 'eng+hin'
  makeSearchable: boolean; // Add text layer to PDF
}

/**
 * Edge detection parameters
 */
export interface EdgeDetectionParameters {
  autoDetect: boolean; // Auto-detect or manual adjustment
  corners?: Array<{ x: number; y: number }>; // Manual corner positions (4 corners)
}

/**
 * Document filter parameters
 */
export interface ApplyFilterParameters {
  filter:
    | 'document-mode'
    | 'photo-mode'
    | 'black-white'
    | 'grayscale'
    | 'enhanced-text';
}

/**
 * Union type of all operation parameters
 */
export type OperationParameters =
  | ResizeParameters
  | CropParameters
  | RotateParameters
  | FlipParameters
  | CompressParameters
  | ConvertParameters
  | RemoveMetadataParameters
  | MergePDFParameters
  | SplitPDFParameters
  | ExtractPagesParameters
  | RearrangePagesParameters
  | AddPageNumbersParameters
  | ReplaceFieldsParameters
  | ApplyTemplateParameters
  | OCRParameters
  | EdgeDetectionParameters
  | ApplyFilterParameters;

/**
 * Main Operation entity
 */
export interface Operation {
  id: string; // UUID v4
  type: OperationType;
  parameters: OperationParameters;
  timestamp: Date;
  status: OperationStatus;
  duration?: number; // Processing time in milliseconds
  errorMessage?: string;
}

/**
 * Validation rules for Operation entity
 */
export const OPERATION_VALIDATION_RULES = {
  // Resize
  MIN_DIMENSION: 1,
  MAX_DIMENSION: 10000,
  VALID_PERCENTAGES: [25, 50, 75, 100, 125, 150, 200], // Preset percentages

  // Crop
  MIN_CROP_SIZE: 1,

  // Compress
  MIN_QUALITY: 1,
  MAX_QUALITY: 100,

  // PDF
  MIN_PAGE_NUMBER: 1,
  MIN_PDF_FILES_FOR_MERGE: 2,

  // Page numbers
  MIN_FONT_SIZE: 8,
  MAX_FONT_SIZE: 24,
  MIN_TRANSPARENCY: 0,
  MAX_TRANSPARENCY: 100,
} as const;

/**
 * Helper type for operation creation (omit auto-generated fields)
 */
export type CreateOperationInput = Omit<
  Operation,
  'id' | 'timestamp' | 'status'
> & {
  id?: string;
  timestamp?: Date;
  status?: OperationStatus;
};

/**
 * Operation state transitions (for validation)
 */
export const VALID_OPERATION_STATE_TRANSITIONS: Record<
  OperationStatus,
  OperationStatus[]
> = {
  [OperationStatus.PENDING]: [OperationStatus.IN_PROGRESS],
  [OperationStatus.IN_PROGRESS]: [
    OperationStatus.COMPLETED,
    OperationStatus.FAILED,
  ],
  [OperationStatus.COMPLETED]: [],
  [OperationStatus.FAILED]: [],
};

/**
 * Operation categories for UI grouping
 */
export enum OperationCategory {
  IMAGE_EDIT = 'IMAGE_EDIT',
  PDF_TOOLS = 'PDF_TOOLS',
  DOCUMENT = 'DOCUMENT',
  ADVANCED = 'ADVANCED',
}

/**
 * Category mapping for operation types
 */
export const OPERATION_CATEGORY_MAP: Record<OperationType, OperationCategory> =
  {
    [OperationType.RESIZE]: OperationCategory.IMAGE_EDIT,
    [OperationType.CROP]: OperationCategory.IMAGE_EDIT,
    [OperationType.ROTATE]: OperationCategory.IMAGE_EDIT,
    [OperationType.FLIP]: OperationCategory.IMAGE_EDIT,
    [OperationType.COMPRESS]: OperationCategory.IMAGE_EDIT,
    [OperationType.CONVERT_FORMAT]: OperationCategory.IMAGE_EDIT,
    [OperationType.REMOVE_METADATA]: OperationCategory.IMAGE_EDIT,
    [OperationType.MERGE_PDF]: OperationCategory.PDF_TOOLS,
    [OperationType.SPLIT_PDF]: OperationCategory.PDF_TOOLS,
    [OperationType.EXTRACT_PAGES]: OperationCategory.PDF_TOOLS,
    [OperationType.REARRANGE_PAGES]: OperationCategory.PDF_TOOLS,
    [OperationType.ADD_PAGE_NUMBERS]: OperationCategory.PDF_TOOLS,
    [OperationType.REPLACE_FIELDS]: OperationCategory.DOCUMENT,
    [OperationType.APPLY_TEMPLATE]: OperationCategory.DOCUMENT,
    [OperationType.OCR]: OperationCategory.ADVANCED,
    [OperationType.EDGE_DETECTION]: OperationCategory.ADVANCED,
    [OperationType.APPLY_FILTER]: OperationCategory.ADVANCED,
  };

/**
 * Processing location (client-side or server-side)
 */
export type ProcessingLocation = 'client' | 'server';

/**
 * Processing location map (per constitution: client-side first)
 */
export const OPERATION_PROCESSING_LOCATION: Record<
  OperationType,
  ProcessingLocation
> = {
  [OperationType.RESIZE]: 'client',
  [OperationType.CROP]: 'client',
  [OperationType.ROTATE]: 'client',
  [OperationType.FLIP]: 'client',
  [OperationType.COMPRESS]: 'client',
  [OperationType.CONVERT_FORMAT]: 'client',
  [OperationType.REMOVE_METADATA]: 'client',
  [OperationType.MERGE_PDF]: 'client',
  [OperationType.SPLIT_PDF]: 'client',
  [OperationType.EXTRACT_PAGES]: 'client',
  [OperationType.REARRANGE_PAGES]: 'client',
  [OperationType.ADD_PAGE_NUMBERS]: 'client',
  [OperationType.REPLACE_FIELDS]: 'server', // Phase 1 (server), Phase 2 (client)
  [OperationType.APPLY_TEMPLATE]: 'client',
  [OperationType.OCR]: 'client',
  [OperationType.EDGE_DETECTION]: 'client',
  [OperationType.APPLY_FILTER]: 'client',
};

/**
 * Type guard to check if operation is client-side
 */
export function isClientSideOperation(type: OperationType): boolean {
  return OPERATION_PROCESSING_LOCATION[type] === 'client';
}

/**
 * Type guard to check if operation is server-side
 */
export function isServerSideOperation(type: OperationType): boolean {
  return OPERATION_PROCESSING_LOCATION[type] === 'server';
}

/**
 * Validate operation state transition
 */
export function isValidOperationStateTransition(
  from: OperationStatus,
  to: OperationStatus
): boolean {
  return VALID_OPERATION_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get operation category
 */
export function getOperationCategory(
  type: OperationType
): OperationCategory {
  return OPERATION_CATEGORY_MAP[type];
}

/**
 * Get operation processing location
 */
export function getOperationProcessingLocation(
  type: OperationType
): ProcessingLocation {
  return OPERATION_PROCESSING_LOCATION[type];
}
