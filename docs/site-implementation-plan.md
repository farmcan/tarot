# Tarot Site Implementation Plan

Date: 2026-06-22

## Goal

Build a research-driven Tarot website that reuses existing libraries and patterns instead of rebuilding Tarot data, UI primitives, and reading structure from scratch.

## Selected Libraries

| Layer | Choice | Reason |
| --- | --- | --- |
| UI | Mantine | Complete React component library with accessible forms, cards, tabs, tables, inputs, layout, and theme support. Suitable for a usable research/tool interface without inventing UI primitives. |
| Icons | lucide-react | Consistent icon set for buttons, tabs, actions, and status indicators. |
| Tarot data | `@cometpisces/tarot-kit` | MIT package with 78 Rider-Waite card data, localized meanings, upright/reversed support, and drawing helpers. |
| Build | Vite + React | Fast static build that can publish into `v1/`, matching the versioned static layout used by `miaoti`. |

## Data Structure

The site uses imported card data and adds local reading structure:

```ts
Card              // imported from @cometpisces/tarot-kit
DrawnCard         // imported from @cometpisces/tarot-kit
SpreadDefinition  // local spread metadata and positions
Reading           // question + topic + spread + positioned drawn cards
LlmPayload        // structured JSON sent to an LLM
```

This keeps card facts separate from the reading experience.

## Implementation Steps

1. Use `@cometpisces/tarot-kit` as the source of truth for 78-card data and random draws.
2. Define spread templates locally: single card, three-card flow, decision spread, relationship spread, Celtic cross.
3. Map each spread position to a reading aspect such as current situation, inner state, root cause, development, or advice.
4. Render the first screen as an interactive reading desk rather than a marketing page.
5. Generate both local synthesis and an LLM-ready JSON payload.
6. Allow optional OpenAI-compatible endpoint calls through a user-provided endpoint/API key.

## LLM Strategy

The LLM should not invent the draw. The app first performs the draw with deterministic app state, then sends this structure:

- user question
- topic
- spread id and source pattern
- each card
- upright/reversed orientation
- position label and role
- general, position-specific, and topic-specific meanings
- output contract

The first implementation supports a browser-side OpenAI-compatible endpoint for prototyping. For public deployment, the same payload should be sent to a backend proxy or Cloudflare Function so API keys are not exposed.

