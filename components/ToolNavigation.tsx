'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Upload, /* X */ } from 'lucide-react';
import { useEditorStore } from '@/lib/stores/editor-store';
import {
  Image as ImageIcon,
  FileText,
  Crop,
  Maximize2,
  FileArchive,
  Split,
  Copy,
  Layers,
  Lock,
  BarChart3,
  PenTool,
  Droplet,
  Hash,
  Globe,
  FileCheck,
  Edit3,
  Sparkles,
  Wand2,
  ZoomIn,
  ArrowLeftRight,
} from 'lucide-react';
import { useThemeStore } from '@/lib/stores/themeStore';
import { ThemeDropdown } from './ThemeDropdown';
import { Settings } from './Settings';

export type TabType = 'images' | 'pdf' | 'ocr' | 'pdf-editor';

interface ToolGroup {
  label: string;
  tools: ToolItem[];
}

interface ToolItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

// Define tools for each tab
const imageTools: ToolGroup[] = [
  {
    label: 'Crop',
    tools: [
      { id: 'crop', label: 'Crop', icon: <Crop size={27} />, description: 'Interactive cropping with aspect ratios' },
    ],
  },
  {
    label: 'Convert',
    tools: [
      { id: 'convert-jpg', label: 'To JPG', icon: <ArrowLeftRight size={27} /> },
      { id: 'convert-png', label: 'To PNG', icon: <ArrowLeftRight size={27} /> },
      { id: 'convert-webp', label: 'To WebP', icon: <ArrowLeftRight size={27} /> },
      { id: 'convert-pdf', label: 'To PDF', icon: <FileText size={27} /> },
      { id: 'convert-jpeg', label: 'To JPEG', icon: <ArrowLeftRight size={27} /> },
    ],
  },
  {
    label: 'Dimension',
    tools: [
      { id: 'resize', label: 'Resize', icon: <Maximize2 size={27} />, description: 'Manual width/height or presets' },
    ],
  },
];

const pdfTools: ToolGroup[] = [
  {
    label: 'Edit',
    tools: [
      { id: 'pdf-crop', label: 'Crop', icon: <Crop size={27} />, description: 'Crop PDF pages with aspect ratios' },
    ],
  },
  {
    label: 'Convert',
    tools: [
      { id: 'pdf-to-word', label: 'To Word', icon: <FileText size={27} /> },
      { id: 'pdf-to-excel', label: 'To Excel', icon: <BarChart3 size={27} /> },
      { id: 'pdf-to-ppt', label: 'To PowerPoint', icon: <Layers size={27} /> },
    ],
  },
  {
    label: 'Organize',
    tools: [
      { id: 'pdf-split', label: 'Split', icon: <Split size={27} /> },
      { id: 'pdf-extract', label: 'Extract', icon: <Copy size={27} /> },
      { id: 'pdf-merge', label: 'Merge', icon: <Layers size={27} /> },
    ],
  },
  {
    label: 'Enhance',
    tools: [
      { id: 'pdf-compress', label: 'Compress', icon: <FileArchive size={27} /> },
      { id: 'pdf-organise', label: 'Organise', icon: <BarChart3 size={27} /> },
    ],
  },
  {
    label: 'Security',
    tools: [
      { id: 'pdf-protect', label: 'Protect', icon: <Lock size={27} /> },
    ],
  },
];

const ocrTools: ToolGroup[] = [
  {
    label: 'Scanning',
    tools: [
      { id: 'ocr-scan', label: 'OCR Scan', icon: <Sparkles size={27} />, description: 'Make text searchable' },
      { id: 'ocr-edge-detect', label: 'Edge Detection', icon: <ZoomIn size={27} /> },
    ],
  },
  {
    label: 'Enhancement',
    tools: [
      { id: 'ocr-document', label: 'Document Mode', icon: <FileCheck size={27} /> },
      { id: 'ocr-filters', label: 'Filters', icon: <Wand2 size={27} /> },
    ],
  },
];

