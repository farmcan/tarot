import { type CardOrientation, type DrawnCard, type TarotCard } from '@cometpisces/tarot-kit';
import { type ReadingRequest } from './readingTypes';
import { getCardKeyword, getCardName, getSuitLabel } from './tarot';
import { getMiaoMinorCardConcept } from './miaoMinorArcana';
import {
  DEFAULT_MIAO_CONTENT_PACK_ID,
  getMiaoPackCardOverride,
} from './miaoContentPacks';
import { createThemedDeckAdapter } from './themeAdapter';
import {
  getThemeCard,
  type ThemedCard,
  type ThemedDeckConfig,
  type ThemedReading,
  type ThemedReadingCard,
} from './themedTarot';

export interface MiaoCard {
  tarotId: string;
  miaoName: string;
  archetype: string;
  memeCaption: string;
  uprightMiaoMeaning: string;
  reversedMiaoMeaning: string;
  emotionalSignal: string;
  tinyAction: string;
  shareText: string;
  palette: string;
  sigil: string;
}

export interface MiaoVisual {
  scene: string;
  pose: string;
  prop: string;
  propLabel: string;
  moodLine: string;
  imageBrief: string;
}

export interface MiaoReadingCard extends ThemedReadingCard {
  miao: MiaoCard;
  miaoMeaning: string;
}

export interface MiaoReading extends Omit<ThemedReading, 'cards'> {
  contentPackId: string;
  cards: MiaoReadingCard[];
}

