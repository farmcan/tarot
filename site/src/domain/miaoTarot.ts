import { type CardOrientation, type TarotCard } from '@cometpisces/tarot-kit';
import { type ReadingRequest } from './readingTypes';
import {
  buildThemedLlmPayload,
  buildThemedLlmPrompt,
  createThemedReading,
  createThemedSynthesis,
  getThemedOrientationLabel,
  getThemeCard,
  getTraditionalLine as getThemedTraditionalLine,
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

export interface MiaoReadingCard extends ThemedReadingCard {
  miao: MiaoCard;
  miaoMeaning: string;
}

export interface MiaoReading extends Omit<ThemedReading, 'cards'> {
  cards: MiaoReadingCard[];
}

export const miaoCards: Record<string, MiaoCard> = {
  'the-fool': {
    tarotId: 'the-fool',
    miaoName: '出门不看路猫',
    archetype: '刚刚起步，兴奋大于规划',
    memeCaption: '先冲出去，路线图等会儿再说。',
    uprightMiaoMeaning: '你正处在想开始、想尝试、想换一种活法的状态。它不一定成熟，但有活力。',
    reversedMiaoMeaning: '你可能不是自由，而是在逃避决定。看起来很潇洒，其实心里还没落地。',
    emotionalSignal: '新鲜感、冲动、未知、轻装上阵',
    tinyAction: '把想做的事缩成一个 15 分钟能开始的小动作。',
    shareText: '今天的我：先跳上桌，再研究桌有多高。',
    palette: 'violet',
    sigil: '0',
  },
  'the-magician': {
    tarotId: 'the-magician',
    miaoName: '什么柜门都会开猫',
    archetype: '资源都在手边，只差动手',
    memeCaption: '没有打不开的柜门，只有还没伸出去的爪。',
    uprightMiaoMeaning: '你手上其实已经有工具和办法，现在关键是把想法变成动作。',
    reversedMiaoMeaning: '你可能在炫技巧或绕远路。别把聪明用成拖延。',
    emotionalSignal: '主动、创造、手感、掌控',
    tinyAction: '列出已经拥有的 3 个资源，马上用其中一个。',
    shareText: '今天的我：开柜门之前，已经想好怎么装无辜。',
    palette: 'grape',
    sigil: 'I',
  },
  'the-high-priestess': {
    tarotId: 'the-high-priestess',
    miaoName: '半夜盯着你猫',
    archetype: '直觉知道，但还不想说破',
    memeCaption: '我什么都没说，但我已经看懂了。',
    uprightMiaoMeaning: '你的直觉正在工作。先不要急着解释，给信息一点沉淀时间。',
    reversedMiaoMeaning: '你可能把沉默误当智慧，或者忽略了已经很明显的信号。',
    emotionalSignal: '直觉、观察、秘密、距离感',
    tinyAction: '把脑中最响的那个怀疑写下来，不急着下结论。',
    shareText: '今天的我：不说话，但眼神已经写了 800 字。',
    palette: 'indigo',
    sigil: 'II',
  },
  'the-empress': {
    tarotId: 'the-empress',
    miaoName: '晒太阳大王猫',
    archetype: '先照顾感受，再谈产出',
    memeCaption: '生产力？先把这块太阳晒完。',
    uprightMiaoMeaning: '你需要补充、滋养和允许自己舒服一点。好东西往往从稳定的身体感开始。',
    reversedMiaoMeaning: '你可能把照顾别人放太前面，自己的能量已经被掏空。',
    emotionalSignal: '滋养、感官、丰盛、柔软',
    tinyAction: '今天认真吃一顿饭，或给自己留一段不被打扰的时间。',
    shareText: '今天的我：不是懒，是正在光合作用。',
    palette: 'pink',
    sigil: 'III',
  },
  'the-emperor': {
    tarotId: 'the-emperor',
    miaoName: '占据键盘猫',
    archetype: '我要规则，也要地盘',
    memeCaption: '你的计划很好，现在它归我了。',
    uprightMiaoMeaning: '你需要边界、秩序和一个能执行的结构。别只靠心情推进。',
    reversedMiaoMeaning: '控制欲可能盖过了真正的需求。太硬会让事情更卡。',
    emotionalSignal: '秩序、边界、责任、控制',
    tinyAction: '定一个今天不会被谈判掉的边界。',
    shareText: '今天的我：会议可以开，但键盘先归我。',
    palette: 'red',
    sigil: 'IV',
  },
  'the-hierophant': {
    tarotId: 'the-hierophant',
    miaoName: '猫砂盆礼法猫',
    archetype: '传统、规则和被传授的做法',
    memeCaption: '这件事祖传就是这么埋的。',
    uprightMiaoMeaning: '现成经验能帮你少走弯路。先学规则，再决定要不要打破。',
    reversedMiaoMeaning: '你可能被“应该这样”绑住了。旧方法不一定适合新问题。',
    emotionalSignal: '传统、学习、规训、群体认可',
    tinyAction: '问一个懂行的人，或者查一份可靠教程。',
    shareText: '今天的我：尊重流程，但保留把流程埋起来的权利。',
    palette: 'gray',
    sigil: 'V',
  },
  'the-lovers': {
    tarotId: 'the-lovers',
    miaoName: '贴贴但突然咬你猫',
    archetype: '靠近、选择，以及边界测试',
    memeCaption: '我喜欢你，但你手放太久了。',
    uprightMiaoMeaning: '关系或选择正在要求你更诚实。喜欢什么，不喜欢什么，都要说清。',
    reversedMiaoMeaning: '你可能在迎合、摇摆，或用亲密掩盖不一致。',
    emotionalSignal: '选择、吸引、关系、边界',
    tinyAction: '把一个模糊的“都可以”改成清楚的偏好。',
    shareText: '今天的我：可以贴贴，但要按猫规。',
    palette: 'rose',
    sigil: 'VI',
  },
  'the-chariot': {
    tarotId: 'the-chariot',
    miaoName: '凌晨跑酷猫',
    archetype: '能量爆发，目标感上头',
    memeCaption: '现在，立刻，穿过客厅。',
    uprightMiaoMeaning: '你有推进力，适合主动出击。重点是把方向抓稳。',
    reversedMiaoMeaning: '速度太快可能变成乱撞。不是所有声音都需要立刻回应。',
    emotionalSignal: '冲刺、竞争、控制方向、躁动',
    tinyAction: '只选一个目标冲，不要同时追三个光点。',
    shareText: '今天的我：体内有一辆小摩托。',
    palette: 'blue',
    sigil: 'VII',
  },
  strength: {
    tarotId: 'strength',
    miaoName: '温柔按住你猫',
    archetype: '不是压制，是稳定地驯服',
    memeCaption: '我没有凶你，我只是把你的手按住。',
    uprightMiaoMeaning: '真正的力量来自稳定、耐心和不急着证明自己。',
    reversedMiaoMeaning: '你可能在硬撑，或者对自己的脆弱太不耐烦。',
    emotionalSignal: '耐心、柔软的力量、自我安抚',
    tinyAction: '遇到冲突先慢三秒，再决定要不要回应。',
    shareText: '今天的我：轻轻一按，世界安静。',
    palette: 'orange',
    sigil: 'VIII',
  },
  'the-hermit': {
    tarotId: 'the-hermit',
    miaoName: '纸箱闭关猫',
    archetype: '退回自己的空间找答案',
    memeCaption: '我不是失踪，我在纸箱里升级系统。',
    uprightMiaoMeaning: '你需要独处和内省。外界越吵，越要找回自己的灯。',
    reversedMiaoMeaning: '闭关可能变成隔离。别把所有支持都挡在纸箱外。',
    emotionalSignal: '独处、反思、边界、内在导航',
    tinyAction: '关掉一个通知源，留 20 分钟给自己。',
    shareText: '今天的我：暂不营业，纸箱中。',
    palette: 'dark',
    sigil: 'IX',
  },
  'wheel-of-fortune': {
    tarotId: 'wheel-of-fortune',
    miaoName: '突然发疯猫',
    archetype: '周期变化，不全由你控制',
    memeCaption: '刚才还很正常，下一秒开始横向移动。',
    uprightMiaoMeaning: '局势正在转动。顺势比强控更有效，变化里有机会。',
    reversedMiaoMeaning: '你可能卡在重复循环里，同样的触发点又来了。',
    emotionalSignal: '变化、循环、运气、节奏切换',
    tinyAction: '找出一个反复出现的模式，这次换一种回应。',
    shareText: '今天的我：命运转盘启动，家具小心。',
    palette: 'cyan',
    sigil: 'X',
  },
  justice: {
    tarotId: 'justice',
    miaoName: '审判你开罐手法猫',
    archetype: '公平、判断和后果',
    memeCaption: '这罐开得不够标准，我保留意见。',
    uprightMiaoMeaning: '事情需要更清楚的标准。事实、责任和选择后果都要摆上桌。',
    reversedMiaoMeaning: '你可能在偏心，或者因为怕冲突而不愿承认失衡。',
    emotionalSignal: '判断、公平、责任、清算',
    tinyAction: '把情绪和事实分成两列写下来。',
    shareText: '今天的我：不是挑剔，是维护罐头正义。',
    palette: 'teal',
    sigil: 'XI',
  },
  'the-hanged-man': {
    tarotId: 'the-hanged-man',
    miaoName: '倒挂沙发猫',
    archetype: '换个姿势看世界',
    memeCaption: '你们都站正了，所以才看不懂。',
    uprightMiaoMeaning: '暂停不是失败。换个角度，答案可能会自己浮出来。',
    reversedMiaoMeaning: '你可能被卡住太久，却把无力感包装成顺其自然。',
    emotionalSignal: '暂停、牺牲、换视角、等待',
    tinyAction: '先不要加速，试着改问另一个问题。',
    shareText: '今天的我：倒着看，居然合理了。',
    palette: 'lime',
    sigil: 'XII',
  },
  death: {
    tarotId: 'death',
    miaoName: '旧纸箱告别猫',
    archetype: '结束旧壳，腾出新位置',
    memeCaption: '这个纸箱我爱过，但它该进回收了。',
    uprightMiaoMeaning: '某个阶段正在结束。放手不是惩罚，是给新状态腾空间。',
    reversedMiaoMeaning: '你可能明知该结束，却还在抱着旧纸箱不放。',
    emotionalSignal: '结束、转化、断舍离、新阶段',
    tinyAction: '清理一个已经不服务你的承诺、文件或聊天窗口。',
    shareText: '今天的我：旧纸箱很好，但新纸箱在路上。',
    palette: 'dark',
    sigil: 'XIII',
  },
  temperance: {
    tarotId: 'temperance',
    miaoName: '水碗调温猫',
    archetype: '混合、调节和刚刚好',
    memeCaption: '这个水温，不够猫。',
    uprightMiaoMeaning: '你需要调和，而不是极端选择。慢慢混合会比立刻分胜负更好。',
    reversedMiaoMeaning: '节奏失衡了。要么太满，要么太少，身体和情绪都在提醒你。',
    emotionalSignal: '平衡、节奏、融合、恢复',
    tinyAction: '把今天的安排删掉一件，让系统回到可承受。',
    shareText: '今天的我：万物都要调到猫猫适口。',
    palette: 'yellow',
    sigil: 'XIV',
  },
  'the-devil': {
    tarotId: 'the-devil',
    miaoName: '猫薄荷上头猫',
    archetype: '欲望、沉迷和明知故犯',
    memeCaption: '我知道不该，但你闻闻这个。',
    uprightMiaoMeaning: '有东西正在强烈吸引你。它未必坏，但你要看清代价。',
    reversedMiaoMeaning: '你开始意识到束缚来自哪里，这是松绑的第一步。',
    emotionalSignal: '诱惑、依赖、执念、上头',
    tinyAction: '给一个上头行为设置停止线，比如 20 分钟或一次购买前冷静。',
    shareText: '今天的我：理智下线，猫薄荷上线。',
    palette: 'red',
    sigil: 'XV',
  },
  'the-tower': {
    tarotId: 'the-tower',
    miaoName: '把杯子推下桌猫',
    archetype: '结构崩塌，但终于不装了',
    memeCaption: '我只是帮重力发表意见。',
    uprightMiaoMeaning: '某个旧结构撑不住了。震动不舒服，但它会暴露真问题。',
    reversedMiaoMeaning: '你已经看见裂缝，却还在假装杯子不会掉。',
    emotionalSignal: '突变、崩塌、真相、解放',
    tinyAction: '承认一个已经很明显的问题，并停止替它找借口。',
    shareText: '今天的我：不是破坏，是压力测试。',
    palette: 'orange',
    sigil: 'XVI',
  },
  'the-star': {
    tarotId: 'the-star',
    miaoName: '窗边发光猫',
    archetype: '恢复希望，重新相信',
    memeCaption: '我什么都没做，但房间亮了一点。',
    uprightMiaoMeaning: '你正在恢复。希望不是鸡血，而是重新能呼吸的空间。',
    reversedMiaoMeaning: '你可能太累了，所以暂时看不见希望。先照顾能量。',
    emotionalSignal: '希望、疗愈、信任、柔光',
    tinyAction: '做一件能恢复感的小事，而不是立刻解决全部。',
    shareText: '今天的我：窗边一坐，宇宙续航。',
    palette: 'cyan',
    sigil: 'XVII',
  },
  'the-moon': {
    tarotId: 'the-moon',
    miaoName: '对空气哈气猫',
    archetype: '不确定、投射和夜里的想象',
    memeCaption: '那里什么都没有，但我觉得有。',
    uprightMiaoMeaning: '信息还不完整。梦、焦虑和直觉混在一起，别急着定案。',
    reversedMiaoMeaning: '迷雾开始散开。你会慢慢分清真实问题和脑内小剧场。',
    emotionalSignal: '迷雾、焦虑、潜意识、投射',
    tinyAction: '把最坏想象和可验证事实分开。',
    shareText: '今天的我：空气不对，我先哈为敬。',
    palette: 'indigo',
    sigil: 'XVIII',
  },
  'the-sun': {
    tarotId: 'the-sun',
    miaoName: '肚皮朝天猫',
    archetype: '放松、坦荡和可见的快乐',
    memeCaption: '今天先信任这个世界三分钟。',
    uprightMiaoMeaning: '事情可以更简单、更明亮。你不需要把快乐解释得太复杂。',
    reversedMiaoMeaning: '快乐被挡住了，可能是累、害羞，或不敢相信好事是真的。',
    emotionalSignal: '快乐、坦诚、能量、安心',
    tinyAction: '主动接收一个好消息，不急着削弱它。',
    shareText: '今天的我：肚皮出现，天气转晴。',
    palette: 'yellow',
    sigil: 'XIX',
  },
  judgement: {
    tarotId: 'judgement',
    miaoName: '听见开罐声觉醒猫',
    archetype: '被召唤，重新回应自己',
    memeCaption: '我本来在睡，但使命叫我。',
    uprightMiaoMeaning: '你正在被某件事唤醒。该回应的，不只是外界，也是你自己的决定。',
    reversedMiaoMeaning: '你可能听见了召唤，却还在装睡。拖延会让声音更大。',
    emotionalSignal: '觉醒、召唤、复盘、决定',
    tinyAction: '回顾一次旧经验，写下这次你要怎样不同。',
    shareText: '今天的我：开罐声响，灵魂归位。',
    palette: 'violet',
    sigil: 'XX',
  },
  'the-world': {
    tarotId: 'the-world',
    miaoName: '终于躺平猫',
    archetype: '完成、整合和安心落地',
    memeCaption: '该跑的圈跑完了，现在正式变成毯子。',
    uprightMiaoMeaning: '一个阶段正在收束。你可以承认自己已经走了很远。',
    reversedMiaoMeaning: '还有一点尾巴没收好。不是失败，是差一个完整的句号。',
    emotionalSignal: '完成、整合、抵达、闭环',
    tinyAction: '把一个已完成的事正式归档或庆祝一下。',
    shareText: '今天的我：任务完成，进入液态。',
    palette: 'teal',
    sigil: 'XXI',
  },
};

export const miaoSpreads = ['single', 'three-card', 'relationship'] as const;

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
  fallbackShareText: 'MiaoTarot：把你现在的精神状态翻译成一只猫。',
  promptIdentity: '你的任务是把传统塔罗含义翻译成猫 meme 式的自我观察，但不要胡说、不要宿命化。',
  promptVoice: '像聪明朋友一样轻松吐槽，但保持温和、具体、不恐吓。',
  promptBoundary: '猫 meme 是情绪入口，传统塔罗含义仍是分析骨架。',
  cards: miaoThemeCards,
  spreadIds: miaoSpreads,
};

