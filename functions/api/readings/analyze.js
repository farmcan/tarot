const MAX_BODY_BYTES = 64 * 1024;
const MAX_PROMPT_BYTES = 24 * 1024;
const MAX_STRING_LENGTH = 1200;
const MAX_QUESTION_LENGTH = 500;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 12;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const rateLimitBuckets = globalThis.__tarotRateLimitBuckets || new Map();
globalThis.__tarotRateLimitBuckets = rateLimitBuckets;

const SPREAD_CARD_COUNTS = {
  single: 1,
  'three-card': 3,
  choice: 5,
  relationship: 5,
  'celtic-cross': 10,
};

const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, CF-Turnstile-Response',
};

const THEMES = {
  miaotarot: {
    productName: 'MiaoTarot',
    taskName: 'miaotarot_cat_meme_reading',
    cardLabel: '猫牌',
    archetypeLabel: '猫 meme',
    uprightLabel: '顺毛',
    reversedLabel: '炸毛',
    spreadIds: ['single', 'three-card', 'relationship'],
    system: '你是一个谨慎、温和、会用猫 meme 解释塔罗的中文助手。不要宿命化，不要替代医疗、法律、财务或危机支持。',
    identity: '你的任务是把传统塔罗含义翻译成猫 meme 式的自我观察。',
    voice: '像聪明朋友一样轻松吐槽，但保持温和、具体、不恐吓。',
    boundary: '猫 meme 是情绪入口，传统塔罗含义仍是分析骨架。',
  },
  shiptarot: {
    productName: 'ShipTarot',
    taskName: 'shiptarot_project_reading',
    cardLabel: '推进牌',
    archetypeLabel: '项目原型',
    uprightLabel: '顺风',
    reversedLabel: '逆风',
    spreadIds: ['single', 'three-card', 'choice', 'celtic-cross'],
    system: '你是一个谨慎、温和、执行导向的中文项目解读助手。不要宿命化，不要替代专业建议。',
    identity: '你的任务是把传统塔罗含义翻译成项目推进、产品决策和执行节奏的自我观察。',
    voice: '像一个冷静但有幽默感的产品/工程搭档，具体、可执行、不宿命化。',
    boundary: '项目语言是解释入口，传统塔罗含义仍是分析骨架。',
  },
};

function getAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || env.LLM_ALLOWED_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getCorsHeaders(request, env) {
  const allowedOrigins = getAllowedOrigins(env);
  const origin = request.headers.get('origin');
  const allowAny = allowedOrigins.includes('*');

  if (allowAny) {
    return {
      ...BASE_CORS_HEADERS,
      'Access-Control-Allow-Origin': '*',
    };
  }

  if (!origin) {
    return {
      ...BASE_CORS_HEADERS,
      'Access-Control-Allow-Origin': allowedOrigins[0] || 'null',
      Vary: 'Origin',
    };
  }

  if (allowedOrigins.includes(origin)) {
    return {
      ...BASE_CORS_HEADERS,
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
    };
  }

  return null;
}

