import { expect, test } from '@playwright/test';
import path from 'node:path';

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test.describe(`mini tool ${viewport.width}`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test('finishes without external APIs, keeps the selected card, and restores it', async ({ page }) => {
      const failures: string[] = [];
      const requests: string[] = [];
      page.on('pageerror', (error) => failures.push(error.message));
      page.on('request', (request) => requests.push(request.url()));
      // Exercise the Chrome 61 fallback initializers even on modern Playwright.
      await page.addInitScript(() => {
        Reflect.deleteProperty(Object, 'fromEntries');
        Reflect.deleteProperty(Array.prototype, 'flatMap');
      });
      await page.goto('/minitool.html');
      await expect(page.getByRole('heading', { name: '今天，想让猫陪你看什么？' })).toBeVisible();
      await page.screenshot({ path: path.resolve(`artifacts/minitool-pilot/entry-${viewport.width}.png`), fullPage: true });
      await page.getByRole('button', { name: '☀ 今日猫牌 先看见今天的自己' }).tap();
      await expect(page.getByRole('heading', { name: '凭此刻的感觉，选一张。' })).toBeVisible();
      await page.getByRole('button', { name: '选择第 2 张猫牌', exact: true }).tap();
      await expect(page.getByRole('button', { name: '翻开我的猫牌' })).toBeVisible();
      await page.getByRole('button', { name: '翻开我的猫牌' }).tap();
      await expect(page.getByRole('heading', { name: '今天，可以先做这一小步' })).toBeVisible();
      const cardName = await page.locator('.card-face strong').innerText();
      const cardImage = page.locator('.card-face img');
      await expect(cardImage).toHaveJSProperty('naturalWidth', 510);
      const bounds = await page.locator('.card-face').boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(270);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const labels = await page.locator('.card-face figcaption').boundingBox();
      expect(labels!.x).toBeGreaterThanOrEqual(bounds!.x);
      expect(labels!.x + labels!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
      await page.screenshot({ path: path.resolve(`artifacts/minitool-pilot/result-${viewport.width}.png`), fullPage: true });
      await page.goBack();
      await expect(page.getByRole('button', { name: '翻开我的猫牌' })).toBeVisible();
      await page.getByRole('button', { name: '翻开我的猫牌' }).tap();
      await expect(page.locator('.card-face strong')).toHaveText(cardName);
      await page.getByRole('button', { name: '把这张猫牌带走' }).tap();
      await expect(page.getByRole('img', { name: '猫咪状态卡分享图片预览' })).toBeVisible();
      const posterUrl = await page.getByRole('img', { name: '猫咪状态卡分享图片预览' }).getAttribute('src');
      expect(Buffer.from(posterUrl!.split(',')[1], 'base64').byteLength).toBeLessThanOrEqual(1024 * 1024);
      if (await page.locator('script[type="module"]').count() === 0) {
        await expect(page.getByRole('button', { name: '保存图片', exact: true })).toHaveCount(0);
        await expect(page.getByText('请在支持保存图片的小红书 App 小工具中打开，结果仍可在这里阅读。')).toBeVisible();
      } else await expect(page.getByRole('button', { name: '保存图片', exact: true })).toBeVisible();
      await page.screenshot({ path: path.resolve(`artifacts/minitool-pilot/poster-${viewport.width}.png`), fullPage: true });
      await page.reload();
      await page.getByRole('button', { name: '回看上次的猫牌' }).tap();
      await expect(page.locator('.card-face strong')).toHaveText(cardName);
      expect(requests.filter((url) => /^https?:/.test(url) && (!url.startsWith('http://127.0.0.1:') || url.includes('/api/')))).toEqual([]);
      expect(failures).toEqual([]);
    });
  });
}

