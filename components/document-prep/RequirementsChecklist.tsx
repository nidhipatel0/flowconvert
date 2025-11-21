'use client';

import { useCallback, useRef } from 'react';
import { Upload, Check, AlertTriangle, Loader2, Info } from 'lucide-react';
import type { FileRequirement } from '@/lib/config/document-requirements';
import type { ProcessingResult } from '@/lib/utils/document-processor';

interface ProcessedFile {
  requirement: FileRequirement;
  result: ProcessingResult;
  originalFile: File;
}

interface RequirementsChecklistProps {
  requirements: FileRequirement[];
  processedFiles: Map<string, ProcessedFile>;
  onFileUpload: (file: File, requirement: FileRequirement) => Promise<void>;
  isProcessing: boolean;
}

export function RequirementsChecklist({
  requirements,
  processedFiles,
  onFileUpload,
  isProcessing,
}: RequirementsChecklistProps) {
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const handleFileSelect = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    requirement: FileRequirement
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file, requirement);
    }
    // Reset input so the same file can be selected again
    event.target.value = '';
  }, [onFileUpload]);

  const handleDrop = useCallback((
    event: React.DragEvent,
    requirement: FileRequirement
  ) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file, requirement);
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const getComplianceStatus = (processedFile: ProcessedFile) => {
    const { result } = processedFile;
    
    if (!result.success) {
      return { icon: <AlertTriangle size={16} />, color: 'rgb(239, 68, 68)', text: 'Error' };
    }

    if (result.warnings && result.warnings.length > 0) {
      return { icon: <AlertTriangle size={16} />, color: 'rgb(234, 179, 8)', text: 'Warning' };
    }

    return { icon: <Check size={16} />, color: 'rgb(34, 197, 94)', text: 'Compliant' };
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
        Required Documents
      </h3>

      {requirements.map((req) => {
        const processedFile = processedFiles.get(req.label);
        const status = processedFile ? getComplianceStatus(processedFile) : null;

        return (
          <div
            key={req.label}
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: processedFile
                ? status?.color
                : req.required
                  ? 'hsl(var(--border))'
                  : 'rgba(var(--color-border-rgb), 0.5)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                    {req.label}
                    {req.required && <span className="text-red-500 ml-1">*</span>}
                  </h4>
                  {processedFile && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: `${status?.color}20`, color: status?.color }}
                    >
                      {status?.icon}
                      {status?.text}
                    </span>
                  )}
                </div>

                {req.description && (
                  <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {req.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {req.width && req.height && (
                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                      {req.width}×{req.height}px
                    </span>
                  )}
                  {req.maxSizeKB && (
                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                      &lt;{req.maxSizeKB}KB
                    </span>
                  )}
                  {req.formats && (
                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                      {req.formats.join(', ')}
                    </span>
                  )}
                  {req.dpi && (
                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                      {req.dpi} DPI
                    </span>
                  )}
                  {req.backgroundColor && (
                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)' }}>
                      {req.backgroundColor} bg
                    </span>
                  )}
                </div>

                {processedFile?.result.warnings && processedFile.result.warnings.length > 0 && (
                  <div className="mt-2 text-xs p-2 rounded" style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    color: 'rgb(234, 179, 8)',
                  }}>
                    {processedFile.result.warnings.map((warning, idx) => (
                      <div key={idx}>• {warning}</div>
                    ))}
                  </div>
                )}

                {processedFile?.result.errors && processedFile.result.errors.length > 0 && (
                  <div className="mt-2 text-xs p-2 rounded" style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'rgb(239, 68, 68)',
                  }}>
                    {processedFile.result.errors.map((error, idx) => (
                      <div key={idx}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {processedFile ? (
                  <button
                    onClick={() => {
                      const input = fileInputRefs.current.get(req.label);
                      input?.click();
                    }}
                    className="text-xs px-3 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    Replace
                  </button>
                ) : (
                  <div
                    onDrop={(e) => handleDrop(e, req)}
                    onDragOver={handleDragOver}
                    onClick={() => {
                      const input = fileInputRefs.current.get(req.label);
                      input?.click();
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors hover:border-solid"
                    style={{
                      borderColor: 'hsl(var(--border))',
                      backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 size={24} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                    ) : (
                      <>
                        <Upload size={24} style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                          Upload
                        </span>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current.set(req.label, el);
                  }}
                  type="file"
                  accept={req.formats.map(f => {
                    if (f === 'JPEG' || f === 'JPG') return 'image/jpeg';
                    if (f === 'PNG') return 'image/png';
                    if (f === 'PDF') return 'application/pdf';
                    if (f === 'WEBP') return 'image/webp';
                    if (f === 'GIF') return 'image/gif';
                    if (f === 'BMP') return 'image/bmp';
                    return '*/*';
                  }).join(',')}
                  onChange={(e) => handleFileSelect(e, req)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex items-start gap-2 p-3 rounded-lg" style={{
        backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
        borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
      }}>
        <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Files marked with <span className="text-red-500">*</span> are required. 
          Files are automatically processed to meet exact specifications. All processing happens locally in your browser.
        </p>
      </div>
    </div>
  );
}

