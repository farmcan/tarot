const app = document.querySelector('#app');

const variants = {
  a: {
    name: '静心仪式',
    short: '留白、沉浸、一步一屏',
    eyebrow: '60 秒猫咪塔罗',
    title: '把问题交给猫牌。',
    lead: '不预测命运，只陪你把眼前的事看清一点。',
    primary: '开始一次抽牌',
    secondary: '今日一牌',
  },
  b: {
    name: '轻游戏牌桌',
    short: '节奏快、状态清楚、游戏感强',
    eyebrow: '今日牌局 · 3 张',
    title: '猫牌就位，等你开局。',
    lead: '选一个问题，亲手从完整牌堆里带走三张猫牌。',
    primary: '进入牌桌',
    secondary: '快速抽一张',
  },
  c: {
    name: '猫咪陪伴',
    short: '温暖、亲近、像在与猫对话',
    eyebrow: '你的猫咪观察员',
    title: '今天，想和猫聊聊什么？',
    lead: '猫不会替你做决定，但很会趴在问题旁边看重点。',
    primary: '和猫猫聊一下',
    secondary: '看看今日猫语',
  },
};

const cardBacks = {
  a: '/assets/card-backs/moon-atlas.avif',
  b: '/assets/card-backs/noon-oracle.avif',
  c: '/assets/card-backs/morning-garden.avif',
};

const revealedCards = [
  { id: 'the-star', name: '星星', keyword: '希望 · 重新校准', position: '过去留下的线索' },
  { id: 'justice', name: '正义', keyword: '边界 · 诚实判断', position: '现在真正的核心' },
  { id: 'the-fool', name: '愚者', keyword: '轻装 · 迈出一步', position: '接下来可以尝试' },
];

const quickQuestions = ['我今天最需要看见什么？', '这段关系的核心课题是什么？', '什么正在影响我的推进？'];

const searchParams = new URLSearchParams(location.search);
const previewScreen = searchParams.get('screen');
const allowedScreens = ['home', 'question', 'shuffle', 'select', 'reveal', 'result'];

const state = {
  variant: searchParams.get('variant') || 'a',
  screen: allowedScreens.includes(previewScreen) ? previewScreen : 'home',
  question: '我今天最需要看见什么？',
  selected: ['select', 'reveal', 'result'].includes(previewScreen) ? [1, 6, 12] : [],
  revealIndex: 0,
  cardFlipped: false,
  pickerOpen: false,
  shuffleReady: previewScreen === 'shuffle',
};

if (!variants[state.variant]) state.variant = 'a';

