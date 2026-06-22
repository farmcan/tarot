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
  Grid,
  Group,
  Paper,
  PasswordInput,
  Progress,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  BrainCircuit,
  Cat,
  Check,
  Copy,
  Database,
  Download,
  ExternalLink,
  GitBranch,
  LibraryBig,
  PanelsTopLeft,
  RefreshCcw,
  Send,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import {
  buildMiaoLlmPayload,
  buildMiaoLlmPrompt,
  callMiaoLlmEndpoint,
  parseStructuredLlmResult,
} from './domain/llm';
import {
  createMiaoReading,
  createMiaoSynthesis,
  getMiaoOrientationLabel,
  getTraditionalLine,
  type MiaoReading,
  type MiaoReadingCard,
} from './domain/miaoTarot';
import {
  getCardKeyword,
  getCardName,
  getSpread,
  spreads,
  topicOptions,
  type ReadingTopic,
} from './domain/tarot';
import { getTarotTheme, tarotThemeList, type TarotThemeId } from './domain/themes';
import { createThemedDeckAdapter } from './domain/themeAdapter';
import type { ThemedCard, ThemedReading } from './domain/themedTarot';

const activeTheme = getTarotTheme();
const quickQuestions = activeTheme.quickQuestions;

const sourceRows = [
  {
    name: '@cometpisces/tarot-kit',
    role: 'MIT 牌义与抽牌基础',
    take: '直接 import 78 张牌数据、中文含义、正逆位和 helper，不重复写基础牌库。',
    url: 'https://www.npmjs.com/package/@cometpisces/tarot-kit',
  },
  {
    name: 'MarketingPipeline/Tarot.js',
    role: 'deck / spread / reading 分层',
    take: '参考它的结构思想：牌组、牌阵、解读结果分开管理。',
    url: 'https://github.com/MarketingPipeline/Tarot.js',
  },
  {
    name: 'MiaoTI',
    role: '发布结构与分享气质',
    take: '沿用 site -> v1 的静态发布方式，结果页强调可分享和轻情绪表达。',
    url: 'https://github.com/farmcan/miaoti',
  },
  {
    name: 'Brhiza/mingyu / hhszzzz/taibu',
    role: '结构化提示词 / MCP 思路',
    take: '参考 result + prompt 双输出：先抽牌，再让 LLM 基于结构化 JSON 分析。',
    url: 'https://github.com/Brhiza/mingyu',
  },
];

const miaoDeck = activeTheme.cards;

