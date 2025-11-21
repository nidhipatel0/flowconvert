'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { loadPDF, renderPDFPage, getPDFPageCount } from '@/lib/utils/pdf-renderer';
import { setCurrentPdfPage, getCurrentPdfPage } from './FileDetailsSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFThumbnailSidebarProps {
  fileId: string | null;
}

export function PDFThumbnailSidebar({ fileId }: PDFThumbnailSidebarProps) {
  const { files } = useEditorStore();
  const file = fileId ? files.get(fileId) : null;
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Load PDF when file changes
  useEffect(() => {
    if (!file || file.format !== 'PDF') {
      setPdfDoc(null);
      setTotalPages(0);
      setThumbnails([]);
      return;
    }

    if (!file.originalFile) {
      console.warn('PDF file missing originalFile');
      return;
    }

    loadPDF(file.originalFile)
      .then((pdf) => {
        setPdfDoc(pdf);
        const pageCount = getPDFPageCount(pdf);
        setTotalPages(pageCount);
        setThumbnails([]);
      })
      .catch((error) => {
        console.error('Error loading PDF:', error);
      });
  }, [file]);

  // Generate thumbnails when PDF loads
  useEffect(() => {
    if (pdfDoc && thumbnails.length === 0 && totalPages > 0) {
      const generateThumbnails = async () => {
        const thumbs: string[] = [];
        for (let i = 1; i <= totalPages; i++) {
          try {
            const canvas = document.createElement('canvas');
            // Render at higher resolution (2.5x display size) for crisp thumbnails
            // Display size is ~120x160, so render at 300x400 for better quality
            await renderPDFPage(pdfDoc, i, canvas, { width: 300, height: 400 });
            thumbs.push(canvas.toDataURL('image/png', 1.0)); // Maximum quality
          } catch (error) {
            console.error(`Error generating thumbnail for page ${i}:`, error);
            thumbs.push('');
          }
        }
        setThumbnails(thumbs);
      };
      generateThumbnails();
    }
  }, [pdfDoc, totalPages, thumbnails.length]);

  // Sync current page with global page state
  useEffect(() => {
    const checkPageChange = () => {
      const sharedPage = getCurrentPdfPage();
      if (sharedPage !== currentPage) {
        setCurrentPage(sharedPage);
      }
    };
    const interval = setInterval(checkPageChange, 100);
    return () => clearInterval(interval);
  }, [currentPage]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (sidebarRef.current && thumbnailRefs.current[currentPage - 1]) {
      const thumbnailElement = thumbnailRefs.current[currentPage - 1];
      if (thumbnailElement) {
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const thumbnailRect = thumbnailElement.getBoundingClientRect();

        // Check if thumbnail is out of view
        const isOutOfView = 
          thumbnailRect.top < sidebarRect.top || 
          thumbnailRect.bottom > sidebarRect.bottom;

        if (isOutOfView) {
          thumbnailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentPage]);

  // Only show if PDF has multiple pages
  if (!file || file.format !== 'PDF' || totalPages <= 1) {
    return null;
  }

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setCurrentPdfPage(pageNumber);
  };

  return (
    <div 
      className={`border-r flex flex-col overflow-hidden transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-48'
      }`}
      style={{ 
        backgroundColor: 'var(--color-surface)',
        borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
      }}
    >
      {/* Header with Collapse Button */}
      <div 
        className={`border-b flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3`}
        style={{ 
          borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)'
        }}
      >
        {!isCollapsed && (
          <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Pages ({totalPages})
          </h3>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded transition-colors"
          style={{ 
            color: 'hsl(var(--foreground))',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>

      {/* PDF Page Thumbnails List */}
      {!isCollapsed && (
        <div 
          ref={sidebarRef}
          className="flex-1 overflow-y-auto p-2 space-y-2"
        >
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === currentPage;
            const thumbnail = thumbnails[index];

            return (
              <button
                key={pageNumber}
                ref={(el) => {
                  thumbnailRefs.current[index] = el;
                }}
                onClick={() => handlePageClick(pageNumber)}
                className={`w-full p-2 rounded-lg border transition-all text-left ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
                style={{
                  backgroundColor: isActive
                    ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.35)'
                    : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
                  borderColor: isActive
                    ? 'hsl(var(--primary))'
                    : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                  boxShadow: isActive
                    ? '0 0 0 2px rgba(var(--color-primary-rgb, 20, 184, 166), 0.5)'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)';
                  }
                }}
              >
                <div className="relative w-full aspect-[3/4] rounded border overflow-hidden mb-1" style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' }}>
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`Page ${pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Loading...
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium text-center" style={{ color: 'hsl(var(--foreground))' }}>
                  Page {pageNumber}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

