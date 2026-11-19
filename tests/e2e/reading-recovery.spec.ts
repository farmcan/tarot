import { expect, test, type Page } from '@playwright/test';

async function mockAi(page: Page) {
  await page.route('**/api/readings/analyze', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { configured: true, available: true, turnstileRequired: false } });
      return;
    }
    const body = route.request().postDataJSON();
    const structured = body.mode === 'focus' ? {
      acknowledgement: '先把两条路的现实条件分开。',
      focus: '眼前可以验证的条件',
      alternativeFocus: '当前最需要保留的边界',
    } : {
      reply: `围绕「${body.payload.question}」，先留意今天可以验证的一件小事。`,
      reflectionQuestion: null,
      actions: [],
      cardEvidence: {
        traditional: '保留这张牌的标准牌义。',
        context: '先留意问题中可以验证的一件小事。',
        boundary: '牌面不能替你确认现实中的事实。',
        alternative: '也可以先为自己保留一点余地。',
      },
    };
    const content = JSON.stringify(structured);
    await route.fulfill({
      contentType: 'text/event-stream',
      body: `event: delta\ndata: ${JSON.stringify({ content })}\n\nevent: done\ndata: ${JSON.stringify({
        themeId: 'miaotarot', mode: body.mode || 'card_reveal', model: 'test', content, structured,
      })}\n\n`,
    });
  });
  await page.route('**/api/conversations*', route => route.fulfill({ json: { available: false } }));
}

async function openDesk(page: Page) {
  await page.getByRole('button', { name: /^(和猫猫聊一下|开始抽牌|继续看刚才的结果)$/ }).click();
}

