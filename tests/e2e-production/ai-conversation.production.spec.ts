import { expect, test } from '@playwright/test';

const productionQuestion = '我这周该先推进手头工作，还是先留时间准备下一步？';

test('线上手机端首张翻牌完成真实 Miao 流式对话、刷新恢复与 D1 备份删除', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  await page.goto('/?analytics=internal');
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await page.getByRole('textbox', { name: '你的问题' }).fill(productionQuestion);
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
  await expect(aiPanel.getByText('Miao 正在说', { exact: true })).toHaveCount(0, { timeout: 45_000 });
  await expect(aiPanel.getByRole('button', { name: '翻下一张' })).toBeVisible();
  await expect(page.locator('#reading-result')).toHaveCount(0);
  const avatarSource = await aiPanel.locator('.miaoGuideAvatar img').first().getAttribute('src');

  const followUpInput = aiPanel.getByRole('textbox', { name: '你的追问' });
  await followUpInput.fill('结合这张牌，我这周先确认哪一项现实条件？');
  await aiPanel.getByRole('button', { name: '发送追问' }).click();
  await expect(aiPanel.locator('.aiConversationTurn')).toHaveCount(1, { timeout: 45_000 });
  await expect(aiPanel.locator('.aiMessage.isAssistant').last()).not.toBeEmpty();
  await expect(followUpInput).toHaveValue('');

  await page.reload();
  await page.getByRole('tab', { name: 'Miao 语解读', exact: true }).click();
  const restoredPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(restoredPanel.locator('.aiConversationTurn')).toHaveCount(1);
  await expect(restoredPanel.locator('.miaoGuideAvatar img').first()).toHaveAttribute('src', avatarSource || '');

  const cloudSwitch = restoredPanel.getByRole('switch', { name: '云端备份对话' });
  await expect(cloudSwitch).toBeEnabled({ timeout: 15_000 });
  await cloudSwitch.click();
  await expect(cloudSwitch).toBeChecked();
  await expect(restoredPanel.getByText(/已备份到 MiaoTarot 云端/)).toBeVisible({ timeout: 15_000 });

  await page.screenshot({
    path: 'artifacts/production-miao-streaming-conversation-2026-07-23.png',
    fullPage: true,
    animations: 'disabled',
  });

  await restoredPanel.getByRole('button', { name: '删除本地和云端对话' }).click();
  await expect(restoredPanel.locator('.aiCardRevealMessage')).toHaveCount(0);
  await expect(restoredPanel.getByTestId('ai-opening-question')).toContainText(productionQuestion);
  await expect(restoredPanel.getByRole('button', { name: '翻下一张' })).toBeVisible();
});
