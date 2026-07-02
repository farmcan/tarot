import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const root = process.cwd();
const outputDir = path.join(root, 'docs/generated');
const cardOrder = [
  'the-fool',
  'the-magician',
  'the-high-priestess',
  'the-empress',
  'the-emperor',
  'the-hierophant',
  'the-lovers',
  'the-chariot',
  'strength',
  'the-hermit',
  'wheel-of-fortune',
  'justice',
  'the-hanged-man',
  'death',
  'temperance',
  'the-devil',
  'the-tower',
  'the-star',
  'the-moon',
  'the-sun',
  'judgement',
  'the-world',
];

function resizeNearest(src, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / src.width, maxHeight / src.height);
  const width = Math.max(1, Math.round(src.width * scale));
  const height = Math.max(1, Math.round(src.height * scale));
  const dst = new PNG({ width, height, colorType: 6 });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(src.width - 1, Math.floor(x / scale));
      const sy = Math.min(src.height - 1, Math.floor(y / scale));
      const sourceIndex = (sy * src.width + sx) * 4;
      const targetIndex = (y * width + x) * 4;
      dst.data[targetIndex] = src.data[sourceIndex];
      dst.data[targetIndex + 1] = src.data[sourceIndex + 1];
      dst.data[targetIndex + 2] = src.data[sourceIndex + 2];
      dst.data[targetIndex + 3] = src.data[sourceIndex + 3];
    }
  }

  return dst;
}

function buildSheet(files, outputPath, options = {}) {
  const {
    cell = 180,
    pad = 8,
    cols = 6,
    background = 250,
  } = options;
  const rows = Math.ceil(files.length / cols);
  const out = new PNG({ width: cols * cell, height: rows * cell, colorType: 6 });
  out.data.fill(background);

  files.forEach((file, index) => {
    const source = PNG.sync.read(readFileSync(file));
    const image = resizeNearest(source, cell - pad * 2, cell - pad * 2);
    const x = (index % cols) * cell + Math.floor((cell - image.width) / 2);
    const y = Math.floor(index / cols) * cell + Math.floor((cell - image.height) / 2);
    PNG.bitblt(image, out, 0, 0, image.width, image.height, x, y);
  });

  writeFileSync(outputPath, PNG.sync.write(out));
}

mkdirSync(outputDir, { recursive: true });

buildSheet(
  cardOrder.map((tarotId) => path.join(root, 'site/public/assets/miao-cards', `${tarotId}.png`)),
  path.join(outputDir, 'miao-card-contact-sheet.png'),
);

buildSheet(
  readdirSync(path.join(root, 'references/miao-meme-bases'))
    .filter((file) => file.endsWith('.png'))
    .sort()
    .map((file) => path.join(root, 'references/miao-meme-bases', file)),
  path.join(outputDir, 'miao-meme-base-contact-sheet.png'),
);

console.log('Built MiaoTarot review contact sheets in docs/generated/');
