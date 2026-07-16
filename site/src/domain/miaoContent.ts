import { getMiaoArtDirection, type MiaoArtDirection } from './miaoArt';
import { miaoCards, type MiaoCard } from './miaoTarot';

export const MIAO_CONTENT_EDITION = 'major-arcana-v1' as const;

export interface MiaoCardContentBundle {
  tarotId: string;
  edition: typeof MIAO_CONTENT_EDITION;
  copy: MiaoCard;
  art: MiaoArtDirection;
}

export const miaoContentBundles: Record<string, MiaoCardContentBundle> = Object.fromEntries(
  Object.entries(miaoCards).map(([tarotId, copy]) => [
    tarotId,
    {
      tarotId,
      edition: MIAO_CONTENT_EDITION,
      copy,
      art: getMiaoArtDirection(tarotId),
    },
  ]),
);

export function getMiaoContentBundle(tarotId: string) {
  return miaoContentBundles[tarotId] ?? miaoContentBundles['the-fool'];
}
