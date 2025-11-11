'use client';

import { useEditorStore } from '@/lib/stores';
import { formatFileSize } from '@/lib/utils/error-handling';
import { FileState } from '@/lib/types/file';

export function FileList() {
  const files = useEditorStore((state) => Array.from(state.files.values()));
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const setActiveFile = useEditorStore((state) => state.setActiveFile);
  const removeFile = useEditorStore((state) => state.removeFile);

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-secondary-500">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {files.map((file) => (
        <div
          key={file.id}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
            activeFileId === file.id
              ? 'bg-cyan-50 border-cyan-400'
              : 'bg-secondary-50 border-secondary-200 hover:bg-secondary-100'
          }`}
          onClick={() => setActiveFile(file.id)}
        >
          {/* File icon */}
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl border border-secondary-200 flex-shrink-0">
            {file.format && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(file.format) ? '🖼️' : '📄'}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-secondary-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-secondary-600">
              {file.format} • {formatFileSize(file.size)}
            </p>
          </div>

          {/* Status badge */}
          {file.state !== FileState.UPLOADED && (
            <div
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                file.state === FileState.PROCESSING
                  ? 'bg-cyan-100 text-cyan-700'
                  : file.state === FileState.READY
                    ? 'bg-green-100 text-green-700'
                    : file.state === FileState.ERROR
                      ? 'bg-red-100 text-red-700'
                      : 'bg-secondary-100 text-secondary-700'
              }`}
            >
              {file.state}
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFile(file.id);
            }}
            title="Remove this file"
            className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            aria-label="Remove file"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