export const miaoCards: Record<string, MiaoCard> = {
  'the-fool': {
    tarotId: 'the-fool',
    miaoName: '先冲了再说猫',
    archetype: '脑子还在加载，身体已经出发',
    memeCaption: '计划是什么？等我落地再编。',
    uprightMiaoMeaning: '你正处在想开始、想尝试、想换一种活法的状态。它不一定成熟，但有活力。',
    reversedMiaoMeaning: '你可能不是自由，而是在逃避决定。看起来很潇洒，其实心里还没落地。',
    emotionalSignal: '新鲜感、冲动、未知、轻装上阵',
    tinyAction: '先开一个 15 分钟的小局，不要先写史诗计划。',
    shareText: '今天的我：先冲，导航稍后上线。',
    palette: 'violet',
    sigil: '0',
  },
  'the-magician': {
    tarotId: 'the-magician',
    miaoName: '开柜门像开挂猫',
    archetype: '工具全在手边，只差别再演了',
    memeCaption: '办法不是没有，是还没伸爪。',
    uprightMiaoMeaning: '你手上其实已经有工具和办法，现在关键是把想法变成动作。',
    reversedMiaoMeaning: '你可能在炫技巧或绕远路。别把聪明用成拖延。',
    emotionalSignal: '主动、创造、手感、掌控',
    tinyAction: '列 3 个现成资源，马上用掉一个。',
    shareText: '今天的我：柜门已开，装无辜中。',
    palette: 'grape',
    sigil: 'I',
  },
  'the-high-priestess': {
    tarotId: 'the-high-priestess',
    miaoName: '凌晨三点凝视猫',
    archetype: '已读不回，但宇宙已读',
    memeCaption: '我没发言，但眼神已经提交报告。',
    uprightMiaoMeaning: '你的直觉正在工作。先不要急着解释，给信息一点沉淀时间。',
    reversedMiaoMeaning: '你可能把沉默误当智慧，或者忽略了已经很明显的信号。',
    emotionalSignal: '直觉、观察、秘密、距离感',
    tinyAction: '写下那个最响的怀疑，先别判刑。',
    shareText: '今天的我：嘴没动，眼神写满了。',
    palette: 'indigo',
    sigil: 'II',
  },
  'the-empress': {
    tarotId: 'the-empress',
    miaoName: '太阳能充电猫',
    archetype: '先回血，再谈生产力',
    memeCaption: '别催，我正在接入自然电源。',
    uprightMiaoMeaning: '你需要补充、滋养和允许自己舒服一点。好东西往往从稳定的身体感开始。',
    reversedMiaoMeaning: '你可能把照顾别人放太前面，自己的能量已经被掏空。',
    emotionalSignal: '滋养、感官、丰盛、柔软',
    tinyAction: '认真吃一顿饭，给自己留一格电。',
    shareText: '今天的我：不是摆烂，是低电量保护。',
    palette: 'pink',
    sigil: 'III',
  },
  'the-emperor': {
    tarotId: 'the-emperor',
    miaoName: '键盘领主猫',
    archetype: '地盘要有，规则也要我定',
    memeCaption: '你的工作台很好，现在是我的王座。',
    uprightMiaoMeaning: '你需要边界、秩序和一个能执行的结构。别只靠心情推进。',
    reversedMiaoMeaning: '控制欲可能盖过了真正的需求。太硬会让事情更卡。',
    emotionalSignal: '秩序、边界、责任、控制',
    tinyAction: '定一个今天不许被讨价还价的边界。',
    shareText: '今天的我：键盘在此，诸事排队。',
    palette: 'red',
    sigil: 'IV',
  },
  'the-hierophant': {
    tarotId: 'the-hierophant',
    miaoName: '祖传埋法猫',
    archetype: '老规矩不一定酷，但确实有用',
    memeCaption: '别问，祖上就是这么处理的。',
    uprightMiaoMeaning: '现成经验能帮你少走弯路。先学规则，再决定要不要打破。',
    reversedMiaoMeaning: '你可能被“应该这样”绑住了。旧方法不一定适合新问题。',
    emotionalSignal: '传统、学习、规训、群体认可',
    tinyAction: '先找一份靠谱教程，再决定要不要创新。',
    shareText: '今天的我：按流程来，但别太信流程。',
    palette: 'gray',
    sigil: 'V',
  },
  'the-lovers': {
    tarotId: 'the-lovers',
    miaoName: '贴贴三秒咬人猫',
    archetype: '想靠近，也想保留爪权',
    memeCaption: '可以爱，但别乱摸我的开关。',
    uprightMiaoMeaning: '关系或选择正在要求你更诚实。喜欢什么，不喜欢什么，都要说清。',
    reversedMiaoMeaning: '你可能在迎合、摇摆，或用亲密掩盖不一致。',
    emotionalSignal: '选择、吸引、关系、边界',
    tinyAction: '把一个“都行”改成明确的喜欢或不喜欢。',
    shareText: '今天的我：贴贴可以，越界不行。',
    palette: 'rose',
    sigil: 'VI',
  },
  'the-chariot': {
    tarotId: 'the-chariot',
    miaoName: '凌晨跑酷施工猫',
    archetype: '能量上头，客厅遭殃',
    memeCaption: '当前项目：横穿全屋，顺便制造声响。',
    uprightMiaoMeaning: '你有推进力，适合主动出击。重点是把方向抓稳。',
    reversedMiaoMeaning: '速度太快可能变成乱撞。不是所有声音都需要立刻回应。',
    emotionalSignal: '冲刺、竞争、控制方向、躁动',
    tinyAction: '只追一个光点，别同时开三条战线。',
    shareText: '今天的我：体内小摩托已点火。',
    palette: 'blue',
    sigil: 'VII',
  },
  strength: {
    tarotId: 'strength',
    miaoName: '温柔但不许动猫',
    archetype: '情绪很大，但我先按住',
    memeCaption: '我没有生气，我只是启动了爪刹。',
    uprightMiaoMeaning: '真正的力量来自稳定、耐心和不急着证明自己。',
    reversedMiaoMeaning: '你可能在硬撑，或者对自己的脆弱太不耐烦。',
    emotionalSignal: '耐心、柔软的力量、自我安抚',
    tinyAction: '想立刻回嘴时，先慢三秒。',
    shareText: '今天的我：爪子轻放，场面稳住。',
    palette: 'orange',
    sigil: 'VIII',
  },
  'the-hermit': {
    tarotId: 'the-hermit',
    miaoName: '纸箱免打扰猫',
    archetype: '下线不是冷漠，是系统维护',
    memeCaption: '暂不营业，正在纸箱里重启人生。',
    uprightMiaoMeaning: '你需要独处和内省。外界越吵，越要找回自己的灯。',
    reversedMiaoMeaning: '闭关可能变成隔离。别把所有支持都挡在纸箱外。',
    emotionalSignal: '独处、反思、边界、内在导航',
    tinyAction: '关掉一个通知源，给自己 20 分钟离线。',
    shareText: '今天的我：勿扰，纸箱模式。',
    palette: 'dark',
    sigil: 'IX',
  },
  'wheel-of-fortune': {
    tarotId: 'wheel-of-fortune',
    miaoName: '突然横着走猫',
    archetype: '命运一转弯，我也开始抽象',
    memeCaption: '刚才还正常，现在进入不可解释状态。',
    uprightMiaoMeaning: '局势正在转动。顺势比强控更有效，变化里有机会。',
    reversedMiaoMeaning: '你可能卡在重复循环里，同样的触发点又来了。',
    emotionalSignal: '变化、循环、运气、节奏切换',
    tinyAction: '找出那个重复循环，这次换个回应姿势。',
    shareText: '今天的我：命运转盘开到抽象档。',
    palette: 'cyan',
    sigil: 'X',
  },
  justice: {
    tarotId: 'justice',
    miaoName: '罐头开法审计猫',
    archetype: '标准不清，爪子就会举证',
    memeCaption: '这罐开得有瑕疵，我建议复盘。',
    uprightMiaoMeaning: '事情需要更清楚的标准。事实、责任和选择后果都要摆上桌。',
    reversedMiaoMeaning: '你可能在偏心，或者因为怕冲突而不愿承认失衡。',
    emotionalSignal: '判断、公平、责任、清算',
    tinyAction: '把情绪和事实分两列，别混审。',
    shareText: '今天的我：不是挑剔，是审计上线。',
    palette: 'teal',
    sigil: 'XI',
  },
  'the-hanged-man': {
    tarotId: 'the-hanged-man',
    miaoName: '倒挂沙发悟道猫',
    archetype: '暂停一下，世界突然反过来讲理',
    memeCaption: '你们正着看不懂，是角度问题。',
    uprightMiaoMeaning: '暂停不是失败。换个角度，答案可能会自己浮出来。',
    reversedMiaoMeaning: '你可能被卡住太久，却把无力感包装成顺其自然。',
    emotionalSignal: '暂停、牺牲、换视角、等待',
    tinyAction: '先别加速，换个问题再看一遍。',
    shareText: '今天的我：倒过来，反而通了。',
    palette: 'lime',
    sigil: 'XII',
  },
  death: {
    tarotId: 'death',
    miaoName: '旧纸箱断舍离猫',
    archetype: '爱过，但该换箱了',
    memeCaption: '不是不念旧，是这个箱真装不下了。',
    uprightMiaoMeaning: '某个阶段正在结束。放手不是惩罚，是给新状态腾空间。',
    reversedMiaoMeaning: '你可能明知该结束，却还在抱着旧纸箱不放。',
    emotionalSignal: '结束、转化、断舍离、新阶段',
    tinyAction: '清掉一个不再服务你的窗口或承诺。',
    shareText: '今天的我：旧箱告别，新箱待收。',
    palette: 'dark',
    sigil: 'XIII',
  },
  temperance: {
    tarotId: 'temperance',
    miaoName: '水温必须刚好猫',
    archetype: '一点点不对，我都能感觉到',
    memeCaption: '不是我难伺候，是系统参数很精密。',
    uprightMiaoMeaning: '你需要调和，而不是极端选择。慢慢混合会比立刻分胜负更好。',
    reversedMiaoMeaning: '节奏失衡了。要么太满，要么太少，身体和情绪都在提醒你。',
    emotionalSignal: '平衡、节奏、融合、恢复',
    tinyAction: '删掉今天一件事，把节奏调回可承受。',
    shareText: '今天的我：参数微调，拒绝过载。',
    palette: 'yellow',
    sigil: 'XIV',
  },
  'the-devil': {
    tarotId: 'the-devil',
    miaoName: '猫薄荷上头猫',
    archetype: '明知会上头，还是想再闻一口',
    memeCaption: '我知道这是套路，但它真的很香。',
    uprightMiaoMeaning: '有东西正在强烈吸引你。它未必坏，但你要看清代价。',
    reversedMiaoMeaning: '你开始意识到束缚来自哪里，这是松绑的第一步。',
    emotionalSignal: '诱惑、依赖、执念、上头',
    tinyAction: '给上头行为设停止线：20 分钟或先不付款。',
    shareText: '今天的我：理智掉线，上头在线。',
    palette: 'red',
    sigil: 'XV',
  },
  'the-tower': {
    tarotId: 'the-tower',
    miaoName: '杯子自由落体猫',
    archetype: '旧结构装不下，干脆响一声',
    memeCaption: '我没破坏，我只是发起压力测试。',
    uprightMiaoMeaning: '某个旧结构撑不住了。震动不舒服，但它会暴露真问题。',
    reversedMiaoMeaning: '你已经看见裂缝，却还在假装杯子不会掉。',
    emotionalSignal: '突变、崩塌、真相、解放',
    tinyAction: '承认一个明显问题，停止替它圆场。',
    shareText: '今天的我：杯子落地，真相上线。',
    palette: 'orange',
    sigil: 'XVI',
  },
  'the-star': {
    tarotId: 'the-star',
    miaoName: '窗边回血猫',
    archetype: '不鸡血，但电量慢慢回来了',
    memeCaption: '我只是坐着，房间就没那么糟了。',
    uprightMiaoMeaning: '你正在恢复。希望不是鸡血，而是重新能呼吸的空间。',
    reversedMiaoMeaning: '你可能太累了，所以暂时看不见希望。先照顾能量。',
    emotionalSignal: '希望、疗愈、信任、柔光',
    tinyAction: '做一件回血小事，不急着拯救全部。',
    shareText: '今天的我：窗边回血，缓慢复活。',
    palette: 'cyan',
    sigil: 'XVII',
  },
  'the-moon': {
    tarotId: 'the-moon',
    miaoName: '空气里有东西猫',
    archetype: '证据不足，但脑内剧场开播',
    memeCaption: '你说没有，可我已经开始演了。',
    uprightMiaoMeaning: '信息还不完整。梦、焦虑和直觉混在一起，别急着定案。',
    reversedMiaoMeaning: '迷雾开始散开。你会慢慢分清真实问题和脑内小剧场。',
    emotionalSignal: '迷雾、焦虑、潜意识、投射',
    tinyAction: '把脑内剧场和可验证事实分开。',
    shareText: '今天的我：空气可疑，先别定案。',
    palette: 'indigo',
    sigil: 'XVIII',
  },
  'the-sun': {
    tarotId: 'the-sun',
    miaoName: '肚皮营业猫',
    archetype: '难得放松，快乐公开展示',
    memeCaption: '今日开放参观，但禁止乱摸。',
    uprightMiaoMeaning: '事情可以更简单、更明亮。你不需要把快乐解释得太复杂。',
    reversedMiaoMeaning: '快乐被挡住了，可能是累、害羞，或不敢相信好事是真的。',
    emotionalSignal: '快乐、坦诚、能量、安心',
    tinyAction: '接住一个好消息，不要立刻泼冷水。',
    shareText: '今天的我：肚皮营业，天气转晴。',
    palette: 'yellow',
    sigil: 'XIX',
  },
  judgement: {
    tarotId: 'judgement',
    miaoName: '开罐声满血复活猫',
    archetype: '本来装睡，突然使命感爆棚',
    memeCaption: '刚才还离线，现在全身响应。',
    uprightMiaoMeaning: '你正在被某件事唤醒。该回应的，不只是外界，也是你自己的决定。',
    reversedMiaoMeaning: '你可能听见了召唤，却还在装睡。拖延会让声音更大。',
    emotionalSignal: '觉醒、召唤、复盘、决定',
    tinyAction: '复盘一个旧坑，写下这次怎么不重演。',
    shareText: '今天的我：开罐一响，灵魂上线。',
    palette: 'violet',
    sigil: 'XX',
  },
  'the-world': {
    tarotId: 'the-world',
    miaoName: '任务完成液体猫',
    archetype: '闭环之后，正式进入流体形态',
    memeCaption: '该跑的圈跑完了，现在融化给你看。',
    uprightMiaoMeaning: '一个阶段正在收束。你可以承认自己已经走了很远。',
    reversedMiaoMeaning: '还有一点尾巴没收好。不是失败，是差一个完整的句号。',
    emotionalSignal: '完成、整合、抵达、闭环',
    tinyAction: '把一个完成项归档，并允许自己庆祝。',
    shareText: '今天的我：任务闭环，开始融化。',
    palette: 'teal',
    sigil: 'XXI',
  },
};

