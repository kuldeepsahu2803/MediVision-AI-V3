
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// 1. Global Infrastructure Protection
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Clinical API quota exceeded. Please wait 1 hour.' }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * SECURE CLINICAL GATEWAY
 * All sensitive external calls happen here. API Keys never touch the browser.
 */
app.post('/api/clinical/:action', async (req, res) => {
  const { action } = req.params;
  const { payload, config } = req.body;
  
  if (!process.env.API_KEY) {
    return res.status(500).json({ error: 'Server key not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    switch (action) {
      case 'analyze':
        const analyzeResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: payload,
          config: config
        });
        return res.json({ text: analyzeResponse.text });

      case 'reread':
        const rereadResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: payload,
          config: { thinkingConfig: { thinkingBudget: 200 } }
        });
        return res.json({ text: rereadResponse.text });

      case 'reference':
        const refResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: payload,
          config: config
        });
        return res.json({ text: refResponse.text });

      default:
        return res.status(400).json({ error: 'Invalid clinical action' });
    }
  } catch (error) {
    console.error(`Clinical Proxy Error [${action}]:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`MediVision Clinical Gateway active on port ${port}`);
});
