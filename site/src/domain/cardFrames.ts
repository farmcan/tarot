export const CARD_FRAME_IDS = [
  'inked-paper',
  'gilded',
  'moonlit',
  'botanical',
] as const;

export type CardFrameId = (typeof CARD_FRAME_IDS)[number];

export interface CardFrameSkin {
  id: CardFrameId;
  label: string;
  description: string;
  className: string;
  imagePath: string;
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
