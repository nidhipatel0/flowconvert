# Feature Specification: Universal File Editor Platform (Smallpdf Parity + Enhancements)

**Feature Branch**: `001-file-editor`
**Created**: 2025-11-06
**Updated**: 2025-11-07 (Smallpdf Feature Parity)
**Status**: Comprehensive Specification
**Input**: Complete file editing platform matching/exceeding Smallpdf with 37+ tools:

**Core Features**:
- ✅ Image Operations: Convert (PNG/JPG/WebP/GIF), compress, resize (pixel/%), crop, rotate, flip
- ✅ PDF Conversion: PDF ↔ Word/Excel/PowerPoint/Images with formatting preservation
- ✅ PDF Compression: Advanced quality control (Low/Recommended/High Quality)
- ✅ PDF Organization: Merge, split, extract pages, rotate, delete, reorder (drag-drop thumbnails)
- ✅ PDF Editing: Annotate (text/highlight/shapes), watermark (text/image), crop, redact, page numbers
- ✅ PDF Forms: Fill forms, create form fields (text/checkbox/radio/dropdown/signature)
- ✅ PDF Security: Unlock (remove password), protect (add password/permissions), flatten
- ✅ PDF Reader: Navigate, zoom, search, thumbnail sidebar
- ✅ E-Signatures: Draw, upload, type signatures with positioning
- ✅ AI Tools: Summarize PDFs, translate (50+ languages), chat with PDF, generate quiz questions
- ✅ OCR: Make scanned documents searchable with Tesseract.js
- ✅ Document Templates: Auto-format Indian government docs (DL, Passport, Aadhar, PAN, OCI)
- ✅ Document Replacement: Auto-detect and replace personal/academic details with saved profiles
- ✅ Edge Detection: Auto-detect document boundaries with perspective correction
- ✅ Batch Processing: Process 5 files simultaneously (free tier), ZIP download
- ✅ Workflow Presets: Save and apply operation sequences ("Instagram Post", "Government Doc", etc.)
- ✅ Modern UI: Tool navigation bar, horizontal file cards, percentage/pixel toggle, improved error handling
- ✅ Privacy-First: Client-side processing for images and basic PDFs, encrypted server-side only when necessary

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Dark Theme Dashboard with Horizontal Toolbar & Dynamic Tools (Priority: P0) 🎯 CRITICAL MVP

