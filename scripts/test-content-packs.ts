import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { cards } from '@cometpisces/tarot-kit';
import { getMiaoContentBundle } from '../site/src/domain/miaoContent';
import {
  DEFAULT_MIAO_CONTENT_PACK_ID,
  getMiaoContentPack,
  getMiaoContentPackCardIds,
  getMiaoPackCardOverride,
  miaoContentPacks,
} from '../site/src/domain/miaoContentPacks';

assert.equal(DEFAULT_MIAO_CONTENT_PACK_ID, 'doodle-full');
assert.equal(new Set(miaoContentPacks.map((pack) => pack.id)).size, miaoContentPacks.length);
assert.equal(getMiaoContentPackCardIds('classic-major').length, 22);
assert.equal(getMiaoContentPackCardIds('doodle-full').length, 78);
assert.equal(getMiaoContentPack('missing').id, DEFAULT_MIAO_CONTENT_PACK_ID);
assert.equal(readdirSync(path.join(process.cwd(), 'site/public/assets/miao-packs/doodle')).filter((file) => file.endsWith('.avif')).length, 22);
assert.equal(readdirSync(path.join(process.cwd(), 'site/public/assets/tarot-standard')).filter((file) => file.endsWith('.avif')).length, 78);

const tarotIds = new Set(cards.map((card) => card.id));
for (const pack of miaoContentPacks) {
  assert.match(pack.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(pack.version, /^\d+\.\d+\.\d+$/);
  assert.ok(getMiaoContentPackCardIds(pack).every((id) => tarotIds.has(id)));
}

for (const card of cards) {
  const override = getMiaoPackCardOverride('doodle-full', card.id);
  assert.ok(override?.breed, `Missing cat breed for ${card.id}`);
  const bundle = getMiaoContentBundle(card.id, 'doodle-full');
  assert.equal(bundle.contentPackId, 'doodle-full');
  assert.equal(bundle.catBreed, override.breed);
  assert.equal(bundle.copy.tarotId, card.id);
  assert.ok(bundle.copy.uprightMiaoMeaning.length >= 18);
  assert.ok(bundle.copy.reversedMiaoMeaning.length >= 18);
  assert.ok(bundle.art.generatedImage);
  const relativeImagePath = bundle.art.generatedImage?.replace(/^\.\//, 'site/public/');
  assert.ok(relativeImagePath && existsSync(path.join(process.cwd(), relativeImagePath)));
}

assert.match(
  getMiaoContentBundle('the-fool', 'doodle-full').art.generatedImage || '',
  /miao-packs\/doodle\/the-fool\.avif$/,
);
assert.match(
  getMiaoContentBundle('the-hierophant', 'doodle-full').art.generatedImage || '',
  /miao-packs\/doodle\/the-hierophant\.avif$/,
);
assert.match(
  getMiaoContentBundle('ace-of-cups', 'doodle-full').art.generatedImage || '',
  /tarot-standard\/Cups01\.avif$/,
);

console.log('Content pack verification ok: registered packs, inheritance, 22/78 pools, copy, breeds, and images.');
