import { mkdirSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const cardSourceDir = path.join(root, 'references/miao-card-masters');
const cardOutputDir = path.join(root, 'site/public/assets/miao-cards');
const uiSourceDir = path.join(root, 'references/ui-masters');
const backOutputDir = path.join(root, 'site/public/assets/card-backs');

function convert(source, output, quality, crop) {
  mkdirSync(path.dirname(output), { recursive: true });
  const cropArgs = crop
    ? ['--cropToHeightWidth', String(crop.height), String(crop.width)]
    : [];
  const result = spawnSync('sips', [
    ...cropArgs,
    '-s', 'format', 'avif',
    '-s', 'formatOptions', String(quality),
    source,
    '--out', output,
  ], { stdio: 'inherit' });

  if (result.error?.code === 'ENOENT') {
    throw new Error('Asset optimization requires macOS sips with AVIF write support.');
  }
  if (result.status !== 0) {
    throw new Error(`Could not optimize ${path.relative(root, source)}.`);
  }
}

for (const filename of readdirSync(cardSourceDir).filter((file) => file.endsWith('.png')).sort()) {
  convert(
    path.join(cardSourceDir, filename),
    path.join(cardOutputDir, filename.replace(/\.png$/, '.avif')),
    68,
  );
}

for (const name of [
  'sun-chase',
  'feline-guardians',
  'moon-sleepers',
  'paw-tapestry',
  'paws-touch-star',
  'peek-portal',
]) {
  convert(
    path.join(uiSourceDir, `${name}.png`),
    path.join(backOutputDir, `${name}.avif`),
    72,
    { width: 816, height: 1428 },
  );
}
convert(path.join(uiSourceDir, 'miao-hero.png'), path.join(root, 'site/public/assets/miao-hero.avif'), 72);

console.log('Optimized MiaoTarot delivery assets from PNG masters.');
