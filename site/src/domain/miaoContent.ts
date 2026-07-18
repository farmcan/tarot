import { cards } from '@cometpisces/tarot-kit';
import { getImagePath } from '@cometpisces/tarot-kit-images';
import { getMiaoArtDirection, type MiaoArtDirection } from './miaoArt';
import { getMiaoCard, miaoCards, type MiaoCard } from './miaoTarot';
import {
  DEFAULT_MIAO_CONTENT_PACK_ID,
  getMiaoContentPack,
  getMiaoPackCardOverride,
} from './miaoContentPacks';

export const MIAO_CONTENT_EDITION = 'tarot-first-v2' as const;
export const MIAO_CONTENT_SCHEMA_VERSION = 1 as const;
export const MIAO_DEFAULT_CONTENT_REVISION = '2.0.0' as const;

export const miaoContentRevisions: Record<string, string> = {
  'the-fool': '2.0.0',
  'the-magician': '2.0.0',
  'the-high-priestess': '2.0.0',
  'the-empress': '2.0.0',
  'the-emperor': '2.0.0',
  'the-hierophant': '2.0.0',
  'the-lovers': '2.0.0',
  'the-chariot': '2.0.0',
  strength: '2.0.0',
  'the-hermit': '2.0.0',
  'wheel-of-fortune': '2.0.0',
  justice: '2.0.0',
  'the-hanged-man': '2.0.0',
  death: '2.0.0',
  temperance: '2.0.0',
  'the-devil': '2.0.0',
  'the-tower': '2.0.0',
  'the-star': '2.0.0',
  'the-moon': '2.0.0',
  'the-sun': '2.0.0',
  judgement: '2.0.0',
  'the-world': '2.0.0',
};

export interface MiaoCardContentBundle {
  tarotId: string;
  edition: typeof MIAO_CONTENT_EDITION;
  schemaVersion: typeof MIAO_CONTENT_SCHEMA_VERSION;
  revision: string;
  copy: MiaoCard;
  art: MiaoArtDirection;
  contentPackId?: string;
  catBreed?: string;
}

export const miaoContentBundles: Record<string, MiaoCardContentBundle> = Object.fromEntries(
  cards.map((card) => [
    card.id,
    {
      tarotId: card.id,
      edition: MIAO_CONTENT_EDITION,
      schemaVersion: MIAO_CONTENT_SCHEMA_VERSION,
      revision: miaoContentRevisions[card.id] ?? MIAO_DEFAULT_CONTENT_REVISION,
      copy: getMiaoCard(card),
      art: getMiaoArtDirection(card.id),
    },
  ]),
);

export function getMiaoContentBundle(
  tarotId: string,
  contentPackId = DEFAULT_MIAO_CONTENT_PACK_ID,
): MiaoCardContentBundle {
  const pack = getMiaoContentPack(contentPackId);
  const override = getMiaoPackCardOverride(pack, tarotId);
  const card = cards.find((item) => item.id === tarotId);
  const baseBundle = miaoContentBundles[tarotId];
  const fallbackArt = getMiaoArtDirection(tarotId);
  const standardImageFilename = card ? getImagePath(card.id) || '' : fallbackArt.standardImageFilename;
  const standardImage = standardImageFilename
    ? `./assets/tarot-standard/${standardImageFilename.replace(/\.png$/i, '.avif')}`
    : fallbackArt.standardImage;
  const art = baseBundle?.art ?? {
    ...fallbackArt,
    tarotId,
    standardImage,
    standardImageFilename,
    generatedImage: undefined,
  };

  return {
    tarotId,
    edition: MIAO_CONTENT_EDITION,
    schemaVersion: MIAO_CONTENT_SCHEMA_VERSION,
    revision: miaoContentRevisions[tarotId] ?? MIAO_DEFAULT_CONTENT_REVISION,
    copy: card ? getMiaoCard(card, pack.id) : (baseBundle?.copy ?? miaoCards['the-fool']),
    art: {
      ...art,
      generatedImage: override?.image ?? art.generatedImage ?? standardImage,
    },
    contentPackId: pack.id,
    catBreed: override?.breed,
  };
}
