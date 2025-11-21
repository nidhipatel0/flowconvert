'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { FileUploadZone } from './FileUploadZone';
import { loadPDF, renderPDFPage, getPDFPageCount } from '@/lib/utils/pdf-renderer';
import { setCurrentPdfPage, getCurrentPdfPage } from './FileDetailsSidebar';
import { ESignatureWorkspace } from './esign-tools/ESignatureWorkspace';
import { InteractiveCropTool } from './image-tools/InteractiveCropTool';
import { PDFCropTool } from './pdf-tools/PDFCropTool';
import { OCRScan } from './ocr-tools/OCRScan';
import { BottomBar } from './BottomBar';
import { X } from 'lucide-react';

interface MainWorkspaceProps {
  selectedTool?: string;
  onClearTool?: () => void;
}

// Helper function to check if an element or its parents are scrollable
/* function isElementScrollable(element: HTMLElement | null): boolean {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;
  const isScrollable = (overflowY === 'auto' || overflowY === 'scroll' || 
                       overflowX === 'auto' || overflowX === 'scroll') &&
                       (element.scrollHeight > element.clientHeight || 
                        element.scrollWidth > element.clientWidth);
  
  if (isScrollable) return true;
  
  // Check parent elements up to 3 levels
  let parent = element.parentElement;
  for (let i = 0; i < 3 && parent; i++) {
    const parentStyle = window.getComputedStyle(parent);
    const parentOverflowY = parentStyle.overflowY;
    const parentOverflowX = parentStyle.overflowX;
    if ((parentOverflowY === 'auto' || parentOverflowY === 'scroll' || 
         parentOverflowX === 'auto' || parentOverflowX === 'scroll') &&
        (parent.scrollHeight > parent.clientHeight || 
         parent.scrollWidth > parent.clientWidth)) {
      return true;
    }
    parent = parent.parentElement;
  }
  
  return false;
} */

