# MiaoTarot Meme Candidate Register

Date: 2026-07-03

This is the first image-collection pass for MiaoTarot meme bases. It covers the three calibration cards and the weakest current Major Arcana base candidates.

Verified third-party candidates are stored separately under `references/miao-source-candidates/`; they are never copied directly into public product assets. Its manifest records source, creator, license evidence, checksum, and derivative obligations.

Use `docs/miao-meme-archetype-map.md` to decide whether a candidate should be treated as a light-wash production base, a Tarot-wash base, or research-only archetype.

## Method

Sources checked:

- [Openverse API](https://api.openverse.org/) and source pages from Flickr / Wikimedia Commons.
- Research-only meme references such as Know Your Meme when they help identify the canonical internet-cat behavior.
- Local visual review contact sheets generated in `/tmp`; these are not repo assets.

Important caveat: Openverse searches openly licensed media, but its own documentation warns that license accuracy should still be verified on the source page before use.

## Round 1 Preferred Candidates

| Tarot card | Miao base | Status | Candidate | Source / license | Why it fits | Risk | Next step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| The Fool | `ZOOM` | verified source | Black cat running on the wall | Flickr: [pelican](https://www.flickr.com/photos/85936780@N00/2270380761), CC BY-SA 2.0 | Strong airborne motion silhouette; reads as "body moved before plan loaded." | Medium: the adapted output must remain BY-SA and carry attribution. | Run raw-source calibration and review at square/mobile crops. |
| The Tower | `PUSH` | rejected | Cat sitting beside a drink | Flickr: [feverblue](https://www.flickr.com/photos/85455733@N00/9325042560), CC BY-SA 2.0 | The source is licensed, but the paw is hidden and no push action is visible. | High product risk: generation would invent the core joke instead of preserving it. | Continue searching; do not use this source. |
| The Moon | `WOAH` | replaced | Large-eyed close-up cat | Wikimedia Commons: [Flickr-reviewed source](https://commons.wikimedia.org/wiki/File:Our_new_cat_decided_to_help_with_moving_the_lego_pieces_around_--%29_%2811565993113%29.jpg), CC BY 2.0 | High-resolution, watermark-free direct gaze; stronger source and simpler obligations than the earlier 612px BY-SA candidate. | Low-medium: attribution and modification notice required. | Run raw-source calibration and keep the shocked face as the first read. |
| High Priestess | `STARE` | verified source | Stare Cat | Flickr: [cogdogblog](https://www.flickr.com/photos/37996646802@N01/24844882035), CC BY 2.0 | Silent direct gaze; usable as a calmer production echo of Staring Cat / Gusic. | Low-medium: attribution required; less iconic than the meme original. | Raw-source wash passes; keep as production candidate. |
| The Hierophant | `ZEN` | verified source | Cat loaf in a basket | Flickr: [Zyada](https://www.flickr.com/photos/46118643@N00/214993298), CC BY 2.0 | Basket reads like a small altar/seat; better ritual presence than current weak `ZEN`. | Low-medium: attribution required. | Wash preserves the source, but regenerate with smaller keys and no ribbon. |
| Wheel of Fortune | `WOBBLE` | verified source | Cat rolling on its back | Flickr: [Derek Bridges](https://www.flickr.com/photos/84949728@N00/7444606922), CC BY 2.0 | Clear rolling body; becomes a wheel composition without overexplaining. | Low-medium: attribution required. | Raw-source wash passes. |
| The Chariot | `OIIA` | verified source | New toy, mid-pounce | Flickr: [Al Abut](https://www.flickr.com/photos/35237095805@N01/44843494), CC BY-SA 2.0 | Airborne pounce gives forward drive and "cannot stop now" energy. | Medium: adapted output must remain BY-SA and carry attribution. | Wash passes after reducing background star glints. |
| The Hanged Man | `TILT` | verified source | Downside Up | Flickr: [Luke Hayfield Photography](https://www.flickr.com/photos/30880820@N07/4980442801), CC BY 2.0 | Upside-down face is instantly readable and matches the changed-perspective card meaning. | Low-medium: attribution required. | Raw-source wash passes. |

## Research-Only References

These are useful for meme literacy, not automatic production bases:

| Reference | Use | Risk |
| --- | --- | --- |
| Know Your Meme: [Staring Cat / Gusic](https://knowyourmeme.com/photos/1830090-staring-cat-gusic) | Helps define the High Priestess stare archetype: blank, too-close, all-knowing. | High for production: uploaded meme image, source points back to Instagram; use as vibe only. |
| Cat-knocking-things-off-table behavior | Helps define The Tower as one-paw collapse, not generic destruction. | Medium-high: many viral clips/images have unclear ownership; prefer licensed or owned recreation. |
| Wide-eyed reaction-cat behavior | Helps define The Moon as "I saw something in the air" reaction. | Medium-high if using famous viral meme images; prefer licensed close-up or owned recreation. |

## Fallbacks Worth Checking

| Card | Candidate | Source / license | Why |
| --- | --- | --- | --- |
| Wheel of Fortune | Calico cat rolling on her back | Wikimedia Commons: [Famartin](https://commons.wikimedia.org/w/index.php?curid=123913235), CC BY-SA 4.0 | High resolution and clean source, though less meme-snappy than Derek Bridges' rolling cat. |
| The Hanged Man | Calico cat lying upside down | Wikimedia Commons: [Famartin](https://commons.wikimedia.org/w/index.php?curid=100844726), CC BY-SA 4.0 | Full-body upside-down pose, useful if a close-up face does not hold Tarot symbols well. |
| The Chariot | Jump! | Flickr: [crsan](https://www.flickr.com/photos/27539822@N05/3542361219), CC BY 2.0 | Dramatic vertical motion, but the wall pose may read more like escape than drive. |
| The Moon | Surprised Cat | Flickr: [isghoul](https://www.flickr.com/photos/13669069@N03/4657831414), CC BY 2.0 | Wider scene and good body language, but weaker than the square close-up reaction face. |

## Rejected Patterns From This Pass

- Search term `cat roll` often returns construction vehicles because of Caterpillar / CAT.
- Search term `cat leap` often returns parkour, not cats.
- Many upside-down cat results include visible humans; these weaken the production base and may add portrait-rights risk.
- Several image-search results were Pinterest mirrors or AI-looking blog images; keep these research-only unless a reliable source and license can be verified.

## Recommended Next Move

1. Expand the verified pool beyond the first seven cards, prioritizing behaviorally strong sources over famous-but-unlicensed memes.
2. Keep verified downloads in `references/miao-source-candidates/raw/`, not in public assets or the synthetic compatibility-base directory.
3. Run the image washing pipeline in `docs/miao-image-washing-plan.md`.
4. Run square crop tests for Fool, Tower, Moon, Chariot, and Hanged Man.
5. Calibrate The Fool / `ZOOM` and The Moon / `WOAH` against the verified raw sources.
6. Resume The Tower / `PUSH` only after a source with a visible paw/object push passes visual review.
