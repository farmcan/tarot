# MiaoTarot Art Review

Date: 2026-07-02

Review artifacts:

- `docs/generated/miao-card-contact-sheet.png`
- `docs/generated/miao-meme-base-contact-sheet.png`
- `docs/generated/miao-art-prompts.md`

## Current Verdict

The current 22 card images are acceptable for a first public version, but they are not meme-native enough.

They do well at:

- polished square product illustration
- mobile readability
- Rider-Waite-Smith symbol retention
- consistent warm fantasy/card-art style
- share poster compatibility

They do not yet do well enough at:

- preserving a recognizable network meme pose
- feeling like a transformed meme base
- making the user think "this exact cat state is me"
- carrying the joke before the card text is read

So the current images can ship as V1, but the next art pass should regenerate from meme-base references.

## End-to-End Image Analysis

| Area | Current image state | Review |
| --- | --- | --- |
| Tarot readability | Strong | Symbols like wand, moon, scales, cups, sun, tower, wreath, and card-like staging are visible. |
| Cat readability | Strong | Every card clearly centers one cat and reads at thumbnail size. |
| Meme readability | Weak to medium | The cats are expressive, but most poses are generic fantasy illustration poses rather than known meme-body-language. |
| Shareability | Medium | Pretty and coherent, but less likely to spread as a joke because the meme reference is not immediate. |
| Brand fit | Medium | Feels like "cat Tarot"; needs one more pass to become "MiaoTI-universe cat meme Tarot." |

## Base Candidate Review

Strong current base candidates:

- `ZOOM` for The Fool
- `PAWS` for The Magician
- `NAPPY` for The Empress
- `KEYS` for The Emperor
- `FLIRT` for The Lovers
- `HISS` for Strength
- `BOX` for The Hermit
- `PUSH` for The Tower
- `BELLY` for The Sun
- `DRAMA` for Judgement

Needs better raw source before final regeneration:

- `ZEN` for The Hierophant: current image is too small and too quiet.
- `OIIA` for The Chariot: current image is iconic but low-res.
- `WOBBLE` for Wheel: current reference is low-res and visually noisy.
- `TILT` for Hanged Man: current image is small; the body angle may not carry the Hanged Man alone.
- `STARE` for High Priestess: works conceptually, but needs a stronger staring-cat original.

## Regeneration Recommendation

Do not regenerate all 22 immediately. First regenerate a three-card calibration set:

1. The Fool / `ZOOM`
2. The Tower / `PUSH`
3. The Moon / `WOAH`

These cover:

- action meme
- destructive meme
- facial-expression meme

If those three preserve meme recognizability while retaining Tarot symbols, regenerate the remaining 19.

## Acceptance Rubric

Accept a regenerated card only if:

- the base meme is recognizable without reading the title
- at least two Tarot symbols are visible
- the image still works as a square product card
- there is no embedded text, watermark, or direct copied background
- the result is funnier than the current V1 image, not merely prettier
