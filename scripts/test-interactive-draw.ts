import assert from 'node:assert/strict';
import { cards } from '@cometpisces/tarot-kit';
import {
  createMiaoReadingFromDrawn,
  createMiaoSynthesis,
  getMiaoCard,
  getMiaoReadingAnchor,
} from '../site/src/domain/miaoTarot';
import { getDayPhase, selectCardBackTheme } from '../site/src/domain/cardBacks';
import { getCardMeaningZhHans, getCardName } from '../site/src/domain/tarot';
import {
  createCutPiles,
  createInitialDrawState,
  createInteractiveDeck,
  getRequiredCount,
  getSelectedDrawnCards,
  interactiveDrawModes,
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
  date: new Date(2026, 6, 16, 8),
});
assert.equal(uprightSession.deck.length, 78);
assert.equal(new Set(uprightSession.deck.map((item) => item.card.id)).size, 78);
assert.ok(uprightSession.deck.every((item) => item.orientation === 'upright'));

const classicSession = createInteractiveDeck({
  includeReversals: false,
  contentPackId: 'classic-major',
  random: seededRandom(42),
});
assert.equal(classicSession.deck.length, 22);
assert.ok(classicSession.deck.every((item) => item.card.arcana === 'major'));
assert.deepEqual(createCutPiles(uprightSession.deck).map((pile) => pile.length), [26, 26, 26]);
assert.deepEqual(createCutPiles(classicSession.deck).map((pile) => pile.length), [8, 7, 7]);
assert.equal(new Set(createCutPiles(uprightSession.deck).flat().map((item) => item.hiddenId)).size, 78);

assert.equal(getDayPhase(new Date(2026, 6, 16, 8)), 'morning');
assert.equal(getDayPhase(new Date(2026, 6, 16, 13)), 'noon');
assert.equal(getDayPhase(new Date(2026, 6, 16, 22)), 'night');
assert.equal(selectCardBackTheme({ date: new Date(2026, 6, 16, 8), random: () => 0 }), 'morning');
const alternateRandom = [0.9, 0][Symbol.iterator]();
assert.equal(
  selectCardBackTheme({
    date: new Date(2026, 6, 16, 13),
    random: () => alternateRandom.next().value ?? 0,
  }),
  'morning',
);

assert.deepEqual(interactiveDrawModes.map((mode) => getRequiredCount(mode.id)), [1, 2, 3, 4, 5]);

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
assert.equal(state.stage, 'cutting');
state = interactiveDrawReducer(state, { type: 'CHOOSE_CUT_PILE', pileIndex: 0 });
assert.equal(state.stage, 'selecting');
assert.equal(state.cutPileIndex, 0);

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
  'doodle-full',
);
assert.equal(reading.contentPackId, 'doodle-full');
assert.deepEqual(reading.cards.map((item) => item.drawn.card.id), chosen.map((item) => item.card.id));
assert.deepEqual(reading.cards.map((item) => item.position.id), ['past', 'present', 'next']);
assert.ok(reading.cards.every((item) => item.drawn.orientation === 'reversed'));
assert.ok(reading.cards.every((item) => item.miaoMeaning === item.miao.reversedMiaoMeaning));
assert.equal(getMiaoReadingAnchor(reading).position.id, 'present');
assert.match(createMiaoSynthesis(reading).shareText, /逆位/);
assert.ok(createMiaoSynthesis(reading).shareText.includes(getMiaoReadingAnchor(reading).miao.reversedMiaoMeaning));

const strength = cards.find((card) => card.id === 'strength');
assert.ok(strength);
const strengthMiao = getMiaoCard(strength);
assert.equal(strengthMiao.memeCaption, '我没有生气，我只是启动了爪刹。');
assert.notEqual(strengthMiao.uprightMiaoMeaning, getCardMeaningZhHans({ card: strength, orientation: 'upright' }));

