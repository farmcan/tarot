import { getImagePath } from '@cometpisces/tarot-kit-images';

import foolImage from '@cometpisces/tarot-kit-images/images/00-TheFool.png';
import magicianImage from '@cometpisces/tarot-kit-images/images/01-TheMagician.png';
import highPriestessImage from '@cometpisces/tarot-kit-images/images/02-TheHighPriestess.png';
import empressImage from '@cometpisces/tarot-kit-images/images/03-TheEmpress.png';
import emperorImage from '@cometpisces/tarot-kit-images/images/04-TheEmperor.png';
import hierophantImage from '@cometpisces/tarot-kit-images/images/05-TheHierophant.png';
import loversImage from '@cometpisces/tarot-kit-images/images/06-TheLovers.png';
import chariotImage from '@cometpisces/tarot-kit-images/images/07-TheChariot.png';
import strengthImage from '@cometpisces/tarot-kit-images/images/08-Strength.png';
import hermitImage from '@cometpisces/tarot-kit-images/images/09-TheHermit.png';
import wheelImage from '@cometpisces/tarot-kit-images/images/10-WheelOfFortune.png';
import justiceImage from '@cometpisces/tarot-kit-images/images/11-Justice.png';
import hangedManImage from '@cometpisces/tarot-kit-images/images/12-TheHangedMan.png';
import deathImage from '@cometpisces/tarot-kit-images/images/13-Death.png';
import temperanceImage from '@cometpisces/tarot-kit-images/images/14-Temperance.png';
import devilImage from '@cometpisces/tarot-kit-images/images/15-TheDevil.png';
import towerImage from '@cometpisces/tarot-kit-images/images/16-TheTower.png';
import starImage from '@cometpisces/tarot-kit-images/images/17-TheStar.png';
import moonImage from '@cometpisces/tarot-kit-images/images/18-TheMoon.png';
import sunImage from '@cometpisces/tarot-kit-images/images/19-TheSun.png';
import judgementImage from '@cometpisces/tarot-kit-images/images/20-Judgement.png';
import worldImage from '@cometpisces/tarot-kit-images/images/21-TheWorld.png';

export interface MiaoArtDirection {
  tarotId: string;
  standardImage: string;
  standardImageFilename: string;
  generatedImage?: string;
  memeBase: MiaoMemeBase;
  standardSymbols: readonly string[];
  catScene: string;
  composition: string;
}

export interface MiaoMemeBase {
  code: string;
  name: string;
  baseImagePath: string;
  miaotiAsset: string;
  rawSearch: string;
  behaviorAnchor: string;
  tarotFusion: string;
}

export const miaoTarotArtStyle = [
  'square 1:1 illustration for a shareable web tarot result',
  'original cat meme tarot card built from a real meme-base pose plus Rider-Waite-Smith symbolism, not a traced copy',
  'single expressive domestic cat as the main character, with the meme base pose still recognizable',
  'clean editorial illustration, crisp silhouette, warm daylight, high readability on mobile',
  'no embedded text, no watermark, no logo, no human portrait, no gore',
].join('; ');

const standardImages: Record<string, string> = {
  'the-fool': foolImage,
  'the-magician': magicianImage,
  'the-high-priestess': highPriestessImage,
  'the-empress': empressImage,
  'the-emperor': emperorImage,
  'the-hierophant': hierophantImage,
  'the-lovers': loversImage,
  'the-chariot': chariotImage,
  strength: strengthImage,
  'the-hermit': hermitImage,
  'wheel-of-fortune': wheelImage,
  justice: justiceImage,
  'the-hanged-man': hangedManImage,
  death: deathImage,
  temperance: temperanceImage,
  'the-devil': devilImage,
  'the-tower': towerImage,
  'the-star': starImage,
  'the-moon': moonImage,
  'the-sun': sunImage,
  judgement: judgementImage,
  'the-world': worldImage,
};

