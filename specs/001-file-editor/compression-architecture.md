# Compression Architecture - FlowConvert

**Created**: 2025-11-21
**Status**: Approved for Implementation
**Phase**: Phase 1 (Simple API Routes), Phase 2+ (Serverless/Workers)

---

## Executive Summary

FlowConvert implements a **3-tier hybrid compression strategy** that prioritizes privacy (client-side first) while providing powerful server-side compression when needed. The architecture evolves from simple API routes (Phase 1 MVP) to distributed worker fleets (Phase 3 scale).

**Core Principle**: Client-side processing for 80% of jobs, intelligent server-side fallback for 20% requiring advanced compression.

---

## Compression Strategy Overview

### Tier 1: Client-Side Compression (Privacy-First)
**Coverage**: 80% of image files, 40% of PDFs
**Privacy**: 100% local processing, files never leave device
**Performance**: <3s for 10MB files

### Tier 2: Smart Server Compression (Consent-Required)
**Coverage**: 60% of PDFs, large files, Office documents
**Privacy**: AES-256 encryption, auto-delete <5min
**Performance**: <30s for 50MB files

### Tier 3: User-Controlled Quality (Advanced Mode)
**Coverage**: Power users, specific quality requirements
**Options**: High Quality / Balanced / Maximum Compression

---

## Tier 1: Client-Side Compression (ALWAYS TRIED FIRST)

### Images (PNG, JPG, WebP, GIF, BMP, TIFF)

**Library**: `browser-image-compression` (npm package)

**Algorithm**:
```typescript
1. Check if file.size <= targetSize → return original
2. Binary search on quality (0.95 → 0.10):
   - For each quality level:
     - Compress with browser-image-compression
     - Check if result.size <= targetSize
     - If yes: return result
     - If no: try lower quality
3. If minimum quality reached and still > target:
   - Scale down dimensions (90% → 80% → 70%)
   - Repeat binary search for each scale
4. Return best-effort result with warning if > target
```

**Target Size Mode**: User enters "Make this 200KB", system auto-adjusts quality to hit target

**Code Location**: `lib/client-processors/image-compression.ts`

---

### PDFs (Client-Side - Limited Compression)

**Library**: `pdf-lib` (JavaScript)

**Operations** (10-30% reduction only):
- Remove duplicate objects
- Compress streams (deflate)
- Remove unused resources
- Remove metadata (optional)
- Optimize embedded images (re-encode at lower quality)

**Limitations**:
- Cannot re-encode image streams deeply (browser limitation)
- Cannot linearize (requires native tools)
- Works best for PDFs with metadata bloat

**When to use**:
- Small PDFs (<5MB)
- Privacy-sensitive documents
- Quick optimization without quality loss

**Code Location**: `lib/client-processors/pdf-compression.ts`

**Example**:
```typescript
import { PDFDocument } from 'pdf-lib';

async function compressPDFClient(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Remove metadata
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setCreator('');

  // Save with compression
  const compressed = await pdfDoc.save({
    useObjectStreams: true, // Compress objects
    addDefaultPage: false,
  });

  return new Blob([compressed], { type: 'application/pdf' });
}
```

---

## Tier 2: Smart Server Compression (FALLBACK)

### When Server-Side is Triggered

**Automatic triggers**:
1. PDF file size > **5MB** OR page count > **20 pages**
2. Client-side compression fails to reach target (3 retries)
3. Office document conversion (DOCX/XLSX → PDF requires LibreOffice)
4. User explicitly requests "Maximum Compression"

**User consent modal**:
```
⚠️ Server Processing Required

This file requires server-side compression for best results.

• File will be encrypted (AES-256) before upload
• Processed on secure servers
• Automatically deleted after 5 minutes
• No file content is logged

[View Privacy Policy]  [Cancel]  [Continue]
```

---

### PDF Type Detection (Smart Routing)

**Step 1**: Analyze PDF structure using `qpdf --check`

