# MiaoTarot Remotion 成片

这是一支原生 Remotion 制作的 20.10 秒、1080×1920、30fps 竖屏营销视频。

## 清晰度原则

- 网站界面、字幕、按钮、牌框和分享卡全部用 React DOM 逐帧绘制。
- 猫牌使用 `1020×1428` 的 5:7 原始素材，通过 Remotion `<Img>` 加载。
- 成片不使用网页截图、不录屏、不把横屏截图放大为竖屏。
- 最终输出使用 H.264、CRF 14、AAC 192kbps。

## 命令

```sh
npm install
npm run dev
npm run lint
npm run render:video
npm run test:render
```

成片输出到 `out/miaotarot-launch-1080x1920.mp4`。

## 时间线

| 场景 | 帧 | 时间 | 任务 |
| --- | ---: | ---: | --- |
| Choice | 0–98 | 0.00–3.30s | 两秒选一张猫 |
| Proof | 99–233 | 3.30–7.80s | 展示真实提问和翻牌 |
| Reveal | 234–398 | 7.80–13.30s | 魔术师结果和行动 |
| Share | 399–503 | 13.30–16.80s | 指向具体朋友的传播动机 |
| CTA | 504–602 | 16.80–20.10s | 单一试玩入口 |
