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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-secondary-500 hover:text-secondary-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* File Info */}
            {(originalSize || newSize) && (
              <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {originalFileName && (
                    <div>
                      <span className="text-secondary-600">Original:</span>
                      <p className="font-medium text-secondary-900 truncate">{originalFileName}</p>
                    </div>
                  )}
                  {newFileName && (
                    <div>
                      <span className="text-secondary-600">New:</span>
                      <p className="font-medium text-secondary-900 truncate">{newFileName}</p>
                    </div>
                  )}
                  {originalSize && (
                    <div>
                      <span className="text-secondary-600">Original Size:</span>
                      <p className="font-medium text-secondary-900">{formatSize(originalSize)}</p>
                    </div>
                  )}
                  {newSize && (
                    <div>
                      <span className="text-secondary-600">New Size:</span>
                      <p className="font-medium text-secondary-900">{formatSize(newSize)}</p>
                    </div>
                  )}
                  {originalSize && newSize && originalSize !== newSize && (
                    <div className="col-span-2">
                      <span className="text-secondary-600">Change:</span>
                      <span className={`ml-2 font-semibold ${newSize < originalSize ? 'text-green-600' : 'text-orange-600'}`}>
                        {newSize < originalSize ? '↓' : '↑'} {Math.abs(((newSize - originalSize) / originalSize) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="border border-secondary-200 rounded-lg overflow-hidden bg-secondary-50 p-4">
              <p className="text-xs font-medium text-secondary-700 mb-3">Preview:</p>
              {fileType === 'image' && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto bg-white"
                />
              )}
              {fileType === 'pdf' && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[500px] bg-white rounded"
                  title="PDF Preview"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-secondary-200 bg-secondary-50">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn-primary px-6 py-2"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
