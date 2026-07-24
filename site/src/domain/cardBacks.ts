export type CardBackTheme =
  | 'morning'
  | 'noon'
  | 'night'
  | 'tapestry'
  | 'paw-star'
  | 'peek';
export type DayPhase = 'morning' | 'noon' | 'night';

export interface CardBackSkin {
  id: CardBackTheme;
  label: string;
  description: string;
  image: string;
  aspectRatio: string;
}

export const cardBackSkins: Record<CardBackTheme, CardBackSkin> = {
  morning: {
    id: 'morning',
    label: '双猫追日',
    description: '两只猫围着晨光追逐，温暖又有陪伴感。',
    image: '/assets/card-backs/sun-chase.avif',
    aspectRatio: '4 / 7',
  },
  noon: {
    id: 'noon',
    label: '四喵守护',
    description: '四张猫脸围成蓝金守护纹章。',
    image: '/assets/card-backs/feline-guardians.avif',
    aspectRatio: '4 / 7',
  },
  night: {
    id: 'night',
    label: '月下双眠',
    description: '一明一暗的两只猫在月相下相拥入眠。',
    image: '/assets/card-backs/moon-sleepers.avif',
    aspectRatio: '4 / 7',
  },
  tapestry: {
    id: 'tapestry',
    label: '猫纹织毯',
    description: '猫眼、胡须、尾巴和爪印织成的牌背纹样。',
    image: '/assets/card-backs/paw-tapestry.avif',
    aspectRatio: '4 / 7',
  },
  'paw-star': {
    id: 'paw-star',
    label: '猫爪触星',
    description: '四只猫爪在抽牌前一刻共同碰向星光。',
    image: '/assets/card-backs/paws-touch-star.avif',
    aspectRatio: '4 / 7',
  },
  peek: {
    id: 'peek',
    label: '双喵偷看',
    description: '两只猫从牌背两端好奇地偷看占卜。',
    image: '/assets/card-backs/peek-portal.avif',
    aspectRatio: '4 / 7',
  },
};

export const cardBackThemes = Object.keys(cardBackSkins) as CardBackTheme[];

export function getDayPhase(date = new Date()): DayPhase {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'noon';
  return 'night';
}

export function selectCardBackTheme(options: { date?: Date; random?: () => number } = {}): CardBackTheme {
  const random = options.random ?? Math.random;
  const randomValue = Math.min(Math.max(random(), 0), 1 - Number.EPSILON);
  return cardBackThemes[Math.floor(randomValue * cardBackThemes.length)] ?? cardBackThemes[0];
}

export function getCardBackSkin(theme: CardBackTheme) {
  return cardBackSkins[theme];
}
