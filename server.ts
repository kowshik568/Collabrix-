import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as backendApp } from './backend/src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // backendApp provides /health, /api/auth, /api/profile, /api/opportunities, /api/applications
  const app = backendApp;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
      },
      appType: 'spa',
      root: path.resolve(__dirname, 'frontend'),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Collabrix server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start Collabrix server:', err);
  process.exit(1);
});
