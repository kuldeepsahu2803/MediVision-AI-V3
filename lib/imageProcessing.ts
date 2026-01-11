
/**
 * Converts an image file to a pre-processed Base64 string optimized for OCR.
 * Steps:
 * 1. Resize to max dimension (limiting token usage/bandwidth)
 * 2. Grayscale conversion
 * 3. Simple contrast stretching / binarization
 */
export const preprocessImageForOCR = async (file: File): Promise<string> => {
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

      // 1. Resize logic (Cap max dimension to 2048px to save bandwidth/tokens while maintaining legibility)
      const MAX_DIMENSION = 2048;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Access pixel data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // 3. Grayscale & Contrast Enhancement
      // We iterate through every pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Standard Luminance: 0.299R + 0.587G + 0.114B
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Adaptive Thresholding / Binarization simulation
        // Simple approach: Increase contrast by pushing darks darker and lights lighter
        // This helps remove faint shadows or paper texture
        if (gray > 160) {
            gray = 255; // Make background pure white
        } else if (gray < 80) {
            gray = 0;   // Make text pure black
        }

        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
        // Alpha (data[i+3]) remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);

      // Return as Base64 JPEG
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      resolve(base64);
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
};
