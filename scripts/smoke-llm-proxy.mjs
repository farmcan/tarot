import { assertStructuredLlmResult } from '../shared/llmContract.js';
import { createMiaoSmokeRequestBody, miaoSmokePayload } from './fixtures/miao-smoke-payload.mjs';

const endpoint = process.env.TAROT_LLM_ENDPOINT;

if (!endpoint) {
  console.error('Set TAROT_LLM_ENDPOINT to the deployed /api/readings/analyze URL.');
  process.exit(1);
}

const requestBody = createMiaoSmokeRequestBody();

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody),
});

const rawText = await response.text();
let data = rawText;

try {
  data = JSON.parse(rawText);
} catch {
  // Keep raw text for diagnostics.
}

if (!response.ok) {
  console.error(`LLM proxy smoke failed: HTTP ${response.status}`);
  console.error(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  process.exit(1);
}

if (!data || typeof data !== 'object' || typeof data.content !== 'string' || !data.content.trim()) {
  console.error('LLM proxy smoke failed: response did not include non-empty content.');
  console.error(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  process.exit(1);
}

try {
  assertStructuredLlmResult(data.structured, { expectedCards: miaoSmokePayload.cards.length });
} catch (error) {
  console.error(`LLM proxy smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(`LLM proxy smoke ok: ${data.themeId || 'unknown theme'} / ${data.model || 'unknown model'} / structured JSON ok`);
