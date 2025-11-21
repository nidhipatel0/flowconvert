/**
 * Compression types and interfaces for FlowConvert
 * Supports 3-tier hybrid compression strategy
 */

// Compression quality presets
export type CompressionQuality = 'high' | 'balanced' | 'maximum';

// PDF types for smart routing
export type PDFType = 'native' | 'scanned' | 'hybrid' | 'unknown';

// Processing location
export type ProcessingLocation = 'client' | 'server';

// Compression status
export type CompressionStatus = 'idle' | 'analyzing' | 'compressing' | 'finalizing' | 'complete' | 'error';

// Compression tier
export type CompressionTier = 1 | 2 | 3; // Tier 1: client, Tier 2: server smart, Tier 3: user control

/**
 * Compression options for images
 */
export interface ImageCompressionOptions {
  quality?: number; // 0-100, for manual quality control
  targetSizeBytes?: number; // Target file size in bytes
  maxIterations?: number; // Binary search iterations (default: 7)
  minQuality?: number; // Minimum quality threshold (default: 10)
  resizeSteps?: number[]; // Dimension scaling steps (default: [1, 0.9, 0.8, 0.7])
  format?: 'jpeg' | 'png' | 'webp'; // Output format
}

/**
 * Compression options for PDFs
 */
export interface PDFCompressionOptions {
  quality?: CompressionQuality; // Preset quality level
  removeMetadata?: boolean; // Remove PDF metadata (optional, user-controlled)
  pdfType?: PDFType; // Detected or user-specified PDF type
  targetSizeBytes?: number; // Target file size (optional)
}

/**
 * Compression result
 */
export interface CompressionResult {
  success: boolean;
  compressedBlob?: Blob;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  processingLocation: ProcessingLocation;
  tier: CompressionTier;
  pdfType?: PDFType; // For PDF compressions
  error?: string;
  metadata?: {
    duration: number; // Processing time in ms
    iterations?: number; // Binary search iterations used
    finalQuality?: number; // Final quality value used
    dimension?: { width: number; height: number }; // If resized
  };
}

/**
 * PDF type detection result
 */
export interface PDFTypeDetectionResult {
  type: PDFType;
  confidence: number; // 0-100
  pageCount: number;
  hasText: boolean;
  hasImages: boolean;
  textDensity: number; // Characters per page
  metadata?: {
    fileSize: number;
    version: string;
  };
}

/**
 * Compression progress data
 */
export interface CompressionProgress {
  status: CompressionStatus;
  progress: number; // 0-100
  message: string;
  currentStep?: string; // e.g., "Analyzing PDF", "Extracting images", "Compressing page 5/20"
  estimatedTimeRemaining?: number; // milliseconds
}

/**
 * Consent data for server-side processing
 */
export interface ServerConsentData {
  consentGiven: boolean;
  consentTimestamp: number;
  privacyPolicyRead: boolean;
  encryptionUnderstood: boolean;
}
