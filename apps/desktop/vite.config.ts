import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist-renderer",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'fabric-vendor': ['fabric'],
          'ui-vendor': ['lucide-react', 'recharts', 'clsx'],
          'utils-vendor': ['xlsx', 'jspdf', 'jszip']
        }
      }
    }
  },
  server: {
    port: 5180
  }
});