const nineOfPentacles = cards.find((card) => card.id === 'nine-of-pentacles');
assert.ok(nineOfPentacles);
assert.equal(getCardName(nineOfPentacles), '星币九');

let fiveCardState = createInitialDrawState('relationship');
fiveCardState = interactiveDrawReducer(fiveCardState, {
  type: 'START_SHUFFLE',
  deck: uprightSession.deck,
  backTheme: uprightSession.backTheme,
});
fiveCardState = interactiveDrawReducer(fiveCardState, { type: 'FINISH_SHUFFLE' });
fiveCardState = interactiveDrawReducer(fiveCardState, { type: 'CHOOSE_CUT_PILE', pileIndex: 0 });
for (const card of fiveCardState.deck.slice(0, 5)) {
  fiveCardState = interactiveDrawReducer(fiveCardState, { type: 'TOGGLE_SELECTION', hiddenId: card.hiddenId });
}
assert.equal(fiveCardState.selectedIds.length, 5);
fiveCardState = interactiveDrawReducer(fiveCardState, { type: 'PLACE_SELECTED' });
const fiveCardReading = createMiaoReadingFromDrawn(
  { question: '五张牌是否都有明确位置？', topic: 'love', spreadId: 'relationship' },
  getSelectedDrawnCards(fiveCardState),
);
assert.deepEqual(fiveCardReading.cards.map((item) => item.position.id), ['self', 'other', 'bond', 'tension', 'advice']);

let autoDrawState = createInitialDrawState('three-card');
autoDrawState = interactiveDrawReducer(autoDrawState, {
  type: 'START_SHUFFLE',
  deck: uprightSession.deck,
  backTheme: uprightSession.backTheme,
});
autoDrawState = interactiveDrawReducer(autoDrawState, { type: 'FINISH_SHUFFLE' });
autoDrawState = interactiveDrawReducer(autoDrawState, { type: 'AUTO_DRAW' });
assert.equal(autoDrawState.stage, 'placed');
assert.deepEqual(
  autoDrawState.selectedIds,
  uprightSession.deck.slice(0, 3).map((item) => item.hiddenId),
);

let selectedPileState = createInitialDrawState('three-card');
selectedPileState = interactiveDrawReducer(selectedPileState, {
  type: 'START_SHUFFLE',
  deck: uprightSession.deck,
  backTheme: uprightSession.backTheme,
});
selectedPileState = interactiveDrawReducer(selectedPileState, { type: 'FINISH_SHUFFLE' });
selectedPileState = interactiveDrawReducer(selectedPileState, { type: 'CHOOSE_CUT_PILE', pileIndex: 2 });
const thirdPile = createCutPiles(uprightSession.deck)[2];
const ignoredOtherPile = interactiveDrawReducer(selectedPileState, {
  type: 'TOGGLE_SELECTION',
  hiddenId: uprightSession.deck[0].hiddenId,
});
assert.deepEqual(ignoredOtherPile.selectedIds, []);
selectedPileState = interactiveDrawReducer(selectedPileState, { type: 'RETURN_TO_CUT' });
assert.equal(selectedPileState.stage, 'cutting');
selectedPileState = interactiveDrawReducer(selectedPileState, { type: 'CHOOSE_CUT_PILE', pileIndex: 2 });
selectedPileState = interactiveDrawReducer(selectedPileState, { type: 'AUTO_DRAW' });
assert.equal(selectedPileState.stage, 'placed');
assert.deepEqual(
  selectedPileState.selectedIds,
  thirdPile.slice(0, 3).map((item) => item.hiddenId),
);

assert.throws(
  () => createMiaoReadingFromDrawn(
    { question: '', topic: 'others', spreadId: 'three-card' },
    [selectedDrawn[0], selectedDrawn[0], selectedDrawn[1]],
  ),
  /duplicate/i,
);

console.log('Interactive draw test ok: 1-5 cards, time skins, ordered flips, reversals, no duplicates.');