**PDF Types**:
1. **Native/Text PDF**: Vector graphics, selectable text, form fields
2. **Scanned PDF**: Only images, no text layer (common for scanned documents)
3. **Hybrid PDF**: Mix of text pages and image pages

**Detection Algorithm**:
```typescript
async function detectPDFType(buffer: Buffer): Promise<'native' | 'scanned' | 'hybrid'> {
  const tmpPath = `/tmp/detect-${Date.now()}.pdf`;
  await fs.writeFile(tmpPath, buffer);

  // Use qpdf to analyze structure
  const { stdout } = await execAsync(`qpdf --check ${tmpPath}`);

  // Count text vs image pages using pdfinfo
  const { stdout: info } = await execAsync(`pdfinfo ${tmpPath}`);
  const pages = parseInt(info.match(/Pages:\s+(\d+)/)?.[1] || '0');

  // Extract text and check density
  const { stdout: text } = await execAsync(`pdftotext ${tmpPath} -`);
  const textLength = text.trim().length;
  const textDensity = textLength / pages;

  await fs.unlink(tmpPath);

  if (textDensity > 100) return 'native'; // >100 chars/page = text document
  if (textDensity < 10) return 'scanned'; // <10 chars/page = scanned
  return 'hybrid'; // Mix of both
}
```

---

### Pipeline A: Native/Text PDF (PRESERVE QUALITY)

**Goal**: Compress structure without losing text/vectors

**Tools**:
1. **qpdf**: Linearize, remove duplicates, compress streams
2. **Ghostscript**: Re-encode with balanced settings
3. **pdfcpu**: Metadata cleanup (optional)

**Algorithm**:
```bash
# Step 1: Linearize and compress streams
qpdf --linearize --compress-streams=y --object-streams=generate input.pdf tmp1.pdf

# Step 2: Ghostscript optimization (balanced quality)
gs -sDEVICE=pdfwrite \
   -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=tmp2.pdf tmp1.pdf

# Step 3: Metadata cleanup (optional)
pdfcpu optimize -stats tmp2.pdf output.pdf
```

**Quality Settings** (Ghostscript -dPDFSETTINGS):
- `/screen`: 72 DPI, maximum compression (150KB per page)
- `/ebook`: 150 DPI, balanced (recommended, 300KB per page)
- `/printer`: 300 DPI, high quality (600KB per page)
- `/prepress`: 300 DPI, preserve color profiles

**Expected Reduction**: 20-40% for native PDFs

**Code Location**: `lib/server-processors/pdf-native-compression.ts`

---

### Pipeline B: Scanned/Image-Heavy PDF (AGGRESSIVE)

**Goal**: Maximum compression by re-encoding images

**Tools**:
1. **mutool**: Extract embedded images
2. **Sharp** (libvips): Re-encode images at target quality
3. **pdf-lib** (Node.js): Rebuild PDF with compressed images

**Algorithm**:
```typescript
async function compressScannedPDF(inputPath: string, targetQuality: number = 75) {
  // Step 1: Extract images using mutool
  await execAsync(`mutool extract ${inputPath} -o /tmp/img`);

  // Step 2: Compress each image with Sharp
  const imageFiles = await fs.readdir('/tmp');
  const images = imageFiles.filter(f => f.startsWith('img-') && f.match(/\.(jpg|png)$/));

  for (const img of images) {
    await sharp(`/tmp/${img}`)
      .jpeg({ quality: targetQuality, mozjpeg: true }) // Use mozjpeg for better compression
      .toFile(`/tmp/compressed-${img}`);
  }

  // Step 3: Rebuild PDF with pdf-lib
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    const imgBytes = await fs.readFile(`/tmp/compressed-${img}`);
    const image = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const compressed = await pdfDoc.save();
  return Buffer.from(compressed);
}
```

**Quality Levels**:
- High Quality: JPEG 85, PNG optimization
- Balanced: JPEG 75, WebP conversion where applicable
- Maximum Compression: JPEG 60, aggressive downsampling

**Expected Reduction**: 40-70% for scanned PDFs

