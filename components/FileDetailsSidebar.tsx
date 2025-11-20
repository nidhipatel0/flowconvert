'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { Download, Eye, Image, FileText, Upload, X } from 'lucide-react';
import { FileFormat } from '@/lib/types';
import { loadPDF, renderPDFPage, getPDFPageCount } from '@/lib/utils/pdf-renderer';
import { detectFormatFromBlob } from '@/lib/utils/format-detection';
import { ImageToPDFSidebar } from './ImageToPDFSidebar';
import { PDFToolsSidebar } from './PDFToolsSidebar';
import { CropToolSidebar } from './image-tools/CropToolSidebar';
import { PDFCropToolSidebar } from './pdf-tools/PDFCropToolSidebar';
import { OCRScanSidebar } from './ocr-tools/OCRScanSidebar';
import { ESignatureSidebar } from './esign-tools/ESignatureSidebar';

// Simple state to share current page between components
let currentPdfPage = 1;
let setCurrentPdfPageCallback: ((page: number) => void) | null = null;

export function setCurrentPdfPage(page: number) {
  currentPdfPage = page;
  if (typeof window !== 'undefined') {
    (window as any).__currentPdfPage = page;
  }
  if (setCurrentPdfPageCallback) {
    setCurrentPdfPageCallback(page);
  }
}

export function getCurrentPdfPage() {
  return currentPdfPage;
}

interface FileDetailsSidebarProps {
  selectedTool?: string;
}

