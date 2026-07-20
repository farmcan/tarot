# MiaoTarot「两秒选一张猫」分镜

**Format:** 1080×1920, 30fps, 20.10s, mobile-safe 9:16

**Audio:** Tingting 普通话旁白 + 自制轻触 / 翻牌 / 清亮落点 SFX；首版不加入有版权风险的配乐

**VO direction:** 年轻朋友递来三张牌的语气；开场敏捷，揭牌后留白，拒绝神秘预言腔

**Style basis:** `DESIGN.md`；明亮纸张、真实猫牌、Miao violet 识别色

**Primary transition:** 0.36–0.42s gentle blur crossfade；揭牌用 CSS 3D flip 作为唯一高能强调

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
| `assets/site-hero.png` | Product screenshot | 5 | CTA 后的真实落地页证明 |
| `assets/site-flow.png` | Product screenshot | 2 | 真实提问 / 牌数 / 牌组流程，装进手机窗口 |
| `assets/site-share.png` | Product screenshot | 4 | 真实分享卡与二维码能力证明 |
| `site/public/assets/miao-packs/doodle/the-magician.avif` | Card master | 2, 3, 4 | 主结果牌；翻牌和结果卡 |
| `site/public/assets/miao-packs/doodle/the-high-priestess.avif` | Card master | 1, 2 | 左侧选择与安静观察气质 |
| `site/public/assets/miao-packs/doodle/the-fool.avif` | Card master | 1, 2, 5 | 选择与品牌牌组多样性 |
| `site/public/assets/miao-packs/doodle/the-star.avif` | Card master | 1, 5 | 选择与结尾牌阵 |
| `site/public/assets/miao-packs/doodle/the-world.avif` | Card master | SKIP | 画面信息量偏高，20 秒母版不再加新焦点 |
| `site/public/assets/miao-packs/doodle/ace-of-wands.avif` | Card master | SKIP | 适合后续行动主题变体，不进入主版 |
| `site/public/assets/miao-packs/doodle/ace-of-cups.avif` | Card master | SKIP | 适合后续关系主题变体，不进入主版 |
| `site/public/assets/favicon.svg` | Brand mark | 1, 5 | 首尾 MiaoTarot 标记 |

利用率：3/4 个网站滚动截图（75%）和唯一 hero 图（100%）进入成片；品牌标记首尾出现；主牌素材在选择、揭示、分享三个阶段连续复现。

## BEAT 1 — 观众已经在选（0.00–3.86s）

**VO:** “给你两秒。左、中、右，选一张猫。”

**Concept:** 视频一打开，三张真实猫牌已经向观众扑到手边。它像一次很短的街头互动，不像广告：观众先做一个选择，品牌只在角落轻声报到。画面要让人本能地在左、中、右之间移动视线。

**Visual:** 温暖纸张底上，`miao-hero.jpg` 作为宽幅月光记忆层缓慢推近；前景三张 5:7 卡从下方错峰落桌，左为女祭司、中为魔术师、右为星星，起始以紫色卡背遮住。上方粗体标题 `给你 2 秒` 首先落下，随后 `左 / 中 / 右` 三个数字标记依次点亮。右上是 favicon + `MiaoTarot`。一条手绘紫色路径从标题穿过三张牌，三枚小爪印沿路径追逐；右侧细小倒计时从 `2` 收到 `1`。

**Mood:** 俏皮但不幼稚；像一本会动的猫咪绘本和一局真正的桌面抽牌。

**Assets:** `miao-hero.jpg`, `the-high-priestess.avif`, `the-magician.avif`, `the-star.avif`, `favicon.svg`。

**Animation choreography:** 标题 STAMPS 下来（`back.out(1.4)`）；三张卡 CASCADE 落桌并有不同的轻微旋角；SVG 路径 DRAWS；数字 marker POPS；背景图 Ken Burns 1→1.035；中牌在 3.2s PULSES 一次。技术：CSS 3D、SVG path drawing、逐词动效。

