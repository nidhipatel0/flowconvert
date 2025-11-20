'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { FileUploadZone } from '../FileUploadZone';
import { loadPDF, renderPDFPage, getPDFPageCount } from '@/lib/utils/pdf-renderer';
import { setCurrentPdfPage, getCurrentPdfPage } from '../FileDetailsSidebar';
import { Download, RotateCw, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { PreviewModal } from '../PreviewModal';
import { BottomBar } from '../BottomBar';
import type { SignatureData } from './ESignatureSidebar';

interface PlacedSignature extends SignatureData {
  x: number; // Position in PDF coordinates
  y: number;
  width: number; // Display width
  height: number; // Display height
  rotation: number; // Rotation in degrees
  page: number; // Page number (1-indexed)
}

export function ESignatureWorkspace() {
  const { getActiveFile, files, undoOperation, redoOperation } = useEditorStore();
  const file = getActiveFile();
  const fileList = Array.from(files.values());

  // Check if undo/redo is available
  const fileHistory = useEditorStore((state) => state.fileHistory);
  const fileRedoHistory = useEditorStore((state) => state.fileRedoHistory);
  const canUndo = file ? (fileHistory.get(file.id)?.length || 0) > 0 : false;
  const canRedo = file ? (fileRedoHistory.get(file.id)?.length || 0) > 0 : false;

  // PDF rendering state
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const renderedPages = useRef<Set<number>>(new Set());

  // Signature state
  const [signatures, setSignatures] = useState<PlacedSignature[]>([]);
  const [pendingSignature, setPendingSignature] = useState<SignatureData | null>(null);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, sigX: 0, sigY: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Notify sidebar of placed signatures count
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('placed-signatures-count', { detail: signatures.length }));
  }, [signatures.length]);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
    originalSize: number;
  } | null>(null);

  const isPDF = file?.format === 'PDF';

  // Sync current page with global page state (for left sidebar integration)
  useEffect(() => {
    const checkPageChange = () => {
      const sharedPage = getCurrentPdfPage();
      if (sharedPage !== currentPage && sharedPage >= 1 && sharedPage <= totalPages) {
        setCurrentPage(sharedPage);
      }
    };
    const interval = setInterval(checkPageChange, 100);
    return () => clearInterval(interval);
  }, [currentPage, totalPages]);

  // Update global page state when currentPage changes
  useEffect(() => {
    if (currentPage >= 1 && currentPage <= totalPages) {
      setCurrentPdfPage(currentPage);
    }
  }, [currentPage, totalPages]);

  // Load PDF when file changes
  useEffect(() => {
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);
    setSignatures([]);
    setCurrentPdfPage(1);

    if (file && isPDF && file.originalFile) {
      console.log('[ESignature] Loading PDF:', file.name);
      loadPDF(file.originalFile)
        .then((pdf) => {
          setPdfDoc(pdf);
          setTotalPages(getPDFPageCount(pdf));
          setCurrentPage(1);
          setCurrentPdfPage(1);
        })
        .catch((error) => {
          console.error('[ESignature] Error loading PDF:', error);
        });
    }
  }, [file, isPDF]);

  // Render visible pages with IntersectionObserver
  useEffect(() => {
    if (pdfDoc && isPDF && totalPages > 0) {
      // Reset rendered pages cache when doc changes
      if (pageRefs.current.length !== totalPages) {
        renderedPages.current.clear();
        pageRefs.current = new Array(totalPages).fill(null);
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pageNum = Number(entry.target.getAttribute('data-page-number'));
              
              // Render page if not already rendered
              if (!renderedPages.current.has(pageNum)) {
                const wrapper = pageRefs.current[pageNum - 1];
                const canvas = wrapper?.querySelector('canvas');
                if (canvas) {
                  renderedPages.current.add(pageNum);
                  renderPDFPage(pdfDoc, pageNum, canvas, { scale: 1.5 })
                    .catch(err => {
                      console.error(`[ESignature] Error rendering page ${pageNum}`, err);
                      renderedPages.current.delete(pageNum);
                    });
                }
              }

              // Update current page if this page is the most visible
              if (entry.intersectionRatio > 0.5) {
                setCurrentPage(pageNum);
                setCurrentPdfPage(pageNum);
              }
            }
          });
        },
        {
          root: containerRef.current,
          threshold: [0.1, 0.5, 0.9],
          rootMargin: '200px' // Pre-load pages before they come into view
        }
      );

      // Observe all page wrappers
      pageRefs.current.forEach((el) => {
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }
    return undefined;
  }, [pdfDoc, totalPages, isPDF]);

  // Handle signature creation and selection from sidebar
  useEffect(() => {
    // Listen for signature created event (for backward compatibility)
    const handleSignatureCreated = ((e: CustomEvent<SignatureData>) => {
      setPendingSignature(e.detail);
    }) as EventListener;

    // Listen for signature selected event (from sidebar list)
    const handleSignatureSelected = ((e: CustomEvent<SignatureData>) => {
      setPendingSignature(e.detail);
    }) as EventListener;

    window.addEventListener('signature-created', handleSignatureCreated);
    window.addEventListener('signature-selected', handleSignatureSelected);
    
    return () => {
      window.removeEventListener('signature-created', handleSignatureCreated);
      window.removeEventListener('signature-selected', handleSignatureSelected);
    };
  }, []);

  // Place signature on PDF click
  const handlePDFClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on a signature, don't place a new one
    const target = e.target as HTMLElement;
    if (target.closest('[data-signature-id]')) {
      return;
    }

    // If clicking outside while signature is selected, deselect it
    if (selectedSignatureId) {
      setSelectedSignatureId(null);
      return;
    }

    // Place new signature if one is pending
    if (!pendingSignature) return;

    // Find which page was clicked
    const pageWrapper = target.closest('[data-page-number]') as HTMLElement;
    if (!pageWrapper) return;

    const pageNum = parseInt(pageWrapper.dataset.pageNumber || '1', 10);
    const canvas = pageWrapper.querySelector('canvas');
    
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    
    // Get click position relative to the canvas element (accounting for zoom)
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    // Convert to PDF coordinates (points)
    // Canvas width/height are the actual pixel dimensions
    const scaleX = 595 / canvas.offsetWidth;
    const scaleY = 842 / canvas.offsetHeight;

    const pdfX = clickX * scaleX;
    const pdfY = clickY * scaleY;

    // Default signature size (will be adjustable)
    const sigWidth = 150;
    const sigHeight = (pendingSignature.height / pendingSignature.width) * sigWidth;

    // Create a new unique ID for this placed signature instance
    const newSignature: PlacedSignature = {
      ...pendingSignature,
      id: `${pendingSignature.id}-${Date.now()}`, // Unique ID for each placement
      x: pdfX,
      y: pdfY,
      width: sigWidth,
      height: sigHeight,
      rotation: 0,
      page: pageNum, // Place on the clicked page
    };

    setSignatures(prev => [...prev, newSignature]);
    setPendingSignature(null);
  }, [pendingSignature, zoom, selectedSignatureId]);

  // Handle signature selection
  const handleSignatureClick = useCallback((e: React.MouseEvent, sigId: string) => {
    e.stopPropagation();
    setSelectedSignatureId(sigId);
  }, []);

  // Handle ESC key - deselect signature first, then exit tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSignatureId) {
          // First ESC: deselect signature
          e.preventDefault();
          e.stopPropagation();
          setSelectedSignatureId(null);
        } else if (pendingSignature) {
          // If pending signature, clear it
          e.preventDefault();
          e.stopPropagation();
          setPendingSignature(null);
        } else {
          // Second ESC: exit tool (let it bubble up to MainWorkspace)
          // Dispatch event to exit tool
          window.dispatchEvent(new CustomEvent('exit-esign-tool'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSignatureId, pendingSignature]);

  // Handle signature drag start
  const handleDragStart = useCallback((e: React.MouseEvent, sigId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setSelectedSignatureId(sigId);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, corner: 'tl' | 'tr' | 'bl' | 'br', sig: PlacedSignature) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeCorner(corner);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: sig.width,
      height: sig.height,
      sigX: sig.x,
      sigY: sig.y,
    });
  }, []);

  // Handle signature drag
  useEffect(() => {
    if (!isDragging || !selectedSignatureId) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Find the signature and its page
      const sig = signatures.find(s => s.id === selectedSignatureId);
      if (!sig) return;

      const pageWrapper = pageRefs.current[sig.page - 1];
      const canvas = pageWrapper?.querySelector('canvas');
      if (!canvas) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const scaleX = 595 / canvas.width;
      const scaleY = 842 / canvas.height;

      setSignatures(sigs =>
        sigs.map(s =>
          s.id === selectedSignatureId
            ? { ...s, x: s.x + deltaX * scaleX, y: s.y + deltaY * scaleY }
            : s
        )
      );

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedSignatureId, dragStart, signatures]);

  // Handle signature resize
  useEffect(() => {
    if (!isResizing || !selectedSignatureId || !resizeCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Find the signature and its page
      const sig = signatures.find(s => s.id === selectedSignatureId);
      if (!sig) return;

      const pageWrapper = pageRefs.current[sig.page - 1];
      const canvas = pageWrapper?.querySelector('canvas');
      if (!canvas) return;

      const scaleX = 595 / canvas.width;
      const scaleY = 842 / canvas.height;

      const deltaX = (e.clientX - resizeStart.x) * scaleX;
      const deltaY = (e.clientY - resizeStart.y) * scaleY;

      setSignatures(sigs =>
        sigs.map(s => {
          if (s.id !== selectedSignatureId) return s;

          let newX = s.x;
          let newY = s.y;
          let newWidth = resizeStart.width;
          let newHeight = resizeStart.height;

          switch (resizeCorner) {
            case 'tl': // Top-left: adjust x, y, width, height
              newX = resizeStart.sigX + deltaX;
              newY = resizeStart.sigY + deltaY;
              newWidth = resizeStart.width - deltaX;
              newHeight = resizeStart.height - deltaY;
              break;
            case 'tr': // Top-right: adjust y, width, height
              newY = resizeStart.sigY + deltaY;
              newWidth = resizeStart.width + deltaX;
              newHeight = resizeStart.height - deltaY;
              break;
            case 'bl': // Bottom-left: adjust x, width, height
              newX = resizeStart.sigX + deltaX;
              newWidth = resizeStart.width - deltaX;
              newHeight = resizeStart.height + deltaY;
              break;
            case 'br': // Bottom-right: adjust width, height
              newWidth = resizeStart.width + deltaX;
              newHeight = resizeStart.height + deltaY;
              break;
          }

          // Minimum size constraint
          if (newWidth < 30 || newHeight < 30) return s;

          return { ...s, x: newX, y: newY, width: newWidth, height: newHeight };
        })
      );
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeCorner(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, selectedSignatureId, resizeCorner, resizeStart, signatures]);

  // Delete selected signature
  const handleDeleteSignature = useCallback(() => {
    if (!selectedSignatureId) return;
    setSignatures(sigs => sigs.filter(sig => sig.id !== selectedSignatureId));
    setSelectedSignatureId(null);
  }, [selectedSignatureId]);

  // Rotate selected signature
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setCurrentPdfPage(newPage);
      pageRefs.current[newPage - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setCurrentPdfPage(newPage);
      pageRefs.current[newPage - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, totalPages]);

  const handleRotateSignature = useCallback(() => {
    if (!selectedSignatureId) return;
    setSignatures(sigs =>
      sigs.map(sig =>
        sig.id === selectedSignatureId
          ? { ...sig, rotation: (sig.rotation + 90) % 360 }
          : sig
      )
    );
  }, [selectedSignatureId]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, 25));
  }, []);

  const handleFitToWidth = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 32;
    if (isPDF && canvasRef.current) {
      const contentWidth = canvasRef.current.width / 1.5;
      if (contentWidth > 0) {
        const newZoom = (containerWidth / contentWidth) * 100;
        setZoom(Math.min(Math.max(newZoom, 25), 300));
      }
    }
  }, [isPDF]);

  const handleUndo = useCallback(() => {
    if (file) {
      undoOperation(file.id);
    }
  }, [file, undoOperation]);

  const handleRedo = useCallback(() => {
    if (file) {
      redoOperation(file.id);
    }
  }, [file, redoOperation]);

  // Resize signature
  const handleResize = useCallback((sigId: string, newWidth: number, newHeight: number) => {
    setSignatures(sigs =>
      sigs.map(sig => {
        if (sig.id !== sigId) return sig;
        return { ...sig, width: newWidth, height: newHeight };
      })
    );
  }, []);

  // Generate signed PDF (shared between preview and download)
  const generateSignedPDF = useCallback(async () => {
    if (!file || !pdfDoc || signatures.length === 0) {
      return null;
    }

    try {
      const blob = file.originalFile || file.data;
      const arrayBuffer = await (blob instanceof Blob ? blob.arrayBuffer() : Promise.resolve(blob));
      const pdfDocument = await PDFDocument.load(arrayBuffer);

      // Group signatures by page
      const signaturesByPage = signatures.reduce((acc, sig) => {
        if (!acc[sig.page]) acc[sig.page] = [];
        acc[sig.page].push(sig);
        return acc;
      }, {} as Record<number, PlacedSignature[]>);

      // Add signatures to each page
      for (const [pageNum, pageSigs] of Object.entries(signaturesByPage)) {
        const page = pdfDocument.getPages()[parseInt(pageNum) - 1];
        if (!page) continue;

        for (const sig of pageSigs) {
          // Fetch and embed signature image
          const imageBytes = await fetch(sig.dataUrl).then(res => res.arrayBuffer());
          const image = await pdfDocument.embedPng(imageBytes);

          // Calculate position (PDF coordinates start from bottom-left)
          const pageHeight = page.getHeight();

          page.drawImage(image, {
            x: sig.x,
            y: pageHeight - sig.y - sig.height,
            width: sig.width,
            height: sig.height,
            rotate: { type: 'degrees', angle: sig.rotation },
          });
        }
      }

      // Save signed PDF
      const pdfBytes = await pdfDocument.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('[ESignature] Error generating signed PDF:', error);
      return null;
    }
  }, [file, pdfDoc, signatures]);

  // Preview signed PDF
  const handlePreview = useCallback(async () => {
    if (!file || !pdfDoc || signatures.length === 0) {
      alert('Please add at least one signature before previewing');
      return;
    }

    const signedBlob = await generateSignedPDF();
    if (!signedBlob) {
      alert('Failed to generate preview');
      return;
    }

    const url = URL.createObjectURL(signedBlob);
    const originalSize = file.originalFile instanceof Blob ? file.originalFile.size : (file.data instanceof Blob ? file.data.size : 0);
    const fileName = `${file.name.replace('.pdf', '')}_signed.pdf`;

    setPreviewData({
      url,
      blob: signedBlob,
      fileName,
      originalSize,
    });
    setShowPreview(true);
  }, [file, pdfDoc, signatures, generateSignedPDF]);

  // Download signed PDF
  const handleDownload = useCallback(async () => {
    if (!file || !pdfDoc || signatures.length === 0) {
      alert('Please add at least one signature before downloading');
      return;
    }

    const signedBlob = await generateSignedPDF();
    if (!signedBlob) {
      alert('Failed to generate signed PDF');
      return;
    }

    const url = URL.createObjectURL(signedBlob);
    const fileName = `${file.name.replace('.pdf', '')}_signed.pdf`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Signed PDF downloaded successfully!');
  }, [file, pdfDoc, signatures, generateSignedPDF]);

  // Confirm download from preview modal
  const handleConfirmDownload = useCallback(() => {
    if (!previewData) return;

    const a = document.createElement('a');
    a.href = previewData.url;
    a.download = previewData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [previewData]);

  // Show upload zone if no files
  if (fileList.length === 0) {
    return <FileUploadZone />;
  }

  // If no active file
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>Select a PDF file to add signatures</p>
        </div>
      </div>
    );
  }

  // If not a PDF
  if (!isPDF) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            E-Signature is only supported for PDF files
          </p>
        </div>
      </div>
    );
  }

  // Handle event listeners for preview and download from sidebar
  useEffect(() => {
    const handleDownloadEvent = () => {
      handleDownload();
    };

    const handlePreviewEvent = () => {
      handlePreview();
    };

    window.addEventListener('download-signed-pdf', handleDownloadEvent);
    window.addEventListener('preview-signed-pdf', handlePreviewEvent);

    return () => {
      window.removeEventListener('download-signed-pdf', handleDownloadEvent);
      window.removeEventListener('preview-signed-pdf', handlePreviewEvent);
    };
  }, [handleDownload, handlePreview]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Signature Manipulation Toolbar (only shows when signature is selected) */}
      {selectedSignatureId && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-b" style={{
          borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
        }}>
          <button
            onClick={handleRotateSignature}
            className="flex items-center justify-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
              color: 'hsl(var(--foreground))',
            }}
          >
            <RotateCw size={12} className="flex-shrink-0" /> <span>Rotate</span>
          </button>
          <button
            onClick={handleDeleteSignature}
            className="flex items-center justify-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: 'rgb(239, 68, 68)',
            }}
          >
            <Trash2 size={12} className="flex-shrink-0" /> <span>Delete</span>
          </button>
        </div>
      )}

      {/* PDF Canvas with Signatures - Continuous Vertical Scroll */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 relative bg-gray-100/50"
        onClick={handlePDFClick}
        style={{ cursor: pendingSignature ? 'crosshair' : 'default' }}
      >
        {pdfDoc && totalPages > 0 ? (
          <div className="flex flex-col items-center gap-8 w-full py-8">
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNum = i + 1;
              return (
                <div
                  key={pageNum}
                  ref={el => { pageRefs.current[i] = el; }}
                  data-page-number={pageNum}
                  className="relative bg-white shadow-xl transition-transform duration-200 ease-out"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    minHeight: '400px',
                    minWidth: '300px',
                  }}
                >
                  <canvas className="max-w-full h-auto block" />
                  
                  {/* Page number indicator */}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded pointer-events-none">
                    Page {pageNum}
                  </div>

                  {/* Overlay Signatures for this page */}
                  {signatures
                    .filter(sig => sig.page === pageNum)
                    .map((sig) => {
                      const wrapper = pageRefs.current[i];
                      const canvas = wrapper?.querySelector('canvas');
                      if (!canvas) return null;

                      // Convert PDF coordinates to screen coordinates
                      const scaleX = canvas.width / 595; // A4 width in points
                      const scaleY = canvas.height / 842; // A4 height in points

                      const screenX = sig.x * scaleX;
                      const screenY = sig.y * scaleY;
                      const screenWidth = sig.width * scaleX;
                      const screenHeight = sig.height * scaleY;

                      const isSelected = sig.id === selectedSignatureId;

                      return (
                        <div
                          key={sig.id}
                          data-signature-id={sig.id}
                          onClick={(e) => handleSignatureClick(e, sig.id)}
                          onMouseDown={(e) => handleDragStart(e, sig.id)}
                          className="absolute cursor-move"
                          style={{
                            left: `${screenX}px`,
                            top: `${screenY}px`,
                            width: `${screenWidth}px`,
                            height: `${screenHeight}px`,
                            transform: `rotate(${sig.rotation}deg)`,
                            transformOrigin: 'center',
                            border: isSelected ? '3px solid hsl(var(--primary))' : '2px solid transparent',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)' : 'transparent',
                            boxShadow: isSelected ? '0 0 8px rgba(var(--color-primary-rgb, 20, 184, 166), 0.4)' : 'none',
                            zIndex: 10,
                          }}
                        >
                          <img
                            src={sig.dataUrl}
                            alt="Signature"
                            className="w-full h-full object-contain pointer-events-none"
                            draggable={false}
                            style={{
                              opacity: isSelected ? 0.9 : 1,
                            }}
                          />

                          {/* Corner Resize Handles */}
                          {isSelected && (
                            <>
                              {/* Top-left corner */}
                              <div
                                className="absolute w-3 h-3 rounded-full cursor-nwse-resize"
                                style={{
                                  backgroundColor: 'hsl(var(--primary))',
                                  top: '-6px',
                                  left: '-6px',
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleResizeStart(e, 'tl', sig);
                                }}
                              />

                              {/* Top-right corner */}
                              <div
                                className="absolute w-3 h-3 rounded-full cursor-nesw-resize"
                                style={{
                                  backgroundColor: 'hsl(var(--primary))',
                                  top: '-6px',
                                  right: '-6px',
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleResizeStart(e, 'tr', sig);
                                }}
                              />

                              {/* Bottom-left corner */}
                              <div
                                className="absolute w-3 h-3 rounded-full cursor-nesw-resize"
                                style={{
                                  backgroundColor: 'hsl(var(--primary))',
                                  bottom: '-6px',
                                  left: '-6px',
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleResizeStart(e, 'bl', sig);
                                }}
                              />

                              {/* Bottom-right corner */}
                              <div
                                className="absolute w-3 h-3 rounded-full cursor-nwse-resize"
                                style={{
                                  backgroundColor: 'hsl(var(--primary))',
                                  bottom: '-6px',
                                  right: '-6px',
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleResizeStart(e, 'br', sig);
                                }}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <p>Loading PDF...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar - Full featured like normal view */}
      {(isPDF || file?.previewUrl) && (
        <BottomBar
          currentPage={isPDF ? currentPage : 1}
          totalPages={isPDF ? totalPages : 1}
          zoom={zoom}
          onPreviousPage={isPDF ? handlePreviousPage : undefined}
          onNextPage={isPDF ? handleNextPage : undefined}
          onPageChange={isPDF ? (page: number) => {
            setCurrentPage(page);
            setCurrentPdfPage(page);
            pageRefs.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } : undefined}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomChange={(newZoom: number) => setZoom(newZoom)}
          onFitToWidth={handleFitToWidth}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          showPageControls={isPDF && totalPages > 1}
        />
      )}


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
        title="Preview Signed PDF"
        previewUrl={previewData?.url || null}
        fileType="pdf"
        originalSize={previewData?.originalSize}
        newSize={previewData?.blob.size}
        originalFileName={file?.name}
        newFileName={previewData?.fileName}
      />
    </div>
  );
}

// Make signature creation available globally
if (typeof window !== 'undefined') {
  (window as any).createSignature = (signature: SignatureData) => {
    window.dispatchEvent(new CustomEvent('signature-created', { detail: signature }));
  };
}
