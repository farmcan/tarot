const EVENT_NAMES = new Set([
  'app_opened',
  'session_started',
  'home_action_shown',
  'home_action_selected',
  'voice_mode_selected',
  'reading_started',
  'reading_completed',
  'daily_reading',
  'share_copied',
  'share_image',
  'share_result',
  'share_landed',
  'share_remix_started',
  'llm_requested',
  'llm_succeeded',
  'llm_failed',
  'focus_first_content',
  'focus_confirmed',
  'focus_corrected',
  'focus_correction_feedback',
  'response_goal_selected',
  'reading_feedback_submitted',
  'action_saved',
  'action_review_shown',
  'action_reviewed',
  'support_opened',
  'support_qr_saved',
]);

const READING_VARIANTS = new Set([
  'single',
  'two-card',
  'three-card',
  'four-card',
  'choice',
  'relationship',
]);
const HOME_PRIMARY_VARIANTS = new Set([
  'new-reading',
  'continue-result',
  'resume-reading',
]);

const HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
};

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_-]{1,96}$/;
const MACHINE_LABEL_PATTERN = /^[a-z0-9-]{1,40}$/;
const SHARE_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function matchesStrictEventContract(name, variant, source, readingId) {
  if (name === 'home_action_shown' || name === 'home_action_selected') {
    return (
      !readingId
      && (
        (source === 'hero-primary' && HOME_PRIMARY_VARIANTS.has(variant))
        || (source === 'hero-daily' && variant === 'daily-reading')
      )
    );
  }

  if (name === 'voice_mode_selected') {
    return !readingId && source === 'reading-desk' && ['normal', 'chaos'].includes(variant);
  }

  if (name === 'reading_started') {
    return (
      Boolean(readingId)
      && READING_VARIANTS.has(variant)
      && ['reading-normal', 'reading-chaos'].includes(source)
    );
  }

  if (name === 'reading_completed') {
    return (
      Boolean(readingId)
      && READING_VARIANTS.has(variant)
      && ['reading-desk', 'daily-card'].includes(source)
    );
  }

  if (name === 'daily_reading') {
    return (
      Boolean(readingId)
      && variant === 'single'
      && ['hero-daily', 'return-checkin'].includes(source)
    );
  }

  return true;
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
    const shareToken = typeof body?.shareToken === 'string' ? body.shareToken : '';
    const source = typeof body?.source === 'string' ? body.source : 'site';
    const trafficType = typeof body?.trafficType === 'string' ? body.trafficType : 'external';
    if (
      !EVENT_NAMES.has(name)
      || !MACHINE_LABEL_PATTERN.test(variant)
      || !IDENTIFIER_PATTERN.test(anonymousId)
      || !IDENTIFIER_PATTERN.test(sessionId)
      || (readingId && !IDENTIFIER_PATTERN.test(readingId))
      || (shareToken && !SHARE_TOKEN_PATTERN.test(shareToken))
      || (['share_landed', 'share_remix_started'].includes(name) && !shareToken)
      || !MACHINE_LABEL_PATTERN.test(source)
      || !['external', 'internal'].includes(trafficType)
      || !matchesStrictEventContract(name, variant, source, readingId)
    ) {
      return json({ error: 'invalid_event' }, 400);
    }

    const [anonymousIdHash, sessionIdHash, readingIdHash, shareTokenHash] = await Promise.all([
      hashIdentifier(anonymousId),
      hashIdentifier(sessionId),
      readingId ? hashIdentifier(readingId) : Promise.resolve(''),
      shareToken ? hashIdentifier(shareToken) : Promise.resolve(''),
    ]);

    env.MIAOTAROT_ANALYTICS.writeDataPoint({
      indexes: [anonymousIdHash],
      blobs: [name, variant, sessionIdHash, readingIdHash, source, trafficType, shareTokenHash],
      doubles: [1],
    });

    return json({ accepted: true }, 202);
  } catch {
    return json({ error: 'invalid_event' }, 400);
  }
}
