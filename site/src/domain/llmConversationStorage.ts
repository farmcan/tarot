import {
  normalizeCardRevealLlmResult,
  normalizeFocusLlmResult,
  normalizeFollowUpLlmResult,
  type CardRevealLlmResult,
  type FocusLlmResult,
  type FollowUpLlmResult,
} from '../../../shared/llmContract.js';
import type {
  LlmInterpretiveFocus,
  LlmResponseGoal,
} from './llm';

const CONVERSATION_STORAGE_KEY = 'miaotarot:ai-conversations:v1';
const CONVERSATION_STORAGE_VERSION = 1;
const MAX_STORED_CONVERSATIONS = 8;

export interface LlmConversationTurn {
  id: string;
  sequence?: number;
  userMessage: string;
  assistantContent: string;
  result: FollowUpLlmResult | null;
  status: 'streaming' | 'done' | 'incomplete';
}

export interface LlmCardMessage {
  id: string;
  sequence?: number;
  cardKey: string;
  position: string;
  tarotCardId: string;
  assistantContent: string;
  result: CardRevealLlmResult | FollowUpLlmResult | null;
  status: 'streaming' | 'done' | 'incomplete';
}

export type LlmReadingFeedback = 'captured' | 'partial' | 'missed';

export interface StoredLlmConversation {
  version: 1;
  readingId: string;
  updatedAt: string;
  baseContent: string;
  baseCardCount: number;
  cardMessages: LlmCardMessage[];
  turns: LlmConversationTurn[];
  draft: string;
  focusProposal?: FocusLlmResult;
  interpretiveFocus?: LlmInterpretiveFocus;
  responseGoal?: LlmResponseGoal;
  feedback?: LlmReadingFeedback;
  cloud?: {
    conversationId: string;
    accessKey: string;
    enabled: boolean;
  };
}

