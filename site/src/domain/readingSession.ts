import {
  cards,
  type CardOrientation,
} from '@cometpisces/tarot-kit';
import {
  createMiaoReadingFromDrawn,
  type MiaoReading,
} from './miaoTarot';
import {
  cardBackThemes,
  getRequiredCount,
  type CardBackTheme,
  type InteractiveDrawMode,
  type InteractiveDrawState,
} from './interactiveDraw';
import { getMiaoContentPack, type MiaoContentPackId } from './miaoContentPacks';
import type { ReadingTopic } from './tarot';

const ACTIVE_SESSION_KEY = 'miaotarot:active-reading:v1';
const ACTIVE_SESSION_VERSION = 1;

const topics: ReadingTopic[] = ['love', 'work', 'interpersonal', 'others'];
const modes: InteractiveDrawMode[] = [
  'single',
  'two-card',
  'three-card',
  'four-card',
  'choice',
  'relationship',
];
export interface StoredReadingCard {
  hiddenId: string;
  cardId: string;
  orientation: CardOrientation;
}

export interface StoredReadingSession {
  version: 1;
  readingId: string;
  createdAt: string;
  updatedAt: string;
  question: string;
  topic: ReadingTopic;
  mode: InteractiveDrawMode;
  contentPackId: MiaoContentPackId;
  backTheme: CardBackTheme;
  selectedCards: StoredReadingCard[];
  flippedIds: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStoredReadingSession(value: unknown): value is StoredReadingSession {
  if (!isRecord(value) || value.version !== ACTIVE_SESSION_VERSION) return false;
  if (
    typeof value.readingId !== 'string'
    || !value.readingId
    || typeof value.createdAt !== 'string'
    || typeof value.updatedAt !== 'string'
    || typeof value.question !== 'string'
    || typeof value.topic !== 'string'
    || !topics.includes(value.topic as ReadingTopic)
    || typeof value.mode !== 'string'
    || !modes.includes(value.mode as InteractiveDrawMode)
    || typeof value.contentPackId !== 'string'
    || typeof value.backTheme !== 'string'
    || !cardBackThemes.includes(value.backTheme as CardBackTheme)
    || !Array.isArray(value.selectedCards)
    || !Array.isArray(value.flippedIds)
  ) {
    return false;
  }

  const expectedCount = getRequiredCount(value.mode as InteractiveDrawMode);
  if (value.selectedCards.length !== expectedCount) return false;

  const knownCardIds = new Set(cards.map((card) => card.id));
  const selected = value.selectedCards.every((item) => (
    isRecord(item)
    && typeof item.hiddenId === 'string'
    && typeof item.cardId === 'string'
    && knownCardIds.has(item.cardId)
    && (item.orientation === 'upright' || item.orientation === 'reversed')
  ));
  if (!selected) return false;

  const selectedIds = new Set(value.selectedCards.map((item) => item.hiddenId));
  return (
    new Set(value.selectedCards.map((item) => item.cardId)).size === expectedCount
    && value.flippedIds.length >= 1
    && value.flippedIds.length <= expectedCount
    && value.flippedIds.every((id) => typeof id === 'string' && selectedIds.has(id))
    && new Set(value.flippedIds).size === value.flippedIds.length
  );
}

export function createReadingSessionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `reading-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadActiveReadingSession(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(ACTIVE_SESSION_KEY) || 'null') as unknown;
    return isStoredReadingSession(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveActiveReadingSession(
  session: StoredReadingSession,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  if (!storage) return;
  try {
    storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // The reading remains usable in memory when storage is blocked or full.
  }
}

export function clearActiveReadingSession(
  storage: Pick<Storage, 'removeItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  try {
    storage?.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // Storage is optional.
  }
}

export function restoreInteractiveDrawState(session: StoredReadingSession): InteractiveDrawState {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const deck = session.selectedCards.map((item) => ({
    hiddenId: item.hiddenId,
    card: cardById.get(item.cardId)!,
    orientation: item.orientation,
  }));

  return {
    stage: session.flippedIds.length === session.selectedCards.length ? 'complete' : 'placed',
    mode: session.mode,
    requiredCount: session.selectedCards.length,
    deck,
    selectedIds: session.selectedCards.map((item) => item.hiddenId),
    flippedIds: session.flippedIds,
    backTheme: session.backTheme,
    cutPileIndex: null,
  };
}

export function getSessionReadings(session: StoredReadingSession) {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const drawnCards = session.selectedCards.map((item) => ({
    card: cardById.get(item.cardId)!,
    orientation: item.orientation,
  }));
  const generated = createMiaoReadingFromDrawn({
    question: session.question,
    topic: session.topic,
    spreadId: session.mode,
  }, drawnCards, getMiaoContentPack(session.contentPackId).id);
  const fullReading: MiaoReading = {
    ...generated,
    id: session.readingId,
    createdAt: session.createdAt,
  };
  const flipped = new Set(session.flippedIds);
  const visibleReading: MiaoReading = {
    ...fullReading,
    cards: fullReading.cards.filter((_, index) => (
      flipped.has(session.selectedCards[index].hiddenId)
    )),
  };

  return { fullReading, visibleReading };
}
