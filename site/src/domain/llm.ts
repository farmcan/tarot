import {
  getCardKeyword,
  getCardName,
  getOrientationLabel,
  getTopic,
  type Reading,
} from './tarot';
import {
  buildMiaoPayload,
  buildMiaoPrompt,
  type MiaoReading,
} from './miaoTarot';

export interface LlmPayloadCard {
  position: string;
  role: string;
  card: string;
  keyword: string;
  orientation: string;
  generalMeaning: string;
  positionMeaning: string;
  topicMeaning: string;
}

export interface LlmPayload {
  task: string;
  language: 'zh-CN';
  question: string;
  topic: string;
  spread: {
    id: string;
    name: string;
    sourcePattern: string;
  };
  cards: LlmPayloadCard[];
  outputContract: string[];
}

export interface LlmEndpointConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface StructuredLlmCardResult {
  position: string;
  reading: string;
}

export interface StructuredLlmResult {
  title: string;
  summary: string;
  cards: StructuredLlmCardResult[];
  actions: string[];
  shareText: string;
}

export function buildLlmPayload(reading: Reading): LlmPayload {
  const topic = getTopic(reading.topic);

  return {
    task: 'tarot_reading_analysis',
    language: 'zh-CN',
    question: reading.question || '用户没有输入具体问题，请围绕当前状态进行温和分析。',
    topic: topic.label,
    spread: {
      id: reading.spread.id,
      name: reading.spread.name,
      sourcePattern: reading.spread.sourcePattern,
    },
    cards: reading.cards.map((item) => ({
      position: item.position.label,
      role: item.position.role,
      card: getCardName(item.drawn.card),
      keyword: getCardKeyword(item.drawn.card),
      orientation: getOrientationLabel(item.drawn),
      generalMeaning: item.generalMeaning,
      positionMeaning: item.positionMeaning,
      topicMeaning: item.topicMeaning,
    })),
    outputContract: [
      '先用 3 句话总结整体主题，不做宿命化断言。',
      '逐张解释每张牌和牌位之间的关系。',
      '给出 3 条具体、可执行、低风险的建议。',
      '如果问题涉及医疗、法律、财务或危机，请提醒用户寻求专业帮助。',
    ],
  };
}

export function buildLlmPrompt(reading: Reading) {
  const payload = buildLlmPayload(reading);

  return [
    '你是一位谨慎、温和、结构化的塔罗解读助手。',
    '请把塔罗视为自我反思工具，而不是绝对预言。',
    '基于下面 JSON 进行分析：',
    JSON.stringify(payload, null, 2),
  ].join('\n\n');
}

export function buildMiaoLlmPayload(reading: MiaoReading) {
  return buildMiaoPayload(reading);
}

export function buildMiaoLlmPrompt(reading: MiaoReading) {
  return buildMiaoPrompt(reading);
}

function isTarotProxyEndpoint(endpoint: string) {
  return endpoint === '/api/readings/analyze' || endpoint.endsWith('/api/readings/analyze');
}

function readOpenAiCompatibleContent(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const data = value as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    output_text?: string;
    content?: string;
  };

  return (
    data.output_text ||
    data.content ||
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    ''
  );
}

export function parseStructuredLlmResult(value: string): StructuredLlmResult | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;

  try {
    const data = JSON.parse(jsonText) as Partial<StructuredLlmResult>;
    if (
      typeof data.title === 'string' &&
      typeof data.summary === 'string' &&
      Array.isArray(data.cards) &&
      Array.isArray(data.actions) &&
      typeof data.shareText === 'string'
    ) {
      return {
        title: data.title,
        summary: data.summary,
        cards: data.cards
          .filter((item): item is StructuredLlmCardResult => Boolean(item) && typeof item.position === 'string' && typeof item.reading === 'string')
          .slice(0, 10),
        actions: data.actions.filter((item): item is string => typeof item === 'string').slice(0, 6),
        shareText: data.shareText,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function callLlmEndpoint(config: LlmEndpointConfig, reading: Reading) {
  const prompt = buildLlmPrompt(reading);
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个谨慎的中文塔罗解读助手，避免宿命化、恐吓式或专业替代式建议。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  const rawText = await response.text();
  let parsed: unknown = rawText;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    throw new Error(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
  }

  return readOpenAiCompatibleContent(parsed) || rawText;
}

export async function callMiaoLlmEndpoint(config: LlmEndpointConfig, reading: MiaoReading) {
  const prompt = buildMiaoLlmPrompt(reading);
  const endpoint = config.endpoint.trim();

  if (isTarotProxyEndpoint(endpoint)) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themeId: 'miaotarot',
        prompt,
        payload: buildMiaoLlmPayload(reading),
      }),
    });

    const rawText = await response.text();
    let parsed: unknown = rawText;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }

    if (!response.ok) {
      throw new Error(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
    }

    return readOpenAiCompatibleContent(parsed) || rawText;
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个谨慎、温和、会用猫 meme 解释塔罗的中文助手。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
    }),
  });

  const rawText = await response.text();
  let parsed: unknown = rawText;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    throw new Error(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
  }

  return readOpenAiCompatibleContent(parsed) || rawText;
}
