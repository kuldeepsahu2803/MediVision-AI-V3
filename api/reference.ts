import { GoogleGenAI, Type } from "@google/genai";

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  try {
    const { drugName } = req.body;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Provide a clinical reference for: ${drugName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: drugReferenceSchema,
      },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}