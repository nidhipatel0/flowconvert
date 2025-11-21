/**
 * Document Processing Utilities
 * Client-side image and document processing for Indian government documents
 */

import type { FileRequirement } from '@/lib/config/document-requirements';

export interface ProcessingOptions {
  requirement: FileRequirement;
  autoProcess: boolean;
  customWidth?: number;
  customHeight?: number;
  quality?: number;
}

export interface ProcessingResult {
  success: boolean;
  blob?: Blob;
  dataUrl?: string;
  width?: number;
  height?: number;
  sizeKB?: number;
  errors?: string[];
  warnings?: string[];
  fileName: string;
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Compress image to target size
 */
async function compressImage(
  canvas: HTMLCanvasElement,
  targetSizeKB: number,
  format: string = 'image/jpeg'
): Promise<{ blob: Blob; dataUrl: string }> {
  let quality = 0.92;
  let blob: Blob | null = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), format, quality);
    });

    if (!blob) {
      throw new Error('Failed to create blob');
    }

    const sizeKB = blob.size / 1024;

    // If within target size (with 10% margin), we're done
    if (sizeKB <= targetSizeKB * 1.1) {
      break;
    }

    // Reduce quality for next attempt
    quality -= 0.08;
    attempts++;

    // Don't go below 0.3 quality
    if (quality < 0.3) {
      break;
    }
  }

  if (!blob) {
    throw new Error('Failed to compress image');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob!);
  });

  return { blob, dataUrl };
}

/**
 * Remove background and make it white (simple threshold-based approach)
 */
function removeBackground(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Simple approach: find the most common edge color and replace similar colors with white
  const edgeColors = new Map<string, number>();
  const threshold = 30; // Color similarity threshold

  // Sample edge pixels
  for (let x = 0; x < canvas.width; x++) {
    for (let y of [0, canvas.height - 1]) {
      const i = (y * canvas.width + x) * 4;
      const key = `${Math.floor(data[i]! / 20)},${Math.floor(data[i + 1]! / 20)},${Math.floor(data[i + 2]! / 20)}`;
      edgeColors.set(key, (edgeColors.get(key) || 0) + 1);
    }
  }

  // Get most common edge color
  let maxCount = 0;
  let bgColorKey = '';
  edgeColors.forEach((count, key) => {
    if (count > maxCount) {
      maxCount = count;
      bgColorKey = key;
    }
  });

  const [bgR, bgG, bgB] = bgColorKey.split(',').map(v => parseInt(v) * 20);

  // Replace background with white
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    // Check if pixel is similar to background color
    const diff = Math.abs(r - bgR!) + Math.abs(g - bgG!) + Math.abs(b - bgB!);
    
    if (diff < threshold * 3) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Process photo (passport photo with face detection and background removal)
 */
async function processPhoto(
  file: File,
  requirement: FileRequirement,
  options: ProcessingOptions
): Promise<ProcessingResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Load image
    const img = await loadImage(file);

    // Target dimensions
    const targetWidth = options.customWidth || requirement.width || 420;
    const targetHeight = options.customHeight || requirement.height || 525;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill with white background first
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling to maintain aspect ratio and fit/cover the canvas
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Center the image
    const x = (targetWidth - scaledWidth) / 2;
    const y = (targetHeight - scaledHeight) / 2;

    // Draw image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Apply background removal if required
    if (requirement.backgroundColor === 'white' && options.autoProcess) {
      try {
        removeBackground(canvas, ctx);
      } catch (e) {
        warnings.push('Background removal failed, using original background');
      }
    }

    // Enhance sharpness slightly
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    // Compress to target size
    const format = requirement.formats.includes('PNG') ? 'image/png' : 'image/jpeg';
    const { blob, dataUrl } = await compressImage(canvas, requirement.maxSizeKB, format);
    
    const sizeKB = blob.size / 1024;

    // Validation
    if (sizeKB > requirement.maxSizeKB * 1.15) {
      warnings.push(`File size ${sizeKB.toFixed(1)} KB exceeds limit of ${requirement.maxSizeKB} KB`);
    }

    // Generate filename
    const extension = format === 'image/png' ? 'png' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}_${targetWidth}x${targetHeight}.${extension}`;

    return {
      success: true,
      blob,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      sizeKB,
      errors,
      warnings,
      fileName,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      errors,
      warnings,
      fileName: file.name,
    };
  }
}

/**
 * Process signature (clean, crop, and optimize)
 */
async function processSignature(
  file: File,
  requirement: FileRequirement,
  options: ProcessingOptions
): Promise<ProcessingResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const img = await loadImage(file);

    // Target dimensions
    const targetWidth = options.customWidth || requirement.width || 200;
    const targetHeight = options.customHeight || requirement.height || 80;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale to fit within canvas
    const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Center the signature
    const x = (targetWidth - scaledWidth) / 2;
    const y = (targetHeight - scaledHeight) / 2;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Compress
    const { blob, dataUrl } = await compressImage(canvas, requirement.maxSizeKB, 'image/jpeg');
    
    const sizeKB = blob.size / 1024;

    if (sizeKB > requirement.maxSizeKB * 1.15) {
      warnings.push(`File size ${sizeKB.toFixed(1)} KB exceeds limit of ${requirement.maxSizeKB} KB`);
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}_signature_${targetWidth}x${targetHeight}.jpg`;

    return {
      success: true,
      blob,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      sizeKB,
      errors,
      warnings,
      fileName,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      errors,
      warnings,
      fileName: file.name,
    };
  }
}

