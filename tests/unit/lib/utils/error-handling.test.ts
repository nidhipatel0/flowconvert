/**
 * Unit tests for Error Handling utilities
 *
 * Following TDD methodology: Tests validate user-friendly error messages,
 * error categorization, and recovery suggestions.
 */

import {
  getUserFriendlyError,
  formatFileSize,
  formatDuration,
  getRecoveryAction,
  logError,
  ErrorCategory,
} from '@/lib/utils/error-handling';

describe('Error Handling Utilities', () => {
  describe('getUserFriendlyError', () => {
    describe('File size errors', () => {
      it('should detect file size errors', () => {
        const error = 'File exceeds 50MB limit';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('File Too Large');
        expect(result.category).toBe(ErrorCategory.FILE_SIZE);
        expect(result.suggestions).toContain('Try compressing the file first');
      });

      it('should provide upgrade suggestion for free tier', () => {
        const error = 'File exceeds 50MB limit';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain(
          'Upgrade to Premium for 500MB limit'
        );
      });
    });

    describe('Format errors', () => {
      it('should detect unsupported format errors', () => {
        const error = 'Unsupported file format: application/zip';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('Unsupported File Format');
        expect(result.category).toBe(ErrorCategory.FILE_FORMAT);
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should detect MIME type errors', () => {
        const error = 'Invalid MIME type';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.FILE_FORMAT);
      });

      it('should provide conversion suggestion', () => {
        const error = 'Unsupported format';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain('Convert to PNG, JPG, or PDF first');
      });
    });

    describe('Corrupt file errors', () => {
      it('should detect corrupt file errors', () => {
        const error = 'File appears to be corrupt';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('File Cannot Be Read');
        expect(result.category).toBe(ErrorCategory.FILE_CORRUPT);
      });

      it('should detect invalid file errors', () => {
        const error = 'Invalid file structure';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.FILE_CORRUPT);
      });

      it('should detect parse errors', () => {
        const error = 'Failed to parse file';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.FILE_CORRUPT);
      });

      it('should provide troubleshooting suggestions', () => {
        const error = 'File corrupt';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain(
          'Try opening file in another program first'
        );
        expect(result.suggestions).toContain('Re-export from original source');
      });
    });

    describe('Network errors', () => {
      it('should detect network connection errors', () => {
        const error = 'Network connection failed';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('Connection Lost');
        expect(result.category).toBe(ErrorCategory.NETWORK);
      });

      it('should detect timeout errors', () => {
        const error = 'Request timeout';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.NETWORK);
      });

      it('should detect fetch errors', () => {
        const error = 'Fetch failed';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.NETWORK);
      });

      it('should reassure about data safety', () => {
        const error = 'Network error';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain(
          'Your file is safe - retry when reconnected'
        );
      });

      it('should mention offline capabilities', () => {
        const error = 'Connection lost';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain(
          'Client-side operations work offline'
        );
      });

      it('should handle NetworkError by name', () => {
        const error = new Error('Something went wrong');
        error.name = 'NetworkError';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.NETWORK);
      });
    });

    describe('Browser support errors', () => {
      it('should detect browser not supported errors', () => {
        const error = 'Browser not supported';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('Browser Not Supported');
        expect(result.category).toBe(ErrorCategory.BROWSER_SUPPORT);
      });

      it('should detect WebAssembly errors', () => {
        const error = 'WebAssembly is not supported';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.BROWSER_SUPPORT);
      });

      it('should provide browser version requirements', () => {
        const error = 'Browser feature not supported';
        const result = getUserFriendlyError(error);
        expect(result.suggestions[0]).toContain('Chrome 90+');
        expect(result.suggestions[0]).toContain('Firefox 88+');
        expect(result.suggestions[0]).toContain('Safari 14+');
      });
    });

    describe('Permission errors', () => {
      it('should detect permission denied errors', () => {
        const error = 'Permission denied';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('Permission Denied');
        expect(result.category).toBe(ErrorCategory.PERMISSION);
      });

      it('should detect blocked access errors', () => {
        const error = 'Access blocked';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.PERMISSION);
      });

      it('should provide permission troubleshooting', () => {
        const error = 'Permission denied';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain('Check browser permission settings');
      });
    });

    describe('Processing errors', () => {
      it('should detect processing failed errors', () => {
        const error = 'Processing failed';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('Processing Failed');
        expect(result.category).toBe(ErrorCategory.PROCESSING);
      });

      it('should detect operation errors', () => {
        const error = 'Operation failed';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.PROCESSING);
      });

      it('should provide processing troubleshooting', () => {
        const error = 'Processing failed';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain('Try a smaller file');
        expect(result.suggestions).toContain('Try one operation at a time');
      });
    });

    describe('Memory errors', () => {
      it('should detect out of memory errors', () => {
        const error = 'Out of memory';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('Out of Memory');
        expect(result.category).toBe(ErrorCategory.PROCESSING);
      });

      it('should detect heap allocation errors', () => {
        const error = 'Heap allocation failed';
        const result = getUserFriendlyError(error);
        expect(result.category).toBe(ErrorCategory.PROCESSING);
      });

      it('should provide memory-specific suggestions', () => {
        const error = 'Out of memory';
        const result = getUserFriendlyError(error);
        expect(result.suggestions).toContain('Close other browser tabs');
        expect(result.suggestions).toContain('Use a device with more RAM');
      });
    });

    describe('Generic errors', () => {
      it('should handle unknown errors gracefully', () => {
        const error = 'Something random happened';
        const result = getUserFriendlyError(error);
        expect(result.title).toBe('Something Went Wrong');
        expect(result.category).toBe(ErrorCategory.UNKNOWN);
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should handle Error objects', () => {
        const error = new Error('Test error');
        const result = getUserFriendlyError(error);
        expect(result.technicalDetails).toBe('Test error');
      });

      it('should always provide technical details', () => {
        const error = 'Test error message';
        const result = getUserFriendlyError(error);
        expect(result.technicalDetails).toBe(error);
      });
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1)).toBe('1 B');
      expect(formatFileSize(999)).toBe('999 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
      expect(formatFileSize(50 * 1024 * 1024)).toBe('50 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 5)).toBe('5 GB');
    });

    it('should format terabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(100)).toBe('100ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds correctly', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(2500)).toBe('2.5s');
      expect(formatDuration(30000)).toBe('30s');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should round seconds in minute format', () => {
      expect(formatDuration(65500)).toBe('1m 6s');
      expect(formatDuration(65400)).toBe('1m 5s');
    });

    it('should round to 1 decimal place for seconds', () => {
      expect(formatDuration(1234)).toBe('1.2s');
      expect(formatDuration(1567)).toBe('1.6s');
    });
  });

  describe('getRecoveryAction', () => {
    it('should return compress action for file size errors', () => {
      const action = getRecoveryAction(ErrorCategory.FILE_SIZE);
      expect(action.action).toBe('compress');
      expect(action.buttonText).toBe('Compress File');
    });

    it('should return convert action for format errors', () => {
      const action = getRecoveryAction(ErrorCategory.FILE_FORMAT);
      expect(action.action).toBe('convert');
      expect(action.buttonText).toBe('Convert Format');
    });

    it('should return retry action for network errors', () => {
      const action = getRecoveryAction(ErrorCategory.NETWORK);
      expect(action.action).toBe('retry');
      expect(action.buttonText).toBe('Retry');
    });

    it('should return check-browser action for browser errors', () => {
      const action = getRecoveryAction(ErrorCategory.BROWSER_SUPPORT);
      expect(action.action).toBe('check-browser');
      expect(action.buttonText).toBe('Check Browser');
    });

    it('should return permission action for permission errors', () => {
      const action = getRecoveryAction(ErrorCategory.PERMISSION);
      expect(action.action).toBe('request-permission');
      expect(action.buttonText).toBe('Grant Permission');
    });

    it('should return retry action for unknown errors', () => {
      const action = getRecoveryAction(ErrorCategory.UNKNOWN);
      expect(action.action).toBe('retry');
      expect(action.buttonText).toBe('Try Again');
    });
  });

  describe('logError', () => {
    let originalEnv: string | undefined;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      (process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv;
      consoleErrorSpy.mockRestore();
    });

    it('should log errors in development mode', () => {
      (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
      const error = 'Test error';
      const context = { fileId: '123' };

      logError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[FlowConvert Error]',
        'Test error',
        context
      );
    });

    it('should not log errors in production mode', () => {
      (process.env as { NODE_ENV?: string }).NODE_ENV = 'production';
      const error = 'Test error';

      logError(error);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle Error objects', () => {
      (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
      const error = new Error('Test error');

      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[FlowConvert Error]',
        'Test error',
        undefined
      );
    });

    it('should accept optional context parameter', () => {
      (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';

      logError('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[FlowConvert Error]',
        'Test error',
        undefined
      );
    });
  });
});
