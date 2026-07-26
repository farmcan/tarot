import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from '@playwright/test';

const SHARE_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function createMobilePage(
  browser: Browser,
  viewport: { width: number; height: number },
) {
  const context = await browser.newContext({
    viewport,
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  return { context, page };
}

async function installShareCapture(page: Page) {
  await page.addInitScript(() => {
    const captured = {
      copied: [] as string[],
      shared: [] as Array<{ title?: string; text?: string; url?: string }>,
    };
    Object.defineProperty(window, '__shareCapture', {
      configurable: true,
      value: captured,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        captured.shared.push({
          title: data.title,
          text: data.text,
          url: data.url,
        });
      },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          captured.copied.push(value);
        },
      },
    });
  });
}

async function captureProductEvents(page: Page) {
  const events: Array<Record<string, unknown>> = [];
  await page.route('**/api/product-event', async (route) => {
    events.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: '{"accepted":true}',
    });
  });
  return events;
}

async function completeDefaultSingleReading(page: Page, question: string) {
  await page.getByRole('button', { name: '和猫猫聊一下' }).tap();
  await page.getByRole('textbox', { name: '你的问题' }).fill(question);
  await page.getByRole('button', { name: '带着问题去洗牌' }).tap();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).tap();
  const flipCard = page.locator('.flipCardButton');
  await expect(flipCard).toHaveCount(1);
  await flipCard.tap();
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
}

async function openShareDrawer(page: Page) {
  const shareButton = page.getByRole('button', { name: '分享这次阅读' });
  await expect(shareButton).toBeEnabled();
  await shareButton.tap();
  const drawer = page.getByRole('dialog', { name: '分享这次阅读' });
  await expect(drawer).toBeVisible();
  return drawer;
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBeLessThanOrEqual(1);
  const desk = page.locator('.readingDesk');
  expect(await desk.evaluate((element) => element.scrollWidth - element.clientWidth))
    .toBeLessThanOrEqual(1);
}

async function expectButtonsAreTouchSized(scope: Locator) {
  const heights = await scope.getByRole('button').evaluateAll((buttons) => (
    buttons.map((button) => button.getBoundingClientRect().height)
  ));
  for (const height of heights) {
    expect(height).toBeGreaterThanOrEqual(44);
  }
}

async function closeContexts(...contexts: BrowserContext[]) {
  await Promise.all(contexts.map((context) => context.close()));
}