const pdfEditorTools: ToolGroup[] = [
  {
    label: 'Edit',
    tools: [
      { id: 'editor-crop', label: 'Crop', icon: <Crop size={27} /> },
      { id: 'editor-annotate', label: 'Annotate', icon: <Edit3 size={27} /> },
    ],
  },
  {
    label: 'Sign',
    tools: [
      { id: 'editor-esign', label: 'E-Sign', icon: <PenTool size={27} /> },
    ],
  },
  {
    label: 'Enhance',
    tools: [
      { id: 'editor-watermark', label: 'Watermark', icon: <Droplet size={27} /> },
      { id: 'editor-pages', label: 'Number Pages', icon: <Hash size={27} /> },
    ],
  },
  {
    label: 'Personalize',
    tools: [
      { id: 'editor-translate', label: 'Translate', icon: <Globe size={27} /> },
      { id: 'editor-personalize', label: 'Personalize', icon: <FileCheck size={27} /> },
    ],
  },
];

interface ToolNavigationProps {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export function ToolNavigation({ selectedTool, onSelectTool, activeTab: externalActiveTab, onTabChange }: ToolNavigationProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('images');
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  
  const setActiveTab = (tab: TabType) => {
    if (externalActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  };
  const [isLightMode, setIsLightMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { currentTheme, setTheme } = useThemeStore();
  const { files, /* clearFiles */ } = useEditorStore();
  const hasFiles = files.size > 0;

  // Initialize light mode state on mount
  useEffect(() => {
    const root = document.documentElement;
    setIsLightMode(!root.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsLightMode(true);
    } else {
      root.classList.add('dark');
      setIsLightMode(false);
    }
    
    setTheme(currentTheme.id);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'images', label: 'Images', icon: <ImageIcon size={16} /> },
    { id: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
    { id: 'ocr', label: 'OCR', icon: <Sparkles size={16} /> },
    { id: 'pdf-editor', label: 'PDF Editor', icon: <Edit3 size={16} /> },
  ];

  const getToolsForTab = (): ToolGroup[] => {
    switch (activeTab) {
      case 'images':
        return imageTools;
      case 'pdf':
        return pdfTools;
      case 'ocr':
        return ocrTools;
      case 'pdf-editor':
        return pdfEditorTools;
      default:
        return [];
    }
  };

  const renderToolButton = (tool: ToolItem) => {
    // Determine button width based on text length to accommodate complete words
    // Calculate width to fit text without breaking words
    const wordCount = tool.label.split(' ').length;
    const isSingleWord = wordCount === 1;
    const labelLength = tool.label.length;
    
    // Adjust width based on content - ensure single words never break
    let buttonWidth = 16; // Default 64px
    if (isSingleWord) {
      // For single words, ensure they fit completely on one line
      if (labelLength > 10) {
        buttonWidth = 22; // 88px for long single words like "Watermark", "Personalize"
      } else if (labelLength > 8) {
        buttonWidth = 20; // 80px for words like "Compress"
      } else if (labelLength > 6) {
        buttonWidth = 18; // 72px
      }
    } else {
      // For multi-word labels, allow wrapping but ensure adequate width
      if (labelLength > 12) {
        buttonWidth = 20; // 80px for multi-word labels
      } else {
        buttonWidth = 18; // 72px
      }
    }
    
    const isSelected = selectedTool === tool.id;
    
    return (
      <button
        key={tool.id}
        onClick={() => onSelectTool(tool.id)}
        className="flex flex-col items-center justify-center gap-1 p-2 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          backgroundColor: isSelected 
            ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.2)' 
            : 'transparent',
          color: isSelected 
            ? 'hsl(var(--primary))' 
            : 'var(--color-text)',
          border: isSelected 
            ? '2px solid hsl(var(--primary))' 
            : '2px solid transparent',
          borderRadius: '6px',
          width: `${buttonWidth * 4}px`,
          minHeight: '72px',
          maxHeight: isSingleWord ? '72px' : 'none', // Single words stay on one line
          overflow: 'visible', // Don't clip text
          zIndex: isSelected ? 10 : 1, // Ensure selected buttons are on top
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        title={tool.description || tool.label}
      >
        <div style={{ 
          color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0 
        }}>
          {tool.icon}
        </div>
        <span 
          className="font-medium text-center leading-tight"
          style={{
            fontSize: labelLength > 12 ? '9px' : '10px',
            lineHeight: '1.3',
            color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
            fontWeight: isSelected ? '600' : '500',
            wordBreak: isSingleWord ? 'keep-all' : 'normal', // Never break single words
            overflowWrap: isSingleWord ? 'normal' : 'break-word', // Single words: no wrapping
            whiteSpace: isSingleWord ? 'nowrap' : 'normal', // Single words: no wrap
            maxWidth: '100%',
            display: 'block',
            padding: '0 2px', // Small padding to prevent edge clipping
          }}
        >
          {tool.label}
        </span>
      </button>
    );
  };

  const toolGroups = getToolsForTab();

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {/* Tabs Section - 35px - Total height including border */}
        <div
          className="px-3 border-b flex items-center gap-1"
          style={{
            borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
            borderBottomWidth: '1px',
            backgroundColor: 'var(--color-surface)',
            height: '35px',
            minHeight: '35px',
            maxHeight: '35px',
            boxSizing: 'border-box',
            lineHeight: '1',
            paddingTop: '0',
            paddingBottom: '0',
            overflow: 'hidden'
          }}
        >
          {/* Left: Tabs */}
          <div className="flex items-center gap-1 flex-shrink-0 h-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 transition-all duration-200 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  backgroundColor: activeTab === tab.id 
                    ? 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.15)' 
                    : 'transparent',
                  color: activeTab === tab.id 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--foreground))',
                  border: 'none',
                  borderBottom: activeTab === tab.id 
                    ? '3px solid hsl(var(--primary))' 
                    : '3px solid transparent',
                  borderRadius: '0',
                  height: '100%',
                  lineHeight: '1',
                  paddingTop: '0',
                  paddingBottom: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
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
              title="Toggle light/dark mode"
              aria-label="Toggle theme"
            >
              {isLightMode ? <Moon size={16} className="flex-shrink-0" /> : <Sun size={16} className="flex-shrink-0" />}
            </button>

