import { expect, test } from '@playwright/test';

const productionQuestion = '我这周该先推进手头工作，还是先留时间准备下一步？';

for (const width of [320, 390]) test(`线上 ${width}px 真实 AI 解牌与追问有分析和场景`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  await page.goto('/?analytics=internal');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(productionQuestion);
  const advancedToggle = page.getByRole('button', { name: /一张牌 ·/ });
  await advancedToggle.click();
  const threeCardRadio = page.getByRole('radio', { name: '3', exact: true });
  const threeCardRadioId = await threeCardRadio.getAttribute('id');
  if (!threeCardRadioId) throw new Error('Three-card control should have an associated label');
  await page.locator(`label[for="${threeCardRadioId}"]`).click();
  await expect(threeCardRadio).toBeChecked();
  await page.locator('label[for="miao-ai-conversation-toggle"]').click();
  await expect(page.getByRole('switch', { name: '和 Miao 边翻边聊' })).toBeChecked();
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(aiPanel.getByTestId('ai-opening-question')).toContainText(productionQuestion);
  await expect(aiPanel.locator('.aiConversationLog > *').first()).toHaveAttribute(
    'data-testid',
    'ai-opening-question',
  );
  await aiPanel.getByRole('button', { name: '翻第一张' }).click();
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveCount(1, { timeout: 45_000 });
  await expect(aiPanel.locator('.aiCardInterpretation.isLoading'))
    .toHaveCount(0, { timeout: 45_000 });
  await expect(aiPanel.getByRole('button', { name: '翻下一张' }))
    .toBeVisible({ timeout: 45_000 });
  await expect(page.locator('#reading-result')).toHaveCount(0);
  const cardReply = aiPanel.locator('.aiCardInterpretation .miaoStreamingText').first();
  expect((await cardReply.innerText()).length).toBeGreaterThan(200);
  expect(await cardReply.innerText()).toMatch(/如果|假设|比如|例如/);
  await cardReply.screenshot({ path: `artifacts/ai-depth-2026-11-16/card-${width}.png` });

  const followUpInput = aiPanel.getByRole('textbox', { name: '你的追问' });
  await followUpInput.fill('结合这张牌，我这周先确认哪一项现实条件？请展开分析，并举个具体的假设例子。');
  await aiPanel.getByRole('button', { name: '发送追问' }).click();
  const followUpTurn = aiPanel.locator('.aiConversationTurn');
  await expect(followUpTurn).toHaveCount(1, { timeout: 45_000 });
  await expect(followUpTurn.getByText('Miao 正在说', { exact: true }))
    .toHaveCount(0, { timeout: 45_000 });
  await expect(followUpTurn.locator('.miaoStreamingText'))
    .not.toHaveText('正在沿着这副牌整理……');
  await expect(followUpInput).toHaveValue('');
  await expect.poll(async () => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('miaotarot:ai-conversations:v1') || 'null') as {
      entries?: Array<{ turns?: Array<{ assistantContent?: string }> }>;
    } | null;
    return stored?.entries?.[0]?.turns?.[0]?.assistantContent?.length || 0;
  })).toBeGreaterThan(0);

  const reply = followUpTurn.locator('.miaoStreamingText');
  expect((await reply.innerText()).length).toBeGreaterThan(250);
  expect(await reply.innerText()).toMatch(/如果|假设|比如|例如/);
  await expect(aiPanel.getByText('回复已保留；格式或连接没有完整收束。', { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await reply.screenshot({ path: `artifacts/ai-depth-2026-11-16/follow-up-${width}.png` });
  const completedReply = await reply.innerText();
  const completedCard = await cardReply.innerText();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `artifacts/ai-depth-2026-11-16/journey-${width}.png`, fullPage: true });
  console.log(JSON.stringify({ width, cardLength: completedCard.length, followUpLength: completedReply.length }));
  await page.reload();
  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  await expect(page.locator('.aiConversationTurn .miaoStreamingText')).toHaveText(completedReply);
});
