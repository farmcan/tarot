import {
  normalizeFollowUpLlmResult,
  type FollowUpLlmResult,
} from '../../../shared/llmContract.js';

const CONVERSATION_STORAGE_KEY = 'miaotarot:ai-conversations:v1';
const CONVERSATION_STORAGE_VERSION = 1;
const MAX_STORED_CONVERSATIONS = 8;

export interface LlmConversationTurn {
  id: string;
  userMessage: string;
  assistantContent: string;
  result: FollowUpLlmResult;
}

export interface StoredLlmConversation {
  version: 1;
  readingId: string;
  updatedAt: string;
  baseContent: string;
  baseCardCount: number;
  turns: LlmConversationTurn[];
  draft: string;
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

function normalizeTurn(value: unknown): LlmConversationTurn | null {
  if (!isRecord(value)) return null;
  const result = normalizeFollowUpLlmResult(value.result);
  if (
    typeof value.id !== 'string'
    || typeof value.userMessage !== 'string'
    || typeof value.assistantContent !== 'string'
    || !result
  ) {
    return null;
  }
  return {
    id: value.id,
    userMessage: value.userMessage.slice(0, 500),
    assistantContent: value.assistantContent.slice(0, 4000),
    result,
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

  return {
    version: 1,
    readingId: value.readingId,
    updatedAt: value.updatedAt,
    baseContent: value.baseContent.slice(0, 8000),
    baseCardCount: Math.max(0, Math.min(10, Math.floor(value.baseCardCount))),
    turns,
    draft: value.draft.slice(0, 500),
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
