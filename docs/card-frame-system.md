# MiaoTarot 卡牌边框系统

更新时间：2026-07-20

## 决策

卡牌图片继续保持 `5:7`、full-bleed、无印刷边框；网站在图片外绘制统一牌框。牌框采用数据驱动的预设注册表，不引入额外 Tarot UI 或装饰边框依赖。

当前内容包映射：

| 内容包 | 默认牌框 |
| --- | --- |
| `doodle-full` | `inked-paper` 手绘纸框 |
| `classic-major` | `gilded` 古典鎏金 |

注册表同时提供 `moonlit` 和 `botanical`，供后续内容包复用。新增牌框只需：

1. 在 `site/src/domain/cardFrames.ts` 注册 id、名称和 CSS class。
2. 在 `site/src/styles.css` 为该 class 提供牌框 CSS 变量。
3. 在内容包定义中设置 `frameId`。

渲染、图鉴、结果页、分享图和翻牌正面都走同一套 frame id；不在各页面复制边框规则。

## 方法论

牌要在手机上首先读成一个“可拿起的对象”，再读图中内容。因此外观分成三层：

1. **外轮廓**：固定 `5:7`、圆角、实体外边和投影，让牌从页面背景中分离。
2. **牌框轨道**：双层内线与四角标记，形成牌框而不是普通图片描边。
3. **全出血画面**：原图保留在内框中；牌名、正逆位旋转和交互仍由应用层负责。

实体卡印刷通常把关键内容放入 safe area，并提醒细边框会放大裁切偏差；网页没有裁切机械误差，但同样应该把装饰留在外框、把猫脸和关键符号留在图像中央安全区。[MakePlayingCards 的 bleed / safe-area 说明](https://www.makeplayingcards.com/pops/faq-photo.html)

技术上使用多层 CSS background、圆角、内外 `box-shadow` 和伪元素。W3C 的 Backgrounds and Borders 规范原生覆盖多背景、圆角、边框图片与阴影；这些能力足以组合可主题化牌框。[W3C CSS Backgrounds and Borders](https://www.w3.org/TR/css-backgrounds-3/) [MDN box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-shadow)

## 为什么不新增依赖

- 当前 `@cometpisces/tarot-kit` 负责牌数据和抽牌 helper；`@cometpisces/tarot-kit-images` 负责图片映射，本身没有卡牌 UI 或边框系统。[tarot-kit-images npm 文档](https://www.npmjs.com/package/@cometpisces/tarot-kit-images)
- 引入另一套 Tarot UI 会重复现有内容包、翻牌动画、正逆位、分享与无障碍结构，并增加移动端 bundle 和样式冲突风险。
- CSS Paint Worklet 可以程序化绘制边框，但当前需求不值得增加运行时 feature detection 和 fallback；静态 CSS 变量预设更容易截图测试、导出分享图和维护。
- 如果未来需要插画级复杂边框，可在现有注册表里增加优化后的 SVG / AVIF `border-image` 预设，而不用改渲染 API。

## 手机端验收

- 360px 和 390px 宽度不产生横向溢出。
- 图鉴两列时仍能看见外边、双层轨道和圆角，不挤掉猫脸。
- 翻牌后正面固定为 `5:7`；图片铺满内框，逆位只旋转画面，不旋转外框。
- 结果页、图鉴详情和分享图使用同一内容包牌框。
- 装饰层 `pointer-events: none`，不影响翻牌和图鉴点击区域。