**Code Location**: `lib/server-processors/pdf-scanned-compression.ts`

---

### Pipeline C: Hybrid PDF (BALANCED)

**Goal**: Apply appropriate pipeline per page

**Algorithm**:
```typescript
async function compressHybridPDF(inputPath: string) {
  // Step 1: Detect which pages are text vs images
  const pageTypes = await detectPageTypes(inputPath); // ['text', 'image', 'text', 'image', ...]

  // Step 2: Split PDF by page type
  const textPages = pageTypes.map((type, i) => type === 'text' ? i + 1 : null).filter(Boolean);
  const imagePages = pageTypes.map((type, i) => type === 'image' ? i + 1 : null).filter(Boolean);

  // Step 3: Process text pages with Native pipeline
  const textPDF = await extractPages(inputPath, textPages);
  const compressedText = await compressNativePDF(textPDF);

  // Step 4: Process image pages with Scanned pipeline
  const imagePDF = await extractPages(inputPath, imagePages);
  const compressedImages = await compressScannedPDF(imagePDF);

  // Step 5: Merge results in original order
  const merged = await mergePDFs(compressedText, compressedImages, pageTypes);
  return merged;
}
```

**Expected Reduction**: 30-60% depending on text/image ratio

**Code Location**: `lib/server-processors/pdf-hybrid-compression.ts`

---

## Tier 3: User-Controlled Quality

### Quality Presets

**UI Component**: Radio buttons or slider in compression tool

**Options**:

1. **High Quality** (Minimal compression, preserve fidelity)
   - Images: JPEG 90, PNG lossless optimization
   - Native PDFs: qpdf only (no Ghostscript)
   - Scanned PDFs: JPEG 85
   - Reduction: 10-25%

2. **Balanced** (Recommended - best quality/size ratio)
   - Images: JPEG 80, WebP 75
   - Native PDFs: Ghostscript `/ebook`
   - Scanned PDFs: JPEG 75
   - Reduction: 30-50%

3. **Maximum Compression** (Aggressive, noticeable quality loss)
   - Images: JPEG 60, aggressive WebP, dimension reduction
   - Native PDFs: Ghostscript `/screen`, downsample images to 72 DPI
   - Scanned PDFs: JPEG 60, grayscale conversion
   - Reduction: 50-80%

**UI Location**: `components/compression/QualitySelector.tsx`

---

## Implementation Phases

### Phase 1: MVP (NOW - 0-10K users) - Simple API Routes

**Architecture**: Next.js API Routes + `child_process`

**Why**: Fast to build (1-2 weeks), good enough for 95% of use cases, serverless-compatible

**Stack**:
- **Frontend**: React + Zustand (compression state)
- **Client-side**: `browser-image-compression`, `pdf-lib`
- **Server-side**: Vercel Functions with binary layers (Ghostscript, qpdf, mutool)
- **Storage**: Temp filesystem (`/tmp`), auto-cleanup
- **Encryption**: AES-256 for uploads (crypto-js)

**File Structure**:
```
lib/
├── client-processors/
│   ├── image-compression.ts       # Tier 1 images
│   ├── pdf-compression.ts         # Tier 1 PDFs (pdf-lib)
│   └── compression-utils.ts       # Shared logic
├── server-processors/
│   ├── pdf-native-compression.ts  # Pipeline A (qpdf + Ghostscript)
│   ├── pdf-scanned-compression.ts # Pipeline B (mutool + Sharp)
│   ├── pdf-hybrid-compression.ts  # Pipeline C (combined)
│   └── pdf-type-detection.ts     # Detect PDF type
└── utils/
    ├── encryption.ts              # AES-256 for server uploads
    └── temp-file-manager.ts       # Auto-cleanup <5min

app/api/
├── compress/
│   ├── image/route.ts             # Image compression endpoint
│   ├── pdf/route.ts               # PDF compression endpoint (smart routing)
│   └── office/route.ts            # Office → PDF (future)
└── upload/route.ts                # Presigned upload (future)

components/compression/
├── ImageCompressor.tsx            # Image compression UI
├── PDFCompressor.tsx              # PDF compression UI
├── QualitySelector.tsx            # High/Balanced/Max presets
├── CompressionProgress.tsx        # Progress indicator
└── ConsentModal.tsx               # Server processing consent
```

