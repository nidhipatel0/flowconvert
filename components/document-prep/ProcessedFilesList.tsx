'use client';

import { Download, Check, AlertTriangle } from 'lucide-react';
import type { FileRequirement } from '@/lib/config/document-requirements';
import type { ProcessingResult } from '@/lib/utils/document-processor';

interface ProcessedFile {
  requirement: FileRequirement;
  result: ProcessingResult;
  originalFile: File;
}

interface ProcessedFilesListProps {
  processedFiles: Map<string, ProcessedFile>;
  onDownload: (label: string) => void;
}

export function ProcessedFilesList({ processedFiles, onDownload }: ProcessedFilesListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
        Processed Files
      </h3>

      <div className="space-y-2">
        {Array.from(processedFiles.entries()).map(([label, processedFile]) => {
          const { result, requirement } = processedFile;
          const isSuccess = result.success && (!result.warnings || result.warnings.length === 0);
          const hasWarnings = result.warnings && result.warnings.length > 0;

          return (
            <div
              key={label}
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: isSuccess
                  ? 'rgb(34, 197, 94)'
                  : hasWarnings
                    ? 'rgb(234, 179, 8)'
                    : 'rgb(239, 68, 68)',
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: isSuccess
                      ? 'rgba(34, 197, 94, 0.1)'
                      : hasWarnings
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                  }}
                >
                  {isSuccess ? (
                    <Check size={16} style={{ color: 'rgb(34, 197, 94)' }} />
                  ) : (
                    <AlertTriangle
                      size={16}
                      style={{ color: hasWarnings ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)' }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                    {result.fileName}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {result.width && result.height && (
                      <span>{result.width}×{result.height}px</span>
                    )}
                    {result.sizeKB !== undefined && (
                      <span>• {result.sizeKB.toFixed(1)}KB</span>
                    )}
                    {requirement.maxSizeKB && result.sizeKB !== undefined && (
                      <span
                        className="font-medium"
                        style={{
                          color: result.sizeKB <= requirement.maxSizeKB
                            ? 'rgb(34, 197, 94)'
                            : 'rgb(234, 179, 8)',
                        }}
                      >
                        / {requirement.maxSizeKB}KB limit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDownload(label)}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                  color: 'hsl(var(--primary))',
                }}
              >
                <Download size={14} />
                Download
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

