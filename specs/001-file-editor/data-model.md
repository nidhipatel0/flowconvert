# Data Model: Universal File Editor Platform

**Date**: 2025-11-06
**Feature**: 001-file-editor
**Phase**: Phase 1 - Entity Design

## Overview

This document defines all data entities, their relationships, validation rules, and state transitions for the Universal File Editor Platform. All entities align with privacy-first principles (no server persistence except temporary encrypted processing).

---

## Entity Definitions

### 1. File

**Description**: Represents a user-uploaded file with its current state, operations applied, and preview data.

**Properties**:
```typescript
interface File {
  id: string;                    // UUID v4
  name: string;                  // Original filename
  size: number;                  // File size in bytes
  type: string;                  // MIME type (image/png, application/pdf, etc.)
  format: FileFormat;            // Enum: PNG, JPG, PDF, DOCX, etc.
  data: Blob | ArrayBuffer;      // File content (in-memory only)
  dimensions?: {                 // For images only
    width: number;
    height: number;
  };
  metadata?: Record<string, any>; // EXIF data for images
  uploadedAt: Date;
  state: FileState;              // Enum: UPLOADED, PROCESSING, READY, ERROR
  operations: Operation[];       // Applied operations history
  previewUrl?: string;           // Blob URL for preview
  originalFile: Blob;            // Pristine original for undo
}

enum FileFormat {
  // Images
  PNG = 'PNG',
  JPG = 'JPG',
  WEBP = 'WEBP',
  GIF = 'GIF',
  BMP = 'BMP',
  TIFF = 'TIFF',
  SVG = 'SVG',
  // Documents
  PDF = 'PDF',
  DOCX = 'DOCX',
  TXT = 'TXT',
  RTF = 'RTF',
  XLSX = 'XLSX',
  PPTX = 'PPTX',
}

enum FileState {
  UPLOADED = 'UPLOADED',       // Just uploaded, no operations
  PROCESSING = 'PROCESSING',   // Operation in progress
  READY = 'READY',            // Operation complete, ready for download
  ERROR = 'ERROR',            // Operation failed
}
```

**Validation Rules**:
- `size`: Maximum 50MB for free tier, 500MB for premium (Phase 2)
- `type`: Must match allowed MIME types
- `name`: Maximum 255 characters, sanitized for download
- `operations`: Maximum 50 operations per file (prevent memory overflow)

**State Transitions**:
```
UPLOADED → PROCESSING → READY
UPLOADED → PROCESSING → ERROR
READY → PROCESSING (new operation applied)
ERROR → UPLOADED (retry/reset)
```

**Storage**: In-memory only (browser/Node.js). No database persistence.

---

### 2. Operation

**Description**: Represents a single edit action applied to a file (resize, crop, compress, convert, etc.).

**Properties**:
```typescript
interface Operation {
  id: string;                     // UUID v4
  type: OperationType;
  parameters: OperationParameters;
  timestamp: Date;
  status: OperationStatus;
  duration?: number;              // Processing time in ms
  errorMessage?: string;
}

enum OperationType {
  // Image operations
  RESIZE = 'RESIZE',
  CROP = 'CROP',
  ROTATE = 'ROTATE',
  FLIP = 'FLIP',
  COMPRESS = 'COMPRESS',
  CONVERT_FORMAT = 'CONVERT_FORMAT',
  REMOVE_METADATA = 'REMOVE_METADATA',
  // PDF operations
  MERGE_PDF = 'MERGE_PDF',
  SPLIT_PDF = 'SPLIT_PDF',
  EXTRACT_PAGES = 'EXTRACT_PAGES',
  // Document operations
  REPLACE_FIELDS = 'REPLACE_FIELDS',
  // Government templates
  APPLY_TEMPLATE = 'APPLY_TEMPLATE',
}

type OperationParameters =
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
  | ReplaceFieldsParameters
  | ApplyTemplateParameters;

interface ResizeParameters {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  preset?: 'instagram-story' | 'instagram-post' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'custom';
}

interface CropParameters {
  x: number;                      // Top-left x coordinate
  y: number;                      // Top-left y coordinate
  width: number;
  height: number;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:2' | 'freeform';
}

interface RotateParameters {
  degrees: 90 | 180 | 270;
}

interface FlipParameters {
  direction: 'horizontal' | 'vertical';
}

interface CompressParameters {
  quality: number;                // 1-100
  targetSize?: number;            // Target file size in bytes
}

interface ConvertParameters {
  targetFormat: FileFormat;
  quality?: number;               // For lossy formats
}

interface RemoveMetadataParameters {
  removeAll: boolean;
  removeLocation: boolean;        // GPS data
  preserveTitle: boolean;
  preserveAuthor: boolean;
  preserveCopyright: boolean;
}

interface MergePDFParameters {
  fileIds: string[];              // Order matters
}

interface SplitPDFParameters {
  splitMethod: 'every-page' | 'page-ranges' | 'page-numbers';
  ranges?: { start: number; end: number }[];
  pageNumbers?: number[];
}

interface ExtractPagesParameters {
  pageNumbers: number[];
}

interface ReplaceFieldsParameters {
  replacements: FieldReplacement[];
}

interface ApplyTemplateParameters {
  templateId: 'driving-license' | 'passport' | 'aadhar' | 'pan-card' | 'oci-application';
}

enum OperationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
```

