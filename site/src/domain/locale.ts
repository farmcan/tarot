import { zhHansCharacterMap } from './zhHansMap.generated';

export function toSimplifiedChinese(value: string) {
  const phraseNormalized = value
    .replace(/翻[來来]覆去/g, '翻来__MIAO_FU__去')
    .split('計畫').join('计划');
  return [...phraseNormalized]
    .map((character) => zhHansCharacterMap[character] ?? character)
    .join('')
    .split('__MIAO_FU__').join('覆');
}