export const miaoVisuals: Record<string, MiaoVisual> = {
  'the-fool': {
    scene: 'doorway',
    pose: 'pounce',
    prop: 'route',
    propLabel: '路线',
    moodLine: '先跳出去，地图稍后加载。',
    imageBrief: '一只猫从门口跃出，旁边是还没摊开的路线图，气质兴奋但没规划。',
  },
  'the-magician': {
    scene: 'cabinet',
    pose: 'reach',
    prop: 'handle',
    propLabel: '柜门',
    moodLine: '工具都在爪边，只差开门。',
    imageBrief: '一只猫伸爪打开柜门，周围是可用的小工具，像马上要开始操作。',
  },
  'the-high-priestess': {
    scene: 'night',
    pose: 'watch',
    prop: 'moon',
    propLabel: '夜光',
    moodLine: '不说话，但已经看懂了。',
    imageBrief: '一只猫在夜里安静盯着画面，背后有月光和半开的窗帘。',
  },
  'the-empress': {
    scene: 'sunspot',
    pose: 'loaf',
    prop: 'sunspot',
    propLabel: '太阳',
    moodLine: '不是偷懒，是补充电量。',
    imageBrief: '一只猫趴在阳光块里，身体松软，画面温暖、滋养、慢下来。',
  },
  'the-emperor': {
    scene: 'desk',
    pose: 'guard',
    prop: 'keyboard',
    propLabel: '键盘',
    moodLine: '计划很好，现在地盘归我。',
    imageBrief: '一只猫坐在键盘上占据工作区，表情坚定，像在建立边界。',
  },
  'the-hierophant': {
    scene: 'ritual',
    pose: 'ritual',
    prop: 'shovel',
    propLabel: '流程',
    moodLine: '祖传就是这么埋的。',
    imageBrief: '一只猫认真执行猫砂盆礼法，旁边有小铲子和规矩感的标记。',
  },
  'the-lovers': {
    scene: 'lap',
    pose: 'bite',
    prop: 'hearts',
    propLabel: '贴贴',
    moodLine: '可以靠近，但要按猫规。',
    imageBrief: '一只猫一边贴近一边轻咬，画面表达亲密和边界测试。',
  },
  'the-chariot': {
    scene: 'hallway',
    pose: 'sprint',
    prop: 'speed',
    propLabel: '跑酷',
    moodLine: '体内有一辆小摩托。',
    imageBrief: '一只猫在走廊里高速冲刺，带有运动轨迹和目标感。',
  },
  strength: {
    scene: 'sofa',
    pose: 'paw',
    prop: 'paw',
    propLabel: '轻按',
    moodLine: '轻轻一按，世界安静。',
    imageBrief: '一只猫温柔按住画面边缘的手，传达稳定、耐心和安抚。',
  },
  'the-hermit': {
    scene: 'box',
    pose: 'hide',
    prop: 'box',
    propLabel: '纸箱',
    moodLine: '暂不营业，纸箱中。',
    imageBrief: '一只猫缩在纸箱里，只露出眼睛，像在独处升级系统。',
  },
  'wheel-of-fortune': {
    scene: 'living',
    pose: 'glitch',
    prop: 'spiral',
    propLabel: '转盘',
    moodLine: '命运转盘启动，家具小心。',
    imageBrief: '一只猫突然横向移动，周围有循环转盘和家具位移的动态感。',
  },
  justice: {
    scene: 'counter',
    pose: 'judge',
    prop: 'can',
    propLabel: '罐头',
    moodLine: '不是挑剔，是维护罐头正义。',
    imageBrief: '一只猫严肃审视打开的罐头，像在评判标准是否公平。',
  },
  'the-hanged-man': {
    scene: 'upside',
    pose: 'hang',
    prop: 'sofa',
    propLabel: '沙发',
    moodLine: '倒着看，居然合理了。',
    imageBrief: '一只猫倒挂在沙发边缘，用完全不同的角度看世界。',
  },
  death: {
    scene: 'recycle',
    pose: 'leave',
    prop: 'carton',
    propLabel: '旧箱',
    moodLine: '旧纸箱很好，新纸箱在路上。',
    imageBrief: '一只猫离开旧纸箱，旁边有回收标记，表达告别和转化。',
  },
  temperance: {
    scene: 'water',
    pose: 'mix',
    prop: 'bowl',
    propLabel: '水碗',
    moodLine: '万物都要调到猫猫适口。',
    imageBrief: '一只猫认真看着水碗，像在调节温度和节奏。',
  },
  'the-devil': {
    scene: 'catnip',
    pose: 'spin',
    prop: 'mint',
    propLabel: '猫薄荷',
    moodLine: '理智下线，猫薄荷上线。',
    imageBrief: '一只猫围着猫薄荷上头打滚，快乐但带一点失控。',
  },
  'the-tower': {
    scene: 'table',
    pose: 'push',
    prop: 'cup',
    propLabel: '杯子',
    moodLine: '不是破坏，是压力测试。',
    imageBrief: '一只猫把杯子推下桌，旧结构崩塌但终于暴露真问题。',
  },
  'the-star': {
    scene: 'window',
    pose: 'glow',
    prop: 'star',
    propLabel: '星光',
    moodLine: '窗边一坐，宇宙续航。',
    imageBrief: '一只猫坐在窗边微微发光，画面柔和、恢复、重新相信。',
  },
  'the-moon': {
    scene: 'dark',
    pose: 'hiss',
    prop: 'shadow',
    propLabel: '空气',
    moodLine: '空气不对，我先哈为敬。',
    imageBrief: '一只猫对着空处哈气，背后有模糊阴影，表达焦虑和投射。',
  },
  'the-sun': {
    scene: 'bright',
    pose: 'belly',
    prop: 'sun',
    propLabel: '晴天',
    moodLine: '肚皮出现，天气转晴。',
    imageBrief: '一只猫肚皮朝天躺在明亮阳光里，坦荡、简单、快乐。',
  },
  judgement: {
    scene: 'kitchen',
    pose: 'awake',
    prop: 'canbell',
    propLabel: '开罐',
    moodLine: '开罐声响，灵魂归位。',
    imageBrief: '一只猫听到开罐声突然觉醒，像被使命召唤。',
  },
  'the-world': {
    scene: 'blanket',
    pose: 'liquid',
    prop: 'blanket',
    propLabel: '毯子',
    moodLine: '任务完成，进入液态。',
    imageBrief: '一只猫完全摊在毯子上，像任务结束后安心落地。',
  },
};

