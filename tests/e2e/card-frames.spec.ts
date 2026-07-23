import { expect, test, type Locator } from '@playwright/test';

async function expectCardFrame(locator: Locator, expectedFrame: string, artSelector: string, expectedTone?: string) {
  await expect(locator).toHaveAttribute('data-card-frame', expectedFrame);
  if (expectedTone) await expect(locator).toHaveAttribute('data-card-tone', expectedTone);
  const actualTone = await locator.getAttribute('data-card-tone');
  const metrics = await locator.evaluate((element, selector) => {
    const style = getComputedStyle(element);
    const nineSlice = element.querySelector<HTMLElement>('.tarotCardFrameNineSlice');
    const nineSliceStyle = nineSlice ? getComputedStyle(nineSlice) : null;
    const bounds = element.getBoundingClientRect();
    const content = element.querySelector<HTMLElement>('.tarotCardFrameContent')?.getBoundingClientRect();
    const art = element.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
    const nameplate = element.querySelector<HTMLElement>('.miaoCardNameplate, .interactiveCardNameplate');
    const nameplateStyle = nameplate ? getComputedStyle(nameplate) : null;
    const nameplateBefore = nameplate ? getComputedStyle(nameplate, '::before') : null;
    return {
      ratio: bounds.width / bounds.height,
      borderWidth: Number.parseFloat(style.borderTopWidth),
      radius: Number.parseFloat(style.borderTopLeftRadius),
      innerInset: content ? content.left - bounds.left : 0,
      artRatio: art ? art.width / art.height : 0,
      nineSlicePadding: nineSliceStyle ? Number.parseFloat(nineSliceStyle.paddingTop) : 0,
      borderImageSource: nineSliceStyle?.borderImageSource || '',
      imageRendering: nineSliceStyle?.imageRendering || '',
      nameplatePattern: nameplateStyle?.backgroundImage || '',
      nameplateInnerBorder: nameplateBefore ? Number.parseFloat(nameplateBefore.borderTopWidth) : 0,
    };
  }, artSelector);

  expect(Math.abs(metrics.ratio - 11 / 19)).toBeLessThan(0.01);
  expect(Math.abs(metrics.artRatio - 5 / 7)).toBeLessThan(0.01);
  expect(metrics.nineSlicePadding).toBeGreaterThanOrEqual(16);
  expect(metrics.borderWidth).toBeGreaterThanOrEqual(1);
  expect(metrics.radius).toBeGreaterThanOrEqual(14);
  expect(metrics.innerInset).toBeGreaterThanOrEqual(16);
  const expectedAsset = actualTone && actualTone !== 'major'
    ? `${expectedFrame}-${actualTone}-v1`
    : expectedFrame;
  expect(metrics.borderImageSource).toContain(`/assets/card-frames/${expectedAsset}.svg`);
  expect(metrics.imageRendering).toBe('auto');
  expect(metrics.nameplatePattern).toContain('repeating-linear-gradient');
  expect(metrics.nameplateInnerBorder).toBeGreaterThanOrEqual(1);
}

