import { expect, test, type Page } from '@playwright/test';

async function installAudioContextMock(page: Page) {
  await page.addInitScript(() => {
    const testWindow = window as typeof window & { __miaoAudioBufferStarts: number };
    testWindow.__miaoAudioBufferStarts = 0;

    class FakeAudioParam {
      setValueAtTime() {}
      exponentialRampToValueAtTime() {}
    }

    class FakeAudioNode {
      connect<T>(target: T) { return target; }
      disconnect() {}
    }

    class FakeBufferSource extends FakeAudioNode {
      buffer: unknown = null;
      start() { testWindow.__miaoAudioBufferStarts += 1; }
      stop() {}
    }

    class FakeAudioContext {
      currentTime = 0;
      sampleRate = 48_000;
      destination = new FakeAudioNode();

      resume() { return Promise.resolve(); }
      createBuffer(_channels: number, length: number) {
        return { getChannelData: () => new Float32Array(length) };
      }
      createBufferSource() { return new FakeBufferSource(); }
      createBiquadFilter() {
        return Object.assign(new FakeAudioNode(), {
          type: 'bandpass',
          frequency: new FakeAudioParam(),
          Q: new FakeAudioParam(),
        });
      }
      createGain() {
        return Object.assign(new FakeAudioNode(), { gain: new FakeAudioParam() });
      }
      createOscillator() {
        return Object.assign(new FakeAudioNode(), {
          type: 'sine',
          frequency: new FakeAudioParam(),
          start() {},
          stop() {},
        });
      }
    }

    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext });
  });
  await page.reload();
}

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

async function reachCutStage(page: Page) {
  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  await expect(page.locator('.cutPileButton')).toHaveCount(3);
  await expect(page.locator('.cutPileButton').first()).toBeVisible();
}

async function startShuffle(page: Page) {
  await reachCutStage(page);
  await page.locator('.cutPileButton').first().click();
  await expect(page.locator('.hiddenDeckCard').first()).toBeVisible();
}

async function stabilizeVisualCardBack(page: Page) {
  await page.clock.setFixedTime(new Date('2026-07-20T13:00:00+08:00'));
  await page.evaluate(() => {
    Math.random = () => 0.42;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('首页讲清品牌承诺，并可交互认识塔罗', async ({ page }) => {
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', './favicon.svg');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', './apple-touch-icon.png');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', './site.webmanifest');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#6d4bd8');

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

test('产品说明、牌义来源与创作者账号都在站内可读', async ({ page }) => {
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);

  await page.getByRole('button', { name: '关于', exact: true }).click();
  const infoDialog = page.getByRole('dialog', { name: '了解 MiaoTarot' });
  await expect(infoDialog).toBeVisible();
  await expect(infoDialog.getByRole('heading', { name: /猫不会替你做决定/ })).toBeVisible();
  await expect(infoDialog.getByText('AI 不参与洗牌、选牌', { exact: false })).toBeVisible();

  await infoDialog.getByRole('tab', { name: '牌义怎么读' }).click();
  await expect(infoDialog.getByText('逆位不等于坏结果')).toBeVisible();
  await expect(infoDialog.locator('.meaningLayer')).toHaveCount(5);

  await infoDialog.getByRole('tab', { name: '来源与关注' }).click();
  await expect(infoDialog.getByText('@cometpisces/tarot-kit', { exact: true })).toBeVisible();
  await expect(infoDialog.getByText('贷鼠', { exact: true })).toBeVisible();
  await expect(infoDialog.getByText('2020_levi_test', { exact: false })).toBeVisible();
  await expect(infoDialog.getByText('蔚天灿雨', { exact: true })).toBeVisible();
});

test('窄屏可从顶部打开站内说明且不产生横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.reload();

  await expect(page.getByRole('button', { name: '了解', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '了解', exact: true }).click();
  const infoDialog = page.getByRole('dialog', { name: '了解 MiaoTarot' });
  await expect(infoDialog).toBeVisible();
  await infoDialog.getByRole('tab', { name: '来源与关注' }).click();
  await expect(infoDialog.getByText('贷鼠', { exact: true })).toBeVisible();

  const dimensions = await page.evaluate(() => {
    const modalViewport = document.querySelector<HTMLElement>('.productInfoModal .mantine-ScrollArea-viewport');
    return ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
      modalViewport: modalViewport?.clientWidth ?? 0,
      modalContent: modalViewport?.scrollWidth ?? 0,
    });
  });
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.modalContent).toBeLessThanOrEqual(dimensions.modalViewport + 1);
});

