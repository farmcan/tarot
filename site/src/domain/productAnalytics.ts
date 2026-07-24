export type ProductEventName =
  | 'app_opened'
  | 'session_started'
  | 'voice_mode_selected'
  | 'reading_started'
  | 'reading_completed'
  | 'daily_reading'
  | 'share_copied'
  | 'share_image'
  | 'share_result'
  | 'llm_requested'
  | 'llm_succeeded'
  | 'llm_failed'
  | 'focus_first_content'
  | 'focus_confirmed'
  | 'focus_corrected'
  | 'focus_correction_feedback'
  | 'response_goal_selected'
  | 'reading_feedback_submitted'
  | 'support_opened'
  | 'support_qr_saved';

export interface ProductEventMetadata {
  readingId?: string;
  source?: string;
}

type AnalyticsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const ANONYMOUS_ID_KEY = 'miaotarot:analytics-id:v1';
const SESSION_ID_KEY = 'miaotarot:analytics-session:v1';
const DAILY_ACTIVE_KEY = 'miaotarot:analytics-daily-active:v1';
const SESSION_STARTED_KEY = 'miaotarot:analytics-session-started:v1';
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
    persistentStorage?.removeItem(DAILY_ACTIVE_KEY);
  } catch {
    // Reset remains best-effort when browser storage is unavailable.
  }
  try {
    currentSessionStorage?.removeItem(SESSION_ID_KEY);
    currentSessionStorage?.removeItem(SESSION_STARTED_KEY);
  } catch {
    // Reset remains best-effort when browser storage is unavailable.
  }
}

export function claimProductPresenceEvents(
  persistentStorage: AnalyticsStorage | null = typeof localStorage === 'undefined' ? null : localStorage,
  currentSessionStorage: AnalyticsStorage | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
  now = Date.now(),
) {
  const events: Array<'app_opened' | 'session_started'> = [];
  const utcDate = new Date(now).toISOString().slice(0, 10);

  try {
    if (persistentStorage?.getItem(DAILY_ACTIVE_KEY) !== utcDate) {
      persistentStorage?.setItem(DAILY_ACTIVE_KEY, utcDate);
      events.push('app_opened');
    }
  } catch {
    events.push('app_opened');
  }

  try {
    if (currentSessionStorage?.getItem(SESSION_STARTED_KEY) !== '1') {
      currentSessionStorage?.setItem(SESSION_STARTED_KEY, '1');
      events.push('session_started');
    }
  } catch {
    events.push('session_started');
  }

  return events;
}

export function classifyAcquisitionSource(
  referrer = typeof document === 'undefined' ? '' : document.referrer,
  currentHostname = typeof location === 'undefined' ? '' : location.hostname,
) {
  if (!referrer) return 'direct';

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    const current = currentHostname.toLowerCase();
    if (current && (hostname === current || hostname.endsWith(`.${current}`))) return 'internal';
    if (/(^|\.)(baidu|bing|duckduckgo|google|sogou|so)\./.test(hostname)) return 'search';
    if (/(^|\.)(bilibili|douyin|facebook|instagram|reddit|tiktok|weibo|xiaohongshu|x|youtube)\./.test(hostname)) return 'social';
    return 'referral';
  } catch {
    return 'direct';
  }
}

export function getAnalyticsTrafficType(
  search = typeof location === 'undefined' ? '' : location.search,
) {
  try {
    return new URLSearchParams(search).get('analytics') === 'internal'
      ? 'internal'
      : 'external';
  } catch {
    return 'external';
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
    trafficType: getAnalyticsTrafficType(),
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

export function trackProductPresence() {
  if (import.meta.env.DEV || typeof window === 'undefined') return;
  const source = classifyAcquisitionSource();
  claimProductPresenceEvents().forEach((name) => {
    trackProductEvent(name, 'default', { source });
  });
}