function json(data, init = {}, corsHeaders = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function readOpenAiCompatibleContent(value) {
  if (!value || typeof value !== 'object') return '';

  return (
    value.output_text ||
    value.content ||
    value.choices?.[0]?.message?.content ||
    value.choices?.[0]?.text ||
    ''
  );
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString(value, field, errors, options = {}) {
  const {
    max = MAX_STRING_LENGTH,
    required = true,
    allowed = null,
  } = options;

  if (typeof value !== 'string') {
    if (required) errors.push(`${field} must be a string`);
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed && required) {
    errors.push(`${field} must not be empty`);
  }
  if (trimmed.length > max) {
    errors.push(`${field} is too long`);
  }
  if (allowed && !allowed.includes(trimmed)) {
    errors.push(`${field} is not allowed`);
  }

  return trimmed;
}

function validateCards(theme, payload, spreadId, errors) {
  if (!Array.isArray(payload.cards)) {
    errors.push('cards must be an array');
    return [];
  }

  const expectedCount = SPREAD_CARD_COUNTS[spreadId];
  if (expectedCount && payload.cards.length !== expectedCount) {
    errors.push(`cards length must match spread ${spreadId}`);
  }
  if (payload.cards.length < 1 || payload.cards.length > 10) {
    errors.push('cards length must be between 1 and 10');
  }

  return payload.cards.slice(0, 10).map((card, index) => {
    const field = `cards[${index}]`;
    if (!isRecord(card)) {
      errors.push(`${field} must be an object`);
      return null;
    }

    return {
      position: readString(card.position, `${field}.position`, errors, { max: 80 }),
      role: readString(card.role, `${field}.role`, errors, { max: 240 }),
      traditional: readString(card.traditional, `${field}.traditional`, errors, { max: 240 }),
      tarotCard: readString(card.tarotCard, `${field}.tarotCard`, errors, { max: 80 }),
      tarotKeyword: readString(card.tarotKeyword, `${field}.tarotKeyword`, errors, { max: 80 }),
      orientation: readString(card.orientation, `${field}.orientation`, errors, {
        max: 20,
        allowed: ['正位', '逆位'],
      }),
      themedOrientation: readString(card.themedOrientation, `${field}.themedOrientation`, errors, {
        max: 40,
        allowed: [theme.uprightLabel, theme.reversedLabel],
      }),
      themedName: readString(card.themedName, `${field}.themedName`, errors, { max: 120 }),
      archetype: readString(card.archetype, `${field}.archetype`, errors, { max: 240 }),
      caption: readString(card.caption, `${field}.caption`, errors, { max: 240 }),
      emotionalSignal: readString(card.emotionalSignal, `${field}.emotionalSignal`, errors, { max: 240 }),
      traditionalMeaning: readString(card.traditionalMeaning, `${field}.traditionalMeaning`, errors),
      positionMeaning: readString(card.positionMeaning, `${field}.positionMeaning`, errors),
      topicMeaning: readString(card.topicMeaning, `${field}.topicMeaning`, errors),
      themedMeaning: readString(card.themedMeaning, `${field}.themedMeaning`, errors),
      tinyAction: readString(card.tinyAction, `${field}.tinyAction`, errors, { max: 300 }),
    };
  }).filter(Boolean);
}

function validatePayload(theme, value) {
  const errors = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ['payload must be an object'], payload: null };
  }

  const task = readString(value.task, 'task', errors, {
    max: 80,
    allowed: [theme.taskName],
  });
  const language = readString(value.language, 'language', errors, {
    max: 12,
    allowed: ['zh-CN'],
  });
  const question = readString(value.question, 'question', errors, {
    max: MAX_QUESTION_LENGTH,
  });
  const topic = readString(value.topic, 'topic', errors, { max: 120 });

  if (!isRecord(value.spread)) {
    errors.push('spread must be an object');
  }
  const spreadSource = isRecord(value.spread) ? value.spread : {};
  const spreadId = readString(spreadSource.id, 'spread.id', errors, {
    max: 60,
    allowed: theme.spreadIds,
  });
  const spread = {
    id: spreadId,
    name: readString(spreadSource.name, 'spread.name', errors, { max: 120 }),
    sourcePattern: readString(spreadSource.sourcePattern, 'spread.sourcePattern', errors, { max: 240 }),
  };

  if (isRecord(value.styleGuide)) {
    const product = readString(value.styleGuide.product, 'styleGuide.product', errors, {
      max: 80,
      required: false,
    });
    if (product && product !== theme.productName) {
      errors.push('styleGuide.product must match theme');
    }
  }

  const cards = validateCards(theme, value, spreadId, errors);

  return {
    ok: errors.length === 0,
    errors,
    payload: {
      task,
      language,
      question,
      topic,
      spread,
      styleGuide: {
        product: theme.productName,
        voice: theme.voice,
        boundaries: [
          '不要把塔罗说成绝对预言。',
          '不要替代医疗、法律、财务等专业建议。',
          theme.boundary,
        ],
      },
      cards,
    },
  };
}

function getRateLimit(env) {
  const limit = Number(env.LLM_RATE_LIMIT_PER_MINUTE || DEFAULT_RATE_LIMIT_PER_MINUTE);
  if (!Number.isFinite(limit) || limit < 0) return DEFAULT_RATE_LIMIT_PER_MINUTE;
  return Math.floor(limit);
}

function getClientId(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function checkRateLimit(request, env) {
  const limit = getRateLimit(env);
  if (limit === 0) return { ok: true };

  const clientId = getClientId(request);
  const now = Date.now();
  const current = rateLimitBuckets.get(clientId);
  const bucket = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  bucket.count += 1;
  rateLimitBuckets.set(clientId, bucket);

  if (rateLimitBuckets.size > 500) {
    for (const [key, value] of rateLimitBuckets.entries()) {
      if (value.resetAt <= now) rateLimitBuckets.delete(key);
    }
  }

  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true };
}

