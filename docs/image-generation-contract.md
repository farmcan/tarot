# MiaoTarot 图片生成与资产契约

更新时间：2026-07-20

这是卡牌图片生成、编辑、来源审查、优化和验收的唯一规范。AI agent 与人工生产在操作卡牌图片前都必须完整阅读本页。历史试验文档已经合并或删除；旧产物只代表试验记录，不能覆盖这里的当前规则。

## 强制输出规格

| 字段 | 要求 |
| --- | --- |
| 方向 | portrait |
| 比例 | 精确 `5:7` |
| 推荐母版 | `1020x1428` PNG |
| 画面 | full-bleed；不生成卡框 |
| 文字 | 不得含标题、字母、数字、字幕、签名、水印或 logo |
| safe area | 主猫、脸、爪、梗动作和必要塔罗符号位于中央安全区 |

`1020x1428` 是精确 `5:7`。工具支持 width、height、canvas 或 aspect-ratio 时必须显式设置，不能只在 prompt 中描述。允许更大的精确倍数；不允许把 `1254x1254`、`1:1` 或 square 作为新图起点，再依赖裁切、拉伸或 outpaint 修补。

若工具只有相近 portrait preset，选择最接近的竖幅画布，并在四周预留背景。最终批准母版可做一次安全的居中 `5:7` 裁切，但不得切掉脸、爪、梗动作或核心符号。

每个 active prompt 必须包含同等约束：

```text
Output: native portrait 5:7 full-bleed card artwork, preferably 1020x1428 pixels.
Compose for the tall canvas from the start; never generate a square composition for later cropping, stretching, or outpainting.
No printed card border, title, letters, numbers, watermark, or logo.
Keep the main cat, face, paws, meme action, and essential Tarot symbols inside the central safe area.
```

## 当前艺术方向

MiaoTarot 保留 Rider-Waite-Smith 风格的牌义骨架，但成品必须首先读成一个具体猫咪状态：

```text
approved meme behavior or original cat scene
+ 2–4 restrained Tarot anchors
+ card-specific emotional state
+ one coherent production style
```

判断顺序是：先看懂猫的表情/动作，再发现塔罗象征。不要复制 Rider-Waite 构图，也不要把随机可爱猫、华丽神秘装饰或通用 AI 插画误当成品牌风格。

默认要求：

- 主体是清晰、情绪可读的家猫；品种设定存在时必须可辨认。
- 只保留 2–4 个最重要的牌面锚点；数字牌的花色物件数量必须准确且可数。
- 在手机卡片尺寸下，脸、轮廓、动作和主要符号仍然清楚。
- 正位和逆位共用同一母版；应用层负责旋转，不为逆位另画一张。
- 页面提供外框、标签和牌名，图片内部不重复这些 UI。

`miao-decadent-expression-img2img-v1` 是已锁定的 reference-driven doodle 试验模式，基准产物位于 `artifacts/reference-doodle-pilot/the-hermit-style-pilot-v3.png`。它可以用于后续卡牌，但不是自动生效的整套生产风格；批量采用前必须先通过小样评审。

该模式的关键约束：母图锁定脸、姿势、视角和主体关系；风格参考只提供粗糙线条与纸张质感；塔罗新增元素不超过约 15% 的视觉注意力。不得把猫修成对称、圆润、毛绒吉祥物，也不得因塔罗符号破坏原有梗动作。

## 来源与授权

第三方图只能进入以下两条路径之一：

- **research-only**：用于私下理解某种梗或表情，不进入生产编辑、不复制到公开资产。
- **production candidate**：拥有明确来源、作者、允许商业改编的 license 或书面许可，并完成逐图评审。

知名 meme 的 owner-posted 媒体不等于商业改编授权。带水印的图片可以用于私下研究，但不得作为生产 edit target，也不得通过生成或修图移除水印。

机器可读来源是唯一 registry：

- `references/miao-famous-memes/manifest.json`：知名 meme 的 research-only 索引；下载进入被忽略的 `.cache/miao-famous-memes/`。
- `references/miao-source-candidates/manifest.json`：已下载候选的来源、作者、license、尺寸、SHA-256 与视觉决策。

候选记录至少包含：

```text
direct source page / creator / license URL / downloaded asset URL
retrieval date / dimensions / SHA-256 / card mapping / visual decision
derivative and attribution requirements
```

允许的生产状态是 `verified-meme-source` 或 `verified-legal-fallback`。legal fallback 可以证明流程，但若不是可识别 meme，就不能冒充产品的 meme-native 方向。`CC BY` 必须署名并注明修改；`CC BY-SA` 的衍生物必须使用兼容的同方式共享许可。未经侧对侧审查，不得把 `references/` 中的源图或变体复制进 `site/public/`。

## 文件与 source of truth

| 内容 | 路径 |
| --- | --- |
| Major Arcana 文案与情绪状态 | `site/src/domain/miaoTarot.ts` |
| Major art direction、meme base 与符号 | `site/src/domain/miaoArt.ts` |
| Minor 场景与花色/数字语法 | `site/src/domain/miaoMinorArcana.ts` |
| 内容包猫种、覆盖与图片路径 | `site/src/content-packs/` |
| Major prompt records | `docs/generated/miao-art-prompts.json` |
| Minor prompt records | `docs/generated/miao-minor-art-prompts.json` |
| 可编辑 doodle PNG 母版 | `references/miao-pack-masters/doodle/<tarot-id>.png` |
| 线上 doodle AVIF | `site/public/assets/miao-packs/doodle/<tarot-id>.avif` |
| legacy Major AVIF | `site/public/assets/miao-cards/<tarot-id>.avif` |
| contact sheets 与试验图 | `docs/generated/` 和 `artifacts/` |

