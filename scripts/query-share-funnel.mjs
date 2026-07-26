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
  blob7 AS share_token,
  index1 AS anonymous_browser,
  SUM(_sample_interval) AS event_count
FROM miaotarot_product_events
WHERE
  blob1 IN ('share_result', 'share_landed', 'share_remix_started', 'reading_completed')
  AND NOT empty(blob7)
  AND if(empty(blob6), 'external', blob6) != 'internal'
  AND timestamp >= NOW() - INTERVAL '${days}' DAY
GROUP BY event_name, share_token, anonymous_browser
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
  console.error(`Analytics Engine share query failed: HTTP ${response.status} ${await response.text()}`);
  process.exit(1);
}

const result = await response.json();
const rows = Array.isArray(result?.data) ? result.data : [];
const rowsFor = (eventName) => rows.filter((row) => row.event_name === eventName);
const unique = (values) => new Set(values.filter(Boolean));
const sendersByToken = new Map();

for (const row of rowsFor('share_result')) {
  const senders = sendersByToken.get(row.share_token) || new Set();
  senders.add(row.anonymous_browser);
  sendersByToken.set(row.share_token, senders);
}

const isRecipient = (row) => !sendersByToken.get(row.share_token)?.has(row.anonymous_browser);
const recipientLandings = rowsFor('share_landed').filter(isRecipient);
const recipientRemixes = rowsFor('share_remix_started').filter(isRecipient);
const recipientCompletions = rowsFor('reading_completed').filter(isRecipient);
const recipientBrowsers = unique(recipientLandings.map((row) => row.anonymous_browser));
const reSharingBrowsers = unique(
  rowsFor('share_result')
    .filter((row) => recipientBrowsers.has(row.anonymous_browser))
    .map((row) => row.anonymous_browser),
);

console.log(`MiaoTarot share funnel — external traffic, last ${days} day${days === 1 ? '' : 's'}`);
console.log(`Successful share actions: ${rowsFor('share_result').reduce((sum, row) => sum + Number(row.event_count || 0), 0)} across ${sendersByToken.size} tokens`);
console.log(`Recipient landings: ${recipientLandings.reduce((sum, row) => sum + Number(row.event_count || 0), 0)} across ${recipientBrowsers.size} anonymous browsers`);
console.log(`Recipients who started their own reading: ${unique(recipientRemixes.map((row) => row.anonymous_browser)).size}`);
console.log(`Recipients who completed their own reading: ${unique(recipientCompletions.map((row) => row.anonymous_browser)).size}`);
console.log(`Recipient browsers that later shared: ${reSharingBrowsers.size}`);
console.log('Notes: sender self-opens are excluded when a matching send event exists; anonymous browsers are not people, and image generation alone is not counted as distribution.');
