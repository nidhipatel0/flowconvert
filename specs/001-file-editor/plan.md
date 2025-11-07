# Implementation Plan: Universal File Editor Platform

**Branch**: `001-file-editor` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-file-editor/spec.md`

**Note**: This plan covers Phase 1 MVP implementation. Phase 2 enhancements (offline document editing, advanced AI, full Canva-style editor) are documented in spec.md Out of Scope section.

## Summary

Build a privacy-first, comprehensive file editing platform that enables users to:
1. Convert, compress, resize, crop, rotate images (client-side)
2. Merge, split, extract PDF pages (client-side)
3. Format documents for Indian government applications (auto-sizing, compression)
4. Replace personal/academic details in DOCX/PDF/PPT files (server-side Phase 1, client-side Phase 2)
5. Process multiple files in batch with operation history and undo
6. Search tools with natural language queries and guided assistance

**Technical Approach**: Next.js 14 full-stack web application with React 18, TypeScript strict mode, client-side processing for images/PDFs, server-side processing for DOCX/PPT operations (encrypted, auto-deleted), localStorage for user profiles, mobile-responsive PWA-ready design.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 20+ LTS
**Primary Dependencies**:
- Frontend: Next.js 14+, React 18+, Tailwind CSS 3+, Zustand (state), React Hook Form + Zod (validation)
- Client-side Processing: browser-image-compression, pdf-lib, jszip, pako, heic2any, Tesseract.js (OCR), jsfeat (edge detection), perspective-transform
- Server-side Processing: Sharp (images), LibreOffice/Apache POI (DOCX/PPT), pdf-parse (PDF text extraction)
- Storage: localStorage (profiles, workflows), IndexedDB (file history with 24h expiry)
- Testing: Jest, React Testing Library, Playwright, Chromatic/Percy

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
- Single VPS deployment (8GB RAM, 4 CPU cores)
- 7 user stories (2x P1 MVP, 4x P2, 1x P3)
- 76 functional requirements (including 17 advanced UX features), 12 privacy requirements
- 27 success criteria

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
- Performance: <3s client, <30s server, <200KB bundles