const generatedImages: Record<string, string> = {
  'the-fool': './assets/miao-cards/the-fool.png',
  'the-magician': './assets/miao-cards/the-magician.png',
  'the-high-priestess': './assets/miao-cards/the-high-priestess.png',
  'the-empress': './assets/miao-cards/the-empress.png',
  'the-emperor': './assets/miao-cards/the-emperor.png',
  'the-hierophant': './assets/miao-cards/the-hierophant.png',
  'the-lovers': './assets/miao-cards/the-lovers.png',
  'the-chariot': './assets/miao-cards/the-chariot.png',
  strength: './assets/miao-cards/strength.png',
  'the-hermit': './assets/miao-cards/the-hermit.png',
  'wheel-of-fortune': './assets/miao-cards/wheel-of-fortune.png',
  justice: './assets/miao-cards/justice.png',
  'the-hanged-man': './assets/miao-cards/the-hanged-man.png',
  death: './assets/miao-cards/death.png',
  temperance: './assets/miao-cards/temperance.png',
  'the-devil': './assets/miao-cards/the-devil.png',
  'the-tower': './assets/miao-cards/the-tower.png',
  'the-star': './assets/miao-cards/the-star.png',
  'the-moon': './assets/miao-cards/the-moon.png',
  'the-sun': './assets/miao-cards/the-sun.png',
  judgement: './assets/miao-cards/judgement.png',
  'the-world': './assets/miao-cards/the-world.png',
};

