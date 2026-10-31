import { defineConfig, type Plugin } from 'vite';
import { cards } from '@cometpisces/tarot-kit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const root = path.dirname(fileURLToPath(import.meta.url));
const majors = cards.filter((card) => card.arcana === 'major');

/** Copy only the pilot's compatible assets, never the full public directory. */
export function minitoolCardAssets(): Plugin {
  return {
    name: 'minitool-compatible-cat-assets',
    async generateBundle() {
      for (const card of majors) {
        const source = await readFile(path.join(root, 'site/public/minitool-assets', `${card.id}.jpg`));
        this.emitFile({ type: 'asset', fileName: `minitool-assets/${card.id}.jpg`, source });
      }
    },
  };
}

export default defineConfig({
  root: path.join(root, 'site'),
  base: './',
  publicDir: false,
  plugins: [minitoolCardAssets()],
  build: {
    outDir: path.join(root, 'dist-minitool'),
    emptyOutDir: true,
    target: 'chrome61',
    cssTarget: 'chrome61',
    modulePreload: false,
    rollupOptions: {
      input: path.join(root, 'site/minitool.html'),
      output: { format: 'iife' },
    },
  },
});
