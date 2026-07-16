import assert from 'node:assert/strict';
import { cards } from '@cometpisces/tarot-kit';
import {
  miaoMinorCards,
  miaoMinorRankOrder,
  type MiaoMinorSuit,
} from '../site/src/domain/miaoMinorArcana';

const concepts = Object.values(miaoMinorCards);
const tarotMinorIds = cards.filter((card) => card.arcana === 'minor').map((card) => card.id).sort();
const conceptIds = concepts.map((concept) => concept.tarotId).sort();

assert.equal(concepts.length, 56);
assert.deepEqual(conceptIds, tarotMinorIds);
assert.equal(new Set(conceptIds).size, 56);

for (const suit of ['cups', 'pentacles', 'swords', 'wands'] satisfies MiaoMinorSuit[]) {
  const suitCards = concepts.filter((concept) => concept.suit === suit);
  assert.equal(suitCards.length, 14);
  assert.deepEqual(suitCards.map((concept) => concept.rank), miaoMinorRankOrder);
  assert.deepEqual(
    suitCards.map((concept) => concept.sequence),
    Array.from({ length: 14 }, (_, index) => index + 1),
  );
}

for (const concept of concepts) {
  assert.match(concept.revision, /^\d+\.\d+\.\d+$/);
  assert.ok(concept.miaoName.length >= 5);
  assert.ok(concept.scene.length >= 8);
  assert.ok(concept.uprightHook.length >= 20);
  assert.ok(concept.reversedHook.length >= 20);
  assert.ok(concept.memeFamilies.length >= 1);
}

console.log('Minor Arcana concept verification ok: 4 suits, 14 cards each, 56 standard ids.');
