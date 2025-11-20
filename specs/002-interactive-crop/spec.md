# Feature Specification: Interactive Cropping Tool

**Feature Branch**: `002-interactive-crop`
**Created**: 2025-01-27
**Status**: Specification
**Input**: Add interactive cropping tool to this project, to images and PDFs too

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Image Cropping (Priority: P0) 🎯 CRITICAL MVP

A user uploads a photo and wants to crop it to remove unwanted edges. They select the "Crop" tool from the Images tab, and an interactive cropping interface appears. They see their image with a draggable crop rectangle overlay. They can click and drag the corners or edges of the crop area to adjust the selection. As they drag, they see real-time preview of what will be cropped. They can also select preset aspect ratios (1:1, 4:3, 16:9, 3:2) which locks the crop area to that ratio. Once satisfied, they click "Apply Crop" and the image is cropped immediately. They can preview the result and download the cropped image.

**Why this priority**: Interactive cropping is a fundamental image editing feature that users expect. The visual, drag-to-select interface is more intuitive than entering pixel coordinates manually.

**Independent Test**: Upload image → Select Crop tool → Drag crop rectangle → Adjust corners → Select aspect ratio preset → Apply crop → Preview → Download → Verify cropped image matches selection

**Acceptance Scenarios**:

1. **Given** a user has uploaded an image, **When** they select the "Crop" tool, **Then** an interactive cropping interface appears with the image displayed and a draggable crop rectangle overlay
2. **Given** a user is in crop mode, **When** they click and drag the corners of the crop rectangle, **Then** the crop area resizes proportionally and shows real-time preview
3. **Given** a user is adjusting the crop area, **When** they drag the edges (not corners), **Then** only that edge moves, allowing asymmetric cropping
4. **Given** a user wants a specific aspect ratio, **When** they select a preset (1:1, 4:3, 16:9, 3:2), **Then** the crop rectangle locks to that aspect ratio and maintains it while dragging
5. **Given** a user has selected an aspect ratio preset, **When** they want freeform cropping, **Then** they can click "Free" or "Custom" to unlock the aspect ratio
6. **Given** a user is cropping, **When** they move the entire crop rectangle, **Then** they can click and drag the center area to reposition without resizing
7. **Given** a user has adjusted the crop area, **When** they click "Apply Crop", **Then** the image is cropped to the selected area and the result is displayed
8. **Given** a user has applied a crop, **When** they click "Undo", **Then** the crop is reverted and they return to the original image
9. **Given** a user is cropping, **When** they view the crop area, **Then** they see pixel dimensions (width x height) and coordinates displayed
10. **Given** a user wants precise cropping, **When** they use the crop tool, **Then** they can manually enter pixel values for x, y, width, and height

---

### User Story 2 - PDF Page Cropping (Priority: P1) 🎯 MVP

A user has a PDF document with unwanted margins on each page. They select the "Crop" tool from the PDF Editor tab, and the first page of the PDF is displayed. They see a draggable crop rectangle overlay. They adjust the crop area to remove the margins, and can choose to apply the crop to all pages or just the current page. They preview the result, and when satisfied, apply the crop. The PDF is updated with all pages cropped to the same area.

**Why this priority**: PDF cropping is essential for removing margins, focusing on specific content, or standardizing page sizes. Users frequently need to crop scanned documents or PDFs with inconsistent margins.

**Independent Test**: Upload PDF → Select Crop tool → Adjust crop rectangle on first page → Choose "Apply to all pages" → Preview → Apply crop → Download → Verify all pages cropped correctly

**Acceptance Scenarios**:

