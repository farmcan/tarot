import {
  getCardKeyword,
  getCardName,
  getOrientationLabel,
  getTopic,
  type Reading,
} from './tarot';
import {
  getMiaoOrientationLabel,
  getTraditionalLine,
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
  const topic = getTopic(reading.topic);

  return {
    task: 'miaotarot_cat_meme_reading',
    language: 'zh-CN',
    question: reading.question || '用户没有输入具体问题，请围绕今天的状态进行温和分析。',
    topic: topic.label,
    spread: {
      id: reading.spread.id,
      name: reading.spread.name,
      sourcePattern: reading.spread.sourcePattern,
    },
    styleGuide: {
      product: 'MiaoTarot',
      voice: '像聪明朋友一样轻松吐槽，但保持温和、具体、不恐吓。',
      boundaries: [
        '不要把塔罗说成绝对预言。',
        '不要替代医疗、法律、财务等专业建议。',
        '猫 meme 是情绪入口，传统塔罗含义仍是分析骨架。',
      ],
    },
    cards: reading.cards.map((item) => ({
      position: item.position.label,
      role: item.position.role,
      traditional: getTraditionalLine(item),
      tarotCard: getCardName(item.drawn.card),
      tarotKeyword: getCardKeyword(item.drawn.card),
      orientation: getOrientationLabel(item.drawn),
      miaoOrientation: getMiaoOrientationLabel(item.drawn.orientation),
      miaoName: item.miao.miaoName,
      catArchetype: item.miao.archetype,
      memeCaption: item.miao.memeCaption,
      emotionalSignal: item.miao.emotionalSignal,
      traditionalMeaning: item.traditionalMeaning,
      positionMeaning: item.positionMeaning,
      topicMeaning: item.topicMeaning,
      miaoMeaning: item.miaoMeaning,
      tinyAction: item.miao.tinyAction,
    })),
    outputContract: [
      '给一个短标题，像猫 meme 文案一样好记。',
      '用 2-3 句话总结这次抽牌的情绪主题。',
      '逐张解释：猫牌是什么意思，传统塔罗骨架是什么，和用户问题有什么关系。',
      '给出 3 条今天能做的小动作。',
      '给一条适合分享卡的短文案。',
    ],
  };
}

export function buildMiaoLlmPrompt(reading: MiaoReading) {
  return [
    '你是 MiaoTarot 的猫猫塔罗解读助手。',
    '你的任务是把传统塔罗含义翻译成猫 meme 式的自我观察，但不要胡说、不要宿命化。',
    '基于下面 JSON 输出中文解读：',
    JSON.stringify(buildMiaoLlmPayload(reading), null, 2),
  ].join('\n\n');
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
