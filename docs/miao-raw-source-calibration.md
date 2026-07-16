# MiaoTarot Raw-Source Calibration

Date: 2026-07-16

This pass tests the low-change editing mechanics requested for MiaoTarot:

> keep a real network image's pose, crop, expression, and joke; add only a light Tarot style layer

It is different from the earlier synthetic MiaoTI-base pass. Source files and
license evidence live in `references/miao-source-candidates/manifest.json`.

## Direction correction

These seven images are ordinary openly licensed cat photographs, not famous cat
meme mother images. They are retained as `verified-legal-fallback` inputs because
they are useful for testing pose preservation, source tracking, and attribution.
They must not be described as the final MiaoTarot meme set or promoted merely
because a wash looks good. Public production candidates need a second gate:
recognition of the underlying meme without reading the card title.

## The Fool / ZOOM

| Verified source | Raw-source wash candidate |
| --- | --- |
| ![Black cat running on a wall](../references/miao-source-candidates/raw/the-fool-zoom-flickr-2270380761.jpg) | ![MiaoTarot Fool raw-source calibration](generated/miao-raw-source-calibration-v1/the-fool-zoom-raw-v1.jpg) |

Source: `Black cat running on the wall` by pelican, licensed CC BY-SA 2.0.

Review:

- Source behavior: pass. The cat is visibly airborne and moving before the viewer can infer a plan.
- Pose preservation: strong, but not pixel-identical; the leg spacing and cat scale changed slightly.
- Meme-first reading: pass. Running cat is still the first read at mobile size.
- Tarot restraint: pass. Flower, bundle, bright threshold, and gold path remain secondary.
- Production decision: visual candidate passes. Do not promote until the product exposes attribution and the adapted image is distributed under a compatible share-alike license.

## The Moon / WOAH

| Verified source | Selected low-change wash |
| --- | --- |
| ![Large-eyed close-up cat](../references/miao-source-candidates/raw/the-moon-woah-wikimedia-11565993113.jpg) | ![MiaoTarot Moon raw-source calibration](generated/miao-raw-source-calibration-v1/the-moon-woah-raw-v2.jpg) |

Source: `Our new cat decided to help with moving the lego pieces around :-)`,
creator listed by Wikimedia Commons as `Thank you for visiting my page`, licensed
CC BY 2.0 and reviewed by FlickreviewR 2.

Review:

- Source behavior: pass. The giant pupils and too-close crop already communicate uncertainty.
- First wash: reject. It invented full ears, pulled back the crop, and made the face prettier but less meme-native.
- Second wash pose preservation: medium-strong. The near-circular pupils, close crop, and face identity survive, although fur and eye detail are still regenerated rather than pixel-locked.
- Meme-first reading: pass. The eyes remain the first read; Moon symbols stay at the edges.
- Production decision: keep as a calibration candidate, not a final replacement. A deterministic photo-edit pipeline would preserve identity better than generative editing for this card.

## The Tower / PUSH

The previously registered Flickr candidate is rejected even though its license is
valid. The cat sits beside a drink, but its paw is hidden and no pushing action is
visible. A generator would have to invent the core joke, which violates the
source-first method.

## Additional Weak-Base Replacements

### High Priestess / STARE

| Verified source | Raw-source wash candidate |
| --- | --- |
| ![Staring cat beside a tree](../references/miao-source-candidates/raw/the-high-priestess-stare-flickr-24844882035.jpg) | ![MiaoTarot High Priestess raw-source calibration](generated/miao-raw-source-calibration-v1/the-high-priestess-stare-raw-v1.jpg) |

Decision: pass. The gaze, seated body, collar, and tree relationship remain intact.
The added pillar, crescent, and pomegranate marks stay subordinate to the stare.

### Hierophant / ZEN

| Verified source | Raw-source wash candidate |
| --- | --- |
| ![Cat loafed in a basket](../references/miao-source-candidates/raw/the-hierophant-zen-flickr-214993298.jpg) | ![MiaoTarot Hierophant raw-source calibration](generated/miao-raw-source-calibration-v1/the-hierophant-zen-raw-v1.jpg) |