**Validation Rules**:
- `ResizeParameters.width/height`: 1-10000 pixels
- `CropParameters`: Coordinates within image bounds
- `CompressParameters.quality`: 1-100
- `MergePDFParameters.fileIds`: At least 2 files
- `SplitPDFParameters.ranges`: Non-overlapping, within PDF page count

**State Transitions**:
```
PENDING → IN_PROGRESS → COMPLETED
PENDING → IN_PROGRESS → FAILED
```

---

### 3. UserProfile

**Description**: Saved collection of personal/academic field values for quick document replacement.

**Properties**:
```typescript
interface UserProfile {
  id: string;                     // UUID v4
  name: string;                   // Profile name (e.g., "Jane Smith - Student")
  fields: ProfileFields;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;             // Auto-select on page load
}

interface ProfileFields {
  name?: string;
  rollNumber?: string;
  email?: string;
  phone?: string;
  class?: string;
  section?: string;
  designation?: string;
  employeeId?: string;
  studentId?: string;
  [key: string]: string | undefined; // Allow custom fields
}
```

**Validation Rules**:
- `name`: 1-100 characters, required
- `email`: Valid email format if provided
- `phone`: Valid phone format (Indian: 10 digits) if provided
- `rollNumber/employeeId/studentId`: Alphanumeric only

**Storage**: Browser localStorage as JSON array. Key: `flowconvert_profiles`

**CRUD Operations**:
```typescript
// localStorage wrapper functions
createProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): UserProfile
updateProfile(id: string, fields: Partial<UserProfile>): UserProfile
deleteProfile(id: string): void
getProfile(id: string): UserProfile | null
listProfiles(): UserProfile[]
setDefaultProfile(id: string): void
```

---

### 4. DetectedField

**Description**: Identified text field in a document (name, roll number, email, etc.) with its location and replacement status.

**Properties**:
```typescript
interface DetectedField {
  id: string;                     // UUID v4
  type: FieldType;
  originalValue: string;          // Text found in document
  newValue?: string;              // User's replacement value
  position: FieldPosition;
  confidence: number;             // 0-1, detection confidence score
  status: FieldStatus;
}

enum FieldType {
  NAME = 'NAME',
  ROLL_NUMBER = 'ROLL_NUMBER',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CLASS = 'CLASS',
  SECTION = 'SECTION',
  DESIGNATION = 'DESIGNATION',
  EMPLOYEE_ID = 'EMPLOYEE_ID',
  STUDENT_ID = 'STUDENT_ID',
  CUSTOM = 'CUSTOM',             // User-selected text
}

interface FieldPosition {
  page?: number;                  // For multi-page documents
  paragraph?: number;
  x?: number;                     // Pixel coordinates (for PDF/PPT)
  y?: number;
  width?: number;
  height?: number;
}

enum FieldStatus {
  DETECTED = 'DETECTED',          // Auto-detected, not edited
  EDITED = 'EDITED',              // User changed value
  REPLACED = 'REPLACED',          // Applied to document
  SKIPPED = 'SKIPPED',            // User chose to skip
}
```

**Validation Rules**:
- `originalValue`: Non-empty string
- `confidence`: 0.0-1.0 (fields with confidence <0.5 flagged for manual review)
- `type`: Must be valid FieldType enum

