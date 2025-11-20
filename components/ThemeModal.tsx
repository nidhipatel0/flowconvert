'use client';

import { useThemeStore, PRESET_THEMES } from '@/lib/stores/themeStore';
import { Check, X } from 'lucide-react';
import { useEffect } from 'react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { currentTheme, setTheme } = useThemeStore();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Choose Color Theme
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors"
            style={{
              color: 'var(--color-text)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PRESET_THEMES.map((theme) => {
            const isActive = currentTheme.id === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200"
                style={{
                  backgroundColor: isActive
                    ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)'
                    : 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)',
                  border: isActive
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.05)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div
                    className="absolute right-3 top-3 rounded-full p-1"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Check size={16} style={{ color: 'var(--color-background)' }} />
                  </div>
                )}

                {/* Theme Name */}
                <h3
                  className="mb-2 text-lg font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  {theme.name}
                </h3>

                {/* Theme Description */}
                <p
                  className="mb-4 text-sm"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {theme.description}
                </p>

                {/* Color Preview Swatches */}
                <div className="flex gap-2">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="h-8 w-8 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: theme.colors.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="h-8 w-8 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: theme.colors.accent }}
                    title="Accent"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="mt-6 pt-4 text-center text-sm"
          style={{
            color: 'var(--color-accent)',
            borderTop: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)',
          }}
        >
          Press ESC to close
        </div>
      </div>
    </>
  );
}
