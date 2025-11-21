'use client';

import { Download, Package, CheckCircle2, AlertCircle } from 'lucide-react';

interface DownloadOptionsProps {
  processedFilesCount: number;
  requiredFilesCount: number;
  onDownloadAll: () => void;
}

export function DownloadOptions({
  processedFilesCount,
  requiredFilesCount,
  onDownloadAll,
}: DownloadOptionsProps) {
  const allRequiredFilesProcessed = processedFilesCount >= requiredFilesCount;

  return (
    <div className="p-4 rounded-lg border" style={{
      backgroundColor: 'hsl(var(--background))',
      borderColor: allRequiredFilesProcessed
        ? 'rgb(34, 197, 94)'
        : 'rgba(var(--color-border-rgb), 0.5)',
    }}>
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: allRequiredFilesProcessed
              ? 'rgba(34, 197, 94, 0.1)'
              : 'rgba(234, 179, 8, 0.1)',
          }}
        >
          {allRequiredFilesProcessed ? (
            <CheckCircle2 size={20} style={{ color: 'rgb(34, 197, 94)' }} />
          ) : (
            <AlertCircle size={20} style={{ color: 'rgb(234, 179, 8)' }} />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--foreground))' }}>
            {allRequiredFilesProcessed ? 'All Required Files Ready' : 'Files in Progress'}
          </h4>
          <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {allRequiredFilesProcessed ? (
              'All required documents have been processed and are ready to download.'
            ) : (
              `${processedFilesCount} of {requiredFilesCount} required files processed. Upload remaining files to continue.`
            )}
          </p>

          <button
            onClick={onDownloadAll}
            disabled={processedFilesCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <Package size={16} />
            Download All as ZIP ({processedFilesCount} {processedFilesCount === 1 ? 'file' : 'files'})
          </button>

          <div className="mt-3 flex items-start gap-2 p-2 rounded" style={{
            backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
          }}>
            <Download size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Files will be downloaded as an organized ZIP archive with clear naming. Individual files can also be downloaded from the list above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

