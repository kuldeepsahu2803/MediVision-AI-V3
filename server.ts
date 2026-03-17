import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  // 1. Global Rate Limiter Configuration
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
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

  app.use(limiter);
  app.use(express.json({ limit: '10mb' }));

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`RxSnap Backend active on port ${port}`);
  });
}

startServer();