function iconCat() {
  return `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8 4 3l5 3a10 10 0 0 1 6 0l5-3-1 5c1.3 1.4 2 3.2 2 5 0 4.4-4 8-9 8s-9-3.6-9-8c0-1.8.7-3.6 2-5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 13h.01M15.5 13h.01M9 16c1.7 1.3 4.3 1.3 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function header({ back = false } = {}) {
  return `<header class="app-header">
    ${back ? `<button class="back-button" data-action="back" aria-label="返回">‹</button>` : `<div class="brand"><span class="brand-mark">${iconCat()}</span><span>MiaoTarot</span></div>`}
    ${back ? `<div class="brand"><span>MiaoTarot</span></div>` : ''}
    <button class="variant-trigger" data-action="open-picker" aria-label="切换方案">${state.variant.toUpperCase()}</button>
  </header>`;
}

function stepHeader(step, label) {
  return `<div class="step-header">
    <button class="back-button" data-action="back" aria-label="返回">‹</button>
    <div class="step-copy"><strong>${label}</strong><small>${step} / 5</small></div>
    <button class="variant-trigger" data-action="open-picker" aria-label="切换方案">${state.variant.toUpperCase()}</button>
    <div class="progress-track"><span style="width:${step * 20}%"></span></div>
  </div>`;
}

function variantPicker() {
  if (!state.pickerOpen) return '';
  return `<div class="variant-sheet" data-action="close-picker">
    <section class="variant-panel" aria-label="选择手机方案">
      <h2>选择体验方向</h2>
      <p>切换方案会回到该方案首页。</p>
      ${Object.entries(variants).map(([key, item]) => `
        <button class="variant-option ${state.variant === key ? 'selected' : ''}" data-variant="${key}">
          <span class="variant-letter">${key.toUpperCase()}</span>
          <span><strong>${item.name}</strong><small>${item.short}</small></span>
          <span>›</span>
        </button>`).join('')}
    </section>
  </div>`;
}

function homeVisual() {
  if (state.variant === 'c') {
    return `<div class="home-visual"><div class="companion-hero">
      <img src="/assets/miao-packs/doodle/the-high-priestess.avif" alt="安静观察问题的女祭司猫牌" />
      <div class="speech-bubble">“先别急着做决定，抽三张看看重点喵。”</div>
    </div></div>`;
  }

  return `<div class="home-visual">
    ${state.variant === 'b' ? `<div class="game-table"></div>` : `<div class="glow"></div>`}
    <span class="sparkle s1"></span><span class="sparkle s2"></span><span class="sparkle s3"></span>
    <div class="card-stack" aria-label="一叠等待抽取的猫咪塔罗牌">
      <div class="stack-card"><img src="${cardBacks[state.variant]}" alt="" /></div>
      <div class="stack-card"><img src="${cardBacks[state.variant]}" alt="" /></div>
      <div class="stack-card"><img src="${cardBacks[state.variant]}" alt="" /></div>
    </div>
  </div>`;
}

function homeScreen() {
  const variant = variants[state.variant];
  return `<section class="screen home-screen">
    ${header()}
    ${state.variant === 'b' ? `<div class="game-hud"><span>牌组 <strong>涂鸦 78</strong></span><span>今日能量 <strong>3 / 3</strong></span></div>` : ''}
    <div class="home-copy">
      <div class="eyebrow">✦ ${variant.eyebrow}</div>
      <h1 class="title-xl">${variant.title}</h1>
      <p class="lead">${variant.lead}</p>
    </div>
    ${homeVisual()}
    <div class="bottom-actions">
      <button class="primary-button" data-action="start">${variant.primary}　→</button>
      <button class="secondary-button" data-action="daily">${variant.secondary}</button>
    </div>
    ${variantPicker()}
  </section>`;
}

function questionScreen() {
  const companion = state.variant === 'c' ? `<div class="companion-chat"><div class="avatar">🐈</div><div class="chat-bubble">不用想得很完整。把现在最挂心的那件事告诉我就好。</div></div>` : '';
  return `<section class="screen">
    ${stepHeader(1, '聚焦问题')}
    <div class="content">
      ${companion}
      <div class="panel">
        <div class="eyebrow">01 · 先把注意力放在一件事上</div>
        <h1 class="screen-title">这次想看清什么？</h1>
        <p class="screen-subtitle">可以保留默认问题，也可以用自己的话描述。</p>
        <label class="field-label" for="question">你的问题</label>
        <textarea class="question-input" id="question">${escapeHtml(state.question)}</textarea>
        <div class="chip-row">
          ${quickQuestions.map((item, index) => `<button class="chip" data-question="${index}">${item}</button>`).join('')}
        </div>
        <div class="advanced-row"><span>本次设置<br><small>三张牌 · 涂鸦 78 · 包含逆位</small></span><span>调整 ›</span></div>
      </div>
    </div>
    <div class="bottom-actions"><button class="primary-button" data-action="shuffle">带着问题去洗牌　→</button></div>
    ${variantPicker()}
  </section>`;
}

function shuffleScreen() {
  return `<section class="screen">
    ${stepHeader(2, '洗牌')}
    <div class="content shuffle-zone">
      <div>
        <div class="shuffle-stack" aria-label="猫牌正在洗牌">
          <div class="stack-card"><img src="${cardBacks[state.variant]}" alt="" /></div>
          <div class="stack-card"><img src="${cardBacks[state.variant]}" alt="" /></div>
          <div class="stack-card"><img src="${cardBacks[state.variant]}" alt="" /></div>
        </div>
        <h1 class="screen-title">猫牌正在重新排队</h1>
        <p class="screen-subtitle">在心里再读一遍你的问题。</p>
        <div class="shuffle-dots"><i></i><i></i><i></i></div>
      </div>
    </div>
    <div class="bottom-actions"><button class="primary-button" data-action="select" ${state.shuffleReady ? '' : 'disabled'}>${state.shuffleReady ? '洗好了，去选牌　→' : '正在洗猫…'}</button></div>
    ${variantPicker()}
  </section>`;
}

function selectScreen() {
  return `<section class="screen">
    ${stepHeader(3, '亲手选牌')}
    <div class="content">
      <div class="selection-head"><div><div class="eyebrow">从牌堆里选三张</div><strong>选牌 ${state.selected.length} / 3</strong></div><span>已洗好 · 不可预知</span></div>
      <div class="deck-grid" role="group" aria-label="可选择的猫咪塔罗牌">
        ${Array.from({ length: 16 }, (_, index) => {
          const order = state.selected.indexOf(index);
          return `<button class="choice-card ${order >= 0 ? 'selected' : ''}" data-card="${index}" aria-pressed="${order >= 0}">
            <img src="${cardBacks[state.variant]}" alt="第 ${index + 1} 张牌背" />
            ${order >= 0 ? `<span class="selection-number">${order + 1}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </div>
    <div class="bottom-actions"><button class="primary-button" data-action="place" ${state.selected.length === 3 ? '' : 'disabled'}>${state.selected.length === 3 ? '把三张猫牌放上桌　→' : `还差 ${3 - state.selected.length} 张`}</button></div>
    ${variantPicker()}
  </section>`;
}

function revealScreen() {
  const card = revealedCards[state.revealIndex];
  return `<section class="screen">
    ${stepHeader(4, '逐张翻牌')}
    <div class="reveal-zone">
      <div class="position-label">${card.position}</div>
      <button class="reveal-card ${state.cardFlipped ? 'is-flipped' : ''}" data-action="flip" aria-label="${state.cardFlipped ? card.name : '点击翻开这张牌'}">
        <span class="reveal-face reveal-back"><img src="${cardBacks[state.variant]}" alt="牌背" /><span class="tap-hint">轻触翻开</span></span>
        <span class="reveal-face reveal-front"><img src="/assets/miao-packs/doodle/${card.id}.avif" alt="${card.name}" /></span>
      </button>
      <div class="card-dots">${revealedCards.map((_, i) => `<i class="${i <= state.revealIndex ? 'done' : ''}"></i>`).join('')}</div>
      <div class="reveal-caption">${state.cardFlipped ? `<strong>${card.name}</strong><small>${card.keyword}</small>` : `<small>第 ${state.revealIndex + 1} 张，共 3 张</small>`}</div>
    </div>
    <div class="bottom-actions"><button class="primary-button" data-action="next-card" ${state.cardFlipped ? '' : 'disabled'}>${state.revealIndex < 2 ? '看下一张　→' : '查看完整解读　→'}</button></div>
    ${variantPicker()}
  </section>`;
}

function resultScreen() {
  const companion = state.variant === 'c' ? `<div class="companion-chat"><div class="avatar">🐈</div><div class="chat-bubble">你并不是缺少答案，更像是需要允许自己先迈出一个不完美的小步。</div></div>` : '';
  return `<section class="screen">
    ${header({ back: true })}
    <div class="result-scroll">
      ${companion}
      <div class="result-hero">
        <div class="result-kicker">✦ 你的三张猫牌</div>
        <h1 class="result-title">先校准边界，<br>再轻一点出发。</h1>
        <div class="result-card"><img src="/assets/miao-packs/doodle/justice.avif" alt="正义" /></div>
        <div class="mini-spread">
          <div class="mini-card"><img src="/assets/miao-packs/doodle/the-star.avif" alt="星星" /></div>
          <div class="mini-card"><img src="/assets/miao-packs/doodle/justice.avif" alt="正义" /></div>
          <div class="mini-card"><img src="/assets/miao-packs/doodle/the-fool.avif" alt="愚者" /></div>
        </div>
      </div>
      <article class="reading-panel">
        <h2>这组牌在提醒你</h2>
        <p>星星说明你已经知道自己想靠近什么；正义要求你先把事实、期待和边界分清；愚者则建议不要等到万事俱备，选择一个代价可控的小动作开始。</p>
        <div class="tiny-action">今天先做：写下“我能控制的三件事”，然后完成其中最小的一件。</div>
      </article>
    </div>
    <div class="result-actions"><div class="result-action-row"><button class="ghost-button">分享</button><button class="primary-button">让 AI 结合问题细读</button></div></div>
    ${variantPicker()}
  </section>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function render() {
  document.body.dataset.variant = state.variant;
  const renderer = {
    home: homeScreen,
    question: questionScreen,
    shuffle: shuffleScreen,
    select: selectScreen,
    reveal: revealScreen,
    result: resultScreen,
  }[state.screen];
  app.innerHTML = renderer();
}

function go(screen) {
  state.screen = screen;
  state.pickerOpen = false;
  render();
}

function back() {
  const order = ['home', 'question', 'shuffle', 'select', 'reveal', 'result'];
  const index = order.indexOf(state.screen);
  go(order[Math.max(0, index - 1)]);
}

app.addEventListener('input', (event) => {
  if (event.target.matches('#question')) state.question = event.target.value;
});

app.addEventListener('click', (event) => {
  const variantOption = event.target.closest('.variant-option[data-variant]');
  if (variantOption) {
    state.variant = variantOption.dataset.variant;
    state.screen = 'home';
    state.selected = [];
    state.revealIndex = 0;
    state.cardFlipped = false;
    state.pickerOpen = false;
    history.replaceState(null, '', `?variant=${state.variant}`);
    render();
    return;
  }

  const questionOption = event.target.closest('[data-question]');
  if (questionOption) {
    state.question = quickQuestions[Number(questionOption.dataset.question)];
    render();
    return;
  }

  const cardOption = event.target.closest('[data-card]');
  if (cardOption) {
    const cardIndex = Number(cardOption.dataset.card);
    const existing = state.selected.indexOf(cardIndex);
    if (existing >= 0) state.selected.splice(existing, 1);
    else if (state.selected.length < 3) state.selected.push(cardIndex);
    render();
    return;
  }

  const actionNode = event.target.closest('[data-action]');
  if (!actionNode) return;
  const action = actionNode.dataset.action;
  if (action === 'open-picker') { state.pickerOpen = true; render(); }
  if (action === 'close-picker') { state.pickerOpen = false; render(); }
  if (action === 'back') back();
  if (action === 'start') go('question');
  if (action === 'daily') { state.question = '今天最值得留意什么？'; go('shuffle'); startShuffleTimer(); }
  if (action === 'shuffle') { go('shuffle'); startShuffleTimer(); }
  if (action === 'select' && state.shuffleReady) go('select');
  if (action === 'place' && state.selected.length === 3) { state.revealIndex = 0; state.cardFlipped = false; go('reveal'); }
  if (action === 'flip') { state.cardFlipped = true; render(); }
  if (action === 'next-card' && state.cardFlipped) {
    if (state.revealIndex < 2) { state.revealIndex += 1; state.cardFlipped = false; render(); }
    else go('result');
  }
});

function startShuffleTimer() {
  state.shuffleReady = false;
  window.setTimeout(() => {
    if (state.screen !== 'shuffle') return;
    state.shuffleReady = true;
    render();
  }, 1100);
}

render();
