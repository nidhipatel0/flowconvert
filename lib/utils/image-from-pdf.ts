/**
 * PDF to Image Conversion Utility
 *
 * Converts PDF pages to high-resolution images for OCR processing.
 * Uses existing pdf-renderer utilities and renders at 300 DPI for optimal OCR accuracy.
 *
 * Based on best practices from OCR_BACKEND.md: Use 300 DPI images for accurate OCR.
 */

import { loadPDF, renderPDFPage } from './pdf-renderer';

/**
 * Convert a PDF page to a high-resolution image for OCR
 *
 * @param pdfBlob - PDF file as Blob
 * @param pageNumber - Page number (1-indexed)
 * @param dpi - DPI for rendering (default: 600 for maximum OCR accuracy)
 * @returns Image blob (PNG format)
 * @throws Error if PDF fails to load or page doesn't exist
 */
export async function convertPDFPageToImage(
  pdfBlob: Blob,
  pageNumber: number,
  dpi: number = 600
): Promise<Blob> {
  try {
    console.log('[PDF-to-Image] Converting PDF page to image:', {
      pageNumber,
      dpi,
      blobSize: pdfBlob.size,
    });

    // Load PDF document
    const pdfDoc = await loadPDF(pdfBlob);
    const totalPages = pdfDoc.numPages;

    console.log('[PDF-to-Image] PDF loaded, total pages:', totalPages);

    // Validate page number
    if (pageNumber < 1 || pageNumber > totalPages) {
      throw new Error(`Invalid page number ${pageNumber}. PDF has ${totalPages} pages.`);
    }

    // Create canvas for rendering
    const canvas = document.createElement('canvas');

    // Calculate scale for desired DPI
    // PDF.js renders at 72 DPI by default
    // Scale = desired DPI / 72
    const scale = dpi / 72;

    console.log('[PDF-to-Image] Rendering page at scale:', scale);

    // Render PDF page to canvas at high resolution
    await renderPDFPage(pdfDoc, pageNumber, canvas, { scale });

    console.log('[PDF-to-Image] Page rendered, canvas size:', {
      width: canvas.width,
      height: canvas.height,
    });

    // Convert canvas to Blob (PNG format for best OCR quality)
    const imageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/png', // PNG format preserves quality
        1.0 // Maximum quality
      );
    });

    console.log('[PDF-to-Image] Conversion complete, image size:', imageBlob.size);

    return imageBlob;
  } catch (error) {
    console.error('[PDF-to-Image] Conversion failed:', error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid page number')) {
        throw error; // Re-throw with same message
      } else if (error.message.includes('Failed to load PDF')) {
        throw new Error('Failed to load PDF file. The file may be corrupted or password-protected.');
      } else if (error.message.includes('canvas')) {
        throw new Error('Failed to render PDF page to image. Please try again.');
      } else {
        throw new Error(`PDF to image conversion failed: ${error.message}`);
      }
    }

    throw new Error('PDF to image conversion failed due to an unknown error.');
  }
}

/**
 * Get the total number of pages in a PDF
 *
 * @param pdfBlob - PDF file as Blob
 * @returns Total number of pages
 * @throws Error if PDF fails to load
 */
export async function getPDFPageCount(pdfBlob: Blob): Promise<number> {
  try {
    const pdfDoc = await loadPDF(pdfBlob);
    return pdfDoc.numPages;
  } catch (error) {
    console.error('[PDF-to-Image] Failed to get page count:', error);
    throw new Error('Failed to load PDF file. The file may be corrupted or password-protected.');
  }
}

/**
 * Estimate image size after PDF page conversion
 *
 * @param pdfPageSizePoints - PDF page size in points (72 DPI units)
 * @param dpi - Target DPI (default: 300)
 * @returns Estimated image size in MB
 */
export function estimateImageSize(
  pdfPageSizePoints: { width: number; height: number },
  dpi: number = 300
): number {
  // Calculate pixel dimensions
  const scale = dpi / 72;
  const widthPx = pdfPageSizePoints.width * scale;
  const heightPx = pdfPageSizePoints.height * scale;

  // Estimate PNG file size (rough approximation)
  // PNG typically uses 3-4 bytes per pixel (RGB + compression)
  const bytesPerPixel = 3.5;
  const estimatedBytes = widthPx * heightPx * bytesPerPixel;
  const estimatedMB = estimatedBytes / (1024 * 1024);

  return Math.round(estimatedMB * 10) / 10; // Round to 1 decimal place
}
