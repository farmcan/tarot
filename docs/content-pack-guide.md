# MiaoTarot 内容包指南

内容包是 MiaoTarot 的轻量插件层。传统 78 张牌的数据、抽牌、牌阵、分享和 AI 解读属于公共运行时；每套内容包只声明牌池范围，以及需要覆盖的猫咪设定、文案和图片。

## 目录约定

```text
site/src/content-packs/
  types.ts             # 内容包契约与 defineMiaoContentPack
  classicMajor.ts      # 经典 22 张兼容包
  doodleFull.ts        # 涂鸦 78 张示例包
site/public/assets/miao-packs/<pack-id>/
  <tarot-id>.avif      # 浏览器使用的图片，可只提供部分
references/miao-pack-masters/<pack-id>/
  <tarot-id>.png       # 可继续编辑的母版
site/src/domain/miaoContentPacks.ts
  # 注册表、继承解析与 22/78 张牌池解析
```

## 新增一套牌

1. 在 `site/src/content-packs/` 新建一个模块并调用 `defineMiaoContentPack`。
2. 选择 `scope: 'major'`（22 张）或 `scope: 'full'`（78 张）。
3. 如果只是新画风，设置 `fallbackPackId` 继承已有文案和图片。
4. 在 `cards` 中按 Tarot id 填写 `breed`、`image` 或 `copy`；三个字段都可独立省略。
5. 把模块加入 `miaoContentPacks.ts` 的注册表。
6. 运行 `npm run verify:launch`。

最小示例：

```ts
import { defineMiaoContentPack } from './types';

export const chalkPack = defineMiaoContentPack({
  id: 'chalk-major',
  version: '1.0.0',
  name: '粉笔猫塔罗',
  shortName: '粉笔 22 张',
  description: '黑板粉笔质感的大阿卡纳。',
  scope: 'major',
  artStyle: '粗颗粒彩色粉笔线条',
  fallbackPackId: 'classic-major',
  cards: {
    'the-fool': {
      breed: '流浪田园黑猫',
      image: './assets/miao-packs/chalk-major/the-fool.avif',
      copy: { memeCaption: '先迈出去，粉笔灰稍后再拍。' },
    },
  },
});
```

## 回退与兼容

- 图片可以逐张上线；未提供图片时先继承父内容包，大/小阿卡纳都没有自定义图时再使用标准牌图。
- 文案是字段级合并，不需要复制整张牌的数据。
- 分享链接保存 `pack` id；没有 `pack` 的旧链接固定按 `classic-major` 重建。
- `doodle-full` 使用标准 78 张牌池：22 张大阿卡纳 + 56 张小阿卡纳。小阿卡纳文案由花色语法、数字/宫廷牌语法和标准塔罗牌义共同组成。
- 猫咪品种与牌意的对应是娱乐向视觉设定，不作为真实动物行为结论。
