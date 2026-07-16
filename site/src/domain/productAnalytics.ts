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

export function trackProductEvent(name: ProductEventName, variant = 'default') {
  if (import.meta.env.DEV || typeof window === 'undefined') return;

  const body = JSON.stringify({ name, variant });
  if (navigator.sendBeacon?.('/api/product-event', new Blob([body], { type: 'application/json' }))) return;

  void fetch('/api/product-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'same-origin',
    keepalive: true,
  }).catch(() => undefined);
}