test('390px 默认私密分享可从独立接收者完成再抽与匿名归因', async ({ browser }) => {
  const sensitiveQuestion = '唯一敏感问题：我要不要接受那份尚未公开的工作？';
  const recipientQuestion = '接下来一周我最该先处理哪件自己的事？';
  const sender = await createMobilePage(browser, { width: 390, height: 844 });
  const receiver = await createMobilePage(browser, { width: 390, height: 844 });

  try {
    await installShareCapture(sender.page);
    const senderEvents = await captureProductEvents(sender.page);
    await sender.page.addInitScript(() => {
      Math.random = () => 0.42;
    });
    await sender.page.goto('/');
    await completeDefaultSingleReading(sender.page, sensitiveQuestion);

    const drawer = await openShareDrawer(sender.page);
    const questionConsent = drawer.getByRole('switch', { name: '把我的问题一起分享' });
    await expect(questionConsent).not.toBeChecked();
    await expect(drawer).toContainText('默认不会带出你的问题或对话');
    await expect(drawer.locator('.sharePosterQuestion')).toHaveCount(0);

    await drawer.getByRole('button', { name: '复制分享链接' }).tap();
    const copiedUrl = await sender.page.evaluate(() => (
      (window as Window & {
        __shareCapture: { copied: string[] };
      }).__shareCapture.copied.at(-1) || ''
    ));
    const copied = new URL(copiedUrl);
    expect(copied.searchParams.get('q')).toBeNull();
    expect(copied.searchParams.get('src')).toBe('share');
    expect(copied.searchParams.get('st')).toMatch(SHARE_TOKEN_PATTERN);

    await drawer.getByRole('button', { name: '分享结果' }).tap();
    const payload = await sender.page.evaluate(() => (
      (window as Window & {
        __shareCapture: { shared: Array<{ text?: string; url?: string }> };
      }).__shareCapture.shared.at(-1)
    ));
    expect(payload?.url).toBe(copiedUrl);
    expect(payload?.text).not.toContain(sensitiveQuestion);
    await expect.poll(() => senderEvents.filter((event) => event.name === 'share_result').length)
      .toBeGreaterThanOrEqual(2);
    const senderShareEvents = senderEvents.filter((event) => event.name === 'share_result');
    for (const event of senderShareEvents) {
      expect(event.shareToken).toBe(copied.searchParams.get('st'));
      expect(event).not.toHaveProperty('question');
      expect(event).not.toHaveProperty('cards');
    }

    const receiverEvents = await captureProductEvents(receiver.page);
    await receiver.page.goto(copiedUrl);
    const invitation = receiver.page.getByTestId('shared-reading-invitation');
    await expect(invitation).toBeInViewport();
    await expect(invitation).toContainText('TA 没有公开原问题');
    await expect(invitation).not.toContainText(sensitiveQuestion);
    await expect(invitation.getByRole('button', { name: '我也抽一张' })).toBeVisible();
    await expect(receiver.page.locator('.historyPanel').getByText('0 次')).toHaveText('0 次');
    await expect.poll(() => receiverEvents.some((event) => event.name === 'share_landed')).toBe(true);
    const landingEvent = receiverEvents.find((event) => event.name === 'share_landed');
    expect(landingEvent?.shareToken).toBe(copied.searchParams.get('st'));
    expect(landingEvent?.anonymousId).not.toBe(senderShareEvents.at(-1)?.anonymousId);
    await expectButtonsAreTouchSized(invitation);
    await expectNoHorizontalOverflow(receiver.page);
    await expect(receiver.page).toHaveScreenshot('mobile-shared-landing-private-390.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });

    await invitation.getByRole('button', { name: '我也抽一张' }).tap();
    const questionInput = receiver.page.getByRole('textbox', { name: '你的问题' });
    await expect(questionInput).toBeFocused();
    await expect(questionInput).toHaveValue('');
    expect(new URL(receiver.page.url()).searchParams.get('cards')).toBeNull();
    await expect.poll(() => receiverEvents.some((event) => event.name === 'share_remix_started')).toBe(true);

    await questionInput.fill(recipientQuestion);
    await receiver.page.getByRole('button', { name: '带着问题去洗牌' }).tap();
    await receiver.page.getByRole('button', { name: '不想挑，直接发牌' }).tap();
    await receiver.page.locator('.flipCardButton').tap();
    await expect(receiver.page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
    await expect.poll(() => receiverEvents.some((event) => event.name === 'reading_completed')).toBe(true);
    const referralEvents = receiverEvents.filter((event) => (
      event.name === 'share_remix_started' || event.name === 'reading_completed'
    ));
    for (const event of referralEvents) {
      expect(event.shareToken).toBe(copied.searchParams.get('st'));
      expect(event).not.toHaveProperty('question');
    }
  } finally {
    await closeContexts(sender.context, receiver.context);
  }
});

test('320px 只有明确同意后才分享问题，接收者可选择同题重抽', async ({ browser }) => {
  const sharedQuestion = '我是否要在月底前主动结束这段合作？';
  const sender = await createMobilePage(browser, { width: 320, height: 568 });
  const receiver = await createMobilePage(browser, { width: 320, height: 568 });

  try {
    await installShareCapture(sender.page);
    await captureProductEvents(sender.page);
    await sender.page.addInitScript(() => {
      Math.random = () => 0.42;
    });
    await sender.page.goto('/');
    await completeDefaultSingleReading(sender.page, sharedQuestion);

    const drawer = await openShareDrawer(sender.page);
    const consent = drawer.getByRole('switch', { name: '把我的问题一起分享' });
    await consent.tap();
    await expect(consent).toBeChecked();
    await expect(drawer).toContainText(`朋友会看到：${sharedQuestion}`);
    await expect(drawer.locator('.sharePosterQuestion')).toHaveText(/我问的是.*我是否要在月底前主动结束这段合作？/);
    const qr = drawer.locator('.shareQr');
    const generateImage = drawer.getByRole('button', { name: '生成分享图' });
    await expect(qr.locator('img')).toBeVisible();
    const questionQrSource = await qr.locator('img').getAttribute('src');

    await generateImage.tap();
    await expect(drawer.getByText('正在生成分享图，请稍候。')).toBeVisible();
    await consent.tap();
    await expect(consent).not.toBeChecked();
    await expect(drawer.locator('.sharePosterQuestion')).toHaveCount(0);
    const qrImmediatelyAfterPrivacyChange = await qr.evaluate((element) => ({
      status: element.getAttribute('data-status'),
      imageSource: element.querySelector('img')?.getAttribute('src') || '',
    }));
    expect(qrImmediatelyAfterPrivacyChange.imageSource).not.toBe(questionQrSource);
    if (qrImmediatelyAfterPrivacyChange.status === 'loading') {
      await expect(drawer.getByRole('button', { name: '正在准备二维码' })).toBeDisabled();
    }
    await sender.page.waitForTimeout(1_000);
    await expect(drawer.getByRole('img', { name: 'MiaoTarot 分享图预览' })).toHaveCount(0);
    await expect(drawer.getByText('完整分享图已生成；内容较长时，图片会自动向下延展。')).toHaveCount(0);
    await expect(qr.locator('img')).toBeVisible();
    await expect(qr.locator('img')).not.toHaveAttribute('src', questionQrSource || '');
    await expect(generateImage).toBeEnabled();
    await generateImage.tap();
    await expect(drawer.getByRole('img', { name: 'MiaoTarot 分享图预览' })).toBeVisible();

    await consent.tap();
    await expect(consent).toBeChecked();
    await expect(drawer.locator('.sharePosterQuestion')).toContainText(sharedQuestion);
    await expect(qr.locator('img')).toBeVisible();
    await drawer.getByRole('button', { name: '分享结果' }).tap();

    const payload = await sender.page.evaluate(() => (
      (window as Window & {
        __shareCapture: { shared: Array<{ text?: string; url?: string }> };
      }).__shareCapture.shared.at(-1)
    ));
    expect(payload?.text).toContain(sharedQuestion);
    const sharedUrl = new URL(payload?.url || '');
    expect(sharedUrl.searchParams.get('q')).toBe(sharedQuestion);
    expect(sharedUrl.searchParams.get('st')).toMatch(SHARE_TOKEN_PATTERN);

    await captureProductEvents(receiver.page);
    await receiver.page.goto(sharedUrl.href);
    const invitation = receiver.page.getByTestId('shared-reading-invitation');
    await expect(invitation).toBeInViewport();
    await expect(invitation).toContainText(sharedQuestion);
    await expect(invitation.getByRole('button', { name: '我也抽同一道题' })).toBeVisible();
    await expect(invitation.getByRole('button', { name: '换一个自己的问题' })).toBeVisible();
    await expectButtonsAreTouchSized(invitation);
    await expectNoHorizontalOverflow(receiver.page);
    await expect(receiver.page).toHaveScreenshot('mobile-shared-landing-question-320.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });

    await invitation.getByRole('button', { name: '我也抽同一道题' }).tap();
    const questionInput = receiver.page.getByRole('textbox', { name: '你的问题' });
    await expect(questionInput).toHaveValue(sharedQuestion);
    await expect(questionInput).toBeFocused();
    expect(new URL(receiver.page.url()).searchParams.get('q')).toBeNull();
    await expectNoHorizontalOverflow(receiver.page);
  } finally {
    await closeContexts(sender.context, receiver.context);
  }
});

test('旧版无 token 分享链接仍可开始自己的阅读', async ({ browser }) => {
  const legacy = await createMobilePage(browser, { width: 390, height: 844 });
  const legacyQuestion = '旧链接里的问题仍应由分享者明确看见。';

  try {
    const events = await captureProductEvents(legacy.page);
    const url = new URL('/?r=1&spread=single&cards=the-emperor.u&topic=others&pack=doodle-full', 'http://127.0.0.1:4174');
    url.searchParams.set('q', legacyQuestion);
    url.hash = 'reading-result';
    await legacy.page.goto(url.href);

    const invitation = legacy.page.getByTestId('shared-reading-invitation');
    await expect(invitation).toContainText(legacyQuestion);
    await invitation.getByRole('button', { name: '我也抽同一道题' }).tap();
    await expect(legacy.page.getByRole('textbox', { name: '你的问题' })).toHaveValue(legacyQuestion);
    await expect(legacy.page.getByRole('textbox', { name: '你的问题' })).toBeFocused();
    expect(events.some((event) => event.name === 'share_landed')).toBe(false);
    expect(events.some((event) => event.name === 'share_remix_started')).toBe(false);
  } finally {
    await legacy.context.close();
  }
});
