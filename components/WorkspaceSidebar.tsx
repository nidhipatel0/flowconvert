'use client';

import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  description?: string;
}

const navigationItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠', description: 'Dashboard and overview' },
  { id: 'recent', label: 'Recent Files', icon: '🕐', description: 'View recently processed files' },
  { id: 'convert', label: 'Convert', icon: '🔄', description: 'Convert between file formats' },
  { id: 'compress', label: 'Compress', icon: '📦', description: 'Reduce file size' },
  { id: 'edit', label: 'Edit PDF', icon: '✏️', description: 'Annotate, watermark, and edit PDFs' },
  { id: 'organize', label: 'Organize', icon: '📑', description: 'Merge, split, and arrange pages' },
  { id: 'sign', label: 'Sign & Forms', icon: '✍️', description: 'E-signatures and form filling' },
  { id: 'ai-tools', label: 'AI Tools', icon: '🤖', badge: 2, description: 'Summarize, translate, and chat with documents' },
];

const bottomItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Configure app preferences' },
  { id: 'help', label: 'Help & FAQ', icon: '❓', description: 'Get help and support' },
];

export function WorkspaceSidebar() {
  const [activeItem, setActiveItem] = useState('home');

  return (
    <aside className="workspace-sidebar">
      <div className="flex flex-col h-full">
        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                title={item.description}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">0</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary-900">Files Processed</p>
                <p className="text-xs text-secondary-600">This session</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-cyan-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary-600">Storage</span>
                <span className="font-semibold text-secondary-900">0 MB / 50 MB</span>
              </div>
              <div className="mt-2 h-1.5 bg-secondary-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 w-0"></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-secondary-200 px-3 py-4">
          <div className="space-y-1">
            {bottomItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                title={item.description}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
