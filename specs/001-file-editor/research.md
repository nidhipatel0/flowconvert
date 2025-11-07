# Research: Universal File Editor Platform

**Date**: 2025-11-06
**Feature**: 001-file-editor
**Phase**: Phase 0 - Technology Research & Decisions

## Overview

This document captures technology research, library comparisons, and architectural decisions for the Universal File Editor Platform. All decisions align with FlowConvert's privacy-first constitution and performance requirements.

## Research Areas

### 1. Client-Side Image Processing

**Requirement**: Process images (resize, compress, crop, rotate, convert formats) entirely in browser without server upload.

**Options Evaluated**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| browser-image-compression | Lightweight (6KB), fast compression, maintains quality, widely used (1M+ downloads/week) | Limited to compression/resize, no crop/rotate | ✅ **Selected** for compression |
| pica | High-quality resizing with Lanczos filter, fast Web Workers support | Larger bundle (45KB), more complex API | Consider for Phase 2 quality improvements |
| Canvas API (native) | No dependencies, full control, crop/rotate built-in | Manual implementation, cross-browser quirks | ✅ **Selected** for crop/rotate/flip |
| sharp-wasm | Same API as Sharp (server), WASM performance | Large bundle (2MB+), slow initial load | ❌ Rejected - bundle too large |

**Decision**:
- **browser-image-compression** for compress/resize (quality-focused, small bundle)
- **Native Canvas API** for crop/rotate/flip (zero dependencies)
- **File API + Blob** for format conversion (PNG→JPG, WebP, etc.)

**Rationale**: Prioritizes small bundle size (<200KB target) and privacy (100% client-side). Canvas API sufficient for basic operations. Pica considered for Phase 2 if quality complaints arise.

---

### 2. Client-Side PDF Operations

**Requirement**: Merge, split, extract pages from PDFs in browser without server upload.

**Options Evaluated**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| pdf-lib | Full PDF manipulation, create/modify/merge, actively maintained, TypeScript support | Larger bundle (200KB), learning curve | ✅ **Selected** |
| jsPDF | Lightweight (150KB), simple API, good docs | Limited to PDF creation, no existing PDF manipulation | ❌ Rejected - can't merge/split |
| PDFKit | Comprehensive, good for generation | Node.js only, not browser-compatible | ❌ Rejected |
| pdf.js (Mozilla) | Excellent rendering, widely used | Focused on viewing/rendering, not manipulation | Use for preview only |

**Decision**: **pdf-lib** for all PDF operations (merge, split, extract, basic text editing)

**Rationale**: Only mature library supporting full PDF manipulation in browser. 200KB bundle acceptable for PDF features. TypeScript support aligns with code quality standards.

---

### 3. Server-Side Document Processing (DOCX/PPT)

**Requirement**: Detect and replace text fields in DOCX/PPT files (Phase 1 server-side, Phase 2 client-side).

**Options Evaluated**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| LibreOffice Headless + Node.js | Accurate format preservation, handles complex docs, free | Requires LibreOffice install, slower processing | ✅ **Selected Phase 1** |
| Apache POI (via Java bridge) | Industry standard, excellent DOCX/PPT support | Requires Java runtime, complex setup | Consider if LibreOffice insufficient |
| docx.js (browser) | Pure JavaScript, client-side capable | Limited format support, formatting issues | ✅ **Research for Phase 2** |
| mammoth.js | DOCX → HTML conversion | One-way conversion, can't modify DOCX | ❌ Rejected |

**Decision Phase 1**: **LibreOffice Headless** via libreoffice-convert npm package
**Decision Phase 2**: Research **docx.js + PptxGenJS** for client-side migration

**Rationale**: LibreOffice provides best format preservation for complex academic/professional documents. Acceptable for Phase 1 given encryption + auto-delete privacy measures. Phase 2 migration to client-side prioritized in roadmap.

---

### 4. State Management

