export interface SiteCounterResult {
  count: number;
  counted: boolean;
  period: 'all-time';
  dedupeWindowHours: number;
}

let counterRequest: Promise<SiteCounterResult | null> | null = null;

function isSiteCounterResult(value: unknown): value is SiteCounterResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<SiteCounterResult>;
  return Number.isSafeInteger(result.count) && Number(result.count) >= 0 && result.period === 'all-time';
}

async function requestSiteCounter(): Promise<SiteCounterResult | null> {
  try {
    const response = await fetch('/api/site-counter', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;

    const result: unknown = await response.json();
    return isSiteCounterResult(result) ? result : null;
  } catch {
    return null;
  }
}

export function loadSiteCounter() {
  // Vite does not serve Pages Functions; the production build still calls this endpoint.
  if (import.meta.env.DEV) return Promise.resolve(null);
  counterRequest ??= requestSiteCounter();
  return counterRequest;
}
