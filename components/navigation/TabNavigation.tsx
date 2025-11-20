'use client';

import { useRef, KeyboardEvent } from 'react';

export type TabCategory = 'images' | 'pdf' | 'compress';

interface Tab {
  id: TabCategory;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'images',
    label: 'Images',
    icon: '🖼️',
    description: 'Convert, resize, and edit images',
  },
  {
    id: 'pdf',
    label: 'Pdf',
    icon: '📄',
    description: 'Merge, split, and manage PDFs',
  },
  {
    id: 'compress',
    label: 'Compress',
    icon: '🗜️',
    description: 'Reduce file sizes',
  },
];

interface TabNavigationProps {
  selectedTab: TabCategory;
  onSelectTab: (tab: TabCategory) => void;
}

export function TabNavigation({ selectedTab, onSelectTab }: TabNavigationProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = index > 0 ? index - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = index < tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelectTab(tabs[index]!.id);
        return;
      default:
        return;
    }

    tabRefs.current[newIndex]?.focus();
  };

  return (
    <div className="bg-dark-teal-gradient rounded-xl p-2 border border-teal-700/30">
      <div
        role="tablist"
        aria-label="File processing categories"
        className="flex gap-2"
      >
        {tabs.map((tab, index) => {
          const isActive = selectedTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d3333]
                ${
                  isActive
                    ? 'bg-teal-400 text-teal-950 shadow-lg shadow-teal-500/30'
                    : 'bg-teal-700/50 text-teal-100 hover:bg-teal-600/50 hover:text-white'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg" aria-hidden="true">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </div>
              <span className="sr-only">{tab.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