export function getMiaoVisual(card: Pick<MiaoCard, 'tarotId'>): MiaoVisual {
  return miaoVisuals[card.tarotId] ?? {
    scene: 'blanket',
    pose: 'loaf',
    prop: 'star',
    propLabel: '猫图',
    moodLine: '这只猫还在加载自己的姿势。',
    imageBrief: '一只风格统一的猫状态图，表达当前猫牌的情绪原型。',
  };
}

// Existing spread ids stay stable; new counts are additive for saved readings and links.
export const miaoSpreads = ['single', 'two-card', 'three-card', 'four-card', 'relationship'] as const;

function miaoToThemeCard(card: MiaoCard): ThemedCard {
  return {
    tarotId: card.tarotId,
    title: card.miaoName,
    archetype: card.archetype,
    caption: card.memeCaption,
    uprightMeaning: card.uprightMiaoMeaning,
    reversedMeaning: card.reversedMiaoMeaning,
    emotionalSignal: card.emotionalSignal,
    tinyAction: card.tinyAction,
    shareText: card.shareText,
    palette: card.palette,
    sigil: card.sigil,
  };
}

function themeToMiaoCard(card: ThemedCard): MiaoCard {
  return {
    tarotId: card.tarotId,
    miaoName: card.title,
    archetype: card.archetype,
    memeCaption: card.caption,
    uprightMiaoMeaning: card.uprightMeaning,
    reversedMiaoMeaning: card.reversedMeaning,
    emotionalSignal: card.emotionalSignal,
    tinyAction: card.tinyAction,
    shareText: card.shareText,
    palette: card.palette,
    sigil: card.sigil,
  };
}

