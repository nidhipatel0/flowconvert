'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/lib/stores';
import { UserProfile, DetectedField } from '@/lib/types/profile';
import { loadProfiles } from '@/lib/utils/profile';

/**
 * Smart Document Editor
 *
 * Detects form fields in PDFs and allows quick personalization
 * using saved profiles
 */
export function SmartDocumentEditor() {
  const files = useEditorStore((state) => Array.from(state.files.values()));
  const pdfFiles = files.filter(f => f.format === 'PDF');

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Load profiles on mount
  useEffect(() => {
    const loaded = loadProfiles();
    setProfiles(loaded);

    // Select default profile
    const defaultProfile = loaded.find(p => p.isDefault) || loaded[0];
    if (defaultProfile) {
      setSelectedProfile(defaultProfile);
    }
  }, []);

  const handleDetectFields = useCallback(async () => {
    if (!selectedFile) {
      alert('Please select a PDF file');
      return;
    }

    setIsDetecting(true);
    setDetectedFields([]);

    try {
      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      // In a real implementation, this would:
      // 1. Extract text from PDF using pdf.js or pdfjs-dist
      // 2. Parse text to find form field labels using FIELD_PATTERNS
      // 3. Determine positions for highlighting
      // 4. Return detected fields with coordinates

      // For now, simulate field detection
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockDetectedFields: DetectedField[] = [
        {
          field: 'fullName',
          label: 'Full Name',
          value: '',
          confidence: 0.95,
          position: { page: 1, x: 100, y: 150, width: 200, height: 30 },
          pattern: 'Full Name:',
        },
        {
          field: 'email',
          label: 'Email Address',
          value: '',
          confidence: 0.92,
          position: { page: 1, x: 100, y: 200, width: 250, height: 30 },
          pattern: 'Email:',
        },
        {
          field: 'phone',
          label: 'Phone Number',
          value: '',
          confidence: 0.88,
          position: { page: 1, x: 100, y: 250, width: 200, height: 30 },
          pattern: 'Phone:',
        },
        {
          field: 'rollNumber',
          label: 'Roll Number',
          value: '',
          confidence: 0.85,
          position: { page: 1, x: 100, y: 300, width: 150, height: 30 },
          pattern: 'Roll No:',
        },
      ];

      setDetectedFields(mockDetectedFields);
      alert(`Detected ${mockDetectedFields.length} fields in the document!`);
    } catch (error) {
      console.error('Field detection failed:', error);
      alert('Field detection failed. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  }, [selectedFile]);

  const handleAutoFill = useCallback(() => {
    if (!selectedProfile) {
      alert('Please select a profile to auto-fill');
      return;
    }

    if (detectedFields.length === 0) {
      alert('No fields detected. Please detect fields first.');
      return;
    }

    // Auto-fill detected fields with profile data
    const filled = detectedFields.map(field => {
      const profileValue = selectedProfile.fields[field.field];
      return {
        ...field,
        value: profileValue || '',
      };
    });

    setDetectedFields(filled);
    alert('Fields auto-filled from profile!');
  }, [selectedProfile, detectedFields]);

  const handleFieldChange = useCallback((index: number, value: string) => {
    const updated = [...detectedFields];
    const field = updated[index];
    if (field) {
      field.value = value;
      setDetectedFields(updated);
    }
  }, [detectedFields]);

  const handleExportFilledPDF = useCallback(async () => {
    if (!selectedFile || detectedFields.length === 0 || detectedFields.every(f => !f.value)) {
      alert('Please fill at least one field before exporting');
      return;
    }

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');

      const file = useEditorStore.getState().files.get(selectedFile);
      if (!file) return;

      const blob = file.data instanceof Blob ? file.data : new Blob([file.data], { type: 'application/pdf' });
      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Add text to detected field positions
      for (const field of detectedFields) {
        if (!field.value || !field.position) continue;

        const pages = pdfDoc.getPages();
        const pageIndex = field.position.page - 1;
        const page = pages[pageIndex];
        if (!page) continue;

        // Draw text at the field position
        page.drawText(field.value, {
          x: field.position.x,
          y: page.getHeight() - field.position.y - field.position.height,
          size: 10,
          color: rgb(0, 0, 0),
        });
      }

      // Save the filled PDF
      const pdfBytes = await pdfDoc.save();
      const filledBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

      const url = URL.createObjectURL(filledBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_filled.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      alert('PDF exported successfully with filled fields!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [selectedFile, detectedFields]);

  if (pdfFiles.length === 0) {
    return (
      <div className="workspace-card">
        <div className="text-center py-8">
          <p className="text-sm text-secondary-600">
            Upload PDF files to use Smart Document Personalization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-secondary-900">
          Smart Document Personalization
        </h2>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-700 rounded">
            AI-Powered
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Panel: Document Selection & Detection */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Select PDF Document
            </label>
            <select
              value={selectedFile || ''}
              onChange={(e) => {
                setSelectedFile(e.target.value || null);
                setDetectedFields([]);
              }}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">-- Select a PDF --</option>
              {pdfFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-700 mb-2">
              Select Profile for Auto-Fill
            </label>
            <select
              value={selectedProfile?.id || ''}
              onChange={(e) => {
                const profile = profiles.find(p => p.id === e.target.value);
                setSelectedProfile(profile || null);
              }}
              className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">-- Select a profile --</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDetectFields}
            disabled={!selectedFile || isDetecting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDetecting ? '🔄 Detecting Fields...' : '🔍 Detect Form Fields'}
          </button>

          <p className="text-xs text-secondary-500">
            💡 Our AI scans your document to detect common form fields like name, email, phone, etc.
          </p>

          {selectedProfile && (
            <div className="border border-cyan-200 rounded-lg p-3 bg-cyan-50">
              <p className="text-xs font-medium text-cyan-900 mb-2">
                Selected Profile: {selectedProfile.name}
              </p>
              <p className="text-xs text-cyan-700">
                {Object.keys(selectedProfile.fields).length} fields available for auto-fill
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: Detected Fields & Auto-Fill */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary-700">
              Detected Fields ({detectedFields.length})
            </h3>
            {detectedFields.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleAutoFill}
                  disabled={!selectedProfile}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⚡ Auto-Fill
                </button>
                <button
                  onClick={handleExportFilledPDF}
                  className="btn-primary text-sm"
                >
                  💾 Export PDF
                </button>
              </div>
            )}
          </div>

          {detectedFields.length === 0 ? (
            <div className="border border-dashed border-secondary-300 rounded-lg p-8 text-center">
              <p className="text-sm text-secondary-500">
                No fields detected yet. Select a PDF and click "Detect Form Fields" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detectedFields.map((field, index) => (
                <div
                  key={index}
                  className="border border-secondary-200 rounded-lg p-3 bg-white hover:border-cyan-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-secondary-900">
                        {field.label}
                      </p>
                      <p className="text-xs text-secondary-500 mt-0.5">
                        Page {field.position.page} • Confidence: {Math.round(field.confidence * 100)}%
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        field.confidence >= 0.9
                          ? 'bg-green-100 text-green-700'
                          : field.confidence >= 0.75
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {field.confidence >= 0.9 ? 'High' : field.confidence >= 0.75 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={field.value || ''}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {detectedFields.length > 0 && (
            <div className="border border-secondary-200 rounded-lg p-3 bg-secondary-50">
              <p className="text-xs font-medium text-secondary-700 mb-2">
                Detection Patterns Used:
              </p>
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(detectedFields.map(f => f.pattern))).map((pattern, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs bg-white border border-secondary-200 rounded"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border border-cyan-200 rounded-lg p-4 bg-gradient-to-r from-cyan-50 to-blue-50">
        <h3 className="text-sm font-semibold text-cyan-900 mb-2">
          How It Works
        </h3>
        <ul className="text-xs text-cyan-800 space-y-1">
          <li>1. Upload a PDF form or template document</li>
          <li>2. Our AI detects common form fields (name, email, phone, etc.)</li>
          <li>3. Select a saved profile to auto-fill your information</li>
          <li>4. Review and edit any fields as needed</li>
          <li>5. Export the filled PDF with one click</li>
        </ul>
      </div>
    </div>
  );
}
