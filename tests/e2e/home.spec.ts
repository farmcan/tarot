import { expect, test, type Page } from '@playwright/test';

async function chooseOneCard(page: Page) {
  const singleCardRadio = page.getByRole('radio', { name: '1', exact: true });
  const radioId = await singleCardRadio.getAttribute('id');
  if (!radioId) throw new Error('Single-card control should have an associated label');
  await page.locator(`label[for="${radioId}"]`).click();
  await expect(page.getByRole('heading', { name: '今日猫运' })).toBeVisible();
}

async function startShuffle(page: Page) {
  await page.getByRole('button', { name: '开始洗猫' }).click();
  await expect(page.locator('.hiddenDeckCard').first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('首页讲清品牌承诺，并可交互认识塔罗', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('抽一张猫牌，听听此刻的自己。');
  await expect(page.getByText('把你现在的精神状态', { exact: false })).toHaveCount(0);
  await expect(page.getByText('塔罗从 15 世纪欧洲的纸牌游戏走来', { exact: false })).toBeVisible();
  const desktopHeroImage = page.locator('.heroBackdropVisual');
  await expect(desktopHeroImage).toBeVisible();
  expect(await desktopHeroImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

  await expect(page.getByRole('tab', { name: '78 张怎么组成' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '大阿卡纳' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '小阿卡纳' })).toBeVisible();
  await expect(page.getByText('权杖', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: '从哪来' }).click();
  await expect(page.getByText('15 世纪 · 北意大利纸牌')).toBeVisible();
  await expect(page.getByRole('link', { name: /大都会艺术博物馆/ })).toHaveAttribute('href', /metmuseum\.org/);

  await page.getByRole('tab', { name: '一张牌怎么读' }).click();
  await expect(page.getByRole('heading', { name: '先看牌面' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '再看方向' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '最后看位置' })).toBeVisible();
});

test('标准 78 张内容包可以完成单张选牌与翻牌', async ({ page }) => {
  await chooseOneCard(page);
  await startShuffle(page);

  const hiddenCards = page.getByRole('button', { name: /背面猫牌/ });
  await expect(hiddenCards).toHaveCount(78);
  await hiddenCards.first().click();
  await page.getByRole('button', { name: '把猫牌放上桌' }).click();
  await page.getByRole('button', { name: /点击翻牌/ }).click();

  await expect(page.getByText('猫猫已经把话说完了', { exact: false })).toBeVisible();
  await expect(page.locator('#reading-result')).toBeVisible();
  await expect(page.getByRole('heading', { name: /你今天是：/ })).toBeVisible();
});

test('经典内容包严格使用 22 张牌', async ({ page }) => {
  await chooseOneCard(page);
  await page.getByRole('combobox', { name: '选择内容包' }).click();
  await page.getByRole('option', { name: '经典 22 张' }).click();
  await startShuffle(page);
  await expect(page.getByRole('button', { name: /背面猫牌/ })).toHaveCount(22);
});

test('移动端标题下方图片真实可见且页面不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();

  const heroImage = page.getByRole('img', { name: '披着紫色斗篷的猫坐在三张猫猫塔罗牌后' });
  await expect(heroImage).toBeVisible();
  await expect(heroImage).toHaveJSProperty('complete', true);
  expect(await heroImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: '开始抽猫牌' })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});
