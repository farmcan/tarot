import assert from 'node:assert/strict';
import { getBrowserStorage } from '../site/src/domain/browserStorage';
import { createDailyMiaoReading } from '../site/src/domain/dailyReading';
import { cardBackThemes } from '../site/src/domain/interactiveDraw';
import { clearLlmConversation, isLlmConversationAutoStartPaused, loadLlmConversation, resumeLlmConversation, saveLlmConversation } from '../site/src/domain/llmConversationStorage';
import { getInitialMiaoVoiceMode, saveMiaoVoiceMode } from '../site/src/domain/miaoVoice';
import {
  claimCampaignEntryOpened, claimHomeActionSelected, claimHomeActionShown,
  claimProductPresenceEvents, getActiveShareToken, getOrCreateAnalyticsSessionId,
  getOrCreateAnonymousAnalyticsId, resetProductAnalyticsIdentity,
} from '../site/src/domain/productAnalytics';
import { clearReadingActions, loadReadingActions, saveReadingActions } from '../site/src/domain/readingAction';
import { loadReadingHistory, saveReadingHistory } from '../site/src/domain/readingHistory';
import { clearActiveReadingSession, loadActiveReadingSession, saveActiveReadingSession, type StoredReadingSession } from '../site/src/domain/readingSession';

const reading = createDailyMiaoReading(new Date(2026, 10, 1, 8));
const card = reading.cards[0].drawn;
const session: StoredReadingSession = {
  version: 1, readingId: reading.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  question: reading.question, topic: reading.topic, mode: 'single', contentPackId: 'doodle-full',
  backTheme: cardBackThemes[0],
  selectedCards: [{ hiddenId: 'selected-card', cardId: card.card.id, orientation: card.orientation }],
  flippedIds: ['selected-card'],
};
const conversation = {
  version: 1 as const, readingId: reading.id, updatedAt: new Date().toISOString(),
  baseContent: '已经翻开的牌义。', baseCardCount: 1, cardMessages: [], turns: [], draft: '',
};
const names = ['localStorage', 'sessionStorage'] as const;
const originals = names.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
const deny = () => { throw new DOMException('Storage unavailable', 'SecurityError'); };

try {
  for (const mode of ['missing', 'getter-denied', 'operations-denied', 'available'] as const) {
    for (const name of names) {
      const values = new Map<string, string>();
      const storage = {
        getItem: mode === 'operations-denied' ? deny : (key: string) => values.get(key) ?? null,
        setItem: mode === 'operations-denied' ? deny : (key: string, value: string) => { values.set(key, value); },
        removeItem: mode === 'operations-denied' ? deny : (key: string) => { values.delete(key); },
      };
      Object.defineProperty(globalThis, name, mode === 'getter-denied'
        ? { configurable: true, get: deny }
        : { configurable: true, value: mode === 'missing' ? undefined : storage });
      assert.doesNotThrow(() => getBrowserStorage(name), `${mode}: property access must be optional`);
    }

    // These default-argument calls are used during initial React render and
    // reading completion. A throwing getter must not escape before their catch.
    assert.deepEqual(loadReadingHistory(), []);
    assert.equal(loadActiveReadingSession(), null);
    assert.deepEqual(loadReadingActions(), []);
    assert.equal(loadLlmConversation(reading.id), null);
    assert.equal(getInitialMiaoVoiceMode(''), 'normal');
    assert.equal(saveReadingHistory([reading]), mode === 'available');
    assert.equal(saveActiveReadingSession(session), mode === 'available');
    assert.equal(saveLlmConversation(conversation), mode === 'available');
    saveMiaoVoiceMode('chaos');
    assert.equal(saveReadingActions([]), mode === 'available', `${mode}: failed persistence cannot report success`);

    if (mode === 'available') {
      assert.equal(loadReadingHistory()[0]?.cards[0].drawn.card.id, card.card.id);
      assert.equal(loadActiveReadingSession()?.readingId, reading.id);
      assert.equal(loadLlmConversation(reading.id)?.baseContent, conversation.baseContent);
      assert.equal(getInitialMiaoVoiceMode(''), 'chaos');
    } else {
      assert.deepEqual(loadReadingHistory(), []);
      assert.equal(loadActiveReadingSession(), null);
      assert.equal(loadLlmConversation(reading.id), null);
    }

    assert.match(getOrCreateAnonymousAnalyticsId(), /^[0-9a-f-]{36}$/);
    assert.match(getOrCreateAnalyticsSessionId(), /^[0-9a-f-]{36}$/);
    assert.doesNotThrow(() => {
      resetProductAnalyticsIdentity();
      claimProductPresenceEvents();
      claimCampaignEntryOpened();
      claimHomeActionShown('new-reading', 'hero-primary');
      claimHomeActionSelected();
      getActiveShareToken('');
      clearActiveReadingSession();
    });
    assert.equal(clearLlmConversation(reading.id), mode === 'available');
    assert.equal(isLlmConversationAutoStartPaused(reading.id), mode === 'available');
    assert.equal(resumeLlmConversation(reading.id), mode === 'available');
    assert.equal(isLlmConversationAutoStartPaused(reading.id), false);
    assert.equal(clearReadingActions(), mode === 'available');
    // The local deck and base interpretation need no successful storage/API.
    assert.equal(reading.cards.length, 1);
    assert.ok(reading.cards[0].miao.miaoName);
  }
} finally {
  names.forEach((name, index) => {
    if (originals[index]) Object.defineProperty(globalThis, name, originals[index]!);
    else Reflect.deleteProperty(globalThis, name);
  });
}

console.log('Browser storage regression passed: absent/throwing getters/failed operations do not block reading state; available storage still persists.');
