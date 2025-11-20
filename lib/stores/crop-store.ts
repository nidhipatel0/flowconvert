import { create } from 'zustand';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioPreset = {
  label: string;
  ratio: number | null; // null = free
  value: string;
};

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { label: 'Free', ratio: null, value: 'free' },
  { label: '1:1', ratio: 1, value: '1:1' },
  { label: '4:3', ratio: 4 / 3, value: '4:3' },
  { label: '16:9', ratio: 16 / 9, value: '16:9' },
  { label: '3:2', ratio: 3 / 2, value: '3:2' },
];

interface CropStore {
  cropArea: CropArea;
  selectedRatio: AspectRatioPreset;
  isProcessing: boolean;

  setCropArea: (crop: CropArea) => void;
  setSelectedRatio: (preset: AspectRatioPreset) => void;
  setIsProcessing: (processing: boolean) => void;
  reset: () => void;
}

export const useCropStore = create<CropStore>((set) => ({
  cropArea: {
    x: 50,
    y: 50,
    width: 300,
    height: 300,
  },
  selectedRatio: ASPECT_RATIO_PRESETS[0]!,
  isProcessing: false,

  setCropArea: (cropArea) => set({ cropArea }),
  setSelectedRatio: (selectedRatio) => set({ selectedRatio }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  reset: () => set({
    cropArea: { x: 50, y: 50, width: 300, height: 300 },
    selectedRatio: ASPECT_RATIO_PRESETS[0]!,
    isProcessing: false,
  }),
}));