1. **Given** a user has uploaded a PDF, **When** they select the "Crop" tool from PDF Editor, **Then** the first page is displayed with an interactive crop rectangle overlay
2. **Given** a user is cropping a PDF, **When** they adjust the crop area on the first page, **Then** they see a preview of how the cropped page will look
3. **Given** a user has adjusted the crop area, **When** they choose "Apply to all pages", **Then** the same crop area is applied to every page in the PDF
4. **Given** a user wants to crop only specific pages, **When** they select "Apply to current page only", **Then** only the displayed page is cropped
5. **Given** a user is cropping a multi-page PDF, **When** they navigate between pages, **Then** they can see the crop area on each page and adjust it individually if needed
6. **Given** a user has applied crop to all pages, **When** they preview the PDF, **Then** all pages show the cropped result
7. **Given** a user wants to crop different areas on different pages, **When** they use the crop tool, **Then** they can set a crop area per page before applying
8. **Given** a user has cropped a PDF, **When** they download it, **Then** the PDF file size may be reduced if significant margins were removed

---

### User Story 3 - Advanced Cropping Features (Priority: P2)

A professional user needs to crop multiple images with the same dimensions for a social media campaign. They crop the first image to 1080x1080 (Instagram square), and the system remembers these dimensions. When they crop the next image, they can select "Use previous crop dimensions" to quickly apply the same crop area. They can also save custom crop presets with names like "Instagram Post" or "Facebook Cover" for future use.

**Why this priority**: Power users and professionals need efficiency features like saved presets and dimension memory. This enhances productivity for batch operations but is secondary to basic cropping functionality.

**Independent Test**: Crop first image to 1080x1080 → Crop second image using "Use previous dimensions" → Save custom preset "Instagram Post" → Crop third image using saved preset → Verify all images have same dimensions

**Acceptance Scenarios**:

1. **Given** a user has cropped an image, **When** they start cropping another image, **Then** they see an option to "Use previous crop dimensions" which applies the same width/height/aspect ratio
2. **Given** a user has set a crop area, **When** they click "Save as Preset", **Then** they can name the preset (e.g., "Instagram Post") and it's saved for future use
3. **Given** a user has saved crop presets, **When** they open the crop tool, **Then** they see their custom presets alongside default aspect ratio presets
4. **Given** a user selects a saved preset, **When** they apply it, **Then** the crop rectangle adjusts to match the preset dimensions
5. **Given** a user wants to manage presets, **When** they view saved presets, **Then** they can edit or delete custom presets
6. **Given** a user is batch cropping, **When** they apply the same crop to multiple images, **Then** all images are cropped to identical dimensions

---

### Edge Cases

- **Very small images**: What happens when user tries to crop an image smaller than 100x100 pixels? System shows warning: "Image too small for cropping. Minimum crop size is 50x50 pixels."
- **Crop area outside image bounds**: What happens when user drags crop rectangle beyond image edges? System constrains crop area to image boundaries automatically.
- **Large PDF files**: What happens when user tries to crop a 100-page PDF? System shows progress indicator and processes pages in batches to prevent browser freeze.
- **Aspect ratio on rotated images**: What happens when user crops a rotated image with aspect ratio locked? System maintains aspect ratio relative to the displayed orientation.
- **Memory limits**: What happens when cropping very high-resolution images (50MP+)? System may need to process in chunks or show warning about performance.
- **Undo after multiple crops**: What happens when user applies crop, then applies another crop, then clicks undo? System reverts to state before the most recent crop operation.
- **Crop on transparent images**: What happens when cropping PNG with transparency? System preserves transparency in the cropped result.
- **PDF with different page sizes**: What happens when PDF has mixed page sizes (A4, Letter)? System allows per-page crop adjustment or warns about inconsistent results.
- **Touch devices**: What happens when user tries to crop on mobile/tablet? Interface adapts with larger touch targets and simplified controls.
- **Keyboard navigation**: What happens when user wants to adjust crop with keyboard? System supports arrow keys for fine-tuning crop position and size.

## Requirements *(mandatory)*

### Functional Requirements

#### Image Cropping

