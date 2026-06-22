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

## Completed Checkpoints

| Step | Status | Commit | Notes |
| --- | --- | --- | --- |
| Research GitHub Tarot projects | Done | `77c6f28` | Collected open-source Tarot references and homepage notes under `docs/`. |
| Build first MiaoTarot prototype | Done | `9ef7b84` | Added Mantine UI, cat meme Tarot experience, original hero image, LLM-ready panel, and static `v1/`. |
| Add reusable themed Tarot foundation | Done | `4342936` | Added `themedTarot.ts`, refactored MiaoTarot as the first theme adapter, and documented future `xxxTarot` workflow. |

## Active Checkpoint

| Step | Status | Scope | Expected Commit |
| --- | --- | --- | --- |
| Persist local work plan | In progress | Add this file and link it from README. | `Persist local Tarot work plan` |

## Next Checkpoints

| Order | Checkpoint | Goal | Likely Files | Validation |
| --- | --- | --- | --- | --- |
| 1 | Theme registry | Make theme metadata explicit so later `xxxTarot` ideas can be plugged in without rewriting app logic. | `site/src/domain/themes.ts`, `site/src/domain/miaoTarot.ts`, `site/src/App.tsx` | `npm run typecheck`, `npm run build` |
| 2 | Data model hardening | Separate reusable Tarot facts, spread definitions, theme cards, and reading output contracts more clearly. | `site/src/domain/*.ts`, `docs/theme-foundation.md` | `npm run typecheck` |
| 3 | LLM integration design | Decide the production boundary for LLM calls and document or scaffold an API proxy shape so browser API keys are not required. | `docs/llm-integration.md`, possible server scaffold | `npm run typecheck` if code changes |
| 4 | UI reference pass | Compare the current experience against existing Tarot sites and MiaoTI-style interaction patterns; improve layout, motion, empty states, and mobile polish. | `site/src/App.tsx`, `site/src/styles.css`, `docs/github-tarot-research.md` | `npm run build`, browser smoke test |
| 5 | Theme expansion path | Add a minimal second demo theme or a theme template file to prove the foundation supports `xxxTarot`. | `site/src/domain/*Tarot.ts`, `docs/theme-foundation.md` | `npm run typecheck`, `npm run build` |
| 6 | Deployment polish | Confirm root redirect, static `v1/`, README usage, and GitHub Pages-ready behavior. | `index.html`, `v1/`, `README.md` | local static server smoke test |

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
