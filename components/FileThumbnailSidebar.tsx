'use client';

import { useEditorStore } from '@/lib/stores/editor-store';
import { FileFormat } from '@/lib/types/file';
import { Image, FileText, X } from 'lucide-react';

export function FileThumbnailSidebar() {
  const { files, activeFileId, setActiveFile, removeFile } = useEditorStore();

  // Convert Map to Array
  const fileList = Array.from(files.values());

  if (fileList.length === 0) return null;

  const formatFileName = (name: string, maxLength: number = 16) => {
    return name.length > maxLength
      ? name.substring(0, maxLength - 3) + '...'
      : name;
  };

  return (
    <div 
      className="w-24 border-r overflow-y-auto flex flex-col gap-2 p-2"
      style={{ 
        backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
        borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
      }}
    >
      {fileList.map((file) => (
        <div
          key={file.id}
          onClick={() => setActiveFile(file.id)}
          className="relative flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all group border"
          style={{
            backgroundColor: activeFileId === file.id
              ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
              : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
            borderColor: activeFileId === file.id
              ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.5)'
              : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)'
          }}
          onMouseEnter={(e) => {
            if (activeFileId !== file.id) {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeFileId !== file.id) {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
            }
          }}
          title={file.name}
        >
          {/* Thumbnail Preview */}
          <div 
            className="w-16 h-16 rounded border flex items-center justify-center overflow-hidden relative"
            style={{ 
              backgroundColor: 'var(--color-surface)',
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
            }}
          >
            {(file.format === FileFormat.PNG ||
              file.format === FileFormat.JPG ||
              file.format === FileFormat.WEBP) &&
            file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : file.format === FileFormat.PDF && file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : file.format === FileFormat.PNG ||
              file.format === FileFormat.JPG ||
              file.format === FileFormat.WEBP ? (
              <Image className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
            ) : file.format === FileFormat.PDF ? (
              <FileText className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
            ) : null}
          </div>

          {/* File Name */}
          <span className="text-xs text-center" style={{ color: 'var(--color-text)' }}>
            {formatFileName(file.name)}
          </span>

          {/* Delete Button (hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFile(file.id);
            }}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 hover:bg-red-600 rounded transition-all"
            title="Delete file"
            aria-label="Delete file"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
