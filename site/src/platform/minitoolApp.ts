import './minitoolCompat';
import './minitool.css';
import { cards, type TarotCard } from '@cometpisces/tarot-kit';
import { createMiaoReadingFromDrawn, miaoCards } from '../domain/miaoTarot';
import { getCardKeyword, getCardName } from '../domain/tarot';
import { getPlatformCapabilities, getPlatformWindowInsets, openResultNoteComposer, saveResultImage } from './xiaohongshu';
import { clearMiniToolSnapshot, loadMiniToolSnapshot, saveMiniToolSnapshot, type MiniToolScene, type MiniToolSnapshot } from './minitoolStorage';

const root = document.querySelector<HTMLElement>('#minitool')!;
const deck = cards.filter((card) => card.arcana === 'major');
const allowedIds = deck.map((card) => card.id);
const scenes = {
  daily: { title: '今日猫牌', subtitle: '先看见今天的自己', question: '今天，我最值得注意什么？', topic: 'others' as const, prompt: '今天先留意自己的什么状态？' },
  relationship: { title: '关系卡住了', subtitle: '看清自己的需要与边界', question: '在这段关系里，我最需要看清什么？', topic: 'love' as const, prompt: '先看自己的需要，不替对方猜心。' },
  choice: { title: '做个选择', subtitle: '找到迈出一步的角度', question: '面对这个选择，我最该留意什么？', topic: 'others' as const, prompt: '牌不会替你决定，先看清自己在意什么。' },
};
type Stage = 'home' | 'question' | 'choose' | 'reveal' | 'result' | 'poster';
let stage: Stage = 'home';
let scene: MiniToolScene = 'daily';
let question = '';
let candidates: TarotCard[] = [];
let selected: TarotCard | null = null;
let recent: MiniToolSnapshot | null = null;
let poster = '';
let posterKey = '';
let storageNotice = '';
let busy = false;
let requestVersion = 0;
let pendingPersistence = Promise.resolve(true);

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const item = document.createElement(tag);
  item.textContent = text;
  if (className) item.className = className;
  return item;
}
function button(label: string, action: () => void, className = 'primary') {
  const item = element('button', label, className);
  item.type = 'button';
  item.addEventListener('click', action);
  return item;
}
function imagePath(card: TarotCard) { return `./minitool-assets/${card.id}.jpg`; }
function navigate(next: Stage, push = true) {
  requestVersion += 1;
  busy = false;
  stage = next;
  if (push) history.pushState({ miaoMiniTool: true, stage, scene, selectedId: selected?.id, candidateIds: candidates.map((card) => card.id) }, '', location.href);
  render();
  window.scrollTo(0, 0);
  root.querySelector<HTMLElement>('h1')?.focus();
}
function heading(text: string) {
  const item = element('h1', text);
  item.tabIndex = -1;
  root.append(item);
}
function resetHome() { question = ''; poster = ''; posterKey = ''; busy = false; navigate('home'); }
function shuffle() {
  candidates = [...deck];
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const pick = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[pick]] = [candidates[pick], candidates[index]];
  }
  candidates = candidates.slice(0, 6);
  selected = null;
  poster = '';
  posterKey = '';
  storageNotice = '';
}
function start(next: MiniToolScene) {
  scene = next;
  question = '';
  shuffle();
  navigate(next === 'daily' ? 'choose' : 'question');
}
function cardFace(card: TarotCard) {
  const frame = element('figure', '', 'card-face');
  const art = element('img');
  art.src = imagePath(card);
  art.alt = `${getCardName(card)}猫咪牌面`;
  art.width = 510;
  art.height = 714;
  art.addEventListener('error', () => {
    art.hidden = true;
    frame.classList.add('art-unavailable');
    frame.prepend(element('p', '猫咪图片暂时没加载出来，下面的牌义仍可阅读。', 'muted'));
  }, { once: true });
  const labels = element('figcaption');
  labels.append(element('strong', getCardName(card)), element('span', `${getCardKeyword(card)} · 正位`, 'muted'));
  frame.append(art, labels);
  return frame;
}
function reading() {
  if (!selected) return null;
  return createMiaoReadingFromDrawn({ question: question || scenes[scene].question, topic: scenes[scene].topic, spreadId: 'single' }, [{ card: selected, orientation: 'upright' }], 'doodle-full').cards[0];
}
function status(text: string) {
  let item = root.querySelector<HTMLElement>('[role="status"]');
  if (!item) { item = element('p', '', 'notice'); item.setAttribute('role', 'status'); root.append(item); }
  item.textContent = text;
}
function updateSavedResultControls() {
  const controls = root.querySelector<HTMLElement>('#saved-result-controls');
  if (!controls) return;
  while (controls.firstChild) controls.removeChild(controls.firstChild);
  if (recent) controls.append(button('删除保存的结果', () => { void deleteRecent(); }, 'text-button wide'));
  if (storageNotice) status(storageNotice);
}
function render() {
  while (root.firstChild) root.removeChild(root.firstChild);
  const top = element('header');
  top.append(element('span', 'MiaoTarot', 'brand'), element('span', '猫咪状态卡', 'edition'));
  if (stage !== 'home') top.append(button('返回', () => history.back(), 'back'));
  root.append(top);
  if (stage === 'home') {
    root.append(element('p', '一分钟，换个角度看自己', 'eyebrow'));
    heading('今天，想让猫陪你看什么？');
    root.append(element('p', '亲手翻一张牌，带走一句话和一个小动作。', 'intro'));
    const list = element('div', '', 'scenes');
    for (const id of ['daily', 'relationship', 'choice'] as const) {
      const control = button('', () => start(id), 'scene');
      control.append(element('span', id === 'daily' ? '☀' : id === 'relationship' ? '♡' : '↗', 'scene-symbol'), element('strong', scenes[id].title), element('span', scenes[id].subtitle));
      list.append(control);
    }
    root.append(list);
    if (recent) root.append(button('回看上次的猫牌', () => {
      selected = deck.find((card) => card.id === recent!.cardId) ?? null;
      scene = recent!.scene;
      question = '';
      poster = '';
      navigate('result');
    }, 'secondary wide'));
    root.append(element('p', '22 张大阿卡纳 · 基础解读，不必等待 AI', 'muted'));
  } else if (stage === 'question') {
    root.append(element('p', scenes[scene].title, 'eyebrow'));
    heading('把那个问题，先放在心里。');
    root.append(element('p', scenes[scene].prompt, 'intro'));
    const label = element('label', '也可以写下来（可跳过）');
    label.htmlFor = 'mini-question';
    const input = element('textarea');
    input.id = 'mini-question';
    input.maxLength = 180;
    input.rows = 3;
    input.placeholder = scenes[scene].question;
    input.value = question;
    input.addEventListener('input', () => { question = input.value; });
    root.append(label, input, element('p', '问题只留在本次打开中，不会进入保存图片或缓存。', 'muted'));
    root.append(button('选一张猫牌', () => { input.blur(); navigate('choose'); }, 'primary wide'));
  } else if (stage === 'choose') {
    root.append(element('p', `01 / ${scenes[scene].title}`, 'eyebrow'));
    heading('凭此刻的感觉，选一张。');
    root.append(element('p', '牌已经洗好。点中的那张，就是你的猫牌。', 'intro'));
    const choices = element('div', '', 'card-choices');
    choices.setAttribute('aria-label', '选择一张猫牌');
    candidates.forEach((card, index) => {
      const control = button('✧', () => { selected = card; navigate('reveal'); }, 'card-back');
      control.setAttribute('aria-label', `选择第 ${index + 1} 张猫牌`);
      choices.append(control);
    });
    root.append(choices, button('重新洗牌', () => { shuffle(); render(); }, 'secondary wide'));
  } else if (stage === 'reveal' && selected) {
    root.append(element('p', '02 / 你选好的牌', 'eyebrow'));
    heading('这只猫，等你亲手翻开。');
    const reveal = button('✧', () => { navigate('result'); void persistResult(); }, 'card-back reveal');
    reveal.setAttribute('aria-label', '翻开我的猫牌');
    root.append(reveal, element('p', '点一下牌面，看看它想提醒你什么。', 'intro'));
  } else if (stage === 'result' && selected) {
    const result = reading()!;
    const concept = miaoCards[selected.id];
    root.append(element('p', `03 / ${scenes[scene].title}`, 'eyebrow'));
    heading(concept.miaoName);
    root.append(element('p', concept.shareText, 'result-quote'), cardFace(selected));
    const meaning = element('section', '', 'meaning');
    meaning.append(element('h2', '换个角度看'), element('p', result.miaoMeaning));
    const detail = element('details');
    detail.append(element('summary', '这张牌的标准依据'), element('p', result.traditionalMeaning), element('p', result.topicMeaning));
    meaning.append(detail);
    const action = element('section', '', 'tiny-action');
    action.append(element('h2', '今天，可以先做这一小步'), element('p', concept.tinyAction));
    root.append(meaning, action, button('把这张猫牌带走', () => { void showPoster(); }, 'primary wide'));
    root.append(button('换个问题再看', resetHome, 'secondary wide'));
    const savedControls = element('div'); savedControls.id = 'saved-result-controls'; root.append(savedControls);
    root.append(element('p', '牌义提供观察角度，不会分析问题原文，也不替你决定。', 'muted'));
    updateSavedResultControls();
  } else if (stage === 'poster' && selected) {
    if (!poster || posterKey !== `${scene}:${selected.id}`) {
      heading('正在准备这张猫牌…');
      root.append(button('回到这次结果', () => navigate('result'), 'secondary wide'));
      return;
    }
    heading('这句话，留给今天的你。');
    root.append(element('p', '图片只带牌面和结果，不含你写下的问题。', 'intro'));
    const preview = element('img');
    preview.src = poster;
    preview.alt = '猫咪状态卡分享图片预览';
    preview.className = 'poster-preview';
    root.append(preview);
    root.append(button('保存图片', () => { void savePoster(); }, 'primary wide'));
    if (getPlatformCapabilities().composeNote) root.append(button('带着图片发小红书', () => { void composePoster(); }, 'secondary wide'));
    root.append(button('回到这次结果', () => navigate('result'), 'text-button wide'));
    root.append(element('p', '也可以长按上图保存。发布前，你仍可以编辑或取消。', 'muted'));
  } else { stage = 'home'; render(); return; }
  const footer = element('footer', '用于自我观察与娱乐。塔罗不预测命运，也不替代专业建议。');
  root.append(footer);
}

