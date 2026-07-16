import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  assertStructuredLlmResult,
  parseStructuredLlmResult,
  structuredLlmLimits,
} from '../shared/llmContract.js';

const root = process.cwd();
const artSourcePath = path.join(root, 'site/src/domain/miaoArt.ts');
const tarotSourcePath = path.join(root, 'site/src/domain/miaoTarot.ts');
const contentSourcePath = path.join(root, 'site/src/domain/miaoContent.ts');
const appSourcePath = path.join(root, 'site/src/App.tsx');
const functionSourcePath = path.join(root, 'functions/api/readings/analyze.js');
const packagePath = path.join(root, 'package.json');
const promptsPath = path.join(root, 'docs/generated/miao-art-prompts.json');
const memeBasePlanPath = path.join(root, 'docs/miao-meme-base-generation-plan.md');
const artReviewPath = path.join(root, 'docs/miao-art-review.md');
const runbookPath = path.join(root, 'docs/launch-runbook.md');
const redirectsPath = path.join(root, 'site/public/_redirects');
const headersPath = path.join(root, 'site/public/_headers');
const builtRedirectsPath = path.join(root, 'v1/_redirects');
const builtHeadersPath = path.join(root, 'v1/_headers');
const publicImageDir = path.join(root, 'site/public/assets/miao-cards');
const builtImageDir = path.join(root, 'v1/assets/miao-cards');
const sourceImageDir = path.join(root, 'references/miao-card-masters');
const memeBaseDir = path.join(root, 'references/miao-meme-bases');
const cardContactSheetPath = path.join(root, 'docs/generated/miao-card-contact-sheet.png');
const baseContactSheetPath = path.join(root, 'docs/generated/miao-meme-base-contact-sheet.png');

const expectedCount = 22;
const minImageSide = 1000;

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function extractBalanced(source, startIndex, openChar, closeChar) {
  let depth = 0;
  let inString = null;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }

    if (char === openChar) depth += 1;
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, index + 1);
    }
  }

  fail(`Could not find balanced ${openChar}${closeChar} block`);
}

function extractArrayLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) fail(`Could not find ${marker}`);
  const arrayStart = source.indexOf('[', markerIndex);
  if (arrayStart === -1) fail(`Could not find array for ${marker}`);
  return extractBalanced(source, arrayStart, '[', ']');
}

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) fail(`Could not find ${marker}`);
  const objectStart = source.indexOf('{', markerIndex);
  if (objectStart === -1) fail(`Could not find object for ${marker}`);
  return extractBalanced(source, objectStart, '{', '}');
}

function evaluateLiteral(literal) {
  return Function(`"use strict"; return (${literal});`)();
}

function readPngSize(filePath) {
  const buffer = readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    fail(`${filePath} is not a PNG`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function assertUnique(values, label) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    fail(`${label} contains duplicates: ${[...new Set(duplicates)].join(', ')}`);
  }
}

function assertSameSet(left, right, label) {
  const missing = left.filter((value) => !right.includes(value));
  const extra = right.filter((value) => !left.includes(value));
  if (missing.length > 0 || extra.length > 0) {
    fail(`${label} mismatch. Missing: ${missing.join(', ') || '-'}; Extra: ${extra.join(', ') || '-'}`);
  }
}

function assertImageDirectory(dirPath, expectedNames, label) {
  if (!existsSync(dirPath)) {
    fail(`${label} directory does not exist: ${dirPath}`);
  }

  const files = readdirSync(dirPath)
    .filter((file) => file.endsWith('.png'))
    .sort();
  assertSameSet(expectedNames, files, label);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = statSync(filePath);
    const size = readPngSize(filePath);
    if (size.width !== size.height) {
      fail(`${label}/${file} must be square, got ${size.width}x${size.height}`);
    }
    if (size.width < minImageSide) {
      fail(`${label}/${file} must be at least ${minImageSide}px wide, got ${size.width}px`);
    }
    if (stats.size < 100 * 1024) {
      fail(`${label}/${file} looks too small for a production card asset`);
    }
  }
}

