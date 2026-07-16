import { cards } from '@cometpisces/tarot-kit';
import { createMiaoReadingFromDrawn } from './miaoTarot';

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDailyMiaoReading(date = new Date()) {
  const dateKey = getLocalDateKey(date);
  const seed = [...dateKey].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 17);
  const majorCards = cards.filter((card) => card.arcana === 'major');
  const card = majorCards[seed % majorCards.length];

  return createMiaoReadingFromDrawn(
    { question: `${dateKey}，今天最值得注意什么？`, topic: 'others', spreadId: 'single' },
    [{ card, orientation: seed % 7 === 0 ? 'reversed' : 'upright' }],
  );
}
