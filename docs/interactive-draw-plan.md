# MiaoTarot Interactive Draw Plan

Date: 2026-07-16

## Product Goal

Turn the current form-first result generator into a tactile Tarot loop:

```text
choose 1-5 cards -> shuffle -> choose from all 22 backs -> place cards -> flip each card -> read/share
```

The interaction must preserve user agency without pretending that the visible back design reveals a card. The selected hidden cards, including their orientations, become the authoritative reading. The result layer must never draw a second random set.

## Reuse Before Custom Code

- `@cometpisces/tarot-kit`: keep using its 78-card data, `CardOrientation`, upright/reversed meanings, localized text, and reading helpers.
- `motion`: use its React 19-compatible tap gestures, layout transitions, 3D transforms, staggered animation, and reduced-motion support.
- Mantine: keep the existing segmented controls, switch, buttons, badges, panels, and responsive layout primitives.
- Custom code is limited to MiaoTarot's product-specific draw-session state and mapping a user-selected card into the existing reading model. The Tarot data and animation engine are not reimplemented.

`react-card-flip` was rejected because its published peer dependency only declares React 18. `@react-spring/web` is viable, but Motion better covers the full sequence of shuffle, selection lift, layout movement, and flip with one maintained API.

## Interaction State Machine

| State | Visible UI | Allowed action | Exit condition |
| --- | --- | --- | --- |
| `ready` | Mode, question, topic, reversal switch, stacked deck | Start shuffle | User starts |
| `shuffling` | Animated stack with changing back offsets | None | Animation settles |
| `selecting` | All 22 face-down Major Arcana cards | Select/deselect hidden cards | Required count selected |
| `placed` | Selected cards in named spread positions, face down | Flip any unflipped card | Every card flipped |
| `complete` | Punchline result plus existing detailed reading/share/AI | Draw again or continue reading | User restarts |

State transitions are explicit. Selection order maps to spread order: for three cards, the first selected card is Past, the second Present, and the third Next.

## Tarot Orientation Rules

- Upright and reversed meanings already exist in `@cometpisces/tarot-kit` and MiaoTarot's copy.
- When `包含逆位` is enabled, orientation is assigned while the deck is shuffled and remains hidden until reveal.
- The initial product probability remains approximately 30% reversed, matching the project's existing Miao draw behavior and keeping the first experience readable.
- A reversed reveal physically rotates the illustrated card 180 degrees.
- Orientation badges and explanation text stay upright outside the card so the result remains accessible.
- When reversals are disabled, every card is upright; this setting must be decided before shuffle.

## Card Backs

Each shuffle chooses one of three illustrated back skins for the whole deck. Local time makes Morning Garden, Noon Oracle, or Moon Atlas the preferred skin, while an occasional alternate preserves surprise. All cards in a session use the same back, preserving the information boundary.

Back skins share the homepage's violet, ivory, blue, and antique-gold visual language. They never encode card identity.

## Responsive Interaction

- Desktop: 22 backs appear as a dense two-row card field, with selected cards lifting in place.
- Mobile: the field becomes a horizontally scrollable two-row rail with stable card dimensions.
- Selection uses real buttons, `aria-pressed`, visible focus, and numbered selection markers.
- Motion respects `prefers-reduced-motion`; large shuffle movement becomes a short opacity transition.
- No drag-only action: tap/click and keyboard are the reliable primary controls.

## Result Hierarchy

The first revealed reward is intentionally short:

1. `你今天是：<猫牌名>`
2. One meme caption
3. `顺毛 / 炸毛` orientation
4. One tiny action

The existing traditional explanation, detailed spread cards, share poster, and AI interpretation follow below. This keeps the joke before the essay.

## Implementation Checkpoints

1. Add a pure draw-session domain module and selected-card reading constructor.
2. Add Motion and build reusable card-back / flippable-card components.
3. Replace the old direct draw button with the five-state interactive table.
4. Route completed selected cards into the existing reading, history, share, and AI surfaces.
5. Add domain tests for uniqueness, selection order, reversal rules, and reading identity.
6. Run typecheck, production build, Pages tests, desktop/mobile browser simulation, keyboard interaction, and screenshot review.

## Acceptance Criteria

- A user can choose one card or three cards from all 22 backs.
- No duplicate card can appear in a reading.
- The exact selected cards become the result; no hidden second draw occurs.
- Three-card selection order maps correctly to Past / Present / Next.
- Cards can be flipped individually in any order.
- At least one deterministic test proves reversed cards use reversed meanings.
- A reversed card is visibly upside down during reveal and in the detailed result.
- A reshuffle changes deck order and can change the back theme.
- Keyboard-only selection and flipping work.
- The interaction fits desktop and mobile without overlapping controls or unreadable cards.
