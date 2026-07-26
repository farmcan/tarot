import type { MiaoReading } from './miaoTarot';
import { getReadingFingerprint } from './readingHistory';

export const READING_ACTION_STORAGE_KEY = 'miaotarot:reading-actions:v1';

const READING_ACTION_VERSION = 1;
const MAX_READING_ACTIONS = 8;
const MAX_ACTION_LENGTH = 120;
const FOLLOW_UP_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_FOLLOW_UP_AGE_MS = 8 * 60 * 60 * 1000;

export type ReadingActionOutcome = 'done' | 'ongoing' | 'not-fit';

export interface SavedReadingAction {
  readingKey: string;
  readingId: string;
  action: string;
  savedAt: string;
  outcome?: ReadingActionOutcome;
  respondedAt?: string;
  lastPresentedLocalDate?: string;
}

type ReadingActionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

function isOutcome(value: unknown): value is ReadingActionOutcome {
  return ['done', 'ongoing', 'not-fit'].includes(String(value));
}

function isLocalDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseStoredAction(value: unknown): SavedReadingAction | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SavedReadingAction>;
  const action = typeof candidate.action === 'string' ? candidate.action.trim().slice(0, MAX_ACTION_LENGTH) : '';

  if (
    typeof candidate.readingKey !== 'string'
    || !candidate.readingKey
    || typeof candidate.readingId !== 'string'
    || !candidate.readingId
    || !action
    || !isIsoDate(candidate.savedAt)
  ) {
    return null;
  }

  if (candidate.outcome !== undefined && !isOutcome(candidate.outcome)) return null;
  if (candidate.outcome && !isIsoDate(candidate.respondedAt)) return null;
  if (
    candidate.lastPresentedLocalDate !== undefined
    && !isLocalDateKey(candidate.lastPresentedLocalDate)
  ) {
    return null;
  }

  return {
    readingKey: candidate.readingKey,
    readingId: candidate.readingId,
    action,
    savedAt: candidate.savedAt,
    ...(candidate.outcome ? {
      outcome: candidate.outcome,
      respondedAt: candidate.respondedAt,
    } : {}),
    ...(candidate.lastPresentedLocalDate ? {
      lastPresentedLocalDate: candidate.lastPresentedLocalDate,
    } : {}),
  };
}

export function loadReadingActions(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  if (!storage) return [];
  try {
    const stored = JSON.parse(storage.getItem(READING_ACTION_STORAGE_KEY) || 'null') as {
      version?: unknown;
      entries?: unknown;
    } | null;
    if (stored?.version !== READING_ACTION_VERSION || !Array.isArray(stored.entries)) return [];
    return stored.entries
      .map(parseStoredAction)
      .filter((entry): entry is SavedReadingAction => entry !== null)
      .slice(0, MAX_READING_ACTIONS);
  } catch {
    return [];
  }
}

export function saveReadingActions(
  entries: readonly SavedReadingAction[],
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  if (!storage) return false;
  try {
    storage.setItem(READING_ACTION_STORAGE_KEY, JSON.stringify({
      version: READING_ACTION_VERSION,
      entries: entries.slice(0, MAX_READING_ACTIONS),
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearReadingActions(
  storage: Pick<Storage, 'removeItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
) {
  if (!storage) return false;
  try {
    storage.removeItem(READING_ACTION_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function findReadingAction(
  entries: readonly SavedReadingAction[],
  reading: MiaoReading,
) {
  const readingKey = getReadingActionKey(reading);
  return entries.find((entry) => entry.readingKey === readingKey) ?? null;
}

export function upsertReadingAction(
  entries: readonly SavedReadingAction[],
  reading: MiaoReading,
  rawAction: string,
  now = new Date(),
) {
  const action = rawAction.trim().slice(0, MAX_ACTION_LENGTH);
  if (!action) return [...entries];

  const readingKey = getReadingActionKey(reading);
  const existing = entries.find((entry) => entry.readingKey === readingKey);
  const next: SavedReadingAction = {
    readingKey,
    readingId: reading.id,
    action,
    savedAt: existing && !existing.outcome ? existing.savedAt : now.toISOString(),
    ...(existing && !existing.outcome && existing.lastPresentedLocalDate ? {
      lastPresentedLocalDate: existing.lastPresentedLocalDate,
    } : {}),
  };

  return [
    next,
    ...entries.filter((entry) => entry.readingKey !== readingKey),
  ].slice(0, MAX_READING_ACTIONS);
}

export function removeReadingAction(
  entries: readonly SavedReadingAction[],
  reading: MiaoReading,
) {
  const readingKey = getReadingActionKey(reading);
  return entries.filter((entry) => entry.readingKey !== readingKey);
}

export function resolveReadingAction(
  entries: readonly SavedReadingAction[],
  readingKey: string,
  outcome: ReadingActionOutcome,
  now = new Date(),
) {
  return entries.map((entry) => (
    entry.readingKey === readingKey
      ? { ...entry, outcome, respondedAt: now.toISOString() }
      : entry
  ));
}

function hashReadingFingerprint(value: string) {
  let first = 2166136261;
  let second = 0x9e3779b9;
  for (const character of value) {
    const code = character.charCodeAt(0);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second ^ code, 2246822519);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

export function getReadingActionKey(reading: MiaoReading) {
  return `action-${hashReadingFingerprint(getReadingFingerprint(reading))}`;
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalDateOrdinal(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

export function getReadingActionAgeDays(entry: SavedReadingAction, now = new Date()) {
  const savedAt = new Date(entry.savedAt);
  if (!Number.isFinite(savedAt.getTime())) return Number.POSITIVE_INFINITY;
  return getLocalDateOrdinal(now) - getLocalDateOrdinal(savedAt);
}

export function getDueReadingAction(
  entries: readonly SavedReadingAction[],
  now = new Date(),
) {
  return entries
    .filter((entry) => {
      const ageDays = getReadingActionAgeDays(entry, now);
      const ageMs = now.getTime() - new Date(entry.savedAt).getTime();
      return (
        !entry.outcome
        && ageMs >= MIN_FOLLOW_UP_AGE_MS
        && ageDays >= 1
        && ageDays <= FOLLOW_UP_WINDOW_DAYS
        && !entry.lastPresentedLocalDate
      );
    })
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))[0] ?? null;
}

export function markReadingActionPresented(
  entries: readonly SavedReadingAction[],
  readingKey: string,
  now = new Date(),
) {
  const lastPresentedLocalDate = getLocalDateKey(now);
  return entries.map((entry) => (
    entry.readingKey === readingKey
      ? { ...entry, lastPresentedLocalDate }
      : entry
  ));
}
