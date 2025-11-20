'use client';

import { useEditorStore } from '@/lib/stores';
import { formatFileSize } from '@/lib/utils/error-handling';
import { FileState } from '@/lib/types/file';
import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FileCardSidebarProps {
  maxVisible?: number;
}

export function FileCardSidebar({ maxVisible = 3 }: FileCardSidebarProps) {
  const files = useEditorStore((state) => Array.from(state.files.values()));
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const setActiveFile = useEditorStore((state) => state.setActiveFile);
  const removeFile = useEditorStore((state) => state.removeFile);
  const [isExpanded, setIsExpanded] = useState(false);

  if (files.length === 0) {
    return null;
  }

  const visibleFiles = isExpanded ? files : files.slice(0, maxVisible);
  const hasMore = files.length > maxVisible;

  return (
    <div className="w-full md:w-72 flex-shrink-0">
      <div 
        className="sticky top-6 rounded-xl border p-4"
        style={{ 
          background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(var(--color-primary-rgb, 20, 184, 166), 0.1) 100%)',
          borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-4 pb-3 border-b"
          style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
            Files ({files.length})
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg transition-colors"
            style={{ 
              color: 'var(--color-accent)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label={isExpanded ? 'Collapse file list' : 'Expand file list'}
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* File List */}
        <div className="space-y-2">
          {visibleFiles.map((file) => (
            <div
              key={file.id}
              className="group relative p-3 rounded-lg cursor-pointer transition-all border"
              style={{
                backgroundColor: activeFileId === file.id
                  ? 'var(--color-primary)'
                  : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                borderColor: activeFileId === file.id
                  ? 'var(--color-primary)'
                  : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                color: activeFileId === file.id ? 'var(--color-background)' : 'var(--color-text)'
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
              onClick={() => setActiveFile(file.id)}
            >
              {/* File Icon and Info */}
              <div className="flex items-start gap-2 min-w-0">
                {/* Icon */}
                <div className="flex-shrink-0 text-lg mt-0.5">
                  {file.format && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(file.format)
                    ? '🖼️'
                    : '📄'}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{file.name}</p>
                  <p className="text-xs" style={{ opacity: 0.75 }}>
                    {file.format} • {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 transition-all rounded"
                  style={{ color: 'var(--color-accent)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgb(239, 68, 68)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }}
                  title="Remove file"
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Status Badge */}
              {file.state !== FileState.UPLOADED && (
                <div 
                  className="mt-2 text-xs font-semibold py-1 px-2 rounded"
                  style={{ 
                    backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                    opacity: 0.75
                  }}
                >
                  {file.state}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show More Button */}
        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="mt-3 w-full py-2 text-xs font-semibold rounded-lg transition-colors border"
            style={{ 
              color: 'var(--color-accent)',
              backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
            }}
          >
            +{files.length - maxVisible} more files
          </button>
        )}

        {/* Collapse Button */}
        {isExpanded && hasMore && (
          <button
            onClick={() => setIsExpanded(false)}
            className="mt-3 w-full py-2 text-xs font-semibold rounded-lg transition-colors border"
            style={{ 
              color: 'var(--color-accent)',
              backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
            }}
          >
            Show Less
          </button>
        )}
      </div>
    </div>
  );
}
