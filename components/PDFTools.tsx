'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores';
import { splitPDF, extractPages as extractPDFPages, deletePDFPages, rotatePDFPages } from '@/lib/client-processors/pdf-processor';
import { PreviewModal } from './PreviewModal';

export function PDFTools() {
  const files = useEditorStore((state) => Array.from(state.files.values()).filter(f => f.format === 'PDF'));
  const [activeTab, setActiveTab] = useState<'merge' | 'split' | 'extract' | 'organize' | 'compress'>('merge');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Split settings
  const [splitMethod, setSplitMethod] = useState<'every-page' | 'page-ranges'>('every-page');
  const [pageRanges, setPageRanges] = useState<string>('1-3, 5-7');

  // Extract settings
  const [extractPagesInput, setExtractPagesInput] = useState<string>('1, 3, 5');

  // Organize settings
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [organizePageInput, setOrganizePageInput] = useState('');

  // Compress settings
  const [compressQuality, setCompressQuality] = useState(60);

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
    originalSize?: number;
  } | null>(null);

  const handleMergePDFs = useCallback(async () => {
    if (selectedFiles.length < 2) {
      alert('Please select at least 2 PDF files to merge');
      return;
    }

    try {
      const { mergePDFs } = await import('@/lib/client-processors/pdf-processor');

      const blobs = selectedFiles.map((fileId) => {
        const file = useEditorStore.getState().files.get(fileId);
        if (!file) return null;
        return file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });
      }).filter((blob): blob is Blob => blob !== null);

      const mergedBlob = await mergePDFs(blobs, { fileIds: selectedFiles });

      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please try again.');
    }
  }, [selectedFiles]);

  const handleSplitPDF = useCallback(async () => {
    if (!selectedFile) {
      alert('Please select a PDF file to split');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });

      let splitParams: any = { splitMethod };

      if (splitMethod === 'page-ranges') {
        // Parse ranges like "1-3, 5-7" into [{start: 1, end: 3}, {start: 5, end: 7}]
        const ranges = pageRanges.split(',').map(range => {
          const [start, end] = range.trim().split('-').map(n => parseInt(n.trim()));
          return { start, end: end || start };
        });
        splitParams.ranges = ranges;
      }

      const resultBlobs = await splitPDF(blob, splitParams);

      // Download each PDF
      resultBlobs.forEach((resultBlob, index) => {
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace('.pdf', '')}_part${index + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });

      alert(`Successfully split into ${resultBlobs.length} PDF files`);
    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('Failed to split PDF. Please try again.');
    }
  }, [selectedFile, splitMethod, pageRanges]);

  const handleExtractPages = useCallback(async () => {
    if (!selectedFile) {
      alert('Please select a PDF file');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });

      // Parse page numbers like "1, 3, 5" into [1, 3, 5]
      const pageNumbers = extractPagesInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

      if (pageNumbers.length === 0) {
        alert('Please enter valid page numbers');
        return;
      }

      const resultBlob = await extractPDFPages(blob, { pageNumbers });

      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_extracted.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      alert(`Successfully extracted ${pageNumbers.length} pages`);
    } catch (error) {
      console.error('Error extracting pages:', error);
      alert('Failed to extract pages. Please try again.');
    }
  }, [selectedFile, extractPagesInput]);

  const handleDeletePages = useCallback(async () => {
    if (!selectedFile || selectedPages.length === 0) {
      alert('Please select pages to delete');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });

      const resultBlob = await deletePDFPages(blob, selectedPages);

      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_edited.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setSelectedPages([]);
      alert(`Successfully deleted ${selectedPages.length} pages`);
    } catch (error) {
      console.error('Error deleting pages:', error);
      alert('Failed to delete pages. Please try again.');
    }
  }, [selectedFile, selectedPages]);

  const handleRotatePages = useCallback(async (degrees: 90 | 180 | 270) => {
    if (!selectedFile || selectedPages.length === 0) {
      alert('Please select pages to rotate');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });

      // Convert 1-based to 0-based indices
      const pageIndices = selectedPages.map(p => p - 1);

      const resultBlob = await rotatePDFPages(blob, pageIndices, degrees);

      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_rotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setSelectedPages([]);
      alert(`Successfully rotated ${selectedPages.length} pages by ${degrees}°`);
    } catch (error) {
      console.error('Error rotating pages:', error);
      alert('Failed to rotate pages. Please try again.');
    }
  }, [selectedFile, selectedPages]);

  const handleCompressPDF = useCallback(async () => {
    if (!selectedFile) {
      alert('Please select a PDF file to compress');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });
      const originalSize = blob.size;

      // Dynamically import pdf-lib
      const { PDFDocument } = await import('pdf-lib');

      // Load the PDF
      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Save with compression - this will reprocess and optimize the PDF
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      const compressedBlob = new Blob([compressedPdfBytes as BlobPart], { type: 'application/pdf' });

      // Show preview instead of immediate download
      const url = URL.createObjectURL(compressedBlob);
      const fileName = `${file.name.replace('.pdf', '')}_compressed.pdf`;

      setPreviewData({
        url,
        blob: compressedBlob,
        fileName,
        originalSize,
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Failed to compress PDF. Please try again.');
    }
  }, [selectedFile, compressQuality]);

  const handleConfirmDownload = useCallback(() => {
    if (!previewData) return;

    const a = document.createElement('a');
    a.href = previewData.url;
    a.download = previewData.fileName;
    a.click();
    URL.revokeObjectURL(previewData.url);

    setPreviewData(null);
  }, [previewData]);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  if (files.length === 0) {
    return (
      <div className="workspace-card">
        <div className="text-center py-8">
          <p className="text-sm text-secondary-600">
            Upload PDF files to use PDF tools
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-secondary-900">
          PDF Tools
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-secondary-200">
        {[
          { id: 'merge', label: 'Merge PDFs', icon: '🔗' },
          { id: 'split', label: 'Split PDF', icon: '✂️' },
          { id: 'extract', label: 'Extract Pages', icon: '📄' },
          { id: 'organize', label: 'Organize Pages', icon: '📑' },
          { id: 'compress', label: 'Compress PDF', icon: '📦' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-700 border-b-2 border-cyan-600'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'merge' && (
        <div>
          <p className="text-sm text-secondary-600 mb-4">
            Select PDFs to merge (in order):
          </p>

          <div className="space-y-2 mb-4">
            {files.map((file) => (
              <label
                key={file.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFiles.includes(file.id)
                    ? 'bg-cyan-50 border-cyan-400'
                    : 'bg-white border-secondary-200 hover:border-cyan-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="rounded"
                />
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">{file.name}</p>
                  <p className="text-xs text-secondary-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {selectedFiles.includes(file.id) && (
                  <span className="text-xs font-semibold text-cyan-700">
                    #{selectedFiles.indexOf(file.id) + 1}
                  </span>
                )}
              </label>
            ))}
          </div>

          <button
            onClick={handleMergePDFs}
            disabled={selectedFiles.length < 2}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Merge {selectedFiles.length} PDF{selectedFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {activeTab === 'split' && (
        <div>
          <p className="text-sm text-secondary-600 mb-4">
            Select a PDF to split:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Select PDF File
              </label>
              <select
                value={selectedFile || ''}
                onChange={(e) => setSelectedFile(e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="">-- Select a PDF --</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Split Method
              </label>
              <select
                value={splitMethod}
                onChange={(e) => setSplitMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="every-page">Every Page (separate files)</option>
                <option value="page-ranges">By Page Ranges</option>
              </select>
            </div>

            {splitMethod === 'page-ranges' && (
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Page Ranges (e.g., "1-3, 5-7")
                </label>
                <input
                  type="text"
                  value={pageRanges}
                  onChange={(e) => setPageRanges(e.target.value)}
                  placeholder="1-3, 5-7"
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Comma-separated ranges. Each range will become a separate PDF.
                </p>
              </div>
            )}

            <button
              onClick={handleSplitPDF}
              disabled={!selectedFile}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Split PDF
            </button>
          </div>
        </div>
      )}

      {activeTab === 'extract' && (
        <div>
          <p className="text-sm text-secondary-600 mb-4">
            Extract specific pages from a PDF:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Select PDF File
              </label>
              <select
                value={selectedFile || ''}
                onChange={(e) => setSelectedFile(e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="">-- Select a PDF --</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Page Numbers to Extract (e.g., "1, 3, 5")
              </label>
              <input
                type="text"
                value={extractPagesInput}
                onChange={(e) => setExtractPagesInput(e.target.value)}
                placeholder="1, 3, 5"
                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
              <p className="text-xs text-secondary-500 mt-1">
                Comma-separated page numbers. All pages will be combined into one new PDF.
              </p>
            </div>

            <button
              onClick={handleExtractPages}
              disabled={!selectedFile}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Extract Pages
            </button>
          </div>
        </div>
      )}

      {activeTab === 'organize' && (
        <div>
          <p className="text-sm text-secondary-600 mb-4">
            Organize pages (rotate, delete):
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Select PDF File
              </label>
              <select
                value={selectedFile || ''}
                onChange={(e) => setSelectedFile(e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="">-- Select a PDF --</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Select Pages (e.g., "1, 3, 5")
              </label>
              <input
                type="text"
                value={organizePageInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setOrganizePageInput(value);
                  // Parse and update selected pages
                  const pages = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                  setSelectedPages(pages);
                }}
                placeholder="1, 3, 5"
                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
              <p className="text-xs text-secondary-500 mt-1">
                {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRotatePages(90)}
                disabled={!selectedFile || selectedPages.length === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                ↷ Rotate 90°
              </button>
              <button
                onClick={() => handleRotatePages(180)}
                disabled={!selectedFile || selectedPages.length === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                ↻ Rotate 180°
              </button>
              <button
                onClick={() => handleRotatePages(270)}
                disabled={!selectedFile || selectedPages.length === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                ↶ Rotate 270°
              </button>
            </div>

            <button
              onClick={handleDeletePages}
              disabled={!selectedFile || selectedPages.length === 0}
              className="btn-primary w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Delete Selected Pages
            </button>
          </div>
        </div>
      )}

      {activeTab === 'compress' && (
        <div>
          <p className="text-sm text-secondary-600 mb-4">
            Compress PDF to reduce file size:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Select PDF File
              </label>
              <select
                value={selectedFile || ''}
                onChange={(e) => setSelectedFile(e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="">-- Select a PDF --</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-2">
                Compression Level: {compressQuality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={compressQuality}
                onChange={(e) => setCompressQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-secondary-500 mt-1">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
              <p className="text-xs text-secondary-500 mt-2">
                Note: Compression results may vary depending on PDF content. PDFs with many images typically compress better.
              </p>
            </div>

            <button
              onClick={handleCompressPDF}
              disabled={!selectedFile}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📦 Compress PDF
            </button>

            <div className="border border-green-200 rounded-lg p-3 bg-green-50">
              <p className="text-xs font-medium text-green-900 mb-1">
                ✓ 100% Private
              </p>
              <p className="text-xs text-green-800">
                All compression happens in your browser. Your PDF never leaves your device.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          if (previewData) {
            URL.revokeObjectURL(previewData.url);
            setPreviewData(null);
          }
        }}
        onConfirm={handleConfirmDownload}
        title="Preview PDF Output"
        previewUrl={previewData?.url || null}
        fileType="pdf"
        originalSize={previewData?.originalSize}
        newSize={previewData?.blob.size}
        newFileName={previewData?.fileName}
      />
    </div>
  );
}
