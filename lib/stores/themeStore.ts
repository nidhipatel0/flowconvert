import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
}

export const PRESET_THEMES: Theme[] = [
  {
    id: 'elegant-blue',
    name: 'Elegant Blue',
    description: 'Professional blue theme',
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#60a5fa',
      background: '#1e3a8a',
      surface: '#1e3a8a',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Luxurious purple theme',
    colors: {
      primary: '#a855f7',
      secondary: '#7c3aed',
      accent: '#d8b4fe',
      background: '#581c87',
      surface: '#6b21a8',
    },
  },
  {
    id: 'professional-emerald',
    name: 'Professional Emerald',
    description: 'Calm and professional emerald theme',
    colors: {
      primary: '#14b8a6',
      secondary: '#0d9488',
      accent: '#2dd4bf',
      background: '#0d3333',
      surface: '#0f3d3d',
    },
  },
  {
    id: 'corporate-slate',
    name: 'Corporate Slate',
    description: 'Professional slate theme',
    colors: {
      primary: '#64748b',
      secondary: '#475569',
      accent: '#cbd5e1',
      background: '#1e293b',
      surface: '#334155',
    },
  },
];

interface ThemeState {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  applyTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: PRESET_THEMES[0]!, // Default to Elegant Blue (matches CSS default)

  setTheme: (themeId: string) => {
    const theme = PRESET_THEMES.find((t) => t.id === themeId);
    if (theme) {
      set({ currentTheme: theme });
      // Apply theme immediately
      if (typeof window !== 'undefined') {
        applyThemeToDOM(theme);
      }
    }
  },

      applyTheme: (theme: Theme) => {
        set({ currentTheme: theme });
        applyThemeToDOM(theme);
      },
    }),
    {
      name: 'flowconvert-theme',
    }
  )
);

// Map old theme IDs to new data-theme values
const THEME_ID_MAP: Record<string, string> = {
  'elegant-blue': '', // Default, no data-theme needed
  'royal-purple': 'purple',
  'professional-emerald': 'emerald',
  'corporate-slate': 'slate',
  'ocean-deep': '', // Map to default for now
};

// Apply theme to DOM by setting data-theme attribute
export function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;

  // Remove all data-theme attributes first
  PRESET_THEMES.forEach((t) => {
    const dataTheme = THEME_ID_MAP[t.id] || '';
    if (dataTheme) {
      root.removeAttribute('data-theme');
    }
  });

  // Set data-theme attribute (empty string means default/blue theme)
  const dataTheme = THEME_ID_MAP[theme.id] || '';
  if (dataTheme) {
    root.setAttribute('data-theme', dataTheme);
  } else {
    root.removeAttribute('data-theme');
  }

  // Update legacy color variables for compatibility
  // Extract RGB values from HSL for rgba() usage
  const primaryRgb = hexToRgb(theme.colors.primary);
  if (primaryRgb) {
    root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('flowconvert-theme');
  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme);
      if (parsed.state?.currentTheme) {
        applyThemeToDOM(parsed.state.currentTheme);
      }
    } catch (e) {
      // Ignore parse errors
    }
  } else {
    // Apply default theme (Elegant Blue)
    applyThemeToDOM(PRESET_THEMES[0]!);
  }
}
