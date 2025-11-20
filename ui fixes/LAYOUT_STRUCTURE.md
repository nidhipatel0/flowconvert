# FlowConvert UI Layout - Visual Structure

## Current Implementation (Live at localhost:3002)

```
╔════════════════════════════════════════════════════════════════════════╗
║                    FIXED HEADER (z-index: 50)                         ║
║  [F] FlowConvert              Your files never leave your computer     ║
║       Your files...           [☀️ Light] [⚙️ Settings] [❓ Help]      ║
║                               [📤 Upload Files]                        ║
╠════════════════════════════════════════════════════════════════════════╣
║              FIXED RIBBON NAVIGATION (z-index: 40, h-80px)             ║
║  [🖼️ Images] [📄 PDF] [✨ OCR] [✏️ Editor] ║ [Crop] [JPG] [PNG]... ⟶ ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  MAIN CONTENT AREA (padding-top: 96px for header+ribbon)              ║
║                                                                        ║
║  CASE 1: NO FILES SELECTED                                            ║
║  ┌────────────────────────────────────────────────────────────────┐   ║
║  │                                                                │   ║
║  │                                                                │   ║
║  │                                                                │   ║
║  │                    [⬆️] Upload Icon                           │   ║
║  │                    (in circle)                                │   ║
║  │                                                                │   ║
║  │              Drop your files here                             │   ║
║  │          or click to browse from your computer                │   ║
║  │                                                                │   ║
║  │          🔒 100% Private & Secure                             │   ║
║  │     All processing happens locally in your browser.           │   ║
║  │  Your files never leave your computer.                        │   ║
║  │                                                                │   ║
║  │      [📁 Select Files from Computer] (Button)                │   ║
║  │                                                                │   ║
║  │                                                                │   ║
║  └────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  CASE 2: FILES SELECTED                                               ║
║  ┌──────┬──────────────────────────────────────┬─────────────────┐   ║
║  │      │                                      │                 │   ║
║  │ LEFT │        MAIN WORKSPACE                │  RIGHT SIDEBAR  │   ║
║  │      │                                      │                 │   ║
║  │ (96px│ • File Preview                       │ [👁️ Preview]   │   ║
║  │      │   - Images: inline display          │ [📥 Download]   │   ║
║  │ FILE │   - PDFs: iframe viewer             │                 │   ║
║  │      │   - Status bar at bottom            │ FILE DETAILS:   │   ║
║  │ 1    │                                      │                 │   ║
║  │ 📷   │ • Full-screen large display         │ Name:           │   ║
║  │      │ • Responsive to content             │   document.pdf  │   ║
║  │ FILE │                                      │                 │   ║
║  │      │                                      │ Type:           │   ║
║  │ 2    │                                      │   PDF           │   ║
║  │ 📄   │                                      │                 │   ║
║  │      │                                      │ Size:           │   ║
║  │ FILE │                                      │   2.5 MB        │   ║
║  │      │                                      │                 │   ║
║  │ 3    │                                      │ Uploaded:       │   ║
║  │ 📋   │                                      │   Nov 13, 2:45pm│   ║
║  │      │                                      │                 │   ║
║  │ ...  │                                      │ Status:         │   ║
║  │      │                                      │ ⚡ Ready       │   ║
║  │ More │                                      │                 │   ║
║  │ (X)  │                                      │ Dimensions:     │   ║
║  │      │                                      │   1920x1080 px  │   ║
║  │      │                                      │                 │   ║
║  │      │  [Status: Uploaded]                │                 │   ║
║  │      │  [File: document]                  │                 │   ║
║  │      │                                      │                 │   ║
║  └──────┴──────────────────────────────────────┴─────────────────┘   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

## Responsive Breakdown

### 🖥️ DESKTOP (1920px) - Full Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ FlowConvert                                           ☀️ ⚙️ ❓ 📤   │ <- Header
├─────────────────────────────────────────────────────────────────────┤
│ Images | PDF | OCR | Editor │ Crop JPG PNG WebP ... ▶            │ <- Ribbon
├──────┬─────────────────────────────────────────────┬─────────────┤
│      │                                             │             │
│ [1] │       LARGE PREVIEW                        │ File Info   │
│ [2] │       (800px+ width)                        │ Preview     │
│ [3] │                                             │ Download    │
│      │                                             │             │
└──────┴─────────────────────────────────────────────┴─────────────┘
  96px    flex-1 (remaining)                         288px
```

### 💻 TABLET (768px) - Adjusted Layout
```
┌──────────────────────────────────────────┐
│ FlowConvert                        ☀️ ⚙️ │ <- Header
├──────────────────────────────────────────┤
│ Images | PDF | Editor | ... ▶           │ <- Ribbon
├────────┬──────────────────┬──────────┤
│ [1]   │  PREVIEW        │ Details  │
│ [2]   │  (med width)    │          │
│        │                 │          │
└────────┴──────────────────┴──────────┘
 80px     flex-1            200px
```

