import { expect, type Page } from '@playwright/test';

export async function checkMiaoFamilyLinks(page: Page, width: number, screenshotPath: string) {
  await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
  await page.goto('/?analytics=internal', { waitUntil: 'domcontentloaded' });
  const links = page.getByRole('navigation', { name: '其他猫猫小玩具' });
  await links.scrollIntoViewIfNeeded();
  await expect(links).toBeVisible();
  await expect(links.getByRole('link')).toHaveCount(2);
  const destinations = [
    ['MiaoTI', 'https://miaoti-dmv.pages.dev/v1/?utm_source=miaotarot&utm_medium=referral&utm_campaign=miao-family'],
    ['Miao Beat', 'https://miao-beat.pages.dev/?utm_source=miaotarot&utm_medium=referral&utm_campaign=miao-family'],
  ];
  for (const [name, destination] of destinations) {
    const link = links.getByRole('link', { name: new RegExp(name) });
    await expect(link).toHaveAttribute('href', destination);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
    const bounds = await link.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    const opened = page.waitForEvent('popup');
    await link.tap();
    const popup = await opened;
    await popup.waitForLoadState('domcontentloaded');
    expect(popup.url()).toBe(destination);
    await popup.close();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await links.screenshot({ path: screenshotPath });
  await expect(page.getByRole('button', { name: '罐罐', exact: true })).toBeVisible();
}
