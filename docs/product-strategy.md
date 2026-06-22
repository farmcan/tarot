# MiaoTarot Product Strategy

Date: 2026-06-23

This note revisits the Tarot research after the first implementation pass. It answers: where can this product go, what is differentiated, and what would make it spread.

## Short Answer

MiaoTarot should not compete as another generic AI Tarot reader. That space is already crowded, and the obvious feature list is easy to copy: draw cards, explain them with AI, save history, ask follow-up questions, and upsell subscriptions.

The stronger path is:

1. Use MiaoTarot as a viral emotional toy: `把你现在的精神状态，翻译成一只猫。`
2. Turn the result into a daily ritual: a low-pressure check-in, not a prediction.
3. Use the reusable engine to expand into `xxxTarot`: MiaoTarot, ShipTarot, WorkTarot, LoveTarot, FounderTarot, DoomscrollTarot, etc.
4. Let each theme produce highly shareable posters, short captions, and follow-up prompts.

The product should feel less like a fortune-telling utility and more like Co-Star's voice plus TikTok's serendipity plus MiaoTI's cat meme world, with Tarot as the structure underneath.

## What The Market Already Has

### 1. Serious learning and journaling

Labyrinthos positions Tarot as learning, card meanings, journaling, and self-discovery. Its App Store copy emphasizes daily wisdom, learning card meanings, journaling readings, and using Tarot to shape a future aligned with values.

Implication: we should not try to win by being the most complete Tarot encyclopedia first. Labyrinthos is already strong there.

### 2. AI reading chat and memory

AI Tarot apps already sell the obvious AI layer: six-card readings, saved history, follow-up chat, memory, reminders, share links, and paid subscriptions.

Implication: `AI explains my spread` is table stakes. The LLM is infrastructure, not the product identity.

### 3. Human experts and paid readings

Sanctuary's positioning is trusted experts, psychic readers, tarot readers, astrologers, and on-demand clarity. It competes on human trust and paid service quality.

Implication: do not start with a marketplace or human expert network. That is operationally heavy and trust-sensitive.

### 4. Astrology identity and relationship graphs

The Pattern and Co-Star show that people return when the product feels deeply personal, social, and conversational. The Pattern says it helps users understand themselves and relationships without complicated astrology language. Co-Star's appeal came from personalized insights, push notifications, compatibility, and a raw voice that feels like a friend.

Implication: the most valuable layer is not the card database; it is a repeatable identity/social loop.

### 5. TikTok tarot as algorithmic serendipity

TikTok's Creative Center shows #tarot as a massive hashtag. Articles about TarotTok repeatedly point to the same mechanism: short, general readings feel personally selected because the algorithm delivered them. This creates reach, but also distrust: generic ex/abundance readings and scam concerns are common.

Implication: the opportunity is to keep the serendipity and shareability, but make the reading explicitly personal, transparent, and non-exploitative.

## Our Differentiation

### Core Positioning

MiaoTarot is not `AI predicts your future`.

MiaoTarot is:

> A meme-native self-reflection toy that translates your current emotional state into a Tarot-backed cat archetype.

This matters because `prediction` is crowded, risky, and ethically fragile. `Translation` is safer, funnier, and more shareable.

### Differentiators We Can Defend

| Differentiator | Why It Matters | Product Expression |
| --- | --- | --- |
| Cat meme emotional interface | People share identities and moods more readily than fortune claims. | `今天是哪只猫？`, poster cards, short captions, reaction-style copy. |
| Tarot as structure, not authority | Gives enough symbolic depth without making dangerous claims. | Local draw first, structured payload, non-fatalistic language. |
| Themed `xxxTarot` engine | Lets us test many hooks without rebuilding the product. | MiaoTarot, ShipTarot, WorkTarot, LoveTarot, FounderTarot. |
| Share-first output | Growth can happen through image/poster loops instead of paid acquisition. | QR poster, one-line result, card trio summary. |
| Transparent AI boundary | Trust signal against scammy TarotTok / black-box AI readers. | Show payload/prompt, explain `not prediction`, keep safety rules. |
| MiaoTI universe | Gives the product a cultural/aesthetic home instead of generic mysticism. | Cat meme tone, compact UI, static `v1` publishing, playful product copy. |

## How It Can Become Popular

### 1. Lead With A One-Sentence Hook

The strongest hook is already present:

> 把你现在的精神状态，翻译成一只猫。

This is better than `free AI tarot reading` because it creates curiosity and self-recognition. The user is not asking `will my ex come back?`; they are asking `which version of me is running the show today?`

Good viral prompts:

- `今天是哪只猫在提醒你？`
- `你现在不是焦虑，你是倒挂沙发猫。`
- `抽到这张猫牌的人，今天先别硬冲。`
- `把你这段关系翻译成三只猫。`
- `把你的项目状态翻译成一张推进牌。`

### 2. Optimize For Share Rate Before Retention

The first growth metric should be share rate, not paid conversion.

Target actions:

- complete reading
- generate poster
- copy caption
- share QR image
- click through from a shared poster

The current QR poster is the right primitive. Next, make the poster more recognizable and easier to post as a vertical story image.

