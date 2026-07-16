# MiaoTarot Launch Runbook

Date: 2026-06-29

This runbook is the final launch checklist for publishing MiaoTarot as a Cloudflare Pages site with a server-side LLM proxy.

## Launch Surface

- Product route: `/`
- Stable Miao route aliases: `/miao/`, `/v1/miao/`
- Static build output: `v1/`
- Function endpoint: `/api/readings/analyze`
- Public counter endpoint: `/api/site-counter`
- Cloudflare Pages project: `tarot`
- Public tabs: 分享, 猫牌库, AI
- Internal tabs: 调研依据, 主题实验室, 数据, prompt preview; available in local dev or with `?debug=1`

Cloudflare Pages serves `v1/` as the site root, so the deployed `/` loads the app directly. `site/public/_redirects` keeps the Miao aliases pointed at that app root. The repository root `index.html` still redirects to `./v1/` for static local or GitHub Pages-style browsing.

`site/public/_headers` adds basic browser hardening, no-store caching for `/api/*`, and short cache headers for static assets.

## Content Status

- 22 Major Arcana Miao cards are mapped in `site/src/domain/miaoTarot.ts`.
- 22 generated card images are stored in `site/public/assets/miao-cards/`.
- Image prompts are exported to `docs/generated/miao-art-prompts.json` and `docs/generated/miao-art-prompts.md`.
- Each generated prompt preserves 2-5 standard Rider-Waite-Smith symbols while requiring original, non-traced cat Tarot art.
- The result view, deck review view, and share poster prefer generated images and fall back to CSS card art.
- The public deck view shows original Miao card art and cat-language meanings. Standard Rider-Waite-Smith reference images and generated-image prompts remain in source/docs for production review, not in the default public UI.

## Third-Party Sources

Use imported Tarot packages for foundation work instead of copying app code from random repos:

- `@cometpisces/tarot-kit`: MIT package used for Tarot data, meanings, and draw helpers.
- `@cometpisces/tarot-kit-images`: code and mappings are MIT; included Rider-Waite-Smith images have jurisdiction-specific copyright risk according to the package license. Use these images as standard-symbol references and review aids, not as the MiaoTarot brand art.
- Other GitHub Tarot projects in `docs/github-tarot-research.md`: reference product patterns only unless a repo-level license permits reuse.

## LLM Boundary

The browser must never hold provider secrets. Production analysis flows through:

```text
functions/api/readings/analyze.js
```

Required deployment secret:

```bash
npm run secret:llm
```

Optional provider settings:

```text
LLM_BASE_URL
LLM_MODEL
LLM_MAX_TOKENS
LLM_RATE_LIMIT_PER_MINUTE
LLM_ALLOWED_ORIGINS
```

The shared JSON contract lives in `shared/llmContract.js` and is imported by the browser, Pages Function, content verifier, and smoke scripts.

## Local Launch Gate

Run both commands before deployment:

```bash
npm run verify:launch
npm run smoke:llm:local
```

`verify:launch` exports prompts, type-checks the app, builds `v1/`, verifies content coverage, checks the unbound Pages fallback, tests the permanent counter, and exercises the 22-card selection/reversal state machine. `smoke:llm:local` starts an OpenAI-compatible mock provider and verifies the Pages Function can return valid structured JSON.

The interaction release check also includes a direct browser pass at desktop and 400px mobile widths: complete both one-card and three-card readings, flip three cards out of order, confirm an upside-down reversed card, and activate one card with the keyboard.

The launch gate also runs `npm run verify:pages`, which starts local Cloudflare Pages Dev and checks:

- `/` serves the built app with launch headers.
- `/miao/` and `/v1/miao/` redirect to the app root.
- a generated Miao card image is served from `v1/assets/miao-cards/`.
- `/api/readings/analyze` returns `llm_not_configured` with `Cache-Control: no-store` when no provider key is bound.

## Cloudflare Deployment

```bash
npx wrangler login
npm run counter:db:create
npm run counter:db:migrate
npm run secret:llm
npm run deploy
```

`counter:db:create` adds the `MIAOTAROT_DB` D1 binding to `wrangler.jsonc`. The D1-backed footer counter is permanent and uses a 24-hour browser cookie to avoid counting every refresh. See `docs/cloudflare-analytics-and-counter.md` for endpoint behavior and verification commands.

After the first deployment, enable Cloudflare Web Analytics under Workers & Pages -> `tarot` -> Metrics. Web Analytics provides private traffic trends; D1 remains the long-lived source for the public all-time count.

After deploy, run a real endpoint smoke:

```bash
TAROT_PRODUCTION_ORIGIN="https://your-domain.example" npm run smoke:production
TAROT_LLM_ENDPOINT="https://your-domain.example/api/readings/analyze" npm run smoke:llm
```

`smoke:production` verifies that the public origin is the current MiaoTarot build, serves real AVIF card assets, exposes Pages Functions, and has working D1 counter and product-event tables. LLM is reported but optional by default; set `TAROT_REQUIRE_LLM=1` to make availability a required launch condition.

If `npx wrangler whoami` says the CLI is not authenticated, deployment and project URL lookup are blocked until Cloudflare login is completed.

## Post-Deploy Checks

- `/` loads the app.
- `/miao/` redirects to the app.
- `/v1/miao/` redirects to the app.
- A one-card draw works without AI.
- The deck view shows all 22 generated Miao images.
- The share poster renders a generated Miao image and QR code.
- The default public UI does not expose prompt text, payload JSON, or standard Tarot reference images.
- `/api/readings/analyze` returns structured JSON when `LLM_API_KEY` is configured.
- `/api/site-counter` returns a persistent all-time count and the footer displays it.
- Static responses include the configured security headers and `/api/*` responses are not cached.
- `npm run smoke:production` exits successfully against the final public origin.
