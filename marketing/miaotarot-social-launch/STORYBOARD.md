# MiaoTarot「两秒选一张猫」分镜

**Format:** 1080×1920, 30fps, 20.10s, mobile-safe 9:16

**Audio:** Tingting 普通话旁白 + 自制轻触 / 翻牌 / 清亮落点 SFX；首版不加入有版权风险的配乐

**VO direction:** 年轻朋友递来三张牌的语气；开场敏捷，揭牌后留白，拒绝神秘预言腔

**Style basis:** `DESIGN.md`；明亮纸张、真实猫牌、Miao violet 识别色

**Primary transition:** 场景切点使用 10 帧扫光；揭牌用按帧驱动的 3D flip 作为唯一高能强调

## Global guardrails

- 第一帧已经在玩，不从 Logo 动画或产品介绍起步。
- 每个画面至少有背景纹理、主焦点、辅助焦点和前景导视；密度来自真实素材，不堆装饰。
- 所有中文屏幕文案在无声状态也能还原完整叙事；字幕与平台 UI 保持安全距离。
- 牌义只使用网站现有准确文案；不声称命运、准确率或“算法选中你”。
- 所有卡牌保持 5:7，插画只在网站提供的外框中展示；不把文字直接印进原画。

## Asset audit

| Asset | Type | Assign to Beat | Role |
| --- | --- | --- | --- |
| `site/public/assets/miao-hero.jpg` | Hero image | 1, 5 | 开场观察员与结尾品牌世界；慢推镜头 |
| `assets/site-hero.png` | Reference screenshot | SKIP | 仅作设计核对，不进入成片 |
| `assets/site-flow.png` | Reference screenshot | SKIP | 仅作流程核对，不进入成片 |
| `assets/site-share.png` | Reference screenshot | SKIP | 仅作分享能力核对，不进入成片 |
| `site/public/assets/miao-packs/doodle/the-magician.avif` | Card master | 2, 3, 4 | 主结果牌；翻牌和结果卡 |
| `site/public/assets/miao-packs/doodle/the-high-priestess.avif` | Card master | 1, 2 | 左侧选择与安静观察气质 |
| `site/public/assets/miao-packs/doodle/the-fool.avif` | Card master | 1, 2, 5 | 选择与品牌牌组多样性 |
| `site/public/assets/miao-packs/doodle/the-star.avif` | Card master | 1, 5 | 选择与结尾牌阵 |
| `site/public/assets/miao-packs/doodle/the-world.avif` | Card master | SKIP | 画面信息量偏高，20 秒母版不再加新焦点 |
| `site/public/assets/miao-packs/doodle/ace-of-wands.avif` | Card master | SKIP | 适合后续行动主题变体，不进入主版 |
| `site/public/assets/miao-packs/doodle/ace-of-cups.avif` | Card master | SKIP | 适合后续关系主题变体，不进入主版 |
| `site/public/assets/favicon.svg` | Brand mark | 1, 5 | 首尾 MiaoTarot 标记 |

Remotion master 不把任何网站截图放进视频。真实产品流程、分享卡、按钮、字幕和牌框全部由 React DOM 在 1080×1920 画布上逐帧绘制；hero 与 1020×1428 的 5:7 猫牌原图直接进入成片。

## BEAT 1 — 观众已经在选（0.00–3.30s）

**VO:** “给你两秒。左、中、右，选一张猫。”

**Concept:** 视频一打开，三张真实猫牌已经向观众扑到手边。它像一次很短的街头互动，不像广告：观众先做一个选择，品牌只在角落轻声报到。画面要让人本能地在左、中、右之间移动视线。

