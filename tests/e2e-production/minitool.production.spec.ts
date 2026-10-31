import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`线上 ${viewport.width}px 小样可从场景完成抽牌、查看依据并生成私密结果图`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/minitool.html');
    await expect(page.getByRole('heading', { name: '今天，想让猫陪你看什么？' })).toBeVisible();
    await page.getByRole('button', { name: '♡ 关系卡住了 看清自己的需要与边界' }).click();
    await page.getByLabel('也可以写下来（可跳过）').fill('仅用于线上验收的虚构问题');
    await page.getByRole('button', { name: '选一张猫牌', exact: true }).click();
    await page.getByRole('button', { name: '选择第 2 张猫牌', exact: true }).click();
    await page.getByRole('button', { name: '翻开我的猫牌' }).click();
    await expect(page.getByRole('heading', { name: '今天，可以先做这一小步' })).toBeVisible();
    await expect(page.locator('.card-face img')).toHaveJSProperty('naturalWidth', 510);
    await page.getByText('这张牌的标准依据', { exact: true }).click();
    await expect(page.locator('.meaning details')).toHaveAttribute('open', '');
    const cardName = await page.locator('.card-face strong').innerText();
    expect((await page.locator('.card-face').boundingBox())!.width).toBeGreaterThanOrEqual(270);
    await page.getByRole('button', { name: '把这张猫牌带走' }).click();
    await expect(page.getByRole('img', { name: '猫咪状态卡分享图片预览' })).toBeVisible();
    await expect(page.getByText('图片只带牌面和结果，不含你写下的问题。')).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '保存图片', exact: true }).click();
    expect((await download).suggestedFilename()).toBe('miaotarot.png');
    await page.reload();
    await page.getByRole('button', { name: '回看上次的猫牌' }).click();
    await expect(page.locator('.card-face strong')).toHaveText(cardName);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}
