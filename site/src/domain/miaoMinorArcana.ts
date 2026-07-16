export const MIAO_MINOR_CONTENT_EDITION = 'minor-arcana-concept-v1' as const;

export type MiaoMinorSuit = 'cups' | 'pentacles' | 'swords' | 'wands';
export type MiaoMinorRank =
  | 'ace' | 'two' | 'three' | 'four' | 'five' | 'six' | 'seven'
  | 'eight' | 'nine' | 'ten' | 'page' | 'knight' | 'queen' | 'king';

export interface MiaoMinorCardConcept {
  tarotId: string;
  suit: MiaoMinorSuit;
  rank: MiaoMinorRank;
  sequence: number;
  miaoName: string;
  scene: string;
  uprightHook: string;
  reversedHook: string;
  memeFamilies: readonly string[];
  revision: string;
}

interface RankGrammar {
  rank: MiaoMinorRank;
  upright: string;
  reversed: string;
}

interface SuitGrammar {
  domain: string;
  objectFamily: string;
}

type SceneSeed = readonly [miaoName: string, scene: string, ...memeFamilies: string[]];

export const miaoMinorRankOrder: readonly MiaoMinorRank[] = [
  'ace', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'page', 'knight', 'queen', 'king',
];

const rankGrammar: readonly RankGrammar[] = [
  { rank: 'ace', upright: '一颗种子已经出现，先接住最真实的机会。', reversed: '机会没有消失，只是入口被犹豫堵住了。' },
  { rank: 'two', upright: '两股力量需要选择、配合或重新平衡。', reversed: '僵持太久，先承认你真正偏向哪边。' },
  { rank: 'three', upright: '事情开始生长，协作会让结果超过单打独斗。', reversed: '看起来一起忙，不等于真的在合作。' },
  { rank: 'four', upright: '稳定与暂停都需要，先守住能恢复你的空间。', reversed: '安全感抓得太紧，稳定就会变成停滞。' },
  { rank: 'five', upright: '扰动和不足已经发生，先承认损失再找余地。', reversed: '最乱的部分开始过去，可以转向修复。' },
  { rank: 'six', upright: '局面进入恢复、交换或被看见的阶段。', reversed: '帮助若带着旧账，恢复就会走得很慢。' },
  { rank: 'seven', upright: '选项和考验变多，需要策略而不是乱拍。', reversed: '幻想正在散场，真正的选择反而清楚了。' },
  { rank: 'eight', upright: '重复与运动正在加速，抓住节奏就会形成能力。', reversed: '忙成循环却没有前进，先松开一个卡点。' },
  { rank: 'nine', upright: '事情接近完成，享受成果也要保护最后的体力。', reversed: '已经很接近，却被焦虑或过度防守拖住。' },
  { rank: 'ten', upright: '能量走到完整或满载，结果与代价同时出现。', reversed: '该结束的还在续杯，放下一部分才能翻篇。' },
  { rank: 'page', upright: '保持小猫式好奇，消息与学习正在敲门。', reversed: '新鲜感很多，验证和基本功还没跟上。' },
  { rank: 'knight', upright: '行动能量已经上马，明确方向后就去追。', reversed: '冲得很快，但承诺、路线或刹车还没准备好。' },
  { rank: 'queen', upright: '这股能量已经内化，你能稳住氛围并照顾细节。', reversed: '照顾或掌控向内塌缩，先把自己放回画面。' },
  { rank: 'king', upright: '成熟意味着定规则，也愿意承担规则的后果。', reversed: '能力变成控制时，再正确也会让关系缺氧。' },
];

const suitGrammar: Record<MiaoMinorSuit, SuitGrammar> = {
  cups: { domain: '感受、关系、依恋与直觉', objectFamily: '水碗、杯子与柔软窝' },
  pentacles: { domain: '工作、金钱、身体与日常', objectFamily: '冻干、罐头、纸箱与键盘' },
  swords: { domain: '思考、判断、冲突与焦虑', objectFamily: '门缝、爪痕、锐利光影与通知' },
  wands: { domain: '行动、欲望、创造与竞争', objectFamily: '逗猫棒、抓柱、红点与跑酷路线' },
};

