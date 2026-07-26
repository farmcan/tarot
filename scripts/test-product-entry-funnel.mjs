import assert from 'node:assert/strict';
import {
  calculateCampaignEntryFunnel,
  calculateProductEntryFunnel,
} from './lib/product-entry-funnel.mjs';

const rows = [
  { event_name: 'home_action_shown', variant: 'new-reading', session: 'fresh-1', share_token: '' },
  { event_name: 'home_action_shown', variant: 'new-reading', session: 'fresh-2', share_token: '' },
  { event_name: 'home_action_shown', variant: 'daily-reading', session: 'fresh-1', share_token: '' },
  { event_name: 'home_action_shown', variant: 'daily-reading', session: 'fresh-2', share_token: '' },
  { event_name: 'home_action_selected', variant: 'new-reading', session: 'fresh-1', share_token: '' },
  { event_name: 'reading_started', variant: 'single', session: 'fresh-1', reading: 'new-1', share_token: '' },
  { event_name: 'reading_started', variant: 'single', session: 'fresh-1', reading: 'new-1', share_token: '' },
  { event_name: 'reading_completed', variant: 'single', session: 'fresh-1', reading: 'new-1', share_token: '' },
  { event_name: 'home_action_selected', variant: 'daily-reading', session: 'fresh-2', share_token: '' },
  { event_name: 'daily_reading', variant: 'single', session: 'fresh-2', reading: 'daily-1', share_token: '' },
  { event_name: 'reading_completed', variant: 'single', session: 'fresh-2', reading: 'daily-1', share_token: '' },
  { event_name: 'home_action_shown', variant: 'new-reading', session: 'new-abort', share_token: '' },
  { event_name: 'home_action_selected', variant: 'new-reading', session: 'new-abort', share_token: '' },
  { event_name: 'reading_started', variant: 'single', session: 'new-abort', reading: 'new-abort-1', share_token: '' },
  { event_name: 'reading_completed', variant: 'single', session: 'new-abort', reading: 'different-reading', share_token: '' },
  { event_name: 'home_action_shown', variant: 'daily-reading', session: 'daily-abort', share_token: '' },
  { event_name: 'home_action_selected', variant: 'daily-reading', session: 'daily-abort', share_token: '' },
  { event_name: 'daily_reading', variant: 'single', session: 'daily-abort', reading: 'daily-abort-1', share_token: '' },
  { event_name: 'reading_completed', variant: 'single', session: 'daily-abort', reading: 'different-reading', share_token: '' },
  { event_name: 'home_action_shown', variant: 'continue-result', session: 'return-1', share_token: '' },
  { event_name: 'home_action_selected', variant: 'continue-result', session: 'return-1', share_token: '' },
  { event_name: 'home_action_shown', variant: 'new-reading', session: 'shared-1', share_token: 'hashed-share-token' },
  { event_name: 'home_action_selected', variant: 'new-reading', session: 'shared-1', share_token: 'hashed-share-token' },
  { event_name: 'reading_started', variant: 'single', session: 'pre-rollout', reading: 'old-1', share_token: '' },
  { event_name: 'reading_completed', variant: 'single', session: 'pre-rollout', reading: 'old-1', share_token: '' },
];

assert.deepEqual(calculateProductEntryFunnel(rows), {
  shown: {
    'new-reading': 3,
    'daily-reading': 3,
    'continue-result': 1,
    'resume-reading': 0,
  },
  selected: {
    'new-reading': 2,
    'daily-reading': 2,
    'continue-result': 1,
    'resume-reading': 0,
  },
  newReadingStarted: 2,
  newReadingCompleted: 1,
  dailyReadingGenerated: 2,
  dailyReadingCompleted: 1,
});

const campaignRows = [
  { event_name: 'session_started', source: 'social-douyin', variant: 'hot-ginger-v2', session: 'douyin-1' },
  { event_name: 'session_started', source: 'social-douyin', variant: 'hot-ginger-v2', session: 'douyin-1' },
  { event_name: 'session_started', source: 'social-douyin', variant: 'hot-ginger-v2', session: 'douyin-restored' },
  { event_name: 'campaign_entry_opened', source: 'social-douyin', variant: 'hot-ginger-v2', session: 'douyin-1' },
  { event_name: 'reading_started', variant: 'single', session: 'douyin-1', reading: 'campaign-reading-1' },
  { event_name: 'reading_completed', variant: 'single', session: 'douyin-1', reading: 'campaign-reading-1' },
  { event_name: 'share_result', variant: 'single', session: 'douyin-1' },
  { event_name: 'reading_started', variant: 'single', session: 'douyin-restored', reading: 'old-reading' },
  { event_name: 'reading_completed', variant: 'single', session: 'douyin-restored', reading: 'old-reading' },
  { event_name: 'session_started', source: 'social-bilibili', variant: 'product-tour-v1', session: 'bilibili-1' },
  { event_name: 'campaign_entry_opened', source: 'social-bilibili', variant: 'product-tour-v1', session: 'bilibili-1' },
  { event_name: 'reading_started', variant: 'single', session: 'bilibili-1', reading: 'campaign-reading-2' },
  { event_name: 'reading_completed', variant: 'single', session: 'bilibili-1', reading: 'different-reading' },
  { event_name: 'session_started', source: 'social-xiaohongshu', variant: 'invented', session: 'invalid-1' },
];

assert.deepEqual(calculateCampaignEntryFunnel(campaignRows), [
  {
    source: 'social-douyin',
    campaign: 'hot-ginger-v2',
    sessions: 2,
    entriesOpened: 1,
    readingsStarted: 1,
    readingsCompleted: 1,
    sessionsShared: 1,
  },
  {
    source: 'social-bilibili',
    campaign: 'product-tour-v1',
    sessions: 1,
    entriesOpened: 1,
    readingsStarted: 1,
    readingsCompleted: 0,
    sessionsShared: 0,
  },
]);

console.log('Product entry funnel test ok: unique sessions, natural/campaign splits, reading linkage and share-attributed exclusion.');
