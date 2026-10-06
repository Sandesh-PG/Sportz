import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth routes keep /api
      '/api/auth': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      },

      // Existing API routes remove /api
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});