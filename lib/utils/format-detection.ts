/**
 * Format Detection Utilities
 *
 * Detect file formats, suggest optimal formats, and provide
 * format recommendations based on file content.
 */

import { FileFormat, FileCategory, FORMAT_CATEGORY_MAP } from '@/lib/types/file';

/**
 * Format recommendation with reasoning
 */
export interface FormatRecommendation {
  format: FileFormat;
  reason: string;
  savings?: string; // e.g., "60% smaller"
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string | null {
  const parts = filename.split('.');
  if (parts.length < 2) {
    return null;
  }
  return parts[parts.length - 1]?.toLowerCase() ?? null;
}

/**
 * Get format from file extension
 */
export function getFormatFromExtension(extension: string): FileFormat | null {
  const normalized = extension.toLowerCase().replace('.', '');

  const formatMap: Record<string, FileFormat> = {
    png: FileFormat.PNG,
    jpg: FileFormat.JPG,
    jpeg: FileFormat.JPG,
    webp: FileFormat.WEBP,
    gif: FileFormat.GIF,
    bmp: FileFormat.BMP,
    tiff: FileFormat.TIFF,
    tif: FileFormat.TIFF,
    svg: FileFormat.SVG,
    heic: FileFormat.HEIC,
    heif: FileFormat.HEIC,
    pdf: FileFormat.PDF,
    docx: FileFormat.DOCX,
    doc: FileFormat.DOCX, // Treat DOC as DOCX
    txt: FileFormat.TXT,
    rtf: FileFormat.RTF,
    xlsx: FileFormat.XLSX,
    xls: FileFormat.XLSX, // Treat XLS as XLSX
    pptx: FileFormat.PPTX,
    ppt: FileFormat.PPTX, // Treat PPT as PPTX
  };

  return formatMap[normalized] ?? null;
}

/**
 * Detect format from filename
 */
export function detectFormatFromFilename(filename: string): FileFormat | null {
  const extension = getFileExtension(filename);
  if (!extension) {
    return null;
  }
  return getFormatFromExtension(extension);
}

/**
 * Get file category
 */
export function getFileCategory(format: FileFormat): FileCategory {
  return FORMAT_CATEGORY_MAP[format];
}

/**
 * Check if format supports transparency
 */
export function supportsTransparency(format: FileFormat): boolean {
  return [FileFormat.PNG, FileFormat.WEBP, FileFormat.GIF, FileFormat.SVG].includes(
    format
  );
}

/**
 * Check if format is lossy compression
 */
export function isLossyFormat(format: FileFormat): boolean {
  return [FileFormat.JPG, FileFormat.WEBP].includes(format);
}

/**
 * Check if format is lossless
 */
export function isLosslessFormat(format: FileFormat): boolean {
  return [
    FileFormat.PNG,
    FileFormat.BMP,
    FileFormat.TIFF,
    FileFormat.SVG,
  ].includes(format);
}

/**
 * Recommend format based on use case
 */
export function recommendFormat(
  currentFormat: FileFormat,
  useCase: 'web' | 'print' | 'archive' | 'screenshot' | 'photo' | 'logo'
): FormatRecommendation {
  const category = getFileCategory(currentFormat);

  if (category !== FileCategory.IMAGE) {
    // Non-images: keep as-is or convert to PDF for universal compatibility
    if (currentFormat === FileFormat.PDF) {
      return {
        format: FileFormat.PDF,
        reason: 'PDF is already optimal for documents',
      };
    }
    return {
      format: FileFormat.PDF,
      reason: 'PDF provides universal document compatibility',
    };
  }

  // Image recommendations based on use case
  switch (useCase) {
    case 'web':
      if (currentFormat === FileFormat.WEBP) {
        return {
          format: FileFormat.WEBP,
          reason: 'WebP is already optimal for web',
        };
      }
      if (supportsTransparency(currentFormat)) {
        return {
          format: FileFormat.WEBP,
          reason: 'WebP offers 60% smaller files with transparency support',
          savings: '60% smaller',
        };
      }
      return {
        format: FileFormat.WEBP,
        reason: 'WebP is 60% smaller than PNG and better than JPG',
        savings: '60% smaller',
      };

    case 'print':
      if (currentFormat === FileFormat.DOCX) {
        return {
          format: FileFormat.PDF,
          reason: 'PDF provides universal document compatibility for printing',
        };
      }
      return {
        format: FileFormat.TIFF,
        reason: 'TIFF provides lossless quality ideal for printing',
      };

    case 'archive':
      if (currentFormat === FileFormat.GIF) {
        return {
          format: FileFormat.PNG,
          reason: 'PNG offers lossless compression for long-term storage',
        };
      }
      return {
        format: FileFormat.PNG,
        reason: 'PNG offers lossless compression for long-term storage',
      };

    case 'screenshot':
      if (currentFormat === FileFormat.PNG) {
        return {
          format: FileFormat.PNG,
          reason: 'PNG is already optimal for screenshots',
        };
      }
      return {
        format: FileFormat.PNG,
        reason: 'PNG preserves text clarity in screenshots',
      };

    case 'photo':
      if (currentFormat === FileFormat.JPG) {
        return {
          format: FileFormat.JPG,
          reason: 'JPG is already optimal for photos',
        };
      }
      if (currentFormat === FileFormat.WEBP) {
        return {
          format: currentFormat,
          reason: `${currentFormat} is already optimal for photos`,
        };
      }
      return {
        format: FileFormat.JPG,
        reason: 'JPG offers smaller file size for photographs',
        savings: '70% smaller',
      };

    case 'logo':
      if (currentFormat === FileFormat.SVG) {
        return {
          format: FileFormat.SVG,
          reason: 'SVG is already optimal for logos (vector, scalable)',
        };
      }
      // Recommend SVG for vector-friendly logos
      if (currentFormat === FileFormat.PNG) {
        return {
          format: FileFormat.SVG,
          reason: 'SVG is infinitely scalable and perfect for logos',
        };
      }
      // For JPG and other formats, recommend PNG for transparency
      return {
        format: FileFormat.PNG,
        reason: 'PNG supports transparency and preserves sharp edges',
      };

    default:
      return {
        format: currentFormat,
        reason: 'Current format is appropriate',
      };
  }
}

/**
 * Auto-detect optimal format based on content analysis
 */
export function autoDetectOptimalFormat(
  currentFormat: FileFormat,
  hasTransparency: boolean = false,
  hasText: boolean = false
): FormatRecommendation {
  const category = getFileCategory(currentFormat);

  if (category !== FileCategory.IMAGE) {
    return {
      format: currentFormat,
      reason: 'Keeping original document format',
    };
  }

  // Screenshots or images with text
  if (hasText) {
    return {
      format: FileFormat.PNG,
      reason: 'PNG recommended for screenshots (text may blur in JPG)',
    };
  }

  // Images with transparency
  if (hasTransparency) {
    return {
      format: FileFormat.WEBP,
      reason: 'WebP recommended (supports transparency, 60% smaller than PNG)',
      savings: '60% smaller',
    };
  }

  // Regular photos
  if (
    currentFormat === FileFormat.PNG ||
    currentFormat === FileFormat.BMP ||
    currentFormat === FileFormat.TIFF
  ) {
    return {
      format: FileFormat.JPG,
      reason: 'JPG recommended for photos (70% smaller, same visual quality)',
      savings: '70% smaller',
    };
  }

  return {
    format: currentFormat,
    reason: 'Current format is optimal',
  };
}

/**
 * Get conversion compatibility
 */
export function canConvert(
  from: FileFormat,
  to: FileFormat
): { possible: boolean; warning?: string } {
  const fromCategory = getFileCategory(from);
  const toCategory = getFileCategory(to);

  // Same format
  if (from === to) {
    return {
      possible: false,
    };
  }

  // Vector to raster warning
  if (from === FileFormat.SVG && to !== FileFormat.SVG && to !== FileFormat.PDF) {
    return {
      possible: true,
      warning: 'Converting from vector to raster will lose scalability',
    };
  }

  // Raster to vector (not possible)
  if (to === FileFormat.SVG && from !== FileFormat.SVG) {
    return {
      possible: false,
    };
  }

  // PDF to image (not a simple conversion - use extract instead)
  if (from === FileFormat.PDF && fromCategory === FileCategory.DOCUMENT && toCategory === FileCategory.IMAGE) {
    return {
      possible: false,
    };
  }

  // Cross-category conversions
  if (fromCategory !== toCategory) {
    // Image to PDF (allowed)
    if (fromCategory === FileCategory.IMAGE && to === FileFormat.PDF) {
      return {
        possible: true,
      };
    }

    // Image to non-PDF document (not allowed)
    if (fromCategory === FileCategory.IMAGE && toCategory === FileCategory.DOCUMENT) {
      return {
        possible: false,
      };
    }

    // Document to image (not allowed - use extract/render instead)
    if (fromCategory === FileCategory.DOCUMENT && toCategory === FileCategory.IMAGE) {
      return {
        possible: false,
      };
    }

    // Other cross-category (not allowed)
    return {
      possible: false,
    };
  }

  // Document conversions
  if (fromCategory === FileCategory.DOCUMENT && toCategory === FileCategory.DOCUMENT) {
    if (from === FileFormat.DOCX && to === FileFormat.PDF) {
      return {
        possible: true,
        warning: 'PDF will not be editable as a document',
      };
    }
    if (from === FileFormat.TXT && to === FileFormat.PDF) {
      return {
        possible: true,
        warning: 'PDF will not be editable as a document',
      };
    }
    return {
      possible: true,
    };
  }

  // GIF animation warning
  if (from === FileFormat.GIF && to !== FileFormat.GIF) {
    return {
      possible: true,
      warning: 'animation will be lost (only first frame will be converted)',
    };
  }

  // Transparency loss warning
  if (supportsTransparency(from) && !supportsTransparency(to)) {
    return {
      possible: true,
      warning: 'Target format does not support transparency (will be replaced with background color)',
    };
  }

  return { possible: true };
}

/**
 * Get conversion path (for multi-step conversions)
 */
export function getConversionPath(
  from: FileFormat,
  to: FileFormat
): FileFormat[] {
  const conversion = canConvert(from, to);

  // Same format
  if (from === to) {
    return [];
  }

  // Not possible
  if (!conversion.possible) {
    return [];
  }

  // Direct conversion (same category or allowed cross-category)
  return [from, to];
}

/**
 * Detect format from Blob using magic bytes
 */
export async function detectFormatFromBlob(
  blob: Blob
): Promise<FileFormat | null> {
  // Read first 8 bytes for magic byte detection
  if (blob.size === 0) {
    return null;
  }

  let bytes: Uint8Array;

  // Try modern arrayBuffer() method first (browser)
  if (typeof blob.arrayBuffer === 'function') {
    try {
      const header = await blob.slice(0, 8).arrayBuffer();
      bytes = new Uint8Array(header);
    } catch {
      // Fallback to FileReader if arrayBuffer fails
      const header = await blobToArrayBuffer(blob.slice(0, 8));
      bytes = new Uint8Array(header);
    }
  } else {
    // Fallback for older browsers or test environments
    const header = await blobToArrayBuffer(blob.slice(0, 8));
    bytes = new Uint8Array(header);
  }

  // Helper function to convert Blob to ArrayBuffer
  function blobToArrayBuffer(b: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // In Node/Jest environment, try to read as Buffer
      if (typeof FileReader === 'undefined') {
        // Jest environment - convert to buffer directly
        const reader = new Response(b);
        reader.arrayBuffer().then(resolve).catch(reject);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(b);
    });
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return FileFormat.PNG;
  }

