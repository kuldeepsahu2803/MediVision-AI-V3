import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  try {
    const { imageBase64, coordinates } = req.body;
    const [ymin, xmin, ymax, xmax] = coordinates;
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
          { text: `Precisely transcribe the medication name in y:[${ymin}, ${ymax}], x:[${xmin}, ${xmax}]. If illegible, return "Illegible".` }
        ]
      }
    });

    return res.status(200).json({ text: response.text?.trim() });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}