async function persistResult() {
  if (!selected) return;
  const next: MiniToolSnapshot = { version: 1, scene, cardId: selected.id, createdAt: new Date().toISOString() };
  recent = next;
  storageNotice = '正在保存这张牌…';
  if (stage === 'result') updateSavedResultControls();
  const operation = pendingPersistence.then(() => saveMiniToolSnapshot(next));
  pendingPersistence = operation;
  const saved = await operation;
  if (recent !== next) return;
  storageNotice = saved ? '已保存这张牌，下次打开可以回看。' : '这次结果仍可阅读，但未能保存；可以先带走图片。';
  if (stage === 'result' && selected?.id === next.cardId && scene === next.scene) updateSavedResultControls();
}
async function deleteRecent() {
  const target = recent;
  const operation = pendingPersistence.then(() => clearMiniToolSnapshot());
  pendingPersistence = operation;
  const deleted = await operation;
  if (recent !== target) return;
  if (deleted) { recent = null; storageNotice = '已删除保存的结果，当前这张牌仍可阅读。'; }
  else storageNotice = '暂时没能删除保存的结果，请重试。';
  updateSavedResultControls();
}
function wrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = '';
  for (const character of Array.from(text)) {
    if (line && context.measureText(line + character).width > maxWidth) {
      context.fillText(line, x, y);
      y += lineHeight;
      line = '';
    }
    line += character;
  }
  if (line) context.fillText(line, x, y);
  return y + lineHeight;
}
async function showPoster(push = true) {
  if (!selected || busy) return;
  busy = true;
  const request = ++requestVersion;
  const fromStage = stage;
  const key = `${scene}:${selected.id}`;
  status('正在把这张猫牌装进图片…');
  try {
    const card = selected;
    const concept = miaoCards[card.id];
    const art = new Image();
    art.src = imagePath(card);
    await new Promise<void>((resolve, reject) => {
      if (art.complete && art.naturalWidth) { resolve(); return; }
      art.onload = () => resolve(); art.onerror = () => reject(new Error('Image unavailable'));
    });
    if (request !== requestVersion || stage !== fromStage || `${scene}:${selected?.id}` !== key) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1600;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = '#fbf7ef'; context.fillRect(0, 0, 1080, 1600);
    context.fillStyle = '#56466c'; context.font = 'bold 30px sans-serif';
    context.fillText('MiaoTarot · 猫咪状态卡', 80, 95);
    context.fillStyle = '#26202e'; context.font = 'bold 58px sans-serif';
    let y = wrappedText(context, concept.miaoName, 80, 190, 920, 74);
    context.font = '34px sans-serif'; y = wrappedText(context, concept.shareText, 80, y + 10, 920, 52);
    context.drawImage(art, 315, y + 15, 450, 630);
    y += 710;
    context.fillStyle = '#56466c'; context.font = 'bold 37px sans-serif';
    y = wrappedText(context, `${getCardName(card)} · ${getCardKeyword(card)} · 正位`, 80, y, 920, 52);
    context.fillStyle = '#26202e'; context.font = '36px sans-serif';
    y = wrappedText(context, concept.uprightMiaoMeaning, 80, y + 20, 920, 54);
    context.font = 'bold 34px sans-serif';
    wrappedText(context, `今天的一步：${concept.tinyAction}`, 80, y + 30, 920, 50);
    context.fillStyle = '#756d7c'; context.font = '25px sans-serif';
    context.fillText('自我观察与娱乐 · 不预测命运', 80, 1530);
    poster = canvas.toDataURL('image/png');
    posterKey = key;
    navigate('poster', push);
  } catch { if (request === requestVersion) status('图片暂时没准备好。结果还在这里，可以重试。'); }
  finally { if (request === requestVersion) busy = false; }
}
async function savePoster() {
  if (busy || !poster) return;
  busy = true;
  try {
    if (getPlatformCapabilities().platform === 'xiaohongshu') {
      status((await saveResultImage(poster)).message);
    } else {
      const link = element('a'); link.href = poster; link.download = 'miaotarot.png'; link.click();
      status('已请求保存图片；若浏览器没有保存，可长按上图。');
    }
  } finally { busy = false; }
}
async function composePoster() {
  if (!selected || busy || !poster) return;
  busy = true;
  try {
    status('正在打开小红书发布页…');
    const result = await openResultNoteComposer({ imageDataUrl: poster, title: '今天的我，被猫牌说中了', content: `${miaoCards[selected.id].shareText}\n抽一张猫牌，换个角度看看自己。仅供自我观察与娱乐。` });
    status(result.message);
  } finally { busy = false; }
}

