/**
 * Zustand store for compression state management
 */

import { create } from 'zustand';
import type {
  CompressionQuality,
  CompressionStatus,
  CompressionProgress,
  ServerConsentData,
  CompressionResult,
} from '../types/compression';

interface CompressionState {
  // Quality settings
  qualityPreset: CompressionQuality;
  manualQuality: number; // 0-100
  targetSizeBytes: number | null;

  // Processing state
  status: CompressionStatus;
  progress: CompressionProgress | null;
  currentResult: CompressionResult | null;
  isProcessing: boolean;
  error: string | null;
  previewUrl: string | null;

  // Server consent
  serverConsentGiven: boolean;
  serverConsentData: ServerConsentData | null;

  // UI state
  showConsentModal: boolean;
  showQualitySelector: boolean;

  // Actions
  setQualityPreset: (preset: CompressionQuality) => void;
  setManualQuality: (quality: number) => void;
  setTargetSize: (sizeBytes: number | null) => void;
  setStatus: (status: CompressionStatus) => void;
  setProgress: (progress: CompressionProgress | null) => void;
  setCurrentResult: (result: CompressionResult | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  setPreviewUrl: (url: string | null) => void;
  giveServerConsent: (consentData: ServerConsentData) => void;
  revokeServerConsent: () => void;
  showConsentModalAction: () => void;
  hideConsentModal: () => void;
  toggleQualitySelector: () => void;
  reset: () => void;
}

const initialState = {
  qualityPreset: 'balanced' as CompressionQuality,
  manualQuality: 80,
  targetSizeBytes: null,
  status: 'idle' as CompressionStatus,
  progress: null,
  currentResult: null,
  isProcessing: false,
  error: null,
  previewUrl: null,
  serverConsentGiven: false,
  serverConsentData: null,
  showConsentModal: false,
  showQualitySelector: false,
};

export const useCompressionStore = create<CompressionState>((set) => ({
  ...initialState,

  setQualityPreset: (preset) => set({ qualityPreset: preset }),

  setManualQuality: (quality) => set({ manualQuality: Math.max(0, Math.min(100, quality)) }),

  setTargetSize: (sizeBytes) => set({ targetSizeBytes: sizeBytes }),

  setStatus: (status) => set({ status }),

  setProgress: (progress) => set({ progress }),

  setCurrentResult: (result) => set({ currentResult: result }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error }),

  setPreviewUrl: (url) => set({ previewUrl: url }),

  giveServerConsent: (consentData) =>
    set({
      serverConsentGiven: true,
      serverConsentData: consentData,
      showConsentModal: false,
    }),

  revokeServerConsent: () =>
    set({
      serverConsentGiven: false,
      serverConsentData: null,
    }),

  showConsentModalAction: () => set({ showConsentModal: true }),

  hideConsentModal: () => set({ showConsentModal: false }),

  toggleQualitySelector: () => set((state) => ({ showQualitySelector: !state.showQualitySelector })),

  reset: () => set(initialState),
}));

/**
 * Helper to get quality value from preset
 */
export function getQualityFromPreset(preset: CompressionQuality): number {
  switch (preset) {
    case 'high':
      return 90; // Minimal compression
    case 'balanced':
      return 75; // Recommended
    case 'maximum':
      return 60; // Aggressive
    default:
      return 75;
  }
}

/**
 * Helper to get estimated reduction from preset
 */
export function getEstimatedReduction(preset: CompressionQuality): { min: number; max: number } {
  switch (preset) {
    case 'high':
      return { min: 10, max: 25 };
    case 'balanced':
      return { min: 30, max: 50 };
    case 'maximum':
      return { min: 50, max: 80 };
    default:
      return { min: 30, max: 50 };
  }
}