  // JPG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return FileFormat.JPG;
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return FileFormat.PDF;
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return FileFormat.GIF;
  }

  // WebP: RIFF ... WEBP (need to check bytes 8-11)
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46    // F
  ) {
    // Check for WEBP signature at bytes 8-11
    let webpBytes: Uint8Array;
    if (typeof blob.arrayBuffer === 'function') {
      try {
        const webpCheck = await blob.slice(8, 12).arrayBuffer();
        webpBytes = new Uint8Array(webpCheck);
      } catch {
        const webpCheck = await new Response(blob.slice(8, 12)).arrayBuffer();
        webpBytes = new Uint8Array(webpCheck);
      }
    } else {
      const webpCheck = await new Response(blob.slice(8, 12)).arrayBuffer();
      webpBytes = new Uint8Array(webpCheck);
    }

    if (
      webpBytes.length >= 4 &&
      webpBytes[0] === 0x57 && // W
      webpBytes[1] === 0x45 && // E
      webpBytes[2] === 0x42 && // B
      webpBytes[3] === 0x50    // P
    ) {
      return FileFormat.WEBP;
    }
  }

  // BMP: 42 4D (BM)
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return FileFormat.BMP;
  }

  // TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
  if (bytes.length >= 4) {
    if (
      (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)
    ) {
      return FileFormat.TIFF;
    }
  }

  // Fallback to MIME type
  const format = getFormatFromExtension(blob.type.split('/')[1] ?? '');
  if (format) {
    return format;
  }

  // Final fallback: try to parse MIME type directly
  if (blob.type.startsWith('image/')) {
    const mimeFormat = blob.type.replace('image/', '').toUpperCase();
    if (Object.values(FileFormat).includes(mimeFormat as FileFormat)) {
      return mimeFormat as FileFormat;
    }
  }

  return null;
}
