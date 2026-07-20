import { classicMajorPack } from '../content-packs/classicMajor';
import { doodleFullPack } from '../content-packs/doodleFull';
import type {
  MiaoContentPackDefinition,
  MiaoPackCardOverride,
} from '../content-packs/types';
import { createMiaoContentPackRegistry } from './miaoContentPackRegistry';
import { getCardFrameSkin } from './cardFrames';

export type {
  MiaoContentPackDefinition,
  MiaoDeckScope,
  MiaoPackCardOverride,
} from '../content-packs/types';
export { defineMiaoContentPack } from '../content-packs/types';

// Adding a content pack requires one import and one registry entry; rendering,
// drawing, sharing, history, and fallbacks are handled by the common runtime.
export const miaoContentPacks = [classicMajorPack, doodleFullPack] as const;
export type MiaoContentPackId = (typeof miaoContentPacks)[number]['id'];
export const DEFAULT_MIAO_CONTENT_PACK_ID: MiaoContentPackId = 'doodle-full';

const registry = createMiaoContentPackRegistry(miaoContentPacks, DEFAULT_MIAO_CONTENT_PACK_ID);

export function getMiaoContentPack(id?: string | null): MiaoContentPackDefinition {
  return registry.getPack(id);
}

export function getMiaoContentPackCardIds(packOrId: MiaoContentPackDefinition | string) {
  return registry.getCardIds(packOrId);
}

export function getMiaoContentPackFrame(id?: string | null) {
  return getCardFrameSkin(getMiaoContentPack(id).frameId);
}

export function getMiaoPackCardOverride(
  packOrId: MiaoContentPackDefinition | string,
  tarotId: string,
): MiaoPackCardOverride | undefined {
  return registry.getCardOverride(packOrId, tarotId);
}
