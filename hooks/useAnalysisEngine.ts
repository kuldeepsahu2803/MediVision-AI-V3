import { useState, useCallback } from 'react';
import { PrescriptionData } from '../types.ts';
import { analyzePrescription } from '../services/geminiService.ts';
import { preprocessImageForOCR } from '../lib/imageProcessing.ts';

export const useAnalysisEngine = (isLoggedIn: boolean) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const addImages = useCallback((newFiles: File[]) => {
    const allFiles = [...imageFiles, ...newFiles];
    setImageFiles(allFiles);
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
    if (imageFiles.length === 0) {
      const msg = "Please select at least one image.";
      setError(msg);
      throw new Error(msg);
    }

    setIsLoading(true);
    setError(null);
    setPrescriptionData(null);

    // Yield to the main thread to allow the loading spinner to render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // 1. Efficient Preprocessing
      const processedImagesPromises = imageFiles.map(file => preprocessImageForOCR(file));
      const processedBase64s = await Promise.all(processedImagesPromises);

      const imagesPayload = processedBase64s.map((base64Url, index) => {
        const base64Data = base64Url.split(',')[1];
        return { base64Data, mimeType: imageFiles[index].type || 'image/jpeg' };
      });
      
      // 2. Call Gemini
      const result = await analyzePrescription(imagesPayload);
      
      const dataWithId: PrescriptionData = { 
        ...result, 
        id: `rx-${Date.now()}`, 
        status: 'AI-Extracted' as const,
        imageQuality: 'Good',
        imageQualityMessage: null,
        imageUrls: imageUrls
      };
      setPrescriptionData(dataWithId);
    } catch (err: unknown) {
      console.error("Analysis Pipeline Error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setError(errorMessage);
      // Re-throw so the workflow hook can handle UI feedback properly
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [imageFiles, imageUrls]);

  return {
    imageFiles,
    imageUrls,
    prescriptionData,
    setPrescriptionData,
    isLoading,
    error,
    qualityWarning: null,
    addImages,
    removeImage,
    clear,
    analyze
  };
};