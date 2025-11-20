'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { extractTextFromImage, getSupportedLanguages, OCRProgress } from '@/lib/client-processors/ocr-processor';
import { convertPDFPageToImage, getPDFPageCount } from '@/lib/utils/image-from-pdf';
import { Sparkles, Eye, Download } from 'lucide-react';
import { setCurrentOCRPage, getCurrentOCRPage } from './OCRScan';

export function OCRScanSidebar() {
  const {
    files,
    getActiveFile,
    setOCRResult,
    setOCRProgress,
    setOCRProcessing,
    clearOCRResult,
    ocrIsProcessing,
    ocrProgress
  } = useEditorStore();
  const fileList = Array.from(files.values());
  const activeFile = getActiveFile();

  const [selectedFileId, setSelectedFileId] = useState<string>(activeFile?.id || '');
  const [selectedLanguage, setSelectedLanguage] = useState('eng');
  const [selectedPage, setSelectedPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);

  // Get selected file
  const selectedFile = selectedFileId ? files.get(selectedFileId) : null;
  const isPDF = selectedFile?.format === 'PDF';

  // Reset page to 1 when file changes or component mounts
  useEffect(() => {
    if (isPDF) {
       setSelectedPage(1);
       setCurrentOCRPage(1);
    }
  }, [selectedFileId, isPDF]);
  
  // Sync selectedPage with shared state from workspace
  useEffect(() => {
    const checkPageChange = () => {
      const sharedPage = getCurrentOCRPage();
      // Only update if valid and different, and not 0 (initial state)
      if (sharedPage !== selectedPage && sharedPage >= 1 && sharedPage <= pdfTotalPages) {
        console.log('[OCRSidebar] Syncing page from workspace:', sharedPage);
        setSelectedPage(sharedPage);
      }
    };
    const interval = setInterval(checkPageChange, 200); // Slower interval to reduce potential conflicts
    return () => clearInterval(interval);
  }, [selectedPage, pdfTotalPages]);


  // Initialize PDF page count when component mounts or file changes
  useEffect(() => {
    const initializePDFPageCount = async () => {
      if (selectedFile && selectedFile.format === 'PDF' && selectedFile.originalFile) {
        try {
          const pageCount = await getPDFPageCount(selectedFile.originalFile);
          setPdfTotalPages(pageCount);
          console.log('[OCRSidebar] PDF page count initialized:', pageCount);
          // Sync initial page from shared state
          const sharedPage = getCurrentOCRPage();
          // If shared page is valid, use it, otherwise default to 1
          if (sharedPage >= 1 && sharedPage <= pageCount) {
            setSelectedPage(sharedPage);
          } else {
            setSelectedPage(1);
            setCurrentOCRPage(1);
          }
        } catch (err) {
          console.error('[OCRSidebar] Failed to get PDF page count:', err);
        }
      }
    };
    initializePDFPageCount();
  }, [selectedFile]);

  // Initialize selectedPage from shared state on mount
  useEffect(() => {
    const sharedPage = getCurrentOCRPage();
    if (sharedPage >= 1) {
      setSelectedPage(sharedPage);
    }
  }, []);

  // Filter files to show only images and PDFs
  const ocrSupportedFiles = fileList.filter((f) => {
    if (!f.format) return false;
    const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF'].includes(f.format);
    const isPDF = f.format === 'PDF';
    return isImage || isPDF;
  });

  // Update PDF page count when file changes
  const handleFileChange = useCallback(async (fileId: string) => {
    setSelectedFileId(fileId);
    clearOCRResult();
    setError(null);
    setSelectedPage(1);
    setCurrentOCRPage(1); // Reset shared state
    setPdfTotalPages(0);

    const file = files.get(fileId);
    if (file && file.format === 'PDF' && file.originalFile) {
      try {
        const pageCount = await getPDFPageCount(file.originalFile);
        setPdfTotalPages(pageCount);
      } catch (err) {
        console.error('[OCRSidebar] Failed to get PDF page count:', err);
      }
    }
  }, [files, clearOCRResult]);

  // Handle OCR extraction
  const handleExtractText = useCallback(async () => {
    if (!selectedFile?.originalFile) {
      setError('Please select a file');
      return;
    }

    setOCRProcessing(true);
    clearOCRResult();
    setError(null);

    try {
      let imageBlob: Blob;

      // Convert PDF page to image if needed
      if (isPDF) {
        console.log('[OCRSidebar] Converting PDF page to image...', {
          page: selectedPage,
          totalPages: pdfTotalPages,
        });
        imageBlob = await convertPDFPageToImage(selectedFile.originalFile, selectedPage, 300);
      } else {
        imageBlob = selectedFile.originalFile;
      }

      // Progress callback
      const onProgress = (prog: OCRProgress) => {
        console.log('[OCRSidebar] Progress:', prog);
        // Map Tesseract progress to percentage
        if (prog.status === 'recognizing text') {
          setOCRProgress(Math.round(prog.progress * 100));
        } else if (prog.status === 'loading tesseract core' || prog.status === 'initializing api') {
          setOCRProgress(Math.round(prog.progress * 50)); // First 50% is loading
        }
      };

      // Extract text
      const result = await extractTextFromImage(imageBlob, selectedLanguage, onProgress);

      setOCRResult(result.text, result.confidence, result.processingTime);
    } catch (err) {
      console.error('[OCRSidebar] OCR failed:', err);
      setError(err instanceof Error ? err.message : 'OCR extraction failed');
      setOCRProcessing(false);
    }
  }, [selectedFile, isPDF, selectedPage, pdfTotalPages, selectedLanguage, setOCRProcessing, setOCRProgress, setOCRResult, clearOCRResult]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* OCR Settings Card */}
      <div className="p-2 rounded-lg border" style={{
        backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
        borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
      }}>
        <h3 className="text-[10px] font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          OCR Settings
        </h3>

        {/* File Selector */}
        <div className="mb-2">
          <label className="text-[9px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Select File
          </label>
          <select
            value={selectedFileId}
            onChange={(e) => handleFileChange(e.target.value)}
            className="w-full px-2 py-1 text-[10px] rounded border"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
              color: 'hsl(var(--foreground))',
            }}
            disabled={ocrIsProcessing}
          >
            <option value="">-- Select a file --</option>
            {ocrSupportedFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.name} ({file.format})
              </option>
            ))}
          </select>
        </div>

        {/* Language Selector */}
        <div className="mb-2">
          <label className="text-[9px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-2 py-1 text-[10px] rounded border"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
              color: 'hsl(var(--foreground))',
            }}
            disabled={ocrIsProcessing}
          >
            {getSupportedLanguages().map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Page Selector (for PDFs only) */}
        {isPDF && pdfTotalPages > 0 && (
          <div className="mb-2">
            <label className="text-[9px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Page to Extract
            </label>
            <select
              value={selectedPage}
              onChange={(e) => {
                const newPage = Number(e.target.value);
                console.log('[OCRSidebar] Page selected from dropdown:', newPage);
                setSelectedPage(newPage);
                setCurrentOCRPage(newPage); // Update shared state to sync with workspace
              }}
              className="w-full px-2 py-1 text-[10px] rounded border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                color: 'hsl(var(--foreground))',
              }}
              disabled={ocrIsProcessing}
            >
              {Array.from({ length: pdfTotalPages }, (_, i) => i + 1).map((page) => (
                <option key={page} value={page}>
                  Page {page} of {pdfTotalPages}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Progress Bar */}
        {ocrIsProcessing && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[9px] mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <span>Processing...</span>
              <span>{ocrProgress}%</span>
            </div>
            <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${ocrProgress}%`,
                  backgroundColor: 'hsl(var(--primary))',
                }}
              />
            </div>
          </div>
        )}

        {/* Extract Button */}
        <button
          onClick={handleExtractText}
          disabled={!selectedFileId || ocrIsProcessing}
          className="w-full px-2 py-1.5 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: (!selectedFileId || ocrIsProcessing) ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' : 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            cursor: (!selectedFileId || ocrIsProcessing) ? 'not-allowed' : 'pointer',
          }}
        >
          <Sparkles size={12} />
          {ocrIsProcessing ? 'Extracting Text...' : 'Extract Text'}
        </button>

        {/* Info Text */}
        <p className="text-[9px] mt-2 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          💡 First time will download language data (~2-4MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 rounded border" style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: 'rgb(239, 68, 68)',
        }}>
          <p className="text-[9px]">{error}</p>
        </div>
      )}

      {/* File Details Card */}
      {selectedFile && (
        <div className="p-2 rounded-lg border" style={{
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
          borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
        }}>
          <h3 className="text-[10px] font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
            File Details
          </h3>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px]">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Name:</span>
              <span style={{ color: 'hsl(var(--foreground))' }} className="truncate ml-2 max-w-[150px]" title={selectedFile.name}>
                {selectedFile.name}
              </span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Format:</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{selectedFile.format}</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Size:</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{formatFileSize(selectedFile.size)}</span>
            </div>
            {isPDF && pdfTotalPages > 0 && (
              <div className="flex justify-between text-[9px]">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Pages:</span>
                <span style={{ color: 'hsl(var(--foreground))' }}>{pdfTotalPages}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={() => {
                if (selectedFile.previewUrl) {
                  window.open(selectedFile.previewUrl, '_blank');
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors border"
              style={{
                backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
                borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.4)',
                color: 'hsl(var(--foreground))',
              }}
            >
              <Eye size={10} /> Preview
            </button>
            <button
              onClick={() => {
                if (selectedFile.originalFile) {
                  const url = URL.createObjectURL(selectedFile.originalFile);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = selectedFile.name;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              <Download size={10} /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
