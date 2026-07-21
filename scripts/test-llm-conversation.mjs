import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/readings/analyze.js';
import {
  assertFollowUpLlmResult,
  assertStructuredLlmResult,
} from '../shared/llmContract.js';
import { createMiaoSmokeRequestBody, miaoSmokePayload } from './fixtures/miao-smoke-payload.mjs';

function createInitialResult(payload) {
  return {
    title: '两条路先摆上桌',
    summary: '牌面没有替你拍板，而是把两条路径、隐性成本和准备条件拆开。先核实现金流与求职进度，再用期限收束选择。',
    cards: payload.cards.map((card) => ({
      position: card.position,
      reading: `${card.tarotCard}${card.orientation}落在${card.position}，先按传统牌义解释，再联系这个具体问题。`,
    })),
    actions: ['核算最低月支出', '列出两条路径触发条件', '设定两周验证期限'],
    shareText: '先把两条路看清，再决定哪一步值得走',
  };
}

const followUpResult = {
  reply: '这周先核实最低月支出与招聘周期。它同时回应隐性成本的月亮逆位和建议位的权杖二正位，让决定建立在可验证条件上。',
  reflectionQuestion: null,
  actions: ['核算最低月支出', '询问两个岗位的招聘周期'],
};

const providerCalls = [];
const realFetch = globalThis.fetch;
let activePayload = miaoSmokePayload;
globalThis.fetch = async (input, init = {}) => {
  providerCalls.push({ input: String(input), body: JSON.parse(String(init.body || '{}')) });
  const requestBody = providerCalls.at(-1).body;
  const isFollowUp = requestBody.messages.at(-1)?.content.includes('最应该先核实');
  const content = JSON.stringify(isFollowUp ? followUpResult : createInitialResult(activePayload));

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
  activePayload = body.payload || body.reading || activePayload;
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
  assert.match(providerCalls[0].body.messages[0].content, /不要用“不是 A，而是 B”/);
  assert.match(providerCalls[0].body.messages[0].content, /保持用户原话的范围和强度/);
  assert.match(providerCalls[0].body.messages[0].content, /不要用“确认、证明、说明你就是”/);
  assert.match(providerCalls[0].body.messages[0].content, /“例如\/比如”中的内容也算新增信息/);
  assert.doesNotMatch(providerCalls[0].body.messages[1].content, /imageBrief|emotionalSignal|archetype/);
  assert.match(providerCalls[0].body.messages[1].content, /traditionalMeaning|positionMeaning|topicMeaning/);
  assert.match(providerCalls[0].body.messages[1].content, /这是选择权衡牌阵/);
  assert.match(providerCalls[0].body.messages[1].content, /恰好返回 5 项/);
  assert.match(providerCalls[0].body.messages[1].content, /方案 A 是继续留任并准备/);
  assert.match(providerCalls[0].body.messages[1].content, /不要添加与问题无关的喝水、呼吸、开窗、散步/);
  assert.match(providerCalls[0].body.messages[1].content, /不能借比喻加入比用户原话更强的负面评价/);
  assert.match(providerCalls[0].body.messages[1].content, /reading 使用三步结构/);
  assert.match(providerCalls[0].body.messages[1].content, /最后只轻微改写同一张牌的 tinyAction/);
  assert.match(providerCalls[0].body.messages[1].content, /summary 只能综合已经写入 cards 的提示/);
  assert.match(providerCalls[0].body.messages[1].content, /输出前逐段自检/);
  assert.match(providerCalls[0].body.messages[1].content, /不要新增心率、睡眠、食欲、诊断等健康指标/);

  const followUp = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '我这周最应该先核实哪一项离职条件？',
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
  assert.match(providerCalls[1].body.messages[0].content, /继续区分方案 A、方案 B/);
  assert.match(providerCalls[1].body.messages[0].content, /不得新增阈值、比例、日期、公式、身体指标/);
  assert.match(providerCalls[1].body.messages[0].content, /只选择并缩小上下文已有的 tinyAction/);
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

  const additionalSpreadCases = [
    { id: 'single', name: '单牌聚焦', positions: ['焦点'] },
    { id: 'two-card', name: '双牌对照', positions: ['现状', '建议'] },
    { id: 'three-card', name: '三牌时间流', positions: ['过去', '现在', '下一步'] },
    { id: 'four-card', name: '四牌局面拆解', positions: ['现状', '阻碍', '资源', '行动'] },
    { id: 'relationship', name: '关系剖面', positions: ['你', '对方', '连接', '张力', '建议'] },
  ];

  for (const spreadCase of additionalSpreadCases) {
    const payload = {
      ...miaoSmokePayload,
      spread: { ...miaoSmokePayload.spread, id: spreadCase.id, name: spreadCase.name },
      cards: spreadCase.positions.map((position, index) => ({
        ...miaoSmokePayload.cards[index],
        position,
      })),
    };
    const response = await call({ themeId: 'miaotarot', payload });
    assert.equal(response.response.status, 200, `${spreadCase.id} should be accepted`);
    assertStructuredLlmResult(response.data.structured, { expectedCards: spreadCase.positions.length });
  }

  console.log('LLM conversation contract ok: all Miao spreads, fixed reading context, bounded history, JSON initial/follow-up outputs.');
} finally {
  globalThis.fetch = realFetch;
}
