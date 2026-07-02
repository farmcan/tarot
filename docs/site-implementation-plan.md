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

The site uses imported card data, a reusable themed Tarot foundation, and a local MiaoTarot adapter:

```ts
Card              // imported from @cometpisces/tarot-kit
DrawnCard         // imported from @cometpisces/tarot-kit
SpreadDefinition  // local spread metadata and positions
ThemedCard        // reusable themed archetype for a Tarot card
ThemedDeckConfig  // product-level config for labels, voice, prompt rules, and card mapping
ThemedReading     // question + topic + spread + positioned drawn cards
MiaoCard          // local cat-meme adapter over ThemedCard
MiaoReading       // UI-friendly adapter over ThemedReading
LlmPayload        // structured JSON sent to an LLM
```

This keeps card facts separate from the theme experience, so MiaoTarot is only the first deck. Later `xxxTarot` variants can reuse draw logic, spread semantics, synthesis, and LLM payload generation.

## Implementation Steps

1. Use `@cometpisces/tarot-kit` as the source of truth for 78-card data and random draws.
2. Define reusable themed Tarot interfaces in `site/src/domain/themedTarot.ts`.
3. Define 22 Major Arcana cat archetypes locally as the first `ThemedDeckConfig`.
4. Define Miao-friendly spread templates locally: single card, three-card flow, and relationship spread.
5. Map each spread position to a reading aspect such as current situation, inner state, root cause, development, or advice.
6. Render the first screen as a visual MiaoTarot experience with a generated original cat Tarot hero image.
7. Generate both local synthesis and an LLM-ready JSON payload from the shared foundation.
8. Send the LLM-ready payload to the project proxy so provider keys stay server-side.

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

The implementation now uses a Cloudflare Pages Function proxy for production. The browser sends only the validated reading payload and theme id; the proxy owns model configuration, provider keys, prompt construction, rate limits, and optional Turnstile verification.
