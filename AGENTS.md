# MiaoTarot repository instructions

## Git workflow

- Prefer working directly on `main`. Do not create or switch to another branch or add a worktree unless the user or task explicitly requests it, or isolation is genuinely required; when isolation is required, explain why before doing so.
- When the user asks to commit and push, finish the agreed implementation and validation, stage only files that belong to the task, commit with an intentional message, and push the current `main` branch. Never bundle unrelated working-tree changes into the commit.

## Execution and delivery

- For a multi-part or long-running request, turn the scope into a short checklist, work in verifiable slices, and keep going until every requested item is complete or a concrete blocker is reached. Report material progress, blockers, and revised timing instead of going silent.
- When a decision will trigger expensive or high-volume work, such as regenerating a full card set, first produce a small representative pilot and inspect it in the real product context. Scale up only after the pilot satisfies the same acceptance criteria as the final batch.
- When several UX directions are genuinely viable, make the tradeoff inspectable with a small prototype, screenshot comparison, or end-to-end demonstration, then recommend one using user-journey evidence. Do not begin a large rollout while the central interaction choice is still unresolved.
- Once the requirement and safe implementation path are clear, carry out reversible in-scope work without repeatedly asking for confirmation. Pause only for a decision with meaningful product, cost, security, or destructive consequences.

## Build and deployment artifacts

- `v1/` is generated Vite output, not source. It must remain ignored and untracked. Never stage or commit files under `v1/`, and never use an existing local `v1/` directory as evidence that a deployment contains the current source.
- Build the exact commit intended for production in a clean checkout or archive. Run `npm run build` immediately before `wrangler pages deploy v1`; do not deploy a directory produced before the final commit or from a dirty working tree.
- A Cloudflare Pages deployment marked `Success`, including its displayed Source SHA, only proves that Cloudflare accepted the uploaded directory. It does not prove that the directory was built from that SHA.
- After every production deployment, compare the asset filenames referenced by the production HTML with the just-built `v1/index.html`, then run the production smoke and end-to-end checks. Do not report deployment complete while either check disagrees.

## Engineering and reuse

- Prefer importing and composing existing solutions over building common functionality from scratch. Check the repository's current dependencies, utilities, components, and patterns first; then consider a mature, well-maintained package before writing a custom implementation.
- Do not add a dependency blindly. Evaluate maintenance status, license, security, bundle-size and performance cost, mobile compatibility, and whether the dependency is proportionate to the problem. Build locally only when existing options are unsuitable, and record the reason when the choice is non-obvious.
- Preserve established repository conventions and extend existing abstractions where practical. Avoid introducing a parallel component, helper, or data model that duplicates one already present.

## Product and user psychology

- Do not treat a feature request as only an implementation task. Before making a meaningful product or UX change, identify the user's likely intent, emotional state, anxieties, expectations, and reason to return, then let those findings shape the interaction and copy.
- Optimize for clarity, trust, emotional resonance, and a satisfying sense of progress. Tarot experiences should feel personal and engaging without making deceptive claims, exploiting vulnerable users, or using manipulative dark patterns.
- Consider the complete user journey: discovery, first impression, first successful reading, interpretation, sharing or saving, return visits, and any payment decision. Make important actions obvious and reduce friction at moments where users may hesitate or lose trust.
- When requirements are vague, form and state a product hypothesis instead of implementing mechanically. Use repository evidence, user behavior, and relevant market research to resolve ambiguity where possible.
- Protect the core reading loop. Drawing, revealing, and receiving a useful baseline interpretation must remain available when AI, analytics, sharing, or payment services are unavailable.
- Preserve completion moments: do not automatically move away before the user can see the final reveal or result. Let the user control the transition to summaries, follow-up actions, sharing, or another reading.
- Keep creator-support and payment prompts discoverable but downstream of delivered value, low-pressure, and separate from the accuracy or quality of a reading.

## New feature development

- Before implementing a new feature, state the user problem and product hypothesis: who needs it, when they encounter the problem, what useful outcome they expect, and how success will be recognized. Use this framing to choose the interaction and copy rather than translating the request directly into UI.
- Build the complete user journey, not only an isolated screen or control. Cover how users discover and enter the feature, understand the next action, receive feedback, recover from mistakes, cancel or go back, reach a useful result, and know what they can do next.
- Treat visual and interaction quality as part of correctness. Design mobile-first, make the primary action understandable without knowledge of the implementation, provide a low-friction path for impatient or uncertain users where appropriate, and do not consider the feature complete until its realistic end-to-end journey and key visual states have been inspected under the validation rules below.