function assertDeliveryDirectory(dirPath, expectedNames, label) {
  if (!existsSync(dirPath)) {
    fail(`${label} directory does not exist: ${dirPath}`);
  }

  const files = readdirSync(dirPath)
    .filter((file) => file.endsWith('.avif'))
    .sort();
  assertSameSet(expectedNames, files, label);

  for (const file of files) {
    const stats = statSync(path.join(dirPath, file));
    if (stats.size < 30 * 1024) {
      fail(`${label}/${file} looks too small for a production card asset`);
    }
    if (stats.size > 500 * 1024) {
      fail(`${label}/${file} exceeds the 500 KB delivery budget`);
    }
  }
}

const artSource = readText(artSourcePath);
const tarotSource = readText(tarotSourcePath);
const contentSource = readText(contentSourcePath);
const appSource = readText(appSourcePath);
const functionSource = readText(functionSourcePath);
const packageSource = readText(packagePath);
const prompts = JSON.parse(readText(promptsPath));
const memeBasePlan = readText(memeBasePlanPath);
const artReview = readText(artReviewPath);
const runbook = readText(runbookPath);
const redirects = readText(redirectsPath);
const headers = readText(headersPath);

if (!Array.isArray(prompts) || prompts.length !== expectedCount) {
  fail(`Expected ${expectedCount} generated image prompts, got ${Array.isArray(prompts) ? prompts.length : 'non-array'}`);
}

const rawDirections = evaluateLiteral(extractArrayLiteral(artSource, 'const rawDirections = ['));
const memeBases = evaluateLiteral(extractObjectLiteral(artSource, 'const memeBases'));
const generatedImages = evaluateLiteral(extractObjectLiteral(artSource, 'const generatedImages'));
const miaoCards = evaluateLiteral(extractObjectLiteral(tarotSource, 'export const miaoCards'));
const contentRevisions = evaluateLiteral(extractObjectLiteral(contentSource, 'export const miaoContentRevisions'));

const promptIds = prompts.map((record) => record.tarotId);
const directionIds = rawDirections.map((direction) => direction.tarotId);
const memeBaseIds = Object.keys(memeBases);
const generatedIds = Object.keys(generatedImages);
const miaoIds = Object.keys(miaoCards);
const contentRevisionIds = Object.keys(contentRevisions);
const expectedImageNames = promptIds.map((id) => `${id}.png`).sort();
const expectedDeliveryNames = promptIds.map((id) => `${id}.avif`).sort();

assertUnique(promptIds, 'prompt tarot ids');
assertUnique(directionIds, 'art direction tarot ids');
assertUnique(memeBaseIds, 'meme base tarot ids');
assertUnique(generatedIds, 'generated image ids');
assertUnique(miaoIds, 'Miao card ids');
assertUnique(contentRevisionIds, 'Miao content revision ids');

if (promptIds.length !== expectedCount) fail(`Expected ${expectedCount} prompt ids`);
if (directionIds.length !== expectedCount) fail(`Expected ${expectedCount} art directions`);
if (memeBaseIds.length !== expectedCount) fail(`Expected ${expectedCount} meme base mappings`);
if (miaoIds.length !== expectedCount) fail(`Expected ${expectedCount} Miao cards`);
if (generatedIds.length !== expectedCount) fail(`Expected ${expectedCount} generated image mappings`);

assertSameSet(promptIds, directionIds, 'prompt ids vs art directions');
assertSameSet(promptIds, memeBaseIds, 'prompt ids vs meme bases');
assertSameSet(promptIds, generatedIds, 'prompt ids vs generated images');
assertSameSet(promptIds, miaoIds, 'prompt ids vs Miao cards');
assertSameSet(promptIds, contentRevisionIds, 'prompt ids vs content revisions');

for (const [tarotId, revision] of Object.entries(contentRevisions)) {
  if (!/^\d+\.\d+\.\d+$/.test(revision)) {
    fail(`content revision for ${tarotId} must use semver, got ${revision}`);
  }
}

