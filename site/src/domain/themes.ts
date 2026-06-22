import {
  miaoCards,
  miaoDeckConfig,
  miaoSpreads,
  type MiaoCard,
} from './miaoTarot';
import type { ThemedDeckConfig } from './themedTarot';

export interface TarotTheme<CardShape = unknown> {
  id: string;
  productName: string;
  localName: string;
  universe: string;
  tagline: string;
  description: string;
  deckConfig: ThemedDeckConfig;
  cards: readonly CardShape[];
  spreadIds: readonly string[];
  defaultQuestion: string;
  quickQuestions: readonly string[];
  shareConcept: string;
  repositoryUrl: string;
  researchUrl: string;
  implementationPlanUrl: string;
}

export const miaoThemeId = 'miaotarot' as const;

export const miaoTheme: TarotTheme<MiaoCard> = {
  id: miaoThemeId,
  productName: miaoDeckConfig.productName,
  localName: '猫猫塔罗',
  universe: 'MiaoTI universe',
  tagline: '把你现在的精神状态，翻译成一只猫。',
  description: 'Tarot 负责结构，猫 meme 负责情绪入口，LLM 负责把牌面说成人话。它不预测命运，只帮你看见今天是哪只猫在提醒你。',
  deckConfig: miaoDeckConfig,
  cards: Object.values(miaoCards),
  spreadIds: miaoSpreads,
  defaultQuestion: '我现在这股烦劲，到底是哪只猫？',
  quickQuestions: [
    '我现在这股烦劲，到底是哪只猫？',
    '这段关系里，我应该看清楚什么？',
    '今天工作上最该收住哪只爪？',
    '我下一步该主动冲，还是先躲进纸箱？',
  ],
  shareConcept: 'MiaoTarot：不预测命运，只把精神状态翻译成一只猫。',
  repositoryUrl: 'https://github.com/farmcan/tarot',
  researchUrl: 'https://github.com/farmcan/tarot/blob/main/docs/github-tarot-research.md',
  implementationPlanUrl: 'https://github.com/farmcan/tarot/blob/main/docs/site-implementation-plan.md',
};

export const tarotThemes = {
  [miaoThemeId]: miaoTheme,
} as const;

export type TarotThemeId = keyof typeof tarotThemes;

export const defaultThemeId: TarotThemeId = miaoThemeId;

export function getTarotTheme(id: string = defaultThemeId) {
  return tarotThemes[id as TarotThemeId] ?? tarotThemes[defaultThemeId];
}
