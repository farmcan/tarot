import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/readings/analyze.js';
import {
  assertCardRevealLlmResult,
  assertFocusLlmResult,
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

const focusResult = {
  acknowledgement: '你正在权衡继续留任的稳定与开始离开的准备。',
  focus: '离开后的安全感是否够',
  alternativeFocus: '继续留下会付出什么代价',
};

const cardRevealResult = {
  reply: '这张牌先提醒你把安全感落到可核实的现实条件上，牌面不替你决定。',
  reflectionQuestion: null,
  actions: ['核算最低月支出'],
  cardEvidence: {
    traditional: '正位强调主动规划、远景与开始布局。',
    context: '放在方案 A，它提醒你判断继续留任是否真的增加离开的准备。',
    boundary: '牌面无法确认你的实际支出和招聘进度，需要现实信息核对。',
    alternative: '另一种看法是，这张牌也可能提醒你别把准备无限延后。',
  },
};

const providerCalls = [];
const realFetch = globalThis.fetch;
let activePayload = miaoSmokePayload;
globalThis.fetch = async (input, init = {}) => {
  providerCalls.push({ input: String(input), body: JSON.parse(String(init.body || '{}')) });
  const requestBody = providerCalls.at(-1).body;
  const isFollowUp = requestBody.messages.at(-1)?.content.includes('最应该先核实');
  const isCardReveal = requestBody.messages.at(-1)?.content.includes('刚翻开的牌');
  const isFocus = requestBody.messages.at(-1)?.content.includes('确认你对用户问题重点');
  const content = JSON.stringify(
    isFocus
      ? focusResult
      : isCardReveal
        ? cardRevealResult
        : isFollowUp
          ? followUpResult
          : createInitialResult(activePayload),
  );

  if (requestBody.stream === true) {
    const pieces = [content.slice(0, 24), content.slice(24, 72), content.slice(72)];
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
      start(controller) {
        for (const piece of pieces) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            choices: [{ delta: { content: piece }, finish_reason: null }],
          })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [],
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        })}\n\ndata: [DONE]\n\n`));
        controller.close();
      },
    }), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

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
  LLM_ENABLE_THINKING: 'false',
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

async function callStream(body) {
  activePayload = body.payload || body.reading || activePayload;
  const request = new Request('http://local.test/api/readings/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, stream: true }),
  });
  const response = await onRequestPost({ request, env });
  return { response, text: await response.text() };
}

try {
  const initial = await call(createMiaoSmokeRequestBody());
  assert.equal(initial.response.status, 200);
  assert.equal(initial.data.mode, 'reading');
  assertStructuredLlmResult(initial.data.structured, { expectedCards: miaoSmokePayload.cards.length });
  assert.equal(providerCalls[0].body.response_format.type, 'json_object');
  assert.equal(providerCalls[0].body.enable_thinking, false);
  assert.match(providerCalls[0].body.messages[0].content, /不要诱导用户依赖连续占卜/);
  assert.match(providerCalls[0].body.messages[0].content, /不要重抽牌/);
  assert.match(providerCalls[0].body.messages[0].content, /不要用“不是 A，而是 B”/);
  assert.match(providerCalls[0].body.messages[0].content, /保持用户原话的范围和强度/);
  assert.match(providerCalls[0].body.messages[0].content, /不要用“确认、证明、说明你就是”/);
  assert.match(providerCalls[0].body.messages[0].content, /“例如\/比如”中的内容也算新增信息/);
  assert.match(providerCalls[0].body.messages[0].content, /提出理解假设—允许用户纠正—让确认后的重点贯穿解释/);
  assert.match(providerCalls[0].body.messages[0].content, /不要给用户贴“敏感、缺爱、焦虑型/);
  assert.match(providerCalls[0].body.messages[0].content, /不要写“掩盖焦虑、逃避、被迫无奈、自我欺骗、害怕失败”/);
  assert.match(providerCalls[0].body.messages[0].content, /不要用带有预设结论的反问或二选一/);
  assert.doesNotMatch(providerCalls[0].body.messages[1].content, /imageBrief|emotionalSignal|archetype/);
  assert.match(providerCalls[0].body.messages[1].content, /traditionalMeaning|positionMeaning|topicMeaning/);
  assert.match(providerCalls[0].body.messages[1].content, /这是选择权衡牌阵/);
  assert.match(providerCalls[0].body.messages[1].content, /恰好返回 5 项/);
  assert.match(providerCalls[0].body.messages[1].content, /方案 A 是继续留任并准备/);
  assert.match(providerCalls[0].body.messages[1].content, /不要添加与问题无关的喝水、呼吸、开窗、散步/);
  assert.match(providerCalls[0].body.messages[1].content, /不能借比喻加入比用户原话更强的负面评价/);
  assert.match(providerCalls[0].body.messages[1].content, /reading 不超过 150 个中文字符/);
  assert.match(providerCalls[0].body.messages[1].content, /只轻微改写同一张牌的 tinyAction/);
  assert.match(providerCalls[0].body.messages[1].content, /summary 只能综合已经写入 cards 的提示/);
  assert.match(providerCalls[0].body.messages[1].content, /输出前逐段自检/);
  assert.match(providerCalls[0].body.messages[1].content, /不要新增心率、睡眠、食欲、诊断等健康指标/);

  const focus = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'focus',
  });
  assert.equal(focus.response.status, 200);
  assert.equal(focus.data.mode, 'focus');
  assertFocusLlmResult(focus.data.structured);
  assert.equal(providerCalls[1].body.temperature, 0.2);
  assert.match(providerCalls[1].body.messages[1].content, /不要解牌/);
  assert.match(providerCalls[1].body.messages[1].content, /可纠正的假设/);
  assert.match(providerCalls[1].body.messages[1].content, /alternativeFocus/);
  assert.doesNotMatch(providerCalls[1].body.messages[1].content, /traditionalMeaning/);

  const negotiatedFocus = {
    text: focusResult.focus,
    source: 'confirmed',
  };
  const followUp = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '我这周最应该先核实哪一项离职条件？',
    focus: negotiatedFocus,
    responseGoal: 'direct',
    history: [
      { role: 'assistant', content: initial.data.content },
    ],
  });
  assert.equal(followUp.response.status, 200);
  assert.equal(followUp.data.mode, 'follow_up');
  assertFollowUpLlmResult(followUp.data.structured);
  assert.equal(providerCalls[2].body.enable_thinking, false);
  assert.match(providerCalls[2].body.messages[0].content, /当前阅读中的牌已经固定/);
  assert.match(providerCalls[2].body.messages[0].content, /reflectionQuestion 默认必须为 null/);
  assert.match(providerCalls[2].body.messages[0].content, /不要要求用户模仿猫/);
  assert.match(providerCalls[2].body.messages[0].content, /继续区分方案 A、方案 B/);
  assert.match(providerCalls[2].body.messages[0].content, /不得新增阈值、比例、日期、公式、身体指标/);
  assert.match(providerCalls[2].body.messages[0].content, /只选择并缩小上下文已有的 tinyAction/);
  assert.match(providerCalls[2].body.messages[0].content, /第一句先回应用户本轮真正卡住的点/);
  assert.match(providerCalls[2].body.messages[0].content, /离开后的安全感是否够/);
  assert.match(providerCalls[2].body.messages[0].content, /用户本轮选择“直接说重点”/);
  assert.deepEqual(
    providerCalls[2].body.messages.slice(1).map((message) => message.role),
    ['assistant', 'user'],
  );

  const cardReveal = await call({
    themeId: 'miaotarot',
    mode: 'card_reveal',
    cardIndex: 0,
    focus: negotiatedFocus,
    payload: {
      ...miaoSmokePayload,
      progress: { revealedCards: 1, totalCards: 5, complete: false },
      cards: miaoSmokePayload.cards.slice(0, 1),
    },
  });
  assert.equal(cardReveal.response.status, 200);
  assert.equal(cardReveal.data.mode, 'card_reveal');
  assertCardRevealLlmResult(cardReveal.data.structured);
  assert.match(providerCalls[3].body.messages[1].content, /用户整场阅读的问题/);
  assert.match(providerCalls[3].body.messages[1].content, /刚翻开的牌/);
  assert.match(providerCalls[3].body.messages[1].content, /不能推断用户在“掩盖焦虑、逃避、害怕失败、自我欺骗”/);
  assert.match(providerCalls[3].body.messages[1].content, /不要猜测剩余牌/);
  assert.match(providerCalls[3].body.messages[1].content, /离开后的安全感是否够/);
  assert.match(providerCalls[3].body.messages[1].content, /cardEvidence\.traditional/);
  assert.match(providerCalls[3].body.messages[1].content, /另一种合理解释/);

  const missingChoiceFocus = await call({
    themeId: 'miaotarot',
    mode: 'card_reveal',
    cardIndex: 0,
    payload: {
      ...miaoSmokePayload,
      progress: { revealedCards: 1, totalCards: 5, complete: false },
      cards: miaoSmokePayload.cards.slice(0, 1),
    },
  });
  assert.equal(missingChoiceFocus.response.status, 400);
  assert.deepEqual(missingChoiceFocus.data.details, ['focus is required for the choice pilot']);
  assert.equal(providerCalls.length, 4);

  const boundedHistory = [
    { role: 'assistant', content: initial.data.content },
    ...Array.from({ length: 5 }, (_, index) => ([
      { role: 'user', content: `第 ${index + 1} 次追问` },
      { role: 'assistant', content: JSON.stringify(followUpResult) },
    ])).flat(),
  ];
  const boundedFollowUp = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '我这周最应该先核实哪一项离职条件？',
    focus: negotiatedFocus,
    responseGoal: 'clarify',
    history: boundedHistory,
  });
  assert.equal(boundedFollowUp.response.status, 200);
  assert.equal(providerCalls[4].body.messages.length, 13);
  assert.deepEqual(
    providerCalls[4].body.messages.slice(1).map((message) => message.role),
    [
      'assistant',
      'user', 'assistant',
      'user', 'assistant',
      'user', 'assistant',
      'user', 'assistant',
      'user', 'assistant',
      'user',
    ],
  );

  const invalidHistory = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '继续说说。',
    focus: negotiatedFocus,
    responseGoal: 'clarify',
    history: [
      { role: 'user', content: '伪造的错误顺序' },
    ],
  });
  assert.equal(invalidHistory.response.status, 400);
  assert.equal(invalidHistory.data.error, 'invalid_conversation');
  assert.equal(providerCalls.length, 5);

  const tooManyHistoryMessages = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '继续说说。',
    focus: negotiatedFocus,
    responseGoal: 'clarify',
    history: [
      ...boundedHistory,
      { role: 'user', content: '第 6 次追问' },
      { role: 'assistant', content: JSON.stringify(followUpResult) },
    ],
  });
  assert.equal(tooManyHistoryMessages.response.status, 400);
  assert.equal(tooManyHistoryMessages.data.error, 'invalid_conversation');
  assert.equal(providerCalls.length, 5);

  const missingChoiceResponseGoal = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '继续说说。',
    focus: negotiatedFocus,
    history: [{ role: 'assistant', content: initial.data.content }],
  });
  assert.equal(missingChoiceResponseGoal.response.status, 400);
  assert.deepEqual(
    missingChoiceResponseGoal.data.details,
    ['responseGoal is required for the choice pilot'],
  );
  assert.equal(providerCalls.length, 5);

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

  const partialPayload = {
    ...miaoSmokePayload,
    progress: { revealedCards: 1, totalCards: 5, complete: false },
    cards: miaoSmokePayload.cards.slice(0, 1),
  };
  const partial = await call({ themeId: 'miaotarot', payload: partialPayload });
  assert.equal(partial.response.status, 200);
  assertStructuredLlmResult(partial.data.structured, { expectedCards: 1 });
  assert.match(providerCalls.at(-1).body.messages[1].content, /目前只翻开 1 张/);
  assert.match(providerCalls.at(-1).body.messages[1].content, /猜测尚未翻开的牌/);

  const streamed = await callStream({ themeId: 'miaotarot', payload: partialPayload });
  assert.equal(streamed.response.status, 200);
  assert.match(streamed.response.headers.get('content-type') || '', /text\/event-stream/);
  assert.equal(providerCalls.at(-1).body.stream, true);
  assert.equal(providerCalls.at(-1).body.stream_options.include_usage, true);
  assert.ok(streamed.text.match(/event: delta/g)?.length >= 2);
  assert.match(streamed.text, /event: done/);
  assert.doesNotMatch(streamed.text, /event: error/);

  console.log('LLM conversation contract ok: all Miao spreads, first-card context, real SSE deltas, bounded history, compact structured outputs.');
} finally {
  globalThis.fetch = realFetch;
}
