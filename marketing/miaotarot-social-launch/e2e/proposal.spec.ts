import { expect, test } from '@playwright/test';

test('移动端完整展示营销策略、五张真实分镜与最终脚本', async ({ page }) => {
  await page.goto('/proposal.html');

  await expect(page).toHaveTitle('MiaoTarot 营销视频提案 · 两秒选一张猫');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('先让观众选一张猫');
  await expect(page.getByRole('heading', { name: '不是录屏，是直接渲染成片。' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '五个节拍，20.1 秒。' })).toBeVisible();

  const shots = page.locator('.shot');
  await expect(shots).toHaveCount(5);
  await expect(page.locator('.rendered-frame')).toHaveCount(5);
  expect(await page.locator('.rendered-frame').evaluateAll((images) => (
    images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 1080 && image.naturalHeight === 1920)
  ))).toBe(true);

  const video = page.locator('video');
  await expect(video).toHaveCount(1);
  await expect.poll(async () => video.evaluate((element) => {
    const media = element as HTMLVideoElement;
    return media.readyState >= 1;
  })).toBe(true);
  const videoMetadata = await video.evaluate((element) => {
    const media = element as HTMLVideoElement;
    return { width: media.videoWidth, height: media.videoHeight, duration: media.duration };
  });
  expect(videoMetadata.width).toBe(1080);
  expect(videoMetadata.height).toBe(1920);
  expect(videoMetadata.duration).toBeGreaterThanOrEqual(20.05);
  expect(videoMetadata.duration).toBeLessThanOrEqual(20.2);

  await expect(page.getByText('魔术师说：办法不是没有，是还没伸爪。', { exact: true })).toBeVisible();
  await expect(page.getByText('打开 MiaoTarot，让猫陪你换个角度看问题。')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('窄屏保持无横向页面溢出，并让分镜使用可触摸横滑区', async ({ page }) => {
  await page.goto('/proposal.html#storyboard');

  const storyGrid = page.locator('.story-grid');
  await expect(storyGrid).toBeVisible();
  const layout = await storyGrid.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflowX: style.overflowX,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      viewportOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(layout.overflowX).toBe('auto');
  expect(layout.scrollWidth).toBeGreaterThan(layout.clientWidth);
  expect(layout.viewportOverflow).toBeLessThanOrEqual(1);
  await expect(page.locator('.shot').first()).toBeVisible();
});
