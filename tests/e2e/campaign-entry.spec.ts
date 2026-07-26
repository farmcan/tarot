import { expect, test, type Page } from '@playwright/test';

type ProductEvent = Record<string, unknown>;

async function captureProductEvents(page: Page) {
  const events: ProductEvent[] = [];
  await page.route('**/api/product-event', async (route) => {
    events.push(route.request().postDataJSON() as ProductEvent);
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: '{"accepted":true}',
    });
  });
  return events;
}

async function stubPrivateClipboard(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => undefined,
      },
    });
  });
}

async function stubUnavailableAi(page: Page) {
  let postRequests = 0;
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'POST') {
      postRequests += 1;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"error":"not_configured"}',
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        configured: false,
        available: false,
        turnstileRequired: false,
        interactionModes: [],
        voiceModes: ['normal', 'chaos'],
        streaming: true,
      }),
    });
  });
  return () => postRequests;
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBeLessThanOrEqual(1);
  expect(await page.locator('.readingDesk').evaluate((element) => (
    element.scrollWidth - element.clientWidth
  ))).toBeLessThanOrEqual(1);
}

async function expectSetupHeadingBelowMobileChrome(page: Page) {
  const chromeBounds = await page.locator('.mobileReadingChrome').boundingBox();
  const headingBounds = await page.getByRole('heading', { name: '这次想看清什么？' }).boundingBox();
  expect(chromeBounds).not.toBeNull();
  expect(headingBounds).not.toBeNull();
  expect(headingBounds!.y).toBeGreaterThanOrEqual(
    chromeBounds!.y + chromeBounds!.height - 1,
  );
}

async function expectQuestionAboveStickyAction(page: Page) {
  const readingDesk = page.locator('.readingDesk');
  const question = page.getByRole('textbox', { name: '你的问题' });
  const stickyAction = page.locator('.readyStage .shuffleActionRow');
  expect(await readingDesk.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await question.isVisible()).toBe(true);
  const questionBounds = await question.boundingBox();
  const actionBounds = await stickyAction.boundingBox();
  expect(questionBounds).not.toBeNull();
  expect(actionBounds).not.toBeNull();
  expect(questionBounds!.y + questionBounds!.height)
    .toBeLessThanOrEqual(actionBounds!.y + 1);
  expect(questionBounds!.y + questionBounds!.height)
    .toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(await readingDesk.evaluate((element) => element.scrollTop)).toBe(0);
}

test('320px 抖音生姜入口直达可编辑问题且完整归因，不会自动抽牌或请求 AI', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await stubPrivateClipboard(page);
  const aiPostCount = await stubUnavailableAi(page);
  const events = await captureProductEvents(page);
  const approvedQuestion = '生姜伪装成土豆接近我，到底图什么？';
  const editedQuestion = '如果我没吃这块生姜，接下来该先确认什么？';

  await page.goto('/?mt_channel=douyin&mt_campaign=hot-ginger-v2');

  const dialog = page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' });
  await expect(dialog).toBeVisible();
  const question = page.getByRole('textbox', { name: '你的问题' });
  await expect(question).toHaveValue(approvedQuestion);
  await expect(page.getByRole('radio', { name: /发疯模式/ }))
    .toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => events.some((event) => (
    event.name === 'campaign_entry_opened'
    && event.variant === 'hot-ginger-v2'
    && event.source === 'social-douyin'
  ))).toBe(true);

  const sessionStarted = events.find((event) => event.name === 'session_started');
  expect(sessionStarted).toMatchObject({
    variant: 'hot-ginger-v2',
    source: 'social-douyin',
    trafficType: 'external',
  });
  expect(events.some((event) => event.name === 'home_action_selected')).toBe(false);
  expect(events.some((event) => event.name === 'reading_started')).toBe(false);
  expect(aiPostCount()).toBe(0);
  await expectSetupHeadingBelowMobileChrome(page);
  await expectQuestionAboveStickyAction(page);
  await expect(page).toHaveScreenshot(
    'campaign-entry-hot-ginger-320.png',
    {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  );

  await question.fill(editedQuestion);
  const start = page.getByRole('button', { name: /开始和 Miao 看牌|带着问题去洗牌/ });
  expect((await start.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await expectNoHorizontalOverflow(page);
  await start.click();
  await expect.poll(() => events.filter((event) => event.name === 'reading_started').length).toBe(1);
  expect(aiPostCount()).toBe(0);

  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  const flipCardInConversation = page.getByRole('button', { name: '翻第一张' });
  await flipCardInConversation.scrollIntoViewIfNeeded();
  await expect(flipCardInConversation).toBeVisible();
  await flipCardInConversation.click();
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
  await expect.poll(() => events.filter((event) => event.name === 'reading_completed').length).toBe(1);

  const started = events.find((event) => event.name === 'reading_started');
  const completed = events.find((event) => event.name === 'reading_completed');
  expect(started?.readingId).toMatch(/^[0-9a-f-]{36}$/i);
  expect(completed?.readingId).toBe(started?.readingId);

  await page.getByRole('button', { name: '分享这次阅读' }).click();
  const shareDialog = page.getByRole('dialog', { name: '分享这次阅读' });
  await expect(shareDialog).toBeVisible();
  await shareDialog.getByRole('button', { name: '复制分享链接' }).click();
  await expect.poll(() => events.some((event) => event.name === 'share_result')).toBe(true);

  const serializedEvents = JSON.stringify(events);
  expect(serializedEvents).not.toContain(approvedQuestion);
  expect(serializedEvents).not.toContain(editedQuestion);
  for (const event of events) {
    expect(event).not.toHaveProperty('question');
    expect(event).not.toHaveProperty('referrer');
    expect(event).not.toHaveProperty('cards');
  }
});

test('390px B 站产品入口直达正常模式，浏览器返回可退出且同标签页不重复归因', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const events = await captureProductEvents(page);

  await page.goto('/?mt_channel=bilibili&mt_campaign=product-tour-v1');

  const dialog = page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: '你的问题' }))
    .toHaveValue('我今天最需要看见什么？');
  await expect(page.getByRole('radio', { name: /正常模式/ }))
    .toHaveAttribute('aria-checked', 'true');
  await expectNoHorizontalOverflow(page);
  await expectSetupHeadingBelowMobileChrome(page);
  await expectQuestionAboveStickyAction(page);
  await expect(page).toHaveScreenshot(
    'campaign-entry-product-tour-390.png',
    {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  );

  await page.goBack();
  await expect(dialog).toHaveCount(0);
  const primary = page.getByRole('button', { name: '和猫猫聊一下' });
  await expect(primary).toBeVisible();
  await primary.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: '你的问题' }))
    .toHaveValue('我今天最需要看见什么？');
  await page.waitForTimeout(150);

  expect(events.filter((event) => event.name === 'session_started')).toHaveLength(1);
  expect(events.filter((event) => event.name === 'campaign_entry_opened')).toHaveLength(1);
  expect(events.find((event) => event.name === 'session_started')).toMatchObject({
    variant: 'product-tour-v1',
    source: 'social-bilibili',
  });
});