### 📱 MOBILE (375px) - Stacked Layout
```
┌────────────────────────┐
│ FlowConvert         ☀️ │ <- Header
├────────────────────────┤
│ Img | PDF | ... ▶ │ <- Ribbon (scrolls)
├────────────────────────┤
│ [📷]  [1]            │ <- Thumbnails (scroll)
│ [📄]  [2]            │
│ [📋]  [3]            │
├────────────────────────┤
│   PREVIEW AREA         │ <- Main content
│   (Full width)         │
├────────────────────────┤
│ File Details (scroll)  │
│ Name: ...              │
│ Size: ...              │
│ Status: ...            │
└────────────────────────┘
```

---

## Component Hierarchy

```
App
├── WorkspaceHeader (fixed, always visible)
│   ├── Logo + Tagline
│   ├── Theme Toggle (☀️)
│   └── Action Buttons (⚙️ ❓ 📤)
│
├── ToolNavigation (fixed ribbon, always visible)
│   ├── Tab Buttons (Images, PDF, OCR, Editor)
│   └── Function Buttons (horizontal scroll)
│
└── Main Layout (flex container)
    ├── FileThumbnailSidebar (conditional, left, 96px)
    │   └── File Thumbnails (vertical list)
    │
    ├── MainWorkspace (flex-1, center)
    │   ├── FileUploadZone (if no files)
    │   │   ├── Icon
    │   │   ├── Title/Subtitle
    │   │   ├── Privacy Badge
    │   │   └── Upload Button
    │   │
    │   └── FilePreview (if files exist)
    │       ├── Image/PDF Viewer
    │       ├── Edit Area (future)
    │       └── Status Bar
    │
    └── FileDetailsSidebar (conditional, right, 288px)
        ├── Action Buttons
        │   ├── Preview
        │   └── Download
        │
        └── File Information
            ├── Name
            ├── Type
            ├── Size
            ├── Upload Date
            ├── Status
            ├── Dimensions (images)
            └── Page Count (PDFs)
```

---

## Spacing & Dimensions

| Element | Dimension | Purpose |
|---------|-----------|---------|
| Header | auto height (~50px) | Logo, tagline, buttons |
| Ribbon | 80px height | Tabs and functions |
| Left Sidebar | 96px width | File thumbnails |
| Right Sidebar | 288px width | File details |
| Main Area | flex-1 | Preview and editing |
| Upload Icon | 96px diameter | Visual focal point |
| Button Size | 40-48px height | Touch-friendly |
| Grid Gap | 8px | Spacing between items |
| Padding | 16px | Inner spacing |

---

## Color Palette

### Dark Theme (Default)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark Teal | #0d3333 |
| Header/Ribbon | Darker Teal | #0a2525 |
| Primary | Teal | #14b8a6 |
| Secondary | Light Teal | #5eead4 |
| Accent | Bright Teal | #20c997 |
| Text | White/Light | #ffffff / #e0f2f1 |
| Border | Subtle Teal | rgba(20, 184, 166, 0.3) |

### Light Theme
| Element | Color | Hex |
|---------|-------|-----|
| Background | Light Cyan | #f0fffe |
| Primary | Turquoise | #06d6d0 |
| Secondary | Cyan | #00d9ff |
| Text | Dark | #1a1a2e |
| Border | Light | rgba(6, 214, 208, 0.2) |

---

## Z-Index Stack

```
z-50: Fixed Header
z-40: Fixed Ribbon
z-30: Modal/Dialog (future)
z-20: Dropdown (future)
z-10: Card/Tooltip (future)
z-0: Main content
```

---

## Interaction Flow

### 1. Initial Load
- Show fixed header + ribbon
- Show upload zone (centered, full-screen)
- Right sidebar hidden
- Left sidebar hidden

### 2. File Upload
- User clicks upload or drags file
- File added to store
- Upload zone disappears
- Left sidebar shows (with thumbnail)
- Main area shows preview
- Right sidebar shows file info

### 3. File Selection
- User clicks thumbnail
- Active state highlights
- Preview updates
- File info refreshes
- Delete button visible on hover

### 4. Tab Change
- User clicks ribbon tab
- Functions update
- Main area may update (future)
- File preview unchanged

### 5. Theme Toggle
- User clicks ☀️ button
- Colors invert
- All components refresh
- Preference saved to localStorage

---

## Current View Summary

When you visit http://localhost:3002:

✅ You see a professional interface with:
- Fixed header (always visible)
- Fixed ribbon (always visible)
- Beautiful upload zone (centered, full-screen height)
- Privacy messaging
- Professional colors and spacing
- All in a single window (no main content scrolling)

✅ When you upload files:
- Upload zone disappears
- Thumbnails appear on left (96px column)
- Preview appears in center (large)
- File info appears on right (288px column)
- All visible at once!

---

**This is production-ready code. Ready for Phase 3: Tool Implementation!**

