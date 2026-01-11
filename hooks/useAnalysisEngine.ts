
import { useState, useCallback } from 'react';
import { PrescriptionData } from '../types.ts';
import { analyzePrescription } from '../services/geminiService.ts';
import { preprocessImageForOCR } from '../lib/imageProcessing.ts';

interface AnalysisEngineState {
    imageFiles: File[];
    imageUrls: string[];
    prescriptionData: PrescriptionData | null;
    isLoading: boolean;
    error: string | null;
    qualityWarning: string | null;
}

export const useAnalysisEngine = (isLoggedIn: boolean) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // qualityWarning state removed

  const addImages = useCallback((newFiles: File[]) => {
    const allFiles = [...imageFiles, ...newFiles];
    setImageFiles(allFiles);
    // Reset data on new upload to force re-analysis or clear old state
    setPrescriptionData(null);
    setError(null);
    
    const newUrlPromises = newFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newUrlPromises).then(newUrls => {
      setImageUrls(prev => [...prev, ...newUrls]);
    });
  }, [imageFiles]);
  
  const removeImage = useCallback((indexToRemove: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
  }, []);

  const clear = useCallback(() => {
    setImageFiles([]);
    setImageUrls([]);
    setPrescriptionData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const analyze = useCallback(async () => {
    // AUTH CHECK REMOVED: Guests can analyze, they just save locally.
    
    if (imageFiles.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrescriptionData(null);

    // 2. Preprocessing & API Call
    try {
      // Preprocess images (Grayscale + Thresholding) for better OCR
      const processedImagesPromises = imageFiles.map(file => preprocessImageForOCR(file));
      const processedBase64s = await Promise.all(processedImagesPromises);

      const imagesPayload = processedBase64s.map((base64Url) => {
        // preprocessImageForOCR returns a data URL (data:image/jpeg;base64,...)
        const base64Data = base64Url.split(',')[1];
        return { base64Data, mimeType: 'image/jpeg' };
      });
      
      const result = await analyzePrescription(imagesPayload);
      
      const dataWithId: PrescriptionData = { 
        ...result, 
        id: `rx-${Date.now()}`, 
        status: 'AI-Extracted' as const,
        imageQuality: 'Good', // Default to good
        imageQualityMessage: null,
        imageUrls: imageUrls // Keep original URLs for display
      };
      setPrescriptionData(dataWithId);
    } catch (err: unknown) {
      if (err instanceof Error) setError(`Analysis failed: ${err.message}`);
      else setError("An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFiles, imageUrls]); // Removed isLoggedIn dependency

  return {
    imageFiles,
    imageUrls,
    prescriptionData,
    setPrescriptionData,
    isLoading,
    error,
    qualityWarning: null, // Always null now
    addImages,
    removeImage,
    clear,
    analyze
  };
};
