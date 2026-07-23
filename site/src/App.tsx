import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  Drawer,
  FocusTrap,
  Grid,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
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
import { motion, useReducedMotion } from 'motion/react';
import {
  buildMiaoLlmPayload,
  buildMiaoLlmPrompt,
  getMiaoReadableContent,
  getMiaoStreamingPreview,
  loadLlmAvailability,
  parseMiaoLlmResultForCardCount,
  streamMiaoLlmCardReveal,
  streamMiaoLlmEndpoint,
  streamMiaoLlmFocus,
  streamMiaoLlmFollowUp,
  type FocusLlmResult,
  type LlmInterpretiveFocus,
  type LlmConversationMessage,
  type LlmResponseGoal,
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
  getCardDescriptionZhHans,
  getCardKeyword,
  getCardMeaningZhHans,
  getCardName,
  getCardOrdinalLabel,
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
import { trackProductEvent, trackProductPresence } from './domain/productAnalytics';
import {
  InteractiveDrawTable,
  type InteractiveDrawTableHandle,
} from './components/InteractiveDrawTable';
import { TarotCardFrame } from './components/TarotCardFrame';
import type { CardBackTheme, InteractiveDrawStage } from './domain/interactiveDraw';
import { getCardBackSkin } from './domain/cardBacks';
import { cards, getLocalizedText, type TarotCard } from '@cometpisces/tarot-kit';
import { getImagePath } from '@cometpisces/tarot-kit-images';
import {
  DEFAULT_MIAO_CONTENT_PACK_ID,
  getMiaoContentPack,
  getMiaoContentPackCardIds,
  getMiaoContentPackFrame,
  type MiaoContentPackId,
} from './domain/miaoContentPacks';
import { getMiaoCard } from './domain/miaoTarot';
import { getCardFrameSkin, getCardFrameTone } from './domain/cardFrames';
import {
  clearActiveReadingSession,
  getSessionReadings,
  loadActiveReadingSession,
  saveActiveReadingSession,
  type StoredReadingSession,
} from './domain/readingSession';
import {
  clearLlmConversation,
  createConversationAccess,
  loadLlmConversation,
  saveLlmConversation,
  type LlmCardMessage,
  type LlmConversationTurn,
  type LlmReadingFeedback,
} from './domain/llmConversationStorage';
import {
  createCloudConversationSnapshot,
  deleteCloudConversation,
  loadCloudConversation,
  loadCloudConversationAvailability,
  saveCloudConversation,
} from './domain/cloudConversation';

const activeTheme = getTarotTheme();
const quickQuestions = activeTheme.quickQuestions;
const MOBILE_READING_HISTORY_KEY = 'miaotarotMobileReading';
const HOME_COMPANION_STORAGE_KEY = 'miaotarotHomeCompanionCard';
// A hosted support page can be added later; the Alipay QR remains the primary path.
const SUPPORT_URL = '';
const SUPPORT_QR_IMAGE = `${import.meta.env.BASE_URL}assets/support-alipay-qr.jpg`;

function createHomeCompanion() {
  const cardIds = getMiaoContentPackCardIds(DEFAULT_MIAO_CONTENT_PACK_ID);
  let previousCardId: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      previousCardId = window.sessionStorage.getItem(HOME_COMPANION_STORAGE_KEY);
    } catch {
      // The homepage still works when storage is unavailable.
    }
  }

  const candidates = cardIds.filter((cardId) => cardId !== previousCardId);
  const randomIndex = Math.min(
    candidates.length - 1,
    Math.floor(Math.random() * candidates.length),
  );
  const tarotId = candidates[randomIndex] ?? cardIds[0];
  const tarotCard = cards.find((card) => card.id === tarotId) ?? cards[0];
  const content = getMiaoContentBundle(tarotCard.id, DEFAULT_MIAO_CONTENT_PACK_ID);

  return {
    tarotId: tarotCard.id,
    cardName: getCardName(tarotCard),
    image: content.art.generatedImage
      ?? `${import.meta.env.BASE_URL}assets/miao-packs/doodle/${tarotCard.id}.avif`,
    miaoName: content.copy.miaoName,
    bubble: content.copy.memeCaption,
  };
}

type ProductInfoTab = 'product' | 'meanings' | 'sources';
type GalleryView = 'miao' | 'classic';
type ClassicGalleryGroup = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

const sourceRows = [
  {
    name: '@nine-slice-frame/react',
    role: 'MIT 九宫格牌框缩放',
    take: '直接 import CSS border-image 封装，保留装饰四角，在不同手机宽度下不拉伸变形。',
    url: 'https://github.com/callum-gander/nine-slice-frame',
  },
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

function TarotPurpose({ onStart }: { onStart: () => void }) {
  const uses = [
    {
      title: '人生变化',
      body: '面对开始、结束和突如其来的转弯。',
      card: 'death',
      alt: '死亡牌猫咪涂鸦，象征人生变化',
    },
    {
      title: '做出选择',
      body: '看清选项、在意的事与可能代价。',
      card: 'justice',
      alt: '正义牌猫咪涂鸦，象征权衡与选择',
    },
    {
      title: '爱与关系',
      body: '理解靠近、错开和没说出口的话。',
      card: 'two-of-cups',
      alt: '圣杯二猫咪涂鸦，象征爱与关系',
    },
    {
      title: '卡在十字路口',
      body: '把两条路的不同可能分别展开。',
      card: 'two-of-swords',
      alt: '宝剑二猫咪涂鸦，象征进退两难',
    },
    {
      title: '创业与经营',
      body: '看看手上的资源、阻力与突破口。',
      card: 'the-magician',
      alt: '魔术师牌猫咪涂鸦，象征创业与经营',
    },
    {
      title: '个人成长',
      body: '发现反复出现的模式与内在课题。',
      card: 'the-star',
      alt: '星星牌猫咪涂鸦，象征个人成长',
    },
    {
      title: '认识自己',
      body: '听见直觉，理解真正重视的事。',
      card: 'the-hermit',
      alt: '隐士牌猫咪涂鸦，象征自我认识',
    },
    {
      title: '工作与职业',
      body: '梳理方向、合作与眼前的卡点。',
      card: 'three-of-pentacles',
      alt: '星币三猫咪涂鸦，象征工作与职业',
    },
  ];

  return (
    <section className="tarotPurpose" aria-labelledby="tarot-purpose-title">
      <Container size="xl">
        <div className="purposeHeader">
          <Title order={2} id="tarot-purpose-title" className="purposeTitle">
            塔罗牌可以做什么？
          </Title>
          <Text className="purposeIntro">
            塔罗用图像与象征讲述人会经历的事。带着一个具体问题来，从这些常见时刻开始。
          </Text>
        </div>

        <div className="purposeGrid">
          {uses.map(({ title, body, card, alt }) => (
            <article className="purposeCard" key={title}>
              <div className="purposeArt">
                <img
                  src={`${import.meta.env.BASE_URL}assets/miao-packs/doodle/${card}.avif`}
                  alt={alt}
                  loading="lazy"
                />
              </div>
              <div className="purposeCopy">
                <Title order={3}>{title}</Title>
                <Text>{body}</Text>
              </div>
            </article>
          ))}
        </div>

        <div className="purposeHow">
          <div className="purposeHowLead">
            <Text className="purposeHowEyebrow">怎么开始</Text>
            <Title order={3}>生活有时确实很难。</Title>
            <Text>
              一次塔罗阅读，可以帮你换个角度重新看待眼前的处境。
            </Text>
          </div>
          <div className="purposeFeatureList">
            {[
              {
                icon: Sparkles,
                title: '从常见问题开始',
                body: '不知道怎么问？先从关系、工作或自我成长的预设问题开始。',
              },
              {
                icon: PanelsTopLeft,
                title: '选择合适的牌阵',
                body: '按问题选择 1 到 5 张牌，或使用关系、选择等结构。',
              },
              {
                icon: BookOpenText,
                title: '留下阅读记录',
                body: '最近 8 次牌面保存在当前浏览器，刷新后也能回来查看。',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div className="purposeFeature" key={title}>
                <span className="purposeFeatureIcon" aria-hidden="true">
                  <Icon size={19} strokeWidth={1.8} />
                </span>
                <div>
                  <Text fw={850}>{title}</Text>
                  <Text>{body}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="purposeFooter">
          <Button size="md" leftSection={<Sparkles size={17} />} onClick={onStart}>
            带着一个问题抽牌
          </Button>
        </div>
      </Container>
    </section>
  );
}

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
                  你的问题、笔记和牌面内容不会进入匿名游玩统计；对话默认只保存在当前浏览器，只有主动开启“云端备份”才会写入数据库，并可从对话中删除。
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
      <MiaoGeneratedArt
        key={art.generatedImage}
        src={art.generatedImage}
        alt={`${miao.miaoName}，${content.catBreed || '猫咪'}牌面图`}
        compact={compact}
        priority={priority}
      />
    );
  }

  return <MiaoStatePicture miao={miao} compact={compact} />;
}

function MiaoGeneratedArt({
  src,
  alt,
  compact,
  priority,
}: {
  src: string;
  alt: string;
  compact: boolean;
  priority: boolean;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className={`miaoArtAsset is-${status}`} data-image-state={status}>
      <div className="miaoArtLoading" aria-hidden="true">
        <span>✦</span>
        <small>{status === 'error' ? '牌面暂时没跟上' : '猫猫绘制中'}</small>
      </div>
      <img
        className={`miaoGeneratedImage ${compact ? 'isCompact' : ''}`}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  );
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
    <TarotCardFrame
      frame={frame}
      tone={getCardFrameTone(tarotCard)}
      className={`miaoCardArt palette-${miao.palette} ${hasGeneratedImage ? 'hasGeneratedImage' : ''} ${large ? 'isLarge' : ''} ${reversed ? 'isReversed' : ''}`}
    >
      <div className="miaoCardInner">
        <div className="miaoCardVisualWell">
          <div className="miaoCardSigil">{miao.sigil}</div>
          <MiaoArtVisual miao={miao} contentPackId={contentPackId} priority={priority} />
        </div>
        <div className="miaoCardNameplate">
          <div className="miaoCardMeta">{tarotCard ? getCardOrdinalLabel(tarotCard) : '猫猫塔罗'}</div>
          <div className="miaoCardName">{miao.miaoName}</div>
          <div className="miaoCardArchetype">
            <span>{tarotCard ? getCardKeyword(tarotCard) : miao.archetype}</span>
            <span className="miaoCardBreed"> · {content.catBreed || miao.archetype}</span>
          </div>
          <div className="miaoCardFlourish" aria-hidden="true"><b>{frame.crest}</b></div>
        </div>
      </div>
    </TarotCardFrame>
  );
}

function DrawnMiaoCard({
  item,
  index,
  contentPackId,
  onOpenCard,
}: {
  item: MiaoReadingCard;
  index: number;
  contentPackId: string;
  onOpenCard: (cardId: string) => void;
}) {
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

        <UnstyledButton
          type="button"
          className="miaoCardZoomTrigger"
          aria-label={`放大查看${item.miao.miaoName}喵牌`}
          onClick={() => onOpenCard(item.drawn.card.id)}
        >
          <MiaoCardArt card={item} contentPackId={contentPackId} priority />
          <span className="miaoCardZoomHint"><Eye size={14} /> 查看大图</span>
        </UnstyledButton>

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

function SupportModal({
  opened,
  onClose,
  onQrSave,
}: {
  opened: boolean;
  onClose: () => void;
  onQrSave: () => void;
}) {
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
            <img src={SUPPORT_QR_IMAGE} alt="支付宝收款码：请猫猫吃罐罐" />
          </div>
          <Text size="xs" c="dimmed" ta="center">
            电脑端直接扫码；手机端保存后在支付宝识别。
          </Text>
          <Button
            component="a"
            href={SUPPORT_QR_IMAGE}
            download="miaotarot-alipay-qr.jpg"
            variant="light"
            color="blue"
            size="xs"
            leftSection={<Download size={15} />}
            onClick={onQrSave}
          >
            保存支付宝收款码
          </Button>
        </div>

        <Alert color="violet" variant="light" icon={<Cat size={18} />}>
          支持不会影响抽牌结果，也不会解锁“更准”的解读。
        </Alert>

        {SUPPORT_URL && (
          <Button component="a" href={SUPPORT_URL} target="_blank" rel="noreferrer" leftSection={<Heart size={17} />}>
            前往爱发电支持
          </Button>
        )}
      </Stack>
    </Modal>
  );
}

function ReadingResult({
  reading,
  contentPackId,
  onOpenCard,
}: {
  reading: MiaoReading | null;
  contentPackId: string;
  onOpenCard: (cardId: string) => void;
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
            <UnstyledButton
              type="button"
              className="miaoCardZoomTrigger isLarge"
              aria-label={`放大查看${anchor.miao.miaoName}喵牌`}
              onClick={() => onOpenCard(anchor.drawn.card.id)}
            >
              <MiaoCardArt card={anchor} contentPackId={reading.contentPackId} large />
              <span className="miaoCardZoomHint"><Eye size={14} /> 查看大图</span>
            </UnstyledButton>
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
          <DrawnMiaoCard
            key={`${reading.id}-${item.drawn.card.id}-${item.position.id}`}
            item={item}
            index={index}
            contentPackId={reading.contentPackId}
            onOpenCard={onOpenCard}
          />
        ))}
      </SimpleGrid>

    </Stack>
  );
}

