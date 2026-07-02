export interface StructuredLlmCardResult {
  position: string;
  reading: string;
}

export interface StructuredLlmResult {
  title: string;
  summary: string;
  cards: StructuredLlmCardResult[];
  actions: string[];
  shareText: string;
}

export interface StructuredLlmLimits {
  title: number;
  action: number;
  shareText: number;
  minCards: number;
  maxCards: number;
  actions: number;
}

export interface StructuredLlmAssertOptions {
  expectedCards?: number;
}

export const structuredLlmLimits: StructuredLlmLimits;
export function stripJsonFence(value: string): string;
export function normalizeStructuredLlmResult(value: unknown): StructuredLlmResult | null;
export function parseStructuredLlmResult(value: string): StructuredLlmResult | null;
export function assertStructuredLlmResult(value: unknown, options?: StructuredLlmAssertOptions): StructuredLlmResult;
