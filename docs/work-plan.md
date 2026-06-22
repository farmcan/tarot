# MiaoTarot Work Plan

Date: 2026-06-22

This file is the persistent local plan for the Tarot project. Keep it updated before and after each step so the project can continue safely even when conversation context gets long.

## Working Protocol

1. Keep this plan as the source of truth for active work.
2. Break work into small checkpoints that can be reviewed independently.
3. For each checkpoint:
   - update this file if the plan changes
   - implement the step
   - run the relevant check
   - commit
   - push to GitHub
4. Do not mix unrelated steps in one commit.
5. Keep `v1/` updated whenever the website build changes.

## Goal Mode

| Goal | Status | Outcome | First checkpoint | Validation |
| --- | --- | --- | --- | --- |
| Goal 1: Theme access | Done | Make registered `xxxTarot` themes visible and usable in the UI without rewriting the main MiaoTarot surface. | Add a Theme Lab tab for MiaoTarot and ShipTarot draws. | `npm run typecheck`, `npm run build`, browser smoke test |
| Goal 2: Structured LLM result | Done | Move from plain text model output toward a typed result that can render cards, actions, and share copy. | Update proxy contract and UI result renderer. | endpoint smoke test |
| Goal 3: Share poster polish | Active | Turn the current share-card export into a more complete MiaoTI-style poster with deployment URL and QR. | Add poster layout and QR once URL is final. | browser export smoke test |
| Goal 4: Theme routing | Later | Decide whether themes are routes, a switcher, or separate static builds. | Choose routing model after Theme Lab feedback. | browser route smoke test |
| Goal 5: Full deck expansion | Later | Decide whether selected themes should expand from Major Arcana to all 78 cards. | Prototype one theme with Minor Arcana coverage. | data coverage check |

## Completed Checkpoints

| Step | Status | Commit | Notes |
| --- | --- | --- | --- |
| Research GitHub Tarot projects | Done | `77c6f28` | Collected open-source Tarot references and homepage notes under `docs/`. |
| Build first MiaoTarot prototype | Done | `9ef7b84` | Added Mantine UI, cat meme Tarot experience, original hero image, LLM-ready panel, and static `v1/`. |
| Add reusable themed Tarot foundation | Done | `4342936` | Added `themedTarot.ts`, refactored MiaoTarot as the first theme adapter, and documented future `xxxTarot` workflow. |
| Persist local work plan | Done | `7e4f00e` | Added this checkpoint file and linked it from README. |
| Theme registry | Done | `Add Tarot theme registry` | Added `themes.ts` and wired App-level labels, links, questions, spreads, and theme metadata to the active theme. |
| Data model hardening | Done | `Harden Tarot reading data contracts` | Split reusable reading/spread contracts into `readingTypes.ts` and made base and themed readings share the same shape. |
| LLM integration design | Done | `Document LLM integration boundary` | Documented local draw first, proxy-owned provider keys, payload validation, and structured result direction. |
| UI reference pass | Done | `Improve MiaoTarot reading flow UI` | Added a Mantine progress flow, spread position preview, and reference notes from MiaoTI and Tarot UI research. |
| Theme expansion path | Done | `Add themed Tarot adapter helper` | Added `themeAdapter.ts` so future themes can get reading, synthesis, orientation, and LLM helpers from one deck config. |
| Deployment polish | Done | `Polish static deployment redirect` | Switched the root redirect to relative `./v1/` and verified static serving behavior. |
| Second theme | Done | `Add ShipTarot theme expansion` | Added `shipTarot.ts`, registered `shiptarot`, and documented the second theme proof. |
| Share-image export | Done | `Add MiaoTarot share image export` | Added `html-to-image` export, automatic PNG download, preview state, and documentation. |
| Production LLM proxy | Done | `Add Cloudflare LLM analysis proxy` | Added `/api/readings/analyze`, server-side provider env handling, and proxy-aware browser calls. |
| Goal 1: Theme access | Done | `Add Theme Lab UI access` | Added a Theme Lab tab that can select registered themes, draw with the shared adapter, and inspect payload/prompt output. |
| Goal 2: Structured LLM result | Done | `Render structured LLM results` | Added JSON result contracts, proxy parsing, browser parsing, and structured result cards/actions/share text. |
| Issue #1: LLM proxy prompt hardening | Done | `Harden LLM proxy prompt boundary` | Moved project proxy calls to payload-only requests, validated payload shape server-side, and rebuilt provider prompts inside the proxy. |
| Issue #2/#5: LLM endpoint production guardrails | Done | `Add LLM proxy guardrails and smoke test` | Added dynamic CORS, request size enforcement, per-IP rate limiting, optional Turnstile, provider token caps, and a deployment smoke script. |
| Issue #3: Bundle splitting | Done | `Split production bundles` | Dynamically imports `html-to-image` and splits React, Mantine, icons, Tarot data, and app code into separate production chunks. |
| Issue #4: Share poster polish | Done | `Add QR share poster` | Upgraded the share export into a poster layout with card summary, current URL, and QR code generated by `qrcode`. |

## Active Checkpoint

| Step | Status | Scope | Expected Commit |
| --- | --- | --- | --- |
| Theme routing | Next | Decide whether Theme Lab becomes routes, a switcher, or separate static builds. | TBD |

## Next Checkpoints

| Order | Checkpoint | Goal | Likely Files | Validation |
| --- | --- | --- | --- | --- |
| 1 | Share poster polish | Add QR code and long poster layout after public deployment URL is final. | `site/src/App.tsx`, `site/src/styles.css` | browser export smoke test |
| 2 | Theme routing | Decide whether Theme Lab becomes routes, a switcher, or separate static builds. | `site/src/App.tsx`, `site/src/domain/themes.ts` | browser route smoke test |

## Product Direction Notes

- MiaoTarot is the first product expression: Tarot structure plus cat meme emotional language.
- The reusable project direction is `xxxTarot`: a family of themed Tarot experiences using the same underlying deck, spread, reading, and LLM payload foundation.
- UI should continue to rely on strong existing libraries and reference patterns instead of custom primitives.
- The LLM should interpret a locally generated reading payload, not choose or mutate the draw.
- Future themes should start from `ThemedCard` and `ThemedDeckConfig`, then only add UI changes when the theme genuinely needs them.

## Open Decisions

| Topic | Current Lean | Decision Needed |
| --- | --- | --- |
| Multi-theme routing | Keep MiaoTarot as default, add registry before adding routes. | Whether future themes live under `/v1/<theme>/` or inside one theme switcher. |
| LLM proxy | Browser-side endpoint is only for prototyping. | Choose Cloudflare Worker, Vercel function, or another backend route. |
| Tarot scope | Major Arcana only for MiaoTarot v1. | Whether a future checkpoint expands to all 78 cards. |
| Visual assets | Use original generated assets or permissively licensed assets. | Whether each theme needs its own hero/share-card asset set. |
