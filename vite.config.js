import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile() {
  try {
    const envPath = resolve(__dirname, '.env');
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    for (const line of lines) {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        process.env[key] = value;
      }
    }
  } catch {}
}

function vercelApiPlugin() {
  loadEnvFile();

  return {
    name: 'vercel-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        const params = Object.fromEntries(url.searchParams.entries());

        const apiPath = resolve(__dirname, `api${url.pathname}.js`);

        try {
          const fileUrl = new URL(`file:///${apiPath.replace(/\\/g, '/')}`).href;
          const handler = (await import(fileUrl)).default;
          const mockReq = {
            method: req.method,
            headers: req.headers,
            query: params,
          };
          const mockRes = {
            status(code) {
              res.statusCode = code;
              return mockRes;
            },
            setHeader(key, value) {
              res.setHeader(key, value);
              return mockRes;
            },
            json(data) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
          };

          await handler(mockReq, mockRes);
        } catch (err) {
          console.error('API handler error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error', details: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), vercelApiPlugin()],
  build: {
    target: 'es2018'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/web-react', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true,
    allowedHosts: true
  }
});
