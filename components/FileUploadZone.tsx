'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { detectFormatFromBlob } from '@/lib/utils/format-detection';
import { FileFormat } from '@/lib/types/file';

export function FileUploadZone() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addFiles } = useEditorStore();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    setIsProcessing(true);
    const files = Array.from(fileList);
    const fileInputs = [];

    for (const file of files) {
      try {
        // Detect format
        const format = await detectFormatFromBlob(file);
        if (!format) {
          console.warn(`Unable to detect format for ${file.name}`);
          continue;
        }

        // Read file data
        const arrayBuffer = await file.arrayBuffer();
        
        // Create blob for preview URL
        const blob = new Blob([arrayBuffer], { type: file.type });
        const previewUrl = URL.createObjectURL(blob);

        // Create file input for store
        fileInputs.push({
          name: file.name,
          size: file.size,
          type: file.type,
          format: format as FileFormat,
          data: arrayBuffer,
          previewUrl,
          originalFile: file,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (fileInputs.length > 0) {
      addFiles(fileInputs);
    }

    setIsProcessing(false);
    setIsDragging(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center w-full h-full cursor-pointer relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="File upload zone"
    >
      {/* Full-workspace clickable card - covers entire area */}
      <div
        className="w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all duration-200"
        style={{
          border: 'none',
          outline: 'none',
          backgroundColor: isDragging 
            ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' 
            : 'transparent',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          opacity: isProcessing ? 0.5 : 1,
          cursor: isProcessing ? 'wait' : 'pointer'
        }}
        onMouseEnter={(e) => {
          if (!isDragging && !isProcessing) {
            e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && !isProcessing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {/* Upload Icon */}
        <div 
          className="flex items-center justify-center w-24 h-24 rounded-full border-2 mb-8"
          style={{ 
            backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
            borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.4)'
          }}
        >
          <Upload className="w-12 h-12" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.5} />
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl font-bold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
          Drop your files here
        </h2>

        {/* Subheading */}
        <p className="text-lg mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
          or click anywhere to select files from your computer
        </p>

        {/* Privacy Badge */}
        <div 
          className="flex items-center gap-3 px-6 py-4 rounded-lg border mb-8 max-w-md"
          style={{ 
            backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
            borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.4)'
          }}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            style={{ color: 'hsl(var(--primary))' }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              100% Private & Secure
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              All processing happens locally in your browser. Your files never leave your computer.
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={isProcessing}
          className="px-8 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))'
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isProcessing ? 'Processing...' : 'Select Files from Computer'}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.docx,.doc,.txt,.rtf,.xlsx,.xls,.pptx,.ppt"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
