# Implementation Plan: Universal File Editor Platform

**Branch**: `001-file-editor` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-file-editor/spec.md`

**Note**: This plan covers Phase 1 MVP implementation. Phase 2 enhancements (offline document editing, advanced AI, full Canva-style editor) are documented in spec.md Out of Scope section.

## Summary

Build a privacy-first, comprehensive file editing platform (Smallpdf parity + enhancements) that enables users to:
1. **Image Operations**: Convert (PNG/JPG/WebP/GIF), compress, resize (pixel/%  with toggle), crop, rotate, flip
2. **PDF Conversion**: Bidirectional conversion PDF ↔ Word/Excel/PowerPoint/Images with formatting preservation
3. **PDF Compression**: Advanced quality control (Low/Recommended/High Quality) with estimated size reduction
4. **PDF Organization**: Merge, split, extract, rotate, delete, reorder pages with drag-drop thumbnails
5. **PDF Editing**: Annotate (text/highlight/shapes), watermark (text/image), crop, redact, page numbers
6. **PDF Forms & Signing**: Fill/create forms, e-signatures (draw/upload/type), request signatures
7. **PDF Security**: Unlock, protect (password/permissions), flatten, reader/viewer with search
8. **AI Tools**: Summarize PDFs, translate (50+ languages), chat with PDF Q&A, generate quiz questions
9. **OCR & Scanning**: Searchable PDFs, edge detection, perspective correction for document scanning
10. **Government Templates**: Auto-format Indian docs (DL, Passport, Aadhar, PAN, OCI)
11. **Document Replacement**: Auto-detect and replace personal/academic details with saved profiles
12. **Batch Processing**: 5 files simultaneously (free tier), operation history, undo/redo, workflow presets
13. **Modern UI**: Tool navigation bar, horizontal file cards, improved error handling, About/FAQ pages

**Technical Approach**: Next.js 14 full-stack web app with React 18, TypeScript strict mode. **Client-side**: browser-image-compression, pdf-lib (annotate/watermark/forms/security), Tesseract.js (OCR), jsfeat (edge detection), signature_pad, pdf.js (viewer). **Server-side**: LibreOffice/POI (Office ↔ PDF), OpenAI/Claude API (AI features), encryption (AES-256), auto-delete (<5min). **Storage**: localStorage (profiles/presets), IndexedDB (file history/AI chats). Mobile-responsive PWA-ready design.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 20+ LTS
**Primary Dependencies**:
- **Frontend**: Next.js 14+, React 18+, Tailwind CSS 3+, Zustand (state), React Hook Form + Zod (validation)
- **Client-side Processing**:
  - Images: browser-image-compression, heic2any, pako
  - PDFs: pdf-lib (merge/split/annotate/watermark/forms/security), pdf.js (viewer), pdfjs-dist (text extraction)
  - Utils: jszip, Tesseract.js (OCR, lazy-loaded ~2-4MB), jsfeat (edge detection ~200KB), perspective-transform (~10KB)
  - E-Signatures: signature_pad
- **Server-side Processing**:
  - Images: Sharp (fallback)
  - Office Conversion: LibreOffice or Apache POI (DOCX/XLSX/PPTX ↔ PDF)
  - Document Parsing: pdf-parse, mammoth (DOCX→HTML), xlsx, officegen
  - AI: OpenAI GPT-4 or Anthropic Claude API (summarize/chat/questions), Google Translate/DeepL API (translation)
  - Security: AES-256 encryption, auto-delete jobs
- **Storage**: localStorage (profiles, presets), IndexedDB (file history 24h, AI chats), temp server (<5min TTL)
- **Testing**: Jest, React Testing Library, Playwright, Chromatic/Percy

**Storage**:
- Browser localStorage for user profiles (name, roll no, email, phone, class, designation) and workflow presets (operation sequences)
- Browser IndexedDB for file history (last 5 edited files, 24h auto-expiry, opt-in)
- Temporary server storage for DOCX/PPT processing (encrypted, auto-delete <5min)
- No database required for Phase 1 MVP (stateless application)

**Testing**: Jest (unit), React Testing Library (components), Playwright (E2E), Chromatic (visual regression), TDD mandatory per constitution

**Target Platform**: Web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), mobile-responsive, PWA-ready for Phase 2 native apps

**Project Type**: Web application (Next.js full-stack with client-side + server-side processing)

**Performance Goals**:
- Client-side operations: <3s for 10MB image
- Server-side operations: <30s for 50MB document
- API response: <200ms (p95)
- Page load: FCP <1.5s, TTI <3.5s
- Bundle size: Initial <250KB gzipped (includes jsfeat 200KB + perspective-transform 10KB), routes <100KB gzipped, Tesseract.js lazy-loaded (2-4MB, only when OCR enabled)

**Constraints**:
- Privacy-first: Client-side processing mandatory where possible
- Free tier limits: 50MB/file, 5 files batch, 150MB total
- Offline capability: Client-side operations work offline, server-side require connection
- Mobile-first: 44px touch targets, responsive breakpoints
- Accessibility: WCAG 2.1 AA minimum

**Scale/Scope**:
- Phase 1 target: 0-10K users
- Single VPS deployment (8GB RAM, 4 CPU cores) or Vercel with Edge Functions
- 7 core user stories + expanded Smallpdf feature parity
- **101 functional requirements** (FR-001 to FR-101 including all Smallpdf tools), 15 privacy requirements
- 27+ success criteria
- **37+ tools organized in 6 categories**: Convert, Compress, Edit PDF, Organize, Sign, AI Tools

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Privacy & Security (HIGHEST PRIORITY)**:
- [x] All conversions that CAN be client-side ARE client-side (images, basic PDF ops)
- [x] Server-side processing justified and documented (DOCX/PPT field replacement requires LibreOffice/POI, transitioning to client-side Phase 2)
- [x] Privacy indicators visible to users (shield icon for client-side, cloud icon for server-side)
- [x] HTTPS/TLS 1.3 minimum, AES-256 encryption for server uploads
- [x] No file logging or third-party tracking (profiles in localStorage only)

**User Experience**:
- [x] Maximum 3 clicks from landing to conversion (Upload → Tool → Download)
- [x] <100ms visual response for user actions (immediate UI feedback)
- [x] Before/after preview for quality-affecting conversions (side-by-side comparison)
- [x] WCAG 2.1 AA accessibility compliance (keyboard nav, screen reader, high contrast)
- [x] Mobile-first responsive design (44px touch targets, breakpoints for tablet/mobile)

**Code Quality**:
- [x] TypeScript strict mode, no `any` types (use `unknown` with type guards)
- [x] Cyclomatic complexity ≤ 10 per function (ESLint enforced)
- [x] 80% test coverage overall, 100% for critical paths (file conversion, field detection)
- [x] Lighthouse scores: Perf 90+, A11y 95+, BP 100, SEO 95+ (automated in CI)
- [x] FCP <1.5s, TTI <3.5s (code splitting, lazy loading, CDN)

**Testing Standards**:
- [x] Tests written BEFORE implementation (TDD mandatory)
- [x] Unit, integration, and E2E tests planned (Jest, RTL, Playwright)
- [x] Edge cases covered: file size limits (50MB free), corrupt files, network failures
- [x] Browser compatibility: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (latest 2 versions)

**Quality Assurance**:
- [x] Original quality preservation as default (no auto-degradation)
- [x] File format support aligns with priority (Images Week 1-2 → Documents Week 3-4 → Audio/Archive Week 5-6)
- [x] Free tier: 50MB/file, 5 batch, 150MB total (enforced client-side + server-side)
- [x] Premium tier: 500MB/file, 25 batch, 5GB total (Phase 2 pricing model)
- [x] No silent failures, clear error messages (actionable guidance)

**Performance Targets**:
- [x] API response <200ms (p95) for file upload URL generation
- [x] Client conversions <3s for 10MB image (browser-image-compression optimized)
- [x] Server conversions <30s for 50MB file (LibreOffice headless, Sharp parallel processing)
- [x] Bundle size: initial <200KB gzipped, routes <100KB gzipped (dynamic imports)

## Project Structure

### Documentation (this feature)

```text
specs/001-file-editor/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions, library comparisons
├── data-model.md        # Phase 1: Entity schemas, validation rules
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/           # Phase 1: API contracts (OpenAPI)
│   ├── file-operations.yaml
│   ├── document-replacement.yaml
│   └── batch-processing.yaml
└── checklists/
    └── requirements.md  # Spec validation checklist