Decision: revise before promotion. Cat, basket, bored face, handle, and brick scene
are strongly preserved, but the foreground keys and ribbon occupy too much visual
weight. Regenerate with Tarot-symbol strength below 15 and no ribbon.

### Wheel of Fortune / WOBBLE

| Verified source | Raw-source wash candidate |
| --- | --- |
| ![Rolling tabby cat](../references/miao-source-candidates/raw/wheel-of-fortune-wobble-flickr-7444606922.jpg) | ![MiaoTarot Wheel raw-source calibration](generated/miao-raw-source-calibration-v1/wheel-of-fortune-wobble-raw-v1.jpg) |

Decision: pass. The full rolling pose and sideways glance survive, while the chalk
ring reads as an accidental domestic Wheel symbol rather than a fantasy machine.

### Chariot / OIIA

| Verified source | Raw-source wash candidate |
| --- | --- |
| ![Black-and-white cat mid-pounce](../references/miao-source-candidates/raw/the-chariot-oiia-flickr-44843494.jpg) | ![MiaoTarot Chariot raw-source calibration](generated/miao-raw-source-calibration-v1/the-chariot-oiia-raw-v1.jpg) |

Decision: pass with a minor production revision. The exact pounce and toy target
remain readable. Reduce the number of star glints by roughly half so the candid
snapshot stays dominant.

### Hanged Man / TILT

| Verified source | Raw-source wash candidate |
| --- | --- |
| ![Upside-down cat on bedding](../references/miao-source-candidates/raw/the-hanged-man-tilt-flickr-4980442801.jpg) | ![MiaoTarot Hanged Man raw-source calibration](generated/miao-raw-source-calibration-v1/the-hanged-man-tilt-raw-v1.jpg) |

Decision: pass. The upside-down face, bedding, relaxed body, and photographic
identity remain intact. The halo and slack red thread add meaning without implying
danger or literal suspension.

## Technical Batch Verdict

| Candidate | Source behavior | Preservation | Symbol restraint | Result |
| --- | --- | --- | --- | --- |
| Fool / `ZOOM` | Strong | Strong | Strong | Pass after attribution/share-alike UI |
| Moon / `WOAH` | Strong | Medium-strong | Strong | Calibration pass; deterministic edit preferred |
| Priestess / `STARE` | Strong | Strong | Strong | Pass |
| Hierophant / `ZEN` | Medium-strong | Strong | Medium-low | Revise |
| Wheel / `WOBBLE` | Strong | Strong | Strong | Pass |
| Chariot / `OIIA` | Strong | Strong | Medium | Minor revision |
| Hanged Man / `TILT` | Strong | Strong | Strong | Pass |

These verdicts evaluate washing mechanics only. The resulting formula must be
selected by source type:

- Action source: preserve silhouette, limb positions, motion blur, and target object.
- Reaction face: prefer deterministic crop/color/composite; generative repainting is a fallback.
- Object scene: preserve the cat/object relationship and keep added symbols below 15 percent of the visual weight.

## Method Update

The prompt formula alone is not enough. The production pipeline is now:

1. Source eligibility: adaptation and commercial use must be explicitly allowed.
2. Behavior gate: the raw image itself must visibly contain the card's core joke.
3. Provenance gate: creator, source page, license, dimensions, and checksum enter the tracked manifest.
4. Low-change wash: lock identity, crop, gaze, pose, and object relationship; Tarot symbols are secondary.
5. Side-by-side review: reject outputs that become prettier while losing source awkwardness.
6. License treatment: expose attribution and apply share-alike terms when required before promotion.

For close-up reaction faces, prefer a deterministic color-grade/composite pipeline
over generative repainting when the model cannot preserve the source identity. For
action shots, image-to-image is acceptable only when the action silhouette remains
recognizable without reading the card title.
