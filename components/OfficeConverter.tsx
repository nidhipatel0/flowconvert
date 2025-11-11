'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores';

/**
 * Office Document Converter Component
 *
 * Converts between Office formats and PDF using server-side API
 */
export function OfficeConverter() {
  const files = useEditorStore((state) => Array.from(state.files.values()));

  // Filter files that might need server-side conversion
  const documentFiles = files.filter(f =>
    f.format && ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'].includes(f.format)
  );

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<'pdf' | 'docx' | 'xlsx' | 'pptx'>('pdf');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConvert = useCallback(async () => {
    if (!selectedFile) {
      alert('Please select a file to convert');
      return;
    }

    const file = useEditorStore.getState().files.get(selectedFile);
    if (!file) return;

    setIsConverting(true);
    setProgress(0);

    try {
      // Convert file data to base64
      let fileData: string;
      if (file.data instanceof Blob) {
        const arrayBuffer = await file.data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fileData = buffer.toString('base64');
      } else {
        fileData = Buffer.from(file.data).toString('base64');
      }

      setProgress(25);

      // Call server-side conversion API
      const response = await fetch('/api/process/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData,
          sourceFormat: file.format?.toLowerCase(),
          targetFormat: targetFormat.toLowerCase(),
          options: {
            quality: 100,
            preserveFormatting: true,
            includeImages: true,
          },
        }),
      });

      setProgress(75);

      const result = await response.json();

      if (result.success && result.data) {
        // Convert base64 back to blob
        const convertedBuffer = Buffer.from(result.data, 'base64');
        const convertedBlob = new Blob([convertedBuffer], {
          type: getMimeType(targetFormat),
        });

        // Download converted file
        const url = URL.createObjectURL(convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace(/\.[^/.]+$/, '')}.${targetFormat}`;
        a.click();
        URL.revokeObjectURL(url);

        setProgress(100);
        alert('Conversion successful!');
      } else {
        throw new Error(result.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Conversion failed. This feature requires server-side setup with LibreOffice.'
      );
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  }, [selectedFile, targetFormat]);

  const getAvailableFormats = (sourceFormat?: string) => {
    if (!sourceFormat) return [];

    const format = sourceFormat.toLowerCase();

    if (format === 'pdf') {
      return ['docx', 'xlsx', 'pptx'];
    } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(format)) {
      return ['pdf'];
    }

    return [];
  };

  const getMimeType = (format: string): string => {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    return mimeTypes[format] || 'application/octet-stream';
  };

  const selectedFileObj = selectedFile ? useEditorStore.getState().files.get(selectedFile) : null;
  const availableFormats = selectedFileObj ? getAvailableFormats(selectedFileObj.format) : [];

  if (documentFiles.length === 0) {
    return (
      <div className="workspace-card">
        <div className="text-center py-8">
          <p className="text-sm text-secondary-600">
            Upload Office documents or PDFs to use the converter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-secondary-900">
          Office Document Converter
        </h2>
        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
          Server-Side
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Panel: File Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Select Document
            </label>
            <select
              value={selectedFile || ''}
              onChange={(e) => {
                setSelectedFile(e.target.value || null);
                setTargetFormat('pdf');
              }}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              disabled={isConverting}
            >
              <option value="">-- Select a document --</option>
              {documentFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name} ({file.format})
                </option>
              ))}
            </select>
          </div>

          {selectedFileObj && (
            <div className="border border-secondary-200 rounded-lg p-3 bg-secondary-50">
              <p className="text-xs font-medium text-secondary-700 mb-2">File Info:</p>
              <div className="space-y-1 text-xs text-secondary-600">
                <p>Name: {selectedFileObj.name}</p>
                <p>Format: {selectedFileObj.format}</p>
                <p>Size: {(selectedFileObj.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Convert To
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              disabled={!selectedFile || isConverting || availableFormats.length === 0}
            >
              {availableFormats.length === 0 ? (
                <option value="">-- Select a file first --</option>
              ) : (
                availableFormats.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))
              )}
            </select>
          </div>

          {isConverting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-secondary-600">
                <span>Converting on server...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={!selectedFile || !targetFormat || isConverting || availableFormats.length === 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? '🔄 Converting...' : '🔄 Convert Document'}
          </button>

          <p className="text-xs text-secondary-500">
            💡 Server-side conversions are encrypted with AES-256 and auto-deleted within 5 minutes.
          </p>
        </div>

        {/* Right Panel: Supported Conversions */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-secondary-700">
            Supported Conversions
          </h3>

          <div className="space-y-3">
            <div className="border border-secondary-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-semibold text-secondary-900 mb-1">
                📄 PDF to Office
              </p>
              <p className="text-xs text-secondary-600">
                Convert PDF to editable Word, Excel, or PowerPoint documents
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {['DOCX', 'XLSX', 'PPTX'].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-secondary-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-semibold text-secondary-900 mb-1">
                📝 Office to PDF
              </p>
              <p className="text-xs text-secondary-600">
                Convert Word, Excel, PowerPoint to PDF
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {['PDF'].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-secondary-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-semibold text-secondary-900 mb-1">
                🖼️ Images to Documents
              </p>
              <p className="text-xs text-secondary-600">
                Convert images to PDF or Word with OCR
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {['PDF', 'DOCX'].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
            <p className="text-xs font-medium text-orange-900 mb-1">
              ⚠️ Feature Status
            </p>
            <p className="text-xs text-orange-800">
              Office document conversion requires LibreOffice headless setup on the server. This feature is currently under development.
            </p>
          </div>

          <div className="border border-secondary-200 rounded-lg p-3 bg-secondary-50">
            <p className="text-xs font-medium text-secondary-700 mb-2">
              File Size Limits:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-secondary-600">
              <div>
                <span className="font-semibold">Free:</span> 50MB
              </div>
              <div>
                <span className="font-semibold">Premium:</span> 500MB
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
