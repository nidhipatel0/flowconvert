/**
 * Error Handling Utilities
 *
 * User-friendly error messages and error recovery suggestions.
 * Per constitution: Error messages MUST be actionable with specific guidance.
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  FILE_SIZE = 'FILE_SIZE',
  FILE_FORMAT = 'FILE_FORMAT',
  FILE_CORRUPT = 'FILE_CORRUPT',
  NETWORK = 'NETWORK',
  PROCESSING = 'PROCESSING',
  BROWSER_SUPPORT = 'BROWSER_SUPPORT',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * User-friendly error with recovery suggestions
 */
export interface UserFriendlyError {
  title: string;
  message: string;
  category: ErrorCategory;
  suggestions: string[];
  technicalDetails?: string;
}

/**
 * Convert technical error to user-friendly error
 */
export function getUserFriendlyError(
  error: Error | string
): UserFriendlyError {
  const errorMessage =
    typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? '' : error.name;

  // File size errors
  if (errorMessage.includes('exceeds') && errorMessage.includes('MB')) {
    return {
      title: 'File Too Large',
      message: errorMessage,
      category: ErrorCategory.FILE_SIZE,
      suggestions: [
        'Try compressing the file first',
        'Split large PDFs into smaller files',
        'Upgrade to Premium for 500MB limit',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Format errors
  if (
    errorMessage.includes('format') ||
    errorMessage.includes('MIME') ||
    errorMessage.includes('Unsupported')
  ) {
    return {
      title: 'Unsupported File Format',
      message: 'This file format is not yet supported.',
      category: ErrorCategory.FILE_FORMAT,
      suggestions: [
        'Convert to PNG, JPG, or PDF first',
        'Check if file extension matches content',
        'Request support for this format via feedback',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Network errors (check before corrupt/processing to avoid confusion with "failed")
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.toLowerCase().includes('connection') ||
    errorName === 'NetworkError'
  ) {
    return {
      title: 'Connection Lost',
      message: 'Network connection was interrupted.',
      category: ErrorCategory.NETWORK,
      suggestions: [
        'Check your internet connection',
        'Your file is safe - retry when reconnected',
        'Client-side operations work offline',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Corrupt file errors
  if (
    errorMessage.includes('corrupt') ||
    errorMessage.toLowerCase().includes('invalid') ||
    errorMessage.includes('parse') ||
    errorMessage.includes('decode')
  ) {
    return {
      title: 'File Cannot Be Read',
      message: 'This file appears to be corrupted or invalid.',
      category: ErrorCategory.FILE_CORRUPT,
      suggestions: [
        'Try opening file in another program first',
        'Re-export from original source',
        'Check if file downloaded completely',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Browser support errors
  if (
    errorMessage.includes('not supported') ||
    errorMessage.includes('browser') ||
    errorMessage.includes('WebAssembly') ||
    errorMessage.includes('Worker')
  ) {
    return {
      title: 'Browser Not Supported',
      message: 'Your browser does not support this feature.',
      category: ErrorCategory.BROWSER_SUPPORT,
      suggestions: [
        'Update to Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+',
        'Try the latest version of your browser',
        'Some features require modern browser APIs',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Permission errors
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('denied') ||
    errorMessage.includes('blocked')
  ) {
    return {
      title: 'Permission Denied',
      message: 'Required permission was not granted.',
      category: ErrorCategory.PERMISSION,
      suggestions: [
        'Check browser permission settings',
        'Allow file access when prompted',
        'Reset site permissions and try again',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Processing errors
  if (
    errorMessage.includes('processing') ||
    errorMessage.includes('operation') ||
    errorMessage.includes('failed')
  ) {
    return {
      title: 'Processing Failed',
      message: 'File processing encountered an error.',
      category: ErrorCategory.PROCESSING,
      suggestions: [
        'Try a smaller file',
        'Refresh page and try again',
        'Try one operation at a time',
        'Check file is not password-protected',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Memory errors
  if (
    errorMessage.includes('memory') ||
    errorMessage.includes('heap') ||
    errorMessage.includes('allocation')
  ) {
    return {
      title: 'Out of Memory',
      message: 'File is too large for available memory.',
      category: ErrorCategory.PROCESSING,
      suggestions: [
        'Try a smaller file',
        'Close other browser tabs',
        'Restart your browser',
        'Use a device with more RAM',
      ],
      technicalDetails: errorMessage,
    };
  }

  // Generic fallback
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    category: ErrorCategory.UNKNOWN,
    suggestions: [
      'Refresh the page and try again',
      'Try a different file',
      'Contact support if problem persists',
    ],
    technicalDetails: errorMessage,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${units[i]}`;
}

/**
 * Format duration for display
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${Math.round(seconds * 10) / 10}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get error recovery action
 */
export function getRecoveryAction(category: ErrorCategory): {
  action: string;
  buttonText: string;
} {
  switch (category) {
    case ErrorCategory.FILE_SIZE:
      return {
        action: 'compress',
        buttonText: 'Compress File',
      };
    case ErrorCategory.FILE_FORMAT:
      return {
        action: 'convert',
        buttonText: 'Convert Format',
      };
    case ErrorCategory.NETWORK:
      return {
        action: 'retry',
        buttonText: 'Retry',
      };
    case ErrorCategory.BROWSER_SUPPORT:
      return {
        action: 'check-browser',
        buttonText: 'Check Browser',
      };
    case ErrorCategory.PERMISSION:
      return {
        action: 'request-permission',
        buttonText: 'Grant Permission',
      };
    default:
      return {
        action: 'retry',
        buttonText: 'Try Again',
      };
  }
}

/**
 * Log error for debugging (respects privacy)
 */
export function logError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[FlowConvert Error]', errorMessage, context);
  }

  // In production, you would send to error tracking service (e.g., Sentry)
  // but NEVER send file contents or personal data (privacy-first)
}