function iconNode(Icon: typeof Sparkles) {
  return <Icon size={18} strokeWidth={1.8} />;
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

function getShareUrl() {
  if (typeof window === 'undefined') return activeTheme.repositoryUrl;

  const url = new URL('./', window.location.href);
  url.hash = '';
  url.search = '';
  return url.href;
}

function SpreadPicker(props: {
  selected: string;
  onChange: (value: string) => void;
}) {
  const availableSpreads = spreads.filter((spread) => activeTheme.spreadIds.includes(spread.id));

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
      {availableSpreads.map((spread) => {
        const active = spread.id === props.selected;
        return (
          <UnstyledButton
            key={spread.id}
            className={`miaoSpread ${active ? 'isActive' : ''}`}
            onClick={() => props.onChange(spread.id)}
          >
            <Group justify="space-between" align="flex-start" gap="xs">
              <div>
                <Text fw={780} size="sm">
                  {spread.name}
                </Text>
                <Text c="dimmed" size="xs" mt={4}>
                  {spread.positions.length} 张{activeTheme.deckConfig.cardLabel}
                </Text>
              </div>
              <Badge size="sm" color={active ? 'violet' : 'gray'} variant={active ? 'filled' : 'light'}>
                {spread.shortName}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt="xs" lineClamp={2}>
              {spread.description}
            </Text>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
}

function ReadingFlowStatus({ hasQuestion, hasReading }: { hasQuestion: boolean; hasReading: boolean }) {
  const activeIndex = hasReading ? 2 : hasQuestion ? 1 : 0;
  const steps = [
    { label: '写问题', detail: '把状态放上桌' },
    { label: '抽猫牌', detail: '选择牌阵并抽牌' },
    { label: '解读/分享', detail: '复制、分析或回看' },
  ];

  return (
    <div className="readingFlowStatus">
      <Group justify="space-between" align="center" mb="xs">
        <Text fw={780} size="sm">
          Reading flow
        </Text>
        <Text size="xs" c="dimmed">
          {activeIndex + 1} / {steps.length}
        </Text>
      </Group>
      <Progress value={((activeIndex + 1) / steps.length) * 100} color={hasReading ? 'teal' : 'violet'} radius="xl" size="sm" />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs" mt="xs">
        {steps.map((step, index) => (
          <div key={step.label} className={`flowStep ${index <= activeIndex ? 'isActive' : ''}`}>
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </div>
        ))}
      </SimpleGrid>
    </div>
  );
}

function SpreadPositionPreview({ spreadId }: { spreadId: string }) {
  const spread = getSpread(spreadId);

  return (
    <div className="spreadPreview">
      <Group justify="space-between" align="center">
        <Text fw={780} size="sm">
          这组牌在回答什么
        </Text>
        <Badge variant="light" color="gray">
          {spread.shortName}
        </Badge>
      </Group>
      <div className="spreadPreviewGrid">
        {spread.positions.map((position, index) => (
          <div key={position.id} className="spreadPosition">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{position.label}</strong>
            <small>{position.role}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiaoCardArt({ card, large = false }: { card: MiaoReadingCard | { miaoName: string; sigil: string; palette: string; archetype: string }; large?: boolean }) {
  const miao = 'miao' in card ? card.miao : card;

  return (
    <div className={`miaoCardArt palette-${miao.palette} ${large ? 'isLarge' : ''}`}>
      <div className="miaoCardInner">
        <div className="miaoCardSigil">{miao.sigil}</div>
        <div className="catMark" aria-hidden="true">
          <span />
          <span />
          <i />
        </div>
        <div className="miaoCardName">{miao.miaoName}</div>
        <div className="miaoCardArchetype">{miao.archetype}</div>
      </div>
    </div>
  );
}

function DrawnMiaoCard({ item, index }: { item: MiaoReadingCard; index: number }) {
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

        <MiaoCardArt card={item} />

        <div>
          <Title order={3} size="h4">
            {item.miao.miaoName}
          </Title>
          <Text size="xs" c="dimmed" mt={3}>
            {getTraditionalLine(item)}
          </Text>
        </div>

        <Text className="miaoCaption">{item.miao.memeCaption}</Text>
        <Text size="sm" className="miaoMeaning" lineClamp={4}>
          {item.miaoMeaning}
        </Text>
      </Stack>
    </Card>
  );
}

function EmptyReading() {
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
            输入一个问题，选择牌阵，然后抽牌。系统先从大阿尔卡那抽取传统 Tarot，再映射到原创猫 meme 原型。
          </Text>
        </div>
        <SimpleGrid cols={3} spacing="xs">
          <Paper withBorder p="sm">
            <Text fw={800}>22</Text>
            <Text size="xs" c="dimmed">
              猫牌原型
            </Text>
          </Paper>
          <Paper withBorder p="sm">
            <Text fw={800}>Tarot</Text>
            <Text size="xs" c="dimmed">
              语义骨架
            </Text>
          </Paper>
          <Paper withBorder p="sm">
            <Text fw={800}>LLM</Text>
            <Text size="xs" c="dimmed">
              猫语翻译
            </Text>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

function ReadingResult({ reading }: { reading: MiaoReading | null }) {
  const synthesis = useMemo(() => (reading ? createMiaoSynthesis(reading) : null), [reading]);

  if (!reading || !synthesis) return <EmptyReading />;

  const anchor = reading.cards[0];

  return (
    <Stack gap="md">
      <Paper withBorder p="lg" className="resultHeader">
        <Grid gap="lg" align="center">
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <MiaoCardArt card={anchor} large />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 7 }}>
            <Badge color="violet" variant="light">
              {reading.spread.name}
            </Badge>
            <Title order={2} mt="sm" className="resultTitle">
              {synthesis.headline}
            </Title>
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

      <SimpleGrid cols={{ base: 1, sm: 2, lg: Math.min(3, reading.cards.length) }} spacing="md">
        {reading.cards.map((item, index) => (
          <DrawnMiaoCard key={`${reading.id}-${item.drawn.card.id}-${item.position.id}`} item={item} index={index} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

function SharePanel({ reading }: { reading: MiaoReading | null }) {
  const shareText = getShareText(reading);
  const synthesis = reading ? createMiaoSynthesis(reading) : null;
  const mainCard = reading?.cards[0];
  const shareUrl = useMemo(() => getShareUrl(), []);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [exportError, setExportError] = useState('');
  const [exportImage, setExportImage] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

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
      const { toPng } = await import('html-to-image');
      if ('fonts' in document) {
        await document.fonts.ready;
      }

      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `miaotarot-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();

      setExportImage(dataUrl);
      setExportStatus('done');
    } catch (caught) {
      setExportStatus('error');
      setExportError(caught instanceof Error ? caught.message : String(caught));
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
        </div>
        <Group gap="xs">
          <CopyButton value={shareText}>
            {({ copied, copy }) => (
              <Button size="sm" variant="light" leftSection={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy}>
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
            生成分享图
          </Button>
        </Group>
      </Group>

      <div className="shareCard sharePoster" ref={shareCardRef}>
        <div className="shareCardTop">
          <Badge color="dark" variant="filled">
            MiaoTarot
          </Badge>
          <Text size="xs">{activeTheme.localName}</Text>
        </div>
        <Title order={3} className="shareCardTitle">
          {mainCard ? mainCard.miao.miaoName : '今天是哪只猫？'}
        </Title>
        <Text className="shareCardCaption">
          {synthesis?.shareText || activeTheme.shareConcept.replace(`${activeTheme.productName}：`, '')}
        </Text>
        <Divider my="sm" />
        {reading ? (
          <div className="sharePosterCards">
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
            抽一张猫牌后生成你的分享卡。
          </Text>
        )}
        <div className="sharePosterFooter">
          <div>
            <Text size="xs" c="dimmed">
              {activeTheme.shareConcept}
            </Text>
            <Text size="xs" className="sharePosterUrl">
              {shareUrl}
            </Text>
          </div>
          <div className="shareQr" aria-label="MiaoTarot QR code">
            {qrDataUrl ? <img src={qrDataUrl} alt="MiaoTarot QR code" /> : <span>QR</span>}
          </div>
        </div>
      </div>
      <Text mt="sm" size="sm" c={exportStatus === 'error' ? 'red' : 'dimmed'} aria-live="polite">
        {exportStatus === 'loading' && '正在生成分享图。'}
        {exportStatus === 'done' && '分享图已生成。'}
        {exportStatus === 'error' && `生成失败：${exportError}`}
      </Text>
      {exportImage && (
        <div className="shareExportPreview">
          <img src={exportImage} alt="MiaoTarot 分享图预览" />
        </div>
      )}
    </Paper>
  );
}

function DeckTab() {
  return (
    <Stack gap="md">
      <Paper withBorder p="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} size="h3">
              22 张 MiaoTarot 大阿尔卡那
            </Title>
            <Text c="dimmed" size="sm" mt={5}>
              传统 Tarot 语义来自开源牌库；猫牌名称、情绪原型和 meme 文案是本地内容层。
            </Text>
          </div>
          <Badge color="violet" variant="light">
            Major Arcana only
          </Badge>
        </Group>
      </Paper>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {miaoDeck.map((card) => (
          <Card key={card.tarotId} withBorder padding="sm" className="deckCard">
            <MiaoCardArt card={card} />
            <Title order={3} size="h5" mt="sm">
              {card.miaoName}
            </Title>
            <Text size="xs" c="dimmed">
              {card.archetype}
            </Text>
            <Text size="sm" mt="xs" lineClamp={2}>
              {card.memeCaption}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
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
                <Button component="a" href={row.url} target="_blank" rel="noreferrer" size="xs" variant="subtle" rightSection={<ExternalLink size={14} />}>
                  Open
                </Button>
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
    <div className={`miaoCardArt themeCardArt palette-${card.palette}`}>
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

function LlmTab({ reading }: { reading: MiaoReading | null }) {
  const [endpoint, setEndpoint] = useState('/api/readings/analyze');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const prompt = reading ? buildMiaoLlmPrompt(reading) : '';
  const usesProxy = endpoint.trim() === '/api/readings/analyze' || endpoint.trim().endsWith('/api/readings/analyze');
  const structuredResult = result ? parseStructuredLlmResult(result) : null;

  async function handleCall() {
    if (!reading || !endpoint.trim()) return;

    setStatus('loading');
    setResult('');
    setError('');

    try {
      const output = await callMiaoLlmEndpoint({ endpoint: endpoint.trim(), apiKey: apiKey.trim(), model: model.trim() }, reading);
      setResult(output);
      setStatus('done');
    } catch (caught) {
      setStatus('error');
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper withBorder p="lg">
          <Stack gap="md">
            <Title order={2} size="h3">
              LLM 猫语分析
            </Title>
            <Text c="dimmed" size="sm">
              默认走本站代理；本地实验也可以换成 OpenAI-compatible endpoint。
            </Text>
            <TextInput label="Endpoint" placeholder="/api/readings/analyze" value={endpoint} onChange={(event) => setEndpoint(event.currentTarget.value)} />
            <TextInput label="Model" value={model} disabled={usesProxy} onChange={(event) => setModel(event.currentTarget.value)} />
            <PasswordInput label="API key" placeholder={usesProxy ? 'server-side only' : 'optional'} disabled={usesProxy} value={apiKey} onChange={(event) => setApiKey(event.currentTarget.value)} />
            <Button leftSection={<Send size={16} />} disabled={!reading || !endpoint.trim()} loading={status === 'loading'} onClick={handleCall}>
              调用 LLM
            </Button>
            {status === 'error' && <Alert color="red">{error}</Alert>}
          </Stack>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="sm">
            <Title order={2} size="h3">
              Prompt
            </Title>
            {prompt && (
              <CopyButton value={prompt}>
                {({ copied, copy }) => (
                  <Button size="xs" variant="light" leftSection={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copy}>
                    {copied ? '已复制' : '复制 Prompt'}
                  </Button>
                )}
              </CopyButton>
            )}
          </Group>
          <Textarea value={prompt || '先完成一次抽牌。'} minRows={13} autosize readOnly className="promptText" />
          {structuredResult && (
            <>
              <Divider my="md" />
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
                LLM Result
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
  const [question, setQuestion] = useState(activeTheme.defaultQuestion);
  const [topic, setTopic] = useState<ReadingTopic>('others');
  const [spreadId, setSpreadId] = useState('three-card');
  const [reading, setReading] = useState<MiaoReading | null>(null);
  const [history, setHistory] = useState<MiaoReading[]>([]);
  const activeSpread = getSpread(spreadId);

  function handleDraw() {
    const next = createMiaoReading({ question, topic, spreadId });
    setReading(next);
    setHistory((items) => [next, ...items].slice(0, 5));
  }

  return (
    <Box className="miaoApp">
      <section className="heroSection">
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
            <Group gap="xs">
              <Button component="a" href={activeTheme.repositoryUrl} target="_blank" rel="noreferrer" variant="white" leftSection={<GitBranch size={16} />}>
                GitHub
              </Button>
              <Button component="a" href={activeTheme.researchUrl} target="_blank" rel="noreferrer" variant="subtle" color="dark">
                Research
              </Button>
            </Group>
          </Group>

          <div className="heroCopy">
            <Badge color="violet" variant="filled" size="lg">
              {activeTheme.localName} · {activeTheme.universe}
            </Badge>
            <Title className="heroTitle">
              {activeTheme.tagline.split('，')[0]}，
              <br />
              {activeTheme.tagline.split('，').slice(1).join('，')}
            </Title>
            <Text className="heroLead">
              {activeTheme.description}
            </Text>
            <Group mt="lg">
              <Button size="lg" leftSection={<Sparkles size={18} />} onClick={() => document.getElementById('reading-desk')?.scrollIntoView({ behavior: 'smooth' })}>
                开始抽猫牌
              </Button>
              <CopyButton value={activeTheme.shareConcept}>
                {({ copied, copy }) => (
                  <Button size="lg" variant="white" leftSection={copied ? <Check size={18} /> : <Copy size={18} />} onClick={copy}>
                    {copied ? '已复制' : '复制概念'}
                  </Button>
                )}
              </CopyButton>
            </Group>
          </div>
        </Container>
      </section>

      <Container size="xl" py="xl" id="reading-desk">
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Paper withBorder p="lg" className="controlPanel">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Title order={2} size="h3">
                      抽牌台
                    </Title>
                    <Text c="dimmed" size="sm">
                      当前：{activeSpread.name} · {activeSpread.positions.length} 张猫牌
                    </Text>
                  </div>
                  <Badge color="teal" variant="light">
                    Major Arcana
                  </Badge>
                </Group>

                <ReadingFlowStatus hasQuestion={question.trim().length > 0} hasReading={Boolean(reading)} />

                <Textarea label="今天想问什么？" value={question} onChange={(event) => setQuestion(event.currentTarget.value)} minRows={3} autosize />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                  {quickQuestions.map((item) => (
                    <Button key={item} variant="light" size="xs" onClick={() => setQuestion(item)}>
                      {item}
                    </Button>
                  ))}
                </SimpleGrid>

                <Select
                  label="主题"
                  data={topicOptions.map((option) => ({ value: option.value, label: option.label }))}
                  value={topic}
                  onChange={(value) => setTopic((value as ReadingTopic | null) ?? 'others')}
                  allowDeselect={false}
                />

                <div>
                  <Text fw={700} size="sm" mb="xs">
                    牌阵
                  </Text>
                  <SpreadPicker selected={spreadId} onChange={setSpreadId} />
                  <SpreadPositionPreview spreadId={spreadId} />
                </div>

                <Group>
                  <Button leftSection={<Sparkles size={16} />} onClick={handleDraw}>
                    抽一组猫牌
                  </Button>
                  <Button variant="light" leftSection={<RefreshCcw size={16} />} onClick={() => setReading(null)}>
                    清空
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <ReadingResult reading={reading} />
          </Grid.Col>
        </Grid>

        <Tabs defaultValue="share" mt="lg" className="miaoTabs">
          <Tabs.List>
            <Tabs.Tab value="share" leftSection={<Copy size={16} />}>
              分享
            </Tabs.Tab>
            <Tabs.Tab value="deck" leftSection={<Cat size={16} />}>
              猫牌库
            </Tabs.Tab>
            <Tabs.Tab value="research" leftSection={<LibraryBig size={16} />}>
              调研依据
            </Tabs.Tab>
            <Tabs.Tab value="themes" leftSection={<PanelsTopLeft size={16} />}>
              主题实验室
            </Tabs.Tab>
            <Tabs.Tab value="data" leftSection={<Database size={16} />}>
              数据
            </Tabs.Tab>
            <Tabs.Tab value="llm" leftSection={<BrainCircuit size={16} />}>
              LLM
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="share" pt="md">
            <SharePanel reading={reading} />
          </Tabs.Panel>
          <Tabs.Panel value="deck" pt="md">
            <DeckTab />
          </Tabs.Panel>
          <Tabs.Panel value="research" pt="md">
            <ResearchTab />
          </Tabs.Panel>
          <Tabs.Panel value="themes" pt="md">
            <ThemeLabTab />
          </Tabs.Panel>
          <Tabs.Panel value="data" pt="md">
            <DataTab reading={reading} />
          </Tabs.Panel>
          <Tabs.Panel value="llm" pt="md">
            <LlmTab reading={reading} />
          </Tabs.Panel>
        </Tabs>

        <Paper withBorder p="lg" mt="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} size="h3">
                最近出现的猫
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                本地临时历史，刷新后清空。后续可以接 MiaoTI 式分享长图和永久记录。
              </Text>
            </div>
            <Badge variant="light">{history.length} readings</Badge>
          </Group>
          {history.length > 0 && (
            <Stack gap="xs" mt="md">
              {history.map((item) => (
                <UnstyledButton key={item.id} className="historyItem" onClick={() => setReading(item)}>
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

        <Group justify="space-between" mt="xl" className="footer">
          <Text size="sm" c="dimmed">
            Built with Mantine, React, Vite, @cometpisces/tarot-kit, and an original generated hero asset.
          </Text>
          <Anchor href={activeTheme.implementationPlanUrl} target="_blank" size="sm">
            Implementation plan
          </Anchor>
        </Group>
      </Container>
    </Box>
  );
}
