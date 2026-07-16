import assert from 'node:assert/strict';
import { createDailyMiaoReading, getLocalDateKey } from '../site/src/domain/dailyReading';
import { loadReadingHistory, saveReadingHistory } from '../site/src/domain/readingHistory';
import { createReadingShareUrl, parseReadingShareUrl } from '../site/src/domain/readingShare';

const morning = new Date(2026, 6, 16, 8, 30);
const evening = new Date(2026, 6, 16, 22, 15);
const todayMorning = createDailyMiaoReading(morning);
const todayEvening = createDailyMiaoReading(evening);

assert.equal(getLocalDateKey(morning), '2026-07-16');
assert.equal(todayMorning.cards[0].drawn.card.id, todayEvening.cards[0].drawn.card.id);
assert.equal(todayMorning.cards[0].drawn.orientation, todayEvening.cards[0].drawn.orientation);

const shareUrl = createReadingShareUrl(todayMorning, 'https://miaotarot.example/some/path?old=1');
const parsed = parseReadingShareUrl(new URL(shareUrl).search);
assert.ok(parsed);
assert.equal(parsed.spread.id, 'single');
assert.equal(parsed.question, todayMorning.question);
assert.equal(parsed.cards[0].drawn.card.id, todayMorning.cards[0].drawn.card.id);
assert.equal(parsed.cards[0].drawn.orientation, todayMorning.cards[0].drawn.orientation);
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

console.log('Reading state test ok: deterministic daily card, share reconstruction, invalid-link guard, local history restore.');