### 3. Build Daily Ritual After The Toy Works

After people share the first result, retention should come from a daily card ritual:

- `今日猫牌`
- streak-free, low-pressure check-in
- 1 tiny action
- save to local history
- optional reminder later

Do not overbuild accounts early. Local history plus shareable images is enough until there is pull.

### 4. Make Relationship And Group Modes Social

Astrology apps spread because compatibility creates conversation. MiaoTarot can do a lighter version without needing birth data:

- `我和 TA 现在是哪两只猫？`
- `这段关系里的第三只猫是什么？`
- `团队今天是哪种推进牌？`
- `朋友局抽三张：谁是倒挂沙发猫？`

This creates natural sharing because the result is about more than one person.

### 5. Turn `xxxTarot` Into A Theme Lab For Hooks

The best strategic asset in the codebase is not MiaoTarot alone. It is the themed Tarot foundation.

We should use it like a growth lab:

1. Launch MiaoTarot as the flagship.
2. Test ShipTarot for builders/founders.
3. Add one new theme only when it has a clear audience and share sentence.
4. Track poster generation and return usage per theme.
5. Promote winners into routes or standalone pages.

Theme ideas worth testing:

| Theme | Audience | Hook |
| --- | --- | --- |
| MiaoTarot | broad internet / cat meme people | `你的精神状态是哪只猫？` |
| ShipTarot | builders, indie hackers, PMs | `你的项目现在是哪张推进牌？` |
| LoveTarot | relationship content audience | `这段关系里，你们是哪两张牌？` |
| WorkTarot | office / career audience | `今天上班是哪张工位牌？` |
| DoomscrollTarot | social media fatigue | `你刷到现在，是哪种精神耗电？` |
| FounderTarot | startup audience | `你这周的创业状态是哪张牌？` |

## Product Roadmap Recommendation

### Phase 1: Viral Toy

Goal: make first-time users finish and share.

Build next:

- canonical deployed URL
- vertical poster format for story/social sharing
- one-tap copy for caption and link
- direct route for MiaoTarot, e.g. `/v1/miao/`
- default daily single-card path before complex spreads

Key metric: poster generation / completed reading.

### Phase 2: Daily Ritual

Goal: make users come back without needing a heavy account system.

Build next:

- daily card state stored locally
- recent reading timeline
- `what changed since last reading?` LLM follow-up
- morning/evening reminder copy, not push notifications yet

Key metric: 1-day and 7-day repeat visits.

### Phase 3: Social Modes

Goal: make the product conversational.

Build next:

- relationship spread with two-person framing
- group/team spread for ShipTarot
- compare two readings
- share poster with `send this to someone` copy

Key metric: inbound visits from shared posters.

### Phase 4: Theme Platform

Goal: find which `xxxTarot` themes deserve full product surfaces.

Build next:

- theme routes
- theme-specific hero/share poster skins
- analytics by theme
- simple admin/data file for adding themes

Key metric: completion/share/return rate by theme.

## What Not To Do Yet

- Do not build a full paid marketplace of human readers.
- Do not chase all divination systems immediately; broad suites already exist.
- Do not lead with `AI Tarot` as the brand; it sounds generic.
- Do not make scary predictions, ex-coming-back bait, curse content, or crisis advice.
- Do not require signup before the first share loop proves itself.

## Strategic Bet

The winning bet is:

> Use Tarot's symbolic structure to generate emotionally accurate, meme-native self-recognition moments that people want to share.

If MiaoTarot works, it becomes the first proof of a broader product line: not one Tarot site, but an engine for culturally specific `xxxTarot` experiences.

## Next Concrete Checkpoints

1. Deploy to a public URL and run `npm run smoke:llm` against the real endpoint.
2. Add a vertical story poster mode with the public URL and QR.
3. Add `/v1/miao/` and `/v1/ship/` routes, keeping Miao as default.
4. Add daily single-card entry above the multi-spread flow.
5. Add lightweight analytics events: reading completed, poster generated, tab opened, LLM called, theme selected.
6. Test one social mode: relationship two-person cat spread.

## Sources

- TikTok Creative Center hashtag page for `#tarot`: https://ads.tiktok.com/business/creativecenter/hashtag/tarot/pc/en
- TIME on astrology apps, personalization, funding, and word-of-mouth growth: https://time.com/6083293/astrology-apps-personalized/
- Labyrinthos App Store listing: https://apps.apple.com/us/app/labyrinthos-tarot-reading/id1155180220
- AI Tarot App Store listing: https://apps.apple.com/us/app/ai-tarot-reading-chat/id6449005723
- Sanctuary homepage: https://www.sanctuaryworld.co/
- The Pattern homepage: https://www.thepattern.com/
- Vogue on Co-Star voice and AI-assisted daily insights: https://www.vogue.com/article/whats-co-star-astrology-app-technology-spirituality
- Technavio Tarot Cards market forecast: https://www.technavio.com/report/tarot-cards-market-industry-analysis
- Local research: `docs/github-tarot-research.md`, `docs/theme-foundation.md`, `docs/work-plan.md`
