'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { usePDFCropStore, ASPECT_RATIO_PRESETS, type CropArea, type AspectRatioPreset } from '@/lib/stores/pdf-crop-store';
import { cropPDF } from '@/lib/client-processors/pdf-processor';
import { Check, X, Eye, Download } from 'lucide-react';

export function PDFCropToolSidebar() {
  const { getActiveFile, updateFileData, setError } = useEditorStore();
  const {
    currentPage,
    totalPages,
    getCurrentCropArea,
    setPageCropArea,
    selectedRatio,
    setSelectedRatio,
    isProcessing,
    setIsProcessing,
    applyToAllPages,
    setApplyToAllPages,
    // pageCropAreas,
  } = usePDFCropStore();

  const file = getActiveFile();
  const [customRatio, setCustomRatio] = useState<string>('');
  const cropArea = getCurrentCropArea();

  const handleApplyCrop = async () => {
    if (!file?.originalFile) {
      setError('Original file not found');
      return;
    }

    setIsProcessing(true);

    try {
      let pageNumbers: number[] | undefined;

      if (applyToAllPages) {
        // Apply current page's crop area to all pages
        pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
      } else {
        // Apply only to current page
        pageNumbers = [currentPage];
      }

      // Scale down coordinates by 2 (because PDF is rendered at scale: 2)
      const scale = 2;
      const croppedBlob = await cropPDF(file.originalFile, {
        x: Math.round(cropArea.x / scale),
        y: Math.round(cropArea.y / scale),
        width: Math.round(cropArea.width / scale),
        height: Math.round(cropArea.height / scale),
        pageNumbers,
      });

      // Update file data
      updateFileData(file.id, croppedBlob);

      setError(null);
    } catch (error) {
      console.error('Error cropping PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to crop PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    // Reset crop area for current page to default (80% of page)
    setPageCropArea(currentPage, {
      x: 50,
      y: 50,
      width: 500,
      height: 700,
    });
  };

  const handleRatioChange = (preset: AspectRatioPreset) => {
    setSelectedRatio(preset);

    // Adjust crop area to match ratio
    if (preset.ratio !== null) {
      const currentRatio = cropArea.width / cropArea.height;
      let newCrop = { ...cropArea };

      if (currentRatio > preset.ratio) {
        // Too wide, reduce width
        newCrop.width = cropArea.height * preset.ratio;
        newCrop.x = cropArea.x + (cropArea.width - newCrop.width) / 2;
      } else {
        // Too tall, reduce height
        newCrop.height = cropArea.width / preset.ratio;
        newCrop.y = cropArea.y + (cropArea.height - newCrop.height) / 2;
      }

      setPageCropArea(currentPage, newCrop);
    }
  };

  const handleCustomRatioApply = () => {
    const parts = customRatio.split(':');
    if (parts.length === 2) {
      const w = parseFloat(parts[0] || '1');
      const h = parseFloat(parts[1] || '1');
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        const ratio = w / h;
        handleRatioChange({ label: customRatio, ratio, value: customRatio });
      }
    }
  };

  const handleManualChange = (field: keyof CropArea, value: string) => {
    const numValue = parseInt(value) || 0;
    setPageCropArea(currentPage, {
      ...cropArea,
      [field]: numValue,
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* PDF Crop Settings Card */}
      <div className="p-2 rounded-lg border" style={{
        backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
        borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
      }}>
        <h3 className="text-[10px] font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          PDF Crop Settings
        </h3>

        {/* Page Info */}
        <div className="mb-2 p-1.5 rounded text-[10px] text-center" style={{
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
          color: 'hsl(var(--foreground))',
        }}>
          Page {currentPage} of {totalPages}
        </div>

        {/* Apply to All Pages Toggle */}
        <div className="mb-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAllPages}
              onChange={(e) => setApplyToAllPages(e.target.checked)}
              className="w-3 h-3"
              style={{ accentColor: 'hsl(var(--primary))' }}
            />
            <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              Apply to all pages
            </span>
          </label>
          {applyToAllPages && (
            <p className="text-[9px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Current crop will be applied to all pages
            </p>
          )}
        </div>

        {/* Aspect Ratio Presets */}
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ASPECT_RATIO_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleRatioChange(preset)}
                className="px-1.5 py-1 rounded text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: selectedRatio.value === preset.value ? 'hsl(var(--primary))' : 'transparent',
                  color: selectedRatio.value === preset.value ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                  border: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Ratio */}
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Custom Ratio
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customRatio}
              onChange={(e) => setCustomRatio(e.target.value)}
              placeholder="21:9"
              className="flex-1 px-2 py-1 rounded text-[10px] border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                color: 'hsl(var(--foreground))',
              }}
            />
            <button
              onClick={handleCustomRatioApply}
              className="px-2 py-1 rounded text-[10px] font-medium"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Manual Dimensions */}
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Position & Size
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px]" style={{ color: 'hsl(var(--muted-foreground))' }}>X</label>
              <input
                type="number"
                value={Math.round(cropArea.x)}
                onChange={(e) => handleManualChange('x', e.target.value)}
                className="px-1.5 py-1 rounded text-[10px] border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Y</label>
              <input
                type="number"
                value={Math.round(cropArea.y)}
                onChange={(e) => handleManualChange('y', e.target.value)}
                className="px-1.5 py-1 rounded text-[10px] border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Width</label>
              <input
                type="number"
                value={Math.round(cropArea.width)}
                onChange={(e) => handleManualChange('width', e.target.value)}
                className="px-1.5 py-1 rounded text-[10px] border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Height</label>
              <input
                type="number"
                value={Math.round(cropArea.height)}
                onChange={(e) => handleManualChange('height', e.target.value)}
                className="px-1.5 py-1 rounded text-[10px] border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Dimensions Display */}
        <div className="text-[10px] text-center p-1.5 rounded mb-2" style={{
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
          color: 'hsl(var(--muted-foreground))',
          border: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)'
        }}>
          {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="w-full px-2 py-1.5 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <Check size={12} />
            {isProcessing ? 'Processing...' : applyToAllPages ? 'Apply to All Pages' : 'Apply to Current Page'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full px-2 py-1.5 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 border"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.5)',
              color: 'hsl(var(--foreground))',
            }}
          >
            <X size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* File Details Card */}
      {file && (
        <div className="p-2 rounded-lg border border-t flex-shrink-0" style={{
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
          borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
        }}>
          <h3 className="text-[10px] font-semibold mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>File Details</h3>
      
          {/* Content */}
          <div className="flex flex-col gap-1.5">
            {/* Action Buttons */}
            <div className="flex gap-1.5 mb-1.5">
              <button
                onClick={() => file.previewUrl && window.open(file.previewUrl, '_blank')}
                className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 border rounded transition-colors text-[10px] font-medium"
                style={{ 
                  backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
                  borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.4)',
                  color: 'hsl(var(--foreground))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)';
                }}
                title="Preview file"
              >
                <Eye className="w-2.5 h-2.5" />
                Preview
              </button>
              <button
                onClick={() => {
                  if (file.originalFile) {
                    const url = URL.createObjectURL(file.originalFile);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded transition-colors text-[10px] font-medium"
                style={{ 
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                title="Download file"
              >
                <Download className="w-2.5 h-2.5" />
                Download
              </button>
            </div>

            {/* File Information */}
            <div className="space-y-1">
              {/* File Name */}
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Name
                </p>
                <p className="text-[10px] mt-0.5 break-words line-clamp-2" style={{ color: 'hsl(var(--foreground))' }}>{file.name}</p>
              </div>

              {/* File Type & Size in one row */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Type
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>{file.format}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Size
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>{formatFileSize(file.size)}</p>
                </div>
              </div>

              {/* Page Count (for PDFs) */}
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Pages
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>{totalPages}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
