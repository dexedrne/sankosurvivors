import { defineConfig } from 'vite';
import { wavedashEdition } from './tools/wavedash/edition.mjs';
export default defineConfig({
  base: './', envDir: false,
  plugins: [wavedashEdition()],
  build: { outDir: 'dist-wavedash', chunkSizeWarningLimit: 1500 },
});
