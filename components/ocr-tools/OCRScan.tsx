'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { FileUploadZone } from '../FileUploadZone';
import { Download, Copy, GripVertical } from 'lucide-react';
import { loadPDF, renderPDFPage, getPDFPageCount } from '@/lib/utils/pdf-renderer';
import { setCurrentPdfPage, getCurrentPdfPage } from '../FileDetailsSidebar';

// Shared state for OCR page synchronization between workspace and sidebar
let currentOCRPage = 1;
let setCurrentOCRPageCallback: ((page: number) => void) | null = null;

export function setCurrentOCRPage(page: number) {
  currentOCRPage = page;
  if (typeof window !== 'undefined') {
    (window as any).__currentOCRPage = page;
  }
  if (setCurrentOCRPageCallback) {
    setCurrentOCRPageCallback(page);
  }
}

export function getCurrentOCRPage() {
  return currentOCRPage;
}

export function OCRScan() {
  const { getActiveFile, files, ocrResult, ocrConfidence, ocrProcessingTime, setOCRResult } = useEditorStore();
  const file = getActiveFile();

  // Resizable divider state
  const [dividerPosition, setDividerPosition] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // PDF rendering state
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const renderedPages = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Track if scroll is initiated by user
  const isUserScroll = useRef(false);

  // Reset OCR page to first page whenever this workspace mounts
  useEffect(() => {
    setCurrentPage(1);
    setCurrentOCRPage(1);
    setCurrentPdfPage(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Register callback for OCR page synchronization
  useEffect(() => {
    setCurrentOCRPageCallback = (page: number) => {
      console.log('[OCRScan] Page changed from sidebar:', page);
      setCurrentPage(page);
    };
    return () => {
      setCurrentOCRPageCallback = null;
    };
  }, []);

  // Sync currentPage to shared state when it changes (from navigation buttons or scroll)
  useEffect(() => {
    if (currentPage !== currentOCRPage) {
      console.log('[OCRScan] Page changed from workspace:', currentPage);
      setCurrentOCRPage(currentPage);
      // Also update global PDF page so thumbnails sync
      setCurrentPdfPage(currentPage);
    }
  }, [currentPage]);

  // Listen to shared state changes from sidebar (OCR sidebar)
  useEffect(() => {
    const checkPageChange = () => {
      const sharedPage = getCurrentOCRPage();
      if (sharedPage !== currentPage && sharedPage >= 1 && sharedPage <= totalPages) {
        console.log('[OCRScan] Syncing page from shared state:', sharedPage);
        setCurrentPage(sharedPage);
      }
    };
    const interval = setInterval(checkPageChange, 100);
    return () => clearInterval(interval);
  }, [currentPage, totalPages]);

  // Also listen to shared state changes from PDF sidebar (thumbnails)
  useEffect(() => {
    const checkPdfPageChange = () => {
      const sharedPdfPage = getCurrentPdfPage();
      if (sharedPdfPage !== currentPage && sharedPdfPage >= 1 && sharedPdfPage <= totalPages) {
         // Check if this change came from us (we updated it) or from outside
         // We can just check if it matches currentOCRPage.
         // If thumbnails updated it, currentPdfPage != currentPage.
         console.log('[OCRScan] Syncing page from PDF shared state:', sharedPdfPage);
         setCurrentPage(sharedPdfPage);
         setCurrentOCRPage(sharedPdfPage);
      }
    };
    const interval = setInterval(checkPdfPageChange, 100);
    return () => clearInterval(interval);
  }, [currentPage, totalPages]);

  // Convert Map to Array
  const fileList = Array.from(files.values());

  // Check if file is supported
  const isImage = file?.format && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF'].includes(file.format);
  const isPDF = file?.format === 'PDF';
  const isSupported = isImage || isPDF;

  // Load PDF when file changes
  useEffect(() => {
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
    setCurrentOCRPage(1); // Reset shared state
    setCurrentPdfPage(1);
    renderedPages.current.clear();
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    if (file && isPDF && file.originalFile) {
      console.log('[OCRScan] Loading PDF:', file.name);
      setIsLoadingPDF(true);
      
      loadPDF(file.originalFile)
        .then((pdf) => {
          console.log('[OCRScan] PDF loaded successfully');
          const pageCount = getPDFPageCount(pdf);
          setPdfDoc(pdf);
          setTotalPages(pageCount);
          setCurrentPage(1);
          setCurrentOCRPage(1); // Reset shared state
          setCurrentPdfPage(1);
          setIsLoadingPDF(false);
        })
        .catch((error) => {
          console.error('[OCRScan] Error loading PDF:', error);
          setIsLoadingPDF(false);
        });
    }
  }, [file, isPDF]);

  // Lazy Render PDF pages using IntersectionObserver
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (isPDF && pdfDoc && totalPages > 0) {
      // Initialize page refs array
      pageRefs.current = Array(totalPages).fill(null).map((_, i) => pageRefs.current[i] || null);
      
      const timeoutId = window.setTimeout(() => {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');

                // Render page if not already rendered
                if (!renderedPages.current.has(pageNum)) {
                  const wrapper = pageRefs.current[pageNum - 1];
                  const canvas = wrapper?.querySelector('canvas');
                  if (canvas) {
                    renderedPages.current.add(pageNum);
                    renderPDFPage(pdfDoc, pageNum, canvas, { scale: 1.5 })
                      .catch(err => {
                        console.error(`[OCRScan] Error rendering page ${pageNum}`, err);
                        renderedPages.current.delete(pageNum);
                      });
                  }
                }

                // Update current page if this page is sufficiently visible
                if (entry.intersectionRatio > 0.5) {
                  if (pageNum !== currentPage) {
                    console.log('[OCRScan] Page in view (user scroll):', pageNum);
                    isUserScroll.current = true; // Mark as user scroll
                    setCurrentPage(pageNum);
                    // setCurrentOCRPage and setCurrentPdfPage will be handled by useEffect
                  }
                }
              }
            });
          },
          {
            root: scrollContainerRef.current,
            threshold: [0.1, 0.5, 0.9],
            rootMargin: '200px 0px 200px 0px', // Pre-load pages
          }
        );

        // Observe all page containers
        pageRefs.current.forEach((pageContainer) => {
          if (pageContainer) {
            observerRef.current?.observe(pageContainer);
          }
        });

        // Initial render of first page if needed
        if (renderedPages.current.size === 0 && pageRefs.current[0]) {
          const canvas = pageRefs.current[0].querySelector('canvas');
          if (canvas) {
            renderedPages.current.add(1);
            renderPDFPage(pdfDoc, 1, canvas, { scale: 1.5 })
              .catch(err => {
                console.error(`[OCRScan] Error rendering page 1`, err);
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
  }, [pdfDoc, totalPages, isPDF]);

  // Scroll to page when currentPage changes from sidebar/navigation (programmatic)
  useEffect(() => {
    // If the change came from user scrolling (IntersectionObserver), DO NOT scroll back.
    if (isUserScroll.current) {
      isUserScroll.current = false;
      return;
    }

    if (scrollContainerRef.current && pageRefs.current[currentPage - 1]) {
       const pageElement = pageRefs.current[currentPage - 1];
       if (pageElement) {
         // Check if page is already somewhat in view to avoid unnecessary jumps
         const rect = pageElement.getBoundingClientRect();
         const containerRect = scrollContainerRef.current.getBoundingClientRect();
         
         const isInView = (
           rect.top >= containerRect.top - rect.height * 0.8 &&
           rect.bottom <= containerRect.bottom + rect.height * 0.8
         );

         if (!isInView) {
           pageElement.scrollIntoView({ behavior: 'auto', block: 'start' });
         }
       }
    }
  }, [currentPage]);

  // Handle mouse down on divider
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Clamp between 20% and 80%
      const clampedPosition = Math.min(Math.max(newPosition, 20), 80);
      setDividerPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Show upload zone if no files
  if (fileList.length === 0) {
    return <FileUploadZone />;
  }

  // If no active file, show placeholder
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>Select a file and click "Extract Text" to begin OCR</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            OCR is only supported for images (PNG, JPG, JPEG, WebP, GIF, BMP, TIFF) and PDF files
          </p>
        </div>
      </div>
    );
  }

  // Handle copy to clipboard
  const handleCopyText = () => {
    if (!ocrResult) return;

    navigator.clipboard.writeText(ocrResult)
      .then(() => {
        alert('Text copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy text to clipboard');
      });
  };

  // Handle download as TXT
  const handleDownloadText = () => {
    if (!ocrResult) return;

    const blob = new Blob([ocrResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}-extracted-text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = ocrResult ? {
    characters: ocrResult.length,
    words: ocrResult.trim() ? ocrResult.trim().split(/\s+/).length : 0,
    lines: ocrResult.split('\n').length,
  } : null;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-background)', cursor: isDragging ? 'col-resize' : 'default' }}
    >
      {/* Left Side: File Preview */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col items-center p-4"
        style={{ 
          width: `${dividerPosition}%`,
          overflowY: 'auto', // Enable vertical scroll
          overflowX: 'auto', // Enable horizontal scroll
          minHeight: 0, // Critical: allows flex child to shrink and enable scrolling
        }}
      >
        <div className="flex flex-col items-center justify-center max-w-full gap-4 my-auto" style={{ minHeight: 'min-content' }}>
          {isImage && file.previewUrl ? (
            <img
              src={file.previewUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : isPDF ? (
            isLoadingPDF ? (
              <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <p>Loading PDF...</p>
              </div>
            ) : pdfDoc ? (
              <div 
                className="flex flex-col items-center gap-6 w-full"
                style={{ minHeight: '100%' }}
              >
                {/* Current Page Indicator */}
                {totalPages > 1 && (
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg" style={{
                    backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.9)',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <span className="text-xs font-medium text-white">
                      Page {currentPage} / {totalPages}
                    </span>
                  </div>
                )}

                {/* All PDF Pages - Scrollable */}
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <div
                      key={pageNumber}
                      ref={(el) => {
                        pageRefs.current[index] = el;
                      }}
                      data-page-number={pageNumber}
                      className="flex flex-col items-center gap-2 w-full"
                      style={{
                        minHeight: '80vh', // Ensure each page takes significant space
                        scrollMarginTop: '20px', // Offset for sticky header
                      }}
                    >
                      <div className="bg-white rounded-lg shadow-2xl">
                        <canvas
                          className="max-w-full h-auto"
                          style={{ display: 'block' }}
                        />
                      </div>
                      {totalPages > 1 && (
                        <p className="text-xs text-gray-500">Page {pageNumber}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <p>Unable to load PDF</p>
              </div>
            )
          ) : (
            <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <p>Preview not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Resizable Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 hover:w-2 transition-all cursor-col-resize flex items-center justify-center relative group"
        style={{
          backgroundColor: isDragging ? 'hsl(var(--primary))' : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
          minWidth: isDragging ? '8px' : '4px',
        }}
      >
        {/* Grip Icon */}
        <div
          className="absolute inset-y-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <GripVertical size={16} style={{ color: 'hsl(var(--primary-foreground))' }} />
        </div>
      </div>

      {/* Right Side: Extracted Text */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ 
          width: `${100 - dividerPosition}%`,
          minHeight: 0, // Critical: allows flex child to shrink and enable scrolling
        }}
      >
        {ocrResult ? (
          /* Results View */
          <div className="flex-1 flex flex-col p-4 overflow-hidden" style={{ minHeight: 0 }}>
            {/* Header with Stats */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                Extracted Text
              </h2>

              {/* Statistics Grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 rounded" style={{
                  backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                }}>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Characters</p>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{stats?.characters}</p>
                </div>
                <div className="text-center p-2 rounded" style={{
                  backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                }}>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Words</p>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{stats?.words}</p>
                </div>
                <div className="text-center p-2 rounded" style={{
                  backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                }}>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Lines</p>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{stats?.lines}</p>
                </div>
                <div className="text-center p-2 rounded" style={{
                  backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                }}>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Confidence</p>
                  <p className="text-sm font-semibold" style={{ color: ocrConfidence > 70 ? 'rgb(34, 197, 94)' : 'rgb(234, 179, 8)' }}>
                    {ocrConfidence}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
                    borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.4)',
                    color: 'hsl(var(--foreground))',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)';
                  }}
                >
                  <Copy size={16} /> Copy to Clipboard
                </button>
                <button
                  onClick={handleDownloadText}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <Download size={16} /> Download as TXT
                </button>
              </div>

              {/* Processing Time */}
              {ocrProcessingTime > 0 && (
                <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Processed in {(ocrProcessingTime / 1000).toFixed(1)}s
                </p>
              )}
            </div>

            {/* Text Area */}
            <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              <textarea
                value={ocrResult}
                onChange={(e) => setOCRResult(e.target.value, ocrConfidence, ocrProcessingTime)}
                className="w-full h-full px-4 py-3 rounded border font-mono text-sm resize-none"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                  color: 'hsl(var(--foreground))',
                  overflowY: 'auto', // Enable scrolling in textarea
                }}
                placeholder="Extracted text will appear here..."
              />
            </div>
          </div>
        ) : (
          /* No Results Yet */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Ready to Extract Text
              </h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Use the sidebar controls to:
              </p>
              <ol className="text-sm text-left space-y-2 mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <li>1. Select a file (images or PDFs)</li>
                <li>2. Choose your language (English, Hindi, or both)</li>
                <li>3. For PDFs, select the page to extract</li>
                <li>4. Click "Extract Text"</li>
              </ol>
              <p className="text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>
                The extracted text will appear here in a large, editable text area
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
