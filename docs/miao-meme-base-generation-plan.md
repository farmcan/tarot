# MiaoTarot Meme-Base Generation Plan

Date: 2026-07-02

This plan replaces the earlier "nice generated cat Tarot" approach with a more meme-native production method:

> raw cat meme base image + Rider-Waite-Smith symbolic anchors + MiaoTarot emotional copy = final card art

The goal is not to generate random cute cats. Each card should feel like a recognizable internet cat state that has been translated into Tarot language.

## What MiaoTI Teaches Us

Checked local reference project: `../miaoti`.

Useful patterns:

- `../miaoti/site/assets/cat-types/` contains named cat meme types with static/animated assets.
- `../miaoti/site/data/miaoti.json` separates result text from share hooks.
- `../miaoti/AGENTS.md` defines the strongest copy rule: result pages can be sharper, but share cards should stay positive enough that users want to post them.
- `../miaoti/archive/research/cat-meme-research/ai-styling-plan.md` already uses the right workflow: collect raw meme images first, then style them consistently.

For MiaoTarot, we should reference this structure without copying MiaoTI's product text directly.

## Prompt Formula

Every card prompt must be built from four inputs:

1. Meme base image
   - Use this as the pose, expression, body angle, and emotional anchor.
   - Do not trace it literally.
   - Do not keep embedded text, labels, watermarks, or original background clutter.

2. Standard Tarot anchor
   - Use the matching Major Arcana card only for symbolic composition.
   - Preserve 2-4 symbols such as cliff, wand, pillars, scales, cup, sun, moon, wreath.
   - Do not recreate the Rider-Waite-Smith image directly.

3. Miao card state
   - Use the local card name, meme caption, emotional signal, and tiny action from `site/src/domain/miaoTarot.ts`.
   - The image should communicate the state before any text is read.

4. Product style
   - Square 1:1 result image.
   - One expressive domestic cat as the main subject.
   - Clear silhouette, mobile-readable, playful but polished.
   - No embedded text, no watermark, no logo, no human portrait, no gore.

Formula:

```text
Use [raw meme base image] as the pose/expression anchor.
Transform it into the MiaoTarot card "[card name]".
Keep the meme's recognizable body language: [behavior anchor].
Fuse in these Tarot symbols: [2-4 Rider-Waite symbols].
Use this Tarot fusion rule: [card-specific fusion].
Render as a square polished product illustration, readable at 360px wide.
Do not trace the meme image or the Rider-Waite card; create an original transformed illustration.
```

## Current Base Mapping

The source of truth lives in `site/src/domain/miaoArt.ts` under `memeBases`.

`npm run prepare:meme-bases` currently prepares local reference candidates from `../miaoti/site/assets/cat-types/` into:

```text
references/miao-meme-bases/
```

These are generation references, not public product assets. If we collect better raw internet meme originals, replace the corresponding file at the same `baseImagePath` and rerun prompt export.

