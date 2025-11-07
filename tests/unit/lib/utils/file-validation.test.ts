/**
 * Unit tests for File Validation utilities
 *
 * Following TDD methodology: Tests validate all validation functions
 * including edge cases and tier-based limits.
 */

import {
  validateFileSize,
  validateFileFormat,
  validateBatch,
  validateDimensions,
  validateFile,
  isSupportedFormat,
} from '@/lib/utils/file-validation';
import { FileFormat } from '@/lib/types/file';

describe('File Validation Utilities', () => {
  describe('validateFileSize', () => {
    describe('Free tier', () => {
      it('should accept file at exactly 50MB limit', () => {
        const size = 50 * 1024 * 1024;
        const result = validateFileSize(size, 'free');
        expect(result.valid).toBe(true);
      });

      it('should accept file under 50MB limit', () => {
        const size = 25 * 1024 * 1024;
        const result = validateFileSize(size, 'free');
        expect(result.valid).toBe(true);
      });

      it('should reject file exceeding 50MB limit', () => {
        const size = 51 * 1024 * 1024;
        const result = validateFileSize(size, 'free');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('50 MB');
        expect(result.error).toContain('exceeds free tier limit');
      });

      it('should reject zero-byte files', () => {
        const result = validateFileSize(0, 'free');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('File cannot be empty');
      });

      it('should reject negative file sizes', () => {
        const result = validateFileSize(-1, 'free');
        expect(result.valid).toBe(false);
      });
    });

    describe('Premium tier', () => {
      it('should accept file at exactly 500MB limit', () => {
        const size = 500 * 1024 * 1024;
        const result = validateFileSize(size, 'premium');
        expect(result.valid).toBe(true);
      });

      it('should accept file under 500MB limit', () => {
        const size = 250 * 1024 * 1024;
        const result = validateFileSize(size, 'premium');
        expect(result.valid).toBe(true);
      });

      it('should reject file exceeding 500MB limit', () => {
        const size = 501 * 1024 * 1024;
        const result = validateFileSize(size, 'premium');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('500 MB');
        expect(result.error).toContain('exceeds premium tier limit');
      });

      it('should accept files larger than free tier but within premium', () => {
        const size = 100 * 1024 * 1024; // 100MB
        const result = validateFileSize(size, 'premium');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateFileFormat', () => {
    it('should accept supported image formats', () => {
      expect(validateFileFormat('image/png').valid).toBe(true);
      expect(validateFileFormat('image/jpeg').valid).toBe(true);
      expect(validateFileFormat('image/jpg').valid).toBe(true);
      expect(validateFileFormat('image/webp').valid).toBe(true);
      expect(validateFileFormat('image/gif').valid).toBe(true);
    });

    it('should accept supported document formats', () => {
      expect(validateFileFormat('application/pdf').valid).toBe(true);
      expect(
        validateFileFormat(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ).valid
      ).toBe(true);
      expect(validateFileFormat('text/plain').valid).toBe(true);
    });

    it('should reject unsupported formats', () => {
      const result = validateFileFormat('application/zip');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file format');
      expect(result.error).toContain('application/zip');
    });

    it('should reject empty MIME types', () => {
      const result = validateFileFormat('');
      expect(result.valid).toBe(false);
    });

    it('should handle case-insensitive MIME types', () => {
      expect(validateFileFormat('IMAGE/PNG').valid).toBe(true);
      expect(validateFileFormat('Image/Jpeg').valid).toBe(true);
    });
  });

  describe('validateBatch', () => {
    describe('Free tier', () => {
      it('should accept batch at exactly 5 files limit', () => {
        const files = Array(5).fill({ size: 10 * 1024 * 1024 });
        const result = validateBatch(files, 'free');
        expect(result.valid).toBe(true);
      });

      it('should reject batch exceeding 5 files limit', () => {
        const files = Array(6).fill({ size: 10 * 1024 * 1024 });
        const result = validateBatch(files, 'free');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('5 files');
      });

      it('should accept batch under 150MB total size', () => {
        const files = [
          { size: 40 * 1024 * 1024 },
          { size: 40 * 1024 * 1024 },
          { size: 40 * 1024 * 1024 },
        ];
        const result = validateBatch(files, 'free');
        expect(result.valid).toBe(true);
      });

      it('should reject batch exceeding 150MB total size', () => {
        const files = [
          { size: 50 * 1024 * 1024 },
          { size: 50 * 1024 * 1024 },
          { size: 51 * 1024 * 1024 },
        ];
        const result = validateBatch(files, 'free');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('150 MB');
      });

      it('should reject empty batch', () => {
        const result = validateBatch([], 'free');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least one file');
      });
    });

    describe('Premium tier', () => {
      it('should accept batch at exactly 25 files limit', () => {
        const files = Array(25).fill({ size: 10 * 1024 * 1024 });
        const result = validateBatch(files, 'premium');
        expect(result.valid).toBe(true);
      });

      it('should reject batch exceeding 25 files limit', () => {
        const files = Array(26).fill({ size: 10 * 1024 * 1024 });
        const result = validateBatch(files, 'premium');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('25 files');
      });

      it('should accept batch under 5GB total size', () => {
        const files = [
          { size: 1024 * 1024 * 1024 }, // 1GB
          { size: 1024 * 1024 * 1024 }, // 1GB
          { size: 1024 * 1024 * 1024 }, // 1GB
        ];
        const result = validateBatch(files, 'premium');
        expect(result.valid).toBe(true);
      });

      it('should reject batch exceeding 5GB total size', () => {
        const files = [
          { size: 2 * 1024 * 1024 * 1024 }, // 2GB
          { size: 2 * 1024 * 1024 * 1024 }, // 2GB
          { size: 2 * 1024 * 1024 * 1024 }, // 2GB (total 6GB)
        ];
        const result = validateBatch(files, 'premium');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('5120 MB');
      });
    });
  });

  describe('validateDimensions', () => {
    it('should accept valid dimensions', () => {
      const result = validateDimensions(1920, 1080);
      expect(result.valid).toBe(true);
    });

    it('should accept minimum dimensions (1x1)', () => {
      const result = validateDimensions(1, 1);
      expect(result.valid).toBe(true);
    });

    it('should accept maximum dimensions (10000x10000)', () => {
      const result = validateDimensions(10000, 10000);
      expect(result.valid).toBe(true);
    });

    it('should reject zero width', () => {
      const result = validateDimensions(0, 1080);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Width must be between 1 and 10000');
    });

    it('should reject zero height', () => {
      const result = validateDimensions(1920, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Height must be between 1 and 10000');
    });

    it('should reject negative dimensions', () => {
      expect(validateDimensions(-1, 1080).valid).toBe(false);
      expect(validateDimensions(1920, -1).valid).toBe(false);
    });

    it('should reject dimensions exceeding max (10001+)', () => {
      expect(validateDimensions(10001, 1080).valid).toBe(false);
      expect(validateDimensions(1920, 10001).valid).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should accept valid file', () => {
      const file = {
        name: 'test.png',
        size: 10 * 1024 * 1024,
        type: 'image/png',
      };
      const result = validateFile(file, 'free');
      expect(result.valid).toBe(true);
    });

    it('should reject file with invalid size', () => {
      const file = {
        name: 'large.png',
        size: 100 * 1024 * 1024,
        type: 'image/png',
      };
      const result = validateFile(file, 'free');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds free tier limit');
    });

    it('should reject file with invalid format', () => {
      const file = {
        name: 'test.zip',
        size: 10 * 1024 * 1024,
        type: 'application/zip',
      };
      const result = validateFile(file, 'free');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file format');
    });

    it('should reject file with empty name', () => {
      const file = {
        name: '',
        size: 10 * 1024 * 1024,
        type: 'image/png',
      };
      const result = validateFile(file, 'free');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Filename cannot be empty');
    });

    it('should reject file with excessively long name', () => {
      const file = {
        name: 'a'.repeat(300) + '.png',
        size: 10 * 1024 * 1024,
        type: 'image/png',
      };
      const result = validateFile(file, 'free');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('255 characters');
    });

    it('should accept file with exactly 255 character name', () => {
      const file = {
        name: 'a'.repeat(251) + '.png', // 251 + 4 = 255
        size: 10 * 1024 * 1024,
        type: 'image/png',
      };
      const result = validateFile(file, 'free');
      expect(result.valid).toBe(true);
    });

    it('should validate premium tier correctly', () => {
      const file = {
        name: 'large.png',
        size: 100 * 1024 * 1024,
        type: 'image/png',
      };
      const result = validateFile(file, 'premium');
      expect(result.valid).toBe(true);
    });
  });

  describe('isSupportedFormat', () => {
    it('should return true for supported formats', () => {
      expect(isSupportedFormat(FileFormat.PNG)).toBe(true);
      expect(isSupportedFormat(FileFormat.JPG)).toBe(true);
      expect(isSupportedFormat(FileFormat.PDF)).toBe(true);
      expect(isSupportedFormat(FileFormat.DOCX)).toBe(true);
    });

    it('should return true for all FileFormat enum values', () => {
      Object.values(FileFormat).forEach((format) => {
        expect(isSupportedFormat(format)).toBe(true);
      });
    });
  });
});
