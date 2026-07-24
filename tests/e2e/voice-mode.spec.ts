import { expect, test, type Page } from '@playwright/test';
import { getMiaoChaosAsidePool } from '../../shared/miaoChaosAsides.js';

function createSseBody(content: string, structured: unknown) {
  return [
    `event: meta\ndata: ${JSON.stringify({
      themeId: 'miaotarot',
      mode: 'card_reveal',
      voiceMode: 'chaos',
      model: 'qwen3.7-plus',
    })}\n\n`,
    `event: delta\ndata: ${JSON.stringify({ content })}\n\n`,
    `event: done\ndata: ${JSON.stringify({
      themeId: 'miaotarot',
      mode: 'card_reveal',
      voiceMode: 'chaos',
      model: 'qwen3.7-plus',
      content,
      structured,
    })}\n\n`,
  ].join('');
}

async function openReadingSetup(page: Page) {
  await page.getByRole('button', { name: '和猫猫聊一下' }).click();
  await expect(page.getByRole('dialog', { name: '猫咪塔罗抽牌流程' })).toBeVisible();
}

async function chooseSingleCard(page: Page) {
  await page.getByRole('button', { name: /3 张牌 ·/ }).click();
  const singleCardRadio = page.getByRole('radio', { name: '1', exact: true });
  const radioId = await singleCardRadio.getAttribute('id');
  if (!radioId) throw new Error('Single-card control should have an associated label');
  await page.locator(`label[for="${radioId}"]`).click();
  await expect(singleCardRadio).toBeChecked();
}

test('320px 默认正常模式，可切到发疯模式且不会横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/?voice=normal');
  await openReadingSetup(page);

  const normalMode = page.getByRole('radio', { name: /正常模式/ });
  const chaosMode = page.getByRole('radio', { name: /发疯模式/ });
  await expect(normalMode).toHaveAttribute('aria-checked', 'true');
  await expect(chaosMode).toHaveAttribute('aria-checked', 'false');

  await chaosMode.click();
  await expect(chaosMode).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('switch', { name: '和 Miao 边翻边聊' })).toBeChecked();
  await expect(page.getByRole('button', { name: '我到底在等时机，还是在给拖延续费？' })).toBeVisible();
  await expect(page.getByText('猫可以发疯，牌义和现实边界不能发疯。')).toBeVisible();

  expect(await page.locator('.readingDesk').evaluate((element) => (
    element.scrollWidth - element.clientWidth
  ))).toBeLessThanOrEqual(1);
  await expect(page.locator('.voiceModePicker')).toHaveScreenshot('voice-mode-picker-320.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('390px 发疯模式贯穿真实翻牌与 AI 请求', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Math.random = () => 0.42;
  });

  const requests: Array<Record<string, unknown>> = [];

  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          configured: true,
          available: true,
          turnstileRequired: false,
          model: 'qwen3.7-plus',
          interactionModes: ['reading', 'focus', 'card_reveal', 'follow_up'],
          voiceModes: ['normal', 'chaos'],
          streaming: true,
        }),
      });
      return;
    }
    const body = route.request().postDataJSON() as Record<string, unknown> & {
      cardIndex: number;
      payload: {
        cards: Array<{
        tarotCard: string;
        tarotKeyword: string;
        orientation: string;
      }>;
      };
    };
    requests.push(body);
    const card = body.payload.cards[body.cardIndex];
    const fixedAside = getMiaoChaosAsidePool(card.tarotCard, card.orientation)[0]?.text;
    if (!fixedAside) throw new Error(`Missing fixed chaos aside for ${card.tarotCard}${card.orientation}`);
    const structured = {
      miaoAside: fixedAside,
      reply: `全体起立！“再等等”正在申请成为年度战略。${card.tarotCard}提醒：今天先做一个能验证的动作。`,
      reflectionQuestion: null,
      actions: ['写下今天能验证的一步'],
      cardEvidence: {
        traditional: `${card.tarotCard}保留当前正逆位的标准牌义。`,
        context: '它把问题拉回已经掌握的工具和行动。',
        boundary: '牌面不能确认外部结果，仍需现实反馈。',
        alternative: '也可能提醒先检查现有条件是否真的够用。',
      },
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: createSseBody(content, structured),
    });
  });
  await page.route('**/api/conversations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, retentionDays: 30 }),
    });
  });

  await page.goto('/?voice=chaos&q=%E6%88%91%E5%88%B0%E5%BA%95%E5%9C%A8%E7%AD%89%E6%97%B6%E6%9C%BA%EF%BC%8C%E8%BF%98%E6%98%AF%E5%9C%A8%E7%BB%99%E6%8B%96%E5%BB%B6%E7%BB%AD%E8%B4%B9%EF%BC%9F');
  await openReadingSetup(page);
  await expect(page.getByRole('radio', { name: /发疯模式/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('textbox', { name: '你的问题' }))
    .toHaveValue('我到底在等时机，还是在给拖延续费？');
  await chooseSingleCard(page);
  await page.getByRole('button', { name: '开始和 Miao 看牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  await page.getByRole('button', { name: '翻第一张' }).click();

  const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
  await expect(aiPanel.getByText('发疯模式', { exact: true })).toBeVisible();
  await expect(aiPanel.getByTestId('miao-aside')).toBeVisible();
  expect(requests).toHaveLength(1);
  const revealedCard = (
    requests[0].payload as {
      cards: Array<{ tarotCard: string; orientation: string }>;
    }
  ).cards[0];
  const expectedFixedAside = getMiaoChaosAsidePool(
    revealedCard.tarotCard,
    revealedCard.orientation,
  )[0].text;
  await expect(aiPanel.getByTestId('miao-aside')).toContainText(expectedFixedAside);
  await expect(aiPanel.getByText(/“再等等”正在申请成为年度战略/)).toBeVisible();
  expect(requests[0].voiceMode).toBe('chaos');
  expect(requests[0].mode).toBe('card_reveal');
  await expect(aiPanel.locator('.aiCardRevealMessage')).toHaveScreenshot('chaos-card-reveal-390.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});
