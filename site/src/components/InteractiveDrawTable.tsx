import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import {
  ArrowLeftRight,
  Cat,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  createMiaoReadingFromDrawn,
  getMiaoReadingAnchor,
  getMiaoOrientationLabel,
  type MiaoReading,
} from '../domain/miaoTarot';
import { getMiaoContentBundle } from '../domain/miaoContent';
import {
  getMiaoContentPack,
  getMiaoContentPackFrame,
  miaoContentPacks,
  type MiaoContentPackId,
} from '../domain/miaoContentPacks';
import { getCardBackSkin } from '../domain/cardBacks';
import { trackProductEvent } from '../domain/productAnalytics';
import { TarotCardFrame } from './TarotCardFrame';
import { playCardFlipSound, playShuffleSound } from '../domain/shuffleSound';
import {
  createInitialDrawState,
  createCutPiles,
  createInteractiveDeck,
  getInteractiveDrawMode,
  getSelectedDrawnCards,
  interactiveDrawModes,
  interactiveDrawReducer,
  type CardBackTheme,
  type CutPileIndex,
  type InteractiveDeckCard,
  type InteractiveDrawMode,
  type InteractiveDrawStage,
} from '../domain/interactiveDraw';
import {
  getCardKeyword,
  getCardMeaningZhHans,
  getCardName,
  getCardOrdinalLabel,
  getPositionMeaning,
  getSpread,
  getTopicMeaning,
  topicOptions,
  type ReadingTopic,
  type SpreadPosition,
} from '../domain/tarot';

const stageCopy = {
  ready: ['01', '先说说你想看清的事'],
  shuffling: ['02', '猫牌正在重新排队'],
  cutting: ['03', '凭第一眼选一叠'],
  selecting: ['04', '在这一叠里亲手选'],
  placed: ['05', '逐张点击，翻开猫牌'],
  complete: ['06', '猫猫已经把话说完了'],
} as const;

interface InteractiveDrawTableProps {
  question: string;
  topic: ReadingTopic;
  quickQuestions: readonly string[];
  onQuestionChange: (value: string) => void;
  onTopicChange: (value: ReadingTopic) => void;
  contentPackId: MiaoContentPackId;
  onContentPackChange: (value: MiaoContentPackId) => void;
  onReadingComplete: (reading: MiaoReading) => void;
  onSessionStart: () => void;
  onStageChange?: (stage: InteractiveDrawStage) => void;
}

function CardBack({ theme, compact = false }: { theme: CardBackTheme; compact?: boolean }) {
  const skin = getCardBackSkin(theme);

  return (
    <div className={`interactiveCardBack back-${theme} ${compact ? 'isCompact' : ''}`} aria-hidden="true">
      <img src={skin.image} alt="" draggable={false} />
    </div>
  );
}

