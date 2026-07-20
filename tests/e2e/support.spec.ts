import { expect, test } from '@playwright/test';

test('移动端在分享区后自然展示支持入口，并优先提供支持页面按钮', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: '罐罐', exact: true })).toBeVisible();
  expect(await page.locator('.topNav').evaluate((element) => element.scrollWidth - element.clientWidth))
    .toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: '今日一牌' }).click();
  await expect(page.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: '支持 MiaoTarot' })).toHaveCount(0);

  const supportPrompt = page.locator('.readingDesk > .supportPrompt');
  await expect(page.locator('.completedReading .supportPrompt')).toHaveCount(0);
  await expect(supportPrompt).toContainText('如果这次猫猫有帮到你，可以请它吃罐罐');
  const promptFollowsShareTabs = await page.locator('.miaoTabs').evaluate((tabs) => {
    const prompt = document.querySelector('.readingDesk > .supportPrompt');
    return prompt ? Boolean(tabs.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  });
  expect(promptFollowsShareTabs).toBe(true);
  await expect(supportPrompt).toHaveScreenshot('mobile-support-entry.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
  await supportPrompt.click();

  const supportDialog = page.getByRole('dialog', { name: '支持 MiaoTarot' });
  await expect(supportDialog).toBeVisible();
  await expect(supportDialog.getByRole('heading', { name: '请猫猫吃罐罐' })).toBeVisible();
  await expect(supportDialog.getByText('完全自愿 · 不影响任何功能')).toBeVisible();
  await expect(supportDialog.getByText('支持不会影响抽牌结果，也不会解锁“更准”的解读。')).toBeVisible();
  const paymentQr = supportDialog.getByRole('img', { name: '支付宝收款码：请猫猫吃罐罐' });
  await expect(paymentQr).toBeVisible();
  await expect(paymentQr).toHaveAttribute('src', /support-alipay-qr\.jpg$/);
  await expect(paymentQr).toHaveJSProperty('naturalWidth', 854);
  await expect(paymentQr).toHaveJSProperty('naturalHeight', 1280);
  await expect(supportDialog.getByRole('link', { name: '保存支付宝收款码' }))
    .toHaveAttribute('download', 'miaotarot-alipay-qr.jpg');

  const overflow = await supportDialog.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(supportDialog).toHaveScreenshot('mobile-support-payment.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('窄屏手机上的支持弹窗保持完整且没有横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');

  const mobileSupport = page.getByRole('button', { name: '罐罐', exact: true });
  await expect(mobileSupport).toBeVisible();
  expect(await page.locator('.topNav').evaluate((element) => element.scrollWidth - element.clientWidth))
    .toBeLessThanOrEqual(1);
  await mobileSupport.click();

  const supportDialog = page.getByRole('dialog', { name: '支持 MiaoTarot' });
  await expect(supportDialog).toBeVisible();
  await expect(supportDialog.getByRole('img', { name: '支付宝收款码：请猫猫吃罐罐' })).toBeVisible();
  await expect(supportDialog.getByRole('link', { name: '保存支付宝收款码' })).toBeVisible();
  const verticalBounds = await supportDialog.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { top: bounds.top, bottom: bounds.bottom, viewport: window.innerHeight };
  });
  expect(verticalBounds.top).toBeGreaterThanOrEqual(0);
  expect(verticalBounds.bottom).toBeLessThanOrEqual(verticalBounds.viewport + 1);
  const overflow = await supportDialog.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const trustNotice = supportDialog.getByText('支持不会影响抽牌结果，也不会解锁“更准”的解读。');
  await trustNotice.scrollIntoViewIfNeeded();
  await expect(trustNotice).toBeVisible();
  await expect(supportDialog).toHaveScreenshot('narrow-mobile-support-payment.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('桌面端未抽牌时在首页顶部直接提供支持入口', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.supportPrompt')).toHaveCount(0);
  const topSupport = page.locator('.desktopNavLinks').getByRole('button', { name: '请猫猫吃罐罐' });
  await expect(topSupport).toBeVisible();
  await topSupport.click();

  const supportDialog = page.getByRole('dialog', { name: '支持 MiaoTarot' });
  await expect(supportDialog).toBeVisible();
  await expect(supportDialog.getByRole('img', { name: '支付宝收款码：请猫猫吃罐罐' }))
    .toHaveAttribute('src', /support-alipay-qr\.jpg$/);
  await expect(supportDialog.getByRole('link', { name: '保存支付宝收款码' })).toBeVisible();
});