| Tarot | Miao card | Meme base | Why it fits | Current reference status |
| --- | --- | --- | --- | --- |
| The Fool | 先冲了再说猫 | `ZOOM` 开猫 | 身体先冲，计划稍后加载。 | Strong |
| The Magician | 开柜门像开挂猫 | `PAWS` 伸爪猫 | 爪子伸出去，工具才会启动。 | Strong |
| High Priestess | 凌晨三点凝视猫 | `STARE` 盯人猫 | 沉默但已经看透。 | Medium, could use clearer raw meme |
| Empress | 太阳能充电猫 | `NAPPY` 午睡王 | 先回血，再谈产出。 | Strong |
| Emperor | 键盘领主猫 | `KEYS` 键盘猫 | 占据工作台，地盘感强。 | Strong |
| Hierophant | 祖传埋法猫 | `ZEN` 禅猫 | 静坐、规则、仪式感。 | Weak, replace with stronger ritual/loaf base if found |
| Lovers | 贴贴三秒咬人猫 | `FLIRT` 撩人猫 | 亲近与边界同时存在。 | Strong |
| Chariot | 凌晨跑酷施工猫 | `OIIA` 闲不住猫 | 循环运动感，停不下来。 | Medium, source is small |
| Strength | 温柔但不许动猫 | `HISS` 哈气猫 | 情绪很大，但被温柔按住。 | Strong |
| Hermit | 纸箱免打扰猫 | `BOX` 纸箱猫 | 私人宇宙、离线空间。 | Strong |
| Wheel | 突然横着走猫 | `WOBBLE` 醉猫 | 失衡、转动、不可控。 | Weak, source is low-res |
| Justice | 罐头开法审计猫 | `SMUG` 皇帝猫 | 居高临下的标准感。 | Medium |
| Hanged Man | 倒挂沙发悟道猫 | `TILT` 歪头猫 | 换角度看世界。 | Medium, source is small |
| Death | 旧纸箱断舍离猫 | `HIDE` 榴莲猫 | 从旧壳里撤出，准备换状态。 | Strong |
| Temperance | 水温必须刚好猫 | `LICK` 臭美猫 | 精准调节、细节洁癖。 | Medium |
| Devil | 猫薄荷上头猫 | `NYAN` 彩虹猫 | 快乐过载、诱惑上线。 | Strong |
| Tower | 杯子自由落体猫 | `PUSH` 推杯猫 | 一爪让旧结构坍塌。 | Strong |
| Star | 窗边回血猫 | `KITTEN` 小奶猫 | 柔软、恢复、重新信任。 | Strong |
| Moon | 空气里有东西猫 | `WOAH` 瞪眼猫 | 信息不全但脑内剧场已开播。 | Strong |
| Sun | 肚皮营业猫 | `BELLY` 翻肚皮猫 | 安全、快乐、公开展示。 | Strong |
| Judgement | 开罐声满血复活猫 | `DRAMA` 显眼猫 | 被召唤，立刻醒来。 | Strong |
| World | 任务完成液体猫 | `LOAF` 撤退猫 | 收束、闭环、稳定落地。 | Medium |

## Raw Image Preparation

Directory contract:

```text
references/miao-meme-bases/<tarot-id>-<meme-code>.png
```

Rules:

- Each base image should be the clearest available raw or lightly cleaned meme image.
- Prefer image files without embedded text or with text easy to crop away.
- Keep one main cat pose per image.
- Avoid low-res images below 512px on the long side when a better source exists.
- Keep licensing/source notes separately before using any base in a public commercial context.

The current prepared candidates are copied from local MiaoTI assets so prompt design and review can proceed immediately. They can be replaced with stronger originals without changing code.

Use `docs/miao-meme-collection-plan.md` before replacing these files. It defines the source priority, candidate register, selection rubric, and the difference between research-only meme references and production base images.

## Generation Workflow

Before generation, run the image washing process in `docs/miao-image-washing-plan.md`. The base image should already have passed source eligibility, square crop review, and pose/expression brief creation.

1. Run:

```bash
npm run prepare:meme-bases
npm run export:art-prompts
```

2. For each record in `docs/generated/miao-art-prompts.json`, provide the matching `memeBase.baseImagePath` as the image reference to the image generator.

3. Generate one card at a time for the first pass. Do not batch all 22 until the first 3 pass review.

4. Save approved output to:

```text
references/miao-card-masters/<tarot-id>.png
```

5. Run:

```bash
npm run verify:launch
```

## Review Rubric

Each final card must pass all five checks:

- Meme base recognizability: the pose/expression still recalls the base meme.
- Tarot recognizability: at least 2 standard symbols are visible without reading text.
- Miao state clarity: the image matches the local card name and caption.
- Product readability: the card reads at mobile size and works in the share poster.
- Legal/safety hygiene: no copied watermark/text/logo, no direct RWS tracing, no gore or human portrait.

Review notes should call out:

- which base image worked or failed
- whether the Tarot symbols are too weak or too literal
- whether the image looks like a meme-native card or just a generic AI cat
- whether to regenerate, accept, or replace the base image

## Future Minor Arcana Note

If MiaoTarot expands from the current 22 Major Arcana cards to a full 78-card deck, do not start by generating 56 random extra cats. First define the Minor Arcana as:

```text
number stage + suit channel + meme-base expression = card concept
```

The lightweight rule is documented in `docs/content-launch-plan.md` under `Future Minor Arcana Direction`. Generation should only begin after the 56-card matrix has card names, upright/reversed meanings, meme-base types, and prompt seeds.