for (const record of prompts) {
  if (record.outputPath !== `references/miao-card-masters/${record.tarotId}.png`) {
    fail(`Unexpected outputPath for ${record.tarotId}: ${record.outputPath}`);
  }
  if (!Array.isArray(record.standardSymbols) || record.standardSymbols.length < 2 || record.standardSymbols.length > 5) {
    fail(`${record.tarotId} must preserve 2-5 standard Tarot symbols`);
  }
  if (!record.prompt.includes('Reference Tarot symbols to preserve:')) {
    fail(`${record.tarotId} prompt must include standard-symbol guidance`);
  }
  if (!record.memeBase || typeof record.memeBase !== 'object') {
    fail(`${record.tarotId} prompt record must include memeBase metadata`);
  }
  if (!record.prompt.includes('Meme base image:') || !record.prompt.includes('Formula: meme-base pose/expression')) {
    fail(`${record.tarotId} prompt must include meme-base formula guidance`);
  }
  if (!record.prompt.includes('not a traced copy') || !record.prompt.includes('original design only') || !record.prompt.includes('transform the base instead of tracing it')) {
    fail(`${record.tarotId} prompt must require original, transformed, non-traced output`);
  }
}

if (!existsSync(memeBaseDir)) {
  fail(`meme base directory does not exist: ${memeBaseDir}`);
}
for (const [tarotId, memeBase] of Object.entries(memeBases)) {
  const filePath = path.join(root, memeBase.baseImagePath);
  if (!existsSync(filePath)) {
    fail(`meme base image is missing for ${tarotId}: ${memeBase.baseImagePath}`);
  }
  const size = readPngSize(filePath);
  if (size.width < 100 || size.height < 100) {
    fail(`meme base image is too small for review: ${memeBase.baseImagePath}`);
  }
  if (!memeBase.miaotiAsset || !memeBase.rawSearch || !memeBase.behaviorAnchor || !memeBase.tarotFusion) {
    fail(`meme base metadata is incomplete for ${tarotId}`);
  }
}

for (const [tarotId, imagePath] of Object.entries(generatedImages)) {
  const expectedPath = `./assets/miao-cards/${tarotId}.avif`;
  if (imagePath !== expectedPath) {
    fail(`generatedImages.${tarotId} must be ${expectedPath}, got ${imagePath}`);
  }
}

assertImageDirectory(sourceImageDir, expectedImageNames, 'Miao card source images');
assertDeliveryDirectory(publicImageDir, expectedDeliveryNames, 'public Miao card images');
if (existsSync(builtImageDir)) {
  assertDeliveryDirectory(builtImageDir, expectedDeliveryNames, 'built Miao card images');
}

const promptNeedles = [
  '只输出 JSON',
  '不要重抽牌',
  '不要发明新牌',
  `title 不超过 ${structuredLlmLimits.title} 个中文字符`,
  'actions 给 3 条今天能做的小动作',
  `shareText 不超过 ${structuredLlmLimits.shareText} 个中文字符`,
  '不要说“命中注定”',
  '寻求专业支持',
];

for (const needle of promptNeedles) {
  if (!functionSource.includes(needle)) {
    fail(`LLM prompt contract is missing: ${needle}`);
  }
}

if (!functionSource.includes("'Cache-Control': 'no-store'")) {
  fail('Pages Function responses must include Cache-Control: no-store');
}

const publicUiForbiddenNeedles = [
  '复制生成图 Prompt',
  '标准图参考',
  'standardTarotReference',
];
for (const needle of publicUiForbiddenNeedles) {
  if (appSource.includes(needle)) {
    fail(`Default public UI still exposes internal production tooling: ${needle}`);
  }
}
if (!appSource.includes('showInternalTabs') || !appSource.includes("window.location.search).has('debug')")) {
  fail('Internal UI tabs must be gated behind local dev or ?debug=1');
}
if (!packageSource.includes('"verify:pages": "node scripts/verify-pages-dev.mjs"')) {
  fail('package.json must expose verify:pages');
}
if (!packageSource.includes('"prepare:meme-bases": "node scripts/prepare-miao-meme-bases.mjs"')) {
  fail('package.json must expose prepare:meme-bases');
}
if (!packageSource.includes('"review:art-sheets": "node scripts/build-miao-review-sheets.mjs"')) {
  fail('package.json must expose review:art-sheets');
}
if (!packageSource.includes('npm run verify:content && npm run verify:pages')) {
  fail('verify:launch must include the local Pages behavior gate');
}

