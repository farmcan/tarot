const MAX_BODY_BYTES = 64 * 1024;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const THEMES = {
  miaotarot: {
    productName: 'MiaoTarot',
    system: '你是一个谨慎、温和、会用猫 meme 解释塔罗的中文助手。不要宿命化，不要替代医疗、法律、财务或危机支持。',
    identity: '你的任务是把传统塔罗含义翻译成猫 meme 式的自我观察。',
  },
  shiptarot: {
    productName: 'ShipTarot',
    system: '你是一个谨慎、温和、执行导向的中文项目解读助手。不要宿命化，不要替代专业建议。',
    identity: '你的任务是把传统塔罗含义翻译成项目推进、产品决策和执行节奏的自我观察。',
  },
};

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
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

function buildPrompt(theme, body) {
  const outputContract = [
    '只输出 JSON，不要输出 Markdown，不要包裹 ```。',
    'JSON 必须符合：{"title": string, "summary": string, "cards": [{"position": string, "reading": string}], "actions": string[], "shareText": string}。',
    'title 要短；summary 用 2-3 句话；actions 给 3 条今天能做的小动作；shareText 适合分享卡。',
  ].join('\n');

  if (typeof body.prompt === 'string' && body.prompt.trim()) {
    return [body.prompt.trim(), outputContract].join('\n\n');
  }

  const payload = body.payload || body.reading;
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return [
    `你是 ${theme.productName} 的解读助手。`,
    theme.identity,
    outputContract,
    '基于下面 JSON 输出中文解读：',
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost({ request, env }) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: 'request_too_large' }, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 });
  }

  const themeId = typeof body.themeId === 'string' ? body.themeId : 'miaotarot';
  const theme = THEMES[themeId];
  if (!theme) {
    return json({ error: 'unknown_theme', allowedThemes: Object.keys(THEMES) }, { status: 400 });
  }

  const prompt = buildPrompt(theme, body);
  if (!prompt) {
    return json({ error: 'missing_prompt_or_payload' }, { status: 400 });
  }
  if (prompt.length > 24000) {
    return json({ error: 'prompt_too_large' }, { status: 413 });
  }

  if (!env.LLM_API_KEY) {
    return json({ error: 'llm_not_configured', message: 'Set LLM_API_KEY on the deployment environment.' }, { status: 501 });
  }

  const baseUrl = String(env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.LLM_MODEL || 'gpt-4o-mini';
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
    );
  }

  const content = readOpenAiCompatibleContent(parsed) || rawText;

  return json({
    themeId,
    model,
    content,
    structured: parseStructuredContent(content),
    raw: parsed,
  });
}
