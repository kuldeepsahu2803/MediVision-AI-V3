import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// 1. Global Rate Limiter Configuration
// Protects infrastructure by capping requests at 100 per hour per IP.
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Non-disruptive: Localhost is completely exempt from rate limiting
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    return (
      ip === '127.0.0.1' || 
      ip === '::1' || 
      ip === '::ffff:127.0.0.1' || 
      (typeof ip === 'string' && ip.includes('localhost'))
    );
  },
  message: {
    status: 429,
    error: 'Scan quota exceeded (100/hr). Please try again later or contact support.'
  }
});

// 2. Apply Rate Limiter BEFORE existing middleware
app.use(limiter);

// 3. Standard Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * API Proxy for Gemini Analysis
 * This ensures the rate limit actually protects the Gemini Quota.
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { contents, config } = req.body;
    
    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'Server API Key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use gemini-3-flash-preview for general text tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Gemini Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the SPA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`MediVision Backend active on port ${port}`);
  console.log(`Rate limiting active: 100 req/hr per IP (Localhost exempt)`);
});