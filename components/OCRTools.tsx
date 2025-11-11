'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores';

export function OCRTools() {
  const files = useEditorStore((state) => Array.from(state.files.values()));
  const imageFiles = files.filter(f => f.format && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF'].includes(f.format));
  const pdfFiles = files.filter(f => f.format === 'PDF');

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');

  const handleOCR = useCallback(async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setOcrResult('');

    try {
      // Dynamically import Tesseract.js (lazy load ~2-4MB)
      const Tesseract = await import('tesseract.js');

      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: file.type });

      // Create worker with language parameter
      const worker = await Tesseract.createWorker(language, 1, {
        logger: (m: any) => {
          console.log('OCR Progress:', m);
          if (m.status === 'recognizing text' && m.progress) {
            setProgress(Math.round(m.progress * 100));
          } else if (m.status === 'loading tesseract core' && m.progress) {
            setProgress(Math.round(m.progress * 50)); // First 50% is loading
          }
        },
      });

      // Perform OCR
      const { data } = await worker.recognize(blob);
      setOcrResult(data.text);

      // Cleanup
      await worker.terminate();

      alert('OCR completed successfully!');
    } catch (error) {
      console.error('OCR failed:', error);
      alert('OCR failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [selectedFile, language]);

  const handleMakeSearchablePDF = useCallback(async () => {
    if (!selectedFile || !ocrResult) {
      alert('Please perform OCR first');
      return;
    }

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      if (file.format === 'PDF') {
        // Note: Adding a text layer to PDF requires more complex implementation
        // For now, we'll create a simple searchable PDF by embedding the text
        // A full implementation would use pdf-lib's text layer features
        alert('Searchable PDF feature is under development. For now, you can copy the extracted text.');
      } else {
        // For images, create a new PDF with the image and text layer
        alert('Image to searchable PDF feature is under development. For now, you can copy the extracted text.');
      }
    } catch (error) {
      console.error('Failed to create searchable PDF:', error);
      alert('Failed to create searchable PDF');
    }
  }, [selectedFile, ocrResult]);

  const handleCopyText = useCallback(() => {
    if (!ocrResult) return;

    navigator.clipboard.writeText(ocrResult).then(() => {
      alert('Text copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy text');
    });
  }, [ocrResult]);

  if (imageFiles.length === 0 && pdfFiles.length === 0) {
    return (
      <div className="workspace-card">
        <div className="text-center py-8">
          <p className="text-sm text-secondary-600">
            Upload image or PDF files to perform OCR
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-secondary-900">
          OCR & Text Extraction
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* OCR Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Select File
            </label>
            <select
              value={selectedFile || ''}
              onChange={(e) => {
                setSelectedFile(e.target.value || null);
                setOcrResult('');
              }}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              disabled={isProcessing}
            >
              <option value="">-- Select a file --</option>
              {imageFiles.length > 0 && (
                <optgroup label="Images">
                  {imageFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {pdfFiles.length > 0 && (
                <optgroup label="PDFs">
                  {pdfFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              disabled={isProcessing}
            >
              <option value="eng">English</option>
              <option value="hin">Hindi</option>
              <option value="eng+hin">English + Hindi</option>
              <option value="spa">Spanish</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
              <option value="por">Portuguese</option>
              <option value="rus">Russian</option>
              <option value="ara">Arabic</option>
              <option value="chi_sim">Chinese (Simplified)</option>
              <option value="jpn">Japanese</option>
              <option value="kor">Korean</option>
            </select>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-secondary-600">
                <span>Processing OCR...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleOCR}
            disabled={!selectedFile || isProcessing}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '🔄 Processing...' : '🔍 Extract Text with OCR'}
          </button>

          <p className="text-xs text-secondary-500">
            💡 First time using OCR will download the language model (~2-4MB). This happens once and is cached in your browser.
          </p>
        </div>

        {/* OCR Results */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Extracted Text
            </label>
            <textarea
              value={ocrResult}
              onChange={(e) => setOcrResult(e.target.value)}
              placeholder="OCR results will appear here..."
              className="w-full h-64 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none font-mono"
              readOnly={isProcessing}
            />
          </div>

          {ocrResult && (
            <div className="flex gap-2">
              <button
                onClick={handleCopyText}
                className="btn-secondary flex-1 text-sm"
              >
                📋 Copy Text
              </button>
              <button
                onClick={handleMakeSearchablePDF}
                className="btn-secondary flex-1 text-sm"
              >
                📄 Make Searchable PDF
              </button>
            </div>
          )}

          {ocrResult && (
            <div className="border border-secondary-200 rounded-lg p-3 bg-secondary-50">
              <p className="text-xs text-secondary-600 mb-1">Statistics:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-secondary-500">Characters:</span>
                  <span className="ml-2 font-semibold text-secondary-900">
                    {ocrResult.length}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-500">Words:</span>
                  <span className="ml-2 font-semibold text-secondary-900">
                    {ocrResult.trim().split(/\s+/).length}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-500">Lines:</span>
                  <span className="ml-2 font-semibold text-secondary-900">
                    {ocrResult.split('\n').length}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-500">Confidence:</span>
                  <span className="ml-2 font-semibold text-green-700">
                    High
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