test('猫猫图鉴从首页可见，并能浏览 78 张牌与单牌详情', async ({ page }) => {
  const galleryButton = page.getByRole('button', { name: '猫猫图鉴', exact: true });
  await expect(galleryButton).toBeVisible();
  await galleryButton.click();

  const gallery = page.locator('.galleryModal');
  await expect(gallery.getByText('78 张 · 猫咪百变涂鸦塔罗')).toBeVisible();
  await expect(gallery.locator('.galleryTile')).toHaveCount(78);

  await gallery.getByRole('button', { name: /查看愚者/ }).click();
  const detail = page.locator('.galleryDetail');
  await expect(detail).toBeVisible();
  await expect(detail.getByText('正位', { exact: true })).toBeVisible();
  await expect(detail.getByText('逆位', { exact: true })).toBeVisible();
  await expect(detail.locator('.miaoGeneratedImage')).toHaveCSS('object-fit', 'cover');
});

test('标准 78 张内容包可以完成单张选牌，并为翻牌播放一次音效', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAudioContextMock(page);
  await chooseOneCard(page);
  const soundToggle = page.getByRole('switch', { name: '洗牌与翻牌音效' });
  await expect(soundToggle).toBeChecked();

  await startShuffle(page);
  const soundsAfterShuffle = await page.evaluate(() => (
    window as typeof window & { __miaoAudioBufferStarts: number }
  ).__miaoAudioBufferStarts);
  expect(soundsAfterShuffle).toBe(10);

  const hiddenCards = page.getByRole('button', { name: /背面猫牌/ });
  await expect(hiddenCards).toHaveCount(26);
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
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __miaoAudioBufferStarts: number }
  ).__miaoAudioBufferStarts)).toBe(soundsAfterShuffle + 1);

  const frontImage = flipCard.locator('.interactiveCardFront img');
  await expect.poll(() => flipCard.evaluate((button) => {
    const bounds = button.getBoundingClientRect();
    if (!bounds.height) return Number.POSITIVE_INFINITY;
    return Math.abs(bounds.width / bounds.height - 11 / 19);
  })).toBeLessThan(0.01);
  await expect(flipCard.locator('.interactiveCardFront')).toHaveAttribute('data-card-frame', 'inked-paper');
  await expect(frontImage).toHaveCSS('object-fit', 'cover');
  await expect(page.getByText('展开简介与完整牌义')).toBeVisible();

  await expect(page.getByText('猫猫已经把话说完了', { exact: false })).toBeVisible();
  await expect(page.locator('#reading-result')).toBeVisible();
  await expect(page.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
});