**Requirement**: Manage editor state (active files, operations, preview, profiles) with minimal complexity.

**Options Evaluated**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| Zustand | Minimal boilerplate, <1KB, hooks-based, TypeScript-friendly | Less ecosystem than Redux | ✅ **Selected** |
| Redux Toolkit | Comprehensive, dev tools, large ecosystem | Boilerplate overhead, 12KB bundle | ❌ Rejected - overkill for MVP |
| Context API (React native) | Zero dependencies, built-in | Re-render issues at scale, verbose | Use for theme/auth only |
| Jotai | Atomic state, minimal, modern | Less mature, smaller community | Consider Phase 2 |

**Decision**: **Zustand** for global state + **React Context** for theme/locale

**Rationale**: Zustand's minimal bundle (<1KB) and zero boilerplate aligns with performance targets. Context API sufficient for simple theme/locale needs. Redux unnecessary complexity for MVP.

---

### 5. Form Validation & Profile Management

**Requirement**: Validate user profiles (name, roll no, email, phone) and store in localStorage.

**Options Evaluated**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| React Hook Form + Zod | Best TypeScript integration, Zod schemas reusable, performant | Two dependencies | ✅ **Selected** |
| Formik + Yup | Mature, widely used, good docs | Larger bundle, more boilerplate | ❌ Rejected |
| React Final Form | Lightweight, flexible | Less TypeScript support | ❌ Rejected |
| Manual validation | Zero dependencies | Error-prone, verbose | ❌ Rejected |

**Decision**: **React Hook Form** + **Zod** for validation, **localStorage wrapper** for persistence

**Rationale**: Zod's TypeScript-first validation generates compile-time type safety. React Hook Form's uncontrolled inputs minimize re-renders. localStorage wrapper enables easy migration to IndexedDB (Phase 2).

---

### 6. UI Component Library

**Requirement**: Accessible (WCAG 2.1 AA), mobile-friendly (44px targets), customizable components.

**Options Evaluated**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| Tailwind CSS + Headless UI | Full control, small bundle, accessible primitives | Build components from scratch | ✅ **Selected** |
| shadcn/ui | Pre-built components, Tailwind-based, customizable | Copy-paste model (not npm package) | ✅ **Use for complex components** |
| Material-UI (MUI) | Comprehensive, accessible, mature | Large bundle (300KB+), opinionated design | ❌ Rejected - bundle too large |
| Chakra UI | Good DX, accessible, themeable | 150KB bundle, specific design system | ❌ Rejected |

**Decision**: **Tailwind CSS** base + **Headless UI** primitives + **shadcn/ui** for complex components

**Rationale**: Tailwind enables <200KB bundle target via purging unused styles. Headless UI provides accessible primitives (Dialog, Menu, Tabs). shadcn/ui components customizable as they're copied into project (no dependency bloat).

---

### 7. File Upload & Storage Strategy

**Requirement**: Handle drag-drop uploads, show progress, support 50MB free / 500MB premium, no permanent storage.

**Options Evaluated**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Direct S3 Upload (pre-signed URLs) | Scalable, fast, CDN-friendly | Requires AWS account, S3 costs | Phase 2 (when scaling) |
| Memory-only processing | Zero storage costs, instant, private | Limited by RAM, no resume capability | ✅ **Selected Phase 1** |
| Temporary disk + cleanup job | Handles large files, resumable | Storage costs, cleanup complexity | Phase 2 if memory insufficient |

**Decision Phase 1**: **Memory-only processing** with streaming where possible
- Client-side operations: Process in browser memory (File API)
- Server-side operations: Stream to temp memory, process, delete immediately
- Max file size enforced: 50MB free, 500MB premium

**Rationale**: Memory-only processing aligns with privacy-first principle (no disk persistence). 50MB files fit comfortably in modern device RAM. Streaming prevents memory spikes. S3 deferred to Phase 2 for scalability.

