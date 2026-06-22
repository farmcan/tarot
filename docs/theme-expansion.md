# Theme Expansion Checkpoint

Date: 2026-06-22

This checkpoint adds `ShipTarot` as the second concrete `xxxTarot` theme. The goal is to prove the foundation can support a theme beyond MiaoTarot without duplicating draw, spread, synthesis, or LLM payload logic.

## Theme Choice

`ShipTarot` translates Tarot into project/product/engineering language:

- card label: `推进牌`
- upright label: `顺风`
- reversed label: `逆风`
- product voice: calm project partner, specific and execution-oriented
- use case: project planning, scope decisions, launch risk, execution rhythm

This is intentionally different from MiaoTarot. MiaoTarot uses cat meme emotion as the entry point; ShipTarot uses shipping and project motion as the entry point.

## Files Added

- `site/src/domain/shipTarot.ts`
- `site/src/domain/themes.ts`

`ShipTarot` defines all 22 Major Arcana mappings and uses `createThemedDeckAdapter(shipDeckConfig)` for:

- reading creation
- synthesis
- LLM payload
- LLM prompt

## What This Proves

The same foundation can support multiple products:

```ts
const shipAdapter = createThemedDeckAdapter(shipDeckConfig);

export function createShipReading(params) {
  return shipAdapter.createReading(params);
}
```

The theme registry now has:

- `miaotarot`
- `shiptarot`

## UI Status

The app still defaults to MiaoTarot. This checkpoint deliberately stops at the domain and registry layer because the current UI has Miao-specific visual language and copy. A later checkpoint can decide between:

- a simple theme switcher in the existing UI
- separate routes such as `/v1/miao/` and `/v1/ship/`
- separate static builds per theme

## Validation

Validation for this checkpoint:

- `npm run typecheck`
- `npm run build`

No new runtime dependency was added.
