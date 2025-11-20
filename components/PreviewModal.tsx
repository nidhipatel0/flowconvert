'use client';

import { useCallback } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  previewUrl: string | null;
  fileType: 'image' | 'pdf';
  originalSize?: number;
  newSize?: number;
  originalFileName?: string;
  newFileName?: string;
}

export function PreviewModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  previewUrl,
  fileType,
  originalSize,
  newSize,
  originalFileName,
  newFileName,
}: PreviewModalProps) {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen || !previewUrl) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-[95vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-secondary-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-secondary-900">{title}</h2>
          <div className="flex items-center gap-3">
            {/* Compact file info in header */}
            {fileType === 'pdf' && (originalSize || newSize) && (
              <div className="flex items-center gap-2 text-xs text-secondary-600">
                {originalSize && newSize && originalSize !== newSize && (
                  <span className={`font-semibold ${newSize < originalSize ? 'text-green-600' : 'text-orange-600'}`}>
                    {newSize < originalSize ? '↓' : '↑'} {Math.abs(((newSize - originalSize) / originalSize) * 100).toFixed(1)}%
                  </span>
                )}
                {newSize && <span>{formatSize(newSize)}</span>}
              </div>
            )}
            <button
              onClick={onClose}
              className="text-secondary-500 hover:text-secondary-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Preview Content - Maximized */}
        <div className="flex-1 overflow-auto p-2">
          {fileType === 'image' && (
            <div className="flex items-center justify-center h-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain bg-white rounded"
              />
            </div>
          )}
          {fileType === 'pdf' && (
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[80vh] bg-white rounded"
              title="PDF Preview"
            />
          )}
        </div>

        {/* Footer Actions - Compact */}
        <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-secondary-200 bg-secondary-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn-primary px-4 py-1.5 text-sm"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
