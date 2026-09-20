import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@linguaflow/shared-types': resolve(__dirname, '../../packages/shared-types/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to NestJS backend in development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
