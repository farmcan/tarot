# MiaoTarot

MiaoTarot is a research-driven Tarot site that uses Tarot as structure, cat meme archetypes as the emotional interface, and an LLM-ready payload for personalized interpretation.

## Site

This repo includes a MiaoTI-style Tarot website prototype:

- `site/`: Vite + React source
- `v1/`: built static snapshot
- `/`: redirects to `/v1/`, matching the publishing style used by `miaoti`

The UI uses Mantine components. Tarot data and drawing helpers are imported from `@cometpisces/tarot-kit` instead of hand-rolled from scratch. The first MiaoTarot deck maps 22 Major Arcana cards to original cat-meme archetypes, while the shared themed Tarot foundation can support later `xxxTarot` ideas.

## Docs

- [GitHub tarot research](docs/github-tarot-research.md)
- [Site implementation plan](docs/site-implementation-plan.md)
- [Themed Tarot foundation](docs/theme-foundation.md)
- [LLM integration design](docs/llm-integration.md)
- [Persistent work plan](docs/work-plan.md)

## Local Development

```bash
npm install
npm run dev
npm run build
```
