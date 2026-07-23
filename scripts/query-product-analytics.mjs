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
  index1 AS anonymous_browser,
  count(DISTINCT blob3) AS sessions,
  SUM(_sample_interval) AS completed_readings
FROM miaotarot_product_events
WHERE
  blob1 = 'reading_completed'
  AND ifNull(blob6, 'external') != 'internal'
  AND timestamp >= NOW() - INTERVAL '${days}' DAY
GROUP BY index1
ORDER BY completed_readings DESC
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
const anonymousBrowsers = rows.length;
const completedReadings = rows.reduce((total, row) => total + Number(row.completed_readings || 0), 0);
const sessions = rows.reduce((total, row) => total + Number(row.sessions || 0), 0);
const multiPlayBrowsers = rows.filter((row) => Number(row.completed_readings || 0) >= 2).length;

console.log(`MiaoTarot product analytics — last ${days} day${days === 1 ? '' : 's'}`);
console.log(`Anonymous browsers: ${anonymousBrowsers}`);
console.log(`Sessions: ${sessions}`);
console.log(`Completed readings: ${completedReadings}`);
console.log(`Average readings per browser: ${anonymousBrowsers > 0 ? (completedReadings / anonymousBrowsers).toFixed(2) : '0.00'}`);
console.log(`Browsers with 2+ readings: ${multiPlayBrowsers}`);
console.log(`Multi-play browser rate: ${anonymousBrowsers > 0 ? `${((multiPlayBrowsers / anonymousBrowsers) * 100).toFixed(1)}%` : '0.0%'}`);
