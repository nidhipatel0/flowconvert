'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, RotateCcw } from 'lucide-react';

interface BottomBarProps {
  currentPage?: number;
  totalPages?: number;
  zoom?: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onPageChange?: (page: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomChange?: (zoom: number) => void;
  onFitToWidth?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  showPageControls?: boolean;
}

export function BottomBar({
  currentPage = 1,
  totalPages = 1,
  zoom = 100,
  onPreviousPage,
  onNextPage,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onFitToWidth,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  showPageControls = true,
}: BottomBarProps) {
  const [zoomInputValue, setZoomInputValue] = useState(Math.round(zoom).toString());
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const zoomInputRef = useRef<HTMLInputElement>(null);
  const [pageInputValue, setPageInputValue] = useState(currentPage.toString());
  const [isEditingPage, setIsEditingPage] = useState(false);
  const pageInputRef = useRef<HTMLInputElement>(null);

  // Sync zoom input when zoom prop changes (but not when user is editing)
  useEffect(() => {
    if (!isEditingZoom) {
      setZoomInputValue(Math.round(zoom).toString());
    }
  }, [zoom, isEditingZoom]);

  // Sync page input when currentPage prop changes (but not when user is editing)
  useEffect(() => {
    if (!isEditingPage) {
      setPageInputValue(currentPage.toString());
    }
  }, [currentPage, isEditingPage]);

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    setZoomInputValue(value);
  };

  const handleZoomInputBlur = () => {
    setIsEditingZoom(false);
    const numValue = parseInt(zoomInputValue, 10);
    if (!isNaN(numValue) && onZoomChange) {
      const clampedValue = Math.min(Math.max(numValue, 25), 300); // Clamp between 25% and 300%
      onZoomChange(clampedValue);
      setZoomInputValue(clampedValue.toString());
    } else {
      // Reset to current zoom if invalid
      setZoomInputValue(Math.round(zoom).toString());
    }
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setZoomInputValue(Math.round(zoom).toString());
      setIsEditingZoom(false);
      e.currentTarget.blur();
    }
  };

  const handleZoomInputFocus = () => {
    setIsEditingZoom(true);
    zoomInputRef.current?.select();
  };

  const handleResetZoom = () => {
    if (onZoomChange) {
      onZoomChange(100);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    setPageInputValue(value);
  };

  const handlePageInputBlur = () => {
    setIsEditingPage(false);
    const numValue = parseInt(pageInputValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= totalPages) {
      const clampedValue = Math.min(Math.max(numValue, 1), totalPages);
      if (clampedValue !== currentPage && onPageChange) {
        onPageChange(clampedValue);
      }
      setPageInputValue(clampedValue.toString());
    } else {
      // Reset to current page if invalid
      setPageInputValue(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setPageInputValue(currentPage.toString());
      setIsEditingPage(false);
      e.currentTarget.blur();
    }
  };

  const handlePageInputFocus = () => {
    setIsEditingPage(true);
    pageInputRef.current?.select();
  };
  return (
    <div
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 rounded-lg flex items-center justify-between px-4 py-2 shadow-lg"
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.95)', // Dark blue background
        backdropFilter: 'blur(8px)',
        minWidth: '400px',
        height: '48px',
      }}
    >
      {/* Left: Page Navigation */}
      {showPageControls && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPreviousPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8"
            style={{
              color: '#ffffff',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (currentPage > 1) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} className="flex-shrink-0" />
          </button>

          {isEditingPage ? (
            <input
              ref={pageInputRef}
              type="text"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              onFocus={handlePageInputFocus}
              className="text-sm font-medium px-2 py-1 rounded border-none outline-none text-center"
              style={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                width: '50px',
              }}
              autoFocus
            />
          ) : (
            <div
              onClick={handlePageInputFocus}
              className="text-sm font-medium px-3 py-1 rounded cursor-pointer"
              style={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                minWidth: '60px',
                textAlign: 'center',
              }}
              title="Click to jump to page"
            >
              {currentPage} / {totalPages}
            </div>
          )}

          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8"
            style={{
              color: '#ffffff',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (currentPage < totalPages) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight size={18} className="flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Center: Spacer */}
      <div className="flex-1" />

      {/* Right: Zoom Controls & Undo/Redo */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        {onUndo && onRedo && (
          <>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8"
              style={{
                color: '#ffffff',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (canUndo) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 size={18} className="flex-shrink-0" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8"
              style={{
                color: '#ffffff',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (canRedo) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 size={18} className="flex-shrink-0" />
            </button>
            <div
              className="w-px h-6"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </>
        )}

        {/* Zoom Controls */}
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-full transition-colors flex items-center justify-center w-8 h-8"
          style={{
            color: '#ffffff',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} className="flex-shrink-0" />
        </button>

        <input
          ref={zoomInputRef}
          type="text"
          value={zoomInputValue}
          onChange={handleZoomInputChange}
          onBlur={handleZoomInputBlur}
          onFocus={handleZoomInputFocus}
          onKeyDown={handleZoomInputKeyDown}
          className="text-sm font-medium px-2 py-1 rounded min-w-[50px] text-center border-none outline-none"
          style={{
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            width: '60px',
          }}
          title="Click to edit zoom percentage (25-300%)"
          aria-label="Zoom percentage"
        />

        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-full transition-colors flex items-center justify-center w-8 h-8"
          style={{
            color: '#ffffff',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} className="flex-shrink-0" />
        </button>

        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded transition-colors flex items-center justify-center w-8 h-8"
          style={{
            color: '#ffffff',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Reset zoom to 100%"
          aria-label="Reset zoom"
        >
          <RotateCcw size={18} className="flex-shrink-0" />
        </button>

        <div
          className="w-px h-6"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
        />

        <button
          onClick={onFitToWidth}
          className="p-1.5 rounded transition-colors flex items-center justify-center w-8 h-8"
          style={{
            color: '#ffffff',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Fit to width"
          aria-label="Fit to width"
        >
          <Maximize2 size={18} className="flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