export const miaoThemeCards: Record<string, ThemedCard> = Object.fromEntries(
  Object.entries(miaoCards).map(([id, card]) => [id, miaoToThemeCard(card)]),
);

export const miaoDeckConfig: ThemedDeckConfig = {
  id: 'miaotarot',
  productName: 'MiaoTarot',
  taskName: 'miaotarot_cat_meme_reading',
  cardLabel: '猫牌',
  archetypeLabel: '猫 meme',
  uprightLabel: '顺毛',
  reversedLabel: '炸毛',
  emptyQuestion: '用户没有输入具体问题，请围绕今天的状态进行温和分析。',
  fallbackShareText: 'MiaoTarot：抽一张猫牌，换个角度听听此刻的自己。',
  promptIdentity: '你的任务是把传统塔罗含义翻译成猫 meme 式的自我观察，但不要胡说、不要宿命化。',
  promptVoice: '像聪明朋友一样轻松吐槽，但保持温和、具体、不恐吓。',
  promptBoundary: '猫 meme 是情绪入口，传统塔罗含义仍是分析骨架。',
  cards: miaoThemeCards,
  spreadIds: miaoSpreads,
};

const miaoAdapter = createThemedDeckAdapter(miaoDeckConfig);

function getBaseMiaoCard(card: TarotCard): MiaoCard {
  const mapped = miaoCards[card.id];
  if (mapped) return mapped;

  const minor = getMiaoMinorCardConcept(card.id);
  if (minor) {
    return {
      tarotId: card.id,
      miaoName: minor.miaoName,
      archetype: `${getCardName(card)} · ${getSuitLabel(card)}`,
      memeCaption: minor.scene,
      uprightMiaoMeaning: minor.uprightHook,
      reversedMiaoMeaning: minor.reversedHook,
      emotionalSignal: getCardKeyword(card),
      tinyAction: card.arcana === 'minor'
        ? `先把「${getCardKeyword(card)}」缩成一个今天能完成的小动作。`
        : '先观察，再行动。',
      shareText: `今天的我：${minor.miaoName}。`,
      palette: card.suit === 'wands' ? 'orange'
        : card.suit === 'cups' ? 'blue'
          : card.suit === 'swords' ? 'gray'
            : 'yellow',
      sigil: String(card.number),
    };
  }

  const fallback = getThemeCard(miaoDeckConfig, card);
  return themeToMiaoCard(fallback);
}

