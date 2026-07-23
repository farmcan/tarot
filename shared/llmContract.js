export const structuredLlmLimits = {
  title: 18,
  summary: 220,
  cardReading: 180,
  action: 42,
  shareText: 42,
  minCards: 1,
  maxCards: 10,
  actions: 3,
};

export const followUpLlmLimits = {
  miaoAside: 36,
  reply: 320,
  reflectionQuestion: 60,
  action: 42,
  maxActions: 2,
};

export const focusLlmLimits = {
  acknowledgement: 100,
  focus: 60,
  alternativeFocus: 60,
};

export const cardEvidenceLlmLimits = {
  traditional: 100,
  context: 140,
  boundary: 100,
  alternative: 120,
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
  if (!summary || summary.length > structuredLlmLimits.summary) return null;
  if (!shareText || shareText.length > structuredLlmLimits.shareText) return null;
  if (
    cards.length < structuredLlmLimits.minCards ||
    cards.length > structuredLlmLimits.maxCards ||
    cards.some((card) => (
      !card.position
      || !card.reading
      || card.reading.length > structuredLlmLimits.cardReading
    ))
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

export function normalizeFocusLlmResult(value) {
  if (!value || typeof value !== 'object') return null;

  const acknowledgement = typeof value.acknowledgement === 'string'
    ? value.acknowledgement.trim()
    : '';
  const focus = typeof value.focus === 'string' ? value.focus.trim() : '';
  const alternativeFocus = typeof value.alternativeFocus === 'string'
    ? value.alternativeFocus.trim()
    : '';

  if (
    !acknowledgement
    || acknowledgement.length > focusLlmLimits.acknowledgement
    || !focus
    || focus.length > focusLlmLimits.focus
    || !alternativeFocus
    || alternativeFocus.length > focusLlmLimits.alternativeFocus
    || focus === alternativeFocus
  ) {
    return null;
  }

  return {
    acknowledgement,
    focus,
    alternativeFocus,
  };
}

export function parseFocusLlmResult(value) {
  const jsonText = stripJsonFence(value);
  if (!jsonText) return null;

  try {
    return normalizeFocusLlmResult(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function normalizeCardEvidence(value) {
  if (!value || typeof value !== 'object') return null;

  const traditional = typeof value.traditional === 'string' ? value.traditional.trim() : '';
  const context = typeof value.context === 'string' ? value.context.trim() : '';
  const boundary = typeof value.boundary === 'string' ? value.boundary.trim() : '';
  const alternative = typeof value.alternative === 'string' ? value.alternative.trim() : '';

  if (
    !traditional
    || traditional.length > cardEvidenceLlmLimits.traditional
    || !context
    || context.length > cardEvidenceLlmLimits.context
    || !boundary
    || boundary.length > cardEvidenceLlmLimits.boundary
    || !alternative
    || alternative.length > cardEvidenceLlmLimits.alternative
  ) {
    return null;
  }

  return {
    traditional,
    context,
    boundary,
    alternative,
  };
}

export function normalizeFollowUpLlmResult(value) {
  if (!value || typeof value !== 'object') return null;

  const miaoAside = typeof value.miaoAside === 'string'
    ? value.miaoAside.trim()
    : null;
  const reply = typeof value.reply === 'string' ? value.reply.trim() : '';
  const reflectionQuestion = typeof value.reflectionQuestion === 'string'
    ? value.reflectionQuestion.trim()
    : null;
  const actions = Array.isArray(value.actions)
    ? value.actions.map((action) => (typeof action === 'string' ? action.trim() : ''))
    : [];
  const cardEvidence = value.cardEvidence === undefined
    ? null
    : normalizeCardEvidence(value.cardEvidence);

  if (miaoAside && miaoAside.length > followUpLlmLimits.miaoAside) return null;
  if (!reply || reply.length > followUpLlmLimits.reply) return null;
  if (reflectionQuestion && reflectionQuestion.length > followUpLlmLimits.reflectionQuestion) return null;
  if (value.cardEvidence !== undefined && !cardEvidence) return null;
  if (
    actions.length > followUpLlmLimits.maxActions
    || actions.some((action) => !action || action.length > followUpLlmLimits.action)
  ) {
    return null;
  }

  return {
    miaoAside: miaoAside || null,
    reply,
    reflectionQuestion: reflectionQuestion || null,
    actions,
    ...(cardEvidence ? { cardEvidence } : {}),
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

export function normalizeCardRevealLlmResult(value) {
  const normalized = normalizeFollowUpLlmResult(value);
  return normalized?.cardEvidence ? normalized : null;
}

export function parseCardRevealLlmResult(value) {
  const jsonText = stripJsonFence(value);
  if (!jsonText) return null;

  try {
    return normalizeCardRevealLlmResult(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

export function assertFocusLlmResult(value) {
  const normalized = normalizeFocusLlmResult(value);
  if (!normalized) {
    throw new Error('focus result is missing or violates the JSON contract');
  }
  return normalized;
}

export function assertCardRevealLlmResult(value) {
  const normalized = normalizeCardRevealLlmResult(value);
  if (!normalized) {
    throw new Error('card reveal result is missing or violates the JSON contract');
  }
  return normalized;
}
