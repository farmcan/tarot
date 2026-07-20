import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { cards, getLocalizedText } from '@cometpisces/tarot-kit';
import { getMiaoContentBundle } from '../site/src/domain/miaoContent';
import { defineMiaoContentPack } from '../site/src/content-packs/types';
import { createMiaoContentPackRegistry } from '../site/src/domain/miaoContentPackRegistry';
import {
  DEFAULT_MIAO_CONTENT_PACK_ID,
  getMiaoContentPack,
  getMiaoContentPackCardIds,
  getMiaoContentPackFrame,
  getMiaoPackCardOverride,
  miaoContentPacks,
} from '../site/src/domain/miaoContentPacks';
import {
  CARD_FRAME_IDS,
  cardFrameSkins,
  DEFAULT_CARD_FRAME_ID,
  getCardFrameSkin,
} from '../site/src/domain/cardFrames';
import { getCardKeyword, getCardMeaningZhHans, getCardName } from '../site/src/domain/tarot';
import { toSimplifiedChinese } from '../site/src/domain/locale';

assert.equal(DEFAULT_MIAO_CONTENT_PACK_ID, 'doodle-full');
assert.equal(new Set(miaoContentPacks.map((pack) => pack.id)).size, miaoContentPacks.length);
assert.equal(getMiaoContentPackCardIds('classic-major').length, 22);
assert.equal(getMiaoContentPackCardIds('doodle-full').length, 78);
assert.equal(getMiaoContentPack('missing').id, DEFAULT_MIAO_CONTENT_PACK_ID);
assert.equal(Object.keys(cardFrameSkins).length, CARD_FRAME_IDS.length);
assert.equal(getCardFrameSkin('missing').id, DEFAULT_CARD_FRAME_ID);
assert.equal(getMiaoContentPackFrame('doodle-full').id, 'inked-paper');
assert.equal(getMiaoContentPackFrame('classic-major').id, 'gilded');
assert.equal(new Set(Object.values(cardFrameSkins).map((frame) => frame.imagePath)).size, CARD_FRAME_IDS.length);
for (const frame of Object.values(cardFrameSkins)) {
  assert.ok(existsSync(path.join(process.cwd(), 'site/public', frame.imagePath)), `Missing frame asset: ${frame.imagePath}`);
  assert.match(frame.imagePath, new RegExp(`${frame.id}\\.svg$`));
}
assert.equal(readdirSync(path.join(process.cwd(), 'site/public/assets/miao-packs/doodle')).filter((file) => file.endsWith('.avif')).length, 78);
assert.equal(readdirSync(path.join(process.cwd(), 'site/public/assets/tarot-standard')).filter((file) => file.endsWith('.avif')).length, 78);

const minorPromptRecords = JSON.parse(
  readFileSync(path.join(process.cwd(), 'docs/generated/miao-minor-art-prompts.json'), 'utf8'),
) as Array<{
  aspectRatio?: string;
  recommendedSize?: { width?: number; height?: number };
  prompt?: string;
}>;
assert.equal(minorPromptRecords.length, 56);
for (const record of minorPromptRecords) {
  assert.equal(record.aspectRatio, '5:7');
  assert.deepEqual(record.recommendedSize, { width: 1020, height: 1428 });
  assert.match(record.prompt || '', /native portrait 5:7/);
  assert.match(record.prompt || '', /never as a square image/);
}

for (const [packId, expectedCards] of [['classic-major', 22], ['doodle-full', 78]] as const) {
  const htmlPath = path.join(process.cwd(), 'docs/generated/content-packs', `${packId}.html`);
  const html = readFileSync(htmlPath, 'utf8');
  assert.equal((html.match(/<article class="card"/g) || []).length, expectedCards);
  for (const match of html.matchAll(/<img src="([^"]+)"/g)) {
    const imagePath = path.resolve(path.dirname(htmlPath), match[1]);
    assert.ok(existsSync(imagePath), `Missing HTML image for ${packId}: ${match[1]}`);
  }
}

const tarotIds = new Set(cards.map((card) => card.id));
for (const pack of miaoContentPacks) {
  assert.match(pack.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(pack.version, /^\d+\.\d+\.\d+$/);
  assert.ok(CARD_FRAME_IDS.includes(getMiaoContentPackFrame(pack.id).id));
  assert.ok(getMiaoContentPackCardIds(pack).every((id) => tarotIds.has(id)));
}

for (const card of cards) {
  const override = getMiaoPackCardOverride('doodle-full', card.id);
  assert.ok(override?.breed, `Missing cat breed for ${card.id}`);
  const bundle = getMiaoContentBundle(card.id, 'doodle-full');
  assert.equal(bundle.contentPackId, 'doodle-full');
  assert.equal(bundle.catBreed, override.breed);
  assert.equal(bundle.copy.tarotId, card.id);
  assert.equal(bundle.copy.miaoName, getCardName(card));
  assert.notEqual(bundle.copy.memeCaption, toSimplifiedChinese(getLocalizedText(card.description, 'zh')));
  assert.notEqual(bundle.copy.uprightMiaoMeaning, getCardMeaningZhHans({ card, orientation: 'upright' }));
  assert.notEqual(bundle.copy.reversedMiaoMeaning, getCardMeaningZhHans({ card, orientation: 'reversed' }));
  assert.equal(bundle.copy.emotionalSignal, getCardKeyword(card));
  assert.equal(bundle.copy.tinyAction, toSimplifiedChinese(getLocalizedText(card.readingAspects.advice.upright, 'zh')));
  assert.equal(toSimplifiedChinese(JSON.stringify(bundle.copy)), JSON.stringify(bundle.copy));
  assert.ok(bundle.copy.uprightMiaoMeaning.length > 0);
  assert.ok(bundle.copy.reversedMiaoMeaning.length > 0);
  assert.ok(bundle.art.generatedImage);
  const relativeImagePath = bundle.art.generatedImage?.replace(/^\.\//, 'site/public/');
  assert.ok(relativeImagePath && existsSync(path.join(process.cwd(), relativeImagePath)));
}

const chariotCopy = getMiaoContentBundle('the-chariot', 'doodle-full').copy;
assert.equal(chariotCopy.miaoName, '战车');
assert.doesNotMatch(JSON.stringify(chariotCopy), /凌晨跑酷|施工猫/);

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
  /miao-packs\/doodle\/ace-of-cups\.avif$/,
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

console.log('Content pack verification ok: registration, inheritance safety, third-party fixture, 22/78 pools, prompts, HTML, copy, breeds, and images.');
