import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'references/miao-famous-memes/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const cacheDirectory = path.join(root, manifest.cacheDirectory);

if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) {
  throw new Error('Famous meme manifest must use schemaVersion 1 and contain assets');
}

mkdirSync(cacheDirectory, { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

for (const asset of manifest.assets) {
  if (asset.status !== 'research-only') {
    throw new Error(`${asset.id} must stay research-only until permission is recorded`);
  }

  const outputPath = path.join(cacheDirectory, asset.outputFile);
  if (asset.mediaType === 'image') {
    if (!existsSync(outputPath)) run('curl', ['-L', '--fail', '-o', outputPath, asset.sourceMediaUrl]);
    if (asset.expectedSha256 && sha256(outputPath) !== asset.expectedSha256) {
      throw new Error(`${asset.id} checksum changed; re-audit the source before use`);
    }
  } else if (asset.mediaType === 'video-frame') {
    if (!existsSync(outputPath)) {
      run('yt-dlp', ['--no-playlist', '--no-overwrites', '-o', outputPath, asset.originalPostUrl]);
    }
    const framePath = path.join(cacheDirectory, asset.frameFile);
    if (!existsSync(framePath)) {
      run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-ss', String(asset.frameTimeSeconds),
        '-i', outputPath, '-frames:v', '1', framePath,
      ]);
    }
  } else {
    throw new Error(`Unsupported media type for ${asset.id}: ${asset.mediaType}`);
  }
}

console.log(`Fetched ${manifest.assets.length} research-only famous meme sources into ${cacheDirectory}`);