**Deployment**:
- **Vercel Pro**: 60s timeout, 3GB memory
- **Binary layers**: Ghostscript (~100MB), qpdf (~20MB), mutool (~15MB), Sharp (native binary)
- **Environment**: Node.js 20 LTS

**Cost Estimate** (10K users, 20% server jobs):
- Vercel Pro: $20/month (included 100GB-hrs)
- S3 temp storage: $5/month (5min TTL)
- **Total**: ~$25/month

---

### Phase 2: Scale (6-12 months, 10K-100K users) - Serverless Functions

**Architecture**: Vercel Functions → AWS Lambda/S3

**Triggers for migration**:
- Consistent timeout issues (>5% jobs fail at 60s)
- Cost exceeds $200/month on Vercel
- Need longer processing times (15min Lambda vs 60s Vercel)

**Changes**:
1. Move compression logic to separate Lambda functions
2. Add S3 for temp storage with presigned URLs
3. Keep Next.js API routes as thin routing layer
4. Optional: Add Redis for job status tracking

**Stack**:
- **API**: Next.js API routes (routing only)
- **Workers**: AWS Lambda (Python or Node.js)
- **Storage**: S3 with presigned upload/download
- **Queue**: Optional Redis for job tracking
- **Monitoring**: CloudWatch + Sentry

**Cost Estimate** (100K users):
- Lambda: $50/month (1M requests, avg 10s execution)
- S3: $10/month (ephemeral storage)
- **Total**: ~$60/month (3x cheaper than VPS)

---

### Phase 3: Production Scale (12-24 months, 100K+ users) - Docker Workers

**Architecture**: Docker worker fleet + BullMQ (from FC_small_pdf_level_architecture.md)

**Triggers for migration**:
- Serverless costs exceed $500/month
- Need advanced features (priority queues, batch processing, custom workflows)
- Want fine-grained control and cost optimization

**Stack**:
```
Next.js API → Redis + BullMQ Queue → Docker Workers
                                      ├── worker-ghostscript (4 instances)
                                      ├── worker-qpdf (2 instances)
                                      ├── worker-mutool (2 instances)
                                      └── worker-sharp (4 instances)
                                           ↓
                                    S3/MinIO (temp storage)
                                           ↓
                                    Presigned URL → Client
```

**Infrastructure**:
- **API**: Next.js on Vercel (stateless)
- **Queue**: Redis (Upstash or self-hosted)
- **Workers**: Docker Compose (local dev) → Kubernetes (production)
- **Storage**: S3 or MinIO (self-hosted)
- **Monitoring**: Prometheus + Grafana, BullMQ dashboard

**Features**:
- Job prioritization (free vs premium users)
- Auto-scaling workers based on queue length
- Retry logic with exponential backoff
- Dead-letter queue for failed jobs
- Batch processing (100 PDFs → single ZIP)

**Cost Estimate** (500K users):
- VPS (8 CPU, 32GB RAM): $100/month (Hetzner or DigitalOcean)
- Redis: $15/month (Upstash)
- S3: $30/month
- **Total**: ~$145/month (10x cheaper than managed services)

**Implementation**: See `FC_small_pdf_level_architecture.md` for full details

---

## Quality Assurance & Testing

### Test Coverage Requirements

**Unit Tests** (lib/):
- ✅ `image-compression.test.ts`: Binary search algorithm, dimension scaling
- ✅ `pdf-compression.test.ts`: pdf-lib optimization
- ✅ `pdf-type-detection.test.ts`: Detect native/scanned/hybrid
- ✅ `pdf-native-compression.test.ts`: Ghostscript pipeline
- ✅ `pdf-scanned-compression.test.ts`: Image extraction + Sharp
- ✅ `encryption.test.ts`: AES-256 encrypt/decrypt