A user visits FlowConvert and sees a professional dark teal dashboard (#0d3333) matching the reference design. At the top are tabs ("Images", "Pdf", "Compress") with Preview/Download buttons on the right. Below the tabs is a horizontal toolbar with category labels (CONVERT, SIZE CHANGE, EDIT, COMPRESS) and icon-based tool buttons underneath each category - these tools change dynamically based on the selected tab. For example, when "Images" is active, they see Convert (PNG↔JPG, etc.), Size Change (Resize, Crop, Compress), and Edit (Rotate, Flip, Filters) tools. When "Pdf" is active, they see all PDF-specific tools (Merge, Split, OCR, E-Sign, Annotate, etc.). The central area shows "Drop your files here" with "or click to browse from your computer" below it. Once the user uploads files, the upload zone disappears and transforms into a workspace area with file cards/thumbnails, and an "Add More Files" button appears in the top-right corner. A "100% Private & Secure" badge with explanation text is prominently displayed, reassuring users about local processing.

**Why this priority**: Visual design and layout are the first impression. The horizontal toolbar with context-aware tool visibility (showing only relevant tools per tab) prevents overwhelming users while keeping all functions discoverable. The workspace transformation after upload maximizes screen space for editing. This professional, clean interface directly impacts user trust and engagement.

**Independent Test**: Load homepage → Verify dark teal background → Verify tabs at top → Verify horizontal toolbar with dynamic tools → Switch between tabs and confirm tool categories change → Upload a file → Verify upload zone disappears and workspace appears → Verify "Add More Files" button present → Confirm all previously built tools (e-sign, OCR, etc.) are visible in appropriate tabs

**Acceptance Scenarios**:

1. **Given** a user visits FlowConvert homepage, **When** the page loads, **Then** the background is dark teal (#0d3333) and the interface matches the reference design layout
2. **Given** a user views the top bar, **When** they look at navigation, **Then** tabs ("Images", "Pdf", "Compress") are visible on the left with "Preview" and "Download" buttons on the right
3. **Given** a user views the horizontal toolbar below tabs, **When** "Images" tab is active, **Then** they see category labels (CONVERT, SIZE CHANGE, EDIT) with relevant tool icons (PNG→JPG, Resize, Crop, Rotate, Flip, Filters, etc.) displayed below each category
4. **Given** a user clicks the "Pdf" tab, **When** the tab activates, **Then** the toolbar updates to show PDF-specific categories (CONVERT, COMPRESS, ORGANIZE, EDIT, SIGN, SECURE, OCR, AI) with tools like Merge, Split, Compress PDF, E-Signature, OCR, Annotate, Watermark, Protect, Unlock, Chat with PDF, etc.
5. **Given** a user clicks the "Compress" tab, **When** the tab activates, **Then** the toolbar shows compression tools (Image Compress, PDF Compress, Batch Compress, Target Size) with quality control options
6. **Given** a user views the central area before uploading, **When** they see the upload zone, **Then** primary text "Drop your files here" and secondary text "or click to browse from your computer" are displayed
7. **Given** a user uploads one or more files, **When** upload completes, **Then** the upload zone disappears and the central area transforms into a workspace showing file cards/thumbnails with file details
8. **Given** a user has uploaded files and is in workspace mode, **When** they want to add more files, **Then** an "Add More Files" button is visible in the top-right corner of the workspace area
9. **Given** a user concerned about privacy, **When** they view the interface, **Then** a "100% Private & Secure" badge with lock icon and explanation text "All processing happens locally in your browser. Your files never leave your computer." is prominently displayed
10. **Given** a user browses through all tabs, **When** they review available tools, **Then** ALL previously implemented functions (E-Signature, OCR, Document Replacement, Government Templates, Image-to-PDF, Batch Processing, Workflow Presets, PDF Annotation, Watermark, Form Filling, etc.) are visible and accessible in their respective tab categories with no functions hidden or forgotten

---

### User Story 1 - Quick Single File Edit (Priority: P1) 🎯 MVP

A user needs to quickly resize and compress a photo for social media upload. They visit FlowConvert, drag their 5MB photo, select "Resize" from the toolbar, choose Instagram Story dimensions (1080x1920), enable compression, preview the result, and download the optimized 800KB file - all within 30 seconds.

**Why this priority**: This is the core value proposition - simple, fast file editing. If users can't accomplish basic edits effortlessly, the platform fails its primary mission.

**Independent Test**: Upload a 5MB image → Apply resize to 1080x1920 → Enable compression → Preview → Download → Verify file is correct dimensions and <1MB

**Acceptance Scenarios**:

1. **Given** a user has uploaded a 5MB JPG image, **When** they click "Resize" and select Instagram Story preset, **Then** the preview shows the resized image at 1080x1920 with file size estimate
2. **Given** a user has applied resize operation, **When** they enable compression slider to 80% quality, **Then** the preview updates in real-time showing file size reduction
3. **Given** a user has previewed their edits, **When** they click "Download", **Then** the edited file downloads immediately with changes applied
4. **Given** a user is editing a file, **When** they click the preview button at any time, **Then** a side-by-side comparison shows original vs edited version

---

### User Story 2 - Government Document Auto-Formatting (Priority: P1) 🎯 MVP

An Indian citizen needs to prepare documents for their driving license application. They visit FlowConvert, select "Government Documents" → "Driving License", upload their passport photo and ID scan, and the system automatically crops, resizes, compresses, and formats both documents to exact DL requirements (photo: 3.5cm x 4.5cm, <100KB; document: A4 PDF, <500KB). They download the ready-to-submit files.

**Why this priority**: This addresses a major pain point for Indian users who frequently struggle with government document requirements. It's a unique differentiator that solves real frustration.

**Independent Test**: Upload oversized photo + document → Select "Driving License" template → System auto-formats both → Download → Verify exact specifications met (dimensions, file size, format)

**Acceptance Scenarios**:

1. **Given** a user selects "Driving License" template, **When** they upload a photo, **Then** the system automatically crops/resizes to 3.5cm x 4.5cm (passport size) and compresses to <100KB
2. **Given** a user has uploaded documents for DL, **When** the auto-formatting completes, **Then** the preview shows both formatted files with size/dimension badges confirming compliance
3. **Given** a user is using a government template, **When** files don't meet minimum quality requirements, **Then** a clear warning explains the issue with suggestions to fix
4. **Given** a user downloads government-formatted docs, **When** download completes, **Then** files are named appropriately (e.g., "DL_Photo_3.5x4.5cm.jpg", "DL_Document.pdf")

---

### User Story 3 - Multi-File Batch Processing (Priority: P2)

A photographer needs to prepare 20 wedding photos for client delivery - resize all to 1920x1080, add watermark, compress to 70% quality, and convert to JPG. They drag all 20 files into FlowConvert, select all files, apply "Resize + Watermark + Compress + Convert to JPG" operations in sequence, preview a few samples, and download all 20 processed files as a ZIP.

**Why this priority**: Batch processing is critical for power users and differentiates from single-file tools. However, it's secondary to getting single-file editing perfect first.

**Independent Test**: Upload 20 mixed image files → Select all → Apply resize, watermark, compress, convert operations → Preview samples → Download ZIP → Verify all 20 files have operations applied correctly

**Acceptance Scenarios**:

1. **Given** a user has uploaded multiple files, **When** they select all files and apply an operation, **Then** the operation queues for all selected files with progress indicator
2. **Given** a user is batch processing, **When** they click preview, **Then** they can scroll through previews of all files showing before/after for each
3. **Given** a user has completed batch edits, **When** they click "Download All", **Then** all files download as a ZIP archive with original filenames preserved
4. **Given** a user is batch processing, **When** one file fails (corrupt/unsupported), **Then** that file is skipped with a clear error message, and remaining files process successfully

---

### User Story 4 - Multi-Step Single File Workflow (Priority: P2)

A designer needs to prepare a client logo: start with 10MB PNG → crop to remove whitespace → resize to 512x512 → convert to SVG → compress. They upload the file, apply operations one by one, use undo when crop is slightly off, preview after each step, and download the final optimized SVG.

**Why this priority**: Complex single-file workflows require careful step management and undo capabilities. Essential for professional users but can come after basic editing works.

**Independent Test**: Upload large PNG → Crop → Resize → Convert → Compress → Undo crop → Re-crop → Download → Verify all operations applied correctly and undo worked

**Acceptance Scenarios**:

1. **Given** a user has applied multiple operations to a file, **When** they view the operation history, **Then** all operations are listed in order with ability to undo any step
2. **Given** a user clicks undo on an operation, **When** undo completes, **Then** the file reverts to state before that operation, and subsequent operations are removed
3. **Given** a user is working through multi-step edits, **When** they click preview after any operation, **Then** preview shows cumulative result of all operations so far
4. **Given** a user has completed all edits, **When** they download, **Then** the file includes all operations applied in sequence

---

### User Story 5 - Document Details Replacement (Priority: P2)

A student needs to submit an assignment but wants to use their classmate's formatting. They upload their friend's DOCX file, click "Replace Details", and the system automatically detects and highlights common fields (Name: "John Doe", Roll No: "2024001", Email: "john@college.edu", Phone: "9876543210", Class: "CS-A"). The student can either select a saved profile ("Jane Smith Profile") which auto-fills all fields, or manually edit each highlighted field in the live preview. They hover over "John Doe", see a replace button, click it, type "Jane Smith", and the change applies instantly. After replacing all fields, they download the personalized document - all in under 60 seconds.

**Why this priority**: This solves a real pain point for students and professionals who reuse document templates. It's faster than manual find-replace and prevents missing fields. Common enough to warrant P2 priority after basic editing works.

**Independent Test**: Upload DOCX with student details → System detects name/roll/email/phone/class → Select saved profile OR manually edit each field in preview → Download → Verify all details replaced correctly

**Acceptance Scenarios**:

1. **Given** a user uploads a DOCX/PDF/PPT file, **When** they click "Replace Details", **Then** system detects and highlights common fields (name, roll no, email, phone, class, designation) with hover buttons
2. **Given** a user has saved profiles, **When** they select a profile from dropdown, **Then** all detected fields auto-fill with profile data and preview updates in real-time
3. **Given** a user hovers over a highlighted field, **When** they click the replace button (✏️), **Then** an inline edit box appears to type new value, and changes apply instantly to preview
4. **Given** a user has edited multiple fields, **When** system detects similar patterns elsewhere in document, **Then** those areas are highlighted with "Also found here" indicator and replace option
5. **Given** a user clicks "Download" after replacing, **When** download completes, **Then** document contains all replaced values with original formatting preserved

---

### User Story 6 - Smart Search & Guided Assistance (Priority: P3)

A non-technical user doesn't know how to make their file smaller. They type "make my file smaller" in the search bar. The system suggests "Compress" and "Resize" tools with simple explanations. They click "Compress", and a tooltip explains what compression does and suggests starting at 80% quality. They follow the guidance and successfully reduce their file size.

**Why this priority**: While important for accessibility, the core editing features must work flawlessly first. This enhances discoverability once features exist.

**Independent Test**: Type "make file smaller" in search → See compress/resize suggestions → Click compress → See tooltip guidance → Apply operation → Verify file size reduced

**Acceptance Scenarios**:

1. **Given** a user types a natural language query in search, **When** they press enter, **Then** relevant tools are highlighted with brief explanations of what they do
2. **Given** a user has clicked on a suggested tool, **When** the tool opens, **Then** a contextual tooltip explains the tool's purpose and recommended starting values
3. **Given** a user is using a tool for the first time, **When** they hover over controls, **Then** helpful tooltips explain what each control does in simple language
4. **Given** a user searches for something not yet available, **When** no tools match, **Then** a message says "Coming soon! Tell us about your need" with feedback form

---

### User Story 7 - Mobile Integration & Gallery Access (Priority: P2)

A mobile user is browsing their photo gallery and finds a group of 5 photos they want to combine into a PDF for submission. They long-press the photos, tap "Share", and see "FlowConvert" in the share sheet. They select it, the app opens with photos loaded, they tap "Images to PDF", see options for "Add More Photos" (camera/gallery/limited access), arrange the order, add a title page, and download the PDF - all without leaving their workflow. Later, they receive a DOCX file via email, tap it, select "Open with FlowConvert", and the app launches ready to edit that document.

**Why this priority**: Mobile integration is critical for user convenience and discoverability. Users expect modern apps to integrate with system share sheets and file associations. This enables seamless workflows (share from Photos → edit in FlowConvert → download) without manual file management.

**Independent Test**: Share 3 photos from Photos app → FlowConvert appears in share sheet → Select it → App opens with photos → Convert to PDF → Verify PDF created correctly. Also: Tap DOCX file in Files app → "Open with FlowConvert" appears → App opens with document loaded.

**Acceptance Scenarios**:

1. **Given** a user is viewing a file (image, PDF, DOCX, etc.) in any app, **When** they tap the file and select "Open with", **Then** FlowConvert appears in the app picker list with recognizable icon
2. **Given** a user selects one or more photos in Photos app or gallery, **When** they tap "Share", **Then** FlowConvert appears in the share sheet options
3. **Given** a user shares photos to FlowConvert via share sheet, **When** FlowConvert opens, **Then** the shared files are automatically loaded and ready for editing
4. **Given** a user is in "Images to PDF" mode, **When** they tap "Add Photos", **Then** they see options: "Take Photo" (camera), "Select from Gallery" (full access), "Select Limited Photos" (limited access for iOS), "Upload from Files"
5. **Given** a user taps "Take Photo", **When** they capture a photo, **Then** the photo is added to the current PDF session without saving to gallery first
6. **Given** a user taps "Select from Gallery" on iOS, **When** photo picker appears, **Then** user can choose between "Select Photos" (limited access) or "Allow Full Access" with privacy explanation
7. **Given** a user has selected multiple photos for PDF, **When** they long-press and drag photos, **Then** they can reorder pages before creating PDF
8. **Given** a user is creating PDF from images, **When** they tap "Add Title Page", **Then** they can type title text which generates a formatted first page in the PDF

---

### Edge Cases

- **Large files**: What happens when a user uploads a 500MB video file (beyond free tier 50MB limit)? System shows clear message: "File too large (500MB). Free tier supports up to 50MB. Try compressing first or upgrade to Premium."
- **Unsupported formats**: What happens when user uploads a .psd file (Photoshop) not yet supported? System shows: "PSD files not yet supported. Convert to PNG or JPG first. Want PSD support? Let us know!"
- **Corrupt files**: What happens when user uploads a corrupt/unreadable file? System shows: "This file appears to be corrupted. Try opening it in another program first, or re-export from source."
- **Network failure during server-side processing**: What happens if connection drops during DOCX→PDF conversion? System shows: "Connection lost. Your file is safe. Resume processing when reconnected." (auto-resume on reconnect)
- **Browser compatibility**: What happens on older browsers (IE11, Safari 12)? System shows: "Your browser is outdated. FlowConvert works best on Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+."
- **Mobile usage**: What happens when user tries complex multi-file batch on mobile? Interface adapts with simplified batch controls, limits batch to 5 files on mobile for performance.
- **Concurrent operations**: What happens when user tries to apply a new operation while previous one is processing? Previous operation completes first, new operation queues with "Processing... please wait" indicator.
- **No detectable fields in document**: What happens when document has no standard fields (name, roll no, etc.)? System shows: "No common fields detected. Use generic text replacement or manually select text to edit in preview."
- **Multiple people's details in one document**: What happens when document contains multiple names (group assignment)? System highlights all detected instances, asks "Replace all instances or select specific ones?"
- **Password-protected documents**: What happens when user uploads password-protected DOCX/PDF? System shows: "Document is password-protected. Please remove password first or provide password to unlock."
- **Profile conflicts**: What happens when user's saved profile has fewer fields than document needs (profile has name/roll but document needs name/roll/email/phone)? System fills available fields from profile, highlights remaining fields for manual entry.
- **Share sheet with no photos selected**: What happens when user taps "Share to FlowConvert" but no files selected? System opens FlowConvert normally with empty upload zone and message: "No files received. Drag files here to get started."
- **Photo permissions denied**: What happens when user taps "Select from Gallery" but denies photo permissions? System shows: "Photo access denied. Please enable in Settings → FlowConvert → Photos to select from gallery."
- **Camera permission denied**: What happens when user taps "Take Photo" but denies camera permission? System shows: "Camera access denied. Please enable in Settings → FlowConvert → Camera to take photos."
- **Large PDF from many images**: What happens when user tries to create PDF from 50 high-res photos (exceeds 50MB limit)? System shows progress, then: "PDF size (65MB) exceeds limit. Try reducing photo count or enabling compression."
- **File association conflict**: What happens when multiple apps support opening a file type (e.g., PDF)? FlowConvert appears in the "Open with" list alongside other PDF apps (Adobe, Preview, etc.) with its icon visible for recognition.
- **OCR on poor quality images**: What happens when user tries OCR on blurry/low-resolution scanned image? System shows: "Image quality too low for accurate OCR (estimated accuracy <50%). Try rescanning at higher resolution or enhance image first."
- **Edge detection on complex backgrounds**: What happens when automatic edge detection fails (patterned background, multiple documents)? System shows detected edges with confidence score and message: "Auto-detection uncertain (65% confidence). Drag corner handles to adjust or disable auto-detect."
- **Workflow preset name conflict**: What happens when user tries to save workflow with duplicate name? System shows: "Workflow 'Instagram Post' already exists. Overwrite existing workflow or choose a different name?"
- **File history storage limit exceeded**: What happens when localStorage quota exceeded for recent files? System shows: "Storage limit reached. Remove oldest file history or disable recent files feature to continue."
- **Multi-operation queue incompatibility**: What happens when user queues incompatible operations (e.g., "Crop" before "Resize to fixed dimensions")? System reorders operations intelligently or warns: "Crop after resize recommended for better control. Reorder operations?"
- **Target file size impossible to achieve**: What happens when user requests target size smaller than possible (e.g., "Make 10MB image 10KB")? System shows: "Target size 10KB not achievable while maintaining readability. Minimum possible: 45KB at 15% quality."
- **Keyboard shortcut conflict with browser**: What happens when keyboard shortcuts conflict with browser defaults (e.g., Ctrl+S)? System detects platform and adjusts shortcuts, shows tooltip: "Save: Ctrl+S (overrides browser save - downloads edited file)."
- **Format recommendation disagreement**: What happens when user ignores format recommendation and manually selects suboptimal format? System allows it but shows warning badge: "⚠️ JPG not recommended for screenshots (text may blur). Consider PNG for better quality."

## Requirements *(mandatory)*

### Functional Requirements

#### Core File Operations

- **FR-001**: System MUST support image format conversion between PNG, JPG, WebP, GIF, BMP, TIFF, and SVG
- **FR-002**: System MUST support document format conversion between PDF, DOCX, XLSX, PPTX, TXT, RTF
- **FR-002-A**: System MUST support PDF to Office format conversions: PDF → Word, PDF → Excel, PDF → PowerPoint with formatting preservation
- **FR-002-B**: System MUST support Office to PDF conversions: Word → PDF, Excel → PDF, PowerPoint → PDF with layout preservation
- **FR-002-C**: System MUST support image to document conversions: Images → PDF, Images → Word with automatic layout
- **FR-003**: System MUST support image compression with user-controlled quality slider (1-100%) AND target file size mode (user enters "Make this 200KB" and system auto-adjusts quality to hit target)
- **FR-003-A**: System MUST support advanced PDF compression with user-controlled quality levels (Low Quality/Small Size, Recommended Quality, High Quality/Large Size) showing estimated file size reduction before processing
- **FR-004**: System MUST support image resizing with preset dimensions (Instagram, Facebook, Twitter, LinkedIn, YouTube, Custom), percentage-based resizing (25%, 50%, 75%, 125%, 150%, 200%, custom %), and pixel-based resizing
- **FR-004-A**: System MUST provide toggle control to switch between percentage-based and pixel-based dimension input modes (beside Image Settings heading)
- **FR-004-B**: System MUST fix input field behavior: when all digits deleted, field shows empty (not "0"), and new input replaces empty value (not appending to "0" creating "0876")
- **FR-005**: System MUST support image cropping with freeform, aspect ratio locked, and preset ratios (1:1, 4:3, 16:9, 3:2)
- **FR-006**: System MUST support image rotation (90°, 180°, 270°) and flip (horizontal, vertical)
- **FR-007**: System MUST support PDF operations: merge multiple PDFs, split PDF by page ranges, extract specific pages, drag-to-rearrange pages with thumbnail view, multi-select pages for batch operations (delete, extract, rotate), and insert blank pages
- **FR-007-A**: System MUST support PDF page management: rotate pages (90°, 180°, 270°), delete selected pages, extract selected pages to new PDF
- **FR-007-B**: System MUST support organize PDF workflow: reorder pages via drag-and-drop with thumbnail preview, add/remove pages interactively
- **FR-008**: System MUST support metadata editing: view all EXIF data, remove location data, remove all metadata, edit title/author/copyright

#### Government Document Templates

- **FR-009**: System MUST provide auto-formatting templates for common Indian government documents:
  - Driving License (photo: 3.5cm x 4.5cm, <100KB; document: A4 PDF, <500KB)
  - Passport (photo: 3.5cm x 4.5cm, 50KB-300KB; document: A4 PDF, <1MB)
  - Aadhar Card (photo: 3.5cm x 4.5cm, <50KB)
  - PAN Card (photo: 3.5cm x 4.5cm, <50KB)
  - OCI Application (photo: 5cm x 5cm, <300KB; documents: A4 PDF, <2MB each)
- **FR-010**: System MUST automatically detect if uploaded files meet template requirements and warn if quality is insufficient
- **FR-011**: System MUST provide downloadable guides for each template explaining government requirements

#### Multi-File & Batch Processing

- **FR-012**: System MUST support uploading multiple files (up to 5 free tier, 25 premium tier) simultaneously via drag-and-drop or file picker
- **FR-013**: System MUST allow selecting multiple files and applying operations to all selected files at once
- **FR-014**: System MUST show individual progress for each file in batch operations
- **FR-015**: System MUST allow downloading all processed files as a ZIP archive
- **FR-016**: System MUST handle batch operation failures gracefully: skip failed files, continue processing others, show clear error for failed files

#### Multi-Step Workflow & History

- **FR-017**: System MUST maintain operation history for each file showing all applied operations in sequence
- **FR-018**: System MUST allow undoing any operation in the history (removes that operation and subsequent operations) AND redoing undone operations with keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo)
- **FR-019**: System MUST preserve file state between operations, allowing users to build complex workflows step-by-step
- **FR-020**: System MUST show preview after each operation reflecting cumulative changes

#### Preview & Comparison

- **FR-021**: System MUST provide a Preview button accessible at any time during editing
- **FR-022**: System MUST show side-by-side comparison of original file vs edited file when preview is open
- **FR-023**: System MUST display file size, dimensions, and format for both original and edited versions
- **FR-024**: System MUST update preview in real-time as user adjusts operation parameters (e.g., quality slider, resize dimensions)

#### Search & Discoverability

- **FR-025**: System MUST provide a search bar that accepts natural language queries (e.g., "make smaller", "crop photo", "convert to PDF")
- **FR-026**: System MUST suggest relevant tools based on search query with brief explanations
- **FR-027**: System MUST highlight suggested tools in the interface when selected from search results
- **FR-028**: System MUST provide contextual tooltips for each tool explaining purpose and recommended settings

#### File Management

- **FR-029**: System MUST support drag-and-drop file upload from desktop
- **FR-030**: System MUST support file upload via click-to-browse file picker
- **FR-031**: System MUST show upload progress for large files
- **FR-032**: System MUST allow removing uploaded files before processing
- **FR-033**: System MUST preserve original filenames and suggest descriptive names for edited files (e.g., "photo_resized_1080x1920.jpg")

#### Document Details Replacement (Phase 1 - Server-side, Phase 2 - Offline)

- **FR-034**: System MUST automatically detect common personal/academic fields in DOCX/PDF/PPT documents: Name, Roll Number, Email, Phone Number, Class/Section, Designation, Employee ID, Student ID
- **FR-035**: System MUST highlight detected fields in the document preview with visible indicators (colored underline or badge)
- **FR-036**: System MUST provide hover buttons (✏️ edit icon) on each detected field for quick inline editing
- **FR-037**: System MUST support saved user profiles containing field values (e.g., "Jane Smith Profile" with name, roll no, email, phone, class)
- **FR-038**: System MUST allow creating, editing, and deleting user profiles (stored in browser localStorage for privacy)
- **FR-039**: System MUST provide profile dropdown to auto-fill all detected fields from selected profile
- **FR-040**: System MUST provide live preview panel (Canva-style) where users can click any text field to edit inline
- **FR-041**: System MUST detect similar patterns throughout document and highlight with "Also found here" indicator
- **FR-042**: System MUST allow users to choose "Replace all" or "Replace selected" for fields appearing multiple times
- **FR-043**: System MUST preserve original document formatting (fonts, spacing, colors, layout) after field replacement
- **FR-044**: System MUST support generic text replacement mode for fields not auto-detected (manual find & replace)
- **FR-045**: System MUST handle both academic fields (name, roll no, class, section) and professional fields (name, designation, employee ID, email, phone)
- **FR-046**: System MUST provide undo/redo for field replacements in preview before final download
- **FR-047**: System MUST complete field detection and replacement in under 10 seconds for typical documents (<5MB)

#### Mobile Integration & System Features (Phase 2 - Native Apps)

- **FR-048**: System MUST register as a file handler for supported formats (PNG, JPG, WEBP, GIF, BMP, TIFF, PDF, DOCX, PPTX, TXT, RTF) so FlowConvert appears in "Open with" options
- **FR-049**: System MUST integrate with share sheets on iOS/Android to receive files from other apps (Photos, Files, Gallery, Email, etc.)
- **FR-050**: System MUST handle incoming shared files automatically, loading them into the editor ready for processing
- **FR-051**: System MUST provide "Images to PDF" tool that combines multiple images into a single PDF document
- **FR-052**: System MUST allow adding photos to PDF from multiple sources: camera (take new photo), gallery (full access), limited photo picker (iOS), file browser
- **FR-053**: System MUST request camera permission with clear explanation when user taps "Take Photo" option
- **FR-054**: System MUST request photo library permission with clear explanation when user taps "Select from Gallery" option
- **FR-055**: System MUST support iOS limited photo picker (select specific photos without full library access)
- **FR-056**: System MUST allow reordering images (drag-and-drop) before creating PDF in "Images to PDF" mode
- **FR-057**: System MUST provide "Add Title Page" option in "Images to PDF" mode that generates a formatted text page as first page of PDF
- **FR-058**: System MUST handle camera captures without saving to device gallery first (privacy-friendly)
- **FR-059**: System MUST display FlowConvert icon and name in system app pickers (Open with, Share sheet) for brand recognition

#### Advanced Editing & Automation Features (Phase 1 UX Enhancements)

- **FR-060**: System MUST provide OCR (Optical Character Recognition) for Images-to-PDF using Tesseract.js (client-side, free) to make scanned text searchable and extractable
- **FR-061**: System MUST offer "Make text searchable" toggle when creating PDF from images, with OCR accuracy threshold of 85%+
- **FR-062**: System MUST provide automatic document edge detection for images using perspective correction algorithms (auto-detect document edges with draggable corner handles for manual adjustment)
- **FR-063**: System MUST provide toggle to enable/disable automatic edge detection (enabled by default for document/scanner mode, disabled for photo mode)
- **FR-064**: System MUST offer document enhancement filters: Document Mode (auto-enhance contrast/brightness/deskew), Photo Mode (preserve original), Black & White (pure B&W), Grayscale, Enhanced Text (sharpen text, reduce noise)
- **FR-065**: System MUST support multi-operation queue where users can select multiple operations upfront (e.g., "Resize → Crop → Compress → Convert") and apply all with one click
- **FR-066**: System MUST provide option to apply operations "one-by-one" or "all together" in queue mode, showing intermediate previews for each step in one-by-one mode
- **FR-067**: System MUST allow users to save operation sequences as named workflow presets (e.g., "Instagram Post" = Resize 1080x1080 + Compress 85%) stored in localStorage
- **FR-068**: System MUST allow users to load and apply saved workflow presets to any file with one click
- **FR-069**: System MUST provide "Recent Files" history (last 5 edited files) stored in localStorage (opt-in feature) with auto-clear after 24 hours for privacy
- **FR-070**: System MUST store full file data (not just metadata) for recent files to enable quick re-editing without re-upload
- **FR-071**: System MUST clearly explain file history opt-in with privacy notice: "Files stored locally only, auto-deleted after 24 hours"
- **FR-072**: System MUST support split-screen view for large files (left: full document view, right: zoomed edit area) to improve precision editing
- **FR-073**: System MUST provide comprehensive keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+S (download), Ctrl+O (open file), Ctrl+D (duplicate file for A/B testing)
- **FR-074**: System MUST auto-detect optimal output format based on input file type and suggest to user with reasoning (e.g., "💡 Recommended: Convert to WebP (60% smaller, same quality)")
- **FR-075**: System MUST provide format recommendation badges for screenshots (PNG - lossless), photos (JPG/WebP - lossy okay), diagrams/logos (SVG - vector)
- **FR-076**: System MUST support adding page numbers to PDFs with position control (top-left, top-right, bottom-left, bottom-right, center), font size, and transparency settings

#### PDF Editing & Annotation (Smallpdf Parity)

- **FR-077**: System MUST support PDF annotation: add text boxes, highlight text, add shapes (rectangles, circles, arrows), add comments with reply threads
- **FR-078**: System MUST support PDF watermarking: add text watermarks (custom text, position, rotation, opacity, font) or image watermarks (logo, position, opacity, tiling)
- **FR-079**: System MUST support PDF cropping: crop pages to custom dimensions or standard sizes (A4, Letter, etc.) with visual crop tool
- **FR-080**: System MUST support PDF redaction: permanently remove sensitive information (text, images) with black boxes, preview redacted areas before finalizing
- **FR-081**: System MUST provide PDF reader/viewer: navigate pages, zoom in/out, fit to width/page, thumbnail sidebar, search within PDF
- **FR-082**: System MUST support sharing PDFs: generate shareable links with expiration (24h, 7d, 30d, never), optional password protection, track views (Phase 2)

#### E-Signatures & PDF Forms (Smallpdf Parity)

- **FR-083**: System MUST support PDF signing: draw signature, upload signature image, type signature with fonts, position signature on document
- **FR-084**: System MUST support request signatures: send PDF to others for signature via email, track signature status (pending, signed), reminders (Phase 2)
- **FR-085**: System MUST support PDF form filling: detect form fields automatically, fill text fields, check checkboxes, select radio buttons, add signatures to signature fields
- **FR-086**: System MUST support PDF form creation: convert static PDF to fillable form by adding text fields, checkboxes, dropdowns, signature fields

#### PDF Security (Smallpdf Parity)

- **FR-087**: System MUST support unlock PDF: remove password protection from PDFs when user provides correct password
- **FR-088**: System MUST support protect PDF: add password protection (open password, permission password), set document permissions (printing, editing, copying)
- **FR-089**: System MUST support flatten PDF: convert all form fields and annotations to static content (prevents editing), preserve visual appearance

#### AI-Powered Tools (Smallpdf Parity + Enhancement)

- **FR-090**: System MUST support AI PDF summarizer: generate concise summaries of PDF content (key points, main ideas), adjustable length (brief, detailed)
- **FR-091**: System MUST support translate PDF: translate PDF content to 50+ languages, preserve formatting and layout, download translated PDF
- **FR-092**: System MUST support chat with PDF: interactive Q&A about PDF content using LLM, cite page numbers in answers, maintain conversation history
- **FR-093**: System MUST support AI question generator: generate quiz questions (multiple choice, true/false, short answer) from PDF content for study/assessment
- **FR-094**: System MUST provide AI assistant: natural language commands to perform operations ("compress this to 2MB", "convert to PNG", "remove pages 3-5")

#### UI/UX Enhancements (User Requirements)

- **FR-095**: System MUST provide tool navigation bar at top of page with categorized tool icons (Convert, Compress, Edit PDF, Organize, Sign, AI Tools)
- **FR-096**: System MUST display uploaded files as horizontal cards (not vertical list) with thumbnails, filename, file size, format, and action buttons (edit, remove)
- **FR-097**: System MUST show clear error messages for unsupported file types BEFORE upload attempt, with guidance on supported formats
- **FR-098**: System MUST validate file type client-side and prevent unsupported files from uploading (e.g., PSD files with message "PSD not yet supported. Convert to PNG/JPG first.")
- **FR-099**: System MUST reduce hero section height by 40% on landing page, move detailed feature descriptions to dedicated About and FAQ pages
- **FR-100**: System MUST provide About page with product vision, privacy commitment, feature overview, roadmap
- **FR-101**: System MUST provide FAQ page with common questions (file limits, privacy, supported formats, pricing, troubleshooting)

### Privacy & Security Requirements (FlowConvert Specific)

- **PS-001**: Processing MUST be client-side for all image operations (resize, crop, rotate, compress, format conversion between PNG/JPG/WebP/GIF/BMP)
- **PS-002**: Processing MUST be client-side for basic PDF operations (merge, split, extract pages)
- **PS-003**: Server-side processing permitted ONLY for: DOCX↔PDF/XLSX/PPTX conversion, DOCX/PPT text detection/replacement (Phase 1), TIFF/SVG processing, government document template validation, AI features (summarize, translate, chat, questions)
- **PS-004**: If server-side processing required, files MUST be encrypted (AES-256) and deleted within 5 minutes of completion
- **PS-005**: Privacy indicator MUST show users whether processing is client-side (shield icon) or server-side (cloud icon with explanation) before operation starts
- **PS-006**: NO logging of file contents, filenames, or metadata
- **PS-007**: NO third-party tracking or analytics that compromise privacy
- **PS-008**: EXIF/metadata removal options MUST be user-controlled with clear defaults (location data removed by default, other metadata preserved)
- **PS-009**: User profiles (saved field values) MUST be stored locally in browser (localStorage) and NEVER uploaded to server
- **PS-010**: Document details replacement MUST transition to client-side (offline) processing in Phase 2 using browser-based DOCX/PDF parsing libraries
- **PS-011**: Mobile app MUST request permissions (camera, photo library) only when needed (lazy permissions) with clear explanation of why access is required
- **PS-012**: Photos captured via camera in "Images to PDF" mode MUST NOT be saved to device gallery unless user explicitly chooses to save
- **PS-013**: AI features (summarize, translate, chat, questions) require server-side LLM processing - files encrypted in transit and deleted after processing, conversation history stored locally only
- **PS-014**: E-signature data (signature images, metadata) MUST be stored locally in browser only, signatures embedded in PDF before download
- **PS-015**: Shareable PDF links (FR-082) MUST have user-controlled expiration, optional password protection, and anonymous view tracking (no user identification)

### User Experience Requirements (FlowConvert Specific)

- **UX-001**: File editing workflow MUST complete in maximum 3 clicks: Upload → Select tool → Download
- **UX-002**: User actions MUST show visual response within 100ms (button press, slider drag, file selection)
- **UX-003**: Before/after preview REQUIRED for all operations affecting quality (compression, format conversion)
- **UX-004**: Error messages MUST be actionable with specific guidance (e.g., "File too large (52MB). Maximum is 50MB for free users. Try compressing first or upgrade.")
- **UX-005**: Interface MUST be WCAG 2.1 AA compliant minimum (keyboard navigation, screen reader support, color contrast)
- **UX-006**: Mobile-first design with 44px minimum touch targets for all buttons and controls
- **UX-007**: Tool selection MUST be visual with clear icons and labels (not just text menus)
- **UX-008**: Preview button MUST be fixed at top of workspace, always accessible during editing

### Quality & Performance Requirements (FlowConvert Specific)

- **QP-001**: Original quality preservation MUST be the default for all operations
- **QP-002**: Quality degradation MUST be user-controlled with live preview showing impact
- **QP-003**: File size limits: Free (50MB/file, 5 files batch, 150MB total), Premium (500MB/file, 25 files batch, 5GB total) - Phase 2
- **QP-004**: Client-side operations MUST complete in <3 seconds for 10MB image file
- **QP-005**: Server-side operations MUST complete in <30 seconds for 50MB document file
- **QP-006**: Page load: First Contentful Paint <1.5s, Time to Interactive <3.5s
- **QP-007**: Interface MUST remain responsive during file processing (no UI freeze)

### Key Entities

- **File**: User-uploaded document/image with properties (name, size, format, dimensions, metadata), current state (original/processing/edited), operation history
- **Operation**: Single edit action (resize, crop, compress, convert, etc.) with parameters (dimensions, quality, format), timestamp, status (pending/processing/complete/failed)
- **Template**: Government document specification (name, file type, dimension requirements, file size limits, quality guidelines, preview example)
- **Batch Job**: Collection of files with same operations applied, overall progress, individual file statuses, error logs
- **Preview State**: Snapshot of file at any point in editing workflow with before/after comparison data
- **User Profile**: Saved collection of personal/academic field values (name, roll no, email, phone, class, designation) stored locally in browser for quick document replacement
- **Detected Field**: Identified text field in document (field type: name/roll/email/phone/class, original value, position in document, replacement status)
- **Share Intent**: System integration entity representing incoming file share from other apps (source app, file list, metadata)
- **PDF Document**: Multi-page PDF composed from images with optional title page, reorderable pages, compression settings
- **Workflow Preset**: Saved sequence of operations with name (e.g., "Social Media Post") that can be quickly applied to files, stored in localStorage
- **File History Entry**: Recent file record (last 5 files) with full file data, timestamp, operations applied, stored locally for 24 hours (opt-in)
- **Operation Queue**: Collection of operations to be applied sequentially or all-at-once with intermediate preview states
- **PDF Annotation**: Visual annotation element (text box, highlight, shape, comment) with position, style properties, author, timestamp
- **Watermark**: Text or image overlay on PDF pages with position, opacity, rotation, font/size (text), tiling option
- **Signature**: Electronic signature with image data, position, size, timestamp, signer name
- **Signature Request**: Outbound signature request with recipient email, document, status (pending/signed/expired), reminder schedule (Phase 2)
- **PDF Form**: Collection of form fields (text, checkbox, radio, dropdown, signature) with field names, types, positions, values
- **PDF Protection**: Security settings with open password, permission password, document permissions (print, edit, copy)
- **Shareable Link**: PDF sharing link with unique ID, expiration date, optional password, view count, creation timestamp (Phase 2)
- **AI Conversation**: Chat session with PDF with message history, context, page references, stored locally
- **AI Summary**: Generated PDF summary with key points, adjustable detail level, source page references
- **Translation**: Translated PDF content with source/target languages, translated text, formatting metadata
- **Tool Category**: Logical grouping of tools (Convert, Compress, Edit PDF, Organize, Sign, AI Tools) for navigation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users complete basic single-file edits (resize, compress, convert) in under 30 seconds from landing page to download
- **SC-002**: 90% of users successfully complete their first file editing task without errors or confusion
- **SC-003**: Government document templates reduce user preparation time by 70% compared to manual formatting (target: 2 minutes vs 7+ minutes)
- **SC-004**: System handles 10 concurrent file uploads per user without performance degradation
- **SC-005**: Client-side operations complete in under 3 seconds for 95% of typical files (under 10MB)
- **SC-006**: Preview feature is used by 80%+ of users before downloading, indicating users value quality control
- **SC-007**: Search feature successfully guides 75%+ of users to the correct tool on first try
- **SC-008**: User satisfaction score of 4.5/5 or higher for "ease of use" in post-edit surveys
- **SC-009**: Zero privacy-related complaints or incidents (no file logging, no data leaks)
- **SC-010**: Mobile users complete tasks at 90% success rate of desktop users (mobile-optimized UX works)
- **SC-011**: Batch processing of 5 files completes successfully 95%+ of the time without user intervention
- **SC-012**: Users return for second edit session within 7 days at 60%+ rate (indicating product delivers value)
- **SC-013**: Document details replacement reduces field editing time by 80% compared to manual find-replace (target: 60 seconds vs 5+ minutes for typical assignment)
- **SC-014**: Field detection accuracy of 90%+ for standard documents (correctly identifies name, roll no, email, phone, class fields)
- **SC-015**: Users with saved profiles complete document replacement in under 30 seconds (upload → select profile → download)
- **SC-016**: Mobile users successfully share photos to FlowConvert on first attempt at 85%+ rate (clear integration, easily discoverable)
- **SC-017**: "Images to PDF" workflow completes in under 45 seconds for typical use case (5 photos → reorder → create PDF → download)
- **SC-018**: File association "Open with FlowConvert" appears for all supported formats on 95%+ of devices after first app launch
- **SC-019**: Users grant camera/photo permissions at 80%+ rate when prompted (clear permission explanations reduce denials)
- **SC-020**: PDF creation from images succeeds 95%+ of time without errors (robust image handling, memory management)
- **SC-021**: OCR accuracy achieves 90%+ for typed documents and 85%+ for handwritten text (measured against ground truth)
- **SC-022**: Automatic edge detection correctly identifies document boundaries in 90%+ of standard document photos
- **SC-023**: Users with saved workflow presets complete recurring tasks 50% faster than manual operation selection (e.g., 15 seconds vs 30 seconds)
- **SC-024**: Smart compression "target file size" feature achieves target within 10% margin 95% of time on first attempt
- **SC-025**: Multi-operation queue reduces workflow time by 40% compared to one-by-one operations (parallel processing + single preview)
- **SC-026**: Recent files feature increases repeat editing rate from 60% to 75% within 7 days (faster access = more usage)
- **SC-027**: Format auto-detection suggestions are accepted by 70%+ of users, indicating accurate recommendations

## Out of Scope (Phase 1)

The following features are explicitly **NOT** included in Phase 1 MVP:

- **User accounts and cloud sync**: Login, saved files across devices, edit history sync (profiles stored locally only in Phase 1)
- **Cloud storage integrations**: Google Drive, Dropbox, OneDrive direct integration
- **Collaboration features**: Real-time multi-user editing, shared workspaces, comment threads with replies
- **Advanced image editing**: Filters, effects, color correction, background removal, smart object removal
- **Video and audio editing**: Video conversion, video compression, audio editing beyond basic format conversion
- **Premium tier features**: Subscription management, payment processing, tiered feature access (all features free in Phase 1)
- **Mobile native apps (iOS/Android)**: Phase 1 is web-responsive PWA only, Phase 2 adds native apps with share sheet, file associations, camera/gallery integration
- **API access**: Third-party integrations, developer API, webhooks, programmatic access
- **Offline document details replacement**: Phase 1 uses server-side processing, Phase 2 transitions to client-side with browser libraries
- **Advanced PDF text editing**: Phase 1 has basic annotation/field replacement, Phase 2 adds full Canva-style rich text editing within PDFs

**Phase 1 INCLUDES (Smallpdf Parity + Enhancements)**:
- ✅ Image operations (convert, compress, resize, crop, rotate)
- ✅ PDF compression with quality control
- ✅ PDF conversion (to/from Word, Excel, PowerPoint, images)
- ✅ PDF merge, split, extract, organize, rotate pages
- ✅ PDF annotation (text boxes, highlights, shapes)
- ✅ PDF watermarking (text and image watermarks)
- ✅ PDF cropping and redaction
- ✅ PDF reader/viewer with search
- ✅ E-signatures (draw, upload, type)
- ✅ PDF forms (fill, create form fields)
- ✅ PDF security (unlock, protect, flatten)
- ✅ AI tools (summarize, translate, chat with PDF, question generator)
- ✅ OCR for searchable PDFs
- ✅ Document edge detection and perspective correction
- ✅ Government document auto-formatting templates
- ✅ Document details replacement
- ✅ Batch processing (5 files free tier)
- ✅ Multi-step workflows with undo/redo
- ✅ Workflow presets
- ✅ Tool navigation and horizontal file cards UI

**Phase 2 Enhancements** for Document Details Replacement:
- Client-side (offline) processing for DOCX/PPT field detection and replacement using browser libraries
- Full Canva-style PDF/DOCX editor with drag-to-reposition, font/size changes, add shapes/images
- Template marketplace for common document types (assignment templates, resume templates, certificate templates)
- Batch document replacement (process 10 assignments at once with same profile)
- Cloud-synced profiles across devices (requires user accounts)
- Smart field suggestions based on document context (AI-powered field detection)

**Phase 2 Enhancements** for Mobile Integration:
- Native iOS app with share extension, file provider extension, Today widget
- Native Android app with share target, document provider, quick settings tile
- System file associations (Open with FlowConvert) for all supported formats
- Share sheet integration (share photos from Photos/Gallery directly to FlowConvert)
- Camera integration (take photos directly within Images to PDF tool)
- Photo library access with limited picker support (iOS privacy-friendly selection)
- Background processing for large file operations
- Apple Pencil support for PDF annotation (iOS)
- Widgets showing recent edits and quick actions (iOS/Android)
- Siri Shortcuts / Google Assistant integration for voice commands

These features are planned for Phase 2 once Phase 1 MVP is stable and validated with users.

## Assumptions

1. **Target audience**: Primary users are students and individuals in India who need to prepare documents for government applications, exchange academic assignments, and perform personal file editing
2. **Browser support**: Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) - no IE11 support
3. **File formats**: Focus on most common formats first (PNG, JPG, PDF, DOCX) before expanding to less common formats (TIFF, SVG, WebP, PPT)
4. **Government templates**: Based on 2024-2025 requirements for Indian government documents (updated annually)
5. **Performance baseline**: Users have reasonable internet connection (3G minimum) and modern devices (4GB RAM, dual-core processor)
6. **Privacy-first**: Users are privacy-conscious and value client-side processing; profiles stored locally only
7. **Free tier**: All features free in Phase 1 to maximize adoption and gather feedback before introducing premium tier in Phase 2
8. **Mobile usage**: 40% of users will access via mobile devices, so responsive design is critical
9. **Batch processing**: Most users process 1-3 files at a time; power users process 5+ files less frequently
10. **Undo/redo**: Users expect to undo mistakes, so operation history is critical for trust
11. **Document replacement use case**: Primary use is students sharing assignments and changing personal details (name, roll no, email, phone, class)
12. **Field detection patterns**: Standard academic/professional documents follow predictable formats (e.g., "Name: John Doe", "Roll No: 2024001")
13. **Mobile workflows**: Mobile users frequently want to convert photos to PDF (common use case: multiple images → single PDF for submission)
14. **System integration expectations**: Mobile users expect apps to integrate with share sheets and "Open with" functionality as standard behavior
15. **Permission awareness**: Users understand camera/photo permissions but appreciate clear explanations; lazy permission requests (only when needed) preferred over upfront requests