- **FR-001**: System MUST provide an interactive cropping interface for images with a draggable crop rectangle overlay
- **FR-002**: System MUST allow users to resize the crop area by dragging corners (proportional resize) or edges (single-axis resize)
- **FR-003**: System MUST allow users to reposition the crop area by clicking and dragging the center region
- **FR-004**: System MUST provide preset aspect ratio options: 1:1 (Square), 4:3, 16:9, 3:2, and "Free" (unlocked)
- **FR-005**: System MUST lock the crop area to the selected aspect ratio when a preset is chosen
- **FR-006**: System MUST display real-time preview of the crop area as the user adjusts it
- **FR-007**: System MUST show pixel dimensions (width x height) and coordinates (x, y) of the crop area
- **FR-008**: System MUST allow manual entry of crop parameters (x, y, width, height) for precise control
- **FR-009**: System MUST constrain the crop area to image boundaries (prevent cropping outside the image)
- **FR-010**: System MUST preserve image quality when cropping (no quality loss from the crop operation itself)
- **FR-011**: System MUST support cropping for all supported image formats (PNG, JPG, JPEG, WebP, GIF, BMP, TIFF)
- **FR-012**: System MUST preserve transparency when cropping PNG images with alpha channel
- **FR-013**: System MUST provide "Apply Crop" button to execute the crop operation
- **FR-014**: System MUST provide "Cancel" or "Reset" button to discard crop changes and return to original image
- **FR-015**: System MUST support undo/redo for crop operations within the operation history

#### PDF Cropping

- **FR-016**: System MUST provide an interactive cropping interface for PDF documents
- **FR-017**: System MUST display the first page of the PDF with a draggable crop rectangle overlay
- **FR-018**: System MUST allow navigation between PDF pages while in crop mode
- **FR-019**: System MUST provide option to "Apply crop to all pages" or "Apply to current page only"
- **FR-020**: System MUST allow per-page crop adjustment for multi-page PDFs
- **FR-021**: System MUST show preview of cropped page before applying
- **FR-022**: System MUST maintain PDF quality and text selectability after cropping
- **FR-023**: System MUST handle PDFs with different page sizes and allow appropriate cropping per page
- **FR-024**: System MUST update PDF file size appropriately after cropping (may reduce size if margins removed)

#### Advanced Features

- **FR-025**: System MUST remember the last used crop dimensions and offer "Use previous dimensions" option
- **FR-026**: System MUST allow users to save custom crop presets with custom names
- **FR-027**: System MUST display saved custom presets alongside default aspect ratio presets
- **FR-028**: System MUST allow users to edit and delete saved custom presets
- **FR-029**: System MUST support batch cropping with same dimensions across multiple images
- **FR-030**: System MUST provide keyboard shortcuts for crop adjustments (arrow keys for fine-tuning)

#### User Interface

- **FR-031**: System MUST provide clear visual feedback for the crop area (highlighted rectangle, dimmed outside area)
- **FR-032**: System MUST make crop handles (corners and edges) easily draggable with appropriate size for mouse and touch
- **FR-033**: System MUST adapt the interface for touch devices with larger touch targets
- **FR-034**: System MUST provide tooltips or help text explaining how to use the crop tool
- **FR-035**: System MUST show crop area dimensions and coordinates in real-time as user adjusts
- **FR-036**: System MUST provide zoom controls when cropping to allow precise adjustments on detailed images

#### Performance & Quality

- **FR-037**: System MUST process image crops in under 2 seconds for images up to 10MB
- **FR-038**: System MUST process PDF crops in under 5 seconds for PDFs up to 50 pages
- **FR-039**: System MUST handle large PDFs (100+ pages) with progress indicators and batch processing
- **FR-040**: System MUST maintain image quality without compression artifacts from the crop operation
- **FR-041**: System MUST handle high-resolution images (up to 50MP) with appropriate performance considerations

### Quality & Performance Requirements

