import { GoogleGenAI } from "@google/genai";
import { PrescriptionData, AiSuggestions } from '../types.ts';

// Initialize Gemini
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key not configured. Please set GEMINI_API_KEY in settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePrescription = async (images: { base64Data: string; mimeType: string }[]): Promise<Omit<PrescriptionData, 'id' | 'status'>> => {
  try {
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.base64Data.split(',')[1] || img.base64Data,
        mimeType: img.mimeType
      }
    }));

    const prompt = `
      Analyze this medical prescription image and extract the following information in JSON format.
      CRITICAL: For each medication, use Google Search to verify the correct spelling and existence of the medicine name.
      If the handwriting is unclear, provide the most likely standardized medicine name based on search results.

      Return the data in this JSON structure:
      {
        "patientName": "string",
        "date": "string (ISO format)",
        "doctorName": "string",
        "doctorSpecialty": "string",
        "clinicName": "string",
        "medication": [
          {
            "name": "string (original extracted text)",
            "dosage": "string",
            "frequency": "string",
            "duration": "string",
            "instructions": "string",
            "verification": {
              "status": "database_match | tentative_match | low_confidence",
              "color": "emerald | amber | rose",
              "normalizedName": "string (correctly spelled standard name)",
              "confidenceScore": number (0-1),
              "issues": ["string"],
              "lastChecked": "string (ISO date)"
            }
          }
        ]
      }
      
      Return ONLY the JSON object.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    const result = JSON.parse(response.text || "{}");
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
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    
    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1] || imageBase64,
        mimeType: "image/png"
      }
    };

    const prompt = `
      Focus on the area at coordinates ${coordinates.join(', ')} and re-read the handwriting. 
      Return only the text found.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] }
    });

    return response.text || "Illegible / Confidence Too Low";
  } catch (e) {
    console.error("Secure re-read failed:", e);
    return "Audit Service Unavailable";
  }
};

export const translateContent = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text || targetLanguage === 'en') return text;
    try {
        const ai = getAi();
        const model = "gemini-3-flash-preview";
        
        const prompt = `Translate the following medical text to ${targetLanguage}: "${text}". Return only the translated text.`;
        
        const response = await ai.models.generateContent({
          model,
          contents: prompt
        });

        return response.text || text;
    } catch (e) {
        return text;
    }
};

export const getTreatmentSuggestions = async (prescription: PrescriptionData): Promise<AiSuggestions> => {
    try {
      const ai = getAi();
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        Based on this prescription: ${JSON.stringify(prescription.medication)}, 
        provide clinical suggestions in JSON format:
        - criticalAlerts: array of strings (drug interactions, allergies, etc.)
        - generalRecommendations: array of strings (lifestyle, timing, etc.)
        
        Return ONLY the JSON object.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
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
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    
    const prompt = `
      Provide reference information for the drug "${drugName}" in JSON format:
      - description: string
      - category: string
      - usageNotes: string
      - precautions: string
      
      Return ONLY the JSON object.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as DrugReference;
  } catch (e) {
    console.error("Failed to fetch drug reference info:", e);
    throw e;
  }
};
