'use client';

import { useEffect, useRef, useState } from 'react';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOverlayProps {
  imageUrl: string;
  cropArea: CropArea;
  onCropChange: (crop: CropArea) => void;
  aspectRatio?: number | null; // null = free, number = locked ratio (e.g., 1 for 1:1, 16/9 for 16:9)
  containerWidth?: number;
  containerHeight?: number;
}

type DragHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move' | null;

export function CropOverlay({
  imageUrl,
  cropArea,
  onCropChange,
  aspectRatio = null,
  containerWidth,
  containerHeight,
}: CropOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropArea>(cropArea);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Update cropStart when cropArea prop changes (for external updates like auto-select)
  useEffect(() => {
    if (!isDragging) {
      setCropStart(cropArea);
    }
  }, [cropArea, isDragging]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
      imgRef.current = img;

      // Calculate scale to fit image in container
      if (containerWidth && containerHeight) {
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up
        setScale(newScale);

        // Center image
        const scaledWidth = img.width * newScale;
        const scaledHeight = img.height * newScale;
        setOffset({
          x: (containerWidth - scaledWidth) / 2,
          y: (containerHeight - scaledHeight) / 2,
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl, containerWidth, containerHeight]);

  // Draw image and crop overlay
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(
      imgRef.current,
      offset.x,
      offset.y,
      imageDimensions.width * scale,
      imageDimensions.height * scale
    );

    // Draw dark overlay (outside crop area)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area (show image)
    const cropX = offset.x + cropArea.x * scale;
    const cropY = offset.y + cropArea.y * scale;
    const cropW = cropArea.width * scale;
    const cropH = cropArea.height * scale;

    ctx.clearRect(cropX, cropY, cropW, cropH);

    // Redraw image in crop area
    ctx.drawImage(
      imgRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      cropX,
      cropY,
      cropW,
      cropH
    );

    // Draw crop rectangle border
    ctx.strokeStyle = '#14B8A6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Draw corner handles
    const handleSize = 10;
    const handles = [
      { x: cropX, y: cropY }, // NW
      { x: cropX + cropW, y: cropY }, // NE
      { x: cropX, y: cropY + cropH }, // SW
      { x: cropX + cropW, y: cropY + cropH }, // SE
    ];

    ctx.fillStyle = '#14B8A6';
    handles.forEach((handle) => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });

    // Draw edge handles (midpoints)
    const edgeHandles = [
      { x: cropX + cropW / 2, y: cropY }, // N
      { x: cropX + cropW / 2, y: cropY + cropH }, // S
      { x: cropX, y: cropY + cropH / 2 }, // W
      { x: cropX + cropW, y: cropY + cropH / 2 }, // E
    ];

    edgeHandles.forEach((handle) => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  }, [imageLoaded, cropArea, imageDimensions, scale, offset]);

  // Get cursor style based on position
  const getCursor = (x: number, y: number): string => {
    const handle = getHandleAt(x, y);
    if (!handle) return 'default';

    const cursorMap: Record<DragHandle & string, string> = {
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize',
      se: 'se-resize',
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize',
      move: 'move',
    };

    return cursorMap[handle] || 'default';
  };

  // Get handle at position
  const getHandleAt = (x: number, y: number): DragHandle => {
    const cropX = offset.x + cropArea.x * scale;
    const cropY = offset.y + cropArea.y * scale;
    const cropW = cropArea.width * scale;
    const cropH = cropArea.height * scale;
    const handleSize = 20; // Larger hit area

    // Check corners
    if (isNear(x, cropX, handleSize) && isNear(y, cropY, handleSize)) return 'nw';
    if (isNear(x, cropX + cropW, handleSize) && isNear(y, cropY, handleSize)) return 'ne';
    if (isNear(x, cropX, handleSize) && isNear(y, cropY + cropH, handleSize)) return 'sw';
    if (isNear(x, cropX + cropW, handleSize) && isNear(y, cropY + cropH, handleSize)) return 'se';

    // Check edges
    if (isNear(x, cropX + cropW / 2, handleSize) && isNear(y, cropY, handleSize)) return 'n';
    if (isNear(x, cropX + cropW / 2, handleSize) && isNear(y, cropY + cropH, handleSize)) return 's';
    if (isNear(x, cropX, handleSize) && isNear(y, cropY + cropH / 2, handleSize)) return 'w';
    if (isNear(x, cropX + cropW, handleSize) && isNear(y, cropY + cropH / 2, handleSize)) return 'e';

    // Check if inside crop area
    if (x >= cropX && x <= cropX + cropW && y >= cropY && y <= cropY + cropH) return 'move';

    return null;
  };

  const isNear = (a: number, b: number, threshold: number): boolean => {
    return Math.abs(a - b) < threshold;
  };

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const handle = getHandleAt(x, y);

    if (handle) {
      setIsDragging(true);
      setDragHandle(handle);
      setDragStart({ x, y });
      setCropStart({ ...cropArea });
    }
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update cursor
    if (!isDragging && canvasRef.current) {
      canvasRef.current.style.cursor = getCursor(x, y);
    }

    if (!isDragging || !dragHandle) return;

    const dx = (x - dragStart.x) / scale;
    const dy = (y - dragStart.y) / scale;

    let newCrop = { ...cropStart };

    // Handle different drag operations
    switch (dragHandle) {
      case 'move':
        newCrop.x = Math.max(0, Math.min(imageDimensions.width - cropStart.width, cropStart.x + dx));
        newCrop.y = Math.max(0, Math.min(imageDimensions.height - cropStart.height, cropStart.y + dy));
        break;

      case 'nw':
        newCrop.x = cropStart.x + dx;
        newCrop.y = cropStart.y + dy;
        newCrop.width = cropStart.width - dx;
        newCrop.height = cropStart.height - dy;
        break;

      case 'ne':
        newCrop.y = cropStart.y + dy;
        newCrop.width = cropStart.width + dx;
        newCrop.height = cropStart.height - dy;
        break;

      case 'sw':
        newCrop.x = cropStart.x + dx;
        newCrop.width = cropStart.width - dx;
        newCrop.height = cropStart.height + dy;
        break;

      case 'se':
        newCrop.width = cropStart.width + dx;
        newCrop.height = cropStart.height + dy;
        break;

      case 'n':
        newCrop.y = cropStart.y + dy;
        newCrop.height = cropStart.height - dy;
        break;

      case 's':
        newCrop.height = cropStart.height + dy;
        break;

      case 'w':
        newCrop.x = cropStart.x + dx;
        newCrop.width = cropStart.width - dx;
        break;

      case 'e':
        newCrop.width = cropStart.width + dx;
        break;
    }

    // Apply aspect ratio lock
    if (aspectRatio && dragHandle !== 'move') {
      const isCorner = ['nw', 'ne', 'sw', 'se'].includes(dragHandle);

      if (isCorner) {
        // Maintain aspect ratio from corner
        const currentRatio = newCrop.width / newCrop.height;
        if (currentRatio > aspectRatio) {
          newCrop.height = newCrop.width / aspectRatio;
        } else {
          newCrop.width = newCrop.height * aspectRatio;
        }
      }
    }

    // Constrain to image bounds
    newCrop.x = Math.max(0, newCrop.x);
    newCrop.y = Math.max(0, newCrop.y);
    newCrop.width = Math.max(50, Math.min(imageDimensions.width - newCrop.x, newCrop.width));
    newCrop.height = Math.max(50, Math.min(imageDimensions.height - newCrop.y, newCrop.height));

    onCropChange(newCrop);
  };

  // Mouse up handler
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth || 800}
      height={containerHeight || 600}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="border border-gray-700"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
