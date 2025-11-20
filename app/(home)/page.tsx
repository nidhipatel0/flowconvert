'use client';

import { useState, useEffect } from 'react';
import { ToolNavigation, type TabType } from '@/components/ToolNavigation';
import { FileDetailsSidebar } from '@/components/FileDetailsSidebar';
import { MainWorkspace } from '@/components/MainWorkspace';
import { PDFThumbnailSidebar } from '@/components/PDFThumbnailSidebar';
import { useEditorStore } from '@/lib/stores';

export default function HomePage(): JSX.Element {
  const { files, getActiveFile } = useEditorStore();
  const fileList = Array.from(files.values());
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('images');

  // Get active file for PDF thumbnail sidebar (component will handle multi-page check)
  const activeFile = getActiveFile();
  const isPDF = activeFile?.format === 'PDF';

  // Automatically switch tab based on active file format
  useEffect(() => {
    if (activeFile) {
      if (activeFile.format === 'PDF') {
        setActiveTab('pdf');
      } else if (['JPG', 'PNG', 'WEBP', 'JPEG', 'GIF', 'BMP', 'TIFF', 'SVG'].includes(activeFile.format)) {
        setActiveTab('images');
      }
    }
  }, [activeFile]);

  // Debug tool selection
  const handleToolSelect = (tool: string) => {
    console.log('[HomePage] Tool selected:', tool);
    setSelectedTool(tool);
  };

  // Clear selected tool (exit tool)
  const handleClearTool = () => {
    console.log('[HomePage] Clearing tool');
    setSelectedTool('');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Fixed Merged Header/Ribbon (at top, collapsible) */}
      <ToolNavigation 
        selectedTool={selectedTool} 
        onSelectTool={handleToolSelect}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area (with padding for header/ribbon at top) */}
      {/* Total ribbon height: 35px (tabs) + 94px (tool groups) = 129px, workspace padding reduced by 5px */}
      <div className="flex-1 flex" style={{ paddingTop: '124px', minHeight: 0, overflow: 'hidden' }}>
        {/* Left: PDF Thumbnail Sidebar (only for multi-page PDFs, auto-hides) */}
        {isPDF && <PDFThumbnailSidebar fileId={activeFile?.id || null} />}

        {/* Center: Main Workspace */}
        <MainWorkspace selectedTool={selectedTool} onClearTool={handleClearTool} />

        {/* Right: File Details Sidebar (only when files exist) */}
        {fileList.length > 0 && <FileDetailsSidebar selectedTool={selectedTool} />}
      </div>
    </div>
  );
}
