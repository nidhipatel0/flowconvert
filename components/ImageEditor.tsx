'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores';
import { FileFormat } from '@/lib/types/file';

export function ImageEditor() {
  const activeFile = useEditorStore((state) => state.getActiveFile());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number | string>(0);
  const [height, setHeight] = useState<number | string>(0);
  const [targetFormat, setTargetFormat] = useState<FileFormat>(FileFormat.PNG);
  const [quality, setQuality] = useState(90);

  // Load image preview
  useEffect(() => {
    if (!activeFile) {
      setPreviewUrl(null);
      return;
    }

    const blob = activeFile.data instanceof Blob
      ? activeFile.data
      : new Blob([activeFile.data], { type: activeFile.type });

    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    // Load image dimensions
    if (activeFile.format && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(activeFile.format)) {
      const img = new Image();
      img.onload = () => {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      };
      img.src = url;
    }

    return () => URL.revokeObjectURL(url);
  }, [activeFile]);

  const handleConvert = useCallback(async () => {
    if (!activeFile || !previewUrl) return;

    // Convert width/height to numbers, default to original size if empty
    const numWidth = typeof width === 'number' ? width : parseInt(width) || 0;
    const numHeight = typeof height === 'number' ? height : parseInt(height) || 0;

    if (numWidth <= 0 || numHeight <= 0) {
      return; // Don't convert if dimensions are invalid
    }

    const img = new Image();
    img.src = previewUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = numWidth;
    canvas.height = numHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, numWidth, numHeight);

    // Convert to desired format
    const mimeType = `image/${targetFormat.toLowerCase()}`;
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activeFile.name.split('.')[0]}.${targetFormat.toLowerCase()}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      mimeType,
      quality / 100
    );
  }, [activeFile, previewUrl, width, height, targetFormat, quality]);

  if (!activeFile) {
    return null;
  }

  return (
    <div className="workspace-card">
      <h2 className="text-lg font-bold text-secondary-900 mb-4">
        Edit: {activeFile.name}
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview */}
        <div>
          <h3 className="text-sm font-semibold text-secondary-700 mb-3">Preview</h3>
          {previewUrl && (
            <div className="border border-secondary-200 rounded-lg overflow-hidden bg-secondary-50 p-3">
              <img
                src={previewUrl}
                alt={activeFile.name}
                className="w-full h-auto max-h-80 object-contain"
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-secondary-700 mb-3">
              Image Settings
            </h3>

            {/* Dimensions */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1.5">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWidth(value === '' ? '' : parseInt(value) || '');
                  }}
                  title="Enter the desired width in pixels"
                  placeholder="Width"
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1.5">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHeight(value === '' ? '' : parseInt(value) || '');
                  }}
                  title="Enter the desired height in pixels"
                  placeholder="Height"
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1.5">
                  Convert to Format
                </label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as FileFormat)}
                  title="Choose the output format for your image"
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="PNG">PNG</option>
                  <option value="JPG">JPG</option>
                  <option value="WEBP">WebP</option>
                </select>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-xs font-medium text-secondary-600 mb-1.5">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  title="Adjust the quality of the output image (higher = better quality but larger file size)"
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4">
            <button
              onClick={handleConvert}
              title="Convert and download the image with the selected settings"
              className="btn-primary w-full"
            >
              Convert & Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
