# MiaoTarot 短视频启动包

这是一支 20.1 秒、9:16 的移动端营销视频原型，以及配套研究、脚本、分镜和可分享提案。

## 查看

- 打开 `proposal.html` 查看研究结论、完整脚本和五张实际渲染分镜。
- 在本目录运行 `npx hyperframes preview --port 3017`，然后打开 Studio 查看带旁白和音效的完整时间线。

## 验证

在仓库根目录运行：

```sh
npx playwright test --config marketing/miaotarot-social-launch/playwright.config.ts
```

在本目录运行：

```sh
npx hyperframes lint
```

## 内容索引

- `RESEARCH.md`：近期平台方法论与同类案例
- `SCRIPT.md`：旁白、屏幕文案、节奏与传播钩子
- `STORYBOARD.md`：五段分镜说明
- `DESIGN.md`：视觉与动效方向
- `index.html`：HyperFrames 主时间线
