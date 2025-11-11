'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores';
import { FileFormat } from '@/lib/types/file';
import { PreviewModal } from './PreviewModal';

interface ImageDimensions {
  width: number;
  height: number;
}

export function ImageTools() {
  const activeFile = useEditorStore((state) => state.getActiveFile());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);

  // Tool states
  const [activeTab, setActiveTab] = useState<'convert' | 'resize' | 'compress' | 'crop' | 'rotate' | 'filters'>('convert');

  // Convert settings
  const [targetFormat, setTargetFormat] = useState<FileFormat>(FileFormat.PNG);
  const [quality, setQuality] = useState(90);

  // Resize settings
  const [width, setWidth] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);

  // Compression settings
  const [compressionLevel, setCompressionLevel] = useState(80);

  // Rotate settings
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
    originalSize: number;
  } | null>(null);

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
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      };
      img.src = url;
    }

    return () => URL.revokeObjectURL(url);
  }, [activeFile]);

  // Handle aspect ratio
  const handleWidthChange = (newWidth: number | string) => {
    setWidth(newWidth);
    if (maintainAspectRatio && originalDimensions && typeof newWidth === 'number' && newWidth > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (newHeight: number | string) => {
    setHeight(newHeight);
    if (maintainAspectRatio && originalDimensions && typeof newHeight === 'number' && newHeight > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  const handleConvert = useCallback(async () => {
    if (!activeFile || !previewUrl) return;

    const numWidth = typeof width === 'number' ? width : parseInt(width as string) || 0;
    const numHeight = typeof height === 'number' ? height : parseInt(height as string) || 0;

    if (numWidth <= 0 || numHeight <= 0) return;

    const img = new Image();
    img.src = previewUrl;
    await new Promise((resolve) => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    canvas.width = numWidth;
    canvas.height = numHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -numWidth / 2, -numHeight / 2, numWidth, numHeight);

    const mimeType = `image/${targetFormat.toLowerCase()}`;
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const fileName = `${activeFile.name.split('.')[0]}.${targetFormat.toLowerCase()}`;

          // Show preview instead of immediate download
          setPreviewData({
            url,
            blob,
            fileName,
            originalSize: activeFile.size,
          });
          setShowPreview(true);
        }
      },
      mimeType,
      quality / 100
    );
  }, [activeFile, previewUrl, width, height, targetFormat, quality, rotation, flipH, flipV]);

  const handleCompress = useCallback(async () => {
    if (!activeFile || !previewUrl) return;

    try {
      // Dynamically import browser-image-compression
      const imageCompression = (await import('browser-image-compression')).default;

      const blob = activeFile.data instanceof Blob
        ? activeFile.data
        : new Blob([activeFile.data], { type: activeFile.type });

      // Compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: originalDimensions?.width || 1920,
        useWebWorker: true,
        quality: compressionLevel / 100,
        initialQuality: compressionLevel / 100,
      };

      // Compress the image
      const compressedBlob = await imageCompression(blob as File, options);

      // Show preview instead of immediate download
      const url = URL.createObjectURL(compressedBlob);
      const fileName = `${activeFile.name.split('.')[0]}_compressed.${activeFile.format?.toLowerCase() || 'jpg'}`;

      setPreviewData({
        url,
        blob: compressedBlob,
        fileName,
        originalSize: blob.size,
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Compression error:', error);
      alert('Failed to compress image');
    }
  }, [activeFile, previewUrl, originalDimensions, compressionLevel]);

  const handleConfirmDownload = useCallback(() => {
    if (!previewData) return;

    const a = document.createElement('a');
    a.href = previewData.url;
    a.download = previewData.fileName;
    a.click();
    URL.revokeObjectURL(previewData.url);

    setPreviewData(null);
  }, [previewData]);

  if (!activeFile) return null;

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-secondary-900">
          Image Tools: {activeFile.name}
        </h2>
        <button
          onClick={() => useEditorStore.getState().setActiveFile(null)}
          className="text-xs text-secondary-500 hover:text-secondary-700"
        >
          Close
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-secondary-200">
        {[
          { id: 'convert', label: 'Convert', icon: '🔄' },
          { id: 'resize', label: 'Resize', icon: '📐' },
          { id: 'compress', label: 'Compress', icon: '📦' },
          { id: 'rotate', label: 'Rotate', icon: '🔃' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-700 border-b-2 border-cyan-600'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview */}
        <div>
          <h3 className="text-sm font-medium text-secondary-700 mb-3">Preview</h3>
          {previewUrl && (
            <div className="border border-secondary-200 rounded-lg overflow-hidden bg-secondary-50 p-3">
              <img
                src={previewUrl}
                alt={activeFile.name}
                className="w-full h-auto max-h-80 object-contain"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
              />
            </div>
          )}
          {originalDimensions && (
            <p className="text-xs text-secondary-500 mt-2">
              Original: {originalDimensions.width} × {originalDimensions.height}px
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {activeTab === 'convert' && (
            <>
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Output Format
                </label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as FileFormat)}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="PNG">PNG</option>
                  <option value="JPG">JPG</option>
                  <option value="WEBP">WebP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
              <button onClick={handleConvert} className="btn-primary w-full">
                Convert & Download
              </button>
            </>
          )}

          {activeTab === 'resize' && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="aspect-ratio"
                  checked={maintainAspectRatio}
                  onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="aspect-ratio" className="text-xs text-secondary-700">
                  Maintain aspect ratio
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleWidthChange(val === '' ? '' : parseInt(val) || 0);
                  }}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleHeightChange(val === '' ? '' : parseInt(val) || 0);
                  }}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <button onClick={handleConvert} className="btn-primary w-full">
                Resize & Download
              </button>
            </>
          )}

          {activeTab === 'compress' && (
            <>
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Compression Level: {compressionLevel}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-xs text-secondary-500 mt-2">
                  Lower = smaller file size, lower quality
                </p>
              </div>
              <button onClick={handleCompress} className="btn-primary w-full">
                Compress & Download
              </button>
            </>
          )}

          {activeTab === 'rotate' && (
            <>
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="btn-secondary flex-1"
                  >
                    ↶ -90°
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="btn-secondary flex-1"
                  >
                    ↷ +90°
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFlipH(!flipH)}
                  className={`btn-secondary flex-1 ${flipH ? 'bg-cyan-50 border-cyan-500' : ''}`}
                >
                  ↔ Flip H
                </button>
                <button
                  onClick={() => setFlipV(!flipV)}
                  className={`btn-secondary flex-1 ${flipV ? 'bg-cyan-50 border-cyan-500' : ''}`}
                >
                  ↕ Flip V
                </button>
              </div>
              <button onClick={handleConvert} className="btn-primary w-full">
                Apply & Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          if (previewData) {
            URL.revokeObjectURL(previewData.url);
            setPreviewData(null);
          }
        }}
        onConfirm={handleConfirmDownload}
        title="Preview Output"
        previewUrl={previewData?.url || null}
        fileType="image"
        originalSize={previewData?.originalSize}
        newSize={previewData?.blob.size}
        originalFileName={activeFile?.name}
        newFileName={previewData?.fileName}
      />
    </div>
  );
}
