# Tasks: Universal File Editor Platform

**Input**: Design documents from `/specs/001-file-editor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: FlowConvert Constitution requires TDD (Test-Driven Development). Tests are MANDATORY and MUST be written BEFORE implementation. Minimum 80% coverage overall, 100% for critical conversion paths.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app structure: `app/`, `components/`, `lib/`, `tests/` at repository root
- Paths assume Next.js 14 App Router structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization completed. User Story 0 (Dark Theme Dashboard) is **✅ COMPLETE**.

**Status**:
- ✅ Next.js 14 project initialized with TypeScript strict mode
- ✅ Tailwind CSS configured with dark teal theme (#0d3333)
- ✅ Tab navigation (Images, Pdf, Compress) implemented with keyboard support
- ✅ Tool navigation with dynamic categories (CONVERT, SIZE CHANGE, EDIT, COMPRESS) implemented
- ✅ File upload zone with workspace transformation implemented
- ✅ Privacy badge and "100% Private & Secure" messaging complete
- ✅ Preview and Download buttons integrated
- ✅ "Add More Files" button in workspace mode
- ✅ Accessibility features (ARIA labels, keyboard navigation, focus management)
- ✅ Dark theme with glassmorphism effects complete

## Phase 1B: UI Fixes Phase 1 (Completed 2025-11-14) ✅ COMPLETE

**Purpose**: Fix critical UI issues identified by user feedback.

**Status**:
- ✅ **UI-FIX-1**: FileUploadZone - Entire area (marked as 3) is now full-workspace clickable card end-to-end
- ✅ **UI-FIX-2**: File selection - Files are now properly added to editor store and visible in FileCardSidebar (area 4)
- ✅ **UI-FIX-3**: UI colors and text - Fixed colors, text visibility, dark mode, and color schemes
  - Added dark-teal color palette to Tailwind config
  - Components use CSS variables for theme-aware colors
  - Text colors adapt properly to light/dark mode
  - All 4 color schemes work correctly
  - Light mode uses dark text, dark mode uses light text
- ✅ **UI-FIX-4**: Documentation updated with UI fixes information

---

## Phase 1C: UI Fixes Phase 2 (Completed 2025-11-14) ✅ COMPLETE

**Purpose**: Fix theme application, update components, maximize workspace area.

**Implementation Order:**
1. Fix theme application
2. Update key components to use CSS variables
3. Implement workspace maximization

### Task 1: Fix Theme Application ✅ COMPLETE

- [x] **UI-FIX-5**: Remove inline style conflicts - Theme store should only set CSS classes, not inline styles
- [x] **UI-FIX-6**: Fix default theme mismatch - Ensure store default (Professional Emerald) matches CSS default
- [x] **UI-FIX-7**: Ensure CSS classes properly handle light/dark mode variants
- [ ] **UI-FIX-8**: Test theme switching - All 4 themes should work without color overlapping (Manual testing required)
- [ ] **UI-FIX-9**: Test light/dark mode - Each theme should have distinct light and dark variants (Manual testing required)

### Task 2: Update Key Components to Use CSS Variables ✅ COMPLETE

- [x] **UI-FIX-10**: Update FileDetailsSidebar - Replace hardcoded `bg-teal-`, `text-teal-` with CSS variables
- [x] **UI-FIX-11**: Update ToolNavigation - Replace hardcoded teal colors with theme-aware CSS variables
- [x] **UI-FIX-12**: Update FileThumbnailSidebar - Use CSS variables for colors
- [x] **UI-FIX-13**: Update FileCardSidebar - Use CSS variables for colors
- [x] **UI-FIX-14**: Update FileUploadZone - Ensure all colors use CSS variables
- [x] **UI-FIX-15**: Update MainWorkspace - Use CSS variables for background and text colors
- [ ] **UI-FIX-16**: Test all components - Verify colors change correctly when switching themes (Manual testing required)

### Task 3: Workspace Maximization ✅ COMPLETE

- [x] **UI-FIX-17**: Move header to footer - Relocate WorkspaceHeader to bottom of screen
- [x] **UI-FIX-18**: Make header scrollable - Header should be below viewport, scroll down to access
- [x] **UI-FIX-19**: Make ribbon collapsible - Add collapse/expand button to ribbon
- [x] **UI-FIX-20**: Compact tabs - Show only tabs initially (reduce height to 48px, compact design)
- [x] **UI-FIX-21**: Ribbon dropdown - Add expand/collapse button to show tool groups when collapsed
- [x] **UI-FIX-22**: Update workspace padding - Add 48px top padding for ribbon, header is at bottom
- [ ] **UI-FIX-23**: Test workspace - Verify maximum workspace area is available (Manual testing required)

---

## Phase 1E: Button Functionality Implementation (Completed 2025-11-14)

**Purpose**: Connect ribbon buttons to their respective tool functions that are already implemented.

**Status**:
- ✅ **BTN-FUNC-1**: Updated MainWorkspace to accept selectedTool prop and conditionally render tool components
- ✅ **BTN-FUNC-2**: Connected PDF merge button (pdf-merge) to PDFTools merge functionality
- ✅ **BTN-FUNC-3**: Connected PDF split button (pdf-split) to PDFTools split functionality
- ✅ **BTN-FUNC-4**: Connected PDF extract button (pdf-extract) to PDFTools extract functionality
- ✅ **BTN-FUNC-5**: Connected PDF compress button (pdf-compress) to PDFTools compress functionality
- ✅ **BTN-FUNC-6**: Connected PDF organise button (pdf-organise) to PDFTools organize tab (rotate/delete pages)
- ✅ **BTN-FUNC-7**: Connected Image to PDF button (convert-pdf) to ImageToPDF convert functionality
- ✅ **BTN-FUNC-8**: Connected E-Sign button (editor-esign) to ESignatureTools functionality
- ✅ **BTN-FUNC-9**: Fixed fileList is not defined error in PDFTools.tsx
- ✅ **BTN-FUNC-10**: Fixed PDF upload functionality (FileUploadZone and FileDetailsSidebar accept PDFs)
- ✅ **BTN-FUNC-11**: Fixed PDF functions not working (all buttons now properly connected)
- ✅ **BTN-FUNC-12**: Moved ImageToPDF options to right sidebar card instead of popup
- ✅ **BTN-FUNC-13**: Made FileDetailsSidebar into a card and made it smaller (w-64 instead of w-72)
- ✅ **BTN-FUNC-14**: Removed preview modal for ImageToPDF - now downloads directly

**Implementation Details**:
- MainWorkspace now conditionally renders tool components when a tool is selected
- PDFTools accepts initialTab prop to open the correct tab (merge, split, extract, organize, compress)
- Fixed fileList variable reference error in PDFTools.tsx
- Created ImageToPDFSidebar component for compact sidebar conversion options
- FileDetailsSidebar now shows ImageToPDFSidebar when convert-pdf tool is selected
- FileDetailsSidebar made smaller (w-64) and File Details section converted to card format with smaller text
- All existing functions (merge, split, extract, compress, organise, esign, convert from img to pdf) are already implemented and working
- Buttons in ToolNavigation call onSelectTool which updates selectedTool state, triggering tool component rendering
- ImageToPDF now downloads directly without preview modal when converting

---

## Phase 1D: UI Fixes Phase 3 - Enhanced Theming & PDF Layout (Completed 2025-11-14) ✅ COMPLETE

**Purpose**: Add new theme matching reference UI, improve theme selection UX, optimize ribbon size, create bottom bar, fix PDF layout

**Implementation Order:**
1. Add Ocean Deep theme
2. Convert theme dropdown to modal
3. Reduce ribbon size and optimize spacing
4. Create bottom navigation bar
5. Fix PDF thumbnail layout

### Task 1: Ocean Deep Theme ✅ COMPLETE

- [x] **UI-FIX-24**: Create Ocean Deep theme - Add to PRESET_THEMES with vibrant cyan colors (#06b6d4)
- [x] **UI-FIX-25**: Add theme CSS - Add dark mode variant (:root.theme-ocean-deep) to globals.css
- [x] **UI-FIX-26**: Add theme CSS light - Add light mode variant (:root.light.theme-ocean-deep) to globals.css
- [x] **UI-FIX-27**: Update theme colors mapping - Add ocean-deep: '#06b6d4' to themeColors in ThemeDropdown
- [ ] **UI-FIX-28**: Test Ocean Deep theme - Verify theme works in both light and dark modes (Manual testing required)

### Task 2: Theme Selection Modal ✅ COMPLETE

- [x] **UI-FIX-29**: Create ThemeModal component - Modal with theme preview cards
- [x] **UI-FIX-30**: Add color swatch display - Show primary, secondary, accent colors for each theme
- [x] **UI-FIX-31**: Add active theme indicator - Checkmark on currently selected theme
- [x] **UI-FIX-32**: Add modal controls - ESC key handler, click outside to close
- [x] **UI-FIX-33**: Update ThemeDropdown - Convert to button that opens ThemeModal
- [x] **UI-FIX-34**: Export new components - Add ThemeModal to components/index.ts
- [ ] **UI-FIX-35**: Test theme modal - Verify all interactions work correctly (Manual testing required)

### Task 3: Ribbon Size Optimization ✅ COMPLETE

- [x] **UI-FIX-36**: Reduce ribbon height - Change from 64px to 50px (minHeight in ToolNavigation)
- [x] **UI-FIX-37**: Reduce tool button size - Change from w-16 to w-14, reduce padding
- [x] **UI-FIX-38**: Reduce text size - Change tool labels from text-xs to text-[10px]
- [x] **UI-FIX-39**: Reduce group labels - Change from text-xs to text-[10px]
- [x] **UI-FIX-40**: Reduce padding/gaps - Change py-1.5 to py-1, gap-1.5 to gap-0.5
- [x] **UI-FIX-41**: Add horizontal scroll - Ensure scrollbar-hide class applied to tool groups
- [x] **UI-FIX-42**: Update button corners - Set borderRadius to 6px for slightly curved corners
- [ ] **UI-FIX-43**: Test ribbon - Verify compact layout matches Word UI reference (Manual testing required)

### Task 4: Bottom Navigation Bar ✅ COMPLETE

- [x] **UI-FIX-44**: Create BottomBar component - 40px height, fixed to bottom
- [x] **UI-FIX-45**: Add page navigation - Previous/Next buttons, currentPage/totalPages indicator
- [x] **UI-FIX-46**: Add zoom controls - Zoom in, zoom out, fit to width buttons
- [x] **UI-FIX-47**: Add zoom display - Show current zoom percentage
- [x] **UI-FIX-48**: Style bottom bar - Use CSS variables for theming
- [x] **UI-FIX-49**: Export BottomBar - Add to components/index.ts
- [ ] **UI-FIX-50**: Test bottom bar - Verify all controls work correctly (Manual testing required)

### Task 5: PDF Thumbnail Layout ✅ COMPLETE

- [x] **UI-FIX-51**: Add left thumbnail sidebar - 48px wide sidebar for PDFs in MainWorkspace
- [x] **UI-FIX-52**: Generate page thumbnails - Create clickable thumbnail grid with page numbers
- [x] **UI-FIX-53**: Add active state highlighting - Highlight current page thumbnail
- [x] **UI-FIX-54**: Add thumbnail click handler - Navigate to page on thumbnail click
- [x] **UI-FIX-55**: Update main PDF view - Move to right/center, remove circular action area
- [x] **UI-FIX-56**: Integrate BottomBar - Add BottomBar to MainWorkspace for PDF navigation
- [x] **UI-FIX-57**: Add zoom functionality - Implement zoom with CSS transform scale
- [x] **UI-FIX-58**: Update workspace layout - Flex layout with left sidebar + main view
- [ ] **UI-FIX-59**: Test PDF layout - Verify thumbnails, navigation, zoom all work (Manual testing required)

---

## Phase 1E: UI Fixes Phase 4 - Theme Dropdown, PDF Rendering, Ribbon Refactor (In Progress 2025-11-14)

**Purpose**: Convert theme modal to dropdown, implement PDF.js rendering, refactor ribbon layout

**Implementation Order:**
1. Convert theme modal to dropdown
2. Implement PDF.js for PDF rendering
3. Update ribbon layout (operations below tabs)
4. Test all changes

### Task 1: Theme Dropdown Conversion

- [ ] **UI-FIX-60**: Remove ThemeModal component - Delete components/ThemeModal.tsx and references
- [ ] **UI-FIX-61**: Convert ThemeDropdown to actual dropdown - Replace modal trigger with dropdown menu
- [ ] **UI-FIX-62**: Add dropdown menu items - Color scheme options with color swatches
- [ ] **UI-FIX-63**: Style dropdown to match reference - Position below theme icon, proper styling
- [ ] **UI-FIX-64**: Update component exports - Remove ThemeModal from components/index.ts
- [ ] **UI-FIX-65**: Test theme dropdown - Verify all 5 themes work in dropdown format

### Task 2: PDF.js Integration for Rendering

- [ ] **UI-FIX-66**: Install pdfjs-dist package - npm install pdfjs-dist
- [ ] **UI-FIX-67**: Create PDF renderer utility - lib/utils/pdf-renderer.ts with PDF.js setup
- [ ] **UI-FIX-68**: Configure PDF.js worker - Set up worker for PDF parsing
- [ ] **UI-FIX-69**: Update MainWorkspace for PDF rendering - Render PDF pages using PDF.js canvas
- [ ] **UI-FIX-70**: Update FileThumbnailSidebar for PDF - Generate thumbnails using PDF.js
- [ ] **UI-FIX-71**: Add PDF page caching - Cache rendered pages for performance
- [ ] **UI-FIX-72**: Handle PDF loading states - Show spinner while PDF loads/renders
- [ ] **UI-FIX-73**: Test PDF rendering - Verify PDFs visible in thumbnails and workspace

### Task 3: Page Navigation Enhancement

- [ ] **UI-FIX-74**: Update BottomBar design - Match Image #2 layout exactly
- [ ] **UI-FIX-75**: Implement page counter - Show "currentPage / totalPages" format (e.g., "1 / 15")
- [ ] **UI-FIX-76**: Add navigation arrow icons - Previous/next page buttons with proper icons
- [ ] **UI-FIX-77**: Add zoom control buttons - Zoom in (+), zoom out (-), fit to page icons
- [ ] **UI-FIX-78**: Wire up navigation handlers - Connect buttons to page/zoom state
- [ ] **UI-FIX-79**: Style matching reference - Ensure visual design matches Image #2
- [ ] **UI-FIX-80**: Test page navigation - Verify all controls work correctly

### Task 4: Ribbon Layout Refactor

- [ ] **UI-FIX-81**: Update ToolNavigation structure - Keep tabs at top, operations below
- [ ] **UI-FIX-82**: Remove dropdown behavior - Operations always visible (not in dropdown)
- [ ] **UI-FIX-83**: Implement horizontal ribbon - Display operations in horizontal row below tabs
- [ ] **UI-FIX-84**: Add vertical scroll - Overflow-y scroll when operations exceed height

---

## Phase 1G: OCR Text Extraction (Client-Side) - Week 3

**Purpose**: Implement basic OCR functionality for extracting text from images and PDFs using Tesseract.js (client-side, privacy-first). This is Phase 1 of OCR implementation - simple text extraction. Advanced features (editable textboxes, bounding boxes, PDF Studio features) will come in Phase 2.

**Approach**:
- Client-side only using Tesseract.js (no backend required)
- Simple UI: Select file → Extract text → Show results → Copy/Download
- Support for images (PNG, JPG, JPEG, WebP, GIF, BMP, TIFF) and PDFs (convert to image first)
- Language support: English (default), Hindi, Multi-language
- Based on research from OCR markdown documentation

**Implementation Order:**
1. Create OCR workspace component (OCRScan.tsx)
2. Create OCR sidebar component (OCRScanSidebar.tsx) for controls and results
3. Remove old OCRTools.tsx (preserving all other code)
4. Wire up OCR to MainWorkspace
5. Wire up OCRScanSidebar to FileDetailsSidebar
6. Test and verify functionality

### Task 1: Create OCR Workspace Component ✅ NEXT

- [ ] **OCR-1**: Create components/ocr-tools/OCRScan.tsx - Main workspace component that displays selected file (image or PDF page)
  - Show image/PDF page preview in center
  - Display loading state while processing
  - Show progress indicator during OCR extraction
  - Handle both image files and PDF files (convert PDF page to image for OCR)
  - Use existing file from editor store (getActiveFile)
  - Minimal UI - just preview, rest goes in sidebar

- [ ] **OCR-2**: Create lib/client-processors/ocr-processor.ts - OCR processing utilities
  - Function: extractTextFromImage(blob: Blob, language: string) → Promise<{text: string, confidence: number}>
  - Lazy-load Tesseract.js only when needed (~2-4MB)
  - Configure Tesseract worker with progress callbacks
  - Support languages: eng (English), hin (Hindi), eng+hin (Multi)
  - Return extracted text and average confidence score
  - Handle errors gracefully with user-friendly messages
  - Add TypeScript types for Tesseract data structures

- [ ] **OCR-3**: Create lib/utils/image-from-pdf.ts - Utility to convert PDF page to image for OCR
  - Function: convertPDFPageToImage(pdfBlob: Blob, pageNumber: number, dpi: number = 300) → Promise<Blob>
  - Use existing pdf-renderer.ts utilities (loadPDF, renderPDFPage)
  - Render at 300 DPI for accurate OCR (as per markdown best practices)
  - Convert canvas to Blob (image/png)
  - Handle errors if PDF fails to load

### Task 2: Create OCR Sidebar Component

- [ ] **OCR-4**: Create components/ocr-tools/OCRScanSidebar.tsx - Sidebar for OCR controls and results
  - **OCR Settings Card**:
    - File selector dropdown (images and PDFs from editor store)
    - Language selector (English, Hindi, English + Hindi)
    - For PDFs: Page selector dropdown (1, 2, 3... Total Pages)
    - Extract Text button (primary action)
  - **OCR Results Card**:
    - Extracted text display (textarea, editable, monospace font)
    - Statistics: Characters, Words, Lines, Confidence %
    - Action buttons: Copy to Clipboard, Download as TXT
    - Loading state with progress bar (0-100%)
  - **File Details Card** (reuse existing style from other sidebars):
    - File name, format, size
    - Preview and Download buttons
  - Use consistent styling with existing sidebar components (same colors, spacing, borders)
  - Handle empty states (no file selected, no results yet)

### Task 3: Remove Old OCR Component

- [ ] **OCR-5**: Delete components/OCRTools.tsx - Remove old implementation (DO NOT TOUCH OTHER FILES)
  - Verify component is only imported in components/index.ts
  - Remove export from components/index.ts
  - Delete the file
  - Ensure no other files reference OCRTools (search codebase)

### Task 4: Wire Up OCR to MainWorkspace

- [ ] **OCR-6**: Update components/MainWorkspace.tsx - Add OCR tool handling
  - Import OCRScan component
  - Add conditional rendering: if (selectedTool === 'ocr-scan') return <OCRScan />;
  - Place OCR conditional AFTER PDF crop and BEFORE e-signature (maintain order)
  - Add console.log for debugging when OCR tool is selected
  - Ensure existing tool integrations remain untouched

### Task 5: Wire Up OCRScanSidebar to FileDetailsSidebar

- [ ] **OCR-7**: Update components/FileDetailsSidebar.tsx - Add OCR sidebar handling
  - Import OCRScanSidebar component
  - Add check: const isOCRToolSelected = selectedTool === 'ocr-scan';
  - Add conditional rendering: if (isOCRToolSelected) return <div className="p-2 overflow-y-auto flex-1"><OCRScanSidebar /></div>
  - Place check AFTER PDF crop and BEFORE image-to-PDF conversion
  - Ensure existing sidebar logic remains untouched

### Task 6: Export New Components

- [ ] **OCR-8**: Update components/index.ts - Export new OCR components
  - Add: export { OCRScan } from './ocr-tools/OCRScan';
  - Add: export { OCRScanSidebar } from './ocr-tools/OCRScanSidebar';
  - Remove: OCRTools export (already handled in OCR-5)
  - Maintain alphabetical order

### Task 7: Testing and Verification

- [ ] **OCR-9**: Test OCR with image files
  - Upload PNG, JPG, JPEG files with clear text
  - Click "OCR" tab → Click "OCR Scan" button
  - Verify OCRScan workspace appears with image preview
  - Verify OCRScanSidebar appears with controls
  - Select image, select language (English), click Extract Text
  - Verify progress bar shows during processing
  - Verify extracted text appears in results textarea
  - Verify statistics (chars, words, lines, confidence) are accurate
  - Test Copy to Clipboard button
  - Test Download as TXT button

- [ ] **OCR-10**: Test OCR with PDF files
  - Upload multi-page PDF with text/images
  - Click OCR tab → Click OCR Scan button
  - Select PDF file from dropdown
  - Select page number (page 1, page 2, etc.)
  - Select language, click Extract Text
  - Verify PDF page is converted to image (300 DPI)
  - Verify OCR extracts text from selected page
  - Test with different pages
  - Verify results are accurate

- [ ] **OCR-11**: Test error handling
  - Test with corrupt image file
  - Test with password-protected PDF
  - Test with blank/empty image
  - Test with image containing no text
  - Verify error messages are user-friendly
  - Verify app doesn't crash

- [ ] **OCR-12**: Test language support
  - Test with English text (clear, printed)
  - Test with Hindi text (Devanagari script)
  - Test with mixed English + Hindi
  - Verify confidence scores are reasonable (>70% for clear text)

**Success Criteria**:
- ✅ OCR button in OCR tab opens OCRScan workspace
- ✅ Users can select image or PDF file
- ✅ Users can select language (English, Hindi, Multi)
- ✅ For PDFs, users can select which page to OCR
- ✅ Extract Text button triggers Tesseract.js processing
- ✅ Progress bar shows 0-100% during processing
- ✅ Extracted text displays in editable textarea
- ✅ Statistics show accurate counts
- ✅ Copy to Clipboard works
- ✅ Download as TXT works
- ✅ All existing features remain untouched and functional
- ✅ No console errors
- ✅ Tesseract.js is lazy-loaded (not in initial bundle)

**Notes**:
- This implements basic OCR text extraction only
- Advanced features (bounding boxes, editable text overlays, searchable PDFs) will be Phase 1H
- Maintains privacy-first approach (100% client-side processing)
- Based on research from OCR_BACKEND.md and PDF_EDITOR_FRONTEND.md documentation
- Follows FlowConvert constitution: <3s for 10MB file, <100ms UI response, TDD, 80% coverage
- [ ] **UI-FIX-85**: Update tab switching - Show appropriate operations when tab changes
- [ ] **UI-FIX-86**: Style ribbon layout - Proper spacing, borders, backgrounds
- [ ] **UI-FIX-87**: Test ribbon - Verify CROP/CONVERT/DIMENSION tabs with operations below
- [ ] **UI-FIX-88**: Test vertical scroll - Verify scroll works when many operations present

---

## Phase 2: Foundational (Blocking Prerequisites) ⚠️ REQUIRED BEFORE USER STORIES

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Core Types & Validation

- [ ] T001 [P] Create file type definitions in lib/types/file.ts (File, FileMetadata, Operation, ConversionOptions)
- [ ] T002 [P] Create operation type definitions in lib/types/operation.ts (OperationType, OperationStatus, OperationResult, OperationHistory)
- [ ] T003 [P] Create profile type definitions in lib/types/profile.ts (UserProfile, DetectedField, FieldConfidence, ProfileTemplate)
- [ ] T004 [P] Create template type definitions in lib/types/template.ts (GovernmentTemplate, TemplateSpec, DimensionRequirements)
- [ ] T005 [P] Create batch type definitions in lib/types/batch.ts (BatchOperation, BatchProgress, BatchResult)
- [ ] T006 [P] Implement file validation utility in lib/utils/file-validation.ts (size limits 50MB/500MB, format checks, MIME validation)
- [ ] T007 [P] Implement format detection utility in lib/utils/format-detection.ts (detectFormatFromBlob, validateMimeType, magic number detection)

### State Management

- [ ] T008 Create editor store in lib/stores/editor-store.ts (files Map, operations queue, preview state, undo/redo stack)
- [ ] T009 [P] Create profile store in lib/stores/profile-store.ts (localStorage wrapper, CRUD operations, profile selection)
- [ ] T010 [P] Create workflow store in lib/stores/workflow-store.ts (preset management, operation sequences, save/load)
- [ ] T011 [P] Create history store in lib/stores/history-store.ts (IndexedDB wrapper, 24h TTL, last 5 files tracking)


### Error Handling & UI Foundation

- [ ] T012 [P] Implement error handling utility in lib/utils/error-handling.ts (user-friendly messages, error categorization, recovery options)
- [ ] T013 [P] Create Toast notification system in components/ui/Toast.tsx (success/error/warning/info, auto-dismiss, queue management)
- [ ] T014 [P] Create ProgressBar component in components/ui/ProgressBar.tsx (determinate/indeterminate, percentage display)
- [ ] T015 [P] Create Modal component in components/ui/Modal.tsx (overlay, close on ESC, focus trap)

### UI Redesign: Fixed Header, Ribbon, and Workspace Layout

# Phase 2B: UI Enhancements - Colors, Ribbon Layout, Upload Card

- [ ] T016 [P] Create 4 color themes in tailwind.config.ts: Elegant Blue, Royal Purple, Professional Emerald (default), Corporate Slate (with light & dark variants)
- [ ] T017 [P] Update useThemeStore to support 4 new color themes with localStorage persistence and color switching
- [ ] T018 [P] Fix light mode text colors: Use black/dark gray (#1a1a1a, #333333) for all text elements for proper visibility on light backgrounds
- [ ] T019 [P] Refactor ToolNavigation ribbon: Show tab name header at top, functions organized by category below (CONVERT, SIZE CHANGE, EDIT, COMPRESS), with icons and text labels, horizontal scroll
- [ ] T020 [P] Create UploadCard component: Full-workspace clickable card, entire card area clickable to open file browser, supports drag-drop anywhere on card
- [ ] T021 [P] Update FileUploadZone: Replace with UploadCard (full-workspace card layout, centered upload icon, "Drop your files here" message)
- [ ] T022 [P] Test all 4 color themes: Elegant Blue, Royal Purple, Professional Emerald, Corporate Slate in both light and dark modes
- [ ] T023 [P] Test ribbon layout: Grouped functions under tabs, horizontal scrolling, icons with text labels
- [ ] T024 [P] Test upload card: Click anywhere on card opens file browser, drag-drop files works on any area of card
- [ ] T025 [P] Responsive design for desktop/mobile; all themes support light/dark toggle via header button

**Checkpoint**: ✅ Enhanced UI complete - 4 color themes, improved ribbon, clickable upload card

---

## Phase 3: User Story 1 - Quick Single File Edit (Priority: P1) 🎯 MVP

**Goal**: Enable users to resize, compress, crop, rotate, flip, and convert images with real-time preview and download

**Independent Test**: Upload 5MB image → Apply resize to 1080x1920 → Enable compression to 80% → Preview side-by-side → Download → Verify dimensions 1080x1920 and size <1MB

### Tests for User Story 1 (MANDATORY - TDD Required) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T026 [P] [US1] Unit test for image processor in tests/unit/lib/image-processor.test.ts (resize, compress, convert PNG/JPG/WebP)
- [ ] T017 [P] [US1] Unit test for dimension conversion in tests/unit/lib/dimension-utils.test.ts (pixel ↔ percentage, social media presets)
- [ ] T018 [P] [US1] Unit test for compression logic in tests/unit/lib/compression.test.ts (quality modes, target size calculation)
- [ ] T019 [P] [US1] Integration test for image conversion workflow in tests/integration/image-conversion.test.ts (upload → edit → preview → download)
- [ ] T020 [US1] E2E test for User Story 1 in tests/e2e/user-story-1.spec.ts (complete resize+compress+download flow, verify file output)

### Implementation for User Story 1

#### Client-Side Image Processing

- [ ] T021 [P] [US1] Implement image processor wrapper in lib/client-processors/image-processor.ts (browser-image-compression integration, Canvas API for format conversion)
- [ ] T022 [P] [US1] Implement compression logic in lib/client-processors/compression.ts (quality slider 1-100%, target size mode, real-time size estimation)
- [ ] T023 [P] [US1] Implement dimension utilities in lib/utils/dimension-utils.ts (percentage ↔ pixel conversion, Instagram/Facebook/Twitter presets)
- [ ] T024 [P] [US1] Implement metadata processor in lib/client-processors/metadata-processor.ts (EXIF reading, location removal default, user-controlled removal)
- [ ] T025 [P] [US1] Implement crop utility in lib/utils/crop-utils.ts (freeform, aspect ratio 1:1/4:3/16:9, preset dimensions)
- [ ] T026 [P] [US1] Implement rotation/flip utility in lib/utils/transform-utils.ts (90°/180°/270° rotation, horizontal/vertical flip)

#### UI Components for Image Tools

- [ ] T027 [P] [US1] Create ImageEditor component in components/ImageEditor.tsx (main container with tool selection, preview panel)
- [ ] T028 [P] [US1] Create ResizeTool component in components/image-tools/ResizeTool.tsx (dimension inputs with pixel/% toggle, preset selector)
- [ ] T029 [P] [US1] Create CompressTool component in components/image-tools/CompressTool.tsx (quality slider with real-time size estimate)
- [ ] T030 [P] [US1] Create CropTool component in components/image-tools/CropTool.tsx (draggable crop area, aspect ratio lock, preset ratios)
- [ ] T031 [P] [US1] Create RotateFlipTool component in components/image-tools/RotateFlipTool.tsx (rotation buttons, flip buttons)
- [ ] T032 [P] [US1] Create FormatConverter component in components/image-tools/FormatConverter.tsx (PNG ↔ JPG ↔ WebP ↔ GIF dropdown)

#### Preview & Download

- [ ] T033 [P] [US1] Update PreviewPanel component in components/PreviewPanel.tsx (side-by-side before/after, zoom controls, dimension/size display)
- [ ] T034 [P] [US1] Implement download handler in lib/utils/download.ts (suggested filenames like "photo_resized_1080x1920.jpg", trigger browser download)

#### Integration

- [ ] T035 [US1] Integrate image operations with editor store (add operations to queue, update active file, real-time preview updates)
- [ ] T036 [US1] Wire up ImageEditor with all tool components and preview panel
- [ ] T037 [US1] Add operation confirmation modal before applying destructive operations
- [ ] T038 [US1] Test complete workflow: upload → resize → compress → preview → download

**Checkpoint**: ✅ User Story 1 complete - single file image editing fully functional

---

## Phase 4: User Story 2 - Government Document Auto-Formatting (Priority: P1) 🎯 MVP

**Goal**: Auto-format government documents (Driving License, Passport, Aadhar, PAN, OCI) to exact specifications with one click

**Independent Test**: Upload oversized photo (8MB) + scanned document (2MB) → Select "Driving License" template → Verify photo auto-cropped to 3.5cm × 4.5cm and compressed to <100KB → Verify document formatted to A4 PDF <500KB → Download both

### Tests for User Story 2 (MANDATORY - TDD Required) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T039 [P] [US2] Unit test for template loader in tests/unit/lib/template-loader.test.ts (load JSON specs, parse dimensions)
- [ ] T040 [P] [US2] Unit test for template validator in tests/unit/lib/template-validator.test.ts (validate dimensions, file size, format compliance)
- [ ] T041 [P] [US2] Unit test for auto-formatter in tests/unit/lib/auto-formatter.test.ts (auto-crop, resize, compress to spec)
- [ ] T042 [P] [US2] Integration test for government template workflow in tests/integration/government-templates.test.ts (template selection → auto-format → validation)
- [ ] T043 [US2] E2E test for User Story 2 in tests/e2e/user-story-2.spec.ts (upload → select DL template → verify output meets specs)

### Implementation for User Story 2

#### Government Template Infrastructure

- [ ] T044 [P] [US2] Create template specs in public/government-templates/ (driving-license.json with photo 3.5cm×4.5cm <100KB + document A4 <500KB)
- [ ] T045 [P] [US2] Create passport template in public/government-templates/passport.json (photo 3.5cm×4.5cm <100KB, document requirements)
- [ ] T046 [P] [US2] Create Aadhar template in public/government-templates/aadhar.json (specifications per UIDAI guidelines)
- [ ] T047 [P] [US2] Create PAN card template in public/government-templates/pan-card.json (photo + document specs)
- [ ] T048 [P] [US2] Create OCI template in public/government-templates/oci-application.json (comprehensive form requirements)

#### Auto-Formatting Logic

- [ ] T049 [P] [US2] Implement template loader in lib/utils/template-loader.ts (load JSON, parse requirements, cache templates)
- [ ] T050 [P] [US2] Implement template validator in lib/utils/template-validator.ts (check dimensions cm→pixels, validate file size, verify format)
- [ ] T051 [P] [US2] Implement auto-formatter in lib/client-processors/auto-formatter.ts (auto-crop to center, resize to exact dimensions, compress to target size)
- [ ] T052 [P] [US2] Implement quality validator in lib/utils/quality-validator.ts (minimum resolution checks, DPI validation, warning generation)

#### UI Components for Government Templates

- [ ] T053 [P] [US2] Create TemplateSelector component in components/government-templates/TemplateSelector.tsx (grid of templates with icons, search filter)
- [ ] T054 [P] [US2] Create TemplatePreview component in components/government-templates/TemplatePreview.tsx (show requirements, compliance badges)
- [ ] T055 [P] [US2] Create ComplianceBadge component in components/ui/ComplianceBadge.tsx (green ✓ compliant, yellow ⚠ warning, red ✗ error)
- [ ] T056 [P] [US2] Create TemplateGuide component in components/government-templates/TemplateGuide.tsx (downloadable PDF guides for each template)

#### Integration

- [ ] T057 [US2] Integrate government templates with editor store (template selection, multi-file formatting)
- [ ] T058 [US2] Add template-specific download naming (DL_Photo_3.5x4.5cm.jpg, DL_Document.pdf, etc.)
- [ ] T059 [US2] Implement batch template application (apply DL template to multiple photo+document pairs)
- [ ] T060 [US2] Add template compliance validation before download with clear error messages

**Checkpoint**: ✅ User Stories 1 AND 2 complete - MVP ready with image editing + government document formatting

---

## Phase 5: User Story 3 - Multi-File Batch Processing (Priority: P2)

**Goal**: Process multiple files simultaneously (up to 5 free tier, 25 premium) with individual progress tracking and ZIP download

**Independent Test**: Upload 20 mixed image files → Select all → Apply resize 1920×1080 + compress 70% + convert to JPG operations → Preview 3 random samples → Download all as ZIP → Verify all 20 files processed correctly

### Tests for User Story 3 (MANDATORY - TDD Required) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T061 [P] [US3] Unit test for batch processor in tests/unit/lib/batch-processor.test.ts (parallel processing, progress tracking, graceful failure)
- [ ] T062 [P] [US3] Unit test for ZIP generator in tests/unit/lib/zip-generator.test.ts (jszip wrapper, filename preservation, metadata)
- [ ] T063 [P] [US3] Unit test for batch queue manager in tests/unit/lib/batch-queue.test.ts (queue operations, priority, cancellation)
- [ ] T064 [P] [US3] Integration test for batch processing in tests/integration/batch-processing.test.ts (upload multiple → apply operations → download ZIP)
- [ ] T065 [US3] E2E test for User Story 3 in tests/e2e/user-story-3.spec.ts (complete batch workflow with 20 files)

### Implementation for User Story 3

#### Batch Processing Engine

- [ ] T066 [P] [US3] Implement batch processor in lib/client-processors/batch-processor.ts (parallel Web Worker processing, queue management, progress events)
- [ ] T067 [P] [US3] Implement batch queue manager in lib/utils/batch-queue.ts (queue operations, priority sorting, cancellation support)
- [ ] T068 [P] [US3] Implement ZIP generator in lib/utils/zip-generator.ts (jszip wrapper, preserve original filenames, add metadata)
- [ ] T069 [P] [US3] Implement graceful failure handler in lib/utils/batch-error-handler.ts (skip failed files, log errors, continue processing remaining)

#### UI Components for Batch Processing

- [ ] T070 [P] [US3] Create BatchProgressTracker component in components/batch/BatchProgressTracker.tsx (individual file progress bars, overall completion %)
- [ ] T071 [P] [US3] Create BatchPreview component in components/batch/BatchPreview.tsx (grid/list view, scroll through all previews, before/after toggle)
- [ ] T072 [P] [US3] Update FileList component in components/FileList.tsx to support multi-select (checkboxes, Ctrl+click, Shift+click, Select All/None buttons)
- [ ] T073 [P] [US3] Create BatchControlPanel component in components/batch/BatchControlPanel.tsx (apply to all, cancel batch, pause/resume)

#### Integration

- [ ] T074 [US3] Integrate batch processing with editor store (batch queue state, progress tracking, error aggregation)
- [ ] T075 [US3] Implement batch download with ZIP archive (filename: flowconvert_batch_YYYYMMDD_HHMMSS.zip)
- [ ] T076 [US3] Add free tier limits enforcement (5 files max, 150MB total) with upgrade prompts
- [ ] T077 [US3] Add premium tier support (25 files max, 5GB total) with feature flags

**Checkpoint**: ✅ Batch processing functional - users can process multiple files efficiently

---

## Phase 6: User Story 4 - Multi-Step Single File Workflow (Priority: P2)

**Goal**: Support complex multi-step workflows with operation history, undo/redo (Ctrl+Z/Y), and cumulative preview after each step

**Independent Test**: Upload 10MB PNG → Crop whitespace → Resize 512×512 → Convert to SVG → Compress → Undo crop → Re-crop correctly → Download → Verify all operations applied correctly

### Tests for User Story 4 (MANDATORY - TDD Required) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T078 [P] [US4] Unit test for operation history in tests/unit/lib/operation-history.test.ts (stack operations, undo/redo, state snapshots)
- [ ] T079 [P] [US4] Unit test for undo/redo manager in tests/unit/lib/undo-redo.test.ts (state restoration, rollback, re-apply)
- [ ] T080 [P] [US4] Unit test for operation queue in tests/unit/lib/operation-queue.test.ts (sequential application, chaining, cancellation)
- [ ] T081 [P] [US4] Integration test for multi-step workflow in tests/integration/multi-step-workflow.test.ts (apply 5 operations → undo 2 → redo 1)
- [ ] T082 [US4] E2E test for User Story 4 in tests/e2e/user-story-4.spec.ts (complete multi-step workflow with undo/redo via keyboard)

### Implementation for User Story 4

#### Operation Management

- [ ] T083 [P] [US4] Implement operation history manager in lib/stores/operation-history.ts (Zustand store for operation stack, undo/redo state)
- [ ] T084 [P] [US4] Implement undo/redo logic in lib/utils/undo-redo.ts (state snapshots via Canvas toDataURL, memory management, rollback)
- [ ] T085 [P] [US4] Implement operation queue in lib/stores/operation-queue.ts (sequential execution, apply one-by-one or all-together options)

#### UI Components for Workflow Management

- [ ] T086 [P] [US4] Create OperationHistory component in components/editor/OperationHistory.tsx (list all operations, click to undo to that point, timestamps)
- [ ] T087 [P] [US4] Create KeyboardShortcuts handler in components/KeyboardShortcuts.tsx (Ctrl+Z undo, Ctrl+Y redo, Ctrl+S download, Ctrl+O open, Ctrl+D duplicate)
- [ ] T088 [P] [US4] Update PreviewPanel to show cumulative result after each operation (operation badges, step-by-step comparison)
- [ ] T089 [P] [US4] Create OperationBadge component in components/ui/OperationBadge.tsx (compact operation summary: "Resized 1920×1080", "Compressed 80%")

#### Integration

- [ ] T090 [US4] Integrate operation history with editor store (sync history stack, undo/redo actions)
- [ ] T091 [US4] Add keyboard shortcut support throughout application (global event listeners, context-aware shortcuts)
- [ ] T092 [US4] Implement operation chaining with preview updates between steps (sequential Canvas operations)
- [ ] T093 [US4] Add operation confirmation modal for destructive operations (crop, rotate permanent changes)

**Checkpoint**: ✅ Complex multi-step workflows supported with full undo/redo capabilities

---

## Phase 7: User Story 5 - Document Details Replacement (Priority: P2)

**Goal**: Auto-detect and replace personal/academic fields (name, roll no, email, phone, class, designation) in DOCX/PDF with saved profiles or manual inline editing

**Independent Test**: Upload DOCX with "John Doe, Roll: 2024001, john@college.edu, 9876543210, CS-A" → System highlights all fields with 95%+ confidence → Select saved profile "Jane Smith" → All fields auto-replace → Live preview updates instantly → Download → Verify "Jane Smith, Roll: 2024042, jane@college.edu, 9123456789, CS-B" in output

### Tests for User Story 5 (MANDATORY - TDD Required) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T094 [P] [US5] Unit test for field detector in tests/unit/lib/field-detector.test.ts (regex patterns for name/roll/email/phone/class/designation)
- [ ] T095 [P] [US5] Unit test for profile manager in tests/unit/lib/profile-manager.test.ts (CRUD operations, localStorage persistence, validation)
- [ ] T096 [P] [US5] Unit test for document parser in tests/unit/lib/document-parser.test.ts (DOCX/PDF text extraction, preserve formatting)
- [ ] T097 [P] [US5] Integration test for document replacement in tests/integration/document-replacement.test.ts (upload → detect → replace → download)
- [ ] T098 [P] [US5] API test for document processing endpoint in tests/api/process-document.test.ts (server-side LibreOffice/POI integration)
- [ ] T099 [US5] E2E test for User Story 5 in tests/e2e/user-story-5.spec.ts (complete workflow with profile selection and manual editing)

### Implementation for User Story 5

#### Server-Side Document Processing

- [ ] T100 [P] [US5] Create document processing API route in app/api/process/document/route.ts (handle DOCX/PDF upload, return detected fields)
- [ ] T101 [P] [US5] Implement field detector in lib/server-processors/field-detector.ts (regex patterns: name, roll no \\d{7,10}, email, phone, class, designation)
- [ ] T102 [P] [US5] Implement document parser in lib/server-processors/document-parser.ts (LibreOffice headless for DOCX→text, pdf-parse for PDF, preserve positions)
- [ ] T103 [P] [US5] Implement encryption handler in lib/server-processors/encryption.ts (AES-256 encryption for uploads, secure temp storage)
- [ ] T104 [P] [US5] Implement auto-delete scheduler in lib/server-processors/auto-delete.ts (cron job <5min TTL, cleanup temp files)

#### Profile Management

- [ ] T105 [P] [US5] Implement profile manager in lib/utils/profile-manager.ts (CRUD operations, localStorage with 10 profile limit, export/import JSON)
- [ ] T106 [P] [US5] Implement profile validation in lib/utils/profile-validation.ts (required fields, email format, phone format, roll number format)
- [ ] T107 [P] [US5] Implement field matcher in lib/utils/field-matcher.ts (fuzzy matching for similar field names, confidence scoring 0-100%)

#### UI Components for Document Replacement

- [ ] T108 [P] [US5] Create SmartDocumentEditor component in components/SmartDocumentEditor.tsx (main container with field detection, profile selection)
- [ ] T109 [P] [US5] Create FieldDetector component in components/document-replacement/FieldDetector.tsx (highlight fields with colors: green 95%+, yellow 70-94%, red <70%)
- [ ] T110 [P] [US5] Create ProfileSelector component in components/document-replacement/ProfileSelector.tsx (dropdown with saved profiles, auto-fill on selection)
- [ ] T111 [P] [US5] Create FieldEditor component in components/document-replacement/FieldEditor.tsx (inline edit with hover ✏️ button, click to edit, instant updates)
- [ ] T112 [P] [US5] Create PreviewEditor component in components/document-replacement/PreviewEditor.tsx (Canva-style live preview, click any text to edit, real-time updates)
- [ ] T113 [P] [US5] Update ProfileManager component in components/ProfileManager.tsx (create/edit/delete profiles, import/export, set default)
- [ ] T114 [P] [US5] Create ConfidenceBadge component in components/ui/ConfidenceBadge.tsx (95%+ green ✓, 70-94% yellow ⚠, <70% red ✗ with confidence %)

#### Integration

- [ ] T115 [US5] Integrate field detection with editor store (detected fields array, confidence scores, replacement history)
- [ ] T116 [US5] Implement real-time preview updates as fields are edited (debounced updates, Canvas redrawing)
- [ ] T117 [US5] Add privacy indicators for server-side processing (cloud icon ☁️ with "Secure Server Processing", auto-delete countdown)
- [ ] T118 [US5] Implement "Replace all" vs "Replace selected" functionality (batch replace similar fields, undo support)
- [ ] T119 [US5] Add "Also found here" indicator for multiple instances of same field (highlight all occurrences, replace all option)

**Checkpoint**: ✅ Document personalization fully functional with smart field detection and profile management

---

## Phase 8: User Story 6 - Smart Search & Guided Assistance (Priority: P3)

**Goal**: Enable non-technical users to discover tools through natural language search and receive contextual guidance

**Independent Test**: Type "make my file smaller" in search → See "Compress" and "Resize" tool suggestions with explanations → Click "Compress" → See tooltip "Reduce file size by lowering quality. Start at 80% for best balance." → Apply 80% compression → Verify file size reduced

### Tests for User Story 6 (MANDATORY - TDD Required) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T120 [P] [US6] Unit test for search algorithm in tests/unit/lib/search-engine.test.ts (keyword matching, fuzzy search, synonym mapping)
- [ ] T121 [P] [US6] Unit test for tool suggestions in tests/unit/lib/tool-suggestions.test.ts (query → tool mapping, relevance scoring)
- [ ] T122 [P] [US6] Integration test for search functionality in tests/integration/smart-search.test.ts (search → suggestions → tool activation)
- [ ] T123 [US6] E2E test for User Story 6 in tests/e2e/user-story-6.spec.ts (complete search workflow from query to tool usage)

### Implementation for User Story 6

#### Search Engine & Tool Discovery

- [ ] T124 [P] [US6] Implement search engine in lib/utils/search-engine.ts (keyword matching with Fuse.js fuzzy search, synonym database)
- [ ] T125 [P] [US6] Implement tool suggester in lib/utils/tool-suggestions.ts (map queries to tools, relevance scoring, ranking algorithm)
- [ ] T126 [P] [US6] Create tool descriptions database in lib/data/tool-descriptions.ts (simple explanations for all 37+ tools, use cases, keywords)
- [ ] T127 [P] [US6] Create tooltip content database in lib/data/tooltip-content.ts (tool-specific guidance, recommended starting values)

#### UI Components for Search & Guidance

- [ ] T128 [P] [US6] Create SearchBar component in components/SearchBar.tsx (autocomplete with Ctrl+K shortcut, recent searches, suggestions dropdown)
- [ ] T129 [P] [US6] Create ToolSuggestions component in components/ToolSuggestions.tsx (highlight matching tools in navigation, relevance badges)
- [ ] T130 [P] [US6] Create ContextualTooltip component in components/ui/ContextualTooltip.tsx (appears on tool first-use, recommended values, tips)
- [ ] T131 [P] [US6] Create OnboardingTour component in components/OnboardingTour.tsx (first-time user guided tour, skip option, progress dots)
- [ ] T132 [P] [US6] Create HelpPanel component in components/HelpPanel.tsx (keyboard shortcuts, quick tips, video tutorials)

#### Integration

- [ ] T133 [US6] Integrate search with tool navigation (highlight matching tools, auto-scroll to tool, open tool panel)
- [ ] T134 [US6] Add contextual tooltips to all tool controls (quality sliders, dimension inputs, checkboxes)
- [ ] T135 [US6] Implement feedback form for "not available" searches (collect user requests, suggest roadmap features)
- [ ] T136 [US6] Add onboarding tour trigger for first-time users (localStorage flag, dismiss option, replay button)

**Checkpoint**: ✅ Smart search and guided assistance help users discover and use tools effectively

---

## Phase 9: User Story 7 - Mobile Integration & Gallery Access (Priority: P2)

**Goal**: Seamless mobile workflows with system share sheet integration, file associations, and camera/gallery access

**Independent Test**: (Mobile device) Select 3 photos in Photos app → Tap Share → Select "FlowConvert" → App opens with photos loaded → Convert to PDF → Reorder pages → Add title page → Download PDF → Verify PDF contains 3 photos + title page in correct order

### Tests for User Story 7 (MANDATORY - TDD Required) ⚠️

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T137 [P] [US7] Unit test for share handler in tests/unit/lib/share-handler.test.ts (parse shared files, validate types, extract metadata)
- [ ] T138 [P] [US7] Unit test for file association in tests/unit/lib/file-association.test.ts (supported MIME types, icon display)
- [ ] T139 [P] [US7] Integration test for share sheet workflow in tests/integration/mobile-integration.test.ts (share → receive → process)
- [ ] T140 [US7] E2E test for User Story 7 (mobile) in tests/e2e/user-story-7.spec.ts (Playwright mobile emulation, share sheet simulation)

### Implementation for User Story 7

#### PWA & Mobile Integration Infrastructure

- [ ] T141 [P] [US7] Create PWA manifest in public/manifest.json (share_target config, file_handlers for images/PDF/DOCX, icons 192x192/512x512)
- [ ] T142 [P] [US7] Implement share handler API route in app/api/share/route.ts (receive POST from share_target, parse FormData, redirect to editor)
- [ ] T143 [P] [US7] Configure file associations in public/manifest.json (handle MIME types: image/*, application/pdf, application/vnd.openxmlformats-officedocument.*)
- [ ] T144 [P] [US7] Implement service worker in public/sw.js (offline capability, cache strategies, background sync for file processing)
- [ ] T145 [P] [US7] Add iOS/Android install prompts in components/InstallPrompt.tsx (detect installable PWA, show install banner)

#### Mobile-Specific UI Components

- [ ] T146 [P] [US7] Create MobilePhotoSelector component in components/mobile/MobilePhotoSelector.tsx (camera, full gallery access, limited photos iOS, Files app)
- [ ] T147 [P] [US7] Create ImageToPDF component in components/ImageToPDF.tsx (drag to reorder pages, add title page, page numbers)
- [ ] T148 [P] [US7] Create CameraCapture component in components/mobile/CameraCapture.tsx (take photo, crop preview, add to current session)
- [ ] T149 [P] [US7] Update FileList for mobile (simplified batch controls, max 5 files on mobile, swipe to delete gestures)
- [ ] T150 [P] [US7] Create PermissionsHandler component in components/mobile/PermissionsHandler.tsx (request camera/gallery permissions, Settings deep link)

#### Integration

- [ ] T151 [US7] Integrate share sheet with file upload flow (receive shared files, load into editor, maintain share context)
- [ ] T152 [US7] Test file associations across file types (images → open in FlowConvert, PDF → open in FlowConvert, DOCX → open)
- [ ] T153 [US7] Implement camera capture functionality (request camera permission, capture, add to file list)
- [ ] T154 [US7] Implement gallery access with iOS privacy (limited photos picker, full access option, permissions UI)
- [ ] T155 [US7] Add "Open with FlowConvert" to file browsers (Files app, Google Drive, Dropbox via file_handlers)

**Checkpoint**: ✅ Mobile users have seamless system integration with share sheet and file associations

---

## Phase 10: Polish & Cross-Cutting Concerns ⚡ FINAL PHASE

**Purpose**: Accessibility, performance, security audits, documentation, and launch preparation

### Accessibility (WCAG 2.1 AA Compliance) ♿

- [ ] T156 [P] Run axe-core accessibility audit on all pages and fix critical/serious issues (color contrast, ARIA labels, heading hierarchy)
- [ ] T157 [P] Verify keyboard navigation works for all interactive elements (Tab order, Enter/Space activation, Escape to close modals)
- [ ] T158 [P] Test with screen readers (NVDA on Windows, JAWS, VoiceOver on macOS/iOS) and fix announcement issues
- [ ] T159 [P] Verify 44px minimum touch targets on all mobile buttons (resize small buttons, add padding to links)
- [ ] T160 [P] Add ARIA labels and live regions for dynamic content (file upload status, processing progress, error messages)
- [ ] T161 [P] Test high contrast mode support (Windows High Contrast, dark mode, forced colors)

### Performance Optimization ⚡

- [ ] T162 [P] Run Lighthouse audits and achieve target scores (Performance 90+, Accessibility 95+, Best Practices 100, SEO 95+)
- [ ] T163 [P] Implement code splitting for heavy libraries (lazy load Tesseract.js ~2-4MB, jsfeat ~200KB only when OCR/edge detection enabled)
- [ ] T164 [P] Optimize bundle size (<250KB initial excluding lazy-loaded, <100KB per route with dynamic imports)
- [ ] T165 [P] Implement service worker for aggressive caching (cache processed files, offline operation history)
- [ ] T166 [P] Optimize all UI images to WebP format (convert PNG/JPG assets, responsive images with srcset)
- [ ] T167 [P] Add resource hints (preconnect to CDN, prefetch critical routes, preload fonts)
- [ ] T168 [P] Implement virtual scrolling for large file lists (React Virtual for 100+ files, thumbnail lazy loading)

### Security Hardening 🔒

- [ ] T169 [P] Audit all client-side operations remain client-side (no unnecessary API calls, Canvas API only for image ops)
- [ ] T170 [P] Implement AES-256 encryption for server-side file uploads (crypto library, encrypt before upload, decrypt on server)
- [ ] T171 [P] Implement auto-delete scheduler for server files (<5min TTL, cron job cleanup, verification logging)
- [ ] T172 [P] Configure Content Security Policy headers (strict CSP, no inline scripts, nonce for inline styles)
- [ ] T173 [P] Verify TLS 1.3 minimum for all HTTPS (Vercel SSL config, HTTP Strict Transport Security header)
- [ ] T174 [P] Run security audit with Snyk (scan dependencies, fix high/critical vulnerabilities)
- [ ] T175 [P] Configure Dependabot for automated dependency updates (weekly scans, auto-merge minor/patch)
- [ ] T176 [P] Implement rate limiting for API endpoints (100 req/min per IP, prevent abuse, DDoS protection)

### Error Handling & Monitoring 📊

- [ ] T177 [P] Implement global error boundary with user-friendly fallback UI (catch React errors, show recovery options)
- [ ] T178 [P] Add comprehensive error handling for edge cases (corrupt files, network failures, quota exceeded, browser compat)
- [ ] T179 [P] Configure Sentry for error tracking (sanitize file data in events, capture user feedback, source maps)
- [ ] T180 [P] Add Vercel Analytics for Web Vitals monitoring (FCP, LCP, CLS, FID tracking, performance insights)
- [ ] T181 [P] Create public status page for uptime monitoring (Better Uptime or StatusPage, incident history, subscribe to updates)
- [ ] T182 [P] Implement structured logging (Winston or Pino, log levels, correlation IDs for request tracing)

### Documentation & Knowledge Base 📚

- [ ] T183 [P] Write developer quickstart guide in specs/001-file-editor/quickstart.md (setup, run locally, run tests, deploy)
- [ ] T184 [P] Generate API documentation using OpenAPI/Swagger (document all endpoints, request/response schemas, examples)
- [ ] T185 [P] Create user help documentation for all 37+ tools (markdown docs, screenshots, video tutorials)
- [ ] T186 [P] Write keyboard shortcuts guide (Ctrl+Z undo, Ctrl+Y redo, Ctrl+S download, Ctrl+K search, Ctrl+O open)
- [ ] T187 [P] Create Architecture Decision Records in specs/001-file-editor/adrs/ (ADR-001: Why client-side first, ADR-002: State management choice)
- [ ] T188 [P] Add inline code documentation (JSDoc for all public functions, type annotations, usage examples)
- [ ] T189 [P] Create component documentation with Storybook (visual component library, prop documentation, usage examples)

### User Onboarding & Education 🎓

- [ ] T190 [P] Implement first-time user onboarding tour (highlight key features, skip option, localStorage tracking)
- [ ] T191 [P] Add contextual help tooltips throughout app (info icons ℹ️, hover for explanations, first-use tips)
- [ ] T192 [P] Create About page (vision, privacy commitment, feature overview, team, roadmap)
- [ ] T193 [P] Create FAQ page (file limits, privacy, supported formats, pricing, troubleshooting)
- [ ] T194 [P] Add video tutorials for complex features (government templates, document replacement, batch processing)

### Production Deployment & Launch 🚀

- [ ] T195 Configure Vercel production deployment (environment variables, build optimization, edge functions)
- [ ] T196 [P] Configure Cloudflare CDN for static assets (aggressive caching, gzip/brotli compression, global distribution)
- [ ] T197 [P] Set up custom domain with SSL (flowconvert.com, HTTPS redirect, HSTS header, CAA DNS records)
- [ ] T198 [P] Implement uptime monitoring (Uptime Robot or Better Uptime, alert on >1min downtime, SMS/email notifications)
- [ ] T199 [P] Create rollback plan (Vercel instant rollback, database backups, feature flag kill switches)

### Final Testing & Launch 🎯

- [ ] T200 Run final cross-browser testing (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ on Windows/Mac)
- [ ] T201 Run final mobile testing (iPhone SE/13 Pro, Samsung Galaxy, iPad, landscape/portrait)
- [ ] T202 Verify all 27+ success criteria from spec.md (User Story acceptance scenarios, edge cases)
- [ ] T203 Run penetration testing (OWASP Top 10, file upload exploits, XSS, CSRF, SQL injection attempts)
- [ ] T204 Load testing (simulate 100 concurrent users, 1000 files/hour, verify <200ms p95 latency)
- [ ] T205 Deploy to production with staging verification (smoke tests on staging, blue-green deployment)
- [ ] T206 Monitor first 24 hours (error rates, performance metrics, user feedback, conversion funnel)
- [ ] T207 Prepare rollback plan and execute if >1% error rate (instant rollback, incident postmortem)

**Checkpoint**: ✅ Production-ready application - all 101 functional requirements + 15 privacy requirements implemented

---

## Dependencies & Execution Order

### Story Dependencies

```
Phase 1 (Setup) ✅ COMPLETE (User Story 0 - Dark Theme Dashboard)
    ↓
