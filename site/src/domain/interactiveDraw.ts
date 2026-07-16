import type { DrawnCard } from '@cometpisces/tarot-kit';
import {
  cardBackThemes,
  selectCardBackTheme,
  type CardBackTheme,
} from './cardBacks';
import { drawMajorCardsWithOptions } from './themedTarot';

export type InteractiveDrawStage = 'ready' | 'shuffling' | 'selecting' | 'placed' | 'complete';
export type InteractiveDrawMode = 'single' | 'two-card' | 'three-card' | 'four-card' | 'relationship';
export type { CardBackTheme } from './cardBacks';

export interface InteractiveDrawModeConfig {
  id: InteractiveDrawMode;
  count: number;
  label: string;
  title: string;
  description: string;
}

export const interactiveDrawModes: InteractiveDrawModeConfig[] = [
  { id: 'single', count: 1, label: '1', title: '今日猫运', description: '一张牌，快速看见此刻最重要的提醒。' },
  { id: 'two-card', count: 2, label: '2', title: '现状与建议', description: '一张说现状，一张给出调整方向。' },
  { id: 'three-card', count: 3, label: '3', title: '过去、现在、下一步', description: '用三张牌看清事情如何来到这里。' },
  { id: 'four-card', count: 4, label: '4', title: '局面拆解', description: '现状、阻碍、资源与行动，适合复杂一点的问题。' },
  { id: 'relationship', count: 5, label: '5', title: '关系剖面', description: '你、对方、连接、张力与建议。' },
];

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

export { cardBackThemes };

export function getInteractiveDrawMode(mode: InteractiveDrawMode) {
  return interactiveDrawModes.find((item) => item.id === mode) ?? interactiveDrawModes[2];
}

export function getRequiredCount(mode: InteractiveDrawMode) {
  return getInteractiveDrawMode(mode).count;
}

export function createInitialDrawState(mode: InteractiveDrawMode = 'three-card'): InteractiveDrawState {
  return {
    stage: 'ready',
    mode,
    requiredCount: getRequiredCount(mode),
    deck: [],
    selectedIds: [],
    flippedIds: [],
    backTheme: 'night',
  };
}

export function createInteractiveDeck(options: {
  includeReversals: boolean;
  random?: () => number;
  date?: Date;
}) {
  const random = options.random ?? Math.random;
  const drawn = drawMajorCardsWithOptions(22, {
    random,
    includeReversals: options.includeReversals,
  });
  const backTheme = selectCardBackTheme({ date: options.date, random });

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
