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
import { Cat, RotateCcw, Sparkles, WandSparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { getCardMeaning } from '@cometpisces/tarot-kit';
import {
  createMiaoReadingFromDrawn,
  getMiaoOrientationLabel,
  type MiaoReading,
} from '../domain/miaoTarot';
import { getMiaoContentBundle } from '../domain/miaoContent';
import {
  getMiaoContentPack,
  miaoContentPacks,
  type MiaoContentPackId,
} from '../domain/miaoContentPacks';
import { getCardBackSkin } from '../domain/cardBacks';
import { trackProductEvent } from '../domain/productAnalytics';
import {
  createInitialDrawState,
  createInteractiveDeck,
  getInteractiveDrawMode,
  getSelectedDrawnCards,
  interactiveDrawModes,
  interactiveDrawReducer,
  type CardBackTheme,
  type InteractiveDeckCard,
  type InteractiveDrawMode,
} from '../domain/interactiveDraw';
import {
  getCardKeyword,
  getCardName,
  getPositionMeaning,
  getSpread,
  getTopicMeaning,
  topicOptions,
  type ReadingTopic,
  type SpreadPosition,
} from '../domain/tarot';

const stageCopy = {
  ready: ['01', '选玩法，然后开始洗猫'],
  shuffling: ['02', '猫牌正在重新排队'],
  selecting: ['03', '从完整牌堆里亲手选'],
  placed: ['04', '逐张点击，翻开猫牌'],
  complete: ['05', '猫猫已经把话说完了'],
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
  const stack = Array.from({ length: 9 }, (_, index) => index);

  return (
    <div className="shuffleStage" role="status" aria-live="polite">
      <div className="shuffleStack" aria-hidden="true">
        {stack.map((index) => {
          const direction = index % 2 === 0 ? 1 : -1;
          return (
            <motion.div
              key={index}
              className="shuffleStackCard"
              initial={{ x: 0, y: index * -1.4, rotate: index - 4, opacity: 0.75 }}
              animate={reduceMotion
                ? { opacity: [0.75, 1] }
                : {
                  x: [0, direction * (62 + index * 3), direction * -32, 0],
                  y: [index * -1.4, -8 - index, 5, index * -1.4],
                  rotate: [index - 4, direction * (9 + index), direction * -5, index - 4],
                }}
              transition={{ duration: reduceMotion ? 0.24 : 0.78, delay: index * 0.035, ease: 'easeInOut' }}
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
    </div>
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

  return (
    <motion.button
      type="button"
      className={`hiddenDeckCard ${selected ? 'isSelected' : ''}`}
      aria-label={`第 ${props.index + 1} 张背面猫牌${selected ? `，已选为第 ${props.selectedOrder + 1} 张` : ''}`}
      aria-pressed={selected}
      disabled={props.disabled && !selected}
      onClick={props.onToggle}
      initial={{ opacity: 0, y: 18, rotate: props.index % 2 === 0 ? -1.5 : 1.5 }}
      animate={{ opacity: 1, y: selected ? -10 : 0, rotate: 0 }}
      transition={{ delay: Math.min(props.index * 0.018, 0.28), type: 'spring', stiffness: 320, damping: 25 }}
      whileHover={{ y: selected ? -12 : -5 }}
      whileTap={{ scale: 0.96 }}
    >
      <CardBack theme={props.theme} compact />
      {selected && <span className="selectionOrder">{props.selectedOrder + 1}</span>}
    </motion.button>
  );
}

function RevealedCard(props: {
  card: InteractiveDeckCard;
  position: SpreadPosition;
  topic: ReadingTopic;
  theme: CardBackTheme;
  flipped: boolean;
  contentPackId: string;
  onFlip: () => void;
}) {
  const content = getMiaoContentBundle(props.card.card.id, props.contentPackId);
  const miao = content.copy;
  const art = content.art;
  const orientation = getMiaoOrientationLabel(props.card.orientation);
  const reversed = props.card.orientation === 'reversed';
  const miaoMeaning = reversed ? miao.reversedMiaoMeaning : miao.uprightMiaoMeaning;
  const traditionalMeaning = getCardMeaning(props.card, 'zh');
  const positionMeaning = getPositionMeaning(props.card.card, props.position.aspect, props.card.orientation);
  const topicMeaning = getTopicMeaning(props.card.card, props.topic, props.card.orientation);

  return (
    <div className="revealSlot">
      <Group justify="space-between" gap="xs" mb="xs">
        <Badge variant="light" color="gray">{props.position.label}</Badge>
        {props.flipped && (
          <Badge variant="light" color={reversed ? 'orange' : 'teal'}>{orientation}</Badge>
        )}
      </Group>
      <motion.button
        type="button"
        className="flipCardButton"
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
          <span className="flipHint">点击翻牌</span>
        </div>
        <div className="flipCardFace flipCardFrontFace" aria-hidden={!props.flipped}>
          <div className={`interactiveCardFront palette-${miao.palette}`}>
            {art.generatedImage ? (
              <img className={reversed ? 'isReversed' : ''} src={art.generatedImage} alt="" draggable={false} loading="eager" decoding="async" />
            ) : (
              <Cat size={42} aria-hidden="true" />
            )}
            <strong>{miao.miaoName}</strong>
            <small>{getCardKeyword(props.card.card)} · {content.catBreed || miao.archetype}</small>
          </div>
        </div>
      </motion.button>
      {props.flipped && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="revealCaption">
          <Text fw={800}>{miao.memeCaption}</Text>
          <Text size="xs" c="dimmed" mt={6}>{miaoMeaning}</Text>
          <details className="tarotMeaningDetails isCompact">
            <summary>{getCardKeyword(props.card.card)} · 完整牌义</summary>
            <Text size="xs" c="dimmed" mt={6}>{traditionalMeaning}</Text>
            <Text size="xs" mt={6}><strong>{props.position.label}位：</strong>{positionMeaning}</Text>
            <Text size="xs" c="dimmed" mt={4}><strong>结合问题：</strong>{topicMeaning}</Text>
          </details>
        </motion.div>
      )}
    </div>
  );
}

export function InteractiveDrawTable(props: InteractiveDrawTableProps) {
  const [state, dispatch] = useReducer(interactiveDrawReducer, undefined, () => createInitialDrawState('three-card'));
  const [includeReversals, setIncludeReversals] = useState(true);
  const completedSession = useRef('');
  const spread = getSpread(state.mode);
  const mode = getInteractiveDrawMode(state.mode);
  const backSkin = getCardBackSkin(state.backTheme);
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

  function startShuffle() {
    const next = createInteractiveDeck({ includeReversals, contentPackId: props.contentPackId });
    completedSession.current = '';
    props.onSessionStart();
    trackProductEvent('reading_started', state.mode);
    dispatch({ type: 'START_SHUFFLE', ...next });
  }

  function setMode(value: string) {
    dispatch({ type: 'SET_MODE', mode: value as InteractiveDrawMode });
  }

  function resetToSetup() {
    completedSession.current = '';
    props.onSessionStart();
    dispatch({ type: 'RESET' });
  }

  const activeCopy = stageCopy[state.stage];
  const anchor = pendingReading?.cards[0];
  const contentPack = getMiaoContentPack(props.contentPackId);

  return (
    <Paper withBorder p={{ base: 'md', sm: 'lg' }} className="interactiveDrawTable">
      <Group justify="space-between" align="flex-start" gap="md" className="drawTableHeader">
        <div>
          <Badge color={state.stage === 'complete' ? 'teal' : 'violet'} variant="light">
            {activeCopy[0]} / {activeCopy[1]}
          </Badge>
          <Title order={2} mt="xs" className="drawTableTitle">
            {mode.title}
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            {state.stage === 'ready' && '问题可以不改。先洗牌，再从完整牌堆里亲手选。'}
            {state.stage === 'selecting' && `按选择顺序对应${spread.positions.map((item) => item.label).join('、')}。`}
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
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="sm" mt="lg" className="drawSetupControls">
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
            label="选择内容包"
            description={`${contentPack.scope === 'full' ? '78' : '22'} 张 · ${contentPack.artStyle}`}
            data={miaoContentPacks.map((pack) => ({ value: pack.id, label: pack.shortName }))}
            value={props.contentPackId}
            onChange={(value) => props.onContentPackChange((value || contentPack.id) as MiaoContentPackId)}
            allowDeselect={false}
          />
          <Select
            label="想看的主题"
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
      )}

      {state.stage === 'ready' && (
        <Stack gap="sm" mt="md">
          <Textarea
            label="这次想问什么？"
            description="已经有默认问题，也可以直接开始。"
            value={props.question}
            onChange={(event) => props.onQuestionChange(event.currentTarget.value)}
            minRows={2}
            autosize
          />
          <Group gap="xs" className="quickQuestionRow">
            {props.quickQuestions.slice(0, 3).map((item) => (
              <Button key={item} variant="light" size="compact-xs" onClick={() => props.onQuestionChange(item)}>
                {item}
              </Button>
            ))}
          </Group>
          <Button size="lg" leftSection={<WandSparkles size={18} />} onClick={startShuffle} className="shuffleButton">
            开始洗猫
          </Button>
        </Stack>
      )}

      <AnimatePresence mode="wait">
        {state.stage === 'shuffling' && (
          <motion.div key="shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ShuffleStack theme={state.backTheme} onComplete={() => dispatch({ type: 'FINISH_SHUFFLE' })} />
          </motion.div>
        )}

        {state.stage === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="selectionStage">
            <Group justify="space-between" mt="lg" mb="sm">
              <Text fw={800}>选牌 {state.selectedIds.length} / {state.requiredCount}</Text>
              <Text size="xs" c="dimmed">{state.deck.length} 张可选 · {contentPack.shortName} · 本轮牌背：{backSkin.label}</Text>
            </Group>
            <div className="hiddenDeckViewport">
              <div className="hiddenDeckGrid">
                {state.deck.map((card, index) => {
                  const selectedOrder = state.selectedIds.indexOf(card.hiddenId);
                  return (
                    <HiddenDeckCard
                      key={card.hiddenId}
                      index={index}
                      selectedOrder={selectedOrder}
                      theme={state.backTheme}
                      disabled={state.selectedIds.length >= state.requiredCount}
                      onToggle={() => dispatch({ type: 'TOGGLE_SELECTION', hiddenId: card.hiddenId })}
                    />
                  );
                })}
              </div>
            </div>
            <Group justify="space-between" mt="md" gap="sm">
              <Text size="sm" c="dimmed">
                {state.selectedIds.length < state.requiredCount
                  ? `还差 ${state.requiredCount - state.selectedIds.length} 张。已选的牌可以再点一次撤回。`
                  : '选好了。它们的身份和正逆位都已经固定。'}
              </Text>
              <Button
                disabled={state.selectedIds.length !== state.requiredCount}
                rightSection={<Sparkles size={16} />}
                onClick={() => dispatch({ type: 'PLACE_SELECTED' })}
              >
                把猫牌放上桌
              </Button>
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
                  position={spread.positions[index]}
                  topic={props.topic}
                  theme={state.backTheme}
                  contentPackId={props.contentPackId}
                  flipped={state.flippedIds.includes(hiddenId)}
                  onFlip={() => dispatch({ type: 'FLIP_CARD', hiddenId })}
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