JSON prompt records 是生成任务记录；Markdown 副本不再生成。`docs/generated/` 中的图片、HTML 和 JSON 是可再生成或评审产物，不是新的手写文档。

## Prompt 公式

Prompt 必须由结构化数据与批准参考组合，不从历史试验文字中复制过时的方形 canvas 规则。推荐顺序：

```text
use case and asset type
input image roles, if image-to-image
source identity invariants and edit budget
primary request and card identity
face and body / meme behavior
Tarot anchors or exact suit-symbol count
style, medium, palette, and mood
composition and central safe area
native 5:7 output contract
constraints and avoid list
```

image-to-image 时应明确 Image 1 是 edit target，并分别说明其他参考只负责表情或媒介。常规参考组合最多为：一张批准母图、一张可选表情参考、最多三张有授权的风格参考。保持母图身份与构图的优先级高于风格转换，Tarot delta 保持克制。

Major prompt 还必须包含：

- meme base 路径、行为锚点和 Tarot fusion rule；
- 2–5 个标准符号参考；
- “original transformed design / not traced” 的明确约束。

Minor 数字牌必须在整张图中只出现指定数量的花色物件，不在背景、边框、衣物或纹样中重复同形符号。宫廷牌以 Page/ Knight/ Queen/ King 的学习、追逐、内在掌控、外在责任为戏剧功能。

## 生成工作流

1. **确认内容。** 检查 Tarot id、内容包、猫咪状态、正逆位共用规则与目标风格。
2. **批准来源。** 对 reference-driven 任务核对 manifest、license、checksum 和母图的行为匹配；research-only 不能进入生产。
3. **导出记录。** 运行 prompt export，并使用对应 JSON record 的 prompt、reference 与 `outputPath`。
4. **原生竖幅生成。** 在工具参数中设置 `5:7` 和 `1020x1428`；一张卡一次调用，不做整套无差别 batch。
5. **侧对侧评审。** 同时查看参考、全尺寸输出、手机卡片尺寸和 responsive crop；核对脸、爪、动作、符号数量与授权边界。
6. **保存母版。** 只有批准的 PNG 才能写入 record 的 `outputPath`。生成工具的临时输出和失败图留在 `artifacts/`，不能直接成为生产资产。
7. **优化与验证。** 生成 AVIF、contact sheet，并运行内容和完整发布门。

```bash
npm run export:art-prompts
npm run export:minor-art-prompts

npm run optimize:assets       # legacy Major pack
npm run optimize:doodle-pack  # 78-card doodle pack
npm run review:art-sheets
npm run verify:content
npm run verify:launch
```

`npm run prepare:meme-bases` 从本地参考准备 Major 候选；`npm run fetch:famous-memes` 只把 manifest 中的 research-only 媒体下载到 ignored cache，不会授予生产许可。

## 验收标准

每张图必须同时通过：

- **规格**：精确 `5:7`、推荐 `1020x1428`、full-bleed、没有生成卡框或文字。
- **可读性**：360px 宽仍能看清主猫的脸、姿势和核心象征；responsive crop 不丢信息。
- **牌义**：2–4 个锚点自然融入猫的动作；数字牌符号准确可数。
- **猫咪状态**：不看标题也能感到对应情绪；不是通用可爱猫或同一姿势换道具。
- **一致性**：线条、纸张、颜色和视觉密度属于同一内容包，但不牺牲每张牌的独特动作。
- **技术**：没有多余肢体、坏爪、重复主体、脏文字、watermark、logo、裁切或明显生成瑕疵。
- **来源**：所有生产参考可追溯，许可与署名义务已记录并能在产品中履行。

直接拒绝以下输出：

- 方形生成后强行裁成竖图；
- 猫脸、爪或主要符号落在易裁边缘；
- 画面很精致但情绪通用，或很像 Tarot 却不像目标猫咪状态；
- 为了“修好”而改变母图的脸、视角、姿势或关键物体关系；
- 抄近 Rider-Waite、meme 原图或风格参考的完整构图；
- 含第三方文字、签名、水印或来源不明的可识别元素。

## 当前评审结论

- 现有 22 张 legacy Major 图片可作为第一版兼容资产；遗留 `1254x1254` 母版可以暂时存在，但任何主动重做都必须迁到本契约的 `5:7`。
- `doodle-full` 已有 78 张 portrait 母版与线上 AVIF；后续替换仍按单张 revision 和完整验证门推进。
- 现有 calibration/contact sheets 是方法研究，不代表其来源、风格或尺寸已经获得生产批准。
- reference-driven doodle 模式需要逐卡批准母图，不允许把一组未审来源和通用 prompt 一次性铺满整副牌。

完成评审后，只有 `references/` 中批准母版、`site/public/` 中优化交付物、源码映射和 JSON prompt record 共同一致，才算一张卡真正上线。