test('native publishing cancellation and denied persistence retain a private result', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const target = window as typeof window & { xhs?: unknown; __nativeCalls: Array<{ action: string; options: unknown }> };
    target.__nativeCalls = [];
    target.xhs = {
      launchOptions: { miniToolEnv: { buildVersion: 9510001 } },
      miniTool: {
        getWindowInfo: async () => ({ windowHeight: 844, safeArea: { top: 24, bottom: 810 }, menuButtons: { back: null, me: null, share: { top: 28, bottom: 64 } } }),
        getStorage: async () => ({ data: null }),
        setStorage: async () => { throw { errMsg: 'setStorage:fail unavailable' }; },
        writeTempFile: async (options: unknown) => {
          target.__nativeCalls.push({ action: 'write', options });
          return { filePath: 'xhsfile://poster.png', errMsg: 'writeTempFile:ok' };
        },
        saveImageToPhotosAlbum: async (options: unknown) => {
          target.__nativeCalls.push({ action: 'save', options });
          return { errMsg: 'saveImageToPhotosAlbum:ok' };
        },
        postNote: async (options: unknown) => {
          target.__nativeCalls.push({ action: 'post', options });
          throw { errMsg: 'postNote:fail user cancel' };
        },
      },
    };
  });
  await page.goto('/minitool.html');
  await expect(page.locator('#minitool')).toHaveCSS('padding-top', '86px');
  await page.getByRole('button', { name: '♡ 关系卡住了 看清自己的需要与边界' }).click();
  await page.getByLabel('也可以写下来（可跳过）').fill('这是不该进入图片或笔记的私密测试问题');
  await page.getByRole('button', { name: '选一张猫牌', exact: true }).click();
  await page.getByRole('button', { name: '选择第 1 张猫牌', exact: true }).click();
  await page.getByRole('button', { name: '翻开我的猫牌' }).click();
  await expect(page.getByRole('status')).toContainText('未能保存');
  const card = await page.locator('.card-face strong').innerText();
  await page.getByRole('button', { name: '把这张猫牌带走' }).click();
  await page.getByRole('button', { name: '保存图片', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已保存到相册。');
  await page.getByRole('button', { name: '带着图片发小红书' }).click();
  await expect(page.getByRole('status')).toHaveText('已取消，结果仍保留在这里。');
  const calls = await page.evaluate(() => (window as typeof window & { __nativeCalls: unknown[] }).__nativeCalls);
  expect(JSON.stringify(calls)).not.toContain('私密测试问题');
  expect(JSON.stringify(calls)).toContain('photo_publish');
  await page.getByRole('button', { name: '回到这次结果' }).click();
  await expect(page.locator('.card-face strong')).toHaveText(card);
});

test('browser back across two readings restores the matching poster', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    let seed = 217;
    Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  });
  await page.goto('/minitool.html');
  await page.getByRole('button', { name: '♡ 关系卡住了 看清自己的需要与边界' }).click();
  await page.getByRole('button', { name: '选一张猫牌', exact: true }).click();
  await page.getByRole('button', { name: '选择第 1 张猫牌', exact: true }).click();
  await page.getByRole('button', { name: '翻开我的猫牌' }).click();
  const firstCard = await page.locator('.card-face strong').innerText();
  await page.getByRole('button', { name: '把这张猫牌带走' }).click();
  const firstPoster = await page.getByRole('img', { name: '猫咪状态卡分享图片预览' }).getAttribute('src');
  await page.getByRole('button', { name: '回到这次结果' }).click();
  await page.getByRole('button', { name: '换个问题再看' }).click();
  await page.getByRole('button', { name: '☀ 今日猫牌 先看见今天的自己' }).click();
  await page.getByRole('button', { name: '选择第 2 张猫牌', exact: true }).click();
  await page.getByRole('button', { name: '翻开我的猫牌' }).click();
  expect(await page.locator('.card-face strong').innerText()).not.toBe(firstCard);
  await page.getByRole('button', { name: '把这张猫牌带走' }).click();
  for (let index = 0; index < 6; index += 1) await page.goBack();
  await expect(page.getByRole('img', { name: '猫咪状态卡分享图片预览' })).toHaveAttribute('src', firstPoster!);
  await page.getByRole('button', { name: '回到这次结果' }).click();
  await expect(page.locator('.card-face strong')).toHaveText(firstCard);
  await expect(page.getByRole('button', { name: '删除保存的结果' })).toBeVisible();
  await page.getByRole('button', { name: '删除保存的结果' }).click();
  await expect(page.getByRole('button', { name: '删除保存的结果' })).toHaveCount(0);
});
