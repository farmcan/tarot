# MiaoTarot Content Launch Plan

Date: 2026-06-29

This is the working plan for turning MiaoTarot from a prototype into launchable content. The goal is to avoid rebuilding Tarot infrastructure while making the Miao layer feel original, visual, and shareable.

## Content Principle

MiaoTarot should import the Tarot foundation and create only the product-specific layer:

- Import card data, meanings, draw helpers, and standard image mappings where a maintained package already exists.
- Keep Miao names, meme copy, emotional translation, visual direction, and share copy original.
- Use standard Rider-Waite-Smith imagery as composition reference for generated Miao images, not as the final brand look.
- Keep LLM interpretation bounded by the already drawn cards, spread positions, and local Miao content.

## References Checked

| Source | Use | License / Risk | Decision |
| --- | --- | --- | --- |
| `@cometpisces/tarot-kit` | 78-card data, meanings, draw helpers | MIT package | Already imported as the core Tarot data source. |
| `@cometpisces/tarot-kit-images` | 78 Rider-Waite image files and card-id mapping helpers | MIT for code/mapping; image copyright varies by jurisdiction | Added as a standard visual reference package. Use for review and generation references; avoid presenting legal certainty for commercial use. |
| `metabismuth/tarot-json` | Tarot JSON/cards reference | MIT | Useful comparison, but current `tarot-kit` already covers our data needs. |
| `LindseyB/tarot-api` | Simple Tarot API structure | MIT | Useful API pattern reference; do not need to import. |
| `abdul-hamid-achik/tarot-mcp` | MCP/tool-style Tarot reading structure | MIT | Useful prompt/tool boundary reference. |
| `criel2019/lumi-tarot` | Cat-hosted Tarot product shape | No license metadata found | Product inspiration only; do not copy code or content. |
| GitHub `cat tarot` search results | Confirms there are cat Tarot experiments | Mostly no clear license | Do not copy; use only as market signal. |

## Launch Copy Direction

The product should not sell itself as fortune telling. The launch voice is:

> 抽一张猫咪塔罗，换个角度看清问题。

Primary copy:

- Brand: `MiaoTarot`
- Chinese name: `猫猫塔罗`
- Promise: `不预测命运，以标准牌义帮助你换个角度看清问题。`
- Primary CTA: `开始抽牌`
- AI CTA: `生成 AI 猫语解读`
- Share line: `今天是哪只猫在提醒你？`
- Safety line: `Tarot 是自我观察工具，不替代专业建议。`

Tone rules:

- Funny, but not cheap.
- Specific, but not deterministic.
- Emotionally accurate, but not crisis or medical advice.
- Cat meme language is the hook; Tarot structure is the backbone.

## Image Direction

Each Miao card now has a structured art direction in `site/src/domain/miaoArt.ts`:

- meme-base reference image and behavior anchor
- standard Rider-Waite image import
- standard symbols to preserve
- Miao cat scene
- composition guidance
- reusable image generation prompt builder

Generation policy:

1. Use a real cat meme base image as the pose/expression anchor.
2. Use the matching Rider-Waite card as symbolic reference.
3. Preserve 2-4 symbolic anchors from the standard card.
4. Replace the human/divine figure with one expressive domestic cat.
5. Do not trace or recreate either the meme base or the original Tarot card directly.
6. Produce square result images that read well in the website, share poster, and mobile screenshots.

Recommended saved path once images are generated:

```text
references/miao-card-masters/<tarot-id>.png
```

The current CSS-rendered `MiaoStatePicture` remains a fallback for cards without generated images.

Current generated-image coverage:

- Done: all 22 Major Arcana Miao images are saved under `site/public/assets/miao-cards/` and wired through `miaoArt.ts`.
- Done: add `references/miao-meme-bases/` and `docs/miao-meme-base-generation-plan.md` so future image passes start from meme bases instead of generic generation.
- Done: run real image-to-image calibration for `PUSH`, `WOAH`, and `ZOOM`; record that the wash formula passes for the first two while the static `ZOOM` source candidate does not.
- Done: verify and checksum the first two openly licensed raw network sources, run source-faithful Fool/Moon washes, and reject the licensed-but-behaviorally-wrong Tower source.
- Next: keep the generated originals in Codex's image output directory as reference history; only the approved PNGs in `site/public/assets/miao-cards/` are consumed by the site.
- Next: finish provenance review for the remaining weak bases, add public attribution/license treatment, and promote only candidates that pass side-by-side source review. Do not replace all 22 cards from a single unreviewed batch.

## Future Minor Arcana Direction

The current v1 only covers the 22 Major Arcana. A complete Tarot deck has 78 cards, so a full MiaoTarot expansion would add 56 Minor Arcana cards.

Product principle:

> Major Arcana = big life drama. Minor Arcana = the specific way a cat loses it today.

Do not treat the 56 Minor Arcana as diluted Major Arcana. Use a repeatable state-machine formula:

```text
suit = the life channel
number = the stage of the situation
meme base = the internet cat expression for that stage
```

Number meanings:

