import { expect, test, type Page } from '@playwright/test';

const mobileViewports = [
  { name: '320', width: 320, height: 568, minimumCardWidth: 200 },
  { name: '390', width: 390, height: 844, minimumCardWidth: 250 },
] as const;

test.use({ hasTouch: true, isMobile: true });

async function startDefaultSingleReading(page: Page) {
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });
  await page.goto('/');

  await page.getByRole('button', { name: /和猫猫聊一下|开始抽牌/ }).tap();
  const advancedToggle = page.getByRole('button', { name: /一张牌 ·/ });
  if (await advancedToggle.count()) {
    await expect(advancedToggle).toHaveAttribute('aria-expanded', 'false');
    await advancedToggle.tap();
    await expect(page.getByRole('radio', { name: '1', exact: true })).toBeChecked();
    await advancedToggle.tap();
  } else {
    await expect(page.getByRole('radio', { name: '1', exact: true })).toBeChecked();
  }
  const question = await page.getByRole('textbox', { name: '你的问题' }).inputValue();

  await page.getByRole('button', { name: '带着问题去洗牌' }).tap();
  const directDeal = page.getByRole('button', { name: '不想挑，直接发牌' });
  await expect(directDeal).toBeVisible();
  await directDeal.tap();

  const flipCard = page.locator('.flipCardButton');
  await expect(flipCard).toHaveCount(1);
  await expect(flipCard).toBeVisible();
  return { flipCard, question };
}

async function expectCardLabelsInsideFrame(page: Page) {
  const containment = await page.locator('.interactiveCardFront').evaluate((front) => {
    const frameBounds = front.getBoundingClientRect();
    const selectors = [
      '.interactiveCardMeta',
      '.interactiveCardNameplate strong',
      '.interactiveCardSubline',
    ];
    return selectors.map((selector) => {
      const element = front.querySelector(selector);
      if (!(element instanceof HTMLElement)) return { selector, present: false, inside: false };
      const bounds = element.getBoundingClientRect();
      return {
        selector,
        present: true,
        inside: bounds.left >= frameBounds.left - 1
          && bounds.right <= frameBounds.right + 1
          && bounds.top >= frameBounds.top - 1
          && bounds.bottom <= frameBounds.bottom + 1,
      };
    });
  });

  for (const item of containment) {
    expect(item.present, `${item.selector} should exist`).toBe(true);
    expect(item.inside, `${item.selector} should stay inside the rendered card frame`).toBe(true);
  }
}