function ShuffleStack({ theme, onComplete }: { theme: CardBackTheme; onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const stack = Array.from({ length: 12 }, (_, index) => index);
  const sparks = Array.from({ length: 8 }, (_, index) => index);

  return (
    <div className="shuffleStage" role="status" aria-live="polite">
      <motion.div
        className="shuffleAura"
        aria-hidden="true"
        animate={reduceMotion ? { opacity: 0.4 } : { scale: [0.82, 1.16, 0.94], opacity: [0, 0.72, 0] }}
        transition={{ duration: reduceMotion ? 0.3 : 1.48, ease: 'easeInOut' }}
      />
      <div className="shuffleStack" aria-hidden="true">
        <motion.div
          className="shuffleTableShadow"
          animate={reduceMotion ? { opacity: 0.22 } : { scaleX: [0.76, 1.42, 0.82], opacity: [0.18, 0.38, 0.2] }}
          transition={{ duration: reduceMotion ? 0.3 : 1.42, ease: 'easeInOut' }}
        />
        {sparks.map((index) => {
          const angle = (Math.PI * 2 * index) / sparks.length;
          return (
            <motion.span
              key={`spark-${index}`}
              className="shuffleSpark"
              style={{ left: '50%', top: '47%' }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={reduceMotion ? { opacity: 0 } : {
                x: [0, Math.cos(angle) * (90 + index * 3)],
                y: [0, Math.sin(angle) * (72 + index * 2)],
                scale: [0, 1, 0],
                opacity: [0, 0.9, 0],
              }}
              transition={{ duration: 0.72, delay: 0.76 + index * 0.025, ease: 'easeOut' }}
            />
          );
        })}
        {stack.map((index) => {
          const direction = index % 2 === 0 ? 1 : -1;
          const depth = index - (stack.length - 1) / 2;
          return (
            <motion.div
              key={index}
              className="shuffleStackCard"
              initial={{ x: 0, y: index * -1.05, rotate: depth * 0.7, opacity: 0.88 }}
              animate={reduceMotion
                ? { opacity: [0.88, 1], y: [index * -1.05, index * -0.7] }
                : {
                  x: [0, direction * (70 + index * 2.8), direction * (82 + index * 2), direction * -14, 0],
                  y: [index * -1.05, -14 - index * 0.7, -26 + (index % 3) * 7, 8 - index * 0.6, index * -0.72],
                  rotate: [depth * 0.7, direction * (8 + index * 0.7), direction * -7, direction * 2, depth * 0.34],
                  rotateY: [0, direction * 18, direction * -10, direction * 4, 0],
                  scale: [1, 1.025, 0.985, 1.015, 1],
                }}
              transition={{
                duration: reduceMotion ? 0.28 : 1.26,
                delay: reduceMotion ? 0 : index * 0.026,
                times: reduceMotion ? undefined : [0, 0.24, 0.52, 0.78, 1],
                ease: reduceMotion ? 'easeOut' : [0.22, 0.8, 0.24, 1],
              }}
              onAnimationComplete={index === stack.length - 1 ? onComplete : undefined}
            >
              <CardBack theme={theme} />
            </motion.div>
          );
        })}
      </div>
      <Title order={3} size="h4" mt="lg">
        正在洗猫
      </Title>
      <Text size="sm" c="dimmed" mt={4}>
        牌序和正逆位正在这一刻固定。
      </Text>
      <div className="shufflePhases" aria-hidden="true">
        {['切牌', '交错', '收束'].map((label, index) => (
          <motion.span
            key={label}
            initial={{ opacity: 0.28 }}
            animate={{ opacity: [0.28, 1, 0.46] }}
            transition={{ duration: reduceMotion ? 0.28 : 0.52, delay: reduceMotion ? 0 : index * 0.38 }}
          >
            <i />{label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

const cutPileLabels = ['左边', '中间', '右边'] as const;

function CutPile(props: {
  index: CutPileIndex;
  count: number;
  theme: CardBackTheme;
  onChoose: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      className="cutPileButton"
      aria-label={`选择${cutPileLabels[props.index]}牌堆，共 ${props.count} 张`}
      onClick={props.onChoose}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 34, rotate: (props.index - 1) * 5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={reduceMotion
        ? { duration: 0.15 }
        : { delay: props.index * 0.1, type: 'spring', stiffness: 220, damping: 20 }}
      whileHover={{ y: -8, scale: 1.025 }}
      whileTap={{ y: 2, scale: 0.96 }}
    >
      <span className="cutPileStack" aria-hidden="true">
        {[0, 1, 2, 3].map((layer) => (
          <span key={layer} className={`cutPileLayer cutPileLayer-${layer}`}>
            <CardBack theme={props.theme} compact />
          </span>
        ))}
      </span>
    </motion.button>
  );
}

function HiddenDeckCard(props: {
  index: number;
  selectedOrder: number;
  theme: CardBackTheme;
  disabled: boolean;
  onToggle: () => void;
}) {
  const selected = props.selectedOrder >= 0;
  const restingRotation = ((props.index % 5) - 2) * 0.32;

  return (
    <motion.button
      type="button"
      className={`hiddenDeckCard ${selected ? 'isSelected' : ''}`}
      aria-label={`第 ${props.index + 1} 张背面猫牌${selected ? `，已选为第 ${props.selectedOrder + 1} 张` : ''}`}
      aria-pressed={selected}
      disabled={props.disabled && !selected}
      onClick={props.onToggle}
      initial={{ opacity: 0, y: 18, rotate: props.index % 2 === 0 ? -1.5 : 1.5 }}
      animate={{ opacity: 1, y: selected ? -8 : 0, rotate: selected ? 0 : restingRotation }}
      transition={{ delay: Math.min(props.index * 0.018, 0.28), type: 'spring', stiffness: 320, damping: 25 }}
      whileHover={{ y: selected ? -10 : -5, rotate: 0, zIndex: 3 }}
      whileTap={{ scale: 0.96 }}
    >
      <CardBack theme={props.theme} compact />
      {selected && <span className="selectionOrder">{props.selectedOrder + 1}</span>}
    </motion.button>
  );
}

function RevealedCard(props: {
  card: InteractiveDeckCard;
  index: number;
  total: number;
  position: SpreadPosition;
  topic: ReadingTopic;
  theme: CardBackTheme;
  flipped: boolean;
  contentPackId: string;
  onFlip: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const content = getMiaoContentBundle(props.card.card.id, props.contentPackId);
  const miao = content.copy;
  const art = content.art;
  const backSkin = getCardBackSkin(props.theme);
  const frame = getMiaoContentPackFrame(props.contentPackId);
  const orientation = getMiaoOrientationLabel(props.card.orientation);
  const reversed = props.card.orientation === 'reversed';
  const miaoMeaning = reversed ? miao.reversedMiaoMeaning : miao.uprightMiaoMeaning;
  const traditionalMeaning = getCardMeaningZhHans(props.card);
  const positionMeaning = getPositionMeaning(props.card.card, props.position.aspect, props.card.orientation);
  const topicMeaning = getTopicMeaning(props.card.card, props.topic, props.card.orientation);

  const distanceFromCenter = props.index - (props.total - 1) / 2;

  return (
    <motion.div
      className="revealSlot"
      initial={reduceMotion ? { opacity: 0 } : {
        opacity: 0,
        x: distanceFromCenter * -72,
        y: 72,
        rotate: distanceFromCenter * 7,
        scale: 0.76,
      }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      transition={reduceMotion
        ? { duration: 0.16 }
        : { delay: props.index * 0.11, type: 'spring', stiffness: 210, damping: 22 }}
    >
      <motion.button
        type="button"
        className="flipCardButton"
        style={{ aspectRatio: props.flipped ? '11 / 19' : backSkin.aspectRatio }}
        aria-label={props.flipped ? `${props.position.label}：${miao.miaoName}，${orientation}` : `${props.position.label}，点击翻牌`}
        onClick={props.onFlip}
        disabled={props.flipped}
        animate={{ rotateY: props.flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 190, damping: 22 }}
        whileHover={props.flipped ? undefined : { y: -4, scale: 1.015 }}
        whileTap={props.flipped ? undefined : { scale: 0.98 }}
      >
        <div className="flipCardFace flipCardBackFace" aria-hidden={props.flipped}>
          <CardBack theme={props.theme} />
        </div>
        <div className="flipCardFace flipCardFrontFace" aria-hidden={!props.flipped}>
          <TarotCardFrame frame={frame} className={`interactiveCardFront palette-${miao.palette}`}>
            <div className="interactiveCardFrontSurface">
              <div className="interactiveCardArtWell">
                {art.generatedImage ? (
                  <img
                    className={reversed ? 'isReversed' : ''}
                    src={art.generatedImage}
                    alt=""
                    draggable={false}
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <Cat size={42} aria-hidden="true" />
                )}
              </div>
              <div className="interactiveCardNameplate">
                <span className="interactiveCardMeta">{getCardOrdinalLabel(props.card.card)}</span>
                <strong>{miao.miaoName}</strong>
                <span className="interactiveCardSubline">{getCardKeyword(props.card.card)} · {orientation}</span>
                <span className="interactiveCardFlourish" aria-hidden="true"><b>{frame.crest}</b></span>
              </div>
            </div>
          </TarotCardFrame>
        </div>
      </motion.button>
      {!props.flipped && (
        <Group justify="center" gap="xs" mt="xs">
          <Badge variant="light" color="gray">{props.position.label}</Badge>
          <Text size="xs" c="dimmed">点击翻牌</Text>
        </Group>
      )}
      {props.flipped && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="revealCaption">
          <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
            <div className="revealCardIdentity">
              <Text fw={800}>{miao.miaoName}</Text>
              <Text size="xs" c="dimmed" mt={3}>{getCardKeyword(props.card.card)} · {content.catBreed || miao.archetype}</Text>
            </div>
            <Group gap={6} wrap="wrap" justify="flex-end">
              <Badge variant="light" color="gray">{props.position.label}</Badge>
              <Badge variant="light" color={reversed ? 'orange' : 'teal'}>{orientation}</Badge>
            </Group>
          </Group>
          <Text fw={800} mt="sm">{miao.memeCaption}</Text>
          <details className="tarotMeaningDetails isCompact">
            <summary>展开简介与完整牌义</summary>
            <Text size="xs" c="dimmed" mt={6}>{miaoMeaning}</Text>
            <Text size="xs" c="dimmed" mt={6}>{traditionalMeaning}</Text>
            <Text size="xs" mt={6}><strong>{props.position.label}位：</strong>{positionMeaning}</Text>
            <Text size="xs" c="dimmed" mt={4}><strong>结合问题：</strong>{topicMeaning}</Text>
          </details>
        </motion.div>
      )}
    </motion.div>
  );
}

export function InteractiveDrawTable(props: InteractiveDrawTableProps) {
  const [state, dispatch] = useReducer(interactiveDrawReducer, undefined, () => createInitialDrawState('three-card'));
  const [includeReversals, setIncludeReversals] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const completedSession = useRef('');
  const spread = getSpread(state.mode);
  const mode = getInteractiveDrawMode(state.mode);
  const backSkin = getCardBackSkin(state.backTheme);
  const cutPiles = useMemo(() => createCutPiles(state.deck), [state.deck]);
  const activePile = state.cutPileIndex === null ? [] : cutPiles[state.cutPileIndex] ?? [];
  const selectedDrawn = useMemo(
    () => state.selectedIds.length === state.requiredCount ? getSelectedDrawnCards(state) : [],
    [state.deck, state.requiredCount, state.selectedIds],
  );
  const pendingReading = useMemo(() => {
    if (state.stage !== 'complete' || selectedDrawn.length !== state.requiredCount) return null;
    return createMiaoReadingFromDrawn(
      { question: props.question, topic: props.topic, spreadId: state.mode },
      selectedDrawn,
      props.contentPackId,
    );
  }, [props.contentPackId, props.question, props.topic, selectedDrawn, state.mode, state.requiredCount, state.stage]);

  useEffect(() => {
    if (state.stage !== 'complete' || !pendingReading) return;
    const sessionKey = state.selectedIds.join('|');
    if (completedSession.current === sessionKey) return;
    completedSession.current = sessionKey;
    props.onReadingComplete(pendingReading);
  }, [pendingReading, props, state.selectedIds, state.stage]);

  useEffect(() => {
    props.onStageChange?.(state.stage);
  }, [props.onStageChange, state.stage]);

  function startShuffle() {
    if (!props.question.trim()) return;
    const next = createInteractiveDeck({ includeReversals, contentPackId: props.contentPackId });
    if (soundEnabled) playShuffleSound();
    completedSession.current = '';
    setShowAdvanced(false);
    props.onSessionStart();
    trackProductEvent('reading_started', state.mode, { source: 'reading-desk' });
    dispatch({ type: 'START_SHUFFLE', ...next });
    scrollReadingDeskToTop();
  }

  function scrollReadingDeskToTop() {
    requestAnimationFrame(() => document.getElementById('reading-desk')?.scrollTo({ top: 0, behavior: 'auto' }));
  }

  function finishShuffle() {
    dispatch({ type: 'FINISH_SHUFFLE' });
    scrollReadingDeskToTop();
  }

  function placeSelected() {
    dispatch({ type: 'PLACE_SELECTED' });
    scrollReadingDeskToTop();
  }

  function chooseCutPile(pileIndex: CutPileIndex) {
    if (state.stage !== 'cutting') return;
    if (soundEnabled) playCardFlipSound();
    dispatch({ type: 'CHOOSE_CUT_PILE', pileIndex });
    scrollReadingDeskToTop();
  }

  function returnToCut() {
    if (state.stage !== 'selecting' || state.selectedIds.length > 0) return;
    dispatch({ type: 'RETURN_TO_CUT' });
    scrollReadingDeskToTop();
  }

  function autoDraw() {
    if ((state.stage !== 'cutting' && state.stage !== 'selecting') || state.selectedIds.length > 0) return;
    dispatch({ type: 'AUTO_DRAW' });
    scrollReadingDeskToTop();
  }

  function flipCard(hiddenId: string) {
    if (state.flippedIds.includes(hiddenId)) return;
    if (soundEnabled) playCardFlipSound();
    dispatch({ type: 'FLIP_CARD', hiddenId });
  }

  function setMode(value: string) {
    dispatch({ type: 'SET_MODE', mode: value as InteractiveDrawMode });
  }

  function resetToSetup() {
    completedSession.current = '';
    setShowAdvanced(false);
    props.onSessionStart();
    dispatch({ type: 'RESET' });
    scrollReadingDeskToTop();
  }

  const activeCopy = stageCopy[state.stage];
  const anchor = pendingReading ? getMiaoReadingAnchor(pendingReading) : undefined;
  const contentPack = getMiaoContentPack(props.contentPackId);
  const hasQuestion = Boolean(props.question.trim());
  const nextPosition = spread.positions[state.selectedIds.length];

  return (
    <Paper withBorder p={{ base: 'md', sm: 'lg' }} className="interactiveDrawTable" data-stage={state.stage}>
      <Group justify="space-between" align="flex-start" gap="md" className="drawTableHeader">
        <div>
          <Badge color={state.stage === 'complete' ? 'teal' : 'violet'} variant="light">
            {activeCopy[0]} / {activeCopy[1]}
          </Badge>
          <Title order={2} mt="xs" className="drawTableTitle">
            {state.stage === 'ready' ? '这次想看清什么？' : mode.title}
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            {state.stage === 'ready' && '不用想得很完整，把现在最挂心的那件事告诉猫猫就好。'}
            {state.stage === 'cutting' && '三叠都是刚洗好的牌，没有好坏，点第一眼想选的那叠。'}
            {state.stage === 'selecting' && `从这 ${activePile.length} 张里选；顺序对应${spread.positions.map((item) => item.label).join('、')}。`}
            {state.stage === 'placed' && '每张牌都可以单独翻开，正逆位直到这一刻才会看见。'}
            {state.stage === 'complete' && '牌义先落地，完整分析、分享和 AI 解读都在下面。'}
          </Text>
        </div>
        {state.stage !== 'ready' && state.stage !== 'shuffling' && (
          <Group gap="xs">
            <Button variant="subtle" color="gray" onClick={resetToSetup}>换玩法</Button>
            <Button variant="subtle" color="gray" leftSection={<RotateCcw size={16} />} onClick={startShuffle}>
              {state.stage === 'complete' ? '同玩法再洗' : '重新洗猫'}
            </Button>
          </Group>
        )}
      </Group>

      {state.stage === 'ready' && (
        <div className="readyStage">
          <div className="mobileCompanionPrompt">
            <span aria-hidden="true">🐈</span>
            <Text size="sm">不用组织得很完美。写下此刻最挂心的那件事就好。</Text>
          </div>
          <Stack gap="sm" mt="md" className="questionSetup">
            <Textarea
              label="你的问题"
              description="可以保留默认问题，也可以用自己的话描述。"
              value={props.question}
              onChange={(event) => props.onQuestionChange(event.currentTarget.value)}
              minRows={3}
              autosize
              error={hasQuestion ? undefined : '先写下一件此刻最想看清的事。'}
            />
            <Group gap="xs" className="quickQuestionRow">
              {props.quickQuestions.slice(0, 3).map((item) => (
                <Button key={item} variant="light" size="compact-xs" onClick={() => props.onQuestionChange(item)}>
                  {item}
                </Button>
              ))}
            </Group>
            <Button
              className="mobileAdvancedToggle"
              variant="default"
              leftSection={<SlidersHorizontal size={16} />}
              rightSection={showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              onClick={() => setShowAdvanced((value) => !value)}
              aria-expanded={showAdvanced}
              aria-controls="draw-advanced-settings"
            >
              {mode.count === 1 ? '一张牌' : `${mode.count} 张牌`} · {contentPack.shortName} · {includeReversals ? '包含逆位' : '仅正位'}
            </Button>
          </Stack>
          <SimpleGrid
            cols={{ base: 1, md: 4 }}
            spacing="sm"
            mt="lg"
            id="draw-advanced-settings"
            className={`drawSetupControls ${showAdvanced ? 'isMobileExpanded' : ''}`}
          >
            <div>
              <Text size="sm" fw={700} mb={6}>这次翻几张</Text>
              <SegmentedControl
                fullWidth
                value={state.mode}
                onChange={setMode}
                data={interactiveDrawModes.map((item) => ({ value: item.id, label: item.label }))}
              />
              <Text size="xs" c="dimmed" mt={6}>{mode.description}</Text>
            </div>
            <Select
              label="这次用哪副牌"
              description={`${contentPack.scope === 'full' ? '78' : '22'} 张 · ${contentPack.artStyle}`}
              data={miaoContentPacks.map((pack) => ({ value: pack.id, label: pack.shortName }))}
              value={props.contentPackId}
              onChange={(value) => props.onContentPackChange((value || contentPack.id) as MiaoContentPackId)}
              allowDeselect={false}
            />
            <Select
              label="这次主要想看"
              data={topicOptions.map((option) => ({ value: option.value, label: option.label }))}
              value={props.topic}
              onChange={(value) => props.onTopicChange((value as ReadingTopic | null) ?? 'others')}
              allowDeselect={false}
            />
            <div className="reversalControl">
              <Switch
                checked={includeReversals}
                onChange={(event) => setIncludeReversals(event.currentTarget.checked)}
                label="包含逆位"
                description="开启后约 28% 的牌会倒置，使用逆位牌义。"
              />
            </div>
          </SimpleGrid>
          <Group gap="md" align="center" className="shuffleActionRow">
            <Button
              size="lg"
              leftSection={<WandSparkles size={18} />}
              onClick={startShuffle}
              className="shuffleButton"
              disabled={!hasQuestion}
            >
              带着问题去洗牌
            </Button>
            <Switch
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.currentTarget.checked)}
              label="洗牌 / 翻牌音效"
              thumbIcon={soundEnabled ? <Volume2 size={11} /> : undefined}
              aria-label="洗牌与翻牌音效"
            />
          </Group>
        </div>
      )}

      <AnimatePresence mode="wait">
        {state.stage === 'shuffling' && (
          <motion.div key="shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ShuffleStack theme={state.backTheme} onComplete={finishShuffle} />
          </motion.div>
        )}

        {state.stage === 'cutting' && (
          <motion.div
            key="cutting"
            className="cutStage"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="cutStageGuide">
              <Text size="xs" fw={850} c="violet">切牌</Text>
              <Title order={3} mt={3}>凭第一眼，选一叠</Title>
              <Text size="sm" c="dimmed" mt={5}>不用算，也不用找理由。点下去就算选定。</Text>
            </div>
            <div className="cutPileRow" role="group" aria-label="三叠洗好的猫牌">
              {cutPiles.map((pile, index) => (
                <CutPile
                  key={pile[0]?.hiddenId ?? index}
                  index={index as CutPileIndex}
                  count={pile.length}
                  theme={state.backTheme}
                  onChoose={() => chooseCutPile(index as CutPileIndex)}
                />
              ))}
            </div>
            <Text size="xs" c="dimmed" ta="center" className="cutPileNote">
              {state.deck.length} 张已经平均分成三叠，牌面与正逆位仍然不会提前出现。
            </Text>
            <div className="cutActionRow">
              <Button
                variant="light"
                color="violet"
                leftSection={<Cat size={16} />}
                onClick={autoDraw}
                className="cutDirectButton"
              >
                不想挑，直接发牌
              </Button>
            </div>
          </motion.div>
        )}

        {state.stage === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="selectionStage">
            <div className="selectionGuide">
              <Group justify="space-between" align="flex-end" gap="sm">
                <div>
                  <Text size="xs" fw={850} c="violet">选牌 {state.selectedIds.length} / {state.requiredCount}</Text>
                  <Text fw={850} size="lg" mt={2}>
                    {nextPosition ? `现在选「${nextPosition.label}」` : '牌已经选好了'}
                  </Text>
                </div>
                <Group gap={6} className="selectedPileMeta">
                  <Text size="xs" c="dimmed" className="deckMeta">
                    {activePile.length} 张 · {contentPack.shortName} · {backSkin.label}
                  </Text>
                  {state.selectedIds.length === 0 && (
                    <Button variant="subtle" color="gray" size="compact-xs" onClick={returnToCut}>
                      换一叠
                    </Button>
                  )}
                </Group>
              </Group>
              <Group gap={7} mt={8} wrap="nowrap" className="selectionGestureHint">
                <ArrowLeftRight size={15} aria-hidden="true" />
                <Text size="sm" c="dimmed">左右滑动牌阵，凭第一眼点一张；再点一次可以撤回。</Text>
              </Group>
            </div>
            <div
              className="hiddenDeckViewport"
              role="region"
              aria-label={`选中的牌堆，共 ${activePile.length} 张。左右滑动牌阵并点选牌背。`}
            >
              <div className="hiddenDeckGrid" data-deck-size={activePile.length > 30 ? 'full' : 'major'}>
                {activePile.map((card, index) => {
                  const selectedOrder = state.selectedIds.indexOf(card.hiddenId);
                  return (
                    <HiddenDeckCard
                      key={card.hiddenId}
                      index={index}
                      selectedOrder={selectedOrder}
                      theme={state.backTheme}
                      disabled={state.selectedIds.length >= state.requiredCount && selectedOrder === -1}
                      onToggle={() => dispatch({ type: 'TOGGLE_SELECTION', hiddenId: card.hiddenId })}
                    />
                  );
                })}
              </div>
            </div>
            <Group justify="space-between" mt="md" gap="sm" className="selectionActionRow">
              <Text size="sm" c="dimmed">
                {state.selectedIds.length < state.requiredCount
                  ? `还差 ${state.requiredCount - state.selectedIds.length} 张。已选的牌可以再点一次撤回。`
                  : '选好了。它们的身份和正逆位都已经固定。'}
              </Text>
              <Group gap="sm" className="selectionButtons" wrap="nowrap">
                {state.selectedIds.length === 0 && (
                  <Button
                    variant="light"
                    color="violet"
                    leftSection={<Cat size={16} />}
                    onClick={autoDraw}
                    className="autoDrawButton"
                  >
                    直接发牌
                  </Button>
                )}
                <Button
                  disabled={state.selectedIds.length !== state.requiredCount}
                  rightSection={<Sparkles size={16} />}
                  onClick={placeSelected}
                  className="placeSelectedButton"
                >
                  {state.selectedIds.length === state.requiredCount
                    ? `把 ${state.requiredCount} 张猫牌放上桌`
                    : `还差 ${state.requiredCount - state.selectedIds.length} 张`}
                </Button>
              </Group>
            </Group>
          </motion.div>
        )}
      </AnimatePresence>

      {(state.stage === 'placed' || state.stage === 'complete') && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="revealStage">
          <div className="revealGrid" data-count={state.requiredCount}>
            {state.selectedIds.map((hiddenId, index) => {
              const card = state.deck.find((item) => item.hiddenId === hiddenId);
              if (!card) return null;
              return (
                <RevealedCard
                  key={hiddenId}
                  card={card}
                  index={index}
                  total={state.requiredCount}
                  position={spread.positions[index]}
                  topic={props.topic}
                  theme={state.backTheme}
                  contentPackId={props.contentPackId}
                  flipped={state.flippedIds.includes(hiddenId)}
                  onFlip={() => flipCard(hiddenId)}
                />
              );
            })}
          </div>

          {state.stage === 'complete' && anchor && (
            <Alert mt="lg" color="teal" variant="light" icon={<Cat size={19} />} className="instantReward">
              <Title order={3} size="h4">核心牌：{anchor.miao.miaoName}</Title>
              <Text fw={750} mt={4}>{anchor.miao.memeCaption}</Text>
              <Text size="sm" mt="xs">现在先做：{anchor.miao.tinyAction}</Text>
            </Alert>
          )}
        </motion.div>
      )}
    </Paper>
  );
}
