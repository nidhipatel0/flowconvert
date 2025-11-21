/**
 * Compress to Size Sidebar Component
 * Unified sidebar for both image and PDF compression with target size input
 * Self-contained component that triggers compression via ImageCompressor
 */

'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useCompressionStore } from '@/lib/stores/compression-store';
import { advancedCompressToTargetSize } from '@/lib/client-processors/advanced-image-compression';
import { compressPDFByRasterization } from '@/lib/client-processors/pdf-rasterize-compress';
import { Download, AlertCircle, CheckCircle, Info } from 'lucide-react';

export function CompressToSizeSidebar(): JSX.Element {
  const { activeFileId, files, updateFileData } = useEditorStore();
  const activeFile = activeFileId ? files.get(activeFileId) : undefined;
  const { progress, setStatus, setProgress, setCurrentResult } = useCompressionStore();

  // Target size input state
  const [targetValue, setTargetValue] = useState<string>('100');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleCompress = async () => {
    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid target size');
      return;
    }

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

    const targetBytes = targetUnit === 'KB' ? value * 1024 : value * 1024 * 1024;

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

      let compressionResult;

      // Handle PDF compression differently
      if (isPDF) {
        // Check file size limit
        const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB limit for client-side
        if (browserFile.size > MAX_PDF_SIZE) {
          setError(`PDF is too large (${(browserFile.size / (1024 * 1024)).toFixed(1)}MB) for client-side compression. Maximum: 10MB. Server-side compression coming soon!`);
          setIsProcessing(false);
          setStatus('error');
          return;
        }

        // Use page rasterization for aggressive compression
        const pdfResult = await compressPDFByRasterization(browserFile, {
          targetSizeBytes: targetBytes,
          quality: 0.75,
          scale: 1.5,
          onProgress: (progress, message) => {
            setProgress({
              status: 'compressing',
              progress,
              message,
              currentStep: message,
            });
          },
        });

        if (!pdfResult.success || !pdfResult.compressedBlob) {
          setError(pdfResult.error || 'PDF compression failed');
          setIsProcessing(false);
          setStatus('error');
          return;
        }

        const achievedSize = pdfResult.compressedSize;
        const targetMet = achievedSize <= targetBytes;
        const closeEnough = achievedSize <= targetBytes * 1.15; // Within 15% is acceptable

        compressionResult = {
          success: targetMet || closeEnough,
          compressedBlob: pdfResult.compressedBlob,
          originalSize: pdfResult.originalSize,
          compressedSize: pdfResult.compressedSize,
          reductionPercent: pdfResult.reductionPercent,
          metadata: {
            method: 'PDF page rasterization + image compression',
            finalQuality: pdfResult.metadata?.quality || 'N/A',
            format: 'pdf',
            targetSize: targetBytes,
            bestEffortSize: achievedSize,
            numPages: pdfResult.metadata?.numPages,
            note: targetMet 
              ? 'Target reached!' 
              : closeEnough
                ? `Close to target (${Math.round(((achievedSize - targetBytes) / targetBytes) * 100)}% over)`
                : 'Best effort achieved',
          },
        };
      } else {
        // Use advanced 5-tier compression for images
        compressionResult = await advancedCompressToTargetSize(browserFile, {
          targetSizeBytes: targetBytes,
          allowFormatConversion: true,
          removeMetadata: true,
          allowNoiseReduction: true,
          tolerancePercent: 5,
          onProgress: (tier, message, progressPercent) => {
            setProgress({
              status: 'compressing',
              progress: progressPercent,
              message: `Tier ${tier}: ${message}`,
              currentStep: message,
            });
          },
        });
      }

      // Generate preview URL
      if (compressionResult.compressedBlob) {
        const url = URL.createObjectURL(compressionResult.compressedBlob);
        setPreviewUrl(url);
      }

      setResult(compressionResult);
      setStatus('complete');
      setProgress({
        status: 'complete',
        progress: 100,
        message: 'Compression complete',
        currentStep: 'Done',
      });
      setCurrentResult(compressionResult);

      // Update file in store
      if (compressionResult.compressedBlob) {
        updateFileData(activeFile.id, compressionResult.compressedBlob);
      }
    } catch (err: any) {
      console.error('[CompressToSizeSidebar] Compression error:', err);
      setError(err.message || 'Compression failed');
      setStatus('error');
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Compression failed',
        currentStep: 'Error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.compressedBlob) return;

    const url = URL.createObjectURL(result.compressedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Determine file extension based on result
    const originalName = activeFile?.name || 'compressed';
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const ext = result.metadata?.format || 'jpg';
    
    link.download = `${nameWithoutExt}_compressed.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileType = (): 'image' | 'pdf' | 'unknown' => {
    if (!activeFile) return 'unknown';
    if (activeFile.type.startsWith('image/')) return 'image';
    if (activeFile.type === 'application/pdf' || activeFile.format === 'PDF') return 'pdf';
    return 'unknown';
  };

  const fileType = getFileType();
  const isTargetMet = result?.success === true;
  const isTargetNotMet = result?.success === false && result?.metadata?.bestEffortSize;

  return (
    <div className="p-4 space-y-4 overflow-y-auto flex-1">
      {/* Card 1: Target Size Input */}
      <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Info className="h-4 w-4 text-primary" />
          </div>
          Target Size
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Compress {fileType === 'image' ? 'image' : fileType === 'pdf' ? 'PDF' : 'file'} to:
          </label>
          
          <div className="flex gap-3 items-stretch">
            <input
              type="number"
              min="1"
              step="1"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              disabled={isProcessing}
              className="flex-1 min-w-0 px-4 py-2.5 text-base border border-border rounded-lg bg-background text-foreground disabled:opacity-50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="100"
            />
            <div className="relative">
              <select
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value as 'KB' | 'MB')}
                disabled={isProcessing}
                className="appearance-none px-6 py-2.5 text-base font-bold border-2 border-primary/40 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-primary disabled:opacity-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/60 hover:shadow-lg hover:scale-105 active:scale-100 w-[90px] text-center backdrop-blur-sm"
                style={{
                  backgroundImage: 'none'
                }}
              >
                <option value="KB" className="bg-background text-foreground">KB</option>
                <option value="MB" className="bg-background text-foreground">MB</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-primary opacity-70">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {activeFile && (
            <div className="text-xs text-muted-foreground truncate">
              Current size: {formatFileSize(activeFile.size)}
            </div>
          )}
        </div>

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={isProcessing || !activeFile}
          className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md"
        >
          {isProcessing ? 'Compressing...' : 'Compress'}
        </button>

        {/* Progress */}
        {progress && isProcessing && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{progress.currentStep || progress.message}</span>
              <span className="text-primary font-bold">{progress.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 shadow-sm"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Results (shown after compression) */}
      {(result || error) && (
        <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              {result?.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
            </div>
            Results
          </h3>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-destructive font-medium">Compression Failed</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && isTargetMet && (
            <>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Target Reached!
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                    {formatFileSize(result.compressedSize)} (target: {formatFileSize(parseFloat(targetValue) * (targetUnit === 'KB' ? 1024 : 1024 * 1024))})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-muted/50 rounded-md">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Original</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatFileSize(result.originalSize)}
                  </p>
                </div>
                <div className="p-2 bg-muted/50 rounded-md">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Compressed</p>
                  <p className="text-sm font-semibold text-green-500">
                    {formatFileSize(result.compressedSize)}
                  </p>
                </div>
              </div>

              <div className="p-2 bg-primary/10 rounded-md text-center">
                <p className="text-sm font-semibold text-primary">
                  Saved {result.reductionPercent.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(result.originalSize - result.compressedSize)} smaller
                </p>
              </div>

              {result.metadata?.method && (
                <div className="text-xs text-muted-foreground text-center break-words px-2">
                  {result.metadata.method}
                  {result.metadata.finalQuality && result.metadata.finalQuality !== 'N/A' && ` (${Math.round(result.metadata.finalQuality)}%)`}
                </div>
              )}

              <button
                onClick={handleDownload}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Compressed File
              </button>
            </>
          )}

          {result && isTargetNotMet && (
            <>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Target Not Reached
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 break-words">
                    Best: {formatFileSize(result.metadata.bestEffortSize)}
                    <br />
                    Target: {formatFileSize(result.metadata.targetSize)}
                    <br />
                    {Math.round(((result.metadata.bestEffortSize - result.metadata.targetSize) / result.metadata.targetSize) * 100)}% over
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground break-words">
                  We've tried all quality optimizations. {fileType === 'pdf' ? 'PDFs compress by rasterizing pages.' : 'To reach your target size, dimension reduction is needed.'}
                </p>

                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="truncate">Download ({formatFileSize(result.metadata.bestEffortSize)})</span>
                </button>

                <div className="text-[10px] text-muted-foreground text-center break-words">
                  {fileType === 'pdf' ? 'Note: Text searchability may be reduced' : 'Auto-resize and crop options coming soon'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Card 3: File Details */}
      {activeFile && (
        <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            File Details
          </h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="text-foreground font-medium truncate ml-2" title={activeFile.name}>
                {activeFile.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground font-medium">
                {activeFile.format || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="text-foreground font-medium">
                {formatFileSize(activeFile.size)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm">
        <p className="text-[10px] text-muted-foreground text-center">
          🛡️ <strong>100% Private:</strong> Your {fileType === 'image' ? 'images' : fileType === 'pdf' ? 'PDFs' : 'files'} are compressed entirely in your browser. No files are uploaded to any server.
        </p>
      </div>
    </div>
  );
}
