# Themed Tarot Foundation

Date: 2026-06-22

This project now treats MiaoTarot as the first themed Tarot deck, not as a one-off implementation. The reusable layer lives in `site/src/domain/themedTarot.ts`.

## What the Foundation Reuses

| Concern | Shared implementation | Theme-specific input |
| --- | --- | --- |
| Card source | `@cometpisces/tarot-kit` card data and meanings | Optional themed mapping for each card |
| Draw logic | Major Arcana shuffle and upright/reversed orientation | Spread selection |
| Reading model | `ThemedReading`, `ThemedReadingCard` | `ThemedDeckConfig` labels and cards |
| Synthesis | Shared headline, summary, action, and share structure | Theme voice, card captions, and actions |
| LLM payload | `buildThemedLlmPayload` | Theme task name, product name, prompt voice, and boundaries |
| LLM prompt | `buildThemedLlmPrompt` | Theme identity and output contract labels |

## Core Interfaces

`ThemedCard` is the minimum card-level unit for an `xxxTarot` idea:

```ts
interface ThemedCard {
  tarotId: string;
  title: string;
  archetype: string;
  caption: string;
  uprightMeaning: string;
  reversedMeaning: string;
  emotionalSignal: string;
  tinyAction: string;
  shareText: string;
  palette: string;
  sigil: string;
}
```

`ThemedDeckConfig` is the product-level contract:

```ts
interface ThemedDeckConfig {
  id: string;
  productName: string;
  taskName: string;
  cardLabel: string;
  archetypeLabel: string;
  uprightLabel: string;
  reversedLabel: string;
  emptyQuestion: string;
  fallbackShareText: string;
  promptIdentity: string;
  promptVoice: string;
  promptBoundary: string;
  cards: Record<string, ThemedCard>;
  spreadIds: readonly string[];
}
```

## How to Add a Future `xxxTarot`

1. Create `site/src/domain/<theme>Tarot.ts`.
2. Define a `Record<string, ThemedCard>` that maps Tarot card ids to themed cards.
3. Export a `<theme>DeckConfig: ThemedDeckConfig`.
4. Wrap the shared helpers if the UI needs theme-native property names:

```ts
export function createThemeReading(params) {
  return createThemedReading(themeDeckConfig, params);
}

export function buildThemePrompt(reading) {
  return buildThemedLlmPrompt(themeDeckConfig, reading);
}
```

5. Add any theme visual asset under `site/public/assets/`.
6. Add a UI entry point or route. If multiple themes should coexist, promote the current Miao-specific UI strings into a theme registry.

## MiaoTarot as the First Theme

MiaoTarot keeps its friendly names (`MiaoCard`, `MiaoReading`, `miaoMeaning`) as an adapter over the shared foundation. That makes existing UI code stable while letting future themes reuse:

- `createThemedReading`
- `createThemedSynthesis`
- `buildThemedLlmPayload`
- `buildThemedLlmPrompt`
- `getThemedOrientationLabel`

## LLM Boundary

The app should always draw cards locally first, then send structured data to an LLM. The LLM should interpret the payload, not decide the cards. This keeps the deck state auditable and allows future themes to share the same model call shape.

For public deployment, keep API keys server-side through a backend proxy or edge function. The browser-side OpenAI-compatible endpoint is useful only for local prototyping.
