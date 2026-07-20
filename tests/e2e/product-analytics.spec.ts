import { expect, test } from '@playwright/test';

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
