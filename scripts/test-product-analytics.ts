import assert from 'node:assert/strict';
import {
  getOrCreateAnalyticsSessionId,
  getOrCreateAnonymousAnalyticsId,
  resetProductAnalyticsIdentity,
} from '../site/src/domain/productAnalytics';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const firstAnonymousId = '7e0c2b55-f54e-4a26-8d40-742d7070b40b';
const rotatedAnonymousId = '54bc3abe-864d-4e62-86ed-b6248d86f0c9';
const firstSessionId = '9c568e62-2799-45ce-87cb-8bb7cabf51db';
const secondSessionId = '8775499c-7ff9-4239-a9df-e35fb5df87f4';
const day = 24 * 60 * 60 * 1000;

const persistent = new MemoryStorage();
const session = new MemoryStorage();
const created = getOrCreateAnonymousAnalyticsId(persistent, 10 * day, () => firstAnonymousId);
assert.equal(created, firstAnonymousId);
assert.equal(getOrCreateAnonymousAnalyticsId(persistent, 20 * day, () => rotatedAnonymousId), firstAnonymousId);
assert.equal(getOrCreateAnonymousAnalyticsId(persistent, 101 * day, () => rotatedAnonymousId), rotatedAnonymousId);

assert.equal(getOrCreateAnalyticsSessionId(session, () => firstSessionId), firstSessionId);
assert.equal(getOrCreateAnalyticsSessionId(session, () => secondSessionId), firstSessionId);

resetProductAnalyticsIdentity(persistent, session);
assert.equal(getOrCreateAnonymousAnalyticsId(persistent, 102 * day, () => firstAnonymousId), firstAnonymousId);
assert.equal(getOrCreateAnalyticsSessionId(session, () => secondSessionId), secondSessionId);

const malformed = new MemoryStorage();
malformed.setItem('miaotarot:analytics-id:v1', '{broken');
malformed.setItem('miaotarot:analytics-session:v1', 'not-a-uuid');
assert.equal(getOrCreateAnonymousAnalyticsId(malformed, 1, () => firstAnonymousId), firstAnonymousId);
assert.equal(getOrCreateAnalyticsSessionId(malformed, () => firstSessionId), firstSessionId);

console.log('Product analytics client test ok: persistent anonymous id, per-tab session, 90-day rotation and reset.');
