import { cards } from '@cometpisces/tarot-kit';
import type {
  MiaoContentPackDefinition,
  MiaoPackCardOverride,
} from '../content-packs/types';

const contentPackIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semanticVersionPattern = /^\d+\.\d+\.\d+$/;
const tarotIds = new Set(cards.map((card) => card.id));
const majorIds = cards.filter((card) => card.arcana === 'major').map((card) => card.id);
const fullIds = cards.map((card) => card.id);

export interface MiaoContentPackRegistry {
  readonly packs: readonly MiaoContentPackDefinition[];
  readonly defaultPackId: string;
  getPack(id?: string | null): MiaoContentPackDefinition;
  getCardIds(packOrId: MiaoContentPackDefinition | string): readonly string[];
  getCardOverride(
    packOrId: MiaoContentPackDefinition | string,
    tarotId: string,
  ): MiaoPackCardOverride | undefined;
}

function assertValidDefinitions(
  definitions: readonly MiaoContentPackDefinition[],
  defaultPackId: string,
) {
  if (definitions.length === 0) throw new Error('At least one MiaoTarot content pack is required');

  const packById = new Map<string, MiaoContentPackDefinition>();
  for (const pack of definitions) {
    if (!contentPackIdPattern.test(pack.id)) throw new Error(`Invalid content pack id: ${pack.id}`);
    if (!semanticVersionPattern.test(pack.version)) throw new Error(`Invalid content pack version: ${pack.id}@${pack.version}`);
    if (packById.has(pack.id)) throw new Error(`Duplicate content pack id: ${pack.id}`);
    for (const tarotId of Object.keys(pack.cards ?? {})) {
      if (!tarotIds.has(tarotId)) throw new Error(`Unknown tarot id in ${pack.id}: ${tarotId}`);
    }
    for (const tarotId of pack.images?.cardIds ?? []) {
      if (!tarotIds.has(tarotId)) throw new Error(`Unknown image tarot id in ${pack.id}: ${tarotId}`);
    }
    if (pack.images && !pack.images.basePath.trim()) throw new Error(`Missing image base path in ${pack.id}`);
    if (pack.images?.extension && !/^[a-z0-9]+$/i.test(pack.images.extension)) {
      throw new Error(`Invalid image extension in ${pack.id}: ${pack.images.extension}`);
    }
    packById.set(pack.id, pack);
  }

  if (!packById.has(defaultPackId)) throw new Error(`Unknown default content pack: ${defaultPackId}`);
  for (const pack of definitions) {
    if (pack.fallbackPackId && !packById.has(pack.fallbackPackId)) {
      throw new Error(`Unknown fallback content pack for ${pack.id}: ${pack.fallbackPackId}`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (packId: string) => {
    if (visiting.has(packId)) throw new Error(`Circular content pack fallback: ${[...visiting, packId].join(' -> ')}`);
    if (visited.has(packId)) return;
    visiting.add(packId);
    const fallbackPackId = packById.get(packId)?.fallbackPackId;
    if (fallbackPackId) visit(fallbackPackId);
    visiting.delete(packId);
    visited.add(packId);
  };
  definitions.forEach((pack) => visit(pack.id));

  return packById;
}

export function createMiaoContentPackRegistry(
  definitions: readonly MiaoContentPackDefinition[],
  defaultPackId: string,
): MiaoContentPackRegistry {
  const packById = assertValidDefinitions(definitions, defaultPackId);

  const getPack = (id?: string | null) => (
    packById.get(id || '') ?? packById.get(defaultPackId)!
  );

  const getCardOverride = (
    packOrId: MiaoContentPackDefinition | string,
    tarotId: string,
  ): MiaoPackCardOverride | undefined => {
    const pack = typeof packOrId === 'string' ? getPack(packOrId) : packOrId;
    const fallback = pack.fallbackPackId ? packById.get(pack.fallbackPackId)! : undefined;
    const inherited = fallback ? getCardOverride(fallback, tarotId) : undefined;
    const conventionApplies = pack.images && (
      !pack.images.cardIds || pack.images.cardIds.includes(tarotId)
    );
    const conventionImage = conventionApplies
      ? `${pack.images!.basePath.replace(/\/$/, '')}/${tarotId}.${pack.images!.extension ?? 'avif'}`
      : undefined;
    const declared = pack.cards?.[tarotId];
    const own = conventionImage || declared
      ? { image: conventionImage, ...declared }
      : undefined;
    if (!inherited) return own;
    if (!own) return inherited;
    return {
      ...inherited,
      ...own,
      copy: { ...inherited.copy, ...own.copy },
    };
  };

  return {
    packs: definitions,
    defaultPackId,
    getPack,
    getCardIds(packOrId) {
      const pack = typeof packOrId === 'string' ? getPack(packOrId) : packOrId;
      return pack.scope === 'full' ? fullIds : majorIds;
    },
    getCardOverride,
  };
}
