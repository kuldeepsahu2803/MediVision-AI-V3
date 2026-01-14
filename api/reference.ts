import { GoogleGenAI, Type } from "@google/genai";

const drugReferenceSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: "Summary of what the drug is." },
    category: { type: Type.STRING, description: "Therapeutic class." },
    usageNotes: { type: Type.STRING, description: "Brief usage instructions." },
    precautions: { type: Type.STRING, description: "Important warnings." }
  },
  required: ["description", "category", "usageNotes", "precautions"]
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  try {
    const { drugName } = req.body;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Provide general reference info for: ${drugName}. Be objective.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: drugReferenceSchema,
      },
    });

    let text = response.text || '{}';
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}