## Testing and validation

- Treat mobile as the primary experience. Every new feature or material change that affects user-visible behavior or interaction must add or update an end-to-end test covering the changed critical path. If an end-to-end test is genuinely impractical, explain why and document the closest reliable validation performed.
- Validate from the user's point of view rather than only checking implementation details. Start from a realistic entry point, use the controls and feedback a user can actually see, and confirm that the next action is understandable, progress feels responsive, mistakes are recoverable, and the journey reaches a useful outcome.
- Exercise the real critical path from entry to completion, including navigation, scrolling, card interactions, overlays, browser back behavior, loading and error states, slow or unstable networks, and persistence across refreshes where relevant.
- Test at least one narrow mobile viewport and one representative modern phone viewport with touch-oriented interactions. Check tap-target size, text readability, safe-area behavior, responsive cropping, keyboard behavior, horizontal overflow, layout stability, and perceived performance.
- Treat the currently interpreted Tarot card as the primary visual object on mobile. Do not place its full face beside explanatory copy in a narrow split layout; give it a dedicated full-width row, keep every printed label inside the rendered frame, and verify that sticky navigation or card rails do not cover it. For card-facing changes, assert the rendered card width and inspect the frame interior for clipped or overflowing titles, numbers, and keywords at both required mobile viewports.
- For user-facing visual or interaction changes, capture and inspect screenshots at the key states of the journey on mobile. Include at least the state introduced or changed and, when comparison is useful, the relevant before/after or adjacent state. Keep stable screenshots as visual-regression fixtures when the test suite supports them, and include the screenshot paths or previews in the final handoff.
- Use lower-level automated tests where they provide fast, stable coverage, but do not use them as a substitute for a realistic mobile end-to-end check of the changed user journey.
- For gesture-heavy card surfaces, explicitly verify that taps, drags, swipes, and card selection do not capture ordinary page scrolling or browser navigation unexpectedly.

## Product research and learning

- For meaningful changes to gameplay, retention, acquisition, sharing, or monetization, research successful comparable Tarot, divination, casual, and ritual-style products before settling on a solution. Prioritize products with credible evidence of substantial traffic, revenue, retention, or sustained popularity.
- Investigate why those products work: their core loop, time-to-value, onboarding, content depth, personalization, daily habit, progression, social or sharing mechanics, distribution and SEO, monetization model, pricing, trust signals, performance, and visual or emotional appeal.
- Prefer current, primary, or otherwise credible sources. Separate verified facts from inference, note the date and source of important evidence, and translate findings into testable hypotheses for MiaoTarot rather than copying competitors blindly.
- Keep research proportional to the decision. Small maintenance changes do not require a market study; high-impact or difficult-to-reverse product choices should be supported by deeper investigation and explicit tradeoffs.

## Documentation and decisions

- Update the smallest relevant canonical document instead of creating a one-off note for every discussion. Keep durable decisions, rejected alternatives, and deferred ideas visibly distinct so future work does not mistake a proposal for an accepted requirement.
- When a conversation establishes a reusable constraint, encode it in `AGENTS.md` or the relevant contract document. Keep session-specific status, temporary experiments, and unverified ideas in session notes rather than global instructions.

## Image generation contract

- Read `docs/image-generation-contract.md` before generating, editing, replacing, or validating card art.
- New and regenerated card masters must be portrait `5:7`, with `1020x1428` pixels as the preferred working size.
- When an image tool exposes aspect-ratio, canvas, width, or height controls, set them explicitly. Prompt wording alone is not a substitute for the tool parameter.
- Request a native portrait composition. Do not generate a square image and then crop, stretch, or outpaint it as the normal workflow.
- Card art must be full-bleed and must not contain a printed card border, title, letters, numbers, watermark, or logo. The website supplies the outer card frame and labels.
- Keep the main cat, face, paws, and essential Tarot symbols inside the central safe area so a small responsive crop cannot remove them.
- Existing `1254x1254` masters are legacy assets and may remain until they are intentionally regenerated. Never use them as the format precedent for new art.
- Save approved PNG masters to the `outputPath` in the exported prompt record, then run the matching optimization and verification commands documented in `docs/image-generation-contract.md`.
- For reference-driven art, prefer the best lawful original source over an already AI-regenerated derivative. Preserve recognizable meme identity where it is intentional, but use established Tarot symbolism and meaning as the semantic source of truth; cat traits may enrich the concept only when they do not distort it.
- Before batch generation, approve a representative sample for native `5:7` composition, safe-area behavior, Tarot readability, meme recognizability, and appearance inside the actual mobile card frame.
