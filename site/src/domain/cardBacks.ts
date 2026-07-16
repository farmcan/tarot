export type CardBackTheme = 'morning' | 'noon' | 'night';
export type DayPhase = CardBackTheme;

export interface CardBackSkin {
  id: CardBackTheme;
  label: string;
  description: string;
  image: string;
}

export const cardBackSkins: Record<CardBackTheme, CardBackSkin> = {
  morning: {
    id: 'morning',
    label: '晨光花园',
    description: '清晨到上午优先出现的暖金猫影。',
    image: '/assets/card-backs/morning-garden.avif',
  },
  noon: {
    id: 'noon',
    label: '日轮神谕',
    description: '白天优先出现的蓝金日轮与水晶。',
    image: '/assets/card-backs/noon-oracle.avif',
  },
  night: {
    id: 'night',
    label: '月夜星图',
    description: '傍晚和夜间优先出现的紫金月相。',
    image: '/assets/card-backs/moon-atlas.avif',
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
  const preferred = getDayPhase(options.date);

  // Time sets the mood, while an occasional alternate keeps repeat shuffles surprising.
  if (random() < 0.72) return preferred;
  const alternates = cardBackThemes.filter((theme) => theme !== preferred);
  return alternates[Math.floor(random() * alternates.length)] ?? preferred;
}

export function getCardBackSkin(theme: CardBackTheme) {
  return cardBackSkins[theme];
}
