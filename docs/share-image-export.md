# Share Image Export

Date: 2026-06-22

This checkpoint adds MiaoTI-style share image export to MiaoTarot.

## Implementation

The UI uses `html-to-image` to render the visible share card DOM into a PNG:

```ts
const dataUrl = await toPng(shareCardRef.current, {
  cacheBust: true,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
});
```

The export flow:

1. User completes a reading.
2. The Share tab renders the result card.
3. User clicks `生成分享图`.
4. The app waits for fonts, renders the share card to PNG, downloads it, and shows an inline preview.

## Reference

MiaoTI exports result cards with a hidden share-card DOM and `html2canvas`. MiaoTarot keeps the same product idea, but uses `html-to-image` as an npm dependency inside the Vite/React app.

## Current Limits

- The generated image is based on the current visual share card, not a separate long poster layout.
- QR code and hosted URL can be added later when the deployment URL is final.
- Mobile save behavior may differ by browser; the inline preview gives users a fallback image to long-press.
