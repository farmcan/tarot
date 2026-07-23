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
  miaoAside: string | null;
  reply: string;
  reflectionQuestion: string | null;
  actions: string[];
  cardEvidence?: CardEvidenceLlmResult;
}

export interface FocusLlmResult {
  acknowledgement: string;
  focus: string;
  alternativeFocus: string;
}

export interface CardEvidenceLlmResult {
  traditional: string;
  context: string;
  boundary: string;
  alternative: string;
}

export interface CardRevealLlmResult extends FollowUpLlmResult {
  cardEvidence: CardEvidenceLlmResult;
}

export interface FollowUpLlmLimits {
  reply: number;
  reflectionQuestion: number;
  action: number;
  maxActions: number;
}

export interface FocusLlmLimits {
  acknowledgement: number;
  focus: number;
  alternativeFocus: number;
}

export interface CardEvidenceLlmLimits {
  traditional: number;
  context: number;
  boundary: number;
  alternative: number;
}

export const structuredLlmLimits: StructuredLlmLimits;
export const followUpLlmLimits: FollowUpLlmLimits;
export const focusLlmLimits: FocusLlmLimits;
export const cardEvidenceLlmLimits: CardEvidenceLlmLimits;
export function stripJsonFence(value: string): string;
export function normalizeStructuredLlmResult(value: unknown): StructuredLlmResult | null;
export function parseStructuredLlmResult(value: string): StructuredLlmResult | null;
export function assertStructuredLlmResult(value: unknown, options?: StructuredLlmAssertOptions): StructuredLlmResult;
export function normalizeFollowUpLlmResult(value: unknown): FollowUpLlmResult | null;
export function parseFollowUpLlmResult(value: string): FollowUpLlmResult | null;
export function assertFollowUpLlmResult(value: unknown): FollowUpLlmResult;
export function normalizeFocusLlmResult(value: unknown): FocusLlmResult | null;
export function parseFocusLlmResult(value: string): FocusLlmResult | null;
export function assertFocusLlmResult(value: unknown): FocusLlmResult;
export function normalizeCardRevealLlmResult(value: unknown): CardRevealLlmResult | null;
export function parseCardRevealLlmResult(value: string): CardRevealLlmResult | null;
export function assertCardRevealLlmResult(value: unknown): CardRevealLlmResult;
