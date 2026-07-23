import { expect, test } from '@playwright/test';

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
  const events: Array<Record<string, unknown>> = [];

  await page.route('**/api/product-event', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    events.push(body);
    await route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' });
  });

  await page.goto('/');
  await expect.poll(() => events.length).toBe(2);
  expect(events.map((event) => event.name).sort()).toEqual(['app_opened', 'session_started']);
  for (const event of events) {
    expect(event.anonymousId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(event.sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(event.source).toBe('direct');
    expect(event.trafficType).toBe('external');
    expect(event).not.toHaveProperty('question');
    expect(event).not.toHaveProperty('referrer');
    expect(event).not.toHaveProperty('ip');
    expect(event).not.toHaveProperty('mac');
  }

  await page.reload();
  await page.waitForTimeout(150);
  expect(events).toHaveLength(2);

  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect.poll(() => events.length).toBe(3);
  expect(events[2].name).toBe('session_started');
});
