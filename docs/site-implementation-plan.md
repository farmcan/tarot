# MiaoTarot Site Implementation Plan

Date: 2026-06-22

## Goal

Build a MiaoTI-style Tarot website that reuses existing libraries and patterns instead of rebuilding Tarot data, UI primitives, and reading structure from scratch. The product idea is: Tarot provides structure, cat meme archetypes provide the emotional interface, and LLMs provide personalized interpretation.

## Selected Libraries

| Layer | Choice | Reason |
| --- | --- | --- |
| UI | Mantine | Complete React component library with accessible forms, cards, tabs, tables, inputs, layout, and theme support. Suitable for a usable research/tool interface without inventing UI primitives. |
| Icons | lucide-react | Consistent icon set for buttons, tabs, actions, and status indicators. |
| Tarot data | `@cometpisces/tarot-kit` | MIT package with 78 Rider-Waite card data, localized meanings, upright/reversed support, and drawing helpers. |
| Miao layer | Local 22-card Major Arcana mapping | Original cat-meme archetypes, captions, emotional signals, tiny actions, and share copy. |
| Build | Vite + React | Fast static build that can publish into `v1/`, matching the versioned static layout used by `miaoti`. |

## Data Structure

The site uses imported card data and adds local MiaoTarot reading structure:

```ts
Card              // imported from @cometpisces/tarot-kit
DrawnCard         // imported from @cometpisces/tarot-kit
MiaoCard          // local cat-meme archetype for a Major Arcana card
SpreadDefinition  // local spread metadata and positions
MiaoReading       // question + topic + spread + positioned drawn cards
LlmPayload        // structured JSON sent to an LLM
```

This keeps card facts separate from the cat-meme reading experience.

## Implementation Steps

1. Use `@cometpisces/tarot-kit` as the source of truth for 78-card data and random draws.
2. Define 22 Major Arcana cat archetypes locally.
3. Define Miao-friendly spread templates locally: single card, three-card flow, and relationship spread.
4. Map each spread position to a reading aspect such as current situation, inner state, root cause, development, or advice.
5. Render the first screen as a visual MiaoTarot experience with a generated original cat Tarot hero image.
6. Generate both local synthesis and an LLM-ready JSON payload.
7. Allow optional OpenAI-compatible endpoint calls through a user-provided endpoint/API key.

## LLM Strategy

The LLM should not invent the draw. The app first performs the draw with deterministic app state, then sends this structure:

- user question
- topic
- spread id and source pattern
- each traditional Tarot card
- each MiaoTarot cat archetype
- upright/reversed orientation
- position label and role
- general, position-specific, and topic-specific meanings
- output contract

The first implementation supports a browser-side OpenAI-compatible endpoint for prototyping. For public deployment, the same payload should be sent to a backend proxy or Cloudflare Function so API keys are not exposed.
