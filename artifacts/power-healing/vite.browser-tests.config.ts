// Separate test server: never enable emulator connections in the production app.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const root = import.meta.dirname;
const firebaseFixture = path.resolve(root, '../../tests/browser/firebase.ts');

export default defineConfig({
  root,
  // Ignore workspace .env files: no real Firebase or payment credentials in tests.
  envDir: false,
  base: '/',
  plugins: [
    {
      name: 'isolated-browser-test-firebase',
      enforce: 'pre',
      resolveId(source, importer) {
        const target = source.startsWith('.') && importer
          ? path.resolve(path.dirname(importer), source) : source;
        const productionFirebase = path.join(root, 'src/lib/firebase');
        if (source === '@/lib/firebase' || target === productionFirebase
          || target === `${productionFirebase}.ts`) {
          return firebaseFixture;
        }
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': path.join(root, 'src') },
    dedupe: ['react', 'react-dom', 'firebase'],
  },
  server: { host: '0.0.0.0', port: 3199, strictPort: true, allowedHosts: true },
});
