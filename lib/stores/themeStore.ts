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
    id: 'turquoise',
    name: 'Turquoise Ocean',
    description: 'Fresh and professional turquoise theme',
    colors: {
      primary: '#06b6d4', // cyan-500
      secondary: '#0891b2', // cyan-600
      accent: '#3b82f6', // blue-500
      background: '#fafbfc',
      surface: '#ffffff',
    },
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    description: 'Classic and elegant blue theme',
    colors: {
      primary: '#2563eb', // blue-600
      secondary: '#1d4ed8', // blue-700
      accent: '#3b82f6', // blue-500
      background: '#f8fafc',
      surface: '#ffffff',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    description: 'Calm and sophisticated green theme',
    colors: {
      primary: '#10b981', // emerald-500
      secondary: '#059669', // emerald-600
      accent: '#14b8a6', // teal-500
      background: '#f0fdf4',
      surface: '#ffffff',
    },
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Luxurious and modern purple theme',
    colors: {
      primary: '#8b5cf6', // violet-500
      secondary: '#7c3aed', // violet-600
      accent: '#a855f7', // purple-500
      background: '#faf5ff',
      surface: '#ffffff',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Elegant dark theme for reduced eye strain',
    colors: {
      primary: '#06b6d4', // cyan-500
      secondary: '#0891b2', // cyan-600
      accent: '#3b82f6', // blue-500
      background: '#0f172a', // slate-900
      surface: '#1e293b', // slate-800
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
      currentTheme: PRESET_THEMES[0]!, // Default to turquoise

      setTheme: (themeId: string) => {
        const theme = PRESET_THEMES.find((t) => t.id === themeId);
        if (theme) {
          set({ currentTheme: theme });
          applyThemeToDOM(theme);
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

// Apply theme to DOM by setting CSS variables
function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;

  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-surface', theme.colors.surface);

  // Add dark mode class if using dark theme
  if (theme.id === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
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
    // Apply default theme
    applyThemeToDOM(PRESET_THEMES[0]!);
  }
}
