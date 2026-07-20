# MiaoTarot Marketing Video Design System

## 1. Overview

MiaoTarot turns a familiar Tarot ritual into a warm, low-pressure self-observation moment led by cats. The video must feel like the website came alive: curious rather than prophetic, witty rather than mystical, and immediately playable rather than ad-like. The signature experience is a real choice, a tactile card reveal, one useful line of reflection, and an obvious no-download path into the site.

## 2. Colors

- **Ink `#1D1726`** — primary copy, outlines, decisive beats.
- **Paper `#FFFFFF` / warm paper `#FBF9FF`** — default canvas; keep the experience bright and trustworthy.
- **Soft violet `#F7F2FB` / lilac `#E5DBFF`** — scene depth, card-back fields, ambient glow.
- **Miao violet `#6D4BD8` / vivid violet `#7950F2`** — primary actions, selected states, kinetic accents.
- **Deep violet `#5F3DC4`** — pressed states and high-contrast type on lilac.
- **Teal `#147D73`** — grounded reflection and trust cues.
- **Gold `#B8852F`** — tiny ritual highlights only; never make the whole scene ornate.
- **Muted `#6D647B` / line `#DED8EA`** — secondary copy and structural borders.
- Accent cards may borrow pink `#E64980` or wine `#A61E4D`, but each scene needs one dominant accent.

## 3. Typography

- Use the captured Apple system stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Social headline: 72–104 px at 1080×1920, weight 850–900, line-height 0.98–1.06.
- Beat label and card name: 36–52 px, weight 760–850.
- Supporting copy and captions: 29–38 px, weight 600–700, line-height 1.28–1.42.
- Legal/trust note: 22–26 px, weight 600; never below safe mobile readability.
- Keep Chinese copy short enough for one or two lines. Use high contrast, not oversized shadows, for legibility.

## 4. Elevation

- Card frame: 2–3 px `#DED8EA` border, 28–38 px radius, layered shadow `0 28px 80px rgba(29,23,38,.18)` plus a tight violet edge glow.
- Floating UI chip: white at 92–96% opacity, 1.5 px violet-tinted border, 18–24 px radius, `0 12px 36px rgba(29,23,38,.12)`.
- Selected card: 4 px accent ring plus a 12–20 px soft halo; do not use a neon effect.
- Image art remains full-bleed inside the website-supplied card frame. Never add a printed border over the illustration.

## 5. Components

- **Miao wordmark:** `MiaoTarot` plus a small cat-ear/paw motif; appear as compact navigation-like type in the opening and as the closing signature.
- **Choice trio:** three 5:7 Tarot cards in a tactile fan with `1 / 2 / 3` markers and one visible selection pulse.
- **Hero observer:** captured `miao-hero.jpg`, cropped portrait-first so the purple-cloaked cat, moon, and three cards remain readable.
- **Reveal card:** real captured card art in a clean outer frame; pair card name with one official cat quip and one standard meaning.
- **Question chip:** a real prompt from the site, shown as entered UI rather than decorative quotation.
- **Trust chip:** `轻量自我观察 · 不预测命运`, used once near the reveal or CTA.
- **CTA pill:** solid Miao violet, high-contrast white text, minimum 96 px high at 1080×1920; copy begins with an action.
- **Paw path:** restrained SVG line/paw marks that guide the eye between selection, reveal, and CTA.

## 6. Do / Don't

- **Do:** open mid-action, use real site assets generously, keep one visual focal point per beat, show the actual draw journey, and give every scene tactile motion.
- **Do:** preserve a bright paper base, use violet as the recognition anchor, keep captions inside platform-safe zones, and design sound-off comprehension first.
- **Do:** frame Tarot as reflection, let the cat humor lower anxiety, and make the next click feel low-risk (`免下载 · 30 秒可玩`).
- **Don't:** imply destiny, certainty, mind-reading, or that an algorithm intentionally selected the viewer.
- **Don't:** use generic dark occult imagery, excessive gold filigree, fake testimonials, urgency, or `转发就会有好运` mechanics.
- **Don't:** replace the real product with unrelated AIGC cats, hide the site until the end, or show multiple competing CTAs.