test('390px 手机图鉴中的牌有可辨认外框并可打开详情', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: '图鉴', exact: true }).click();
  const gallery = page.getByRole('dialog', { name: '塔罗图鉴' });
  await expect(gallery).toBeVisible();

  const tiles = gallery.locator('.galleryTile');
  await expect(tiles).toHaveCount(78);
  const firstTile = tiles.first();
  const firstFrame = firstTile.locator('.miaoCardArt');
  await expect(firstTile.locator('.miaoArtAsset')).toHaveAttribute('data-image-state', 'loaded');
  await expectCardFrame(firstFrame, 'inked-paper', '.miaoCardVisualWell', 'major');
  await expect(firstTile.locator('.miaoCardArchetype')).toBeHidden();
  await expect(firstTile.locator('.galleryTileCopy')).toContainText('自由');
  await expect(firstTile).toHaveScreenshot('mobile-gallery-framed-card.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await expect(page).toHaveScreenshot('mobile-gallery-390.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await firstTile.click();
  const detail = page.getByRole('dialog', { name: /塔罗牌详情/ });
  await expect(detail).toBeVisible();
  await expectCardFrame(detail.locator('.galleryDetailArt .miaoCardArt'), 'inked-paper', '.miaoCardVisualWell');
  await expect(detail.locator('.miaoCardMeta')).toHaveText('大阿尔卡那 · 0');

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('390px 可浏览 78 张经典牌面、牌意并切换猫猫对照', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '图鉴', exact: true }).click();

  const gallery = page.getByRole('dialog', { name: '塔罗图鉴' });
  await gallery.getByRole('tab', { name: '经典牌面 · 学牌意' }).click();
  await expect(gallery.getByText('78 张经典牌面 · Rider–Waite–Smith')).toBeVisible();
  await expect(gallery.locator('.classicGalleryTile')).toHaveCount(78);

  const foolTile = gallery.getByRole('button', { name: '学习经典牌面：愚者' });
  const foolImage = foolTile.locator('img');
  await expect(foolImage).toHaveJSProperty('complete', true);
  expect(await foolImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

  await gallery.getByRole('tab', { name: '大阿卡纳', exact: true }).click();
  await expect(gallery.locator('.classicGalleryTile')).toHaveCount(22);
  await gallery.getByRole('tab', { name: '全部 78 张', exact: true }).click();
  await expect(gallery.locator('.classicGalleryTile')).toHaveCount(78);

  await foolTile.click();
  const detail = page.getByRole('dialog', { name: '塔罗牌详情' });
  await expect(detail.getByRole('tab', { name: '经典牌意' })).toHaveAttribute('aria-selected', 'true');
  await expect(detail.getByRole('heading', { name: '愚者', exact: true })).toBeVisible();
  await expect(detail.getByText('The Fool', { exact: true })).toBeVisible();
  await expect(detail.getByText('牌面里有什么', { exact: true })).toBeVisible();
  await expect(detail.getByText('正位含义', { exact: true })).toBeVisible();
  await expect(detail.getByText('逆位含义', { exact: true })).toBeVisible();
  const classicImage = detail.locator('.classicCardImage');
  await expect(classicImage).toHaveJSProperty('complete', true);
  expect(await classicImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page).toHaveScreenshot('mobile-classic-tarot-detail-390.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await detail.getByRole('tab', { name: '猫猫对照' }).click();
  await expect(detail.locator('.galleryDetailArt .miaoCardArt')).toBeVisible();
  await expect(detail.locator('.galleryDetailCaption')).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test('320px 经典牌面可按花色学习且不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: '图鉴', exact: true }).click();

  const gallery = page.getByRole('dialog', { name: '塔罗图鉴' });
  await gallery.getByRole('tab', { name: '经典牌面 · 学牌意' }).click();
  await gallery.getByRole('tab', { name: '圣杯', exact: true }).click();
  await expect(gallery.locator('.classicGalleryTile')).toHaveCount(14);
  await expect(gallery.getByText('当前显示 14 张', { exact: true })).toBeVisible();

  const firstImage = gallery.locator('.classicGalleryTile img').first();
  await expect(firstImage).toHaveJSProperty('complete', true);
  expect(await firstImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page).toHaveScreenshot('mobile-classic-tarot-gallery-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('320px 图鉴缩略牌保持单行标题并按卡牌显示稳定随机点缀色', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: '图鉴', exact: true }).click();

  const gallery = page.getByRole('dialog', { name: '塔罗图鉴' });
  const tiles = gallery.locator('.galleryTile');
  const magician = tiles.nth(1);
  const cupsAce = tiles.nth(22);

  await expect(magician.locator('.miaoArtAsset')).toHaveAttribute('data-image-state', 'loaded');
  await expect(magician.locator('.miaoCardName')).toHaveText('魔术师');
  await expect(magician.locator('.miaoCardName')).toHaveCSS('white-space', 'nowrap');
  await expect(magician.locator('.miaoCardArchetype')).toBeHidden();
  await expectCardFrame(magician.locator('.miaoCardArt'), 'inked-paper', '.miaoCardVisualWell', 'cups');
  await expectCardFrame(cupsAce.locator('.miaoCardArt'), 'inked-paper', '.miaoCardVisualWell', 'major');
  const initialTones = await tiles.locator('.miaoCardArt').evaluateAll((frames) => (
    frames.slice(0, 8).map((frame) => frame.getAttribute('data-card-tone'))
  ));
  expect(new Set(initialTones).size).toBeGreaterThanOrEqual(4);
  const [magicianEdge, cupsEdge] = await Promise.all([
    magician.locator('.miaoCardArt').evaluate((element) => getComputedStyle(element).getPropertyValue('--frame-edge')),
    cupsAce.locator('.miaoCardArt').evaluate((element) => getComputedStyle(element).getPropertyValue('--frame-edge')),
  ]);
  expect(cupsEdge).not.toBe(magicianEdge);

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);

  await expect(page).toHaveScreenshot('mobile-gallery-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await cupsAce.scrollIntoViewIfNeeded();
  await expect(cupsAce.locator('.miaoArtAsset')).toHaveAttribute('data-image-state', 'loaded');
  await expect(page).toHaveScreenshot('mobile-gallery-cups-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await page.reload();
  await page.getByRole('button', { name: '图鉴', exact: true }).click();
  const reloadedTones = await page.getByRole('dialog', { name: '塔罗图鉴' })
    .locator('.galleryTile .miaoCardArt')
    .evaluateAll((frames) => frames.slice(0, 8).map((frame) => frame.getAttribute('data-card-tone')));
  expect(reloadedTones).toEqual(initialTones);

  await page.getByRole('dialog', { name: '塔罗图鉴' }).locator('.galleryTile').nth(1).click();
  const detail = page.getByRole('dialog', { name: /塔罗牌详情/ });
  await expect(detail).toBeVisible();
  await expect(detail.locator('.miaoArtAsset')).toHaveAttribute('data-image-state', 'loaded');
  await expect(page).toHaveScreenshot('mobile-gallery-detail-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('慢速牌面加载时显示明确的猫猫加载状态而不是空白占位', async ({ page }) => {
  let releaseImage!: () => void;
  const imageGate = new Promise<void>((resolve) => {
    releaseImage = resolve;
  });

  await page.route('**/assets/miao-packs/doodle/the-fool.avif', async (route) => {
    await imageGate;
    await route.continue();
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '图鉴', exact: true }).click();

  const firstAsset = page.getByRole('dialog', { name: '塔罗图鉴' })
    .locator('.galleryTile')
    .first()
    .locator('.miaoArtAsset');
  await expect(firstAsset).toHaveAttribute('data-image-state', 'loading');
  await expect(firstAsset.locator('.miaoArtLoading')).toContainText('猫猫绘制中');

  releaseImage();
  await expect(firstAsset).toHaveAttribute('data-image-state', 'loaded');
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
  await expect(front.locator('.interactiveCardMeta')).not.toBeEmpty();
  await expect(front.locator('.interactiveCardFlourish')).toBeVisible();
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
