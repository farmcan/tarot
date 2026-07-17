import type { MiaoCard } from '../domain/miaoTarot';

export type MiaoDeckScope = 'major' | 'full';

export interface MiaoPackCardOverride {
  breed?: string;
  image?: string;
  copy?: Partial<Omit<MiaoCard, 'tarotId'>>;
}

export interface MiaoContentPackDefinition {
  id: string;
  version: string;
  name: string;
  shortName: string;
  description: string;
  scope: MiaoDeckScope;
  artStyle: string;
  fallbackPackId?: string;
  cards?: Record<string, MiaoPackCardOverride>;
}

export function defineMiaoContentPack(definition: MiaoContentPackDefinition) {
  return definition;
}
