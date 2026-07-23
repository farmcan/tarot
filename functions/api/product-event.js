const EVENT_NAMES = new Set([
  'app_opened',
  'session_started',
  'reading_started',
  'reading_completed',
  'daily_reading',
  'share_copied',
  'share_image',
  'share_result',
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
  'support_qr_saved',
]);

const HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
};

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_-]{1,96}$/;
const MACHINE_LABEL_PATTERN = /^[a-z0-9-]{1,40}$/;

function json(data, status) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

async function hashIdentifier(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestPost({ request, env }) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'cross_site_request' }, 403);
  }
  if (!env.MIAOTAROT_ANALYTICS) {
    return json({ error: 'analytics_unavailable' }, 503);
  }

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name : '';
    const variant = typeof body?.variant === 'string' ? body.variant : 'default';
    const anonymousId = typeof body?.anonymousId === 'string' ? body.anonymousId : '';
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
    const readingId = typeof body?.readingId === 'string' ? body.readingId : '';
    const source = typeof body?.source === 'string' ? body.source : 'site';
    const trafficType = typeof body?.trafficType === 'string' ? body.trafficType : 'external';
    if (
      !EVENT_NAMES.has(name)
      || !MACHINE_LABEL_PATTERN.test(variant)
      || !IDENTIFIER_PATTERN.test(anonymousId)
      || !IDENTIFIER_PATTERN.test(sessionId)
      || (readingId && !IDENTIFIER_PATTERN.test(readingId))
      || !MACHINE_LABEL_PATTERN.test(source)
      || !['external', 'internal'].includes(trafficType)
    ) {
      return json({ error: 'invalid_event' }, 400);
    }

    const [anonymousIdHash, sessionIdHash, readingIdHash] = await Promise.all([
      hashIdentifier(anonymousId),
      hashIdentifier(sessionId),
      readingId ? hashIdentifier(readingId) : Promise.resolve(''),
    ]);

    env.MIAOTAROT_ANALYTICS.writeDataPoint({
      indexes: [anonymousIdHash],
      blobs: [name, variant, sessionIdHash, readingIdHash, source, trafficType],
      doubles: [1],
    });

    return json({ accepted: true }, 202);
  } catch {
    return json({ error: 'invalid_event' }, 400);
  }
}
