import {
  calculateCampaignEntryFunnel,
  calculateProductEntryFunnel,
} from './lib/product-entry-funnel.mjs';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
const requestedDays = Number(process.env.TAROT_ANALYTICS_DAYS || 7);
const days = Number.isInteger(requestedDays) && requestedDays >= 1 && requestedDays <= 90
  ? requestedDays
  : 7;

if (!accountId || !apiToken) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and a CLOUDFLARE_API_TOKEN with Account Analytics Read permission.');
  process.exit(1);
}

const query = `
SELECT
  blob1 AS event_name,
  blob2 AS variant,
  index1 AS anonymous_browser,
  blob3 AS session,
  blob4 AS reading,
  blob5 AS source,
  blob7 AS share_token,
  SUM(_sample_interval) AS event_count
FROM miaotarot_product_events
WHERE
  blob1 IN (
    'session_started',
    'campaign_entry_opened',
    'home_action_shown',
    'home_action_selected',
    'reading_started',
    'reading_completed',
    'daily_reading',
    'share_result'
  )
  AND if(empty(blob6), 'external', blob6) != 'internal'
  AND timestamp >= NOW() - INTERVAL '${days}' DAY
GROUP BY event_name, variant, anonymous_browser, session, reading, source, share_token
FORMAT JSON
`.trim();

const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}` },
    body: query,
  },
);

if (!response.ok) {
  console.error(`Analytics Engine query failed: HTTP ${response.status} ${await response.text()}`);
  process.exit(1);
}

const result = await response.json();
const rows = Array.isArray(result?.data) ? result.data : [];
const completedRows = rows.filter((row) => row.event_name === 'reading_completed');
const completionsByBrowser = new Map();
for (const row of completedRows) {
  completionsByBrowser.set(
    row.anonymous_browser,
    (completionsByBrowser.get(row.anonymous_browser) || 0) + Number(row.event_count || 0),
  );
}
const anonymousBrowsers = completionsByBrowser.size;
const completedReadings = [...completionsByBrowser.values()].reduce((total, count) => total + count, 0);
const sessions = new Set(completedRows.map((row) => row.session).filter(Boolean)).size;
const multiPlayBrowsers = [...completionsByBrowser.values()].filter((count) => count >= 2).length;
const entry = calculateProductEntryFunnel(rows);
const campaigns = calculateCampaignEntryFunnel(rows);
const rate = (numerator, denominator) => (
  denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : 'n/a'
);

console.log(`MiaoTarot product analytics — last ${days} day${days === 1 ? '' : 's'}`);
console.log(`Anonymous browsers: ${anonymousBrowsers}`);
console.log(`Sessions: ${sessions}`);
console.log(`Completed readings: ${completedReadings}`);
console.log(`Average readings per browser: ${anonymousBrowsers > 0 ? (completedReadings / anonymousBrowsers).toFixed(2) : '0.00'}`);
console.log(`Browsers with 2+ readings: ${multiPlayBrowsers}`);
console.log(`Multi-play browser rate: ${anonymousBrowsers > 0 ? `${((multiPlayBrowsers / anonymousBrowsers) * 100).toFixed(1)}%` : '0.0%'}`);
console.log('Entry funnel — unique external tab sessions without share attribution:');
console.log(`- New-reading action shown / first selected: ${entry.shown['new-reading']} / ${entry.selected['new-reading']} (${rate(entry.selected['new-reading'], entry.shown['new-reading'])})`);
console.log(`- New-reading selected → shuffle started: ${entry.newReadingStarted}/${entry.selected['new-reading']} (${rate(entry.newReadingStarted, entry.selected['new-reading'])})`);
console.log(`- New-reading selected → reading completed: ${entry.newReadingCompleted}/${entry.selected['new-reading']} (${rate(entry.newReadingCompleted, entry.selected['new-reading'])})`);
console.log(`- Daily action shown / first selected: ${entry.shown['daily-reading']} / ${entry.selected['daily-reading']} (${rate(entry.selected['daily-reading'], entry.shown['daily-reading'])})`);
console.log(`- Daily selected → generated: ${entry.dailyReadingGenerated}/${entry.selected['daily-reading']} (${rate(entry.dailyReadingGenerated, entry.selected['daily-reading'])})`);
console.log(`- Daily selected → reading completed: ${entry.dailyReadingCompleted}/${entry.selected['daily-reading']} (${rate(entry.dailyReadingCompleted, entry.selected['daily-reading'])})`);
console.log(`- Continue-result shown / first selected: ${entry.shown['continue-result']} / ${entry.selected['continue-result']}`);
console.log(`- Resume-reading shown / first selected: ${entry.shown['resume-reading']} / ${entry.selected['resume-reading']}`);
console.log('Entry notes: shown requires 50% visibility for 500ms (or an actual click); selected records only the first hero action per tab. Mixed pre-rollout windows make the denominator incomplete, and anonymous browsers/sessions are not people.');
console.log('Campaign entry — unique external tab sessions, raw counts:');
if (campaigns.length === 0) {
  console.log('- No allowlisted campaign sessions in this window.');
} else {
  for (const campaign of campaigns) {
    console.log(
      `- ${campaign.source} / ${campaign.campaign}: ${campaign.sessions} sessions`
      + ` → ${campaign.entriesOpened} mobile entries opened`
      + ` → ${campaign.readingsStarted} readings started`
      + ` → ${campaign.readingsCompleted} readings completed`
      + ` → ${campaign.sessionsShared} sessions shared`,
    );
  }
}
console.log('Campaign notes: only registered channel/campaign pairs are counted. Opening means the approved question was actually shown in the mobile reading desk; no rate should be interpreted before rollout or from tiny cohorts.');