**State Transitions**:
```
DETECTED → EDITED → REPLACED
DETECTED → SKIPPED
DETECTED → REPLACED (from profile auto-fill)
```

---

### 5. Template

**Description**: Government document specification (dimensions, file size limits, format requirements).

**Properties**:
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  photo?: TemplateRequirement;
  document?: TemplateRequirement;
  guidelines: string[];           // User-facing instructions
  exampleUrl?: string;            // Link to example formatted doc
}

interface TemplateRequirement {
  dimensions: {
    width: string;                // e.g., "3.5cm", "A4"
    height?: string;              // Optional for standard sizes
  };
  maxSize: string;                // e.g., "100KB", "500KB"
  minSize?: string;               // Optional minimum
  format: FileFormat;
  aspectRatio?: string;           // e.g., "1:1", "3:4"
  dpi?: number;                   // Optional DPI requirement
}
```

**Validation Rules**:
- `dimensions`: Valid CSS units (cm, px, A4, Letter, etc.)
- `maxSize`: Parseable size string (KB, MB)
- `format`: Must be supported FileFormat

**Storage**: Static JSON files in `public/government-templates/`. Loaded at runtime, cached in memory.

**Predefined Templates**:
1. **Driving License**: Photo 3.5cm x 4.5cm <100KB, Document A4 PDF <500KB
2. **Passport**: Photo 3.5cm x 4.5cm 50KB-300KB, Document A4 PDF <1MB
3. **Aadhar Card**: Photo 3.5cm x 4.5cm <50KB
4. **PAN Card**: Photo 3.5cm x 4.5cm <50KB
5. **OCI Application**: Photo 5cm x 5cm <300KB, Documents A4 PDF <2MB each

---

### 6. BatchJob

**Description**: Collection of files with the same operations applied for batch processing.

**Properties**:
```typescript
interface BatchJob {
  id: string;
  fileIds: string[];
  operations: Operation[];        // Operations to apply to all files
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  status: BatchJobStatus;
  createdAt: Date;
  completedAt?: Date;
  errors: BatchError[];
}

interface BatchError {
  fileId: string;
  fileName: string;
  operationId: string;
  errorMessage: string;
}

enum BatchJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED', // Some files failed
  FAILED = 'FAILED',              // All files failed
}
```

**Validation Rules**:
- `fileIds`: 2-5 files for free tier, 2-25 for premium (Phase 2)
- `operations`: At least 1 operation
- Total batch size: 150MB free, 5GB premium (Phase 2)

**State Transitions**:
```
PENDING → PROCESSING → COMPLETED
PENDING → PROCESSING → PARTIALLY_COMPLETED (if some files fail)
PENDING → PROCESSING → FAILED (if all files fail)
```

---

### 7. PreviewState

**Description**: Snapshot of a file at any point in the editing workflow for before/after comparison.

**Properties**:
```typescript
interface PreviewState {
  fileId: string;
  originalPreview: string;        // Blob URL of original
  currentPreview: string;         // Blob URL after operations
  comparisonMode: ComparisonMode;
  metadata: PreviewMetadata;
}

enum ComparisonMode {
  SIDE_BY_SIDE = 'SIDE_BY_SIDE',
  SLIDER = 'SLIDER',              // Drag slider to compare
  OVERLAY = 'OVERLAY',            // Overlay with opacity
}

