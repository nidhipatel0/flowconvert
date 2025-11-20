'use client';

import { useState, useEffect } from 'react';
import { Settings } from './Settings';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/themeStore';

// Import the applyThemeToDOM function (we need to export it from themeStore)
// For now, we'll re-apply the theme by calling setTheme with current theme ID

export function WorkspaceHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Initialize light mode state on mount
  useEffect(() => {
    const root = document.documentElement;
    setIsLightMode(root.classList.contains('light'));
  }, []);

  const { currentTheme, setTheme } = useThemeStore();
  
  const toggleTheme = () => {
    // Toggle light/dark mode
    const root = document.documentElement;
    
    if (root.classList.contains('light')) {
      root.classList.remove('light');
      setIsLightMode(false);
    } else {
      root.classList.add('light');
      setIsLightMode(true);
    }
    
    // Re-apply theme to ensure light/dark variants are properly applied
    // The CSS classes will automatically use the correct variant based on .light class
    setTheme(currentTheme.id);
  };

  return (
    <>
      <footer 
        className="w-full border-t backdrop-blur-xl"
        style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
        }}
      >
        <div className="px-6 py-3 flex items-center justify-between gap-8">
          {/* Left: Branding and Tagline */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text)' }}>FlowConvert</h1>
                <p className="text-xs" style={{ color: 'var(--color-accent)' }}>Your files never leave your computer</p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            <button
            onClick={toggleTheme}
            className="btn-secondary text-sm py-2 px-4"
            title="Toggle light/dark mode"
            aria-label="Toggle theme"
          >
            {isLightMode ? (
              <Moon size={16} className="mr-1" />
            ) : (
              <Sun size={16} className="mr-1" />
            )}
            {isLightMode ? 'Dark' : 'Light'}
          </button>

          <button
            className="btn-secondary text-sm py-2 px-4"
            title="Open settings"
            onClick={() => setIsSettingsOpen(true)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>

          <button
            className="btn-secondary text-sm py-2 px-4"
            title="Get help and support"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Help
          </button>

          <button
            className="btn-primary text-sm py-2 px-4"
            title="Upload files to convert, compress, or edit"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload Files
          </button>
        </div>
      </div>
      </footer>

      {/* Settings Modal */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
