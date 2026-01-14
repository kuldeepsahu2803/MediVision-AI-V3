import { PrescriptionData, AiSuggestions } from '../types.ts';

/**
 * Robustly extracts JSON from a string that might contain Markdown formatting.
 */
const extractJson = (text: string) => {
    try {
        // First try direct parse
        return JSON.parse(text);
    } catch (e) {
        // Fallback: try to find content between ```json and ```
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            return JSON.parse(match[1]);
        }
        // Last resort: find first { and last }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
        throw e;
    }
};

/**
 * SECURITY ARCHITECTURE:
 * Instead of calling Google SDK from the client (leaking keys), 
 * we proxy through Vercel Serverless Functions.
 */
const callSecureApi = async (endpoint: string, payload: any) => {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Clinical Engine Error (${response.status})`);
    }

    return response.json();
};

export const analyzePrescription = async (images: { base64Data: string; mimeType: string }[]): Promise<Omit<PrescriptionData, 'id' | 'status'>> => {
  try {
    const result = await callSecureApi('analyze', { images });
    if (result && Array.isArray(result.medication)) {
        return result as Omit<PrescriptionData, 'id' | 'status'>;
    }
    throw new Error("Parsed clinical data does not match the required schema.");
  } catch (e) {
    console.error("Secure Analysis Pipeline Failed:", e);
    throw new Error(e instanceof Error ? e.message : "The clinical vision engine failed to process the request.");
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