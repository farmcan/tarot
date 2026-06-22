# Share Image Export

Date: 2026-06-22

This checkpoint adds MiaoTI-style share image export to MiaoTarot, then upgrades it into a poster-style image with a URL and QR code.

## Implementation

The UI uses `html-to-image` to render the visible share poster DOM into a PNG:

```ts
const dataUrl = await toPng(shareCardRef.current, {
  cacheBust: true,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
});
```

The export flow:

1. User completes a reading.
2. The Share tab renders the result poster with card summary, URL, and QR.
3. User clicks `生成分享图`.
4. The app waits for fonts, renders the share card to PNG, downloads it, and shows an inline preview.

The QR code is generated with the maintained MIT package `qrcode`, using the current page URL. On local preview it points to localhost; on the deployed site it points to the deployed `/v1/` URL.

## Reference

MiaoTI exports result cards with a hidden share-card DOM and `html2canvas`. MiaoTarot keeps the same product idea, but uses `html-to-image` as an npm dependency inside the Vite/React app.

## Current Limits

- The QR currently uses the page URL rather than a campaign-specific canonical URL.
- Mobile save behavior may differ by browser; the inline preview gives users a fallback image to long-press.
