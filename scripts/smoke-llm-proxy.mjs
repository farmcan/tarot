import {
  assertFollowUpLlmResult,
  assertStructuredLlmResult,
} from '../shared/llmContract.js';
import { createMiaoSmokeRequestBody } from './fixtures/miao-smoke-payload.mjs';

const endpoint = process.env.TAROT_LLM_ENDPOINT;

if (!endpoint) {
  console.error('Set TAROT_LLM_ENDPOINT to the deployed /api/readings/analyze URL.');
  process.exit(1);
}

const fullRequestBody = createMiaoSmokeRequestBody();
const requestBody = {
  ...fullRequestBody,
  payload: {
    ...fullRequestBody.payload,
    progress: { revealedCards: 1, totalCards: fullRequestBody.payload.cards.length, complete: false },
    cards: fullRequestBody.payload.cards.slice(0, 1),
  },
};

async function readSse(response, label) {
  const rawText = await response.text();
  if (!response.ok) {
    console.error(`${label} failed: HTTP ${response.status}`);
    console.error(rawText);
    process.exit(1);
  }
  if (!(response.headers.get('content-type') || '').includes('text/event-stream')) {
    console.error(`${label} failed: expected text/event-stream.`);
    console.error(rawText);
    process.exit(1);
  }

  let done = null;
  let deltaCount = 0;
  for (const block of rawText.split(/\r?\n\r?\n/)) {
    const event = block.match(/^event:\s*(.+)$/m)?.[1]?.trim();
    const dataText = block.match(/^data:\s*(.+)$/m)?.[1];
    if (!event || !dataText) continue;
    const data = JSON.parse(dataText);
    if (event === 'delta') deltaCount += 1;
    if (event === 'error') {
      console.error(`${label} failed: ${JSON.stringify(data)}`);
      process.exit(1);
    }
    if (event === 'done') done = data;
  }
  if (!done || deltaCount < 2) {
    console.error(`${label} failed: expected multiple deltas and one done event.`);
    console.error(rawText);
    process.exit(1);
  }
  return { ...done, deltaCount };
}

const statusResponse = await fetch(endpoint);
const status = await statusResponse.json().catch(() => null);
if (!statusResponse.ok || status?.available !== true) {
  console.error(`LLM proxy smoke failed: provider is not available (${statusResponse.status}).`);
  console.error(JSON.stringify(status, null, 2));
  process.exit(1);
}
if (!Array.isArray(status.interactionModes) || !status.interactionModes.includes('follow_up')) {
  console.error('LLM proxy smoke failed: deployed endpoint does not advertise follow_up support.');
  console.error(JSON.stringify(status, null, 2));
  process.exit(1);
}
if (status.streaming !== true) {
  console.error('LLM proxy smoke failed: deployed endpoint does not advertise streaming.');
  process.exit(1);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  },
  body: JSON.stringify({ ...requestBody, stream: true }),
});

const data = await readSse(response, 'LLM proxy first-card stream');

if (!data || typeof data !== 'object' || typeof data.content !== 'string' || !data.content.trim()) {
  console.error('LLM proxy smoke failed: response did not include non-empty content.');
  console.error(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  process.exit(1);
}

try {
  assertStructuredLlmResult(data.structured, { expectedCards: 1 });
} catch (error) {
  console.error(`LLM proxy smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

const followUpResponse = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  },
  body: JSON.stringify({
    ...requestBody,
    stream: true,
    mode: 'follow_up',
    message: '我这周最应该先核实哪一项离职条件？',
    history: [
      { role: 'assistant', content: data.content },
    ],
  }),
});
const followUpData = await readSse(followUpResponse, 'LLM proxy follow-up stream');

try {
  assertFollowUpLlmResult(followUpData?.structured);
} catch (error) {
  console.error(`LLM proxy follow-up smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  console.error(typeof followUpData === 'string' ? followUpData : JSON.stringify(followUpData, null, 2));
  process.exit(1);
}

console.log(
  `LLM proxy smoke ok: ${data.themeId || 'unknown theme'} / ${data.model || 'unknown model'}`
  + ` / first-card SSE ${data.deltaCount} chunks + follow-up SSE ${followUpData.deltaCount} chunks ok`,
);
