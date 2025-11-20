'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/lib/stores/editor-store';
import { usePDFCropStore, type CropArea } from '@/lib/stores/pdf-crop-store';
import { loadPDF, renderPDFPage, getPDFPageCount } from '@/lib/utils/pdf-renderer';
import { CropOverlay } from '../image-tools/CropOverlay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { setCurrentPdfPage } from '../FileDetailsSidebar';

interface PageRenderInfo {
  wrapper: HTMLDivElement;
  canvasEl: HTMLCanvasElement;
  overlayContainer: HTMLDivElement;
  rendered: boolean;
  imageUrl: string | null;
  page: number;
}

export function PDFCropToolVertical() {
  const { getActiveFile } = useEditorStore();
  const {
    setCurrentPage,
    setTotalPages,
    setPageCropArea,
    reset,
    pageCropAreas,
    selectedRatio,
    totalPages: storeTotalPages,
  } = usePDFCropStore();

  const file = getActiveFile();
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [scale] = useState(1.5); // Scale for rendering pages
  const [pruneDistance] = useState(5); // Prune pages more than 5 pages away

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefsMap = useRef<Map<number, PageRenderInfo>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset crop store when component mounts
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load PDF when file changes
  useEffect(() => {
    console.log('[PDFCropToolVertical] File changed:', {
      hasFile: !!file,
      format: file?.format,
      hasOriginalFile: !!file?.originalFile,
    });

    if (file?.originalFile && file.format === 'PDF') {
      setIsLoadingPDF(true);
      setError(null);
      setPdfDoc(null);

      console.log('[PDFCropToolVertical] Starting PDF load...');
      loadPDF(file.originalFile)
        .then((pdf) => {
          console.log('[PDFCropToolVertical] PDF loaded successfully:', pdf);
          setPdfDoc(pdf);
          const count = getPDFPageCount(pdf);
          setTotalPages(count);
          setCurrentPage(1);
          setActivePage(1);
          setIsLoadingPDF(false);
        })
        .catch((error) => {
          console.error('[PDFCropToolVertical] Error loading PDF:', error);
          setError(error instanceof Error ? error.message : 'Failed to load PDF');
          setIsLoadingPDF(false);
        });
    }
  }, [file, setTotalPages, setCurrentPage]);

  // Pruning function - clear rendered pages far from view
  const prunePage = useCallback((pageNum: number) => {
    const pageInfo = pageRefsMap.current.get(pageNum);
    if (!pageInfo || !pageInfo.rendered) return;

    console.log('[PDFCropToolVertical] Pruning page:', pageNum);

    // Clear canvas
    const ctx = pageInfo.canvasEl.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, pageInfo.canvasEl.width, pageInfo.canvasEl.height);
    }

    // Hide overlay container
    pageInfo.overlayContainer.style.display = 'none';

    // Show loading placeholder again
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-placeholder';
    loadingDiv.textContent = 'Scroll to load...';
    loadingDiv.style.padding = '120px 40px';
    loadingDiv.style.color = 'hsl(var(--muted-foreground))';
    loadingDiv.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)';
    loadingDiv.style.borderRadius = '8px';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.minHeight = '600px';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.justifyContent = 'center';

    // Insert before overlay container
    pageInfo.wrapper.insertBefore(loadingDiv, pageInfo.overlayContainer);

    // Mark as not rendered
    pageInfo.rendered = false;
    pageInfo.imageUrl = null;
    pageRefsMap.current.set(pageNum, pageInfo);
  }, []);

  // Prune pages far from center
  const prunePages = useCallback((centerPage: number) => {
    pageRefsMap.current.forEach((_pageInfo, pageNum) => {
      if (Math.abs(pageNum - centerPage) > pruneDistance) {
        prunePage(pageNum);
      }
    });
  }, [pruneDistance, prunePage]);

  // Render a single page - defined BEFORE setupObserver
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;

    const pageInfo = pageRefsMap.current.get(pageNum);
    if (!pageInfo) return;

    // Skip if already rendered
    if (pageInfo.rendered) return;

    console.log('[PDFCropToolVertical] Rendering page:', pageNum);

    try {
      const canvas = pageInfo.canvasEl;

      // Render PDF page to canvas
      await renderPDFPage(pdfDoc, pageNum, canvas, { scale });

      console.log('[PDFCropToolVertical] Page rendered:', pageNum, 'Size:', canvas.width, 'x', canvas.height);

      // Auto-select full page crop area
      const fullPageCrop = {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      };

      // Set crop area for this page if not already set
      if (!pageCropAreas.get(pageNum)) {
        setPageCropArea(pageNum, fullPageCrop);
        console.log('[PDFCropToolVertical] Auto-selected full page crop for page:', pageNum);
      }

      // Convert canvas to data URL for CropOverlay
      const imageUrl = canvas.toDataURL('image/png');
      pageInfo.imageUrl = imageUrl;
      pageInfo.rendered = true;

      // Hide loading placeholder and show overlay container
      const loadingDiv = pageInfo.wrapper.querySelector('.loading-placeholder');
      if (loadingDiv) {
        loadingDiv.remove();
      }
      pageInfo.overlayContainer.style.display = 'block';

      // Update the map
      pageRefsMap.current.set(pageNum, pageInfo);

    } catch (error) {
      console.error('[PDFCropToolVertical] Error rendering page:', pageNum, error);
    }
  }, [pdfDoc, scale, setPageCropArea, pageCropAreas]);

  // Setup IntersectionObserver - defined BEFORE useEffect
  const setupObserver = useCallback(() => {
    const options: IntersectionObserverInit = {
      root: null, // Use viewport as root instead of container
      rootMargin: '400px 0px 400px 0px', // Prefetch pages 400px before they come into view
      threshold: [0, 0.25, 0.5, 0.75, 1.0], // Multiple thresholds for better tracking
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const wrapper = entry.target as HTMLDivElement;
        const pageNum = parseInt(wrapper.dataset.pageNumber || '0', 10);

        if (entry.isIntersecting && pageNum > 0) {
          const pageInfo = pageRefsMap.current.get(pageNum);

          // Render this page if not rendered
          if (pageInfo && !pageInfo.rendered) {
            console.log('[PDFCropToolVertical] Rendering page due to intersection:', pageNum);
            renderPage(pageNum);
          }

          // Update active page when it's mostly visible (>50%)
          if (entry.intersectionRatio > 0.5) {
            setActivePage(pageNum);
            setCurrentPage(pageNum);
            setCurrentPdfPage(pageNum); // Sync with thumbnail sidebar
          }

          // Prefetch next 2 pages
          for (let p = pageNum + 1; p <= Math.min(getPDFPageCount(pdfDoc), pageNum + 2); p++) {
            const nextPageInfo = pageRefsMap.current.get(p);
            if (nextPageInfo && !nextPageInfo.rendered) {
              console.log('[PDFCropToolVertical] Prefetching page:', p);
              renderPage(p);
            }
          }

          // Prune pages far from view
          prunePages(pageNum);
        }
      });
    }, options);

    // Observe all page wrappers
    pageRefsMap.current.forEach((pageInfo) => {
      if (pageInfo.wrapper && observerRef.current) {
        observerRef.current.observe(pageInfo.wrapper);
      }
    });

    console.log('[PDFCropToolVertical] Observer setup complete, observing', pageRefsMap.current.size, 'pages');

    // Render first 2 pages immediately (don't wait for intersection)
    setTimeout(() => {
      console.log('[PDFCropToolVertical] Rendering initial pages...');
      renderPage(1);
      if (getPDFPageCount(pdfDoc) > 1) {
        renderPage(2);
      }
    }, 100);
  }, [pdfDoc, setCurrentPage, renderPage, prunePages]);

  // Setup page placeholders and IntersectionObserver when PDF loads
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const container = containerRef.current;
    const pageContainer = container.querySelector('.pages-container');
    if (!pageContainer) return;

    // Clear existing content
    pageContainer.innerHTML = '';
    pageRefsMap.current.clear();

    const numPages = getPDFPageCount(pdfDoc);
    console.log('[PDFCropToolVertical] Setting up', numPages, 'page placeholders');

    // Create placeholders for all pages
    for (let i = 1; i <= numPages; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page-wrapper';
      wrapper.dataset.pageNumber = String(i);
      wrapper.style.position = 'relative';
      wrapper.style.margin = '24px auto';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '12px';
      wrapper.style.maxWidth = '100%';

      // Page number label
      const label = document.createElement('div');
      label.className = 'page-label';
      label.textContent = `Page ${i}`;
      label.style.fontSize = '14px';
      label.style.fontWeight = '600';
      label.style.color = 'hsl(var(--foreground))';
      label.style.padding = '4px 12px';
      label.style.borderRadius = '4px';
      label.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';

      // Canvas for page render (hidden, used only for rendering)
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-render-canvas';
      canvas.style.display = 'none'; // Always hidden, used only for rendering

      // Container for CropOverlay (will be populated by React)
      const overlayContainer = document.createElement('div');
      overlayContainer.className = 'crop-overlay-container';
      overlayContainer.dataset.pageNumber = String(i);
      overlayContainer.style.display = 'none'; // Hidden until rendered
      overlayContainer.style.width = '100%';
      overlayContainer.style.maxWidth = '900px';

      // Loading placeholder
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-placeholder';
      loadingDiv.textContent = 'Loading page...';
      loadingDiv.style.padding = '120px 40px';
      loadingDiv.style.color = 'hsl(var(--muted-foreground))';
      loadingDiv.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)';
      loadingDiv.style.borderRadius = '8px';
      loadingDiv.style.textAlign = 'center';
      loadingDiv.style.minHeight = '600px';
      loadingDiv.style.display = 'flex';
      loadingDiv.style.alignItems = 'center';
      loadingDiv.style.justifyContent = 'center';
      loadingDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

      wrapper.appendChild(label);
      wrapper.appendChild(loadingDiv);
      wrapper.appendChild(canvas);
      wrapper.appendChild(overlayContainer);

      pageContainer.appendChild(wrapper);

      pageRefsMap.current.set(i, {
        wrapper,
        canvasEl: canvas,
        overlayContainer,
        rendered: false,
        imageUrl: null,
        page: i,
      });
    }

    // Setup IntersectionObserver for lazy rendering
    setupObserver();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [pdfDoc, setupObserver]);

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

  // Handle crop change for a specific page
  const handlePageCropChange = useCallback((pageNum: number, newCrop: CropArea) => {
    setPageCropArea(pageNum, newCrop);
  }, [setPageCropArea]);

  // Navigation handlers
  const handlePreviousPage = useCallback(() => {
    if (activePage > 1) {
      const newPage = activePage - 1;
      const pageInfo = pageRefsMap.current.get(newPage);
      if (pageInfo?.wrapper) {
        pageInfo.wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activePage]);

  const handleNextPage = useCallback(() => {
    if (activePage < storeTotalPages) {
      const newPage = activePage + 1;
      const pageInfo = pageRefsMap.current.get(newPage);
      if (pageInfo?.wrapper) {
        pageInfo.wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activePage, storeTotalPages]);

  return (
    <div className="flex-1 relative flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Active page indicator */}
      <div
        className="sticky top-0 z-10 px-4 py-2 text-center text-sm font-medium"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
          color: 'hsl(var(--foreground))',
        }}
      >
        Viewing Page {activePage} of {getPDFPageCount(pdfDoc) || 0}
      </div>

      {/* Scrollable pages container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{
          padding: '16px',
          scrollBehavior: 'smooth',
        }}
      >
        <div className="pages-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Pages will be dynamically inserted here */}
        </div>

        {/* Render CropOverlay components for all rendered pages */}
        {Array.from(pageRefsMap.current.entries()).map(([pageNum, pageInfo]) => {
          if (!pageInfo.rendered || !pageInfo.imageUrl) return null;

          const cropArea = pageCropAreas.get(pageNum);
          if (!cropArea) return null;

          // Use React Portal to render into the overlay container
          return (
            <CropOverlayPortal
              key={pageNum}
              pageNum={pageNum}
              container={pageInfo.overlayContainer}
              imageUrl={pageInfo.imageUrl}
              cropArea={cropArea}
              onCropChange={handlePageCropChange}
              aspectRatio={selectedRatio.ratio}
            />
          );
        })}

        {/* Page Navigation - Center Bottom */}
        {storeTotalPages > 1 && (
          <div
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-md shadow-lg z-20"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
            }}
          >
            <button
              onClick={handlePreviousPage}
              disabled={activePage <= 1}
              className="p-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: 'hsl(var(--foreground))',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (activePage > 1) {
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
              Page {activePage} / {storeTotalPages}
            </div>

            <button
              onClick={handleNextPage}
              disabled={activePage >= storeTotalPages}
              className="p-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: 'hsl(var(--foreground))',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (activePage < storeTotalPages) {
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
  );
}

// Helper component to render CropOverlay into a DOM element using React Portal
interface CropOverlayPortalProps {
  pageNum: number;
  container: HTMLElement;
  imageUrl: string;
  cropArea: CropArea;
  onCropChange: (pageNum: number, crop: CropArea) => void;
  aspectRatio: number | null;
}

function CropOverlayPortal({
  pageNum,
  container,
  imageUrl,
  cropArea,
  onCropChange,
  aspectRatio,
}: CropOverlayPortalProps) {
  return createPortal(
    <CropOverlay
      imageUrl={imageUrl}
      cropArea={cropArea}
      onCropChange={(newCrop) => onCropChange(pageNum, newCrop)}
      aspectRatio={aspectRatio}
      containerWidth={900}
      containerHeight={800}
    />,
    container
  );
}
