import * as pdfjsLib from 'pdfjs-dist';

// Fix for ESM import compatibility: Handle default export if necessary
// This prevents "Cannot set properties of undefined (setting 'workerSrc')"
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Set worker source
if (typeof window !== 'undefined' && 'Worker' in window) {
  if (pdfjs.GlobalWorkerOptions) {
    // Explicitly point to the worker script for version 3.11.174 on CDNJS to fix loading issues
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
}

export interface PdfPageImage {
  blob: Blob;
  width: number;
  height: number;
  pageIndex: number;
}

/**
 * Renders a PDF file into an array of images (Blobs).
 * Used for both Compression (Rasterize -> Compress -> PDF) and Conversion (PDF -> Image).
 */
export const renderPdfToImages = async (
  file: File, 
  scale: number = 1.5, 
  onProgress?: (current: number, total: number) => void
): Promise<PdfPageImage[]> => {
  
  const arrayBuffer = await file.arrayBuffer();
  
  // Use the resolved pdfjs object
  const loadingTask = pdfjs.getDocument(arrayBuffer);
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const images: PdfPageImage[] = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 1.0));
    
    if (blob) {
      images.push({
        blob,
        width: viewport.width,
        height: viewport.height,
        pageIndex: i
      });
    }
  }

  return images;
};