```

### Source Code (repository root)

```text
# Web application structure (Next.js 14 App Router)
app/
├── (home)/
│   └── page.tsx              # Landing page with file upload
├── editor/
│   └── page.tsx              # Main editor interface
├── api/
│   ├── upload/
│   │   └── route.ts          # File upload endpoint
│   ├── process/
│   │   ├── image/
│   │   │   └── route.ts      # Server-side image processing (fallback)
│   │   └── document/
│   │       └── route.ts      # DOCX/PPT field replacement (Phase 1)
│   └── templates/
│       └── route.ts          # Government document templates
├── layout.tsx                # Root layout with providers
└── globals.css               # Tailwind base styles

components/
├── file-upload/
│   ├── DragDropZone.tsx
│   ├── FileList.tsx
│   └── UploadProgress.tsx
├── editor/
│   ├── Toolbar.tsx           # Tool selection (resize, crop, compress, etc.)
│   ├── PreviewPanel.tsx      # Side-by-side before/after comparison
│   ├── OperationHistory.tsx  # Undo/redo stack
│   └── PropertyPanel.tsx     # Tool-specific controls (quality slider, dimensions)
├── document-replacement/
│   ├── FieldDetector.tsx     # Highlights detected fields
│   ├── ProfileSelector.tsx   # Saved profile dropdown
│   ├── FieldEditor.tsx       # Inline edit with hover buttons
│   └── PreviewEditor.tsx     # Canva-style live preview
├── government-templates/
│   ├── TemplateSelector.tsx
│   └── TemplatePreview.tsx
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Modal.tsx
    └── Toast.tsx

