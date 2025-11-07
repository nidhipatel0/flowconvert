/**
 * Unit tests for Format Detection utilities
 *
 * Following TDD methodology: Tests validate format detection,
 * recommendations, and conversion compatibility checks.
 */

import {
  recommendFormat,
  canConvert,
  getConversionPath,
  detectFormatFromBlob,
} from '@/lib/utils/format-detection';
import { FileFormat } from '@/lib/types/file';

describe('Format Detection Utilities', () => {
  describe('recommendFormat', () => {
    describe('Web use case', () => {
      it('should recommend WebP for PNG images', () => {
        const result = recommendFormat(FileFormat.PNG, 'web');
        expect(result.format).toBe(FileFormat.WEBP);
        expect(result.reason).toContain('smaller');
      });

      it('should recommend WebP for JPG images', () => {
        const result = recommendFormat(FileFormat.JPG, 'web');
        expect(result.format).toBe(FileFormat.WEBP);
        expect(result.savings).toBeDefined();
      });

      it('should keep WebP as WebP', () => {
        const result = recommendFormat(FileFormat.WEBP, 'web');
        expect(result.format).toBe(FileFormat.WEBP);
        expect(result.reason).toContain('already optimal');
      });
    });

    describe('Screenshot use case', () => {
      it('should recommend PNG for screenshots', () => {
        const result = recommendFormat(FileFormat.JPG, 'screenshot');
        expect(result.format).toBe(FileFormat.PNG);
        expect(result.reason).toContain('text clarity');
      });

      it('should keep PNG for screenshots', () => {
        const result = recommendFormat(FileFormat.PNG, 'screenshot');
        expect(result.format).toBe(FileFormat.PNG);
      });
    });

    describe('Photo use case', () => {
      it('should recommend JPG for photos', () => {
        const result = recommendFormat(FileFormat.PNG, 'photo');
        expect(result.format).toBe(FileFormat.JPG);
        expect(result.reason).toContain('smaller file size');
      });

      it('should keep JPG for photos', () => {
        const result = recommendFormat(FileFormat.JPG, 'photo');
        expect(result.format).toBe(FileFormat.JPG);
      });
    });

    describe('Logo use case', () => {
      it('should recommend SVG for logos when possible', () => {
        const result = recommendFormat(FileFormat.PNG, 'logo');
        expect(result.format).toBe(FileFormat.SVG);
        expect(result.reason).toContain('scalable');
      });

      it('should recommend PNG for non-vector logos', () => {
        const result = recommendFormat(FileFormat.JPG, 'logo');
        expect(result.format).toBe(FileFormat.PNG);
        expect(result.reason).toContain('transparency');
      });
    });

    describe('Print use case', () => {
      it('should recommend TIFF for print', () => {
        const result = recommendFormat(FileFormat.JPG, 'print');
        expect(result.format).toBe(FileFormat.TIFF);
        expect(result.reason).toContain('lossless');
      });

      it('should recommend PDF for documents', () => {
        const result = recommendFormat(FileFormat.DOCX, 'print');
        expect(result.format).toBe(FileFormat.PDF);
      });
    });

    describe('Archive use case', () => {
      it('should recommend PNG for archiving', () => {
        const result = recommendFormat(FileFormat.JPG, 'archive');
        expect(result.format).toBe(FileFormat.PNG);
        expect(result.reason).toContain('lossless');
      });

      it('should recommend TIFF for high-quality archiving', () => {
        const result = recommendFormat(FileFormat.GIF, 'archive');
        expect([FileFormat.PNG, FileFormat.TIFF]).toContain(result.format);
      });
    });
  });

  describe('canConvert', () => {
    describe('Image to image conversions', () => {
      it('should allow PNG to JPG conversion', () => {
        const result = canConvert(FileFormat.PNG, FileFormat.JPG);
        expect(result.possible).toBe(true);
      });

      it('should allow JPG to PNG conversion', () => {
        const result = canConvert(FileFormat.JPG, FileFormat.PNG);
        expect(result.possible).toBe(true);
      });

      it('should allow PNG to WebP conversion', () => {
        const result = canConvert(FileFormat.PNG, FileFormat.WEBP);
        expect(result.possible).toBe(true);
      });

      it('should warn about transparency loss (PNG to JPG)', () => {
        const result = canConvert(FileFormat.PNG, FileFormat.JPG);
        expect(result.warning).toContain('transparency');
      });

      it('should warn about animation loss (GIF to PNG)', () => {
        const result = canConvert(FileFormat.GIF, FileFormat.PNG);
        expect(result.warning).toContain('animation');
      });
    });

    describe('Document to document conversions', () => {
      it('should allow DOCX to PDF conversion', () => {
        const result = canConvert(FileFormat.DOCX, FileFormat.PDF);
        expect(result.possible).toBe(true);
      });

      it('should allow TXT to PDF conversion', () => {
        const result = canConvert(FileFormat.TXT, FileFormat.PDF);
        expect(result.possible).toBe(true);
      });

      it('should warn about editability loss (DOCX to PDF)', () => {
        const result = canConvert(FileFormat.DOCX, FileFormat.PDF);
        expect(result.warning).toContain('not be editable');
      });
    });

    describe('Cross-category conversions', () => {
      it('should disallow image to document conversion', () => {
        const result = canConvert(FileFormat.PNG, FileFormat.DOCX);
        expect(result.possible).toBe(false);
      });

      it('should disallow document to image conversion', () => {
        const result = canConvert(FileFormat.DOCX, FileFormat.PNG);
        expect(result.possible).toBe(false);
      });

      it('should allow image to PDF conversion', () => {
        const result = canConvert(FileFormat.PNG, FileFormat.PDF);
        expect(result.possible).toBe(true);
      });

      it('should disallow PDF to image conversion (use extract instead)', () => {
        const result = canConvert(FileFormat.PDF, FileFormat.PNG);
        expect(result.possible).toBe(false);
      });
    });

    describe('Vector format conversions', () => {
      it('should allow SVG to PNG conversion', () => {
        const result = canConvert(FileFormat.SVG, FileFormat.PNG);
        expect(result.possible).toBe(true);
        expect(result.warning).toContain('scalability');
      });

      it('should disallow PNG to SVG conversion', () => {
        const result = canConvert(FileFormat.PNG, FileFormat.SVG);
        expect(result.possible).toBe(false);
      });
    });

    describe('Same format conversions', () => {
      it('should disallow converting to same format', () => {
        expect(canConvert(FileFormat.PNG, FileFormat.PNG).possible).toBe(
          false
        );
        expect(canConvert(FileFormat.JPG, FileFormat.JPG).possible).toBe(
          false
        );
        expect(canConvert(FileFormat.PDF, FileFormat.PDF).possible).toBe(
          false
        );
      });
    });
  });

  describe('getConversionPath', () => {
    it('should return direct conversion for same category', () => {
      const path = getConversionPath(FileFormat.PNG, FileFormat.JPG);
      expect(path).toEqual([FileFormat.PNG, FileFormat.JPG]);
    });

    it('should return multi-step path for cross-category conversions', () => {
      const path = getConversionPath(FileFormat.PNG, FileFormat.PDF);
      expect(path.length).toBeGreaterThan(2);
      expect(path[0]).toBe(FileFormat.PNG);
      expect(path[path.length - 1]).toBe(FileFormat.PDF);
    });

    it('should return empty array for impossible conversions', () => {
      const path = getConversionPath(FileFormat.PNG, FileFormat.DOCX);
      expect(path).toEqual([]);
    });

    it('should return empty array for same format', () => {
      const path = getConversionPath(FileFormat.PNG, FileFormat.PNG);
      expect(path).toEqual([]);
    });
  });

  describe('detectFormatFromBlob', () => {
    it('should detect PNG from magic bytes', async () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const blob = new Blob([pngBytes], { type: 'image/png' });
      const format = await detectFormatFromBlob(blob);
      expect(format).toBe(FileFormat.PNG);
    });

    it('should detect JPG from magic bytes', async () => {
      // JPG magic bytes: FF D8 FF
      const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff]);
      const blob = new Blob([jpgBytes], { type: 'image/jpeg' });
      const format = await detectFormatFromBlob(blob);
      expect(format).toBe(FileFormat.JPG);
    });

    it('should detect PDF from magic bytes', async () => {
      // PDF magic bytes: 25 50 44 46 (%PDF)
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const format = await detectFormatFromBlob(blob);
      expect(format).toBe(FileFormat.PDF);
    });

    it('should fallback to MIME type if magic bytes unknown', async () => {
      const unknownBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([unknownBytes], { type: 'image/webp' });
      const format = await detectFormatFromBlob(blob);
      expect(format).toBe(FileFormat.WEBP);
    });

    it('should return null for unsupported format', async () => {
      const unknownBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([unknownBytes], { type: 'application/zip' });
      const format = await detectFormatFromBlob(blob);
      expect(format).toBeNull();
    });

    it('should handle empty blobs', async () => {
      const blob = new Blob([]);
      const format = await detectFormatFromBlob(blob);
      expect(format).toBeNull();
    });
  });
});
