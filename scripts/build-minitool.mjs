import { build } from 'vite';
import { mkdir, readFile, readdir, realpath, rename, stat, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cards } from '@cometpisces/tarot-kit';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'site/public/minitool-assets');
await mkdir(assets, { recursive: true });
for (const card of cards.filter((item) => item.arcana === 'major')) {
  // Resizing only: approved masters remain untouched, without cropping or stretching.
  await sharp(path.join(root, 'references/miao-pack-masters/doodle', `${card.id}.png`))
    .resize({ width: 510, withoutEnlargement: true }).flatten({ background: '#fbf7ef' })
    .jpeg({ quality: 78 }).toFile(path.join(assets, `${card.id}.jpg`));
}
if (process.argv.includes('--assets-only')) {
  console.log('Prepared 22 portrait JPEGs in site/public/minitool-assets.');
  process.exit(0);
}
await build({ configFile: path.join(root, 'vite.minitool.config.ts'),
  define: { __MIAO_MINITOOL_OFFLINE__: 'true' },
});
const output = path.join(root, 'dist-minitool');
// The official CLI compares import.meta.url with argv; canonicalize macOS /tmp
// to /private/tmp so that its main guard actually executes.
const officialSkillDir = process.env.MIAOTAROT_MINITOOL_SKILL_DIR
  ? await realpath(process.env.MIAOTAROT_MINITOOL_SKILL_DIR) : null;
const html = (await readFile(path.join(output, 'minitool.html'), 'utf8'))
  .replace(/type="module"\s*/g, 'defer ').replace(/\s+crossorigin(?:="[^"]*")?/g, '');
await writeFile(path.join(output, 'minitool.html'), html);
await rename(path.join(output, 'minitool.html'), path.join(output, 'index.html'));
const dependency = JSON.parse(await readFile(path.join(root, 'node_modules/@cometpisces/tarot-kit/package.json'), 'utf8'));
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
let upstreamLicense = null;
for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
  try { upstreamLicense = await readFile(path.join(root, 'node_modules/@cometpisces/tarot-kit', name), 'utf8'); break; } catch { /* npm artifact may omit its license file */ }
}
const mitText = `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
// JSON is an allowed mini-tool artifact type; a second HTML or a TXT is not.
await writeFile(path.join(output, 'NOTICES.json'), JSON.stringify({
  thirdParty: [{
    name: dependency.name, version: dependency.version, license: dependency.license,
    source: 'https://www.npmjs.com/package/@cometpisces/tarot-kit',
    integrity: lock.packages['node_modules/@cometpisces/tarot-kit'].integrity,
    licenseText: upstreamLicense ?? mitText,
    copyrightNotice: upstreamLicense ? 'Preserved verbatim in licenseText.' : 'The published npm artifact supplies no copyright notice or LICENSE file; no author/year has been invented.',
  }],
  artwork: 'Existing approved MiaoTarot doodle portrait masters, resized to JPEG without cropping; no Rider-Waite image package is distributed.',
}, null, 2));
if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(html)) throw new Error('Inline script in mini-tool output.');
if (/https?:\/\//.test(html)) throw new Error('External URL in mini-tool HTML.');
async function inventory(directory) {
  const entries = [];
  for (const name of (await readdir(directory)).sort()) {
    const full = path.join(directory, name);
    const info = await stat(full);
    if (info.isDirectory()) entries.push(...await inventory(full));
    else entries.push({ path: path.relative(output, full), bytes: info.size });
  }
  return entries;
}
const files = await inventory(output);
const allowedExtensions = new Set(['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json']);
if (files.filter((file) => file.path.endsWith('.html')).map((file) => file.path).join() !== 'index.html') throw new Error('The ZIP must contain one root index.html.');
for (const file of files) {
  if (!allowedExtensions.has(path.extname(file.path)) || /(?:^|\/)(?:\.git|node_modules|\.DS_Store|\.high_consumption)(?:\/|$)/.test(file.path)) throw new Error(`Unsupported artifact: ${file.path}`);
  if (!/\.(?:js|css|html)$/.test(file.path)) continue;
  const content = await readFile(path.join(output, file.path), 'utf8');
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|RTCPeerConnection|eval|WebAssembly|OffscreenCanvas|Worker|SharedWorker)\b|new\s+Function\b|\.download\s*=|\b(?:import|export)\s*(?:\(|\{|\*)/.test(content)) {
    throw new Error(`Forbidden/dynamic capability requires review: ${file.path}`);
  }
}
// Semantic review of this pilot: DOM + ordinary Canvas 2D only. No workers,
// offscreen rendering, WASM, Unity/Cocos or other game engine starts. The guard
// above makes newly introduced heavy/dynamic paths stop before reusing false.
const manifestPath = path.join(output, 'mini_tool.json');
let officialAudit = null;
if (officialSkillDir) {
  const writer = path.join(officialSkillDir, 'scripts/write_manifest.mjs');
  execFileSync(process.execPath, [writer, output, 'unknown'], { encoding: 'utf8' });
  execFileSync(process.execPath, [writer, output, 'false'], { encoding: 'utf8' });
  officialAudit = execFileSync(process.execPath, [path.join(officialSkillDir, 'scripts/audit_artifact.mjs'), output], { encoding: 'utf8' });
} else await writeFile(manifestPath, JSON.stringify({ is_high_consumption_scene: false }) + '\n');
files.push({ path: 'mini_tool.json', bytes: (await stat(manifestPath)).size });
const totalBytes = files.reduce((total, file) => total + file.bytes, 0);
// Official static audit still does not prove simulator/device/review acceptance.
const zip = path.join(root, 'artifacts', 'miaotarot-minitool-pilot.zip');
await mkdir(path.dirname(zip), { recursive: true });
execFileSync('zip', ['-q', '-r', '-FS', zip, '.'], { cwd: output });
const zipBytes = (await stat(zip)).size;
if (zipBytes > 10 * 1024 * 1024) throw new Error('Mini-tool ZIP exceeds 10 MiB.');
if (officialSkillDir) officialAudit += execFileSync(process.execPath, [path.join(officialSkillDir, 'scripts/audit_artifact.mjs'), zip], { encoding: 'utf8' });
const evidence = {
  output, zip, files: files.length, totalBytes, zipBytes,
  zipSha256: createHash('sha256').update(await readFile(zip)).digest('hex'),
  highConsumption: false, officialAudit,
  status: officialSkillDir ? 'official-static-audit-only' : 'local-pilot-not-platform-audited',
  pending: ['Creator-platform simulator', 'Android device scan', 'iOS device scan', 'Platform review'],
};
await mkdir(path.join(root, 'artifacts/minitool-pilot'), { recursive: true });
await writeFile(path.join(root, 'artifacts/minitool-pilot/build-audit.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
