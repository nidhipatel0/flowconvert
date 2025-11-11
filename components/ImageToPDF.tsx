'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores';
import { PreviewModal } from './PreviewModal';

/**
 * Image to PDF Converter Component
 *
 * Converts images to PDF documents (client-side)
 */
export function ImageToPDF() {
  const files = useEditorStore((state) => Array.from(state.files.values()));
  const imageFiles = files.filter(f =>
    f.format && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF'].includes(f.format)
  );

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('fit');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(20);

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
  } | null>(null);

  const handleToggleImage = useCallback((id: string) => {
    setSelectedImages(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedImages(imageFiles.map(f => f.id));
  }, [imageFiles]);

  const handleDeselectAll = useCallback(() => {
    setSelectedImages([]);
  }, []);

  const handleConvertToPDF = useCallback(async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setIsConverting(true);

    try {
      // Dynamically import pdf-lib
      const { PDFDocument } = await import('pdf-lib');

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Page size definitions (in points: 1 inch = 72 points)
      const pageSizes = {
        a4: { width: 595, height: 842 }, // A4: 210mm x 297mm
        letter: { width: 612, height: 792 }, // Letter: 8.5" x 11"
      };

      // Process each selected image
      for (const imageId of selectedImages) {
        const file = useEditorStore.getState().files.get(imageId);
        if (!file) continue;

        // Convert file data to array buffer
        const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: file.type });
        const arrayBuffer = await blob.arrayBuffer();

        // Embed the image
        let image;
        try {
          if (file.format === 'PNG') {
            image = await pdfDoc.embedPng(arrayBuffer);
          } else {
            // Try JPG for all other formats
            image = await pdfDoc.embedJpg(arrayBuffer);
          }
        } catch (error) {
          console.error(`Failed to embed image ${file.name}:`, error);
          continue;
        }

        // Calculate page dimensions
        let pageWidth: number;
        let pageHeight: number;

        if (pageSize === 'fit') {
          // Fit to image size
          pageWidth = image.width;
          pageHeight = image.height;

          // Apply orientation
          if (orientation === 'landscape' && pageHeight > pageWidth) {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
          } else if (orientation === 'portrait' && pageWidth > pageHeight) {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
          }
        } else {
          // Use standard page size
          const size = pageSizes[pageSize];
          if (orientation === 'portrait') {
            pageWidth = size.width;
            pageHeight = size.height;
          } else {
            pageWidth = size.height;
            pageHeight = size.width;
          }
        }

        // Add page
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate image dimensions to fit within page margins
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);

        let imgWidth = image.width;
        let imgHeight = image.height;

        // Scale image to fit within page
        const widthRatio = maxWidth / imgWidth;
        const heightRatio = maxHeight / imgHeight;
        const scale = Math.min(widthRatio, heightRatio, 1); // Don't upscale

        imgWidth *= scale;
        imgHeight *= scale;

        // Center the image on the page
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        // Draw the image
        page.drawImage(image, {
          x,
          y,
          width: imgWidth,
          height: imgHeight,
        });
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

      // Show preview instead of immediate download
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `images_${Date.now()}.pdf`;

      setPreviewData({
        url,
        blob: pdfBlob,
        fileName,
      });
      setShowPreview(true);
    } catch (error) {
      console.error('PDF conversion error:', error);
      alert('Failed to convert images to PDF. Please try again.');
    } finally {
      setIsConverting(false);
    }
  }, [selectedImages, pageSize, orientation, margin]);

  const handleConfirmDownload = useCallback(() => {
    if (!previewData) return;

    const a = document.createElement('a');
    a.href = previewData.url;
    a.download = previewData.fileName;
    a.click();
    URL.revokeObjectURL(previewData.url);

    setPreviewData(null);
  }, [previewData]);

  const moveImageUp = useCallback((id: string) => {
    setSelectedImages(prev => {
      const index = prev.indexOf(id);
      if (index <= 0) return prev;
      const newOrder = [...prev];
      const temp = newOrder[index - 1];
      if (temp !== undefined && newOrder[index] !== undefined) {
        newOrder[index - 1] = newOrder[index] as string;
        newOrder[index] = temp;
      }
      return newOrder;
    });
  }, []);

  const moveImageDown = useCallback((id: string) => {
    setSelectedImages(prev => {
      const index = prev.indexOf(id);
      if (index === -1 || index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      const temp = newOrder[index + 1];
      if (temp !== undefined && newOrder[index] !== undefined) {
        newOrder[index + 1] = newOrder[index] as string;
        newOrder[index] = temp;
      }
      return newOrder;
    });
  }, []);

  if (imageFiles.length === 0) {
    return (
      <div className="workspace-card">
        <div className="text-center py-8">
          <p className="text-sm text-secondary-600">
            Upload images to convert them to PDF
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-secondary-900">
          Images to PDF Converter
        </h2>
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
          Client-Side
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Panel: Image Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary-700">
              Select Images ({selectedImages.length}/{imageFiles.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Select All
              </button>
              <span className="text-secondary-300">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-secondary-600 hover:text-secondary-700 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="border border-secondary-200 rounded-lg max-h-96 overflow-y-auto">
            {imageFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-3 p-3 border-b border-secondary-100 cursor-pointer hover:bg-secondary-50 ${
                  selectedImages.includes(file.id) ? 'bg-cyan-50' : ''
                }`}
                onClick={() => handleToggleImage(file.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedImages.includes(file.id)}
                  onChange={() => handleToggleImage(file.id)}
                  className="w-4 h-4 text-cyan-600 border-secondary-300 rounded focus:ring-cyan-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {file.format} • {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {selectedImages.includes(file.id) && (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImageUp(file.id);
                      }}
                      className="p-1 text-secondary-600 hover:text-cyan-600"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImageDown(file.id);
                      }}
                      className="p-1 text-secondary-600 hover:text-cyan-600"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-secondary-500">
            💡 Click on images to select them. Selected images will be combined into a single PDF in the order shown.
          </p>
        </div>

        {/* Right Panel: PDF Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-secondary-700">PDF Settings</h3>

          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Page Size
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="fit">Fit to Image Size</option>
              <option value="a4">A4 (210mm × 297mm)</option>
              <option value="letter">Letter (8.5" × 11")</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Orientation
            </label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Margin: {margin}px
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-secondary-500 mt-1">
              <span>No Margin</span>
              <span>Large Margin</span>
            </div>
          </div>

          {selectedImages.length > 0 && (
            <div className="border border-secondary-200 rounded-lg p-3 bg-secondary-50">
              <p className="text-xs font-medium text-secondary-700 mb-2">Preview:</p>
              <div className="text-xs text-secondary-600 space-y-1">
                <p>Selected: {selectedImages.length} image(s)</p>
                <p>Pages: {selectedImages.length} page(s)</p>
                <p>Size: {pageSize === 'fit' ? 'Variable (fit to image)' : pageSize.toUpperCase()}</p>
                <p>Orientation: {orientation.charAt(0).toUpperCase() + orientation.slice(1)}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleConvertToPDF}
            disabled={selectedImages.length === 0 || isConverting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? '🔄 Converting...' : '📄 Convert to PDF'}
          </button>

          <div className="border border-green-200 rounded-lg p-3 bg-green-50">
            <p className="text-xs font-medium text-green-900 mb-1">
              ✓ 100% Private
            </p>
            <p className="text-xs text-green-800">
              All processing happens in your browser. Your images never leave your device.
            </p>
          </div>
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
        title="Preview PDF Output"
        previewUrl={previewData?.url || null}
        fileType="pdf"
        newSize={previewData?.blob.size}
        newFileName={previewData?.fileName}
      />
    </div>
  );
}
