'use client';

import { useState, useEffect } from 'react';
import { SignatureModal, SignatureData } from './SignatureModal';
import { PenTool, Download, Eye, X } from 'lucide-react';

interface ESignatureSidebarProps {
  onSignatureCreate: (signature: SignatureData) => void;
}

export function ESignatureSidebar({ onSignatureCreate }: ESignatureSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [placedSignaturesCount, setPlacedSignaturesCount] = useState(0);

  // Load signatures from localStorage on mount
  useEffect(() => {
    const savedSignatures = localStorage.getItem('esignature-signatures');
    if (savedSignatures) {
      try {
        const parsed = JSON.parse(savedSignatures);
        setSignatures(parsed);
      } catch (e) {
        console.error('Error loading signatures:', e);
      }
    }
  }, []);

  // Listen for placed signatures count updates from workspace
  useEffect(() => {
    const handlePlacedCountUpdate = ((e: CustomEvent<number>) => {
      setPlacedSignaturesCount(e.detail);
    }) as EventListener;

    window.addEventListener('placed-signatures-count', handlePlacedCountUpdate);
    return () => window.removeEventListener('placed-signatures-count', handlePlacedCountUpdate);
  }, []);

  // Save signatures to localStorage whenever they change
  useEffect(() => {
    if (signatures.length > 0) {
      localStorage.setItem('esignature-signatures', JSON.stringify(signatures));
    }
  }, [signatures]);

  const handleSignatureCreate = (signature: SignatureData) => {
    const updatedSignatures = [...signatures, signature];
    setSignatures(updatedSignatures);
    onSignatureCreate(signature);

    // Dispatch event for workspace to receive
    window.dispatchEvent(new CustomEvent('signature-created', { detail: signature }));
  };

  const handleSelectSignature = (signature: SignatureData) => {
    // Dispatch event to place this signature
    window.dispatchEvent(new CustomEvent('signature-selected', { detail: signature }));
  };

  const handleDeleteSignature = (signatureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSignatures = signatures.filter(sig => sig.id !== signatureId);
    setSignatures(updatedSignatures);
    if (updatedSignatures.length > 0) {
      localStorage.setItem('esignature-signatures', JSON.stringify(updatedSignatures));
    } else {
      localStorage.removeItem('esignature-signatures');
    }
  };

  const handleDownload = () => {
    // This will be handled by the workspace
    const event = new CustomEvent('download-signed-pdf');
    window.dispatchEvent(event);
  };

  const handlePreview = () => {
    // This will be handled by the workspace
    const event = new CustomEvent('preview-signed-pdf');
    window.dispatchEvent(event);
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Upload Signature Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all hover:scale-105"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        }}
      >
        <PenTool size={20} />
        Create Signature
      </button>

      {/* Signatures List */}
      {signatures.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Your Signatures ({signatures.length})
          </h3>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto scrollbar-hide">
            {signatures.map((signature) => (
              <div
                key={signature.id}
                onClick={() => handleSelectSignature(signature)}
                className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)',
                  borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
                }}
                title="Click to place on PDF"
              >
                <img
                  src={signature.dataUrl}
                  alt={signature.name}
                  className="w-12 h-12 object-contain bg-white rounded border"
                  style={{ borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                    {signature.name}
                  </p>
                  <p className="text-[10px] capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {signature.type}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteSignature(signature.id, e)}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                  title="Delete signature"
                >
                  <X size={14} style={{ color: 'rgb(239, 68, 68)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Button */}
      <button
        onClick={handlePreview}
        disabled={placedSignaturesCount === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
        style={{
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
          color: 'hsl(var(--foreground))',
        }}
      >
        <Eye size={18} />
        Preview
      </button>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={placedSignaturesCount === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
        style={{
          backgroundColor: placedSignaturesCount > 0 ? 'hsl(var(--primary))' : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
          color: placedSignaturesCount > 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
        }}
      >
        <Download size={18} />
        Download Signed PDF
      </button>

      {/* Instructions */}
      <div
        className="p-3 rounded-lg text-xs"
        style={{
          backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        💡 Create a signature, then click on it in the list above to place it on any page of the PDF.
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSignatureCreate={handleSignatureCreate}
      />
    </div>
  );
}
