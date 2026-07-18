import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cards } from '@cometpisces/tarot-kit';
import { getMiaoContentBundle } from '../site/src/domain/miaoContent';
import {
  getMiaoContentPackCardIds,
  miaoContentPacks,
} from '../site/src/domain/miaoContentPacks';
import { getCardName, getSuitLabel } from '../site/src/domain/tarot';

const outputDir = path.join(process.cwd(), 'docs/generated/content-packs');
const cardById = new Map(cards.map((card) => [card.id, card]));

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function htmlImagePath(image: string | undefined) {
  if (!image) return '';
  if (/^(?:https?:|data:)/.test(image)) return image;
  return `../../../site/public/${image.replace(/^\.\//, '')}`;
}

function renderPack(pack: (typeof miaoContentPacks)[number]) {
  const cardIds = getMiaoContentPackCardIds(pack);
  const entries = cardIds.map((tarotId, index) => {
    const card = cardById.get(tarotId);
    if (!card) throw new Error(`Unknown tarot card in ${pack.id}: ${tarotId}`);
    const bundle = getMiaoContentBundle(tarotId, pack.id);
    const copy = bundle.copy;
    const section = card.arcana === 'major' ? '大阿卡纳' : `小阿卡纳 · ${getSuitLabel(card.suit)}`;
    const image = htmlImagePath(bundle.art.generatedImage || bundle.art.standardImage);
    return `
      <article class="card" id="${escapeHtml(tarotId)}">
        <div class="art-wrap">
          <span class="number">${String(index + 1).padStart(2, '0')}</span>
          <img src="${escapeHtml(image)}" alt="${escapeHtml(`${getCardName(card)} · ${copy.miaoName}`)}" loading="lazy">
        </div>
        <div class="copy">
          <p class="eyebrow">${escapeHtml(section)} · ${escapeHtml(tarotId)}</p>
          <h2>${escapeHtml(getCardName(card))}</h2>
          <p class="miao-name">${escapeHtml(copy.miaoName)}${bundle.catBreed ? ` · ${escapeHtml(bundle.catBreed)}` : ''}</p>
          <blockquote>${escapeHtml(copy.memeCaption)}</blockquote>
          <dl>
            <div><dt>原型</dt><dd>${escapeHtml(copy.archetype)}</dd></div>
            <div><dt>正位</dt><dd>${escapeHtml(copy.uprightMiaoMeaning)}</dd></div>
            <div><dt>逆位</dt><dd>${escapeHtml(copy.reversedMiaoMeaning)}</dd></div>
            <div><dt>情绪信号</dt><dd>${escapeHtml(copy.emotionalSignal)}</dd></div>
            <div><dt>今天可以做</dt><dd>${escapeHtml(copy.tinyAction)}</dd></div>
            <div><dt>分享文案</dt><dd>${escapeHtml(copy.shareText)}</dd></div>
          </dl>
        </div>
      </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pack.name)} · MiaoTarot 内容总览</title>
  <style>
    :root { color-scheme: light; --ink:#251d2d; --muted:#746b78; --paper:#fffaf0; --accent:#7352a8; --line:#ded3c6; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:#ece5d9; font:16px/1.65 ui-rounded,"PingFang SC","Noto Sans SC",system-ui,sans-serif; }
    header { padding:64px max(24px,calc((100vw - 1160px)/2)); background:var(--paper); border-bottom:1px solid var(--line); }
    header h1 { max-width:850px; margin:10px 0 8px; font-size:clamp(34px,6vw,68px); line-height:1.08; letter-spacing:-.03em; }
    header p { max-width:800px; margin:8px 0; color:var(--muted); }
    .meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:22px; }
    .meta span { padding:5px 10px; border:1px solid var(--line); border-radius:999px; background:white; font-size:13px; }
    main { width:min(1160px,calc(100% - 32px)); margin:32px auto 80px; display:grid; gap:24px; }
    .card { display:grid; grid-template-columns:minmax(260px,42%) 1fr; overflow:hidden; background:var(--paper); border:1px solid var(--line); border-radius:22px; box-shadow:0 12px 35px #4e3d2512; }
    .art-wrap { position:relative; min-height:360px; background:linear-gradient(145deg,#eadfce,#d8cab7); }
    .art-wrap img { width:calc(100% - 24px); height:calc(100% - 24px); position:absolute; inset:12px; object-fit:contain; object-position:center; padding:8px; background:#fffaf0cc; border-radius:14px; }
    .number { position:absolute; z-index:1; top:14px; left:14px; padding:3px 9px; border-radius:999px; background:#fffdf1dd; backdrop-filter:blur(8px); font-weight:800; }
    .copy { padding:30px; }
    .eyebrow { margin:0; color:var(--accent); font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    h2 { margin:5px 0 0; font-size:28px; line-height:1.2; }
    .miao-name { margin:6px 0 18px; color:var(--muted); font-weight:700; }
    blockquote { margin:0 0 22px; padding:12px 16px; border-left:4px solid var(--accent); background:#f3edf8; border-radius:0 10px 10px 0; }
    dl { display:grid; gap:12px; margin:0; }
    dl div { display:grid; grid-template-columns:88px 1fr; gap:12px; padding-top:12px; border-top:1px solid var(--line); }
    dt { font-size:13px; color:var(--muted); font-weight:800; }
    dd { margin:0; }
    footer { width:min(1160px,calc(100% - 32px)); margin:0 auto 50px; color:var(--muted); font-size:13px; text-align:center; }
    @media (max-width:720px) {
      header { padding-top:40px; }
      .card { grid-template-columns:1fr; }
      .art-wrap { aspect-ratio:1; min-height:0; }
      .copy { padding:22px; }
      dl div { grid-template-columns:1fr; gap:3px; }
    }
    @media print {
      body { background:white; }
      header { padding:24px; }
      .card { break-inside:avoid; box-shadow:none; }
    }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">MiaoTarot Content Pack · ${escapeHtml(pack.id)}@${escapeHtml(pack.version)}</p>
    <h1>${escapeHtml(pack.name)}</h1>
    <p>${escapeHtml(pack.description)}</p>
    <div class="meta">
      <span>${cardIds.length} 张</span>
      <span>${pack.scope === 'full' ? '标准完整牌组' : '大阿卡纳牌组'}</span>
      <span>${escapeHtml(pack.artStyle)}</span>
${pack.fallbackPackId ? `      <span>继承 ${escapeHtml(pack.fallbackPackId)}</span>` : ''}
    </div>
  </header>
  <main>${entries}
  </main>
  <footer>此页面由内容包数据自动生成；图片与文字版权、来源和娱乐性说明以项目文档为准。</footer>
</body>
</html>
`;
}

await mkdir(outputDir, { recursive: true });
await Promise.all(miaoContentPacks.map((pack) => (
  writeFile(path.join(outputDir, `${pack.id}.html`), renderPack(pack))
)));

console.log(`Exported ${miaoContentPacks.length} content pack HTML files to docs/generated/content-packs/`);
