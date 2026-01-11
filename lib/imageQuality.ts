
export interface ImageQualityResult {
  status: 'good' | 'warn' | 'bad';
  message: string;
  blurValue?: number;
  contrastValue?: number;
  glareValue?: number;
}

// Stricter thresholds for blocking analysis ('bad' status)
const BLOCK_BLUR_THRESHOLD = 50; 
const BLOCK_CONTRAST_THRESHOLD = 30;
const BLOCK_GLARE_THRESHOLD = 0.15; // 15% of pixels are near-white

// Lenient thresholds for showing a warning ('warn' status)
const WARN_BLUR_THRESHOLD = 100;
const WARN_CONTRAST_THRESHOLD = 60;
const WARN_GLARE_THRESHOLD = 0.05; // 5% of pixels are near-white

function toGrayscale(ctx: CanvasRenderingContext2D, width: number, height: number): Uint8ClampedArray {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Using luminance formula
    gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

// Calculates variance of the Laplacian
function detectBlur(grayData: Uint8ClampedArray, width: number, height: number): number {
  const laplacian = [
    0, 1, 0,
    1, -4, 1,
    0, 1, 0,
  ];
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let conv = 0;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const pixel = grayData[(y + i - 1) * width + (x + j - 1)];
          conv += pixel * laplacian[i * 3 + j];
        }
      }
      sum += conv;
      sumSq += conv * conv;
      count++;
    }
  }
  
  if (count === 0) return 1000; // Avoid division by zero for tiny images

  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return variance;
}

function detectContrastAndGlare(grayData: Uint8ClampedArray): { contrast: number; glare: number } {
    let min = 255;
    let max = 0;
    let brightPixels = 0;
    for (let i = 0; i < grayData.length; i++) {
        const v = grayData[i];
        if (v < min) min = v;
        if (v > max) max = v;
        if (v > 240) { // Check for near-white pixels for glare
            brightPixels++;
        }
    }
    return { 
        contrast: max - min, 
        glare: brightPixels / grayData.length
    };
}

export const checkImageQuality = (imageDataUrl: string): Promise<ImageQualityResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ status: 'good', message: '' }); // Fail gracefully, assume good
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const grayData = toGrayscale(ctx, img.width, img.height);
      const blurValue = detectBlur(grayData, img.width, img.height);
      const { contrast, glare } = detectContrastAndGlare(grayData);
      
      const resultPayload = { blurValue, contrastValue: contrast, glareValue: glare };

      // Check for 'bad' quality first (hard block)
      if (blurValue < BLOCK_BLUR_THRESHOLD) {
        resolve({
          status: 'bad',
          message: 'Image is extremely blurry and cannot be analyzed. Please retake.',
          ...resultPayload
        });
        return;
      }
      if (contrast < BLOCK_CONTRAST_THRESHOLD) {
        resolve({
          status: 'bad',
          message: 'Image has extremely low contrast and cannot be analyzed. Please retake in better lighting.',
          ...resultPayload
        });
        return;
      }
      if (glare > BLOCK_GLARE_THRESHOLD) {
        resolve({
          status: 'bad',
          message: 'Image has excessive glare and cannot be analyzed. Please avoid reflections.',
          ...resultPayload
        });
        return;
      }
      
      // Check for 'warn' quality (soft warning)
      if (blurValue < WARN_BLUR_THRESHOLD) {
        resolve({
          status: 'warn',
          message: '⚠️ Image may be blurry. Extraction accuracy could be reduced.',
          ...resultPayload
        });
        return;
      }
      if (contrast < WARN_CONTRAST_THRESHOLD) {
        resolve({
          status: 'warn',
          message: '⚠️ Image contrast seems low. Extraction accuracy could be reduced.',
          ...resultPayload
        });
        return;
      }
      if (glare > WARN_GLARE_THRESHOLD) {
        resolve({
          status: 'warn',
          message: '⚠️ Glare detected on image. Extraction accuracy could be reduced.',
          ...resultPayload
        });
        return;
      }

      // If all checks pass, image is 'good'
      resolve({ status: 'good', message: 'Image quality is good.', ...resultPayload });
    };
    img.onerror = () => {
      resolve({ status: 'bad', message: 'Could not load image to check quality.' });
    };
    img.src = imageDataUrl;
  });
};
