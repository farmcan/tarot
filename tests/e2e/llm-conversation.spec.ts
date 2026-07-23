import { expect, test, type Locator, type Page } from '@playwright/test';

const userQuestion = '我该继续留在现在的工作，还是开始准备离开？';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let uuidCounter = 0;
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => {
        uuidCounter += 1;
        return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`;
      },
    });
  });
});

async function chooseSingleCard(page: Page) {
  const advancedToggle = page.getByRole('button', { name: /3 张牌 ·/ });
  await advancedToggle.click();
  const singleCardRadio = page.getByRole('radio', { name: '1', exact: true });
  const radioId = await singleCardRadio.getAttribute('id');
  if (!radioId) throw new Error('Single-card control should have an associated label');
  await page.locator(`label[for="${radioId}"]`).click();
  await expect(singleCardRadio).toBeChecked();
}

async function chooseFiveCardChoice(page: Page) {
  await page.getByRole('button', { name: /3 张牌 ·/ }).click();
  const fiveCardRadio = page.getByRole('radio', { name: '5', exact: true });
  const fiveCardRadioId = await fiveCardRadio.getAttribute('id');
  if (!fiveCardRadioId) throw new Error('Five-card control should have an associated label');
  await page.locator(`label[for="${fiveCardRadioId}"]`).click();
  await expect(page.getByRole('radio', { name: '选择权衡' })).toBeChecked();
  await expect(page.getByRole('button', { name: /5 张选择权衡 ·/ })).toBeVisible();
}

async function enableAiConversation(page: Page) {
  const aiSwitch = page.getByRole('switch', { name: '和 Miao 边翻边聊' });
  await page.locator('label[for="miao-ai-conversation-toggle"]').click();
  await expect(aiSwitch).toBeChecked();
}

async function alignBelowMobileChrome(locator: Locator) {
  await locator.evaluate((element) => new Promise<void>((resolve) => {
    const readingDesk = element.closest('#reading-desk');
    if (!(readingDesk instanceof HTMLElement)) {
      resolve();
      return;
    }
    const chrome = readingDesk.querySelector('.mobileReadingChrome');
    const chromeHeight = chrome?.getBoundingClientRect().height || 0;
    readingDesk.scrollTop += (
      element.getBoundingClientRect().top
      - readingDesk.getBoundingClientRect().top
      - chromeHeight
      - 12
    );
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

function createSseBody(
  content: string,
  structured: unknown,
  mode: 'reading' | 'focus' | 'card_reveal' | 'follow_up',
) {
  const pieces = [content.slice(0, 18), content.slice(18, 54), content.slice(54)];
  return [
    `event: meta\ndata: ${JSON.stringify({ themeId: 'miaotarot', mode, model: 'qwen3.7-plus' })}\n\n`,
    ...pieces.map((piece) => `event: delta\ndata: ${JSON.stringify({ content: piece })}\n\n`),
    `event: done\ndata: ${JSON.stringify({
      themeId: 'miaotarot',
      mode,
      model: 'qwen3.7-plus',
      content,
      structured,
    })}\n\n`,
  ].join('');
}

test('390px 手机首张牌即可流式对话，后续翻牌扩充上下文并在刷新后恢复', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  const requests: Array<Record<string, unknown>> = [];
  let followUpCount = 0;
  let cardRevealCount = 0;
  let cloudPostCount = 0;
  let cloudSnapshot: unknown = null;

  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'card_reveal', 'follow_up'],
          streaming: true,
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(body);
    const payload = body.payload as {
      question: string;
      cards: Array<{ position: string; tarotCard: string; traditionalMeaning: string }>;
    };

    if (body.mode === 'card_reveal') {
      cardRevealCount += 1;
      const cardIndex = Number(body.cardIndex);
      const card = payload.cards[cardIndex];
      const structured = {
        reply: `${card.position}翻开了${card.tarotCard}。围绕“${payload.question}”，先看这张牌提醒你核实的现实条件。`,
        reflectionQuestion: null,
        actions: ['写下这张牌对应的一个条件'],
        cardEvidence: {
          traditional: `${card.tarotCard}在${card.position}保留它的标准牌义骨架。`,
          context: '它会围绕原问题提示一个值得核实的现实条件。',
          boundary: '牌面不能替用户确认现实事实。',
          alternative: '也可以把它理解为暂时保留选择空间。',
        },
      };
      const content = JSON.stringify(structured);
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseBody(content, structured, 'card_reveal'),
      });
      return;
    }

    if (body.mode !== 'follow_up') {
      const structured = {
        title: '先把两条路摆上桌',
        summary: `这次先围绕“${payload.question}”看清现实条件，不替你决定。`,
        cards: payload.cards.map((card) => ({
          position: card.position,
          reading: `${card.tarotCard}落在${card.position}，先按传统牌义核实你已经知道的条件。`,
        })),
        actions: ['写下继续留任的条件', '核算可以承受的缓冲', '设一个回看日期'],
        shareText: '先把条件看清，再决定下一步',
      };
      const content = JSON.stringify(structured);
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseBody(content, structured, 'reading'),
      });
      return;
    }

    followUpCount += 1;
    if (followUpCount === 3) {
      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'provider_timeout' }),
      });
      return;
    }

    const message = String(body.message);
    const structured = {
      reply: followUpCount === 1
        ? `先核实现实底线。你问的是“${message}”，当前牌面仍然是${payload.cards[0].tarotCard}，没有重新抽牌。`
        : `第二轮继续沿用原问题和${payload.cards[0].tarotCard}。先比较两个条件，再选一个本周能验证的动作。`,
      reflectionQuestion: null,
      actions: followUpCount === 1
        ? ['列出本周能核实的一个条件']
        : ['给两条路径各写一个触发条件'],
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(content, structured, 'follow_up'),
    });
  });

  await page.route('**/api/conversations*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'GET' && !url.searchParams.has('id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ available: true, retentionDays: 30, optIn: true }),
      });
      return;
    }
    if (request.method() === 'GET') {
      if (!cloudSnapshot) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"conversation_not_found"}' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ snapshot: cloudSnapshot, expiresAt: '2026-08-22T00:00:00.000Z' }),
      });
      return;
    }
    if (request.method() === 'POST') {
      cloudPostCount += 1;
      cloudSnapshot = (request.postDataJSON() as { snapshot: unknown }).snapshot;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ saved: true, retentionDays: 30, expiresAt: '2026-08-22T00:00:00.000Z' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ deleted: true }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(userQuestion);
  await enableAiConversation(page);
  await expect(page.getByText(/它会成为每张牌解释和后续追问的共同锚点/)).toBeVisible();
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(aiPanel.getByRole('heading', { name: '带着问题，和 Miao 一张张看' })).toBeVisible();
  const openingQuestion = aiPanel.getByTestId('ai-opening-question');
  await expect(openingQuestion).toContainText(userQuestion);
  await expect(aiPanel.locator('.aiConversationLog > *').first()).toHaveAttribute('data-testid', 'ai-opening-question');
  await expect(aiPanel.getByRole('button', { name: '翻第一张' })).toBeVisible();
  await expect(page.getByRole('button', { name: '翻完牌后可分享' })).toBeDisabled();
  const aiConversation = aiPanel.locator('.aiConversation');
  await alignBelowMobileChrome(aiConversation);
  const mobileChrome = page.locator('.mobileReadingChrome');
  await mobileChrome.evaluate((element) => {
    (element as HTMLElement).style.visibility = 'hidden';
  });
  await expect(aiConversation).toHaveScreenshot('mobile-ai-conversation-entry.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await mobileChrome.evaluate((element) => {
    (element as HTMLElement).style.visibility = '';
  });
  await aiPanel.getByRole('button', { name: '翻第一张' }).click();
  const inlineReveal = aiPanel.getByTestId('ai-inline-card-reveal');
  await expect(inlineReveal).toBeVisible();
  await expect(inlineReveal).toHaveAttribute('data-phase', 'front');
  expect(requests).toHaveLength(0);
  await expect(inlineReveal).toHaveScreenshot('mobile-ai-inline-card-flip.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await expect(inlineReveal).toHaveCount(0);
  await expect(page.locator('#reading-result')).toHaveCount(0);
  await expect(aiPanel.getByText(/已翻开 1\/3 张/)).toBeVisible();
  const avatarSource = await aiPanel.locator('.miaoGuideAvatar img').first().getAttribute('src');
  await expect(aiPanel.getByText(/围绕“我该继续留在现在的工作/)).toBeVisible();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(1);
  await aiPanel.getByRole('button', { name: /放大查看.*喵牌/ }).first().click();
  const cardDetail = page.getByRole('dialog', { name: '塔罗牌详情' });
  await expect(cardDetail).toBeVisible();
  await expect(cardDetail.locator('.miaoCardArt')).toBeVisible();
  await cardDetail.locator('.mantine-Modal-close').click();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveScreenshot('mobile-ai-first-card-message.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await expect(aiPanel.getByRole('heading', { name: '继续问这副牌' })).toBeVisible();
  expect((requests[0].payload as { progress: unknown }).progress).toEqual({
    revealedCards: 1,
    totalCards: 3,
    complete: false,
  });
  expect(requests[0].mode).toBe('card_reveal');

  const followUpInput = aiPanel.getByRole('textbox', { name: '你的追问' });
  await aiPanel.getByRole('button', { name: '哪张牌最影响当前局面？' }).click();
  await expect(followUpInput).toHaveValue('哪张牌最影响当前局面？');
  await followUpInput.fill('我这周最应该先核实什么？');
  await aiPanel.getByRole('button', { name: '发送追问' }).click();
  await expect(aiPanel.getByText(/当前牌面仍然是/)).toBeVisible();

  await aiPanel.getByRole('button', { name: '翻下一张' }).click();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(2);
  await aiPanel.getByRole('button', { name: '翻下一张' }).click();
  await expect(page.locator('#reading-result')).toBeVisible();
  await expect(aiPanel.getByText(/已翻开 3\/3 张/)).toBeVisible();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(3);
  await expect(page.getByRole('button', { name: '分享这次阅读' })).toBeEnabled();

  await followUpInput.fill('如果两个条件都不明确，我该怎么比较？');
  await aiPanel.getByRole('button', { name: '发送追问' }).click();
  await expect(aiPanel.getByText(/第二轮继续沿用原问题/)).toBeVisible();
  await expect(aiPanel.getByText('同一副牌', { exact: true })).toBeVisible();

  const preservedDraft = '分享回来后，我还想继续问这一点';
  await followUpInput.fill(preservedDraft);
  await page.getByRole('button', { name: '分享这次阅读' }).click();
  const shareDrawer = page.getByRole('dialog', { name: '分享这次阅读' });
  await expect(shareDrawer).toBeVisible();
  await expect(shareDrawer.getByText('分享卡预览', { exact: true })).toBeVisible();
  await expect(shareDrawer.getByText(/分享结果或复制文案时会包含你写下的问题/)).toBeVisible();
  await expect(
    shareDrawer.getByRole('group', { name: '选择分享主角牌' }).getByRole('button'),
  ).toHaveCount(3);
  await expect(page).toHaveScreenshot('mobile-ai-share-drawer.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await shareDrawer.locator('.mantine-Drawer-close').click();
  await expect(shareDrawer).toBeHidden();
  await expect(followUpInput).toHaveValue(preservedDraft);
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(3);

  expect(requests).toHaveLength(5);
  expect(cardRevealCount).toBe(3);
  const initial = requests[0];
  const firstFollowUp = requests[1];
  const secondFollowUp = requests[4];
  expect((initial.payload as { question: string }).question).toBe(userQuestion);
  expect((initial.payload as { cards: unknown[] }).cards).toHaveLength(1);
  expect(((initial.payload as { cards: Array<{ traditionalMeaning: string }> }).cards[0]).traditionalMeaning)
    .not.toBe('');
  expect(firstFollowUp.mode).toBe('follow_up');
  expect(firstFollowUp.message).toBe('我这周最应该先核实什么？');
  expect((firstFollowUp.history as Array<{ role: string }>).map((item) => item.role))
    .toEqual(['assistant']);
  expect((requests[2].history as Array<{ role: string }>).map((item) => item.role))
    .toEqual(['assistant', 'user', 'assistant']);
  expect((secondFollowUp.history as Array<{ role: string }>).map((item) => item.role))
    .toEqual(['assistant', 'user', 'assistant']);
  expect((secondFollowUp.payload as { question: string }).question).toBe(userQuestion);
  expect((secondFollowUp.payload as { cards: unknown[] }).cards).toHaveLength(3);
  expect((secondFollowUp.payload as { cards: Array<{ tarotCard: string }> }).cards[0].tarotCard)
    .toBe((initial.payload as { cards: Array<{ tarotCard: string }> }).cards[0].tarotCard);
  const timelineText = await aiPanel.locator('.aiConversationLog > *').allTextContents();
  expect(timelineText.findIndex((text) => text.includes(userQuestion))).toBe(0);
  expect(timelineText.findIndex((text) => text.includes('我这周最应该先核实什么？')))
    .toBeLessThan(timelineText.findIndex((text) => text.includes('第 2 张')));

  await expect(page.locator('.aiConversationLog')).toHaveScreenshot('mobile-ai-two-turn-conversation.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  const cloudSwitch = aiPanel.getByRole('switch', { name: '云端备份对话' });
  await cloudSwitch.click({ force: true });
  await expect(cloudSwitch).toBeChecked();
  await expect(aiPanel.getByText(/已备份到 MiaoTarot 云端/)).toBeVisible();
  expect(cloudPostCount).toBeGreaterThan(0);

  const requestCountBeforeRefresh = requests.length;
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Miao 语解读', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  const restoredPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(restoredPanel.locator('.aiCardRevealMessage')).toHaveCount(3);
  await expect(restoredPanel.getByText(/第二轮继续沿用原问题/)).toBeVisible();
  await expect(restoredPanel.getByRole('switch', { name: '云端备份对话' })).toBeChecked();
  await expect(restoredPanel.locator('.miaoGuideAvatar img').first()).toHaveAttribute('src', avatarSource || '');
  expect(requests).toHaveLength(requestCountBeforeRefresh);

  const retryMessage = '如果这周还拿不到信息呢？';
  const restoredInput = restoredPanel.getByRole('textbox', { name: '你的追问' });
  await restoredInput.fill(retryMessage);
  await restoredPanel.getByRole('button', { name: '发送追问' }).click();
  await expect(restoredPanel.getByText('AI 响应超时了，请稍后再试。')).toBeVisible();
  await expect(restoredInput).toHaveValue(retryMessage);
  await expect(restoredPanel.getByText('同一副牌', { exact: true })).toBeVisible();
  const requestCountBeforeDelete = requests.length;
  await restoredPanel.getByRole('button', { name: '删除本地和云端对话' }).click();
  await expect(restoredPanel.locator('.aiCardRevealMessage')).toHaveCount(0);
  await expect(restoredPanel.locator('.aiConversationTurn')).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(requests).toHaveLength(requestCountBeforeDelete);
});

test('流式回复格式损坏时保留已显示文字，并在刷新后恢复', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  let postCount = 0;
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'card_reveal', 'follow_up'],
          streaming: true,
        }),
      });
      return;
    }
    postCount += 1;
    const brokenContent = '{"reply":"这段话已经流式显示，即使最后的 JSON 没有闭合，也必须留下来。';
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(brokenContent, null, 'card_reveal'),
    });
  });
  await page.route('**/api/conversations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, retentionDays: 30 }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill('我现在最需要看清哪一个现实条件？');
  await chooseSingleCard(page);
  await enableAiConversation(page);
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await aiPanel.getByRole('button', { name: '翻第一张' }).click();
  await expect(aiPanel.getByText(/这段话已经流式显示/)).toBeVisible();
  await expect(aiPanel.getByText(/回复已保留/)).toBeVisible();
  const requestCountBeforeRefresh = postCount;
  await page.evaluate(() => {
    const key = 'miaotarot:ai-conversations:v1';
    const stored = JSON.parse(localStorage.getItem(key) || 'null') as {
      entries?: Array<{ cardMessages?: Array<{ status?: string }> }>;
    } | null;
    if (stored?.entries?.[0]?.cardMessages?.[0]) {
      stored.entries[0].cardMessages[0].status = 'streaming';
      localStorage.setItem(key, JSON.stringify(stored));
    }
  });

  await page.reload();
  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  const restoredPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(restoredPanel.getByText(/这段话已经流式显示/)).toBeVisible();
  await expect(restoredPanel.getByText(/回复已保留/)).toBeVisible();
  await expect(restoredPanel.getByText('Miao 正在说', { exact: true })).toHaveCount(0);
  expect(postCount).toBe(requestCountBeforeRefresh);

  await page.evaluate(() => {
    const key = 'miaotarot:ai-conversations:v1';
    const stored = JSON.parse(localStorage.getItem(key) || 'null') as {
      entries?: Array<{
        turns?: Array<Record<string, unknown>>;
      }>;
    } | null;
    const entry = stored?.entries?.[0];
    if (!entry) throw new Error('Expected a persisted conversation');
    entry.turns = [{
      id: 'pending-user-turn',
      sequence: Date.now(),
      userMessage: '刚发送的追问也不能因为刷新消失',
      assistantContent: '',
      result: null,
      status: 'streaming',
    }];
    localStorage.setItem(key, JSON.stringify(stored));
  });
  await page.reload();
  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  const pendingRestoredPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  const pendingTurn = pendingRestoredPanel.locator('.aiConversationTurn');
  await expect(pendingTurn.getByText('刚发送的追问也不能因为刷新消失')).toBeVisible();
  await expect(pendingTurn.getByText('回复已保留；格式或连接没有完整收束。')).toBeVisible();
  await expect(pendingRestoredPanel.getByText('Miao 正在说', { exact: true })).toHaveCount(0);
});

test('修改问题时推荐重新抽牌，也可保留牌面重开对话', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  let cardRevealCount = 0;
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'card_reveal', 'follow_up'],
          streaming: true,
        }),
      });
      return;
    }
    cardRevealCount += 1;
    const body = route.request().postDataJSON() as {
      payload: { question: string };
    };
    const structured = {
      reply: `第 ${cardRevealCount} 次解释，当前问题是“${body.payload.question}”。`,
      reflectionQuestion: null,
      actions: [],
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(content, structured, 'card_reveal'),
    });
  });
  await page.route('**/api/conversations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, retentionDays: 30 }),
    });
  });

  const originalQuestion = '我该怎样安排这周最重要的事？';
  const keptQuestion = '我该先完成工作，还是先恢复精力？';
  const restartQuestion = '接下来一个月，我最该建立什么节奏？';
  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(originalQuestion);
  await chooseSingleCard(page);
  await enableAiConversation(page);
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await aiPanel.getByRole('button', { name: '翻第一张' }).click();
  await expect(aiPanel.getByText(/第 1 次解释/)).toBeVisible();
  await aiPanel.getByRole('button', { name: '修改问题' }).click();
  await expect(aiPanel.getByText(/推荐用新问题重新抽牌/)).toBeVisible();
  await aiPanel.getByRole('textbox', { name: '新的问题' }).fill(keptQuestion);
  await expect(aiPanel.locator('.aiReadingContext')).toHaveScreenshot('mobile-ai-question-edit.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await aiPanel.getByRole('button', { name: '保留这副牌，重开 Miao 对话' }).click();
  await expect(aiPanel.getByTestId('ai-opening-question')).toContainText(keptQuestion);
  await expect(aiPanel.getByText(/第 2 次解释/)).toBeVisible();
  await expect(aiPanel.getByText(/第 1 次解释/)).toHaveCount(0);

  await aiPanel.getByRole('button', { name: '修改问题' }).click();
  await aiPanel.getByRole('textbox', { name: '新的问题' }).fill(restartQuestion);
  await aiPanel.getByRole('button', { name: '用新问题重新抽牌（推荐）' }).click();
  await expect(page.getByRole('heading', { name: '这次想看清什么？' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '你的问题' })).toHaveValue(restartQuestion);
  await expect(page.getByRole('switch', { name: '和 Miao 边翻边聊' })).toBeChecked();
  await expect(page.locator('#reading-result')).toHaveCount(0);
});

test('抽完牌后开启 AI 也会进入逐张对话，不再生成精简报告', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  let postCount = 0;
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'card_reveal', 'follow_up'],
          streaming: true,
        }),
      });
      return;
    }
    postCount += 1;
    const body = route.request().postDataJSON() as {
      mode: string;
      cardIndex: number;
      payload: { cards: Array<{ position: string }> };
    };
    expect(body.mode).toBe('card_reveal');
    const structured = {
      reply: `${body.payload.cards[body.cardIndex].position}已经进入同一段对话。`,
      reflectionQuestion: null,
      actions: [],
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(content, structured, 'card_reveal'),
    });
  });
  await page.route('**/api/conversations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, retentionDays: 30 }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill('这周我最该把注意力放在哪里？');
  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  const flipButtons = page.locator('.flipCardButton');
  await flipButtons.first().click();
  await page.locator('.flipCardButton:not([disabled])').first().click();
  await page.locator('.flipCardButton:not([disabled])').first().click();
  await expect(page.locator('#reading-result')).toBeVisible();

  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await aiPanel.getByRole('button', { name: '开启 Miao 对话并解读已翻开的牌' }).click();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(3);
  expect(postCount).toBe(3);
  await expect(aiPanel.getByRole('button', { name: '重新生成精简解读' })).toHaveCount(0);
  await expect(aiPanel.getByRole('heading', { name: '继续问这副牌' })).toBeVisible();
});

test('320px 手机可在同一对话内翻牌、查看大图且不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'card_reveal', 'follow_up'],
          streaming: true,
        }),
      });
      return;
    }
    const structured = {
      reply: '先把这张牌放回你的问题里，核实一个现在能确认的现实条件。',
      reflectionQuestion: null,
      actions: [],
      cardEvidence: {
        traditional: '保留这张牌的传统正逆位骨架。',
        context: '只连接用户已经写下的问题。',
        boundary: '不替用户确认现实事实。',
        alternative: '也可以从保留选择空间来理解。',
      },
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(content, structured, 'card_reveal'),
    });
  });
  await page.route('**/api/conversations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, retentionDays: 30 }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(userQuestion);
  await chooseSingleCard(page);
  await enableAiConversation(page);
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  const revealButton = aiPanel.getByRole('button', { name: '翻第一张' });
  await expect(revealButton).toBeVisible();
  expect((await revealButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  const shareButton = page.getByRole('button', { name: '翻完牌后可分享' });
  await expect(shareButton).toBeDisabled();
  expect((await shareButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await revealButton.click();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '分享这次阅读' })).toBeEnabled();

  const overflow = await page.locator('#reading-desk').evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  await alignBelowMobileChrome(aiPanel.locator('.aiConversationLog'));
  await expect(page).toHaveScreenshot('narrow-ai-conversation.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await aiPanel.getByRole('button', { name: /放大查看.*喵牌/ }).click();
  const detail = page.getByRole('dialog', { name: '塔罗牌详情' });
  await expect(detail).toBeVisible();
  const detailBox = await detail.boundingBox();
  expect(detailBox?.x).toBeGreaterThanOrEqual(0);
  expect((detailBox?.x || 0) + (detailBox?.width || 0)).toBeLessThanOrEqual(320);
  await detail.locator('.mantine-Modal-close').click();
  await expect(detail).toBeHidden();
});

test('320px 手机关闭 Miao 语时仍能完成抽牌并查看基础结果', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  let postCount = 0;
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'POST') postCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        configured: false,
        available: false,
        turnstileRequired: false,
        model: null,
        interactionModes: ['reading', 'follow_up'],
      }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(userQuestion);
  await chooseSingleCard(page);
  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  await page.locator('.flipCardButton').click();

  await expect(page.locator('#reading-result')).toBeVisible();
  await expect(page.locator('#reading-result').getByRole('heading', { name: /核心牌是/ })).toBeVisible();

  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(aiPanel.getByText(/Miao 语解读尚未开放/)).toBeVisible();
  await expect(aiPanel.getByRole('button', { name: '开启 Miao 对话并解读已翻开的牌' })).toBeDisabled();
  expect(postCount).toBe(0);
});

test('选择权衡 pilot 先协商重点，再提供逐牌依据、反馈和回应目标', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  const requests: Array<Record<string, unknown>> = [];
  const productEvents: Array<Record<string, unknown>> = [];
  const focusResult = {
    acknowledgement: '你正在权衡继续留下的稳定，与开始离开所需要的准备。',
    focus: '离开后的安全感是否够',
    alternativeFocus: '继续留下会付出什么代价',
  };

  await page.route('**/api/product-event', async (route) => {
    productEvents.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' });
  });

  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'focus', 'card_reveal', 'follow_up'],
          streaming: true,
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(body);
    const payload = body.payload as {
      question: string;
      cards: Array<{ position: string; tarotCard: string }>;
    };

    if (body.mode === 'focus') {
      const content = JSON.stringify(focusResult);
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseBody(content, focusResult, 'focus'),
      });
      return;
    }

    if (body.mode === 'card_reveal') {
      const cardIndex = Number(body.cardIndex);
      const card = payload.cards[cardIndex];
      const focus = body.focus as { text: string; source: string };
      const structured = {
        reply: `${card.position}围绕“${focus.text}”提醒你先把牌面倾向与现实条件分开。`,
        reflectionQuestion: null,
        actions: ['写下一个待核实条件'],
        cardEvidence: {
          traditional: `${card.tarotCard}在这个牌位强调当前能量与选择空间。`,
          context: `放回“${focus.text}”，它提示你比较这条路径带来的实际变化。`,
          boundary: '牌面不能确认现实条件是否已经满足，需要你用已有信息核对。',
          alternative: '另一种看法是，它也可能在提醒你别把暂时的倾向当成最终答案。',
        },
      };
      const content = JSON.stringify(structured);
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseBody(content, structured, 'card_reveal'),
      });
      return;
    }

    const goal = String(body.responseGoal);
    const focus = body.focus as { text: string };
    const structured = {
      reply: `按“${goal}”回应：这副牌继续围绕“${focus.text}”，先核实一个现实条件。`,
      reflectionQuestion: null,
      actions: ['写下一个待核实条件'],
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(content, structured, 'follow_up'),
    });
  });

  await page.route('**/api/conversations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, retentionDays: 30 }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await chooseFiveCardChoice(page);
  await page.getByRole('textbox', { name: '你的问题' }).fill(
    '当前工作持续消耗，但还没有新 offer。方案 A 继续留任准备，方案 B 三个月内离职，我该如何权衡？',
  );
  await expect(page.getByRole('radio', { name: '选择权衡' })).toBeChecked();
  await enableAiConversation(page);
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(aiPanel.getByRole('heading', { name: 'Miao 先说说它听见了什么' })).toBeVisible();
  await expect(aiPanel.getByText(focusResult.acknowledgement)).toBeVisible();
  await expect(aiPanel.getByRole('button', { name: '就是这个' })).toBeVisible();
  await expect(aiPanel.getByRole('button', { name: /我更在意：继续留下会付出什么代价/ })).toBeVisible();
  await expect(aiPanel.getByRole('button', { name: '我自己补充' })).toBeVisible();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(0);
  await expect(aiPanel.locator('.focusNegotiation')).toHaveScreenshot('mobile-ai-focus-negotiation.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await aiPanel.getByRole('button', { name: '我自己补充' }).click();
  const customFocus = '继续留下会不会消耗准备下一步的时间';
  await aiPanel.getByRole('textbox', { name: '补充解读重点' }).fill(customFocus);
  await aiPanel.getByRole('button', { name: '按这个重点继续' }).click();
  await expect(aiPanel.getByText(`我先按你更在意「${customFocus}」来读。`)).toBeVisible();
  await aiPanel.getByRole('button', { name: '翻第一张' }).click();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(1);

  for (let expected = 2; expected <= 5; expected += 1) {
    await aiPanel.getByRole('button', { name: '翻下一张' }).click();
    await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(expected);
  }
  await expect(page.locator('#reading-result')).toBeVisible();

  const firstEvidence = aiPanel.locator('.cardTrustDetails').first();
  await firstEvidence.locator('summary').click();
  await expect(firstEvidence.getByText('传统牌义', { exact: true })).toBeVisible();
  await expect(firstEvidence.getByText('放回你的问题', { exact: true })).toBeVisible();
  await expect(firstEvidence.getByText('还要核实', { exact: true })).toBeVisible();
  await expect(firstEvidence.getByText('另一种看法', { exact: true })).toBeVisible();

  await expect(aiPanel.getByText('这次 Miao 抓住你的重点了吗？')).toBeVisible();
  await aiPanel.getByRole('button', { name: '部分抓住' }).click();
  await expect(aiPanel.getByText('接下来，你想怎么聊？')).toBeVisible();
  await aiPanel.getByRole('button', { name: /先听我说完/ }).click();
  await expect(aiPanel.getByRole('textbox', { name: '你还想补充什么？' })).toBeVisible();
  await expect(aiPanel.locator('.aiQuickPrompts')).toHaveCount(0);
  await aiPanel.getByRole('button', { name: /直接说重点/ }).click();
  const followUpInput = aiPanel.getByRole('textbox', { name: '你的追问' });
  await followUpInput.fill('那我现在最先核实什么？');
  await aiPanel.getByRole('button', { name: '发送追问' }).click();
  await expect(aiPanel.getByText(/按“direct”回应/)).toBeVisible();

  const cardRequests = requests.filter((request) => request.mode === 'card_reveal');
  expect(cardRequests).toHaveLength(5);
  for (const request of cardRequests) {
    expect(request.focus).toEqual({ text: customFocus, source: 'custom' });
  }
  const followUpRequest = requests.find((request) => request.mode === 'follow_up');
  expect(followUpRequest?.focus).toEqual({ text: customFocus, source: 'custom' });
  expect(followUpRequest?.responseGoal).toBe('direct');

  await expect.poll(() => productEvents.some((event) => (
    event.name === 'focus_corrected' && event.variant === 'custom'
  ))).toBe(true);
  await expect.poll(() => productEvents.some((event) => (
    event.name === 'reading_feedback_submitted' && event.variant === 'partial'
  ))).toBe(true);
  await expect.poll(() => productEvents.some((event) => (
    event.name === 'response_goal_selected' && event.variant === 'direct'
  ))).toBe(true);
  for (const event of productEvents) {
    expect(event).not.toHaveProperty('question');
    expect(event.trafficType).toBe('external');
  }

  await page.setViewportSize({ width: 320, height: 640 });
  await aiPanel.getByText('接下来，你想怎么聊？').scrollIntoViewIfNeeded();
  const dimensions = await aiPanel.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  await expect(aiPanel.locator('.responseGoalPicker')).toHaveScreenshot('mobile-ai-response-goals-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  const requestCountBeforeRefresh = requests.length;
  await page.reload();
  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  const restoredPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(restoredPanel.getByText(`我先按你更在意「${customFocus}」来读。`)).toBeVisible();
  await expect(restoredPanel.getByRole('button', { name: /直接说重点/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(restoredPanel.getByRole('button', { name: '部分抓住' })).toHaveAttribute('aria-pressed', 'true');
  expect(requests).toHaveLength(requestCountBeforeRefresh);
});

test('重点协商失败时可按原问题继续，不阻断固定牌面与基础阅读', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  const requests: Array<Record<string, unknown>> = [];
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'focus', 'card_reveal', 'follow_up'],
          streaming: true,
        }),
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(body);
    if (body.mode === 'focus') {
      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'provider_timeout' }),
      });
      return;
    }

    const structured = {
      reply: '先按原问题看这张牌，它提供一个视角，但不替你确认现实条件。',
      reflectionQuestion: null,
      actions: [],
      cardEvidence: {
        traditional: '这张牌强调变化中的判断与选择空间。',
        context: '放回原问题，它提醒你同时看两条路径。',
        boundary: '现实条件仍需由你核实。',
        alternative: '也可以把它理解为先保留可逆空间。',
      },
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(content, structured, 'card_reveal'),
    });
  });
  await page.route('**/api/conversations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, retentionDays: 30 }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await chooseFiveCardChoice(page);
  await page.getByRole('textbox', { name: '你的问题' }).fill('方案 A 继续准备，方案 B 现在离开，我该如何权衡？');
  await enableAiConversation(page);
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(aiPanel.getByText('这次没有对齐成功')).toBeVisible();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(0);
  await aiPanel.getByRole('button', { name: '按原问题继续' }).click();
  await aiPanel.getByRole('button', { name: '翻第一张' }).click();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(1);
  await expect(aiPanel.getByText('先按原问题看这张牌，它提供一个视角，但不替你确认现实条件。')).toBeVisible();
  await expect(aiPanel.getByText(/已翻开 1\/5 张/)).toBeVisible();
  await expect(page.locator('#reading-result')).toHaveCount(0);

  const cardRequest = requests.find((request) => request.mode === 'card_reveal');
  expect(cardRequest?.focus).toEqual({ text: '按原问题整体解读', source: 'custom' });
});
