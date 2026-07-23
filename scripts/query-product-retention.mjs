import { calculateProductRetention } from './lib/product-retention.mjs';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';

if (!accountId || !apiToken) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and a CLOUDFLARE_API_TOKEN with Account Analytics Read permission.');
  process.exit(1);
}

const query = `
SELECT
  index1 AS anonymous_browser,
  formatDateTime(timestamp, '%Y-%m-%d', 'Etc/UTC') AS active_date
FROM miaotarot_product_events
WHERE
  blob1 = 'reading_completed'
  AND if(empty(blob6), 'external', blob6) != 'internal'
  AND timestamp >= NOW() - INTERVAL '90' DAY
GROUP BY index1, active_date
ORDER BY active_date ASC
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
  console.error(`Analytics Engine retention query failed: HTTP ${response.status} ${await response.text()}`);
  process.exit(1);
}

const result = await response.json();
const rows = Array.isArray(result?.data) ? result.data : [];
const retention = calculateProductRetention(rows);

console.log('MiaoTarot completed-reading retention');
console.log(`Browsers with a completed reading: ${retention.anonymousBrowsers}`);
console.log(`Observed event window: ${retention.observedFrom || 'no data'} to ${retention.observedThrough || 'no data'}`);
for (const period of retention.periods) {
  const rate = period.eligible > 0 ? `${(period.rate * 100).toFixed(1)}%` : 'n/a';
  console.log(`D${period.day}: ${rate} (${period.retained}/${period.eligible} eligible browsers)`);
}
console.log('Note: cohorts start at the first completed reading visible inside Analytics Engine\'s rolling 90-day history; D7 means another completed reading exactly seven UTC dates later.');