lib/
├── client-processors/
│   ├── image-processor.ts    # browser-image-compression wrapper
│   ├── pdf-processor.ts      # pdf-lib operations (merge, split, extract)
│   ├── compression.ts        # Quality control logic
│   └── metadata.ts           # EXIF removal/editing
├── server-processors/
│   ├── document-parser.ts    # LibreOffice/POI for DOCX/PPT
│   ├── field-detector.ts     # Regex patterns for name, roll no, email, etc.
│   └── encryption.ts         # AES-256 for server uploads
├── stores/
│   ├── editor-store.ts       # Zustand store for editor state
│   ├── profile-store.ts      # localStorage wrapper for user profiles
│   └── file-store.ts         # Active files and operation queue
├── utils/
│   ├── file-validation.ts    # Size limits, format checks
│   ├── format-detection.ts   # MIME type validation
│   └── error-handling.ts     # User-friendly error messages
└── types/
    ├── file.ts               # File, Operation, Template types
    ├── profile.ts            # UserProfile, DetectedField types
    └── api.ts                # API request/response types

public/
├── government-templates/     # Template specs (JSON)
│   ├── driving-license.json
│   ├── passport.json
│   ├── aadhar.json
│   ├── pan-card.json
│   └── oci-application.json
└── assets/
    ├── icons/                # Tool icons, privacy indicators
    └── presets/              # Social media dimension presets

tests/
├── unit/
│   ├── lib/
│   │   ├── image-processor.test.ts
│   │   ├── pdf-processor.test.ts
│   │   └── field-detector.test.ts
│   └── utils/
│       └── file-validation.test.ts
├── integration/
│   ├── file-upload.test.ts
│   ├── image-conversion.test.ts
│   ├── pdf-operations.test.ts
│   └── document-replacement.test.ts
└── e2e/
    ├── user-story-1.spec.ts  # Quick single file edit
    ├── user-story-2.spec.ts  # Government doc formatting
    ├── user-story-3.spec.ts  # Batch processing
    ├── user-story-4.spec.ts  # Multi-step workflow
    └── user-story-5.spec.ts  # Document details replacement
