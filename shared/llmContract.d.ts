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
  summary: number;
  cardReading: number;
  action: number;
  shareText: number;
  minCards: number;
  maxCards: number;
  actions: number;
}

export interface StructuredLlmAssertOptions {
  expectedCards?: number;
}

export interface FollowUpLlmResult {
  reply: string;
  reflectionQuestion: string | null;
  actions: string[];
}

export interface FollowUpLlmLimits {
  reply: number;
  reflectionQuestion: number;
  action: number;
  maxActions: number;
}

export const structuredLlmLimits: StructuredLlmLimits;
export const followUpLlmLimits: FollowUpLlmLimits;
export function stripJsonFence(value: string): string;
export function normalizeStructuredLlmResult(value: unknown): StructuredLlmResult | null;
export function parseStructuredLlmResult(value: string): StructuredLlmResult | null;
export function assertStructuredLlmResult(value: unknown, options?: StructuredLlmAssertOptions): StructuredLlmResult;
export function normalizeFollowUpLlmResult(value: unknown): FollowUpLlmResult | null;
export function parseFollowUpLlmResult(value: string): FollowUpLlmResult | null;
export function assertFollowUpLlmResult(value: unknown): FollowUpLlmResult;
