import { PrescriptionData, AiSuggestions } from '../types.ts';

/**
 * SECURITY ARCHITECTURE:
 * Proxy through Vercel Serverless Functions to protect sensitive API keys.
 */
const callSecureApi = async (endpoint: string, payload: any) => {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            // Detect missing server configuration
            if (response.status === 500 && errData.error?.includes('Key')) {
                throw new Error("Configuration Error: The clinical API key is missing from your Vercel Environment Variables. Please set GEMINI_API_KEY and redeploy.");
            }
            throw new Error(errData.error || `Clinical Engine Error (${response.status})`);
        }

        return await response.json();
    } catch (e: any) {
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            throw new Error("Connectivity Error: Could not reach the clinical engine. Ensure you are online.");
        }
        throw e;
    }
};

export const analyzePrescription = async (images: { base64Data: string; mimeType: string }[]): Promise<Omit<PrescriptionData, 'id' | 'status'>> => {
  try {
    const result = await callSecureApi('analyze', { images });
    if (result && Array.isArray(result.medication)) {
        return result as Omit<PrescriptionData, 'id' | 'status'>;
    }
    throw new Error("Validation Error: Parsed data does not match the clinical schema.");
  } catch (e: any) {
    console.error("Analysis Pipeline Failed:", e);
    throw new Error(e.message || "The clinical vision engine failed to process the request.");
  }
};

export const reReadHandwriting = async (imageBase64: string, coordinates: number[]): Promise<string> => {
  try {
    const result = await callSecureApi('audit', { imageBase64, coordinates });
    return result.text || "Illegible / Confidence Too Low";
  } catch (e) {
    console.error("Secure re-read failed:", e);
    return "Audit Service Unavailable";
  }
};

export const translateContent = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text || targetLanguage === 'en') return text;
    try {
        const result = await callSecureApi('translate', { text, targetLanguage });
        return result.text || text;
    } catch (e) {
        return text;
    }
};

export const getTreatmentSuggestions = async (prescription: PrescriptionData): Promise<AiSuggestions> => {
    try {
      const result = await callSecureApi('suggest', { medication: prescription.medication });
      return result as AiSuggestions;
    } catch (e) {
      return { criticalAlerts: [], generalRecommendations: [] };
    }
};

export interface DrugReference {
  description: string;
  category: string;
  usageNotes: string;
  precautions: string;
}

export const getDrugReferenceInfo = async (drugName: string): Promise<DrugReference> => {
  try {
    const result = await callSecureApi('reference', { drugName });
    return result as DrugReference;
  } catch (e) {
    console.error("Failed to fetch drug reference info:", e);
    throw e;
  }
};