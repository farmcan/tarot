import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/product-event.js';

class FakeAnalyticsEngine {
  constructor() {
    this.points = [];
  }

  writeDataPoint(point) {
    this.points.push(point);
  }
}

function request(body, headers = {}) {
  return new Request('https://miaotarot.example/api/product-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const identifiers = {
  anonymousId: '7e0c2b55-f54e-4a26-8d40-742d7070b40b',
  sessionId: '9c568e62-2799-45ce-87cb-8bb7cabf51db',
  readingId: '8775499c-7ff9-4239-a9df-e35fb5df87f4',
};

const analytics = new FakeAnalyticsEngine();
const env = { MIAOTAROT_ANALYTICS: analytics };
const accepted = await onRequestPost({
  request: request({
    name: 'reading_completed',
    variant: 'three-card',
    source: 'reading-desk',
    trafficType: 'external',
    question: 'this must never be stored',
    ...identifiers,
  }),
  env,
});
assert.equal(accepted.status, 202);
assert.deepEqual(await accepted.json(), { accepted: true });
assert.equal(analytics.points.length, 1);

const [point] = analytics.points;
assert.match(point.indexes[0], /^[a-f0-9]{64}$/);
assert.notEqual(point.indexes[0], identifiers.anonymousId);
assert.deepEqual(point.blobs.slice(0, 2), ['reading_completed', 'three-card']);
assert.match(point.blobs[2], /^[a-f0-9]{64}$/);
assert.match(point.blobs[3], /^[a-f0-9]{64}$/);
assert.equal(point.blobs[4], 'reading-desk');
assert.equal(point.blobs[5], 'external');
assert.deepEqual(point.doubles, [1]);
assert.equal(JSON.stringify(point).includes('this must never be stored'), false);

await onRequestPost({
  request: request({ name: 'reading_completed', variant: 'three-card', source: 'reading-desk', ...identifiers }),
  env,
});
assert.equal(analytics.points.length, 2);
assert.equal(analytics.points[1].indexes[0], point.indexes[0]);
assert.equal(analytics.points[1].blobs[2], point.blobs[2]);

const withoutReading = await onRequestPost({
  request: request({
    name: 'reading_started',
    variant: 'single',
    source: 'reading-desk',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  }),
  env,
});
assert.equal(withoutReading.status, 202);
assert.equal(analytics.points[2].blobs[3], '');

const presence = await onRequestPost({
  request: request({
    name: 'app_opened',
    variant: 'default',
    source: 'direct',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  }),
  env,
});
assert.equal(presence.status, 202);
assert.deepEqual(analytics.points[3].blobs.slice(0, 5), [
  'app_opened',
  'default',
  point.blobs[2],
  '',
  'direct',
]);

const internalFeedback = await onRequestPost({
  request: request({
    name: 'reading_feedback_submitted',
    variant: 'captured',
    source: 'corrected-focus',
    trafficType: 'internal',
    ...identifiers,
  }),
  env,
});
assert.equal(internalFeedback.status, 202);
assert.deepEqual(analytics.points[4].blobs.slice(0, 6), [
  'reading_feedback_submitted',
  'captured',
  point.blobs[2],
  point.blobs[3],
  'corrected-focus',
  'internal',
]);

const firstFocusContent = await onRequestPost({
  request: request({
    name: 'focus_first_content',
    variant: '1-3s',
    source: 'llm-focus',
    ...identifiers,
  }),
  env,
});
assert.equal(firstFocusContent.status, 202);
assert.deepEqual(analytics.points[5].blobs.slice(0, 2), ['focus_first_content', '1-3s']);

const invalid = await onRequestPost({
  request: request({ name: 'private_question', variant: 'secret text', ...identifiers }),
  env,
});
assert.equal(invalid.status, 400);
assert.equal(analytics.points.length, 6);

const missingIdentity = await onRequestPost({
  request: request({ name: 'reading_completed', variant: 'single' }),
  env,
});
assert.equal(missingIdentity.status, 400);

const unavailable = await onRequestPost({
  request: request({ name: 'reading_completed', variant: 'single', ...identifiers }),
  env: {},
});
assert.equal(unavailable.status, 503);
assert.equal((await unavailable.json()).error, 'analytics_unavailable');

const crossSite = await onRequestPost({
  request: request({ name: 'share_result', ...identifiers }, { 'Sec-Fetch-Site': 'cross-site' }),
  env,
});
assert.equal(crossSite.status, 403);

console.log('Product event test ok: anonymous hashing, presence/reading linkage, privacy allowlist, binding and cross-site guards.');
