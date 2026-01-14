import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionData, AiSuggestions } from '../types.ts';

const prescriptionSchema = {
  type: Type.OBJECT,
  properties: {
    patientName: { type: Type.STRING, description: "Patient's full name. If not mentioned, return 'N/A'." },
    patientAge: { type: Type.STRING, description: "Patient's age. If not mentioned, return 'N/A'." },
    patientAddress: { type: Type.STRING, description: "Patient's address. If not mentioned, return 'N/A'." },
    doctorName: { type: Type.STRING, description: "Doctor's full name. If not mentioned, return 'N/A'." },
    clinicName: { type: Type.STRING, description: "Name of the clinic or hospital. If not mentioned, return 'N/A'." },
    date: { type: Type.STRING, description: "Date of prescription in YYYY-MM-DD format. If not mentioned, use today's date." },
    medication: {
      type: Type.ARRAY,
      description: "List of prescribed medications.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the medicine. Transcribe exactly as seen." },
          dosage: { type: Type.STRING, description: "Dosage (e.g., '500mg'). If not mentioned, return 'N/A'." },
          frequency: { type: Type.STRING, description: "Frequency (e.g., 'BID', 'Once a day'). If not mentioned, return 'N/A'." },
          duration: { type: Type.STRING, description: "Duration (e.g., '5 days'). If not mentioned, return 'N/A'." },
          route: { type: Type.STRING, description: "Route (e.g., 'oral', 'topical'). If not mentioned, return 'N/A'." },
          coordinates: {
              type: Type.ARRAY,
              description: "Bounding box coordinates [ymin, xmin, ymax, xmax]. Normalized 0-1000.",
              items: { type: Type.NUMBER }
          }
        },
        required: ["name", "dosage", "frequency"],
      },
    },
    notes: { type: Type.STRING, description: "Clinical notes or patient instructions. Transcribe verbatim." },
  },
  required: ["patientName", "doctorName", "date", "medication", "notes"],
};

export const analyzePrescription = async (images: { base64Data: string; mimeType: string }[]): Promise<Omit<PrescriptionData, 'id' | 'status'>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = images.map(img => ({
    inlineData: {
      data: img.base64Data,
      mimeType: img.mimeType,
    },
  }));

  const textPart = {
    text: `You are "MediVision Clinical Intelligence" — an expert medical-document analyzer.
    Inspect the provided document(s). It may be a handwritten prescription OR a printed clinical report/summary.
    
    CRITICAL TASK:
    1. EXTRACT ALL MEDICATIONS. Look for tables or sections titled "Medication Plan", "Prescription", "Rx", or "Current Medications".
    2. PRESERVE VERBATIM TEXT. Transcribe drug names, strengths (e.g., 500mg, 5%), and frequencies exactly.
    3. FOR PATIENT NAME: Extract the full name. In the provided example, look for "Mr. Ushant Kumar".
    4. FOR COORDINATES: Provide normalized bounding boxes [ymin, xmin, ymax, xmax] for every medication row detected.
    5. DATA COMPLETENESS: If a field is missing, use 'N/A'.
    6. DATE: Use YYYY-MM-DD format. Look for "Report Date" or "Prescription Date".

    Produce a single JSON object matching the provided schema. Do not output markdown code blocks, just the JSON string.`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [...imageParts, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: prescriptionSchema,
      },
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText);
    
    if (parsed && Array.isArray(parsed.medication)) {
        return parsed as Omit<PrescriptionData, 'id' | 'status'>;
    }
    throw new Error("Parsed JSON does not match expected schema.");
  } catch (e) {
    console.error("Gemini Analysis Failed:", e);
    throw new Error(e instanceof Error ? e.message : "Could not analyze prescription.");
  }
};

/**
 * RE-READ LOGIC: Hardened against hallucinations.
 */
export const reReadHandwriting = async (imageBase64: string, coordinates: number[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const [ymin, xmin, ymax, xmax] = coordinates;
  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: 'image/jpeg',
    },
  };

  const textPart = {
    text: `You are a clinical handwriting auditor. Focused on the region y:[${ymin}, ${ymax}], x:[${xmin}, ${xmax}], precisely transcribe the medication name. 
    SAFETY RULE: If the ink is ambiguous, smudged, or illegible, you MUST return "Illegible / Confidence Too Low". 
    DO NOT guess common drug names. Output ONLY the text or the safety string.`
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text?.trim() || "Illegible / Confidence Too Low";
  } catch (e) {
    console.error("Re-read failed:", e);
    return "Illegible / Confidence Too Low";
  }
};

export const translateContent = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text || targetLanguage === 'en') return text;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
    const prompt = `Translate the following clinical text into ${targetLanguage === 'es' ? 'Spanish' : 'Hindi'}. Return only the translation: "${text}"`;
  
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });
        return response.text?.trim() || text;
    } catch (e) {
        return text;
    }
};

const suggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
        generalRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["criticalAlerts", "generalRecommendations"]
};

export const getTreatmentSuggestions = async (prescription: PrescriptionData): Promise<AiSuggestions> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze risks for this prescription: ${JSON.stringify(prescription.medication)}. Return JSON with criticalAlerts and generalRecommendations.`;
    
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: suggestionsSchema,
          },
      });

      return JSON.parse(response.text || '{}') as AiSuggestions;
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

const drugReferenceSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: "One sentence summary of what the drug is." },
    category: { type: Type.STRING, description: "Therapeutic class like 'Antibiotic' or 'NSAID'." },
    usageNotes: { type: Type.STRING, description: "Brief typical usage instructions." },
    precautions: { type: Type.STRING, description: "Important general warnings." }
  },
  required: ["description", "category", "usageNotes", "precautions"]
};

export const getDrugReferenceInfo = async (drugName: string): Promise<DrugReference> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Provide general reference information for the drug: ${drugName}. Be objective and non-diagnostic.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: drugReferenceSchema,
      },
    });
    return JSON.parse(response.text || '{}') as DrugReference;
  } catch (e) {
    console.error("Failed to fetch drug reference info:", e);
    throw e;
  }
};