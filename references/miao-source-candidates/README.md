# MiaoTarot Source Candidates

This directory stores third-party source images with tracked provenance. It is a
registry, not a promise that every file is a recognizable internet meme. These
files are image-to-image inputs, not public product assets.

Asset status is explicit:

- `verified-meme-source`: a canonical or creator-confirmed meme mother image,
  with production reuse permission recorded.
- `verified-legal-fallback`: an adaptable cat photo with verified licensing,
  useful for pipeline tests or an emergency replacement, but not meme-native.
- `research-only`: a recognizable meme reference whose production rights are
  not yet cleared. It must never be copied into public assets.

The current Flickr/Wikimedia batch is `verified-legal-fallback`. It proved the
low-change image-to-image workflow, but it is not the visual direction for the
public deck.

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
