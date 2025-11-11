'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';

interface SignaturePadProps {
  onSignatureChange?: (signatureDataUrl: string | null) => void;
}

export function SignaturePadComponent({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize SignaturePad with consistent thickness
    const signaturePad = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 2,
      maxWidth: 2, // Same as minWidth for consistent thickness
      throttle: 0, // Lower throttle for smoother lines
      velocityFilterWeight: 0, // No velocity filtering for consistent thickness
    });

    signaturePadRef.current = signaturePad;

    // Handle signature changes
    const handleChange = () => {
      const empty = signaturePad.isEmpty();
      setIsEmpty(empty);

      if (onSignatureChange) {
        onSignatureChange(empty ? null : signaturePad.toDataURL());
      }
    };

    signaturePad.addEventListener('endStroke', handleChange);

    // Handle window resize
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      signaturePad.clear();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      signaturePad.off();
    };
  }, [onSignatureChange]);

  const handleClear = useCallback(() => {
    if (!signaturePadRef.current) return;
    signaturePadRef.current.clear();
    setIsEmpty(true);
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  const handleUndo = useCallback(() => {
    if (!signaturePadRef.current) return;
    const data = signaturePadRef.current.toData();
    if (data.length > 0) {
      data.pop();
      signaturePadRef.current.fromData(data);
      setIsEmpty(signaturePadRef.current.isEmpty());

      if (onSignatureChange) {
        onSignatureChange(
          signaturePadRef.current.isEmpty()
            ? null
            : signaturePadRef.current.toDataURL()
        );
      }
    }
  }, [onSignatureChange]);

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-secondary-300 rounded-lg bg-white relative">
        <canvas
          ref={canvasRef}
          className="w-full h-72 touch-none"
          style={{ touchAction: 'none' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-secondary-400">Draw your signature here</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleUndo}
          disabled={isEmpty}
          className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleClear}
          disabled={isEmpty}
          className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
