'use client';

import { useState, useCallback } from 'react';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { RequirementsChecklist } from './RequirementsChecklist';
import { ProcessedFilesList } from './ProcessedFilesList';
import { DownloadOptions } from './DownloadOptions';
import type { DocumentCategory, FileRequirement, DocumentRequirements } from '@/lib/config/document-requirements';
import { getDocumentRequirements } from '@/lib/config/document-requirements';
import { processFile, createZipFromFiles } from '@/lib/utils/document-processor';
import type { ProcessingResult } from '@/lib/utils/document-processor';

interface ProcessedFile {
  requirement: FileRequirement;
  result: ProcessingResult;
  originalFile: File;
}

export function DocumentPrepWorkspace() {
  const [selectedDocType, setSelectedDocType] = useState<DocumentCategory | null>(null);
  const [documentReqs, setDocumentReqs] = useState<DocumentRequirements | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Map<string, ProcessedFile>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoProcess, setAutoProcess] = useState(true);

  // Handle document type selection
  const handleDocumentSelect = useCallback((docType: DocumentCategory) => {
    setSelectedDocType(docType);
    const reqs = getDocumentRequirements(docType);
    setDocumentReqs(reqs || null);
    setProcessedFiles(new Map()); // Reset processed files when changing document type
  }, []);

  // Handle file upload for a specific requirement
  const handleFileUpload = useCallback(async (
    file: File,
    requirement: FileRequirement
  ) => {
    if (!file) return;

    setIsProcessing(true);

    try {
      // Process the file according to requirements
      const result = await processFile(file, requirement, { autoProcess });

      if (result.success) {
        // Store the processed file
        setProcessedFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(requirement.label, {
            requirement,
            result,
            originalFile: file,
          });
          return newMap;
        });
      } else {
        alert(`Failed to process ${file.name}: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [autoProcess]);

  // Handle individual file download
  const handleDownloadFile = useCallback((label: string) => {
    const processedFile = processedFiles.get(label);
    if (!processedFile?.result.blob) return;

    const url = URL.createObjectURL(processedFile.result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = processedFile.result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [processedFiles]);

  // Handle download all as ZIP
  const handleDownloadAll = useCallback(async () => {
    if (processedFiles.size === 0) {
      alert('No files to download');
      return;
    }

    try {
      const files = Array.from(processedFiles.values()).map(pf => ({
        blob: pf.result.blob!,
        fileName: pf.result.fileName,
      }));

      const zipBlob = await createZipFromFiles(files);
      
      // Generate ZIP filename with document type and date
      const date = new Date().toISOString().split('T')[0]!.replace(/-/g, '');
      const docTypeName = documentReqs?.name.replace(/\s+/g, '_') || 'Documents';
      const zipFilename = `${docTypeName}_${date}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file');
    }
  }, [processedFiles, documentReqs]);

  // Show upload zone if no document type selected
  if (!selectedDocType || !documentReqs) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                Indian Document Preparation
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Prepare documents for government applications with automatic formatting
              </p>
            </div>
            
            <DocumentTypeSelector
              selectedType={selectedDocType}
              onSelect={handleDocumentSelect}
            />

            <div className="mt-6 p-4 rounded-lg border" style={{
              backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
              borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
            }}>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <strong>✨ Auto-processing: </strong>
                All files are automatically resized, compressed, and formatted to meet exact government requirements. 
                100% private - processing happens in your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header with document type and back button */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{
        borderColor: 'hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
      }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedDocType(null);
              setDocumentReqs(null);
              setProcessedFiles(new Map());
            }}
            className="text-sm px-3 py-1 rounded transition-colors"
            style={{
              backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
              color: 'hsl(var(--primary))',
            }}
          >
            ← Change Document Type
          </button>
          <div>
            <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {documentReqs.icon} {documentReqs.name}
            </h3>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {documentReqs.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              className="rounded"
            />
            <span style={{ color: 'hsl(var(--foreground))' }}>Auto-process</span>
          </label>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Requirements Checklist */}
          <RequirementsChecklist
            requirements={documentReqs.files}
            processedFiles={processedFiles}
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />

          {/* Processed Files List */}
          {processedFiles.size > 0 && (
            <ProcessedFilesList
              processedFiles={processedFiles}
              onDownload={handleDownloadFile}
            />
          )}

          {/* Download Options */}
          {processedFiles.size > 0 && (
            <DownloadOptions
              processedFilesCount={processedFiles.size}
              requiredFilesCount={documentReqs.files.filter(f => f.required).length}
              onDownloadAll={handleDownloadAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}

