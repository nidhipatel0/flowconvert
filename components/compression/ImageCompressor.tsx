/**
 * Universal Compress to Size Component
 * Works for both images and PDFs with advanced 5-tier compression
 */

'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useCompressionStore } from '@/lib/stores/compression-store';
import { advancedCompressToTargetSize } from '@/lib/client-processors/advanced-image-compression';
import { FileArchive, AlertCircle } from 'lucide-react';

export function ImageCompressor(): JSX.Element {
  const { getActiveFile, updateFileData } = useEditorStore();
  const { setStatus, setProgress, setCurrentResult } = useCompressionStore();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const activeFile = getActiveFile();

  const handleCompress = async (targetBytes: number): Promise<void> => {
    if (!activeFile) {
      setError('No file selected. Please upload a file first.');
      return;
    }

    // Check if it's an image or PDF
    const isImage = activeFile.type.startsWith('image/');
    const isPDF = activeFile.type === 'application/pdf' || activeFile.format === 'PDF';

    if (!isImage && !isPDF) {
      setError('Please select an image or PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setStatus('compressing');
    setProgress({
      status: 'compressing',
      progress: 0,
      message: 'Starting compression...',
      currentStep: 'Analyzing file',
    });

    try {
      // Extract the Blob from the custom File type
      const fileBlob = activeFile.data instanceof Blob
        ? activeFile.data
        : new Blob([activeFile.data], { type: activeFile.type });

      // Create a browser File object from the Blob
      const browserFile = new File([fileBlob], activeFile.name, { type: activeFile.type });

      // Use advanced 5-tier compression
      const compressionResult = await advancedCompressToTargetSize(browserFile, {
        targetSizeBytes: targetBytes,
        allowFormatConversion: true,
        removeMetadata: true,
        allowNoiseReduction: true,
        tolerancePercent: 5,
        onProgress: (tier, message, progress) => {
      setProgress({
        status: 'compressing',
            progress,
            message: `Tier ${tier}: ${message}`,
            currentStep: message,
          });
        },
      });

      // Generate preview URL
      if (compressionResult.compressedBlob) {
        const url = URL.createObjectURL(compressionResult.compressedBlob);
        setPreviewUrl(url);
      }

      setResult(compressionResult);
      setCurrentResult(compressionResult);

      if (compressionResult.success) {
        setStatus('complete');
        setProgress({
          status: 'complete',
          progress: 100,
          message: 'Compression complete!',
        });
      } else {
        // Target not met, but we have best effort
        setStatus('complete');
        setProgress({
          status: 'complete',
          progress: 100,
          message: compressionResult.metadata?.message || 'Target not reached',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed');
      setStatus('error');
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Compression failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (): void => {
    if (!result?.compressedBlob) return;

    const url = URL.createObjectURL(result.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    const originalName = activeFile?.name || 'compressed';
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = result.compressedBlob.type.split('/')[1] || 'bin';
    a.download = `${nameWithoutExt}_compressed.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetryWithDimensionReduction = async (): Promise<void> => {
    // TODO: Implement auto-resize and retry logic
    alert('Auto-resize feature coming soon! For now, please use manual crop.');
  };

  const handleManualCrop = (): void => {
    // TODO: Navigate to crop tool with guidance
    alert('Manual crop integration coming soon! This will open the crop tool with recommended dimensions.');
  };

  const getFileType = (): 'image' | 'pdf' | 'unknown' => {
    if (!activeFile) return 'unknown';
    if (activeFile.type.startsWith('image/')) return 'image';
    if (activeFile.type === 'application/pdf' || activeFile.format === 'PDF') return 'pdf';
    return 'unknown';
  };

  const fileType = getFileType();

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <FileArchive className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No File Selected</h3>
          <p className="text-sm text-muted-foreground">
            Please upload an image or PDF file to compress it to a specific size.
          </p>
        </div>
      </div>
    );
  }

  if (fileType === 'unknown') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Unsupported File Type</h3>
          <p className="text-sm text-muted-foreground">
            Please select an image (PNG, JPG, WebP, etc.) or PDF file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-4">
      {/* Preview Area */}
      <div className="w-full max-w-4xl">
        {previewUrl ? (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Compressed Preview</h3>
            <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]">
              {fileType === 'image' ? (
                <img
                  src={previewUrl}
                  alt="Compressed preview"
                  className="max-w-full max-h-[600px] object-contain rounded"
                />
              ) : (
                <div className="text-center">
                  <FileArchive className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
                    PDF compressed successfully. Use sidebar to download.
            </p>
          </div>
              )}
        </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-center bg-muted/30 rounded-lg p-8 min-h-[400px]">
              <div className="text-center">
                <FileArchive className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {activeFile.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Current size: {((activeFile.size / 1024 / 1024)).toFixed(2)} MB
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Use the sidebar to set your target size and start compression.
                  Our advanced 5-tier compression system will try multiple techniques to reach your target without quality loss.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
