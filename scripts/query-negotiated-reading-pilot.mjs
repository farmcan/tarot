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
  SUM(_sample_interval) AS events,
  count(DISTINCT index1) AS anonymous_browsers,
  count(DISTINCT blob4) AS readings
FROM miaotarot_product_events
WHERE
  blob1 IN (
    'reading_started',
    'reading_completed',
    'llm_requested',
    'llm_succeeded',
    'llm_failed',
    'focus_first_content',
    'focus_confirmed',
    'focus_corrected',
    'focus_correction_feedback',
    'response_goal_selected',
    'reading_feedback_submitted',
    'support_opened',
    'support_qr_saved'
  )
  AND if(empty(blob6), 'external', blob6) != 'internal'
  AND timestamp >= NOW() - INTERVAL '${days}' DAY
GROUP BY event_name, variant
ORDER BY event_name, variant
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
  console.error(`Analytics Engine pilot query failed: HTTP ${response.status} ${await response.text()}`);
  process.exit(1);
}

const result = await response.json();
const rows = Array.isArray(result?.data) ? result.data : [];
const eventCount = (name, variant) => rows
  .filter((row) => row.event_name === name && (!variant || row.variant === variant))
  .reduce((total, row) => total + Number(row.events || 0), 0);
const browserCount = (name, variant) => rows
  .filter((row) => row.event_name === name && (!variant || row.variant === variant))
  .reduce((total, row) => total + Number(row.anonymous_browsers || 0), 0);

const feedbackCaptured = eventCount('reading_feedback_submitted', 'captured');
const feedbackPartial = eventCount('reading_feedback_submitted', 'partial');
const feedbackMissed = eventCount('reading_feedback_submitted', 'missed');
const feedbackTotal = feedbackCaptured + feedbackPartial + feedbackMissed;
const usefulFeedback = feedbackCaptured + feedbackPartial;
const choiceStarts = eventCount('reading_started', 'choice');
const choiceCompletions = eventCount('reading_completed', 'choice');
const llmRequests = eventCount('llm_requested');
const llmFailures = eventCount('llm_failed');

console.log(`MiaoTarot negotiated-reading pilot — external traffic, last ${days} day${days === 1 ? '' : 's'}`);
console.log(`Choice readings started: ${choiceStarts}`);
console.log(`Choice readings completed: ${choiceCompletions} events across ${browserCount('reading_completed', 'choice')} anonymous browsers`);
console.log(`Choice reading completion rate: ${choiceStarts ? `${((choiceCompletions / choiceStarts) * 100).toFixed(1)}%` : 'n/a'} (${choiceCompletions}/${choiceStarts})`);
console.log(`Started without completion (exit proxy): ${Math.max(0, choiceStarts - choiceCompletions)}`);
console.log(`Focus first readable content — <1s / 1–3s / 3–8s / 8s+: ${eventCount('focus_first_content', 'under-1s')} / ${eventCount('focus_first_content', '1-3s')} / ${eventCount('focus_first_content', '3-8s')} / ${eventCount('focus_first_content', 'over-8s')}`);
console.log(`Focus confirmed: ${eventCount('focus_confirmed')}`);
console.log(`Focus corrected: ${eventCount('focus_corrected')}`);
console.log(`Correction felt improved / unchanged / worse: ${eventCount('focus_correction_feedback', 'improved')} / ${eventCount('focus_correction_feedback', 'unchanged')} / ${eventCount('focus_correction_feedback', 'worse')}`);
console.log(`Feedback responses: ${feedbackTotal}`);
console.log(`Captured / partial / missed: ${feedbackCaptured} / ${feedbackPartial} / ${feedbackMissed}`);
console.log(`Captured-or-partial among feedback responders: ${feedbackTotal ? `${((usefulFeedback / feedbackTotal) * 100).toFixed(1)}%` : 'n/a'}`);
console.log(`Feedback response events per completed choice reading: ${choiceCompletions ? `${((feedbackTotal / choiceCompletions) * 100).toFixed(1)}%` : 'n/a'}`);
console.log(`Response goal — clarify / direct / listen: ${eventCount('response_goal_selected', 'clarify')} / ${eventCount('response_goal_selected', 'direct')} / ${eventCount('response_goal_selected', 'listen')}`);
console.log(`LLM request failure rate: ${llmRequests ? `${((llmFailures / llmRequests) * 100).toFixed(1)}%` : 'n/a'} (${llmFailures}/${llmRequests})`);
console.log(`Support opened / QR saved: ${eventCount('support_opened')} / ${eventCount('support_qr_saved')}`);
console.log('Caveat: feedback rates describe responders, not all users; QR saves are support intent, not confirmed payments.');