const memeBases: Record<string, MiaoMemeBase> = {
  'the-fool': {
    code: 'ZOOM',
    name: '开猫 / zoomies cat',
    baseImagePath: 'references/miao-meme-bases/the-fool-zoom.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/ZOOM/zoom-static.png',
    rawSearch: 'zoomies cat running hallway meme',
    behaviorAnchor: 'a cat mid-sprint, body already moving before the plan is clear',
    tarotFusion: 'turn the sprint into the Fool stepping past a threshold, with open sky and a tiny travel bundle',
  },
  'the-magician': {
    code: 'PAWS',
    name: '伸爪猫 / reaching cat',
    baseImagePath: 'references/miao-meme-bases/the-magician-paws.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/PAWS/paws-static.png',
    rawSearch: 'reaching cat paw meme',
    behaviorAnchor: 'a cat stretching one paw toward something just within reach',
    tarotFusion: 'make the reaching paw feel like the Magician activating tools on the table',
  },
  'the-high-priestess': {
    code: 'STARE',
    name: '盯人猫 / staring cat',
    baseImagePath: 'references/miao-meme-bases/the-high-priestess-stare.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/STARE/stare-static.png',
    rawSearch: 'staring cat meme intense eyes',
    behaviorAnchor: 'a still cat staring straight through the viewer',
    tarotFusion: 'place the stare between two pillars and a veil, like secret knowledge that refuses to explain itself',
  },
  'the-empress': {
    code: 'NAPPY',
    name: '午睡王 / sleeping cat',
    baseImagePath: 'references/miao-meme-bases/the-empress-nappy.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/NAPPY/nappy-static.png',
    rawSearch: 'sleeping cat sprawled meme',
    behaviorAnchor: 'a cat sprawled in total comfort, visibly recharging',
    tarotFusion: 'turn the rest pose into Empress abundance with plants, food bowl, and a warm sun patch',
  },
  'the-emperor': {
    code: 'KEYS',
    name: '键盘猫 / keyboard cat',
    baseImagePath: 'references/miao-meme-bases/the-emperor-keys.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/KEYS/keys-static.png',
    rawSearch: 'cat sitting on keyboard meme',
    behaviorAnchor: 'a cat occupying the keyboard as if it owns the whole workstation',
    tarotFusion: 'make the keyboard a throne and arrange desk objects like an Emperor court',
  },
  'the-hierophant': {
    code: 'ZEN',
    name: '禅猫 / meditating cat',
    baseImagePath: 'references/miao-meme-bases/the-hierophant-zen.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/ZEN/zen-static.png',
    rawSearch: 'zen cat sitting meme',
    behaviorAnchor: 'a perfectly still seated cat that looks like it invented a rule',
    tarotFusion: 'turn the stillness into a ceremonial teaching scene with keys, pillars, and repeated ritual props',
  },
  'the-lovers': {
    code: 'FLIRT',
    name: '撩人猫 / slow blink cat',
    baseImagePath: 'references/miao-meme-bases/the-lovers-flirt.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/FLIRT/flirt-static.png',
    rawSearch: 'slow blink cat flirt meme',
    behaviorAnchor: 'a cat leaning in with soft eyes and controlled affection',
    tarotFusion: 'use the lean-in as the Lovers choice moment, with a clear affection/boundary split',
  },
  'the-chariot': {
    code: 'OIIA',
    name: 'OIIA 闲不住猫 / spinning cat',
    baseImagePath: 'references/miao-meme-bases/the-chariot-oiia.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/OIIA/oiia-static.png',
    rawSearch: 'oiia cat spinning meme',
    behaviorAnchor: 'a cat trapped in unstoppable loop energy',
    tarotFusion: 'turn the loop into Chariot momentum, with two opposing toy targets and a hallway track',
  },
  strength: {
    code: 'HISS',
    name: '哈气猫 / hissing cat',
    baseImagePath: 'references/miao-meme-bases/strength-hiss.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/HISS/hiss-static.png',
    rawSearch: 'hissing cat arched back meme',
    behaviorAnchor: 'a high-emotion defensive cat with visible boundary energy',
    tarotFusion: 'soften the pose into Strength: the emotion is present, but gently held rather than unleashed',
  },
  'the-hermit': {
    code: 'BOX',
    name: '纸箱猫 / box cat',
    baseImagePath: 'references/miao-meme-bases/the-hermit-box.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/BOX/box-static.png',
    rawSearch: 'cat in cardboard box meme',
    behaviorAnchor: 'a cat using a box as a private universe',
    tarotFusion: 'make the box a Hermit cave with a small lantern glow inside',
  },
  'wheel-of-fortune': {
    code: 'WOBBLE',
    name: '醉猫 / wobble cat',
    baseImagePath: 'references/miao-meme-bases/wheel-of-fortune-wobble.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/WOBBLE/wobble-static.png',
    rawSearch: 'wobbly cat meme',
    behaviorAnchor: 'a cat visibly off-balance, caught mid-wobble',
    tarotFusion: 'make the wobble read as the Wheel turning under the cat, not as random clumsiness',
  },
  justice: {
    code: 'SMUG',
    name: '皇帝猫 / smug cat',
    baseImagePath: 'references/miao-meme-bases/justice-smug.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/SMUG/smug-static.png',
    rawSearch: 'smug cat judging meme',
    behaviorAnchor: 'a cat with a superior judging expression',
    tarotFusion: 'put the judgement face over scales, can opener, and balanced kitchen props',
  },
  'the-hanged-man': {
    code: 'TILT',
    name: '歪头猫 / head tilt cat',
    baseImagePath: 'references/miao-meme-bases/the-hanged-man-tilt.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/TILT/tilt-static.png',
    rawSearch: 'head tilt cat confused meme',
    behaviorAnchor: 'a tilted head that makes the world feel rotated',
    tarotFusion: 'push the tilt into an upside-down sofa composition with Hanged Man pause symbolism',
  },
  death: {
    code: 'HIDE',
    name: '榴莲猫 / hiding cat',
    baseImagePath: 'references/miao-meme-bases/death-hide.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/HIDE/hide-static.png',
    rawSearch: 'hiding cat meme under furniture',
    behaviorAnchor: 'a cat retreating from one container or safe place',
    tarotFusion: 'make the retreat an ending-and-renewal transition from old box to new space',
  },
  temperance: {
    code: 'LICK',
    name: '臭美猫 / grooming cat',
    baseImagePath: 'references/miao-meme-bases/temperance-lick.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/LICK/lick-static.png',
    rawSearch: 'cat grooming paw meme',
    behaviorAnchor: 'a careful self-grooming cat with precise standards',
    tarotFusion: 'translate the grooming precision into Temperance mixing, pouring, and fine adjustment',
  },
  'the-devil': {
    code: 'NYAN',
    name: '彩虹猫 / catnip joy cat',
    baseImagePath: 'references/miao-meme-bases/the-devil-nyan.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/NYAN/nyan-static.png',
    rawSearch: 'catnip cat rainbow meme',
    behaviorAnchor: 'a cat overwhelmed by pleasure and high-energy temptation',
    tarotFusion: 'keep it funny, but add soft ribbon-chain and temptation symbols from the Devil',
  },
  'the-tower': {
    code: 'PUSH',
    name: '推杯猫 / pushing cup cat',
    baseImagePath: 'references/miao-meme-bases/the-tower-push.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/PUSH/push-static.png',
    rawSearch: 'cat pushing cup off table meme',
    behaviorAnchor: 'one paw calmly pushing an object toward inevitable collapse',
    tarotFusion: 'make the falling cup the Tower event, with lightning-shaped motion and no injury',
  },
  'the-star': {
    code: 'KITTEN',
    name: '小奶猫 / soft kitten',
    baseImagePath: 'references/miao-meme-bases/the-star-kitten.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/KITTEN/kitten-static.png',
    rawSearch: 'soft kitten comfort meme',
    behaviorAnchor: 'a small soft cat that makes the scene feel safe again',
    tarotFusion: 'place the softness under a starry window with water reflection and hopeful negative space',
  },
  'the-moon': {
    code: 'WOAH',
    name: '瞪眼猫 / shocked cat',
    baseImagePath: 'references/miao-meme-bases/the-moon-woah.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/WOAH/woah-static.png',
    rawSearch: 'shocked wide eyed cat meme',
    behaviorAnchor: 'wide eyes reacting to something uncertain or maybe imaginary',
    tarotFusion: 'put the startled cat on a moonlit path with two doorframes and ambiguous shadows',
  },
  'the-sun': {
    code: 'BELLY',
    name: '翻肚皮猫 / belly cat',
    baseImagePath: 'references/miao-meme-bases/the-sun-belly.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/BELLY/belly-static.png',
    rawSearch: 'cat lying belly up meme',
    behaviorAnchor: 'a belly-up pose that signals trust and joy',
    tarotFusion: 'turn the open belly into the Sun card warmth, flowers, and uncomplicated happiness',
  },
  judgement: {
    code: 'DRAMA',
    name: '显眼猫 / dramatic cat',
    baseImagePath: 'references/miao-meme-bases/judgement-drama.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/DRAMA/drama-static.png',
    rawSearch: 'dramatic cat yelling meme',
    behaviorAnchor: 'a cat overreacting as if summoned by destiny',
    tarotFusion: 'make the drama the Judgement trumpet moment triggered by a can-opening sound',
  },
  'the-world': {
    code: 'LOAF',
    name: '撤退猫 / loaf cat',
    baseImagePath: 'references/miao-meme-bases/the-world-loaf.png',
    miaotiAsset: '../miaoti/site/assets/cat-types/LOAF/loaf-static.png',
    rawSearch: 'cat loaf relaxed meme',
    behaviorAnchor: 'a cat compact and complete, settled into its final shape',
    tarotFusion: 'turn the loaf into completion inside a wreath-like blanket ring with four corner symbols',
  },
};

