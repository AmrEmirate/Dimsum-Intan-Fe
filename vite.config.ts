import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-v105-[hash].js',
        chunkFileNames: 'assets/[name]-v105-[hash].js',
        assetFileNames: 'assets/[name]-v105-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
