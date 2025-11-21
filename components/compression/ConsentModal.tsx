/**
 * Consent modal for server-side compression
 * Shows privacy information before uploading to server
 */

'use client';

import React, { useState } from 'react';
import { useCompressionStore } from '@/lib/stores/compression-store';

export function ConsentModal(): JSX.Element | null {
  const { showConsentModal, hideConsentModal, giveServerConsent } = useCompressionStore();
  const [privacyPolicyRead, setPrivacyPolicyRead] = useState(false);

  if (!showConsentModal) {
    return null;
  }

  const handleConsent = () => {
    giveServerConsent({
      consentGiven: true,
      consentTimestamp: Date.now(),
      privacyPolicyRead,
      encryptionUnderstood: true,
    });
  };

  const handleCancel = () => {
    hideConsentModal();
    setPrivacyPolicyRead(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 border-b border-border">
          <div className="flex items-start gap-3">
            <span className="text-3xl" role="img" aria-label="Warning">
              ⚠️
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Server Processing Required
              </h2>
              <p className="text-sm text-muted-foreground">
                This file requires server-side compression for best results.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Privacy features */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xl flex-shrink-0">🔒</span>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">
                  AES-256 Encryption
                </h4>
                <p className="text-xs text-muted-foreground">
                  Your file will be encrypted before upload using military-grade encryption.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xl flex-shrink-0">⏱️</span>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">
                  Auto-Delete in 5 Minutes
                </h4>
                <p className="text-xs text-muted-foreground">
                  Files are automatically deleted from our servers within 5 minutes of processing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xl flex-shrink-0">🚫</span>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">
                  No File Content Logging
                </h4>
                <p className="text-xs text-muted-foreground">
                  We never log file contents or filenames. Only metadata like file size and duration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-xl flex-shrink-0">🌐</span>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">
                  Secure HTTPS Connection
                </h4>
                <p className="text-xs text-muted-foreground">
                  All transfers use TLS 1.3 encryption with perfect forward secrecy.
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={privacyPolicyRead}
              onChange={(e) => setPrivacyPolicyRead(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              I understand and accept the privacy policy
            </span>
          </label>

          {/* Learn more link */}
          <div className="text-center">
            <a
              href="#"
              className="text-xs text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Open privacy policy modal or page
              }}
            >
              View Full Privacy Policy →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConsent}
            disabled={!privacyPolicyRead}
            className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue Securely
          </button>
        </div>
      </div>
    </div>
  );
}