```

**Structure Decision**: Web application structure selected because:
1. Feature requires both frontend (file editing UI, preview) and backend (DOCX/PPT processing)
2. Next.js 14 App Router enables file-system routing, server components, and API routes in one framework
3. Client-side processing for images/PDFs uses browser APIs (no server needed)
4. Server-side processing for DOCX/PPT requires Node.js backend with LibreOffice
5. Mobile-responsive design supports "website and mobile ready" with PWA path for Phase 2 native apps
6. Single codebase reduces complexity vs separate frontend/backend repos

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitutional requirements satisfied:
- Privacy: Client-side first, server-side justified and encrypted
- UX: 3-click workflow, <100ms response, mobile-first
- Quality: TypeScript strict, 80% coverage, TDD
- Performance: <3s client, <30s server, <200KB bundles (excluding lazy-loaded Tesseract.js ~2-4MB)

---

## Implementation Phases

**PRIORITY ORDER:**
1. **Phase 0-3**: Setup, Foundation, UI, Image Operations (Week 1-2)
2. **Phase 4**: PDF Core Features - PRIORITY (Week 2-3) - Merge, Split, Organize, OCR, Smart Field Replacement, Office Conversion, E-Signatures
3. **Phase 5**: Government Templates (Week 4)
4. **Phase 6**: Batch Processing & Workflows (Week 5)
5. **Phase 7**: PDF Advanced Features - LATER (Week 5) - Annotation, Watermarking, Security
6. **Phase 8**: AI Tools - FINAL PHASE (Week 6)
7. **Phase 9**: Polish, Testing & Deployment (Week 6)

---

### Phase 0: Project Setup & Configuration (Week 1: Days 1-3)

**Objective**: Set up development environment, install dependencies, configure tooling

**Key Tasks**:
1. Initialize Next.js 14 project with TypeScript strict mode and Tailwind CSS
2. Install all client-side dependencies (browser-image-compression, pdf-lib, jszip, signature_pad, pdf.js, etc.)
3. Install server-side dependencies (Sharp, LibreOffice/POI, pdf-parse, mammoth, xlsx)
4. Set up testing infrastructure (Jest, React Testing Library, Playwright)
5. Configure ESLint (complexity ≤10, no-any), Prettier, Husky hooks
6. Set up CI/CD pipeline (GitHub Actions: lint, test, build)
7. Configure bundle size monitoring (<250KB target)
8. Create project directory structure (app, components, lib, tests, public)
9. Set up Vercel deployment configuration

**Deliverables**: Fully configured project ready for development, all tests passing (no features yet)

---

### Phase 1: Foundational Infrastructure (Week 1: Days 4-7)

**Objective**: Build type definitions, utility functions, state management, UI component library

**Key Tasks**:
1. **Type Definitions** (TDD): File, Operation, UserProfile, Template, Batch, PDF entities, AI entities
2. **Utility Functions**: File validation (size limits), format detection, error handling, dimension conversion
3. **Zustand Stores**: editor-store (files, operations, preview), profile-store (localStorage), workflow-store, history-store (IndexedDB)
4. **UI Components**: Install shadcn/ui, add Button, Input, Modal, Toast, Slider, Select, Tooltip, Tabs
5. **Test Coverage**: 80% for all utils and stores

**Deliverables**: Type-safe foundation, 146/156 tests passing (93.6% coverage), reusable UI components

---

### Phase 2: Modern UI & File Upload (Week 2: Days 1-2)

**Objective**: Implement tool navigation bar, horizontal file cards, improved error handling (FR-095 to FR-101)

**Key Tasks**:
1. **Tool Navigation Bar**: Categorized icons (Convert, Compress, Edit PDF, Organize, Sign, AI Tools)
2. **Horizontal File Cards**: Thumbnails, filename, size, format, action buttons (edit, remove)
3. **File Uploader**: Drag-drop with validation, show unsupported file errors BEFORE upload
4. **Input Field Bug Fix** (FR-004-B): Empty field when cleared (not "0"), no "0876" behavior
5. **Percentage/Pixel Toggle** (FR-004-A): Switch dimension input modes beside Image Settings
6. **Hero Section**: Reduce height by 40%, move detailed content to About/FAQ
7. **About Page** (FR-100): Vision, privacy commitment, feature overview, roadmap
8. **FAQ Page** (FR-101): File limits, privacy, formats, pricing, troubleshooting

**Deliverables**: Modern UI matching 2025 design trends, horizontal file cards, tool navigation, About/FAQ pages

---

### Phase 3: Image Operations & Client-Side Processing (Week 2: Days 3-5)

**Objective**: Implement all image tools (US1 from original spec + FR-001, FR-003, FR-004-006)

**Key Tasks**:
1. **Image Conversion**: PNG ↔ JPG ↔ WebP ↔ GIF ↔ BMP using Canvas API
2. **Image Compression**: Quality slider (1-100%) + target file size mode (user enters "200KB")
3. **Image Resizing**: Preset dimensions (social media), percentage-based, pixel-based with toggle
4. **Image Cropping**: Freeform, aspect ratio locked, preset ratios (1:1, 4:3, 16:9)
5. **Image Rotation/Flip**: 90°/180°/270° rotation, horizontal/vertical flip
6. **Preview Panel**: Side-by-side before/after comparison with real-time updates
7. **Download**: Suggested filenames (photo_resized_1080x1920.jpg)

**Deliverables**: Full image editing suite, <3s processing for 10MB images, E2E test for US1

---

### Phase 4: PDF Core Features - PRIORITY ⭐ (Week 2-3)

**Objective**: Complete all essential PDF features including operations, OCR, field replacement, Office conversion, and e-signatures (FR-007, FR-060-064, FR-034-047, FR-002, FR-083-086)

**Key Tasks - PDF Basic Operations**:
1. **PDF Merge**: Combine multiple PDFs with pdf-lib
2. **PDF Split**: By page ranges, every page, specific pages
3. **PDF Extract**: Extract selected pages to new PDF
4. **PDF Organize**: Drag-and-drop reorder pages with thumbnail view, rotate pages, delete pages, insert blank pages
5. **PDF Reader/Viewer** (FR-081): Navigate, zoom, fit to width/page, thumbnail sidebar, search within PDF using pdf.js

**Key Tasks - OCR & Document Scanning** (merged from old Phase 11):
6. **OCR Integration** (FR-060, FR-061): Lazy-load Tesseract.js (~2-4MB) only when enabled, "Make text searchable" toggle, 85%+ accuracy threshold
7. **OCR Worker Pool**: Parallel page processing for multi-page PDFs
8. **Pre-Processing**: Enhance contrast, deskew before OCR for better accuracy
9. **Edge Detection** (FR-062, FR-063): Auto-detect document boundaries using jsfeat, perspective correction with perspective-transform, draggable corner handles for manual adjustment
10. **Document Filters** (FR-064): Document Mode (auto-enhance), Photo Mode, Black & White, Grayscale, Enhanced Text

**Key Tasks - Smart Document Personalization** (Name, Roll No, Email, Phone, Class, Designation):
11. **Server-Side Field Detection** (FR-034-047): Regex patterns for name/roll/email/phone/class/designation detection in DOCX/PDF, LibreOffice/POI integration
12. **Profile Management**: Create/edit/delete user profiles in localStorage, profile dropdown for auto-fill
13. **Field Highlighting**: Highlight detected fields in document preview with confidence badges (95%+ = green, 70-94% = yellow)
14. **Instant Inline Editing**: Hover buttons for quick field replacement, "Replace all" vs "Replace selected"
15. **Live Preview Panel**: Canva-style live preview where users can click any text field to edit inline with instant updates
16. **Encryption & Privacy**: AES-256 encryption for server uploads, auto-delete <5min, privacy indicators (cloud icon)

**Key Tasks - Office Document Conversion** (merged from old Phase 6):
17. **Server-Side Setup**: LibreOffice headless or Apache POI integration with Node.js
18. **PDF → Word**: Convert PDF to DOCX with formatting preservation
19. **PDF → Excel**: Extract tables from PDF to XLSX
20. **PDF → PowerPoint**: Convert PDF pages to PPTX slides
21. **Word/Excel/PPT → PDF**: Convert Office documents to PDF with layout preservation
22. **Images → PDF**: Combine multiple images into single PDF
23. **Images → Word**: Insert images into Word document with automatic layout

**Key Tasks - E-Signatures & PDF Forms** (merged from old Phase 8):
24. **E-Signatures** (FR-083): Draw signature (signature_pad), upload signature image, type signature with fonts, position on document
25. **Signature Storage**: Store signatures locally in browser (localStorage), embed in PDF before download
26. **PDF Form Filling** (FR-085): Detect form fields automatically with pdf-lib, fill text fields, check checkboxes, select radio buttons, sign signature fields
27. **PDF Form Creation** (FR-086): Convert static PDF to fillable form by adding fields (text, checkbox, dropdown, signature)
28. **Request Signatures** (FR-084 - Phase 2): Document for Phase 2 (requires email service, tracking)

**Deliverables**:
- Complete PDF operations suite (merge, split, extract, organize, viewer)
- OCR for searchable PDFs with document scanning and edge detection
- Smart Document Personalization with instant field replacement and profile management
- Full Office ↔ PDF conversion with encrypted server processing
- E-signature workflow with form filling and creation

---

### Phase 5: Government Templates (Week 4: Days 1-2)

**Objective**: Auto-format government documents (FR-009 to FR-011)

**Key Tasks**:
1. **Government Templates**: JSON templates for DL, Passport, Aadhar, PAN, OCI with dimension/size requirements
2. **Auto-Formatting**: Auto-crop, resize, compress to meet template specs, quality validation
3. **Template UI**: Template selector, compliance badges, downloadable guides

**Deliverables**: Government template auto-formatting for Indian documents

---

### Phase 6: Batch Processing & Workflows (Week 5)

**Objective**: Multi-file batch, operation history, workflow presets (US3, US4 + FR-012 to FR-020, FR-065 to FR-073)

**Key Tasks**:
1. **Batch Processing** (FR-012 to FR-016): Upload 5 files (free tier), apply operations to all, individual progress tracking, ZIP download
2. **Graceful Failure**: Skip failed files, continue processing others, clear error messages
3. **Operation History** (FR-017 to FR-020): Show all operations, undo/redo with Ctrl+Z/Ctrl+Y, cumulative preview
4. **Multi-Operation Queue** (FR-065, FR-066): Queue operations (Resize → Crop → Compress), apply one-by-one or all-together
5. **Workflow Presets** (FR-067, FR-068): Save operation sequences ("Instagram Post"), load and apply with one click, stored in localStorage
6. **Keyboard Shortcuts** (FR-073): Ctrl+Z/Y (undo/redo), Ctrl+S (download), Ctrl+O (open), Ctrl+D (duplicate)
7. **File History** (FR-069 to FR-071): Last 5 files in IndexedDB, 24h auto-expiry, opt-in with privacy notice

**Deliverables**: Batch processing, undo/redo, workflow presets, keyboard shortcuts, file history

---

### Phase 7: PDF Advanced Features - LATER (Week 5)

**Objective**: PDF annotation, watermarking, and security features (FR-076-080, FR-087-089)

**Key Tasks - PDF Annotation & Watermarking**:
1. **PDF Annotation** (FR-077): Add text boxes, highlight text, add shapes (rectangles, circles, arrows), add comments
2. **PDF Watermarking** (FR-078): Text watermarks (custom text, position, rotation, opacity, font), image watermarks (logo, position, opacity, tiling)
3. **PDF Cropping** (FR-079): Crop pages to custom dimensions or standard sizes (A4, Letter) with visual crop tool
4. **PDF Redaction** (FR-080): Permanently remove sensitive info with black boxes, preview before finalizing
5. **PDF Page Numbers** (FR-076): Add page numbers with position control (corners, center), font size, transparency

**Key Tasks - PDF Security**:
6. **Unlock PDF** (FR-087): Remove password protection when user provides correct password using pdf-lib
7. **Protect PDF** (FR-088): Add password protection (open password, permission password), set document permissions (printing, editing, copying)
8. **Flatten PDF** (FR-089): Convert all form fields and annotations to static content (prevents editing)

**Deliverables**: Full PDF editing suite with annotation, watermarking, and security tools using pdf-lib

---

### Phase 8: AI Tools - FINAL PHASE (Week 6: Days 1-3)

**Objective**: AI-powered features (FR-090 to FR-094) - requires LLM API integration

**Key Tasks**:
1. **AI PDF Summarizer** (FR-090): Generate summaries using OpenAI/Claude API, adjustable length (brief/detailed), cite page numbers
2. **Translate PDF** (FR-091): Translate to 50+ languages using Google Translate/DeepL API, preserve formatting, download translated PDF
3. **Chat with PDF** (FR-092): Interactive Q&A using LLM with PDF context, cite page numbers, conversation history stored locally (IndexedDB)
4. **AI Question Generator** (FR-093): Generate quiz questions (MCQ, true/false, short answer) from PDF content
5. **AI Assistant** (FR-094): Natural language commands ("compress to 2MB", "remove pages 3-5") - Phase 2
6. **Server-Side Setup**: LLM API integration (OpenAI GPT-4 or Claude), PDF text extraction for context
7. **Privacy**: Encrypted file upload, conversation history local only, files deleted after processing

**Deliverables**: AI summarize, translate, chat, quiz generator working with server-side LLM

---

### Phase 9: Polish, Testing & Deployment (Week 6: Days 4-7)

**Objective**: Accessibility, performance, security audits, launch preparation

**Key Tasks**:
1. **Accessibility (WCAG 2.1 AA)**: axe-core audit, fix contrast/keyboard nav/ARIA labels, screen reader testing, 44px touch targets
2. **Performance Optimization**: Lighthouse 90+/95+/100/95+, code splitting (lazy-load Tesseract.js/jsfeat), bundle size <250KB, service worker caching
3. **Security Hardening**: Verify client-side operations remain client-side, AES-256 encryption, auto-delete <5min, no file logging, CSP headers, TLS 1.3
4. **Error Handling**: Global error boundary, user-friendly messages for all edge cases (corrupt files, network failures, browser compat)
5. **Documentation**: Quickstart guide, API docs (OpenAPI), help docs for all features, keyboard shortcuts guide, ADRs
6. **User Onboarding**: First-time onboarding tour, tooltips for key features
7. **Analytics & Monitoring**: Vercel Analytics (privacy-friendly), Sentry (sanitize file data), performance monitoring
8. **Testing**: All 27+ success criteria verified, cross-browser (Chrome/Firefox/Safari/Edge), mobile responsiveness, 80% coverage (100% critical paths)
9. **Production Deployment**: Configure Vercel environment, Cloudflare CDN, custom domain, SSL, rate limiting, uptime monitoring, status page
10. **Launch**: Deploy to production, smoke tests, monitor first 24 hours, rollback plan ready

**Deliverables**: Production-ready application with all 101 functional requirements, 15 privacy requirements, WCAG AA compliant, Lighthouse 90+/95+/100/95+

---

## Implementation Timeline Summary

**Total Duration**: 6 weeks (~30 business days)

**NEW PRIORITY-BASED BREAKDOWN**:

**WEEKS 1-2: Core Setup & Features (Phases 0-3)**
- Phase 0: Project Setup & Configuration (Days 1-3)
- Phase 1: Foundational Infrastructure (Days 4-7)
- Phase 2: Modern UI & File Upload (Week 2, Days 1-2)
- Phase 3: Image Operations (Week 2, Days 3-5)

**WEEKS 2-3: PDF CORE FEATURES - PRIORITY ⭐ (Phase 4)**
- PDF Basic Operations (Merge, Split, Extract, Organize, Viewer)
- OCR & Document Scanning (Tesseract.js, edge detection, filters)
- Smart Document Personalization (instant field replacement for name/roll/email/phone/class/designation)
- Office Document Conversion (PDF ↔ Word/Excel/PowerPoint, Images → PDF/Word)
- E-Signatures & PDF Forms (draw/upload/type signatures, form filling & creation)

**WEEK 4: Government Templates (Phase 5)**
- Auto-format Indian government documents (DL, Passport, Aadhar, PAN, OCI)

**WEEK 5: Workflows & Advanced PDF (Phases 6-7)**
- Phase 6: Batch Processing & Workflows
- Phase 7: PDF Advanced Features (annotation, watermarking, security) - LATER

**WEEK 6: AI & Launch (Phases 8-9)**
- Phase 8: AI Tools (summarize, translate, chat, quiz) - FINAL PHASE
- Phase 9: Polish, Testing & Deployment

**Critical Path**:
1. Phase 0 (Setup) → All other phases
2. Phase 1 (Foundation) → All feature phases
3. Phase 2 (Modern UI) → User-facing features
4. Phase 3 (Image Ops) → Government Templates
5. **Phase 4 (PDF Core - PRIORITY)** → Government Templates, Batch Processing, Advanced PDF, AI Tools
6. Phase 5 (Government Templates) → Phase 6 (Batch Processing)
7. Phases 3-7 (All Core Features) → Phase 8 (AI) → Phase 9 (Polish) → Launch

**Parallel Execution Opportunities**:
- Phases 3 (Images) and 4 (PDF Core) can partially overlap (different feature sets)
- Within Phase 4: PDF operations, OCR, and Office conversion can be developed in parallel (different libraries)
- Phase 7 (Advanced PDF) can be parallelized with Phase 6 (Batch) as both are lower priority

**Success Metrics** (Must pass before launch):
- All 101 functional requirements implemented and tested
- All 15 privacy & security requirements verified
- 27+ success criteria achieved
- 80% test coverage overall, 100% critical paths
- Lighthouse: Perf 90+, A11y 95+, BP 100, SEO 95+
- Bundle size: Initial <250KB (excluding lazy-loaded Tesseract.js), routes <100KB
- Performance: Client ops <3s (10MB), server ops <30s (50MB)
- WCAG 2.1 AA compliance
- Cross-browser compatibility (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile responsiveness (iPhone, Android, tablet)