## Dependencies

**Client-Side Processing Libraries**:
- `browser-image-compression` - Image compression with quality control
- `pdf-lib` - PDF manipulation (merge, split, extract, annotate, watermark, forms, security)
- `jszip` - ZIP archive generation for batch downloads
- `pako` - Compression utilities
- `heic2any` - HEIC image format conversion
- `Tesseract.js` - OCR for searchable PDFs (lazy-loaded, ~2-4MB)
- `jsfeat` - Edge detection for document scanning (~200KB)
- `perspective-transform` - Perspective correction (~10KB)
- `signature_pad` - Signature drawing canvas
- `pdf.js` - PDF rendering and viewer
- `pdfjs-dist` - PDF text extraction and search

**Server-Side Processing (Phase 1)**:
- `Sharp` - Server-side image processing fallback
- `LibreOffice` or `Apache POI` - Office document conversion (DOCX/XLSX/PPTX ↔ PDF)
- `pdf-parse` - PDF text extraction for field detection
- `mammoth` - DOCX to HTML conversion
- `xlsx` - Excel file parsing and generation
- `officegen` - Office document generation
- OpenAI API or Anthropic Claude API - AI features (summarize, translate, chat, questions)
- Google Translate API or DeepL API - Translation service

**Framework & Infrastructure**:
- Next.js 14+ with App Router
- React 18+ with TypeScript strict mode
- Tailwind CSS 3+ for styling
- Zustand for state management
- React Hook Form + Zod for form validation
- Vercel for deployment (CDN, Edge Functions)
- Cloudflare for static asset CDN

