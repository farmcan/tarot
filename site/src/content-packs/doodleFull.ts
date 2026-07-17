import { cards, type TarotCard } from '@cometpisces/tarot-kit';
import { defineMiaoContentPack, type MiaoPackCardOverride } from './types';

const majorBreeds: Record<string, string> = {
  'the-fool': '流浪田园黑猫',
  'the-magician': '异瞳纯白土耳其安哥拉',
  'the-high-priestess': '银渐层英短',
  'the-empress': '玳瑁母猫',
  'the-emperor': '缅因库恩',
  'the-hierophant': '斯芬克斯无毛猫',
  'the-lovers': '布偶猫',
  'the-chariot': '暹罗猫',
  strength: '橘猫（公橘）',
  'the-hermit': '俄罗斯蓝猫',
  'wheel-of-fortune': '奶牛猫',
  justice: '中华狸花猫',
  'the-hanged-man': '曼基康矮脚猫',
  death: '纯黑东方短毛猫',
  temperance: '英短蓝猫',
  'the-devil': '美短虎斑',
  'the-tower': '孟加拉豹猫',
  'the-star': '白色德文卷毛猫',
  'the-moon': '三花猫',
  'the-sun': '金渐层',
  judgement: '高地长毛白猫',
  'the-world': '波斯猫',
};

const suitBreeds: Record<NonNullable<TarotCard['suit']>, readonly string[]> = {
  wands: ['孟加拉豹猫', '暹罗猫', '奶牛猫'],
  cups: ['布偶猫', '三花猫', '玳瑁猫'],
  swords: ['俄罗斯蓝猫', '银渐层英短', '东方短毛猫'],
  pentacles: ['英短蓝猫', '橘猫', '中华狸花猫'],
};

const doodleImages: Record<string, string> = {
  'the-fool': './assets/miao-packs/doodle/the-fool.avif',
  'the-magician': './assets/miao-packs/doodle/the-magician.avif',
  'the-high-priestess': './assets/miao-packs/doodle/the-high-priestess.avif',
  'the-empress': './assets/miao-packs/doodle/the-empress.avif',
  'the-emperor': './assets/miao-packs/doodle/the-emperor.avif',
  'the-hierophant': './assets/miao-packs/doodle/the-hierophant.avif',
  'the-lovers': './assets/miao-packs/doodle/the-lovers.avif',
  'the-chariot': './assets/miao-packs/doodle/the-chariot.avif',
  strength: './assets/miao-packs/doodle/strength.avif',
  'the-hermit': './assets/miao-packs/doodle/the-hermit.avif',
  'wheel-of-fortune': './assets/miao-packs/doodle/wheel-of-fortune.avif',
  justice: './assets/miao-packs/doodle/justice.avif',
  'the-hanged-man': './assets/miao-packs/doodle/the-hanged-man.avif',
  death: './assets/miao-packs/doodle/death.avif',
  temperance: './assets/miao-packs/doodle/temperance.avif',
  'the-devil': './assets/miao-packs/doodle/the-devil.avif',
  'the-tower': './assets/miao-packs/doodle/the-tower.avif',
  'the-star': './assets/miao-packs/doodle/the-star.avif',
  'the-moon': './assets/miao-packs/doodle/the-moon.avif',
  'the-sun': './assets/miao-packs/doodle/the-sun.avif',
  judgement: './assets/miao-packs/doodle/judgement.avif',
  'the-world': './assets/miao-packs/doodle/the-world.avif',
};

const cardOverrides: Record<string, MiaoPackCardOverride> = Object.fromEntries(
  cards.map((card) => {
    const breed = card.arcana === 'major'
      ? majorBreeds[card.id]
      : card.suit
        ? suitBreeds[card.suit][(card.number - 1) % suitBreeds[card.suit].length]
        : undefined;
    return [card.id, { breed, image: doodleImages[card.id] }];
  }),
);

export const doodleFullPack = defineMiaoContentPack({
  id: 'doodle-full',
  version: '1.0.0',
  name: '猫咪百变涂鸦塔罗',
  shortName: '涂鸦 78 张',
  description: '标准 78 张牌池；大阿卡纳按牌意匹配猫咪品种，小阿卡纳按四花色轮换猫咪家族。',
  scope: 'full',
  artStyle: '潦草俏皮的墨线、蜡笔与彩铅涂鸦',
  fallbackPackId: 'classic-major',
  cards: cardOverrides,
});
