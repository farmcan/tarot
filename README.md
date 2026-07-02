# MiaoTarot

MiaoTarot is a research-driven Tarot site that uses Tarot as structure, cat meme archetypes as the emotional interface, and an LLM-ready payload for personalized interpretation.

## Site

This repo includes a MiaoTI-style Tarot website prototype:

- `site/`: Vite + React source
- `shared/`: browser, Pages Functions, and scripts share small runtime contracts
- `v1/`: built static snapshot
- Cloudflare Pages serves `v1/` as the site root, so the deployed `/` loads the app
- The repository root `index.html` redirects to `./v1/` for local static browsing, matching the publishing style used by `miaoti`
- `/miao/` and `/v1/miao/`: stable aliases for the MiaoTarot experience on Cloudflare Pages

The UI uses Mantine components. Tarot data and drawing helpers are imported from `@cometpisces/tarot-kit` instead of hand-rolled from scratch. The first MiaoTarot deck maps 22 Major Arcana cards to original cat-meme archetypes, while the shared themed Tarot foundation can support later `xxxTarot` ideas.

The repository root redirect uses a relative `./v1/` target so it works both at a domain root and under a GitHub Pages project path. Cloudflare Pages uses `v1/` as `pages_build_output_dir`, so the deployed site does not need that redirect to load the app.

## Docs

- [GitHub tarot research](docs/github-tarot-research.md)
- [Site implementation plan](docs/site-implementation-plan.md)
- [Themed Tarot foundation](docs/theme-foundation.md)
- [LLM integration design](docs/llm-integration.md)
- [UI reference pass](docs/ui-reference-pass.md)
- [Theme expansion checkpoint](docs/theme-expansion.md)
- [Share image export](docs/share-image-export.md)
- [Product strategy](docs/product-strategy.md)
- [Content launch plan](docs/content-launch-plan.md)
- [Meme-base generation plan](docs/miao-meme-base-generation-plan.md)
- [Launch runbook](docs/launch-runbook.md)
- [Persistent work plan](docs/work-plan.md)

## Local Development

```bash
npm install
npm run dev
npm run build
npm run verify:content
```

To prepare meme-base references and export image-generation prompts:

```bash
npm run prepare:meme-bases
npm run export:art-prompts
npm run review:art-sheets
```

For the full local launch gate, run:

```bash
npm run verify:launch
npm run smoke:llm:local
```

`verify:launch` also starts a local Cloudflare Pages Dev server and checks route aliases, response headers, one generated Miao card image, and the unconfigured `/api/readings/analyze` boundary.

## Cloudflare Pages

The current deploy target is Cloudflare Pages:

- Static output: `v1/`
- Pages Functions: `functions/`
- Config: `wrangler.jsonc`
- Route aliases and response headers: `site/public/_redirects`, `site/public/_headers`

```bash
npm run pages:dev
npm run deploy
```

`deploy` runs the full local launch gate before uploading `v1/` and `functions/`.

For LLM analysis, keep provider secrets server-side:

```bash
npm run secret:llm
```

For local Pages Functions testing with a real provider, copy `.dev.vars.example` to `.dev.vars` and set `LLM_API_KEY`. For a keyless local provider smoke test, run `npm run smoke:llm:local`.

## Deployment Smoke Test

After deploying `/api/readings/analyze` with server-side LLM env vars:

```bash
TAROT_LLM_ENDPOINT="https://your-domain.example/api/readings/analyze" npm run smoke:llm
```

The smoke test requires a non-empty model response and a valid structured JSON result matching the MiaoTarot contract.
