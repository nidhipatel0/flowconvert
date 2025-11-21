# FlowConvert - Universal File Editor Platform

**Drop. Done. - Privacy First. Quality Always.**

FlowConvert is a comprehensive, privacy-first file editing platform that enables users to convert, compress, resize, crop, and edit files entirely in their browser.

## 🚀 Features (In Development)

- **🖼️ Image Editing**: Resize, compress, crop, rotate images with real-time preview
- **📄 PDF Tools**: Merge, split, extract pages - all client-side
- **🇮🇳 Government Document Formatting**: Auto-format for Indian documents (DL, Passport, Aadhar, PAN, OCI)
- **📝 Document Details Replacement**: Quickly replace personal/academic details in DOCX/PDF/PPT files
- **⚡ Batch Processing**: Edit multiple files simultaneously
- **🔒 100% Privacy**: Most operations happen client-side - your files never leave your device
- **📱 Mobile-Responsive**: Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router), React 18+
- **Language**: TypeScript 5.3+ (Strict Mode)
- **Styling**: Tailwind CSS 3+, Headless UI
- **State Management**: Zustand
- **Client-Side Processing**: browser-image-compression, pdf-lib, Tesseract.js, jsfeat
- **Testing**: Jest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions, Vercel

## 📋 Prerequisites

- Node.js 20+ LTS
- npm 10+

## 🏗️ Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd flowconvert
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
flowconvert/
├── app/                      # Next.js App Router pages
│   ├── (home)/              # Landing page
│   ├── editor/              # Main editor interface
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── file-upload/         # File upload components
│   ├── editor/              # Editor UI components
│   ├── ui/                  # Reusable UI components
│   └── ...
├── lib/                     # Core library code
│   ├── client-processors/   # Client-side file processing
│   ├── server-processors/   # Server-side processing (Phase 1)
│   ├── stores/              # Zustand state stores
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript type definitions
├── tests/                   # Test files
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
├── public/                  # Static assets
│   ├── government-templates/
│   └── assets/
└── specs/                   # Feature specifications
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run type-check` - Run TypeScript type checking

## 🎯 Development Principles

Per our [Constitution](./CLAUDE.md):

1. **Privacy First**: Client-side processing wherever possible
2. **User Experience**: Max 3 clicks from landing to conversion, <100ms visual response
3. **Code Quality**: TypeScript strict mode, cyclomatic complexity ≤10, 80% test coverage
4. **Testing**: TDD mandatory - write tests BEFORE implementation
5. **Accessibility**: WCAG 2.1 AA minimum compliance
6. **Performance**: Client ops <3s (10MB), Server ops <30s (50MB), Bundle <250KB

## 📚 Documentation

- [Feature Specification](./specs/001-file-editor/spec.md)
- [Implementation Plan](./specs/001-file-editor/plan.md)
- [Data Model](./specs/001-file-editor/data-model.md)
- [Research & Decisions](./specs/001-file-editor/research.md)
- [Tasks](./specs/001-file-editor/tasks.md)
- [API Contracts](./specs/001-file-editor/contracts/)

## 🔧 Configuration

### TypeScript

Strict mode enabled with the following rules:
- No `any` types (use `unknown` with type guards)
- Strict null checks
- No implicit returns
- No unused locals/parameters

**CRITICAL: TypeScript Error Prevention Rules** (Must follow to avoid compilation errors):

1. **Unused Variables/Imports (TS6133)**
   - Remove all unused imports immediately
   - Remove all declared but unused variables
   - Clean up destructured values that aren't used

2. **Null/Undefined Safety (TS2532, TS18048)**
   - Always add null checks before accessing object properties
   - Use optional chaining (`?.`) or explicit checks (`if (obj)`)
   - Check array elements exist before accessing: `if (arr[i] !== undefined)`
   - Example: `if (ctx) { ctx.drawImage(...) }` or `ctx?.drawImage(...)`

3. **Type Assertions and Literals**
   - Use `as const` for literal types: `{ type: 'degrees' as const }`
   - Cast to specific types when needed: `previousBlob as Blob`
   - Ensure interface properties match exactly

4. **Interface Completeness**
   - Always include all required properties in interface definitions
   - Don't assume properties exist - check the interface definition
   - Export/import types correctly between modules

5. **Blob/ArrayBuffer Handling**
   - Use `.buffer` for Uint8Array: `new Blob([uint8Array.buffer], ...)`
   - Ensure BlobPart types match (use ArrayBuffer, not Uint8Array directly)

6. **Array Access Safety**
   - Check array length before accessing: `if (pts.length >= 4) { const p3 = pts[3] }`
   - Verify indices exist before use

7. **useEffect Returns**
   - All useEffect hooks must return cleanup function or undefined
   - Example: `return () => { observer?.disconnect() };`

8. **Before Committing/Pushing**
   - **ALWAYS run**: `npx tsc --noEmit`
   - Fix ALL errors before committing
   - Do not suppress or ignore TypeScript errors

### ESLint

- Cyclomatic complexity limit: 10
- Max lines per function: 50
- No `console.log` (use `console.warn` or `console.error`)
- Accessibility rules enforced

### Tailwind CSS

Custom theme configured with:
- Privacy indicator colors (client-side: green, server-side: orange)
- Touch-friendly spacing (44px minimum)
- Accessible color contrasts
- Mobile-first breakpoints

## 🚧 Development Status

**Phase 0: Project Setup** ✅ COMPLETE
- [x] Next.js 14 with TypeScript
- [x] Tailwind CSS configuration
- [x] Jest + Playwright testing setup
- [x] ESLint + Prettier configuration
- [x] Project directory structure
- [x] Git hooks with Husky

**Phase 1: Foundational Infrastructure** 🚧 IN PROGRESS
- [ ] Type definitions
- [ ] Utility functions
- [ ] State management stores
- [ ] UI component library

**Phase 2: User Story 1 - Quick Single File Edit** 📋 PLANNED
**Phase 3: User Story 2 - Government Document Auto-Formatting** 📋 PLANNED

## 🤝 Contributing

This project follows Test-Driven Development (TDD). All tests must be written before implementation and must pass before merging.

1. Create a feature branch
2. Write tests first
3. Implement features to make tests pass
4. Ensure 80% test coverage
5. Run lint and type-check
6. Create pull request

## 📄 License

Copyright © 2025 FlowConvert. All rights reserved.

## 🙏 Acknowledgments

Built with privacy and quality as top priorities. All client-side processing powered by open-source libraries including pdf-lib, browser-image-compression, Tesseract.js, and jsfeat.

---

**Made with ❤️ for privacy-conscious users**
