import assert from 'node:assert/strict';
import { cards as tarotCards } from '@cometpisces/tarot-kit';
import * as OpenCC from 'opencc-js';
import { onRequestPost } from '../functions/api/readings/analyze.js';
import {
  assertCardRevealLlmResult,
  assertFocusLlmResult,
  assertFollowUpLlmResult,
  assertStructuredLlmResult,
} from '../shared/llmContract.js';
import {
  getMiaoChaosAsidePool,
  getMiaoChaosLibraryEntries,
  MIAO_CHAOS_ASIDE_COUNT,
  MIAO_CHAOS_CARD_COUNT,
} from '../shared/miaoChaosAsides.js';
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
  miaoAside: '规划基础，把担心养成常驻嘉宾不基础。',
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
  miaoAside: '星币四水灵灵地把“稳定”摆上桌。',
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
  const isFollowUp = requestBody.messages[0]?.content.includes('当前是围绕同一次阅读的后续对话');
  const isCardReveal = requestBody.messages.at(-1)?.content.includes('刚翻开的牌');
  const isFocus = requestBody.messages.at(-1)?.content.includes('确认你对用户问题重点');
  const requestsUnsafeReply = requestBody.messages
    .some((message) => message.content.includes('正文复核测试'));
  const miaoAsideDisabled = requestBody.messages
    .some((message) => message.content.includes('miaoAside 必须为 null'));
  const followUpResponse = {
    ...followUpResult,
    miaoAside: miaoAsideDisabled ? null : followUpResult.miaoAside,
  };
  const cardRevealResponse = {
    ...cardRevealResult,
    miaoAside: miaoAsideDisabled ? null : cardRevealResult.miaoAside,
    reply: requestsUnsafeReply
      ? '星币四说明你害怕变化，所以一直在逃避行动。'
      : cardRevealResult.reply,
  };
  const content = JSON.stringify(
    isFocus
      ? focusResult
      : isCardReveal
        ? cardRevealResponse
        : isFollowUp
          ? followUpResponse
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
  const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' });
  const expectedTarotNames = tarotCards.map((card) => (
    toSimplified(card.name.zh).replace(/^钱币/, '星币')
  )).sort();
  const chaosLibraryEntries = getMiaoChaosLibraryEntries();
  const chaosLibraryNames = [...new Set(
    chaosLibraryEntries.map((entry) => entry.cardName),
  )].sort();
  assert.equal(MIAO_CHAOS_CARD_COUNT, 78);
  assert.equal(MIAO_CHAOS_ASIDE_COUNT, 936);
  assert.deepEqual(chaosLibraryNames, expectedTarotNames);
  assert.equal(new Set(chaosLibraryEntries.map((entry) => entry.text)).size, 936);
  assert.ok(chaosLibraryEntries.every((entry) => (
    entry.text.length >= 10
    && entry.text.length <= 36
    && entry.text.includes(entry.cardName)
    && !/哈基米|曼波|爱猫TV|奶龙|我的刀盾|辱骂|去死/.test(entry.text)
  )));
  for (const cardName of expectedTarotNames) {
    const uprightPool = getMiaoChaosAsidePool(cardName, '正位');
    const reversedPool = getMiaoChaosAsidePool(cardName, '逆位');
    assert.equal(uprightPool.length, 6, `${cardName}正位 should have six fixed asides`);
    assert.equal(reversedPool.length, 6, `${cardName}逆位 should have six fixed asides`);
    assert.equal(new Set(uprightPool.map((item) => item.patternId)).size, 6);
    assert.equal(new Set(reversedPool.map((item) => item.patternId)).size, 6);
    assert.notDeepEqual(
      uprightPool.map((item) => item.text),
      reversedPool.map((item) => item.text),
    );
  }
  for (const [cardName, orientation] of [
    ['死神', '正位'],
    ['星币五', '逆位'],
    ['宝剑三', '正位'],
    ['宝剑十', '逆位'],
  ]) {
    const seriousPool = getMiaoChaosAsidePool(cardName, orientation);
    assert.ok(seriousPool.some((item) => item.text.includes('别水灵灵地带过')));
    assert.ok(seriousPool.some((item) => item.text.includes('松弛感先暂停')));
    assert.ok(seriousPool.some((item) => item.text.includes('已老实')));
    assert.ok(seriousPool.every((item) => !item.text.includes('水灵灵地端上')));
  }

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
  assert.equal(followUp.data.structured.miaoAside, followUpResult.miaoAside);
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
  assert.match(providerCalls[2].body.messages[0].content, /中度 Miao 声线/);
  assert.match(providerCalls[2].body.messages[0].content, /××基础，××不基础/);
  assert.match(providerCalls[2].body.messages[0].content, /每轮最多一个梗/);
  assert.match(providerCalls[2].body.messages[0].content, /哈基米、曼波、爱猫TV、奶龙、我的刀盾/);
  assert.deepEqual(
    providerCalls[2].body.messages.slice(1).map((message) => message.role),
    ['assistant', 'user'],
  );

  const cardReveal = await call({
    themeId: 'miaotarot',
    mode: 'card_reveal',
    voiceMode: 'chaos',
    cardIndex: 0,
    focus: negotiatedFocus,
    history: [
      { role: 'assistant', content: initial.data.content },
      { role: 'user', content: '我更担心离开后的现金流。' },
      { role: 'assistant', content: followUp.data.content },
    ],
    payload: {
      ...miaoSmokePayload,
      progress: { revealedCards: 1, totalCards: 5, complete: false },
      cards: miaoSmokePayload.cards.slice(0, 1),
    },
  });
  assert.equal(cardReveal.response.status, 200);
  assert.equal(cardReveal.data.mode, 'card_reveal');
  assertCardRevealLlmResult(cardReveal.data.structured);
  const firstChaosAside = cardReveal.data.structured.miaoAside;
  assert.ok(
    getMiaoChaosAsidePool('星币四', '正位')
      .some((item) => item.text === firstChaosAside),
  );
  assert.deepEqual(
    providerCalls[3].body.messages.slice(1, -1).map((message) => message.role),
    ['assistant', 'user', 'assistant'],
  );
  const cardRevealPrompt = providerCalls[3].body.messages.at(-1).content;
  assert.match(cardRevealPrompt, /用户整场阅读的问题/);
  assert.match(cardRevealPrompt, /此前对话已经作为消息历史提供/);
  assert.match(cardRevealPrompt, /刚翻开的牌/);
  assert.match(cardRevealPrompt, /当前牌与正逆位的固定语料池随机选定/);
  assert.match(cardRevealPrompt, /miaoAside 必须逐字返回/);
  assert.ok(cardRevealPrompt.includes(firstChaosAside));
  assert.match(cardRevealPrompt, /不能推断用户在“掩盖焦虑、逃避、害怕失败、自我欺骗”/);
  assert.match(cardRevealPrompt, /不要猜测剩余牌/);
  assert.match(cardRevealPrompt, /离开后的安全感是否够/);
  assert.match(cardRevealPrompt, /cardEvidence\.traditional/);
  assert.match(cardRevealPrompt, /另一种合理解释/);

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

  const sensitiveFollowUp = await call({
    ...createMiaoSmokeRequestBody(),
    mode: 'follow_up',
    message: '我胸痛，需要用这副牌判断要不要就医吗？',
    focus: negotiatedFocus,
    responseGoal: 'direct',
    history: [
      { role: 'assistant', content: initial.data.content },
    ],
  });
  assert.equal(sensitiveFollowUp.response.status, 200);
  assertFollowUpLlmResult(sensitiveFollowUp.data.structured);
  assert.equal(sensitiveFollowUp.data.structured.miaoAside, null);
  assert.match(providerCalls.at(-1).body.messages[0].content, /miaoAside 必须为 null/);
  assert.doesNotMatch(providerCalls.at(-1).body.messages[0].content, /默认使用“中度 Miao 声线”/);

  const secondCardReveal = await call({
    themeId: 'miaotarot',
    mode: 'card_reveal',
    voiceMode: 'chaos',
    cardIndex: 1,
    focus: negotiatedFocus,
    history: [{
      role: 'assistant',
      content: `方案 A：\nMiao 插嘴：${firstChaosAside}\n这张牌先看稳定与现实条件。`,
    }],
    payload: {
      ...miaoSmokePayload,
      progress: { revealedCards: 2, totalCards: 5, complete: false },
      cards: miaoSmokePayload.cards.slice(0, 2),
    },
  });
  assert.equal(secondCardReveal.response.status, 200);
  assertCardRevealLlmResult(secondCardReveal.data.structured);
  const secondChaosAside = secondCardReveal.data.structured.miaoAside;
  assert.ok(
    getMiaoChaosAsidePool('愚者', '正位')
      .some((item) => item.text === secondChaosAside),
  );
  assert.notEqual(secondChaosAside, firstChaosAside);
  assert.ok(providerCalls.at(-1).body.messages.at(-1).content.includes(secondChaosAside));
  assert.match(providerCalls.at(-1).body.messages.at(-1).content, /必须逐字返回/);

  const sanitizedReply = await call({
    themeId: 'miaotarot',
    mode: 'card_reveal',
    cardIndex: 0,
    payload: {
      ...partialPayload,
      question: '我在准备一个普通计划，这是正文复核测试。',
      spread: {
        id: 'single',
        name: '单牌聚焦',
        sourcePattern: '单张牌聚焦当前问题',
      },
      progress: { revealedCards: 1, totalCards: 1, complete: true },
    },
  });
  assert.equal(sanitizedReply.response.status, 200);
  assertCardRevealLlmResult(sanitizedReply.data.structured);
  assert.doesNotMatch(sanitizedReply.data.structured.reply, /害怕|逃避/);
  assert.match(sanitizedReply.data.structured.reply, /星币四正位落在“方案 A”/);

  const chaos = await call({
    themeId: 'miaotarot',
    voiceMode: 'chaos',
    payload: partialPayload,
  });
  assert.equal(chaos.response.status, 200);
  assert.equal(chaos.data.voiceMode, 'chaos');
  assert.match(providerCalls.at(-1).body.messages[0].content, /本轮声线：发疯模式/);
  assert.match(providerCalls.at(-1).body.messages[0].content, /每次回复最多使用两处梗/);
  assert.match(providerCalls.at(-1).body.messages[0].content, /不得辱骂用户或任何群体/);
  assert.equal(providerCalls.at(-1).body.temperature, 0.6);

  const providerCountBeforeInvalidVoice = providerCalls.length;
  const invalidVoice = await call({
    themeId: 'miaotarot',
    voiceMode: 'unbounded-persona',
    payload: partialPayload,
  });
  assert.equal(invalidVoice.response.status, 400);
  assert.equal(invalidVoice.data.error, 'invalid_conversation');
  assert.equal(providerCalls.length, providerCountBeforeInvalidVoice);

  const riskFallback = await call({
    themeId: 'miaotarot',
    voiceMode: 'chaos',
    payload: {
      ...partialPayload,
      question: '我胸痛又呼吸困难，应该吃什么药？',
    },
  });
  assert.equal(riskFallback.response.status, 200);
  assert.equal(riskFallback.data.requestedVoiceMode, 'chaos');
  assert.equal(riskFallback.data.voiceMode, 'normal');
  assert.match(providerCalls.at(-1).body.messages[0].content, /本轮声线：正常模式/);
  assert.doesNotMatch(providerCalls.at(-1).body.messages[0].content, /使用发疯模式/);
  assert.equal(providerCalls.at(-1).body.temperature, 0.4);

  const randomizedAsides = new Set();
  for (let index = 0; index < 18; index += 1) {
    const randomized = await call({
      themeId: 'miaotarot',
      mode: 'card_reveal',
      voiceMode: 'chaos',
      cardIndex: 0,
      payload: {
        ...partialPayload,
        question: '我想随机看看同一张牌的不同疯言疯语。',
        spread: {
          id: 'single',
          name: '单牌聚焦',
          sourcePattern: '单张牌聚焦当前问题',
        },
        progress: { revealedCards: 1, totalCards: 1, complete: true },
      },
    });
    assert.equal(randomized.response.status, 200);
    const aside = randomized.data.structured.miaoAside;
    assert.ok(
      getMiaoChaosAsidePool('星币四', '正位')
        .some((item) => item.text === aside),
    );
    randomizedAsides.add(aside);
  }
  assert.ok(
    randomizedAsides.size >= 3,
    `random selection should reach several fixed lines, received ${randomizedAsides.size}`,
  );

  console.log('LLM conversation contract ok: 936 fixed card-and-orientation chaos asides with random selection, non-repeating structures, normal/chaos risk fallback, sensitive-topic fallback, all spreads, real SSE deltas, bounded history, compact structured outputs.');
} finally {
  globalThis.fetch = realFetch;
}
