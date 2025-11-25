import { CompressionSettings } from "../types";

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Compresses an image to try and meet a target KB size.
 * Also applies brightness and grayscale filters.
 */
export const processImage = async (
  file: File,
  settings: CompressionSettings
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Initial dimensions
      let width = img.width;
      let height = img.height;

      // Basic resizing if massive to help performance
      const MAX_DIMENSION = 2500;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = width / height;
        if (width > height) {
          width = MAX_DIMENSION;
          height = MAX_DIMENSION / ratio;
        } else {
          height = MAX_DIMENSION;
          width = MAX_DIMENSION * ratio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Apply Filters
      let filterString = `brightness(${settings.brightness}%)`;
      if (settings.grayscale) {
        filterString += ` grayscale(100%)`;
      }
      ctx.filter = filterString;
      
      ctx.drawImage(img, 0, 0, width, height);

      // Compression Loop
      // Binary search-like approach to find quality
      const targetSizeBytes = settings.targetSizeKB * 1024;
      let minQ = 0.01;
      let maxQ = 1.0;
      let quality = 0.8;
      let attempt = 0;
      let resultBlob: Blob | null = null;

      const attemptCompression = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob failed"));
              return;
            }

            // If we are under the target or at very low quality, return
            // For logic: we want the largest file that is still UNDER the target.
            // But canvas.toBlob is async, so we iterate carefully.
            
            // Simplified logic for this demo: 
            // If it's too big, reduce quality.
            // If it's way too small, increase quality slightly.
            
            if (blob.size <= targetSizeBytes || quality <= 0.05 || attempt > 10) {
              resolve(blob);
            } else {
              // Too big, reduce quality
              maxQ = quality;
              quality = (minQ + maxQ) / 2;
              attempt++;
              attemptCompression();
            }
          },
          'image/jpeg',
          quality
        );
      };

      attemptCompression();
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
};
