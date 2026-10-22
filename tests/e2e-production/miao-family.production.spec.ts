import { test } from '@playwright/test';
import { checkMiaoFamilyLinks } from '../helpers/miao-family';

for (const width of [320, 390]) {
  test(`线上 ${width}px 首页猫猫互链真实打开`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ baseURL: process.env.TAROT_PRODUCTION_ORIGIN, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await checkMiaoFamilyLinks(page, width, testInfo.outputPath(`production-miao-family-${width}.png`));
    await context.close();
  });
}