export function getMiaoCard(card: TarotCard, contentPackId = DEFAULT_MIAO_CONTENT_PACK_ID): MiaoCard {
  const base = getBaseMiaoCard(card);
  const override = getMiaoPackCardOverride(contentPackId, card.id)?.copy;
  return override ? { ...base, ...override, tarotId: card.id } : base;
}

export function createMiaoReading(
  params: ReadingRequest,
  contentPackId = DEFAULT_MIAO_CONTENT_PACK_ID,
): MiaoReading {
  const themed = miaoAdapter.createReading(params);
  return adaptThemedReading(themed, contentPackId);
}

export function createMiaoReadingFromDrawn(
  params: ReadingRequest,
  drawnCards: readonly DrawnCard[],
  contentPackId = DEFAULT_MIAO_CONTENT_PACK_ID,
): MiaoReading {
  const themed = miaoAdapter.createReadingFromDrawn(params, drawnCards);
  return adaptThemedReading(themed, contentPackId);
}

export function getMiaoOrientationLabel(orientation: CardOrientation) {
  return miaoAdapter.getOrientationLabel(orientation);
}

export function createMiaoSynthesis(reading: MiaoReading) {
  return miaoAdapter.createSynthesis(reading);
}

export function getTraditionalLine(card: MiaoReadingCard) {
  return miaoAdapter.getTraditionalLine(card);
}

