/**
 * PDF Compressor Component
 * Main workspace component for PDF compression
 */

'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useCompressionStore } from '@/lib/stores/compression-store';
import { compressPDFClient, estimatePDFCompression } from '@/lib/client-processors/pdf-compression';
import { FileArchive, Download, AlertCircle, Shield, Cloud } from 'lucide-react';

export function PDFCompressor(): JSX.Element {
  const { getActiveFile } = useEditorStore();
  const { setStatus, setProgress, setCurrentResult } = useCompressionStore();
  const [result, setResult] = useState<any>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeFile = getActiveFile();

  React.useEffect(() => {
    if (activeFile && activeFile.type === 'application/pdf') {
      // Extract the Blob from the custom File type
      const fileBlob = activeFile.data instanceof Blob
        ? activeFile.data
        : new Blob([activeFile.data], { type: activeFile.type });

      // Create a browser File object
      const browserFile = new File([fileBlob], activeFile.name, { type: activeFile.type });

      estimatePDFCompression(browserFile).then(setEstimate);
    }
  }, [activeFile]);

  const handleCompress = async (): Promise<void> => {
    if (!activeFile) {
      setError('No file selected. Please upload a PDF first.');
      return;
    }

    if (activeFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatus('compressing');
    setProgress({
      status: 'compressing',
      progress: 0,
      message: 'Compressing PDF...',
      currentStep: 'Analyzing file',
    });

    try {
      setProgress({
        status: 'compressing',
        progress: 30,
        message: 'Compressing PDF...',
        currentStep: 'Optimizing structure',
      });

      // Extract the Blob from the custom File type
      const fileBlob = activeFile.data instanceof Blob
        ? activeFile.data
        : new Blob([activeFile.data], { type: activeFile.type });

      // Create a browser File object
      const browserFile = new File([fileBlob], activeFile.name, { type: activeFile.type });

      const compressionResult = await compressPDFClient(browserFile, {
        removeMetadata: false, // Keep metadata by default
      });

      setProgress({
        status: 'compressing',
        progress: 90,
        message: 'Finalizing...',
      });

      if (compressionResult.success) {
        setResult(compressionResult);
        setCurrentResult(compressionResult);
        setStatus('complete');
        setProgress({
          status: 'complete',
          progress: 100,
          message: 'Compression complete!',
        });
      } else {
        throw new Error(compressionResult.error || 'Compression failed');
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
    a.download = `${nameWithoutExt}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <FileArchive className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No PDF Selected</h3>
          <p className="text-sm text-muted-foreground">
            Please upload a PDF file to compress it.
          </p>
        </div>
      </div>
    );
  }

  if (activeFile.type !== 'application/pdf') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Invalid File Type</h3>
          <p className="text-sm text-muted-foreground">
            Please select a PDF file. Images can be compressed in the Image Compressor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
      {/* File Info */}
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">{activeFile.name}</h3>
            <p className="text-sm text-muted-foreground">
              Original size: {formatFileSize(activeFile.size)}
            </p>
          </div>
          <FileArchive className="h-8 w-8 text-primary" />
        </div>

        {/* Estimate */}
        {estimate && (
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              {estimate.canCompressClientSide ? (
                <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Cloud className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  {estimate.canCompressClientSide ? 'Client-Side Compression' : 'Server-Side Recommended'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {estimate.reason}
                </p>
                {estimate.canCompressClientSide && (
                  <p className="text-xs text-green-500 mt-2">
                    Estimated reduction: ~{estimate.estimatedClientReduction}%
                  </p>
                )}
                {estimate.recommendServerSide && (
                  <p className="text-xs text-primary mt-2">
                    Server-side could achieve ~{estimate.estimatedServerReduction}% reduction
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={isProcessing || !estimate?.canCompressClientSide}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isProcessing ? 'Compressing...' : estimate?.canCompressClientSide ? 'Compress PDF (Client-Side)' : 'File Too Large for Client-Side'}
        </button>

        {!estimate?.canCompressClientSide && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-500">
              💡 Server-side compression coming soon for large PDFs (&gt;5MB)
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Original Size</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatFileSize(result.originalSize)}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Compressed Size</p>
                <p className="text-lg font-semibold text-green-500">
                  {formatFileSize(result.compressedSize)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-center text-lg font-semibold text-green-500">
                Reduced by {result.reductionPercent.toFixed(1)}%
              </p>
              <p className="text-center text-xs text-muted-foreground mt-1">
                Saved {formatFileSize(result.originalSize - result.compressedSize)}
              </p>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Download Compressed PDF
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="w-full max-w-2xl p-4 bg-muted/30 border border-border rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          🛡️ <strong>100% Private:</strong> Your PDFs are compressed entirely in your browser.
          No files are uploaded to any server.
        </p>
      </div>
    </div>
  );
}
