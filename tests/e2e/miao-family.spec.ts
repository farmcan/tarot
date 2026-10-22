import { test } from '@playwright/test';
import { checkMiaoFamilyLinks } from '../helpers/miao-family';

for (const width of [320, 390]) {
  test(`首页 ${width}px 猫猫互链可轻触打开并保留支持入口`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await checkMiaoFamilyLinks(page, width, testInfo.outputPath(`miao-family-${width}.png`));
    await context.close();
  });
}
