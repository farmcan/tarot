import { expect, test } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true });

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`${viewport.width}px 普通首访能看清问题、滚动选牌并完成基础阅读`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    let aiRequests = 0;
    await page.route('**/api/readings/analyze', async (route) => {
      if (route.request().method() === 'POST') aiRequests += 1;
      await route.fulfill({
        status: route.request().method() === 'POST' ? 503 : 200,
        contentType: 'application/json',
        body: JSON.stringify({ configured: false, available: false, turnstileRequired: false }),
      });
    });
    await page.route('**/api/product-event', (route) => route.fulfill({
      status: 202, contentType: 'application/json', body: '{"accepted":true}',
    }));

    await page.goto('/?analytics=internal');
    const homeAction = page.getByRole('button', { name: '和猫猫聊一下', exact: true });
    await expect(homeAction).toBeInViewport({ ratio: 1 });
    expect(await homeAction.locator('.mantine-Button-label').evaluate(
      (label) => label.scrollWidth - label.clientWidth,
    )).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}.png`) });
    await homeAction.tap();
    const desk = page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' });
    await expect(desk).toBeVisible();
    const question = desk.getByRole('textbox', { name: '你的问题', exact: true });
    const start = desk.getByRole('button', { name: '带着问题去洗牌', exact: true });
    await expect(question).toHaveValue('我今天最需要看见什么？');
    await expect(desk.getByRole('button', { name: /一张牌 ·/ })).toBeVisible();
    await expect(desk.getByRole('switch', { name: '和 Miao 边翻边聊', exact: true })).not.toBeChecked();

    // Ordinary entry needs the same short-screen protection as campaign entry:
    // a visible bounding box alone does not mean a sticky action is not covering it.
    const questionBounds = await question.boundingBox();
    const actionBounds = await desk.locator('.shuffleActionRow').boundingBox();
    expect(questionBounds).not.toBeNull();
    expect(actionBounds).not.toBeNull();
    expect(questionBounds!.y + questionBounds!.height).toBeLessThanOrEqual(actionBounds!.y + 1);
    expect(questionBounds!.y).toBeGreaterThanOrEqual(0);
    expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(start).toBeInViewport({ ratio: 1 });
    await expect(page).toHaveScreenshot(`ordinary-first-reading-${viewport.width}.png`, {
      animations: 'disabled', maxDiffPixelRatio: 0.01,
    });

    await question.fill('今天我应该先把哪件小事做好？');
    await start.tap();
    await desk.getByRole('button', { name: /选择中间牌堆/ }).tap();
    const cards = desk.getByRole('button', { name: /背面猫牌/ });
    await expect(cards).toHaveCount(26);

    // The deck scrolls independently, leaving the action row in its own space.
    const grid = desk.getByRole('region', { name: /选中的牌堆，共 26 张/ });
    const gridBounds = await grid.boundingBox();
    expect(gridBounds).not.toBeNull();
    const beforeScroll = await grid.evaluate((element) => element.scrollTop);
    const cardWidth = (await cards.first().boundingBox())!.width;
    expect(cardWidth).toBeGreaterThanOrEqual(viewport.width * 0.23);
    const footer = desk.locator('.selectionActionRow');
    const footerBounds = (await footer.boundingBox())!;
    expect(footerBounds.y).toBeGreaterThanOrEqual(gridBounds!.y + gridBounds!.height - 1);
    await expect(footer).toBeInViewport({ ratio: 0.95 });
    await page.screenshot({ path: testInfo.outputPath(`pick-${viewport.width}.png`), animations: 'disabled' });
    const touch = await page.context().newCDPSession(page);
    const x = Math.round(gridBounds!.x + gridBounds!.width / 2);
    const startY = Math.round(gridBounds!.y + gridBounds!.height - 24);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
    for (const distance of [30, 70, 115, 155]) {
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchMove', touchPoints: [{ x, y: startY - distance }],
      });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
    await expect.poll(() => grid.evaluate((element) => element.scrollTop)).toBeGreaterThan(beforeScroll + 65);
    await expect(desk.locator('.hiddenDeckCard[aria-pressed="true"]')).toHaveCount(0);
    await expect(desk.getByRole('button', { name: '还差 1 张', exact: true })).toBeDisabled();

    const selected = cards.nth(16);
    await selected.tap();
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await selected.tap();
    await expect(selected).toHaveAttribute('aria-pressed', 'false');
    await selected.tap();
    await desk.getByRole('button', { name: '把 1 张猫牌放上桌', exact: true }).tap();
    await desk.getByRole('button', { name: '焦点，点击翻牌', exact: true }).tap();

    await expect(desk.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
    const face = desk.locator('.flipCardButton');
    await expect(face).toHaveCount(1);
    await expect(face).toBeDisabled();
    // Completing the reading updates semantics before the 3D flip settles.
    // Measure the final rendered face rather than an edge-on animation frame.
    await expect.poll(async () => (await face.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(viewport.width * 0.6);
    await page.screenshot({ path: testInfo.outputPath(`first-reveal-${viewport.width}.png`) });

    const reward = desk.getByTestId('completion-bridge');
    await reward.scrollIntoViewIfNeeded();
    await expect(reward.getByRole('heading')).not.toBeEmpty();
    await expect(reward).toContainText('现在先做：');
    expect(aiRequests).toBe(0);
    expect(await desk.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);

    // The user chooses when to leave the reveal and can return without losing it.
    await page.goBack();
    await expect(desk).not.toBeVisible();
    await page.getByRole('button', { name: '继续看刚才的结果', exact: true }).tap();
    await expect(desk.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
  });
}
