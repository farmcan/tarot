import { expect, test, type Page } from '@playwright/test';

async function chooseOneCard(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) <= 760) {
    await page.getByRole('button', { name: '和猫猫聊一下' }).click();
    const advancedToggle = page.getByRole('button', { name: /3 张牌 ·/ });
    await advancedToggle.click();
  }
  const singleCardRadio = page.getByRole('radio', { name: '1', exact: true });
  const radioId = await singleCardRadio.getAttribute('id');
  if (!radioId) throw new Error('Single-card control should have an associated label');
  await page.locator(`label[for="${radioId}"]`).click();
  await expect(singleCardRadio).toBeChecked();
  if ((page.viewportSize()?.width ?? 1280) <= 760) {
    await expect(page.getByRole('button', { name: /一张牌 ·/ })).toHaveAttribute('aria-expanded', 'true');
  }
}

async function startShuffle(page: Page) {
  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  await expect(page.locator('.hiddenDeckCard').first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('首页讲清品牌承诺，并可交互认识塔罗', async ({ page }) => {
  await expect(page.locator('.desktopHeroTitle')).toHaveText('抽一张猫咪塔罗，换个角度看清问题。');
  await expect(page.getByText('把你现在的精神状态', { exact: false })).toHaveCount(0);
  await expect(page.getByText('不预测命运。亲手抽一张猫咪塔罗', { exact: false })).toBeVisible();
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
  await page.getByRole('button', { name: '把 1 张猫牌放上桌' }).click();
  const flipCard = page.locator('.flipCardButton').first();
  await expect(flipCard).toHaveAttribute('aria-label', /点击翻牌/);
  await expect.poll(() => flipCard.evaluate((button) => {
    const image = button.querySelector<HTMLImageElement>('.interactiveCardBack img');
    const bounds = button.getBoundingClientRect();
    if (!image?.naturalWidth || !image.naturalHeight || !bounds.height) return Number.POSITIVE_INFINITY;
    return Math.abs(bounds.width / bounds.height - image.naturalWidth / image.naturalHeight);
  })).toBeLessThan(0.01);

  await flipCard.click();

  const frontImage = flipCard.locator('.interactiveCardFront img');
  await expect.poll(() => flipCard.evaluate((button) => {
    const image = button.querySelector<HTMLImageElement>('.interactiveCardFront img');
    const bounds = button.getBoundingClientRect();
    if (!image?.naturalWidth || !image.naturalHeight || !bounds.height) return Number.POSITIVE_INFINITY;
    return Math.abs(bounds.width / bounds.height - image.naturalWidth / image.naturalHeight);
  })).toBeLessThan(0.01);
  await expect(frontImage).toHaveCSS('object-fit', 'contain');
  await expect(page.getByText('展开简介与完整牌义')).toBeVisible();

  await expect(page.getByText('猫猫已经把话说完了', { exact: false })).toBeVisible();
  await expect(page.locator('#reading-result')).toBeVisible();
  await expect(page.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
});

test('经典内容包严格使用 22 张牌', async ({ page }) => {
  await chooseOneCard(page);
  await page.getByRole('combobox', { name: '这次用哪副牌' }).click();
  await page.getByRole('option', { name: '经典 22 张' }).click();
  await startShuffle(page);
  await expect(page.getByRole('button', { name: /背面猫牌/ })).toHaveCount(22);
});

test('移动端标题下方图片真实可见且页面不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();

  const heroImage = page.getByRole('img', { name: '安静观察问题的女祭司猫牌' });
  await expect(heroImage).toBeVisible();
  await expect(heroImage).toHaveJSProperty('complete', true);
  expect(await heroImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const opener = page.getByRole('button', { name: '和猫猫聊一下' });
  await expect(opener).toBeVisible();
  await opener.click();
  await expect(page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' })).toBeVisible();
  await expect(page.getByRole('button', { name: '关闭抽牌' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' })).toHaveCount(0);
  await expect(opener).toBeFocused();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('移动端问题不能为空，高级设置会准确反馈牌数', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();

  const advancedToggle = page.getByRole('button', { name: /3 张牌 ·/ });
  await expect(advancedToggle).toHaveAttribute('aria-expanded', 'false');
  await advancedToggle.click();
  await expect(advancedToggle).toHaveAttribute('aria-expanded', 'true');

  const question = page.getByRole('textbox', { name: '你的问题' });
  await question.fill('   ');
  await expect(page.getByText('先写下一件此刻最想看清的事。')).toBeVisible();
  await expect(page.getByRole('button', { name: '带着问题去洗牌' })).toBeDisabled();
  await question.fill('我下一步最值得推进什么？');
  await expect(page.getByRole('button', { name: '带着问题去洗牌' })).toBeEnabled();
});

test('移动端抽牌使用全屏工作台，牌堆本身不创建嵌套滚动层', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await chooseOneCard(page);
  await startShuffle(page);

  await expect(page.locator('.readingDesk')).toHaveCSS('position', 'fixed');
  const deckViewport = page.locator('.hiddenDeckViewport');
  await expect(deckViewport).toHaveCSS('overflow-y', 'visible');
  await expect(deckViewport).toHaveCSS('overscroll-behavior-y', 'auto');

  const overflow = await deckViewport.evaluate((element) => element.scrollHeight - element.clientHeight);
  expect(overflow).toBeLessThan(16);

  const readingDesk = page.locator('.readingDesk');
  await readingDesk.evaluate((element) => element.scrollTo({ top: 520 }));
  const scrollBeforeClose = await readingDesk.evaluate((element) => element.scrollTop);
  await page.getByRole('button', { name: '关闭抽牌' }).click();
  const continueButton = page.getByRole('button', { name: '继续刚才的抽牌' });
  await expect(continueButton).toBeFocused();
  await continueButton.click();
  await expect.poll(() => readingDesk.evaluate((element) => element.scrollTop)).toBeGreaterThanOrEqual(scrollBeforeClose - 2);

  const firstCard = page.getByRole('button', { name: /背面猫牌/ }).first();
  const placeButton = page.getByRole('button', { name: /还差 1 张|把 1 张猫牌放上桌/ });
  await expect(placeButton).toBeDisabled();
  await firstCard.click();
  await expect(firstCard).toHaveAttribute('aria-label', /已选为第 1 张/);
  await expect(page.getByRole('button', { name: '把 1 张猫牌放上桌' })).toBeEnabled();
  await firstCard.click();
  await expect(firstCard).not.toHaveAttribute('aria-label', /已选为/);
  await expect(page.getByRole('button', { name: '还差 1 张' })).toBeDisabled();
});

test('移动端今日一牌可以生成竖版分享图', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: '今日一牌' }).click();

  await expect(page.locator('#reading-result')).toBeVisible();
  await expect(page.locator('#reading-result')).not.toHaveAttribute('aria-live', 'polite');
  await expect(page.getByRole('status')).toContainText('猫猫把这张牌翻好了。核心牌是');
  await expect(page.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
  await page.getByRole('tab', { name: '分享', exact: true }).click();
  await expect(page.locator('.sharePosterAction').getByText('今天可以做', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '生成分享图' }).click();

  const shareImage = page.getByRole('img', { name: 'MiaoTarot 分享图预览' });
  await expect(shareImage).toBeVisible();
  await expect(shareImage).toHaveJSProperty('complete', true);
  expect(await shareImage.evaluate((image: HTMLImageElement) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
  }))).toEqual({ width: 1080, height: 1920 });
  await expect(page.getByRole('button', { name: '保存 PNG' })).toBeVisible();
  await expect(page.getByText('长按图片保存到相册', { exact: false })).toBeVisible();
});
