import assert from 'node:assert/strict';
import { calculateProductEntryFunnel } from './lib/product-entry-funnel.mjs';

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

console.log('Product entry funnel test ok: unique sessions, split actions, reading branches and share-attributed exclusion.');
