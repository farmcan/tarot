export const structuredLlmLimits = {
  title: 18,
  action: 42,
  shareText: 42,
  minCards: 1,
  maxCards: 10,
  actions: 3,
};

export const followUpLlmLimits = {
  reply: 900,
  reflectionQuestion: 60,
  action: 42,
  maxActions: 2,
};

export function stripJsonFence(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return '';

  return trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    : trimmed;
}

export function normalizeStructuredLlmResult(value) {
  if (!value || typeof value !== 'object') return null;

  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const shareText = typeof value.shareText === 'string' ? value.shareText.trim() : '';
  const cards = Array.isArray(value.cards)
    ? value.cards.map((card) => ({
      position: typeof card?.position === 'string' ? card.position.trim() : '',
      reading: typeof card?.reading === 'string' ? card.reading.trim() : '',
    }))
    : [];
  const actions = Array.isArray(value.actions)
    ? value.actions.map((action) => (typeof action === 'string' ? action.trim() : ''))
    : [];

  if (!title || title.length > structuredLlmLimits.title) return null;
  if (!summary) return null;
  if (!shareText || shareText.length > structuredLlmLimits.shareText) return null;
  if (
    cards.length < structuredLlmLimits.minCards ||
    cards.length > structuredLlmLimits.maxCards ||
    cards.some((card) => !card.position || !card.reading)
  ) {
    return null;
  }
  if (
    actions.length !== structuredLlmLimits.actions ||
    actions.some((action) => !action || action.length > structuredLlmLimits.action)
  ) {
    return null;
  }

  return {
    title,
    summary,
    cards,
    actions,
    shareText,
  };
}

export function parseStructuredLlmResult(value) {
  const jsonText = stripJsonFence(value);
  if (!jsonText) return null;

  try {
    return normalizeStructuredLlmResult(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

export function assertStructuredLlmResult(value, options = {}) {
  const normalized = normalizeStructuredLlmResult(value);
  if (!normalized) {
    throw new Error('structured result is missing or violates the JSON contract');
  }

  if (typeof options.expectedCards === 'number' && normalized.cards.length !== options.expectedCards) {
    throw new Error(`structured.cards length ${normalized.cards.length} does not match expected length ${options.expectedCards}`);
  }

  return normalized;
}

export function normalizeFollowUpLlmResult(value) {
  if (!value || typeof value !== 'object') return null;

  const reply = typeof value.reply === 'string' ? value.reply.trim() : '';
  const reflectionQuestion = typeof value.reflectionQuestion === 'string'
    ? value.reflectionQuestion.trim()
    : null;
  const actions = Array.isArray(value.actions)
    ? value.actions.map((action) => (typeof action === 'string' ? action.trim() : ''))
    : [];

  if (!reply || reply.length > followUpLlmLimits.reply) return null;
  if (reflectionQuestion && reflectionQuestion.length > followUpLlmLimits.reflectionQuestion) return null;
  if (
    actions.length > followUpLlmLimits.maxActions
    || actions.some((action) => !action || action.length > followUpLlmLimits.action)
  ) {
    return null;
  }

  return {
    reply,
    reflectionQuestion: reflectionQuestion || null,
    actions,
  };
}

export function parseFollowUpLlmResult(value) {
  const jsonText = stripJsonFence(value);
  if (!jsonText) return null;

  try {
    return normalizeFollowUpLlmResult(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

export function assertFollowUpLlmResult(value) {
  const normalized = normalizeFollowUpLlmResult(value);
  if (!normalized) {
    throw new Error('follow-up result is missing or violates the JSON contract');
  }
  return normalized;
}