| Number | Core state | Miao meme direction |
| --- | --- | --- |
| Ace / 1 | start, spark, first impulse | 突然来劲猫 |
| 2 | choice, tension, balance | 左右为难猫 |
| 3 | interaction, early shape, feedback | 三猫开会猫 |
| 4 | stability, territory, boundary, stuckness | 纸箱据点猫 |
| 5 | conflict, crash, competition | 炸毛开打猫 |
| 6 | easing, exchange, recovery | 被顺毛猫 |
| 7 | testing, defense, strategy | 暗中观察猫 |
| 8 | acceleration, repetition, rapid triggers | 凌晨跑酷猫 |
| 9 | threshold, endurance, nearly full | 眼神空掉猫 |
| 10 | overload, completion, collapse or payoff | 全压上来猫 |

Suit channels:

| Suit | MiaoTarot channel | Meme-base direction |
| --- | --- | --- |
| Wands | action, drive, impulse, chaotic execution | 跑酷、扑、冲、拆家 |
| Cups | emotion, relationships, attachment, inner weather | 贴贴、委屈、emo、求抱 |
| Swords | thought, anxiety, judgment, sharp language | 凝视、锐评、开庭、破防 |
| Pentacles | work, money, body, routine, material safety | 罐头、纸箱、打工、囤货 |

Court-card roles:

| Court | Miao role |
| --- | --- |
| Page | 新手试探猫: curious, learning the suit's energy |
| Knight | 上头执行猫: fast, dramatic, likely to overdo it |
| Queen | 场域掌控猫: stable, receptive, emotionally fluent |
| King | 规则制定猫: mature, structured, sometimes too bossy |

Before generating 56 images, create a Minor Arcana matrix with these fields for every card:

```text
tarot card / Miao card name / one-line meaning / upright / reversed / meme-base type / prompt seed
```

## LLM Prompt Direction

The production LLM path is the Cloudflare Pages Function at:

```text
functions/api/readings/analyze.js
```

Prompt rules implemented there:

- Browser sends only `{ themeId, payload }`.
- Server validates payload and rebuilds the provider prompt.
- The model must only interpret already drawn cards.
- The model returns strict JSON for `title`, `summary`, `cards`, `actions`, and `shareText`.
- Each card interpretation must combine:
  - card position
  - traditional Tarot meaning
  - Miao meme translation
  - relevance to the user question
- Output avoids fixed predictions, fear, crisis advice, or professional replacement.

## Implementation Plan

1. Foundation import
   - Done: use `@cometpisces/tarot-kit` for data and draw logic.
   - Done: add `@cometpisces/tarot-kit-images` for standard Rider-Waite references.

2. Content architecture
   - Done: keep Miao card content in `miaoTarot.ts`.
   - Done: add `miaoArt.ts` for standard-symbol references and image generation prompts.
   - Done: keep LLM call shape in `llm.ts`; keep server prompt in the Cloudflare Function.

3. UI review surface
   - Done: Deck tab initially exposed each Miao card, standard Tarot reference, symbolic anchors, and a copyable image prompt for internal review.
   - Done: public Deck tab now shows generated Miao art, cat-language meanings, and small actions; standard references and image prompts stay in docs/source and are hidden from the default public UI.

4. Image production
   - Done: generate the first 3 square style-calibration images from `miaoArt.ts`.
   - Done: save approved sample images under `site/public/assets/miao-cards/`.
   - Done: update `MiaoCardArt` to prefer generated image assets and fall back to CSS art.
   - Done: generate and review the remaining 19 images for consistency, Tarot symbol retention, mobile readability, and cat meme clarity.
   - Done: update the share poster to use generated image assets with CSS art as fallback.
   - Done: redesign image production around meme-base references from MiaoTI-style cat memes.
   - Next: regenerate final card art from raw meme bases and run image-by-image review.

5. Prompt QA
   - Done: add Wrangler config and scripts for Cloudflare Pages static + Functions deployment.
   - Done: add local content launch verification for 22 images, prompt coverage, generated-image mappings, and LLM prompt guardrails.
   - Done: add local Cloudflare Pages behavior verification for route aliases, launch headers, image serving, and unconfigured API no-store behavior.
   - Done: move structured LLM JSON validation into `shared/llmContract.js` so browser, server, and smoke tests use one contract.
   - Done: add keyless local LLM smoke with an OpenAI-compatible mock provider.
   - Done: add a production smoke gate that verifies the current build marker, AVIF assets, Pages Functions, D1 counter/events, and optional LLM availability.
   - Next: deploy the Pages Function with `LLM_API_KEY`.
   - Next: run `npm run smoke:llm` against the deployed endpoint.
   - Next: sample single-card, three-card, and relationship spreads for tone and JSON compliance.

6. Launch readiness
   - Done: add public route aliases for MiaoTarot through `site/public/_redirects`.
   - Done: add launch headers through `site/public/_headers`.
   - Done: add a launch runbook covering Cloudflare deploy, LLM secrets, smoke tests, routes, headers, and third-party source boundaries.
   - Done: hide internal research, theme lab, payload, and prompt panels behind local dev / `?debug=1`.
   - Done: add privacy-preserving daily aggregate events for the core reading, sharing, and LLM funnel.
   - Next: authenticate Wrangler, create/apply the D1 binding, deploy `main`, and pass `npm run smoke:production` against the public origin.

## Done Criteria

MiaoTarot is content-launch-ready when:

- All 22 Major Arcana Miao cards have approved generated image assets.
- Each image visibly retains standard Tarot symbolism while reading as a Miao cat meme.
- LLM output is structured JSON and passes smoke testing on the deployed endpoint.
- The first screen, result view, deck view, and share poster all use launch copy rather than dev/explainer copy.
- The app remains usable without LLM configuration.
