'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/lib/stores';
import { splitPDF, extractPages as extractPDFPages, deletePDFPages, rotatePDFPages } from '@/lib/client-processors/pdf-processor';
import { PreviewModal } from './PreviewModal';

interface PDFToolsSidebarProps {
  selectedTool: string;
}

export function PDFToolsSidebar({ selectedTool }: PDFToolsSidebarProps) {
  const files = useEditorStore((state) => Array.from(state.files.values()).filter(f => f.format === 'PDF'));
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

  // Auto-select first PDF file when tool changes
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0].id);
    }
  }, [files, selectedFile]);

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
        const ranges = pageRanges.split(',').map(range => {
          const [start, end] = range.trim().split('-').map(n => parseInt(n.trim()));
          return { start, end: end || start };
        });
        splitParams.ranges = ranges;
      }

      const resultBlobs = await splitPDF(blob, splitParams);

      // Download all split PDFs as ZIP
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      resultBlobs.forEach((blob, index) => {
        zip.file(`${file.name.replace('.pdf', '')}_part${index + 1}.pdf`, blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_split.zip`;
      a.click();
      URL.revokeObjectURL(url);
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

      const pageNumbers = extractPagesInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0);

      if (pageNumbers.length === 0) {
        alert('Please enter valid page numbers');
        return;
      }

      const extractedBlob = await extractPDFPages(blob, { pageNumbers });

      const url = URL.createObjectURL(extractedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_extracted.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error extracting pages:', error);
      alert('Failed to extract pages. Please try again.');
    }
  }, [selectedFile, extractPagesInput]);

  const handleDeletePages = useCallback(async () => {
    if (!selectedFile || selectedPages.length === 0) {
      alert('Please select a PDF file and pages to delete');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });

      // Convert 1-based page numbers to 0-based indices
      const pageIndices = selectedPages.map(p => p - 1);

      const resultBlob = await deletePDFPages(blob, pageIndices);

      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_deleted.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setSelectedPages([]);
      setOrganizePageInput('');
      alert(`Successfully deleted ${selectedPages.length} page(s)`);
    } catch (error) {
      console.error('Error deleting pages:', error);
      alert('Failed to delete pages. Please try again.');
    }
  }, [selectedFile, selectedPages]);

  const handleRotatePages = useCallback(async (degrees: 90 | 180 | 270) => {
    if (!selectedFile || selectedPages.length === 0) {
      alert('Please select a PDF file and pages to rotate');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });

      // Convert 1-based page numbers to 0-based indices
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

      const { PDFDocument } = await import('pdf-lib');

      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      const compressedBlob = new Blob([compressedPdfBytes as BlobPart], { type: 'application/pdf' });

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
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Upload PDF files to use PDF tools
        </p>
      </div>
    );
  }

  // Determine which tool is active based on selectedTool
  const activeTool = selectedTool === 'pdf-merge' ? 'merge' :
                     selectedTool === 'pdf-split' ? 'split' :
                     selectedTool === 'pdf-extract' ? 'extract' :
                     selectedTool === 'pdf-organise' ? 'organize' :
                     selectedTool === 'pdf-compress' ? 'compress' : null;

  if (!activeTool) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {/* Tool Card */}
      <div className="p-3 border-b" style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' }}>
        <div 
          className="rounded-lg border p-3"
          style={{ 
            borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
            backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)'
          }}
        >
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
            {activeTool === 'merge' && 'Merge PDFs'}
            {activeTool === 'split' && 'Split PDF'}
            {activeTool === 'extract' && 'Extract Pages'}
            {activeTool === 'organize' && 'Organize Pages'}
            {activeTool === 'compress' && 'Compress PDF'}
          </h3>

          {/* Merge PDFs */}
          {activeTool === 'merge' && (
            <div className="space-y-3">
              <p className="text-[10px] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Select PDFs to merge (in order):
              </p>

              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {files.map((file) => (
                  <label
                    key={file.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer text-[10px] ${
                      selectedFiles.includes(file.id) ? 'bg-opacity-20' : ''
                    }`}
                    style={{
                      backgroundColor: selectedFiles.includes(file.id)
                        ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)'
                        : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
                      border: '1px solid',
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-3 h-3"
                      style={{ accentColor: 'hsl(var(--primary))' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1 truncate" style={{ color: 'hsl(var(--foreground))' }}>
                      {file.name}
                    </span>
                    {selectedFiles.includes(file.id) && (
                      <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                        #{selectedFiles.indexOf(file.id) + 1}
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={handleMergePDFs}
                disabled={selectedFiles.length < 2}
                className="w-full px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                }}
              >
                Merge {selectedFiles.length} PDF{selectedFiles.length !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Split PDF */}
          {activeTool === 'split' && (
            <div className="space-y-3">
              <p className="text-[10px] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Select a PDF to split:
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Select PDF File
                  </label>
                  <select
                    value={selectedFile || ''}
                    onChange={(e) => setSelectedFile(e.target.value || null)}
                    className="w-full px-2 py-1 text-[10px] border rounded"
                    style={{
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
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
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Split Method
                  </label>
                  <select
                    value={splitMethod}
                    onChange={(e) => setSplitMethod(e.target.value as any)}
                    className="w-full px-2 py-1 text-[10px] border rounded"
                    style={{
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    <option value="every-page">Every Page (separate files)</option>
                    <option value="page-ranges">By Page Ranges</option>
                  </select>
                </div>

                {splitMethod === 'page-ranges' && (
                  <div>
                    <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                      Page Ranges (e.g., "1-3, 5-7")
                    </label>
                    <input
                      type="text"
                      value={pageRanges}
                      onChange={(e) => setPageRanges(e.target.value)}
                      placeholder="1-3, 5-7"
                      className="w-full px-2 py-1 text-[10px] border rounded"
                      style={{
                        borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                        backgroundColor: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Comma-separated ranges. Each range will become a separate PDF.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSplitPDF}
                  disabled={!selectedFile}
                  className="w-full px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }}
                >
                  Split PDF
                </button>
              </div>
            </div>
          )}

          {/* Extract Pages */}
          {activeTool === 'extract' && (
            <div className="space-y-3">
              <p className="text-[10px] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Extract specific pages from a PDF:
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Select PDF File
                  </label>
                  <select
                    value={selectedFile || ''}
                    onChange={(e) => setSelectedFile(e.target.value || null)}
                    className="w-full px-2 py-1 text-[10px] border rounded"
                    style={{
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
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
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Page Numbers to Extract (e.g., "1, 3, 5")
                  </label>
                  <input
                    type="text"
                    value={extractPagesInput}
                    onChange={(e) => setExtractPagesInput(e.target.value)}
                    placeholder="1, 3, 5"
                    className="w-full px-2 py-1 text-[10px] border rounded"
                    style={{
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Comma-separated page numbers. All pages will be combined into one new PDF.
                  </p>
                </div>

                <button
                  onClick={handleExtractPages}
                  disabled={!selectedFile}
                  className="w-full px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }}
                >
                  Extract Pages
                </button>
              </div>
            </div>
          )}

          {/* Organize Pages */}
          {activeTool === 'organize' && (
            <div className="space-y-3">
              <p className="text-[10px] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Organize pages (rotate, delete):
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Select PDF File
                  </label>
                  <select
                    value={selectedFile || ''}
                    onChange={(e) => setSelectedFile(e.target.value || null)}
                    className="w-full px-2 py-1 text-[10px] border rounded"
                    style={{
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
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
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Select Pages (e.g., "1, 3, 5")
                  </label>
                  <input
                    type="text"
                    value={organizePageInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOrganizePageInput(value);
                      const pages = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                      setSelectedPages(pages);
                    }}
                    placeholder="1, 3, 5"
                    className="w-full px-2 py-1 text-[10px] border rounded"
                    style={{
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''} selected
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRotatePages(90)}
                    disabled={!selectedFile || selectedPages.length === 0}
                    className="px-2 py-1.5 rounded text-[10px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid',
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
                    }}
                  >
                    ↷ 90°
                  </button>
                  <button
                    onClick={() => handleRotatePages(180)}
                    disabled={!selectedFile || selectedPages.length === 0}
                    className="px-2 py-1.5 rounded text-[10px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid',
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
                    }}
                  >
                    ↻ 180°
                  </button>
                  <button
                    onClick={() => handleRotatePages(270)}
                    disabled={!selectedFile || selectedPages.length === 0}
                    className="px-2 py-1.5 rounded text-[10px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid',
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
                    }}
                  >
                    ↶ 270°
                  </button>
                </div>

                <button
                  onClick={handleDeletePages}
                  disabled={!selectedFile || selectedPages.length === 0}
                  className="w-full px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'rgb(220, 38, 38)',
                    color: 'white'
                  }}
                >
                  🗑️ Delete Selected Pages
                </button>
              </div>
            </div>
          )}

          {/* Compress PDF */}
          {activeTool === 'compress' && (
            <div className="space-y-3">
              <p className="text-[10px] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Compress PDF to reduce file size:
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Select PDF File
                  </label>
                  <select
                    value={selectedFile || ''}
                    onChange={(e) => setSelectedFile(e.target.value || null)}
                    className="w-full px-2 py-1 text-[10px] border rounded"
                    style={{
                      borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))'
                    }}
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
                  <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                    Compression Level: {compressQuality}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={compressQuality}
                    onChange={(e) => setCompressQuality(parseInt(e.target.value))}
                    className="w-full h-1"
                    style={{ accentColor: 'hsl(var(--primary))' }}
                  />
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                <button
                  onClick={handleCompressPDF}
                  disabled={!selectedFile}
                  className="w-full px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }}
                >
                  📦 Compress PDF
                </button>

                <div className="p-2 rounded border" style={{ 
                  borderColor: 'rgba(34, 197, 94, 0.3)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)'
                }}>
                  <p className="text-[10px] font-medium" style={{ color: 'rgb(34, 197, 94)' }}>
                    ✓ 100% Private
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgb(22, 163, 74)' }}>
                    All compression happens in your browser. Your PDF never leaves your device.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