- **QP-001**: Crop operation MUST complete in under 2 seconds for typical images (under 10MB)
- **QP-002**: PDF crop operation MUST complete in under 5 seconds for typical PDFs (under 50 pages, 20MB)
- **QP-003**: Interface MUST remain responsive during crop adjustments (60fps interaction, no lag)
- **QP-004**: Large PDF processing MUST show progress indicator and not freeze the browser
- **QP-005**: Crop area adjustments MUST respond immediately to user input (no noticeable delay)

### Key Entities

- **Crop Area**: Defined region with properties (x, y, width, height, aspectRatio, locked)
- **Crop Preset**: Saved crop configuration with name, dimensions, aspect ratio, applicable to images or PDFs
- **Crop Operation**: Operation in history with crop parameters, applied to file, reversible via undo
- **PDF Crop Settings**: Per-page or global crop configuration for multi-page PDFs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users complete image cropping in under 20 seconds from tool selection to applied crop (upload → select crop → adjust → apply)
- **SC-002**: 95% of users successfully crop an image on first attempt without confusion
- **SC-003**: PDF cropping reduces file size by average of 15% when removing margins (measured on typical scanned documents)
- **SC-004**: Crop tool is used by 70%+ of users who edit images, indicating it's a core feature
- **SC-005**: Users apply aspect ratio presets in 60%+ of crop operations, showing preset feature is valuable
- **SC-006**: Custom crop presets are created and reused by 30%+ of power users, indicating advanced feature adoption
- **SC-007**: Batch cropping with same dimensions reduces workflow time by 50% compared to manual per-image cropping
- **SC-008**: Crop operations complete successfully 98%+ of the time without errors
- **SC-009**: Touch device users complete cropping tasks at 90% success rate of desktop users
- **SC-010**: Undo feature is used in 25%+ of crop sessions, indicating users value the ability to correct mistakes

## Out of Scope

The following features are explicitly **NOT** included in this feature:

- **Automatic content-aware cropping**: AI-powered smart cropping that detects subjects and suggests crop areas
- **Circular or custom shape cropping**: Only rectangular crop areas are supported
- **Crop with rotation**: Rotation must be applied separately before or after cropping
- **Batch crop with different dimensions per file**: Each file must be cropped individually or with same dimensions
- **Crop templates from external sources**: Only user-created presets are supported
- **Collaborative cropping**: No real-time multi-user crop editing
- **Crop history beyond undo/redo**: No saved history of all crop operations over time

## Assumptions

1. **Target use cases**: Primary use is removing unwanted edges, focusing on subjects, and standardizing image dimensions for social media or documents
2. **User familiarity**: Users are familiar with basic drag-and-drop interactions and understand crop rectangle concept
3. **Device support**: Desktop and mobile devices are supported, with touch-optimized interface for mobile
4. **File formats**: All currently supported image formats (PNG, JPG, WebP, GIF, BMP, TIFF) support cropping
5. **PDF complexity**: PDFs may contain text, images, or mixed content; cropping should preserve all content types
6. **Performance baseline**: Users have modern devices capable of handling image manipulation in browser
7. **Privacy**: All cropping happens client-side in the browser; no server processing required
8. **Aspect ratio usage**: Users frequently need standard aspect ratios (1:1, 16:9) for social media and documents

## Dependencies

**Client-Side Processing Libraries**:
- `pdf-lib` - PDF manipulation and page cropping (already in use)
- Canvas API - Image cropping and manipulation (browser native)
- Existing image processor utilities in `lib/client-processors/image-processor.ts`

**Existing Components**:
- ImageTools component for image editing interface
- PDFTools component for PDF editing interface
- Editor store for file management and operation history
- Preview components for showing crop results

## Technical Notes

- Image cropping uses HTML5 Canvas API for client-side processing
- PDF cropping uses pdf-lib library's page cropping capabilities
- Crop area is defined by coordinates (x, y) and dimensions (width, height)
- Aspect ratio locking maintains width/height ratio while allowing size adjustment
- Custom presets are stored in browser localStorage for persistence
- Crop operations are added to file operation history for undo/redo support