const SHARE_IMAGE_LOAD_TIMEOUT_MS = 20_000;

function waitForExportImage(image: HTMLImageElement, timeoutMs = SHARE_IMAGE_LOAD_TIMEOUT_MS) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const rejectNotReady = () => {
      finish(() => reject(new Error('牌面图片还没有加载完成，请检查网络后重试。')));
    };

    const confirmDecoded = async () => {
      if (!image.complete) return;
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        rejectNotReady();
        return;
      }

      try {
        await image.decode?.();
      } catch {
        // Older mobile Safari can reject decode() after the pixels are already
        // available. Natural dimensions are the reliable fallback in that case.
      }

      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        rejectNotReady();
        return;
      }

      finish(resolve);
    };

    function handleLoad() {
      void confirmDecoded();
    }

    function handleError() {
      rejectNotReady();
    }

    const timeoutId = window.setTimeout(rejectNotReady, timeoutMs);
    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);

    if (image.complete) {
      void confirmDecoded();
    }
  });
}

async function waitForShareCardAssets(shareCard: HTMLElement) {
  const images = [...shareCard.querySelectorAll<HTMLImageElement>('img')];
  await Promise.all(images.map((image) => waitForExportImage(image)));

  // Let React commit image-loaded state and let the browser paint it before
  // html-to-image clones the node. This prevents empty cards on mobile.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function SharePanel({ reading, contentPackId }: { reading: MiaoReading | null; contentPackId: string }) {
  const shareText = getShareText(reading);
  const synthesis = reading ? createMiaoSynthesis(reading) : null;
  const mainCard = reading ? getMiaoReadingAnchor(reading) : undefined;
  const [featuredCardKey, setFeaturedCardKey] = useState('');
  const [customShareQuote, setCustomShareQuote] = useState('');
  const featuredCard = reading?.cards.find((card) => getReadingCardKey(card) === featuredCardKey) ?? mainCard;
  const fallbackCardId = getMiaoContentPackCardIds(contentPackId)[0];
  const fallbackCard = cards.find((item) => item.id === fallbackCardId) ?? cards[0];
  const posterMiao = featuredCard?.miao ?? getMiaoCard(fallbackCard, contentPackId);
  const isDefaultFeaturedCard = featuredCard === mainCard;
  const suggestedShareQuote = (isDefaultFeaturedCard ? synthesis?.shareText : featuredCard?.miaoMeaning)
    || featuredCard?.miaoMeaning
    || synthesis?.shareText
    || activeTheme.shareConcept.replace(`${activeTheme.productName}：`, '');
  const posterShareQuote = customShareQuote.trim() || suggestedShareQuote;
  const posterAction = (isDefaultFeaturedCard ? synthesis?.tinyAction : featuredCard?.miao.tinyAction)
    || featuredCard?.miao.tinyAction
    || synthesis?.tinyAction;
  const posterTitle = featuredCard
    ? `${reading && reading.cards.length > 1 ? `${featuredCard.position.label} · ` : ''}${featuredCard.miao.miaoName}`
    : '今天的核心牌';
  const shareUrl = useMemo(() => getShareUrl(reading), [reading]);
  const shareUrlLabel = useMemo(() => getShareUrlLabel(shareUrl), [shareUrl]);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [exportError, setExportError] = useState('');
  const [exportImage, setExportImage] = useState('');
  const [exportPixelSize, setExportPixelSize] = useState<{ width: number; height: number } | null>(null);
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
    setFeaturedCardKey('');
    setCustomShareQuote('');
    setExportStatus('idle');
    setExportError('');
    setExportImage('');
    setExportPixelSize(null);
  }, [reading?.id]);

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

  function invalidateExportPreview() {
    setExportStatus('idle');
    setExportError('');
    setExportImage('');
    setExportPixelSize(null);
  }

  async function handleExport() {
    const shareCard = shareCardRef.current;
    if (!reading || !shareCard) return;

    setExportStatus('loading');
    setExportError('');

    try {
      if ('fonts' in document) {
        await document.fonts.ready;
      }
      await waitForShareCardAssets(shareCard);
      const { toPng } = await import('html-to-image');
      const exportWidth = 540;
      const pixelRatio = 2;
      const exportHeight = Math.ceil(Math.max(
        960,
        shareCard.scrollHeight,
        shareCard.getBoundingClientRect().height,
      ));

      const dataUrl = await toPng(shareCard, {
        cacheBust: true,
        pixelRatio,
        width: exportWidth,
        height: exportHeight,
        backgroundColor: '#ffffff',
        style: {
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
          minHeight: `${exportHeight}px`,
          overflow: 'visible',
          position: 'static',
          zIndex: 'auto',
          top: 'auto',
          left: 'auto',
        },
      });
      setExportImage(dataUrl);
      setExportPixelSize({ width: exportWidth * pixelRatio, height: exportHeight * pixelRatio });
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
        text: posterShareQuote,
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

      {reading && (
        <div className="shareComposer">
          {reading.cards.length > 1 && (
            <div>
              <Text fw={800} size="sm">
                这张分享卡想以哪张牌为主？
              </Text>
              <Text c="dimmed" size="xs" mt={3}>
                可以选未来、建议或任何更想带走的位置。
              </Text>
              <div className="shareCardChoices" role="group" aria-label="选择分享主角牌">
                {reading.cards.map((card) => {
                  const cardKey = getReadingCardKey(card);
                  const isFeatured = featuredCard === card;
                  return (
                    <UnstyledButton
                      type="button"
                      className={`shareCardChoice ${isFeatured ? 'isSelected' : ''}`}
                      key={cardKey}
                      aria-label={`选择「${card.position.label}」作为分享主角：${card.miao.miaoName}`}
                      aria-pressed={isFeatured}
                      onClick={() => {
                        setFeaturedCardKey(cardKey);
                        invalidateExportPreview();
                      }}
                    >
                      <span>{card.position.label}</span>
                      <strong>{card.miao.miaoName}</strong>
                      <small>{getMiaoOrientationLabel(card.drawn.orientation)}</small>
                    </UnstyledButton>
                  );
                })}
              </div>
            </div>
          )}
          <Textarea
            label="带进分享图的一句话（可选）"
            aria-label="带进分享图的一句话"
            description="留空会使用当前主角牌的解读；也可以粘贴某次对话里最有共鸣的一句。"
            placeholder={suggestedShareQuote}
            value={customShareQuote}
            onChange={(event) => {
              setCustomShareQuote(event.currentTarget.value);
              invalidateExportPreview();
            }}
            maxLength={160}
            minRows={2}
            maxRows={4}
            autosize
          />
          <Text size="xs" c="dimmed" className="shareQuoteCount">
            {customShareQuote.length}/160
          </Text>
        </div>
      )}

      <div className={`shareCard sharePoster ${exportStatus === 'loading' ? 'isExporting' : ''}`} ref={shareCardRef}>
        <div className="shareCardTop">
          <Badge color="dark" variant="filled">
            MiaoTarot
          </Badge>
          <Text size="xs">{activeTheme.localName}</Text>
        </div>
        <Title order={3} className="shareCardTitle">
          {posterTitle}
        </Title>
        <div className="sharePosterArt">
          <MiaoCardArt card={posterMiao} contentPackId={reading?.contentPackId ?? contentPackId} priority />
        </div>
        <Text className="shareCardCaption">
          {posterShareQuote}
        </Text>
        <Divider my="sm" />
        {reading ? (
          <div
            className="sharePosterCards"
            style={{ gridTemplateColumns: `repeat(${reading.cards.length}, minmax(0, 1fr))` }}
          >
            {reading.cards.map((item) => (
              <div
                className={`sharePosterCard ${featuredCard === item ? 'isFeatured' : ''}`}
                key={`${reading.id}-${item.position.id}-${item.drawn.card.id}`}
              >
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
        {reading && posterAction && (
          <div className="sharePosterAction">
            <Text size="xs" fw={800} c="violet">
              今天可以做
            </Text>
            <Text size="sm" mt={4}>
              {posterAction}
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
        {exportStatus === 'loading' && '正在等待牌面加载并生成分享图。'}
        {exportStatus === 'done' && '完整分享图已生成；内容较长时，图片会自动向下延展。'}
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
          <img
            src={exportImage}
            alt="MiaoTarot 分享图预览"
            data-export-width={exportPixelSize?.width}
            data-export-height={exportPixelSize?.height}
          />
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

const classicGalleryGroups: Array<{ value: ClassicGalleryGroup; label: string }> = [
  { value: 'all', label: '全部 78 张' },
  { value: 'major', label: '大阿卡纳' },
  { value: 'wands', label: '权杖' },
  { value: 'cups', label: '圣杯' },
  { value: 'swords', label: '宝剑' },
  { value: 'pentacles', label: '星币' },
];

function getStandardCardImage(card: TarotCard) {
  const filename = getImagePath(card.id)?.replace(/\.png$/i, '.avif');
  return filename ? `${import.meta.env.BASE_URL}assets/tarot-standard/${filename}` : '';
}

function CardGallery({
  contentPackId,
  view,
  onViewChange,
  onCardSelect,
}: {
  contentPackId: string;
  view: GalleryView;
  onViewChange: (view: GalleryView) => void;
  onCardSelect: (cardId: string, view: GalleryView) => void;
}) {
  const [classicGroup, setClassicGroup] = useState<ClassicGalleryGroup>('all');
  const pack = getMiaoContentPack(contentPackId);
  const packIds = new Set(getMiaoContentPackCardIds(pack));
  const galleryDeck = cards
    .filter((card) => packIds.has(card.id))
    .map((card) => ({ tarotCard: card, miaoCard: getMiaoCard(card, pack.id) }));
  const classicDeck = cards.filter((card) => (
    classicGroup === 'all'
    || (classicGroup === 'major' ? card.arcana === 'major' : card.suit === classicGroup)
  ));

  return (
    <Tabs
      value={view}
      onChange={(nextView) => nextView && onViewChange(nextView as GalleryView)}
      keepMounted={false}
      className="galleryViewTabs"
    >
      <Tabs.List grow>
        <Tabs.Tab value="miao" leftSection={<Cat size={17} />}>猫猫牌</Tabs.Tab>
        <Tabs.Tab value="classic" leftSection={<BookOpenText size={17} />}>经典牌面 · 学牌意</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="miao" pt="lg">
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
                onClick={() => onCardSelect(tarotCard.id, 'miao')}
                aria-label={`查看${getCardName(tarotCard)}：${miaoCard.miaoName}`}
              >
                <MiaoCardArt
                  card={miaoCard}
                  contentPackId={pack.id}
                  priority={index < 6}
                />
                <div className="galleryTileCopy">
                  <Text fw={820} size="sm" lineClamp={1}>{getCardName(tarotCard)}</Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>{getCardKeyword(tarotCard)}</Text>
                </div>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="classic" pt="lg">
        <Stack gap="md">
          <Paper withBorder p="md" className="gallerySummary classicGallerySummary">
            <Group justify="space-between" align="flex-start" gap="sm">
              <div>
                <Text fw={850}>78 张经典牌面 · Rider–Waite–Smith</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  先看画面和关键词，再打开单牌学习牌面描述、正位与逆位含义。
                </Text>
              </div>
              <Badge color="orange" variant="light">经典原型</Badge>
            </Group>
          </Paper>

          <Tabs
            value={classicGroup}
            onChange={(group) => group && setClassicGroup(group as ClassicGalleryGroup)}
            variant="pills"
            className="classicGalleryFilters"
          >
            <Tabs.List>
              {classicGalleryGroups.map((group) => (
                <Tabs.Tab value={group.value} key={group.value}>{group.label}</Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>

          <Text size="sm" c="dimmed" className="classicGalleryCount">
            当前显示 {classicDeck.length} 张
          </Text>

          <SimpleGrid
            cols={{ base: 2, sm: 3, md: 4, lg: 6 }}
            spacing={{ base: 'sm', md: 'md' }}
            className="classicGalleryGrid"
          >
            {classicDeck.map((tarotCard, index) => (
              <UnstyledButton
                key={tarotCard.id}
                className="classicGalleryTile"
                onClick={() => onCardSelect(tarotCard.id, 'classic')}
                aria-label={`学习经典牌面：${getCardName(tarotCard)}`}
              >
                <div className="classicGalleryImage">
                  <img
                    src={getStandardCardImage(tarotCard)}
                    alt={`${getCardName(tarotCard)}经典塔罗牌面`}
                    loading={index < 6 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
                <div className="classicGalleryTileCopy">
                  <Text fw={840} size="sm" lineClamp={1}>{getCardName(tarotCard)}</Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>{getCardKeyword(tarotCard)}</Text>
                </div>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
}

function GalleryCardDetail({
  card,
  contentPackId,
  initialView,
}: {
  card: MiaoCard;
  contentPackId: string;
  initialView: GalleryView;
}) {
  const [view, setView] = useState<GalleryView>(initialView);
  const tarotCard = cards.find((item) => item.id === card.tarotId);
  const content = getMiaoContentBundle(card.tarotId, contentPackId);

  useEffect(() => {
    setView(initialView);
  }, [card.tarotId, initialView]);

  return (
    <Tabs
      value={view}
      onChange={(nextView) => nextView && setView(nextView as GalleryView)}
      keepMounted={false}
      className="galleryDetailTabs"
    >
      <Tabs.List grow>
        <Tabs.Tab value="classic" leftSection={<BookOpenText size={16} />}>经典牌意</Tabs.Tab>
        <Tabs.Tab value="miao" leftSection={<Cat size={16} />}>猫猫对照</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="classic" pt="lg">
        {tarotCard && (
          <div className="galleryDetail classicGalleryDetail">
            <div className="galleryDetailArt classicGalleryDetailArt">
              <img
                className="classicCardImage"
                src={getStandardCardImage(tarotCard)}
                alt={`${getCardName(tarotCard)} Rider–Waite–Smith 经典牌面`}
                loading="eager"
                decoding="async"
              />
            </div>
            <Stack gap="md" className="galleryDetailCopy">
              <div>
                <Group gap="xs">
                  <Badge color="orange" variant="light">{getCardOrdinalLabel(tarotCard)}</Badge>
                  <Badge color="gray" variant="light">Rider–Waite–Smith</Badge>
                </Group>
                <Title order={2} size="h2" mt="sm">{getCardName(tarotCard)}</Title>
                <Text size="sm" c="dimmed" mt={2}>
                  {getLocalizedText(tarotCard.name, 'en')}
                </Text>
              </div>

              <Paper p="md" className="classicKeywordCard">
                <Text size="xs" fw={850}>核心关键词</Text>
                <Text fw={880} mt={4}>{getCardKeyword(tarotCard)}</Text>
              </Paper>

              <Paper withBorder p="md" className="classicDescriptionCard">
                <Text size="xs" fw={850}>牌面里有什么</Text>
                <Text size="sm" mt={5}>{getCardDescriptionZhHans(tarotCard)}</Text>
              </Paper>

              <Paper withBorder p="md" className="galleryMeaning galleryMeaningUpright">
                <Text size="xs" fw={850}>正位含义</Text>
                <Text size="sm" mt={5}>
                  {getCardMeaningZhHans({ card: tarotCard, orientation: 'upright' })}
                </Text>
              </Paper>

              <Paper withBorder p="md" className="galleryMeaning galleryMeaningReversed">
                <Text size="xs" fw={850}>逆位含义</Text>
                <Text size="sm" mt={5}>
                  {getCardMeaningZhHans({ card: tarotCard, orientation: 'reversed' })}
                </Text>
              </Paper>

              <Paper p="md" className="classicStudyTip">
                <Text size="xs" fw={850}>这样记更容易</Text>
                <Text size="sm" mt={5}>
                  先只看画面说出一个感受，再用“{getCardKeyword(tarotCard)}”复述；最后比较正逆位哪里顺畅、哪里受阻。
                </Text>
              </Paper>
            </Stack>
          </div>
        )}
      </Tabs.Panel>

      <Tabs.Panel value="miao" pt="lg">
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
      </Tabs.Panel>
    </Tabs>
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
  const frame = getCardFrameSkin('moonlit');
  return (
    <TarotCardFrame frame={frame} className={`miaoCardArt themeCardArt palette-${card.palette}`}>
      <div className="miaoCardInner">
        <div className="miaoCardVisualWell">
          <div className="miaoCardSigil">{card.sigil}</div>
          <div className="themeCardMark" aria-hidden="true">
            <Sparkles size={34} />
          </div>
        </div>
        <div className="miaoCardNameplate">
          <div className="miaoCardMeta">主题牌组 · MIAOTAROT</div>
          <div className="miaoCardName">{card.title}</div>
          <div className="miaoCardArchetype">{card.archetype}</div>
          <div className="miaoCardFlourish" aria-hidden="true"><b>{frame.crest}</b></div>
        </div>
      </div>
    </TarotCardFrame>
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

const MAX_LLM_FOLLOW_UP_TURNS = 6;

function isAbortedRequest(value: unknown) {
  return value instanceof Error && value.name === 'AbortError';
}

function getMiaoGuideAvatar(readingId: string) {
  const cardIds = getMiaoContentPackCardIds(DEFAULT_MIAO_CONTENT_PACK_ID);
  let hash = 2166136261;
  for (const character of readingId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const cardId = cardIds[Math.abs(hash) % cardIds.length] ?? cardIds[0];
  return getMiaoContentBundle(cardId, DEFAULT_MIAO_CONTENT_PACK_ID).art.generatedImage;
}

function MiaoGuideAvatar({ reading, size = 'md' }: { reading: MiaoReading; size?: 'sm' | 'md' }) {
  return (
    <span className={`miaoGuideAvatar is-${size}`} aria-hidden="true">
      <img src={getMiaoGuideAvatar(reading.id)} alt="" />
    </span>
  );
}

function getLlmFollowUpSuggestions(reading: MiaoReading) {
  if (reading.spread.id === 'choice') {
    return [
      '方案 A 和 B 最值得比较的条件是什么？',
      '我这周先核实哪项现实信息？',
    ];
  }

  if (reading.spread.id === 'relationship') {
    return [
      '这段关系里我最该先确认什么？',
      '建议牌提醒我守住什么边界？',
    ];
  }

  if (reading.spread.id === 'single') {
    return [
      '这张牌和我的问题有什么关系？',
      '把建议缩小成这周的一步',
    ];
  }

  return [
    '哪张牌最影响当前局面？',
    '把建议缩小成这周的一步',
  ];
}

function getReadingCardKey(card: MiaoReadingCard) {
  return `${card.position.label}:${card.drawn.card.id}:${card.drawn.orientation}`;
}

const responseGoalOptions: Array<{
  value: LlmResponseGoal;
  label: string;
  description: string;
}> = [
  {
    value: 'clarify',
    label: '帮我理清',
    description: '分开事实、牌面提示和还要核实的条件。',
  },
  {
    value: 'direct',
    label: '直接说重点',
    description: '先给结论，再保留一个必要的现实边界。',
  },
  {
    value: 'listen',
    label: '先听我说完',
    description: '先接住你补充的情况，不急着给行动。',
  },
];

const readingFeedbackOptions: Array<{
  value: LlmReadingFeedback;
  label: string;
}> = [
  { value: 'captured', label: '抓住了' },
  { value: 'partial', label: '部分抓住' },
  { value: 'missed', label: '没抓住' },
];

function getCardMessageContext(message: LlmCardMessage) {
  if (!message.result) return getMiaoReadableContent(message.assistantContent, 'card_reveal');
  const evidence = message.result.cardEvidence;
  if (!evidence) return message.result.reply;
  return [
    message.result.reply,
    `传统牌义：${evidence.traditional}`,
    `情境联系：${evidence.context}`,
    `现实边界：${evidence.boundary}`,
    `另一种解释：${evidence.alternative}`,
  ].join('\n');
}

interface ConversationRevealAnimation {
  readingId: string;
  fromCardCount: number;
  backTheme: CardBackTheme;
  phase: 'back' | 'front';
  card?: MiaoReadingCard;
}

function ConversationCardReveal({
  animation,
  contentPackId,
}: {
  animation: ConversationRevealAnimation;
  contentPackId: string;
}) {
  const reduceMotion = useReducedMotion();
  const backSkin = getCardBackSkin(animation.backTheme);
  const cardNumber = animation.fromCardCount + 1;
  const frontVisible = animation.phase === 'front' && Boolean(animation.card);
  const frontContent = animation.card
    ? getMiaoContentBundle(animation.card.drawn.card.id, contentPackId)
    : null;

  return (
    <div
      className="aiInlineCardReveal"
      data-testid="ai-inline-card-reveal"
      data-phase={animation.phase}
      role="status"
      aria-live="polite"
    >
      <Text size="xs" fw={850} c="violet">
        第 {cardNumber} 张{animation.card ? ` · ${animation.card.position.label}` : ''}
      </Text>
      <div className="aiInlineCardTable" aria-hidden="true">
        <motion.div
          className="aiInlineFlipCard"
          initial={false}
          animate={{ rotateY: frontVisible ? 180 : 0 }}
          transition={reduceMotion
            ? { duration: 0 }
            : { duration: 0.56, ease: [0.22, 0.78, 0.2, 1] }}
        >
          <div className="aiInlineFlipFace aiInlineFlipBack">
            <img src={backSkin.image} alt="" draggable={false} />
            <span>轻点翻开</span>
          </div>
          <div className="aiInlineFlipFace aiInlineFlipFront">
            {animation.card && frontContent?.art.generatedImage && (
              <>
                <img
                  className={animation.card.drawn.orientation === 'reversed' ? 'isReversed' : ''}
                  src={frontContent.art.generatedImage}
                  alt=""
                  draggable={false}
                />
                <span>{animation.card.miao.miaoName}</span>
              </>
            )}
          </div>
        </motion.div>
      </div>
      <Text size="sm" fw={800}>
        {frontVisible && animation.card
          ? `${getCardName(animation.card.drawn.card)} · ${getMiaoOrientationLabel(animation.card.drawn.orientation)}`
          : '牌背朝上，正在翻开……'}
      </Text>
      <Text size="xs" c="dimmed" mt={2}>
        {frontVisible ? '牌面已确定，接下来把它放回你的问题里。' : '不用离开对话，牌面马上出现。'}
      </Text>
    </div>
  );
}

function LlmTab({
  reading,
  aiEnabled,
  onEnableAi,
  onRevealNextCard,
  onOpenShare,
  onOpenCard,
  onRestartWithQuestion,
  onKeepCardsWithQuestion,
  showInternal = false,
}: {
  reading: MiaoReading | null;
  aiEnabled: boolean;
  onEnableAi: () => void;
  onRevealNextCard: () => CardBackTheme | null;
  onOpenShare: () => void;
  onOpenCard: (cardId: string) => void;
  onRestartWithQuestion: (question: string) => void;
  onKeepCardsWithQuestion: (question: string) => void;
  showInternal?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error' | 'done'>('idle');
  const [result, setResult] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [baseCardCount, setBaseCardCount] = useState(0);
  const [error, setError] = useState('');
  const [cardMessages, setCardMessages] = useState<LlmCardMessage[]>([]);
  const [cardRequestStatus, setCardRequestStatus] = useState<'idle' | 'streaming'>('idle');
  const [turns, setTurns] = useState<LlmConversationTurn[]>([]);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [followUpError, setFollowUpError] = useState('');
  const [availability, setAvailability] = useState<'checking' | 'available' | 'unconfigured' | 'turnstile'>('checking');
  const [cloudAvailable, setCloudAvailable] = useState(false);
  const [cloudRetentionDays, setCloudRetentionDays] = useState<number | null>(null);
  const [cloudAccess, setCloudAccess] = useState<ReturnType<typeof createConversationAccess> | undefined>();
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [cloudError, setCloudError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [questionDraft, setQuestionDraft] = useState(reading?.question || '');
  const [focusStatus, setFocusStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [focusError, setFocusError] = useState('');
  const [focusStreamingContent, setFocusStreamingContent] = useState('');
  const [focusProposal, setFocusProposal] = useState<FocusLlmResult | null>(null);
  const [interpretiveFocus, setInterpretiveFocus] = useState<LlmInterpretiveFocus | null>(null);
  const [focusEditing, setFocusEditing] = useState(false);
  const [customFocusOpen, setCustomFocusOpen] = useState(false);
  const [customFocusDraft, setCustomFocusDraft] = useState('');
  const [responseGoal, setResponseGoal] = useState<LlmResponseGoal | null>(null);
  const [readingFeedback, setReadingFeedback] = useState<LlmReadingFeedback | null>(null);
  const [conversationReveal, setConversationReveal] = useState<ConversationRevealAnimation | null>(null);
  const reduceMotion = useReducedMotion();
  const activeReadingIdRef = useRef<string | null>(reading?.id ?? null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const hydratingConversationRef = useRef(false);
  const failedCardKeysRef = useRef(new Set<string>());
  const prompt = reading ? buildMiaoLlmPrompt(reading) : '';
  const structuredResult = result && reading && baseCardCount > 0
    ? parseMiaoLlmResultForCardCount(result, reading, baseCardCount)
    : null;
  const followUpLimitReached = turns.length >= MAX_LLM_FOLLOW_UP_TURNS;
  const followUpSuggestions = reading ? getLlmFollowUpSuggestions(reading) : [];
  const newlyRevealedCount = reading ? Math.max(0, reading.cards.length - baseCardCount) : 0;
  const initialStreamPreview = getMiaoStreamingPreview(streamingContent, 'reading');
  const focusStreamingPreview = getMiaoStreamingPreview(focusStreamingContent, 'focus');
  const focusPilot = reading?.spread.id === 'choice';
  const focusReady = !focusPilot || Boolean(interpretiveFocus);
  const readingComplete = Boolean(
    reading && reading.cards.length === reading.spread.positions.length,
  );
  const nextUnrevealedPosition = reading?.spread.positions.find((position) => (
    !reading.cards.some((card) => card.position.id === position.id)
  ));
  const allRevealedCardsInterpreted = Boolean(
    readingComplete
    && reading
    && reading.cards.every((card) => {
      const key = getReadingCardKey(card);
      return cardMessages.some((message) => message.cardKey === key && message.status !== 'streaming');
    }),
  );
  const conversationStarted = Boolean(
    (aiEnabled && reading)
    || result
    || focusProposal
    || focusStatus === 'loading'
    || cardMessages.some((message) => message.assistantContent.trim()),
  );

  useEffect(() => {
    let active = true;
    void Promise.all([
      loadLlmAvailability(),
      loadCloudConversationAvailability(),
    ]).then(([next, cloud]) => {
      if (!active) return;
      setAvailability(next.available ? 'available' : next.turnstileRequired ? 'turnstile' : 'unconfigured');
      setCloudAvailable(cloud.available);
      setCloudRetentionDays(cloud.retentionDays);
    });
    return () => {
      active = false;
    };
  }, []);

  useLayoutEffect(() => {
    activeReadingIdRef.current = reading?.id ?? null;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    failedCardKeysRef.current.clear();
    hydratingConversationRef.current = true;
    const stored = reading ? loadLlmConversation(reading.id) : null;
    setStatus(stored?.baseContent ? 'done' : 'idle');
    setResult(stored?.baseContent || '');
    setStreamingContent('');
    setBaseCardCount(stored?.baseCardCount || 0);
    setError('');
    setCardMessages(stored?.cardMessages || []);
    setCardRequestStatus('idle');
    setTurns(stored?.turns || []);
    setFollowUpMessage(stored?.draft || '');
    setFollowUpStatus('idle');
    setFollowUpError('');
    setCloudAccess(stored?.cloud);
    setCloudStatus(stored?.cloud?.enabled ? 'saved' : 'idle');
    setCloudError('');
    setEditingQuestion(false);
    setQuestionDraft(reading?.question || '');
    setFocusStatus('idle');
    setFocusError('');
    setFocusStreamingContent('');
    setFocusProposal(stored?.focusProposal || null);
    setInterpretiveFocus(stored?.interpretiveFocus || null);
    setFocusEditing(false);
    setCustomFocusOpen(false);
    setCustomFocusDraft('');
    setResponseGoal(stored?.responseGoal || null);
    setReadingFeedback(stored?.feedback || null);
    setConversationReveal(null);

    if (stored?.cloud?.enabled) {
      const controller = new AbortController();
      void loadCloudConversation(stored.cloud, controller.signal).then((cloud) => {
        if (!cloud || activeReadingIdRef.current !== reading?.id) return;
        const snapshot = cloud.snapshot;
        if (snapshot.baseContent && snapshot.turns.length >= (stored.turns?.length || 0)) {
          setResult(snapshot.baseContent);
          setBaseCardCount(snapshot.baseCardCount);
          setCardMessages(snapshot.cardMessages || []);
          setTurns(snapshot.turns);
          setFocusProposal(snapshot.focusProposal || null);
          setInterpretiveFocus(snapshot.interpretiveFocus || null);
          setResponseGoal(snapshot.responseGoal || null);
          setReadingFeedback(snapshot.feedback || null);
        }
      }).catch(() => {
        // Local recovery remains authoritative when cloud loading is unavailable.
      });
      return () => controller.abort();
    }
    return undefined;
  }, [reading?.id, reading?.question]);

  useEffect(() => {
    if (
      cardMessages.length > 0
      || cardRequestStatus === 'streaming'
      || turns.length > 0
      || followUpStatus === 'loading'
      || status === 'streaming'
    ) {
      conversationEndRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [
    cardMessages,
    cardRequestStatus,
    followUpStatus,
    status,
    streamingContent,
    turns,
  ]);

  useLayoutEffect(() => {
    if (!reading) return;
    if (hydratingConversationRef.current) {
      hydratingConversationRef.current = false;
      return;
    }
    saveLlmConversation({
      version: 1,
      readingId: reading.id,
      updatedAt: new Date().toISOString(),
      baseContent: result,
      baseCardCount,
      cardMessages,
      turns,
      draft: followUpMessage,
      ...(focusProposal ? { focusProposal } : {}),
      ...(interpretiveFocus ? { interpretiveFocus } : {}),
      ...(responseGoal ? { responseGoal } : {}),
      ...(readingFeedback ? { feedback: readingFeedback } : {}),
      ...(cloudAccess ? { cloud: cloudAccess } : {}),
    });
  }, [
    baseCardCount,
    cardMessages,
    cloudAccess,
    focusProposal,
    followUpMessage,
    interpretiveFocus,
    reading,
    readingFeedback,
    responseGoal,
    result,
    turns,
  ]);

  useEffect(() => {
    if (!reading || !cloudAccess?.enabled || !cloudAvailable) return;
    if (status === 'streaming' || cardRequestStatus === 'streaming' || followUpStatus === 'loading') return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCloudStatus('saving');
      setCloudError('');
      void saveCloudConversation(
        reading.id,
        cloudAccess,
        createCloudConversationSnapshot(
          reading,
          result,
          baseCardCount,
          cardMessages,
          turns,
          {
            ...(focusProposal ? { focusProposal } : {}),
            ...(interpretiveFocus ? { interpretiveFocus } : {}),
            ...(responseGoal ? { responseGoal } : {}),
            ...(readingFeedback ? { feedback: readingFeedback } : {}),
          },
        ),
        controller.signal,
      ).then(() => {
        if (!controller.signal.aborted) setCloudStatus('saved');
      }).catch((caught) => {
        if (controller.signal.aborted) return;
        setCloudStatus('error');
        setCloudError(caught instanceof Error ? caught.message : String(caught));
      });
    }, 700);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    baseCardCount,
    cardMessages,
    cardRequestStatus,
    cloudAccess,
    cloudAvailable,
    followUpStatus,
    focusProposal,
    interpretiveFocus,
    reading,
    readingFeedback,
    responseGoal,
    result,
    status,
    turns,
  ]);

  useEffect(() => {
    if (
      !conversationReveal
      || conversationReveal.phase !== 'back'
      || !reading
      || reading.id !== conversationReveal.readingId
    ) {
      return;
    }
    const revealedCard = reading.cards[conversationReveal.fromCardCount];
    if (!revealedCard) return;
    const imageSource = getMiaoContentBundle(
      revealedCard.drawn.card.id,
      reading.contentPackId,
    ).art.generatedImage;
    let active = true;
    const revealFront = () => {
      if (!active) return;
      setConversationReveal((current) => (
        current?.readingId === conversationReveal.readingId
        && current.fromCardCount === conversationReveal.fromCardCount
        && current.phase === 'back'
          ? { ...current, phase: 'front', card: revealedCard }
          : current
      ));
    };
    if (!imageSource) {
      revealFront();
      return;
    }
    const image = new Image();
    const fallback = window.setTimeout(revealFront, 420);
    image.onload = revealFront;
    image.onerror = revealFront;
    image.src = imageSource;
    if (image.complete) revealFront();
    return () => {
      active = false;
      window.clearTimeout(fallback);
      image.onload = null;
      image.onerror = null;
    };
  }, [conversationReveal, reading]);

  useEffect(() => {
    if (!conversationReveal || conversationReveal.phase !== 'front') return;
    const timer = window.setTimeout(() => {
      setConversationReveal((current) => (
        current?.readingId === conversationReveal.readingId
        && current.fromCardCount === conversationReveal.fromCardCount
          ? null
          : current
      ));
    }, reduceMotion ? 240 : 760);
    return () => window.clearTimeout(timer);
  }, [conversationReveal, reduceMotion]);

  useEffect(() => {
    if (
      !aiEnabled
      || !focusPilot
      || !reading
      || availability !== 'available'
      || focusProposal
      || interpretiveFocus
      || focusStatus !== 'idle'
      || cardRequestStatus === 'streaming'
      || status === 'streaming'
      || followUpStatus === 'loading'
    ) {
      return;
    }
    void handleFocusProposal();
  }, [
    aiEnabled,
    availability,
    cardRequestStatus,
    focusPilot,
    focusProposal,
    focusStatus,
    followUpStatus,
    interpretiveFocus,
    reading,
    status,
  ]);

  useEffect(() => {
    if (
      !aiEnabled
      || !reading
      || !focusReady
      || availability !== 'available'
      || focusStatus === 'loading'
      || cardRequestStatus === 'streaming'
      || status === 'streaming'
      || followUpStatus === 'loading'
      || conversationReveal
    ) {
      return;
    }
    const nextCardIndex = reading.cards.findIndex((card) => {
      const cardKey = getReadingCardKey(card);
      return !cardMessages.some((message) => message.cardKey === cardKey)
        && !failedCardKeysRef.current.has(cardKey);
    });
    if (nextCardIndex >= 0) void handleCardReveal(nextCardIndex);
  }, [
    aiEnabled,
    availability,
    cardMessages,
    cardRequestStatus,
    conversationReveal,
    followUpStatus,
    focusReady,
    focusStatus,
    reading,
    status,
  ]);

  async function handleFocusProposal() {
    if (!reading) return;
    const requestReadingId = reading.id;
    const requestStartedAt = Date.now();
    let firstContentTracked = false;
    const trackFirstContent = (content: string) => {
      if (firstContentTracked || !getMiaoStreamingPreview(content, 'focus').trim()) return;
      firstContentTracked = true;
      const elapsed = Date.now() - requestStartedAt;
      const bucket = elapsed < 1000
        ? 'under-1s'
        : elapsed < 3000
          ? '1-3s'
          : elapsed < 8000
            ? '3-8s'
            : 'over-8s';
      trackProductEvent('focus_first_content', bucket, {
        readingId: reading.id,
        source: 'llm-focus',
      });
    };
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setFocusStatus('loading');
    setFocusError('');
    setFocusStreamingContent('');
    trackProductEvent('llm_requested', reading.spread.id, {
      readingId: reading.id,
      source: 'llm-focus',
    });

    try {
      const output = await streamMiaoLlmFocus(reading, {
        themeId: activeTheme.id,
        signal: controller.signal,
        onDelta: (_, accumulated) => {
          if (activeReadingIdRef.current !== requestReadingId) return;
          setFocusStreamingContent(accumulated);
          trackFirstContent(accumulated);
        },
      });
      if (activeReadingIdRef.current !== requestReadingId) return;
      trackFirstContent(output.content);
      setFocusProposal(output.structured);
      setFocusStreamingContent('');
      setFocusStatus('idle');
      trackProductEvent('llm_succeeded', reading.spread.id, {
        readingId: reading.id,
        source: 'llm-focus',
      });
    } catch (caught) {
      if (isAbortedRequest(caught)) return;
      setFocusStatus('error');
      setFocusError(caught instanceof Error ? caught.message : String(caught));
      trackProductEvent('llm_failed', reading.spread.id, {
        readingId: reading.id,
        source: 'llm-focus',
      });
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }

  function applyInterpretiveFocus(text: string, source: LlmInterpretiveFocus['source']) {
    if (!reading) return;
    const normalized = text.trim().slice(0, 120);
    if (!normalized) return;
    const changed = Boolean(
      interpretiveFocus
      && (
        interpretiveFocus.text !== normalized
        || interpretiveFocus.source !== source
      ),
    );

    if (changed) {
      requestControllerRef.current?.abort();
      failedCardKeysRef.current.clear();
      setCardMessages([]);
      setTurns([]);
      setFollowUpMessage('');
      setFollowUpStatus('idle');
      setFollowUpError('');
      setResponseGoal(null);
      setReadingFeedback(null);
    }

    setInterpretiveFocus({ text: normalized, source });
    setFocusEditing(false);
    setCustomFocusOpen(false);
    setCustomFocusDraft('');
    setFocusError('');
    setFocusStatus('idle');
    trackProductEvent(
      source === 'confirmed' ? 'focus_confirmed' : 'focus_corrected',
      source,
      {
        readingId: reading.id,
        source: changed ? 'focus-revision' : 'focus-initial',
      },
    );
  }

  function handleResponseGoal(nextGoal: LlmResponseGoal) {
    if (!reading) return;
    setResponseGoal(nextGoal);
    trackProductEvent('response_goal_selected', nextGoal, {
      readingId: reading.id,
      source: 'reading-complete',
    });
  }

  function handleReadingFeedback(nextFeedback: LlmReadingFeedback) {
    if (!reading) return;
    setReadingFeedback(nextFeedback);
    trackProductEvent('reading_feedback_submitted', nextFeedback, {
      readingId: reading.id,
      source: interpretiveFocus?.source === 'confirmed' ? 'initial-focus' : 'corrected-focus',
    });
  }

  function buildConversationHistory() {
    const assistantContext = cardMessages
      .filter((item) => item.assistantContent.trim())
      .map((item) => `${item.position}：${getCardMessageContext(item)}`)
      .join('\n\n') || result;
    if (!assistantContext.trim()) return [];

    const history: LlmConversationMessage[] = [
      { role: 'assistant', content: assistantContext },
    ];
    for (const turn of turns.filter((item) => item.assistantContent.trim()).slice(-5)) {
      history.push(
        { role: 'user', content: turn.userMessage },
        { role: 'assistant', content: turn.assistantContent },
      );
    }
    return history;
  }

  function handleConversationReveal() {
    if (
      !reading
      || conversationReveal
      || cardRequestStatus === 'streaming'
      || status === 'streaming'
      || followUpStatus === 'loading'
    ) {
      return;
    }
    const fromCardCount = reading.cards.length;
    const backTheme = onRevealNextCard();
    if (!backTheme) return;
    setConversationReveal({
      readingId: reading.id,
      fromCardCount,
      backTheme,
      phase: 'back',
    });
  }

  async function handleCardReveal(cardIndex: number) {
    if (!reading) return;
    const card = reading.cards[cardIndex];
    if (!card) return;
    const cardKey = getReadingCardKey(card);
    const messageId = `${reading.id}-card-${cardKey}`;
    const requestReadingId = reading.id;
    const history = buildConversationHistory();
    let latestContent = '';

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setCardRequestStatus('streaming');
    setError('');
    setCardMessages((current) => [
      ...current.filter((message) => message.cardKey !== cardKey),
      {
        id: messageId,
        sequence: Date.now(),
        cardKey,
        position: card.position.label,
        tarotCardId: card.drawn.card.id,
        assistantContent: '',
        result: null,
        status: 'streaming',
      },
    ]);
    trackProductEvent('llm_requested', reading.spread.id, {
      readingId: reading.id,
      source: 'llm-card-reveal',
    });

    try {
      const output = await streamMiaoLlmCardReveal(reading, cardIndex, {
        themeId: activeTheme.id,
        signal: controller.signal,
        ...(history.length ? { history } : {}),
        ...(interpretiveFocus ? { focus: interpretiveFocus } : {}),
        onDelta: (_, accumulated) => {
          if (activeReadingIdRef.current !== requestReadingId) return;
          latestContent = accumulated;
          setCardMessages((current) => current.map((message) => message.id === messageId
            ? { ...message, assistantContent: accumulated }
            : message));
        },
      });
      if (activeReadingIdRef.current !== requestReadingId) return;
      setCardMessages((current) => current.map((message) => message.id === messageId
        ? {
          ...message,
          assistantContent: output.content || latestContent,
          result: output.structured,
          status: output.structured ? 'done' : 'incomplete',
        }
        : message));
      if (output.warning) setError(output.warning);
      trackProductEvent('llm_succeeded', reading.spread.id, {
        readingId: reading.id,
        source: 'llm-card-reveal',
      });
    } catch (caught) {
      if (isAbortedRequest(caught)) return;
      failedCardKeysRef.current.add(cardKey);
      setCardMessages((current) => latestContent
        ? current.map((message) => message.id === messageId
          ? { ...message, assistantContent: latestContent, status: 'incomplete' }
          : message)
        : current.filter((message) => message.id !== messageId));
      setError(caught instanceof Error ? caught.message : String(caught));
      trackProductEvent('llm_failed', reading.spread.id, {
        readingId: reading.id,
        source: 'llm-card-reveal',
      });
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      if (activeReadingIdRef.current === requestReadingId) setCardRequestStatus('idle');
    }
  }

  async function handleCall() {
    if (!reading) return;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const requestReadingId = reading.id;
    setStatus('streaming');
    setResult('');
    setBaseCardCount(reading.cards.length);
    setStreamingContent('');
    setError('');
    setFollowUpStatus('idle');
    setFollowUpError('');
    trackProductEvent('llm_requested', reading.spread.id, { readingId: reading.id, source: 'llm-panel' });

    try {
      const output = await streamMiaoLlmEndpoint(reading, {
        themeId: activeTheme.id,
        signal: controller.signal,
        onDelta: (_, accumulated) => {
          if (activeReadingIdRef.current === requestReadingId) {
            setStreamingContent(accumulated);
            setResult(accumulated);
          }
        },
      });
      if (activeReadingIdRef.current !== requestReadingId) return;
      setResult(output.content);
      setBaseCardCount(reading.cards.length);
      setStreamingContent('');
      setStatus('done');
      if (output.warning) setError(output.warning);
      trackProductEvent('llm_succeeded', reading.spread.id, { readingId: reading.id, source: 'llm-panel' });
    } catch (caught) {
      if (isAbortedRequest(caught)) return;
      setStatus('error');
      setStreamingContent('');
      trackProductEvent('llm_failed', reading.spread.id, { readingId: reading.id, source: 'llm-panel' });
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }

  async function handleFollowUp() {
    if (!reading || !conversationStarted || followUpLimitReached) return;
    const message = followUpMessage.trim();
    if (!message) {
      setFollowUpStatus('error');
      setFollowUpError('先写下你想继续问的问题。');
      return;
    }

    const history = buildConversationHistory();

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const requestReadingId = reading.id;
    const turnId = `${requestReadingId}-${Date.now()}`;
    let latestContent = '';
    setFollowUpStatus('loading');
    setFollowUpError('');
    setFollowUpMessage('');
    setTurns((current) => [
      ...current,
      {
        id: turnId,
        sequence: Date.now(),
        userMessage: message,
        assistantContent: '',
        result: null,
        status: 'streaming',
      },
    ]);
    trackProductEvent('llm_requested', reading.spread.id, { readingId: reading.id, source: 'llm-follow-up' });

    try {
      const output = await streamMiaoLlmFollowUp(reading, message, history, {
        themeId: activeTheme.id,
        signal: controller.signal,
        ...(interpretiveFocus ? { focus: interpretiveFocus } : {}),
        ...(responseGoal ? { responseGoal } : {}),
        onDelta: (_, accumulated) => {
          if (activeReadingIdRef.current === requestReadingId) {
            latestContent = accumulated;
            setTurns((current) => current.map((turn) => turn.id === turnId
              ? { ...turn, assistantContent: accumulated }
              : turn));
          }
        },
      });
      if (activeReadingIdRef.current !== requestReadingId) return;

      setTurns((current) => current.map((turn) => turn.id === turnId
        ? {
          ...turn,
          assistantContent: output.content || latestContent,
          result: output.structured,
          status: output.structured ? 'done' : 'incomplete',
        }
        : turn));
      setFollowUpStatus('idle');
      if (output.warning) setFollowUpError(output.warning);
      trackProductEvent('llm_succeeded', reading.spread.id, { readingId: reading.id, source: 'llm-follow-up' });
    } catch (caught) {
      if (isAbortedRequest(caught)) return;
      setFollowUpStatus('error');
      setTurns((current) => latestContent
        ? current.map((turn) => turn.id === turnId
          ? { ...turn, assistantContent: latestContent, status: 'incomplete' }
          : turn)
        : current.filter((turn) => turn.id !== turnId));
      if (!latestContent) setFollowUpMessage(message);
      setFollowUpError(caught instanceof Error ? caught.message : String(caught));
      trackProductEvent('llm_failed', reading.spread.id, { readingId: reading.id, source: 'llm-follow-up' });
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }

  function handleCloudToggle(enabled: boolean) {
    setCloudError('');
    if (enabled) {
      setCloudAccess((current) => (
        current ? { ...current, enabled: true } : createConversationAccess()
      ));
      setCloudStatus('saving');
    } else {
      setCloudAccess((current) => current ? { ...current, enabled: false } : undefined);
      setCloudStatus('idle');
    }
  }

  async function handleClearConversation() {
    if (!reading) return;
    requestControllerRef.current?.abort();
    if (cloudAccess) {
      try {
        await deleteCloudConversation(cloudAccess);
      } catch (caught) {
        setCloudStatus('error');
        setCloudError(caught instanceof Error ? caught.message : String(caught));
        return;
      }
    }
    clearLlmConversation(reading.id);
    failedCardKeysRef.current = new Set(reading.cards.map(getReadingCardKey));
    setStatus('idle');
    setResult('');
    setStreamingContent('');
    setBaseCardCount(0);
    setError('');
    setCardMessages([]);
    setCardRequestStatus('idle');
    setTurns([]);
    setFollowUpMessage('');
    setFollowUpStatus('idle');
    setFollowUpError('');
    setCloudAccess(undefined);
    setCloudStatus('idle');
    setFocusStatus('idle');
    setFocusError('');
    setFocusStreamingContent('');
    setFocusProposal(null);
    setInterpretiveFocus(null);
    setFocusEditing(false);
    setCustomFocusOpen(false);
    setCustomFocusDraft('');
    setResponseGoal(null);
    setReadingFeedback(null);
    setConversationReveal(null);
  }

  const conversationTimeline = [
    ...cardMessages.map((message, index) => ({
      kind: 'card' as const,
      sequence: message.sequence ?? index,
      message,
    })),
    ...turns.map((turn, index) => ({
      kind: 'turn' as const,
      sequence: turn.sequence ?? cardMessages.length + index,
      turn,
    })),
  ].sort((left, right) => left.sequence - right.sequence);

  return (
    <Grid gap="md" className="aiWorkspaceGrid">
      <Grid.Col span={{ base: 12, md: 5 }} className="aiSettingsColumn">
        <Paper withBorder p="lg">
          <Stack gap="md">
            <Group gap="sm" wrap="nowrap">
              {reading && <MiaoGuideAvatar reading={reading} />}
              <div>
                <Title order={2} size="h3">
                  Miao 语解读（可选）
                </Title>
                <Text c="dimmed" size="sm" mt={2}>
                  翻开第一张就能聊，后续牌会逐步加入同一次对话。
                </Text>
              </div>
            </Group>
            {availability === 'available' ? (
              <Alert color="violet" variant="light" icon={iconNode(BrainCircuit)}>
                {aiEnabled
                  ? '边翻边聊已开启：每翻一张，问题、这张牌和已翻开的上下文会发送给 Qwen；尚未翻开的牌不会发送。'
                  : '只有你主动发送时，问题、已翻开的牌、必要牌义和本次对话才会交给 Qwen；尚未翻开的牌不会发送。'}
              </Alert>
            ) : (
              <Alert color="gray" variant="light" icon={iconNode(BrainCircuit)}>
                {availability === 'checking' && '正在确认 Miao 语服务状态。'}
                {availability === 'unconfigured' && 'Miao 语解读尚未开放，当前牌义、猫语总结和分享功能不受影响。'}
                {availability === 'turnstile' && 'AI 服务需要人机验证，验证组件接入前暂不开放调用。'}
              </Alert>
            )}
            {reading && (
              <Paper withBorder p="sm" className="aiReadingContext">
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div>
                    <Text size="xs" fw={780} c="violet">这次的问题 · 全程锚点</Text>
                    <Text size="sm" mt={4}>{reading.question}</Text>
                    <Text size="xs" c="dimmed" mt={5}>
                      {reading.spread.name} · 已翻开 {reading.cards.length}/{reading.spread.positions.length} 张
                    </Text>
                  </div>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    onClick={() => {
                      setQuestionDraft(reading.question);
                      setEditingQuestion((value) => !value);
                    }}
                  >
                    修改问题
                  </Button>
                </Group>
                {editingQuestion && (
                  <div className="aiQuestionEditor">
                    <Textarea
                      label="新的问题"
                      aria-label="新的问题"
                      description="问题变了，同一张牌的侧重点也会变。"
                      value={questionDraft}
                      onChange={(event) => setQuestionDraft(event.currentTarget.value)}
                      minRows={2}
                      maxRows={5}
                      autosize
                      maxLength={500}
                    />
                    <Alert color="yellow" variant="light" mt="sm">
                      推荐用新问题重新抽牌，让提问、抽牌意图和解读保持一致。保留原牌也可以，但会清空当前 AI 对话并重新解释。
                    </Alert>
                    <Stack gap="xs" mt="sm">
                      <Button
                        disabled={!questionDraft.trim() || questionDraft.trim() === reading.question}
                        onClick={() => onRestartWithQuestion(questionDraft.trim())}
                      >
                        用新问题重新抽牌（推荐）
                      </Button>
                      <Button
                        variant="light"
                        color="gray"
                        disabled={!questionDraft.trim() || questionDraft.trim() === reading.question}
                        onClick={() => onKeepCardsWithQuestion(questionDraft.trim())}
                      >
                        保留这副牌，重开 Miao 对话
                      </Button>
                    </Stack>
                  </div>
                )}
              </Paper>
            )}
            {aiEnabled ? (
              <Alert color="teal" variant="light">
                {focusPilot && focusStatus === 'loading'
                  ? 'Miao 正在整理它对问题重点的理解。确认或修改后，才会开始逐牌解释。'
                  : focusPilot && !interpretiveFocus
                    ? '先确认 Miao 有没有抓住重点；这一步可以修改，也可以按原问题继续。'
                  : cardRequestStatus === 'streaming'
                  ? '新翻开的牌正在进入对话，回复会边生成边保存。'
                  : cardMessages.length > 0
                    ? `已解释 ${cardMessages.length} 张牌；${focusPilot && !allRevealedCardsInterpreted ? '继续翻牌完成这次阅读。' : '现在可以继续聊。'}`
                    : '翻开第一张牌后，Miao 会自动在同一段对话里解释。'}
              </Alert>
            ) : (
              <Button
                leftSection={<Send size={16} />}
                disabled={!reading || availability !== 'available'}
                onClick={onEnableAi}
              >
                开启 Miao 对话并解读已翻开的牌
              </Button>
            )}
            {error && (
              <Alert color={status === 'error' ? 'red' : 'yellow'}>
                {error}
              </Alert>
            )}
            {!aiEnabled && status === 'done' && (
              <Alert color="teal">
                {newlyRevealedCount > 0
                  ? `又翻开了 ${newlyRevealedCount} 张；更新后会一起参考。`
                  : '解读已保存在当前浏览器，刷新后可以继续。'}
              </Alert>
            )}
            <Paper withBorder p="sm" className="conversationStorageControls">
              <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                <div>
                  <Text size="sm" fw={800}>保存这次对话</Text>
                  <Text size="xs" c="dimmed" mt={3}>
                    默认只存当前浏览器。云端备份需主动开启，可随时删除。
                  </Text>
                </div>
                <Switch
                  aria-label="云端备份对话"
                  label={cloudAccess?.enabled ? '已开启' : '开启'}
                  checked={cloudAccess?.enabled === true}
                  disabled={!cloudAvailable || !reading}
                  onChange={(event) => handleCloudToggle(event.currentTarget.checked)}
                />
              </Group>
              {cloudAccess?.enabled && (
                <Text size="xs" c={cloudStatus === 'error' ? 'red' : 'teal'} mt="xs">
                  {cloudStatus === 'saving' && '正在加密传输并保存……'}
                  {cloudStatus === 'saved' && `已备份到 MiaoTarot 云端，${cloudRetentionDays || 30} 天后过期。`}
                  {cloudStatus === 'error' && cloudError}
                </Text>
              )}
              {cloudAccess && !cloudAccess.enabled && (
                <Text size="xs" c="dimmed" mt="xs">
                  云端更新已暂停；现有副本会在保留期结束后过期，也可以现在删除。
                </Text>
              )}
              {!cloudAvailable && (
                <Text size="xs" c="dimmed" mt="xs">云端备份尚未配置，本地刷新恢复仍然可用。</Text>
              )}
              {(conversationStarted || turns.length > 0) && (
                <Button
                  mt="xs"
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  leftSection={<Trash2 size={13} />}
                  onClick={() => void handleClearConversation()}
                >
                  删除本地{cloudAccess ? '和云端' : ''}对话
                </Button>
              )}
            </Paper>
          </Stack>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }} className="aiChatColumn">
        <Paper withBorder p="lg" className="aiResultPanel" id="miao-conversation-workspace">
          <Group justify="space-between" mb="sm">
            <Title order={2} size="h3">
              {showInternal ? 'Prompt' : 'Miao 语解读'}
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
          ) : !conversationStarted ? (
            <Paper withBorder p="md" className="aiEmptyState">
              <ThemeIcon size={40} radius="sm" variant="light" color="violet">
                {iconNode(BrainCircuit)}
              </ThemeIcon>
              <Text fw={780} mt="sm">
                翻开一张牌，就可以开始
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                Miao 会流式回应，只参考已翻开的牌、牌位、传统牌义和你的问题。
              </Text>
            </Paper>
          ) : null}
          {status === 'streaming' && (
            <div className="miaoStreamingMessage" role="status" aria-live="polite">
              {reading && <MiaoGuideAvatar reading={reading} size="sm" />}
              <div>
                <Text size="xs" fw={800} c="violet">Miao 正在说</Text>
                <Text size="sm" mt={4} className="miaoStreamingText">
                  {initialStreamPreview || '正在看已翻开的牌……'}
                  <span className="streamingCaret" aria-hidden="true" />
                </Text>
              </div>
            </div>
          )}
          {structuredResult && (
            <>
              {showInternal && <Divider my="md" />}
              <Group justify="space-between" align="flex-start" gap="sm">
                <div>
                  <Title order={3} size="h4">
                    {structuredResult.title}
                  </Title>
                  <Text size="xs" fw={850} c="violet" mt="sm">核心提示</Text>
                  <Text c="dimmed" size="sm" mt={3}>
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
              <details className="miaoReadingEvidence">
                <summary>查看逐牌依据（{structuredResult.cards.length} 张）</summary>
                <Stack gap="xs" mt="xs">
                  {structuredResult.cards.map((card, index) => (
                    <Paper key={`${card.position}-${index}`} withBorder p="sm" className="structuredResultCard">
                      <Text fw={780} size="sm">{card.position}</Text>
                      <Text size="sm" c="dimmed" mt={4}>{card.reading}</Text>
                    </Paper>
                  ))}
                </Stack>
              </details>
              <Alert mt="md" color="teal" variant="light" icon={iconNode(WandSparkles)} title="下一步">
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
          {!showInternal && result && !structuredResult && status !== 'streaming' && (
            <div className="aiMessage isAssistant isIncomplete" role="status">
              <Group gap="xs" wrap="nowrap" align="flex-start">
                {reading && <MiaoGuideAvatar reading={reading} size="sm" />}
                <div>
                  <Text size="xs" fw={800} c="violet">Miao 语解读</Text>
                  <Text size="sm" mt={4} className="miaoStreamingText">
                    {getMiaoReadableContent(result, 'reading')}
                  </Text>
                  <Text size="xs" c="dimmed" mt={6}>
                    这条回复已保留；格式未完整收束，但不会消失。
                  </Text>
                </div>
              </Group>
            </div>
          )}
          {!showInternal && conversationStarted && (
            <section className="aiConversation" aria-labelledby="ai-conversation-title">
                  <Divider my="lg" />
                  <Group justify="space-between" align="flex-start" gap="sm">
                    <div>
                      <Title order={3} size="h4" id="ai-conversation-title">
                        {reading?.cards.length === 0
                          ? '带着问题，和 Miao 一张张看'
                          : focusPilot && !allRevealedCardsInterpreted
                          ? '沿着确认的重点看牌'
                          : '继续问这副牌'}
                      </Title>
                      <Text size="sm" c="dimmed" mt={4}>
                        {reading?.cards.length === 0
                          ? '问题会留在对话最前面；翻牌、解读和追问都在这里继续。'
                          : focusPilot
                          ? '每张牌都会沿用你确认的重点；牌面提示和现实条件会分开写。'
                          : '每一轮都沿用上面的原问题和固定牌面，不会重新抽牌。'}
                      </Text>
                    </div>
                    <Group gap="xs" className="aiConversationHeaderActions">
                      <Badge variant="light" color="violet">
                        同一副牌
                      </Badge>
                      <Button
                        type="button"
                        size="compact-sm"
                        variant="light"
                        leftSection={<Share2 size={14} />}
                        className="aiConversationShareAction"
                        disabled={!readingComplete}
                        onClick={onOpenShare}
                      >
                        {readingComplete ? '分享' : '翻完可分享'}
                      </Button>
                    </Group>
                  </Group>

                  <div
                    className="aiConversationLog"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                  >
                    {reading && (
                      <div className="aiMessage isUser aiOpeningQuestion" data-testid="ai-opening-question">
                        <Text size="xs" fw={800}>你 · 这次想问</Text>
                        <Text size="sm" mt={3}>{reading.question}</Text>
                      </div>
                    )}
                    {!showInternal && focusPilot && aiEnabled && (
                      <section
                        className="focusNegotiation"
                        aria-labelledby="focus-negotiation-title"
                        data-testid="ai-focus-negotiation"
                      >
                        <Text size="xs" fw={850} c="violet">Miao · 先确认我理解得对不对</Text>
                        <Title order={3} size="h4" id="focus-negotiation-title" mt={4}>
                          我听见的重点
                        </Title>
                        <Text size="xs" c="dimmed" mt={4}>
                          这是可以改的理解，不是替你下结论；确认后，每张牌都会沿着它解释。
                        </Text>

                        {focusStatus === 'loading' && (
                          <div className="focusProposalLoading" role="status" aria-live="polite">
                            {reading && <MiaoGuideAvatar reading={reading} size="sm" />}
                            <div>
                              <Text size="xs" fw={800} c="violet">
                                {focusStreamingPreview ? 'Miao 正在整理' : 'Miao 正在听'}
                              </Text>
                              <Text size="sm" mt={3} className="miaoStreamingText">
                                {focusStreamingPreview || '正在把你的两难整理成一个可确认的重点……'}
                                <span className="streamingCaret" aria-hidden="true" />
                              </Text>
                            </div>
                          </div>
                        )}

                        {focusProposal && (
                          <Paper withBorder p="sm" mt="sm" className="focusProposalCard">
                            <Text size="sm">{focusProposal.acknowledgement}</Text>
                            <Text size="sm" fw={800} mt={7}>
                              我先按你更在意「{interpretiveFocus?.text || focusProposal.focus}」来读。
                            </Text>
                            {interpretiveFocus && !focusEditing ? (
                              <Group justify="space-between" align="center" gap="xs" mt="sm">
                                <Badge color="teal" variant="light">已确认 · 后续牌沿用</Badge>
                                <Button
                                  type="button"
                                  size="compact-xs"
                                  variant="subtle"
                                  onClick={() => {
                                    setFocusEditing(true);
                                    setCustomFocusOpen(false);
                                    setCustomFocusDraft('');
                                  }}
                                >
                                  修改重点
                                </Button>
                              </Group>
                            ) : (
                              <Stack gap="xs" mt="sm" className="focusChoiceActions">
                                <Button
                                  type="button"
                                  variant="light"
                                  onClick={() => applyInterpretiveFocus(focusProposal.focus, 'confirmed')}
                                >
                                  就是这个
                                </Button>
                                <Button
                                  type="button"
                                  variant="light"
                                  color="gray"
                                  onClick={() => applyInterpretiveFocus(focusProposal.alternativeFocus, 'alternative')}
                                >
                                  我更在意：{focusProposal.alternativeFocus}
                                </Button>
                                <Button
                                  type="button"
                                  variant="subtle"
                                  color="gray"
                                  onClick={() => setCustomFocusOpen(true)}
                                >
                                  我自己补充
                                </Button>
                                {customFocusOpen && (
                                  <div className="customFocusEditor">
                                    <Textarea
                                      label="你更希望这副牌围绕什么来读？"
                                      aria-label="补充解读重点"
                                      value={customFocusDraft}
                                      onChange={(event) => setCustomFocusDraft(event.currentTarget.value)}
                                      placeholder="例如：继续留下会付出什么代价"
                                      minRows={2}
                                      maxRows={4}
                                      autosize
                                      maxLength={120}
                                    />
                                    <Group justify="flex-end" gap="xs" mt="xs">
                                      {focusEditing && interpretiveFocus && (
                                        <Button
                                          type="button"
                                          size="compact-sm"
                                          variant="subtle"
                                          color="gray"
                                          onClick={() => {
                                            setFocusEditing(false);
                                            setCustomFocusOpen(false);
                                            setCustomFocusDraft('');
                                          }}
                                        >
                                          取消
                                        </Button>
                                      )}
                                      <Button
                                        type="button"
                                        size="compact-sm"
                                        disabled={!customFocusDraft.trim()}
                                        onClick={() => applyInterpretiveFocus(customFocusDraft, 'custom')}
                                      >
                                        按这个重点继续
                                      </Button>
                                    </Group>
                                  </div>
                                )}
                                {focusEditing && interpretiveFocus && !customFocusOpen && (
                                  <Button
                                    type="button"
                                    size="compact-sm"
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => setFocusEditing(false)}
                                  >
                                    保持原来的重点
                                  </Button>
                                )}
                              </Stack>
                            )}
                          </Paper>
                        )}

                        {interpretiveFocus && !focusProposal && (
                          <Paper withBorder p="sm" mt="sm" className="focusProposalCard">
                            <Text size="sm" fw={800}>
                              当前按「{interpretiveFocus.text}」继续。
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>
                              Miao 没有替你缩小问题，但仍会把牌面提示与现实条件分开。
                            </Text>
                          </Paper>
                        )}

                        {focusStatus === 'error' && (
                          <Alert color="yellow" mt="sm" title="这次没有对齐成功">
                            {focusStreamingPreview && (
                              <Text size="sm" mb={5}>刚才已经听到：{focusStreamingPreview}</Text>
                            )}
                            <Text size="sm">{focusError}</Text>
                            <Group gap="xs" mt="xs">
                              <Button type="button" size="compact-sm" onClick={() => void handleFocusProposal()}>
                                重试
                              </Button>
                              <Button
                                type="button"
                                size="compact-sm"
                                variant="light"
                                color="gray"
                                onClick={() => applyInterpretiveFocus('按原问题整体解读', 'custom')}
                              >
                                按原问题继续
                              </Button>
                            </Group>
                          </Alert>
                        )}
                      </section>
                    )}
                    {conversationTimeline.map((item) => {
                      if (item.kind === 'card') {
                        const { message } = item;
                        const readingCard = reading?.cards.find((card) => getReadingCardKey(card) === message.cardKey);
                        const imageSource = getMiaoContentBundle(
                          message.tarotCardId,
                          reading?.contentPackId || DEFAULT_MIAO_CONTENT_PACK_ID,
                        ).art.generatedImage;
                        return (
                          <div className="aiCardRevealMessage" key={message.id} data-sequence={item.sequence}>
                            <UnstyledButton
                              type="button"
                              className="aiCardRevealZoom"
                              aria-label={`放大查看${readingCard?.miao.miaoName || message.position}喵牌`}
                              onClick={() => onOpenCard(message.tarotCardId)}
                            >
                              <img
                                src={imageSource}
                                alt={readingCard ? `${readingCard.miao.miaoName}喵牌` : `${message.position}喵牌`}
                                className="aiCardRevealThumb"
                              />
                              <span aria-hidden="true"><Eye size={12} /></span>
                            </UnstyledButton>
                            <div className={`aiMessage isAssistant ${message.status === 'streaming' ? 'isLoading' : ''}`}>
                              <Group gap="xs" wrap="nowrap" align="flex-start">
                                {reading && <MiaoGuideAvatar reading={reading} size="sm" />}
                                <div>
                                  <Text size="xs" fw={800} c="violet">
                                    {message.status === 'streaming' ? 'Miao 正在说' : `第 ${cardMessages.indexOf(message) + 1} 张 · ${message.position}`}
                                  </Text>
                                  <Text size="sm" fw={800} mt={4}>
                                    {readingCard
                                      ? `${getCardName(readingCard.drawn.card)} · ${getMiaoOrientationLabel(readingCard.drawn.orientation)}`
                                      : message.position}
                                  </Text>
                                  <Text size="sm" mt={3} className="miaoStreamingText">
                                    {message.result?.reply
                                      || getMiaoReadableContent(message.assistantContent, 'card_reveal')
                                      || '正在把这张牌放回你的问题里……'}
                                    {message.status === 'streaming' && (
                                      <span className="streamingCaret" aria-hidden="true" />
                                    )}
                                  </Text>
                                  {message.status === 'incomplete' && (
                                    <Text size="xs" c="dimmed" mt={5}>回复已保留；格式或连接没有完整收束。</Text>
                                  )}
                                  {message.result?.cardEvidence && (
                                    <details className="cardTrustDetails">
                                      <summary>为什么这样读</summary>
                                      <dl className="cardTrustLayers">
                                        <div>
                                          <dt>牌面给出的提示</dt>
                                          <dd>{message.result.cardEvidence.traditional}</dd>
                                        </div>
                                        <div>
                                          <dt>和你问题的联系</dt>
                                          <dd>{message.result.cardEvidence.context}</dd>
                                        </div>
                                        <div>
                                          <dt>现实中还要核实</dt>
                                          <dd>{message.result.cardEvidence.boundary}</dd>
                                        </div>
                                        <div>
                                          <dt>也可能这样理解</dt>
                                          <dd>{message.result.cardEvidence.alternative}</dd>
                                        </div>
                                      </dl>
                                    </details>
                                  )}
                                </div>
                              </Group>
                            </div>
                          </div>
                        );
                      }

                      const { turn } = item;
                      return (
                        <div className="aiConversationTurn" key={turn.id} data-sequence={item.sequence}>
                          <div className="aiMessage isUser">
                            <Text size="xs" fw={800}>你 · 第 {turns.indexOf(turn) + 1} 轮</Text>
                            <Text size="sm" mt={3}>{turn.userMessage}</Text>
                          </div>
                          <div className={`aiMessage isAssistant ${turn.status === 'streaming' ? 'isLoading' : ''}`}>
                            <Group gap="xs" wrap="nowrap" align="flex-start">
                              {reading && <MiaoGuideAvatar reading={reading} size="sm" />}
                              <div>
                                <Text size="xs" fw={800} c="violet">
                                  {turn.status === 'streaming' ? 'Miao 正在说' : 'Miao 语解读'}
                                </Text>
                                <Text size="xs" fw={800} mt={5}>核心提示</Text>
                                <Text size="sm" mt={2} className="miaoStreamingText">
                                  {turn.result?.reply
                                    || getMiaoReadableContent(turn.assistantContent, 'follow_up')
                                    || '正在沿着这副牌整理……'}
                                  {turn.status === 'streaming' && (
                                    <span className="streamingCaret" aria-hidden="true" />
                                  )}
                                </Text>
                                {turn.status === 'incomplete' && (
                                  <Text size="xs" c="dimmed" mt={5}>
                                    回复已保留；格式或连接没有完整收束。
                                  </Text>
                                )}
                              </div>
                            </Group>
                            {turn.result?.reflectionQuestion && (
                              <Text size="sm" mt="xs" fw={700}>
                                可以想想：{turn.result.reflectionQuestion}
                              </Text>
                            )}
                            {turn.result && turn.result.actions.length > 0 && (
                              <Stack gap={3} mt="xs" className="aiTurnActions">
                                {turn.result.actions.map((action) => (
                                  <Text size="xs" key={action}>下一步：{action}</Text>
                                ))}
                              </Stack>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {conversationReveal && (
                      <ConversationCardReveal
                        animation={conversationReveal}
                        contentPackId={reading?.contentPackId || DEFAULT_MIAO_CONTENT_PACK_ID}
                      />
                    )}
                    {!conversationReveal
                      && cardMessages.length > 0
                      && turns.length === 0
                      && followUpStatus !== 'loading'
                      && (!focusPilot || allRevealedCardsInterpreted) && (
                      <div className="aiMessage isAssistant isIntro">
                        <Text size="sm">
                          可以澄清一张牌、比较两个视角，或把下一步缩小。问题变了，就开始一份新阅读。
                        </Text>
                      </div>
                    )}
                    {!conversationReveal && reading && nextUnrevealedPosition && (
                      <Paper withBorder p="sm" className="aiRevealPrompt" data-testid="ai-reveal-prompt">
                        <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon size={38} radius="md" color="violet" variant="light">
                              <Sparkles size={18} />
                            </ThemeIcon>
                            <div>
                              <Text size="xs" fw={800} c="violet">
                                {reading.cards.length === 0 ? '第一张' : '下一张'} · {nextUnrevealedPosition.label}
                              </Text>
                              <Text size="sm" fw={800} mt={2}>
                                {reading.cards.length === 0 ? '准备好就翻开，不用离开对话' : '沿着刚才的对话继续看'}
                              </Text>
                            </div>
                          </Group>
                          <Button
                            type="button"
                            className="aiRevealNextButton"
                            onClick={handleConversationReveal}
                            disabled={
                              !focusReady
                              || cardRequestStatus === 'streaming'
                              || followUpStatus === 'loading'
                              || status === 'streaming'
                            }
                          >
                            {cardRequestStatus === 'streaming'
                              ? 'Miao 正在读'
                              : reading.cards.length === 0 ? '翻第一张' : '翻下一张'}
                          </Button>
                        </Group>
                      </Paper>
                    )}
                    <div ref={conversationEndRef} />
                  </div>

                  {focusPilot && allRevealedCardsInterpreted && (
                    <>
                      <Paper withBorder p="sm" mt="md" className="readingFeedback">
                        <Text fw={800} size="sm">这次 Miao 抓住你的重点了吗？</Text>
                        <Text size="xs" c="dimmed" mt={3}>
                          只记录这个选择，不记录你的问题或补充内容。
                        </Text>
                        <Group gap="xs" mt="sm" className="readingFeedbackActions">
                          {readingFeedbackOptions.map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              size="compact-sm"
                              variant={readingFeedback === option.value ? 'filled' : 'light'}
                              color={option.value === 'missed' ? 'gray' : 'teal'}
                              aria-pressed={readingFeedback === option.value}
                              onClick={() => handleReadingFeedback(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </Group>
                        {readingFeedback === 'missed' && (
                          <Button
                            type="button"
                            size="compact-xs"
                            variant="subtle"
                            mt="xs"
                            onClick={() => {
                              setFocusEditing(true);
                              setCustomFocusOpen(true);
                              setCustomFocusDraft('');
                              requestAnimationFrame(() => {
                                document.querySelector('.focusNegotiation')?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                              });
                            }}
                          >
                            调整重点，再按新重点解释
                          </Button>
                        )}
                      </Paper>

                      <Paper withBorder p="sm" mt="md" className="responseGoalPicker">
                        <Text fw={800} size="sm">接下来，你想怎么聊？</Text>
                        <Text size="xs" c="dimmed" mt={3}>
                          这是这轮要完成的事，不是给 Miao 换一种性格。
                        </Text>
                        <Stack gap="xs" mt="sm">
                          {responseGoalOptions.map((option) => (
                            <UnstyledButton
                              key={option.value}
                              type="button"
                              className={`responseGoalOption ${responseGoal === option.value ? 'isSelected' : ''}`}
                              aria-pressed={responseGoal === option.value}
                              onClick={() => handleResponseGoal(option.value)}
                            >
                              <span>
                                <strong>{option.label}</strong>
                                <small>{option.description}</small>
                              </span>
                              {responseGoal === option.value && <Check size={17} aria-hidden="true" />}
                            </UnstyledButton>
                          ))}
                        </Stack>
                      </Paper>
                    </>
                  )}

                  {cardMessages.length === 0 ? null : focusPilot && !allRevealedCardsInterpreted ? (
                    <Alert mt="md" color="violet" variant="light">
                      继续翻牌。完整解读结束后，再选择“帮我理清、直接说重点或先听我说完”。
                    </Alert>
                  ) : followUpLimitReached ? (
                    <Alert mt="md" color="violet" variant="light">
                      这次阅读的追问先到这里。先带走一个行动；如果问题已经变化，再开始一副新牌。
                    </Alert>
                  ) : focusPilot && !responseGoal ? null : (
                    <>
                      {turns.length === 0 && responseGoal !== 'listen' && (
                        <div className="aiQuickPrompts" aria-label="快捷追问">
                          <Text size="xs" fw={780} c="dimmed">可以从这里开始</Text>
                          <Group gap="xs" mt={7}>
                            {followUpSuggestions.map((suggestion) => (
                              <Button
                                key={suggestion}
                                type="button"
                                size="compact-sm"
                                variant="light"
                                color="violet"
                                disabled={followUpStatus === 'loading'}
                                onClick={() => {
                                  setFollowUpMessage(suggestion);
                                  setFollowUpError('');
                                  setFollowUpStatus('idle');
                                }}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </Group>
                        </div>
                      )}
                      <form
                        className="aiFollowUpForm"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleFollowUp();
                        }}
                      >
                        <Textarea
                          label={responseGoal === 'listen' ? '你还想补充什么？' : '你的追问'}
                          aria-label={responseGoal === 'listen' ? '你还想补充什么？' : '你的追问'}
                          description={responseGoal === 'listen'
                            ? 'Miao 会先回应你补充的情况，不会急着催你行动。'
                            : '只问当前问题与这副牌；Ctrl/⌘ + Enter 发送'}
                          placeholder={responseGoal === 'listen'
                            ? '把刚才没说完的部分写下来……'
                            : '例如：这周最应该先确认哪件事？'}
                          value={followUpMessage}
                          onChange={(event) => setFollowUpMessage(event.currentTarget.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                              event.preventDefault();
                              void handleFollowUp();
                            }
                          }}
                          maxLength={500}
                          minRows={2}
                          maxRows={5}
                          autosize
                          disabled={followUpStatus === 'loading'}
                        />
                        <Group justify="space-between" align="center" gap="sm" mt="sm">
                          <Text size="xs" c="dimmed">
                            自动保存在当前浏览器 · {followUpMessage.length}/500
                          </Text>
                          <Button
                            type="submit"
                            leftSection={<Send size={15} />}
                            loading={followUpStatus === 'loading'}
                            disabled={!followUpMessage.trim()}
                          >
                            发送追问
                          </Button>
                        </Group>
                        {followUpStatus === 'error' && (
                          <Alert color="red" mt="sm">
                            {followUpError}
                          </Alert>
                        )}
                      </form>
                    </>
                  )}
            </section>
          )}
          {showInternal && result && !structuredResult && status !== 'streaming' && (
            <>
              <Divider my="md" />
              <Title order={3} size="h4" mb="xs">
                原始 Miao 输出
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
  const [homeCompanion] = useState(createHomeCompanion);
  const [sharedReading] = useState<MiaoReading | null>(() => (
    typeof window === 'undefined' ? null : parseReadingShareUrl(window.location.search)
  ));
  const [restoredSession] = useState<StoredReadingSession | null>(() => (
    typeof window === 'undefined' || sharedReading ? null : loadActiveReadingSession()
  ));
  const [restoredReading] = useState<MiaoReading | null>(() => (
    restoredSession ? getSessionReadings(restoredSession).visibleReading : null
  ));
  const initialReading = sharedReading || restoredReading;
  const [question, setQuestion] = useState(initialReading?.question || activeTheme.defaultQuestion);
  const [topic, setTopic] = useState<ReadingTopic>(initialReading?.topic || 'others');
  const [reading, setReading] = useState<MiaoReading | null>(initialReading);
  const [aiEnabled, setAiEnabled] = useState(() => Boolean(
    initialReading && loadLlmConversation(initialReading.id)?.cardMessages.length,
  ));
  const [contentPackId, setContentPackId] = useState<MiaoContentPackId>(
    () => getMiaoContentPack(initialReading?.contentPackId).id as MiaoContentPackId,
  );
  const [activeReadingTab, setActiveReadingTab] = useState(
    aiEnabled && !sharedReading ? 'llm' : 'share',
  );
  const [drawSessionKey, setDrawSessionKey] = useState(0);
  const [history, setHistory] = useState<MiaoReading[]>(() => loadReadingHistory());
  const [siteVisitCount, setSiteVisitCount] = useState<number | null>(null);
  const [productInfoOpen, setProductInfoOpen] = useState(false);
  const [productInfoTab, setProductInfoTab] = useState<ProductInfoTab>('product');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryView, setGalleryView] = useState<GalleryView>('miao');
  const [galleryCardId, setGalleryCardId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSource, setSupportSource] = useState('site');
  const [mobileReadingOpen, setMobileReadingOpen] = useState(() => Boolean(
    sharedReading
    || restoredSession
    || (typeof window !== 'undefined' && window.history.state?.[MOBILE_READING_HISTORY_KEY]),
  ));
  const [drawStage, setDrawStage] = useState<InteractiveDrawStage>('ready');
  const readingDeskRef = useRef<HTMLDivElement | null>(null);
  const drawTableRef = useRef<InteractiveDrawTableHandle | null>(null);
  const mobileReadingScrollTop = useRef(0);
  const autoScrollResultReadingId = useRef<string | null>(sharedReading?.id ?? null);
  const mobileDialogHistorySeeded = useRef(false);
  const mobileDialogOpen = Boolean(isMobileViewport && mobileReadingOpen);
  const readingComplete = Boolean(
    reading && reading.cards.length === reading.spread.positions.length,
  );
  const selectedGalleryCard = useMemo(() => {
    const tarotCard = cards.find((card) => card.id === galleryCardId);
    return tarotCard ? getMiaoCard(tarotCard, contentPackId) : null;
  }, [contentPackId, galleryCardId]);
  useFocusReturn({ opened: mobileDialogOpen });
  const showInternalTabs = useMemo(() => {
    return import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');
  }, []);

  useEffect(() => {
    trackProductPresence();
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(HOME_COMPANION_STORAGE_KEY, homeCompanion.tarotId);
    } catch {
      // A blocked storage API should not affect the homepage experience.
    }
  }, [homeCompanion.tarotId]);

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
    if (!readingComplete) setShareOpen(false);
  }, [readingComplete]);

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

  function openGallery(view: GalleryView = 'miao') {
    setGalleryCardId(null);
    setGalleryView(view);
    setGalleryOpen(true);
  }

  function openProductInfo(tab: ProductInfoTab) {
    setProductInfoTab(tab);
    setProductInfoOpen(true);
  }

  function openGalleryFromProductInfo() {
    setProductInfoOpen(false);
    openGallery('classic');
  }

  function closeGallery() {
    setGalleryCardId(null);
    setGalleryOpen(false);
  }

  function openReadingShare() {
    if (!readingComplete || !reading) return;
    setShareOpen(true);
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

  function handleReadingProgress(next: MiaoReading, session: StoredReadingSession) {
    saveActiveReadingSession(session);
    setReading(next);
    if (aiEnabled) setActiveReadingTab('llm');
  }

  function handleReadingPrepared(next: MiaoReading) {
    if (!aiEnabled) return;
    setReading(next);
    setActiveReadingTab('llm');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('miao-conversation-workspace')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  }

  function handleReadingComplete(
    next: MiaoReading,
    session?: StoredReadingSession,
    source = 'reading-desk',
  ) {
    if (session) saveActiveReadingSession(session);
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
    clearActiveReadingSession();
    handleReadingComplete(next, undefined, 'daily-card');
    trackProductEvent('daily_reading', next.cards[0].drawn.card.id, { readingId: next.id, source: 'daily-card' });
    if (!isMobileViewport) {
      requestAnimationFrame(() => document.getElementById('reading-result')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  function handleContentPackChange(nextPackId: MiaoContentPackId) {
    setContentPackId(nextPackId);
    clearActiveReadingSession();
    setReading(null);
  }

  function handleSessionStart() {
    clearActiveReadingSession();
    setReading(null);
    setActiveReadingTab('share');
  }

  function restartWithQuestion(nextQuestion: string) {
    if (reading) clearLlmConversation(reading.id);
    clearActiveReadingSession();
    setQuestion(nextQuestion);
    setReading(null);
    setActiveReadingTab('share');
    setDrawSessionKey((value) => value + 1);
    requestAnimationFrame(() => {
      document.getElementById('reading-desk')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function keepCardsWithQuestion(nextQuestion: string) {
    if (!reading) return;
    clearLlmConversation(reading.id);
    setQuestion(nextQuestion);
    setReading({ ...reading, question: nextQuestion });
    setActiveReadingTab('llm');
  }

  function openMiaoReading() {
    setAiEnabled(true);
    setActiveReadingTab('llm');
    requestAnimationFrame(() => {
      document.querySelector('.miaoTabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function openReadingCard(cardId: string) {
    setGalleryView('miao');
    setGalleryCardId(cardId);
  }

  function openSupport(source: string) {
    setSupportSource(source);
    setSupportOpen(true);
    trackProductEvent('support_opened', 'default', {
      ...(reading ? { readingId: reading.id } : {}),
      source,
    });
  }

  return (
    <Box className="miaoApp">
      <Drawer
        opened={shareOpen}
        onClose={() => setShareOpen(false)}
        title="分享这次阅读"
        position={isMobileViewport ? 'bottom' : 'right'}
        size={isMobileViewport ? '92dvh' : '38rem'}
        zIndex={1200}
        className="readingShareDrawer"
        overlayProps={{ backgroundOpacity: 0.42, blur: 3 }}
      >
        {aiEnabled && readingComplete && reading && (
          <SharePanel reading={reading} contentPackId={contentPackId} />
        )}
      </Drawer>

      <SupportModal
        opened={supportOpen}
        onClose={() => setSupportOpen(false)}
        onQrSave={() => trackProductEvent('support_qr_saved', 'alipay', {
          ...(reading ? { readingId: reading.id } : {}),
          source: supportSource,
        })}
      />

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
        title="塔罗图鉴"
        size="90rem"
        fullScreen={Boolean(isMobileViewport)}
        scrollAreaComponent={ScrollArea.Autosize}
        className="galleryModal"
      >
        <CardGallery
          contentPackId={contentPackId}
          view={galleryView}
          onViewChange={setGalleryView}
          onCardSelect={(cardId, view) => {
            setGalleryView(view);
            setGalleryCardId(cardId);
          }}
        />
      </Modal>

      <Modal
        opened={Boolean(selectedGalleryCard)}
        onClose={() => setGalleryCardId(null)}
        title="塔罗牌详情"
        size="lg"
        zIndex={1300}
        fullScreen={Boolean(isMobileViewport)}
        className="galleryDetailModal"
      >
        {selectedGalleryCard && (
          <GalleryCardDetail
            card={selectedGalleryCard}
            contentPackId={contentPackId}
            initialView={galleryView}
          />
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
                onClick={() => openSupport('top-mobile')}
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
                onClick={() => openGallery()}
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
                onClick={() => openSupport('top-desktop')}
                aria-haspopup="dialog"
              >
                请猫猫吃罐罐
              </Button>
              <Button variant="white" leftSection={<LibraryBig size={16} />} onClick={() => openGallery()} aria-haspopup="dialog">
                塔罗图鉴
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
                src={homeCompanion.image}
                alt={`${homeCompanion.cardName}猫牌：${homeCompanion.miaoName}`}
                data-testid="mobile-home-companion"
                data-card-id={homeCompanion.tarotId}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <div className="mobileCompanionBubble">“{homeCompanion.bubble}”</div>
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
        <TarotPurpose onStart={openReadingDesk} />
        <TarotPrimer />
      </div>

      <FocusTrap
        active={mobileDialogOpen && !shareOpen && !supportOpen && !selectedGalleryCard}
        innerRef={readingDeskRef}
      >
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
          <Group gap={6} wrap="nowrap" className="mobileReadingChromeActions">
            {aiEnabled && reading && (
              <UnstyledButton
                type="button"
                className="mobileReadingShare"
                onClick={openReadingShare}
                disabled={!readingComplete}
                aria-label={readingComplete ? '分享这次阅读' : '翻完牌后可分享'}
                title={readingComplete ? '分享这次阅读' : '翻完牌后可分享'}
                aria-haspopup="dialog"
              >
                <Share2 size={17} />
                <span>分享</span>
              </UnstyledButton>
            )}
            <UnstyledButton
              className="mobileReadingClose"
              onClick={closeMobileReading}
              aria-label="关闭抽牌"
              data-autofocus
            >
              <X size={20} />
            </UnstyledButton>
          </Group>
        </div>
        <InteractiveDrawTable
          ref={drawTableRef}
          key={drawSessionKey}
          question={question}
          topic={topic}
          quickQuestions={quickQuestions}
          contentPackId={contentPackId}
          onContentPackChange={handleContentPackChange}
          aiEnabled={aiEnabled}
          onAiEnabledChange={setAiEnabled}
          onQuestionChange={setQuestion}
          onTopicChange={setTopic}
          initialSession={drawSessionKey === 0 ? restoredSession : null}
          onReadingPrepared={handleReadingPrepared}
          onReadingProgress={handleReadingProgress}
          onReadingComplete={handleReadingComplete}
          onOpenAi={openMiaoReading}
          onSessionStart={handleSessionStart}
          onStageChange={setDrawStage}
        />

        {readingComplete && reading && !aiEnabled && (
          <div className="completedReading" id="reading-result">
            <ReadingResult
              reading={reading}
              contentPackId={contentPackId}
              onOpenCard={openReadingCard}
            />
          </div>
        )}

        <Tabs
          value={activeReadingTab}
          onChange={(value) => value && setActiveReadingTab(value)}
          mt="lg"
          className="miaoTabs"
          data-has-reading={reading ? 'true' : 'false'}
          data-ai-primary={aiEnabled && reading ? 'true' : 'false'}
        >
          <Tabs.List>
            {!aiEnabled && (
              <Tabs.Tab value="share" leftSection={<Copy size={16} />} disabled={Boolean(reading && !readingComplete)}>
                分享
              </Tabs.Tab>
            )}
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
              Miao 语解读
            </Tabs.Tab>
          </Tabs.List>
          {!aiEnabled && (
            <Tabs.Panel value="share" pt="md">
              <SharePanel reading={readingComplete ? reading : null} contentPackId={contentPackId} />
            </Tabs.Panel>
          )}
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
            <LlmTab
              reading={reading}
              aiEnabled={aiEnabled}
              onEnableAi={() => {
                setAiEnabled(true);
                setActiveReadingTab('llm');
              }}
              onRevealNextCard={() => drawTableRef.current?.revealNextCard() ?? null}
              onOpenShare={openReadingShare}
              onOpenCard={openReadingCard}
              onRestartWithQuestion={restartWithQuestion}
              onKeepCardsWithQuestion={keepCardsWithQuestion}
              showInternal={showInternalTabs}
            />
          </Tabs.Panel>
        </Tabs>

        {readingComplete && reading && aiEnabled && (
          <details className="aiFullReadingDetails" id="reading-result">
            <summary>查看完整牌阵与逐张牌义</summary>
            <div className="completedReading">
              <ReadingResult
                reading={reading}
                contentPackId={contentPackId}
                onOpenCard={openReadingCard}
              />
            </div>
          </details>
        )}

        {readingComplete && <SupportPrompt onOpen={() => openSupport('reading-prompt')} />}

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
              onClick={() => openSupport('footer')}
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
