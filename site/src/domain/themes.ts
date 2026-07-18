import { cards as tarotCards } from '@cometpisces/tarot-kit';
import {
  miaoDeckConfig,
  miaoSpreads,
  getMiaoCard,
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
  tagline: '用猫咪涂鸦，读标准塔罗。',
  description: '可在经典 22 张与标准 78 张内容包之间切换，亲手选 1–5 张再逐张翻开。标准牌名、牌面象征、传统正逆位和牌阵位置构成完整解读，猫咪只负责画面表达。',
  deckConfig: miaoDeckConfig,
  cards: tarotCards.map((card) => getMiaoCard(card)),
  spreadIds: miaoSpreads,
  defaultQuestion: '我今天最需要看见什么？',
  quickQuestions: [
    '我今天最需要看见什么？',
    '这段关系目前的核心课题是什么？',
    '工作上真正影响推进的因素是什么？',
    '我下一步最适合采取什么行动？',
  ],
  shareConcept: 'MiaoTarot：不预测命运，用猫咪涂鸦呈现标准塔罗牌义。',
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
export const tarotThemeList = [miaoTheme, shipTheme] as const;

export function getTarotTheme(): TarotTheme<MiaoCard>;
export function getTarotTheme(id: typeof miaoThemeId): TarotTheme<MiaoCard>;
export function getTarotTheme(id: typeof shipThemeId): TarotTheme<ThemedCard>;
export function getTarotTheme(id: string): TarotTheme;
export function getTarotTheme(id: string = defaultThemeId) {
  return tarotThemes[id as TarotThemeId] ?? tarotThemes[defaultThemeId];
}