async function expectResultCardInsideFrame(page: Page, minimumCardWidth: number) {
  const frame = page.locator('#reading-result .resultHeader .tarotCardFrame');
  await expect(frame).toHaveCount(1);
  await expect.poll(() => frame.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThanOrEqual(minimumCardWidth);

  const containment = await frame.evaluate((element) => {
    const frameBounds = element.getBoundingClientRect();
    return [
      '.miaoCardMeta',
      '.miaoCardName',
      '.miaoCardArchetype',
    ].map((selector) => {
      const label = element.querySelector(selector);
      if (!(label instanceof HTMLElement)) return { selector, present: false, inside: false };
      const bounds = label.getBoundingClientRect();
      return {
        selector,
        present: bounds.width > 0 && bounds.height > 0,
        inside: bounds.left >= frameBounds.left - 1
          && bounds.right <= frameBounds.right + 1
          && bounds.top >= frameBounds.top - 1
          && bounds.bottom <= frameBounds.bottom + 1,
      };
    });
  });

  for (const item of containment) {
    expect(item.present, `${item.selector} should be visibly rendered`).toBe(true);
    expect(item.inside, `${item.selector} should stay inside the result card frame`).toBe(true);
  }
}

for (const viewport of mobileViewports) {
  test(`${viewport.name}px 首访默认单张，翻牌后保留牌面并给出明确下一步`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const { flipCard } = await startDefaultSingleReading(page);
    const readingDesk = page.locator('.readingDesk');

    await flipCard.tap();
    await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
    await expect(flipCard).not.toHaveAttribute('aria-label', /点击翻牌/);

    await expect.poll(() => flipCard.evaluate((card) => card.getBoundingClientRect().width))
      .toBeGreaterThanOrEqual(viewport.minimumCardWidth);
    const cardGeometry = await flipCard.evaluate((card, desk) => {
      const cardBounds = card.getBoundingClientRect();
      const deskBounds = (desk as HTMLElement).getBoundingClientRect();
      return {
        width: cardBounds.width,
        ratio: cardBounds.width / cardBounds.height,
        staysVisible: cardBounds.top >= deskBounds.top && cardBounds.bottom <= deskBounds.bottom,
      };
    }, await readingDesk.elementHandle());
    expect(cardGeometry.width).toBeGreaterThanOrEqual(viewport.minimumCardWidth);
    expect(Math.abs(cardGeometry.ratio - 11 / 19)).toBeLessThan(0.01);
    expect(cardGeometry.staysVisible).toBe(true);
    await expectCardLabelsInsideFrame(page);

    expect(await readingDesk.evaluate((element) => element.scrollWidth - element.clientWidth))
      .toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(1);

    const completionBridge = page.getByTestId('completion-bridge');
    await expect(completionBridge).toBeVisible();
    await expect(completionBridge).toContainText('猫猫抓到的重点');
    await expect(completionBridge).toContainText('现在先做：');
    const result = page.locator('#reading-result');
    await expect(result).toBeAttached();
    await expect(page.getByRole('button', { name: '分享这次阅读' })).toBeEnabled();
    await expect(result.locator('.miaoArtAsset')).toHaveAttribute('data-image-state', 'loaded');
    await completionBridge.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(completionBridge).toBeInViewport();
    await expect(page).toHaveScreenshot(`mobile-single-completion-${viewport.name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });

    await page.getByTestId('completion-primary-action').tap();
    await expect(result).toBeInViewport();
    await expect(result.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
    await expect(result.locator('.miaoCardArt')).toHaveCount(1);
    await expect(result.locator('.drawnMiaoCard')).toHaveCount(0);
    await expectResultCardInsideFrame(page, viewport.minimumCardWidth);

    const evidence = result.getByTestId('single-card-evidence');
    await expect(evidence).toBeVisible();
    await expect(evidence).not.toHaveAttribute('open', '');
    await expect(evidence.locator('summary')).toContainText('查看这张牌的完整牌义与依据');
    await evidence.scrollIntoViewIfNeeded();
    await expect(evidence).toBeInViewport();
    const resultHierarchy = await page.evaluate(() => {
      const header = document.querySelector('#reading-result .resultHeader');
      const evidenceBlock = document.querySelector('#reading-result .singleCardEvidence');
      const tabs = document.querySelector('.miaoTabs');
      if (!header || !evidenceBlock || !tabs) return null;
      return {
        evidenceAfterHeader: Boolean(header.compareDocumentPosition(evidenceBlock) & Node.DOCUMENT_POSITION_FOLLOWING),
        tabsAfterEvidence: Boolean(evidenceBlock.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    expect(resultHierarchy).toEqual({
      evidenceAfterHeader: true,
      tabsAfterEvidence: true,
    });
    await expect(evidence).toHaveScreenshot(`mobile-single-result-compact-${viewport.name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });

    await evidence.locator('summary').tap();
    await expect(evidence).toHaveAttribute('open', '');
    await expect(evidence).toContainText('猫语翻译');
    await expect(evidence).toContainText('传统牌义');
    await expect(evidence).toContainText('位在回答什么');
    await expect(evidence).toContainText('结合当前问题');
    await evidence.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(1);
    await expect(evidence).toHaveScreenshot(`mobile-single-result-evidence-${viewport.name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });
  });
}

test('1280px 单牌完整结果保留唯一主牌面并按需展开依据', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { flipCard } = await startDefaultSingleReading(page);

  await flipCard.tap();
  await page.getByTestId('completion-primary-action').tap();

  const result = page.locator('#reading-result');
  await expect(result.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
  await expect(result.locator('.miaoCardArt')).toHaveCount(1);
  await expect(result.locator('.drawnMiaoCard')).toHaveCount(0);
  const evidence = result.getByTestId('single-card-evidence');
  await expect(evidence).toBeVisible();
  await expect(evidence).not.toHaveAttribute('open', '');
  await evidence.locator('summary').tap();
  await expect(evidence).toHaveAttribute('open', '');
  await expect(evidence).toContainText('传统牌义');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
});

test('390px 完成后可用浏览器返回、恢复结果并换问题重来', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { flipCard, question } = await startDefaultSingleReading(page);

  await flipCard.tap();
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
  await expect(page.getByTestId('completion-bridge')).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('button', { name: '继续看刚才的结果' })).toBeVisible();

  await page.getByRole('button', { name: '继续看刚才的结果' }).tap();
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
  await expect(page.getByTestId('completion-bridge')).toBeVisible();

  await page.locator('.mobileReadingRestart').tap();
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'ready');
  const questionInput = page.getByRole('textbox', { name: '你的问题' });
  await expect(questionInput).toHaveValue(question);
  await expect(questionInput).toBeFocused();
  await expect(page.locator('.flipCardButton')).toHaveCount(0);
  await expect(page.locator('#reading-result')).toHaveCount(0);
});