test('经典内容包严格使用 22 张牌', async ({ page }) => {
  await chooseOneCard(page);
  await page.getByRole('combobox', { name: '这次用哪副牌' }).click();
  await page.getByRole('option', { name: '经典 22 张' }).click();
  await reachCutStage(page);
  await expect(page.locator('.cutPileButton')).toHaveCount(3);
  await expect(page.getByText('22 张已经平均分成三叠')).toBeVisible();
  await page.locator('.cutPileButton').first().click();
  await expect(page.getByRole('button', { name: /背面猫牌/ })).toHaveCount(8);
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

test('移动端洗牌后先三叠选一，再展开为较短的大牌背牌阵', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await stabilizeVisualCardBack(page);
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await reachCutStage(page);

  const piles = page.locator('.cutPileButton');
  await expect(piles).toHaveCount(3);
  await expect(page.getByText('凭第一眼，选一叠', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '不想挑，直接发牌' })).toBeVisible();
  const pileSizes = await piles.evaluateAll((elements) => elements.map((element) => {
    const bounds = element.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  }));
  expect(pileSizes.every((item) => item.width >= 95 && item.height >= 175)).toBe(true);

  await page.waitForTimeout(350);
  await page.screenshot();

  await expect(page).toHaveScreenshot('mobile-cut-three-piles.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await piles.nth(1).click();
  await expect(page.getByRole('region', { name: /选中的牌堆，共 26 张/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /背面猫牌/ })).toHaveCount(26);
  await expect(page.getByRole('button', { name: '换一叠' })).toBeVisible();

  const selectedPileViewport = page.locator('.hiddenDeckViewport');
  const selectedPileWidth = await selectedPileViewport.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(selectedPileWidth.scrollWidth).toBeGreaterThan(selectedPileWidth.clientWidth * 3);
  expect(selectedPileWidth.scrollWidth).toBeLessThan(selectedPileWidth.clientWidth * 5);

  await page.waitForTimeout(1200);
  await page.screenshot();

  await expect(page).toHaveScreenshot('mobile-selected-small-pile.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });

  await page.getByRole('button', { name: '换一叠' }).click();
  await expect(page.locator('.cutPileButton')).toHaveCount(3);
});

test('320px 窄屏仍能完整展示三叠牌与快捷出口', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.reload();
  await stabilizeVisualCardBack(page);
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await reachCutStage(page);
  await page.waitForTimeout(350);
  await page.screenshot();

  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    piles: Array.from(document.querySelectorAll('.cutPileButton')).map((element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, width: bounds.width };
    }),
  }));
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.piles).toHaveLength(3);
  expect(layout.piles.every((pile) => pile.left >= 0 && pile.right <= layout.viewportWidth && pile.width >= 80)).toBe(true);
  await expect(page.getByRole('button', { name: '不想挑，直接发牌' })).toBeVisible();

  await expect(page).toHaveScreenshot('mobile-cut-three-piles-narrow.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('移动端抽牌使用全屏工作台与大尺寸横向牌阵', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await chooseOneCard(page);
  await startShuffle(page);

  await expect(page.locator('.readingDesk')).toHaveCSS('position', 'fixed');
  const deckViewport = page.locator('.hiddenDeckViewport');
  await expect(deckViewport).toHaveCSS('overflow-x', 'auto');
  await expect(deckViewport).toHaveCSS('overflow-y', 'hidden');
  await expect(deckViewport).toHaveCSS('overscroll-behavior-x', 'contain');
  await expect(deckViewport).toHaveCSS('overscroll-behavior-y', 'auto');

  const deckDimensions = await deckViewport.evaluate((element) => {
    const firstCard = element.querySelector<HTMLElement>('.hiddenDeckCard');
    const cardBounds = firstCard?.getBoundingClientRect();
    return {
      overflowX: element.scrollWidth - element.clientWidth,
      cardWidth: cardBounds?.width ?? 0,
      cardHeight: cardBounds?.height ?? 0,
    };
  });
  expect(deckDimensions.overflowX).toBeGreaterThan(1_000);
  expect(deckDimensions.cardWidth).toBeGreaterThanOrEqual(95);
  expect(deckDimensions.cardHeight).toBeGreaterThanOrEqual(165);

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
  await expect(page.getByRole('button', { name: '直接发牌' })).toBeVisible();
  await expect(placeButton).toBeDisabled();
  await firstCard.click();
  await expect(firstCard).toHaveAttribute('aria-label', /已选为第 1 张/);
  await expect(page.getByRole('button', { name: '直接发牌' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '把 1 张猫牌放上桌' })).toBeEnabled();
  await firstCard.click();
  await expect(firstCard).not.toHaveAttribute('aria-label', /已选为/);
  await expect(page.getByRole('button', { name: '还差 1 张' })).toBeDisabled();
});

test('移动端选定牌堆后可一键发出整组牌，并保留逐张翻牌顺序', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await startShuffle(page);

  await page.getByRole('button', { name: '直接发牌' }).click();
  const dealtCards = page.locator('.flipCardButton');
  await expect(dealtCards).toHaveCount(3);
  await expect(dealtCards.nth(0)).toHaveAttribute('aria-label', '过去，点击翻牌');
  await expect(dealtCards.nth(1)).toHaveAttribute('aria-label', '现在，点击翻牌');
  await expect(dealtCards.nth(2)).toHaveAttribute('aria-label', '下一步，点击翻牌');
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'placed');
});

