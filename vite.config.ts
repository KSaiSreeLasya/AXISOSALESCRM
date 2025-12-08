import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to dist/spa for Render Static Site
    outDir: 'dist/spa',
    emptyOutDir: true,
    rollupOptions: {
      // Externalize these libraries so Vite doesn't try to bundle them.
      // This fixes the "failed to resolve react-is" error.
      external: [
        'react',
        'react-dom',
        'recharts',
        '@google/genai',
        '@supabase/supabase-js',
        'lucide-react'
      ]
    }
  },
  server: {
    port: 3000,
  }
});