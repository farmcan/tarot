import {
  buildMiaoPayload,
  buildMiaoPrompt,
  type MiaoReading,
} from './miaoTarot';
import {
  normalizeCardRevealLlmResult,
  normalizeFocusLlmResult,
  normalizeFollowUpLlmResult,
  parseCardRevealLlmResult,
  parseFocusLlmResult,
  parseFollowUpLlmResult,
  parseStructuredLlmResult,
  type CardRevealLlmResult,
  type FocusLlmResult,
  type FollowUpLlmResult,
  type StructuredLlmCardResult,
  type StructuredLlmResult,
} from '../../../shared/llmContract.js';

export { parseFollowUpLlmResult, parseStructuredLlmResult };
export type {
  CardRevealLlmResult,
  FocusLlmResult,
  FollowUpLlmResult,
  StructuredLlmCardResult,
  StructuredLlmResult,
};

export type LlmFocusSource = 'confirmed' | 'alternative' | 'custom';
export type LlmResponseGoal = 'clarify' | 'direct' | 'listen';

export interface LlmInterpretiveFocus {
  text: string;
  source: LlmFocusSource;
}

export interface LlmConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmFollowUpResponse {
  content: string;
  structured: FollowUpLlmResult | null;
  model: string | null;
  warning: string | null;
}

export interface LlmCardRevealResponse {
  content: string;
  structured: CardRevealLlmResult | null;
  model: string | null;
  warning: string | null;
}

export interface LlmFocusResponse {
  content: string;
  structured: FocusLlmResult;
  model: string | null;
}

export interface LlmReadingResponse {
  content: string;
  structured: StructuredLlmResult | null;
  model: string | null;
  warning: string | null;
}

export interface LlmProxyConfig {
  endpoint?: string;
  themeId?: string;
  turnstileToken?: string;
  signal?: AbortSignal;
  onDelta?: (delta: string, accumulated: string) => void;
  focus?: LlmInterpretiveFocus;
  responseGoal?: LlmResponseGoal;
  history?: LlmConversationMessage[];
}

export interface LlmAvailability {
  configured: boolean;
  available: boolean;
  turnstileRequired: boolean;
  model: string | null;
  streaming: boolean;
}

export async function loadLlmAvailability(): Promise<LlmAvailability> {
  try {
    const response = await fetch('/api/readings/analyze', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('LLM status unavailable');
    const data = await response.json() as Partial<LlmAvailability>;
    return {
      configured: data.configured === true,
      available: data.available === true,
      turnstileRequired: data.turnstileRequired === true,
      model: typeof data.model === 'string' ? data.model : null,
      streaming: data.streaming === true,
    };
  } catch {
    return {
      configured: false,
      available: false,
      turnstileRequired: false,
      model: null,
      streaming: false,
    };
  }
}

export function buildMiaoLlmPayload(reading: MiaoReading) {
  return {
    ...buildMiaoPayload(reading),
    progress: {
      revealedCards: reading.cards.length,
      totalCards: reading.spread.positions.length,
      complete: reading.cards.length === reading.spread.positions.length,
    },
  };
}

export function buildMiaoLlmPrompt(reading: MiaoReading) {
  return buildMiaoPrompt(reading);
}

export function parseMiaoLlmResult(value: string, reading: MiaoReading) {
  const parsed = parseStructuredLlmResult(value);
  if (!parsed || parsed.cards.length !== reading.cards.length) return null;
  const positionsMatch = parsed.cards.every((card, index) => (
    card.position === reading.cards[index]?.position.label
  ));
  return positionsMatch ? parsed : null;
}

export function parseMiaoLlmResultForCardCount(
  value: string,
  reading: MiaoReading,
  cardCount: number,
) {
  const expectedCards = reading.cards.slice(0, cardCount);
  const parsed = parseStructuredLlmResult(value);
  if (!parsed || parsed.cards.length !== expectedCards.length) return null;
  return parsed.cards.every((card, index) => card.position === expectedCards[index]?.position.label)
    ? parsed
    : null;
}

function decodePartialJsonString(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function extractStreamingJsonStrings(value: string, field: string) {
  const values: string[] = [];
  const marker = new RegExp(`"${field}"\\s*:\\s*"`, 'g');
  let match = marker.exec(value);

  while (match) {
    let cursor = match.index + match[0].length;
    let escaped = false;
    let content = '';
    while (cursor < value.length) {
      const character = value[cursor];
      if (!escaped && character === '"') break;
      content += character;
      if (character === '\\' && !escaped) {
        escaped = true;
      } else {
        escaped = false;
      }
      cursor += 1;
    }
    values.push(decodePartialJsonString(content));
    marker.lastIndex = Math.max(cursor + 1, marker.lastIndex);
    match = marker.exec(value);
  }

  return values;
}

export function getMiaoStreamingPreview(
  content: string,
  mode: 'reading' | 'focus' | 'card_reveal' | 'follow_up',
) {
  if (mode === 'focus') {
    const acknowledgement = extractStreamingJsonStrings(content, 'acknowledgement')[0] || '';
    const focus = extractStreamingJsonStrings(content, 'focus')[0] || '';
    return [acknowledgement, focus ? `我先按「${focus}」来读。` : ''].filter(Boolean).join('\n\n');
  }

  if (mode === 'card_reveal') {
    const reply = extractStreamingJsonStrings(content, 'reply')[0] || '';
    const context = extractStreamingJsonStrings(content, 'context')[0] || '';
    return reply || context;
  }

  if (mode === 'follow_up') {
    return extractStreamingJsonStrings(content, 'reply')[0] || '';
  }

  const title = extractStreamingJsonStrings(content, 'title')[0] || '';
  const summary = extractStreamingJsonStrings(content, 'summary')[0] || '';
  const readings = extractStreamingJsonStrings(content, 'reading');
  return [title, summary, ...readings].filter(Boolean).join('\n\n');
}

export function getMiaoReadableContent(
  content: string,
  mode: 'reading' | 'focus' | 'card_reveal' | 'follow_up',
) {
  const preview = getMiaoStreamingPreview(content, mode).trim();
  if (preview) return preview;
  return content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
    .slice(0, mode === 'reading' ? 1600 : 640);
}

function readOpenAiCompatibleContent(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const data = value as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    output_text?: string;
    content?: string;
  };

  return (
    data.output_text ||
    data.content ||
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    ''
  );
}

function readProxyError(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const data = value as { error?: string; message?: string };

  if (data.error === 'llm_not_configured') {
    return 'LLM 还没有配置：需要在部署环境设置 LLM_API_KEY。';
  }
  if (data.error === 'rate_limited') {
    return '调用太频繁了，稍等一下再试。';
  }
  if (data.error === 'missing_turnstile_token') {
    return '需要完成验证后才能调用 LLM。';
  }
  if (data.error === 'provider_timeout') {
    return 'AI 响应超时了，请稍后再试。';
  }
  if (data.error === 'provider_unavailable' || data.error === 'provider_error') {
    return 'AI 服务暂时不可用，当前牌义和猫语结果仍然有效。';
  }
  if (data.message) return data.message;
  if (data.error) return data.error;

  return '';
}

async function postMiaoLlmRequest(
  body: Record<string, unknown>,
  config: LlmProxyConfig,
) {
  const endpoint = config.endpoint?.trim() || '/api/readings/analyze';
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: config.signal,
  });

  const rawText = await response.text();
  let parsed: unknown = rawText;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('LLM 代理暂时不可用：需要通过 Cloudflare Pages Functions 部署 /api/readings/analyze。');
    }
    throw new Error(readProxyError(parsed) || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed)));
  }

  return { parsed, rawText };
}

