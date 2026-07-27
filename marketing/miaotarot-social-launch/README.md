# MiaoTarot 短视频启动包

## 当前结论

获客主格式已经从通用的“选一张牌”改成：

> **怪问题先炸场 → 三连翻牌 → 双笑点 → 极短产品证明 → 评论区续题**

第一条视频借 `#全宇宙最阴的物件` 结构，但不搬运原梗图，使用原创猫咪画面。现在保留四种资产：

- 20.4 秒 Miao meme 主营销广告：Qwen 角色口播、真实猫叫打断、三连喵翻牌、双笑点、真实产品截图、评论续题。
- 15 秒电子节拍版：保留为历史声音对照，不再作为默认发布母版。
- 18 秒传播试验：保留用于节奏对照，不再作为默认投流母版。
- 39 秒产品解释版：完整证明牌库、牌阵、抽牌、牌义、追问、历史和分享；用于主页置顶、落地页或二跳解释。

传播结构：

```text
要不要约前任吃生姜刺身？
→ 月亮牌突然「哈？」
→ 真实发疯模式一闪而过
→ 月亮、高塔、愚人跟三连猫叫翻开
→ 可以。关系都这么僵了，正好蘸醋。
→ 月老：我只牵线，不腌姜。
→ 下一题抽评论区
```

## 可查看交付

- 最终主营销广告（20.4 秒、Qwen + 猫 meme 有声）：`remotion/out/miaotarot-miao-meme-ad-final-20s-1080x1920.mp4`
- 旧电子节拍广告（15 秒、历史对照）：`remotion/out/miaotarot-chaos-ad-final-15s-1080x1920.mp4`
- 最终产品解释版（39 秒、有声）：`remotion/out/miaotarot-product-tour-final-39s-1080x1920.mp4`
- 最终发布 V2（18 秒、增强有声）：`remotion/out/miaotarot-hot-meme-ginger-final-v2-18s-1080x1920.mp4`
- 主营销广告关键帧：`snapshots/miao-meme-ad/contact-sheet.png`
- 主营销广告音频波形：`snapshots/miao-meme-ad/audio-waveform.png`
- 产品解释版关键帧：`snapshots/product-tour/contact-sheet.png`
- 五帧复审：`snapshots/hot-hooks/pilot-contact-sheet.png`
- 生姜首帧：`snapshots/hot-hooks/ginger.png`
- 水龙头备选首帧：`snapshots/hot-hooks/faucet.png`
- 旧产品解释母版：`remotion/out/miaotarot-launch-1080x1920.mp4`

旧母版仍适合解释产品，但不要再把它当传播主创意。它的 `30 秒可玩` 与当前默认三牌、页面 `60 秒` 提示不一致。

## 文档索引

- `../../docs/miaotarot-short-video-growth-playbook.md`：已采用的传播方法、热点采集架构、真实运行验证、选题评分和发布复盘
- `RESEARCH.md`：近期热梗、用户心理、短视频方法、RAG / 问答库判断、可持续题库
- `SCRIPT.md`：20.4 秒主营销广告、历史 15 / 18 秒试验与 39 秒产品解释版旁白
- `STORYBOARD.md`：三种资产的逐秒分镜、产品露出与验收标准
- `DESIGN.md`：原有视觉语言
- `remotion/`：可复现的 Remotion 项目、素材和渲染脚本

## 重新渲染

```sh
cd marketing/miaotarot-social-launch/remotion
npm run lint
npm run generate:qwen-tts
npm run prepare:miao-meme-audio
npm run render:miao-meme-ad
npm run test:miao-meme-ad
npm run test:browser-playback:miao-meme-ad
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
npm run generate:chaos-ad-beat
npm run render:chaos-ad
npm run test:chaos-ad
npm run test:browser-playback:chaos-ad
```

## 这条试片验证什么

它不是“保证爆”的承诺，而是已经达到发布规格的验证样本。20.4 秒版验证停留、笑点、评论与主页访问；39 秒版只验证“能否完整看懂产品”。主版实测为 20.50 秒、1080×1920、H.264 + AAC、48kHz 双声道；整体约 −14.7 LUFS、真峰值约 −2.2 dBFS，Chromium 实播波形偏离静音中心 50。口播由百炼 `qwen3-tts-instruct-flash` 的 `Momo` 音色生成；猫叫与呼噜来自公共领域录音。发布后重点看：

1. `选择观看 / 划走` 与 1 秒停留：问题有没有让人停。
2. 3 秒留存：产品露出有没有打断笑点。
3. 完播和重播：答案是不是第二个 punchline。
4. 评论率与有效续题数：格式能不能自己生产下一集。
5. 主页访问和开始抽牌率：观众有没有看懂这不是普通段子号。

正常模式与发疯模式继续作为产品仅有的两个顶层语气。闺蜜、哥们、尖酸、心理学、科学型先作为内容实验或内部 style card，不继续向移动端堆新按钮。
