# MiaoTarot Wash Trial Prompts

Date: 2026-07-04

This records the first prompt-only washing trial for three calibration cards: The Tower, The Moon, and The Fool.

Important limitation: this run used the built-in text-to-image path. It did not use real local reference images as image-to-image inputs. Therefore it validates prompt direction and meme archetype choices, not high-fidelity preservation of a specific original meme image.

## Outputs

Saved trial images:

```text
docs/generated/miao-wash-trials/the-tower-push-trial-01.png
docs/generated/miao-wash-trials/the-moon-woah-trial-01.png
docs/generated/miao-wash-trials/the-fool-zoom-trial-01.png
docs/generated/miao-wash-trials/miao-wash-trial-contact-sheet-01.png
```

## Trial Result

| Card | Result | Review |
| --- | --- | --- |
| The Tower / `PUSH` | Reject for production; useful for direction. | Cat-push-cup behavior works. Failure: generated a tarot card frame and `XVI`, despite the desired product-asset direction. |
| The Moon / `WOAH` | Best of this batch. | Wide-eyed reaction face stayed dominant; Moon symbols support the mood without overpowering the meme. |
| The Fool / `ZOOM` | Mixed. | Motion works, but the output is too clean/cute and not close enough to a raw zoomies meme. |

## Prompt Pattern

The useful structure is:

```text
Use case: stylized-concept
Asset type: MiaoTarot light-wash trial, square illustration without card frame
Primary request: Create a light-wash trial for [CARD] as a cat meme tarot illustration.
Scene/backdrop: preserve the raw meme composition and object relationship.
Subject: one expressive domestic cat only; the meme behavior is the first priority.
Style/medium: polished MiaoTarot illustration, clean editorial web asset, soft paper texture, crisp silhouette.
Composition/framing: square 1:1, mobile-readable, meme action or face dominates.
Tarot overlay: subtle symbols only; symbols must support the meme and not replace it.
Constraints: no card border, no title, no letters, no numbers, no roman numerals, no readable text, no watermark, no logo, no humans, no extra animals, no generic fantasy tarot scene.
```

## The Tower Prompt

```text
Use case: stylized-concept
Asset type: MiaoTarot image-to-image prompt trial, square tarot card illustration
Primary request: Create a light-wash trial for The Tower as a cat meme tarot card.
Scene/backdrop: a simple domestic table edge, mostly preserving a raw meme-like composition: one cat sits calmly beside a cup at the edge of a table, one paw is gently pushing the cup toward falling.
Subject: one expressive domestic cat; the exact joke is the calm paw causing collapse. The cat should look deliberate and slightly indifferent.
Style/medium: polished MiaoTarot card illustration, clean editorial web asset, soft paper texture, crisp silhouette, warm daylight, not fantasy-heavy.
Composition/framing: square 1:1, close table-level view, cat and falling cup dominate the frame, object relationship must remain readable at mobile size.
Tarot overlay: subtle Tower card symbols only: a tiny tower-shaped cup stack or cup shadow, a small lightning-shaped motion line, a little crown-like object tipping. Tarot symbols must not overpower the meme action.
Constraints: preserve the meme behavior first; no readable text; no watermark; no logo; no human; no extra cats; no gore; no injury; no busy background; no generic fantasy tarot scene; do not change the scene into a castle. The final image should still read as cat pushes cup off table at first glance.
```

Required next revision:

```text
Add: no card border, no title, no letters, no numbers, no roman numerals, no decorative tarot frame, no label plaque.
Change asset type from "tarot card illustration" to "square product illustration without border".
```

## The Moon Prompt

```text
Use case: stylized-concept
Asset type: MiaoTarot light-wash trial, square illustration without card frame
Primary request: Create a light-wash trial for The Moon as a cat meme tarot illustration.
Scene/backdrop: a simple dim hallway or room corner, preserving a raw reaction-meme composition: a close-up domestic cat with huge wide eyes, frozen in a shocked confused expression, reacting to something unseen in the air.
Subject: one expressive domestic cat only; the face and eyes are the whole joke. Keep the cat close to camera, slightly awkward, startled, uncertain, and funny.
Style/medium: polished MiaoTarot illustration, clean editorial web asset, soft paper texture, crisp fur silhouette, muted moonlit palette, not dark horror.
Composition/framing: square 1:1, close-up reaction-face framing, cat face dominates, readable at 360px width.
Tarot overlay: subtle Moon card symbols only: crescent moon glow, two doorway shapes like distant towers, faint water reflection or small ripples, ambiguous soft shadow. Symbols must be secondary to the reaction face.
Constraints: no card border, no title, no letters, no numbers, no roman numerals, no readable text, no watermark, no logo, no humans, no extra animals, no gore, no busy fantasy scene. Preserve the meme behavior first: wide-eyed confused reaction. Do not turn it into a generic mystical cat portrait.
```

Next revision:

```text
Keep this structure. When using real reference image-to-image, increase reference/composition strength and reduce Tarot overlay strength.
```

## The Fool Prompt

```text
Use case: stylized-concept
Asset type: MiaoTarot light-wash trial, square illustration without card frame
Primary request: Create a light-wash trial for The Fool as a cat meme tarot illustration.
Scene/backdrop: a simple home doorway or hallway threshold opening into bright outdoor light, preserving a raw zoomies/running-cat meme composition: one cat is already mid-sprint, body stretched forward, paws in motion, as if it ran before thinking.
Subject: one expressive domestic cat only; the joke is impulsive forward motion and zero planning. The cat should be funny, energetic, slightly chaotic, but not aggressive.
Style/medium: polished MiaoTarot illustration, clean editorial web asset, soft paper texture, crisp silhouette, warm daylight, natural domestic details.
Composition/framing: square 1:1, dynamic diagonal motion, cat dominates the frame, one paw crossing a threshold, readable at mobile size.
Tarot overlay: subtle Fool card symbols only: a tiny toy bundle or small cloth pouch bouncing near the cat, a small white flower knocked into the air, open sky or bright doorway beyond, a safe visual hint of an edge/threshold. Symbols must support the running meme, not replace it.
Constraints: no card border, no title, no letters, no numbers, no roman numerals, no readable text, no watermark, no logo, no human, no extra animals, no cliff danger, no injury, no busy fantasy scene. Preserve the meme behavior first: zoomies cat mid-sprint, body already moving before the plan is clear. Do not turn it into a generic heroic fantasy cat.
```

Next revision:

```text
Make the source feel less polished and more meme-native: keep awkward motion blur, imperfect crop, and candid camera angle when the production base supports it.
Avoid making the cat too cute, heroic, or poster-like.
```

## Image-To-Image Version

When a tool with real reference-image input is available, use this base formula:

```text
Use the provided reference image as the primary composition.
Preserve the cat's pose, facial expression, camera angle, crop, gaze direction, and core object relationship.
Apply a light MiaoTarot illustration wash: unified color, cleaner edges, subtle paper texture, mobile-readable polish.
Add only these Tarot symbols: [2-3 symbols].
Keep the original meme behavior recognizable at first glance.
Do not add card border, title, letters, numbers, roman numerals, watermark, logo, humans, extra animals, or a fantasy tarot scene.
Do not replace the reference scene; stylize it.
```

Suggested parameters for external tools:

```text
reference/composition strength: high
style strength: medium
denoise/image-change strength: low to medium
Tarot symbol strength: low to medium
text/label suppression: high
```
