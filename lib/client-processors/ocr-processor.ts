/**
 * OCR Processing using Tesseract.js (Client-Side)
 *
 * This module provides text extraction from images using Tesseract.js OCR library.
 * Tesseract.js is lazy-loaded only when needed (~2-4MB).
 *
 * Supported languages: English (eng), Hindi (hin), Multi-language (eng+hin)
 *
 * Based on research from OCR_BACKEND.md documentation.
 */

export interface OCRResult {
  text: string;
  confidence: number; // 0-100, average confidence score
  processingTime: number; // milliseconds
}

export interface OCRProgress {
  status: string; // 'loading tesseract core' | 'initializing api' | 'recognizing text' | 'preprocessing'
  progress: number; // 0-1
}

export type OCRProgressCallback = (progress: OCRProgress) => void;

export interface OCROptions {
  enablePreprocessing?: boolean; // Enable image preprocessing (default: true)
  contrastEnhancement?: number; // Contrast enhancement factor (1.0-3.0, default: 1.5)
  sharpen?: boolean; // Apply sharpening (default: true)
  denoise?: boolean; // Apply noise reduction (default: true)
}

/**
 * Preprocess image for better OCR accuracy
 * - Grayscale conversion
 * - Contrast enhancement
 * - Noise reduction
 * - Sharpening
 */
async function preprocessImage(
  blob: Blob,
  options: OCROptions,
  onProgress?: OCRProgressCallback
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        // Report preprocessing progress
        if (onProgress) {
          onProgress({ status: 'preprocessing', progress: 0 });
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        if (onProgress) {
          onProgress({ status: 'preprocessing', progress: 0.2 });
        }

        // 1. Convert to grayscale and enhance contrast
        const contrastFactor = options.contrastEnhancement || 1.5;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r === undefined || g === undefined || b === undefined) continue;
          
          // Grayscale conversion (luminance)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Contrast enhancement
          const enhanced = ((gray - 128) * contrastFactor) + 128;
          const clamped = Math.max(0, Math.min(255, enhanced));

          data[i] = clamped;
          data[i + 1] = clamped;
          data[i + 2] = clamped;
          // Alpha stays the same (data[i + 3])
        }

        if (onProgress) {
          onProgress({ status: 'preprocessing', progress: 0.4 });
        }

        // Put enhanced data back
        ctx.putImageData(imageData, 0, 0);

        // 2. Apply sharpening if enabled
        if (options.sharpen !== false) {
          const sharpened = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const sharpenData = sharpened.data;
          const tempData = new Uint8ClampedArray(sharpenData);

          // Sharpening kernel
          const kernel = [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
          ];

          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
              let r = 0, g = 0, b = 0;

              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
                  const kernelRow = kernel[ky + 1];
                  const weight = kernelRow ? kernelRow[kx + 1] : 0;
                  const rVal = tempData[idx];
                  const gVal = tempData[idx + 1];
                  const bVal = tempData[idx + 2];
                  
                  if (weight !== undefined && rVal !== undefined && gVal !== undefined && bVal !== undefined) {
                    r += rVal * weight;
                    g += gVal * weight;
                    b += bVal * weight;
                  }
                }
              }

              const idx = (y * canvas.width + x) * 4;
              sharpenData[idx] = Math.max(0, Math.min(255, r));
              sharpenData[idx + 1] = Math.max(0, Math.min(255, g));
              sharpenData[idx + 2] = Math.max(0, Math.min(255, b));
            }
          }

          ctx.putImageData(sharpened, 0, 0);
        }

        if (onProgress) {
          onProgress({ status: 'preprocessing', progress: 0.8 });
        }

        // Convert canvas to blob
        canvas.toBlob(
          (processedBlob) => {
            URL.revokeObjectURL(url);
            if (processedBlob) {
              if (onProgress) {
                onProgress({ status: 'preprocessing', progress: 1.0 });
              }
              resolve(processedBlob);
            } else {
              reject(new Error('Failed to convert preprocessed canvas to blob'));
            }
          },
          'image/png',
          1.0
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for preprocessing'));
    };

    img.src = url;
  });
}

