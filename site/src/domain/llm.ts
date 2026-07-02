import {
  buildMiaoPayload,
  buildMiaoPrompt,
  type MiaoReading,
} from './miaoTarot';
import {
  parseStructuredLlmResult,
  type StructuredLlmCardResult,
  type StructuredLlmResult,
} from '../../../shared/llmContract.js';

export { parseStructuredLlmResult };
export type { StructuredLlmCardResult, StructuredLlmResult };

export interface LlmProxyConfig {
  endpoint?: string;
  themeId?: string;
  turnstileToken?: string;
}

export function buildMiaoLlmPayload(reading: MiaoReading) {
  return buildMiaoPayload(reading);
}

export function buildMiaoLlmPrompt(reading: MiaoReading) {
  return buildMiaoPrompt(reading);
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

function readProxyError(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const data = value as { error?: string; message?: string };

  if (data.error === 'llm_not_configured') {
    return 'LLM 还没有配置：需要在部署环境设置 LLM_API_KEY。';
  }
  if (data.error === 'rate_limited') {
    return '调用太频繁了，稍等一下再试。';
  }
  if (data.error === 'missing_turnstile_token') {
    return '需要完成验证后才能调用 LLM。';
  }
  if (data.message) return data.message;
  if (data.error) return data.error;

  return '';
}

export async function callMiaoLlmEndpoint(reading: MiaoReading, config: LlmProxyConfig = {}) {
  const endpoint = config.endpoint?.trim() || '/api/readings/analyze';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      themeId: config.themeId || 'miaotarot',
      payload: buildMiaoLlmPayload(reading),
      ...(config.turnstileToken ? { turnstileToken: config.turnstileToken } : {}),
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
    if (response.status === 404) {
      throw new Error('LLM 代理暂时不可用：需要通过 Cloudflare Pages Functions 部署 /api/readings/analyze。');
    }
    throw new Error(readProxyError(parsed) || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed)));
  }

  return readOpenAiCompatibleContent(parsed) || rawText;
}
