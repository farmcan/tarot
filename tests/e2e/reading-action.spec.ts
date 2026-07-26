import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';

const ACTION_STORAGE_KEY = 'miaotarot:reading-actions:v1';
const HISTORY_STORAGE_KEY = 'miaotarot:reading-history:v1';

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

async function installDeterministicBrowserState(page: Page) {
  await page.addInitScript(() => {
    Math.random = () => 0.42;
    let uuidCounter = 0;
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => {
        uuidCounter += 1;
        return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`;
      },
    });
    const copiedLinks: string[] = [];
    Object.defineProperty(window, '__copiedReadingLinks', {
      configurable: true,
      value: copiedLinks,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          copiedLinks.push(value);
        },
      },
    });
  });
}

async function completeDefaultSingleReading(page: Page, question: string) {
  await page.goto('/');
  await page.getByRole('button', { name: /和猫猫聊一下|开始抽牌/ }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(question);
  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  await page.locator('.flipCardButton').click();
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
  await expect(page.getByTestId('completion-bridge')).toBeVisible();
}

async function openActionEditorInControl(control: Locator) {
  await expect(control).toBeVisible();
  const rememberButton = control.getByRole('button', { name: '记住这一步' });
  if (await rememberButton.count()) {
    await rememberButton.click();
  } else {
    const candidate = control.locator('.readingActionCandidates').getByRole('button').first();
    await expect(candidate).toBeVisible();
    await candidate.click();
  }
  const editor = control.getByTestId('reading-action-editor');
  await expect(editor).toBeVisible();
  return { control, editor };
}

async function openActionEditor(page: Page) {
  const control = page.getByTestId('completion-bridge').getByTestId('reading-action-control');
  return openActionEditorInControl(control);
}

async function saveCustomActionInControl(control: Locator, action: string) {
  const { editor } = await openActionEditorInControl(control);
  const input = editor.getByRole('textbox', { name: '你想带走哪一步？' });
  await expect(input).not.toHaveValue('');
  await input.fill('');
  await expect(editor.getByRole('button', { name: '保存这一步' })).toBeDisabled();
  await input.fill(action);
  await editor.getByRole('button', { name: '保存这一步' }).click();
  await expect(control).toContainText('已记住');
  await expect(control).toContainText(action);
  return control;
}

async function saveCustomAction(page: Page, action: string) {
  const control = page.getByTestId('completion-bridge').getByTestId('reading-action-control');
  return saveCustomActionInControl(control, action);
}

async function makeSavedActionDue(page: Page, hoursAgo = 30) {
  await page.evaluate(({ key, hours }) => {
    const stored = JSON.parse(localStorage.getItem(key) || 'null') as {
      entries?: Array<{
        savedAt?: string;
        lastPresentedLocalDate?: string;
      }>;
    } | null;
    const entry = stored?.entries?.[0];
    if (!entry) throw new Error('Expected a saved reading action');
    entry.savedAt = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    delete entry.lastPresentedLocalDate;
    localStorage.setItem(key, JSON.stringify(stored));
  }, { key: ACTION_STORAGE_KEY, hours: hoursAgo });
}

async function expectTouchSizedButtons(page: Page, selector: string) {
  const heights = await page.locator(selector).getByRole('button').evaluateAll((buttons) => (
    buttons
      .filter((button) => button.getBoundingClientRect().height > 0)
      .map((button) => button.getBoundingClientRect().height)
  ));
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
}

async function createMobileReceiver(browser: Browser, width: number, height: number) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.route('**/api/product-event', async (route) => {
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: '{"accepted":true}',
    });
  });
  return { context, page };
}

test('390px 保存一步、私密分享、次日回看与回答形成完整闭环', async ({ browser, page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installDeterministicBrowserState(page);
  const events = await captureProductEvents(page);
  const question = '我该怎样更稳地处理下周的合作变化？';
  const privateAction = '明早先写下两个我能核实的合作条件';

  await completeDefaultSingleReading(page, question);
  const savedControl = await saveCustomAction(page, privateAction);
  await expect(page.locator('[data-testid="reading-action-control"]:visible')).toHaveCount(1);
  await expectTouchSizedButtons(page, '[data-testid="completion-bridge"]');
  await expect(savedControl).toHaveScreenshot('mobile-reading-action-saved-390.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  const stored = await page.evaluate((key) => {
    const raw = localStorage.getItem(key) || '';
    return {
      raw,
      value: JSON.parse(raw) as {
        entries: Array<{ action: string; readingKey: string; outcome?: string }>;
      },
    };
  }, ACTION_STORAGE_KEY);
  expect(stored.value.entries).toHaveLength(1);
  expect(stored.value.entries[0].action).toBe(privateAction);
  expect(stored.value.entries[0].readingKey).toMatch(/^action-[a-f0-9]{16}$/);
  expect(stored.raw).not.toContain(question);
  await expect.poll(() => events.some((event) => (
    event.name === 'action_saved' && event.variant === 'edited'
  ))).toBe(true);

  await page.getByRole('button', { name: '分享这次阅读' }).click();
  const shareDrawer = page.getByRole('dialog', { name: '分享这次阅读' });
  await shareDrawer.getByRole('button', { name: '复制分享链接' }).click();
  const copiedUrl = await page.evaluate(() => (
    (window as Window & { __copiedReadingLinks: string[] }).__copiedReadingLinks.at(-1) || ''
  ));
  expect(copiedUrl).not.toContain(encodeURIComponent(privateAction));
  expect(new URL(copiedUrl).searchParams.has('action')).toBe(false);

  const receiver = await createMobileReceiver(browser, 390, 844);
  try {
    await receiver.page.goto(copiedUrl);
    await expect(receiver.page.getByTestId('shared-reading-invitation')).toBeVisible();
    await expect(receiver.page.locator('[data-testid="reading-action-control"]:visible')).toHaveCount(0);
    await expect(receiver.page.getByTestId('reading-action-check-in')).toHaveCount(0);
    expect(await receiver.page.evaluate((key) => localStorage.getItem(key), ACTION_STORAGE_KEY)).toBeNull();
  } finally {
    await receiver.context.close();
  }

  await page.keyboard.press('Escape');
  await expect(shareDrawer).not.toBeVisible();
  await page.reload();
  const continueButton = page.getByRole('button', { name: '继续看刚才的结果' });
  await expect(continueButton).toBeVisible();
  await expect(page.locator('.readingDesk')).not.toBeVisible();
  await expect(page.getByTestId('reading-action-check-in')).toHaveCount(0);

  await makeSavedActionDue(page);
  await page.reload();
  await expect(continueButton).toBeVisible();
  const checkIn = page.getByTestId('reading-action-check-in');
  await expect(checkIn).toContainText(privateAction);
  await expect(checkIn).toContainText('后来怎么样？');
  await checkIn.scrollIntoViewIfNeeded();
  await expect(checkIn).toBeInViewport();
  await expectTouchSizedButtons(page, '[data-testid="reading-action-check-in"]');
  await expect.poll(() => events.some((event) => (
    event.name === 'action_review_shown' && event.variant === 'd1'
  ))).toBe(true);
  await expect(checkIn).toHaveScreenshot('mobile-reading-action-check-in-390.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await checkIn.getByRole('button', { name: '还在进行' }).click();
  await expect(checkIn).toContainText('它还在路上，不需要今天交卷');
  await expect(checkIn).toContainText('不用它判断牌准');
  await expect.poll(() => page.evaluate((key) => {
    const storedAction = JSON.parse(localStorage.getItem(key) || 'null') as {
      entries?: Array<{ outcome?: string }>;
    } | null;
    return storedAction?.entries?.[0]?.outcome;
  }, ACTION_STORAGE_KEY)).toBe('ongoing');
  await expect.poll(() => events.some((event) => (
    event.name === 'action_reviewed' && event.variant === 'ongoing'
  ))).toBe(true);

  for (const event of events.filter((event) => String(event.name).startsWith('action_'))) {
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain(privateAction);
    expect(serialized).not.toContain(question);
    expect(event).not.toHaveProperty('action');
  }

  await page.reload();
  await expect(page.getByTestId('reading-action-check-in')).toHaveCount(0);
});

test('320px 略过回看不会再次催促，并可从原阅读删除保存的一步', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await installDeterministicBrowserState(page);
  await captureProductEvents(page);
  const privateAction = '今晚只确认一条现实信息';

  await completeDefaultSingleReading(page, '我今天最该先确认什么？');
  const savedControl = await saveCustomAction(page, privateAction);
  await savedControl.scrollIntoViewIfNeeded();
  await expect(savedControl).toHaveScreenshot('mobile-reading-action-saved-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await makeSavedActionDue(page);
  await page.reload();
  const checkIn = page.getByTestId('reading-action-check-in');
  await checkIn.scrollIntoViewIfNeeded();
  await expect(checkIn).toBeInViewport();
  await expect(checkIn).toHaveScreenshot('mobile-reading-action-check-in-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await checkIn.getByRole('button', { name: '不再问这一步' }).click();
  await expect(checkIn).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('reading-action-check-in')).toHaveCount(0);
  await page.getByRole('button', { name: '继续看刚才的结果' }).click();
  const restoredControl = page.getByTestId('completion-bridge').getByTestId('reading-action-control');
  await expect(restoredControl).toContainText(privateAction);
  await restoredControl.getByRole('button', { name: '删除这一步' }).click();
  await expect(restoredControl).toContainText('确定删除这一步？');
  await restoredControl.getByRole('button', { name: '删除', exact: true }).click();
  await expect(restoredControl).toContainText(/记住这一步|先选一个更像你愿意试的方向/);
  await expect(restoredControl).not.toContainText(privateAction);
  await expect.poll(() => page.evaluate((key) => {
    const storedAction = JSON.parse(localStorage.getItem(key) || 'null') as {
      entries?: unknown[];
    } | null;
    return storedAction?.entries?.length ?? 0;
  }, ACTION_STORAGE_KEY)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
});

test('320px 今日一牌没有活动会话时也能在下一次访问回看', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await installDeterministicBrowserState(page);
  const events = await captureProductEvents(page);
  const privateAction = '午休前关掉一个不必要的通知';

  await page.goto('/');
  await page.getByRole('button', { name: '今日一牌' }).click();
  const result = page.locator('#reading-result');
  await expect(result).toBeVisible();
  const actionControl = result.getByTestId('reading-action-control');
  await saveCustomActionInControl(actionControl, privateAction);
  expect(await page.evaluate(() => localStorage.getItem('miaotarot:active-reading:v1'))).toBeNull();

  await page.reload();
  await expect(page.locator('.readingDesk')).not.toBeVisible();
  await expect(page.getByTestId('reading-action-check-in')).toHaveCount(0);
  await makeSavedActionDue(page);
  await page.reload();

  const checkIn = page.getByTestId('reading-action-check-in');
  await checkIn.scrollIntoViewIfNeeded();
  await expect(checkIn).toContainText(privateAction);
  await checkIn.getByRole('button', { name: '这步不适合' }).click();
  await expect(checkIn).toContainText('不适合的行动也可以放下');
  await checkIn.getByRole('button', { name: '看看今天的牌' }).click();
  await expect(page.locator('.readingDesk')).toBeVisible();
  await expect(page.locator('#reading-result').getByRole('heading', { name: /核心牌是/ })).toBeVisible();
  await expect.poll(() => events.some((event) => (
    event.name === 'daily_reading'
    && event.variant === 'single'
    && event.source === 'return-checkin'
  ))).toBe(true);
});

test('320px 浏览器拒绝本地保存时明确失败且不阻断完整结果', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await installDeterministicBrowserState(page);
  await page.addInitScript((key) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(storageKey: string, value: string) {
      if (storageKey === key) throw new DOMException('Storage blocked', 'QuotaExceededError');
      return originalSetItem.call(this, storageKey, value);
    };
  }, ACTION_STORAGE_KEY);
  const events = await captureProductEvents(page);

  await completeDefaultSingleReading(page, '保存失败时还能不能继续看结果？');
  const { editor } = await openActionEditor(page);
  await editor.getByRole('textbox', { name: '你想带走哪一步？' }).fill('先确认完整结果没有被挡住');
  await editor.getByRole('button', { name: '保存这一步' }).click();
  await expect(editor.getByRole('alert')).toContainText('这个浏览器没有允许保存');
  expect(await page.evaluate((key) => localStorage.getItem(key), ACTION_STORAGE_KEY)).toBeNull();
  expect(events.some((event) => event.name === 'action_saved')).toBe(false);

  await editor.getByRole('button', { name: '先不保存' }).click();
  await page.getByTestId('completion-primary-action').click();
  await expect(page.locator('#reading-result').getByRole('heading', { name: /核心牌是/ })).toBeVisible();
  await expect(page.locator('.mobileReadingRestart')).toBeVisible();
});

test('桌面清空历史会同时删除保存的小动作', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 900 });
  await installDeterministicBrowserState(page);
  await captureProductEvents(page);

  await completeDefaultSingleReading(page, '我想验证清空是否真的完整');
  await saveCustomAction(page, '只留下真正属于这次测试的一步');
  const history = page.locator('.historyPanel');
  await history.scrollIntoViewIfNeeded();
  await history.getByRole('button', { name: '清空', exact: true }).click();
  await expect(history).toContainText('会清空列表和保存的小动作');
  await history.getByRole('button', { name: '确认清空' }).click();

  await expect(history.getByText('0 次')).toBeVisible();
  await expect.poll(() => page.evaluate(({ actionKey, historyKey }) => {
    const storedHistory = JSON.parse(localStorage.getItem(historyKey) || 'null') as {
      entries?: unknown[];
    } | null;
    return {
      action: localStorage.getItem(actionKey),
      historyCount: storedHistory?.entries?.length ?? -1,
    };
  }, { actionKey: ACTION_STORAGE_KEY, historyKey: HISTORY_STORAGE_KEY })).toEqual({
    action: null,
    historyCount: 0,
  });
});
