import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionData, AiSuggestions } from '../types.ts';

// Initialize Gemini directly in the frontend
// The environment handles process.env.GEMINI_API_KEY injection
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Clinical API Key (GEMINI_API_KEY) is not configured. Please check your environment settings.");
  }
  return new GoogleGenAI({ apiKey });
};

const prescriptionSchema = {
  type: Type.OBJECT,
  properties: {
    patientName: { type: Type.STRING, description: "Patient's full name. If not mentioned, return 'N/A'." },
    patientNameConfidence: { type: Type.NUMBER, description: "Confidence score for patient name (0-1)." },
    patientAge: { type: Type.STRING, description: "Patient's age. If not mentioned, return 'N/A'." },
    patientAgeConfidence: { type: Type.NUMBER, description: "Confidence score for patient age (0-1)." },
    patientAddress: { type: Type.STRING, description: "Patient's address. If not mentioned, return 'N/A'." },
    patientAddressConfidence: { type: Type.NUMBER, description: "Confidence score for patient address (0-1)." },
    doctorName: { type: Type.STRING, description: "Doctor's full name. If not mentioned, return 'N/A'." },
    doctorNameConfidence: { type: Type.NUMBER, description: "Confidence score for doctor name (0-1)." },
    clinicName: { type: Type.STRING, description: "Name of the clinic or hospital. If not mentioned, return 'N/A'." },
    clinicNameConfidence: { type: Type.NUMBER, description: "Confidence score for clinic name (0-1)." },
    date: { type: Type.STRING, description: "Date of prescription in YYYY-MM-DD format. If not mentioned, use today's date." },
    dateConfidence: { type: Type.NUMBER, description: "Confidence score for date (0-1)." },
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
          confidence: { type: Type.NUMBER, description: "Overall confidence score for this medication entry (0-1)." },
          reasoning: { type: Type.STRING, description: "Brief reasoning trace for this extraction (e.g., 'Matched cursive script to Amoxicillin based on starting letters and common dosage')." },
          coordinates: {
              type: Type.ARRAY,
              description: "Bounding box coordinates [ymin, xmin, ymax, xmax]. Normalized 0-1000.",
              items: { type: Type.NUMBER }
          }
        },
        required: ["name", "dosage", "frequency", "confidence", "reasoning"],
      },
    },
    notes: { type: Type.STRING, description: "Clinical notes or patient instructions. Transcribe verbatim." },
    notesConfidence: { type: Type.NUMBER, description: "Confidence score for notes (0-1)." },
    translatedNotes: { type: Type.STRING, description: "If the notes are in a regional language (e.g., Hindi, Marathi), provide a professional English translation. If already in English, return 'N/A'." },
    patientSummary: { type: Type.STRING, description: "A jargon-free, plain-language summary specifically for the patient, explaining how to take their meds and any key precautions." },
  },
  required: ["patientName", "doctorName", "date", "medication", "notes", "patientSummary"],
};

const drugReferenceSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    category: { type: Type.STRING },
    usageNotes: { type: Type.STRING },
    precautions: { type: Type.STRING }
  },
  required: ["description", "category", "usageNotes", "precautions"]
};

const suggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
        generalRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["criticalAlerts", "generalRecommendations"]
};

/**
 * Robustly extracts JSON from a string that might contain Markdown formatting or truncation.
 */
const extractJson = (text: string) => {
  try {
    // First try direct parse
    return JSON.parse(text);
  } catch (e) {
    // Fallback: try to find content between ```json and ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (innerE) {
        // Continue to next fallback
      }
    }
    // Last resort: find first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (innerE) {
        // If still failing, it might be truncated. 
        // We could try to close it, but it's better to throw and let the user retry with more tokens.
        throw innerE;
      }
    }
    throw e;
  }
};

export const analyzePrescription = async (images: { base64Data: string; mimeType: string }[]): Promise<Omit<PrescriptionData, 'id' | 'status'>> => {
  try {
    const ai = getAi();
    
    const imageParts = images.map((img: any) => ({
      inlineData: {
        data: img.base64Data,
        mimeType: img.mimeType,
      },
    }));

    const textPart = {
      text: `You are "RxSnap Clinical Intelligence" — a world-class expert in medical document digitization.
      
      TASK:
      1. Inspect the provided prescription image(s) with extreme precision.
      2. Extract all patient, doctor, and clinic metadata with confidence scores.
      3. Transcribe every medication listed precisely.
      4. For each medication, provide:
         - A confidence score (0-1).
         - A "Reasoning Trace": Explain your logic for the extraction (e.g., how you interpreted difficult handwriting or matched a partial name).
         - Bounding box coordinates [ymin, xmin, ymax, xmax] for the medication name.
      5. Multilingual Support: If any clinical notes or instructions are in a regional Indian language (Hindi, etc.), transcribe them verbatim in 'notes' and provide an English translation in 'translatedNotes'.
      6. Patient Education: Generate a 'patientSummary' in simple, jargon-free English that explains the treatment plan to the patient.
      
      RULES:
      - Use YYYY-MM-DD for all dates.
      - If a field is not present, use 'N/A'.
      - Output strictly valid JSON matching the schema.`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts: [...imageParts, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: prescriptionSchema,
        maxOutputTokens: 4096
      },
    });

    const contentText = response.text;
    if (!contentText) {
        throw new Error("Clinical engine returned an empty response.");
    }
    
    const result = extractJson(contentText);
    
    if (result && Array.isArray(result.medication)) {
      return {
        ...result,
        patientName: result.patientName || 'N/A',
        doctorName: result.doctorName || 'N/A',
        date: result.date || new Date().toISOString().split('T')[0],
        medication: result.medication.map((m: any) => ({
          ...m,
          name: m.name || 'Unknown Medicine',
          dosage: m.dosage || 'N/A',
          frequency: m.frequency || 'N/A',
          duration: m.duration || 'N/A',
          route: m.route || 'N/A'
        }))
      } as Omit<PrescriptionData, 'id' | 'status'>;
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
    const [ymin, xmin, ymax, xmax] = coordinates;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
          { text: `Precisely transcribe the ink within the specific region: y:[${ymin}, ${ymax}], x:[${xmin}, ${xmax}]. Focus only on medication data. If the ink is completely illegible, return "Illegible".` }
        ]
      }
    });

    return response.text?.trim() || "Illegible / Confidence Too Low";
  } catch (e) {
    console.error("Secure re-read failed:", e);
    return "Audit Service Unavailable";
  }
};

export const translateContent = async (text: string, targetLanguage: string): Promise<string> => {
    if (!text || targetLanguage === 'en') return text;
    try {
        const ai = getAi();
        const prompt = `Translate the following medical text to ${targetLanguage}: "${text}". Return only the translated text.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
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
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Review this regimen for risks or guidance: ${JSON.stringify(prescription.medication)}. Return JSON findings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: suggestionsSchema,
        },
      });

      return extractJson(response.text || '{}') as AiSuggestions;
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Provide a clinical reference for: ${drugName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: drugReferenceSchema,
      },
    });

    return extractJson(response.text || '{}') as DrugReference;
  } catch (e) {
    console.error("Failed to fetch drug reference info:", e);
    throw e;
  }
};