            {/* Color Theme Dropdown */}
            <ThemeDropdown />

            {/* Settings */}
            <button
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
              title="Open settings"
              onClick={() => setIsSettingsOpen(true)}
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Help */}
            <button
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
              title="Get help and support"
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Upload Files Button */}
            {!hasFiles && (
              <button
                className="px-3 py-1 rounded-md font-medium transition-colors text-sm"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                title="Upload files to convert, compress, or edit"
                onClick={() => {
                  document.getElementById('file-upload')?.click();
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Upload size={14} />
                  <span>Upload</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Tool Groups Section - 94px - Total height including border */}
        <div 
          className="px-3 overflow-x-auto scrollbar-hide border-t flex items-start" 
          style={{ 
            borderColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)',
            borderTopWidth: '1px',
            minHeight: '94px',
            maxHeight: 'none', // Allow height to grow for multi-line buttons
            paddingTop: '1px',
            paddingBottom: '8px', // Add padding to prevent clipping
            boxSizing: 'border-box',
            overflowY: 'visible' // Don't clip button content
          }}
        >
          <div className="flex h-full" style={{ minWidth: 'max-content' }}>
            {toolGroups.map((group, index) => (
              <div key={group.label} className="flex items-start h-full">
                <div className="flex flex-col justify-between flex-shrink-0 h-full">
                  {/* Group Tools - Flex Row (at top) */}
                  <div className="flex gap-1 flex-shrink-0" style={{ alignItems: 'flex-start' }}>
                    {group.tools.map(renderToolButton)}
                  </div>

                  {/* Group Label (at bottom, like Word) */}
                  <div className="text-[10px] font-bold uppercase tracking-wider px-1 text-center" style={{ color: 'hsl(var(--foreground))', marginTop: '2px', paddingBottom: '6px', opacity: 0.8 }}>
                    {group.label}
                  </div>
                </div>
                
                {/* Vertical Divider between groups (not after last group) */}
                {index < toolGroups.length - 1 && (
                  <div 
                    className="h-16 mx-2 flex-shrink-0" 
                    style={{ 
                      width: '1px',
                      backgroundColor: 'rgba(var(--color-primary-rgb, 20, 184, 166), 0.3)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
