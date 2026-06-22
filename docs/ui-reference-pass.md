# UI Reference Pass

Date: 2026-06-22

This checkpoint keeps the current MiaoTarot direction but tightens the interaction around references from MiaoTI and common Tarot reading products.

## References Used

| Reference | What mattered |
| --- | --- |
| Local `miaoti` project | A short flow with visible progress, playful copy, result/share emphasis, and cat meme assets as the emotional hook. |
| The Keeper's Path, "Using Tarot Spreads/Layouts" | A spread is not just card count; card placement contributes to interpretation. |
| RoxyAPI Tarot tutorial/tools | Practical Tarot products often center daily/single-card, three-card, yes/no, imagery, and reversed-card handling. |
| MarketingPipeline/Tarot.js | Deck, spread, and reading separation is a useful app structure and matches the current foundation. |

Source links:

- https://thekeeperspath.com/2022/04/08/using-tarot-spreads-layouts/
- https://roxyapi.com/docs/tutorials/tarot-app
- https://github.com/topics/tarot?l=javascript&o=desc&s=forks

## Changes Applied

1. Added a MiaoTI-like reading flow indicator in the control panel:
   - write question
   - draw cat cards
   - interpret/share
2. Added a spread position preview below the spread picker, so users see what each card is answering before drawing.
3. Kept the implementation inside Mantine + local CSS; no new UI library was added.
4. Preserved the current MiaoTarot hero and card result layout.

## Why This Direction

The current app already has a strong visual first screen and result area. The main missing interaction detail was orientation: users needed to know where they are in the flow and what the selected spread will do. The new flow bar and position preview make the app feel more deliberate without turning it into a long onboarding page.

## Next UI Ideas

- Add real share-image export, likely using the same html2canvas pattern already present in MiaoTI.
- Add a daily/single-card entry point for lower-friction repeat visits.
- Consider a yes/no oracle mode only if it can stay non-deterministic and non-fatalistic.
