# MiaoTarot Source Candidates

This directory stores third-party source images that passed an initial visual and
license review. They are image-to-image inputs, not public product assets.

The machine-readable source of truth is `manifest.json`. Every file must include:

- a direct source page and creator
- a license URL that permits adaptation and commercial use
- the downloaded asset URL, retrieval date, dimensions, and SHA-256
- a card-specific visual review decision

Do not copy these files into `site/public/`. A transformed output can be promoted
only after side-by-side visual review and after its required attribution and
license treatment are exposed in the product.

`CC BY-SA` inputs require the adapted image to remain under the same compatible
license. `CC BY` inputs require attribution and an indication that the image was
modified.
