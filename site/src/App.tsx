import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  CopyButton,
  Divider,
  FocusTrap,
  Grid,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Timeline,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  BrainCircuit,
  BookOpenText,
  CalendarDays,
  Cat,
  Check,
  Copy,
  Database,
  Download,
  Eye,
  ExternalLink,
  Heart,
  LibraryBig,
  Layers3,
  PanelsTopLeft,
  Send,
  Share2,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
import { useFocusReturn, useMediaQuery } from '@mantine/hooks';
import {
  buildMiaoLlmPayload,
  buildMiaoLlmPrompt,
  callMiaoLlmEndpoint,
  loadLlmAvailability,
  parseStructuredLlmResult,
} from './domain/llm';
import { getMiaoContentBundle } from './domain/miaoContent';
import {
  createMiaoSynthesis,
  getMiaoReadingAnchor,
  getMiaoVisual,
  getMiaoOrientationLabel,
  getTraditionalLine,
  type MiaoCard,
  type MiaoReading,
  type MiaoReadingCard,
} from './domain/miaoTarot';
import {
  getCardKeyword,
  getCardName,
  spreads,
  type ReadingTopic,
} from './domain/tarot';
import { getTarotTheme, tarotThemeList, type TarotThemeId } from './domain/themes';
import { createThemedDeckAdapter } from './domain/themeAdapter';
import type { ThemedCard, ThemedReading } from './domain/themedTarot';
import { loadSiteCounter } from './domain/siteCounter';
import { createReadingShareUrl, parseReadingShareUrl } from './domain/readingShare';
import { createDailyMiaoReading } from './domain/dailyReading';
import { getReadingFingerprint, loadReadingHistory, saveReadingHistory } from './domain/readingHistory';
import { trackProductEvent } from './domain/productAnalytics';
import { InteractiveDrawTable } from './components/InteractiveDrawTable';
import type { InteractiveDrawStage } from './domain/interactiveDraw';
import { cards } from '@cometpisces/tarot-kit';
import {
  DEFAULT_MIAO_CONTENT_PACK_ID,
  getMiaoContentPack,
  getMiaoContentPackCardIds,
  getMiaoContentPackFrame,
  type MiaoContentPackId,
} from './domain/miaoContentPacks';
import { getMiaoCard } from './domain/miaoTarot';

const activeTheme = getTarotTheme();
const quickQuestions = activeTheme.quickQuestions;
const MOBILE_READING_HISTORY_KEY = 'miaotarotMobileReading';
// Set the real support page here and replace the placeholder asset when payment is ready.
const SUPPORT_URL = '';
const SUPPORT_QR_IMAGE = `${import.meta.env.BASE_URL}assets/support-qr-placeholder.svg`;

type ProductInfoTab = 'product' | 'meanings' | 'sources';

const sourceRows = [
  {
    name: '@cometpisces/tarot-kit',
    role: 'MIT 牌义与抽牌基础',
    take: '直接 import 78 张牌数据、中文含义、正逆位和 helper，不重复写基础牌库。',
    url: 'https://www.npmjs.com/package/@cometpisces/tarot-kit',
  },
  {
    name: '@cometpisces/tarot-kit-images',
    role: '标准 Rider-Waite 图像参考',
    take: '直接 import 78 张标准牌图和 card id -> image helper，用来审核猫牌构图和生成图 prompt。',
    url: 'https://www.npmjs.com/package/@cometpisces/tarot-kit-images',
  },
  {
    name: 'MiaoTI',
    role: '猫咪表达与分享体验参考',
    take: '沿用轻情绪表达和结果分享思路；MiaoTarot 的牌义、文案与牌面均独立组织。',
  },
  {
    name: 'MiaoTarot 内容方法',
    role: '站内牌义与解释规则',
    take: '传统牌义提供骨架，牌阵位置和提问语境负责收窄含义，猫语与小行动负责落地。',
  },
];

function iconNode(Icon: typeof Sparkles) {
  return <Icon size={18} strokeWidth={1.8} />;
}

const tarotSuitGuide = [
  { name: '权杖', role: '行动与创造', mark: 'W' },
  { name: '圣杯', role: '情感与关系', mark: 'C' },
  { name: '宝剑', role: '思考与冲突', mark: 'S' },
  { name: '星币', role: '资源与现实', mark: 'P' },
] as const;

