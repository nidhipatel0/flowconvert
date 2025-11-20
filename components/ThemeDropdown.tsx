'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useThemeStore, PRESET_THEMES } from '@/lib/stores/themeStore';
import { Check } from 'lucide-react';

export function ThemeDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentTheme, setTheme } = useThemeStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current?.contains(event.target as Node) ||
        dropdownRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  // Calculate dropdown position
  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 64, right: 16 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    };
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded transition-colors flex items-center justify-center w-8 h-8"
        style={{
          color: 'hsl(var(--foreground))',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Color Scheme"
        aria-label="Color Scheme"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Rendered as portal to ensure it's always visible */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-64 rounded-lg shadow-xl py-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
            zIndex: 9999,
            ...getDropdownPosition(),
          }}
        >
          <div
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Color Scheme
          </div>

          {PRESET_THEMES.map((theme) => {
            const isActive = currentTheme.id === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className="w-full px-3 py-2.5 flex items-center justify-between transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Color swatch */}
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: theme.colors.primary }}
                  />

                  {/* Theme name */}
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {theme.name}
                  </span>
                </div>

                {/* Checkmark for active theme */}
                {isActive && (
                  <Check
                    size={16}
                    style={{ color: 'hsl(var(--primary))' }}
                  />
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

