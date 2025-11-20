'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export interface SignatureData {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'upload';
  dataUrl: string;
  width: number;
  height: number;
}

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureCreate: (signature: SignatureData) => void;
}

export function SignatureModal({ isOpen, onClose, onSignatureCreate }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [selectedFont, setSelectedFont] = useState('Brush Script MT');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number; time: number }[]>([]);
  const [allStrokes, setAllStrokes] = useState<{ x: number; y: number; time: number }[][]>([]);
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const fonts = [
    'Brush Script MT',
    'Lucida Handwriting',
    'Courier New',
    'Arial',
  ];

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCurrentStroke([]);
    setAllStrokes([]);
  };

  // Ultra-smooth line drawing using Catmull-Rom splines for pen-on-paper feel
  const drawSmoothLine = (ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return;

    ctx.beginPath();
    
    if (pts.length === 2) {
      // Simple line for just 2 points
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
    } else if (pts.length === 3) {
      // Quadratic curve for 3 points
      ctx.moveTo(pts[0].x, pts[0].y);
      const midX = (pts[0].x + pts[2].x) / 2;
      const midY = (pts[0].y + pts[2].y) / 2;
      ctx.quadraticCurveTo(pts[1].x, pts[1].y, midX, midY);
      ctx.lineTo(pts[2].x, pts[2].y);
    } else {
      // Catmull-Rom spline for smooth pen-like drawing
      ctx.moveTo(pts[0].x, pts[0].y);
      
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        
        // Catmull-Rom to Bezier conversion
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }

    ctx.stroke();
  };

  // Get accurate canvas coordinates accounting for scaling
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate position relative to canvas, then scale to canvas coordinates
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  // Handle mouse/touch start
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(e, canvas);
    const now = Date.now();
    const startPoint = { ...coords, time: now };
    setCurrentStroke([startPoint]);
    lastPointRef.current = startPoint;
  };

  // Handle mouse/touch move with velocity-based smoothing
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e, canvas);
    const now = Date.now();
    const newPoint = { ...coords, time: now };

    // Filter points based on distance and time for smoother drawing
    const shouldAddPoint = (() => {
      if (currentStroke.length === 0) return true;
      
      const lastPoint = currentStroke[currentStroke.length - 1];
      const distance = Math.sqrt(
        Math.pow(newPoint.x - lastPoint.x, 2) + Math.pow(newPoint.y - lastPoint.y, 2)
      );
      const timeDelta = now - lastPoint.time;
      
      // Add point if moved enough distance or enough time has passed
      return distance > 2 || timeDelta > 16; // ~60fps max
    })();

    if (!shouldAddPoint) return;

    const newStroke = [...currentStroke, newPoint];
    setCurrentStroke(newStroke);
    lastPointRef.current = newPoint;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear and redraw all strokes plus current stroke
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    allStrokes.forEach((stroke) => {
      drawSmoothLine(ctx, stroke);
    });

    // Draw current stroke with ultra-smooth curves
    if (newStroke.length > 0) {
      drawSmoothLine(ctx, newStroke);
    }
  };

  // Handle mouse/touch end
  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      setAllStrokes([...allStrokes, currentStroke]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  // Get image bounds (trim whitespace)
  const getImageBounds = (imageData: ImageData) => {
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX > maxX || minY > maxY) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  };

  // Handle drawn signature
  const handleUseDrawnSignature = () => {
    if (!signatureName.trim()) {
      alert('Please enter a name for this signature');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bounds = getImageBounds(imageData);

    if (!bounds) {
      alert('Please draw a signature first');
      return;
    }

    // Create trimmed canvas
    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = bounds.width;
    trimmedCanvas.height = bounds.height;
    const trimmedCtx = trimmedCanvas.getContext('2d');

    if (!trimmedCtx) return;

    trimmedCtx.drawImage(
      canvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height
    );

    const signature: SignatureData = {
      id: Date.now().toString(),
      name: signatureName.trim(),
      type: 'draw',
      dataUrl: trimmedCanvas.toDataURL('image/png'),
      width: bounds.width,
      height: bounds.height,
    };

    onSignatureCreate(signature);
    clearCanvas();
    setSignatureName('');
    onClose();
  };

  // Handle typed signature
  const handleUseTypedSignature = () => {
    if (!signatureText.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!signatureName.trim()) {
      alert('Please enter a name for this signature');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = `48px "${selectedFont}"`;
    const metrics = ctx.measureText(signatureText);
    const textWidth = metrics.width;
    const textHeight = 60;

    canvas.width = textWidth + 20;
    canvas.height = textHeight + 20;

    ctx.font = `48px "${selectedFont}"`;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.fillText(signatureText, 10, canvas.height / 2);

    const signature: SignatureData = {
      id: Date.now().toString(),
      name: signatureName.trim(),
      type: 'type',
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    };

    onSignatureCreate(signature);
    setSignatureText('');
    setSignatureName('');
    onClose();
  };

  // Handle uploaded signature
  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!signatureName.trim()) {
      alert('Please enter a name for this signature');
      e.target.value = ''; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;

      // Remove white background
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Make white pixels transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        const signature: SignatureData = {
          id: Date.now().toString(),
          name: signatureName.trim(),
          type: 'upload',
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
        };

        onSignatureCreate(signature);
        setSignatureName('');
        onClose();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        className="rounded-lg shadow-2xl p-6 max-w-3xl w-full mx-4"
        style={{ backgroundColor: 'hsl(var(--card))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Create Signature
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['draw', 'type', 'upload'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded capitalize font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab ? 'hsl(var(--primary))' : 'transparent',
                color: activeTab === tab ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {/* Signature Name Input - Common for all tabs */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Signature Name *
            </label>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g., John Doe, Initials, etc."
              className="w-full px-4 py-2 rounded border-2"
              style={{
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>

          {activeTab === 'draw' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Draw your signature below
              </p>
              <canvas
                ref={canvasRef}
                width={700}
                height={300}
                className="border-2 rounded-lg"
                style={{ 
                  borderColor: 'hsl(var(--border))',
                  cursor: 'crosshair',
                  touchAction: 'none',
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="flex gap-2">
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 rounded"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: 'rgb(239, 68, 68)',
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={handleUseDrawnSignature}
                  className="px-4 py-2 rounded flex-1"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  }}
                >
                  Use Signature
                </button>
              </div>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Type your name to create a signature
              </p>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Enter your name"
                className="px-4 py-2 rounded border-2"
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="px-4 py-2 rounded border-2"
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                {fonts.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
              {signatureText && (
                <div
                  className="p-8 rounded border-2 text-center"
                  style={{
                    borderColor: 'hsl(var(--border))',
                    backgroundColor: 'white',
                    fontFamily: selectedFont,
                    fontSize: '48px',
                  }}
                >
                  {signatureText}
                </div>
              )}
              <button
                onClick={handleUseTypedSignature}
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                Use Signature
              </button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Upload an image of your signature (PNG, JPG)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadSignature}
                className="px-4 py-2 rounded border-2"
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Note: Enter a name above before uploading
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
