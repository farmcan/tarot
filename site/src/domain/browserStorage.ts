/** Storage getters can throw before any getItem/setItem call is made. */
export function getBrowserStorage(name: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    return globalThis[name] ?? null;
  } catch {
    return null;
  }
}
