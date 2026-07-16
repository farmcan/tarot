const COUNTER_KEY = 'site-visits';
const COOKIE_NAME = 'miaotarot_visit';
const COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...RESPONSE_HEADERS,
      ...(init.headers || {}),
    },
  });
}

function hasVisitCookie(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .some((part) => part === `${COOKIE_NAME}=1`);
}

function isCrossSiteRequest(request) {
  return request.headers.get('sec-fetch-site') === 'cross-site';
}

function isLikelyBot(request) {
  const userAgent = request.headers.get('user-agent') || '';
  return /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp/i.test(userAgent);
}

async function readCount(database) {
  const row = await database
    .prepare('SELECT count FROM site_counters WHERE counter_key = ?')
    .bind(COUNTER_KEY)
    .first();

  return Number(row?.count || 0);
}

async function incrementCount(database) {
  const row = await database
    .prepare(`
      INSERT INTO site_counters (counter_key, count, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(counter_key) DO UPDATE SET
        count = count + 1,
        updated_at = CURRENT_TIMESTAMP
      RETURNING count
    `)
    .bind(COUNTER_KEY)
    .first();

  return Number(row?.count || 0);
}

function unavailableResponse() {
  return json(
    {
      error: 'counter_unavailable',
      message: 'Bind MIAOTAROT_DB and apply the site counter migration.',
    },
    { status: 503 },
  );
}

export async function onRequestGet({ env }) {
  if (!env.MIAOTAROT_DB) return unavailableResponse();

  try {
    const count = await readCount(env.MIAOTAROT_DB);
    return json({ count, period: 'all-time' });
  } catch {
    return unavailableResponse();
  }
}

export async function onRequestPost({ request, env }) {
  if (isCrossSiteRequest(request)) {
    return json({ error: 'cross_site_request' }, { status: 403 });
  }
  if (!env.MIAOTAROT_DB) return unavailableResponse();

  try {
    const alreadyCounted = hasVisitCookie(request) || isLikelyBot(request);
    const count = alreadyCounted
      ? await readCount(env.MIAOTAROT_DB)
      : await incrementCount(env.MIAOTAROT_DB);

    const headers = alreadyCounted
      ? {}
      : {
        'Set-Cookie': `${COOKIE_NAME}=1; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      };

    return json(
      {
        count,
        counted: !alreadyCounted,
        period: 'all-time',
        dedupeWindowHours: 24,
      },
      { headers },
    );
  } catch {
    return unavailableResponse();
  }
}
