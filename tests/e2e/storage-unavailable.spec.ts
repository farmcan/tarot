import { expect, test } from '@playwright/test';

for (const width of [320, 390]) {
  test(`${width}px storage getters blocked and optional APIs offline still allow a basic reading`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() => {
      for (const name of ['localStorage', 'sessionStorage']) {
        Object.defineProperty(window, name, {
          configurable: true,
          get() { throw new DOMException('Storage blocked', 'SecurityError'); },
        });
      }
    });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => route.abort());
    await page.goto('/');
    await page.getByRole('button', { name: '和猫猫聊一下' }).click();
    await page.getByRole('textbox', { name: '你的问题' }).fill('今天可以先做哪一件小事？');
    await page.getByRole('button', { name: '带着问题去洗牌' }).click();
    await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
    await page.locator('.flipCardButton').click();
    await expect(page.locator('#reading-result')).toBeVisible();
    await expect(page.locator('#reading-result').getByRole('heading', { name: /核心牌是/ })).toBeVisible();
    await page.getByRole('button', { name: '分享这次阅读', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '分享这次阅读' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
