import assert from 'node:assert/strict';
import { createMiaoReadingFromDrawn } from '../site/src/domain/miaoTarot';
import {
  createInitialDrawState,
  createInteractiveDeck,
  getSelectedDrawnCards,
  interactiveDrawReducer,
} from '../site/src/domain/interactiveDraw';

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

const uprightSession = createInteractiveDeck({
  includeReversals: false,
  random: seededRandom(42),
});
assert.equal(uprightSession.deck.length, 22);
assert.equal(new Set(uprightSession.deck.map((item) => item.card.id)).size, 22);
assert.ok(uprightSession.deck.every((item) => item.orientation === 'upright'));

const reversedSession = createInteractiveDeck({
  includeReversals: true,
  random: () => 0,
});
assert.ok(reversedSession.deck.every((item) => item.orientation === 'reversed'));

let state = createInitialDrawState('three-card');
state = interactiveDrawReducer(state, {
  type: 'START_SHUFFLE',
  deck: reversedSession.deck,
  backTheme: reversedSession.backTheme,
});
assert.equal(state.stage, 'shuffling');
state = interactiveDrawReducer(state, { type: 'FINISH_SHUFFLE' });
assert.equal(state.stage, 'selecting');

const chosen = [state.deck[8], state.deck[2], state.deck[17]];
for (const card of chosen) {
  state = interactiveDrawReducer(state, { type: 'TOGGLE_SELECTION', hiddenId: card.hiddenId });
}
assert.deepEqual(state.selectedIds, chosen.map((item) => item.hiddenId));

const ignoredFourth = interactiveDrawReducer(state, {
  type: 'TOGGLE_SELECTION',
  hiddenId: state.deck[4].hiddenId,
});
assert.equal(ignoredFourth.selectedIds.length, 3);

state = interactiveDrawReducer(state, { type: 'PLACE_SELECTED' });
assert.equal(state.stage, 'placed');

state = interactiveDrawReducer(state, { type: 'FLIP_CARD', hiddenId: chosen[1].hiddenId });
assert.equal(state.stage, 'placed');
state = interactiveDrawReducer(state, { type: 'FLIP_CARD', hiddenId: chosen[0].hiddenId });
assert.equal(state.stage, 'placed');
state = interactiveDrawReducer(state, { type: 'FLIP_CARD', hiddenId: chosen[2].hiddenId });
assert.equal(state.stage, 'complete');

const selectedDrawn = getSelectedDrawnCards(state);
assert.deepEqual(selectedDrawn.map((item) => item.card.id), chosen.map((item) => item.card.id));

const reading = createMiaoReadingFromDrawn(
  {
    question: '这三张猫牌会不会保持选择顺序？',
    topic: 'others',
    spreadId: 'three-card',
  },
  selectedDrawn,
);
assert.deepEqual(reading.cards.map((item) => item.drawn.card.id), chosen.map((item) => item.card.id));
assert.deepEqual(reading.cards.map((item) => item.position.id), ['past', 'present', 'next']);
assert.ok(reading.cards.every((item) => item.drawn.orientation === 'reversed'));
assert.ok(reading.cards.every((item) => item.miaoMeaning === item.miao.reversedMiaoMeaning));

assert.throws(
  () => createMiaoReadingFromDrawn(
    { question: '', topic: 'others', spreadId: 'three-card' },
    [selectedDrawn[0], selectedDrawn[0], selectedDrawn[1]],
  ),
  /duplicate/i,
);

console.log('Interactive draw test ok: 22 unique backs, ordered selection, individual flips, reversed meanings, no duplicate readings.');