const sceneSeeds: Record<MiaoMinorSuit, readonly SceneSeed[]> = {
  cups: [
    ['第一口活水猫', '猫第一次接住水龙头落下的水滴', 'Happy Cat'],
    ['两碗并排贴贴猫', '两只猫隔着并排水碗互相慢眨眼', 'Smudge', 'Polite Cat'],
    ['群聊突然开趴猫', '三只猫围着水碗挤成庆祝小圈', 'Bongo Cat', 'Happy Happy Happy Cat'],
    ['罐头来了也不动猫', '猫背对四只好碗，望着窗外发呆', 'Huh Cat', 'Grumpy Cat'],
    ['打翻以后只看地上猫', '三只碗翻倒，两只仍稳稳留在身后', 'Crying Cat'],
    ['旧纸箱回忆猫', '大猫把小时候的玩具推给小猫', 'Polite Cat', 'Maru'],
    ['七个纸袋全想钻猫', '七个袋口各露出不同诱人的玩具', 'Huh Cat', 'Smudge'],
    ['背对饭盆出走猫', '猫离开八只排好的碗，走向门外', 'Maxwell', 'Maru'],
    ['九碗独享满意猫', '猫坐在九只小碗前露出满足表情', 'Smirking Cat'],
    ['全家叠成幸福猫', '十只碗围着一窝放松的猫', 'Happy Cat'],
    ['水杯里发现宇宙猫', '小猫盯着杯中倒影，像收到神秘消息', 'Huh Cat'],
    ['叼花直球冲来猫', '猫叼着花一路小跑，水滴洒满身后', 'Happy Happy Happy Cat'],
    ['舔毛安抚全场猫', '猫守着水碗，先安抚身边受惊的小猫', 'Polite Cat'],
    ['水碗旁稳住猫', '猫安静坐在晃动的水碗旁，水面渐平', 'Polite Cat', 'Business Cat'],
  ],
  pentacles: [
    ['天降一粒冻干猫', '一粒冻干落在猫爪前的阳光里', 'Happy Cat', 'Maxwell'],
    ['两爪倒腾生活猫', '猫在两只滚动零食球之间来回接球', 'OIIA', 'Bongo Cat'],
    ['三猫共建纸箱猫', '三只猫分工把纸箱改造成猫屋', 'Keyboard Cat', 'Maru'],
    ['抱住罐头不撒爪猫', '猫四肢圈住四只罐头，警惕看镜头', 'Maxwell', 'Grumpy Cat'],
    ['玻璃门外等饭猫', '两只猫在亮着灯的屋外看向食盆', 'Crying Cat'],
    ['冻干按需分配猫', '一只猫把六粒冻干分给大小不同的猫', 'Polite Cat', 'Business Cat'],
    ['守着猫草等发芽猫', '猫蹲在七盆猫草前认真等候', 'Staring Cat', 'Maru'],
    ['重复踩奶练级猫', '猫在八格毯子上反复练习踩奶', 'Keyboard Cat', 'Bongo Cat'],
    ['窗台独享成果猫', '猫在植物与九枚圆形吊牌间晒太阳', 'Smirking Cat'],
    ['满屋猫粮家业猫', '老猫、小猫与十只食盆共享一间屋', 'Business Cat'],
    ['研究硬币反光猫', '小猫把一枚圆牌翻来覆去认真研究', 'Huh Cat', 'Maxwell'],
    ['准点蹲饭位猫', '猫每天在同一时间守着食盆', 'Staring Cat', 'Polite Cat'],
    ['暖窝运营官猫', '猫守着温暖的窝、植物与食盆', 'Maru', 'Polite Cat'],
    ['罐头库存总管猫', '猫坐在整齐的罐头架前检查账本', 'Business Cat', 'Keyboard Cat'],
  ],
  swords: [
    ['一爪划破纸袋猫', '猫爪划开纸袋，一束白光露出', 'Huh Cat', 'Staring Cat'],
    ['两扇门前宕机猫', '猫闭眼坐在两扇同样的门之间', 'Huh Cat', 'Smudge'],
    ['看见你摸别猫猫', '猫隔窗看见主人摸另一只猫，三道雨痕划过', 'Crying Cat', 'Smudge'],
    ['通知全关睡觉猫', '猫在四道安静光影里把脸埋进毯子', 'Maru', 'Sleeping Cat'],
    ['吵赢以后没人玩猫', '猫守着五根逗猫棒，其他猫已经走远', 'Smudge', 'Grumpy Cat'],
    ['连窝一起搬走猫', '猫坐在移动纸箱里穿过安静走廊', 'Maru', 'Maxwell'],
    ['半夜偷吃还装傻猫', '猫叼走零食，身后留下七道爪印', 'Smirking Cat', 'Maxwell'],
    ['胶带圈里自困猫', '猫站在地上八段胶带围成的圈内', 'Huh Cat', 'Maxwell'],
    ['凌晨三点复盘猫', '猫在九道百叶窗影下睁眼躺着', 'Crying Cat', 'Staring Cat'],
    ['十个红点压平猫', '猫被十个通知红点投影压在毯子上', 'Crying Cat', 'Sad Banana Cat'],
    ['门后情报员猫', '小猫从门后探头，耳朵追着风声转', 'Huh Cat', 'Staring Cat'],
    ['听见袋响冲锋猫', '猫沿着锐利风线冲向零食袋', 'Happy Happy Happy Cat', 'OIIA'],
    ['一眼识破套路猫', '猫在清晰窗光里冷静看穿纸袋机关', 'Grumpy Cat', 'Smudge'],
    ['事实审计总监猫', '猫坐在对称文件夹与清晰光线之间', 'Business Cat', 'Keyboard Cat'],
  ],
  wands: [
    ['第一颗红点着火猫', '黑暗里第一颗激光红点落在猫爪前', 'Happy Happy Happy Cat', 'Pop Cat'],
    ['两扇窗选地图猫', '猫踩着地球玩具观察两扇不同的窗', 'Maxwell', 'Huh Cat'],
    ['快递怎么还不来猫', '猫在三根抓柱旁眺望门口', 'Staring Cat', 'Polite Cat'],
    ['纸箱城开业猫', '四根抓柱撑起纸箱小城，猫群庆祝', 'Bongo Cat', 'Happy Cat'],
    ['五猫乱拍团建猫', '五只猫围着逗猫棒各拍各的', 'Bongo Cat', 'Smudge'],
    ['全网点赞凯旋猫', '猫戴着轻巧纸环走过六根抓柱', 'Happy Cat', 'Smirking Cat'],
    ['高柜守位猫', '猫在高柜边缘守住自己的七根玩具', 'Grumpy Cat', 'Staring Cat'],
    ['八倍速跑酷猫', '八道运动残影穿过走廊', 'OIIA', 'Happy Happy Happy Cat'],
    ['炸毛也要守门猫', '疲惫猫靠着九根抓柱仍盯着门口', 'Grumpy Cat', 'Huh Cat'],
    ['玩具全叼回家猫', '猫一次叼着十根逗猫棒艰难前进', 'Keyboard Cat', 'Sad Banana Cat'],
    ['第一次见逗猫棒猫', '小猫竖起身研究会动的羽毛棒', 'Huh Cat', 'Pop Cat'],
    ['红点追到墙上猫', '猫全速追光点，四脚几乎离地', 'Happy Happy Happy Cat', 'OIIA'],
    ['橘猫气场全开猫', '自信橘猫守着向日葵与逗猫棒', 'Smirking Cat', 'Grumpy Cat'],
    ['抓柱王座老板猫', '猫坐在最高抓柱上指挥全屋动线', 'Business Cat', 'Keyboard Cat'],
  ],
};

export const miaoMinorCards: Record<string, MiaoMinorCardConcept> = Object.fromEntries(
  (Object.entries(sceneSeeds) as [MiaoMinorSuit, readonly SceneSeed[]][]).flatMap(([suit, seeds]) => {
    const grammar = suitGrammar[suit];
    return seeds.map(([miaoName, scene, ...memeFamilies], index) => {
      const rank = rankGrammar[index];
      return {
        tarotId: `${rank.rank}-of-${suit}`,
        suit,
        rank: rank.rank,
        sequence: index + 1,
        miaoName,
        scene,
        uprightHook: `${rank.upright} 这次落在${grammar.domain}。`,
        reversedHook: `${rank.reversed} 留意${grammar.objectFamily}所代表的现实信号。`,
        memeFamilies,
        revision: '0.1.0',
      };
    });
  }).map((concept) => [concept.tarotId, concept]),
);

export function getMiaoMinorCardConcept(tarotId: string) {
  return miaoMinorCards[tarotId];
}