const rawDirections = [
  {
    tarotId: 'the-fool',
    standardSymbols: ['cliff edge', 'small bundle', 'white rose', 'sunlit open sky'],
    catScene: 'a curious cat steps out from a doorway with a tiny bundle toy and an unfolded route map, excited before planning',
    composition: 'low-angle forward motion, empty space ahead, one paw lifted just before the threshold',
  },
  {
    tarotId: 'the-magician',
    standardSymbols: ['raised wand', 'table of tools', 'infinity sign', 'red and white flowers'],
    catScene: 'a clever cat opens a cabinet and reveals neatly arranged tools, looking ready to turn an idea into action',
    composition: 'front-facing table/cabinet composition with tools clearly visible around the cat paws',
  },
  {
    tarotId: 'the-high-priestess',
    standardSymbols: ['two pillars', 'veil', 'moon', 'hidden scroll'],
    catScene: 'a silent cat sits between curtains at night, watching with moonlit eyes and a half-hidden note nearby',
    composition: 'symmetrical night interior, the cat centered as the keeper of a secret',
  },
  {
    tarotId: 'the-empress',
    standardSymbols: ['cushion or throne', 'wheat field', 'lush nature', 'venus shield'],
    catScene: 'a soft cat sprawls inside a warm block of sunlight, surrounded by plants, food bowl, and gentle abundance',
    composition: 'rounded restful pose, warm domestic garden light, nurturing stillness',
  },
  {
    tarotId: 'the-emperor',
    standardSymbols: ['stone throne', 'ram motif', 'mountains', 'scepter'],
    catScene: 'a serious cat occupies a keyboard like a throne, setting boundaries in a tidy work territory',
    composition: 'stable triangular composition, cat centered and immovable, desk objects arranged like a small kingdom',
  },
  {
    tarotId: 'the-hierophant',
    standardSymbols: ['ritual gesture', 'two followers', 'keys', 'formal pillars'],
    catScene: 'a ceremonial cat demonstrates the correct litter-box ritual with a tiny scoop and rule markers',
    composition: 'formal teaching scene, repeated symmetrical props, humorous but reverent order',
  },
  {
    tarotId: 'the-lovers',
    standardSymbols: ['two figures', 'angel above', 'tree and serpent', 'choice'],
    catScene: 'a cat leans in for affection while gently testing the boundary with a tiny bite, showing closeness and choice',
    composition: 'two-sided relationship framing, cat and offered hand separated by a clear boundary line',
  },
  {
    tarotId: 'the-chariot',
    standardSymbols: ['chariot', 'two sphinxes', 'city behind', 'star canopy'],
    catScene: 'a cat launches into midnight hallway zoomies, with motion trails and two toy targets pulling in different directions',
    composition: 'dynamic diagonal sprint, hallway as track, focused forward energy',
  },
  {
    tarotId: 'strength',
    standardSymbols: ['gentle figure', 'lion', 'infinity sign', 'calm control'],
    catScene: 'a calm cat gently presses a person hand down, not attacking, simply stabilizing the moment',
    composition: 'close gentle contact, soft strength, rounded shapes and quiet confidence',
  },
  {
    tarotId: 'the-hermit',
    standardSymbols: ['lantern', 'staff', 'mountain', 'solitude'],
    catScene: 'a cat retreats into a cardboard box with only bright eyes visible, treating solitude as a system upgrade',
    composition: 'dark quiet room, box as mountain cave, small warm lantern-like glow inside',
  },
  {
    tarotId: 'wheel-of-fortune',
    standardSymbols: ['turning wheel', 'four creatures', 'clouds', 'cycle'],
    catScene: 'a cat suddenly moves sideways across furniture while a circular toy track suggests an unpredictable cycle',
    composition: 'circular motion path around the cat, playful chaos contained in a readable wheel shape',
  },
  {
    tarotId: 'justice',
    standardSymbols: ['scales', 'sword', 'red robe', 'two pillars'],
    catScene: 'a judging cat inspects an opened can as if weighing fairness, standards, and consequences',
    composition: 'balanced left-right layout with can, paw, and scale-like kitchen props',
  },
  {
    tarotId: 'the-hanged-man',
    standardSymbols: ['upside-down figure', 'tree frame', 'halo', 'pause'],
    catScene: 'a cat hangs upside down from a sofa edge, calmly seeing the room from a strange but useful angle',
    composition: 'inverted central figure, sofa frame replacing the tree, gentle halo of afternoon light',
  },
  {
    tarotId: 'death',
    standardSymbols: ['black horse', 'white rose', 'sunrise', 'ending and renewal'],
    catScene: 'a cat leaves an old cardboard box beside a recycle mark, making room for a new box in the distance',
    composition: 'left-to-right transition, old object behind, sunrise-like new space ahead',
  },
  {
    tarotId: 'temperance',
    standardSymbols: ['pouring cups', 'one foot in water', 'path to mountains', 'angel wings'],
    catScene: 'a careful cat studies a water bowl, adjusting temperature and rhythm instead of choosing extremes',
    composition: 'calm centered bowl, small pouring motion, balanced warm and cool color fields',
  },
  {
    tarotId: 'the-devil',
    standardSymbols: ['chains', 'horned figure', 'torch', 'temptation'],
    catScene: 'a cat rolls in catnip with comic intensity, joyful but visibly close to losing control',
    composition: 'low warm light, loose ribbon-like chains as metaphor, playful temptation without horror',
  },
  {
    tarotId: 'the-tower',
    standardSymbols: ['lightning tower', 'falling figures', 'crown', 'sudden break'],
    catScene: 'a cat pushes a cup from a table, exposing the weak structure with one tiny paw',
    composition: 'vertical falling cup, dramatic diagonal lightning-shaped motion, no injury or fear',
  },
  {
    tarotId: 'the-star',
    standardSymbols: ['starry sky', 'water pouring', 'naked figure by water', 'hope'],
    catScene: 'a cat glows softly by a window at night, restoring trust under stars and a small water bowl reflection',
    composition: 'open quiet window, star shape echo in highlights, breathable hopeful negative space',
  },
  {
    tarotId: 'the-moon',
    standardSymbols: ['moon', 'two towers', 'dog and wolf', 'crayfish', 'uncertain path'],
    catScene: 'a cat hisses at empty air in a dim hallway, while soft shadows show anxiety and projection',
    composition: 'moonlit corridor with two doorframes as towers, ambiguous shadow kept gentle',
  },
  {
    tarotId: 'the-sun',
    standardSymbols: ['sun', 'child on horse', 'sunflowers', 'wall'],
    catScene: 'a relaxed cat lies belly-up in bright sunlight, simple joy filling the whole room',
    composition: 'large clear sun patch, open belly pose centered, cheerful flowers or yellow toys around',
  },
  {
    tarotId: 'judgement',
    standardSymbols: ['angel trumpet', 'rising figures', 'flag', 'awakening'],
    catScene: 'a sleeping cat instantly wakes at the sound of a can opening, answering a ridiculous but real calling',
    composition: 'upward awakening motion, sound-wave shapes like a trumpet, blanket folds like rising hills',
  },
  {
    tarotId: 'the-world',
    standardSymbols: ['wreath', 'four corner figures', 'dancing figure', 'completion'],
    catScene: 'a cat fully melts into a blanket after finishing the loop, complete and safely landed',
    composition: 'rounded wreath-like blanket ring, cat in the center, four tiny room-corner symbols for completion',
  },
] as const;

