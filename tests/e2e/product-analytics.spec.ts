import { expect, test, type Page } from '@playwright/test';

type ProductEvent = Record<string, unknown>;

async function captureProductEvents(page: Page) {
  const events: ProductEvent[] = [];
  await page.route('**/api/product-event', async (route) => {
    events.push(route.request().postDataJSON() as ProductEvent);
    await route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' });
  });
  return events;
}

async function revealHomeActions(page: Page) {
  const primary = page.getByRole('button', { name: /和猫猫聊一下|继续看刚才的结果|继续刚才的抽牌/ });
  const daily = page.getByRole('button', { name: '今日一牌' });
  await primary.scrollIntoViewIfNeeded();
  await daily.scrollIntoViewIfNeeded();
  return { primary, daily };
}

test('390px 手机加载唯一 Web Analytics beacon，脚本不可用时仍可完成今日一牌', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let beaconRequests = 0;

  await page.route('https://static.cloudflareinsights.com/**', async (route) => {
    beaconRequests += 1;
    await route.abort('failed');
  });

  await page.goto('/');
  const beacon = page.locator('script[src="https://static.cloudflareinsights.com/beacon.min.js"]');
  await expect(beacon).toHaveCount(1);
  await expect(beacon).toHaveAttribute('type', 'module');
  const config = JSON.parse(await beacon.getAttribute('data-cf-beacon') || '{}');
  expect(config).toEqual({ token: '6533467eb422474fa5910918c76790fd' });
  expect(beaconRequests).toBe(1);

  await page.getByRole('button', { name: '今日一牌' }).click();
  await expect(page.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
});

test('390px 手机按天和标签页发送匿名活跃事件，不发送原始标识', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const events = await captureProductEvents(page);

  await page.goto('/');
  await revealHomeActions(page);
  await expect.poll(() => events.filter((event) => event.name === 'home_action_shown').length).toBe(2);
  expect(events.map((event) => event.name).sort()).toEqual([
    'app_opened',
    'home_action_shown',
    'home_action_shown',
    'session_started',
  ]);
  const presenceEvents = events.filter((event) => (
    event.name === 'app_opened' || event.name === 'session_started'
  ));
  for (const event of presenceEvents) {
    expect(event.anonymousId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(event.sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(event.source).toBe('direct');
    expect(event.trafficType).toBe('external');
    expect(event).not.toHaveProperty('question');
    expect(event).not.toHaveProperty('referrer');
    expect(event).not.toHaveProperty('ip');
    expect(event).not.toHaveProperty('mac');
  }
  expect(events.filter((event) => event.name === 'home_action_shown').map((event) => [
    event.variant,
    event.source,
  ])).toEqual(expect.arrayContaining([
    ['new-reading', 'hero-primary'],
    ['daily-reading', 'hero-daily'],
  ]));

  await page.reload();
  await revealHomeActions(page);
  await page.waitForTimeout(650);
  expect(events).toHaveLength(4);

  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await revealHomeActions(page);
  await expect.poll(() => events.length).toBe(7);
  expect(events.slice(4).map((event) => event.name).sort()).toEqual([
    'home_action_shown',
    'home_action_shown',
    'session_started',
  ]);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}px 首页首次行动可关联到同一次阅读的开始与完成`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const events = await captureProductEvents(page);
    const sensitiveQuestion = `唯一敏感问题 ${viewport.width}：我该不该公开这件事？`;

    await page.goto('/');
    const { primary } = await revealHomeActions(page);
    await expect.poll(() => events.some((event) => (
      event.name === 'home_action_shown'
      && event.variant === 'new-reading'
      && event.source === 'hero-primary'
    ))).toBe(true);

    await primary.click();
    await expect.poll(() => events.filter((event) => event.name === 'home_action_selected').length).toBe(1);
    expect(events.find((event) => event.name === 'home_action_selected')).toMatchObject({
      variant: 'new-reading',
      source: 'hero-primary',
    });
    expect(events.some((event) => event.name === 'reading_started')).toBe(false);

    await page.getByRole('textbox', { name: '你的问题' }).fill(sensitiveQuestion);
    const start = page.getByRole('button', { name: '带着问题去洗牌' });
    await start.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
    await expect.poll(() => events.filter((event) => event.name === 'reading_started').length).toBe(1);
    const started = events.find((event) => event.name === 'reading_started');
    expect(started).toMatchObject({
      variant: 'single',
      source: 'reading-normal',
    });
    expect(started?.readingId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(JSON.stringify(started)).not.toContain(sensitiveQuestion);
    expect(started).not.toHaveProperty('question');
    expect(started).not.toHaveProperty('cards');
    expect(started).not.toHaveProperty('referrer');

    await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
    await page.locator('.flipCardButton').click();
    await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
    await expect.poll(() => events.filter((event) => event.name === 'reading_completed').length).toBe(1);
    const completed = events.find((event) => event.name === 'reading_completed');
    expect(completed).toMatchObject({
      variant: 'single',
      source: 'reading-desk',
      readingId: started?.readingId,
    });

    await page.keyboard.press('Escape');
    const continueResult = page.getByRole('button', { name: '继续看刚才的结果' });
    await expect(continueResult).toBeVisible();
    await continueResult.scrollIntoViewIfNeeded();
    await expect.poll(() => events.some((event) => (
      event.name === 'home_action_shown' && event.variant === 'continue-result'
    ))).toBe(true);
    await continueResult.click();
    await page.waitForTimeout(150);
    expect(events.filter((event) => event.name === 'home_action_selected')).toHaveLength(1);
  });
}

test('320px 今日一牌使用独立分支且不上传抽到的牌', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const events = await captureProductEvents(page);
  await page.goto('/');
  const { daily } = await revealHomeActions(page);
  await expect.poll(() => events.some((event) => (
    event.name === 'home_action_shown' && event.variant === 'daily-reading'
  ))).toBe(true);

  await daily.click();
  await expect(page.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
  await expect.poll(() => events.some((event) => event.name === 'daily_reading')).toBe(true);
  const selected = events.find((event) => event.name === 'home_action_selected');
  const dailyReading = events.find((event) => event.name === 'daily_reading');
  const completed = events.find((event) => event.name === 'reading_completed');

  expect(selected).toMatchObject({ variant: 'daily-reading', source: 'hero-daily' });
  expect(dailyReading).toMatchObject({ variant: 'single', source: 'hero-daily' });
  expect(dailyReading?.readingId).toMatch(/^[0-9a-f-]{36}$/i);
  expect(completed).toMatchObject({
    variant: 'single',
    source: 'daily-card',
    readingId: dailyReading?.readingId,
  });
  expect(events.some((event) => event.name === 'reading_started')).toBe(false);
  for (const event of [selected, dailyReading, completed]) {
    expect(event).not.toHaveProperty('question');
    expect(event).not.toHaveProperty('card');
    expect(event).not.toHaveProperty('cardId');
    expect(event).not.toHaveProperty('cards');
    expect(event).not.toHaveProperty('orientation');
  }
});
