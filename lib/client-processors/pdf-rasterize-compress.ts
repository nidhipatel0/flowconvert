/**
 * PDF Compression via Page Rasterization
 * Converts PDF pages to images, compresses them, and rebuilds PDF
 * This achieves much better compression than pdf-lib alone
 */

import { PDFDocument } from 'pdf-lib';
import imageCompression from 'browser-image-compression';

// Global pdfjs type (loaded from CDN)
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface PDFRasterizeOptions {
  targetSizeBytes: number;
  quality?: number; // 0.1 to 1.0
  scale?: number; // DPI scale factor
  onProgress?: (progress: number, message: string) => void;
}

export interface PDFCompressionResult {
  success: boolean;
  compressedBlob?: Blob;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  metadata?: any;
  error?: string;
}

/**
 * Compress PDF by rasterizing pages to images and rebuilding
 */
export async function compressPDFByRasterization(
  file: File,
  options: PDFRasterizeOptions
): Promise<PDFCompressionResult> {
  const startTime = Date.now();
  const originalSize = file.size;

  try {
    const {
      targetSizeBytes,
      quality = 0.7,
      scale = 1.5,
      onProgress,
    } = options;

    onProgress?.(5, 'Loading PDF library...');

    // Load pdfjs from CDN (most reliable method for Next.js)
    const pdfjsLib = await loadPDFJS();
    
    onProgress?.(10, 'Loading PDF...');

    // Load PDF with pdf.js
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    onProgress?.(15, `PDF loaded: ${numPages} pages`);

    // Calculate target size per page (with some overhead for PDF structure)
    const perPageTarget = Math.floor((targetSizeBytes * 0.9) / numPages);

    // Create new PDF document
    const newPdfDoc = await PDFDocument.create();

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageProgress = 15 + ((pageNum / numPages) * 75);
      onProgress?.(pageProgress, `Compressing page ${pageNum}/${numPages}...`);

      // Get page
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      // Convert canvas to blob
      const pageBlob: Blob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
      });

      // Compress the image blob to target size
      const compressedImageBlob = await compressImageToSize(
        pageBlob,
        perPageTarget,
        quality
      );

      // Embed image in new PDF
      const imageBytes = new Uint8Array(await compressedImageBlob.arrayBuffer());
      const image = await newPdfDoc.embedJpg(imageBytes);

      // Add page with correct dimensions
      const pdfPage = newPdfDoc.addPage([viewport.width, viewport.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });

      // Cleanup
      canvas.remove();
    }

    onProgress?.(95, 'Finalizing PDF...');

    // Save the new PDF
    const pdfBytes = await newPdfDoc.save();
    const compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const compressedSize = compressedBlob.size;
    const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100;

    onProgress?.(100, 'Done!');

    return {
      success: true,
      compressedBlob,
      originalSize,
      compressedSize,
      reductionPercent,
      metadata: {
        duration: Date.now() - startTime,
        numPages,
        method: 'Page rasterization',
        quality: quality * 100,
      },
    };
  } catch (error) {
    console.error('[PDF Rasterize] Error:', error);
    return {
      success: false,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      error: error instanceof Error ? error.message : 'PDF compression failed',
    };
  }
}

/**
 * Load PDF.js from CDN (avoids Next.js import issues)
 */
async function loadPDFJS(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be loaded in browser');
  }

  // Check if already loaded
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  // Load from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        // Set worker path
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Helper: Compress image blob to approximate target size
 */
async function compressImageToSize(
  blob: Blob,
  targetBytes: number,
  initialQuality: number
): Promise<Blob> {
  const file = new File([blob], 'page.jpg', { type: 'image/jpeg' });

  // If already small enough, return as-is
  if (blob.size <= targetBytes) return blob;

  try {
    // Use binary search on quality
    let low = 0.1;
    let high = initialQuality;
    let bestBlob = blob;

    for (let i = 0; i < 5; i++) {
      const q = (low + high) / 2;
      const compressed = await imageCompression(file, {
        initialQuality: q,
        useWebWorker: false,
      } as any);

      if (compressed.size <= targetBytes) {
        bestBlob = compressed;
        low = q;
      } else {
        high = q;
      }

      if (Math.abs(high - low) < 0.05) break;
    }

    return bestBlob;
  } catch (error) {
    console.error('[Image compress] Error:', error);
    return blob; // Return original on error
  }
}