**Transition:** 3.52s 开始 0.34s blur crossfade；不提前退出元素，入场的 Beat 2 覆盖完成交接。

**Depth:** BG hero 月光 + 纸纹；MG 三张牌；FG 标题、数字、爪印和品牌标记。

**SFX:** 0.18s 轻触落桌；每个数字是不同音高的纸面点按。

## BEAT 2 — 选择变成真实流程（3.86–6.83s）

**VO:** “选中间？翻开。魔术师说——”

**Concept:** 观众的选择被“接进”真实网站。中牌向镜头靠近，背后不是虚构的占卜星空，而是 MiaoTarot 的真实提问和设置界面；可信度在揭牌前完成。

**Visual:** `site-flow.png` 装在一台竖向手机窗口中，从右侧滑入并缓慢向上滚动；问题芯片 `工作上真正影响推进的因素是什么？` 由字符逐段打出。三张小牌绕手机形成前后景，中间魔术师的紫色选择环 FILLS 一圈。一个 44px 的 `中` 标签从卡背弹到手机界面内，成为点击光标。左下出现 `真实问题 · 3 张牌 · 包含逆位` 三枚 UI chip。

**Mood:** 从游戏感切入产品感，干净、具体、有触感；像在朋友手机上看见真实操作。

**Assets:** `assets/site-flow.png`, `the-high-priestess.avif`, `the-magician.avif`, `the-fool.avif`。

**Animation choreography:** 手机 SLIDES 并轻微 perspective settle；页面截图 PANS；问题 TYPES；三张小牌 ORBIT（固定轨迹，不随机）；选择环 DRAWS；`翻开` 文字 PUNCHES 到屏幕中央。技术：字符打字、CSS 3D、SVG path drawing。

**Transition:** 6.47s 开始 0.36s gentle blur crossfade；入场牌面同时启动 3D 翻转，形成视觉高潮。

**Depth:** BG lilac 光晕与巨大的半透明 `M`；MG 手机截图；FG 小牌、选择环、问题芯片。

**SFX:** 4.91s 点按；6.48s 纸牌穿风声起。

## BEAT 3 — 猫句先命中（6.83–11.70s）

**VO:** “办法不是没有，是还没伸爪。你手上的工具已经够了。”

**Concept:** 魔术师牌从侧面完成翻转，像真正被揭开。观众先得到一句有记忆点的猫句，然后才看到牌名和含义；这既是情绪回报，也是可截图、可转发的传播单元。

**Visual:** 魔术师牌占据画面 54% 高度，保持完整 5:7；牌后是 Miao violet 放射圆和手绘短线，左上 `魔术师 · 创造力`，右侧竖排 `I`。猫句分三组在牌两侧按旁白节奏落下，`伸爪` 用 teal 笔刷底强调。三枚工具图形（小灯泡、笔、箭头）围着卡的桌面元素漂浮，底部信任 chip `轻量自我观察 · 不预测命运` 出现。

**Mood:** 这是成片最“哇”的瞬间，但依旧明亮可信；力量来自真实插画和语言，不来自黑金神秘特效。

**Assets:** `the-magician.avif`。

**Animation choreography:** 卡牌 FLIPS `rotationY:-92→0` 并 SETTLES；紫色圆 EXPANDS；放射线 DRAWS；猫句按音节 CASCADES；`伸爪` marker SWEEPS；工具图标沿固定 MotionPath FLOATS；牌面本身缓慢 1→1.025。技术：CSS 3D、逐词动效、SVG 路径 / MotionPath。

**Transition:** 11.32s 开始 0.38s focus-pull crossfade，焦点从牌面转向结果文字与分享动作。

**Depth:** BG 紫色日轮 + 纸纹；MG 魔术师牌；FG 猫句、强调笔刷、工具图标、信任 chip。

**SFX:** 6.83s 翻牌脆响；`伸爪` 落下时一记短促木鱼 / 指尖敲桌声。

