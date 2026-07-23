import {
  drawCards,
  getCardMeaning,
  getLocalizedText,
  type DrawnCard,
  type TarotCard,
} from '@cometpisces/tarot-kit';
import { toSimplifiedChinese } from './locale';
import {
  type BaseReadingCard,
  type ReadingAspect,
  type ReadingBase,
  type ReadingRequest,
  type ReadingTopic,
  type SpreadDefinition,
} from './readingTypes';

export type {
  BaseReadingCard,
  ReadingAspect,
  ReadingBase,
  ReadingRequest,
  ReadingTopic,
  SpreadDefinition,
  SpreadPosition,
} from './readingTypes';

export interface ReadingCard extends BaseReadingCard {
  generalMeaning: string;
}

export type Reading = ReadingBase<ReadingCard>;

export const topicOptions: Array<{ value: ReadingTopic; label: string; tone: string }> = [
  { value: 'love', label: '关系 / Love', tone: '关系、亲密、信任与边界' },
  { value: 'work', label: '事业 / Work', tone: '项目、职业、协作与判断' },
  { value: 'interpersonal', label: '人际 / Social', tone: '沟通、社群、角色与互动' },
  { value: 'others', label: '开放问题 / Open', tone: '未分类问题与自我观察' },
];

export const spreads: SpreadDefinition[] = [
  {
    id: 'single',
    name: '单牌聚焦',
    shortName: '单牌',
    description: '适合日常快速观察，核心是把问题压缩成一个可行动的提示。',
    sourcePattern: '轻量网页与 bot 常用的一步抽牌模式',
    positions: [
      {
        id: 'focus',
        label: '焦点',
        role: '当下最值得看见的一件事',
        aspect: 'currentSituation',
      },
    ],
  },
  {
    id: 'three-card',
    name: '三牌时间流',
    shortName: '三牌',
    description: '最常见的过去、现在、下一步结构，容易解释，也适合 LLM 组合分析。',
    sourcePattern: 'Tarot API / Tarot.js demo / AI reading app 的通用牌阵',
    positions: [
      { id: 'past', label: '过去', role: '问题背后的惯性与来处', aspect: 'rootCause' },
      { id: 'present', label: '现在', role: '当前状态与正在发生的事', aspect: 'currentSituation' },
      { id: 'next', label: '下一步', role: '短期走向与可采取的动作', aspect: 'development' },
    ],
  },
  {
    id: 'two-card',
    name: '双牌对照',
    shortName: '双牌',
    description: '用现状与建议形成最小对照，比单牌多一个落地动作。',
    sourcePattern: 'Tarot app 常见的 situation / advice 双牌结构',
    positions: [
      { id: 'situation', label: '现状', role: '此刻真正发生的事', aspect: 'currentSituation' },
      { id: 'advice', label: '建议', role: '最值得尝试的调整', aspect: 'advice' },
    ],
  },
  {
    id: 'four-card',
    name: '四牌局面拆解',
    shortName: '四牌',
    description: '把局面拆成现状、阻碍、资源和行动，适合想看清怎么推进的问题。',
    sourcePattern: 'Tarot app 常见的 situation / obstacle / resource / action 结构',
    positions: [
      { id: 'situation', label: '现状', role: '当前局面的主轴', aspect: 'currentSituation' },
      { id: 'obstacle', label: '阻碍', role: '正在卡住你的力量', aspect: 'rootCause' },
      { id: 'resource', label: '资源', role: '已经拥有但可能忽略的支点', aspect: 'innerState' },
      { id: 'action', label: '行动', role: '下一步最有效的动作', aspect: 'advice' },
    ],
  },
  {
    id: 'choice',
    name: '选择权衡',
    shortName: '选择',
    description: '适合二选一或路线判断，比单纯正反更能暴露隐性成本。',
    sourcePattern: '综合占卜站常见的 decision spread',
    positions: [
      { id: 'option-a', label: '方案 A', role: '第一条路的能量与机会', aspect: 'development' },
      { id: 'option-b', label: '方案 B', role: '第二条路的能量与机会', aspect: 'development' },
      { id: 'hidden-cost', label: '隐性成本', role: '容易被忽略的代价', aspect: 'rootCause' },
      { id: 'inner-state', label: '内在状态', role: '你真正被什么牵动', aspect: 'innerState' },
      { id: 'advice', label: '建议', role: '行动建议与收束', aspect: 'advice' },
    ],
  },
  {
    id: 'relationship',
    name: '关系剖面',
    shortName: '关系',
    description: '用两个主体、连接、张力和建议拆开关系问题。',
    sourcePattern: 'AI Tarot app 中最容易产品化的主题牌阵',
    positions: [
      { id: 'self', label: '你', role: '你的状态、需求与投射', aspect: 'innerState' },
      { id: 'other', label: '对方', role: '对方呈现出的状态', aspect: 'currentSituation' },
      { id: 'bond', label: '连接', role: '关系真正建立在什么之上', aspect: 'rootCause' },
      { id: 'tension', label: '张力', role: '关系中的摩擦或未说出口之处', aspect: 'development' },
      { id: 'advice', label: '建议', role: '更成熟的互动方式', aspect: 'advice' },
    ],
  },
  {
    id: 'celtic-cross',
    name: '凯尔特十字',
    shortName: '十字',
    description: '信息最完整的传统牌阵，适合复杂问题和长文本 LLM 解读。',
    sourcePattern: '传统 Tarot app / 综合占卜平台常见深度牌阵',
    positions: [
      { id: 'situation', label: '现状', role: '当前局面的主轴', aspect: 'currentSituation' },
      { id: 'cross', label: '阻碍', role: '横在问题上的力量', aspect: 'rootCause' },
      { id: 'root', label: '根源', role: '更深层的来源', aspect: 'rootCause' },
      { id: 'past', label: '过去', role: '刚离开的阶段', aspect: 'rootCause' },
      { id: 'ideal', label: '显意识', role: '你以为自己想要的', aspect: 'innerState' },
      { id: 'future', label: '近未来', role: '短期发展方向', aspect: 'development' },
      { id: 'self', label: '自我', role: '你可以调整的位置', aspect: 'innerState' },
      { id: 'environment', label: '环境', role: '外部条件与他人影响', aspect: 'currentSituation' },
      { id: 'hope-fear', label: '期待/担忧', role: '希望和恐惧交织的部分', aspect: 'innerState' },
      { id: 'outcome', label: '结果', role: '当前路径下的收束', aspect: 'advice' },
    ],
  },
];

