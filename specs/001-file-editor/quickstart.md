# Developer Quickstart: Universal File Editor Platform

**Feature**: 001-file-editor
**Last Updated**: 2025-11-06
**Target Audience**: Developers setting up local development environment

---

## Overview

This guide helps you set up FlowConvert's Universal File Editor Platform locally in under 10 minutes. The platform is a Next.js 14 full-stack web application with TypeScript, featuring client-side image/PDF processing and server-side DOCX/PPT processing.

**Tech Stack**: Next.js 14 (App Router) + React 18 + TypeScript 5.3+ + Tailwind CSS + Zustand + Jest + Playwright

---

## Prerequisites

Before starting, ensure you have:

- **Node.js**: 20+ LTS ([Download](https://nodejs.org/))
- **npm**: 10+ or **yarn**: 1.22+ (comes with Node.js)
- **Git**: 2.30+ ([Download](https://git-scm.com/))
- **LibreOffice**: 7.0+ (for DOCX/PPT server-side processing)
  - **Windows**: [Download LibreOffice](https://www.libreoffice.org/download/download/)
  - **macOS**: `brew install libreoffice`
  - **Linux**: `sudo apt-get install libreoffice` (Ubuntu/Debian)
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

**Optional** (for Phase 2):
- Docker (for containerized deployment)
- PostgreSQL 15+ (for user data persistence)

---

## Quick Start (10 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/flowconvert.git
cd flowconvert
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

**Expected time**: 2-3 minutes

### 3. Environment Configuration

Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with required values:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# File Upload Limits (bytes)
NEXT_PUBLIC_MAX_FILE_SIZE_FREE=52428800        # 50MB
NEXT_PUBLIC_MAX_FILE_SIZE_PREMIUM=524288000    # 500MB (Phase 2)
NEXT_PUBLIC_MAX_BATCH_FILES_FREE=5
NEXT_PUBLIC_MAX_BATCH_FILES_PREMIUM=25         # Phase 2

# Server Processing (Phase 1)
LIBREOFFICE_PATH=/usr/bin/libreoffice          # Linux/macOS
# LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.exe  # Windows
ENCRYPTION_KEY=your-32-character-aes-256-key-here  # Generate with: openssl rand -base64 32

# Privacy & Security
ENABLE_FILE_LOGGING=false                       # NEVER set to true (privacy violation)
AUTO_DELETE_TIMEOUT=300000                      # 5 minutes in milliseconds

# Analytics (Phase 2)
# NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-vercel-analytics-id

# Feature Flags
NEXT_PUBLIC_ENABLE_SERVER_PROCESSING=true
NEXT_PUBLIC_ENABLE_GOVERNMENT_TEMPLATES=true
NEXT_PUBLIC_ENABLE_DOCUMENT_REPLACEMENT=true
NEXT_PUBLIC_ENABLE_BATCH_PROCESSING=true
```

**Generate encryption key**:
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 4. Verify LibreOffice Installation

```bash
# macOS/Linux
libreoffice --version

# Windows (PowerShell)
& "C:\Program Files\LibreOffice\program\soffice.exe" --version
```

**Expected output**: `LibreOffice 7.x.x.x`

If not found, update `LIBREOFFICE_PATH` in `.env.local` to match your installation path.

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
```

**Expected output**:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

### 6. Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see the FlowConvert landing page with file upload zone.

---

## Project Structure

```
flowconvert/
├── app/                      # Next.js 14 App Router
│   ├── (home)/
│   │   └── page.tsx         # Landing page with file upload
│   ├── editor/
│   │   └── page.tsx         # Main editor interface
│   ├── api/                 # API routes
│   │   ├── upload/
│   │   ├── process/
│   │   └── templates/
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Tailwind base styles
├── components/              # React components
│   ├── file-upload/
│   ├── editor/
│   ├── document-replacement/
│   ├── government-templates/
│   └── ui/                  # Base UI components (shadcn/ui)
├── lib/                     # Core logic
│   ├── client-processors/   # Browser-side processing
│   ├── server-processors/   # Node.js processing
│   ├── stores/              # Zustand state management
│   ├── utils/
│   └── types/
├── public/
│   ├── government-templates/  # Template specs (JSON)
│   └── assets/
├── tests/                   # Jest + Playwright tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local               # Environment variables (git-ignored)
├── .env.example             # Environment template
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

---

## Development Workflow

### Running Tests

**Unit + Integration Tests** (Jest + React Testing Library):
```bash
npm run test
# or with coverage
npm run test:coverage
```

**E2E Tests** (Playwright):
```bash
npm run test:e2e
# or with UI
npm run test:e2e:ui
```

**TDD Workflow (MANDATORY per constitution)**:
1. Write failing test in `tests/unit/` or `tests/integration/`
2. Run `npm run test:watch` to auto-run tests on changes
3. Implement feature until test passes
4. Refactor if needed
5. Commit with test + implementation together

### Linting & Formatting

```bash
# Lint check
npm run lint

# Lint fix
npm run lint:fix

# Format with Prettier
npm run format

# Type check
npm run type-check
```

**Pre-commit hooks** (Husky):
- Automatically runs linting + type checking before commits
- Configured in `.husky/pre-commit`

### Building for Production

```bash
npm run build
npm run start
```

Access production build at [http://localhost:3000](http://localhost:3000)

---

## Common Development Tasks

### 1. Adding a New File Operation

**Example**: Add "Flip Image Vertically" operation

1. **Write test first** (TDD):
```typescript
// tests/unit/lib/image-processor.test.ts
describe('flipVertically', () => {
  it('should flip image vertically', async () => {
    const inputFile = await loadTestImage('test-image.jpg');
    const result = await flipVertically(inputFile);
    expect(result).toBeDefined();
    expect(result.height).toBe(inputFile.height);
    expect(result.width).toBe(inputFile.width);
    // Verify pixel data flipped (compare with reference image)
  });
});
```

2. **Implement function**:
```typescript
// lib/client-processors/image-processor.ts
export async function flipVertically(file: File): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = await loadImage(file);

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.scale(1, -1);
  ctx.drawImage(img, 0, -img.height);

  return canvasToBlob(canvas);
}
```

3. **Add to operation enum**:
```typescript
// lib/types/file.ts
enum OperationType {
  // ... existing operations
  FLIP_VERTICAL = 'FLIP_VERTICAL',
}
```

4. **Add to UI toolbar**:
```typescript
// components/editor/Toolbar.tsx
<Button onClick={() => applyOperation('FLIP_VERTICAL')}>
  Flip Vertical
</Button>
```

### 2. Adding Government Document Template

1. **Create JSON spec**:
```json
// public/government-templates/voter-id.json
{
  "id": "voter-id",
  "name": "Voter ID Card",
  "description": "Indian Voter ID photo specifications",
  "photo": {
    "dimensions": {
      "width": "3.5cm",
      "height": "4.5cm"
    },
    "maxSize": "50KB",
    "format": "JPG",
    "aspectRatio": "1:1"
  },
  "guidelines": [
    "White background required",
    "Face must be centered and clearly visible",
    "No glasses or headwear (except religious)"
  ]
}
```

2. **Update template enum**:
```typescript
// lib/types/file.ts
interface ApplyTemplateParameters {
  templateId: 'driving-license' | 'passport' | 'aadhar' | 'pan-card' | 'oci-application' | 'voter-id';
}
```

3. **Template appears automatically in UI** (loaded from `public/government-templates/`)

### 3. Testing Government Template Formatting

```bash
# Start dev server
npm run dev

# In browser:
# 1. Upload test image (e.g., 5MB photo.jpg)
# 2. Click "Government Templates" tab
# 3. Select "Voter ID Card"
# 4. System auto-resizes to 3.5cm x 4.5cm
# 5. System compresses to <50KB
# 6. Preview shows before/after side-by-side
# 7. Download formatted image
```

---

## Troubleshooting

### Issue: `LibreOffice not found` error

**Symptoms**: Document replacement fails with "LibreOffice executable not found"

**Solution**:
1. Verify LibreOffice installed: `libreoffice --version`
2. Find installation path:
   - **Windows**: `C:\Program Files\LibreOffice\program\soffice.exe`
   - **macOS**: `/Applications/LibreOffice.app/Contents/MacOS/soffice`
   - **Linux**: `/usr/bin/libreoffice`
3. Update `LIBREOFFICE_PATH` in `.env.local`
4. Restart dev server: `npm run dev`

### Issue: File upload fails with 413 error

**Symptoms**: Large files fail to upload

**Solution**:
1. Check file size: Must be <50MB for free tier
2. Verify `NEXT_PUBLIC_MAX_FILE_SIZE_FREE` in `.env.local`
3. For server-side processing, check Next.js API route config:
```typescript
// app/api/upload/route.ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
```

### Issue: Tests failing with "Canvas is not defined"

**Symptoms**: Jest tests fail when using Canvas API

**Solution**:
1. Install `jest-canvas-mock`:
```bash
npm install --save-dev jest-canvas-mock
```

2. Add to Jest setup:
```typescript
// jest.setup.js
import 'jest-canvas-mock';
```

### Issue: TypeScript errors for `any` types

**Symptoms**: `error TS2322: Type 'any' is not assignable to type 'unknown'`

**Solution**: FlowConvert constitution requires **no `any` types**. Use `unknown` with type guards:
```typescript
// ❌ Bad
function processFile(file: any) { ... }

// ✅ Good
function processFile(file: unknown) {
  if (file instanceof File) {
    // TypeScript knows file is File here
  }
}
```

### Issue: Lighthouse performance score <90

**Symptoms**: Performance audit fails in CI/CD

**Solution**:
1. Check bundle size: `npm run build` → ensure <200KB gzipped
2. Enable code splitting:
```typescript
// Use dynamic imports for heavy components
const PDFEditor = dynamic(() => import('@/components/editor/PDFEditor'), {
  ssr: false,
  loading: () => <Spinner />,
});
```
3. Optimize images in `public/assets/`
4. Enable Cloudflare CDN for static assets (production only)

---

## Testing User Stories

Each user story has an E2E test in `tests/e2e/`. Run specific story:

```bash
# User Story 1: Quick single file edit
npm run test:e2e -- user-story-1.spec.ts

# User Story 2: Government doc formatting
npm run test:e2e -- user-story-2.spec.ts

# All E2E tests
npm run test:e2e
```

**Manual testing checklist**: See `specs/001-file-editor/checklists/requirements.md`

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | App URL |
| `NEXT_PUBLIC_MAX_FILE_SIZE_FREE` | Yes | `52428800` (50MB) | Max file size for free tier |
| `LIBREOFFICE_PATH` | Yes | `/usr/bin/libreoffice` | Path to LibreOffice executable |
| `ENCRYPTION_KEY` | Yes | - | 32-character AES-256 key for server uploads |
| `ENABLE_FILE_LOGGING` | No | `false` | **NEVER** set to true (privacy violation) |
| `AUTO_DELETE_TIMEOUT` | Yes | `300000` (5 min) | Auto-delete timeout for server files (ms) |

**Security Note**: NEVER commit `.env.local` to Git. Use `.env.example` for documentation only.

---

## Next Steps

1. **Implement User Story 1** (Quick single file edit):
   - Focus on image compression + resize
   - TDD: Write E2E test first → implement → pass test
   - See `specs/001-file-editor/spec.md` for acceptance criteria

2. **Set up CI/CD** (GitHub Actions):
   - Lint + type check on PR
   - Run unit + integration tests
   - Run E2E tests on Playwright cloud
   - Deploy to Vercel staging on merge to `main`

3. **Review Project Constitution**:
   - Read `.specify/memory/constitution.md`
   - Ensure all PRs comply with privacy/security principles
   - Maintain 80% test coverage minimum

4. **Explore Design Artifacts**:
   - `specs/001-file-editor/spec.md` - Feature specification
   - `specs/001-file-editor/data-model.md` - Entity schemas
   - `specs/001-file-editor/contracts/` - API contracts (OpenAPI)
   - `specs/001-file-editor/research.md` - Technology decisions

---

## Getting Help

- **Documentation**: `specs/001-file-editor/` directory
- **Code Examples**: See `tests/` directory for usage patterns
- **Constitution**: `.specify/memory/constitution.md` for principles
- **Issues**: GitHub Issues (link TBD)
- **Discussions**: GitHub Discussions (link TBD)

---

## Development Tips

1. **Use TypeScript strict mode**: Catch errors at compile-time, not runtime
2. **Write tests first**: TDD is mandatory per constitution (80% coverage)
3. **Keep components small**: Max 200 lines, complexity ≤10
4. **Client-side first**: Only use server processing when absolutely necessary (privacy-first)
5. **Profile performance**: Use React DevTools Profiler to identify slow renders
6. **Commit frequently**: Small, atomic commits with clear messages (conventional commits)
7. **Review before PR**: Run `npm run lint && npm run type-check && npm run test` locally

---

**Last Updated**: 2025-11-06
**Maintained By**: FlowConvert Team
**Version**: 1.0.0 (Phase 1 MVP)