async function verifyTurnstile(request, env, body) {
  const secret = env.TURNSTILE_SECRET_KEY || env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

  const token = body.turnstileToken || request.headers.get('cf-turnstile-response');
  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, error: 'missing_turnstile_token' };
  }

  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token.trim());

  const remoteIp = getClientId(request);
  if (remoteIp !== 'unknown') {
    formData.append('remoteip', remoteIp);
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result?.success) return { ok: true };

    return {
      ok: false,
      error: 'turnstile_failed',
      detail: Array.isArray(result?.['error-codes']) ? result['error-codes'] : undefined,
    };
  } catch {
    return { ok: false, error: 'turnstile_unavailable' };
  }
}

function buildPrompt(theme, payload) {
  const outputContract = [
    '只输出 JSON，不要输出 Markdown，不要包裹 ```。',
    'JSON 必须符合：{"title": string, "summary": string, "cards": [{"position": string, "reading": string}], "actions": string[], "shareText": string}。',
    'title 要短；summary 用 2-3 句话；actions 给 3 条今天能做的小动作；shareText 适合分享卡。',
  ].join('\n');

  return [
    `你是 ${theme.productName} 的解读助手。`,
    theme.identity,
    '解释时只能使用下面 JSON 中已经出现的牌面、牌位、传统含义和主题含义；不要重抽牌，不要发明新牌。',
    outputContract,
    '基于下面经过服务端校验的 JSON 输出中文解读：',
    JSON.stringify(payload, null, 2),
  ].join('\n\n');
}

function parseStructuredContent(content) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;

  try {
    const data = JSON.parse(jsonText);
    if (
      data &&
      typeof data.title === 'string' &&
      typeof data.summary === 'string' &&
      Array.isArray(data.cards) &&
      Array.isArray(data.actions) &&
      typeof data.shareText === 'string'
    ) {
      return data;
    }
  } catch {
    return null;
  }

  return null;
}

export async function onRequestOptions({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestPost({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) {
    return json({ error: 'origin_not_allowed' }, { status: 403 });
  }

  const rateLimit = checkRateLimit(request, env);
  if (!rateLimit.ok) {
    return json(
      { error: 'rate_limited', retryAfter: rateLimit.retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
        },
      },
      corsHeaders,
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: 'request_too_large' }, { status: 413 }, corsHeaders);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return json({ error: 'request_too_large' }, { status: 413 }, corsHeaders);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 }, corsHeaders);
  }

  const turnstile = await verifyTurnstile(request, env, body);
  if (!turnstile.ok) {
    return json({ error: turnstile.error, detail: turnstile.detail }, { status: 403 }, corsHeaders);
  }

  const themeId = typeof body.themeId === 'string' ? body.themeId : 'miaotarot';
  const theme = THEMES[themeId];
  if (!theme) {
    return json({ error: 'unknown_theme', allowedThemes: Object.keys(THEMES) }, { status: 400 }, corsHeaders);
  }

  const validation = validatePayload(theme, body.payload || body.reading);
  if (!validation.ok) {
    return json({ error: 'invalid_payload', details: validation.errors }, { status: 400 }, corsHeaders);
  }

  const prompt = buildPrompt(theme, validation.payload);
  if (new TextEncoder().encode(prompt).length > MAX_PROMPT_BYTES) {
    return json({ error: 'prompt_too_large' }, { status: 413 }, corsHeaders);
  }

  if (!env.LLM_API_KEY) {
    return json({ error: 'llm_not_configured', message: 'Set LLM_API_KEY on the deployment environment.' }, { status: 501 }, corsHeaders);
  }

  const baseUrl = String(env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.LLM_MODEL || 'gpt-4o-mini';
  const maxTokens = Number(env.LLM_MAX_TOKENS || 900);
  const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: theme.system,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.75,
      max_tokens: Number.isFinite(maxTokens) && maxTokens > 0 ? Math.floor(maxTokens) : 900,
    }),
  });

  const rawText = await providerResponse.text();
  let parsed = rawText;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  if (!providerResponse.ok) {
    return json(
      {
        error: 'provider_error',
        status: providerResponse.status,
        detail: parsed,
      },
      { status: 502 },
      corsHeaders,
    );
  }

  const content = readOpenAiCompatibleContent(parsed) || rawText;

  return json({
    themeId,
    model,
    promptSource: 'server',
    content,
    structured: parseStructuredContent(content),
    raw: parsed,
  }, {}, corsHeaders);
}
