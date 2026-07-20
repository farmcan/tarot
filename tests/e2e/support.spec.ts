import { expect, test } from '@playwright/test';

test('移动端在完整解读后自然展示支持入口，并明确标注占位收款码', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: '今日一牌' }).click();
  await expect(page.getByRole('heading', { name: /核心牌是/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: '支持 MiaoTarot' })).toHaveCount(0);

  const supportPrompt = page.locator('.completedReading .supportPrompt');
  await expect(supportPrompt.getByText('这次猫猫有帮到你吗？')).toBeVisible();
  await supportPrompt.getByRole('button', { name: '请猫猫吃个罐头' }).click();

  const supportDialog = page.getByRole('dialog', { name: '支持 MiaoTarot' });
  await expect(supportDialog).toBeVisible();
  await expect(supportDialog.getByText('完全自愿 · 不影响任何功能')).toBeVisible();
  await expect(supportDialog.getByRole('img', { name: 'MiaoTarot 收款码占位图' }))
    .toHaveAttribute('src', /support-qr-placeholder\.svg$/);
  await expect(supportDialog.getByRole('button', { name: '收款入口准备中' })).toBeDisabled();

  const overflow = await supportDialog.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(supportDialog).toHaveScreenshot('mobile-support-placeholder.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('桌面端未抽牌时只在页脚提供低打扰支持入口', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.supportPrompt')).toHaveCount(0);
  const footerSupport = page.locator('.footer').getByRole('button', { name: '支持 MiaoTarot' });
  await expect(footerSupport).toBeVisible();
  await footerSupport.click();

  const supportDialog = page.getByRole('dialog', { name: '支持 MiaoTarot' });
  await expect(supportDialog).toBeVisible();
  await expect(supportDialog.getByRole('button', { name: '收款入口准备中' })).toBeDisabled();
});
