'use client';

import { useState, useEffect, /* useRef */ } from 'react';
import { CropOverlay } from '../image-tools/CropOverlay';
import { useEditorStore } from '@/lib/stores/editor-store';
import { usePDFCropStore } from '@/lib/stores/pdf-crop-store';
import { loadPDF, renderPDFPage, getPDFPageCount } from '@/lib/utils/pdf-renderer';
import { ChevronLeft, ChevronRight, Rows, Square } from 'lucide-react';
import { PDFCropToolVertical } from './PDFCropToolVertical';

interface PDFCropToolProps {
  onExit?: () => void;
}

export function PDFCropTool({ onExit }: PDFCropToolProps = {}) {
  const [viewMode, setViewMode] = useState<'single' | 'vertical'>('single');
  const { getActiveFile } = useEditorStore();
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    getCurrentCropArea,
    setPageCropArea,
    selectedRatio,
    reset,
  } = usePDFCropStore();

  const file = getActiveFile();
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pageImageUrl, setPageImageUrl] = useState<string>('');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key to exit tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[PDFCropTool] ESC pressed, exiting tool');
        if (onExit) {
          onExit();
        } else {
          // Dispatch event to exit tool
          window.dispatchEvent(new CustomEvent('exit-crop-tool'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // Reset crop store when component mounts (ensures clean state for auto-selection)
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-select full page when PDF loads (after reset)
  useEffect(() => {
    if (pdfDoc && totalPages > 0 && currentPage > 0) {
      // This will trigger the page render effect which will set full page crop
      // The effect above will handle setting the crop area to full page
    }
  }, [pdfDoc, totalPages, currentPage]);

  // Load PDF when file changes
  useEffect(() => {
    console.log('[PDFCropTool] File changed:', {
      hasFile: !!file,
      format: file?.format,
      hasOriginalFile: !!file?.originalFile,
      fileType: file?.originalFile?.constructor?.name
    });

    if (file?.originalFile && file.format === 'PDF') {
      setIsLoadingPDF(true);
      setError(null);
      setPdfDoc(null);
      setPageImageUrl('');

      console.log('[PDFCropTool] Starting PDF load...');
      loadPDF(file.originalFile)
        .then((pdf) => {
          console.log('[PDFCropTool] PDF loaded successfully:', pdf);
          setPdfDoc(pdf);
          const count = getPDFPageCount(pdf);
          setTotalPages(count);
          setCurrentPage(1);
          setIsLoadingPDF(false);
        })
        .catch((error) => {
          console.error('[PDFCropTool] Error loading PDF:', error);
          setError(error instanceof Error ? error.message : 'Failed to load PDF');
          setIsLoadingPDF(false);
        });
    }
  }, [file, setTotalPages, setCurrentPage]);

  // Render current page when PDF or page changes
  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      console.log('[PDFCropTool] Rendering page:', currentPage);
      setIsLoadingPage(true);
      const canvas = document.createElement('canvas');

      renderPDFPage(pdfDoc, currentPage, canvas, { scale: 2 })
        .then(() => {
          console.log('[PDFCropTool] Page rendered successfully, canvas size:', canvas.width, 'x', canvas.height);
          
          // Calculate full page crop area FIRST (before setting image URL)
          // The image created from canvas.toDataURL() will have dimensions = canvas.width x canvas.height
          // So crop area should be in those dimensions (NOT divided by scale)
          const fullPageCrop = {
            x: 0,
            y: 0,
            width: canvas.width,  // Full canvas width (image dimensions)
            height: canvas.height, // Full canvas height (image dimensions)
          };
          
          console.log('[PDFCropTool] Auto-selecting full page as crop area:', {
            page: currentPage,
            x: 0,
            y: 0,
            width: fullPageCrop.width,
            height: fullPageCrop.height
          });

          // Set crop area SYNCHRONOUSLY before setting image URL
          // This ensures it's available when CropOverlay first renders
          setPageCropArea(currentPage, fullPageCrop);
          
          // Now set the image URL (this will trigger CropOverlay to render with the correct crop area)
          const url = canvas.toDataURL('image/png');
          console.log('[PDFCropTool] Data URL created, length:', url.length);
          setPageImageUrl(url);
          setIsLoadingPage(false);
        })
        .catch((error) => {
          console.error('[PDFCropTool] Error rendering PDF page:', error);
          setError(error instanceof Error ? error.message : 'Failed to render PDF page');
          setIsLoadingPage(false);
        });
    }
  }, [pdfDoc, currentPage, setPageCropArea]);

  // Update container size based on window
  useEffect(() => {
    const updateSize = () => {
      const width = Math.max(window.innerWidth - 600, 800);
      const height = Math.max(window.innerHeight - 150, 600);
      setContainerSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // If vertical mode is selected, use the vertical component
  if (viewMode === 'vertical') {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* View mode toggle */}
        <div className="flex justify-end p-2 border-b" style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' }}>
          <button
            onClick={() => setViewMode('single')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors"
            style={{
              backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
              color: 'hsl(var(--foreground))',
            }}
            title="Switch to single page view"
          >
            <Square size={14} />
            Single Page
          </button>
        </div>
        <PDFCropToolVertical />
      </div>
    );
  }

  if (!file || file.format !== 'PDF') {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Please select a PDF file</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <p style={{ color: 'rgb(239, 68, 68)' }}>Error loading PDF</p>
          <p className="text-sm mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoadingPDF) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading PDF document...</p>
      </div>
    );
  }

  if (isLoadingPage || !pageImageUrl) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Rendering PDF page {currentPage}...</p>
      </div>
    );
  }

  const cropArea = getCurrentCropArea();

  const handleCropChange = (newCrop: any) => {
    setPageCropArea(currentPage, newCrop);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* View mode toggle */}
      <div className="flex justify-end p-2 border-b" style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' }}>
        <button
          onClick={() => setViewMode('vertical')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors"
          style={{
            backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
            color: 'hsl(var(--foreground))',
          }}
          title="Switch to vertical scroll view"
        >
          <Rows size={14} />
          Vertical Scroll
        </button>
      </div>

      <div className="flex-1 relative" style={{
        overflowY: 'auto', // Enable vertical scroll
        overflowX: 'auto', // Enable horizontal scroll
        minHeight: 0, // Important for flex children to allow scrolling
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%', // Ensure content takes at least full height for centering
            width: '100%',
          }}
        >
        <CropOverlay
        imageUrl={pageImageUrl}
        cropArea={cropArea}
        onCropChange={handleCropChange}
        aspectRatio={selectedRatio.ratio}
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
      />

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-md shadow-lg"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
            }}
          >
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="p-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: 'hsl(var(--foreground))',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (currentPage > 1) {
                  e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                color: 'hsl(var(--foreground))',
                backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
              }}
            >
              Page {currentPage} / {totalPages}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: 'hsl(var(--foreground))',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
