// Load PDF.js from CDN using script tag to avoid webpack bundling
// Using 'any' type to avoid module resolution during build/SSR
let pdfjsLib: any = null;
let pdfjsLoading: Promise<any> | null = null;

// Load PDF.js from CDN using a script tag (webpack won't process this)
function loadPdfjsFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).__pdfjsLib) {
      resolve((window as any).__pdfjsLib);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[data-pdfjs]');
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).__pdfjsLib) {
          clearInterval(checkInterval);
          resolve((window as any).__pdfjsLib);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('PDF.js loading timeout'));
      }, 10000);
      return;
    }

    // Create a script tag that loads PDF.js as an ES module
    const script = document.createElement('script');
    script.type = 'module';
    script.setAttribute('data-pdfjs', 'true');
    script.textContent = `
      import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.mjs';
      window.__pdfjsLib = pdfjsLib;
      window.dispatchEvent(new Event('pdfjsLoaded'));
    `;
    
    const onLoad = () => {
      const lib = (window as any).__pdfjsLib;
      if (lib && (lib.getDocument || lib.default?.getDocument)) {
        const actualLib = lib.getDocument ? lib : lib.default;
        const version = actualLib.version || '4.0.379';
        if (actualLib.GlobalWorkerOptions) {
          // Use same CDN (jsdelivr) for worker to avoid CORS issues
          actualLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.mjs`;
        }
        (window as any).__pdfjsLib = actualLib;
        resolve(actualLib);
      } else {
        reject(new Error('PDF.js loaded but getDocument not found'));
      }
    };
    
    window.addEventListener('pdfjsLoaded', onLoad, { once: true });
    
    script.onerror = () => {
      window.removeEventListener('pdfjsLoaded', onLoad);
      reject(new Error('Failed to load PDF.js script'));
    };
    
    document.head.appendChild(script);
  });
}

// Lazy load PDF.js only on client side
async function getPdfjsLib() {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used on the client side');
  }
  
  // If already loaded, return it
  if (pdfjsLib) {
    return pdfjsLib;
  }
  
  // If currently loading, wait for it
  if (pdfjsLoading) {
    return await pdfjsLoading;
  }
  
  // Start loading from CDN
  pdfjsLoading = loadPdfjsFromCDN();
  
  try {
    pdfjsLib = await pdfjsLoading;
    console.log('PDF.js loaded successfully from CDN');
    return pdfjsLib;
  } catch (error) {
    console.error('Failed to load PDF.js from CDN:', error);
    pdfjsLoading = null;
    throw error;
  }
}

export interface RenderOptions {
  scale?: number;
  width?: number;
  height?: number;
}

/**
 * Load a PDF document from a file or blob
 */
export async function loadPDF(file: File | Blob) {
  try {
    // Ensure we have a valid file/blob
    if (!file) {
      throw new Error('Invalid file: file is null or undefined');
    }

    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      throw new Error('PDF.js can only be used on the client side');
    }

    // Get PDF.js library (lazy loaded)
    const pdfjs = await getPdfjsLib();

    // Convert to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Ensure we have valid data
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Invalid file: file is empty');
    }

    // Convert to Uint8Array
    const typedArray = new Uint8Array(arrayBuffer);

    // Load PDF with error handling
    const loadingTask = pdfjs.getDocument({
      data: typedArray,
      useSystemFonts: true,
    });
    
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
}

/**
 * Render a PDF page to a canvas element
 */
export async function renderPDFPage(
  pdf: any, // PDFDocumentProxy from pdfjs-dist
  pageNumber: number,
  canvas: HTMLCanvasElement,
  options: RenderOptions = {}
): Promise<void> {
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used on the client side');
  }

  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: options.scale || 1.0 });
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas 2D context');
  }

  // Set canvas dimensions
  if (options.width && options.height) {
    canvas.width = options.width;
    canvas.height = options.height;

    // Calculate scale to fit the canvas
    const scaleX = options.width / viewport.width;
    const scaleY = options.height / viewport.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledViewport = page.getViewport({ scale });

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;
  } else {
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport,
    };

    await page.render(renderContext).promise;
  }
}

/**
 * Render a PDF page to a data URL (for thumbnails)
 */
export async function renderPDFPageToDataURL(
  pdf: any, // PDFDocumentProxy from pdfjs-dist
  pageNumber: number,
  options: RenderOptions = {}
): Promise<string> {
  // Ensure we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be used on the client side');
  }

  const canvas = document.createElement('canvas');
  await renderPDFPage(pdf, pageNumber, canvas, options);
  return canvas.toDataURL('image/png');
}

/**
 * Get the number of pages in a PDF
 */
export function getPDFPageCount(pdf: any): number {
  return pdf.numPages;
}