export function FileDetailsSidebar({ selectedTool }: FileDetailsSidebarProps) {
  const { getActiveFile, files, activeFileId, setActiveFile, addFiles, removeFile } = useEditorStore();
  const file = getActiveFile();
  const fileList = Array.from(files.values());
  const [pdfDoc, setPdfDoc] = useState<any | null>(null); // PDFDocumentProxy from pdfjs-dist
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with global current page
  useEffect(() => {
    setCurrentPdfPageCallback = setCurrentPage;
    setCurrentPage(currentPdfPage);
    return () => {
      setCurrentPdfPageCallback = null;
    };
  }, []);

  // Load PDF when file changes
  useEffect(() => {
    if (file && file.format === 'PDF' && file.originalFile) {
      loadPDF(file.originalFile)
        .then((pdf) => {
          setPdfDoc(pdf);
          setTotalPages(getPDFPageCount(pdf));
          setThumbnails([]);
        })
        .catch((error) => {
          console.error('Error loading PDF:', error);
        });
    }
  }, [file]);

  // Generate thumbnails when PDF loads
  useEffect(() => {
    if (pdfDoc && thumbnails.length === 0) {
      const generateThumbnails = async () => {
        const thumbs: string[] = [];
        for (let i = 1; i <= totalPages; i++) {
          try {
            const canvas = document.createElement('canvas');
            await renderPDFPage(pdfDoc, i, canvas, { width: 120, height: 160 });
            thumbs.push(canvas.toDataURL('image/png'));
          } catch (error) {
            console.error(`Error generating thumbnail for page ${i}:`, error);
            thumbs.push('');
          }
        }
        setThumbnails(thumbs);
      };
      generateThumbnails();
    }
  }, [pdfDoc, totalPages, thumbnails.length]);

  if (!file) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePreview = () => {
    if (file.previewUrl) {
      window.open(file.previewUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (file.previewUrl) {
      const link = document.createElement('a');
      link.href = file.previewUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const fileInputs = [];

    for (const file of files) {
      try {
        const format = await detectFormatFromBlob(file);
        if (!format) {
          console.warn(`Unable to detect format for ${file.name}`);
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });
        const previewUrl = URL.createObjectURL(blob);

        fileInputs.push({
          name: file.name,
          type: file.type,
          size: file.size,
          format: format as FileFormat,
          data: blob,
          previewUrl,
          originalFile: file,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (fileInputs.length > 0) {
      const fileIds = addFiles(fileInputs);
      if (fileIds.length > 0 && fileIds[0]) {
        setActiveFile(fileIds[0]);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles, setActiveFile]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Check for file type mismatch (same logic as MainWorkspace)
  const imageTools = ['crop', 'resize', 'convert-jpg', 'convert-png', 'convert-webp', 'convert-jpeg'];
  const pdfTools = ['pdf-crop', 'editor-crop', 'pdf-merge', 'pdf-split', 'pdf-extract', 'pdf-compress', 'pdf-organise', 'editor-esign'];
  const requiresImage = imageTools.includes(selectedTool || '');
  const requiresPDF = pdfTools.includes(selectedTool || '');
  
  const hasFileTypeMismatch = file && selectedTool && (
    (requiresImage && file.format === 'PDF') || 
    (requiresPDF && file.format !== 'PDF')
  );
  
  // If ImageToPDF tool is selected, show conversion options in sidebar
  const showImageToPDFOptions = selectedTool === 'convert-pdf' && !hasFileTypeMismatch;

  // Check if image crop tool is selected (only if no file type mismatch)
  const isImageCropToolSelected = selectedTool === 'crop' && !hasFileTypeMismatch;

  // Check if PDF crop tool is selected (only if no file type mismatch)
  const isPDFCropToolSelected = (selectedTool === 'editor-crop' || selectedTool === 'pdf-crop') && !hasFileTypeMismatch;

  // Check if OCR tool is selected (only if no file type mismatch)
  const isOCRToolSelected = selectedTool === 'ocr-scan' && !hasFileTypeMismatch;

  // Check if E-signature tool is selected (only if no file type mismatch)
  const isESignToolSelected = selectedTool === 'editor-esign' && !hasFileTypeMismatch;

  // Check if a PDF tool is selected (only if no file type mismatch)
  const isPDFToolSelected = !hasFileTypeMismatch && (
    selectedTool === 'pdf-merge' ||
    selectedTool === 'pdf-split' ||
    selectedTool === 'pdf-extract' ||
    selectedTool === 'pdf-compress' ||
    selectedTool === 'pdf-organise'
  );

  return (
    <div
      className="w-64 h-full border-l flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
        borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload-sidebar"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* Upload Button and File List Section */}
      <div className="flex flex-col border-b" style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' }}>
        {/* Upload Button */}
        <div className="p-3">
          <button
            onClick={handleUploadClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors text-sm"
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
          >
            <Upload size={16} />
            <span>Upload More Files</span>
          </button>
        </div>

        {/* File Selection Cards */}
        <div className="px-3 pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Files ({fileList.length})
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {fileList.map((f) => {
              const isActive = activeFileId === f.id;
              return (
                <div
                  key={f.id}
                  className="relative group"
                >
                  <button
                    onClick={() => setActiveFile(f.id)}
                    className="flex items-center gap-2 p-2 pr-12 rounded-lg transition-all text-left w-full"
                    style={{
                      backgroundColor: isActive
                        ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)'
                        : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
                      border: 'none',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)';
                      }
                    }}
                  >
                    <div className="flex-shrink-0">
                      {f.format === 'PDF' ? (
                        <FileText size={20} style={{ color: 'hsl(var(--primary))' }} />
                      ) : (
                        <Image size={20} style={{ color: 'hsl(var(--primary))' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                        {f.name}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {f.format}
                      </div>
                    </div>
                  </button>
                  {/* Status dot + cross button */}
                  <div className="absolute top-1 right-1 flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-colors"
                      style={{
                        backgroundColor: isActive
                          ? 'hsl(var(--primary))'
                          : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(f.id);
                      }}
                      className="w-5 h-5 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.35)',
                        color: 'hsl(var(--foreground))',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.35)';
                      }}
                      title="Remove file"
                    >
                      <X size={10} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {isPDFToolSelected ? (
        /* PDF Tools Sidebar with File Details below */
        <div style={{ flex: '1 1 0px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: '1 1 0px', overflowY: 'auto', overflowX: 'hidden' }}>
            <PDFToolsSidebar selectedTool={selectedTool || ''} />
          </div>
          {/* File Details Card - Always visible when file is selected */}
          <div className="p-2 border-t flex-shrink-0" style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' }}>
            <div 
              className="rounded-lg border p-2"
              style={{ 
                borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)'
              }}
            >
              <h3 className="text-[10px] font-semibold mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>File Details</h3>
      
              {/* Content */}
              <div className="flex flex-col gap-1.5">
                {/* Action Buttons */}
                <div className="flex gap-1.5 mb-1.5">
                  <button
                    onClick={handlePreview}
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
                    onClick={handleDownload}
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

                  {/* Status */}
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Status
                    </p>
                    <p className="text-[10px] mt-0.5 capitalize">
                      <span
                        className="inline-block px-1 py-0.5 rounded text-[9px] font-medium"
                        style={{
                          backgroundColor: file.state === 'UPLOADED'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : file.state === 'PROCESSING'
                              ? 'rgba(234, 179, 8, 0.2)'
                              : file.state === 'READY'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                          color: file.state === 'UPLOADED'
                            ? 'rgb(147, 197, 253)'
                            : file.state === 'PROCESSING'
                              ? 'rgb(253, 224, 71)'
                              : file.state === 'READY'
                                ? 'rgb(134, 239, 172)'
                                : 'rgb(252, 165, 165)'
                        }}
                      >
                        {file.state}
                      </span>
                    </p>
                  </div>

                  {/* Dimensions (for images) */}
                  {file.metadata?.width && file.metadata?.height && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Dimensions
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>
                        {file.metadata.width} × {file.metadata.height} px
                      </p>
                    </div>
                  )}

                  {/* Page Count (for PDFs) */}
                  {file.metadata?.pageCount && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Pages
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>{file.metadata.pageCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isImageCropToolSelected ? (
        /* Image Crop Tool Options */
        <div className="overflow-y-auto flex-1 flex flex-col p-2">
          <CropToolSidebar />
        </div>
      ) : isPDFCropToolSelected ? (
        /* PDF Crop Tool Options */
        <div className="overflow-y-auto flex-1 flex flex-col p-2">
          <PDFCropToolSidebar />
        </div>
      ) : isOCRToolSelected ? (
        /* OCR Scan Options */
        <div className="p-2 overflow-y-auto flex-1">
          <OCRScanSidebar />
        </div>
      ) : isESignToolSelected ? (
        /* E-Signature Options */
        <div className="p-2 overflow-y-auto flex-1">
          <ESignatureSidebar onSignatureCreate={() => {}} />
        </div>
      ) : showImageToPDFOptions ? (
        /* Image to PDF Options */
        <ImageToPDFSidebar />
      ) : (
        /* File Details View */
        <>
          {/* File Details Card */}
          <div className="p-2">
            <div 
              className="rounded-lg border p-2"
              style={{ 
                borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)'
              }}
            >
              <h3 className="text-[10px] font-semibold mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>File Details</h3>
      
              {/* Content */}
              <div className="flex flex-col gap-1.5">
                {/* Action Buttons */}
                <div className="flex gap-1.5 mb-1.5">
                  <button
                    onClick={handlePreview}
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
                    onClick={handleDownload}
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

                  {/* Status */}
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Status
                    </p>
                    <p className="text-[10px] mt-0.5 capitalize">
                      <span
                        className="inline-block px-1 py-0.5 rounded text-[9px] font-medium"
                        style={{
                          backgroundColor: file.state === 'UPLOADED'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : file.state === 'PROCESSING'
                              ? 'rgba(234, 179, 8, 0.2)'
                              : file.state === 'READY'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                          color: file.state === 'UPLOADED'
                            ? 'rgb(147, 197, 253)'
                            : file.state === 'PROCESSING'
                              ? 'rgb(253, 224, 71)'
                              : file.state === 'READY'
                                ? 'rgb(134, 239, 172)'
                                : 'rgb(252, 165, 165)'
                        }}
                      >
                        {file.state}
                      </span>
                    </p>
                  </div>

                  {/* Dimensions (for images) */}
                  {file.metadata?.width && file.metadata?.height && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Dimensions
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>
                        {file.metadata.width} × {file.metadata.height} px
                      </p>
                    </div>
                  )}

                  {/* Page Count (for PDFs) */}
                  {file.metadata?.pageCount && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Pages
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>{file.metadata.pageCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
