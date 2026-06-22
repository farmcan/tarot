import { useMemo, useState } from 'react';
import {
  ActionIcon,
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
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  BookOpen,
  BrainCircuit,
  Check,
  Copy,
  Database,
  ExternalLink,
  FileJson,
  GitBranch,
  Layers,
  LibraryBig,
  RotateCcw,
  Send,
  Shuffle,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import {
  createLocalSynthesis,
  createReading,
  getCardKeyword,
  getCardName,
  getOrientationLabel,
  getSpread,
  getSuitLabel,
  spreads,
  topicOptions,
  type Reading,
  type ReadingTopic,
} from './domain/tarot';
import { buildLlmPayload, buildLlmPrompt, callLlmEndpoint } from './domain/llm';

const sourceRows = [
  {
    name: 'ekelen/tarot-api',
    role: 'REST API / 78 张牌数据',
    take: 'API 形态值得参考：all cards、single card、search、random draw。',
    url: 'https://github.com/ekelen/tarot-api',
  },
  {
    name: '@cometpisces/tarot-kit',
    role: 'MIT 数据包 / 抽牌工具',
    take: '本项目直接 import：牌组、正逆位、中文牌义、抽牌 helper。',
    url: 'https://www.npmjs.com/package/@cometpisces/tarot-kit',
  },
  {
    name: 'MarketingPipeline/Tarot.js',
    role: 'deck + spread JS library',
    take: '参考它的 deck/spread/reading 分层，不重复写一套散乱状态。',
    url: 'https://github.com/MarketingPipeline/Tarot.js',
  },
  {
    name: 'dreamhunter2333/chatgpt-tarot-divination',
    role: 'AI 占卜产品',
    take: '参考流式 AI、历史记录、多占卜入口，但不复制未确认部分。',
    url: 'https://github.com/dreamhunter2333/chatgpt-tarot-divination',
  },
  {
    name: 'Brhiza/mingyu / hhszzzz/taibu',
    role: '结构化提示词 / MCP',
    take: '参考 result + prompt 的双输出，后续能接 API 或 MCP。',
    url: 'https://github.com/Brhiza/mingyu',
  },
];

const dataModelSample = `interface Card {
  id: string
  name: LocalizedText
  arcana: 'major' | 'minor'
  suit: 'wands' | 'cups' | 'swords' | 'pentacles' | null
  meaning: { upright: LocalizedText; reversed: LocalizedText }
  readingAspects: Record<Aspect, OrientationMeaning>
  contextualMeanings: Record<Topic, OrientationMeaning>
}

interface Spread {
  id: string
  positions: Array<{ id: string; label: string; aspect: Aspect }>
}

interface Reading {
  question: string
  topic: Topic
  spread: Spread
  cards: Array<{ card: Card; orientation: 'upright' | 'reversed'; position: Position }>
}`;

function iconNode(Icon: typeof Sparkles) {
  return <Icon size={18} strokeWidth={1.8} />;
}

function SpreadPicker(props: {
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
      {spreads.map((spread) => {
        const active = spread.id === props.selected;
        return (
          <UnstyledButton
            key={spread.id}
            className={`spreadButton ${active ? 'isActive' : ''}`}
            onClick={() => props.onChange(spread.id)}
          >
            <Group justify="space-between" align="flex-start" gap="xs">
              <div>
                <Text fw={760} size="sm">
                  {spread.name}
                </Text>
                <Text c="dimmed" size="xs" mt={4}>
                  {spread.positions.length} 张牌
                </Text>
              </div>
              <Badge size="sm" variant={active ? 'filled' : 'light'}>
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

function ReadingCardView({ item, index }: { item: Reading['cards'][number]; index: number }) {
  const orientation = getOrientationLabel(item.drawn);

  return (
    <Card withBorder padding="md" className="tarotCard">
      <Stack gap="xs" h="100%">
        <Group justify="space-between" align="flex-start" gap="xs">
          <Badge variant="light" color="gray">
            {String(index + 1).padStart(2, '0')} / {item.position.label}
          </Badge>
          <Badge color={item.drawn.orientation === 'upright' ? 'teal' : 'orange'} variant="light">
            {orientation}
          </Badge>
        </Group>

        <Box className="cardFace" aria-hidden="true">
          <div className="cardGlyph">{getCardKeyword(item.drawn.card).slice(0, 2)}</div>
          <div className="cardLines" />
        </Box>

        <div>
          <Text fw={800} className="cardTitle">
            {getCardName(item.drawn.card)}
          </Text>
          <Text size="xs" c="dimmed">
            {getSuitLabel(item.drawn.card)} · {getCardKeyword(item.drawn.card)}
          </Text>
        </div>

        <Text size="sm" className="cardMeaning" lineClamp={4}>
          {item.positionMeaning || item.generalMeaning}
        </Text>
      </Stack>
    </Card>
  );
}

function ReadingResult({ reading }: { reading: Reading | null }) {
  const synthesis = useMemo(() => (reading ? createLocalSynthesis(reading) : null), [reading]);

  if (!reading || !synthesis) {
    return (
      <Paper withBorder p="lg" className="emptyPanel">
        <Stack gap="md">
          <ThemeIcon variant="light" size={42} radius="sm">
            {iconNode(Sparkles)}
          </ThemeIcon>
          <div>
            <Title order={2} size="h3">
              Tarot reading desk
            </Title>
            <Text c="dimmed" mt={6}>
              选择牌阵后抽牌。数据来自现有开源包，交互用 Mantine 组件搭建，分析层会生成 LLM 可直接消费的结构化输入。
            </Text>
          </div>
          <SimpleGrid cols={3} spacing="xs">
            <Paper withBorder p="sm">
              <Text fw={760}>78</Text>
              <Text size="xs" c="dimmed">
                card dataset
              </Text>
            </Paper>
            <Paper withBorder p="sm">
              <Text fw={760}>5</Text>
              <Text size="xs" c="dimmed">
                spreads
              </Text>
            </Paper>
            <Paper withBorder p="sm">
              <Text fw={760}>LLM</Text>
              <Text size="xs" c="dimmed">
                payload ready
              </Text>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder p="lg">
        <Group justify="space-between" align="flex-start" gap="md">
          <div>
            <Badge variant="light" color="violet">
              {reading.spread.name}
            </Badge>
            <Title order={2} size="h3" mt="xs">
              {synthesis.headline}
            </Title>
          </div>
          <Badge color="gray" variant="outline">
            {new Date(reading.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Badge>
        </Group>
        <Text c="dimmed" mt="sm">
          {synthesis.summary}
        </Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: Math.min(3, reading.cards.length) }} spacing="md">
        {reading.cards.map((item, index) => (
          <ReadingCardView key={`${reading.id}-${item.drawn.card.id}-${item.position.id}`} item={item} index={index} />
        ))}
      </SimpleGrid>

      <Alert color="teal" variant="light" icon={iconNode(WandSparkles)}>
        <Text fw={760} mb={4}>
          本地合成建议
        </Text>
        <Text size="sm">{synthesis.advice}</Text>
      </Alert>
    </Stack>
  );
}

function ResearchTab() {
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <Paper withBorder p="lg">
          <Group gap="sm">
            <ThemeIcon color="violet" variant="light">{iconNode(LibraryBig)}</ThemeIcon>
            <Text fw={780}>内容层</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="sm">
            不复制散落 JSON，优先采用 MIT 数据包，再把牌阵和 LLM payload 放在本地领域层。
          </Text>
        </Paper>
        <Paper withBorder p="lg">
          <Group gap="sm">
            <ThemeIcon color="teal" variant="light">{iconNode(Layers)}</ThemeIcon>
            <Text fw={780}>交互层</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="sm">
            参考 Tarot.js 的 deck/spread/reading 分层，页面先是抽牌工具，不做空泛 landing。
          </Text>
        </Paper>
        <Paper withBorder p="lg">
          <Group gap="sm">
            <ThemeIcon color="orange" variant="light">{iconNode(BrainCircuit)}</ThemeIcon>
            <Text fw={780}>分析层</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="sm">
            牌面数据先转成 JSON，再交给 LLM，避免模型凭空抽牌或丢失牌位关系。
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} size="h3">
            GitHub / NPM reference map
          </Title>
          <Badge variant="light">research driven</Badge>
        </Group>
        <Table.ScrollContainer minWidth={720}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Source</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Use</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sourceRows.map((row) => (
                <Table.Tr key={row.name}>
                  <Table.Td fw={700}>{row.name}</Table.Td>
                  <Table.Td>{row.role}</Table.Td>
                  <Table.Td c="dimmed">{row.take}</Table.Td>
                  <Table.Td>
                    <Tooltip label="Open source">
                      <ActionIcon component="a" href={row.url} target="_blank" rel="noreferrer" variant="subtle">
                        <ExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  );
}

function DataTab({ reading }: { reading: Reading | null }) {
  const payload = reading ? buildLlmPayload(reading) : null;

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper withBorder p="lg" h="100%">
          <Group gap="sm">
            <ThemeIcon color="indigo" variant="light">{iconNode(Database)}</ThemeIcon>
            <Title order={2} size="h3">
              数据结构
            </Title>
          </Group>
          <Text c="dimmed" size="sm" mt="sm">
            `@cometpisces/tarot-kit` 提供 Card 和 DrawnCard；本地只补 Spread、Reading、LLM Payload。
          </Text>
          <Divider my="md" />
          <pre className="codeBlock">{dataModelSample}</pre>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper withBorder p="lg" h="100%">
          <Group justify="space-between" mb="sm">
            <Group gap="sm">
              <ThemeIcon color="teal" variant="light">{iconNode(FileJson)}</ThemeIcon>
              <Title order={2} size="h3">
                当前 LLM Payload
              </Title>
            </Group>
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

function LlmTab({ reading }: { reading: Reading | null }) {
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const prompt = reading ? buildLlmPrompt(reading) : '';

  async function handleCall() {
    if (!reading || !endpoint.trim()) return;

    setStatus('loading');
    setError('');
    setResult('');

    try {
      const output = await callLlmEndpoint({ endpoint: endpoint.trim(), apiKey: apiKey.trim(), model: model.trim() }, reading);
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
            <Group gap="sm">
              <ThemeIcon color="violet" variant="light">{iconNode(BrainCircuit)}</ThemeIcon>
              <Title order={2} size="h3">
                LLM 调用
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              使用 OpenAI-compatible chat endpoint。公开部署时请走后端代理，不要把生产 key 放在浏览器里。
            </Text>
            <TextInput
              label="Endpoint"
              placeholder="https://your-proxy.example.com/v1/chat/completions"
              value={endpoint}
              onChange={(event) => setEndpoint(event.currentTarget.value)}
            />
            <TextInput label="Model" value={model} onChange={(event) => setModel(event.currentTarget.value)} />
            <PasswordInput
              label="API key"
              placeholder="optional"
              value={apiKey}
              onChange={(event) => setApiKey(event.currentTarget.value)}
            />
            <Button
              leftSection={<Send size={16} />}
              onClick={handleCall}
              disabled={!reading || !endpoint.trim()}
              loading={status === 'loading'}
            >
              调用 LLM 分析
            </Button>
            {status === 'error' && (
              <Alert color="red" variant="light">
                <Text size="sm">{error}</Text>
              </Alert>
            )}
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
          <Textarea value={prompt || '先完成一次抽牌。'} minRows={12} autosize readOnly className="promptText" />
          {result && (
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
  const [question, setQuestion] = useState('我现在最应该看清楚什么？');
  const [topic, setTopic] = useState<ReadingTopic>('others');
  const [spreadId, setSpreadId] = useState('three-card');
  const [reading, setReading] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const activeSpread = getSpread(spreadId);

  function handleDraw() {
    const next = createReading({ question, topic, spreadId });
    setReading(next);
    setHistory((items) => [next, ...items].slice(0, 5));
  }

  function handleReset() {
    setReading(null);
  }

  return (
    <Box className="appShell">
      <Container size="xl" py="lg">
        <Group justify="space-between" align="center" className="topNav">
          <Group gap="sm">
            <ThemeIcon size={38} radius="sm" color="violet" variant="filled">
              <Sparkles size={20} />
            </ThemeIcon>
            <div>
              <Title order={1} className="brandTitle">
                Tarot Research
              </Title>
              <Text size="sm" c="dimmed">
                GitHub 调研驱动的塔罗网站原型
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button
              component="a"
              href="https://github.com/farmcan/tarot"
              target="_blank"
              rel="noreferrer"
              variant="light"
              leftSection={<GitBranch size={16} />}
            >
              GitHub
            </Button>
            <Button
              component="a"
              href="https://github.com/farmcan/tarot/blob/main/docs/github-tarot-research.md"
              variant="subtle"
              leftSection={<BookOpen size={16} />}
            >
              Docs
            </Button>
          </Group>
        </Group>

        <Grid gap="lg" mt="lg">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Paper withBorder p="lg" className="controlPanel">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Title order={2} size="h3">
                      Reading setup
                    </Title>
                    <Text size="sm" c="dimmed">
                      当前牌阵：{activeSpread.name} · {activeSpread.positions.length} 张
                    </Text>
                  </div>
                  <Badge variant="light" color="teal">
                    Mantine UI
                  </Badge>
                </Group>

                <Textarea
                  label="问题"
                  value={question}
                  onChange={(event) => setQuestion(event.currentTarget.value)}
                  autosize
                  minRows={3}
                  maxRows={6}
                />

                <Select
                  label="主题"
                  data={topicOptions.map((option) => ({ value: option.value, label: option.label }))}
                  value={topic}
                  onChange={(value) => setTopic((value as ReadingTopic | null) ?? 'others')}
                  allowDeselect={false}
                />

                <div>
                  <Group justify="space-between" mb="xs">
                    <Text fw={700} size="sm">
                      牌阵
                    </Text>
                    <SegmentedControl
                      size="xs"
                      value={spreadId === 'celtic-cross' ? 'deep' : 'quick'}
                      onChange={(value) => {
                        if (value === 'quick') setSpreadId('three-card');
                        if (value === 'deep') setSpreadId('celtic-cross');
                      }}
                      data={[
                        { label: 'Quick', value: 'quick' },
                        { label: 'Deep', value: 'deep' },
                      ]}
                    />
                  </Group>
                  <SpreadPicker selected={spreadId} onChange={setSpreadId} />
                </div>

                <Group>
                  <Button leftSection={<Shuffle size={16} />} onClick={handleDraw}>
                    抽牌
                  </Button>
                  <Button variant="light" leftSection={<RotateCcw size={16} />} onClick={handleReset}>
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

        <Tabs defaultValue="research" mt="lg" className="researchTabs">
          <Tabs.List>
            <Tabs.Tab value="research" leftSection={<LibraryBig size={16} />}>
              调研摘要
            </Tabs.Tab>
            <Tabs.Tab value="data" leftSection={<Database size={16} />}>
              数据结构
            </Tabs.Tab>
            <Tabs.Tab value="llm" leftSection={<BrainCircuit size={16} />}>
              LLM
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<Layers size={16} />}>
              History
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="research" pt="md">
            <ResearchTab />
          </Tabs.Panel>
          <Tabs.Panel value="data" pt="md">
            <DataTab reading={reading} />
          </Tabs.Panel>
          <Tabs.Panel value="llm" pt="md">
            <LlmTab reading={reading} />
          </Tabs.Panel>
          <Tabs.Panel value="history" pt="md">
            <Paper withBorder p="lg">
              <Group gap="sm" mb="md">
                <ThemeIcon color="gray" variant="light">{iconNode(Layers)}</ThemeIcon>
                <Title order={2} size="h3">
                  最近抽牌
                </Title>
              </Group>
              {history.length === 0 ? (
                <Text c="dimmed">还没有记录。</Text>
              ) : (
                <Stack gap="xs">
                  {history.map((item) => (
                    <UnstyledButton key={item.id} className="historyItem" onClick={() => setReading(item)}>
                      <Group justify="space-between" gap="md">
                        <div>
                          <Text fw={760}>{item.question || '开放问题'}</Text>
                          <Text size="xs" c="dimmed">
                            {item.spread.name} · {item.cards.map((card) => getCardName(card.drawn.card)).join(' / ')}
                          </Text>
                        </div>
                        <Badge variant="light">{item.cards.length} cards</Badge>
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              )}
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <Group justify="space-between" mt="xl" className="footer">
          <Text size="sm" c="dimmed">
            Built with Mantine, React, Vite and @cometpisces/tarot-kit.
          </Text>
          <Anchor href="https://github.com/farmcan/tarot/blob/main/docs/github-tarot-research.md" size="sm">
            Research notes
          </Anchor>
        </Group>
      </Container>
    </Box>
  );
}
