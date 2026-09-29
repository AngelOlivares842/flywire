// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/mosca/**', '**/public/data/**']
      }
    },
    optimizeDeps: {
      exclude: ['@mlc-ai/web-llm'],
      entries: ['src/**/*.{js,jsx,ts,tsx}'] // Force Vite to only scan src/ for dependencies, skipping mosca/ and public/
    },
    worker: {
      format: 'es'
    }
  }
});