async function startReading(page: Page, question: string, ai: boolean) {
  await page.getByRole('textbox', { name: '你的问题', exact: true }).fill(question);
  const aiToggle = page.getByRole('switch', { name: '和 Miao 边翻边聊' });
  if (await aiToggle.isChecked() !== ai) {
    await page.locator('label[for="miao-ai-conversation-toggle"]').click();
  }
  await page.getByRole('button', { name: ai ? '开始和 Miao 看牌' : '带着问题去洗牌' }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌' }).click();
  if (ai) {
    await page.getByRole('button', { name: '翻第一张', exact: true }).click();
    await page.getByRole('button', { name: '看解读', exact: true }).click();
    await expect(page.getByTestId('ai-opening-question')).toContainText(question);
    await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${question}」`);
  } else {
    await page.locator('.flipCardButton').click();
    await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
  }
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`${viewport.width}px 历史阅读保留原对话身份，改问题与切换后刷新仍回到选中的结果`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => { Math.random = () => 0.42; });
    await mockAi(page);
    await page.goto('/');
    await openDesk(page);
    await startReading(page, '测试：今天先整理哪件小事？', true);
    const aiPanel = page.getByRole('tabpanel', { name: 'Miao 语解读' });
    await aiPanel.getByText('对话设置与保存', { exact: true }).click();
    await aiPanel.getByRole('button', { name: '修改问题', exact: true }).click();
    const editedQuestion = '测试：今天先整理书桌还是书架？';
    await aiPanel.getByRole('textbox', { name: '新的问题' }).fill(editedQuestion);
    await aiPanel.getByRole('button', { name: '保留这副牌，重开 Miao 对话' }).click();
    await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${editedQuestion}」`);

    await page.reload();
    await openDesk(page);
    await expect(page.getByTestId('ai-opening-question')).toContainText(editedQuestion);
    const firstCard = await page.locator('.aiCardFocusStage img').first().getAttribute('src');
    await page.getByRole('button', { name: '换问题重来', exact: true }).click();
    await startReading(page, '测试：明天先做哪件小事？', false);

    await page.reload();
    await page.getByRole('button', { name: /最近记录/ }).click();
    await expect(page.getByRole('dialog', { name: '最近的阅读' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: '最近的阅读' })).toHaveScreenshot(`mobile-history-${viewport.width}.png`, {
      animations: 'disabled',
    });
    await page.locator('.historyItem').filter({ hasText: editedQuestion }).click();
    await expect(page.getByTestId('ai-opening-question')).toContainText(editedQuestion);
    await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${editedQuestion}」`);
    await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'complete');
    if (firstCard) await expect(page.locator('.aiCardFocusStage img').first()).toHaveAttribute('src', firstCard);
    await expect(page.getByTestId('ai-opening-question')).toBeInViewport();
    await page.screenshot({ path: `artifacts/mobile-history-restored-${viewport.width}.png` });

    await page.reload();
    await openDesk(page);
    await expect(page.getByTestId('ai-opening-question')).toContainText(editedQuestion);
    await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${editedQuestion}」`);
  });

  test(`${viewport.width}px 今日一牌刷新后可以直接继续查看`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: '今日一牌', exact: true }).click();
    await expect(page.locator('#reading-result')).toBeVisible();
    const result = await page.locator('#reading-result').getByRole('heading', { name: /核心牌是/ }).textContent();
    await page.reload();
    await page.getByRole('button', { name: '继续看刚才的结果', exact: true }).click();
    await expect(page.locator('#reading-result').getByRole('heading', { name: /核心牌是/ })).toHaveText(result || '');
    await expect(page.getByRole('button', { name: '分享这次阅读', exact: true })).toBeEnabled();
  });

  test(`${viewport.width}px 浏览器写入失败时保留阅读并准确提示不能刷新恢复`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'QuotaExceededError'); };
    });
    await mockAi(page);
    await page.goto('/');
    await openDesk(page);
    await startReading(page, '测试：今天可以先做什么？', true);
    const settings = page.locator('.aiSettingsDetails');
    if (await settings.getAttribute('open') === null) await settings.locator('summary').click();
    await expect(page.locator('.conversationStorageControls')).toContainText('浏览器未能保存这次对话');
    await page.locator('.conversationStorageControls').screenshot({ path: `artifacts/mobile-storage-warning-${viewport.width}.png` });
    await expect(page.locator('.aiFollowUpForm')).toContainText('尚未保存，刷新后可能丢失');
    await expect(page.getByText('浏览器未能保存这次阅读，刷新后可能丢失。结果仍可查看，请先保存图片。', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '分享这次阅读', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '分享这次阅读' })).toBeVisible();
  });

  test(`${viewport.width}px 手机记录清空可取消，确认后刷新不恢复列表且保留当前结果`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: '今日一牌', exact: true }).click();
    await page.getByRole('button', { name: '关闭抽牌', exact: true }).click();
    await page.getByRole('button', { name: /最近记录/ }).click();
    const history = page.getByRole('dialog', { name: '最近的阅读' });
    await history.getByRole('button', { name: '清空', exact: true }).click();
    await expect(history).toContainText('当前正在看的结果会保留到你重来');
    await history.getByRole('button', { name: '取消', exact: true }).click();
    await expect(history.locator('.historyItem')).toHaveCount(1);
    await history.getByRole('button', { name: '清空', exact: true }).click();
    await history.getByRole('button', { name: '确认清空', exact: true }).click();
    await expect(history.locator('.historyItem')).toHaveCount(0);
    await expect(history).toContainText('这里还没有阅读记录。');
    await history.screenshot({ path: `artifacts/mobile-history-cleared-${viewport.width}.png` });
    await page.reload();
    await expect(page.getByRole('button', { name: /最近记录/ })).toHaveCount(0);
    await openDesk(page);
    await expect(page.locator('#reading-result')).toBeVisible();
  });
}

test('390px 删除对话写入失败时明确报错，原对话仍可阅读且刷新后仍在', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAi(page);
  await page.goto('/');
  await openDesk(page);
  const question = '测试：删除失败时仍保留的原问题';
  await startReading(page, question, true);
  await page.getByText('对话设置与保存', { exact: true }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'miaotarot:ai-conversations:v1') throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: '删除本地对话', exact: true }).click();
  await expect(page.getByText('浏览器未能删除本地对话，原记录仍保留。请重试；当前阅读不会消失。', { exact: true })).toBeVisible();
  await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${question}」`);
  await page.reload();
  await openDesk(page);
  await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${question}」`);
});

