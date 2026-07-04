# MiaoTarot Image Washing Plan

Date: 2026-07-04

MiaoTI's weak point was not only meme discovery. The harder missing step was image washing: turning raw meme/cat references into original, consistent, product-ready card art without losing the meme behavior.

For MiaoTarot, image washing is a required production stage between collection and final generation.

Use `docs/miao-meme-archetype-map.md` before washing. It defines which famous cat meme archetype each card should preserve or recreate.

The first prompt-only calibration run is recorded in `docs/miao-wash-trial-prompts.md`.

## Definition

Image washing means:

```text
source candidate -> clean production base -> pose/expression brief -> transformed Tarot illustration -> QA-approved card art
```

It does not mean hiding source ownership, removing watermarks from third-party assets, or laundering copyrighted images. Source tracking stays intact. Research-only memes stay research-only.

## Inputs

Use three inputs per card:

- meme archetype: the recognizable internet-cat behavior
- production base: owned, licensed, or otherwise approved image reference
- Tarot anchor: 2-4 Rider-Waite-Smith symbols and the card-specific composition rule

## Pipeline

1. Source eligibility gate
   - Source page and license/permission are recorded.
   - Reject unavoidable watermark, logo, embedded caption, or unclear human portrait.
   - Reject candidates where the joke only works because of overlaid text.
   - Prefer 768px+ long side; use 512px as the practical minimum.

2. Clean base preparation
   - Crop to one main cat and a square-safe composition.
   - Remove irrelevant background clutter only when the source is allowed for editing.
   - Do not erase watermarks; reject or replace watermarked candidates.
   - Keep a private pre-generation copy outside public product assets.

3. Pose and expression extraction
   - Write a short brief before generation:

```text
body pose:
face/expression:
camera angle:
meme behavior:
what must survive:
what should be discarded:
```

4. Tarot transformation pass
   - Use the base as pose/expression reference, not as pixels to preserve.
   - Redraw the cat into the unified MiaoTarot illustration style.
   - Add 2-4 Tarot symbols from `site/src/domain/miaoArt.ts`.
   - Keep the original joke legible without embedded text.

5. Style unification pass
   - Square 1:1 output.
   - Same lighting family, edge detail, and product-card polish as the approved deck.
   - No source background, no text, no watermark, no logo.
   - The cat remains the dominant subject at mobile size.

6. QA review
   - Compare side by side:
     - current v1 card
     - raw/clean base
     - washed generated output
   - Score:
     - meme recognizability
     - Tarot recognizability
     - originality distance from source
     - mobile readability
     - source hygiene

## Failure Conditions

Reject the output if any of these are true:

- It looks like a generic AI cat Tarot card and the meme behavior disappeared.
- It looks like the source image with Tarot props pasted on.
- It depends on text, watermark, or caption to be funny.
- It keeps source-specific background clutter.
- It has fewer than two visible Tarot symbols.
- It cannot be read in a small share-card crop.

## First Calibration Set

Run image washing on three cards before all 22:

| Card | Base code | Why |
| --- | --- | --- |
| The Fool | `ZOOM` | Tests motion and impulsive meme behavior. |
| The Tower | `PUSH` | Tests whether a famous cat behavior can carry a Tarot collapse symbol. |
| The Moon | `WOAH` | Tests reaction-face energy and ambiguous atmosphere. |

Only continue to all 22 if these three pass review.

## File Contract

Research-only references:

```text
private notes / URLs only
```

Approved production bases:

```text
references/miao-meme-bases/<tarot-id>-<meme-code>.png
```

Final washed card art:

```text
site/public/assets/miao-cards/<tarot-id>.png
```

Review notes:

```text
docs/miao-art-review.md
docs/miao-meme-candidate-register.md
```

## Practical Next Step

For the current candidate set:

1. Verify source-page license for Fool, Tower, and Moon candidates.
2. Create private square crops for those three bases.
3. Generate image-to-image outputs using the prompt formula.
4. Build a side-by-side review sheet: v1 / base / washed output.
5. Accept the formula only if the outputs are funnier and more meme-native than current v1.
