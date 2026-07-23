import { expect, test, type Page } from '@playwright/test';

const userQuestion = '我该继续留在现在的工作，还是开始准备离开？';

async function chooseSingleCard(page: Page) {
  const advancedToggle = page.getByRole('button', { name: /3 张牌 ·/ });
  await advancedToggle.click();
  const singleCardRadio = page.getByRole('radio', { name: '1', exact: true });
  const radioId = await singleCardRadio.getAttribute('id');
  if (!radioId) throw new Error('Single-card control should have an associated label');
  await page.locator(`label[for="${radioId}"]`).click();
  await expect(singleCardRadio).toBeChecked();
}

function createSseBody(content: string, structured: unknown, mode: 'reading' | 'follow_up') {
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
          interactionModes: ['reading', 'follow_up'],
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
  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  await page.locator('.flipCardButton').first().click();
  await expect(page.getByText('已翻开 1/3 张，现在就能解读')).toBeVisible();
  await expect(page.locator('#reading-result')).toHaveCount(0);

  await page.getByRole('button', { name: '先聊已翻开的牌' }).click();
  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(aiPanel.getByText(userQuestion, { exact: true })).toBeVisible();
  await expect(aiPanel.getByText(/已翻开 1\/3 张/)).toBeVisible();
  const avatarSource = await aiPanel.locator('.miaoGuideAvatar img').first().getAttribute('src');
  await aiPanel.getByRole('button', { name: '开始 Miao 语解读' }).click();
  await expect(aiPanel.getByRole('heading', { name: '先把两条路摆上桌' })).toBeVisible();
  await expect(aiPanel.getByRole('heading', { name: '继续问这副牌' })).toBeVisible();
  await expect(aiPanel.getByText('核心提示', { exact: true }).first()).toBeVisible();
  await expect(aiPanel.getByText(/查看逐牌依据（1 张）/)).toBeVisible();
  expect((requests[0].payload as { progress: unknown }).progress).toEqual({
    revealedCards: 1,
    totalCards: 3,
    complete: false,
  });

  const followUpInput = aiPanel.getByRole('textbox', { name: '你的追问' });
  await aiPanel.getByRole('button', { name: '哪张牌最影响当前局面？' }).click();
  await expect(followUpInput).toHaveValue('哪张牌最影响当前局面？');
  await followUpInput.fill('我这周最应该先核实什么？');
  await aiPanel.getByRole('button', { name: '发送追问' }).click();
  await expect(aiPanel.getByText(/当前牌面仍然是/)).toBeVisible();

  const remainingCards = page.locator('.flipCardButton:not([disabled])');
  await remainingCards.first().click();
  await page.locator('.flipCardButton:not([disabled])').first().click();
  await expect(page.locator('#reading-result')).toBeVisible();
  await expect(aiPanel.getByText(/已翻开 3\/3 张/)).toBeVisible();
  await expect(aiPanel.getByRole('button', { name: '把新增的 2 张加入解读' })).toBeVisible();

  await followUpInput.fill('如果两个条件都不明确，我该怎么比较？');
  await aiPanel.getByRole('button', { name: '发送追问' }).click();
  await expect(aiPanel.getByText(/第二轮继续沿用原问题/)).toBeVisible();
  await expect(aiPanel.getByText('同一副牌', { exact: true })).toBeVisible();

  expect(requests).toHaveLength(3);
  const initial = requests[0];
  const firstFollowUp = requests[1];
  const secondFollowUp = requests[2];
  expect((initial.payload as { question: string }).question).toBe(userQuestion);
  expect((initial.payload as { cards: unknown[] }).cards).toHaveLength(1);
  expect(((initial.payload as { cards: Array<{ traditionalMeaning: string }> }).cards[0]).traditionalMeaning)
    .not.toBe('');
  expect(firstFollowUp.mode).toBe('follow_up');
  expect(firstFollowUp.message).toBe('我这周最应该先核实什么？');
  expect((firstFollowUp.history as Array<{ role: string }>).map((item) => item.role))
    .toEqual(['assistant']);
  expect((secondFollowUp.history as Array<{ role: string }>).map((item) => item.role))
    .toEqual(['assistant', 'user', 'assistant']);
  expect((secondFollowUp.payload as { question: string }).question).toBe(userQuestion);
  expect((secondFollowUp.payload as { cards: unknown[] }).cards).toHaveLength(3);
  expect((secondFollowUp.payload as { cards: Array<{ tarotCard: string }> }).cards[0].tarotCard)
    .toBe((initial.payload as { cards: Array<{ tarotCard: string }> }).cards[0].tarotCard);

  await expect(page.locator('.aiConversation')).toHaveScreenshot('mobile-ai-two-turn-conversation.png', {
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
  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  const restoredPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(restoredPanel.getByRole('heading', { name: '先把两条路摆上桌' })).toBeVisible();
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
  await expect(aiPanel.getByRole('button', { name: '开始 Miao 语解读' })).toBeDisabled();
  expect(postCount).toBe(0);
});
