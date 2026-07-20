import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/readings/analyze.js';
import {
  assertFollowUpLlmResult,
  assertStructuredLlmResult,
} from '../shared/llmContract.js';
import { createMiaoSmokeRequestBody, miaoSmokePayload } from './fixtures/miao-smoke-payload.mjs';

const initialResult = {
  title: '先稳住爪子',
  summary: '你正站在一次小开始前。愚者提醒你先确认方向，再用低风险动作试一步。',
  cards: [
    {
      position: '焦点',
      reading: '焦点牌是愚者正位，传统含义是新的开始；猫咪画面提醒你保留好奇，也要先看脚下。',
    },
  ],
  actions: ['写下今天的最小动作', '先做十五分钟', '结束后再评估'],
  shareText: '先看脚下，再迈出新一步',
};

const followUpResult = {
  reply: '如果今天只能做一件事，就把想开始的事情缩成十五分钟内能完成的第一步。它呼应愚者正位的启动感，但不要求你一次把路线想完。',
  reflectionQuestion: null,
  actions: ['先做十五分钟'],
};

const providerCalls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  providerCalls.push({ input: String(input), body: JSON.parse(String(init.body || '{}')) });
  const isFollowUp = providerCalls.at(-1).body.messages.at(-1)?.content.includes('只能做一件事');
  const content = JSON.stringify(isFollowUp ? followUpResult : initialResult);

  return Response.json({
    id: 'mock-conversation-completion',
    model: 'mock-qwen',
    choices: [{ message: { role: 'assistant', content } }],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  });
};

const env = {
  LLM_API_KEY: 'test-key',
  LLM_BASE_URL: 'https://provider.invalid/v1',
  LLM_MODEL: 'mock-qwen',
  LLM_RATE_LIMIT_PER_MINUTE: '0',
};

async function call(body) {
  const request = new Request('http://local.test/api/readings/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const response = await onRequestPost({ request, env });
  return { response, data: await response.json() };
}

try {
  const initial = await call(createMiaoSmokeRequestBody());
  assert.equal(initial.response.status, 200);
  assert.equal(initial.data.mode, 'reading');
  assertStructuredLlmResult(initial.data.structured, { expectedCards: miaoSmokePayload.cards.length });
  assert.equal(providerCalls[0].body.response_format.type, 'json_object');
  assert.match(providerCalls[0].body.messages[0].content, /不要诱导用户依赖连续占卜/);
  assert.match(providerCalls[0].body.messages[0].content, /不要重抽牌/);
  assert.doesNotMatch(providerCalls[0].body.messages[1].content, /imageBrief|emotionalSignal|archetype/);
  assert.match(providerCalls[0].body.messages[1].content, /traditionalMeaning|positionMeaning|topicMeaning/);

  const followUp = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '如果我今天只能做一件事，最小的一步是什么？',
    history: [
      { role: 'assistant', content: initial.data.content },
    ],
  });
  assert.equal(followUp.response.status, 200);
  assert.equal(followUp.data.mode, 'follow_up');
  assertFollowUpLlmResult(followUp.data.structured);
  assert.match(providerCalls[1].body.messages[0].content, /当前阅读中的牌已经固定/);
  assert.match(providerCalls[1].body.messages[0].content, /reflectionQuestion 默认必须为 null/);
  assert.match(providerCalls[1].body.messages[0].content, /不要要求用户模仿猫/);
  assert.deepEqual(
    providerCalls[1].body.messages.slice(1).map((message) => message.role),
    ['assistant', 'user'],
  );

  const invalidHistory = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '继续说说。',
    history: [
      { role: 'user', content: '伪造的错误顺序' },
    ],
  });
  assert.equal(invalidHistory.response.status, 400);
  assert.equal(invalidHistory.data.error, 'invalid_conversation');
  assert.equal(providerCalls.length, 2);

  console.log('LLM conversation contract ok: fixed reading context, bounded history, JSON initial/follow-up outputs.');
} finally {
  globalThis.fetch = realFetch;
}