**Integration Tests** (tests/integration/):
- ✅ Image: 5MB JPG → target 500KB → verify <500KB, acceptable quality
- ✅ Native PDF: 10MB text PDF → 30% reduction, text still selectable
- ✅ Scanned PDF: 20MB scanned doc → 60% reduction, readable quality
- ✅ Hybrid PDF: 15MB mixed → verify smart routing per page type

**E2E Tests** (tests/e2e/):
- ✅ Client-side: Upload image → compress → preview → download
- ✅ Server fallback: Large PDF → consent modal → compress → download
- ✅ Quality presets: Test all 3 presets produce different file sizes
- ✅ Error handling: Corrupt file, timeout, network failure

**Success Criteria**:
- 80% test coverage overall
- 100% coverage for compression pipelines (critical path)
- All tests pass before deployment

---

## Privacy & Security

### Client-Side (Tier 1)
- ✅ All processing in browser (Web Workers for parallelism)
- ✅ No network requests for image/small PDF compression
- ✅ Files never leave user's device
- ✅ EXIF metadata removal optional (user-controlled)

### Server-Side (Tier 2)
- ✅ **Encryption**: AES-256 before upload, decrypt on server
- ✅ **Auto-delete**: Files deleted within 5 minutes (cron job verification)
- ✅ **No logging**: File content never logged (only metadata: size, type, duration)
- ✅ **HTTPS only**: TLS 1.3 minimum
- ✅ **Consent required**: Modal before any server upload
- ✅ **Privacy indicators**: Cloud icon ☁️ vs Shield icon 🛡️ (client-side)

### Compliance
- ✅ GDPR: User data (files) auto-deleted <5min
- ✅ No third-party tracking during compression
- ✅ Audit logs for enterprise (optional, Phase 3)

---

## Performance Targets

### Client-Side (Tier 1)
- ✅ **Images**: <3s for 10MB file
- ✅ **PDFs**: <5s for 5MB file (pdf-lib limited)
- ✅ **UI response**: <100ms for all user actions
- ✅ **Memory**: <500MB for single file processing

### Server-Side (Tier 2)
- ✅ **PDFs**: <30s for 50MB file (95th percentile)
- ✅ **Office**: <20s for DOCX → PDF (LibreOffice)
- ✅ **API**: <200ms routing latency (p95)
- ✅ **Uptime**: 99.9% (Phase 3 with workers)

### Bundle Size
- ✅ Initial load: <250KB gzipped (excluding lazy-loaded libraries)
- ✅ Compression module: <80KB (code-split)
- ✅ `browser-image-compression`: Lazy-loaded on demand (~50KB)
- ✅ `pdf-lib`: Lazy-loaded on demand (~200KB)

---

## Migration Path Summary

| Phase | Users | Architecture | Cost | When |
|-------|-------|--------------|------|------|
| **1 (MVP)** | 0-10K | Simple API Routes | $25/mo | NOW |
| **2 (Scale)** | 10K-100K | Serverless (Lambda) | $60/mo | 6-12 months |
| **3 (Enterprise)** | 100K+ | Docker Workers + BullMQ | $145/mo | 12-24 months |

**Key Insight**: Start simple (Phase 1), migrate only when needed (metrics-driven)

---

## Next Steps (Implementation)

1. ✅ **Approve architecture** (this document)
2. 🔄 **Update spec.md**: Add compression requirements (FR-003, FR-003-A)
3. 🔄 **Update plan.md**: Add compression phases
4. 🔄 **Update tasks.md**: Break down into actionable tasks
5. 🔄 **Implement Phase 1**: Client-side + simple API routes
6. ✅ **Test & validate**: Ensure 30-50% compression with acceptable quality
7. 🚀 **Launch MVP**: Monitor server usage, adjust thresholds

---

**Document Version**: 1.0
**Last Updated**: 2025-11-21
**Owner**: FlowConvert Team
**Status**: Ready for Implementation
