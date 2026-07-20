export type ProductEventName =
  | 'reading_started'
  | 'reading_completed'
  | 'daily_reading'
  | 'share_copied'
  | 'share_image'
  | 'share_result'
  | 'llm_requested'
  | 'llm_succeeded'
  | 'llm_failed';

export interface ProductEventMetadata {
  readingId?: string;
  source?: string;
}

type AnalyticsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const ANONYMOUS_ID_KEY = 'miaotarot:analytics-id:v1';
const SESSION_ID_KEY = 'miaotarot:analytics-session:v1';
const ANONYMOUS_ID_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createAnalyticsId() {
  return crypto.randomUUID();
}

export function getOrCreateAnonymousAnalyticsId(
  storage: AnalyticsStorage | null = typeof localStorage === 'undefined' ? null : localStorage,
  now = Date.now(),
  generateId = createAnalyticsId,
) {
  if (storage) {
    try {
      const stored = JSON.parse(storage.getItem(ANONYMOUS_ID_KEY) || 'null') as { id?: unknown; createdAt?: unknown } | null;
      if (
        typeof stored?.id === 'string'
        && UUID_PATTERN.test(stored.id)
        && typeof stored.createdAt === 'number'
        && stored.createdAt <= now
        && now - stored.createdAt < ANONYMOUS_ID_MAX_AGE_MS
      ) {
        return stored.id;
      }
    } catch {
      // A malformed or unavailable entry is replaced below.
    }
  }

  const id = generateId();
  if (storage) {
    try {
      storage.setItem(ANONYMOUS_ID_KEY, JSON.stringify({ id, createdAt: now }));
    } catch {
      // Analytics remains best-effort when browser storage is unavailable.
    }
  }
  return id;
}

export function getOrCreateAnalyticsSessionId(
  storage: AnalyticsStorage | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
  generateId = createAnalyticsId,
) {
  if (storage) {
    try {
      const stored = storage.getItem(SESSION_ID_KEY);
      if (stored && UUID_PATTERN.test(stored)) return stored;
    } catch {
      // A malformed or unavailable entry is replaced below.
    }
  }

  const id = generateId();
  if (storage) {
    try {
      storage.setItem(SESSION_ID_KEY, id);
    } catch {
      // Analytics remains best-effort when browser storage is unavailable.
    }
  }
  return id;
}

export function resetProductAnalyticsIdentity(
  persistentStorage: AnalyticsStorage | null = typeof localStorage === 'undefined' ? null : localStorage,
  currentSessionStorage: AnalyticsStorage | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
) {
  try {
    persistentStorage?.removeItem(ANONYMOUS_ID_KEY);
  } catch {
    // Reset remains best-effort when browser storage is unavailable.
  }
  try {
    currentSessionStorage?.removeItem(SESSION_ID_KEY);
  } catch {
    // Reset remains best-effort when browser storage is unavailable.
  }
}

export function trackProductEvent(
  name: ProductEventName,
  variant = 'default',
  metadata: ProductEventMetadata = {},
) {
  if (import.meta.env.DEV || typeof window === 'undefined') return;

  const body = JSON.stringify({
    name,
    variant,
    anonymousId: getOrCreateAnonymousAnalyticsId(),
    sessionId: getOrCreateAnalyticsSessionId(),
    readingId: metadata.readingId,
    source: metadata.source || 'site',
  });
  if (navigator.sendBeacon?.('/api/product-event', new Blob([body], { type: 'application/json' }))) return;

  void fetch('/api/product-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'same-origin',
    keepalive: true,
  }).catch(() => undefined);
}
