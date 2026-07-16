const EVENT_NAMES = new Set([
  'reading_started',
  'reading_completed',
  'daily_reading',
  'share_copied',
  'share_image',
  'share_result',
  'llm_requested',
  'llm_succeeded',
  'llm_failed',
]);

const HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(data, status) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

export async function onRequestPost({ request, env }) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: 'cross_site_request' }, 403);
  }
  if (!env.MIAOTAROT_DB) {
    return json({ error: 'analytics_unavailable' }, 503);
  }

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name : '';
    const variant = typeof body?.variant === 'string' ? body.variant : 'default';
    if (!EVENT_NAMES.has(name) || !/^[a-z0-9-]{1,40}$/.test(variant)) {
      return json({ error: 'invalid_event' }, 400);
    }

    await env.MIAOTAROT_DB.prepare(`
      INSERT INTO product_event_daily (event_date, event_name, variant, count, updated_at)
      VALUES (date('now'), ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(event_date, event_name, variant) DO UPDATE SET
        count = count + 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(name, variant).run();

    return json({ accepted: true }, 202);
  } catch {
    return json({ error: 'invalid_event' }, 400);
  }
}
