import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Change output directory to match Render's expectation (dist/spa)
    outDir: 'dist/spa',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});