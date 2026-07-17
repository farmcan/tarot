import { cards, type CardOrientation, type DrawnCard } from '@cometpisces/tarot-kit';
import { MIAO_CONTENT_EDITION, miaoContentRevisions } from './miaoContent';
import { createMiaoReadingFromDrawn, type MiaoReading } from './miaoTarot';
import { getSpread, type ReadingTopic } from './tarot';
import { getMiaoContentPack } from './miaoContentPacks';

const SHARE_VERSION = '1';
const topics: ReadingTopic[] = ['love', 'work', 'interpersonal', 'others'];

export function createReadingShareUrl(reading: MiaoReading, baseHref: string) {
  const url = new URL('./', baseHref);
  url.search = '';
  url.hash = 'reading-result';
  url.searchParams.set('r', SHARE_VERSION);
  url.searchParams.set('spread', reading.spread.id);
  url.searchParams.set('cards', reading.cards.map(({ drawn }) => `${drawn.card.id}.${drawn.orientation === 'reversed' ? 'r' : 'u'}`).join(','));
  url.searchParams.set('topic', reading.topic);
  url.searchParams.set('pack', reading.contentPackId);
  url.searchParams.set('edition', MIAO_CONTENT_EDITION);
  url.searchParams.set('rev', reading.cards.map(({ drawn }) => miaoContentRevisions[drawn.card.id] ?? '1.0.0').join(','));
  if (reading.question) url.searchParams.set('q', reading.question.slice(0, 160));
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