test('390px 清空记录时remove失败明确报告部分完成，并保留重试入口', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '今日一牌', exact: true }).click();
  const action = page.locator('#reading-result').getByTestId('reading-action-control');
  const remember = action.getByRole('button', { name: '记住这一步', exact: true });
  if (await remember.count()) await remember.click();
  else await action.locator('.readingActionCandidates').getByRole('button').first().click();
  await action.getByRole('textbox', { name: '你想带走哪一步？' }).fill('测试：清空失败仍保留的行动');
  await action.getByRole('button', { name: '保存这一步', exact: true }).click();
  await expect(action).toContainText('已记住');
  await page.evaluate(() => {
    Storage.prototype.removeItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.getByRole('button', { name: '关闭抽牌', exact: true }).click();
  await page.getByRole('button', { name: /最近记录/ }).click();
  const history = page.getByRole('dialog', { name: '最近的阅读' });
  await history.getByRole('button', { name: '清空', exact: true }).click();
  await history.getByRole('button', { name: '确认清空', exact: true }).click();
  await expect(history).toContainText('阅读列表已清空，但保存的小动作未能删除。请重试。');
  await expect(history.getByRole('button', { name: '确认清空', exact: true })).toBeVisible();
  await expect(history.locator('.historyItem')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: /最近记录/ }).click();
  await expect(page.getByRole('dialog', { name: '最近的阅读' })).toContainText('阅读列表为空，仍有保存的小动作；可以继续清空。');
});