test('320px 未注册或不完整的营销参数回退普通首页，不创建高基数归因', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const events = await captureProductEvents(page);
  const ordinarySeed = '这段只属于普通 q 参数，不是 campaign 指令';

  await page.goto(
    `/?mt_channel=douyin&mt_campaign=unknown&q=${encodeURIComponent(ordinarySeed)}&voice=chaos`,
  );

  await expect(page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' })).toHaveCount(0);
  await expect.poll(() => events.some((event) => event.name === 'session_started')).toBe(true);
  expect(events.find((event) => event.name === 'session_started')).toMatchObject({
    variant: 'default',
    source: 'direct',
  });
  expect(events.some((event) => event.name === 'campaign_entry_opened')).toBe(false);
  expect(JSON.stringify(events)).not.toContain(ordinarySeed);

  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await expect(page.getByRole('textbox', { name: '你的问题' })).toHaveValue(ordinarySeed);
  await expect(page.getByRole('radio', { name: /发疯模式/ }))
    .toHaveAttribute('aria-checked', 'true');
});

test('390px 未完成阅读优先于营销入口，不会被预填问题静默覆盖', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const events = await captureProductEvents(page);
  const originalQuestion = '这次未完成的两张牌要保留下来';
  const campaignQuestion = '生姜伪装成土豆接近我，到底图什么？';

  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(originalQuestion);
  await page.getByRole('button', { name: /一张牌 ·/ }).click();
  const twoCardRadio = page.getByRole('radio', { name: '2', exact: true });
  const twoCardRadioId = await twoCardRadio.getAttribute('id');
  expect(twoCardRadioId).toBeTruthy();
  await page.locator(`label[for="${twoCardRadioId}"]`).click();
  await expect(twoCardRadio).toBeChecked();
  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  await page.locator('.flipCardButton').first().click();
  await expect.poll(() => page.evaluate(() => (
    localStorage.getItem('miaotarot:active-reading:v1')
  ))).not.toBeNull();

  await page.keyboard.press('Escape');
  await page.goto('/?mt_channel=douyin&mt_campaign=hot-ginger-v2');

  await expect(page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' })).toBeVisible();
  await expect(page.locator('.interactiveDrawTable')).not.toHaveAttribute('data-stage', 'ready');
  await expect(page.getByText(campaignQuestion, { exact: true })).toHaveCount(0);
  expect(events.filter((event) => event.name === 'campaign_entry_opened')).toHaveLength(0);
  expect(events.filter((event) => event.name === 'reading_started')).toHaveLength(1);
});
