import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { cards } from '@cometpisces/tarot-kit';
import { getMiaoContentBundle } from '../site/src/domain/miaoContent';
import { defineMiaoContentPack } from '../site/src/content-packs/types';
import { createMiaoContentPackRegistry } from '../site/src/domain/miaoContentPackRegistry';
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

const fixtureBasePack = defineMiaoContentPack({
  id: 'fixture-base',
  version: '1.0.0',
  name: 'Fixture base',
  shortName: 'Base',
  description: 'Test-only base content.',
  scope: 'major',
  artStyle: 'Base style',
  cards: {
    'the-fool': {
      breed: '流浪田园黑猫',
      copy: { memeCaption: 'Inherited caption', tinyAction: 'Inherited action' },
    },
  },
});
const fixtureChalkPack = defineMiaoContentPack({
  id: 'fixture-chalk',
  version: '1.0.0',
  name: 'Fixture chalk',
  shortName: 'Chalk',
  description: 'Test-only data and image override.',
  scope: 'full',
  artStyle: 'Chalk doodle',
  fallbackPackId: 'fixture-base',
  images: {
    basePath: './assets/miao-packs/fixture-chalk',
    cardIds: ['the-fool'],
  },
  cards: {
    'the-fool': {
      copy: { memeCaption: 'Chalk caption' },
    },
  },
});
const fixtureRegistry = createMiaoContentPackRegistry(
  [fixtureBasePack, fixtureChalkPack],
  fixtureChalkPack.id,
);
const fixtureOverride = fixtureRegistry.getCardOverride(fixtureChalkPack.id, 'the-fool');
assert.equal(fixtureRegistry.getCardIds(fixtureChalkPack.id).length, 78);
assert.equal(fixtureOverride?.breed, '流浪田园黑猫');
assert.equal(fixtureOverride?.image, './assets/miao-packs/fixture-chalk/the-fool.avif');
assert.equal(fixtureOverride?.copy?.memeCaption, 'Chalk caption');
assert.equal(fixtureOverride?.copy?.tinyAction, 'Inherited action');
assert.throws(
  () => createMiaoContentPackRegistry([
    { ...fixtureBasePack, fallbackPackId: fixtureChalkPack.id },
    fixtureChalkPack,
  ], fixtureBasePack.id),
  /Circular content pack fallback/,
);
assert.throws(
  () => createMiaoContentPackRegistry([
    { ...fixtureChalkPack, fallbackPackId: 'missing-pack' },
  ], fixtureChalkPack.id),
  /Unknown fallback content pack/,
);
assert.throws(
  () => createMiaoContentPackRegistry([
    { ...fixtureChalkPack, images: { basePath: './fixture', cardIds: ['not-a-tarot-card'] } },
  ], fixtureChalkPack.id),
  /Unknown image tarot id/,
);

console.log('Content pack verification ok: registration, inheritance safety, third-party fixture, 22/78 pools, copy, breeds, and images.');
