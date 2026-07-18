import { mkdirSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'references/miao-pack-masters/doodle');
const outputDir = path.join(root, 'site/public/assets/miao-packs/doodle');
const files = readdirSync(sourceDir).filter((file) => file.endsWith('.png')).sort();

mkdirSync(outputDir, { recursive: true });
for (const filename of files) {
  const source = path.join(sourceDir, filename);
  const output = path.join(outputDir, filename.replace(/\.png$/, '.avif'));
  const result = spawnSync('sips', [
    '-s', 'format', 'avif',
    '-s', 'formatOptions', '68',
    source,
    '--out', output,
  ], { stdio: 'inherit' });

  if (result.error?.code === 'ENOENT') {
    throw new Error('Doodle pack optimization requires macOS sips with AVIF write support.');
  }
  if (result.status !== 0) {
    throw new Error(`Could not optimize ${path.relative(root, source)}.`);
  }
}

console.log(`Optimized ${files.length} doodle content-pack images.`);
