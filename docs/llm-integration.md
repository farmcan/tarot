# LLM Integration Design

Date: 2026-06-22

MiaoTarot should use an LLM as an interpretation layer, not as the source of randomness or Tarot state. The app draws cards locally, builds a structured payload, then asks the model to explain that payload in the selected theme voice.

## Current Prototype

The browser UI supports both the project proxy and OpenAI-compatible endpoints in the LLM tab:

1. User completes a reading in the browser.
2. The app calls `buildMiaoLlmPayload(reading)` and `buildMiaoLlmPrompt(reading)`.
3. By default, the endpoint is `/api/readings/analyze`.
4. If the endpoint is the project proxy, the browser sends `{ themeId, prompt, payload }`.
5. If the endpoint is an OpenAI-compatible URL, the browser sends a chat-style request and displays the returned text.

OpenAI-compatible browser calls are useful for local testing, but they should not be the production shape because API keys can be exposed in browser state.

## Production Boundary

Recommended flow:

```mermaid
sequenceDiagram
  participant Browser
  participant Proxy as Backend or Edge Proxy
  participant LLM as LLM Provider

  Browser->>Browser: Draw cards locally
  Browser->>Browser: Build themed reading payload
  Browser->>Proxy: POST /api/readings/analyze
  Proxy->>Proxy: Validate payload and attach provider key
  Proxy->>LLM: Send bounded interpretation prompt
  LLM-->>Proxy: Return analysis text or structured JSON
  Proxy-->>Browser: Return safe reading result
```

The browser should send only the reading payload and selected theme id. The proxy owns provider keys, model selection, rate limits, and abuse controls.

## Implemented API Shape

The repository includes a Cloudflare Pages Function at:

```text
functions/api/readings/analyze.js
```

It maps to:

```text
POST /api/readings/analyze
```

Environment variables:

- `LLM_API_KEY`: required in deployment
- `LLM_BASE_URL`: optional, defaults to `https://api.openai.com/v1`
- `LLM_MODEL`: optional, defaults to `gpt-4o-mini`

Supported theme ids:

- `miaotarot`
- `shiptarot`

Request:

```json
{
  "themeId": "miaotarot",
  "prompt": "你是 MiaoTarot 的解读助手...",
  "payload": {}
}
```

Response:

```json
{
  "themeId": "miaotarot",
  "model": "gpt-4o-mini",
  "content": "模型返回的解读文本",
  "raw": {}
}
```

The current app can still accept plain text while prototyping, but structured JSON will make share cards, history, and future multi-theme rendering easier.

## Prompt Rules

The prompt should always include:

- the exact cards already drawn
- upright or reversed orientation
- spread position and role
- traditional Tarot meaning
- theme-specific meaning
- output contract
- safety boundaries

The prompt should never ask the LLM to:

- redraw cards
- predict fixed outcomes
- replace medical, legal, financial, or crisis support
- invent card facts that are not in the payload

## Provider Strategy

Keep the app provider-agnostic by using a small proxy interface:

- `LLM_PROVIDER`: provider name
- `LLM_MODEL`: default model
- `LLM_API_KEY`: server-side secret
- `LLM_BASE_URL`: optional OpenAI-compatible base URL

The browser should not know these values.

## Next Implementation Step

The proxy now exists as a small first version. Next improvements:

1. Move from plain text output to a structured JSON result.
2. Rebuild the prompt server-side from validated payload fields instead of trusting a client-provided prompt.
3. Add rate limiting or Turnstile if the endpoint becomes public.
4. Add provider-specific adapters if we use more than one LLM vendor.