async function postMiaoLlmStream(
  body: Record<string, unknown>,
  config: LlmProxyConfig,
): Promise<Record<string, unknown>> {
  const endpoint = config.endpoint?.trim() || '/api/readings/analyze';
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal: config.signal,
  });

  if (!response.ok || !response.body) {
    const rawText = await response.text();
    let parsed: unknown = rawText;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Keep raw text for diagnostics.
    }
    if (response.status === 404) {
      throw new Error('Miao 语代理暂时不可用：需要部署 /api/readings/analyze。');
    }
    throw new Error(readProxyError(parsed) || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed)));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';
  let donePayload: Record<string, unknown> | null = null;

  const consumeBlock = (block: string) => {
    const lines = block.split(/\r?\n/);
    const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim() || 'message';
    const dataText = lines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!dataText) return;

    let data: unknown;
    try {
      data = JSON.parse(dataText);
    } catch {
      return;
    }
    const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};

    if (event === 'delta' && typeof record.content === 'string') {
      accumulated += record.content;
      config.onDelta?.(record.content, accumulated);
    } else if (event === 'done') {
      donePayload = record;
    } else if (event === 'error') {
      throw new Error(readProxyError(record) || 'Miao 的连接中断了，请稍后重试。');
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    blocks.forEach(consumeBlock);
  }
  buffer += decoder.decode();
  if (buffer.trim()) consumeBlock(buffer);

  const finalPayload = donePayload as Record<string, unknown> | null;
  if (!finalPayload) {
    throw new Error('Miao 的流式回复没有完整结束，请保留问题后重试。');
  }
  return finalPayload;
}

export async function callMiaoLlmEndpoint(reading: MiaoReading, config: LlmProxyConfig = {}) {
  const { parsed, rawText } = await postMiaoLlmRequest({
    themeId: config.themeId || 'miaotarot',
    payload: buildMiaoLlmPayload(reading),
    ...(config.turnstileToken ? { turnstileToken: config.turnstileToken } : {}),
  }, config);

  return readOpenAiCompatibleContent(parsed) || rawText;
}