---

### 8. Testing Strategy

**Requirement**: TDD mandatory (80% coverage, 100% critical paths), unit + integration + E2E tests.

**Options Evaluated**:

| Tool | Pros | Cons | Decision |
|------|------|------|----------|
| Jest + React Testing Library | Industry standard, fast, good mocking | Config complexity for Next.js | ✅ **Selected** for unit/integration |
| Vitest + React Testing Library | Faster than Jest, Vite-native | Less mature, smaller ecosystem | Consider Phase 2 migration |
| Playwright | Fast, reliable E2E, cross-browser | Requires separate config | ✅ **Selected** for E2E |
| Cypress | Good DX, time-travel debugging | Slower, Electron-based | ❌ Rejected |

**Decision**:
- **Jest** + **React Testing Library** for unit/component tests
- **Playwright** for E2E tests (6 user stories = 6 E2E test suites)
- **Chromatic/Percy** for visual regression (optional, Phase 2)

**Rationale**: Jest + RTL is Next.js standard with excellent documentation. Playwright's speed and reliability critical for CI/CD. Visual regression deferred to Phase 2 (nice-to-have).

---

### 9. Deployment Strategy (Phase 1: 0-10K users)

**Requirement**: Single VPS, 8GB RAM, 4 CPU cores, handle 10K users, 99.5% uptime free tier.

**Options Evaluated**:

| Platform | Pros | Cons | Decision |
|----------|------|------|----------|
| Vercel | Zero config, Next.js optimized, free tier | Serverless cold starts, limited server processing | ✅ **Selected Phase 1** |
| VPS (DigitalOcean/Linode) | Full control, predictable costs, no cold starts | Manual setup, DevOps overhead | Phase 2 (10K+ users) |
| AWS (EC2 + ECS) | Scalable, comprehensive services | Complex, expensive for small scale | Phase 3 (100K+ users) |

**Decision Phase 1**: **Vercel** for frontend + API routes, **Cloudflare** for CDN
- Next.js deployed to Vercel (automatic deployments, edge functions)
- Static assets via Cloudflare CDN (government template files, icons)
- LibreOffice processing in Vercel serverless functions (10s timeout)

**Rationale**: Vercel's Next.js optimization and free tier ideal for MVP validation. Serverless functions handle DOCX/PPT processing with 10s timeout (sufficient per spec). Migrate to VPS in Phase 2 when processing volume increases or when 10s timeout insufficient.

---

### 10. Government Document Template Storage

**Requirement**: Store specs for Driving License, Passport, Aadhar, PAN, OCI (dimensions, file size limits, formats).

**Options Evaluated**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| JSON files in public/ | Simple, no API needed, CDN-cacheable | Manual updates | ✅ **Selected** |
| CMS (Contentful, Strapi) | Easy updates, versioning, API | Overkill for static data, costs | ❌ Rejected |
| Hardcoded in TypeScript | Type-safe, no network request | Requires rebuild for updates | ❌ Rejected |

