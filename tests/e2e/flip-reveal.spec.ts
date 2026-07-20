import { expect, test } from '@playwright/test';

test('移动端翻完最后一张牌后停留在牌面，并展示完整结果入口', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });
  await page.goto('/');

  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('button', { name: /3 张牌 ·/ }).click();

  const singleCardRadio = page.getByRole('radio', { name: '1', exact: true });
  const radioId = await singleCardRadio.getAttribute('id');
  if (!radioId) throw new Error('Single-card control should have an associated label');
  await page.locator(`label[for="${radioId}"]`).click();

  await page.getByRole('button', { name: '带着问题去洗牌' }).click();
  const firstHiddenCard = page.getByRole('button', { name: /背面猫牌/ }).first();
  await expect(firstHiddenCard).toBeVisible();
  await firstHiddenCard.click();
  await page.getByRole('button', { name: '把 1 张猫牌放上桌' }).click();

  const readingDesk = page.locator('.readingDesk');
  const flipCard = page.locator('.flipCardButton').first();
  await expect(flipCard).toBeVisible();

  await flipCard.click();
  await expect(flipCard).not.toHaveAttribute('aria-label', /点击翻牌/);
  await expect(page.locator('#reading-result')).toBeVisible();
  await page.waitForTimeout(900);

  expect(await flipCard.evaluate((card, desk) => {
    const cardBounds = card.getBoundingClientRect();
    const deskBounds = (desk as HTMLElement).getBoundingClientRect();
    return cardBounds.top >= deskBounds.top && cardBounds.bottom <= deskBounds.bottom;
  }, await readingDesk.elementHandle())).toBe(true);

  await expect(page).toHaveScreenshot('mobile-final-card-remains-visible.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});