export async function callMiaoLlmFollowUp(
  reading: MiaoReading,
  message: string,
  history: LlmConversationMessage[],
  config: LlmProxyConfig = {},
): Promise<LlmFollowUpResponse> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new Error('先写下你想继续问的问题。');
  }

  const { parsed, rawText } = await postMiaoLlmRequest({
    themeId: config.themeId || 'miaotarot',
    mode: 'follow_up',
    message: trimmedMessage,
    history,
    payload: buildMiaoLlmPayload(reading),
    ...(config.focus ? { focus: config.focus } : {}),
    ...(config.responseGoal ? { responseGoal: config.responseGoal } : {}),
    ...(config.turnstileToken ? { turnstileToken: config.turnstileToken } : {}),
  }, config);
  const content = readOpenAiCompatibleContent(parsed) || rawText;
  const data = parsed && typeof parsed === 'object'
    ? parsed as { structured?: unknown; model?: unknown }
    : null;
  const structured = normalizeFollowUpLlmResult(data?.structured)
    || parseFollowUpLlmResult(content);

  if (!structured) {
    throw new Error('AI 返回的追问内容不完整，请保留当前问题稍后重试。');
  }

  return {
    content,
    structured,
    model: typeof data?.model === 'string' ? data.model : null,
    warning: null,
  };
}

export async function streamMiaoLlmEndpoint(
  reading: MiaoReading,
  config: LlmProxyConfig = {},
): Promise<LlmReadingResponse> {
  const data = await postMiaoLlmStream({
    themeId: config.themeId || 'miaotarot',
    payload: buildMiaoLlmPayload(reading),
    ...(config.turnstileToken ? { turnstileToken: config.turnstileToken } : {}),
  }, config);
  const content = typeof data.content === 'string' ? data.content : '';
  const structured = parseMiaoLlmResult(content, reading);
  return {
    content,
    structured,
    model: typeof data.model === 'string' ? data.model : null,
    warning: typeof data.warning === 'string'
      ? data.warning
      : structured ? null : '回复已经保留，但格式没有完整收束。你可以继续追问或稍后重试。',
  };
}

export async function streamMiaoLlmCardReveal(
  reading: MiaoReading,
  cardIndex: number,
  config: LlmProxyConfig = {},
): Promise<LlmCardRevealResponse> {
  const data = await postMiaoLlmStream({
    themeId: config.themeId || 'miaotarot',
    mode: 'card_reveal',
    cardIndex,
    ...(config.history?.length ? { history: config.history } : {}),
    payload: buildMiaoLlmPayload(reading),
    ...(config.focus ? { focus: config.focus } : {}),
    ...(config.turnstileToken ? { turnstileToken: config.turnstileToken } : {}),
  }, config);
  const content = typeof data.content === 'string' ? data.content : '';
  const structured = normalizeCardRevealLlmResult(data.structured)
    || parseCardRevealLlmResult(content);
  return {
    content,
    structured,
    model: typeof data.model === 'string' ? data.model : null,
    warning: typeof data.warning === 'string'
      ? data.warning
      : structured ? null : '回复已经保留，但格式没有完整收束。你可以继续追问或稍后重试。',
  };
}

export async function streamMiaoLlmFocus(
  reading: MiaoReading,
  config: LlmProxyConfig = {},
): Promise<LlmFocusResponse> {
  const data = await postMiaoLlmStream({
    themeId: config.themeId || 'miaotarot',
    mode: 'focus',
    payload: buildMiaoLlmPayload(reading),
    ...(config.turnstileToken ? { turnstileToken: config.turnstileToken } : {}),
  }, config);
  const content = typeof data.content === 'string' ? data.content : '';
  const structured = normalizeFocusLlmResult(data.structured)
    || parseFocusLlmResult(content);
  if (!structured) {
    throw new Error('Miao 还没把理解说清楚，请重试或按原问题继续。');
  }
  return {
    content,
    structured,
    model: typeof data.model === 'string' ? data.model : null,
  };
}

export async function streamMiaoLlmFollowUp(
  reading: MiaoReading,
  message: string,
  history: LlmConversationMessage[],
  config: LlmProxyConfig = {},
): Promise<LlmFollowUpResponse> {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) throw new Error('先写下你想继续问的问题。');

  const data = await postMiaoLlmStream({
    themeId: config.themeId || 'miaotarot',
    mode: 'follow_up',
    message: trimmedMessage,
    history,
    payload: buildMiaoLlmPayload(reading),
    ...(config.focus ? { focus: config.focus } : {}),
    ...(config.responseGoal ? { responseGoal: config.responseGoal } : {}),
    ...(config.turnstileToken ? { turnstileToken: config.turnstileToken } : {}),
  }, config);
  const content = typeof data.content === 'string' ? data.content : '';
  const structured = normalizeFollowUpLlmResult(data.structured)
    || parseFollowUpLlmResult(content);
  return {
    content,
    structured,
    model: typeof data.model === 'string' ? data.model : null,
    warning: typeof data.warning === 'string'
      ? data.warning
      : structured ? null : '回复已经保留，但格式没有完整收束。你可以继续追问或稍后重试。',
  };
}
