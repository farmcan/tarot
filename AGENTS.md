# MiaoTarot repository instructions

## Git workflow

- Prefer working directly on `main`. Do not create or switch to another branch or add a worktree unless the user or task explicitly requests it, or isolation is genuinely required; when isolation is required, explain why before doing so.

## Engineering and reuse

- Prefer importing and composing existing solutions over building common functionality from scratch. Check the repository's current dependencies, utilities, components, and patterns first; then consider a mature, well-maintained package before writing a custom implementation.
- Do not add a dependency blindly. Evaluate maintenance status, license, security, bundle-size and performance cost, mobile compatibility, and whether the dependency is proportionate to the problem. Build locally only when existing options are unsuitable, and record the reason when the choice is non-obvious.
- Preserve established repository conventions and extend existing abstractions where practical. Avoid introducing a parallel component, helper, or data model that duplicates one already present.

## Product and user psychology

- Do not treat a feature request as only an implementation task. Before making a meaningful product or UX change, identify the user's likely intent, emotional state, anxieties, expectations, and reason to return, then let those findings shape the interaction and copy.
- Optimize for clarity, trust, emotional resonance, and a satisfying sense of progress. Tarot experiences should feel personal and engaging without making deceptive claims, exploiting vulnerable users, or using manipulative dark patterns.
- Consider the complete user journey: discovery, first impression, first successful reading, interpretation, sharing or saving, return visits, and any payment decision. Make important actions obvious and reduce friction at moments where users may hesitate or lose trust.
- When requirements are vague, form and state a product hypothesis instead of implementing mechanically. Use repository evidence, user behavior, and relevant market research to resolve ambiguity where possible.

## Testing and validation

- Treat mobile as the primary experience. For user-facing changes, prefer end-to-end validation in a phone-sized viewport with touch-oriented interactions over relying only on unit tests or desktop checks.
- Exercise the real critical path from entry to completion, including navigation, scrolling, card interactions, overlays, browser back behavior, loading and error states, slow or unstable networks, and persistence across refreshes where relevant.
- Test at least one narrow mobile viewport and one representative modern phone viewport. Check tap-target size, text readability, safe-area behavior, responsive cropping, keyboard behavior, layout stability, and perceived performance.
- Use lower-level automated tests where they provide fast, stable coverage, but do not use them as a substitute for a realistic mobile end-to-end check of the changed user journey.

## Product research and learning

- For meaningful changes to gameplay, retention, acquisition, sharing, or monetization, research successful comparable Tarot, divination, casual, and ritual-style products before settling on a solution. Prioritize products with credible evidence of substantial traffic, revenue, retention, or sustained popularity.
- Investigate why those products work: their core loop, time-to-value, onboarding, content depth, personalization, daily habit, progression, social or sharing mechanics, distribution and SEO, monetization model, pricing, trust signals, performance, and visual or emotional appeal.
- Prefer current, primary, or otherwise credible sources. Separate verified facts from inference, note the date and source of important evidence, and translate findings into testable hypotheses for MiaoTarot rather than copying competitors blindly.
- Keep research proportional to the decision. Small maintenance changes do not require a market study; high-impact or difficult-to-reverse product choices should be supported by deeper investigation and explicit tradeoffs.

## Image generation contract

- Read `docs/image-generation-contract.md` before generating, editing, replacing, or validating card art.
- New and regenerated card masters must be portrait `5:7`, with `1020x1428` pixels as the preferred working size.
- When an image tool exposes aspect-ratio, canvas, width, or height controls, set them explicitly. Prompt wording alone is not a substitute for the tool parameter.
- Request a native portrait composition. Do not generate a square image and then crop, stretch, or outpaint it as the normal workflow.
- Card art must be full-bleed and must not contain a printed card border, title, letters, numbers, watermark, or logo. The website supplies the outer card frame and labels.
- Keep the main cat, face, paws, and essential Tarot symbols inside the central safe area so a small responsive crop cannot remove them.
- Existing `1254x1254` masters are legacy assets and may remain until they are intentionally regenerated. Never use them as the format precedent for new art.
- Save approved PNG masters to the `outputPath` in the exported prompt record, then run the matching optimization and verification commands documented in `docs/image-generation-contract.md`.
