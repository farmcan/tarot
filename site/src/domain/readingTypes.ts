import type { DrawnCard } from '@cometpisces/tarot-kit';

export type ReadingTopic = 'love' | 'work' | 'interpersonal' | 'others';

export type ReadingAspect =
  | 'currentSituation'
  | 'innerState'
  | 'rootCause'
  | 'development'
  | 'advice';

export interface SpreadPosition {
  id: string;
  label: string;
  role: string;
  aspect: ReadingAspect;
}

export interface SpreadDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  sourcePattern: string;
  positions: SpreadPosition[];
}

export interface ReadingRequest {
  question: string;
  topic: ReadingTopic;
  spreadId: string;
}

export interface BaseReadingCard {
  drawn: DrawnCard;
  position: SpreadPosition;
  positionMeaning: string;
  topicMeaning: string;
}

export interface ReadingBase<CardShape extends BaseReadingCard> {
  id: string;
  createdAt: string;
  question: string;
  topic: ReadingTopic;
  spread: SpreadDefinition;
  cards: CardShape[];
}
