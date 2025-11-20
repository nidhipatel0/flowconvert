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

interface PDFCropStore {
  // Per-page crop areas (page number -> crop area)
  pageCropAreas: Map<number, CropArea>;
  currentPage: number;
  totalPages: number;
  selectedRatio: AspectRatioPreset;
  isProcessing: boolean;
  applyToAllPages: boolean;

  // Actions
  setPageCropArea: (page: number, crop: CropArea) => void;
  getCurrentCropArea: () => CropArea;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setSelectedRatio: (preset: AspectRatioPreset) => void;
  setIsProcessing: (processing: boolean) => void;
  setApplyToAllPages: (apply: boolean) => void;
  reset: () => void;
}

const DEFAULT_CROP: CropArea = {
  x: 50,
  y: 50,
  width: 500,
  height: 700,
};

export const usePDFCropStore = create<PDFCropStore>((set, get) => ({
  pageCropAreas: new Map(),
  currentPage: 1,
  totalPages: 0,
  selectedRatio: ASPECT_RATIO_PRESETS[0]!,
  isProcessing: false,
  applyToAllPages: false,

  setPageCropArea: (page, crop) => set((state) => {
    const newMap = new Map(state.pageCropAreas);
    newMap.set(page, crop);
    return { pageCropAreas: newMap };
  }),

  getCurrentCropArea: () => {
    const state = get();
    return state.pageCropAreas.get(state.currentPage) || DEFAULT_CROP;
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  setSelectedRatio: (selectedRatio) => set({ selectedRatio }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setApplyToAllPages: (applyToAllPages) => set({ applyToAllPages }),

  reset: () => set({
    pageCropAreas: new Map(),
    currentPage: 1,
    totalPages: 0,
    selectedRatio: ASPECT_RATIO_PRESETS[0]!,
    isProcessing: false,
    applyToAllPages: false,
  }),
}));
