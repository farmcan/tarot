import assert from 'node:assert/strict';
import { calculateProductRetention } from './lib/product-retention.mjs';

const rows = [
  { anonymous_browser: 'a', active_date: '2026-06-01' },
  { anonymous_browser: 'a', active_date: '2026-06-02' },
  { anonymous_browser: 'a', active_date: '2026-06-08' },
  { anonymous_browser: 'a', active_date: '2026-07-01' },
  { anonymous_browser: 'b', active_date: '2026-06-01' },
  { anonymous_browser: 'b', active_date: '2026-06-08' },
  { anonymous_browser: 'c', active_date: '2026-06-30' },
  { anonymous_browser: 'c', active_date: '2026-07-01' },
  { anonymous_browser: '', active_date: '2026-06-01' },
];

const result = calculateProductRetention(rows, '2026-07-01');
assert.equal(result.anonymousBrowsers, 3);
assert.equal(result.observedFrom, '2026-06-01');
assert.equal(result.observedThrough, '2026-07-01');
assert.deepEqual(result.periods, [
  { day: 1, eligible: 3, retained: 2, rate: 2 / 3 },
  { day: 7, eligible: 2, retained: 2, rate: 1 },
  { day: 30, eligible: 2, retained: 1, rate: 0.5 },
]);

console.log('Product retention test ok: D1/D7/D30 exact-day cohorts and eligibility.');
