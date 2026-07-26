import assert from 'node:assert/strict';
import {
  claimCampaignEntryOpened,
  claimHomeActionSelected,
  claimHomeActionShown,
  claimProductPresenceEvents,
  classifyAcquisitionSource,
  getAcquisitionContext,
  getActiveShareToken,
  getOrCreateAnalyticsSessionId,
  getOrCreateAnonymousAnalyticsId,
  resetProductAnalyticsIdentity,
} from '../site/src/domain/productAnalytics';
import { getMarketingCampaignEntry } from '../shared/marketingCampaigns.js';

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

assert.deepEqual(claimProductPresenceEvents(persistent, session, 20 * day), ['app_opened', 'session_started']);
assert.deepEqual(claimProductPresenceEvents(persistent, session, 20 * day + 1_000), []);
assert.deepEqual(claimProductPresenceEvents(persistent, session, 21 * day), ['app_opened']);
const nextTab = new MemoryStorage();
assert.deepEqual(claimProductPresenceEvents(persistent, nextTab, 21 * day + 1_000), ['session_started']);

assert.equal(claimHomeActionShown('new-reading', 'hero-primary', session), true);
assert.equal(claimHomeActionShown('new-reading', 'hero-primary', session), false);
assert.equal(claimHomeActionShown('daily-reading', 'hero-daily', session), true);
assert.equal(claimHomeActionSelected(session), true);
assert.equal(claimHomeActionSelected(session), false);
assert.equal(claimCampaignEntryOpened(session), true);
assert.equal(claimCampaignEntryOpened(session), false);

assert.equal(classifyAcquisitionSource('', 'miaotarot.example'), 'direct');
assert.equal(classifyAcquisitionSource('https://miaotarot.example/share', 'miaotarot.example'), 'internal');
assert.equal(classifyAcquisitionSource('https://www.google.com/search?q=tarot', 'miaotarot.example'), 'search');
assert.equal(classifyAcquisitionSource('https://www.xiaohongshu.com/explore/1', 'miaotarot.example'), 'social');
assert.equal(classifyAcquisitionSource('https://example.com/post', 'miaotarot.example'), 'referral');

const gingerEntry = getMarketingCampaignEntry(
  '?mt_channel=douyin&mt_campaign=hot-ginger-v2&q=%E7%A7%81%E5%AF%86%E9%97%AE%E9%A2%98&voice=normal',
);
assert.deepEqual(gingerEntry, {
  channel: 'douyin',
  source: 'social-douyin',
  campaign: 'hot-ginger-v2',
  question: '生姜伪装成土豆接近我，到底图什么？',
  voiceMode: 'chaos',
});
assert.equal(getMarketingCampaignEntry('?mt_campaign=hot-ginger-v2'), null);
assert.equal(getMarketingCampaignEntry('?mt_channel=douyin&mt_campaign=unknown'), null);
assert.deepEqual(
  getAcquisitionContext(
    '?mt_channel=bilibili&mt_campaign=product-tour-v1',
    '',
    'miaotarot.example',
  ),
  {
    source: 'social-bilibili',
    campaign: 'product-tour-v1',
    marketingEntry: {
      channel: 'bilibili',
      source: 'social-bilibili',
      campaign: 'product-tour-v1',
      question: '我今天最需要看见什么？',
      voiceMode: 'normal',
    },
  },
);
assert.deepEqual(
  getAcquisitionContext(
    '?mt_channel=douyin&mt_campaign=hot-ginger-v2',
    '',
    'miaotarot.example',
    'active-share-token',
  ),
  {
    source: 'shared-reading',
    campaign: 'default',
    marketingEntry: null,
  },
);
assert.equal(
  getAcquisitionContext('?mt_channel=douyin&mt_campaign=unknown', '', 'miaotarot.example').source,
  'direct',
);

const shareSession = new MemoryStorage();
const shareToken = '54bc3abe-864d-4e62-86ed-b6248d86f0c9';
assert.equal(getActiveShareToken(`?src=share&st=${shareToken}`, shareSession), shareToken);
assert.equal(getActiveShareToken('', shareSession), shareToken);
assert.equal(getActiveShareToken('?src=share&st=invalid', new MemoryStorage()), '');

resetProductAnalyticsIdentity(persistent, session);
assert.equal(getOrCreateAnonymousAnalyticsId(persistent, 102 * day, () => firstAnonymousId), firstAnonymousId);
assert.equal(getOrCreateAnalyticsSessionId(session, () => secondSessionId), secondSessionId);
assert.equal(claimHomeActionShown('new-reading', 'hero-primary', session), true);
assert.equal(claimHomeActionSelected(session), true);
assert.equal(claimCampaignEntryOpened(session), true);

const malformed = new MemoryStorage();
malformed.setItem('miaotarot:analytics-id:v1', '{broken');
malformed.setItem('miaotarot:analytics-session:v1', 'not-a-uuid');
assert.equal(getOrCreateAnonymousAnalyticsId(malformed, 1, () => firstAnonymousId), firstAnonymousId);
assert.equal(getOrCreateAnalyticsSessionId(malformed, () => firstSessionId), firstSessionId);

console.log('Product analytics client test ok: anonymous id, controlled campaigns, presence, visible entry actions, coarse acquisition, 90-day rotation and reset.');