export function MainWorkspace({ selectedTool, onClearTool }: MainWorkspaceProps) {
  const { getActiveFile, files, undoOperation, redoOperation } = useEditorStore();
  const file = getActiveFile();
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = getCurrentPdfPage();
    return saved >= 1 ? saved : 1;
  });
  const [zoom, setZoom] = useState(100);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null); // PDFDocumentProxy from pdfjs-dist
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const renderedPages = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prevSelectedToolRef = useRef<string | null>(null);
  const currentPageRef = useRef(1);
  // const scrollAccumulatorRef = useRef(0);
  // const lastScrollTimeRef = useRef(0);

  // Check if undo/redo is available (MUST be before any conditional returns)
  const fileHistory = useEditorStore((state) => state.fileHistory);
  const fileRedoHistory = useEditorStore((state) => state.fileRedoHistory);
  const canUndo = file ? (fileHistory.get(file.id)?.length || 0) > 0 : false;
  const canRedo = file ? (fileRedoHistory.get(file.id)?.length || 0) > 0 : false;

  // Convert Map to Array
  const fileList = Array.from(files.values());
  const isPDF = file?.format === 'PDF';

  // Load PDF when file changes
  useEffect(() => {
    // Reset PDF state when file changes
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
    
    // Reset scroll position to top when new file is loaded
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    if (file && file.format === 'PDF') {
      console.log('Loading PDF:', {
        name: file.name,
        format: file.format,
        type: file.type,
        hasOriginalFile: !!file.originalFile,
        originalFileType: file.originalFile?.constructor?.name,
        originalFileSize: file.originalFile instanceof Blob ? file.originalFile.size : 'N/A',
        dataType: file.data?.constructor?.name
      });
      
      if (!file.originalFile) {
        console.error('PDF file missing originalFile:', file);
        setIsLoadingPDF(false);
        return;
      }
      
      setIsLoadingPDF(true);
      
      // Add timeout to prevent indefinite hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF loading timeout after 30 seconds')), 30000);
      });
      
      Promise.race([loadPDF(file.originalFile), timeoutPromise])
        .then((pdf) => {
          console.log('PDF loaded successfully:', pdf);
          setPdfDoc(pdf);
          const pageCount = getPDFPageCount(pdf);
          setTotalPages(pageCount);
          
          // Preserve the current page from global state if valid, otherwise default to 1
          const savedPage = getCurrentPdfPage();
          const pageToSet = (savedPage >= 1 && savedPage <= pageCount) ? savedPage : 1;
          
          setCurrentPage(pageToSet);
          setCurrentPdfPage(pageToSet);
          setIsLoadingPDF(false);
        })
        .catch((error) => {
          console.error('Error loading PDF:', error);
          console.error('File details:', {
            name: file.name,
            format: file.format,
            type: file.type,
            hasOriginalFile: !!file.originalFile,
            originalFileType: file.originalFile?.constructor?.name,
            originalFileSize: file.originalFile instanceof Blob ? file.originalFile.size : 'N/A',
            dataType: file.data?.constructor?.name
          });
          setPdfDoc(null);
          setTotalPages(0);
          setIsLoadingPDF(false);
        });
    } else {
      setIsLoadingPDF(false);
    }
  }, [file]);

  // Sync current page from FileDetailsSidebar
  useEffect(() => {
    const checkPageChange = () => {
      const sharedPage = getCurrentPdfPage();
      if (sharedPage !== currentPage) {
        setCurrentPage(sharedPage);
        // Scroll to the page if possible
        if (pageRefs.current[sharedPage - 1]) {
          pageRefs.current[sharedPage - 1]?.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }
    };
    const interval = setInterval(checkPageChange, 100);
    return () => clearInterval(interval);
  }, [currentPage]);

  // Check if tool requires specific file type (must be before useEffect that uses it)
  const imageTools = ['crop', 'resize', 'convert-jpg', 'convert-png', 'convert-webp', 'convert-jpeg'];
  const pdfTools = ['pdf-crop', 'editor-crop', 'pdf-merge', 'pdf-split', 'pdf-extract', 'pdf-compress', 'pdf-organise', 'editor-esign'];
  const requiresImage = imageTools.includes(selectedTool || '');
  const requiresPDF = pdfTools.includes(selectedTool || '');
  
  const hasFileTypeMismatch = file && selectedTool && (
    (requiresImage && file.format === 'PDF') || 
    (requiresPDF && file.format !== 'PDF')
  );

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Render visible pages with IntersectionObserver
  useEffect(() => {
    const customWorkspaceTools = ['crop', 'editor-crop', 'pdf-crop', 'ocr-scan', 'editor-esign'];
    const hasCustomWorkspace = selectedTool && customWorkspaceTools.includes(selectedTool);

    observerRef.current?.disconnect();
    observerRef.current = null;

    if (isPDF && pdfDoc && !hasCustomWorkspace && !hasFileTypeMismatch) {
      // Force clear cache if we just exited a tool
      if (prevSelectedToolRef.current && !selectedTool) {
        renderedPages.current.clear();
      }
      
      // Only resize if length changed to avoid wiping valid refs
      if (pageRefs.current.length !== totalPages) {
        renderedPages.current.clear();
        pageRefs.current = new Array(totalPages).fill(null);
      }

      const timeoutId = window.setTimeout(() => {
        // Ensure container scrolls to the current page (defaults to first page)
        if (containerRef.current) {
          const targetPage = pageRefs.current[currentPageRef.current - 1] || pageRefs.current[0];
          if (targetPage) {
            containerRef.current.scrollTo({
              top: targetPage.offsetTop - containerRef.current.offsetTop,
              behavior: 'auto',
            });
          } else {
            containerRef.current.scrollTo({ top: 0, behavior: 'auto' });
          }
        }

        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const pageNum = Number(entry.target.getAttribute('data-page-number'));

                // Render page if not already rendered
                if (!renderedPages.current.has(pageNum)) {
                  const wrapper = pageRefs.current[pageNum - 1];
                  const canvas = wrapper?.querySelector('canvas');
                  if (canvas) {
                    renderedPages.current.add(pageNum);
                    renderPDFPage(pdfDoc, pageNum, canvas, { scale: 1.5 })
                      .catch(err => {
                        console.error(`Error rendering page ${pageNum}`, err);
                        renderedPages.current.delete(pageNum);
                      });
                  }
                }

                // Update current page if this page is the most visible
                if (entry.intersectionRatio > 0.5) {
                  setCurrentPage(pageNum);
                  setCurrentPdfPage(pageNum);
                }
              }
            });
          },
          {
            root: containerRef.current,
            threshold: [0.1, 0.5, 0.9],
            rootMargin: '200px' // Pre-load pages before they come into view
          }
        );

        pageRefs.current.forEach((el) => {
          if (el) observerRef.current?.observe(el);
        });

        if (renderedPages.current.size === 0 && pageRefs.current[0]) {
          const canvas = pageRefs.current[0].querySelector('canvas');
          if (canvas) {
            renderedPages.current.add(1);
            renderPDFPage(pdfDoc, 1, canvas, { scale: 1.5 })
              .catch(err => {
                console.error(`Error rendering page 1`, err);
                renderedPages.current.delete(1);
              });
          }
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        observerRef.current?.disconnect();
        observerRef.current = null;
      };
    }

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [pdfDoc, totalPages, isPDF, selectedTool, hasFileTypeMismatch]);

  // Preserve current page when exiting custom tools
  useEffect(() => {
    const prevTool = prevSelectedToolRef.current;
    if (prevTool && !selectedTool && containerRef.current) {
      // Preserve the current page from global state
      const savedPage = getCurrentPdfPage();
      if (savedPage >= 1 && savedPage <= totalPages) {
        setCurrentPage(savedPage);
        // Scroll to the preserved page after a small delay to ensure refs are ready
        setTimeout(() => {
          const targetPage = pageRefs.current[savedPage - 1];
          if (targetPage) {
            containerRef.current?.scrollTo({
              top: targetPage.offsetTop - (containerRef.current?.offsetTop || 0),
              behavior: 'auto',
            });
          }
        }, 100);
      }
    }
    prevSelectedToolRef.current = selectedTool || null;
  }, [selectedTool, totalPages]);

  // Handle ESC key to exit tool (only if no signature is selected in e-sign tool)
  useEffect(() => {
    const handleExitESignTool = () => {
      if (selectedTool === 'editor-esign' && onClearTool) {
        onClearTool();
      }
    };

    const handleExitCropTool = () => {
      if ((selectedTool === 'crop' || selectedTool === 'editor-crop' || selectedTool === 'pdf-crop') && onClearTool) {
        onClearTool();
      }
    };

    const handleExitOCRTool = () => {
      if (selectedTool === 'ocr-scan' && onClearTool) {
        onClearTool();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTool && onClearTool) {
        // For tools with custom workspaces, let them handle ESC internally first
        if (selectedTool === 'editor-esign' || selectedTool === 'crop' || 
            selectedTool === 'editor-crop' || selectedTool === 'pdf-crop' || 
            selectedTool === 'ocr-scan') {
          // Don't handle ESC here, let the tool handle it and dispatch exit event
          return;
        } else {
          // For other tools, exit immediately
          console.log('[MainWorkspace] ESC pressed, clearing tool');
          onClearTool();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('exit-esign-tool', handleExitESignTool);
    window.addEventListener('exit-crop-tool', handleExitCropTool);
    window.addEventListener('exit-ocr-tool', handleExitOCRTool);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('exit-esign-tool', handleExitESignTool);
      window.removeEventListener('exit-crop-tool', handleExitCropTool);
      window.removeEventListener('exit-ocr-tool', handleExitOCRTool);
    };
  }, [selectedTool, onClearTool]);

  // Constants for scroll-based page navigation
  // const SCROLL_THRESHOLD = 30; // Pixels to accumulate before changing page (reduced for smoother response)
  // const SCROLL_DEBOUNCE_MS = 150; // Minimum time between page changes

  // Handle Ctrl+Scroll zoom, touchpad pinch-to-zoom, and regular scroll for page navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if Ctrl key is pressed (works for both Ctrl+Scroll and touchpad pinch)
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        // Only zoom if event is within the workspace container
        const container = containerRef.current;
        if (!container) return;

        const target = e.target as HTMLElement;
        if (container.contains(target)) {
          // Determine zoom direction
          const delta = e.deltaY;
          const zoomSpeed = 5; // Adjust this for sensitivity

          if (delta < 0) {
            // Zoom in
            setZoom((prev) => Math.min(prev + zoomSpeed, 300));
          } else {
            // Zoom out
            setZoom((prev) => Math.max(prev - zoomSpeed, 25));
          }
        }
        return; // Don't handle page navigation when zooming
      }

      // Handle regular scroll for page navigation (only for PDFs with multiple pages)
      if (isPDF && totalPages > 1 && pdfDoc) {
        // Native scrolling is handled by the browser for continuous scroll
        // We only need to update the current page based on visibility (handled by IntersectionObserver)
        return;
      }
    };

    // Add wheel event listener at document level to prevent browser zoom globally
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isPDF, totalPages, pdfDoc, currentPage]);


  // Show upload zone if no files
  if (fileList.length === 0) {
    return <FileUploadZone />;
  }


  // If a tool is selected, show the tool component (if file type matches)
  if (selectedTool && !hasFileTypeMismatch) {
    console.log('[MainWorkspace] Selected tool:', selectedTool);

    // Image Crop Tool
    if (selectedTool === 'crop') {
      console.log('[MainWorkspace] Rendering InteractiveCropTool');
      return <InteractiveCropTool />;
    }

    // PDF Crop Tool
    if (selectedTool === 'editor-crop' || selectedTool === 'pdf-crop') {
      console.log('[MainWorkspace] Rendering PDFCropTool for tool:', selectedTool);
      return <PDFCropTool />;
    }

    // OCR Scan Tool
    if (selectedTool === 'ocr-scan') {
      console.log('[MainWorkspace] Rendering OCRScan for tool:', selectedTool);
      return <OCRScan />;
    }

    // PDF Tools - inputs are now in sidebar, main workspace shows PDF preview
    // (No special handling needed here, PDF preview will show below)

    // Image to PDF - options shown in sidebar, main workspace shows file preview
    // (No special handling needed here, ImageToPDF options will be in FileDetailsSidebar)

    // E-Signature
    if (selectedTool === 'editor-esign') {
      return <ESignatureWorkspace />;
    }
  }

  // If no active file, show placeholder
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>Select a file to begin editing</p>
        </div>
      </div>
    );
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setCurrentPdfPage(newPage);
      pageRefs.current[newPage - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setCurrentPdfPage(newPage);
      pageRefs.current[newPage - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 25));
  };

  const handleFitToWidth = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth - 32; // Account for padding
    let contentWidth = 0;

    if (isPDF && canvasRef.current) {
      // Get canvas width
      contentWidth = canvasRef.current.width / 1.5; // PDF is rendered at scale 1.5
    } else if (file?.previewUrl) {
      const img = new Image();
      img.src = file.previewUrl;
      contentWidth = img.width;
    }

    if (contentWidth > 0) {
      const newZoom = (containerWidth / contentWidth) * 100;
      setZoom(Math.min(Math.max(newZoom, 25), 300));
    }
  };

  const handleUndo = () => {
    if (file) {
      undoOperation(file.id);
    }
  };

  const handleRedo = () => {
    if (file) {
      redoOperation(file.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative" style={{ backgroundColor: 'var(--color-background)', overflow: 'hidden' }}>
      {/* Red Alert Popup for File Type Mismatch - Small rounded popup at center top */}
      {hasFileTypeMismatch && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.95)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            width: 'fit-content',
            maxWidth: '90%',
            borderRadius: '9999px', // Fully rounded
          }}
        >
          <p className="text-sm font-medium text-white whitespace-nowrap">
            {requiresImage 
              ? 'Please select an image file to use this tool' 
              : requiresPDF 
                ? 'Please select a PDF file to use this tool'
                : 'Please select the correct file type for this tool'}
          </p>
          {onClearTool && (
            <button
              onClick={onClearTool}
              className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-1"
              title="Close alert"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Exit Tool Button (X) - Top Right Corner */}
      {selectedTool && onClearTool && !hasFileTypeMismatch && (
        <button
          onClick={onClearTool}
          className="absolute top-2 right-2 z-50 p-2 rounded-full shadow-lg transition-all hover:scale-110"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          }}
          title="Exit tool (ESC)"
        >
          <X size={20} />
        </button>
      )}

      {/* Main PDF/Image View - Full Area */}
      <div
        ref={containerRef}
        className="flex-1 p-4 relative"
        style={{ 
          backgroundColor: 'var(--color-background)',
          overflowY: 'auto', // Ensure vertical scroll works
          overflowX: 'auto', // Ensure horizontal scroll works
          minHeight: 0, // Important for flex children to allow scrolling
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%', // Ensure content takes at least full height for centering
            width: '100%',
          }}
        >
          {isPDF ? (
            isLoadingPDF ? (
              <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <p>Loading PDF...</p>
              </div>
            ) : pdfDoc ? (
              // Continuous Vertical Scroll View
              <div className="flex flex-col items-center py-8 gap-8 w-full">
                {Array.from({ length: totalPages }, (_, i) => (
                  <div
                    key={i}
                    ref={el => { pageRefs.current[i] = el; }}
                    data-page-number={i + 1}
                    className="relative bg-white shadow-2xl transition-transform duration-200 ease-out"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      // Initial min-height to allow scrollbar to form before loading
                      minHeight: '400px', 
                      minWidth: '300px'
                    }}
                  >
                    <canvas className="max-w-full h-auto block" />
                    
                    {/* Page number indicator overlay */}
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                      Page {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <p>Unable to load PDF</p>
              </div>
            )
          ) : file.previewUrl ? (
            <div
              className="flex items-center justify-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
              }}
            >
              <img
                src={file.previewUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          ) : (
            <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <p>Loading preview...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      {(isPDF || file?.previewUrl) && (
        <BottomBar
          currentPage={isPDF ? currentPage : 1}
          totalPages={isPDF ? totalPages : 1}
          zoom={zoom}
          onPreviousPage={isPDF ? handlePreviousPage : undefined}
          onNextPage={isPDF ? handleNextPage : undefined}
          onPageChange={isPDF ? (page: number) => {
            setCurrentPage(page);
            setCurrentPdfPage(page);
            pageRefs.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } : undefined}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomChange={(newZoom: number) => setZoom(newZoom)}
          onFitToWidth={handleFitToWidth}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          showPageControls={isPDF && totalPages > 1}
        />
      )}
    </div>
  );
}