const redirectNeedles = ['/miao /', '/miao/ /', '/v1/miao /', '/v1/miao/ /'];
for (const needle of redirectNeedles) {
  if (!redirects.includes(needle)) {
    fail(`Miao route alias is missing from _redirects: ${needle}`);
  }
}
if (existsSync(builtRedirectsPath)) {
  const builtRedirects = readText(builtRedirectsPath);
  for (const needle of redirectNeedles) {
    if (!builtRedirects.includes(needle)) {
      fail(`Built _redirects is missing: ${needle}`);
    }
  }
}

const headerNeedles = [
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '/api/*',
  'Cache-Control: no-store',
];
for (const needle of headerNeedles) {
  if (!headers.includes(needle)) {
    fail(`Launch headers are missing: ${needle}`);
  }
}
if (existsSync(builtHeadersPath)) {
  const builtHeaders = readText(builtHeadersPath);
  for (const needle of headerNeedles) {
    if (!builtHeaders.includes(needle)) {
      fail(`Built _headers is missing: ${needle}`);
    }
  }
}

const runbookNeedles = [
  'npx wrangler login',
  'npm run secret:llm',
  'npm run deploy',
  'npm run smoke:llm:local',
  'npm run verify:pages',
  'TAROT_LLM_ENDPOINT',
  '@cometpisces/tarot-kit',
  '@cometpisces/tarot-kit-images',
  'jurisdiction-specific copyright risk',
  '/api/readings/analyze',
  'site/public/_headers',
  'default public UI',
];
for (const needle of runbookNeedles) {
  if (!runbook.includes(needle)) {
    fail(`Launch runbook is missing: ${needle}`);
  }
}

const memeBasePlanNeedles = [
  'raw cat meme base image',
  'Prompt Formula',
  'MiaoTI',
  'references/miao-meme-bases/',
  'Review Rubric',
];
for (const needle of memeBasePlanNeedles) {
  if (!memeBasePlan.includes(needle)) {
    fail(`Meme-base generation plan is missing: ${needle}`);
  }
}

const reviewNeedles = [
  'Current Verdict',
  'End-to-End Image Analysis',
  'Base Candidate Review',
  'Regeneration Recommendation',
  'The current 22 card images are acceptable for a first public version',
];
for (const needle of reviewNeedles) {
  if (!artReview.includes(needle)) {
    fail(`Art review is missing: ${needle}`);
  }
}
for (const sheetPath of [cardContactSheetPath, baseContactSheetPath]) {
  if (!existsSync(sheetPath)) {
    fail(`Review contact sheet is missing: ${sheetPath}`);
  }
  const size = readPngSize(sheetPath);
  if (size.width < 800 || size.height < 600) {
    fail(`Review contact sheet is unexpectedly small: ${sheetPath}`);
  }
}

const sampleStructured = {
  title: '先稳住爪子',
  summary: '你现在更像一只刚要出门的猫。先确认方向，再迈出去。',
  cards: [
    {
      position: '焦点',
      reading: '焦点牌是愚者，传统牌义是新开始；翻译成猫语，是先别一爪踩空。',
    },
  ],
  actions: ['写下一个小动作', '先做十五分钟', '结束后再评估'],
  shareText: '今天先迈一小步',
};

assertStructuredLlmResult(sampleStructured, { expectedCards: 1 });
if (!parseStructuredLlmResult(JSON.stringify(sampleStructured))) {
  fail('shared LLM contract parser rejected a valid sample result');
}
if (parseStructuredLlmResult(JSON.stringify({ ...sampleStructured, actions: ['太少'] }))) {
  fail('shared LLM contract parser accepted an invalid actions array');
}

console.log(`Content launch verification ok: ${expectedCount} cards, ${expectedCount} images, structured LLM prompt contract.`);
