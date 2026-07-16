# MiaoTarot 内容架构

MiaoTarot 把一张猫牌视为一个不可拆散的内容包，而不是“图片 + 几段碰巧同名的文案”。每个包包含猫牌文案、传统塔罗映射、梗图来源、洗图方向和最终线上图片。

## 版本层级

- `MIAO_CONTENT_EDITION`：整套牌的兼容版本。现有接口继续读取它，不因单张牌更新而失效。
- `MIAO_CONTENT_SCHEMA_VERSION`：内容包的数据结构版本。只有字段契约变化时才递增。
- `miaoContentRevisions[tarotId]`：单张牌的独立内容版本。图片、梗图 base 或描述发生有意义的变化时递增。

## 单张牌更新流程

1. 在 `references/miao-meme-bases/` 确认原始梗图姿态和表情锚点。
2. 同步修改 `miaoTarot.ts` 的猫牌文案与 `miaoArt.ts` 的生成方向。
3. 将批准的 PNG 母版放进 `references/miao-card-masters/`。
4. 运行 `npm run optimize:assets`，生成同名 AVIF 到 `site/public/assets/miao-cards/`，供网站加载。
5. 递增该牌在 `miaoContentRevisions` 中的版本号。
6. 运行 `npm run verify:launch`，检查 22 张牌、母版、线上图、prompt 和内容版本是否一致。

## 兼容原则

- 已有 `edition`、`copy` 和 `art` 字段保持不变，新元数据只做加法。
- 页面只通过 `getMiaoContentBundle(tarotId)` 读取成品，避免图片和文案各自散落引用。
- PNG 是可继续洗图的母版，AVIF 是线上交付物；生产构建不再携带 47MB 的母版。
- 分享记录后续应保存 `edition + schemaVersion + tarotId + revision`，以便旧结果可以按原版本解释或明确提示内容已更新。

## 78 张扩展边界

- `major-arcana-v1` 继续代表当前可玩的 22 张大阿卡纳，不改 id、不扩容。
- `miaoMinorArcana.ts` 提供独立的 `minor-arcana-concept-v1`，包含四个花色各 14 张的图文概念，不自动进入抽牌池。
- 每张小阿卡纳概念同时绑定数字语法、猫场景、正逆位钩子和候选 Meme 家族，避免图片与文案各自生长。
- 只有一个完整花色完成母图许可、洗图、文案和移动端 review 后，才创建新的 full-deck edition；旧分享结果继续按 22 张版本重放。
