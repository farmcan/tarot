# MiaoTarot Image Generation Contract

This is the source-of-truth output contract for AI agents and human art runs.

## Required output

| Field | Value |
| --- | --- |
| Orientation | portrait |
| Aspect ratio | exact `5:7` |
| Preferred working size | `1020x1428` pixels |
| Fit | full-bleed artwork; no generated card frame |
| Text | no title, letters, numbers, caption, watermark, or logo |

`1020x1428` is exactly `5:7`. A larger exact multiple is acceptable when the image tool requires it, but both dimensions must preserve the ratio. Do not request `1254x1254`, `1:1`, or `square` for new card art.

The website card frame is already `5:7`. A square image rendered with `object-fit: contain` leaves empty bands, while native `5:7` art fills the frame without a second crop or extension pass.

## Agent/tool rule

When the generator has explicit controls, set both:

```text
aspect ratio: 5:7 portrait
size: 1020x1428
```

Also keep the ratio in the prompt. If the tool only supports a nearby portrait preset, choose the closest portrait canvas, generate with extra background at the edges, and make the final approved master an exact `5:7` crop without cutting the subject or symbols. Do not silently fall back to square.

## Prompt output block

Every active card prompt must include this intent:

```text
Output: native portrait 5:7 full-bleed card artwork, preferably 1020x1428 pixels.
Compose for the tall canvas from the start; do not generate a square composition for later cropping or stretching.
No printed card border; keep the main cat and essential Tarot symbols in the central safe area.
```

The active prompt sources are:

- Major Arcana: `site/src/domain/miaoArt.ts` and `scripts/export-miao-art-prompts.mjs`
- Minor Arcana: `scripts/export-miao-minor-art-prompts.ts`
- Generated production records: `docs/generated/miao-art-prompts.json` and `docs/generated/miao-minor-art-prompts.json`

Files such as `docs/miao-wash-trial-prompts.md` preserve historical square calibration prompts. They are review history, not the current output contract.

## Workflow

```bash
npm run export:art-prompts
npm run export:minor-art-prompts
```

Generate from the matching exported record and reference image. Save approved PNGs to the record's `outputPath`, then run:

```bash
npm run optimize:assets       # legacy Major Arcana pack
npm run optimize:doodle-pack  # 78-card doodle pack
npm run review:art-sheets
npm run verify:content
```

Existing `1254x1254` images are accepted as legacy during migration. Any newly generated or intentionally replaced master must use `5:7`.
