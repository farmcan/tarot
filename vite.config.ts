import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'site',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../v1',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
          if (id.includes('/@mantine/')) return 'vendor-mantine';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
          if (id.includes('/@cometpisces/tarot-kit/')) return 'vendor-tarot';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
});
