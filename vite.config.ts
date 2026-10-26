import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const workerSource = readFileSync(new URL('./dist/volume.worker.js', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  plugins: [react()],
  define: {
    __MEDVIEW_WORKER_SOURCE__: JSON.stringify(workerSource),
    __MEDVIEW_PACKAGE_NAME__: JSON.stringify(pkg.name),
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