**Decision**: **JSON files in public/government-templates/** with TypeScript interfaces

**Structure**:
```json
{
  "id": "driving-license",
  "name": "Driving License",
  "photo": {
    "dimensions": { "width": "3.5cm", "height": "4.5cm" },
    "maxSize": "100KB",
    "format": "JPG"
  },
  "document": {
    "dimensions": "A4",
    "maxSize": "500KB",
    "format": "PDF"
  }
}
```

**Rationale**: JSON files cacheable via CDN, easy to update without deployment. TypeScript interfaces provide compile-time validation. CMS overkill for 5 static templates.

---

### 11. OCR (Optical Character Recognition)

**Requirement**: Extract text from scanned images and make PDFs searchable, entirely client-side for privacy.

**Options Evaluated**:

| Library | Pros | Cons | Decision |
|---------|------|------|-------------|
| Tesseract.js | Free, open-source, runs in browser (WASM), 100+ languages, actively maintained | Large initial download (2-4MB), slower than cloud services | ✅ **Selected** |\
| Google Cloud Vision API | High accuracy (95%+), fast, handles handwriting well | Costs money, requires server-side, privacy concern | ❌ Rejected - privacy violation |
| AWS Textract | Excellent for forms/tables, high accuracy | Expensive, server-side only, complex setup | ❌ Rejected |
| Tesseract C++ (via WASM) | Faster than Tesseract.js | Complex build process, larger bundle | Consider if performance issues |

**Decision**: **Tesseract.js** for all OCR operations (Images-to-PDF, scanned PDFs)

**Rationale**: Only mature browser-based OCR solution. 100% client-side aligns with privacy-first principle. 2-4MB download acceptable for OCR feature (lazy-loaded). Free and open-source. Accuracy: 90%+ for typed text, 85%+ for handwriting (meets SC-021).

**Implementation Notes**:
- Lazy-load Tesseract.js only when user enables OCR (not on initial page load)
- Use `tesseract.js` worker pool for parallel page processing
- Pre-process images (enhance contrast, deskew) before OCR for better accuracy
- Language: Start with English, add Hindi/regional languages in Phase 2

---

### 12. Document Edge Detection & Perspective Correction

**Requirement**: Automatically detect document edges in photos and correct perspective (like scanner apps).

**Options Evaluated**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| OpenCV.js (WebAssembly) | Comprehensive computer vision library, edge detection algorithms (Canny, Sobel), perspective transform | Large bundle (8MB+), overkill for simple edge detection | Consider if advanced CV needed |
| jsfeat | Lightweight (200KB), corner detection, Harris corners algorithm | Lower-level API, requires manual implementation | ✅ **Selected** for corner detection |
| Custom Canvas API + Canny Edge | Full control, zero dependencies, educational | Manual implementation, complex algorithms | ✅ **Selected** approach |
| Perspective-transform.js | Lightweight wrapper for perspective correction | Depends on manual corner selection | ✅ **Selected** for transformation |

**Decision**: **Custom implementation using Canvas API + jsfeat for corner detection + perspective-transform library**

**Rationale**:
- Avoid 8MB OpenCV.js bundle (too large for single feature)
- jsfeat (200KB) + perspective-transform (10KB) = 210KB total (acceptable)
- Canvas API for preprocessing (contrast enhancement, grayscale conversion)
- Provides "good enough" edge detection for 90% of documents (meets SC-022)
- Users can manually adjust corners if auto-detection uncertain

**Algorithm**:
1. Convert image to grayscale
2. Apply Gaussian blur to reduce noise
3. Edge detection using Canny algorithm (via Canvas API filters)
4. Find 4 corners using Harris corner detection (jsfeat)
5. Apply perspective transform to straighten document
6. Show draggable handles for manual adjustment

---

### 13. File History Storage (IndexedDB)

**Requirement**: Store recent 5 edited files (full file data) locally for 24 hours with automatic expiry.

**Options Evaluated**:

| Storage | Pros | Cons | Decision |
|---------|------|------|----------|
| localStorage | Simple API, synchronous, widely supported | 5-10MB storage limit (too small for files), blocks main thread | ❌ Rejected |
| sessionStorage | Clears on tab close (good for privacy) | Same size limits as localStorage, lost on accidental close | ❌ Rejected |
| IndexedDB | Large storage (50MB-1GB+), async, handles Blobs natively, expiry support | More complex API than localStorage | ✅ **Selected** |
| Cache API | Fast, good for binary data | Not designed for app data, harder to manage expiry | ❌ Rejected |

**Decision**: **IndexedDB** for file history storage

**Rationale**:
- Handles large binary files (Blobs) natively without encoding overhead
- 200MB storage easily handles 5 files × 40MB average = 200MB
- Asynchronous API doesn't block UI
- Built-in indexing for fast lookups by expiry timestamp
- Automatic expiry via `expiresAt` index + background cleanup

**Implementation**:
```typescript
// Database: flowconvert_history
// Store: fileHistory
// Indexes: expiresAt (for cleanup), savedAt (for sorting)
// Max 5 entries, auto-delete oldest if exceeded
// Background job: Every hour, delete entries where expiresAt < Date.now()
```

---

### 14. Operation Queue Management

**Requirement**: Execute multiple operations in sequence or batch with pause/resume capability.

**Options Evaluated**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Promise.all() (batch) | Simple, runs operations in parallel, built-in | No pause/resume, no intermediate states | ✅ Use for BATCH mode |
| Async generator with yield | Pauseable, step-by-step execution, intermediate previews | More complex code, less familiar pattern | ✅ Use for SEQUENTIAL mode |
| RxJS Observables | Powerful stream control, operators for queue logic | Large library (50KB+), steep learning curve | ❌ Rejected - overkill |
| Custom state machine | Full control, no dependencies | Manual implementation, more code to maintain | Backup option |

**Decision**: **Hybrid approach - Promise.all() for batch, Async generators for sequential**

**Rationale**:
- BATCH mode: `Promise.all()` executes operations in parallel (faster), shows final result only
- SEQUENTIAL mode: Async generator yields after each operation, shows intermediate preview, allows pause
- Zero dependencies for core logic (uses built-in JavaScript features)
- Pause/resume implemented via generator.next() control flow

**Implementation**:
```typescript
// BATCH mode
async function executeBatch(operations) {
  return Promise.all(operations.map(op => executeOperation(op)));
}

// SEQUENTIAL mode with pause support
async function* executeSequential(operations) {
  for (const op of operations) {
    const result = await executeOperation(op);
    yield result; // Pause here, show preview, wait for user confirmation
  }
}
```

---

### 15. Percentage-Based Resizing Calculations

**Requirement**: Allow users to resize images by percentage (50% = half size) in addition to pixel dimensions.

**Decision**: **Client-side calculation with Canvas API**

**Implementation**:
```typescript
function resizeByPercentage(image: HTMLImageElement, percent: number): HTMLCanvasElement {
  const newWidth = Math.round(image.width * (percent / 100));
  const newHeight = Math.round(image.height * (percent / 100));
  return resizeByPixels(image, newWidth, newHeight);
}

// Presets: 25%, 50%, 75%, 125%, 150%, 200%
// Custom: User enters any integer 1-1000%
```

**Rationale**: Simple calculation, reuses existing resize logic, no dependencies.

---

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 14+ (App Router) + React 18+
- **Language**: TypeScript 5.3+ (strict mode)
- **Styling**: Tailwind CSS 3+ + Headless UI + shadcn/ui components
- **State**: Zustand (global) + React Context (theme/locale)
- **Forms**: React Hook Form + Zod validation
- **Client Processing**: browser-image-compression, pdf-lib, Canvas API, Tesseract.js (OCR), jsfeat (edge detection), perspective-transform
- **Storage**: localStorage (profiles, workflows), IndexedDB (file history)

### Backend (Next.js API Routes)
- **Runtime**: Node.js 20+ LTS
- **Document Processing**: libreoffice-convert (DOCX/PPT)
- **Image Processing**: Sharp (server-side fallback)
- **Encryption**: crypto (AES-256 for uploads)
- **File Handling**: Streaming + memory-only (no disk persistence)

### Testing
- **Unit/Integration**: Jest + React Testing Library
- **E2E**: Playwright
- **Visual Regression**: Chromatic/Percy (Phase 2)
- **Coverage**: 80% minimum, 100% critical paths

### Deployment (Phase 1)
- **Hosting**: Vercel (frontend + serverless functions)
- **CDN**: Cloudflare (static assets, government templates)
- **Monitoring**: Vercel Analytics + Sentry (errors)
- **CI/CD**: GitHub Actions (lint, test, build, deploy)

---

## Open Research Questions (Phase 2)

1. **Client-side DOCX/PPT processing**: Evaluate docx.js + PptxGenJS for Phase 2 offline migration
   - Priority: High (privacy-first principle)
   - Timeline: Research in Month 3, implement Phase 2

2. **Advanced PDF editing**: Investigate pdf-lib capabilities for inline text editing (Canva-style)
   - Priority: Medium (Phase 2 enhancement)
   - Alternatives: PDF.js for rendering + custom editor overlay

3. **AI field detection**: Research NLP libraries for smart field detection beyond regex patterns
   - Priority: Low (Phase 2 enhancement, not MVP)
   - Alternatives: OpenAI API, Anthropic Claude API (server-side with privacy measures)

4. **PWA + Native Apps**: Research React Native for Phase 2 native iOS/Android apps
   - Priority: Medium (after web MVP validated)
   - Alternatives: Capacitor (reuse web code), Flutter (separate codebase)

5. **Scalability**: Research Redis for queue management when DOCX/PPT processing volume increases
   - Priority: Medium (Phase 2 at 10K+ users)
   - Current: Vercel serverless sufficient for 0-10K users

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-06 | Next.js 14 App Router | Full-stack framework, file-system routing, server components, API routes |
| 2025-11-06 | TypeScript strict mode | Type safety, fewer runtime errors, better DX |
| 2025-11-06 | Zustand for state | Minimal bundle (<1KB), zero boilerplate, hooks-based |
| 2025-11-06 | Tailwind + Headless UI | Small bundle via purging, accessible primitives, full control |
| 2025-11-06 | browser-image-compression | Lightweight (6KB), quality-focused, privacy-friendly |
| 2025-11-06 | pdf-lib | Only mature browser PDF manipulation library |
| 2025-11-06 | LibreOffice server-side | Best DOCX/PPT format preservation (Phase 1), migrate Phase 2 |
| 2025-11-06 | Jest + Playwright | Industry standard testing stack for Next.js |
| 2025-11-06 | Vercel deployment | Zero-config Next.js hosting, free tier, automatic deployments |
| 2025-11-06 | localStorage for profiles | Privacy-friendly (client-only), zero backend, easy migration to IndexedDB |
| 2025-11-06 | Tesseract.js for OCR | Only mature browser-based OCR, 100% client-side, free, meets 85%+ accuracy target |
| 2025-11-06 | jsfeat + perspective-transform | Lightweight (210KB total) vs OpenCV.js (8MB), good enough for 90% of documents |
| 2025-11-06 | IndexedDB for file history | Handles large Blobs natively, 200MB+ storage, async API, built-in expiry support |
| 2025-11-06 | Async generators for sequential queue | Pauseable execution, intermediate previews, zero dependencies |
| 2025-11-06 | localStorage for workflow presets | Simple key-value storage, easy CRUD, no need for IndexedDB complexity |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LibreOffice processing timeout (>10s for large DOCX) | Medium | High | Phase 1: 10s Vercel limit sufficient per spec (<30s for 50MB). Phase 2: Migrate to VPS with longer timeouts or background jobs |
| Browser memory limits (large files) | Low | Medium | Enforce 50MB free tier limit. Streaming for large files. Phase 2: Chunked processing |
| Bundle size exceeds 200KB target | Medium | Medium | Aggressive code splitting, dynamic imports, tree shaking. Monitor with bundlesize CI check |
| Cross-browser compatibility issues | Low | Medium | Playwright tests across Chrome, Firefox, Safari, Edge. Polyfills for older browsers if needed |
| Government template specs outdated | High | Low | Annual review process (Q4). User feedback form for spec changes |

---

**Next Steps**: Proceed to Phase 1 (data-model.md, contracts/, quickstart.md)
