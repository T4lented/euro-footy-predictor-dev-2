import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
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
    open: true
  }
});
