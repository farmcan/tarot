import { cards, type CardOrientation, type DrawnCard } from '@cometpisces/tarot-kit';
import {
  MIAO_CONTENT_EDITION,
  MIAO_DEFAULT_CONTENT_REVISION,
  miaoContentRevisions,
} from './miaoContent';
import { createMiaoReadingFromDrawn, type MiaoReading } from './miaoTarot';
import { getSpread, type ReadingTopic } from './tarot';
import { getMiaoContentPack } from './miaoContentPacks';

const SHARE_VERSION = '1';
const topics: ReadingTopic[] = ['love', 'work', 'interpersonal', 'others'];
const SHARE_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ReadingShareOptions {
  includeQuestion?: boolean;
  shareToken?: string;
}

export interface ReadingShareAttribution {
  token: string;
  source: 'share';
}

export function createReadingShareToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getReadingShareAttribution(search: string): ReadingShareAttribution | null {
  try {
    const params = new URLSearchParams(search);
    const token = params.get('st') || '';
    if (params.get('src') !== 'share' || !SHARE_TOKEN_PATTERN.test(token)) return null;
    return { token, source: 'share' };
  } catch {
    return null;
  }
}

export function createReadingShareUrl(
  reading: MiaoReading,
  baseHref: string,
  options: ReadingShareOptions = {},
) {
  const url = new URL('./', baseHref);
  url.search = '';
  url.hash = 'reading-result';
  url.searchParams.set('r', SHARE_VERSION);
  url.searchParams.set('spread', reading.spread.id);
  url.searchParams.set('cards', reading.cards.map(({ drawn }) => `${drawn.card.id}.${drawn.orientation === 'reversed' ? 'r' : 'u'}`).join(','));
  url.searchParams.set('topic', reading.topic);
  url.searchParams.set('pack', reading.contentPackId);
  url.searchParams.set('edition', MIAO_CONTENT_EDITION);
  url.searchParams.set('rev', reading.cards.map(({ drawn }) => miaoContentRevisions[drawn.card.id] ?? MIAO_DEFAULT_CONTENT_REVISION).join(','));
  if (options.includeQuestion && reading.question) {
    url.searchParams.set('q', reading.question.slice(0, 160));
  }
  if (options.shareToken && SHARE_TOKEN_PATTERN.test(options.shareToken)) {
    url.searchParams.set('src', 'share');
    url.searchParams.set('st', options.shareToken);
    url.hash = 'shared-reading-landing';
  }
  return url.href;
}

export function parseReadingShareUrl(search: string): MiaoReading | null {
  try {
    const params = new URLSearchParams(search);
    if (params.get('r') !== SHARE_VERSION) return null;

    const spreadId = params.get('spread') || '';
    const spread = getSpread(spreadId);
    if (spread.id !== spreadId) return null;

    const cardById = new Map(cards.map((card) => [card.id, card]));
    const cardTokens = (params.get('cards') || '').split(',').filter(Boolean);
    if (cardTokens.length !== spread.positions.length) return null;

    const drawnCards: DrawnCard[] = cardTokens.map((token) => {
      const [cardId, orientationToken] = token.split('.');
      const card = cardById.get(cardId);
      if (!card || !['u', 'r'].includes(orientationToken)) throw new Error('Invalid shared card');
      const orientation: CardOrientation = orientationToken === 'r' ? 'reversed' : 'upright';
      return { card, orientation };
    });

    const topicToken = params.get('topic') as ReadingTopic | null;
    const topic = topicToken && topics.includes(topicToken) ? topicToken : 'others';
    const contentPackId = getMiaoContentPack(params.get('pack') || 'classic-major').id;
    return createMiaoReadingFromDrawn({
      question: (params.get('q') || '').slice(0, 160),
      topic,
      spreadId,
    }, drawnCards, contentPackId);
  } catch {
    return null;
  }
}
