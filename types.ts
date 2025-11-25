export enum ToolType {
  HOME = 'HOME',
  COMPRESSOR = 'COMPRESSOR',
  CONVERTER = 'CONVERTER',
  SCANNER = 'SCANNER'
}

export interface ProcessedFile {
  id: string;
  originalFile: File;
  previewUrl: string;
  processedBlob?: Blob;
  processedUrl?: string;
  sizeBefore: number;
  sizeAfter?: number;
  type: 'image' | 'pdf';
  name: string;
}

export interface CompressionSettings {
  targetSizeKB: number;
  brightness: number; // 0 to 200, default 100
  grayscale: boolean;
}

export interface OcrResult {
  text: string;
  summary: string;
  items?: string[];
}