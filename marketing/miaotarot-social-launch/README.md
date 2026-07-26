# MiaoTarot 短视频启动包

## 当前结论

获客主格式已经从通用的“选一张牌”改成：

> **怪问题先炸场 → 真实发疯模式 → 真牌义兜底 → 评论区续题**

第一条视频借 `#全宇宙最阴的物件` 结构，但不搬运原梗图，使用原创猫咪画面。现在保留两种成片：

- 18 秒传播剪辑：让怪问题和答案先跑。
- 39 秒产品解释版：在同一爆点后完整证明牌库、牌阵、抽牌、牌义、追问、历史和分享。

传播结构：

```text
生姜伪装成土豆接近我，到底图什么？
→ 真实 MiaoTarot 问题框与发疯模式
→ 月亮牌：幻象 / 不确定 / 别信第一眼
→ 它图的不是你，是你毫无防备的那一口。
→ 下一个最阴物件，猫先审谁？
```

## 可查看交付

- 最终产品解释版（39 秒、有声）：`remotion/out/miaotarot-product-tour-final-39s-1080x1920.mp4`
- 最终发布 V2（18 秒、增强有声）：`remotion/out/miaotarot-hot-meme-ginger-final-v2-18s-1080x1920.mp4`
- 产品解释版关键帧：`snapshots/product-tour/contact-sheet.png`
- 五帧复审：`snapshots/hot-hooks/pilot-contact-sheet.png`
- 生姜首帧：`snapshots/hot-hooks/ginger.png`
- 水龙头备选首帧：`snapshots/hot-hooks/faucet.png`
- 旧产品解释母版：`remotion/out/miaotarot-launch-1080x1920.mp4`

旧母版仍适合解释产品，但不要再把它当传播主创意。它的 `30 秒可玩` 与当前默认三牌、页面 `60 秒` 提示不一致。

## 文档索引

- `../../docs/miaotarot-short-video-growth-playbook.md`：已采用的传播方法、热点采集架构、真实运行验证、选题评分和发布复盘
- `RESEARCH.md`：近期热梗、用户心理、短视频方法、RAG / 问答库判断、可持续题库
- `SCRIPT.md`：18 秒传播版与 39 秒产品解释版旁白
- `STORYBOARD.md`：两种成片的逐秒分镜、产品露出与验收标准
- `DESIGN.md`：原有视觉语言
- `remotion/`：可复现的 Remotion 项目、素材和渲染脚本

## 重新渲染

```sh
cd marketing/miaotarot-social-launch/remotion
npm run lint
npm run generate:hot-beat
npm run render:hot-hook-ginger
npm run render:hot-hook-faucet
npm run render:hot-meme-final-v2
npm run test:hot-render:final-v2
npm run test:browser-playback:v2
npm run generate:product-tour-beat
npm run render:product-tour
npm run test:product-tour
npm run test:browser-playback:product-tour
```

## 这条试片验证什么

它不是“保证爆”的承诺，而是已经达到发布规格的验证样本。18 秒版验证爆点，39 秒版验证“爆点后能否完整看懂产品”。39 秒版实测为 39.02 秒、1080×1920、AVC + AAC、48kHz 双声道；整体约 −15.5 LUFS、真峰值约 −3.3 dBFS，没有超过 0.5 秒的无声段，Chromium 实播波形偏离静音中心 78。发布后重点看：

1. `选择观看 / 划走` 与 1 秒停留：问题有没有让人停。
2. 3 秒留存：产品露出有没有打断笑点。
3. 完播和重播：答案是不是第二个 punchline。
4. 评论率与有效续题数：格式能不能自己生产下一集。
5. 主页访问和开始抽牌率：观众有没有看懂这不是普通段子号。

正常模式与发疯模式继续作为产品仅有的两个顶层语气。闺蜜、哥们、尖酸、心理学、科学型先作为内容实验或内部 style card，不继续向移动端堆新按钮。