export const miaoArtDirections: Record<string, MiaoArtDirection> = Object.fromEntries(
  rawDirections.map((direction) => [
    direction.tarotId,
    {
      ...direction,
      standardImage: standardImages[direction.tarotId],
      standardImageFilename: getImagePath(direction.tarotId) || '',
      generatedImage: generatedImages[direction.tarotId],
      memeBase: memeBases[direction.tarotId],
    },
  ]),
);

export function getMiaoArtDirection(tarotId: string) {
  return miaoArtDirections[tarotId] ?? miaoArtDirections['the-fool'];
}

export function buildMiaoImagePrompt(cardTitle: string, direction: MiaoArtDirection) {
  return [
    `Asset: MiaoTarot result image for ${cardTitle}.`,
    `Style: ${miaoTarotArtStyle}.`,
    `Meme base image: use ${direction.memeBase.baseImagePath} (${direction.memeBase.name}) as the pose/expression anchor.`,
    `Meme behavior to preserve: ${direction.memeBase.behaviorAnchor}.`,
    `Tarot fusion rule: ${direction.memeBase.tarotFusion}.`,
    `Reference Tarot symbols to preserve: ${direction.standardSymbols.join(', ')}.`,
    `Cat scene: ${direction.catScene}.`,
    `Composition: ${direction.composition}.`,
    'Prompt formula: meme-base pose/expression + 2-4 Rider-Waite symbols + Miao card emotional state + clean product illustration.',
    'Make the image feel like a finished product asset, not a sketch; readable at 360px wide.',
  ].join('\n');
}