history.replaceState({ miaoMiniTool: true, stage: 'home' }, '', location.href);
window.addEventListener('popstate', (event) => {
  const next = event.state?.miaoMiniTool ? event.state.stage as Stage : 'home';
  if (event.state?.miaoMiniTool) {
    if (['daily', 'relationship', 'choice'].includes(event.state.scene)) scene = event.state.scene;
    selected = deck.find((card) => card.id === event.state.selectedId) ?? null;
    candidates = (Array.isArray(event.state.candidateIds) ? event.state.candidateIds : [])
      .map((id: string) => deck.find((card) => card.id === id)).filter((card: TarotCard | undefined): card is TarotCard => Boolean(card));
  }
  navigate(next, false);
  if (next === 'poster' && selected && posterKey !== `${scene}:${selected.id}`) void showPoster(false);
});
render();
async function updateWindowInsets() {
  const insets = await getPlatformWindowInsets();
  if (!insets) return;
  root.style.paddingTop = `${22 + insets.top}px`;
  root.style.paddingBottom = `${32 + insets.bottom}px`;
}
void updateWindowInsets();
window.addEventListener('resize', () => { void updateWindowInsets(); });
void loadMiniToolSnapshot(allowedIds).then((snapshot) => {
  if (!recent && snapshot) { recent = snapshot; if (stage === 'home') render(); }
});
