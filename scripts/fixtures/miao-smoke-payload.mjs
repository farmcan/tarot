export const miaoSmokePayload = {
  task: 'miaotarot_cat_meme_reading',
  language: 'zh-CN',
  question: '我现在这股烦劲，到底是哪只猫？',
  topic: '开放问题 / Open',
  spread: {
    id: 'single',
    name: '单牌聚焦',
    sourcePattern: '轻量网页与 bot 常用的一步抽牌模式',
  },
  styleGuide: {
    product: 'MiaoTarot',
  },
  cards: [
    {
      position: '焦点',
      role: '当下最值得看见的一件事',
      traditional: '愚者 · 正位 · 冒险',
      tarotCard: '愚者',
      tarotKeyword: '冒险',
      orientation: '正位',
      themedOrientation: '顺毛',
      themedName: '出门不看路猫',
      archetype: '刚刚起步，兴奋大于规划',
      caption: '先冲出去，路线图等会儿再说。',
      emotionalSignal: '新鲜感、冲动、未知、轻装上阵',
      traditionalMeaning: '新的开始，适合低风险尝试。',
      positionMeaning: '当下最值得看见的是启动而不是完美规划。',
      topicMeaning: '开放问题中，这张牌提醒先观察行动冲动。',
      themedMeaning: '你正处在想开始、想尝试、想换一种活法的状态。',
      tinyAction: '把想做的事缩成一个 15 分钟能开始的小动作。',
    },
  ],
};

export function createMiaoSmokeRequestBody() {
  const requestBody = {
    themeId: 'miaotarot',
    payload: miaoSmokePayload,
  };

  if (process.env.TAROT_TURNSTILE_TOKEN) {
    requestBody.turnstileToken = process.env.TAROT_TURNSTILE_TOKEN;
  }

  return requestBody;
}
