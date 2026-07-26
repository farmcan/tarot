import assert from 'node:assert/strict';
import { createDailyMiaoReading, getLocalDateKey } from '../site/src/domain/dailyReading';
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
};

saveReadingHistory([todayMorning], storage);
const restored = loadReadingHistory(storage);
assert.equal(restored.length, 1);
assert.equal(restored[0].cards[0].drawn.card.id, todayMorning.cards[0].drawn.card.id);
assert.equal(restored[0].question, todayMorning.question);

console.log('Reading state test ok: deterministic daily card, private share default, opt-in question, token guard and local history restore.');
