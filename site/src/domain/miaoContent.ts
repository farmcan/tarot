import { getMiaoArtDirection, type MiaoArtDirection } from './miaoArt';
import { miaoCards, type MiaoCard } from './miaoTarot';

export const MIAO_CONTENT_EDITION = 'major-arcana-v1' as const;
export const MIAO_CONTENT_SCHEMA_VERSION = 1 as const;

export const miaoContentRevisions: Record<string, string> = {
  'the-fool': '1.0.0',
  'the-magician': '1.0.0',
  'the-high-priestess': '1.0.0',
  'the-empress': '1.0.0',
  'the-emperor': '1.0.0',
  'the-hierophant': '1.0.0',
  'the-lovers': '1.0.0',
  'the-chariot': '1.0.0',
  strength: '1.0.0',
  'the-hermit': '1.0.0',
  'wheel-of-fortune': '1.0.0',
  justice: '1.0.0',
  'the-hanged-man': '1.0.0',
  death: '1.0.0',
  temperance: '1.0.0',
  'the-devil': '1.0.0',
  'the-tower': '1.0.0',
  'the-star': '1.0.0',
  'the-moon': '1.0.0',
  'the-sun': '1.0.0',
  judgement: '1.0.0',
  'the-world': '1.0.0',
};

export interface MiaoCardContentBundle {
  tarotId: string;
  edition: typeof MIAO_CONTENT_EDITION;
  schemaVersion: typeof MIAO_CONTENT_SCHEMA_VERSION;
  revision: string;
  copy: MiaoCard;
  art: MiaoArtDirection;
}

export const miaoContentBundles: Record<string, MiaoCardContentBundle> = Object.fromEntries(
  Object.entries(miaoCards).map(([tarotId, copy]) => [
    tarotId,
    {
      tarotId,
      edition: MIAO_CONTENT_EDITION,
      schemaVersion: MIAO_CONTENT_SCHEMA_VERSION,
      revision: miaoContentRevisions[tarotId],
      copy,
      art: getMiaoArtDirection(tarotId),
    },
  ]),
);

export function getMiaoContentBundle(tarotId: string) {
  return miaoContentBundles[tarotId] ?? miaoContentBundles['the-fool'];
}