interface StoredConversationCollection {
  version: 1;
  entries: StoredLlmConversation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCardMessage(value: unknown): LlmCardMessage | null {
  if (!isRecord(value)) return null;
  const result = normalizeCardRevealLlmResult(value.result)
    || normalizeFollowUpLlmResult(value.result);
  if (
    typeof value.id !== 'string'
    || typeof value.cardKey !== 'string'
    || typeof value.position !== 'string'
    || typeof value.tarotCardId !== 'string'
    || typeof value.assistantContent !== 'string'
  ) {
    return null;
  }
  // A persisted stream has no live request after a refresh. Recover it as an
  // incomplete message so the text remains visible without a stuck “正在说”.
  const status = value.status === 'streaming' || value.status === 'incomplete'
    ? 'incomplete'
    : 'done';
  if (!result && !value.assistantContent.trim()) return null;
  return {
    id: value.id.slice(0, 180),
    ...(typeof value.sequence === 'number' && Number.isFinite(value.sequence)
      ? { sequence: Math.floor(value.sequence) }
      : {}),
    cardKey: value.cardKey.slice(0, 180),
    position: value.position.slice(0, 80),
    tarotCardId: value.tarotCardId.slice(0, 80),
    assistantContent: value.assistantContent.slice(0, 4000),
    result,
    status,
  };
}

function normalizeTurn(value: unknown): LlmConversationTurn | null {
  if (!isRecord(value)) return null;
  const result = normalizeFollowUpLlmResult(value.result);
  if (
    typeof value.id !== 'string'
    || typeof value.userMessage !== 'string'
    || typeof value.assistantContent !== 'string'
  ) {
    return null;
  }
  const status = value.status === 'streaming' || value.status === 'incomplete'
    ? 'incomplete'
    : 'done';
  if (!result && !value.assistantContent.trim()) return null;
  return {
    id: value.id,
    ...(typeof value.sequence === 'number' && Number.isFinite(value.sequence)
      ? { sequence: Math.floor(value.sequence) }
      : {}),
    userMessage: value.userMessage.slice(0, 500),
    assistantContent: value.assistantContent.slice(0, 4000),
    result,
    status,
  };
}

function normalizeConversation(value: unknown): StoredLlmConversation | null {
  if (!isRecord(value) || value.version !== CONVERSATION_STORAGE_VERSION) return null;
  if (
    typeof value.readingId !== 'string'
    || typeof value.updatedAt !== 'string'
    || typeof value.baseContent !== 'string'
    || typeof value.baseCardCount !== 'number'
    || typeof value.draft !== 'string'
    || !Array.isArray(value.turns)
  ) {
    return null;
  }

  const turns = value.turns
    .map(normalizeTurn)
    .filter((turn): turn is LlmConversationTurn => turn !== null)
    .slice(0, 6);
  const cardMessages = (Array.isArray(value.cardMessages) ? value.cardMessages : [])
    .map(normalizeCardMessage)
    .filter((message): message is LlmCardMessage => message !== null)
    .slice(0, 10);
  const cloud = isRecord(value.cloud)
    && typeof value.cloud.conversationId === 'string'
    && typeof value.cloud.accessKey === 'string'
    && typeof value.cloud.enabled === 'boolean'
    ? {
      conversationId: value.cloud.conversationId,
      accessKey: value.cloud.accessKey,
      enabled: value.cloud.enabled,
    }
    : undefined;
  const focusProposal = normalizeFocusLlmResult(value.focusProposal) || undefined;
  const interpretiveFocus = isRecord(value.interpretiveFocus)
    && typeof value.interpretiveFocus.text === 'string'
    && ['confirmed', 'alternative', 'custom'].includes(String(value.interpretiveFocus.source))
    ? {
      text: value.interpretiveFocus.text.trim().slice(0, 120),
      source: value.interpretiveFocus.source as LlmInterpretiveFocus['source'],
    }
    : undefined;
  const responseGoal = ['clarify', 'direct', 'listen'].includes(String(value.responseGoal))
    ? value.responseGoal as LlmResponseGoal
    : undefined;
  const feedback = ['captured', 'partial', 'missed'].includes(String(value.feedback))
    ? value.feedback as LlmReadingFeedback
    : undefined;

  return {
    version: 1,
    readingId: value.readingId,
    updatedAt: value.updatedAt,
    baseContent: value.baseContent.slice(0, 8000),
    baseCardCount: Math.max(0, Math.min(10, Math.floor(value.baseCardCount))),
    cardMessages,
    turns,
    draft: value.draft.slice(0, 500),
    ...(focusProposal ? { focusProposal } : {}),
    ...(interpretiveFocus?.text ? { interpretiveFocus } : {}),
    ...(responseGoal ? { responseGoal } : {}),
    ...(feedback ? { feedback } : {}),
    ...(cloud ? { cloud } : {}),
  };
}

function loadCollection(
  storage: Pick<Storage, 'getItem'> | null,
): StoredConversationCollection {
  if (!storage) return { version: 1, entries: [] };
  try {
    const stored = JSON.parse(storage.getItem(CONVERSATION_STORAGE_KEY) || 'null') as unknown;
    if (!isRecord(stored) || stored.version !== CONVERSATION_STORAGE_VERSION || !Array.isArray(stored.entries)) {
      return { version: 1, entries: [] };
    }
    return {
      version: 1,
      entries: stored.entries
        .map(normalizeConversation)
        .filter((entry): entry is StoredLlmConversation => entry !== null)
        .slice(0, MAX_STORED_CONVERSATIONS),
    };
  } catch {
    return { version: 1, entries: [] };
  }
}

export function loadLlmConversation(
  readingId: string,
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  return loadCollection(storage).entries.find((entry) => entry.readingId === readingId) ?? null;
}

export function saveLlmConversation(
  conversation: StoredLlmConversation,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  if (!storage) return;
  const normalized = normalizeConversation(conversation);
  if (!normalized) return;
  const existing = loadCollection(storage).entries;
  try {
    storage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify({
      version: 1,
      entries: [
        normalized,
        ...existing.filter((entry) => entry.readingId !== normalized.readingId),
      ].slice(0, MAX_STORED_CONVERSATIONS),
    }));
  } catch {
    // The live conversation remains in memory when storage is unavailable.
  }
}

export function clearLlmConversation(
  readingId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  if (!storage) return;
  const entries = loadCollection(storage).entries.filter((entry) => entry.readingId !== readingId);
  try {
    storage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify({ version: 1, entries }));
  } catch {
    // Storage is optional.
  }
}

export function createConversationAccess() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const accessKey = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return {
    conversationId: typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `conversation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    accessKey,
    enabled: true,
  };
}
