import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const artSourcePath = path.join(root, 'site/src/domain/miaoArt.ts');
const tarotSourcePath = path.join(root, 'site/src/domain/miaoTarot.ts');
const doodlePackSourcePath = path.join(root, 'site/src/content-packs/doodleFull.ts');
const outputDir = path.join(root, 'docs/generated');

function extractArray(source, name) {
  const start = source.indexOf(`const ${name} = [`);
  if (start === -1) {
    throw new Error(`Could not find ${name}`);
  }

  const arrayStart = source.indexOf('[', start);
  const arrayEnd = source.indexOf('] as const;', arrayStart);
  if (arrayEnd === -1) {
    throw new Error(`Could not find ${name} terminator`);
  }

  const literal = source.slice(arrayStart, arrayEnd + 1);
  return Function(`"use strict"; return (${literal});`)();
}

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

function extractArtStyle(source) {
  const start = source.indexOf('export const miaoTarotArtStyle = [');
  if (start === -1) {
    throw new Error('Could not find miaoTarotArtStyle');
  }

  const arrayStart = source.indexOf('[', start);
  const arrayEnd = source.indexOf("].join('; ');", arrayStart);
  if (arrayEnd === -1) {
    throw new Error('Could not find miaoTarotArtStyle terminator');
  }

  const literal = source.slice(arrayStart, arrayEnd + 1);
  return Function(`"use strict"; return (${literal});`)().join('; ');
}

function extractMiaoNames(source) {
  const names = new Map();
  const blockPattern = /tarotId: '([^']+)',\n\s+miaoName: '([^']+)',/g;
  let match = blockPattern.exec(source);
  while (match) {
    names.set(match[1], match[2]);
    match = blockPattern.exec(source);
  }
  return names;
}

function buildPrompt(cardTitle, direction, artStyle, breed) {
  return [
    `Use case: stylized-concept`,
    `Asset type: MiaoTarot square result card image`,
    `Primary request: Create an original cat meme tarot illustration for the MiaoTarot card "${cardTitle}".`,
    `Style/medium: ${artStyle}.`,
    `Cat identity: ${breed}; make its coat, face, ears, body shape, and fur length unmistakable.`,
    `Meme base image: use ${direction.memeBase.baseImagePath} (${direction.memeBase.name}) as the pose/expression anchor.`,
    `Meme behavior to preserve: ${direction.memeBase.behaviorAnchor}.`,
    `Tarot fusion rule: ${direction.memeBase.tarotFusion}.`,
    `Reference Tarot symbols to preserve: ${direction.standardSymbols.join(', ')}.`,
    `Scene/backdrop: ${direction.catScene}.`,
    `Composition/framing: ${direction.composition}.`,
    `Lighting/mood: polished, emotionally readable, playful but not cheap.`,
    `Formula: meme-base pose/expression + 2-4 Rider-Waite symbols + Miao card emotional state + clean product illustration.`,
    `Constraints: no embedded text, no watermark, no logo, no human portrait, no gore, original design only, transform the base instead of tracing it.`,
    `Avoid: copying the Rider-Waite card literally, copying the meme image literally, busy tiny details, mystical horror, extra animals.`,
  ].join('\n');
}

const [artSource, tarotSource, doodlePackSource] = await Promise.all([
  readFile(artSourcePath, 'utf8'),
  readFile(tarotSourcePath, 'utf8'),
  readFile(doodlePackSourcePath, 'utf8'),
]);

const directions = extractArray(artSource, 'rawDirections');
const memeBases = extractObject(artSource, 'memeBases');
const artStyle = extractArtStyle(artSource);
const miaoNames = extractMiaoNames(tarotSource);
const majorBreeds = extractObject(doodlePackSource, 'majorBreeds');

const records = directions.map((direction) => {
  const title = miaoNames.get(direction.tarotId) || direction.tarotId;
  const memeBase = memeBases[direction.tarotId];
  if (!memeBase) {
    throw new Error(`Missing meme base for ${direction.tarotId}`);
  }
  const mergedDirection = { ...direction, memeBase };
  return {
    tarotId: direction.tarotId,
    title,
    breed: majorBreeds[direction.tarotId],
    outputPath: `references/miao-pack-masters/doodle/${direction.tarotId}.png`,
    memeBase,
    standardSymbols: direction.standardSymbols,
    prompt: buildPrompt(title, mergedDirection, artStyle, majorBreeds[direction.tarotId]),
  };
});

const markdown = [
  '# MiaoTarot Image Prompts',
  '',
  'Generated from `site/src/domain/miaoArt.ts` and `site/src/domain/miaoTarot.ts`.',
  '',
  ...records.flatMap((record, index) => [
    `## ${String(index + 1).padStart(2, '0')} ${record.title}`,
    '',
    `- Tarot id: \`${record.tarotId}\``,
    `- Output: \`${record.outputPath}\``,
    `- Cat identity: ${record.breed}`,
    `- Meme base: ${record.memeBase.code} · ${record.memeBase.name}`,
    `- Base image: \`${record.memeBase.baseImagePath}\``,
    `- Raw search: ${record.memeBase.rawSearch}`,
    `- Symbols: ${record.standardSymbols.join(' / ')}`,
    '',
    '```text',
    record.prompt,
    '```',
    '',
  ]),
].join('\n');

await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDir, 'miao-art-prompts.json'), `${JSON.stringify(records, null, 2)}\n`),
  writeFile(path.join(outputDir, 'miao-art-prompts.md'), markdown),
]);

console.log(`Exported ${records.length} MiaoTarot image prompts to docs/generated/`);
