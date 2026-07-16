import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/site-counter.js';

class FakeD1Statement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  bind() {
    return this;
  }

  async first() {
    if (this.sql.includes('INSERT INTO site_counters')) {
      this.database.count += 1;
    }
    return { count: this.database.count };
  }
}

class FakeD1Database {
  count = 0;

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }
}

function request(method, headers = {}) {
  return new Request('https://miaotarot.example/api/site-counter', { method, headers });
}

const database = new FakeD1Database();
const env = { MIAOTAROT_DB: database };

const firstVisit = await onRequestPost({ request: request('POST'), env });
const firstBody = await firstVisit.json();
assert.equal(firstVisit.status, 200);
assert.deepEqual(firstBody, {
  count: 1,
  counted: true,
  period: 'all-time',
  dedupeWindowHours: 24,
});
assert.match(firstVisit.headers.get('set-cookie') || '', /miaotarot_visit=1/);
assert.match(firstVisit.headers.get('cache-control') || '', /no-store/);

const repeatVisit = await onRequestPost({
  request: request('POST', { Cookie: 'miaotarot_visit=1' }),
  env,
});
const repeatBody = await repeatVisit.json();
assert.equal(repeatBody.count, 1);
assert.equal(repeatBody.counted, false);

const botVisit = await onRequestPost({
  request: request('POST', { 'User-Agent': 'ExampleBot/1.0' }),
  env,
});
assert.equal((await botVisit.json()).count, 1);

const publicCount = await onRequestGet({ env });
assert.deepEqual(await publicCount.json(), { count: 1, period: 'all-time' });

const crossSite = await onRequestPost({
  request: request('POST', { 'Sec-Fetch-Site': 'cross-site' }),
  env,
});
assert.equal(crossSite.status, 403);
assert.equal(database.count, 1);

const unavailable = await onRequestGet({ env: {} });
assert.equal(unavailable.status, 503);
assert.equal((await unavailable.json()).error, 'counter_unavailable');

console.log('Site counter test ok: atomic increment, 24h dedupe, bot/cross-site guard, public read.');
