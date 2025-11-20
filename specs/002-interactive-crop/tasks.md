# Tasks: Interactive Cropping Tool

**Input**: Design documents from `/specs/002-interactive-crop/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are MANDATORY and MUST be written BEFORE implementation. Minimum 80% coverage overall, 100% for critical crop operations.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app structure: `app/`, `components/`, `lib/`, `tests/` at repository root
- Paths assume Next.js 14 App Router structure per plan.md

---

## Phase 1: Image Cropping (User Story 1 - P0) 🎯 CRITICAL MVP

### Core Crop Component

- [ ] **T001** [P] [US1] Create `CropOverlay.tsx` component in `components/image-tools/CropOverlay.tsx` with draggable crop rectangle
- [ ] **T002** [P] [US1] Implement mouse event handlers for dragging crop rectangle corners in `CropOverlay.tsx`
- [ ] **T003** [P] [US1] Implement mouse event handlers for dragging crop rectangle edges in `CropOverlay.tsx`
- [ ] **T004** [P] [US1] Implement mouse event handlers for repositioning crop rectangle (center drag) in `CropOverlay.tsx`
- [ ] **T005** [P] [US1] Add visual feedback (highlighted border, dimmed outside area) to crop overlay in `CropOverlay.tsx`
- [ ] **T006** [P] [US1] Create `InteractiveCropTool.tsx` component in `components/image-tools/InteractiveCropTool.tsx` as main crop interface
- [ ] **T007** [US1] Integrate `CropOverlay` into `InteractiveCropTool` with image display
- [ ] **T008** [US1] Add real-time dimension display (width x height, x, y coordinates) in `InteractiveCropTool.tsx`

### Aspect Ratio Presets

- [ ] **T009** [P] [US1] Create `CropPresets.tsx` component in `components/image-tools/CropPresets.tsx` for preset selection
- [ ] **T010** [US1] Implement aspect ratio presets (1:1, 4:3, 16:9, 3:2, Free) in `CropPresets.tsx`
- [ ] **T011** [US1] Add aspect ratio locking logic in `InteractiveCropTool.tsx` (maintains ratio when preset selected)
- [ ] **T012** [US1] Implement "Free" mode to unlock aspect ratio in `InteractiveCropTool.tsx`

### Manual Input Controls

- [ ] **T013** [P] [US1] Add manual dimension input fields (x, y, width, height) in `InteractiveCropTool.tsx`
- [ ] **T014** [US1] Implement coordinate constraint logic (prevent crop area outside image bounds) in `InteractiveCropTool.tsx`
- [ ] **T015** [US1] Sync manual inputs with visual crop rectangle in `InteractiveCropTool.tsx`

### Integration & Actions

- [ ] **T016** [US1] Integrate `InteractiveCropTool` into `ImageTools.tsx` component (add crop tab/section)
- [ ] **T017** [US1] Connect crop tool to existing `cropImage` function in `lib/client-processors/image-processor.ts`
- [ ] **T018** [US1] Implement "Apply Crop" button action in `InteractiveCropTool.tsx`
- [ ] **T019** [US1] Implement "Cancel" button to reset crop and return to original image in `InteractiveCropTool.tsx`
- [ ] **T020** [US1] Add crop operation to editor store operation history for undo/redo support
- [ ] **T021** [US1] Update `ToolNavigation.tsx` to connect "Crop" tool button to `InteractiveCropTool`

### Image Format Support

- [ ] **T022** [P] [US1] Test crop functionality with PNG images (including transparency preservation)
- [ ] **T023** [P] [US1] Test crop functionality with JPG/JPEG images
- [ ] **T024** [P] [US1] Test crop functionality with WebP images
- [ ] **T025** [P] [US1] Test crop functionality with GIF images
- [ ] **T026** [P] [US1] Test crop functionality with BMP and TIFF images

### Testing - User Story 1

- [ ] **T027** [US1] Unit test for crop area calculation utilities in `tests/unit/utils/crop-utils.test.ts`
- [ ] **T028** [US1] Unit test for aspect ratio locking logic in `tests/unit/components/CropOverlay.test.tsx`
- [ ] **T029** [US1] Unit test for coordinate constraints in `tests/unit/components/InteractiveCropTool.test.tsx`
- [ ] **T030** [US1] Integration test for image crop workflow in `tests/integration/image-crop.test.ts` (upload → crop → apply → download)
- [ ] **T031** [US1] E2E test for User Story 1 in `tests/e2e/user-story-1-crop.spec.ts` (complete crop workflow, verify output)

---

## Phase 2: PDF Cropping (User Story 2 - P1) 🎯 MVP

### PDF Crop Component

- [ ] **T032** [P] [US2] Create `PDFCropTool.tsx` component in `components/pdf-tools/PDFCropTool.tsx` for PDF cropping
- [ ] **T033** [US2] Implement PDF page rendering with canvas in `PDFCropTool.tsx`
- [ ] **T034** [US2] Integrate `CropOverlay` component for PDF pages in `PDFCropTool.tsx`
- [ ] **T035** [US2] Add page navigation controls (previous/next page) in crop mode in `PDFCropTool.tsx`
- [ ] **T036** [US2] Display current page number and total pages in `PDFCropTool.tsx`

### PDF Crop Application

- [ ] **T037** [US2] Implement "Apply to all pages" option in `PDFCropTool.tsx`
- [ ] **T038** [US2] Implement "Apply to current page only" option in `PDFCropTool.tsx`
- [ ] **T039** [US2] Add per-page crop area storage (allow different crops per page) in `PDFCropTool.tsx`
- [ ] **T040** [US2] Create PDF crop function in `lib/client-processors/pdf-processor.ts` using pdf-lib's `setCropBox`
- [ ] **T041** [US2] Implement crop application to PDF pages with progress indicator in `PDFCropTool.tsx`
- [ ] **T042** [US2] Preserve PDF metadata and structure after cropping in `lib/client-processors/pdf-processor.ts`

### Integration

- [ ] **T043** [US2] Integrate `PDFCropTool` into `PDFTools.tsx` component (add crop option in PDF Editor)
- [ ] **T044** [US2] Update `ToolNavigation.tsx` to connect PDF Editor "Crop" tool to `PDFCropTool`
- [ ] **T045** [US2] Add PDF crop operation to editor store operation history for undo/redo support

### PDF Edge Cases

- [ ] **T046** [P] [US2] Handle PDFs with different page sizes (A4, Letter, custom) in `PDFCropTool.tsx`
- [ ] **T047** [P] [US2] Handle large PDFs (100+ pages) with batch processing and progress indicators
- [ ] **T048** [P] [US2] Test PDF cropping preserves text selectability after crop
- [ ] **T049** [P] [US2] Test PDF cropping with mixed content (text, images, forms)

### Testing - User Story 2

- [ ] **T050** [US2] Unit test for PDF crop function in `tests/unit/lib/pdf-processor-crop.test.ts`
- [ ] **T051** [US2] Integration test for PDF crop workflow in `tests/integration/pdf-crop.test.ts` (upload → crop → apply to all → download)
- [ ] **T052** [US2] E2E test for User Story 2 in `tests/e2e/user-story-2-pdf-crop.spec.ts` (complete PDF crop workflow, verify all pages)

---

## Phase 3: Advanced Features (User Story 3 - P2)

### Custom Presets

- [ ] **T053** [P] [US3] Implement save custom preset functionality in `CropPresets.tsx` (store in localStorage)
- [ ] **T054** [US3] Implement load custom presets from localStorage in `CropPresets.tsx`
- [ ] **T055** [US3] Add preset management UI (edit, delete custom presets) in `CropPresets.tsx`
- [ ] **T056** [US3] Display custom presets alongside default presets in `CropPresets.tsx`

### Previous Dimensions

- [ ] **T057** [US3] Implement "Use previous crop dimensions" feature in `InteractiveCropTool.tsx`
- [ ] **T058** [US3] Store last used crop dimensions in component state or localStorage
- [ ] **T059** [US3] Apply previous dimensions when user selects the option

### Batch Cropping

- [ ] **T060** [US3] Implement batch crop with same dimensions across multiple images in `InteractiveCropTool.tsx`
- [ ] **T061** [US3] Add "Apply same crop to all selected images" option
- [ ] **T062** [US3] Show progress indicator for batch crop operations

### Keyboard & Touch Support

- [ ] **T063** [P] [US3] Implement keyboard shortcuts (arrow keys for fine-tuning crop position/size) in `CropOverlay.tsx`
- [ ] **T064** [US3] Add touch event handlers for mobile devices in `CropOverlay.tsx`
- [ ] **T065** [US3] Optimize touch targets for mobile (larger handles, easier dragging) in `CropOverlay.tsx`
- [ ] **T066** [US3] Test crop tool on touch devices (tablets, phones)

### Zoom Controls

- [ ] **T067** [P] [US3] Add zoom controls for detailed crop adjustments in `InteractiveCropTool.tsx`
- [ ] **T068** [US3] Implement zoom in/out functionality with mouse wheel or buttons
- [ ] **T069** [US3] Maintain crop area position during zoom operations

### Testing - User Story 3

- [ ] **T070** [US3] Unit test for preset save/load functionality in `tests/unit/components/CropPresets.test.tsx`
- [ ] **T071** [US3] Integration test for batch cropping in `tests/integration/batch-crop.test.ts`
- [ ] **T072** [US3] E2E test for User Story 3 in `tests/e2e/user-story-3-advanced-crop.spec.ts` (presets, batch, keyboard)

---

## Edge Cases & Error Handling

- [ ] **T073** [P] Handle very small images (<100x100) with warning message
- [ ] **T074** [P] Handle crop area outside image bounds (auto-constrain)
- [ ] **T075** [P] Handle large PDFs with progress indicators and batch processing
- [ ] **T076** [P] Handle memory limits for high-resolution images (50MP+)
- [ ] **T077** [P] Handle undo after multiple crops (operation history)
- [ ] **T078** [P] Handle transparent PNG cropping (preserve alpha channel)
- [ ] **T079** [P] Handle PDFs with mixed page sizes appropriately
- [ ] **T080** [P] Add error handling for crop operation failures

---

## Documentation

- [ ] **T081** Update component documentation with crop tool usage
- [ ] **T082** Add crop tool to user guide/documentation
- [ ] **T083** Document preset management features
- [ ] **T084** Document keyboard shortcuts for crop tool

---

## Performance Optimization

- [ ] **T085** Optimize canvas rendering with requestAnimationFrame for smooth interaction
- [ ] **T086** Implement debounced preview updates to prevent lag
- [ ] **T087** Add lazy loading for large PDFs in crop mode
- [ ] **T088** Optimize memory usage for high-resolution image cropping

---

## Summary

**Total Tasks**: 88
**Phase 1 (Image Cropping - P0)**: 31 tasks
**Phase 2 (PDF Cropping - P1)**: 21 tasks
**Phase 3 (Advanced Features - P2)**: 20 tasks
**Edge Cases & Other**: 16 tasks

**Priority Order**:
1. Phase 1 (Image Cropping) - Critical MVP
2. Phase 2 (PDF Cropping) - MVP
3. Phase 3 (Advanced Features) - Enhancement

---

## Bug Fixes (2025-11-18) ✅ COMPLETED

### Issue 1: First Page Not Rendering on PDF Upload
- [x] **BUG001** [P0] [CRITICAL] Remove complex lazy rendering with IntersectionObserver from `components/MainWorkspace.tsx`
- [x] **BUG002** [P0] [CRITICAL] Simplify PDF rendering to single-page view in `components/MainWorkspace.tsx`
- [x] **BUG003** [P0] [CRITICAL] Implement immediate first-page rendering in `components/MainWorkspace.tsx`
- [x] **BUG004** [P0] [CRITICAL] Remove unused state (`thumbnails`, `pageRefs`, `renderedPages`) from `components/MainWorkspace.tsx`

### Issue 2: Blank Page After Exiting E-Sign Tool
- [x] **BUG005** [P0] [CRITICAL] Add `selectedTool` to PDF rendering effect dependencies in `components/MainWorkspace.tsx`
- [x] **BUG006** [P0] [CRITICAL] Create list of custom workspace tools (crop, editor-esign, ocr-scan, etc.) in `components/MainWorkspace.tsx`
- [x] **BUG007** [P0] [CRITICAL] Implement logic to skip PDF rendering only for custom workspace tools in `components/MainWorkspace.tsx`
- [x] **BUG008** [P0] [CRITICAL] Add 50ms delay to ensure canvas is in DOM after tool exit in `components/MainWorkspace.tsx`

### Issue 3: Vertical Scroll Not Working in PDF Tools Sidebar
- [x] **BUG009** [P0] [CRITICAL] Add `h-full` class to root div in `components/FileDetailsSidebar.tsx` for height constraint
- [x] **BUG010** [P0] [CRITICAL] Verify nested flex structure maintains `overflow-hidden` on parent in `components/FileDetailsSidebar.tsx`
- [x] **BUG011** [P0] [CRITICAL] Ensure scrollable child has `overflow-y-auto` class in `components/FileDetailsSidebar.tsx`
- [x] **BUG012** [P0] [CRITICAL] Remove conflicting overflow styles from `components/PDFToolsSidebar.tsx`

### Testing & Validation
- [x] **BUG013** [P0] [CRITICAL] Test PDF upload shows first page immediately
- [x] **BUG014** [P0] [CRITICAL] Test E-Sign tool exit returns to correct page view
- [x] **BUG015** [P0] [CRITICAL] Test vertical scrolling in all PDF tools (Split, Merge, Extract, Compress, Organize)
- [x] **BUG016** [P0] [CRITICAL] Test PDF tools show PDF preview in background
- [x] **BUG017** [P0] [CRITICAL] Verify page navigation works after exiting tools

### Files Modified
- `components/MainWorkspace.tsx` - Fixed PDF rendering logic
- `components/FileDetailsSidebar.tsx` - Fixed scrolling layout
- `components/PDFToolsSidebar.tsx` - Removed conflicting styles
- `specs/002-interactive-crop/plan.md` - Documented bug fixes
- `specs/002-interactive-crop/tasks.md` - Added bug fix tasks

