import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to dist/spa for Render Static Site
    outDir: 'dist/spa',
    emptyOutDir: true
  },
  server: {
    port: 3000,
  }
});