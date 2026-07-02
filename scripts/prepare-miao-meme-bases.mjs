import { mkdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const artSourcePath = path.join(root, 'site/src/domain/miaoArt.ts');

function extractObject(source, name) {
  const start = source.indexOf(`const ${name}:`);
  if (start === -1) {
    throw new Error(`Could not find ${name}`);
  }

  const objectStart = source.indexOf('{', start);
  const objectEnd = source.indexOf('};', objectStart);
  if (objectEnd === -1) {
    throw new Error(`Could not find ${name} terminator`);
  }

  const literal = source.slice(objectStart, objectEnd + 1);
  return Function(`"use strict"; return (${literal});`)();
}

function convertWithSips(sourcePath, outputPath) {
  const result = spawnSync('/usr/bin/sips', ['-s', 'format', 'png', sourcePath, '--out', outputPath], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`sips failed for ${sourcePath}: ${result.stderr || result.stdout}`);
  }
}

const artSource = await readFile(artSourcePath, 'utf8');
const memeBases = extractObject(artSource, 'memeBases');

await mkdir(path.join(root, 'references/miao-meme-bases'), { recursive: true });

for (const [tarotId, memeBase] of Object.entries(memeBases)) {
  const sourcePath = path.resolve(root, memeBase.miaotiAsset);
  const outputPath = path.resolve(root, memeBase.baseImagePath);
  convertWithSips(sourcePath, outputPath);
  console.log(`${tarotId}: ${memeBase.code} -> ${memeBase.baseImagePath}`);
}

console.log(`Prepared ${Object.keys(memeBases).length} MiaoTarot meme base images.`);
