import { GoogleGenAI, Type } from "@google/genai";

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Use the key configured on Vercel dashboard
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Clinical API Key (GEMINI_API_KEY) not configured on the Vercel dashboard.' });
  }

  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No prescription images provided for analysis.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const imageParts = images.map((img: any) => ({
      inlineData: {
        data: img.base64Data,
        mimeType: img.mimeType,
      },
    }));

    const textPart = {
      text: `You are "MediVision Clinical Intelligence" — a world-class expert in medical document digitization.
      
      TASK:
      1. Inspect the provided prescription image(s) with extreme precision.
      2. Extract all patient, doctor, and clinic metadata.
      3. Transcribe every medication listed precisely.
      4. Provide bounding box coordinates [ymin, xmin, ymax, xmax] for each medication name to assist in audit verification.
      
      RULES:
      - Use YYYY-MM-DD for all dates.
      - If a field is not present, use 'N/A'.
      - Output strictly valid JSON matching the schema.`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High-quality reasoning for medical OCR
      contents: { parts: [...imageParts, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: prescriptionSchema,
      },
    });

    const contentText = response.text;
    if (!contentText) {
        throw new Error("Clinical engine returned an empty response.");
    }
    
    const parsed = JSON.parse(contentText);
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Vercel API Error (Analyze):', error);
    const statusCode = error.message?.includes('API key') ? 401 : 500;
    return res.status(statusCode).json({ error: error.message || 'Internal Clinical Engine Error during analysis.' });
  }
}