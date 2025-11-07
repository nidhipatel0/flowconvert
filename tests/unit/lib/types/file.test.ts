/**
 * Unit tests for File type utilities
 *
 * Following TDD methodology: Tests written to validate type definitions
 * and helper functions for file handling.
 */

import {
  FileFormat,
  FileState,
  MIME_TYPE_MAP,
  FILE_VALIDATION_RULES,
  VALID_STATE_TRANSITIONS,
  isImageFormat,
  isDocumentFormat,
  getFormatFromMimeType,
  getMimeTypeFromFormat,
  isValidFileSize,
  isValidStateTransition,
} from '@/lib/types/file';

describe('File Type Utilities', () => {
  describe('FileFormat enum', () => {
    it('should have all required image formats', () => {
      expect(FileFormat.PNG).toBe('PNG');
      expect(FileFormat.JPG).toBe('JPG');
      expect(FileFormat.WEBP).toBe('WEBP');
      expect(FileFormat.GIF).toBe('GIF');
      expect(FileFormat.SVG).toBe('SVG');
    });

    it('should have all required document formats', () => {
      expect(FileFormat.PDF).toBe('PDF');
      expect(FileFormat.DOCX).toBe('DOCX');
      expect(FileFormat.TXT).toBe('TXT');
    });
  });

  describe('isImageFormat', () => {
    it('should return true for image formats', () => {
      expect(isImageFormat(FileFormat.PNG)).toBe(true);
      expect(isImageFormat(FileFormat.JPG)).toBe(true);
      expect(isImageFormat(FileFormat.WEBP)).toBe(true);
      expect(isImageFormat(FileFormat.GIF)).toBe(true);
    });

    it('should return false for document formats', () => {
      expect(isImageFormat(FileFormat.PDF)).toBe(false);
      expect(isImageFormat(FileFormat.DOCX)).toBe(false);
      expect(isImageFormat(FileFormat.TXT)).toBe(false);
    });
  });

  describe('isDocumentFormat', () => {
    it('should return true for document formats', () => {
      expect(isDocumentFormat(FileFormat.PDF)).toBe(true);
      expect(isDocumentFormat(FileFormat.DOCX)).toBe(true);
      expect(isDocumentFormat(FileFormat.TXT)).toBe(true);
    });

    it('should return false for image formats', () => {
      expect(isDocumentFormat(FileFormat.PNG)).toBe(false);
      expect(isDocumentFormat(FileFormat.JPG)).toBe(false);
    });
  });

  describe('getFormatFromMimeType', () => {
    it('should correctly identify image MIME types', () => {
      expect(getFormatFromMimeType('image/png')).toBe(FileFormat.PNG);
      expect(getFormatFromMimeType('image/jpeg')).toBe(FileFormat.JPG);
      expect(getFormatFromMimeType('image/webp')).toBe(FileFormat.WEBP);
    });

    it('should correctly identify document MIME types', () => {
      expect(getFormatFromMimeType('application/pdf')).toBe(FileFormat.PDF);
      expect(getFormatFromMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(FileFormat.DOCX);
    });

    it('should return null for unknown MIME types', () => {
      expect(getFormatFromMimeType('application/unknown')).toBeNull();
      expect(getFormatFromMimeType('text/html')).toBeNull();
    });
  });

  describe('getMimeTypeFromFormat', () => {
    it('should return correct MIME type for each format', () => {
      expect(getMimeTypeFromFormat(FileFormat.PNG)).toBe('image/png');
      expect(getMimeTypeFromFormat(FileFormat.JPG)).toBe('image/jpeg');
      expect(getMimeTypeFromFormat(FileFormat.PDF)).toBe('application/pdf');
    });

    it('should return first MIME type when multiple exist', () => {
      // JPG has both image/jpeg and image/jpg
      const mimeType = getMimeTypeFromFormat(FileFormat.JPG);
      expect(MIME_TYPE_MAP[FileFormat.JPG]).toContain(mimeType);
    });
  });

  describe('isValidFileSize', () => {
    it('should accept files within free tier limit (50MB)', () => {
      const validSize = 50 * 1024 * 1024; // Exactly 50MB
      expect(isValidFileSize(validSize, false)).toBe(true);
      expect(isValidFileSize(validSize - 1, false)).toBe(true);
    });

    it('should reject files exceeding free tier limit', () => {
      const oversized = 51 * 1024 * 1024; // 51MB
      expect(isValidFileSize(oversized, false)).toBe(false);
    });

    it('should accept files within premium tier limit (500MB)', () => {
      const validSize = 500 * 1024 * 1024; // Exactly 500MB
      expect(isValidFileSize(validSize, true)).toBe(true);
      expect(isValidFileSize(validSize - 1, true)).toBe(true);
    });

    it('should reject files exceeding premium tier limit', () => {
      const oversized = 501 * 1024 * 1024; // 501MB
      expect(isValidFileSize(oversized, true)).toBe(false);
    });

    it('should reject zero or negative file sizes', () => {
      expect(isValidFileSize(0, false)).toBe(false);
      expect(isValidFileSize(-1, false)).toBe(false);
    });
  });

  describe('isValidStateTransition', () => {
    it('should allow UPLOADED -> PROCESSING transition', () => {
      expect(isValidStateTransition(FileState.UPLOADED, FileState.PROCESSING)).toBe(true);
    });

    it('should allow PROCESSING -> READY transition', () => {
      expect(isValidStateTransition(FileState.PROCESSING, FileState.READY)).toBe(true);
    });

    it('should allow PROCESSING -> ERROR transition', () => {
      expect(isValidStateTransition(FileState.PROCESSING, FileState.ERROR)).toBe(true);
    });

    it('should allow READY -> PROCESSING transition (re-processing)', () => {
      expect(isValidStateTransition(FileState.READY, FileState.PROCESSING)).toBe(true);
    });

    it('should disallow invalid transitions', () => {
      expect(isValidStateTransition(FileState.UPLOADED, FileState.READY)).toBe(false);
      expect(isValidStateTransition(FileState.READY, FileState.ERROR)).toBe(false);
      expect(isValidStateTransition(FileState.ERROR, FileState.PROCESSING)).toBe(false);
    });
  });

  describe('FILE_VALIDATION_RULES', () => {
    it('should define correct file size limits', () => {
      expect(FILE_VALIDATION_RULES.MAX_FILE_SIZE_FREE).toBe(50 * 1024 * 1024);
      expect(FILE_VALIDATION_RULES.MAX_FILE_SIZE_PREMIUM).toBe(500 * 1024 * 1024);
    });

    it('should define correct batch limits', () => {
      expect(FILE_VALIDATION_RULES.MAX_BATCH_FILES_FREE).toBe(5);
      expect(FILE_VALIDATION_RULES.MAX_BATCH_FILES_PREMIUM).toBe(25);
    });

    it('should define dimension constraints', () => {
      expect(FILE_VALIDATION_RULES.MIN_DIMENSION).toBe(1);
      expect(FILE_VALIDATION_RULES.MAX_DIMENSION).toBe(10000);
    });
  });

  describe('MIME_TYPE_MAP', () => {
    it('should have entries for all FileFormat values', () => {
      const formats = Object.values(FileFormat);
      formats.forEach((format) => {
        expect(MIME_TYPE_MAP[format]).toBeDefined();
        expect(Array.isArray(MIME_TYPE_MAP[format])).toBe(true);
        expect(MIME_TYPE_MAP[format].length).toBeGreaterThan(0);
      });
    });

    it('should have valid MIME type strings', () => {
      Object.values(MIME_TYPE_MAP).flat().forEach((mimeType) => {
        expect(typeof mimeType).toBe('string');
        expect(mimeType).toMatch(/^[a-z]+\/[a-z0-9\-\+\.]+$/i);
      });
    });
  });

  describe('VALID_STATE_TRANSITIONS', () => {
    it('should define transitions for all states', () => {
      const states = Object.values(FileState);
      states.forEach((state) => {
        expect(VALID_STATE_TRANSITIONS[state]).toBeDefined();
        expect(Array.isArray(VALID_STATE_TRANSITIONS[state])).toBe(true);
      });
    });

    it('should have valid target states', () => {
      Object.values(VALID_STATE_TRANSITIONS).flat().forEach((targetState) => {
        expect(Object.values(FileState)).toContain(targetState);
      });
    });
  });
});
