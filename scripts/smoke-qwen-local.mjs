import {
  assertFollowUpLlmResult,
  assertStructuredLlmResult,
} from '../shared/llmContract.js';
import { onRequestGet, onRequestPost } from '../functions/api/readings/analyze.js';
import { createMiaoSmokeRequestBody, miaoSmokePayload } from './fixtures/miao-smoke-payload.mjs';

const apiKey = process.env.DASHSCOPE_API_KEY || '';
if (!apiKey) {
  console.error('DASHSCOPE_API_KEY is not configured in the local environment.');
  process.exit(1);
}

const env = {
  LLM_API_KEY: apiKey,
  LLM_BASE_URL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  LLM_MODEL: process.env.DASHSCOPE_MODEL || 'qwen3.7-plus',
  LLM_MAX_TOKENS: process.env.DASHSCOPE_MAX_TOKENS || '1200',
  LLM_TIMEOUT_MS: process.env.DASHSCOPE_TIMEOUT_MS || '30000',
  LLM_RATE_LIMIT_PER_MINUTE: '0',
  LLM_JSON_MODE: 'true',
  LLM_ENABLE_THINKING: process.env.DASHSCOPE_ENABLE_THINKING || 'false',
};

async function call(handler, body = null) {
  const request = new Request('http://local.test/api/readings/analyze', body
    ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
    : undefined);
  const response = await handler({ request, env });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Qwen smoke failed: HTTP ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function callStream(body) {
  const startedAt = Date.now();
  const request = new Request('http://local.test/api/readings/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ ...body, stream: true }),
  });
  const response = await onRequestPost({ request, env });
  if (!response.ok || !response.body) {
    throw new Error(`Qwen stream smoke failed: HTTP ${response.status} ${await response.text()}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let deltaCount = 0;
  let firstDeltaMs = null;
  let done = null;

  const consume = (block) => {
    const event = block.match(/^event:\s*(.+)$/m)?.[1]?.trim();
    const dataText = block.match(/^data:\s*(.+)$/m)?.[1];
    if (!event || !dataText) return;
    const data = JSON.parse(dataText);
    if (event === 'delta') {
      deltaCount += 1;
      if (firstDeltaMs === null) firstDeltaMs = Date.now() - startedAt;
    }
    if (event === 'error') throw new Error(`Qwen stream error: ${JSON.stringify(data)}`);
    if (event === 'done') done = data;
  };

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    blocks.forEach(consume);
  }
  if (buffer.trim()) consume(buffer);
  if (!done) throw new Error('Qwen stream ended without a done event.');

  return {
    ...done,
    stream: {
      deltaCount,
      firstDeltaMs,
      totalMs: Date.now() - startedAt,
    },
  };
}

const status = await call(onRequestGet);
if (status.available !== true) {
  throw new Error(`Qwen status is unavailable: ${JSON.stringify(status)}`);
}
if (status.streaming !== true) {
  throw new Error(`Qwen status does not advertise streaming: ${JSON.stringify(status)}`);
}

const initial = await callStream(createMiaoSmokeRequestBody());
try {
  assertStructuredLlmResult(initial.structured, { expectedCards: miaoSmokePayload.cards.length });
} catch (error) {
  console.error(JSON.stringify({
    stage: 'initial',
    model: initial.model,
    content: initial.content,
    structured: initial.structured,
    usage: initial.usage || null,
  }, null, 2));
  throw error;
}

const partialPayload = {
  ...miaoSmokePayload,
  progress: { revealedCards: 1, totalCards: 5, complete: false },
  cards: miaoSmokePayload.cards.slice(0, 1),
};
const cardReveal = await callStream({
  themeId: 'miaotarot',
  mode: 'card_reveal',
  cardIndex: 0,
  payload: partialPayload,
});
try {
  assertFollowUpLlmResult(cardReveal.structured);
} catch (error) {
  console.error(JSON.stringify({
    stage: 'card_reveal',
    model: cardReveal.model,
    content: cardReveal.content,
    structured: cardReveal.structured,
    usage: cardReveal.usage || null,
  }, null, 2));
  throw error;
}

const followUp = await callStream({
  themeId: 'miaotarot',
  mode: 'follow_up',
  message: '我这周最应该先核实哪一项离职条件？',
  history: [
    { role: 'assistant', content: cardReveal.content },
  ],
  payload: partialPayload,
});
try {
  assertFollowUpLlmResult(followUp.structured);
} catch (error) {
  console.error(JSON.stringify({
    stage: 'follow_up',
    model: followUp.model,
    content: followUp.content,
    structured: followUp.structured,
    usage: followUp.usage || null,
  }, null, 2));
  throw error;
}

console.log(JSON.stringify({
  keyConfigured: true,
  model: initial.model,
  initial: {
    structured: true,
    title: initial.structured.title,
    summary: initial.structured.summary,
    cards: initial.structured.cards,
    actions: initial.structured.actions.length,
    usage: initial.usage || null,
    stream: initial.stream,
  },
  followUp: {
    structured: true,
    reply: followUp.structured.reply,
    reflectionQuestion: followUp.structured.reflectionQuestion,
    suggestedActions: followUp.structured.actions,
    actions: followUp.structured.actions.length,
    asksReflectionQuestion: Boolean(followUp.structured.reflectionQuestion),
    usage: followUp.usage || null,
    stream: followUp.stream,
  },
  cardReveal: {
    structured: true,
    reply: cardReveal.structured.reply,
    suggestedActions: cardReveal.structured.actions,
    usage: cardReveal.usage || null,
    stream: cardReveal.stream,
  },
}, null, 2));

console.log('Local Qwen smoke ok: production handler, real provider SSE deltas, one persistent card-reveal message, and one bounded follow-up turn.');
