# Implementation Plan: Interactive Cropping Tool

**Branch**: `002-interactive-crop` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-interactive-crop/spec.md`

## Summary

This plan implements an interactive cropping tool for both images and PDFs. The tool provides a visual, drag-to-select interface for cropping, replacing the current parameter-based cropping with an intuitive user experience.

## Architecture Overview

### Image Cropping
- Uses HTML5 Canvas API for client-side image manipulation
- Interactive crop rectangle overlay with draggable handles
- Real-time preview of crop area
- Aspect ratio presets and custom dimensions
- Integration with existing image processor utilities

### PDF Cropping
- Uses pdf-lib library for PDF page cropping
- Per-page or global crop application
- Visual crop rectangle overlay on PDF pages
- Maintains PDF quality and text selectability

### Component Structure
- `InteractiveCropTool.tsx` - Main crop tool component for images
- `PDFCropTool.tsx` - PDF-specific crop tool component
- `CropOverlay.tsx` - Reusable crop rectangle overlay component
- `CropPresets.tsx` - Preset management component
- Updates to `ImageTools.tsx` and `PDFTools.tsx` to integrate crop tools

## Implementation Phases

### Phase 1: Image Cropping (P0 - Critical MVP)
1. Create interactive crop overlay component
2. Implement drag-to-resize and reposition functionality
3. Add aspect ratio presets (1:1, 4:3, 16:9, 3:2, Free)
4. Integrate with existing image processor
5. Add manual dimension input for precise control
6. Implement apply/cancel actions

### Phase 2: PDF Cropping (P1 - MVP)
1. Create PDF crop tool component
2. Implement page navigation in crop mode
3. Add "Apply to all pages" vs "Current page only" options
4. Integrate with pdf-lib for PDF manipulation
5. Handle multi-page PDFs with progress indicators

### Phase 3: Advanced Features (P2)
1. Save/load custom crop presets
2. "Use previous dimensions" feature
3. Batch cropping with same dimensions
4. Keyboard shortcuts for fine-tuning
5. Touch-optimized interface for mobile

## Technical Approach

### Image Cropping Implementation
- Canvas-based rendering for crop overlay
- Mouse/touch event handlers for drag operations
- Coordinate calculations for crop area constraints
- Integration with existing `cropImage` function in `lib/client-processors/image-processor.ts`

### PDF Cropping Implementation
- pdf-lib's `setCropBox` method for page cropping
- Canvas rendering for PDF page preview
- Page-by-page processing with progress tracking
- Preservation of PDF metadata and structure

### State Management
- Crop area state (x, y, width, height, aspectRatio, locked)
- Preset management (localStorage for custom presets)
- Integration with editor store for operation history

## UI/UX Considerations

### Visual Design
- Clear crop rectangle with highlighted border
- Dimmed area outside crop selection
- Visible drag handles on corners and edges
- Real-time dimension display
- Smooth animations for crop adjustments

### Accessibility
- Keyboard navigation support (arrow keys for fine-tuning)
- Touch-optimized controls for mobile devices
- Screen reader support for crop dimensions
- High contrast mode support

### Performance
- Efficient canvas rendering (requestAnimationFrame)
- Debounced preview updates for smooth interaction
- Lazy loading for large PDFs
- Progress indicators for batch operations

## Integration Points

### Existing Components
- `ImageTools.tsx` - Add crop tab/section
- `PDFTools.tsx` - Add crop option in PDF Editor
- `ToolNavigation.tsx` - Crop tool already listed, needs connection
- Editor store - Add crop operations to history

### Existing Utilities
- `lib/client-processors/image-processor.ts` - Extend cropImage function
- `lib/client-processors/pdf-processor.ts` - Add PDF crop functionality
- Operation history - Support undo/redo for crop operations

## Testing Strategy

### Unit Tests
- Crop area calculation utilities
- Aspect ratio locking logic
- Coordinate constraint functions
- Preset save/load functionality

### Integration Tests
- Image crop workflow (select → adjust → apply → download)
- PDF crop workflow (select → adjust → apply to all → download)
- Undo/redo for crop operations
- Batch cropping with same dimensions

### E2E Tests
- Complete image cropping user story
- Complete PDF cropping user story
- Custom preset creation and usage
- Touch device cropping workflow

## Success Metrics

- Users complete image cropping in under 20 seconds
- 95% success rate on first crop attempt
- 70%+ of image editors use crop tool
- 60%+ use aspect ratio presets
- Touch device success rate at 90% of desktop

## Dependencies

- `pdf-lib` - Already in use for PDF manipulation
- Canvas API - Browser native
- Existing image processor utilities
- Editor store for file management

## Out of Scope (This Feature)

- Content-aware smart cropping
- Non-rectangular crop shapes
- Crop with rotation (separate operation)
- External crop template sources
- Collaborative cropping

## Bug Fixes (2025-11-18)

### Issue 1: First Page Not Rendering on PDF Upload
**Problem**: When uploading a PDF, the first page appeared blank despite PDF loading successfully.
**Root Cause**: Complex lazy rendering system with IntersectionObserver prevented immediate first-page rendering.
**Solution**:
- Removed continuous scroll/lazy rendering logic
- Simplified to single-page view with immediate rendering
- Uses single `canvasRef` that renders current page directly
- Files changed: `components/MainWorkspace.tsx`

### Issue 2: Blank Page After Exiting E-Sign Tool
**Problem**: After pressing ESC to exit E-Sign tool, the PDF displayed a blank page instead of the current page.
**Root Cause**: The PDF rendering effect didn't include `selectedTool` in dependencies and didn't account for tools with custom workspaces.
**Solution**:
- Added `selectedTool` to effect dependencies
- Created list of custom workspace tools (crop, editor-esign, ocr-scan, etc.)
- Only skip PDF rendering for tools with custom workspaces
- Added 50ms delay to ensure canvas is in DOM after tool exit
- Files changed: `components/MainWorkspace.tsx`

### Issue 3: Vertical Scroll Not Working in PDF Tools Sidebar
**Problem**: Vertical scrolling didn't work in PDF tools (Split, Merge, Extract, etc.) when content exceeded viewport.
**Root Cause**: Missing height constraint on root sidebar container - flex containers need explicit height for overflow to work.
**Solution**:
- Added `h-full` class to `FileDetailsSidebar` root div
- Ensures proper height constraint from parent flexbox
- Maintains nested flex structure: `overflow-hidden` on parent, `overflow-y-auto` on scrollable child
- Files changed: `components/FileDetailsSidebar.tsx`

### Technical Details
```typescript
// MainWorkspace.tsx - Fixed PDF rendering after tool exit
const customWorkspaceTools = ['crop', 'editor-crop', 'pdf-crop', 'ocr-scan', 'editor-esign'];
const hasCustomWorkspace = selectedTool && customWorkspaceTools.includes(selectedTool);

if (pdfDoc && canvasRef.current && isPDF && !hasCustomWorkspace) {
  const timeoutId = setTimeout(() => {
    if (canvasRef.current) {
      renderPDFPage(pdfDoc, currentPage, canvasRef.current, { scale: 1.5 })
        .catch((error) => console.error('[MainWorkspace] Error rendering single page:', error));
    }
  }, 50);
  return () => clearTimeout(timeoutId);
}
```

```typescript
// FileDetailsSidebar.tsx - Fixed scrolling
<div className="w-64 h-full border-l flex flex-col overflow-hidden">
  {/* ... */}
  <div className="flex-1 flex flex-col overflow-hidden">
    <div className="flex-1 overflow-y-auto">
      <PDFToolsSidebar selectedTool={selectedTool || ''} />
    </div>
  </div>
</div>
```