## BEAT 4 — 从“像我”到“发给他”（11.70–16.35s）

**VO:** “下一步，是动一下。免下载，三十秒就能抽。”

**Concept:** 画面由单张牌变成一张能被带走的结果卡。左边是真实分享预览，右边把牌义压缩成一个微小行动；观众同时看见产品价值和传播理由。

**Visual:** `site-share.png` 被裁进倾斜的手机相框，从左下进入；右侧白色结果卡写 `下一步`，teal 大字 `动一下`，下面是网站原句 `关键是把想法变成动作。` 一条紫色爪印路径从魔术师缩略牌走向分享箭头。顶部出现 `可以自己留着，也可以发给朋友`；底部传播提示 `发给那个还在等“更好时机”的人`。小标签依次亮起 `免下载`、`30 秒`、`可分享`。

**Mood:** 有用、轻松、可带走；像一张朋友发来的便签，不是促销页。

**Assets:** `assets/site-share.png`, `the-magician.avif`。

**Animation choreography:** 手机 DROPS 并轻轻 SETTLES；结果卡 SLIDES；`动一下` 用 per-word PUNCH；爪印路径 DRAWS；三个低风险标签 COUNTS / FILLS；分享箭头沿曲线 TRAVELS；截图内部慢推 1→1.03。技术：逐词动效、SVG path drawing、MotionPath。

**Transition:** 15.95s 开始 0.40s warm blur crossfade；结果卡保持可读直到 Hero 观察员覆盖。

**Depth:** BG 斜向纸张分区；MG 手机与结果卡；FG 爪印、低风险标签和分享句。

**SFX:** `动一下` 一记柔和落点；分享箭头到达时一声轻快上扬 chime。

## BEAT 5 — 唯一入口（16.35–20.10s）

**VO:** “打开 MiaoTarot，让猫陪你换个角度看问题。”

**Concept:** 紫斗篷猫重新坐回桌前，前四个节拍的碎片在它面前归位成真正的网站入口。结尾不要求关注、评论、收藏和转发，只请观众开始一次 30 秒体验。

**Visual:** `miao-hero.jpg` 以猫脸和三张牌为视觉中心，底部由白纸雾化过渡到完整画面；上方 favicon + `MiaoTarot`，主标题 `换个角度，看清问题`。紫色 CTA pill 写 `打开 MiaoTarot`，副行 `免下载 · 30 秒可玩`，可见 URL `tarot-31o.pages.dev`。`site-hero.png` 作为一张小型倾斜浏览器卡从 CTA 后方露出，证明点击后的真实页面；四张牌边角从四周形成轻微视差。

**Mood:** 温暖、笃定、低风险；像猫把桌前的空位留给观众。

**Assets:** `miao-hero.jpg`, `assets/site-hero.png`, `the-fool.avif`, `the-star.avif`, `the-high-priestess.avif`, `favicon.svg`。

**Animation choreography:** hero REVEALS 并 Ken Burns；品牌标记 DRAWS / FADES；标题逐词 SETTLES；CTA FILLS 并在旁白说到品牌时 PULSES 一次；浏览器卡 PEEKS；四张边角牌轻微 PARALLAX；最后 0.2s 保持完整品牌帧。技术：逐词动效、SVG path drawing、CSS 3D / parallax。

**Transition / end:** 这是最终场景，不再引入新转场；20.10s 停在完整 CTA，可在平台循环时直接接回三张牌开场。

**Depth:** BG hero 月光；MG 浏览器卡与边角牌；FG 品牌、标题、CTA、URL。

**SFX:** 16.35s 清亮落点；CTA pulse 是一声极轻的猫铃，不使用真实猫叫以免抢旁白。

## Production architecture

```text
marketing/miaotarot-social-launch/
├── index.html
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
└── compositions/
    ├── beat-1-choice.html
    ├── beat-2-proof.html
    ├── beat-3-reveal.html
    ├── beat-4-share.html
    └── beat-5-cta.html
```
