import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    readingDesk: document.querySelector<HTMLElement>('.readingDesk')?.scrollWidth ?? 0,
    readingDeskViewport: document.querySelector<HTMLElement>('.readingDesk')?.clientWidth ?? 0,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.readingDesk).toBeLessThanOrEqual(dimensions.readingDeskViewport + 1);
}

async function expectQuestionAboveStickyAction(page: Page) {
  const readingDesk = page.locator('.readingDesk');
  const question = page.getByRole('textbox', { name: '你的问题' });
  const stickyAction = page.locator('.readyStage .shuffleActionRow');
  expect(await readingDesk.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await question.isVisible()).toBe(true);
  const questionBounds = await question.boundingBox();
  const actionBounds = await stickyAction.boundingBox();
  expect(questionBounds).not.toBeNull();
  expect(actionBounds).not.toBeNull();
  expect(questionBounds!.y + questionBounds!.height)
    .toBeLessThanOrEqual(actionBounds!.y + 1);
  expect(questionBounds!.y + questionBounds!.height)
    .toBeLessThanOrEqual(page.viewportSize()!.height);
}

test('线上 320px 抖音问题入口真实打开且浏览器返回可退出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });

  await page.goto(
    '/?analytics=internal&mt_channel=douyin&mt_campaign=hot-ginger-v2',
    { waitUntil: 'domcontentloaded' },
  );

  const dialog = page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: '你的问题' }))
    .toHaveValue('生姜伪装成土豆接近我，到底图什么？');
  await expect(page.getByRole('radio', { name: /发疯模式/ }))
    .toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: '开始和 Miao 看牌' })).toBeVisible();
  await expect(page.locator('.cutPileButton')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await expectQuestionAboveStickyAction(page);

  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: '和猫猫聊一下' })).toBeVisible();
});

test('线上 390px B 站产品入口使用正常模式且问题仍可编辑', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    '/?analytics=internal&mt_channel=bilibili&mt_campaign=product-tour-v1',
    { waitUntil: 'domcontentloaded' },
  );

  const question = page.getByRole('textbox', { name: '你的问题' });
  await expect(page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' })).toBeVisible();
  await expect(question).toHaveValue('我今天最需要看见什么？');
  await expect(page.getByRole('radio', { name: /正常模式/ }))
    .toHaveAttribute('aria-checked', 'true');
  await question.fill('线上入口里的问题仍然由我决定');
  await expect(question).toHaveValue('线上入口里的问题仍然由我决定');
  await expect(page.getByRole('button', { name: '带着问题去洗牌' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
