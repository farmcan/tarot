# Themed Tarot Foundation

Date: 2026-06-22

This project now treats MiaoTarot as the first themed Tarot deck, not as a one-off implementation. Shared reading and spread contracts live in `site/src/domain/readingTypes.ts`, themed Tarot behavior lives in `site/src/domain/themedTarot.ts`, theme adapters live in `site/src/domain/themeAdapter.ts`, and theme-level product metadata is registered in `site/src/domain/themes.ts`.

## What the Foundation Reuses

| Concern | Shared implementation | Theme-specific input |
| --- | --- | --- |
| Card source | `@cometpisces/tarot-kit` card data and meanings | Optional themed mapping for each card |
| Draw logic | Major Arcana shuffle and upright/reversed orientation | Spread selection |
| Reading model | `ReadingBase`, `BaseReadingCard`, `ThemedReading`, `ThemedReadingCard` | `ThemedDeckConfig` labels and cards |
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
4. Create an adapter with `createThemedDeckAdapter`:

```ts
const themeAdapter = createThemedDeckAdapter(themeDeckConfig);
```

5. Wrap the shared helpers if the UI needs theme-native property names:

```ts
export function createThemeReading(params) {
  return themeAdapter.createReading(params);
}

export function buildThemePrompt(reading) {
  return themeAdapter.buildPrompt(reading);
}
```

6. Add any theme visual asset under `site/public/assets/`.
7. Add a `TarotTheme` entry in `site/src/domain/themes.ts`.
8. Add a UI entry point or route. If multiple themes should coexist, use the registry as the source of truth for labels, links, default questions, available spreads, and theme assets.

## MiaoTarot as the First Theme

MiaoTarot keeps its friendly names (`MiaoCard`, `MiaoReading`, `miaoMeaning`) as an adapter over the shared foundation. That makes existing UI code stable while letting future themes reuse:

- `createThemedReading`
- `createThemedSynthesis`
- `buildThemedLlmPayload`
- `buildThemedLlmPrompt`
- `getThemedOrientationLabel`

## LLM Boundary

The app should always draw cards locally first, then send structured data to an LLM. The LLM should interpret the payload, not decide the cards. This keeps the deck state auditable and allows future themes to share the same model call shape.

For public deployment, keep API keys server-side through the project proxy or another edge function. The browser UI should not ask users for provider endpoints, models, or API keys.
