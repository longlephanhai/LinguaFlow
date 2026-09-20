import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.json';

// https://crxjs.dev/vite-plugin
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@linguaflow/shared-types': resolve(__dirname, '../../packages/shared-types/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist-extension',
  },
});
