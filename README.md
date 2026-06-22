# Tarot Research

Tarot research notes for open-source Tarot projects, implementation patterns, and reusable references.

## Site

This repo now includes a research-driven Tarot website prototype:

- `site/`: Vite + React source
- `v1/`: built static snapshot
- `/`: redirects to `/v1/`, matching the publishing style used by `miaoti`

The UI uses Mantine components. Tarot data and drawing helpers are imported from `@cometpisces/tarot-kit` instead of hand-rolled from scratch.

## Docs

- [GitHub tarot research](docs/github-tarot-research.md)
- [Site implementation plan](docs/site-implementation-plan.md)

## Local Development

```bash
npm install
npm run dev
npm run build
```