export function getMiaoCard(card: TarotCard): MiaoCard {
  const fallback = getThemeCard(miaoDeckConfig, card);
  const mapped = miaoCards[card.id];
  return mapped ?? themeToMiaoCard(fallback);
}

export function createMiaoReading(params: ReadingRequest): MiaoReading {
  const themed = createThemedReading(miaoDeckConfig, params);
  return adaptThemedReading(themed);
}

export function getMiaoOrientationLabel(orientation: CardOrientation) {
  return getThemedOrientationLabel(miaoDeckConfig, orientation);
}

export function createMiaoSynthesis(reading: MiaoReading) {
  return createThemedSynthesis(miaoDeckConfig, reading);
}

export function getTraditionalLine(card: MiaoReadingCard) {
  return getThemedTraditionalLine(card);
}

export function buildMiaoPayload(reading: MiaoReading) {
  return buildThemedLlmPayload(miaoDeckConfig, reading);
}

export function buildMiaoPrompt(reading: MiaoReading) {
  return buildThemedLlmPrompt(miaoDeckConfig, reading);
}

function adaptThemedReading(reading: ThemedReading): MiaoReading {
  return {
    ...reading,
    cards: reading.cards.map((card) => ({
      ...card,
      miao: themeToMiaoCard(card.themeCard),
      miaoMeaning: card.themedMeaning,
    })),
  };
}
