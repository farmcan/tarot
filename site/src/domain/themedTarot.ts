import {
  cards,
  getCardMeaning,
  getLocalizedText,
  type CardOrientation,
  type DrawnCard,
  type TarotCard,
} from '@cometpisces/tarot-kit';
import {
  getCardKeyword,
  getCardName,
  getOrientationLabel,
  getPositionMeaning,
  getSpread,
  getTopic,
  getTopicMeaning,
} from './tarot';
import {
  type BaseReadingCard,
  type ReadingBase,
  type ReadingRequest,
  type ReadingTopic,
} from './readingTypes';

export interface ThemedCard {
  tarotId: string;
  title: string;
  archetype: string;
  caption: string;
  uprightMeaning: string;
  reversedMeaning: string;
  emotionalSignal: string;
  tinyAction: string;
  shareText: string;
  palette: string;
  sigil: string;
}

export interface ThemedReadingCard extends BaseReadingCard {
  themeCard: ThemedCard;
  traditionalMeaning: string;
  themedMeaning: string;
}

export type ThemedReading = ReadingBase<ThemedReadingCard>;

export interface ThemedDeckConfig {
  id: string;
  productName: string;
  taskName: string;
  cardLabel: string;
  archetypeLabel: string;
  uprightLabel: string;
  reversedLabel: string;
  emptyQuestion: string;
  fallbackShareText: string;
  promptIdentity: string;
  promptVoice: string;
  promptBoundary: string;
  cards: Record<string, ThemedCard>;
  spreadIds: readonly string[];
}

export function getThemeCard(deck: ThemedDeckConfig, card: TarotCard): ThemedCard {
  const mapped = deck.cards[card.id];
  if (mapped) return mapped;

  return {
    tarotId: card.id,
    title: `${getCardName(card)}${deck.cardLabel}`,
    archetype: getCardKeyword(card),
    caption: `这张${deck.cardLabel}还在路上，但它已经先坐下了。`,
    uprightMeaning: getLocalizedText(card.meaning.upright, 'zh'),
    reversedMeaning: getLocalizedText(card.meaning.reversed, 'zh'),
    emotionalSignal: getCardKeyword(card),
    tinyAction: '先观察，再行动。',
    shareText: `今天的我：${deck.cardLabel}占位中。`,
    palette: 'gray',
    sigil: String(card.number),
  };
}

export function drawMajorCards(count: number): DrawnCard[] {
  return drawMajorCardsWithOptions(count);
}

export function drawMajorCardsWithOptions(
  count: number,
  options: { random?: () => number; includeReversals?: boolean } = {},
): DrawnCard[] {
  const random = options.random ?? Math.random;
  const includeReversals = options.includeReversals ?? true;
  const deck = [...cards.filter((card) => card.arcana === 'major')];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck.slice(0, count).map((card) => ({
    card,
    orientation: includeReversals && random() < 0.28 ? 'reversed' : 'upright',
  }));
}

export function drawCardsFromPoolWithOptions(
  cardIds: readonly string[],
  options: { random?: () => number; includeReversals?: boolean } = {},
): DrawnCard[] {
  const random = options.random ?? Math.random;
  const includeReversals = options.includeReversals ?? true;
  const allowedIds = new Set(cardIds);
  const deck = cards.filter((card) => allowedIds.has(card.id));

  if (deck.length !== allowedIds.size) {
    throw new Error('The content pack contains one or more unknown Tarot card ids.');
  }

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck.map((card) => ({
    card,
    orientation: includeReversals && random() < 0.28 ? 'reversed' : 'upright',
  }));
}

export function createThemedReading(
  deck: ThemedDeckConfig,
  params: ReadingRequest,
): ThemedReading {
  const spread = getSpread(params.spreadId);
  const drawnCards = drawMajorCards(spread.positions.length);

  return createThemedReadingFromDrawn(deck, params, drawnCards);
}

