import { expect, test } from '@playwright/test';

const mobileViewports = [
  { name: '320', width: 320, height: 568 },
  { name: '390', width: 390, height: 844 },
] as const;

for (const viewport of mobileViewports) {
  test(`手机 ${viewport.name}px 可明显刷新到最新版本且保留本地数据`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/?q=%E6%88%91%E8%A6%81%E4%B8%8D%E8%A6%81%E6%8D%A2%E5%B7%A5%E4%BD%9C%EF%BC%9F&topic=work');
    await page.evaluate(() => localStorage.setItem('miaotarot:refresh-e2e', 'preserved'));

    const refreshButton = page.getByRole('button', { name: '刷新到最新版本' });
    await expect(refreshButton).toBeVisible();
    await expect(page.locator('.heroUtilityArea')).toHaveScreenshot(`mobile-refresh-entry-${viewport.name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);

    await page.getByRole('button', { name: '和猫猫聊一下' }).click();
    await page.getByRole('textbox', { name: '你的问题' }).fill('我要不要换工作？');
    await page.getByRole('button', { name: '带着问题去洗牌' }).click();
    const restartButton = page.locator('.mobileReadingChrome').getByRole('button', { name: '换问题重来' });
    await expect(restartButton).toBeVisible();
    await expect(page.locator('.mobileReadingChrome')).toHaveScreenshot(`mobile-reading-restart-${viewport.name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });
    await restartButton.click();
    await expect(page.getByRole('heading', { name: '这次想看清什么？' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '你的问题' })).toBeFocused();
    await expect(page.getByRole('textbox', { name: '你的问题' })).toHaveValue('我要不要换工作？');
    await page.waitForTimeout(500);
    await expect(page.locator('.cutPileButton')).toHaveCount(0);
    await page.getByRole('button', { name: '关闭抽牌' }).click();

    const refreshRequestPromise = page.waitForRequest((request) => {
      if (!request.isNavigationRequest()) return false;
      return new URL(request.url()).searchParams.has('_mt_refresh');
    });
    const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await refreshButton.click();
    const [refreshRequest] = await Promise.all([refreshRequestPromise, navigationPromise]);
    const requestedUrl = new URL(refreshRequest.url());
    expect(requestedUrl.searchParams.get('q')).toBe('我要不要换工作？');
    expect(requestedUrl.searchParams.get('topic')).toBe('work');
    expect(requestedUrl.searchParams.get('_mt_refresh')).toBeTruthy();

    await expect.poll(() => new URL(page.url()).searchParams.has('_mt_refresh')).toBe(false);
    const finalUrl = new URL(page.url());
    expect(finalUrl.searchParams.get('q')).toBe('我要不要换工作？');
    expect(finalUrl.searchParams.get('topic')).toBe('work');
    expect(await page.evaluate(() => localStorage.getItem('miaotarot:refresh-e2e'))).toBe('preserved');
  });
}

test('桌面导航提供刷新页面入口', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '刷新到最新版本' })).toBeVisible();
});
