import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cards } from '@cometpisces/tarot-kit';
import { getMiaoPackCardOverride } from '../site/src/domain/miaoContentPacks';
import { miaoMinorCards, type MiaoMinorSuit } from '../site/src/domain/miaoMinorArcana';
import { getCardName } from '../site/src/domain/tarot';

const outputDir = path.join(process.cwd(), 'docs/generated');

const suitVisuals: Record<MiaoMinorSuit, {
  label: string;
  motif: string;
  palette: string;
  atmosphere: string;
}> = {
  cups: {
    label: '圣杯',
    motif: 'small ceramic water bowls shaped like cups',
    palette: 'watery blue, faded lilac, cream, and soft coral',
    atmosphere: 'tender, reflective, intimate, with hand-scribbled ripples',
  },
  pentacles: {
    label: '星币',
    motif: 'round golden pet tags embossed only with a simple five-point star',
    palette: 'mustard yellow, olive green, cardboard brown, and cream',
    atmosphere: 'grounded, tactile, domestic, with visible paper and cardboard grain',
  },
  swords: {
    label: '宝剑',
    motif: 'safe blunt paper swords made from folded silver-gray card',
    palette: 'cool blue-gray, charcoal, cream, and tiny vermilion accents',
    atmosphere: 'clear, tense, thoughtful, with sharp but hand-drawn light shapes',
  },
  wands: {
    label: '权杖',
    motif: 'wooden cat teaser wands with small feather tips',
    palette: 'vermilion, sunflower yellow, warm brown, sky blue, and cream',
    atmosphere: 'kinetic, warm, mischievous, with energetic crayon motion marks',
  },
};

const breedEnglish: Record<string, string> = {
  '孟加拉豹猫': 'Bengal cat',
  '暹罗猫': 'Siamese cat',
  '奶牛猫': 'black-and-white cow-pattern domestic shorthair',
  '布偶猫': 'Ragdoll cat',
  '三花猫': 'calico domestic shorthair',
  '玳瑁猫': 'tortoiseshell domestic shorthair',
  '俄罗斯蓝猫': 'Russian Blue cat',
  '银渐层英短': 'silver-shaded British Shorthair',
  '东方短毛猫': 'Oriental Shorthair cat',
  '英短蓝猫': 'blue British Shorthair',
  '橘猫': 'orange tabby domestic shorthair',
  '中华狸花猫': 'Chinese Li Hua tabby',
};

const courtDirection: Record<string, string> = {
  page: 'Show a curious kitten discovering one clear suit motif, conveying first news and beginner energy.',
  knight: 'Show an adolescent cat in decisive forward motion with one clear suit motif, conveying pursuit and momentum.',
  queen: 'Show a composed adult female cat calmly tending one clear suit motif, conveying inward mastery and care.',
  king: 'Show a mature adult male cat setting order around one clear suit motif, conveying responsibility without stiffness.',
};

function buildPrompt(record: {
  tarotId: string;
  standardName: string;
  miaoName: string;
  scene: string;
  sequence: number;
  rank: string;
  suit: MiaoMinorSuit;
  breed: string;
}) {
  const visual = suitVisuals[record.suit];
  const symbolDirection = record.sequence <= 10
    ? `Across the entire image include exactly ${record.sequence} clearly countable ${visual.motif}; make the count readable without arranging them like a sterile diagram. Do not repeat, silhouette, hang, draw, or decorate with any additional cup-, coin-, sword-, or wand-shaped object in the background, border, sky, clothing, furniture, or pattern.`
    : courtDirection[record.rank];

  return [
    'Use case: stylized-concept',
    'Asset type: square MiaoTarot card illustration for a production web deck',
    `Primary request: Create an original playful cat tarot illustration for “${record.standardName}”, nicknamed “${record.miaoName}”.`,
    `Subject: ${breedEnglish[record.breed] ?? record.breed} (${record.breed}); its coat, face, ears, body shape, and fur length must be unmistakable.`,
    `Scene/backdrop: ${record.scene}.`,
    `Tarot symbolism: ${symbolDirection}`,
    `Style/medium: deliberately rough and lively hand-drawn doodle; loose uneven black ink outlines; wax crayon and colored pencil fills; visible warm cream paper grain; imperfect overlaps, asymmetry, and spontaneous scribble marks; emotionally readable cat expression; the same visual family as a handmade children's-book tarot deck.`,
    `Composition/framing: square full-bleed scene, one strong focal action, generous breathing room, readable at small card size, no printed card border.`,
    `Lighting/mood: ${visual.atmosphere}.`,
    `Color palette: ${visual.palette}; retain natural, recognizable breed coloring.`,
    'Constraints: preserve the traditional card idea through the cat action and suit symbols; countable symbols must be visually distinct; no embedded words, letters, numbers, captions, labels, watermark, logo, human portrait, photorealism, 3D render, glossy vector finish, gore, or occult horror.',
    'Avoid: copying Rider–Waite artwork literally, overly polished digital linework, generic gray tabby substitution, cluttered tiny props, illegible symbol counts, extra limbs, malformed paws, duplicate cats unless the scene explicitly calls for multiple cats.',
  ].join('\n');
}

const minorCards = cards.filter((card) => card.arcana === 'minor');
const records = minorCards.map((card) => {
  const concept = miaoMinorCards[card.id];
  if (!concept) throw new Error(`Missing minor concept: ${card.id}`);
  const breed = getMiaoPackCardOverride('doodle-full', card.id)?.breed;
  if (!breed) throw new Error(`Missing doodle breed: ${card.id}`);
  const record = {
    tarotId: card.id,
    standardName: getCardName(card),
    miaoName: concept.miaoName,
    scene: concept.scene,
    sequence: concept.sequence,
    rank: concept.rank,
    suit: concept.suit,
    suitLabel: suitVisuals[concept.suit].label,
    breed,
    outputPath: `references/miao-pack-masters/doodle/${card.id}.png`,
  };
  return { ...record, prompt: buildPrompt(record) };
});

const markdown = [
  '# MiaoTarot Minor Arcana Image Prompts',
  '',
  '56 张小阿卡纳逐牌生成规范；由小阿卡纳场景数据与 `doodle-full` 猫种配置生成。',
  '',
  ...records.flatMap((record, index) => [
    `## ${String(index + 1).padStart(2, '0')} ${record.standardName}｜${record.miaoName}`,
    '',
    `- Tarot id: \`${record.tarotId}\``,
    `- Suit: ${record.suitLabel}`,
    `- Cat identity: ${record.breed}`,
    `- Output: \`${record.outputPath}\``,
    '',
    '```text',
    record.prompt,
    '```',
    '',
  ]),
].join('\n');

await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDir, 'miao-minor-art-prompts.json'), `${JSON.stringify(records, null, 2)}\n`),
  writeFile(path.join(outputDir, 'miao-minor-art-prompts.md'), markdown),
]);

console.log(`Exported ${records.length} MiaoTarot Minor Arcana image prompts to docs/generated/`);