test('390px 逐牌云备份在无基础报告时补全本地半条回复，读取期间不会提前覆盖云端', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAi(page);
  let snapshot: Record<string, unknown> | null = null;
  let recovering = false;
  let cloudReadCompleted = false;
  let overwrittenWhileReading = false;
  await page.route('**/api/conversations*', async route => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET' && !url.searchParams.has('id')) {
      await route.fulfill({ json: { available: true, retentionDays: 30 } });
    } else if (route.request().method() === 'GET') {
      const savedSnapshot = structuredClone(snapshot);
      await new Promise(resolve => setTimeout(resolve, 1200));
      cloudReadCompleted = true;
      await route.fulfill({ json: { snapshot: savedSnapshot, expiresAt: '2030-01-01T00:00:00Z' } });
    } else if (route.request().method() === 'POST') {
      if (recovering && !cloudReadCompleted) overwrittenWhileReading = true;
      snapshot = route.request().postDataJSON().snapshot;
      await route.fulfill({ json: { saved: true, retentionDays: 30, expiresAt: '2030-01-01T00:00:00Z' } });
    } else await route.fulfill({ json: { deleted: true } });
  });
  await page.goto('/');
  await openDesk(page);
  const question = '测试：云端恢复今天的一小步';
  await startReading(page, question, true);
  await page.getByText('对话设置与保存', { exact: true }).click();
  const backup = page.getByRole('switch', { name: '云端备份对话' });
  const id = await backup.getAttribute('id');
  await page.locator(`label[for="${id}"]`).click();
  await expect(page.getByText(/已备份到 MiaoTarot 云端/)).toBeVisible();
  expect(snapshot?.baseContent).toBe('');
  await page.evaluate(() => {
    const key = 'miaotarot:ai-conversations:v1';
    const local = JSON.parse(localStorage.getItem(key)!);
    local.entries[0].cardMessages[0].assistantContent = local.entries[0].cardMessages[0].assistantContent.slice(0, 5);
    local.entries[0].cardMessages[0].result = null;
    local.entries[0].cardMessages[0].status = 'incomplete';
    localStorage.setItem(key, JSON.stringify(local));
  });
  recovering = true;
  await page.reload();
  await openDesk(page);
  await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${question}」`);
  expect(cloudReadCompleted).toBe(true);
  expect(overwrittenWhileReading).toBe(false);
  await expect(page.getByText('回复已保留；格式或连接没有完整收束。', { exact: true })).toHaveCount(0);
  await page.locator('.aiCardInterpretation').screenshot({ path: 'artifacts/mobile-cloud-recovery-390.png' });
});

test('390px 云端删除等待已发备份写入完成，延迟写入不能在删除后复活对话', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAi(page);
  let beginWrite!: () => void;
  let releaseWrite!: () => void;
  const writeStarted = new Promise<void>(resolve => { beginWrite = resolve; });
  const writeGate = new Promise<void>(resolve => { releaseWrite = resolve; });
  const operations: string[] = [];
  let cloudRecord: unknown = null;
  let deleteStarted = false;
  let deleteCompleted = false;
  await page.route('**/api/conversations*', async route => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ json: { available: true, retentionDays: 30 } });
    } else if (method === 'POST') {
      beginWrite();
      const payload = route.request().postDataJSON();
      await writeGate;
      cloudRecord = payload.snapshot;
      operations.push('write-complete');
      await route.fulfill({ json: { saved: true, retentionDays: 30 } }).catch(() => {});
    } else if (method === 'DELETE') {
      deleteStarted = true;
      await new Promise(resolve => setTimeout(resolve, 100));
      cloudRecord = null;
      operations.push('delete-complete');
      deleteCompleted = true;
      await route.fulfill({ json: { deleted: true } });
    }
  });
  await page.goto('/');
  await openDesk(page);
  await startReading(page, '测试：延迟备份删除不复活', true);
  await page.getByText('对话设置与保存', { exact: true }).click();
  const backup = page.getByRole('switch', { name: '云端备份对话' });
  await page.locator(`label[for="${await backup.getAttribute('id')}"]`).click();
  await writeStarted;
  await page.getByRole('button', { name: '删除本地和云端对话', exact: true }).click();
  // Let the intentionally faster DELETE finish if the implementation failed
  // to fence it behind the in-flight write.
  await new Promise(resolve => setTimeout(resolve, 200));
  const deleteOvertookWrite = deleteStarted;
  releaseWrite();
  await expect.poll(() => deleteCompleted).toBe(true);
  await expect.poll(() => operations.length).toBe(2);
  expect(deleteOvertookWrite).toBe(false);
  expect(operations).toEqual(['write-complete', 'delete-complete']);
  expect(cloudRecord).toBeNull();
  await expect(page.locator('.aiCardInterpretation')).toHaveCount(0);
});

test('390px 删除期间取消尚未发出的备份定时器', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAi(page);
  let writes = 0;
  let deletionCompleted = false;
  await page.route('**/api/conversations*', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { available: true, retentionDays: 30 } });
    } else if (route.request().method() === 'POST') {
      writes += 1;
      await route.fulfill({ json: { saved: true, retentionDays: 30 } });
    } else {
      // Keep deletion in progress beyond the normal 700ms backup debounce.
      await new Promise(resolve => setTimeout(resolve, 1100));
      deletionCompleted = true;
      await route.fulfill({ json: { deleted: true } });
    }
  });
  await page.goto('/');
  await openDesk(page);
  await startReading(page, '测试：未发备份取消', true);
  await page.getByText('对话设置与保存', { exact: true }).click();
  const backup = page.getByRole('switch', { name: '云端备份对话' });
  await page.locator(`label[for="${await backup.getAttribute('id')}"]`).click();
  await page.getByRole('button', { name: '删除本地和云端对话', exact: true }).click();
  await expect.poll(() => deletionCompleted).toBe(true);
  await expect(page.locator('.aiCardInterpretation')).toHaveCount(0);
  expect(writes).toBe(0);
});

test('390px 云删除失败保留本地对话并暂停备份，用户可以明确重试', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAi(page);
  let writes = 0;
  await page.route('**/api/conversations*', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { available: true, retentionDays: 30 } });
    } else if (route.request().method() === 'POST') {
      writes += 1;
      await route.fulfill({ json: { saved: true, retentionDays: 30 } });
    } else await route.fulfill({ status: 503, json: { error: 'unavailable' } });
  });
  await page.goto('/');
  await openDesk(page);
  const question = '测试：云删除失败仍保留';
  await startReading(page, question, true);
  await page.getByText('对话设置与保存', { exact: true }).click();
  const backup = page.getByRole('switch', { name: '云端备份对话' });
  await page.locator(`label[for="${await backup.getAttribute('id')}"]`).click();
  await expect(page.getByText(/已备份到 MiaoTarot 云端/)).toBeVisible();
  await page.getByRole('button', { name: '删除本地和云端对话', exact: true }).click();
  await expect(page.getByText('云端对话未能删除，本地副本已保留。请重试。', { exact: true })).toBeVisible();
  await expect(backup).not.toBeChecked();
  const writesAfterFailure = writes;
  // Any incorrectly resumed backup would fire inside this interval.
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(writes).toBe(writesAfterFailure);
  await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${question}」`);
  await expect(page.getByRole('button', { name: '删除本地和云端对话', exact: true })).toBeEnabled();
  await page.reload();
  await openDesk(page);
  await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${question}」`);
  const settings = page.locator('.aiSettingsDetails');
  if (await settings.getAttribute('open') === null) await settings.locator('summary').click();
  await expect(backup).not.toBeChecked();
});

for (const width of [320, 390]) {
  test(`${width}px 发疯模式删除后刷新不自动重建，主动重新解读才沿用原牌发送`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockAi(page);
    let requests = 0;
    page.on('request', request => {
      if (request.url().includes('/api/readings/analyze') && request.method() === 'POST') requests += 1;
    });
    await page.goto('/');
    await openDesk(page);
    await page.getByRole('button', { name: /一张牌 ·/ }).click();
    await page.getByRole('radio', { name: /发疯模式/ }).click();
    const question = '测试：删除后不应自动再次发送的问题';
    await startReading(page, question, true);
    const originalCard = await page.locator('.aiCardFocusStage img').first().getAttribute('src');
    await page.getByText('对话设置与保存', { exact: true }).click();
    await page.getByRole('button', { name: '删除本地对话', exact: true }).click();
    await expect(page.locator('.aiCardInterpretation')).toHaveCount(0);
    const deletionMetadata = await page.evaluate(() => localStorage.getItem('miaotarot:ai-conversations:v1'));
    expect(deletionMetadata).not.toContain(question);
    expect(deletionMetadata).not.toContain('accessKey');
    const beforeReload = requests;
    await page.reload();
    await openDesk(page);
    // The service responds immediately: any unsuppressed automatic re-read
    // would already have issued a POST inside this observation window.
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(requests).toBe(beforeReload);
    await expect(page.getByRole('button', { name: '重新解读这副牌', exact: true })).toBeVisible();
    expect((await page.getByRole('button', { name: '重新解读这副牌', exact: true }).boundingBox())!.height)
      .toBeGreaterThanOrEqual(44);
    await page.locator('.aiSettingsColumn').screenshot({ path: `artifacts/deleted-ai-paused-${width}.png` });
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Object.defineProperty(window, '__restoreConversationWrites', {
        configurable: true, value: () => { Storage.prototype.setItem = original; },
      });
      Storage.prototype.setItem = function (key, value) {
        if (key === 'miaotarot:ai-conversations:v1') throw new DOMException('Blocked', 'SecurityError');
        return original.call(this, key, value);
      };
    });
    await page.getByRole('button', { name: '重新解读这副牌', exact: true }).click();
    await expect(page.getByText('浏览器未能保存重新解读的选择，自动解读仍暂停。请重试。', { exact: true })).toBeVisible();
    expect(requests).toBe(beforeReload);
    await page.evaluate(() => {
      (window as typeof window & { __restoreConversationWrites: () => void }).__restoreConversationWrites();
    });
    await page.getByRole('button', { name: '重新解读这副牌', exact: true }).click();
    await expect(page.locator('.aiCardInterpretation')).toContainText(`围绕「${question}」`);
    await expect(page.locator('.aiCardFocusStage img').first()).toHaveAttribute('src', originalCard!);
    expect(requests).toBe(beforeReload + 1);
  });
}

test('390px 选择权衡删除后不重新发送focus，主动重新解读才恢复', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAi(page);
  let requests = 0;
  page.on('request', request => {
    if (request.url().includes('/api/readings/analyze') && request.method() === 'POST') requests += 1;
  });
  await page.goto('/');
  await openDesk(page);
  await page.getByRole('textbox', { name: '你的问题', exact: true }).fill('测试：保留还是调整当前计划？');
  await page.locator('.mobileAdvancedToggle').click();
  const five = page.getByRole('radio', { name: '5', exact: true });
  await page.locator(`label[for="${await five.getAttribute('id')}"]`).click();
  await page.locator('label[for="miao-ai-conversation-toggle"]').click();
  await page.getByRole('button', { name: '开始和 Miao 看牌', exact: true }).click();
  await page.getByRole('button', { name: '不想挑，直接发牌', exact: true }).click();
  await expect(page.locator('.focusProposalCard')).toContainText('眼前可以验证的条件');
  expect(requests).toBe(1);
  await page.getByText('对话设置与保存', { exact: true }).click();
  await page.getByRole('button', { name: '删除本地对话', exact: true }).click();
  await expect(page.getByRole('button', { name: '重新解读这副牌', exact: true })).toBeVisible();
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(requests).toBe(1);
  await page.getByRole('button', { name: '重新解读这副牌', exact: true }).click();
  await expect(page.locator('.focusProposalCard')).toContainText('眼前可以验证的条件');
  expect(requests).toBe(2);
  await expect(page.locator('.interactiveDrawTable')).toHaveAttribute('data-stage', 'placed');
});