interface PreviewMetadata {
  originalSize: number;
  currentSize: number;
  sizeDiff: number;               // Bytes saved/added
  originalDimensions?: { width: number; height: number };
  currentDimensions?: { width: number; height: number };
  quality?: number;               // For compressed images
}
```

**Storage**: In-memory only. Blob URLs revoked when file removed.

---

### 8. WorkflowPreset

**Description**: Saved sequence of operations that can be quickly applied to files (like Photoshop Actions).

**Properties**:
```typescript
interface WorkflowPreset {
  id: string;                     // UUID v4
  name: string;                   // User-defined name (e.g., "Instagram Post")
  description?: string;           // Optional description
  operations: Operation[];        // Sequence of operations to apply
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;             // Track popularity
  isFavorite: boolean;            // User-starred presets
}
```

**Validation Rules**:
- `name`: 1-50 characters, unique per user, required
- `operations`: At least 1 operation, maximum 20 operations per preset
- `description`: Maximum 200 characters (optional)

**Storage**: Browser localStorage as JSON array. Key: `flowconvert_workflows`

**CRUD Operations**:
```typescript
createWorkflow(workflow: Omit<WorkflowPreset, 'id' | 'createdAt' | 'updatedAt'>): WorkflowPreset
updateWorkflow(id: string, updates: Partial<WorkflowPreset>): WorkflowPreset
deleteWorkflow(id: string): void
getWorkflow(id: string): WorkflowPreset | null
listWorkflows(): WorkflowPreset[]
applyWorkflowToFile(workflowId: string, fileId: string): Promise<void>
toggleFavorite(id: string): void
```

---

### 9. FileHistoryEntry

**Description**: Recent file record for quick re-editing without re-upload (opt-in feature, privacy-focused).

**Properties**:
```typescript
interface FileHistoryEntry {
  id: string;                     // UUID v4
  originalFile: Blob;             // Full file data stored locally
  fileName: string;
  fileSize: number;
  fileType: string;               // MIME type
  thumbnail?: string;             // Base64 data URL for preview
  operationsApplied: Operation[]; // Operations that were applied
  savedAt: Date;
  expiresAt: Date;                // Auto-delete timestamp (24 hours from save)
  lastAccessedAt: Date;
}
```

**Validation Rules**:
- Maximum 5 entries in history
- Each entry auto-expires after 24 hours
- Total storage limit: 200MB (across all 5 entries)
- `fileName`: Maximum 255 characters
- `thumbnail`: Maximum 50KB (compressed preview)

**Storage**: Browser IndexedDB (better for large binary data than localStorage). Database: `flowconvert_history`

**Privacy Features**:
- Opt-in only (disabled by default)
- Clear privacy notice shown before enabling
- User can clear history manually at any time
- Auto-clear after 24 hours (strict enforcement)
- Never synced to server

**CRUD Operations**:
```typescript
addToHistory(file: File, operations: Operation[]): Promise<FileHistoryEntry>
getHistory(): Promise<FileHistoryEntry[]>
getHistoryEntry(id: string): Promise<FileHistoryEntry | null>
removeFromHistory(id: string): Promise<void>
clearHistory(): Promise<void>
pruneExpiredEntries(): Promise<void>  // Auto-run on app load
isHistoryEnabled(): boolean
enableHistory(): void
disableHistory(): Promise<void>       // Clears all data
```

---

### 10. OperationQueue

**Description**: Collection of operations to be applied sequentially or all-at-once with preview management.

**Properties**:
```typescript
interface OperationQueue {
  id: string;                     // UUID v4
  fileId: string;                 // File this queue applies to
  operations: QueuedOperation[];
  executionMode: ExecutionMode;   // Sequential (one-by-one) or Batch (all-at-once)
  status: QueueStatus;
  currentIndex: number;           // For sequential execution
  startedAt?: Date;
  completedAt?: Date;
}

interface QueuedOperation {
  operation: Operation;
  status: OperationStatus;        // PENDING, IN_PROGRESS, COMPLETED, FAILED
  previewUrl?: string;            // Intermediate preview (sequential mode only)
  duration?: number;              // Execution time in ms
  errorMessage?: string;
}

enum ExecutionMode {
  SEQUENTIAL = 'SEQUENTIAL',      // Apply one-by-one, show previews at each step
  BATCH = 'BATCH',                // Apply all together, show final result only
}

