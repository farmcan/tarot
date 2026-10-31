import type { MiaoReading } from './miaoTarot';
import { getBrowserStorage } from './browserStorage';
import { createReadingShareUrl, parseReadingShareUrl } from './readingShare';

const HISTORY_KEY = 'miaotarot:reading-history:v1';
const HISTORY_VERSION = 1;

function getReadingSearch(reading: MiaoReading) {
  return new URL(createReadingShareUrl(reading, 'https://miaotarot.local/', {
    includeQuestion: true,
  })).search;
}

export function getReadingFingerprint(reading: MiaoReading) {
  return getReadingSearch(reading);
}

export function loadReadingHistory(storage: Pick<Storage, 'getItem'> | null = getBrowserStorage('localStorage')) {
  if (!storage) return [];
  try {
    const stored = JSON.parse(storage.getItem(HISTORY_KEY) || 'null') as {
      version?: number;
      entries?: unknown[];
      identities?: Array<{ id?: unknown; createdAt?: unknown; question?: unknown }>;
    } | null;
    if (stored?.version !== HISTORY_VERSION || !Array.isArray(stored.entries)) return [];
    return stored.entries
      .map((entry, index) => {
        // Keep accepting the original URL-only history, while retaining the
        // identity that joins newer readings to their saved AI conversation.
        const metadata = Array.isArray(stored.identities) ? stored.identities[index] : null;
        const value = typeof entry === 'string'
          ? { search: entry, id: metadata?.id, createdAt: metadata?.createdAt, question: metadata?.question }
          : entry as { search?: unknown; id?: unknown; createdAt?: unknown; question?: unknown } | null;
        if (!value || typeof value !== 'object') return null;
        if (typeof value.search !== 'string') return null;
        const reading = parseReadingShareUrl(value.search);
        if (!reading) return null;
        return {
          ...reading,
          ...(typeof value.question === 'string' ? { question: value.question.slice(0, 500) } : {}),
          ...(typeof value.id === 'string' && value.id ? { id: value.id } : {}),
          ...(typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
            ? { createdAt: value.createdAt }
            : {}),
        };
      })
      .filter((reading): reading is MiaoReading => reading !== null)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function saveReadingHistory(readings: readonly MiaoReading[], storage: Pick<Storage, 'setItem'> | null = getBrowserStorage('localStorage')) {
  if (!storage) return false;
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify({
      version: HISTORY_VERSION,
      // URL entries stay readable by already-cached v1 clients. Identity is
      // additive metadata rather than a same-version change to entry shape.
      entries: readings.slice(0, 8).map(getReadingSearch),
      identities: readings.slice(0, 8).map((reading) => ({
        id: reading.id,
        createdAt: reading.createdAt,
        question: reading.question.slice(0, 500),
      })),
    }));
    return true;
  } catch {
    // Storage can be unavailable in private browsing; readings still work in memory.
    return false;
  }
}
