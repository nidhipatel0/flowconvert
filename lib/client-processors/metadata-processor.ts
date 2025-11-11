/**
 * Client-Side Metadata Processor
 *
 * Handles EXIF data removal and metadata operations for images.
 *
 * Per constitution: Privacy-first, user-controlled EXIF removal.
 */

import { RemoveMetadataParameters } from '@/lib/types/operation';

/**
 * Remove metadata from image
 *
 * Note: This strips ALL metadata by drawing to canvas.
 * For selective removal, we would need a library like exif-js or piexifjs.
 */
export async function removeImageMetadata(
  blob: Blob,
  _params: RemoveMetadataParameters
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Canvas strips all metadata by default
      // For selective metadata preservation, we'd need to:
      // 1. Extract EXIF with exif-js
      // 2. Strip image via canvas
      // 3. Re-inject selected EXIF fields with piexifjs

      canvas.toBlob(
        (cleanBlob) => {
          if (cleanBlob) {
            resolve(cleanBlob);
          } else {
            reject(new Error('Failed to remove metadata'));
          }
        },
        blob.type,
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Read EXIF data from image
 *
 * Placeholder for future implementation with exif-js or exifr
 */
export async function readImageMetadata(
  _blob: Blob
): Promise<Record<string, unknown>> {
  // TODO: Implement with exif-js or exifr library
  // For now, return empty object
  return {};
}

/**
 * Check if image has GPS data
 */
export async function hasGPSData(_blob: Blob): Promise<boolean> {
  // TODO: Implement with exif-js
  // For now, assume no GPS data
  return false;
}

/**
 * Sanitize file name (remove sensitive info)
 */
export function sanitizeFileName(fileName: string): string {
  // Remove common sensitive patterns
  const sanitized = fileName
    .replace(/IMG_\d{8}_\d{6}/g, 'image') // Remove timestamp patterns
    .replace(/\d{4}-\d{2}-\d{2}/g, 'date') // Remove date patterns
    .replace(/\d{2}-\d{2}-\d{4}/g, 'date') // Remove date patterns (US format)
    .replace(/screenshot.*\d+/gi, 'screenshot') // Remove screenshot timestamps
    .trim();

  return sanitized || 'file';
}
