/**
 * Converts an image file to a pre-processed Base64 string optimized for OCR.
 * Optimized to use hardware-accelerated canvas filters instead of pixel-by-pixel JS loops.
 * Added support for PDF files which should bypass canvas processing.
 */
export const preprocessImageForOCR = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // 1. Resize logic (Cap max dimension to 1600px for better performance/token balance)
      const MAX_DIMENSION = 1600;
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
      
      // 2. Use hardware-accelerated filters instead of manual loops
      ctx.filter = 'grayscale(1) contrast(1.2) brightness(1.1)';
      ctx.drawImage(img, 0, 0, width, height);

      // Return as Base64 JPEG
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      resolve(base64);
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
};