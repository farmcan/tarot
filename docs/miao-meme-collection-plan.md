# MiaoTarot Meme Collection Plan

Date: 2026-07-03

This document defines how to collect meme-base images for MiaoTarot without turning the deck into random cat pictures or unmanaged third-party assets.

The first collected candidate register lives in `docs/miao-meme-candidate-register.md`.

## Goal

MiaoTarot images should feel like:

```text
recognizable internet cat behavior + Tarot symbolic structure + original MiaoTarot illustration
```

The collection process should answer three questions before generation starts:

- Which meme behavior is this card based on?
- Is the pose/expression strong enough to survive style transfer?
- Is the source safe enough to use as a production reference?

## Two-Lane Collection Model

Use two separate lanes:

| Lane | Purpose | Can be committed? | Used for final generation? |
| --- | --- | --- | --- |
| Meme research board | Identify canonical internet cat behaviors, meme names, poses, and jokes. | No raw third-party images unless rights are clear; store URLs/notes instead. | Only as tone and archetype reference. |
| Production base set | Clean image references that can anchor generation. | Yes, if source/rights are acceptable. | Yes. These live under `references/miao-meme-bases/`. |

This keeps the product meme-native without pretending that every viral image is automatically safe to ship.

## Source Priority

Prefer sources in this order:

1. Owned or commissioned cat photos that recreate a meme behavior.
2. Internal project assets with clear permission, such as approved MiaoTI-derived references.
3. Public-domain, CC0, or explicitly licensed cat images with a pose close to the meme archetype.
4. User-submitted cat photos with written permission.
5. Famous internet meme images for research only, unless rights are checked separately.

The safest production pattern is:

```text
famous meme = archetype name and joke
owned/licensed cat image = actual generation base
```

## Search Formula

Start from behavior, not from card names.

```text
[cat behavior] + [pose/emotion] + meme
[cat behavior] + funny cat
[cat behavior] + reaction cat
[Chinese meme phrase] + 猫 表情包
```

Examples:

| Need | Search direction |
| --- | --- |
| sudden action | `zooming cat meme`, `running cat reaction`, `猫 冲刺 表情包` |
| judgment stare | `staring cat meme`, `judging cat reaction`, `猫 盯人 表情包` |
| boundary/territory | `cat in box meme`, `box cat reaction`, `纸箱猫 表情包` |
| chaos/collapse | `cat pushes glass meme`, `cat knocking things off`, `猫 推杯子 表情包` |
| confusion/fear | `wide eyed cat meme`, `shocked cat reaction`, `猫 瞪眼 表情包` |
| overload | `tired cat meme`, `overwhelmed cat reaction`, `猫 放空 表情包` |

For each card, collect 3-5 candidates first. Do not pick a final base from a single search result.

## Candidate Register

Keep a lightweight register before copying any candidate into `references/miao-meme-bases/`.

Suggested fields:

```text
status
tarot_id
miao_card_name
meme_code
behavior_archetype
candidate_url
source_owner
license_or_permission
local_candidate_path
resolution
has_embedded_text
has_watermark
meme_readability_1_to_5
tarot_fit_1_to_5
source_risk_low_medium_high
notes
```

Status values:

```text
research-only
candidate
approved-production-base
rejected
needs-rights-check
```

## Selection Rubric

Score each candidate before generation:

| Check | Pass condition |
| --- | --- |
| Meme readability | The expression or pose is recognizable without the card title. |
| Single-subject clarity | One main cat dominates the image. |
| Transformability | The pose can hold 2-4 Tarot symbols without becoming cluttered. |
| Mobile crop | The cat remains readable in a square crop at small size. |
| Source hygiene | No unavoidable watermark, logo, embedded caption, or unclear permission issue. |
| Resolution | Prefer 768px+ on the long side; avoid anything below 512px if alternatives exist. |

Reject candidates that only work because of overlaid text. MiaoTarot card art should be funny from body language first.

## Current Major Arcana Priorities

The current 22-card mapping lives in `site/src/domain/miaoArt.ts`. The first replacement pass should focus on weak or medium bases:

| Priority | Card | Current base | Need |
| --- | --- | --- | --- |
| 1 | The Hierophant | `ZEN` | Stronger ritual, sermon, elder, or solemn loaf behavior. |
| 2 | Wheel of Fortune | `WOBBLE` | Clearer unstable, spinning, rolling, or sideways chaos pose. |
| 3 | The Chariot | `OIIA` | Higher-resolution motion/zoom base. |
| 4 | The Hanged Man | `TILT` | More obvious upside-down or perspective-flipped cat. |
| 5 | High Priestess | `STARE` | More iconic silent, all-knowing, midnight stare. |

Use these three as calibration cards before regenerating all 22:

| Card | Why |
| --- | --- |
| The Fool / `ZOOM` | Tests whether pure meme motion can become Tarot. |
| The Tower / `PUSH` | Tests whether a famous cat behavior can carry a clear Tarot symbol. |
| The Moon / `WOAH` | Tests whether reaction-face energy survives the final illustration style. |

## Minor Arcana Collection

For the future 56-card expansion, collect by number stage first, then suit channel.

Number stage:

```text
1 spark
2 choice
3 interaction
4 territory
5 conflict
6 recovery
7 defense
8 acceleration
9 threshold
10 overload
```

Suit channel:

```text
Wands = action chaos
Cups = emotional attachment
Swords = anxious judgment
Pentacles = material routine
```

Example:

```text
5 of Wands = conflict + action chaos = cats fighting over toy
5 of Cups = conflict + emotion = sad cat after spilled bowl
5 of Swords = conflict + judgment = smug winner cat
5 of Pentacles = conflict + material safety = locked-out hungry cat
```

Do not collect 56 unrelated cute-cat images. Collect repeatable archetypes that make the number system visible across suits.

## Storage Contract

Only approved production bases should be copied into:

```text
references/miao-meme-bases/<tarot-id>-<meme-code>.png
```

Research-only images should stay outside the committed repo unless rights are clear. If needed, keep only URLs and notes in docs or a private source register.

After replacing production bases:

```bash
npm run prepare:meme-bases
npm run export:art-prompts
npm run review:art-sheets
```

Then run the three-card calibration generation before the full 22-card batch.
