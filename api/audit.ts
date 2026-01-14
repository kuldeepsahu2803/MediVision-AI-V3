import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key missing' });

  try {
    const { imageBase64, coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates)) {
        return res.status(400).json({ error: 'Coordinates missing for audit.' });
    }
    
    const [ymin, xmin, ymax, xmax] = coordinates;
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
          { text: `Precisely transcribe the ink within the specific region: y:[${ymin}, ${ymax}], x:[${xmin}, ${xmax}]. Focus only on medication data. If the ink is completely illegible, return "Illegible".` }
        ]
      }
    });

    return res.status(200).json({ text: response.text?.trim() });
  } catch (error: any) {
    console.error('Audit API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}