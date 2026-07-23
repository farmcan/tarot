const MAX_BODY_BYTES = 56 * 1024;
const MAX_SNAPSHOT_BYTES = 48 * 1024;
const RETENTION_DAYS = 30;
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

function isSameOriginRequest(request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  return fetchSite !== 'cross-site' && (!origin || origin === requestUrl.origin);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readCredentials(request, url) {
  const conversationId = url.searchParams.get('id') || '';
  const accessKey = request.headers.get('x-conversation-key') || '';
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(conversationId)) return null;
  if (!/^[a-f0-9]{64}$/.test(accessKey)) return null;
  return { conversationId, accessKey };
}

async function hashAccessKey(accessKey) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessKey));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function cleanExpired(database) {
  await database.prepare('DELETE FROM ai_conversations WHERE datetime(expires_at) <= CURRENT_TIMESTAMP').run();
}

function unavailable() {
  return json({
    available: false,
    error: 'conversation_storage_unavailable',
    message: 'Cloud conversation storage is not configured.',
  }, { status: 503 });
}

export async function onRequestOptions({ request }) {
  return isSameOriginRequest(request)
    ? new Response(null, { status: 204, headers: RESPONSE_HEADERS })
    : json({ error: 'cross_site_request' }, { status: 403 });
}

export async function onRequestGet({ request, env }) {
  if (!isSameOriginRequest(request)) return json({ error: 'cross_site_request' }, { status: 403 });
  if (!env.MIAOTAROT_DB) return unavailable();

  const url = new URL(request.url);
  if (!url.searchParams.has('id')) {
    return json({ available: true, retentionDays: RETENTION_DAYS, optIn: true });
  }

  const credentials = readCredentials(request, url);
  if (!credentials) return json({ error: 'invalid_credentials' }, { status: 400 });
  const accessKeyHash = await hashAccessKey(credentials.accessKey);

  try {
    await cleanExpired(env.MIAOTAROT_DB);
    const row = await env.MIAOTAROT_DB
      .prepare(`
        SELECT reading_id, snapshot_json, updated_at, expires_at
        FROM ai_conversations
        WHERE conversation_id = ? AND access_key_hash = ?
      `)
      .bind(credentials.conversationId, accessKeyHash)
      .first();
    if (!row) return json({ error: 'conversation_not_found' }, { status: 404 });

    return json({
      conversationId: credentials.conversationId,
      readingId: row.reading_id,
      snapshot: JSON.parse(row.snapshot_json),
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    });
  } catch {
    return unavailable();
  }
}

export async function onRequestPost({ request, env }) {
  if (!isSameOriginRequest(request)) return json({ error: 'cross_site_request' }, { status: 403 });
  if (!env.MIAOTAROT_DB) return unavailable();

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ error: 'request_too_large' }, { status: 413 });

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return json({ error: 'request_too_large' }, { status: 413 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!isRecord(body) || !isRecord(body.snapshot) || typeof body.readingId !== 'string') {
    return json({ error: 'invalid_snapshot' }, { status: 400 });
  }
  if (body.readingId.length < 8 || body.readingId.length > 100) {
    return json({ error: 'invalid_reading_id' }, { status: 400 });
  }

  const url = new URL(request.url);
  const credentials = readCredentials(request, url);
  if (!credentials) return json({ error: 'invalid_credentials' }, { status: 400 });
  const snapshotJson = JSON.stringify(body.snapshot);
  if (new TextEncoder().encode(snapshotJson).length > MAX_SNAPSHOT_BYTES) {
    return json({ error: 'snapshot_too_large' }, { status: 413 });
  }

  const accessKeyHash = await hashAccessKey(credentials.accessKey);
  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    await cleanExpired(env.MIAOTAROT_DB);
    const existing = await env.MIAOTAROT_DB
      .prepare('SELECT access_key_hash FROM ai_conversations WHERE conversation_id = ?')
      .bind(credentials.conversationId)
      .first();
    if (existing && existing.access_key_hash !== accessKeyHash) {
      return json({ error: 'conversation_not_found' }, { status: 404 });
    }

    await env.MIAOTAROT_DB
      .prepare(`
        INSERT INTO ai_conversations (
          conversation_id, access_key_hash, reading_id, snapshot_json, expires_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(conversation_id) DO UPDATE SET
          reading_id = excluded.reading_id,
          snapshot_json = excluded.snapshot_json,
          updated_at = CURRENT_TIMESTAMP,
          expires_at = excluded.expires_at
        WHERE ai_conversations.access_key_hash = excluded.access_key_hash
      `)
      .bind(
        credentials.conversationId,
        accessKeyHash,
        body.readingId,
        snapshotJson,
        expiresAt,
      )
      .run();

    return json({
      saved: true,
      conversationId: credentials.conversationId,
      expiresAt,
      retentionDays: RETENTION_DAYS,
    });
  } catch {
    return unavailable();
  }
}

export async function onRequestDelete({ request, env }) {
  if (!isSameOriginRequest(request)) return json({ error: 'cross_site_request' }, { status: 403 });
  if (!env.MIAOTAROT_DB) return unavailable();
  const credentials = readCredentials(request, new URL(request.url));
  if (!credentials) return json({ error: 'invalid_credentials' }, { status: 400 });
  const accessKeyHash = await hashAccessKey(credentials.accessKey);

  try {
    const result = await env.MIAOTAROT_DB
      .prepare('DELETE FROM ai_conversations WHERE conversation_id = ? AND access_key_hash = ?')
      .bind(credentials.conversationId, accessKeyHash)
      .run();
    return json({ deleted: Number(result?.meta?.changes || 0) > 0 });
  } catch {
    return unavailable();
  }
}