**Visual:** 温暖纸张底上，`miao-hero.jpg` 作为宽幅月光记忆层缓慢推近；前景三张 5:7 卡从下方错峰落桌，左为女祭司、中为魔术师、右为星星，起始以紫色卡背遮住。上方粗体标题 `给你 2 秒` 首先落下，随后 `左 / 中 / 右` 三个数字标记依次点亮。右上是 favicon + `MiaoTarot`。一条手绘紫色路径从标题穿过三张牌，三枚小爪印沿路径追逐；右侧细小倒计时从 `2` 收到 `1`。

**Mood:** 俏皮但不幼稚；像一本会动的猫咪绘本和一局真正的桌面抽牌。

**Assets:** `miao-hero.jpg`, `the-high-priestess.avif`, `the-magician.avif`, `the-star.avif`, `favicon.svg`。

**Animation choreography:** 标题和三张卡使用 Remotion `interpolate()` + Bézier easing 入场；背景图按帧缓慢 Ken Burns；中牌在 1.97s 抬升并放大。所有运动由 `useCurrentFrame()` 驱动，不使用 CSS animation。

**Transition:** 3.30s 附近用 10 帧扫光覆盖切点，接入真实产品手机界面。

**Depth:** BG hero 月光 + 纸纹；MG 三张牌；FG 标题、数字、爪印和品牌标记。

**SFX:** 1.83s 中牌选择轻触声。

## BEAT 2 — 选择变成真实流程（3.30–7.80s）

**VO:** “选中间？翻开。魔术师说——”

**Concept:** 观众的选择被“接进”真实网站。中牌向镜头靠近，背后不是虚构的占卜星空，而是 MiaoTarot 的真实提问和设置界面；可信度在揭牌前完成。

**Visual:** React DOM 重建的竖向手机界面从下方进入：品牌栏、真实问题输入框、选牌进度、三张高清卡背和紫色翻牌按钮全部在目标分辨率绘制。中牌出现点击反馈并用 3D `rotateY` 翻成魔术师。

**Mood:** 从游戏感切入产品感，干净、具体、有触感；像在朋友手机上看见真实操作。

**Assets:** `moon-atlas-left.avif`, `moon-atlas-middle.avif`, `moon-atlas-right.avif`, `the-magician.avif`。

**Animation choreography:** 手机和内容分层 SETTLE；三张牌依次出现；选择环 PULSES；中牌按帧 FLIPS；按钮文案从“翻开”切换为“已翻开”。技术：Remotion DOM、`<Img>`、CSS 3D transform（由帧控制）。

**Transition:** 7.80s 附近用 10 帧扫光接入全尺寸魔术师牌。

**Depth:** BG lilac 光晕与巨大的半透明 `M`；MG 原生 DOM 手机界面；FG 小牌、选择环、问题芯片。

**SFX:** 6.27s 翻牌纸面声。

## BEAT 3 — 猫句先命中（7.80–13.30s）

**VO:** “办法不是没有，是还没伸爪。你手上的工具已经够了。”

**Concept:** 魔术师牌从侧面完成翻转，像真正被揭开。观众先得到一句有记忆点的猫句，然后才看到牌名和含义；这既是情绪回报，也是可截图、可转发的传播单元。

**Visual:** 魔术师牌占据画面 54% 高度，保持完整 5:7；牌后是 Miao violet 放射圆和手绘短线，左上 `魔术师 · 创造力`，右侧竖排 `I`。猫句分三组在牌两侧按旁白节奏落下，`伸爪` 用 teal 笔刷底强调。三枚工具图形（小灯泡、笔、箭头）围着卡的桌面元素漂浮，底部信任 chip `轻量自我观察 · 不预测命运` 出现。

**Mood:** 这是成片最“哇”的瞬间，但依旧明亮可信；力量来自真实插画和语言，不来自黑金神秘特效。

**Assets:** `the-magician.avif`。

**Animation choreography:** 卡牌按帧 FLIPS 并 SETTLES；猫句、牌义与行动按钮分层进入；牌面保持轻微呼吸浮动。技术：Remotion `interpolate()`、Bézier easing 和逐层 DOM 合成。

