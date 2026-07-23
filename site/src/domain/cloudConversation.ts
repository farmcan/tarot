import type { LlmConversationTurn } from './llmConversationStorage';
import type { MiaoReading } from './miaoTarot';

export interface CloudConversationAccess {
  conversationId: string;
  accessKey: string;
  enabled: boolean;
}

export interface CloudConversationSnapshot {
  version: 1;
  question: string;
  spread: {
    id: string;
    name: string;
    revealedCards: number;
    totalCards: number;
  };
  cards: Array<{
    position: string;
    tarotCard: string;
    orientation: 'upright' | 'reversed';
  }>;
  baseContent: string;
  baseCardCount: number;
  turns: LlmConversationTurn[];
}

function endpoint(access: CloudConversationAccess) {
  return `/api/conversations?id=${encodeURIComponent(access.conversationId)}`;
}

export async function loadCloudConversationAvailability() {
  try {
    const response = await fetch('/api/conversations', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { available: false, retentionDays: null };
    const data = await response.json() as { available?: unknown; retentionDays?: unknown };
    return {
      available: data.available === true,
      retentionDays: typeof data.retentionDays === 'number' ? data.retentionDays : null,
    };
  } catch {
    return { available: false, retentionDays: null };
  }
}

export function createCloudConversationSnapshot(
  reading: MiaoReading,
  baseContent: string,
  baseCardCount: number,
  turns: LlmConversationTurn[],
): CloudConversationSnapshot {
  return {
    version: 1,
    question: reading.question,
    spread: {
      id: reading.spread.id,
      name: reading.spread.name,
      revealedCards: reading.cards.length,
      totalCards: reading.spread.positions.length,
    },
    cards: reading.cards.map((card) => ({
      position: card.position.label,
      tarotCard: card.drawn.card.id,
      orientation: card.drawn.orientation,
    })),
    baseContent,
    baseCardCount,
    turns,
  };
}

export async function saveCloudConversation(
  readingId: string,
  access: CloudConversationAccess,
  snapshot: CloudConversationSnapshot,
  signal?: AbortSignal,
) {
  const response = await fetch(endpoint(access), {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Conversation-Key': access.accessKey,
    },
    body: JSON.stringify({ readingId, snapshot }),
    signal,
  });
  if (!response.ok) throw new Error('云端备份暂时没有保存成功，本地记录仍然有效。');
  return response.json() as Promise<{ saved: boolean; expiresAt: string; retentionDays: number }>;
}

export async function loadCloudConversation(
  access: CloudConversationAccess,
  signal?: AbortSignal,
) {
  const response = await fetch(endpoint(access), {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Conversation-Key': access.accessKey,
    },
    signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('暂时无法读取云端对话。');
  return response.json() as Promise<{ snapshot: CloudConversationSnapshot; expiresAt: string }>;
}

export async function deleteCloudConversation(
  access: CloudConversationAccess,
  signal?: AbortSignal,
) {
  const response = await fetch(endpoint(access), {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: {
      'X-Conversation-Key': access.accessKey,
    },
    signal,
  });
  if (!response.ok) throw new Error('云端记录暂时没有删除成功，请稍后再试。');
  return response.json() as Promise<{ deleted: boolean }>;
}
