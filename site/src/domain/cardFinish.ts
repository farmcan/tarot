export type CardFinishId = 'paper' | 'violet' | 'silver' | 'gold';

export interface CardFinish {
  id: CardFinishId;
  label: string;
  shortLabel: string;
  description: string;
}

interface ReadingFinishSource {
  contentPackId?: string;
  spread: {
    id: string;
  };
  cards: Array<{
    drawn: {
      card: {
        id: string;
      };
      orientation: 'upright' | 'reversed';
    };
  }>;
}

const CARD_FINISHES: Record<CardFinishId, CardFinish> = {
  paper: {
    id: 'paper',
    label: '暖纸原框',
    shortLabel: '暖纸',
    description: '保留纸张与墨线的安静质感。',
  },
  violet: {
    id: 'violet',
    label: '暮光紫框',
    shortLabel: '暮光紫',
    description: '紫色微光沿着牌框停留。',
  },
  silver: {
    id: 'silver',
    label: '月光银框',
    shortLabel: '月光银',
    description: '冷银色边缘让牌面更像月下收藏卡。',
  },
  gold: {
    id: 'gold',
    label: '星芒金框',
    shortLabel: '星芒金',
    description: '金色星芒只改变视觉收藏感，不改变牌义。',
  },
};

export const DEFAULT_CARD_FINISH = CARD_FINISHES.paper;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectCardFinish(seed: string): CardFinish {
  const bucket = hashSeed(seed) % 100;
  if (bucket < 3) return CARD_FINISHES.gold;
  if (bucket < 11) return CARD_FINISHES.silver;
  if (bucket < 35) return CARD_FINISHES.violet;
  return CARD_FINISHES.paper;
}

export function getReadingCardFinish(reading: ReadingFinishSource): CardFinish {
  const firstCard = reading.cards[0];
  if (!firstCard) return DEFAULT_CARD_FINISH;
  return selectCardFinish([
    reading.spread.id,
    reading.contentPackId || 'default',
    firstCard.drawn.card.id,
    firstCard.drawn.orientation,
  ].join(':'));
}
