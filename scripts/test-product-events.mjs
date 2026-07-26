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
  shareToken: '54bc3abe-864d-4e62-86ed-b6248d86f0c9',
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
assert.match(point.blobs[6], /^[a-f0-9]{64}$/);
assert.notEqual(point.blobs[6], identifiers.shareToken);
assert.deepEqual(point.doubles, [1]);
assert.equal(JSON.stringify(point).includes('this must never be stored'), false);
assert.equal(JSON.stringify(point).includes(identifiers.shareToken), false);

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
    source: 'reading-normal',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  }),
  env,
});
assert.equal(withoutReading.status, 400);
assert.equal(analytics.points.length, 2);

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
assert.deepEqual(analytics.points[2].blobs.slice(0, 5), [
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
assert.deepEqual(analytics.points[3].blobs.slice(0, 6), [
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
assert.deepEqual(analytics.points[4].blobs.slice(0, 2), ['focus_first_content', '1-3s']);

const correctionFeedback = await onRequestPost({
  request: request({
    name: 'focus_correction_feedback',
    variant: 'improved',
    source: 'custom',
    ...identifiers,
  }),
  env,
});
assert.equal(correctionFeedback.status, 202);
assert.deepEqual(analytics.points[5].blobs.slice(0, 2), ['focus_correction_feedback', 'improved']);

const actionEvents = [
  ['action_saved', 'edited'],
  ['action_review_shown', 'd1'],
  ['action_reviewed', 'ongoing'],
];
for (const [name, variant] of actionEvents) {
  const response = await onRequestPost({
    request: request({
      name,
      variant,
      source: 'return-checkin',
      privateAction: '这句话只能留在浏览器',
      ...identifiers,
    }),
    env,
  });
  assert.equal(response.status, 202);
}
assert.deepEqual(
  analytics.points.slice(6, 9).map((item) => item.blobs.slice(0, 2)),
  actionEvents,
);
assert.equal(JSON.stringify(analytics.points).includes('这句话只能留在浏览器'), false);

const strictContractEvents = [
  {
    name: 'session_started',
    variant: 'hot-ginger-v2',
    source: 'social-douyin',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  },
  {
    name: 'campaign_entry_opened',
    variant: 'product-tour-v1',
    source: 'social-bilibili',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  },
  {
    name: 'home_action_shown',
    variant: 'new-reading',
    source: 'hero-primary',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  },
  {
    name: 'home_action_selected',
    variant: 'daily-reading',
    source: 'hero-daily',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  },
  {
    name: 'voice_mode_selected',
    variant: 'chaos',
    source: 'reading-desk',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  },
  {
    name: 'reading_started',
    variant: 'single',
    source: 'reading-normal',
    ...identifiers,
  },
  {
    name: 'daily_reading',
    variant: 'single',
    source: 'hero-daily',
    cardId: 'the-tower',
    ...identifiers,
  },
];
for (const event of strictContractEvents) {
  const response = await onRequestPost({ request: request(event), env });
  assert.equal(response.status, 202);
}
assert.deepEqual(
  analytics.points.slice(9, 16).map((item) => item.blobs.slice(0, 2)),
  strictContractEvents.map((event) => [event.name, event.variant]),
);
assert.equal(JSON.stringify(analytics.points).includes('the-tower'), false);

const invalid = await onRequestPost({
  request: request({ name: 'private_question', variant: 'secret text', ...identifiers }),
  env,
});
assert.equal(invalid.status, 400);
assert.equal(analytics.points.length, 16);

const invalidShareToken = await onRequestPost({
  request: request({ name: 'share_landed', ...identifiers, shareToken: 'not-a-token' }),
  env,
});
assert.equal(invalidShareToken.status, 400);
assert.equal(analytics.points.length, 16);

const missingShareToken = await onRequestPost({
  request: request({
    name: 'share_remix_started',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  }),
  env,
});
assert.equal(missingShareToken.status, 400);
assert.equal(analytics.points.length, 16);

const unknownCampaign = await onRequestPost({
  request: request({
    name: 'session_started',
    variant: 'invented-private-campaign',
    source: 'social-douyin',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  }),
  env,
});
assert.equal(unknownCampaign.status, 400);

const mismatchedCampaignChannel = await onRequestPost({
  request: request({
    name: 'campaign_entry_opened',
    variant: 'hot-ginger-v2',
    source: 'social-xiaohongshu',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  }),
  env,
});
assert.equal(mismatchedCampaignChannel.status, 400);

const campaignWithShareAttribution = await onRequestPost({
  request: request({
    name: 'campaign_entry_opened',
    variant: 'hot-ginger-v2',
    source: 'social-douyin',
    ...identifiers,
  }),
  env,
});
assert.equal(campaignWithShareAttribution.status, 400);

const leakedDailyCard = await onRequestPost({
  request: request({
    name: 'daily_reading',
    variant: 'the-tower',
    source: 'hero-daily',
    ...identifiers,
  }),
  env,
});
assert.equal(leakedDailyCard.status, 400);

const mismatchedHomeAction = await onRequestPost({
  request: request({
    name: 'home_action_selected',
    variant: 'daily-reading',
    source: 'hero-primary',
    anonymousId: identifiers.anonymousId,
    sessionId: identifiers.sessionId,
  }),
  env,
});
assert.equal(mismatchedHomeAction.status, 400);

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

console.log('Product event test ok: anonymous/referral hashing, private action exclusion, presence/reading linkage, allowlist, binding and cross-site guards.');
