'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { FileList } from '@/components/FileList';
import { ImageTools } from '@/components/ImageTools';
import { ImageToPDF } from '@/components/ImageToPDF';
import { PDFTools } from '@/components/PDFTools';
import { OCRTools } from '@/components/OCRTools';
import { ESignatureTools } from '@/components/ESignatureTools';
import { ProfileManager } from '@/components/ProfileManager';
import { SmartDocumentEditor } from '@/components/SmartDocumentEditor';
import { OfficeConverter } from '@/components/OfficeConverter';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { ToolNavigation } from '@/components/ToolNavigation';
import { useEditorStore } from '@/lib/stores';

export default function HomePage(): JSX.Element {
  const files = useEditorStore((state) => Array.from(state.files.values()));
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [showFileDetails, setShowFileDetails] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <ErrorDisplay />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 pb-32 pt-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              FlowConvert
            </h1>
            <p className="mt-4 text-xl text-purple-100">
              Drop. Done. - Privacy First. Quality Always.
            </p>
            <p className="mt-2 text-sm text-purple-200">
              Convert, compress, and edit files instantly in your browser. Your files never leave your device.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative -mt-24 mx-auto max-w-7xl px-6 pb-12">
        {/* File Upload Card */}
        <div className="mb-8">
          <div className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <FileUploader />
            </div>
          </div>
        </div>

        {/* Tool Navigation */}
        <div className="mb-8">
          <ToolNavigation selectedTool={selectedTool} onSelectTool={setSelectedTool} />
        </div>

        {/* Content Area with Optional Sidebar */}
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* File List */}
            {files.length > 0 && (
              <div className="mb-6">
                <div className="rounded-xl bg-white shadow-md border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Your Files ({files.length})</h2>
                    <button
                      onClick={() => setShowFileDetails(!showFileDetails)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      {showFileDetails ? 'Hide Details' : 'Show Details'}
                      <svg className={`w-4 h-4 transition-transform ${showFileDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <FileList />
                </div>
              </div>
            )}

            {/* Tools Section Based on Selection */}
            {(selectedTool === 'all' || selectedTool === 'image') && (
              <div className="mb-6">
                <ImageTools />
              </div>
            )}
            {(selectedTool === 'all' || selectedTool === 'image') && (
              <div className="mb-6">
                <ImageToPDF />
              </div>
            )}
            {(selectedTool === 'all' || selectedTool === 'pdf') && (
              <div className="mb-6">
                <PDFTools />
              </div>
            )}
            {(selectedTool === 'all' || selectedTool === 'ocr') && (
              <div className="mb-6">
                <OCRTools />
              </div>
            )}
            {(selectedTool === 'all' || selectedTool === 'signature') && (
              <div className="mb-6">
                <ESignatureTools />
              </div>
            )}
            {(selectedTool === 'all' || selectedTool === 'document') && (
              <div className="mb-6">
                <ProfileManager />
              </div>
            )}
            {(selectedTool === 'all' || selectedTool === 'document') && (
              <div className="mb-6">
                <SmartDocumentEditor />
              </div>
            )}
            {(selectedTool === 'all' || selectedTool === 'document') && (
              <div className="mb-6">
                <OfficeConverter />
              </div>
            )}

            {/* Privacy Badge */}
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">100% Private & Secure</h3>
              <p className="text-sm text-gray-600">
                All processing happens in your browser. Your files never leave your device.
              </p>
            </div>
          </div>

          {/* File Details Sidebar */}
          {showFileDetails && files.length > 0 && (
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-6 rounded-xl bg-white shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">File Details</h3>
                <div className="space-y-4">
                  {files.slice(0, 5).map((file) => (
                    <div key={file.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold text-gray-900 truncate mb-2">{file.name}</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Format:</span>
                          <span className="font-medium text-indigo-600">{file.format}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium">{(file.size / 1024).toFixed(2)} KB</span>
                        </div>
                        {file.metadata?.width && file.metadata?.height ? (
                          <div className="flex justify-between">
                            <span>Dimensions:</span>
                            <span className="font-medium">
                              {`${file.metadata.width} × ${file.metadata.height}`}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span className="font-medium">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {files.length > 5 ? (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{files.length - 5} more files
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-secondary-200">
          <p className="text-center text-xs text-secondary-500">
            © 2025 FlowConvert. Privacy First. Quality Always.
          </p>
        </footer>
      </main>
    </div>
  );
}
