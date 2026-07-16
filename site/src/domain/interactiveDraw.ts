import type { DrawnCard } from '@cometpisces/tarot-kit';
import { drawMajorCardsWithOptions } from './themedTarot';

export type InteractiveDrawStage = 'ready' | 'shuffling' | 'selecting' | 'placed' | 'complete';
export type InteractiveDrawMode = 'single' | 'three-card';
export type CardBackTheme = 'moon' | 'eye' | 'paw' | 'star';

export interface InteractiveDeckCard extends DrawnCard {
  hiddenId: string;
}

export interface InteractiveDrawState {
  stage: InteractiveDrawStage;
  mode: InteractiveDrawMode;
  requiredCount: number;
  deck: InteractiveDeckCard[];
  selectedIds: string[];
  flippedIds: string[];
  backTheme: CardBackTheme;
}

export type InteractiveDrawAction =
  | { type: 'SET_MODE'; mode: InteractiveDrawMode }
  | { type: 'START_SHUFFLE'; deck: InteractiveDeckCard[]; backTheme: CardBackTheme }
  | { type: 'FINISH_SHUFFLE' }
  | { type: 'TOGGLE_SELECTION'; hiddenId: string }
  | { type: 'PLACE_SELECTED' }
  | { type: 'FLIP_CARD'; hiddenId: string }
  | { type: 'RESET' };

export const cardBackThemes: CardBackTheme[] = ['moon', 'eye', 'paw', 'star'];

export function getRequiredCount(mode: InteractiveDrawMode) {
  return mode === 'single' ? 1 : 3;
}

export function createInitialDrawState(mode: InteractiveDrawMode = 'single'): InteractiveDrawState {
  return {
    stage: 'ready',
    mode,
    requiredCount: getRequiredCount(mode),
    deck: [],
    selectedIds: [],
    flippedIds: [],
    backTheme: 'moon',
  };
}

export function createInteractiveDeck(options: {
  includeReversals: boolean;
  random?: () => number;
}) {
  const random = options.random ?? Math.random;
  const drawn = drawMajorCardsWithOptions(22, {
    random,
    includeReversals: options.includeReversals,
  });
  const backTheme = cardBackThemes[Math.floor(random() * cardBackThemes.length)] ?? cardBackThemes[0];

  return {
    backTheme,
    deck: drawn.map((item, index) => ({
      ...item,
      hiddenId: `hidden-${index}-${item.card.id}`,
    })),
  };
}

export function getSelectedDrawnCards(state: InteractiveDrawState): DrawnCard[] {
  return state.selectedIds.map((hiddenId) => {
    const selected = state.deck.find((item) => item.hiddenId === hiddenId);
    if (!selected) throw new Error(`Selected card is missing from the shuffled deck: ${hiddenId}`);
    return { card: selected.card, orientation: selected.orientation };
  });
}

export function interactiveDrawReducer(
  state: InteractiveDrawState,
  action: InteractiveDrawAction,
): InteractiveDrawState {
  switch (action.type) {
    case 'SET_MODE':
      if (state.stage !== 'ready' && state.stage !== 'complete') return state;
      return createInitialDrawState(action.mode);
    case 'START_SHUFFLE':
      return {
        ...state,
        stage: 'shuffling',
        deck: action.deck,
        selectedIds: [],
        flippedIds: [],
        backTheme: action.backTheme,
      };
    case 'FINISH_SHUFFLE':
      return state.stage === 'shuffling' ? { ...state, stage: 'selecting' } : state;
    case 'TOGGLE_SELECTION': {
      if (state.stage !== 'selecting') return state;
      if (!state.deck.some((item) => item.hiddenId === action.hiddenId)) return state;
      if (state.selectedIds.includes(action.hiddenId)) {
        return { ...state, selectedIds: state.selectedIds.filter((id) => id !== action.hiddenId) };
      }
      if (state.selectedIds.length >= state.requiredCount) return state;
      return { ...state, selectedIds: [...state.selectedIds, action.hiddenId] };
    }
    case 'PLACE_SELECTED':
      return state.stage === 'selecting' && state.selectedIds.length === state.requiredCount
        ? { ...state, stage: 'placed' }
        : state;
    case 'FLIP_CARD': {
      if (state.stage !== 'placed' || !state.selectedIds.includes(action.hiddenId)) return state;
      if (state.flippedIds.includes(action.hiddenId)) return state;
      const flippedIds = [...state.flippedIds, action.hiddenId];
      return {
        ...state,
        flippedIds,
        stage: flippedIds.length === state.requiredCount ? 'complete' : 'placed',
      };
    }
    case 'RESET':
      return createInitialDrawState(state.mode);
    default:
      return state;
  }
}
