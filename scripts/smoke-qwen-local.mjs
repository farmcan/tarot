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
  LLM_MODEL: process.env.DASHSCOPE_MODEL || 'qwen-plus',
  LLM_MAX_TOKENS: process.env.DASHSCOPE_MAX_TOKENS || '1200',
  LLM_TIMEOUT_MS: process.env.DASHSCOPE_TIMEOUT_MS || '30000',
  LLM_RATE_LIMIT_PER_MINUTE: '0',
  LLM_JSON_MODE: 'true',
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

const status = await call(onRequestGet);
if (status.available !== true) {
  throw new Error(`Qwen status is unavailable: ${JSON.stringify(status)}`);
}

const initial = await call(onRequestPost, createMiaoSmokeRequestBody());
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

const followUp = await call(onRequestPost, {
  ...createMiaoSmokeRequestBody(),
  mode: 'follow_up',
  message: '如果我今天只能做一件事，最小的一步是什么？',
  history: [
    { role: 'assistant', content: initial.content },
  ],
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
    cards: initial.structured.cards.length,
    actions: initial.structured.actions.length,
    usage: initial.usage || null,
  },
  followUp: {
    structured: true,
    reply: followUp.structured.reply,
    reflectionQuestion: followUp.structured.reflectionQuestion,
    suggestedActions: followUp.structured.actions,
    actions: followUp.structured.actions.length,
    asksReflectionQuestion: Boolean(followUp.structured.reflectionQuestion),
    usage: followUp.usage || null,
  },
}, null, 2));

console.log('Local Qwen smoke ok: production handler, initial reading, and one bounded follow-up turn.');