export function getSpread(id: string): SpreadDefinition {
  return spreads.find((spread) => spread.id === id) ?? spreads[1];
}

export function getTopic(value: ReadingTopic) {
  return topicOptions.find((topic) => topic.value === value) ?? topicOptions[3];
}

export function getCardName(card: TarotCard) {
  const simplified = toSimplifiedChinese(getLocalizedText(card.name, 'zh'));
  return card.suit === 'pentacles' ? simplified.replace(/^钱币/, '星币') : simplified;
}

export function getCardKeyword(card: TarotCard) {
  return toSimplifiedChinese(getLocalizedText(card.coreKeyword, 'zh'));
}

export function getCardDescriptionZhHans(card: TarotCard) {
  return toSimplifiedChinese(getLocalizedText(card.description, 'zh'));
}

export function getCardMeaningZhHans(drawn: DrawnCard) {
  return toSimplifiedChinese(getCardMeaning(drawn, 'zh'));
}

export function getSuitLabel(card: TarotCard) {
  if (card.arcana === 'major') return '大阿尔卡那';

  const labels: Record<NonNullable<TarotCard['suit']>, string> = {
    wands: '权杖',
    cups: '圣杯',
    swords: '宝剑',
    pentacles: '星币',
  };

  return card.suit ? labels[card.suit] : '小阿尔卡那';
}

function toRomanNumeral(value: number) {
  const numerals: Array<[number, string]> = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let remaining = value;
  let result = '';
  for (const [unit, numeral] of numerals) {
    while (remaining >= unit) {
      result += numeral;
      remaining -= unit;
    }
  }
  return result;
}

export function getCardOrdinalLabel(card: TarotCard) {
  if (card.arcana === 'major') {
    return `大阿尔卡那 · ${card.number === 0 ? '0' : toRomanNumeral(card.number)}`;
  }

  const courtRanks: Record<number, string> = {
    1: 'A',
    11: '侍从',
    12: '骑士',
    13: '王后',
    14: '国王',
  };
  return `${getSuitLabel(card)} · ${courtRanks[card.number] || toRomanNumeral(card.number)}`;
}

export function getOrientationLabel(drawn: DrawnCard) {
  return drawn.orientation === 'upright' ? '正位' : '逆位';
}

export function getPositionMeaning(card: TarotCard, aspect: ReadingAspect, orientation: DrawnCard['orientation']) {
  return toSimplifiedChinese(getLocalizedText(card.readingAspects[aspect][orientation], 'zh'));
}

export function getTopicMeaning(card: TarotCard, topic: ReadingTopic, orientation: DrawnCard['orientation']) {
  return toSimplifiedChinese(getLocalizedText(card.contextualMeanings[topic][orientation], 'zh'));
}

export function createReading(params: ReadingRequest): Reading {
  const spread = getSpread(params.spreadId);
  const drawnCards = drawCards(spread.positions.length);

  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    question: params.question.trim(),
    topic: params.topic,
    spread,
    cards: drawnCards.map((drawn, index) => {
      const position = spread.positions[index];
      return {
        drawn,
        position,
        generalMeaning: getCardMeaningZhHans(drawn),
        positionMeaning: getPositionMeaning(drawn.card, position.aspect, drawn.orientation),
        topicMeaning: getTopicMeaning(drawn.card, params.topic, drawn.orientation),
      };
    }),
  };
}

export function createLocalSynthesis(reading: Reading) {
  const first = reading.cards[0];
  const last = reading.cards[reading.cards.length - 1];
  const reversed = reading.cards.filter((item) => item.drawn.orientation === 'reversed').length;
  const topic = getTopic(reading.topic);

  return {
    headline: `${reading.spread.shortName}显示：先看「${getCardName(first.drawn.card)}」，再把行动落到「${getCardName(last.drawn.card)}」。`,
    summary: `这次抽牌围绕「${topic.tone}」。${reading.spread.name}提供了 ${reading.cards.length} 个观察点，其中 ${reversed} 张逆位，说明需要特别留意阻滞、延迟或还没有被讲清楚的部分。`,
    advice: last.positionMeaning || last.generalMeaning,
  };
}