/**
 * Extract text from an image using Tesseract.js OCR
 *
 * @param blob - Image blob (PNG, JPG, JPEG, WebP, GIF, BMP, TIFF)
 * @param language - OCR language: 'eng' (English), 'hin' (Hindi), 'eng+hin' (Multi)
 * @param onProgress - Optional callback for progress updates
 * @param options - OCR options including preprocessing settings
 * @returns OCR result with extracted text and confidence score
 * @throws Error if OCR fails or image is invalid
 */
export async function extractTextFromImage(
  blob: Blob,
  language: string = 'eng',
  onProgress?: OCRProgressCallback,
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = performance.now();

  try {
    let processedBlob = blob;

    // Apply image preprocessing if enabled (default: true)
    if (options.enablePreprocessing !== false) {
      console.log('[OCR] Preprocessing image for better accuracy...');
      processedBlob = await preprocessImage(blob, options, onProgress);
      console.log('[OCR] Image preprocessing complete');
    }

    // Dynamically import Tesseract.js (lazy-loaded ~2-4MB)
    const Tesseract = await import('tesseract.js');

    console.log('[OCR] Starting text extraction with language:', language);

    // Create worker with language parameter and enhanced settings
    const worker = await Tesseract.createWorker(language, 1, {
      logger: (m: any) => {
        console.log('[OCR] Progress:', m);

        // Call progress callback if provided
        if (onProgress && m.status && m.progress !== undefined) {
          onProgress({
            status: m.status,
            progress: m.progress,
          });
        }
      },
    });

    console.log('[OCR] Worker created, starting recognition...');

    // Perform OCR with enhanced parameters
    const { data } = await worker.recognize(processedBlob, {
      rotateAuto: true, // Automatically detect and correct rotation
    });

    console.log('[OCR] Recognition complete');

    // Calculate average confidence
    const confidence = data.confidence || 0;

    // Clean up worker
    await worker.terminate();

    const processingTime = performance.now() - startTime;

    console.log('[OCR] Text extraction complete:', {
      textLength: data.text.length,
      confidence,
      processingTime: `${processingTime.toFixed(0)}ms`,
    });

    return {
      text: data.text,
      confidence: Math.round(confidence),
      processingTime: Math.round(processingTime),
    };
  } catch (error) {
    console.error('[OCR] Text extraction failed:', error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid image')) {
        throw new Error('Invalid image file. Please select a valid image (PNG, JPG, JPEG, WebP, GIF, BMP, TIFF)');
      } else if (error.message.includes('Network')) {
        throw new Error('Failed to download OCR language data. Please check your internet connection.');
      } else if (error.message.includes('Worker')) {
        throw new Error('OCR worker failed to initialize. Please try again.');
      } else {
        throw new Error(`OCR failed: ${error.message}`);
      }
    }

    throw new Error('OCR failed due to an unknown error. Please try again.');
  }
}

/**
 * Validate if a blob is a valid image for OCR
 *
 * @param blob - File blob to validate
 * @returns true if valid image, false otherwise
 */
export function isValidImageForOCR(blob: Blob): boolean {
  const validTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ];

  return validTypes.includes(blob.type);
}

/**
 * Get supported OCR languages
 *
 * @returns Array of language options
 */
export function getSupportedLanguages() {
  return [
    { value: 'eng', label: 'English' },
    { value: 'hin', label: 'Hindi (हिन्दी)' },
    { value: 'eng+hin', label: 'English + Hindi' },
  ];
}

/**
 * Estimate OCR processing time based on image size
 *
 * @param imageSizeBytes - Image file size in bytes
 * @returns Estimated processing time in seconds
 */
export function estimateOCRTime(imageSizeBytes: number): number {
  // Rough estimates based on typical performance:
  // - Small images (<500KB): 2-5 seconds
  // - Medium images (500KB-2MB): 5-10 seconds
  // - Large images (2MB-5MB): 10-20 seconds
  // - Very large images (>5MB): 20-40 seconds

  const sizeInMB = imageSizeBytes / (1024 * 1024);

  if (sizeInMB < 0.5) return 3;
  if (sizeInMB < 2) return 7;
  if (sizeInMB < 5) return 15;
  return 30;
}
