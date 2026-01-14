import { GoogleGenAI, Type } from "@google/genai";

const suggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
        generalRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["criticalAlerts", "generalRecommendations"]
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  try {
    const { medication } = req.body;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze pharmaceutical risks for: ${JSON.stringify(medication)}. Return JSON with criticalAlerts and generalRecommendations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionsSchema,
      },
    });

    let text = response.text || '{}';
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}