**Transition:** 13.30s 附近用扫光把大牌收进可分享结果卡。

**Depth:** BG 紫色日轮 + 纸纹；MG 魔术师牌；FG 猫句、强调笔刷、工具图标、信任 chip。

**SFX:** 8.10s 清亮揭牌落点。

## BEAT 4 — 从“像我”到“发给他”（13.30–16.80s）

**VO:** “下一步，是动一下。免下载，三十秒就能抽。”

**Concept:** 画面由单张牌变成一张能被带走的结果卡。左边是真实分享预览，右边把牌义压缩成一个微小行动；观众同时看见产品价值和传播理由。

**Visual:** React DOM 重建一张真正可分享的结果卡：魔术师缩略牌、猫句、微小行动、信任边界和 URL 都保持清晰。关系气泡写 `这句像你，也可能像正在犹豫的朋友`，唯一按钮改为 `发给那个正犹豫的朋友`。

**Mood:** 有用、轻松、可带走；像一张朋友发来的便签，不是促销页。

**Assets:** `the-magician.avif`；其余分享卡元素均为 Remotion DOM。

**Animation choreography:** 结果卡 DROPS 并 SETTLES；关系气泡随后 POPS；分享按钮最后出现并保持在平台安全区内。

**Transition:** 16.80s 附近扫光切回首幕同一张 hero，形成首尾闭环。

**Depth:** BG 斜向纸张分区；MG 手机与结果卡；FG 爪印、低风险标签和分享句。

**SFX:** `动一下` 一记柔和落点；分享箭头到达时一声轻快上扬 chime。

## BEAT 5 — 唯一入口（16.80–20.10s）

**VO:** “打开 MiaoTarot，让猫陪你换个角度看问题。”

**Concept:** 紫斗篷猫重新坐回桌前，前四个节拍的碎片在它面前归位成真正的网站入口。结尾不要求关注、评论、收藏和转发，只请观众开始一次 30 秒体验。

**Visual:** `miao-hero.jpg` 以猫脸和三张牌为视觉中心；上方固定 `MIAOTAROT`，主标题 `换个角度，看清问题`。价值链写 `写下困惑 → 抽一张猫 → 带走一步`；白色 CTA 写 `打开 MiaoTarot`，副行 `免下载 · 30 秒可玩`，可见 URL `tarot-31o.pages.dev`。愚者与星星原始牌从 CTA 后方露出。

**Mood:** 温暖、笃定、低风险；像猫把桌前的空位留给观众。

**Assets:** `miao-hero.jpg`, `the-fool.avif`, `the-star.avif`。

**Animation choreography:** hero 按帧 Ken Burns；标题、价值链、两张原始牌和 CTA 依次 SETTLE；最后保持完整品牌帧。所有运动由 Remotion 时间线驱动。

**Transition / end:** 这是最终场景，不再引入新转场；20.10s 停在完整 CTA，可在平台循环时直接接回三张牌开场。

**Depth:** BG hero 月光；MG 浏览器卡与边角牌；FG 品牌、标题、CTA、URL。

**SFX:** 17.87s 清亮落点；不使用真实猫叫以免抢旁白。

## Production architecture

```text
marketing/miaotarot-social-launch/
├── proposal.html
├── DESIGN.md
├── RESEARCH.md
├── SCRIPT.md
├── STORYBOARD.md
├── narration.txt
├── narration.wav
├── transcript.json
├── assets/
│   ├── site-hero.png
│   ├── site-flow.png
│   ├── site-share.png
│   └── sfx-*.wav
├── snapshots/
│   └── remotion-*.png
├── compositions/
│   └── beat-*.html
└── remotion/
    ├── src/
    │   ├── MiaoTarotLaunch.tsx
    │   ├── components.tsx
    │   └── scenes/
    ├── public/
    ├── scripts/verify-render.mjs
    └── out/miaotarot-launch-1080x1920.mp4
```
