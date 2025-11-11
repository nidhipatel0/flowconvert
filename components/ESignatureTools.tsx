'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/stores';
import { SignaturePadComponent } from './SignaturePad';
import { PDFDocument } from 'pdf-lib';
import { PreviewModal } from './PreviewModal';

const SIGNATURE_STORAGE_KEY = 'flowconvert_signatures';

interface SavedSignature {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: Date;
}

export function ESignatureTools() {
  const files = useEditorStore((state) => Array.from(state.files.values()).filter(f => f.format === 'PDF'));
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'saved'>('draw');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [signatureName, setSignatureName] = useState('');

  // Position settings
  const [pageNumber, setPageNumber] = useState(1);
  const [xPosition, setXPosition] = useState(50);
  const [yPosition, setYPosition] = useState(50);
  const [signatureWidth, setSignatureWidth] = useState(200);

  // Interactive placement (default to true for freestyle positioning)
  const [interactivePlacement, setInteractivePlacement] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0 });

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
    originalSize: number;
  } | null>(null);

  // Load saved signatures on mount
  useState(() => {
    try {
      const saved = localStorage.getItem(SIGNATURE_STORAGE_KEY);
      if (saved) {
        const signatures = JSON.parse(saved);
        setSavedSignatures(signatures.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        })));
      }
    } catch (error) {
      console.error('Failed to load saved signatures:', error);
    }
  });

  const handleSaveSignature = useCallback(() => {
    if (!currentSignature || !signatureName.trim()) {
      alert('Please draw a signature and provide a name');
      return;
    }

    const newSignature: SavedSignature = {
      id: `sig_${Date.now()}`,
      name: signatureName.trim(),
      dataUrl: currentSignature,
      createdAt: new Date(),
    };

    const updated = [...savedSignatures, newSignature];
    setSavedSignatures(updated);

    try {
      localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(updated));
      setSignatureName('');
      alert('Signature saved successfully!');
    } catch (error) {
      console.error('Failed to save signature:', error);
      alert('Failed to save signature');
    }
  }, [currentSignature, signatureName, savedSignatures]);

  const handleDeleteSignature = useCallback((id: string) => {
    const updated = savedSignatures.filter(s => s.id !== id);
    setSavedSignatures(updated);

    try {
      localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete signature:', error);
    }
  }, [savedSignatures]);

  const handleUploadSignature = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCurrentSignature(dataUrl);
      setActiveTab('upload');
    };
    reader.readAsDataURL(file);
  }, []);

  // Render PDF preview for interactive placement
  useEffect(() => {
    if (!interactivePlacement || !selectedFile) {
      if (pdfPreviewUrl && pdfPreviewUrl !== 'preview-ready') {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      setPdfPreviewUrl(null);
      return;
    }

    const loadPDFPreview = async () => {
      try {
        const file = useEditorStore.getState().files.get(selectedFile);
        if (!file) return;

        const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });

        // Create a blob URL for the PDF to display in iframe
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      } catch (error) {
        console.error('Failed to load PDF preview:', error);
      }
    };

    loadPDFPreview();

    return () => {
      if (pdfPreviewUrl && pdfPreviewUrl !== 'preview-ready') {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [interactivePlacement, selectedFile, pageNumber]);

  const handleContainerClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactivePlacement || isResizing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Scale to PDF coordinates (assuming A4-ish size: 595x842 points)
    const scaleX = 595 / rect.width;
    const scaleY = 842 / rect.height;

    setXPosition(Math.round(x * scaleX));
    setYPosition(Math.round(y * scaleY));
  }, [interactivePlacement, isResizing]);

  const handleResizeStart = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: event.clientX,
      y: event.clientY,
      width: signatureWidth,
    });
  }, [signatureWidth]);

  const handleResizeMove = useCallback((event: React.MouseEvent) => {
    if (!isResizing) return;

    const deltaX = event.clientX - resizeStart.x;
    const newWidth = Math.max(50, Math.min(500, resizeStart.width + deltaX));
    setSignatureWidth(newWidth);
  }, [isResizing, resizeStart]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleAddSignatureToPDF = useCallback(async () => {
    if (!selectedFile || !currentSignature) {
      alert('Please select a PDF and create/select a signature');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });
      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Get the page
      const pages = pdfDoc.getPages();
      const pageIndex = pageNumber - 1;

      if (pageIndex < 0 || pageIndex >= pages.length) {
        alert(`Page ${pageNumber} does not exist. PDF has ${pages.length} pages.`);
        return;
      }

      const page = pages[pageIndex];
      if (!page) {
        alert('Failed to get page');
        return;
      }

      // Embed the signature image
      const imageBytes = await fetch(currentSignature).then(res => res.arrayBuffer());
      let image;

      try {
        if (currentSignature.startsWith('data:image/png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }
      } catch (error) {
        console.error('Failed to embed image:', error);
        alert('Failed to embed signature image. Please try a different format.');
        return;
      }

      // Calculate dimensions
      const imgDims = image.scale(signatureWidth / image.width);

      // Add signature to page
      page.drawImage(image, {
        x: xPosition,
        y: page.getHeight() - yPosition - imgDims.height,
        width: imgDims.width,
        height: imgDims.height,
      });

      // Save the signed PDF
      const pdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

      // Show preview instead of immediate download
      const url = URL.createObjectURL(signedBlob);
      const fileName = `${file.name.replace('.pdf', '')}_signed.pdf`;

      setPreviewData({
        url,
        blob: signedBlob,
        fileName,
        originalSize: blob.size,
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Error adding signature:', error);
      alert('Failed to add signature to PDF');
    }
  }, [selectedFile, currentSignature, pageNumber, xPosition, yPosition, signatureWidth]);

  const handleConfirmDownload = useCallback(() => {
    if (!previewData) return;

    const a = document.createElement('a');
    a.href = previewData.url;
    a.download = previewData.fileName;
    a.click();
    URL.revokeObjectURL(previewData.url);

    setPreviewData(null);
  }, [previewData]);

  if (files.length === 0) {
    return (
      <div className="workspace-card">
        <div className="text-center py-8">
          <p className="text-sm text-secondary-600">
            Upload PDF files to add signatures
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-secondary-900">
          E-Signature Tools
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-secondary-200">
        {[
          { id: 'draw', label: 'Draw', icon: '✍️' },
          { id: 'upload', label: 'Upload', icon: '📤' },
          { id: 'saved', label: 'Saved', icon: '💾' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-700 border-b-2 border-cyan-600'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Signature Creation */}
        <div className="space-y-4">
          {activeTab === 'draw' && (
            <>
              <h3 className="text-sm font-medium text-secondary-700">Draw Signature</h3>
              <SignaturePadComponent onSignatureChange={setCurrentSignature} />

              {currentSignature && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Signature name (e.g., 'John Doe')"
                    className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveSignature}
                    className="btn-secondary w-full text-sm"
                  >
                    💾 Save Signature
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'upload' && (
            <>
              <h3 className="text-sm font-medium text-secondary-700">Upload Signature Image</h3>
              <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadSignature}
                  className="hidden"
                  id="signature-upload"
                />
                <label
                  htmlFor="signature-upload"
                  className="cursor-pointer inline-block"
                >
                  <div className="text-4xl mb-2">📤</div>
                  <p className="text-sm text-secondary-600 mb-2">
                    Click to upload signature image
                  </p>
                  <p className="text-xs text-secondary-500">
                    PNG, JPG (transparent background recommended)
                  </p>
                </label>
              </div>

              {currentSignature && (
                <div className="border border-secondary-200 rounded-lg p-4 bg-white">
                  <p className="text-xs text-secondary-600 mb-2">Preview:</p>
                  <img
                    src={currentSignature}
                    alt="Signature preview"
                    className="max-h-24 mx-auto"
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              <h3 className="text-sm font-medium text-secondary-700">Saved Signatures</h3>
              {savedSignatures.length === 0 ? (
                <div className="text-center py-8 border border-secondary-200 rounded-lg">
                  <p className="text-sm text-secondary-500">No saved signatures yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedSignatures.map((sig) => (
                    <div
                      key={sig.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        currentSignature === sig.dataUrl
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-secondary-200 hover:border-cyan-300'
                      }`}
                      onClick={() => setCurrentSignature(sig.dataUrl)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={sig.dataUrl}
                          alt={sig.name}
                          className="h-12 w-auto"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-900 truncate">
                            {sig.name}
                          </p>
                          <p className="text-xs text-secondary-500">
                            {new Date(sig.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSignature(sig.id);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* PDF Placement Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-secondary-700">Place Signature on PDF</h3>

          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Select PDF File
            </label>
            <select
              value={selectedFile || ''}
              onChange={(e) => setSelectedFile(e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">-- Select a PDF --</option>
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Placement Toggle */}
          <button
            onClick={() => setInteractivePlacement(!interactivePlacement)}
            disabled={!selectedFile || !currentSignature}
            className="btn-secondary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {interactivePlacement ? '📐 Manual Position' : '🎯 Click to Place'}
          </button>

          {interactivePlacement && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-secondary-700 mb-2">
                    Page Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-secondary-700 mb-2">
                    Signature Width (px)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="500"
                    value={signatureWidth}
                    onChange={(e) => setSignatureWidth(parseInt(e.target.value) || 200)}
                    className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {interactivePlacement && pdfPreviewUrl && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-secondary-200 bg-secondary-50">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-secondary-900">
                      Position Your Signature - Page {pageNumber}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPageNumber(Math.max(1, pageNumber - 1));
                        }}
                        className="px-3 py-1 text-xs bg-secondary-200 hover:bg-secondary-300 rounded"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPageNumber(pageNumber + 1);
                        }}
                        className="px-3 py-1 text-xs bg-secondary-200 hover:bg-secondary-300 rounded"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setInteractivePlacement(false)}
                    className="text-secondary-500 hover:text-secondary-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* PDF Preview Area */}
                <div
                  ref={previewContainerRef}
                  onClick={handleContainerClick}
                  onMouseMove={handleResizeMove}
                  onMouseUp={handleResizeEnd}
                  onMouseLeave={handleResizeEnd}
                  className="relative flex-1 cursor-crosshair overflow-auto bg-secondary-100"
                >
                  {/* PDF Preview */}
                  <iframe
                    src={`${pdfPreviewUrl}#page=${pageNumber}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full pointer-events-none"
                    title="PDF Preview"
                  />

                  {/* Signature preview overlay at clicked position */}
                  {currentSignature && xPosition > 0 && yPosition > 0 && (
                    <div
                      className="absolute z-10 group"
                      style={{
                        left: `${(xPosition / 595) * 100}%`,
                        top: `${(yPosition / 842) * 100}%`,
                        width: `${(signatureWidth / 595) * 100}%`,
                        pointerEvents: 'auto',
                      }}
                    >
                      <img
                        src={currentSignature}
                        alt="Signature preview"
                        className="w-full opacity-90 shadow-lg"
                        style={{ mixBlendMode: 'multiply' }}
                      />
                      {/* Resize Handle */}
                      <div
                        onMouseDown={handleResizeStart}
                        className="absolute -right-2 -bottom-2 w-6 h-6 bg-cyan-500 border-2 border-white rounded-full cursor-nwse-resize shadow-lg hover:bg-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                          ⇲
                        </div>
                      </div>
                      {/* Border to show selection */}
                      <div className="absolute inset-0 border-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  )}

                  {/* Click instruction overlay */}
                  {(!xPosition || xPosition === 50) && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-cyan-600 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-lg pointer-events-none z-20">
                      Click anywhere on the PDF to place your signature
                    </div>
                  )}
                </div>

                {/* Footer with controls */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-secondary-200 bg-secondary-50">
                  <div className="text-xs text-secondary-600">
                    Position: X={xPosition}px, Y={yPosition}px, Width={signatureWidth}px
                  </div>
                  <button
                    onClick={() => setInteractivePlacement(false)}
                    className="btn-primary px-6 py-2"
                  >
                    Done Positioning
                  </button>
                </div>
              </div>
            </div>
          )}

          {!interactivePlacement && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Page Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={signatureWidth}
                  onChange={(e) => setSignatureWidth(parseInt(e.target.value) || 200)}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  X Position (px)
                </label>
                <input
                  type="number"
                  min="0"
                  value={xPosition}
                  onChange={(e) => setXPosition(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-2">
                  Y Position (px)
                </label>
                <input
                  type="number"
                  min="0"
                  value={yPosition}
                  onChange={(e) => setYPosition(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {currentSignature && !interactivePlacement && (
            <div className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
              <p className="text-xs text-secondary-600 mb-2">Signature Preview:</p>
              <img
                src={currentSignature}
                alt="Selected signature"
                className="max-h-20 mx-auto bg-white border border-secondary-200 rounded p-2"
              />
            </div>
          )}

          <button
            onClick={handleAddSignatureToPDF}
            disabled={!selectedFile || !currentSignature}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✍️ Add Signature to PDF
          </button>

          <p className="text-xs text-secondary-500">
            💡 Tip: Signatures are saved locally in your browser and never uploaded to any server.
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          if (previewData) {
            URL.revokeObjectURL(previewData.url);
            setPreviewData(null);
          }
        }}
        onConfirm={handleConfirmDownload}
        title="Preview Signed PDF"
        previewUrl={previewData?.url || null}
        fileType="pdf"
        originalSize={previewData?.originalSize}
        newSize={previewData?.blob.size}
        newFileName={previewData?.fileName}
      />
    </div>
  );
}
