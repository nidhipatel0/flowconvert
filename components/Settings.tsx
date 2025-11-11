'use client';

import { useState } from 'react';
import { useThemeStore, PRESET_THEMES } from '@/lib/stores/themeStore';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { currentTheme, setTheme } = useThemeStore();
  const [activeSection, setActiveSection] = useState<'appearance' | 'privacy' | 'general'>('appearance');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-secondary-200 bg-gradient-to-r from-cyan-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Settings</h2>
            <p className="text-sm text-secondary-600 mt-1">
              Customize your FlowConvert experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-48 bg-secondary-50 border-r border-secondary-200 p-4">
            <nav className="space-y-2">
              {[
                { id: 'appearance', label: 'Appearance', icon: '🎨' },
                { id: 'privacy', label: 'Privacy', icon: '🔒' },
                { id: 'general', label: 'General', icon: '⚙️' },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-secondary-700 hover:bg-secondary-100'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 max-h-[600px] overflow-y-auto">
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Theme Selection
                  </h3>
                  <p className="text-sm text-secondary-600 mb-6">
                    Choose a color theme that matches your style
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRESET_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id)}
                        className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                          currentTheme.id === theme.id
                            ? 'border-cyan-500 bg-cyan-50 shadow-lg scale-105'
                            : 'border-secondary-200 bg-white hover:border-cyan-300 hover:shadow-md'
                        }`}
                      >
                        {/* Theme Preview */}
                        <div className="flex gap-2 mb-4">
                          {Object.values(theme.colors)
                            .slice(0, 3)
                            .map((color, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 rounded-lg shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                        </div>

                        {/* Theme Info */}
                        <h4 className="font-semibold text-secondary-900 mb-1">
                          {theme.name}
                        </h4>
                        <p className="text-xs text-secondary-600">
                          {theme.description}
                        </p>

                        {/* Active Indicator */}
                        {currentTheme.id === theme.id && (
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-secondary-200">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Display Preferences
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          Reduce animations
                        </p>
                        <p className="text-xs text-secondary-600">
                          Minimize motion for accessibility
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          High contrast mode
                        </p>
                        <p className="text-xs text-secondary-600">
                          Increase contrast for better visibility
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    Privacy & Security
                  </h3>
                  <p className="text-sm text-secondary-600 mb-6">
                    Control how your files are processed
                  </p>

                  <div className="space-y-4">
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-1">
                            Client-Side Processing Active
                          </h4>
                          <p className="text-sm text-green-700">
                            Your files are processed locally in your browser. They never leave your device.
                          </p>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          Remove EXIF data by default
                        </p>
                        <p className="text-xs text-secondary-600">
                          Strip location and metadata from images
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          Clear files after conversion
                        </p>
                        <p className="text-xs text-secondary-600">
                          Automatically remove files after download
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    General Settings
                  </h3>
                  <p className="text-sm text-secondary-600 mb-6">
                    Configure your workspace preferences
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-secondary-50 rounded-lg">
                      <label className="block font-medium text-secondary-900 mb-2">
                        Default quality for conversions
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        defaultValue="90"
                        className="w-full accent-cyan-500"
                      />
                      <p className="text-xs text-secondary-600 mt-2">
                        Higher quality = larger file size
                      </p>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          Show file size estimates
                        </p>
                        <p className="text-xs text-secondary-600">
                          Preview output file size before converting
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          Auto-download after conversion
                        </p>
                        <p className="text-xs text-secondary-600">
                          Start download immediately when ready
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-secondary-200 bg-secondary-50">
          <p className="text-xs text-secondary-500">
            Changes are saved automatically
          </p>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
