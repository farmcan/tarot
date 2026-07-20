import type { MiaoCard } from '../domain/miaoTarot';
import type { CardFrameId } from '../domain/cardFrames';

export type MiaoDeckScope = 'major' | 'full';

export interface MiaoPackCardOverride {
  breed?: string;
  image?: string;
  copy?: Partial<Omit<MiaoCard, 'tarotId'>>;
}

export interface MiaoPackImageConvention {
  basePath: string;
  extension?: string;
  cardIds?: readonly string[];
}

export interface MiaoContentPackDefinition {
  id: string;
  version: string;
  name: string;
  shortName: string;
  description: string;
  scope: MiaoDeckScope;
  artStyle: string;
  frameId?: CardFrameId;
  fallbackPackId?: string;
  images?: MiaoPackImageConvention;
  cards?: Record<string, MiaoPackCardOverride>;
}

export function defineMiaoContentPack(definition: MiaoContentPackDefinition) {
  return definition;
}
