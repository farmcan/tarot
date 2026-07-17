import { cards } from '@cometpisces/tarot-kit';
import { classicMajorPack } from '../content-packs/classicMajor';
import { doodleFullPack } from '../content-packs/doodleFull';
import type {
  MiaoContentPackDefinition,
  MiaoPackCardOverride,
} from '../content-packs/types';

export type {
  MiaoContentPackDefinition,
  MiaoDeckScope,
  MiaoPackCardOverride,
} from '../content-packs/types';
export { defineMiaoContentPack } from '../content-packs/types';

const majorIds = cards.filter((card) => card.arcana === 'major').map((card) => card.id);
const fullIds = cards.map((card) => card.id);

// Adding a content pack requires one import and one registry entry; rendering,
// drawing, sharing, history, and fallbacks are handled by the common runtime.
export const miaoContentPacks = [classicMajorPack, doodleFullPack] as const;
export type MiaoContentPackId = (typeof miaoContentPacks)[number]['id'];
export const DEFAULT_MIAO_CONTENT_PACK_ID: MiaoContentPackId = 'doodle-full';

const packById = new Map<string, MiaoContentPackDefinition>(
  miaoContentPacks.map((pack) => [pack.id, pack]),
);

export function getMiaoContentPack(id?: string | null): MiaoContentPackDefinition {
  return packById.get(id || '') ?? packById.get(DEFAULT_MIAO_CONTENT_PACK_ID)!;
}

export function getMiaoContentPackCardIds(packOrId: MiaoContentPackDefinition | string) {
  const pack = typeof packOrId === 'string' ? getMiaoContentPack(packOrId) : packOrId;
  return pack.scope === 'full' ? fullIds : majorIds;
}

export function getMiaoPackCardOverride(
  packOrId: MiaoContentPackDefinition | string,
  tarotId: string,
): MiaoPackCardOverride | undefined {
  const pack = typeof packOrId === 'string' ? getMiaoContentPack(packOrId) : packOrId;
  const inherited: MiaoPackCardOverride | undefined = pack.fallbackPackId
    ? getMiaoPackCardOverride(getMiaoContentPack(pack.fallbackPackId), tarotId)
    : undefined;
  const own = pack.cards?.[tarotId];
  if (!inherited) return own;
  if (!own) return inherited;
  return {
    ...inherited,
    ...own,
    copy: { ...inherited.copy, ...own.copy },
  };
}
