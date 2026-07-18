# MiaoTarot repository instructions

## Image generation contract

- Read `docs/image-generation-contract.md` before generating, editing, replacing, or validating card art.
- New and regenerated card masters must be portrait `5:7`, with `1020x1428` pixels as the preferred working size.
- When an image tool exposes aspect-ratio, canvas, width, or height controls, set them explicitly. Prompt wording alone is not a substitute for the tool parameter.
- Request a native portrait composition. Do not generate a square image and then crop, stretch, or outpaint it as the normal workflow.
- Card art must be full-bleed and must not contain a printed card border, title, letters, numbers, watermark, or logo. The website supplies the outer card frame and labels.
- Keep the main cat, face, paws, and essential Tarot symbols inside the central safe area so a small responsive crop cannot remove them.
- Existing `1254x1254` masters are legacy assets and may remain until they are intentionally regenerated. Never use them as the format precedent for new art.
- Save approved PNG masters to the `outputPath` in the exported prompt record, then run the matching optimization and verification commands documented in `docs/image-generation-contract.md`.
