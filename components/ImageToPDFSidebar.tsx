'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores';

/**
 * Image to PDF Converter Sidebar Component
 * 
 * Compact sidebar version for converting images to PDF
 */
export function ImageToPDFSidebar() {
  const files = useEditorStore((state) => Array.from(state.files.values()));
  const imageFiles = files.filter(f =>
    f.format && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF'].includes(f.format)
  );

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('fit');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(20);

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
          pageWidth = image.width;
          pageHeight = image.height;
        } else {
          const size = pageSizes[pageSize];
          pageWidth = orientation === 'landscape' ? size.height : size.width;
          pageHeight = orientation === 'landscape' ? size.width : size.height;
        }

        // Add page
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate image dimensions with margin
        const marginPoints = margin * 0.75; // Convert px to points (approximate)
        const maxWidth = pageWidth - (marginPoints * 2);
        const maxHeight = pageHeight - (marginPoints * 2);
        
        let imgWidth = image.width;
        let imgHeight = image.height;
        
        // Scale to fit within margins
        const widthRatio = maxWidth / imgWidth;
        const heightRatio = maxHeight / imgHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        
        imgWidth = imgWidth * ratio;
        imgHeight = imgHeight * ratio;

        // Center the image
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        // Draw image
        page.drawImage(image, {
          x,
          y,
          width: imgWidth,
          height: imgHeight,
        });
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

      // Download directly without preview modal
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Successfully converted ${selectedImages.length} image(s) to PDF`);
    } catch (error) {
      console.error('PDF conversion error:', error);
      alert('Failed to convert images to PDF. Please try again.');
    } finally {
      setIsConverting(false);
    }
  }, [selectedImages, pageSize, orientation, margin]);

  if (imageFiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Upload images to convert them to PDF
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto p-3">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
          Convert to PDF
        </h3>
        <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {selectedImages.length}/{imageFiles.length} selected
        </p>
      </div>

      {/* Image Selection */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            Select Images
          </span>
          <div className="flex gap-1">
            <button
              onClick={handleSelectAll}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ 
                color: 'hsl(var(--primary))',
                backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)'
              }}
            >
              All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ 
                color: 'hsl(var(--muted-foreground))',
                backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)'
              }}
            >
              Clear
            </button>
          </div>
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-1.5" style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' }}>
          {imageFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-[10px] ${
                selectedImages.includes(file.id) ? 'bg-opacity-20' : ''
              }`}
              style={{
                backgroundColor: selectedImages.includes(file.id)
                  ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)'
                  : 'transparent'
              }}
              onClick={() => handleToggleImage(file.id)}
            >
              <input
                type="checkbox"
                checked={selectedImages.includes(file.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggleImage(file.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-3 h-3"
                style={{ accentColor: 'hsl(var(--primary))' }}
              />
              <span className="flex-1 truncate" style={{ color: 'hsl(var(--foreground))' }}>
                {file.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Settings */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
            Page Size
          </label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as any)}
            className="w-full px-2 py-1 text-[10px] border rounded"
            style={{
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))'
            }}
          >
            <option value="fit">Fit to Image</option>
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
            Orientation
          </label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as any)}
            className="w-full px-2 py-1 text-[10px] border rounded"
            style={{
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))'
            }}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
            Margin: {margin}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value))}
            className="w-full h-1"
            style={{ accentColor: 'hsl(var(--primary))' }}
          />
        </div>
      </div>

      {/* Convert Button */}
      <button
        onClick={handleConvertToPDF}
        disabled={selectedImages.length === 0 || isConverting}
        className="w-full px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))'
        }}
      >
        {isConverting ? 'Converting...' : `Convert ${selectedImages.length > 0 ? selectedImages.length : ''} to PDF`}
      </button>

      {/* Privacy Badge */}
      <div className="mt-2 p-2 rounded text-[10px] border" style={{ 
        borderColor: 'rgba(34, 197, 94, 0.3)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)'
      }}>
        <p className="font-medium" style={{ color: 'rgb(34, 197, 94)' }}>✓ 100% Private</p>
        <p className="mt-0.5" style={{ color: 'rgb(22, 163, 74)' }}>Processing happens in your browser</p>
      </div>
    </div>
  );
}