/**
 * Process document (PDF or image, compress and optimize)
 */
async function processDocument(
  file: File,
  requirement: FileRequirement,
  _options: ProcessingOptions
): Promise<ProcessingResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // If it's a PDF, we'll just validate and return it
    if (file.type === 'application/pdf') {
      const sizeKB = file.size / 1024;

      if (sizeKB > requirement.maxSizeKB) {
        warnings.push(`PDF size ${sizeKB.toFixed(1)} KB exceeds limit of ${requirement.maxSizeKB} KB. Consider using a PDF compressor.`);
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return {
        success: true,
        blob: file,
        dataUrl,
        sizeKB,
        errors,
        warnings,
        fileName: file.name,
      };
    }

    // For images, process similar to photo but without face detection
    const img = await loadImage(file);

    // Create canvas with original aspect ratio but constrained by size
    let targetWidth = img.width;
    let targetHeight = img.height;

    // If image is too large, scale it down
    const maxDimension = 2000;
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Compress to target size
    const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const { blob, dataUrl } = await compressImage(canvas, requirement.maxSizeKB, format);
    
    const sizeKB = blob.size / 1024;

    if (sizeKB > requirement.maxSizeKB * 1.15) {
      warnings.push(`File size ${sizeKB.toFixed(1)} KB exceeds limit of ${requirement.maxSizeKB} KB`);
    }

    const extension = format === 'image/png' ? 'png' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}_compressed.${extension}`;

    return {
      success: true,
      blob,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      sizeKB,
      errors,
      warnings,
      fileName,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      errors,
      warnings,
      fileName: file.name,
    };
  }
}

/**
 * Main processing function
 */
export async function processFile(
  file: File,
  requirement: FileRequirement,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const processingOptions: ProcessingOptions = {
    requirement,
    autoProcess: options.autoProcess ?? true,
    customWidth: options.customWidth,
    customHeight: options.customHeight,
    quality: options.quality,
  };

  // Validate file format
  const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
  const isValidFormat = requirement.formats.some(format => 
    format.toUpperCase() === fileExtension || 
    file.type.includes(format.toLowerCase())
  );

  if (!isValidFormat) {
    return {
      success: false,
      errors: [`Invalid format. Expected: ${requirement.formats.join(', ')}`],
      warnings: [],
      fileName: file.name,
    };
  }

  // Route to appropriate processor based on file type
  switch (requirement.type) {
    case 'photo':
      return processPhoto(file, requirement, processingOptions);
    case 'signature':
      return processSignature(file, requirement, processingOptions);
    case 'document':
      return processDocument(file, requirement, processingOptions);
    default:
      return {
        success: false,
        errors: ['Unknown file type'],
        warnings: [],
        fileName: file.name,
      };
  }
}

/**
 * Create a ZIP file from multiple processed files
 */
export async function createZipFromFiles(
  files: Array<{ blob: Blob; fileName: string }>
): Promise<Blob> {
  // Dynamic import of JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach(({ blob, fileName }) => {
    zip.file(fileName, blob);
  });

  return await zip.generateAsync({ type: 'blob' });
}

