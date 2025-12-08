import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to dist/spa for Render Static Site
    outDir: 'dist/spa',
    emptyOutDir: true,
    // Standard rollup options (bundling everything)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', '@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 3000,
  }
});