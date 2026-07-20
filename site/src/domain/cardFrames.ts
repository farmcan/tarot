import type { TarotCard } from '@cometpisces/tarot-kit';

export const CARD_FRAME_IDS = [
  'inked-paper',
  'gilded',
  'moonlit',
  'botanical',
] as const;

export type CardFrameId = (typeof CARD_FRAME_IDS)[number];

export const CARD_FRAME_TONES = [
  'major',
  'cups',
  'pentacles',
  'swords',
  'wands',
] as const;

export type CardFrameTone = (typeof CARD_FRAME_TONES)[number];

export interface CardFrameSkin {
  id: CardFrameId;
  label: string;
  description: string;
  className: string;
  imagePath: string;
  toneImagePaths?: Partial<Record<CardFrameTone, string>>;
  crest: string;
}

export const DEFAULT_CARD_FRAME_ID: CardFrameId = 'inked-paper';

export const cardFrameSkins: Record<CardFrameId, CardFrameSkin> = {
  'inked-paper': {
    id: 'inked-paper',
    label: '手绘纸框',
    description: '暖纸、深墨与猫爪花角，适合涂鸦内容包。',
    className: 'frame-inked-paper',
    imagePath: 'assets/card-frames/inked-paper.svg',
    toneImagePaths: {
      major: 'assets/card-frames/inked-paper.svg',
      cups: 'assets/card-frames/inked-paper-cups-v1.svg',
      pentacles: 'assets/card-frames/inked-paper-pentacles-v1.svg',
      swords: 'assets/card-frames/inked-paper-swords-v1.svg',
      wands: 'assets/card-frames/inked-paper-wands-v1.svg',
    },
    crest: '✦',
  },
  gilded: {
    id: 'gilded',
    label: '古典鎏金',
    description: '古金花丝、宝石角饰与中央日轮，适合经典牌组。',
    className: 'frame-gilded',
    imagePath: 'assets/card-frames/gilded.svg',
    crest: '☉',
  },
  moonlit: {
    id: 'moonlit',
    label: '月夜星轨',
    description: '靛蓝银紫、新月角饰与星轨，适合夜间或神秘主题。',
    className: 'frame-moonlit',
    imagePath: 'assets/card-frames/moonlit.svg',
    crest: '☾',
  },
  botanical: {
    id: 'botanical',
    label: '猫薄荷花园',
    description: '鼠尾草绿、藤叶花角与浅金线，适合自然和疗愈主题。',
    className: 'frame-botanical',
    imagePath: 'assets/card-frames/botanical.svg',
    crest: '❦',
  },
};

export function isCardFrameId(value: string): value is CardFrameId {
  return Object.prototype.hasOwnProperty.call(cardFrameSkins, value);
}

export function getCardFrameSkin(id?: string | null): CardFrameSkin {
  return id && isCardFrameId(id)
    ? cardFrameSkins[id]
    : cardFrameSkins[DEFAULT_CARD_FRAME_ID];
}

export function getCardFrameTone(
  card?: Pick<TarotCard, 'id' | 'arcana' | 'suit' | 'number'> | null,
): CardFrameTone {
  if (!card) return 'major';

  // A card keeps the same color everywhere (gallery, reveal, result and share),
  // while adjacent cards receive a shuffled-looking mix instead of one suit-wide
  // wall of color. Avoid Math.random(): refreshes and exported share cards must
  // remain visually stable.
  let hash = 2166136261;
  for (const character of card.id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const shuffledIndex = (hash + card.number) % CARD_FRAME_TONES.length;
  return CARD_FRAME_TONES[shuffledIndex];
}
