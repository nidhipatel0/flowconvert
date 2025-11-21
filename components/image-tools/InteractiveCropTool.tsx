'use client';

import { useState, useEffect } from 'react';
import { CropOverlay } from './CropOverlay';
// import { cropImage } from '@/lib/client-processors/image-processor';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useCropStore, /* ASPECT_RATIO_PRESETS */ } from '@/lib/stores/crop-store';

interface InteractiveCropToolProps {
  onExit?: () => void;
}

export function InteractiveCropTool({ onExit }: InteractiveCropToolProps = {}) {
  const { getActiveFile, /* updateFileData, setError */ } = useEditorStore();
  const {
    cropArea,
    selectedRatio,
    // isProcessing,
    setCropArea,
    // setSelectedRatio,
    // setIsProcessing,
  } = useCropStore();

  const file = getActiveFile();
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Initialize crop area to full image size
  useEffect(() => {
    if (file?.previewUrl) {
      const img = new Image();
      img.onload = () => {
        // Set crop to full image size
        setCropArea({
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
        });
      };
      img.src = file.previewUrl;
    }
  }, [file?.previewUrl, setCropArea]);

  // Handle ESC key to exit tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[InteractiveCropTool] ESC pressed, exiting tool');
        if (onExit) {
          onExit();
        } else {
          // Dispatch event to exit tool
          window.dispatchEvent(new CustomEvent('exit-crop-tool'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // Update container size based on window
  useEffect(() => {
    const updateSize = () => {
      // Account for sidebars: left (256px) + right (256px) = 512px, plus some padding
      const width = Math.max(window.innerWidth - 600, 800);
      const height = Math.max(window.innerHeight - 150, 600);
      setContainerSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>No file selected</p>
      </div>
    );
  }

  if (!file.previewUrl) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading preview...</p>
      </div>
    );
  }

  const handleCropChange = (newCrop: any) => {
    setCropArea(newCrop);
  };

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      <CropOverlay
        imageUrl={file.previewUrl}
        cropArea={cropArea}
        onCropChange={handleCropChange}
        aspectRatio={selectedRatio.ratio}
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
      />
    </div>
  );
}
