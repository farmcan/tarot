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
| Persist local work plan | Done | `7e4f00e` | Added this checkpoint file and linked it from README. |
| Theme registry | Done | `Add Tarot theme registry` | Added `themes.ts` and wired App-level labels, links, questions, spreads, and theme metadata to the active theme. |
| Data model hardening | Done | `Harden Tarot reading data contracts` | Split reusable reading/spread contracts into `readingTypes.ts` and made base and themed readings share the same shape. |
| LLM integration design | Done | `Document LLM integration boundary` | Documented local draw first, proxy-owned provider keys, payload validation, and structured result direction. |
| UI reference pass | Done | `Improve MiaoTarot reading flow UI` | Added a Mantine progress flow, spread position preview, and reference notes from MiaoTI and Tarot UI research. |

## Active Checkpoint

| Step | Status | Scope | Expected Commit |
| --- | --- | --- | --- |
| Theme expansion path | Next | Add a minimal second demo theme or a theme template file to prove the foundation supports `xxxTarot`. | TBD |

## Next Checkpoints

| Order | Checkpoint | Goal | Likely Files | Validation |
| --- | --- | --- | --- | --- |
| 1 | Deployment polish | Confirm root redirect, static `v1/`, README usage, and GitHub Pages-ready behavior. | `index.html`, `v1/`, `README.md` | local static server smoke test |

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