Phase 2 (Foundation T001-T015) → BLOCKING for ALL user stories
    ↓
┌─────────────────────────────────────────────────────────────┐
│  PARALLEL EXECUTION (after Foundation complete)             │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: US1 Image Edit (T016-T038) ← Independent        │
│  Phase 4: US2 Gov Templates (T039-T060) ← Uses US1 T021-T026│
│  Phase 5: US3 Batch (T061-T077) ← Independent              │
│  Phase 6: US4 Workflow (T078-T093) ← Independent           │
│  Phase 7: US5 Doc Replacement (T094-T119) ← Independent    │
│  Phase 8: US6 Search (T120-T136) ← Independent             │
│  Phase 9: US7 Mobile (T137-T155) ← Independent             │
└─────────────────────────────────────────────────────────────┘
    ↓
Phase 10: Polish (T156-T207) → Depends on ALL user stories complete
```

### Parallel Execution Opportunities

**Foundation (Phase 2)**: All T001-T015 can run in parallel (different files, no dependencies)

**User Story 1 (Phase 3)**:
- Tests T016-T020: All parallel
- Processors T021-T026: All parallel
- UI Components T027-T032: All parallel
- Integration T035-T038: Sequential (depends on T021-T032 complete)

**User Story 2 (Phase 4)**:
- Tests T039-T043: All parallel
- Templates T044-T048: All parallel
- Logic T049-T052: All parallel (T051 uses T021-T026 from US1)
- UI T053-T056: All parallel
- Integration T057-T060: Sequential

**User Stories 3-9**: Can ALL run in parallel after Phase 2, except US2 should wait for US1 image processing (T021-T026)

**Polish (Phase 10)**: Most tasks T156-T194 can run in parallel (different concerns), deployment T195-T207 must be sequential

---

## MVP Scope Recommendation 🎯

**Minimum Viable Product** (2-3 weeks):
1. ✅ **Phase 1**: Setup & US0 (COMPLETE - Dark Theme Dashboard)
2. ⚠️ **Phase 2**: Foundation (T001-T015) - REQUIRED
3. 🎯 **Phase 3**: User Story 1 (T016-T038) - Quick Single File Image Edit
4. 🎯 **Phase 4**: User Story 2 (T039-T060) - Government Document Auto-Formatting

**Rationale**: US1 (image editing) + US2 (government templates) are both P1 priority and provide immediate, differentiated value. Together they form a complete MVP that solves real user pain points.

**Post-MVP Roadmap** (incremental weekly releases):
- **Week 4**: Phase 5 - US3 Batch Processing (P2)
- **Week 5**: Phase 6 - US4 Multi-Step Workflows (P2) + Phase 7 - US5 Document Replacement (P2)
- **Week 6**: Phase 8 - US6 Smart Search (P3) + Phase 9 - US7 Mobile Integration (P2)
- **Week 6-7**: Phase 10 - Polish, Security, Performance, Launch

---

## Task Summary 📊

**Total Tasks**: 207
**Completed**: Phase 1 (User Story 0 - Dark Theme Dashboard) ✅
**Remaining**: 207 tasks across 9 phases

**Task Breakdown by Phase**:
- ✅ Phase 1 (Setup & US0): **COMPLETE**
- Phase 2 (Foundation): 15 tasks (T001-T015)
- Phase 3 (US1 Image Edit): 23 tasks (T016-T038)
- Phase 4 (US2 Gov Templates): 22 tasks (T039-T060)
- Phase 5 (US3 Batch): 17 tasks (T061-T077)
- Phase 6 (US4 Workflow): 16 tasks (T078-T093)
- Phase 7 (US5 Doc Replacement): 26 tasks (T094-T119)
- Phase 8 (US6 Search): 17 tasks (T120-T136)
- Phase 9 (US7 Mobile): 19 tasks (T137-T155)
- Phase 10 (Polish): 52 tasks (T156-T207)

**Parallelization**:
- ~75% of tasks within each phase can run in parallel
- All User Story phases (3-9) can run in parallel after Foundation complete
- MVP tasks (Phases 2-4): 60 tasks total

**Estimated Timeline**:
- **MVP** (Phases 2-4): 2-3 weeks with parallel development
- **Full Feature Set** (All phases): 6-7 weeks total
- **Polish & Launch** (Phase 10): 1 week after features complete

---

## Implementation Strategy 🎯

### Development Approach

1. **Foundation First** (Phase 2, T001-T015):
   - All developers work in parallel on different utilities
   - Code reviews for shared infrastructure (stores, types)
   - Establish testing patterns (TDD examples)

2. **MVP Focus** (Phases 3-4, T016-T060):
   - Prioritize US1 and US2 for quickest value delivery
   - Daily integration testing as features complete
   - User testing with real government document scenarios

3. **Parallel User Stories** (Phases 5-9, T061-T155):
   - Different developers take ownership of different stories
   - Weekly integration checkpoints
   - Independent testing per story

4. **Polish & Launch** (Phase 10, T156-T207):
   - Code freeze for new features
   - Focus on quality, security, performance
   - Staged rollout with monitoring

### Success Criteria (Constitution Compliance) ✅

Before launch, verify:
- ✅ All 207 tasks completed
- ✅ 80% test coverage overall, 100% for critical conversion paths
- ✅ Lighthouse scores: Performance 90+, Accessibility 95+, Best Practices 100, SEO 95+
- ✅ WCAG 2.1 AA compliance verified with axe-core and manual testing
- ✅ Bundle size: Initial <250KB (excluding Tesseract.js/jsfeat lazy-loaded)
- ✅ Performance: Client ops <3s for 10MB, Server ops <30s for 50MB
- ✅ Cross-browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ tested
- ✅ Mobile responsive: iPhone SE/13 Pro, Samsung Galaxy, iPad tested
- ✅ Security audit passed (Snyk, manual penetration testing)
- ✅ All 27+ success criteria from spec.md verified

---

## Next Steps

1. **Start with Foundation** (Phase 2): All developers can begin T001-T015 in parallel
2. **Set up TDD workflow**: Write failing tests first for every feature
3. **Daily standups**: Track progress, unblock dependencies
4. **Weekly demos**: Show completed user stories to stakeholders
5. **MVP target**: Complete Phases 2-4 in 2-3 weeks for initial launch