export function createThemedReadingFromDrawn(
  deck: ThemedDeckConfig,
  params: ReadingRequest,
  drawnCards: readonly DrawnCard[],
): ThemedReading {
  const spread = getSpread(params.spreadId);

  if (drawnCards.length !== spread.positions.length) {
    throw new Error(`Expected ${spread.positions.length} selected cards for ${spread.id}, got ${drawnCards.length}.`);
  }
  if (new Set(drawnCards.map((drawn) => drawn.card.id)).size !== drawnCards.length) {
    throw new Error('A Tarot reading cannot contain duplicate selected cards.');
  }

  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    question: params.question.trim(),
    topic: params.topic,
    spread,
    cards: drawnCards.map((drawn, index) => {
      const themeCard = getThemeCard(deck, drawn.card);
      const position = spread.positions[index];
      const themedMeaning = drawn.orientation === 'upright' ? themeCard.uprightMeaning : themeCard.reversedMeaning;

      return {
        drawn,
        themeCard,
        position,
        traditionalMeaning: getCardMeaning(drawn, 'zh'),
        positionMeaning: getPositionMeaning(drawn.card, position.aspect, drawn.orientation),
        topicMeaning: getTopicMeaning(drawn.card, params.topic, drawn.orientation),
        themedMeaning,
      };
    }),
  };
}

export function getThemedOrientationLabel(deck: ThemedDeckConfig, orientation: CardOrientation) {
  return orientation === 'upright' ? deck.uprightLabel : deck.reversedLabel;
}

export function createThemedSynthesis(deck: ThemedDeckConfig, reading: ThemedReading) {
  const first = reading.cards[0];
  const last = reading.cards[reading.cards.length - 1];
  const reversedCount = reading.cards.filter((item) => item.drawn.orientation === 'reversed').length;
  const topic = getTopic(reading.topic);

  return {
    headline: `${first.themeCard.title}出现：${first.themeCard.caption}`,
    summary: `这次是「${reading.spread.name}」，问题落在${topic.tone}。${reversedCount} 张${deck.reversedLabel}牌提示：有些情绪不是要压下去，而是要先翻译成人话。`,
    tinyAction: last.themeCard.tinyAction,
    shareText: first.themeCard.shareText,
  };
}

export function getTraditionalLine(card: ThemedReadingCard) {
  return `${getCardName(card.drawn.card)} · ${getOrientationLabel(card.drawn)} · ${getCardKeyword(card.drawn.card)}`;
}

export function buildThemedLlmPayload(deck: ThemedDeckConfig, reading: ThemedReading) {
  const topic = getTopic(reading.topic);

  return {
    task: deck.taskName,
    language: 'zh-CN',
    question: reading.question || deck.emptyQuestion,
    topic: topic.label,
    spread: {
      id: reading.spread.id,
      name: reading.spread.name,
      sourcePattern: reading.spread.sourcePattern,
    },
    styleGuide: {
      product: deck.productName,
      voice: deck.promptVoice,
      boundaries: [
        '不要把塔罗说成绝对预言。',
        '不要替代医疗、法律、财务等专业建议。',
        deck.promptBoundary,
      ],
    },
    cards: reading.cards.map((item) => ({
      position: item.position.label,
      role: item.position.role,
      traditional: getTraditionalLine(item),
      tarotCard: getCardName(item.drawn.card),
      tarotKeyword: getCardKeyword(item.drawn.card),
      orientation: getOrientationLabel(item.drawn),
      themedOrientation: getThemedOrientationLabel(deck, item.drawn.orientation),
      themedName: item.themeCard.title,
      archetype: item.themeCard.archetype,
      caption: item.themeCard.caption,
      emotionalSignal: item.themeCard.emotionalSignal,
      traditionalMeaning: item.traditionalMeaning,
      positionMeaning: item.positionMeaning,
      topicMeaning: item.topicMeaning,
      themedMeaning: item.themedMeaning,
      tinyAction: item.themeCard.tinyAction,
    })),
    outputContract: [
      `给一个短标题，像${deck.archetypeLabel}文案一样好记。`,
      '用 2-3 句话总结这次抽牌的情绪主题。',
      `逐张解释：${deck.cardLabel}是什么意思，传统塔罗骨架是什么，和用户问题有什么关系。`,
      '给出 3 条今天能做的小动作。',
      '给一条适合分享卡的短文案。',
    ],
  };
}

export function buildThemedLlmPrompt(deck: ThemedDeckConfig, reading: ThemedReading) {
  return [
    `你是 ${deck.productName} 的解读助手。`,
    deck.promptIdentity,
    '基于下面 JSON 输出中文解读：',
    JSON.stringify(buildThemedLlmPayload(deck, reading), null, 2),
  ].join('\n\n');
}