function TarotPrimer() {
  return (
    <section className="tarotPrimer" aria-labelledby="tarot-primer-title">
      <Container size="xl">
        <Group justify="space-between" align="flex-end" gap="md" mb="lg">
          <div>
            <Badge color="violet" variant="light">30 秒认识塔罗</Badge>
            <Title order={2} id="tarot-primer-title" className="primerTitle" mt="xs">
              想了解？30 秒认识塔罗
            </Title>
          </div>
          <Text size="sm" c="dimmed" className="primerIntro">
            它最初是一种纸牌游戏；今天，我们借它的图像与位置换个角度整理问题。
          </Text>
        </Group>

        <Tabs defaultValue="structure" className="primerTabs" keepMounted={false}>
          <Tabs.List grow>
            <Tabs.Tab value="history" leftSection={<BookOpenText size={17} />}>从哪来</Tabs.Tab>
            <Tabs.Tab value="structure" leftSection={<Layers3 size={17} />}>78 张怎么组成</Tabs.Tab>
            <Tabs.Tab value="reading" leftSection={<Eye size={17} />}>一张牌怎么读</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="history" pt="lg">
            <Grid gap="xl" align="center">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Timeline active={2} bulletSize={28} lineWidth={2}>
                  <Timeline.Item title="15 世纪 · 北意大利纸牌">
                    <Text c="dimmed" size="sm">最早的塔罗记录来自 1440–1450 年代；当时它首先是一种带王牌的纸牌游戏。</Text>
                  </Timeline.Item>
                  <Timeline.Item title="19 世纪 · 象征与占卜">
                    <Text c="dimmed" size="sm">塔罗与占卜、神秘学的关联在这一时期逐渐流行起来。</Text>
                  </Timeline.Item>
                  <Timeline.Item title="今天 · 一套图像语言">
                    <Text c="dimmed" size="sm">不必相信宿命，也可以用牌面、牌阵和提问看见被忽略的角度。</Text>
                  </Timeline.Item>
                </Timeline>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Paper withBorder p="lg" className="primerAside">
                  <Text fw={800}>先是游戏，后来才用于占卜</Text>
                  <Text size="sm" c="dimmed" mt="xs">这段历史提醒我们：塔罗不是唯一答案，更像一次有结构的自我对话。</Text>
                  <Anchor href="https://www.metmuseum.org/perspectives/tarot-2" target="_blank" rel="noreferrer" size="sm" mt="md" className="primerSource">
                    查看大都会艺术博物馆的塔罗史 <ExternalLink size={13} />
                  </Anchor>
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="structure" pt="lg">
            <div className="deckStructure">
              <Paper withBorder p="lg" className="arcanaBlock majorBlock">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text className="arcanaCount">22</Text>
                    <Title order={3} size="h4">大阿卡纳</Title>
                    <Text size="sm" c="dimmed" mt={4}>从愚人到世界，常用来谈人生阶段、核心课题与重要转折。</Text>
                  </div>
                  <div className="primerCardFan" role="img" aria-label="三张大阿卡纳猫牌示例">
                    {['the-fool', 'the-star', 'the-world'].map((card) => (
                      <img key={card} src={`${import.meta.env.BASE_URL}assets/miao-packs/doodle/${card}.avif`} alt="" loading="lazy" />
                    ))}
                  </div>
                </Group>
              </Paper>
              <Paper withBorder p="lg" className="arcanaBlock minorBlock">
                <Text className="arcanaCount">56</Text>
                <Title order={3} size="h4">小阿卡纳</Title>
                <Text size="sm" c="dimmed" mt={4}>四个花色各 14 张：10 张数字牌，加上侍从、骑士、王后、国王。</Text>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mt="md">
                  {tarotSuitGuide.map((suit) => (
                    <div className="suitChip" key={suit.name}>
                      <span>{suit.mark}</span>
                      <div><strong>{suit.name}</strong><small>{suit.role}</small></div>
                    </div>
                  ))}
                </SimpleGrid>
              </Paper>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="reading" pt="lg">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              {[
                ['01', '先看牌面', '标准牌名与传统牌义，提供这张牌最基础的象征骨架。'],
                ['02', '再看方向', '正位与逆位不是好坏判决，而是能量顺畅、受阻或向内的不同表达。'],
                ['03', '最后看位置', '同一张牌落在过去、建议或结果位，会回答问题的不同部分。'],
              ].map(([step, title, body]) => (
                <Paper withBorder p="lg" className="readingLayer" key={step}>
                  <span>{step}</span>
                  <Title order={3} size="h4" mt="md">{title}</Title>
                  <Text size="sm" c="dimmed" mt="xs">{body}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </section>
  );
}

function ProductInfo({
  activeTab,
  onTabChange,
  onOpenGallery,
}: {
  activeTab: ProductInfoTab;
  onTabChange: (tab: ProductInfoTab) => void;
  onOpenGallery: () => void;
}) {
  return (
    <Tabs
      value={activeTab}
      onChange={(value) => value && onTabChange(value as ProductInfoTab)}
      keepMounted={false}
      className="productInfoTabs"
    >
      <Tabs.List grow>
        <Tabs.Tab value="product" leftSection={<Cat size={16} />}>产品说明</Tabs.Tab>
        <Tabs.Tab value="meanings" leftSection={<BookOpenText size={16} />}>牌义怎么读</Tabs.Tab>
        <Tabs.Tab value="sources" leftSection={<LibraryBig size={16} />}>来源与关注</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="product" pt="lg">
        <Stack gap="lg">
          <Paper p="xl" className="productInfoHero">
            <Badge color="violet" variant="filled">60 秒自我观察</Badge>
            <Title order={2} mt="sm">猫不会替你做决定，但会陪你把问题看清一点。</Title>
            <Text mt="sm">
              MiaoTarot 是一套以标准塔罗结构为骨架、用猫咪涂鸦降低理解门槛的轻量自我观察工具。
              它不预测命运，也不会把一张牌包装成唯一答案。
            </Text>
          </Paper>

          <div>
            <Title order={3} size="h4" mb="sm">一次完整体验</Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              {[
                ['01', '写下问题', '尽量问“我可以看见或做什么”，比只问吉凶更容易得到可用的提醒。'],
                ['02', '亲手抽牌', '牌由前端牌组随机抽取；AI 不参与洗牌、选牌，也不会事后替换结果。'],
                ['03', '带走一步', '结合牌面、正逆位和牌阵位置读完解释，再选一个代价可控的小行动。'],
              ].map(([step, title, body]) => (
                <Paper withBorder p="lg" className="productInfoStep" key={step}>
                  <Text className="productInfoStepNumber">{step}</Text>
                  <Text fw={850} mt="sm">{title}</Text>
                  <Text size="sm" c="dimmed" mt={5}>{body}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </div>

          <Paper withBorder p="lg" className="productBoundary">
            <Group align="flex-start" wrap="nowrap">
              <ThemeIcon color="teal" variant="light" size="lg">{iconNode(Eye)}</ThemeIcon>
              <div>
                <Text fw={850}>我们怎样守住边界</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  解读使用“可能、提醒、可以尝试”一类语言，不声称预知未来；医疗、法律、财务或安全问题应交给相应专业人士。
                  你的问题、笔记和牌面内容不会被匿名游玩统计上传，最近记录只保存在当前浏览器。
                </Text>
              </div>
            </Group>
          </Paper>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="meanings" pt="lg">
        <Stack gap="lg">
          <div>
            <Badge color="teal" variant="light">从骨架到行动</Badge>
            <Title order={2} size="h3" mt="xs">一张猫牌，不只是一句“好运 / 坏运”。</Title>
            <Text c="dimmed" mt="xs">
              每次解释都从同一套规则出发，再根据你抽到的位置和提问语境逐层收窄。
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper withBorder p="lg" className="meaningMethodCard">
              <Text fw={850}>78 张牌的结构</Text>
              <Text size="sm" c="dimmed" mt="xs">
                22 张大阿卡纳常用来观察人生阶段、核心课题与转折；56 张小阿卡纳分为权杖、圣杯、宝剑、星币，
                更贴近日常的行动、关系、思考与资源。
              </Text>
            </Paper>
            <Paper withBorder p="lg" className="meaningMethodCard">
              <Text fw={850}>逆位不等于坏结果</Text>
              <Text size="sm" c="dimmed" mt="xs">
                逆位可能表示能量受阻或延迟、表达转向内在、程度过强或不足，也可能提醒你换一个角度理解正位主题。
              </Text>
            </Paper>
          </SimpleGrid>

          <div>
            <Title order={3} size="h4" mb="sm">我们按这 5 层来读</Title>
            <Stack gap="xs" className="meaningLayers">
              {[
                ['1', '传统牌义', '牌名、象征、关键词与正逆位含义，构成不会随问题任意改变的基础。'],
                ['2', '牌阵位置', '同一张牌在“现状”“阻力”“建议”或“下一步”里，会回答不同部分。'],
                ['3', '提问语境', '关系、工作或一般议题会改变例子和落点，但不会推翻基础牌义。'],
                ['4', '猫语翻译', '猫咪表情和文案负责把抽象象征翻成直觉可懂的情绪状态，不冒充新的占卜体系。'],
                ['5', '微小行动', '最后给出一个可以验证、可以拒绝、代价可控的下一步，把解释落回现实。'],
              ].map(([step, title, body]) => (
                <Paper withBorder p="md" className="meaningLayer" key={step}>
                  <span>{step}</span>
                  <div>
                    <Text fw={820}>{title}</Text>
                    <Text size="sm" c="dimmed">{body}</Text>
                  </div>
                </Paper>
              ))}
            </Stack>
          </div>

          <Alert color="violet" variant="light" title="AI 只负责整理，不负责抽牌">
            牌先由前端抽好，再把牌名、方向、牌位和传统含义交给 AI 组织成更连贯的解释。即使不使用 AI，完整牌义、猫语总结和行动建议仍然可用。
          </Alert>

          <Button variant="light" leftSection={<LibraryBig size={17} />} onClick={onOpenGallery}>
            打开图鉴，查看全部 78 张牌义
          </Button>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="sources" pt="lg">
        <Stack gap="lg">
          <div>
            <Badge color="orange" variant="light">可追溯，不神化</Badge>
            <Title order={2} size="h3" mt="xs">牌义、历史与视觉分别从哪里来</Title>
            <Text c="dimmed" mt="xs">
              下面已经写出本产品实际采用的方法；外部链接只用于核对原始出处，不影响在站内读完说明。
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <Paper withBorder p="lg" className="sourceInfoCard">
              <Text size="xs" fw={850} c="violet">牌义与抽牌</Text>
              <Text fw={850} mt={5}>@cometpisces/tarot-kit</Text>
              <Text size="sm" c="dimmed" mt="xs">
                78 张牌数据、中文牌面描述、正逆位含义与基础工具来自该 MIT 开源包；猫语文案和行动建议由 MiaoTarot 另行编写。
              </Text>
              <Anchor href="https://www.npmjs.com/package/@cometpisces/tarot-kit" target="_blank" rel="noreferrer" size="sm" mt="md">
                核对 npm 包 <ExternalLink size={13} />
              </Anchor>
            </Paper>
            <Paper withBorder p="lg" className="sourceInfoCard">
              <Text size="xs" fw={850} c="teal">视觉骨架</Text>
              <Text fw={850} mt={5}>Rider–Waite–Smith 体系</Text>
              <Text size="sm" c="dimmed" mt="xs">
                经典牌面用于确认每张牌的关键象征和构图关系；线上主视觉是独立生成与整理的猫咪涂鸦，不直接把未经许可的猫 meme 母图当成牌面发布。
              </Text>
              <Anchor href="https://www.npmjs.com/package/@cometpisces/tarot-kit-images" target="_blank" rel="noreferrer" size="sm" mt="md">
                核对图像参考包 <ExternalLink size={13} />
              </Anchor>
            </Paper>
            <Paper withBorder p="lg" className="sourceInfoCard">
              <Text size="xs" fw={850} c="orange">历史背景</Text>
              <Text fw={850} mt={5}>先是纸牌，后来才用于占卜</Text>
              <Text size="sm" c="dimmed" mt="xs">
                已知早期塔罗来自 15 世纪北意大利的纸牌传统；与神秘学和占卜的广泛关联是在更晚时期逐渐形成的。
              </Text>
              <Anchor href="https://www.metmuseum.org/perspectives/tarot-2" target="_blank" rel="noreferrer" size="sm" mt="md">
                核对博物馆资料 <ExternalLink size={13} />
              </Anchor>
            </Paper>
          </SimpleGrid>

          <Paper withBorder p="lg" className="sourceRightsNote">
            <Text fw={850}>猫 meme 与版权边界</Text>
            <Text size="sm" c="dimmed" mt="xs">
              著名猫 meme 只会在来源、作者和商业改编权限可确认后进入正式素材；否则只作为内部情绪原型研究，线上继续使用原创或已获许可的替代画面。
              猫咪品种与牌意的对应是娱乐向视觉设定，不是动物行为结论。
            </Text>
          </Paper>

          <div>
            <Title order={3} size="h4">关注 MiaoTI 的创作者</Title>
            <Text size="sm" c="dimmed" mt={4}>
              以下署名来自 MiaoTI 当前产品页。平台没有提供可可靠核对的公开直达地址，因此先保留可搜索、可复制的账号名。
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm">
              <Paper withBorder p="lg" className="socialAccountCard">
                <Text size="xs" fw={850} c="violet">抖音</Text>
                <Text fw={900} size="lg" mt={3}>贷鼠</Text>
                <Text size="sm" c="dimmed">抖音号：2020_levi_test</Text>
                <CopyButton value="2020_levi_test">
                  {({ copied, copy }) => (
                    <Button size="xs" variant="light" mt="md" leftSection={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy}>
                      {copied ? '已复制' : '复制抖音号'}
                    </Button>
                  )}
                </CopyButton>
              </Paper>
              <Paper withBorder p="lg" className="socialAccountCard">
                <Text size="xs" fw={850} c="pink">bilibili</Text>
                <Text fw={900} size="lg" mt={3}>蔚天灿雨</Text>
                <Text size="sm" c="dimmed">在 bilibili 搜索此昵称</Text>
                <CopyButton value="蔚天灿雨">
                  {({ copied, copy }) => (
                    <Button size="xs" variant="light" color="pink" mt="md" leftSection={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy}>
                      {copied ? '已复制' : '复制昵称'}
                    </Button>
                  )}
                </CopyButton>
              </Paper>
            </SimpleGrid>
          </div>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
}

function getShareText(reading: MiaoReading | null) {
  if (!reading) {
    return activeTheme.shareConcept;
  }

  const synthesis = createMiaoSynthesis(reading);
  const cards = reading.cards.map((item) => item.miao.miaoName).join(' / ');

  return [
    `我抽到的猫猫塔罗：${cards}`,
    synthesis.shareText,
    `问题：${reading.question || '今天是哪只猫在提醒我？'}`,
    activeTheme.shareConcept,
  ].join('\n');
}

function getShareUrl(reading: MiaoReading | null) {
  if (typeof window === 'undefined') return '';
  if (reading) return createReadingShareUrl(reading, window.location.href);
  return new URL('./', window.location.href).href;
}

function getShareUrlLabel(shareUrl: string) {
  try {
    const url = new URL(shareUrl);
    const pathname = url.pathname.replace(/\/index\.html$/, '/');
    return `${url.host}${pathname}`;
  } catch {
    return activeTheme.productName;
  }
}

function MiaoStatePicture({ miao, compact = false }: { miao: MiaoCard; compact?: boolean }) {
  const visual = getMiaoVisual(miao);

  return (
    <div
      className={`miaoStatePicture scene-${visual.scene} pose-${visual.pose} ${compact ? 'isCompact' : ''}`}
      role="img"
      aria-label={`${miao.miaoName}：${visual.imageBrief}`}
    >
      <div className="miaoPictureSky" />
      <div className={`miaoPictureProp prop-${visual.prop}`}>
        <span>{visual.propLabel}</span>
      </div>
      <div className="miaoPictureCat" aria-hidden="true">
        <span className="miaoTail" />
        <span className="miaoBody" />
        <span className="miaoHead">
          <i />
        </span>
      </div>
      <div className="miaoPictureFloor" />
      <div className="miaoPictureLine">{visual.moodLine}</div>
    </div>
  );
}

function MiaoArtVisual({
  miao,
  contentPackId = DEFAULT_MIAO_CONTENT_PACK_ID,
  compact = false,
  priority = false,
}: { miao: MiaoCard; contentPackId?: string; compact?: boolean; priority?: boolean }) {
  const content = getMiaoContentBundle(miao.tarotId, contentPackId);
  const art = content.art;

  if (art.generatedImage) {
    return (
      <img
        className={`miaoGeneratedImage ${compact ? 'isCompact' : ''}`}
        src={art.generatedImage}
        alt={`${miao.miaoName}，${content.catBreed || '猫咪'}牌面图`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    );
  }

  return <MiaoStatePicture miao={miao} compact={compact} />;
}

function MiaoCardArt({
  card,
  contentPackId = DEFAULT_MIAO_CONTENT_PACK_ID,
  large = false,
  priority = false,
}: { card: MiaoReadingCard | MiaoCard; contentPackId?: string; large?: boolean; priority?: boolean }) {
  const miao = 'miao' in card ? card.miao : card;
  const reversed = 'drawn' in card && card.drawn.orientation === 'reversed';
  const content = getMiaoContentBundle(miao.tarotId, contentPackId);
  const tarotCard = cards.find((item) => item.id === miao.tarotId);
  const hasGeneratedImage = Boolean(content.art.generatedImage);
  const frame = getMiaoContentPackFrame(contentPackId);

  return (
    <div
      className={`miaoCardArt tarotCardFrame ${frame.className} palette-${miao.palette} ${hasGeneratedImage ? 'hasGeneratedImage' : ''} ${large ? 'isLarge' : ''} ${reversed ? 'isReversed' : ''}`}
      data-card-frame={frame.id}
    >
      <div className="miaoCardInner">
        <div className="miaoCardSigil">{miao.sigil}</div>
        <MiaoArtVisual miao={miao} contentPackId={contentPackId} priority={priority} />
        <div className="miaoCardName">{miao.miaoName}</div>
        <div className="miaoCardArchetype">
          {tarotCard ? getCardKeyword(tarotCard) : miao.archetype} · {content.catBreed || miao.archetype}
        </div>
      </div>
    </div>
  );
}

function DrawnMiaoCard({ item, index, contentPackId }: { item: MiaoReadingCard; index: number; contentPackId: string }) {
  return (
    <Card withBorder padding="md" className="drawnMiaoCard">
      <Stack gap="sm" h="100%">
        <Group justify="space-between" align="flex-start">
          <Badge variant="light" color="gray">
            {String(index + 1).padStart(2, '0')} / {item.position.label}
          </Badge>
          <Badge color={item.drawn.orientation === 'upright' ? 'teal' : 'orange'} variant="light">
            {getMiaoOrientationLabel(item.drawn.orientation)}
          </Badge>
        </Group>

        <MiaoCardArt card={item} contentPackId={contentPackId} priority />

        <div>
          <Title order={3} size="h4">
            {item.miao.miaoName}
          </Title>
          <Text size="xs" c="dimmed" mt={3}>
            {getTraditionalLine(item)}
          </Text>
        </div>

        <Text className="miaoCaption">{item.miao.memeCaption}</Text>
        <div className="miaoMeaningSummary">
          <Text size="xs" fw={800} c="violet">猫语翻译</Text>
          <Text size="sm" className="miaoMeaning">{item.miaoMeaning}</Text>
        </div>
        <details className="tarotMeaningDetails">
          <summary>查看完整牌义</summary>
          <Stack gap="xs" className="tarotMeaningLayers">
            <div>
              <Text size="xs" fw={800} c="dimmed">传统牌义</Text>
              <Text size="sm">{item.traditionalMeaning}</Text>
            </div>
            <div>
              <Text size="xs" fw={800} c="dimmed">{item.position.label}位</Text>
              <Text size="sm">{item.positionMeaning}</Text>
            </div>
            <div>
              <Text size="xs" fw={800} c="dimmed">结合当前问题</Text>
              <Text size="sm">{item.topicMeaning}</Text>
            </div>
          </Stack>
        </details>
      </Stack>
    </Card>
  );
}

function EmptyReading({ contentPackId }: { contentPackId: string }) {
  const pack = getMiaoContentPack(contentPackId);
  return (
    <Paper withBorder p="lg" className="emptyMiaoPanel">
      <Stack gap="md">
        <ThemeIcon size={44} radius="sm" variant="light" color="violet">
          {iconNode(Cat)}
        </ThemeIcon>
        <div>
          <Title order={2} size="h3">
            还没有猫猫出现
          </Title>
          <Text c="dimmed" mt={6}>
            写下问题，选择牌阵，然后让一组猫牌出来替你说话。
          </Text>
        </div>
        <SimpleGrid cols={3} spacing="xs">
          <Paper withBorder p="sm">
            <Text fw={800}>{getMiaoContentPackCardIds(pack).length}</Text>
            <Text size="xs" c="dimmed">
              猫牌
            </Text>
          </Paper>
          <Paper withBorder p="sm">
            <Text fw={800}>Tarot</Text>
            <Text size="xs" c="dimmed">
              牌义
            </Text>
          </Paper>
          <Paper withBorder p="sm">
            <Text fw={800}>AI</Text>
            <Text size="xs" c="dimmed">
              猫语翻译
            </Text>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

function SupportPrompt({ onOpen }: { onOpen: () => void }) {
  return (
    <UnstyledButton className="supportPrompt" onClick={onOpen}>
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        <Group wrap="nowrap" gap="xs" className="supportPromptCopy">
          <ThemeIcon color="pink" variant="light" radius="xl" size={30}>
            <Heart size={14} />
          </ThemeIcon>
          <Text size="sm">
            <Text span fw={800}>如果这次猫猫有帮到你</Text>
            <Text span c="dimmed">，可以请它吃罐罐</Text>
          </Text>
        </Group>
        <Text size="xs" fw={750} c="pink" className="supportPromptAction">
          支持这个免费小项目 →
        </Text>
      </Group>
    </UnstyledButton>
  );
}

function SupportModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="支持 MiaoTarot"
      centered
      size="sm"
      zIndex={1200}
      className="supportModal"
    >
      <Stack gap="md">
        <div>
          <Badge color="pink" variant="light">完全自愿 · 不影响任何功能</Badge>
          <Title order={2} size="h3" mt="xs">请猫猫吃罐罐</Title>
          <Text c="dimmed" size="sm" mt="xs">
            MiaoTarot 会继续免费开放。愿意的话，可以支持服务器、牌面制作和后续更新。
          </Text>
        </div>

        <div className="supportQrBlock">
          <div className="supportQrFrame">
            <img src={SUPPORT_QR_IMAGE} alt="MiaoTarot 收款码占位图" />
          </div>
          <Text size="xs" c="dimmed" ta="center">
            当前为占位图；换成正式收款码后即可扫码支持。
          </Text>
        </div>

        <Alert color="violet" variant="light" icon={<Cat size={18} />}>
          支持不会影响抽牌结果，也不会解锁“更准”的解读。
        </Alert>

        {SUPPORT_URL ? (
          <Button component="a" href={SUPPORT_URL} target="_blank" rel="noreferrer" leftSection={<Heart size={17} />}>
            前往爱发电支持
          </Button>
        ) : (
          <Button disabled leftSection={<Heart size={17} />}>
            爱发电入口准备中
          </Button>
        )}
      </Stack>
    </Modal>
  );
}

function ReadingResult({
  reading,
  contentPackId,
}: {
  reading: MiaoReading | null;
  contentPackId: string;
}) {
  const synthesis = useMemo(() => (reading ? createMiaoSynthesis(reading) : null), [reading]);

  if (!reading || !synthesis) return <EmptyReading contentPackId={contentPackId} />;

  const anchor = getMiaoReadingAnchor(reading);

  return (
    <Stack gap="md">
      <div className="mobileCompanionNote" role="status" aria-live="polite" aria-atomic="true">
        <ThemeIcon size={42} radius="md" color="pink" variant="light">
          <Cat size={22} />
        </ThemeIcon>
        <Text size="sm">
          {reading.cards.length === 1
            ? `猫猫把这张牌翻好了。核心牌是「${anchor.miao.miaoName}」。先看一句重点，再慢慢读牌。`
            : `猫猫把 ${reading.cards.length} 张牌排好了。核心牌是「${anchor.miao.miaoName}」。先看一句重点，再慢慢读每张牌。`}
        </Text>
      </div>
      <Paper withBorder p="lg" className="resultHeader">
        <Grid gap="lg" align="center">
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <MiaoCardArt card={anchor} contentPackId={reading.contentPackId} large />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 7 }}>
            <Badge color="violet" variant="light">
              {reading.spread.name}
            </Badge>
            <Title order={2} mt="sm" className="resultTitle">
              核心牌是「{anchor.miao.miaoName}」
            </Title>
            <Text fw={760} mt="xs" className="resultShareLine">
              {synthesis.shareText}
            </Text>
            <Text c="dimmed" mt="sm" className="resultSummary">
              {synthesis.summary}
            </Text>
            <Alert mt="md" color="teal" variant="light" icon={iconNode(WandSparkles)}>
              <Text fw={780} mb={4}>
                今天的小动作
              </Text>
              <Text size="sm">{synthesis.tinyAction}</Text>
            </Alert>
          </Grid.Col>
        </Grid>
      </Paper>

      <SimpleGrid
        cols={{ base: 1, sm: Math.min(2, reading.cards.length), lg: Math.min(3, reading.cards.length) }}
        spacing="md"
        className="drawnCardsGrid"
        data-count={reading.cards.length}
      >
        {reading.cards.map((item, index) => (
          <DrawnMiaoCard key={`${reading.id}-${item.drawn.card.id}-${item.position.id}`} item={item} index={index} contentPackId={reading.contentPackId} />
        ))}
      </SimpleGrid>

    </Stack>
  );
}

function SharePanel({ reading, contentPackId }: { reading: MiaoReading | null; contentPackId: string }) {
  const shareText = getShareText(reading);
  const synthesis = reading ? createMiaoSynthesis(reading) : null;
  const mainCard = reading ? getMiaoReadingAnchor(reading) : undefined;
  const fallbackCardId = getMiaoContentPackCardIds(contentPackId)[0];
  const fallbackCard = cards.find((item) => item.id === fallbackCardId) ?? cards[0];
  const posterMiao = mainCard?.miao ?? getMiaoCard(fallbackCard, contentPackId);
  const shareUrl = useMemo(() => getShareUrl(reading), [reading]);
  const shareUrlLabel = useMemo(() => getShareUrlLabel(shareUrl), [shareUrl]);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [exportError, setExportError] = useState('');
  const [exportImage, setExportImage] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');
  const canShareExportImage = useMemo(() => {
    if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false;
    try {
      const probe = new File([''], 'miaotarot.png', { type: 'image/png' });
      return navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function buildQr() {
      try {
        const qrcode = await import('qrcode');
        const dataUrl = await qrcode.toDataURL(shareUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 144,
          color: {
            dark: '#1f172a',
            light: '#ffffff',
          },
        });

        if (alive) setQrDataUrl(dataUrl);
      } catch {
        if (alive) setQrDataUrl('');
      }
    }

    buildQr();

    return () => {
      alive = false;
    };
  }, [shareUrl]);

  async function handleExport() {
    if (!reading || !shareCardRef.current) return;

    setExportStatus('loading');
    setExportError('');

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const { toPng } = await import('html-to-image');
      if ('fonts' in document) {
        await document.fonts.ready;
      }
      await Promise.all(
        [...shareCardRef.current.querySelectorAll('img')].map((image) => image.decode?.().catch(() => undefined)),
      );

      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        width: 540,
        height: 960,
        backgroundColor: '#ffffff',
        style: {
          position: 'static',
          zIndex: 'auto',
          top: 'auto',
          left: 'auto',
        },
      });
      setExportImage(dataUrl);
      setExportStatus('done');
      trackProductEvent('share_image', reading.spread.id, { readingId: reading.id, source: 'share-panel' });
    } catch (caught) {
      setExportStatus('error');
      setExportError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  function downloadExportImage() {
    if (!exportImage) return;
    const link = document.createElement('a');
    link.download = `miaotarot-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportImage;
    link.click();
  }

  async function shareExportImage() {
    if (!exportImage || !canShareExportImage) return;
    setShareStatus('idle');

    try {
      const response = await fetch(exportImage);
      const blob = await response.blob();
      const file = new File([blob], `miaotarot-${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: 'MiaoTarot 猫猫塔罗',
        text: synthesis?.shareText || activeTheme.shareConcept,
      });
      setShareStatus('shared');
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setShareStatus('error');
    }
  }

  async function handleNativeShare() {
    if (!reading) return;
    setShareStatus('idle');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MiaoTarot 猫猫塔罗', text: shareText, url: shareUrl });
        setShareStatus('shared');
        trackProductEvent('share_result', reading.spread.id, { readingId: reading.id, source: 'share-panel' });
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareStatus('copied');
      trackProductEvent('share_result', reading.spread.id, { readingId: reading.id, source: 'share-panel' });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setShareStatus('error');
    }
  }

  return (
    <Paper withBorder p="lg" className="sharePanel">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={2} size="h3">
            分享卡预览
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            复制文案，或生成一张可以直接发出去的结果图。
          </Text>
          {reading && (
            <Text c="orange" size="xs" mt={6}>
              分享结果或复制文案时会包含你写下的问题，发布前请确认内容。
            </Text>
          )}
        </div>
        <Group gap="xs">
          <Button size="sm" variant="light" leftSection={<Share2 size={16} />} disabled={!reading} onClick={handleNativeShare}>
            分享结果
          </Button>
          <CopyButton value={shareText}>
            {({ copied, copy }) => (
              <Button
                size="sm"
                variant="light"
                leftSection={copied ? <Check size={16} /> : <Copy size={16} />}
                onClick={() => {
                  copy();
                  if (reading) {
                    trackProductEvent('share_copied', reading.spread.id, { readingId: reading.id, source: 'share-panel' });
                  }
                }}
              >
                {copied ? '已复制' : '复制分享文案'}
              </Button>
            )}
          </CopyButton>
          <Button
            size="sm"
            leftSection={<Download size={16} />}
            disabled={!reading}
            loading={exportStatus === 'loading'}
            onClick={handleExport}
          >
            {exportImage ? '重新生成分享图' : '生成分享图'}
          </Button>
        </Group>
      </Group>

      <div className={`shareCard sharePoster ${exportStatus === 'loading' ? 'isExporting' : ''}`} ref={shareCardRef}>
        <div className="shareCardTop">
          <Badge color="dark" variant="filled">
            MiaoTarot
          </Badge>
          <Text size="xs">{activeTheme.localName}</Text>
        </div>
        <Title order={3} className="shareCardTitle">
          {mainCard ? mainCard.miao.miaoName : '今天的核心牌'}
        </Title>
        <div className="sharePosterArt">
          <MiaoCardArt card={posterMiao} contentPackId={reading?.contentPackId ?? contentPackId} priority />
        </div>
        <Text className="shareCardCaption">
          {synthesis?.shareText || activeTheme.shareConcept.replace(`${activeTheme.productName}：`, '')}
        </Text>
        <Divider my="sm" />
        {reading ? (
          <div
            className="sharePosterCards"
            style={{ gridTemplateColumns: `repeat(${reading.cards.length}, minmax(0, 1fr))` }}
          >
            {reading.cards.map((item) => (
              <div className="sharePosterCard" key={`${reading.id}-${item.position.id}-${item.drawn.card.id}`}>
                <Text size="xs" c="dimmed">
                  {item.position.label}
                </Text>
                <Text size="sm" fw={780}>
                  {item.miao.miaoName}
                </Text>
              </div>
            ))}
          </div>
        ) : (
          <Text size="sm" c="dimmed">
            抽一张塔罗牌后生成你的分享卡。
          </Text>
        )}
        {reading && synthesis && (
          <div className="sharePosterAction">
            <Text size="xs" fw={800} c="violet">
              今天可以做
            </Text>
            <Text size="sm" mt={4}>
              {synthesis.tinyAction}
            </Text>
          </div>
        )}
        <div className="sharePosterFooter">
          <div>
            <Text size="xs" c="dimmed">
              {activeTheme.shareConcept}
            </Text>
            <Text size="xs" className="sharePosterUrl">
              {shareUrlLabel}
            </Text>
          </div>
          <div className="shareQr" aria-label="MiaoTarot QR code">
            {qrDataUrl ? <img src={qrDataUrl} alt="MiaoTarot QR code" /> : <span>QR</span>}
          </div>
        </div>
      </div>
      <Text mt="sm" size="sm" c={exportStatus === 'error' ? 'red' : 'dimmed'} aria-live="polite">
        {exportStatus === 'loading' && '正在生成分享图。'}
        {exportStatus === 'done' && '分享图已生成，可在下方直接分享或保存。'}
        {exportStatus === 'error' && `生成失败：${exportError}`}
      </Text>
      {shareStatus !== 'idle' && (
        <Text size="sm" c={shareStatus === 'error' ? 'red' : 'dimmed'} aria-live="polite">
          {shareStatus === 'shared' && '结果已交给系统分享。'}
          {shareStatus === 'copied' && '当前浏览器不支持系统分享，结果链接已复制。'}
          {shareStatus === 'error' && '暂时无法分享，请复制分享文案。'}
        </Text>
      )}
      {exportImage && (
        <div className="shareExportPreview">
          <img src={exportImage} alt="MiaoTarot 分享图预览" />
          <Text size="sm" c="dimmed" mt="sm">
            手机上也可以长按图片保存到相册。
          </Text>
          <Group gap="sm" mt="sm" className="shareExportActions">
            {canShareExportImage && (
              <Button variant="light" leftSection={<Share2 size={16} />} onClick={shareExportImage}>
                分享这张图
              </Button>
            )}
            <Button variant="default" leftSection={<Download size={16} />} onClick={downloadExportImage}>
              保存 PNG
            </Button>
          </Group>
        </div>
      )}
    </Paper>
  );
}

function DeckTab({ contentPackId }: { contentPackId: string }) {
  const pack = getMiaoContentPack(contentPackId);
  const packIds = new Set(getMiaoContentPackCardIds(pack));
  const miaoDeck = cards.filter((card) => packIds.has(card.id)).map((card) => getMiaoCard(card, pack.id));
  return (
    <Stack gap="md">
      <Paper withBorder p="lg">
        <Group justify="space-between" align="flex-start">
          <div>
          <Title order={2} size="h3">
            {miaoDeck.length} 张 · {pack.name}
          </Title>
          <Text c="dimmed" size="sm" mt={5}>
            每张牌都使用标准塔罗牌名、牌面描述和正逆位牌义；猫咪品种只作为画面设定。
          </Text>
          </div>
          <Badge color="violet" variant="light">
            {pack.scope === 'full' ? '22 大阿卡纳 + 56 小阿卡纳' : 'Major Arcana only'}
          </Badge>
        </Group>
      </Paper>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {miaoDeck.map((card) => {
          return (
            <Card key={card.tarotId} withBorder padding="sm" className="deckCard">
              <MiaoCardArt card={card} contentPackId={pack.id} />
              <Title order={3} size="h5" mt="sm">
                {card.miaoName}
              </Title>
              <Text size="xs" c="dimmed">
                {card.archetype}
              </Text>
              <Text size="sm" mt="xs" lineClamp={2}>
                {card.memeCaption}
              </Text>
              <div className="deckMeaningBlock">
                <Text size="xs" fw={780}>
                  正位牌义
                </Text>
                <Text size="xs" c="dimmed" lineClamp={4}>
                  {card.uprightMiaoMeaning}
                </Text>
              </div>
              <div className="deckActionLine">
                <Text size="xs" fw={780}>
                  今天可以做
                </Text>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {card.tinyAction}
                </Text>
              </div>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

function CardGallery({
  contentPackId,
  onCardSelect,
}: {
  contentPackId: string;
  onCardSelect: (cardId: string) => void;
}) {
  const pack = getMiaoContentPack(contentPackId);
  const packIds = new Set(getMiaoContentPackCardIds(pack));
  const galleryDeck = cards
    .filter((card) => packIds.has(card.id))
    .map((card) => ({ tarotCard: card, miaoCard: getMiaoCard(card, pack.id) }));

  return (
    <Stack gap="lg">
      <Paper withBorder p="md" className="gallerySummary">
        <Group justify="space-between" align="flex-start" gap="sm">
          <div>
            <Text fw={850}>{galleryDeck.length} 张 · {pack.name}</Text>
            <Text size="sm" c="dimmed" mt={4}>
              点一张牌查看完整画面、猫咪设定与正逆位牌义。
            </Text>
          </div>
          <Badge color="violet" variant="light">
            {pack.scope === 'full' ? '22 大阿卡纳 + 56 小阿卡纳' : '22 大阿卡纳'}
          </Badge>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={{ base: 'sm', md: 'md' }}>
        {galleryDeck.map(({ tarotCard, miaoCard }, index) => (
          <UnstyledButton
            key={tarotCard.id}
            className="galleryTile"
            onClick={() => onCardSelect(tarotCard.id)}
            aria-label={`查看${getCardName(tarotCard)}：${miaoCard.miaoName}`}
          >
            <MiaoCardArt
              card={miaoCard}
              contentPackId={pack.id}
              priority={index < 6}
            />
            <div className="galleryTileCopy">
              <Text fw={820} size="sm" lineClamp={1}>{getCardName(tarotCard)}</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>{miaoCard.miaoName}</Text>
            </div>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

function GalleryCardDetail({ card, contentPackId }: { card: MiaoCard; contentPackId: string }) {
  const tarotCard = cards.find((item) => item.id === card.tarotId);
  const content = getMiaoContentBundle(card.tarotId, contentPackId);

  return (
    <div className="galleryDetail">
      <div className="galleryDetailArt">
        <MiaoCardArt card={card} contentPackId={contentPackId} large priority />
      </div>
      <Stack gap="md" className="galleryDetailCopy">
        <div>
          <Badge color="violet" variant="light">
            {tarotCard ? getCardName(tarotCard) : card.tarotId}
          </Badge>
          <Title order={2} size="h3" mt="xs">{card.miaoName}</Title>
          <Text size="sm" c="dimmed" mt={4}>
            {card.archetype} · {content.catBreed || '猫咪'}
          </Text>
        </div>
        <Text className="galleryDetailCaption">“{card.memeCaption}”</Text>
        <Paper withBorder p="md" className="galleryMeaning galleryMeaningUpright">
          <Text size="xs" fw={850} tt="uppercase">正位</Text>
          <Text size="sm" mt={5}>{card.uprightMiaoMeaning}</Text>
        </Paper>
        <Paper withBorder p="md" className="galleryMeaning galleryMeaningReversed">
          <Text size="xs" fw={850} tt="uppercase">逆位</Text>
          <Text size="sm" mt={5}>{card.reversedMiaoMeaning}</Text>
        </Paper>
        <Paper p="md" className="galleryAction">
          <Text size="xs" fw={850}>今天可以做</Text>
          <Text size="sm" mt={5}>{card.tinyAction}</Text>
        </Paper>
      </Stack>
    </div>
  );
}

function ResearchTab() {
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <Paper withBorder p="lg">
          <Group gap="sm">
            <ThemeIcon color="violet" variant="light">{iconNode(Cat)}</ThemeIcon>
            <Text fw={780}>不是贴皮</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="sm">
            猫 meme 是情绪入口；传统 Tarot 是结构骨架；LLM 是个性化解释层。
          </Text>
        </Paper>
        <Paper withBorder p="lg">
          <Group gap="sm">
            <ThemeIcon color="teal" variant="light">{iconNode(Database)}</ThemeIcon>
            <Text fw={780}>不重复造轮子</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="sm">
            牌义、正逆位和抽牌基础直接用 MIT 的 `@cometpisces/tarot-kit`。
          </Text>
        </Paper>
        <Paper withBorder p="lg">
          <Group gap="sm">
            <ThemeIcon color="orange" variant="light">{iconNode(BrainCircuit)}</ThemeIcon>
            <Text fw={780}>先抽牌再分析</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="sm">
            LLM 不负责随机抽牌，只接收已经抽好的猫牌、牌位和传统含义。
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Title order={2} size="h3" mb="md">
          Reference map
        </Title>
        <Stack gap="xs">
          {sourceRows.map((row) => (
            <Paper key={row.name} withBorder p="md" className="sourceRow">
              <Group justify="space-between" align="flex-start" gap="md">
                <div>
                  <Text fw={780}>{row.name}</Text>
                  <Text size="sm" c="dimmed">
                    {row.role}
                  </Text>
                  <Text size="sm" mt={6}>
                    {row.take}
                  </Text>
                </div>
                {'url' in row && row.url && (
                  <Button component="a" href={row.url} target="_blank" rel="noreferrer" size="xs" variant="subtle" rightSection={<ExternalLink size={14} />}>
                    查看依赖
                  </Button>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

function ThemeCardArt({ card }: { card: ThemedCard }) {
  return (
    <div className={`miaoCardArt tarotCardFrame frame-moonlit themeCardArt palette-${card.palette}`} data-card-frame="moonlit">
      <div className="miaoCardInner">
        <div className="miaoCardSigil">{card.sigil}</div>
        <div className="themeCardMark" aria-hidden="true">
          <Sparkles size={34} />
        </div>
        <div className="miaoCardName">{card.title}</div>
        <div className="miaoCardArchetype">{card.archetype}</div>
      </div>
    </div>
  );
}

function ThemeLabTab() {
  const [themeId, setThemeId] = useState<TarotThemeId>('shiptarot');
  const theme = getTarotTheme(themeId);
  const adapter = useMemo(() => createThemedDeckAdapter(theme.deckConfig), [theme.deckConfig]);
  const [question, setQuestion] = useState(theme.defaultQuestion);
  const [spreadId, setSpreadId] = useState(theme.spreadIds[1] ?? theme.spreadIds[0] ?? 'single');
  const [reading, setReading] = useState<ThemedReading | null>(null);
  const synthesis = reading ? adapter.createSynthesis(reading) : null;
  const payload = reading ? adapter.buildPayload(reading) : null;
  const prompt = reading ? adapter.buildPrompt(reading) : '';

  function handleThemeChange(value: string | null) {
    const nextTheme = getTarotTheme((value || 'shiptarot') as TarotThemeId);
    setThemeId(nextTheme.id as TarotThemeId);
    setQuestion(nextTheme.defaultQuestion);
    setSpreadId(nextTheme.spreadIds[1] ?? nextTheme.spreadIds[0] ?? 'single');
    setReading(null);
  }

  function handleDraw() {
    setReading(adapter.createReading({ question, topic: 'others', spreadId }));
  }

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, lg: 5 }}>
        <Paper withBorder p="lg" className="themeLabPanel">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} size="h3">
                  Theme Lab
                </Title>
                <Text c="dimmed" size="sm" mt={4}>
                  用同一套底座试跑不同 `xxxTarot` 主题。
                </Text>
              </div>
              <Badge variant="light">{tarotThemeList.length} themes</Badge>
            </Group>

            <Select
              label="选择主题"
              data={tarotThemeList.map((item) => ({ value: item.id, label: `${item.productName} · ${item.localName}` }))}
              value={themeId}
              onChange={handleThemeChange}
              allowDeselect={false}
            />

            <Paper withBorder p="md" className="themeSummary">
              <Badge color="violet" variant="light">
                {theme.universe}
              </Badge>
              <Title order={3} size="h4" mt="xs">
                {theme.tagline}
              </Title>
              <Text size="sm" c="dimmed" mt="xs">
                {theme.description}
              </Text>
            </Paper>

            <Textarea label="实验问题" value={question} onChange={(event) => setQuestion(event.currentTarget.value)} minRows={3} autosize />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {theme.quickQuestions.map((item) => (
                <Button key={item} variant="light" size="xs" onClick={() => setQuestion(item)}>
                  {item}
                </Button>
              ))}
            </SimpleGrid>

            <Select
              label="牌阵"
              data={spreads
                .filter((spread) => theme.spreadIds.includes(spread.id))
                .map((spread) => ({ value: spread.id, label: `${spread.name} · ${spread.positions.length} 张` }))}
              value={spreadId}
              onChange={(value) => setSpreadId(value || 'single')}
              allowDeselect={false}
            />

            <Button leftSection={<Sparkles size={16} />} onClick={handleDraw}>
              抽一组{theme.deckConfig.cardLabel}
            </Button>
          </Stack>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 7 }}>
        <Stack gap="md">
          {reading && synthesis ? (
            <>
              <Paper withBorder p="lg" className="themeLabResult">
                <Badge color="teal" variant="light">
                  {reading.spread.name}
                </Badge>
                <Title order={2} size="h3" mt="sm">
                  {synthesis.headline}
                </Title>
                <Text c="dimmed" mt="sm">
                  {synthesis.summary}
                </Text>
                <Alert mt="md" color="teal" variant="light" icon={iconNode(WandSparkles)}>
                  {synthesis.tinyAction}
                </Alert>
              </Paper>

              <SimpleGrid cols={{ base: 1, sm: Math.min(2, reading.cards.length), lg: Math.min(3, reading.cards.length) }} spacing="md">
                {reading.cards.map((item) => (
                  <Card key={`${reading.id}-${item.drawn.card.id}-${item.position.id}`} withBorder padding="md" className="themeLabCard">
                    <ThemeCardArt card={item.themeCard} />
                    <Title order={3} size="h5" mt="sm">
                      {item.position.label} · {adapter.getOrientationLabel(item.drawn.orientation)}
                    </Title>
                    <Text size="xs" c="dimmed">
                      {adapter.getTraditionalLine(item)}
                    </Text>
                    <Text size="sm" mt="xs" lineClamp={3}>
                      {item.themedMeaning}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>

              <Paper withBorder p="lg">
                <Group justify="space-between" mb="sm">
                  <Title order={3} size="h4">
                    Theme payload
                  </Title>
                  <CopyButton value={prompt}>
                    {({ copied, copy }) => (
                      <Button size="xs" variant="light" leftSection={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy}>
                        {copied ? '已复制' : '复制 Prompt'}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
                <ScrollArea h={300} className="payloadArea">
                  <pre className="jsonBlock">{JSON.stringify(payload, null, 2)}</pre>
                </ScrollArea>
              </Paper>
            </>
          ) : (
            <Paper withBorder p="lg" className="themeLabEmpty">
              <ThemeIcon size={44} radius="sm" variant="light" color="violet">
                {iconNode(PanelsTopLeft)}
              </ThemeIcon>
              <Title order={2} size="h3" mt="md">
                选择一个主题，试跑同一套 Tarot 底座
              </Title>
              <Text c="dimmed" mt="sm">
                Theme Lab 先服务产品判断：哪个 `xxxTarot` 值得继续做，再决定是否升级成独立入口。
              </Text>
            </Paper>
          )}
        </Stack>
      </Grid.Col>
    </Grid>
  );
}

function DataTab({ reading }: { reading: MiaoReading | null }) {
  const payload = reading ? buildMiaoLlmPayload(reading) : null;

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper withBorder p="lg" h="100%">
          <Title order={2} size="h3">
            数据结构
          </Title>
          <Text c="dimmed" size="sm" mt="sm">
            MiaoTarot 是三层结构：开源 Tarot 牌库、本地猫牌映射、LLM payload。
          </Text>
          <pre className="codeBlock">{`TarotCard   // imported from @cometpisces/tarot-kit
MiaoCard    // local cat-meme archetype
MiaoVisual  // local cat-picture scene, pose, prop
Spread      // local positions and roles
MiaoReading // question + topic + spread + cards
LLMPayload  // model-ready JSON`}</pre>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper withBorder p="lg" h="100%">
          <Group justify="space-between" mb="sm">
            <Title order={2} size="h3">
              当前 LLM JSON
            </Title>
            {payload && (
              <CopyButton value={JSON.stringify(payload, null, 2)}>
                {({ copied, copy }) => (
                  <Button size="xs" variant="light" leftSection={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy}>
                    {copied ? '已复制' : '复制 JSON'}
                  </Button>
                )}
              </CopyButton>
            )}
          </Group>
          <ScrollArea h={420} className="payloadArea">
            <pre className="jsonBlock">{payload ? JSON.stringify(payload, null, 2) : '先完成一次抽牌。'}</pre>
          </ScrollArea>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

function LlmTab({ reading, showInternal = false }: { reading: MiaoReading | null; showInternal?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState<'checking' | 'available' | 'unconfigured' | 'turnstile'>('checking');
  const prompt = reading ? buildMiaoLlmPrompt(reading) : '';
  const structuredResult = result ? parseStructuredLlmResult(result) : null;

  useEffect(() => {
    let active = true;
    void loadLlmAvailability().then((next) => {
      if (!active) return;
      setAvailability(next.available ? 'available' : next.turnstileRequired ? 'turnstile' : 'unconfigured');
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleCall() {
    if (!reading) return;

    setStatus('loading');
    setResult('');
    setError('');
    trackProductEvent('llm_requested', reading.spread.id, { readingId: reading.id, source: 'llm-panel' });

    try {
      const output = await callMiaoLlmEndpoint(reading, { themeId: activeTheme.id });
      setResult(output);
      setStatus('done');
      trackProductEvent('llm_succeeded', reading.spread.id, { readingId: reading.id, source: 'llm-panel' });
    } catch (caught) {
      setStatus('error');
      trackProductEvent('llm_failed', reading.spread.id, { readingId: reading.id, source: 'llm-panel' });
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper withBorder p="lg">
          <Stack gap="md">
              <Title order={2} size="h3">
                AI 猫语解读
              </Title>
              <Text c="dimmed" size="sm">
                抽牌后，可以让 AI 把牌位、传统牌义和猫猫状态合成一段更具体的提醒。
              </Text>
            {availability === 'available' ? (
              <Alert color="violet" variant="light" icon={iconNode(BrainCircuit)}>
                点击后，你的问题、已经抽好的牌、牌位和必要牌义会发送给 AI 服务；不会发送浏览器历史、账号信息或匿名统计标识。服务端会校验、限流并重建 prompt。
              </Alert>
            ) : (
              <Alert color="gray" variant="light" icon={iconNode(BrainCircuit)}>
                {availability === 'checking' && '正在确认 AI 解读服务状态。'}
                {availability === 'unconfigured' && 'AI 猫语解读尚未开放，当前牌义、猫语总结和分享功能不受影响。'}
                {availability === 'turnstile' && 'AI 服务需要人机验证，验证组件接入前暂不开放调用。'}
              </Alert>
            )}
            <Button leftSection={<Send size={16} />} disabled={!reading || availability !== 'available'} loading={status === 'loading'} onClick={handleCall}>
              生成 AI 猫语解读
            </Button>
            {status === 'error' && <Alert color="red">{error}</Alert>}
            {status === 'done' && <Alert color="teal">解读已生成，可以复制分享文案或继续调整问题再抽一次。</Alert>}
          </Stack>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="sm">
            <Title order={2} size="h3">
              {showInternal ? 'Prompt' : 'AI 解读结果'}
            </Title>
            {showInternal && prompt && (
              <CopyButton value={prompt}>
                {({ copied, copy }) => (
                  <Button size="xs" variant="light" leftSection={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy}>
                    {copied ? '已复制' : '复制 Prompt'}
                  </Button>
                )}
              </CopyButton>
            )}
          </Group>
          {showInternal ? (
            <Textarea value={prompt || '先完成一次抽牌。'} minRows={13} autosize readOnly className="promptText" />
          ) : !result ? (
            <Paper withBorder p="md" className="aiEmptyState">
              <ThemeIcon size={40} radius="sm" variant="light" color="violet">
                {iconNode(BrainCircuit)}
              </ThemeIcon>
              <Text fw={780} mt="sm">
                抽牌后生成一段猫语解读
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                它会基于已经抽到的牌、牌位和你的问题生成建议，不会替你重抽牌。
              </Text>
            </Paper>
          ) : null}
          {structuredResult && (
            <>
              {showInternal && <Divider my="md" />}
              <Group justify="space-between" align="flex-start" gap="sm">
                <div>
                  <Title order={3} size="h4">
                    {structuredResult.title}
                  </Title>
                  <Text c="dimmed" size="sm" mt={4}>
                    {structuredResult.summary}
                  </Text>
                </div>
                <CopyButton value={structuredResult.shareText}>
                  {({ copied, copy }) => (
                    <Button size="xs" variant="light" leftSection={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy}>
                      {copied ? '已复制' : '复制分享文案'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="md">
                {structuredResult.cards.map((card, index) => (
                  <Paper key={`${card.position}-${index}`} withBorder p="sm" className="structuredResultCard">
                    <Text fw={780} size="sm">
                      {card.position}
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      {card.reading}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
              <Alert mt="md" color="teal" variant="light" icon={iconNode(WandSparkles)}>
                <Stack gap={4}>
                  {structuredResult.actions.map((action) => (
                    <Text key={action} size="sm">
                      {action}
                    </Text>
                  ))}
                </Stack>
              </Alert>
            </>
          )}
          {result && !structuredResult && (
            <>
              <Divider my="md" />
              <Title order={3} size="h4" mb="xs">
                AI Result
              </Title>
              <Text className="llmResult">{result}</Text>
            </>
          )}
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

export function App() {
  const isMobileViewport = useMediaQuery('(max-width: 760px)');
  const [sharedReading] = useState<MiaoReading | null>(() => (
    typeof window === 'undefined' ? null : parseReadingShareUrl(window.location.search)
  ));
  const [question, setQuestion] = useState(sharedReading?.question || activeTheme.defaultQuestion);
  const [topic, setTopic] = useState<ReadingTopic>(sharedReading?.topic || 'others');
  const [reading, setReading] = useState<MiaoReading | null>(sharedReading);
  const [contentPackId, setContentPackId] = useState<MiaoContentPackId>(
    () => getMiaoContentPack(sharedReading?.contentPackId).id as MiaoContentPackId,
  );
  const [history, setHistory] = useState<MiaoReading[]>(() => loadReadingHistory());
  const [siteVisitCount, setSiteVisitCount] = useState<number | null>(null);
  const [productInfoOpen, setProductInfoOpen] = useState(false);
  const [productInfoTab, setProductInfoTab] = useState<ProductInfoTab>('product');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCardId, setGalleryCardId] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [mobileReadingOpen, setMobileReadingOpen] = useState(() => Boolean(
    sharedReading
    || (typeof window !== 'undefined' && window.history.state?.[MOBILE_READING_HISTORY_KEY]),
  ));
  const [drawStage, setDrawStage] = useState<InteractiveDrawStage>('ready');
  const readingDeskRef = useRef<HTMLDivElement | null>(null);
  const mobileReadingScrollTop = useRef(0);
  const autoScrollResultReadingId = useRef<string | null>(sharedReading?.id ?? null);
  const mobileDialogHistorySeeded = useRef(false);
  const mobileDialogOpen = Boolean(isMobileViewport && mobileReadingOpen);
  const selectedGalleryCard = useMemo(() => {
    const tarotCard = cards.find((card) => card.id === galleryCardId);
    return tarotCard ? getMiaoCard(tarotCard, contentPackId) : null;
  }, [contentPackId, galleryCardId]);
  useFocusReturn({ opened: mobileDialogOpen });
  const showInternalTabs = useMemo(() => {
    return import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');
  }, []);

  useEffect(() => {
    let active = true;
    void loadSiteCounter().then((result) => {
      if (active && result) setSiteVisitCount(result.count);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveReadingHistory(history);
  }, [history]);

  useEffect(() => {
    document.body.classList.toggle('mobileReadingActive', mobileDialogOpen);
    return () => document.body.classList.remove('mobileReadingActive');
  }, [mobileDialogOpen]);

  useEffect(() => {
    if (!isMobileViewport) return;

    const handlePopState = (event: PopStateEvent) => {
      setMobileReadingOpen(Boolean(event.state?.[MOBILE_READING_HISTORY_KEY]));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobileViewport]);

  useEffect(() => {
    if (!mobileDialogOpen || mobileDialogHistorySeeded.current) return;
    if (!window.history.state?.[MOBILE_READING_HISTORY_KEY]) {
      window.history.pushState(
        { ...(window.history.state ?? {}), [MOBILE_READING_HISTORY_KEY]: true },
        '',
      );
    }
    mobileDialogHistorySeeded.current = true;
  }, [mobileDialogOpen]);

  useEffect(() => {
    if (!mobileDialogOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileReading();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileDialogOpen]);

  useEffect(() => {
    if (!mobileDialogOpen || reading) return;
    const frame = requestAnimationFrame(() => {
      readingDeskRef.current?.scrollTo({ top: mobileReadingScrollTop.current, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [mobileDialogOpen, reading]);

  useEffect(() => {
    if (!reading || !mobileDialogOpen || autoScrollResultReadingId.current !== reading.id) return;

    const scrollToResult = () => document.getElementById('reading-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const frame = requestAnimationFrame(scrollToResult);
    const timer = window.setTimeout(scrollToResult, 700);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [mobileDialogOpen, reading]);

  function openReadingDesk() {
    if (isMobileViewport) {
      openMobileReading();
      return;
    }
    document.getElementById('reading-desk')?.scrollIntoView({ behavior: 'smooth' });
  }

  function openGallery() {
    setGalleryCardId(null);
    setGalleryOpen(true);
  }

  function openProductInfo(tab: ProductInfoTab) {
    setProductInfoTab(tab);
    setProductInfoOpen(true);
  }

  function openGalleryFromProductInfo() {
    setProductInfoOpen(false);
    openGallery();
  }

  function closeGallery() {
    setGalleryCardId(null);
    setGalleryOpen(false);
  }

  function openMobileReading() {
    if (!window.history.state?.[MOBILE_READING_HISTORY_KEY]) {
      window.history.pushState(
        { ...(window.history.state ?? {}), [MOBILE_READING_HISTORY_KEY]: true },
        '',
      );
    }
    setMobileReadingOpen(true);
  }

  function closeMobileReading() {
    mobileReadingScrollTop.current = readingDeskRef.current?.scrollTop ?? 0;
    setMobileReadingOpen(false);
    if (window.history.state?.[MOBILE_READING_HISTORY_KEY]) window.history.back();
  }

  function handleReadingComplete(next: MiaoReading, source = 'reading-desk') {
    autoScrollResultReadingId.current = source === 'daily-card' ? next.id : null;
    setReading(next);
    const fingerprint = getReadingFingerprint(next);
    setHistory((items) => [next, ...items.filter((item) => getReadingFingerprint(item) !== fingerprint)].slice(0, 8));
    trackProductEvent('reading_completed', next.spread.id, { readingId: next.id, source });
  }

  function handleDailyReading() {
    if (isMobileViewport) openMobileReading();
    const next = createDailyMiaoReading(new Date(), contentPackId);
    setQuestion(next.question);
    setTopic(next.topic);
    handleReadingComplete(next, 'daily-card');
    trackProductEvent('daily_reading', next.cards[0].drawn.card.id, { readingId: next.id, source: 'daily-card' });
    if (!isMobileViewport) {
      requestAnimationFrame(() => document.getElementById('reading-result')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  function handleContentPackChange(nextPackId: MiaoContentPackId) {
    setContentPackId(nextPackId);
    setReading(null);
  }

  return (
    <Box className="miaoApp">
      <SupportModal opened={supportOpen} onClose={() => setSupportOpen(false)} />

      <Modal
        opened={productInfoOpen}
        onClose={() => setProductInfoOpen(false)}
        title="了解 MiaoTarot"
        size="68rem"
        fullScreen={Boolean(isMobileViewport)}
        scrollAreaComponent={ScrollArea.Autosize}
        className="productInfoModal"
      >
        <ProductInfo
          activeTab={productInfoTab}
          onTabChange={setProductInfoTab}
          onOpenGallery={openGalleryFromProductInfo}
        />
      </Modal>

      <Modal
        opened={galleryOpen}
        onClose={closeGallery}
        title="猫猫图鉴"
        size="90rem"
        fullScreen={Boolean(isMobileViewport)}
        scrollAreaComponent={ScrollArea.Autosize}
        className="galleryModal"
      >
        <CardGallery contentPackId={contentPackId} onCardSelect={setGalleryCardId} />
      </Modal>

      <Modal
        opened={Boolean(selectedGalleryCard)}
        onClose={() => setGalleryCardId(null)}
        title={selectedGalleryCard ? `${selectedGalleryCard.miaoName} · 牌面详情` : '牌面详情'}
        size="lg"
        fullScreen={Boolean(isMobileViewport)}
        className="galleryDetailModal"
      >
        {selectedGalleryCard && (
          <GalleryCardDetail card={selectedGalleryCard} contentPackId={contentPackId} />
        )}
      </Modal>

      <section
        className="heroSection"
        aria-hidden={mobileDialogOpen ? true : undefined}
        inert={mobileDialogOpen ? true : undefined}
      >
        <Container size="xl" className="heroContent">
          <Group justify="space-between" className="topNav">
            <Group gap="sm">
              <ThemeIcon size={38} radius="sm" color="violet" variant="filled">
                <Cat size={20} />
              </ThemeIcon>
              <Text fw={850} className="brandWord">
                {activeTheme.productName}
              </Text>
            </Group>
            <Group gap={6} className="mobileNavActions">
              <Button
                className="mobileSupportAction"
                size="sm"
                color="pink"
                leftSection={<Heart size={16} />}
                onClick={() => setSupportOpen(true)}
                aria-haspopup="dialog"
              >
                罐罐
              </Button>
              <Button
                className="mobileInfoAction"
                size="sm"
                variant="white"
                leftSection={<BookOpenText size={16} />}
                onClick={() => openProductInfo('product')}
                aria-haspopup="dialog"
              >
                了解
              </Button>
              <Button
                className="mobileGalleryAction"
                size="sm"
                variant="white"
                leftSection={<LibraryBig size={16} />}
                onClick={openGallery}
                aria-haspopup="dialog"
              >
                图鉴
              </Button>
            </Group>
            <Group gap="xs" className="desktopNavLinks">
              <Button
                variant="light"
                color="pink"
                leftSection={<Heart size={16} />}
                onClick={() => setSupportOpen(true)}
                aria-haspopup="dialog"
              >
                请猫猫吃罐罐
              </Button>
              <Button variant="white" leftSection={<LibraryBig size={16} />} onClick={openGallery} aria-haspopup="dialog">
                猫猫图鉴
              </Button>
              <Button variant="white" leftSection={<BookOpenText size={16} />} onClick={() => openProductInfo('product')} aria-haspopup="dialog">
                关于
              </Button>
              <Button variant="white" color="dark" onClick={() => openProductInfo('meanings')} aria-haspopup="dialog">
                牌义与来源
              </Button>
            </Group>
          </Group>

          <div className="heroCopy">
            <Badge color="violet" variant="filled" size="lg" className="desktopHeroBadge">
              {activeTheme.localName} · {activeTheme.universe}
            </Badge>
            <Badge color="pink" variant="light" size="lg" className="mobileHeroBadge">
              <Cat size={14} /> 你的猫咪观察员
            </Badge>
            <Title className="heroTitle">
              <span className="desktopHeroTitle">
                {activeTheme.taglineLines.map((line) => <span key={line}>{line}</span>)}
              </span>
              <span className="mobileHeroTitle">今天，想和猫聊聊什么？</span>
            </Title>
            <div className="mobileCompanionVisual">
              <img
                src={`${import.meta.env.BASE_URL}assets/miao-packs/doodle/the-high-priestess.avif`}
                alt="安静观察问题的女祭司猫牌"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <div className="mobileCompanionBubble">“先别急着做决定，抽三张看看重点喵。”</div>
            </div>
            <img
              className="heroInlineVisual"
              src={`${import.meta.env.BASE_URL}assets/miao-hero.jpg`}
              alt="披着紫色斗篷的猫坐在三张猫猫塔罗牌后"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <Text className="heroLead desktopHeroLead">
              {activeTheme.description}
            </Text>
            <Text className="heroLead mobileHeroLead">
              猫不会替你做决定，但很会趴在问题旁边看重点。
            </Text>
            <Group mt="lg" className="heroActions">
              <Button size="lg" leftSection={<Sparkles size={18} />} onClick={openReadingDesk}>
                <span className="desktopActionLabel">开始抽牌</span>
                <span className="mobileActionLabel">
                  {reading
                    ? '继续看刚才的结果'
                    : drawStage === 'ready' ? '和猫猫聊一下' : '继续刚才的抽牌'}
                </span>
              </Button>
              <Button size="lg" variant="white" leftSection={<CalendarDays size={18} />} onClick={handleDailyReading}>
                今日一牌
              </Button>
              <CopyButton value={activeTheme.shareConcept}>
                {({ copied, copy }) => (
                  <Button className="heroCopyIntroAction" size="lg" variant="white" leftSection={copied ? <Check size={18} /> : <Copy size={18} />} onClick={copy}>
                    {copied ? '已复制' : '复制一句介绍'}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Text size="xs" c="dimmed" className="mobileAnalyticsNotice">
              匿名统计游玩次数来改进体验，不上传你的问题、笔记或牌面内容。
            </Text>
          </div>
          <img
            className="heroBackdropVisual"
            src={`${import.meta.env.BASE_URL}assets/miao-hero.jpg`}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
          />
        </Container>
      </section>

      <div aria-hidden={mobileDialogOpen ? true : undefined} inert={mobileDialogOpen ? true : undefined}>
        <TarotPrimer />
      </div>

      <FocusTrap active={mobileDialogOpen && !supportOpen} innerRef={readingDeskRef}>
        <Container
          size="xl"
          py="xl"
          id="reading-desk"
          className={`readingDesk ${mobileReadingOpen ? 'isMobileOpen' : ''}`}
          role={mobileDialogOpen ? 'dialog' : undefined}
          aria-modal={mobileDialogOpen ? true : undefined}
          aria-label={mobileDialogOpen ? '猫咪塔罗抽牌流程' : undefined}
        >
        <div className="mobileReadingChrome">
          <Group gap="sm">
            <ThemeIcon size={36} radius="md" color="violet" variant="filled">
              <Cat size={19} />
            </ThemeIcon>
            <div>
              <Text fw={850}>MiaoTarot</Text>
              <Text size="xs" c="dimmed">一场 60 秒的小小自我对话</Text>
            </div>
          </Group>
          <UnstyledButton
            className="mobileReadingClose"
            onClick={closeMobileReading}
            aria-label="关闭抽牌"
            data-autofocus
          >
            <X size={20} />
          </UnstyledButton>
        </div>
        <InteractiveDrawTable
          question={question}
          topic={topic}
          quickQuestions={quickQuestions}
          contentPackId={contentPackId}
          onContentPackChange={handleContentPackChange}
          onQuestionChange={setQuestion}
          onTopicChange={setTopic}
          onReadingComplete={handleReadingComplete}
          onSessionStart={() => setReading(null)}
          onStageChange={setDrawStage}
        />

        {reading && (
          <div className="completedReading" id="reading-result">
            <ReadingResult reading={reading} contentPackId={contentPackId} />
          </div>
        )}

        <Tabs defaultValue="share" mt="lg" className="miaoTabs" data-has-reading={reading ? 'true' : 'false'}>
          <Tabs.List>
            <Tabs.Tab value="share" leftSection={<Copy size={16} />}>
              分享
            </Tabs.Tab>
            <Tabs.Tab value="deck" leftSection={<Cat size={16} />}>
              猫牌库
            </Tabs.Tab>
            {showInternalTabs && (
              <Tabs.Tab className="internalTab" value="research" leftSection={<LibraryBig size={16} />}>
                调研依据
              </Tabs.Tab>
            )}
            {showInternalTabs && (
              <Tabs.Tab className="internalTab" value="themes" leftSection={<PanelsTopLeft size={16} />}>
                主题实验室
              </Tabs.Tab>
            )}
            {showInternalTabs && (
              <Tabs.Tab className="internalTab" value="data" leftSection={<Database size={16} />}>
                数据
              </Tabs.Tab>
            )}
            <Tabs.Tab value="llm" leftSection={<BrainCircuit size={16} />}>
              AI
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="share" pt="md">
            <SharePanel reading={reading} contentPackId={contentPackId} />
          </Tabs.Panel>
          <Tabs.Panel value="deck" pt="md">
            <DeckTab contentPackId={contentPackId} />
          </Tabs.Panel>
          {showInternalTabs && (
            <Tabs.Panel value="research" pt="md">
              <ResearchTab />
            </Tabs.Panel>
          )}
          {showInternalTabs && (
            <Tabs.Panel value="themes" pt="md">
              <ThemeLabTab />
            </Tabs.Panel>
          )}
          {showInternalTabs && (
            <Tabs.Panel value="data" pt="md">
              <DataTab reading={reading} />
            </Tabs.Panel>
          )}
          <Tabs.Panel value="llm" pt="md">
            <LlmTab reading={reading} showInternal={showInternalTabs} />
          </Tabs.Panel>
        </Tabs>

        {reading && <SupportPrompt onOpen={() => setSupportOpen(true)} />}

        <Paper withBorder p="lg" mt="lg" className="historyPanel">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} size="h3">
                最近出现的猫
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                保存在当前浏览器，点一下可以回看最近 8 次抽到的猫。
              </Text>
            </div>
            <Group gap="xs">
              <Badge variant="light">{history.length} 次</Badge>
              {history.length > 0 && (
                <Button size="xs" variant="subtle" color="red" leftSection={<Trash2 size={14} />} onClick={() => setHistory([])}>
                  清空
                </Button>
              )}
            </Group>
          </Group>
          {history.length > 0 && (
            <Stack gap="xs" mt="md">
              {history.map((item) => (
                <UnstyledButton
                  key={item.id}
                  className="historyItem"
                  onClick={() => {
                    setReading(item);
                    setContentPackId(getMiaoContentPack(item.contentPackId).id as MiaoContentPackId);
                  }}
                >
                  <Group justify="space-between" gap="md">
                    <div>
                      <Text fw={760}>{item.question || '今天是哪只猫？'}</Text>
                      <Text size="xs" c="dimmed">
                        {item.cards.map((card) => card.miao.miaoName).join(' / ')}
                      </Text>
                    </div>
                    <Badge variant="light">{item.spread.shortName}</Badge>
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </Paper>

        <Group justify="space-between" mt="xl" className="footer" gap="md">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              用于自我观察与娱乐，不替代医疗、法律、财务等专业建议。
            </Text>
            <Text size="xs" c="dimmed">
              仅匿名统计游玩次数，用于改进体验；不会上传你的问题、笔记或牌面内容。
            </Text>
            {siteVisitCount !== null && (
              <Group gap={6} className="siteCounter" aria-label={`累计 ${siteVisitCount} 次访问`}>
                <Eye size={14} aria-hidden="true" />
                <Text size="xs" fw={700}>
                  已有 {new Intl.NumberFormat('zh-CN').format(siteVisitCount)} 次猫猫围观
                </Text>
              </Group>
            )}
          </Stack>
          <Stack gap={2} align="flex-end" className="footerInfoLinks">
            <Button
              variant="subtle"
              color="pink"
              size="compact-sm"
              leftSection={<Heart size={14} />}
              onClick={() => setSupportOpen(true)}
            >
              支持 MiaoTarot
            </Button>
            <Button variant="subtle" size="compact-sm" onClick={() => openProductInfo('product')}>
              产品说明
            </Button>
            <UnstyledButton className="footerSocialLink" onClick={() => openProductInfo('sources')}>
              <Text size="xs">抖音 @贷鼠 · bilibili @蔚天灿雨</Text>
            </UnstyledButton>
          </Stack>
        </Group>
        </Container>
      </FocusTrap>
    </Box>
  );
}
