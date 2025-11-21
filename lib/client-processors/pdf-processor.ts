/**
 * Client-Side PDF Processor
 *
 * Handles all PDF operations (merge, split, extract, rearrange, page numbers)
 * using pdf-lib library.
 *
 * Per constitution: Privacy-first, all processing happens in browser.
 */

import { PDFDocument, rgb, StandardFonts, degrees as pdfDegrees } from 'pdf-lib';
import {
  MergePDFParameters,
  SplitPDFParameters,
  ExtractPagesParameters,
  RearrangePagesParameters,
  AddPageNumbersParameters,
} from '@/lib/types/operation';

/**
 * Merge multiple PDFs
 */
export async function mergePDFs(
  blobs: Blob[],
  _params: MergePDFParameters
): Promise<Blob> {
  if (blobs.length < 2) {
    throw new Error('At least 2 PDF files are required for merging');
  }

  try {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Load and copy pages from each PDF in order
    for (const blob of blobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(
      `PDF merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Split a PDF
 */
export async function splitPDF(
  blob: Blob,
  params: SplitPDFParameters
): Promise<Blob[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    const resultPdfs: Blob[] = [];

    if (params.splitMethod === 'every-page') {
      // Split into individual pages
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        resultPdfs.push(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
      }
    } else if (params.splitMethod === 'page-ranges' && params.ranges) {
      // Split by page ranges
      for (const range of params.ranges) {
        const newPdf = await PDFDocument.create();
        const pageIndices = [];
        for (let i = range.start - 1; i < range.end; i++) {
          if (i < totalPages) pageIndices.push(i);
        }
        const copiedPages = await newPdf.copyPages(pdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        resultPdfs.push(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
      }
    } else if (params.splitMethod === 'page-numbers' && params.pageNumbers) {
      // Split by specific page numbers
      for (const pageNumber of params.pageNumbers) {
        if (pageNumber > 0 && pageNumber <= totalPages) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdf, [pageNumber - 1]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          resultPdfs.push(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
        }
      }
    }

    return resultPdfs;
  } catch (error) {
    throw new Error(
      `PDF split failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract specific pages from PDF
 */
export async function extractPages(
  blob: Blob,
  params: ExtractPagesParameters
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    // Convert 1-based page numbers to 0-based indices
    const pageIndices = params.pageNumbers
      .map((n) => n - 1)
      .filter((i) => i >= 0 && i < pdf.getPageCount());

    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(
      `Page extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Rearrange PDF pages
 */
export async function rearrangePages(
  blob: Blob,
  params: RearrangePagesParameters
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    // Convert 1-based page numbers to 0-based indices
    const pageIndices = params.pageOrder.map((n) => n - 1);

    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    // Insert blank pages if specified
    if (params.insertBlankPages) {
      const pages = pdf.getPages();
      if (pages.length === 0) throw new Error('Source PDF has no pages');

      const firstPage = pages[0];
      if (!firstPage) throw new Error('Could not get first page');

      const { width, height } = firstPage.getSize();
      for (const insert of params.insertBlankPages) {
        newPdf.insertPage(insert.position, [width, height]);
      }
    }

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(
      `Page rearrangement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(
  blob: Blob,
  params: AddPageNumbersParameters
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const startNumber = params.startNumber || 1;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNumber = startNumber + index;
      const text = `${pageNumber}`;
      const textWidth = font.widthOfTextAtSize(text, params.fontSize);
      const opacity = params.transparency / 100;

      // Calculate position based on params
      let x = 0;
      let y = 0;

      switch (params.position) {
        case 'top-left':
          x = 20;
          y = height - 20;
          break;
        case 'top-right':
          x = width - textWidth - 20;
          y = height - 20;
          break;
        case 'bottom-left':
          x = 20;
          y = 20;
          break;
        case 'bottom-right':
          x = width - textWidth - 20;
          y = 20;
          break;
        case 'center':
          x = (width - textWidth) / 2;
          y = 20;
          break;
      }

      page.drawText(text, {
        x,
        y,
        size: params.fontSize,
        font,
        color: rgb(0, 0, 0),
        opacity,
      });
    });

    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(
      `Adding page numbers failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Rotate PDF pages
 */
export async function rotatePDFPages(
  blob: Blob,
  pageIndices: number[],
  degrees: 90 | 180 | 270
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    pageIndices.forEach((index) => {
      if (index >= 0 && index < pages.length) {
        const page = pages[index];
        if (!page) return;
        const currentRotation = page.getRotation().angle;
        page.setRotation(pdfDegrees(currentRotation + degrees));
      }
    });

    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(
      `PDF rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete PDF pages
 */
export async function deletePDFPages(
  blob: Blob,
  pageIndices: number[]
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const allIndices = Array.from({ length: pdf.getPageCount() }, (_, i) => i);
    const keepIndices = allIndices.filter((i) => !pageIndices.includes(i));

    const copiedPages = await newPdf.copyPages(pdf, keepIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(
      `Page deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get PDF page count
 */
export async function getPDFPageCount(blob: Blob): Promise<number> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPageCount();
  } catch (error) {
    throw new Error(
      `Failed to get page count: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(blob: Blob): Promise<{
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  pageCount: number;
}> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);

    return {
      title: pdf.getTitle(),
      author: pdf.getAuthor(),
      subject: pdf.getSubject(),
      keywords: pdf.getKeywords() ? pdf.getKeywords()!.split(',') : [],
      pageCount: pdf.getPageCount(),
    };
  } catch (error) {
    throw new Error(
      `Failed to get PDF metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Crop PDF pages
 */
export interface CropPDFParameters {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumbers?: number[]; // If not provided, apply to all pages
}

export async function cropPDF(
  blob: Blob,
  params: CropPDFParameters
): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    // Determine which pages to crop
    const pagesToCrop = params.pageNumbers || Array.from({ length: pages.length }, (_, i) => i + 1);

    // Crop each specified page
    pagesToCrop.forEach((pageNum) => {
      if (pageNum < 1 || pageNum > pages.length) {
        console.warn(`Page ${pageNum} out of range, skipping`);
        return;
      }

      const page = pages[pageNum - 1];
      if (!page) return;

      const { width: _pageWidth, height: pageHeight } = page.getSize();

      // Convert crop coordinates (top-left origin) to PDF coordinates (bottom-left origin)
      const pdfY = pageHeight - params.y - params.height;

      // Set the crop box (visible area)
      page.setCropBox(params.x, pdfY, params.width, params.height);

      // Also set media box to the same size to ensure proper rendering
      page.setMediaBox(params.x, pdfY, params.width, params.height);
    });

    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(
      `PDF crop failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
