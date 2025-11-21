/**
 * Client-side image compression using browser-image-compression
 * Implements Tier 1 compression with binary search algorithm
 */

import imageCompression from 'browser-image-compression';
import type {
  ImageCompressionOptions,
  CompressionResult,
} from '../types/compression';

/**
 * Binary search algorithm to find optimal quality for target size
 */
async function binarySearchQuality(
  file: File,
  targetSizeBytes: number,
  minQuality: number = 10,
  maxQuality: number = 95,
  maxIterations: number = 7
): Promise<{ blob: Blob; quality: number; iterations: number }> {
  let low = minQuality;
  let high = maxQuality;
  let bestBlob: Blob = file;
  let bestQuality = maxQuality;
  let iterations = 0;

  while (low <= high && iterations < maxIterations) {
    iterations++;
    const mid = Math.floor((low + high) / 2);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: targetSizeBytes / (1024 * 1024),
        initialQuality: mid / 100,
        useWebWorker: true,
        preserveExif: true, // Preserve EXIF unless user explicitly removes
      });

      if (compressed.size <= targetSizeBytes) {
        // Found a quality that meets target, try higher quality
        bestBlob = compressed;
        bestQuality = mid;
        low = mid + 1;
      } else {
        // Compressed size too large, try lower quality
        high = mid - 1;
      }
    } catch (error) {
      console.error(`Compression failed at quality ${mid}:`, error);
      high = mid - 1;
    }
  }

  return { blob: bestBlob, quality: bestQuality, iterations };
}

/**
 * Resize image dimensions by scale factor
 */
async function resizeImage(
  file: File,
  scaleFactor: number,
  quality: number = 80
): Promise<Blob> {
  // Get image dimensions first
  const img = await createImageBitmap(file);
  const newWidth = Math.floor(img.width * scaleFactor);
  const newHeight = Math.floor(img.height * scaleFactor);

  const compressed = await imageCompression(file, {
    maxWidthOrHeight: Math.max(newWidth, newHeight),
    initialQuality: quality / 100,
    useWebWorker: true,
    preserveExif: true,
  });

  return compressed;
}

/**
 * Compress image with binary search for target size
 */
export async function compressImageToTargetSize(
  file: File,
  targetSizeBytes: number,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = Date.now();
  const originalSize = file.size;

  try {
    const {
      minQuality = 10,
      maxIterations = 7,
      resizeSteps = [1, 0.9, 0.8, 0.7],
    } = options;

    // Step 1: Try binary search on quality without resizing
    let result = await binarySearchQuality(
      file,
      targetSizeBytes,
      minQuality,
      95,
      maxIterations
    );

    // Step 2: If still too large, try reducing dimensions
    if (result.blob.size > targetSizeBytes && resizeSteps.length > 1) {
      for (const scale of resizeSteps.slice(1)) {
        const resized = await resizeImage(file, scale, result.quality);

        if (resized.size <= targetSizeBytes) {
          result = {
            blob: resized,
            quality: result.quality,
            iterations: result.iterations + 1,
          };
          break;
        }
      }
    }

    const duration = Date.now() - startTime;
    const compressedSize = result.blob.size;
    const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      success: true,
      compressedBlob: result.blob,
      originalSize,
      compressedSize,
      reductionPercent,
      processingLocation: 'client',
      tier: 1,
      metadata: {
        duration,
        iterations: result.iterations,
        finalQuality: result.quality,
      },
    };
  } catch (error) {
    return {
      success: false,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      processingLocation: 'client',
      tier: 1,
      error: error instanceof Error ? error.message : 'Unknown compression error',
    };
  }
}

/**
 * Compress image with manual quality setting
 */
export async function compressImageWithQuality(
  file: File,
  quality: number,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = Date.now();
  const originalSize = file.size;

  try {
    const compressed = await imageCompression(file, {
      initialQuality: quality / 100,
      useWebWorker: true,
      preserveExif: options.format !== 'jpeg', // Remove EXIF for JPEG if specified
    });

    const duration = Date.now() - startTime;
    const compressedSize = compressed.size;
    const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      success: true,
      compressedBlob: compressed,
      originalSize,
      compressedSize,
      reductionPercent,
      processingLocation: 'client',
      tier: 1,
      metadata: {
        duration,
        finalQuality: quality,
      },
    };
  } catch (error) {
    return {
      success: false,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      processingLocation: 'client',
      tier: 1,
      error: error instanceof Error ? error.message : 'Unknown compression error',
    };
  }
}

/**
 * Auto-compress image (tries target size mode if file is large)
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  // If target size is specified, use binary search
  if (options.targetSizeBytes) {
    return compressImageToTargetSize(file, options.targetSizeBytes, options);
  }

  // If quality is specified, use manual quality
  if (options.quality !== undefined) {
    return compressImageWithQuality(file, options.quality, options);
  }

  // Default: use balanced quality (80%)
  return compressImageWithQuality(file, 80, options);
}