test('移动端没有耐心切牌时可以从三叠界面直接发牌', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await reachCutStage(page);

  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  await expect(page.locator('.flipCardButton')).toHaveCount(3);
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'placed');
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
  const exportDimensions = await shareImage.evaluate((image: HTMLImageElement) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
    declaredWidth: Number(image.dataset.exportWidth),
    declaredHeight: Number(image.dataset.exportHeight),
  }));
  expect(exportDimensions.width).toBe(1080);
  expect(exportDimensions.height).toBeGreaterThanOrEqual(1920);
  expect(exportDimensions.declaredWidth).toBe(exportDimensions.width);
  expect(exportDimensions.declaredHeight).toBe(exportDimensions.height);
  await expect(page.getByRole('button', { name: '保存 PNG' })).toBeVisible();
  await expect(page.getByText('长按图片保存到相册', { exact: false })).toBeVisible();
});

test('长牌阵的分享卡预览与导出图片都不会截断底部内容', async ({ page }) => {
  const longReadingUrl = '/?r=1&spread=relationship&cards=judgement.u,the-magician.r,the-sun.u,the-star.r,the-fool.u&topic=love&pack=doodle-full&q=%E8%BF%99%E6%AE%B5%E5%85%B3%E7%B3%BB%E9%87%8C%E6%9C%89%E5%BE%88%E5%A4%9A%E6%B2%A1%E8%AF%B4%E5%87%BA%E5%8F%A3%E7%9A%84%E6%83%85%E7%BB%AA%EF%BC%8C%E6%88%91%E6%83%B3%E7%9F%A5%E9%81%93%E6%80%8E%E4%B9%88%E7%9C%8B%E6%B8%85%E8%87%AA%E5%B7%B1%E7%9A%84%E9%9C%80%E8%A6%81%E5%B9%B6%E4%B8%94%E5%81%9A%E5%87%BA%E4%B8%8D%E4%BC%A4%E5%AE%B3%E5%BD%BC%E6%AD%A4%E7%9A%84%E4%B8%8B%E4%B8%80%E6%AD%A5#reading-result';

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(longReadingUrl);

  const sharePoster = page.locator('.sharePoster');
  const narrowLayout = await sharePoster.evaluate((poster) => {
    const posterBox = poster.getBoundingClientRect();
    const footerBox = poster.querySelector<HTMLElement>('.sharePosterFooter')?.getBoundingClientRect();
    return {
      clientHeight: poster.clientHeight,
      scrollHeight: poster.scrollHeight,
      posterBottom: posterBox.bottom,
      footerBottom: footerBox?.bottom ?? Number.POSITIVE_INFINITY,
      viewportWidth: document.documentElement.clientWidth,
      pageWidth: document.documentElement.scrollWidth,
    };
  });
  expect(narrowLayout.clientHeight).toBeGreaterThanOrEqual(narrowLayout.scrollHeight);
  expect(narrowLayout.footerBottom).toBeLessThanOrEqual(narrowLayout.posterBottom + 1);
  expect(narrowLayout.pageWidth).toBeLessThanOrEqual(narrowLayout.viewportWidth + 1);
  await page.getByRole('button', { name: '生成分享图' }).click();

  const shareImage = page.getByRole('img', { name: 'MiaoTarot 分享图预览' });
  await expect(shareImage).toBeVisible();
  await expect(shareImage).toHaveJSProperty('complete', true);
  const exportDimensions = await shareImage.evaluate((image: HTMLImageElement) => ({
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    declaredWidth: Number(image.dataset.exportWidth),
    declaredHeight: Number(image.dataset.exportHeight),
  }));
  expect(exportDimensions.naturalWidth).toBe(1080);
  expect(exportDimensions.naturalHeight).toBeGreaterThan(1920);
  expect(exportDimensions).toMatchObject({
    declaredWidth: exportDimensions.naturalWidth,
    declaredHeight: exportDimensions.naturalHeight,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.shareExportPreview')).toHaveScreenshot('mobile-long-share-preview.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});
