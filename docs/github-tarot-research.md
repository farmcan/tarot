# GitHub Tarot Research

Date: 2026-06-22

This note summarizes open-source and popular Tarot-related projects found on GitHub, with a focus on how they are built, whether they have public homepages, and what is worth referencing for our own product direction.

## Quick Takeaways

- The hottest Tarot repo in this scan is not a pure Tarot app. It is an AI divination product that includes Tarot alongside other fortune-telling flows.
- The most reusable foundation is still simple: a 78-card dataset, card metadata, random draw logic, spread definitions, upright/reversed meanings, and a clean presentation layer.
- The current practical pattern is `question + spread + cards + positions + upright/reversed state -> structured prompt -> AI reading`.
- Homepages matter. The more useful projects usually expose either a live demo, hosted API docs, or a deployable one-click app.
- License status is uneven. Many popular repos do not expose a detected license in GitHub metadata, so treat them as reference-only unless a repo-level license file is confirmed.

## Notable Repositories

| Repo | Stars | Type | Homepage | License Signal | What It Mainly Does |
| --- | ---: | --- | --- | --- | --- |
| [dreamhunter2333/chatgpt-tarot-divination](https://github.com/dreamhunter2333/chatgpt-tarot-divination) | 812 | AI divination web app | [divination.app.awsl.uk](https://divination.app.awsl.uk/) | README says MIT; GitHub search did not detect SPDX consistently | AI-powered divination app with Tarot, BaZi, dream interpretation, naming, Mei Hua Yi Shu, streaming output, history, responsive UI, Docker/Vercel deployment. |
| [ekelen/tarot-api](https://github.com/ekelen/tarot-api) | 391 | REST API / dataset | [tarotapi.dev](https://tarotapi.dev) | No SPDX detected | Rider-Waite-Smith card API with all cards, card lookup, search, random draw, OpenAPI/Swagger docs, and a JSON data source. |
| [hhszzzz/taibu](https://github.com/hhszzzz/taibu) | 258 | AI fortune product / MCP | [mingai.fun](https://mingai.fun) | No SPDX detected | A broad Chinese AI divination platform covering Tarot plus BaZi, Zi Wei, Liu Yao, astrology, MBTI, face/palm reading, records, MCP server, mobile clients. |
| [Brhiza/mingyu](https://github.com/Brhiza/mingyu) | 135 | Structured prompts / API / MCP | [aov.cc](https://aov.cc) | No SPDX detected | Produces structured divination data and prompts. Tarot is one module among BaZi, Zi Wei, astrology, Liu Yao, Mei Hua, Qimen, Lenormand, and public API/MCP/skill surfaces. |
| [uxiaohan/Tarot-Web](https://github.com/uxiaohan/Tarot-Web) | 106 | Lightweight web app | [tarot.4ce.cn](https://tarot.4ce.cn) | No SPDX detected | Simple Vue-style web Tarot assistant, focused on 22 major arcana and AI-flavored interpretation, easy Cloudflare Pages deployment. |
| [MinatoAquaCrews/nonebot_plugin_tarot](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot) | 104 | Chatbot plugin | None found | No SPDX detected | NoneBot2 plugin for Tarot divination in chat contexts. Useful as a reference for command-based interaction and lightweight social usage. |
| [lawreka/ascii-tarot](https://github.com/lawreka/ascii-tarot) | 114 | CLI / terminal | [npm package](https://www.npmjs.com/package/ascii-tarot) | Conflicting metadata; confirm before reuse | CLI Tarot reading with ASCII card art. Useful for terminal interaction and compact reading flows. |
| [metabismuth/tarot-json](https://github.com/metabismuth/tarot-json) | 73 | Dataset / card scans | None found | README says MIT | JSON Tarot dataset plus RWS image references. README notes US public-domain status but EU uncertainty for Rider-Waite-Smith imagery. |
| [abetusk/ResonatorVoyantTarot](https://github.com/abetusk/ResonatorVoyantTarot) | 70 | Generative art | [GitHub Pages demo](https://abetusk.github.io/ResonatorVoyantTarot) | No SPDX detected in GitHub metadata | Experimental generative Tarot cards. Useful for thinking about custom visual identity instead of reusing classic card images. |
| [LindseyB/tarot-api](https://github.com/LindseyB/tarot-api) | 65 | REST API | [tarot-api.com](https://tarot-api.com) | No SPDX detected | Simple Ruby/Sinatra Tarot API. Good comparison point against `ekelen/tarot-api`. |
| [msull/emilytarot](https://github.com/msull/emilytarot) | 39 | AI reading app | [emilytarot.com](https://emilytarot.com) | README says MIT | Streamlit + OpenAI Tarot reading experiment with card selection, user questions, session persistence, moderation, and Docker support. |
| [MarketingPipeline/Tarot.js](https://github.com/MarketingPipeline/Tarot.js) | 27 | JS library | [live demo](https://marketingpipeline.github.io/Tarot.js/) | README says MIT | Library for deck management, shuffling, custom spreads, readings, current spread tracking, and custom deck data. |
| [vanloc1808/arcana-ai](https://github.com/vanloc1808/arcana-ai) | 23 | AI platform | [arcanaai.nguyenvanloc.com](https://arcanaai.nguyenvanloc.com) | No SPDX detected | AI Tarot platform with interactive readings, AI chat, multiple decks, and user management. More product-shaped than library-shaped. |
| [cesque/tarot](https://github.com/cesque/tarot) | 20 | Minimal web reading viewer | [hierophant.app](https://hierophant.app) | No SPDX detected | Minimal Tarot reading site. Useful for reducing UI friction and keeping the first screen focused. |

Star counts and metadata were gathered with GitHub search/API and `gh repo view` on 2026-06-22.

## How These Projects Usually Work

### 1. Data-First Tarot APIs

Representative projects:

- [ekelen/tarot-api](https://github.com/ekelen/tarot-api)
- [LindseyB/tarot-api](https://github.com/LindseyB/tarot-api)
- [metabismuth/tarot-json](https://github.com/metabismuth/tarot-json)

Common pattern:

- Store all 78 cards as JSON.
- Include card identifiers, suit/arcana, upright meanings, reversed meanings, keywords, and sometimes image URLs.
- Expose endpoints or local helpers for all cards, search, single-card lookup, and random draw.
- Keep the UI/application layer separate from the Tarot data.

What we can reference directly:

- API shape: `GET all cards`, `GET card by id`, `GET random cards`, `search by meaning`.
- Data model: card id, name, arcana, suit, rank, keywords, upright meaning, reversed meaning, image reference.
- OpenAPI/Swagger-style documentation for a future public API.

What to be careful with:

- Do not copy datasets or images from repos without confirming their license.
- Rider-Waite-Smith imagery has jurisdiction-specific copyright questions; if we want global distribution, custom-generated or commissioned art is cleaner.

### 2. AI Tarot Reading Apps

Representative projects:

- [dreamhunter2333/chatgpt-tarot-divination](https://github.com/dreamhunter2333/chatgpt-tarot-divination)
- [msull/emilytarot](https://github.com/msull/emilytarot)
- [vanloc1808/arcana-ai](https://github.com/vanloc1808/arcana-ai)

Common pattern:

- User enters a question or chooses a topic.
- App draws cards or lets the user choose cards.
- The selected cards, spread positions, upright/reversed states, and user question are converted into a prompt.
- LLM returns a personalized reading, often with streaming output.
- More productized apps add history, user accounts, moderation, deployment templates, and multiple divination systems.

What we can reference directly:

- Streaming reading output.
- Session history and saved readings.
- A prompt contract that passes structured card data to the model.
- Safety/moderation around crisis, medical, legal, and financial advice.
- One-click deployment as a growth loop.

### 3. Structured Prompt / MCP Divination Platforms

Representative projects:

- [hhszzzz/taibu](https://github.com/hhszzzz/taibu)
- [Brhiza/mingyu](https://github.com/Brhiza/mingyu)

Common pattern:

- Tarot is one tool inside a larger divination suite.
- Each system returns both machine-readable data and a human-readable prompt.
- Public API, MCP server, and skill-like docs make the engine reusable by AI clients.
- The product value is not only the UI; it is the reusable divination engine.

What we can reference directly:

- Split `engine`, `prompt`, `UI`, and `API` layers early.
- Treat Tarot spreads as typed tool calls.
- Return both raw result data and model-ready prompt text.
- Design for future MCP/API exposure even if the first release is a web app.

### 4. Lightweight Web / CLI / Bot Experiences

Representative projects:

- [uxiaohan/Tarot-Web](https://github.com/uxiaohan/Tarot-Web)
- [MinatoAquaCrews/nonebot_plugin_tarot](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot)
- [lawreka/ascii-tarot](https://github.com/lawreka/ascii-tarot)
- [cesque/tarot](https://github.com/cesque/tarot)

Common pattern:

- Keep the reading flow short.
- Optimize for one action: ask, draw, reveal, interpret.
- Use a simple deployment target, such as static hosting, Cloudflare Pages, npm, or a bot plugin runtime.
- Reduce onboarding friction.

What we can reference directly:

- A first-screen experience that starts at the reading, not a landing page.
- Shareable reading results.
- Bot commands for social and community usage.
- CLI or text-mode fallback for dev tools and testing.

### 5. Visual Identity / Card Art

Representative projects:

- [abetusk/ResonatorVoyantTarot](https://github.com/abetusk/ResonatorVoyantTarot)
- [metabismuth/tarot-json](https://github.com/metabismuth/tarot-json)

Common pattern:

- Either use public-domain/classic Rider-Waite-Smith references or generate custom cards.
- Card art is a major differentiator, not just decoration.

What we can reference directly:

- Separate card metadata from image assets.
- Start with placeholder card backs and metadata, then upgrade art later.
- Consider custom generated card styles to avoid being another RWS clone.

## Recommended Direction For This Repo

### Build The Core As Data + Engine

Start with a small, explicit domain model:

- `Card`: id, name, arcana, suit, rank, keywords, upright meaning, reversed meaning, element, astrology correspondence, numerology.
- `Spread`: id, name, positions, description, required card count.
- `Draw`: card id, position id, orientation, timestamp, randomness seed if reproducibility matters.
- `ReadingRequest`: question, topic, spread id, language, tone.
- `ReadingResult`: drawn cards, structured interpretation, summary, advice, caveats.

### MVP Reading Flow

1. Ask a question.
2. Choose a spread: single card, three-card, choice, relationship, Celtic cross.
3. Draw cards with upright/reversed orientation.
4. Show cards and position meanings.
5. Generate a structured AI reading.
6. Save/share the result.

### Referenceable Feature Set

High confidence:

- 78-card deck data.
- 5 to 9 spreads.
- Upright/reversed support.
- Structured prompt output.
- Streaming AI answer.
- Reading history.
- Responsive web UI.

Later:

- MCP server.
- Public API.
- Multiple decks.
- Custom card art.
- Community reading gallery.
- Bot integration.

## License Notes

- A GitHub repo being public does not mean its code, copy, or assets are reusable.
- When GitHub reports `NOASSERTION`, assume reference-only until a license file is checked.
- MIT-licensed code and docs can usually be reused with attribution and license preservation.
- CC0/public-domain assets are easier, but Tarot imagery can still have jurisdiction-specific issues.
- For a commercial or globally deployed product, custom card art is the least ambiguous path.

## Source Links

- [GitHub search: tarot sorted by stars](https://github.com/search?q=tarot&type=repositories&s=stars&o=desc)
- [GitHub search: tarot api sorted by stars](https://github.com/search?q=tarot+api&type=repositories&s=stars&o=desc)
- [GitHub search: tarot cards sorted by stars](https://github.com/search?q=tarot+cards&type=repositories&s=stars&o=desc)
- [dreamhunter2333/chatgpt-tarot-divination](https://github.com/dreamhunter2333/chatgpt-tarot-divination)
- [ekelen/tarot-api](https://github.com/ekelen/tarot-api)
- [hhszzzz/taibu](https://github.com/hhszzzz/taibu)
- [Brhiza/mingyu](https://github.com/Brhiza/mingyu)
- [uxiaohan/Tarot-Web](https://github.com/uxiaohan/Tarot-Web)
- [MinatoAquaCrews/nonebot_plugin_tarot](https://github.com/MinatoAquaCrews/nonebot_plugin_tarot)
- [lawreka/ascii-tarot](https://github.com/lawreka/ascii-tarot)
- [metabismuth/tarot-json](https://github.com/metabismuth/tarot-json)
- [abetusk/ResonatorVoyantTarot](https://github.com/abetusk/ResonatorVoyantTarot)
- [LindseyB/tarot-api](https://github.com/LindseyB/tarot-api)
- [msull/emilytarot](https://github.com/msull/emilytarot)
- [MarketingPipeline/Tarot.js](https://github.com/MarketingPipeline/Tarot.js)
- [vanloc1808/arcana-ai](https://github.com/vanloc1808/arcana-ai)
- [cesque/tarot](https://github.com/cesque/tarot)

