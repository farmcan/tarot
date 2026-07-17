import { mkdirSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'node_modules/@cometpisces/tarot-kit-images/images');
const outputDir = path.join(root, 'site/public/assets/tarot-standard');

mkdirSync(outputDir, { recursive: true });

for (const filename of readdirSync(sourceDir).filter((file) => file.endsWith('.png')).sort()) {
  const result = spawnSync('sips', [
    '-s', 'format', 'avif',
    '-s', 'formatOptions', '66',
    path.join(sourceDir, filename),
    '--out', path.join(outputDir, filename.replace(/\.png$/, '.avif')),
  ], { stdio: 'inherit' });

  if (result.status !== 0) throw new Error(`Could not convert ${filename}.`);
}

console.log('Synced 78 standard Tarot fallback images.');
