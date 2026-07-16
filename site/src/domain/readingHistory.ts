import type { MiaoReading } from './miaoTarot';
import { createReadingShareUrl, parseReadingShareUrl } from './readingShare';

const HISTORY_KEY = 'miaotarot:reading-history:v1';
const HISTORY_VERSION = 1;

function getReadingSearch(reading: MiaoReading) {
  return new URL(createReadingShareUrl(reading, 'https://miaotarot.local/')).search;
}

export function getReadingFingerprint(reading: MiaoReading) {
  return getReadingSearch(reading);
}

export function loadReadingHistory(storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage) {
  if (!storage) return [];
  try {
    const stored = JSON.parse(storage.getItem(HISTORY_KEY) || 'null') as { version?: number; entries?: unknown[] } | null;
    if (stored?.version !== HISTORY_VERSION || !Array.isArray(stored.entries)) return [];
    return stored.entries
      .filter((entry): entry is string => typeof entry === 'string')
      .map((search) => parseReadingShareUrl(search))
      .filter((reading): reading is MiaoReading => reading !== null)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function saveReadingHistory(readings: readonly MiaoReading[], storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage) {
  if (!storage) return;
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify({
      version: HISTORY_VERSION,
      entries: readings.slice(0, 8).map(getReadingSearch),
    }));
  } catch {
    // Storage can be unavailable in private browsing; readings still work in memory.
  }
}
