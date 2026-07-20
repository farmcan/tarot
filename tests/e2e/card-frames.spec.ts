import { expect, test, type Locator } from '@playwright/test';

async function expectCardFrame(locator: Locator, expectedFrame: string, artSelector: string) {
  await expect(locator).toHaveAttribute('data-card-frame', expectedFrame);
  const metrics = await locator.evaluate((element, selector) => {
    const style = getComputedStyle(element);
    const nineSlice = element.querySelector<HTMLElement>('.tarotCardFrameNineSlice');
    const nineSliceStyle = nineSlice ? getComputedStyle(nineSlice) : null;
    const bounds = element.getBoundingClientRect();
    const content = element.querySelector<HTMLElement>('.tarotCardFrameContent')?.getBoundingClientRect();
    const art = element.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
    return {
      ratio: bounds.width / bounds.height,
      borderWidth: Number.parseFloat(style.borderTopWidth),
      radius: Number.parseFloat(style.borderTopLeftRadius),
      innerInset: content ? content.left - bounds.left : 0,
      artRatio: art ? art.width / art.height : 0,
      nineSlicePadding: nineSliceStyle ? Number.parseFloat(nineSliceStyle.paddingTop) : 0,
      borderImageSource: nineSliceStyle?.borderImageSource || '',
      imageRendering: nineSliceStyle?.imageRendering || '',
    };
  }, artSelector);

  expect(Math.abs(metrics.ratio - 11 / 19)).toBeLessThan(0.01);
  expect(Math.abs(metrics.artRatio - 5 / 7)).toBeLessThan(0.01);
  expect(metrics.nineSlicePadding).toBeGreaterThanOrEqual(16);
  expect(metrics.borderWidth).toBeGreaterThanOrEqual(1);
  expect(metrics.radius).toBeGreaterThanOrEqual(14);
  expect(metrics.innerInset).toBeGreaterThanOrEqual(16);
  expect(metrics.borderImageSource).toContain(`/assets/card-frames/${expectedFrame}.svg`);
  expect(metrics.imageRendering).toBe('auto');
}

test('390px 手机图鉴中的牌有可辨认外框并可打开详情', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: '图鉴', exact: true }).click();
  const gallery = page.getByRole('dialog', { name: '猫猫图鉴' });
  await expect(gallery).toBeVisible();

  const tiles = gallery.locator('.galleryTile');
  await expect(tiles).toHaveCount(78);
  const firstTile = tiles.first();
  const firstFrame = firstTile.locator('.miaoCardArt');
  await expectCardFrame(firstFrame, 'inked-paper', '.miaoCardVisualWell');
  await expect(firstTile).toHaveScreenshot('mobile-gallery-framed-card.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await firstTile.click();
  const detail = page.getByRole('dialog', { name: /牌面详情/ });
  await expect(detail).toBeVisible();
  await expectCardFrame(detail.locator('.galleryDetailArt .miaoCardArt'), 'inked-paper', '.miaoCardVisualWell');

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('320px 窄屏完整抽牌路径的正面和结果页共用牌框', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();

  const advancedToggle = page.getByRole('button', { name: /3 张牌 ·/ });
  await advancedToggle.click();
  const singleCardRadio = page.getByRole('radio', { name: '1', exact: true });
  const radioId = await singleCardRadio.getAttribute('id');
  if (!radioId) throw new Error('Single-card control should have an associated label');
  await page.locator(`label[for="${radioId}"]`).click();
  await expect(singleCardRadio).toBeChecked();

  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  const directDeal = page.getByRole('button', { name: '不想挑，直接发牌' });
  const hiddenCards = page.getByRole('button', { name: /背面猫牌/ });
  await expect.poll(async () => (
    Number(await directDeal.isVisible()) + await hiddenCards.count()
  )).toBeGreaterThan(0);
  if (await directDeal.isVisible()) {
    await directDeal.click();
  } else {
    const hiddenCardCount = await hiddenCards.count();
    expect(hiddenCardCount).toBeGreaterThan(0);
    await hiddenCards.first().click();
    await page.getByRole('button', { name: '把 1 张猫牌放上桌' }).click();
  }

  const flipCard = page.locator('.flipCardButton');
  await expect(flipCard).toHaveCount(1);
  await flipCard.click();
  await expect.poll(() => flipCard.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return Math.abs(bounds.width / bounds.height - 11 / 19);
  })).toBeLessThan(0.01);

  const front = flipCard.locator('.interactiveCardFront');
  await expectCardFrame(front, 'inked-paper', '.interactiveCardArtWell');
  await expect(front.locator('img')).toHaveCSS('object-fit', 'cover');
  await expect(page.getByText('猫猫已经把话说完了', { exact: false })).toBeVisible();

  const resultFrame = page.locator('.resultHeader .miaoCardArt');
  await expect(resultFrame).toBeVisible();
  await expectCardFrame(resultFrame, 'inked-paper', '.miaoCardVisualWell');

  const overflow = await page.locator('.readingDesk').evaluate((element) => (
    element.scrollWidth - element.clientWidth
  ));
  expect(overflow).toBeLessThanOrEqual(1);
});
