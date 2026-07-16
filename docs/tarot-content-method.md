# MiaoTarot Content Method

Date: 2026-07-16

## Adopted Method

MiaoTarot does not invent a separate divination grammar. It keeps a Rider-Waite-Smith-style Tarot skeleton and adds a cat-meme translation layer.

Established Tarot references commonly organize a card around:

1. image and symbols;
2. core keywords;
3. upright and reversed meanings;
4. the card's position in the spread;
5. the question domain, such as relationships or work;
6. relationships between cards;
7. a reflection prompt or practical action.

References:

- [Tarot.com Major Arcana](https://www.tarot.com/tarot/cards/major-arcana)
- [Tarot.com reversals](https://www.tarot.com/tarot/interpretation-reversals)
- [Biddy Tarot card meanings](https://biddytarot.com/tarot-card-meanings/)
- [Biddy Tarot reversed-card method](https://biddytarot.com/blog/how-to-interpret-reversed-tarot-cards/)

Reversed cards are not automatically negative. They may represent blocked or delayed energy, increased or reduced intensity, an inward/private expression, or a useful counterpoint to the upright meaning.

## Product Translation

Every result is rendered in five layers, in this order:

1. **Meme hook**: the cat name and one recognizable line.
2. **Tarot anchor**: traditional card name, keyword, and upright/reversed meaning.
3. **Position**: what this card answers in the chosen spread.
4. **Question context**: how the card changes for the selected topic.
5. **Action**: one small, non-fatalistic next step.

The joke earns attention; the Tarot structure earns trust. The product must not present either layer as a guaranteed prediction.

## Content Bundle Boundary

The stable layer is the imported Tarot card id, traditional meanings, orientation, spread position, and reading contract.

The mutable Miao layer is exposed through `MiaoCardContentBundle`:

```text
tarot id
  -> edition
  -> cat copy (name, archetype, caption, upright/reversed translation, action)
  -> art direction (generated image, meme base, RWS symbols, scene, composition)
```

The image and copy are one edition. When a cat image changes enough to alter the pose, meme reference, or emotional reading, update its paired copy and bump the edition instead of silently replacing only the file.

Existing `MiaoCard`, `MiaoReading`, `createMiaoReading`, and LLM payload shapes remain available for backward compatibility. `MiaoCardContentBundle` is an additive presentation boundary.

## Spread Counts

The interactive table supports one through five cards without using meaningless arbitrary counts:

| Count | Spread | Positions |
| --- | --- | --- |
| 1 | Daily focus | Focus |
| 2 | Contrast | Situation, Advice |
| 3 | Timeline | Past, Present, Next |
| 4 | Situation breakdown | Situation, Obstacle, Resource, Action |
| 5 | Relationship profile | Self, Other, Bond, Tension, Advice |

The existing `single` and `three-card` ids remain unchanged. New spread ids are additive.

## Card-Back Method

Card backs are presentation, never card identity. A session uses one skin for all 22 cards so repeated play cannot teach users which back maps to which face.

Three skins form one visual family based on the homepage deck:

- Morning Garden
- Noon Oracle
- Moon Atlas

Local time chooses the preferred skin. Each shuffle has a small chance to use one of the other skins, keeping the experience varied without changing draw probability or meaning.
