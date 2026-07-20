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
}

export const DEFAULT_CARD_FRAME_ID: CardFrameId = 'inked-paper';

export const cardFrameSkins: Record<CardFrameId, CardFrameSkin> = {
  'inked-paper': {
    id: 'inked-paper',
    label: '手绘纸框',
    description: '暖纸、深墨和蜡笔红点缀，适合涂鸦内容包。',
    className: 'frame-inked-paper',
  },
  gilded: {
    id: 'gilded',
    label: '古典鎏金',
    description: '双层金线与深棕卡边，适合传统和精致插画。',
    className: 'frame-gilded',
  },
  moonlit: {
    id: 'moonlit',
    label: '月夜星轨',
    description: '靛蓝、银紫和星点，适合夜间或神秘主题。',
    className: 'frame-moonlit',
  },
  botanical: {
    id: 'botanical',
    label: '猫薄荷花园',
    description: '鼠尾草绿与浅金线，适合自然和疗愈主题。',
    className: 'frame-botanical',
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
