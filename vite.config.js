import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset paths relative so the same build works on
// GitHub Pages (/repo-name/), Netlify, Vercel, Firebase Hosting, or locally.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
});