**Storage**:
- Browser localStorage - User profiles, workflow presets
- Browser IndexedDB - File history (24h expiry), AI conversation history
- Temporary server storage - Encrypted uploads (<5min TTL)

**Government Document Data**:
- JSON specification files for Indian government document templates (DL, Passport, Aadhar, PAN, OCI)

**APIs & Services**:
- LLM API (OpenAI GPT-4 or Claude) for AI features
- Translation API for multi-language PDF translation
- Email service (SendGrid/Postmark) for signature requests (Phase 2)

**Phase 2 Mobile Dependencies**:
- React Native or Capacitor for native app development
- iOS/Android file provider APIs
- Camera/photo library APIs
- Share extension SDKs

## Open Questions (Phase 2)

- How should AI assistant handle ambiguous requests (e.g., "improve my photo")?
- What premium features justify $4.99/month subscription?
- Should we support bulk government document processing (e.g., 10 passport photos at once)?
- How to handle version control when user re-uploads previously edited file?
- Should we provide template gallery showing examples of properly formatted government documents?
- Should document replacement feature support batch processing (replace details in 10 assignments at once)?
- How to handle profile syncing across devices when user accounts are added in Phase 2?
- Should we add AI-powered smart field detection beyond standard patterns (using NLP to understand context)?
- How to monetize document replacement feature - keep free or make advanced detection premium?
- **React Native vs Capacitor vs native Swift/Kotlin** for Phase 2 mobile apps (trade-offs: code reuse vs native performance)?
- Should share sheet integration work with all file types or limit to most common (images, PDFs)?
- How to handle large image sets for PDF creation (50+ photos) - paginate UI, compress automatically, or show warnings?
- Should "Images to PDF" support OCR (searchable text in PDF) or keep as image-only PDF initially?
- Widget features: What quick actions make sense (recent files, favorite tools, new PDF from photos)?
- Background processing limits: Which operations allowed in background vs requiring app in foreground?
