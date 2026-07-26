import assert from 'node:assert/strict';
import { createDailyMiaoReading, getLocalDateKey } from '../site/src/domain/dailyReading';
import {
  clearReadingActions,
  findReadingAction,
  getDueReadingAction,
  loadReadingActions,
  markReadingActionPresented,
  READING_ACTION_STORAGE_KEY,
  removeReadingAction,
  resolveReadingAction,
  saveReadingActions,
  upsertReadingAction,
} from '../site/src/domain/readingAction';
import { loadReadingHistory, saveReadingHistory } from '../site/src/domain/readingHistory';
import {
  createReadingShareUrl,
  getReadingShareAttribution,
  parseReadingShareUrl,
} from '../site/src/domain/readingShare';

const morning = new Date(2026, 6, 16, 8, 30);
const evening = new Date(2026, 6, 16, 22, 15);
const todayMorning = createDailyMiaoReading(morning);
const todayEvening = createDailyMiaoReading(evening);

assert.equal(getLocalDateKey(morning), '2026-07-16');
assert.equal(todayMorning.cards[0].drawn.card.id, todayEvening.cards[0].drawn.card.id);
assert.equal(todayMorning.cards[0].drawn.orientation, todayEvening.cards[0].drawn.orientation);

const shareToken = '8775499c-7ff9-4239-a9df-e35fb5df87f4';
const shareUrl = createReadingShareUrl(todayMorning, 'https://miaotarot.example/some/path?old=1', {
  shareToken,
});
const parsed = parseReadingShareUrl(new URL(shareUrl).search);
assert.ok(parsed);
assert.equal(parsed.spread.id, 'single');
assert.equal(parsed.question, '');
assert.equal(parsed.cards[0].drawn.card.id, todayMorning.cards[0].drawn.card.id);
assert.equal(parsed.cards[0].drawn.orientation, todayMorning.cards[0].drawn.orientation);
assert.equal(parsed.contentPackId, 'doodle-full');
assert.deepEqual(getReadingShareAttribution(new URL(shareUrl).search), {
  token: shareToken,
  source: 'share',
});
assert.equal(getReadingShareAttribution('?src=share&st=not-a-token'), null);
const sharedQuestionUrl = createReadingShareUrl(todayMorning, 'https://miaotarot.example/', {
  includeQuestion: true,
  shareToken,
});
assert.equal(parseReadingShareUrl(new URL(sharedQuestionUrl).search)?.question, todayMorning.question);
const legacySearch = new URL(shareUrl).searchParams;
legacySearch.delete('pack');
assert.equal(parseReadingShareUrl(`?${legacySearch}`)?.contentPackId, 'classic-major');
assert.equal(parseReadingShareUrl('?r=1&spread=single&cards=not-a-card.u'), null);

const memory = new Map<string, string>();
const storage = {
  getItem(key: string) {
    return memory.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
  },
  removeItem(key: string) {
    memory.delete(key);
  },
};

saveReadingHistory([todayMorning], storage);
const restored = loadReadingHistory(storage);
assert.equal(restored.length, 1);
assert.equal(restored[0].cards[0].drawn.card.id, todayMorning.cards[0].drawn.card.id);
assert.equal(restored[0].question, todayMorning.question);

const savedAt = new Date(2026, 6, 16, 22, 15);
const nextMorning = new Date(2026, 6, 17, 8, 30);
let actions = upsertReadingAction([], todayMorning, '  先写下一个可以验证的小动作。  ', savedAt);
assert.equal(actions.length, 1);
assert.equal(actions[0].action, '先写下一个可以验证的小动作。');
assert.equal(getDueReadingAction(actions, evening), null);
assert.equal(getDueReadingAction(actions, new Date(2026, 6, 17, 6, 14)), null);
assert.equal(getDueReadingAction(actions, new Date(2026, 6, 17, 6, 15))?.readingId, todayMorning.id);
assert.equal(getDueReadingAction(actions, nextMorning)?.readingId, todayMorning.id);
assert.equal(getDueReadingAction(actions, new Date(2026, 6, 23, 23, 59))?.readingId, todayMorning.id);
assert.equal(getDueReadingAction(actions, new Date(2026, 6, 24, 0, 1)), null);

actions = upsertReadingAction(actions, todayMorning, '把动作缩小到十分钟。', nextMorning);
assert.equal(actions[0].savedAt, savedAt.toISOString());
assert.equal(actions[0].action, '把动作缩小到十分钟。');
assert.equal(saveReadingActions(actions, storage), true);
assert.equal(loadReadingActions(storage)[0].action, '把动作缩小到十分钟。');
assert.equal(findReadingAction(loadReadingActions(storage), restored[0])?.action, '把动作缩小到十分钟。');
assert.equal(memory.get(READING_ACTION_STORAGE_KEY)?.includes(todayMorning.question), false);

actions = markReadingActionPresented(actions, actions[0].readingKey, nextMorning);
assert.equal(getDueReadingAction(actions, new Date(2026, 6, 17, 18, 30)), null);
assert.equal(getDueReadingAction(actions, new Date(2026, 6, 18, 8, 30)), null);

actions = resolveReadingAction(actions, actions[0].readingKey, 'ongoing', nextMorning);
assert.equal(actions[0].outcome, 'ongoing');
assert.equal(getDueReadingAction(actions, new Date(2026, 6, 18, 8, 30)), null);
const restartedAction = upsertReadingAction(actions, restored[0], '换成下一轮更合适的一步。', new Date(2026, 6, 18, 9));
assert.equal(restartedAction[0].outcome, undefined);
assert.equal(restartedAction[0].savedAt, new Date(2026, 6, 18, 9).toISOString());
assert.equal(upsertReadingAction([], todayMorning, '猫'.repeat(140), savedAt)[0].action.length, 120);
assert.equal(removeReadingAction(restartedAction, todayMorning).length, 0);
assert.equal(getDueReadingAction(upsertReadingAction([], todayMorning, '未来的一步', nextMorning), savedAt), null);

let boundedActions = [] as typeof actions;
for (let index = 0; index < 10; index += 1) {
  const readingForDay = createDailyMiaoReading(new Date(2026, 6, index + 1, 9));
  boundedActions = upsertReadingAction(
    boundedActions,
    readingForDay,
    `第 ${index + 1} 步`,
    new Date(2026, 6, index + 1, 9),
  );
}
assert.equal(boundedActions.length, 8);
assert.equal(boundedActions[0].action, '第 10 步');

memory.set(READING_ACTION_STORAGE_KEY, JSON.stringify({
  version: 1,
  entries: [
    actions[0],
    { action: '缺少关联阅读', savedAt: savedAt.toISOString() },
    { ...actions[0], outcome: 'judged' },
  ],
}));
assert.equal(loadReadingActions(storage).length, 1);
assert.equal(clearReadingActions(storage), true);
assert.equal(loadReadingActions(storage).length, 0);

memory.set(READING_ACTION_STORAGE_KEY, JSON.stringify({ version: 2, entries: boundedActions }));
assert.equal(loadReadingActions(storage).length, 0);
const blockedStorage = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
  removeItem() {
    throw new Error('blocked');
  },
};
assert.deepEqual(loadReadingActions(blockedStorage), []);
assert.equal(saveReadingActions(boundedActions, blockedStorage), false);
assert.equal(clearReadingActions(blockedStorage), false);

console.log('Reading state test ok: deterministic daily card, private share, local history and optional seven-day action follow-up.');
