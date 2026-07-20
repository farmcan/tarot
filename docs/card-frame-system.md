# MiaoTarot 卡牌边框系统

更新时间：2026-07-20

## 产品判断

用户看到的不应是“带描边的图”，而应是一张可以拿起、翻开和收藏的牌。边框要先建立实体感与仪式感，同时不挤占猫脸、爪子和关键塔罗符号。

Rider-Waite Tarot Deck 实物牌常见规格是 `2.75 × 4.75 英寸`，宽高比约等于 `11:19`。因此：

- 网页外卡固定为 `11:19`，和实体塔罗牌、现有牌背接近。
- 原画继续严格 `5:7`，不裁切、不拉伸。
- 多出的纵向空间放装饰轨道与独立内框铭牌；铭牌用真实牌号/花色、牌名、关键词、角点和低对比纹理建立层级，不把原画拉长或模糊填充。

实体尺寸参考：[U.S. Games Rider-Waite 产品规格](https://www.usgamesinc.com/rider-waite-tarot-deck.html)。

## 技术决策

边框使用 `@nine-slice-frame/react@1.0.0` 的 `NineSliceFrame`，底层是 CSS `border-image` 九宫格缩放。这能把四角、横边和竖边分开缩放，避免装饰花角在小手机上拉扁。依赖为 MIT、零运行时依赖，包较小，但社区规模有限；因此所有调用集中在 `TarotCardFrame.tsx` 适配层，资产与主题数据保留在本仓库。

当前内容包映射：

| 内容包 | 默认牌框 |
| --- | --- |
| `doodle-full` | `inked-paper` 手绘纸框 |
| `classic-major` | `gilded` 古典镏金 |

注册表还提供 `moonlit` 和 `botanical`。新增边框只需：

1. 将适合九宫格切片的 SVG 放入 `site/public/assets/card-frames/`。
2. 在 `site/src/domain/cardFrames.ts` 注册 id、文案、资产路径、徽记与 CSS class。
3. 用 CSS 变量定义材质、铭牌和阴影，内容包只选 `frameId`。

图鉴、结果页、分享图、主题卡和翻牌正面共用这套适配层；正逆位只旋转 `5:7` 原画，不旋转外框与牌名。铭牌用 container query 在小图鉴中隐藏最细的牌号行，但保留内框、纹理与主要信息；大卡和翻牌面显示完整层级。

## 竞品方法论

Labyrinthos 的牌组选择和自定义、Golden Thread 的统一牌组语言，以及 Fool's Dog Tarot 对高分辨率牌面与桌布的强调，都说明“牌组身份”是体验的一部分，不是一层通用 UI 描边。MiaoTarot 不复制它们的视觉，只吸收两个原则：每个内容包有可辨认材质，原画在手机尺寸仍是主角。

参考：[Labyrinthos](https://labyrinthos.co/pages/app)、[Golden Thread Tarot](https://goldenthreadtarot.com/)。

## 手机端验收

- 320px 窄屏和 390px 现代手机不产生横向溢出。
- 图鉴两列时仍能辨认角饰、材质和牌名，猫脸不被裁。
- 翻牌前后宽度不跳动；正面固定 `11:19`，内部原画固定 `5:7`。
- 结果页、图鉴详情和分享图使用同一内容包牌框。
- 装饰层不拦截点击，按钮保持完整触摸区。
