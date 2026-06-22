import {
  miaoCards,
  miaoDeckConfig,
  miaoSpreads,
  type MiaoCard,
} from './miaoTarot';
import {
  shipCards,
  shipDeckConfig,
  shipSpreads,
} from './shipTarot';
import type { ThemedCard, ThemedDeckConfig } from './themedTarot';

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
export const shipThemeId = 'shiptarot' as const;

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

export const shipTheme: TarotTheme<ThemedCard> = {
  id: shipThemeId,
  productName: shipDeckConfig.productName,
  localName: '推进塔罗',
  universe: 'xxxTarot lab',
  tagline: '把项目现在的状态，翻译成一张推进牌。',
  description: 'Tarot 负责结构，项目语言负责执行入口，LLM 可以把牌面翻译成更具体的下一步。它不替你做决定，只帮你看清当前系统哪里顺风、哪里逆风。',
  deckConfig: shipDeckConfig,
  cards: Object.values(shipCards),
  spreadIds: shipSpreads,
  defaultQuestion: '这个项目下一步最该推进什么？',
  quickQuestions: [
    '这个项目下一步最该推进什么？',
    '现在卡住的真正原因是什么？',
    '这个想法该继续做，还是先砍掉？',
    '上线前最该修哪个风险？',
  ],
  shareConcept: 'ShipTarot：把项目状态翻译成一张推进牌。',
  repositoryUrl: 'https://github.com/farmcan/tarot',
  researchUrl: 'https://github.com/farmcan/tarot/blob/main/docs/github-tarot-research.md',
  implementationPlanUrl: 'https://github.com/farmcan/tarot/blob/main/docs/theme-foundation.md',
};

export const tarotThemes = {
  [miaoThemeId]: miaoTheme,
  [shipThemeId]: shipTheme,
} as const;

export type TarotThemeId = keyof typeof tarotThemes;

export const defaultThemeId: TarotThemeId = miaoThemeId;

export function getTarotTheme(): TarotTheme<MiaoCard>;
export function getTarotTheme(id: typeof miaoThemeId): TarotTheme<MiaoCard>;
export function getTarotTheme(id: typeof shipThemeId): TarotTheme<ThemedCard>;
export function getTarotTheme(id: string): TarotTheme;
export function getTarotTheme(id: string = defaultThemeId) {
  return tarotThemes[id as TarotThemeId] ?? tarotThemes[defaultThemeId];
}
