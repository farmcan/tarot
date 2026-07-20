# MiaoTarot

MiaoTarot 是一个移动优先的猫咪塔罗体验：标准塔罗提供结构，猫咪状态提供情绪入口，用户亲手选牌并获得非宿命化的解释与小行动。

产品不依赖 AI 才能完成阅读。AI 只通过服务端解释已经抽出的牌，不决定牌面，也不替代医疗、法律、财务或危机支持。

## 当前能力

- `classic-major`：兼容原有分享语义的 22 张大阿卡纳。
- `doodle-full`：完整 78 张猫咪涂鸦内容包。
- 一到五张牌的洗牌、选择、放置、逐张翻牌和正逆位。
- 今日主题、本地历史、可恢复分享链接、PNG 海报与 QR code。
- Cloudflare Pages Functions 上的可选 LLM 解读、D1 公开计数和 Analytics Engine 匿名产品事件。
- 手机优先的 Playwright 路径与完整发布验证门。

## 仓库入口

| 路径 | 内容 |
| --- | --- |
| `site/` | Vite + React 源码和公开静态资产 |
| `functions/` | Cloudflare Pages Functions |
| `shared/` | 浏览器、Functions 与脚本共享契约 |
| `references/` | PNG 母版、来源图与 provenance manifests |
| `scripts/` | 导出、优化、测试、验证与 smoke |
| `docs/generated/` | JSON、HTML 和 contact sheets 等生成产物，不是手写文档 |
| `v1/` | 构建后的 Cloudflare Pages 静态目录 |

项目的主题文档包括：

- [产品与验证方向](docs/product.md)：定位、用户旅程、指标、路线和收入假设。
- [工程手册](docs/engineering.md)：架构、内容包、开发、数据、测试与 Cloudflare 发布。
- [图片生成与资产契约](docs/image-generation-contract.md)：卡牌规格、来源授权、prompt、生产与验收。
- [创作者支持入口](docs/creator-support-ux.md)：支持入口的案例依据、体验顺序和信任边界。
- [LLM 交互与上线架构](docs/llm-interaction.md)：Qwen prompt、多轮契约、隐私边界和 Cloudflare 多用户方案。

`AGENTS.md` 是仓库级 agent 工作约束，不是产品说明。阶段性计划、调研过程和图片试验不再各建 Markdown；短期过程进入 issue/PR，机器结果进入生成产物。

## 本地开发

```bash
npm ci
npm run dev
```

常用验证：

```bash
npm run typecheck
npm run build
npm run test:e2e
npm run verify:content
```

完整发布门：

```bash
npm run verify:launch
npm run smoke:llm:local
```

`verify:launch` 会重新导出内容记录、类型检查、构建 `v1/`，并验证图片、provenance、Cloudflare Pages 行为、Functions、阅读状态、内容包和移动端 E2E。

## 图片生产

所有新图和主动重做的母版必须是原生 portrait `5:7`，推荐 `1020x1428` PNG。开始前先读 [图片生成与资产契约](docs/image-generation-contract.md)。

```bash
npm run export:art-prompts
npm run export:minor-art-prompts
npm run optimize:assets
npm run optimize:doodle-pack
npm run review:art-sheets
npm run verify:content
```

导出的 JSON record 包含 prompt、参考和目标 `outputPath`；批准的 PNG 写入目标路径后，才可以生成浏览器使用的 AVIF。

## Cloudflare Pages

生产静态目录是 `v1/`，路由和响应头来自 `site/public/_redirects` 与 `site/public/_headers`。

```bash
npm run pages:dev
npm run deploy
```

首次部署还需要创建并迁移 D1 公开计数、设置服务端 `LLM_API_KEY`，以及确认 `MIAOTAROT_ANALYTICS` binding。完整配置见 [工程手册](docs/engineering.md#cloudflare-pages-发布)。

部署后：

```bash
TAROT_PRODUCTION_ORIGIN="https://your-domain.example" npm run smoke:production
TAROT_LLM_ENDPOINT="https://your-domain.example/api/readings/analyze" npm run smoke:llm
```

生产 smoke 检查当前构建、AVIF、Pages Functions、D1 公开计数、Analytics Engine 产品事件和可选 LLM；LLM smoke 要求返回非空内容和符合共享契约的结构化 JSON。