enum QueueStatus {
  PENDING = 'PENDING',            // Not started
  RUNNING = 'RUNNING',            // Currently executing
  PAUSED = 'PAUSED',              // User paused execution
  COMPLETED = 'COMPLETED',        // All operations done
  FAILED = 'FAILED',              // Queue failed
}
```

**Validation Rules**:
- `operations`: Minimum 2 operations (single operation doesn't need queue), maximum 50 operations
- Operations validated for compatibility (e.g., warn if crop before fixed-size resize)
- `executionMode`: Must be SEQUENTIAL or BATCH

**State Transitions**:
```
PENDING → RUNNING → COMPLETED
PENDING → RUNNING → PAUSED → RUNNING → COMPLETED
PENDING → RUNNING → FAILED
RUNNING → PAUSED (user action)
PAUSED → RUNNING (user resume)
```

**Storage**: In-memory only (queue exists during editing session, cleared on download/cancel)

**Operations**:
```typescript
createQueue(fileId: string, operations: Operation[], mode: ExecutionMode): OperationQueue
executeQueue(queueId: string): Promise<void>
pauseQueue(queueId: string): void
resumeQueue(queueId: string): Promise<void>
cancelQueue(queueId: string): void
getQueueStatus(queueId: string): QueueStatus
reorderOperations(queueId: string, newOrder: number[]): void
removeOperationFromQueue(queueId: string, operationIndex: number): void
```

---

## Relationships

```
File (1) ──< (many) Operation
File (1) ──< (many) DetectedField
File (1) ──< (1) PreviewState
File (1) ──< (1) OperationQueue
UserProfile (1) ──< (many) DetectedField.newValue (populate from profile)
BatchJob (1) ──< (many) File
Template (1) ──< (many) File (applied to)
WorkflowPreset (1) ──< (many) Operation (template operations)
File (1) ──< (1) FileHistoryEntry
```

---

## Entity Lifecycle

### File Lifecycle
```
1. UPLOAD: User drops file → File entity created (UPLOADED state)
2. PREVIEW: Generate preview URL, extract metadata
3. OPERATION: User applies operation → Operation created (PENDING)
4. PROCESSING: Operation executes → File state = PROCESSING
5. COMPLETE: Operation done → File state = READY, Operation state = COMPLETED
6. DOWNLOAD: User downloads → File cleanup (revoke Blob URLs)
7. REMOVE: User removes file → All Blob URLs revoked, entity deleted
```

### UserProfile Lifecycle
```
1. CREATE: User fills profile form → Validate → Save to localStorage
2. READ: Load profiles on page init → Populate dropdown
3. UPDATE: User edits profile → Validate → Update localStorage
4. DELETE: User deletes profile → Remove from localStorage
5. APPLY: User selects profile → Auto-fill DetectedFields
```

### DetectedField Lifecycle (Document Replacement)
```
1. DETECT: Document uploaded → Field detection regex → DetectedField entities (DETECTED)
2. REVIEW: User reviews detected fields in preview
3. EDIT: User changes field value → Update DetectedField.newValue (EDITED)
4. REPLACE: User confirms → Apply replacements to document (REPLACED)
5. DOWNLOAD: User downloads modified document → Cleanup
```

### WorkflowPreset Lifecycle
```
1. CREATE: User completes multi-operation workflow → Clicks "Save as Preset" → Name workflow → Save to localStorage
2. READ: Load all presets on editor page init → Display in "Presets" dropdown
3. APPLY: User selects preset → Queue all preset operations for file → Execute queue
4. UPDATE: User edits preset (rename, modify operations) → Validate → Update localStorage
5. DELETE: User deletes preset → Remove from localStorage
6. FAVORITE: User stars/unstars preset → Toggle isFavorite → Resort list (favorites first)
```

### FileHistoryEntry Lifecycle
```
1. OPT-IN: User enables file history → Show privacy notice → Save preference to localStorage
2. SAVE: User downloads edited file → Check if history enabled → Add to IndexedDB with 24h expiry
3. PRUNE: App loads → Scan history for expired entries (>24h old) → Delete expired entries
4. RESTORE: User clicks recent file thumbnail → Load from IndexedDB → Populate editor
5. CLEAR: User manually clears history OR disables feature → Delete all entries from IndexedDB
6. AUTO-EXPIRE: Background timer checks every hour → Delete entries past expiry timestamp
```

### OperationQueue Lifecycle
```
1. CREATE: User selects multiple operations → Choose execution mode (SEQUENTIAL/BATCH) → Queue created (PENDING)
2. VALIDATE: System checks operation compatibility → Warn if issues (e.g., crop before resize) → User confirms or reorders
3. EXECUTE: User clicks "Apply All" or "Apply One-by-One" → Queue status = RUNNING → Process operations
4. SEQUENTIAL MODE: Execute operation → Generate preview → Show to user → Wait for confirmation → Next operation
5. BATCH MODE: Execute all operations in parallel/sequence → Generate final preview → Show result
6. PAUSE/RESUME: User pauses during execution → Queue status = PAUSED → User resumes → Continue from current operation
7. COMPLETE: All operations done → Queue status = COMPLETED → File state = READY → Cleanup queue
8. CANCEL: User cancels queue → Stop execution → Revert file to pre-queue state → Delete queue
```

---

## Next Steps

Proceed to API contracts (contracts/*.yaml) for endpoint definitions.
