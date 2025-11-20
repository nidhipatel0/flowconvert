/**
 * Client-Side Image Processor
 *
 * Handles all image operations (resize, crop, rotate, flip, compress, convert)
 * using browser APIs and browser-image-compression library.
 *
 * Per constitution: Privacy-first, all processing happens in browser.
 */

import imageCompression from 'browser-image-compression';
import {
  getMimeTypeFromFormat,
  FileDimensions,
} from '@/lib/types/file';
import {
  ResizeParameters,
  CropParameters,
  RotateParameters,
  FlipParameters,
  CompressParameters,
  ConvertParameters,
} from '@/lib/types/operation';

/**
 * Resize an image
 */
export async function resizeImage(
  blob: Blob,
  params: ResizeParameters
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

      // Calculate dimensions
      let { width, height } = params;

      if (params.percentage) {
        width = Math.round((img.width * params.percentage) / 100);
        height = Math.round((img.height * params.percentage) / 100);
      } else if (params.maintainAspectRatio) {
        // Calculate maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        if (width && !height) {
          height = Math.round(width / aspectRatio);
        } else if (height && !width) {
          width = Math.round(height * aspectRatio);
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error('Failed to create resized blob'));
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
 * Crop an image
 */
export async function cropImage(
  blob: Blob,
  params: CropParameters
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

      canvas.width = params.width;
      canvas.height = params.height;

      // Draw cropped portion
      ctx.drawImage(
        img,
        params.x,
        params.y,
        params.width,
        params.height,
        0,
        0,
        params.width,
        params.height
      );

      canvas.toBlob(
        (croppedBlob) => {
          if (croppedBlob) {
            resolve(croppedBlob);
          } else {
            reject(new Error('Failed to create cropped blob'));
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
 * Rotate an image
 */
export async function rotateImage(
  blob: Blob,
  params: RotateParameters
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

      // Swap dimensions for 90/270 degree rotations
      if (params.degrees === 90 || params.degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      // Set rotation point to center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((params.degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        (rotatedBlob) => {
          if (rotatedBlob) {
            resolve(rotatedBlob);
          } else {
            reject(new Error('Failed to create rotated blob'));
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
 * Flip an image
 */
export async function flipImage(
  blob: Blob,
  params: FlipParameters
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

      // Apply flip transformation
      if (params.direction === 'horizontal') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (flippedBlob) => {
          if (flippedBlob) {
            resolve(flippedBlob);
          } else {
            reject(new Error('Failed to create flipped blob'));
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
 * Compress an image
 */
export async function compressImage(
  blob: Blob,
  params: CompressParameters
): Promise<Blob> {
  const options: any = {
    maxSizeMB: params.targetSize
      ? params.targetSize / (1024 * 1024)
      : undefined,
    useWebWorker: true,
    initialQuality: params.quality / 100,
  };

  try {
    const compressedFile = await imageCompression(blob as File, options);
    return compressedFile;
  } catch (error) {
    throw new Error(
      `Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert image format
 */
export async function convertImageFormat(
  blob: Blob,
  params: ConvertParameters
): Promise<Blob> {
  // Handle HEIC conversion
  if (blob.type === 'image/heic' || blob.type === 'image/heif') {
    // Dynamic import to avoid SSR issues
    const heic2any = (await import('heic2any')).default;

    const convertedBlob = await heic2any({
      blob,
      toType: getMimeTypeFromFormat(params.targetFormat),
      quality: (params.quality || 100) / 100,
    });

    if (Array.isArray(convertedBlob)) {
      const firstBlob = convertedBlob[0];
      if (!firstBlob) throw new Error('HEIC conversion failed');
      return firstBlob;
    }

    return convertedBlob;
  }

  // Standard format conversion using canvas
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

      const mimeType = getMimeTypeFromFormat(params.targetFormat);
      const quality = (params.quality || 100) / 100;

      canvas.toBlob(
        (convertedBlob) => {
          if (convertedBlob) {
            resolve(convertedBlob);
          } else {
            reject(new Error('Failed to convert image format'));
          }
        },
        mimeType,
        quality
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
 * Get image dimensions
 */
export async function getImageDimensions(
  blob: Blob
): Promise<FileDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Create preview URL for image
 */
export function createImagePreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke preview URL
 */
export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