export function buildMiaoPayload(reading: MiaoReading) {
  const payload = miaoAdapter.buildPayload(reading);

  return {
    ...payload,
    cards: payload.cards.map((card, index) => {
      const visual = getMiaoVisual(reading.cards[index].miao);

      return {
        ...card,
        visual: {
          scene: visual.scene,
          pose: visual.pose,
          prop: visual.propLabel,
          moodLine: visual.moodLine,
          imageBrief: visual.imageBrief,
        },
      };
    }),
    outputContract: [
      ...payload.outputContract,
      '解读时可以参考 visual.imageBrief，但不要说图片是事实证据；它只是猫 meme 情绪画面。',
    ],
  };
}

export function buildMiaoPrompt(reading: MiaoReading) {
  return miaoAdapter.buildPrompt(reading);
}

function adaptThemedReading(reading: ThemedReading, contentPackId: string): MiaoReading {
  return {
    ...reading,
    contentPackId,
    cards: reading.cards.map((card) => {
      const miao = getMiaoCard(card.drawn.card, contentPackId);
      return {
        ...card,
        themeCard: miaoToThemeCard(miao),
        themedMeaning: card.drawn.orientation === 'upright'
          ? miao.uprightMiaoMeaning
          : miao.reversedMiaoMeaning,
        miao,
        miaoMeaning: card.drawn.orientation === 'upright'
          ? miao.uprightMiaoMeaning
          : miao.reversedMiaoMeaning,
      };
    }),
  };
}
