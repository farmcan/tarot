import {
  buildThemedLlmPayload,
  buildThemedLlmPrompt,
  createThemedReading,
  createThemedReadingFromDrawn,
  createThemedSynthesis,
  getThemedOrientationLabel,
  getTraditionalLine,
  type ThemedDeckConfig,
  type ThemedReading,
  type ThemedReadingCard,
} from './themedTarot';
import type { CardOrientation } from '@cometpisces/tarot-kit';
import type { DrawnCard } from '@cometpisces/tarot-kit';
import type { ReadingRequest } from './readingTypes';

export function createThemedDeckAdapter(deck: ThemedDeckConfig) {
  return {
    deck,
    createReading(params: ReadingRequest) {
      return createThemedReading(deck, params);
    },
    createReadingFromDrawn(params: ReadingRequest, drawnCards: readonly DrawnCard[]) {
      return createThemedReadingFromDrawn(deck, params, drawnCards);
    },
    createSynthesis(reading: ThemedReading) {
      return createThemedSynthesis(deck, reading);
    },
    getOrientationLabel(orientation: CardOrientation) {
      return getThemedOrientationLabel(deck, orientation);
    },
    getTraditionalLine(card: ThemedReadingCard) {
      return getTraditionalLine(card);
    },
    buildPayload(reading: ThemedReading) {
      return buildThemedLlmPayload(deck, reading);
    },
    buildPrompt(reading: ThemedReading) {
      return buildThemedLlmPrompt(deck, reading);
    },
  };
}
