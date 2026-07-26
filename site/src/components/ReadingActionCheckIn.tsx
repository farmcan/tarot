import { useEffect, useRef } from 'react';
import { Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { CalendarDays, Cat, X } from 'lucide-react';
import type { ReadingActionOutcome, SavedReadingAction } from '../domain/readingAction';

const outcomeCopy: Record<ReadingActionOutcome, string> = {
  done: '收到。你把这一步带回现实了。',
  ongoing: '收到。它还在路上，不需要今天交卷。',
  'not-fit': '收到。不适合的行动也可以放下。',
};

export function ReadingActionCheckIn({
  entry,
  resolved = false,
  persistenceFailed = false,
  onAnswer,
  onDefer,
  onContinue,
  onClose,
  onVisible,
}: {
  entry: SavedReadingAction;
  resolved?: boolean;
  persistenceFailed?: boolean;
  onAnswer: (outcome: ReadingActionOutcome) => void;
  onDefer: () => void;
  onContinue: () => void;
  onClose: () => void;
  onVisible: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      onVisible();
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || entry.intersectionRatio < 0.35) return;
      onVisible();
      observer.disconnect();
    }, { threshold: [0.35] });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <Paper
      ref={cardRef}
      withBorder
      p={{ base: 'md', sm: 'lg' }}
      className={`readingActionCheckIn ${resolved ? 'isResolved' : ''}`}
      data-testid="reading-action-check-in"
      role="region"
      aria-label="上次行动回看"
    >
      <Group justify="space-between" align="flex-start" gap="sm">
        <div>
          <Badge color="violet" variant="light" leftSection={<Cat size={12} />}>
            上次带走的一步
          </Badge>
          <Title order={2} size="h3" mt="xs">
            {resolved ? '猫猫记下了' : '后来怎么样？'}
          </Title>
        </div>
        {resolved && (
          <Button
            size="compact-sm"
            variant="subtle"
            color="gray"
            leftSection={<X size={14} />}
            onClick={onClose}
          >
            收起
          </Button>
        )}
      </Group>

      <Text className="readingActionCheckInQuote" fw={740} mt="sm">
        “{entry.action}”
      </Text>

      {resolved && entry.outcome ? (
        <Stack gap="sm" mt="md">
          <Text>{outcomeCopy[entry.outcome]}</Text>
          <Text size="xs" c={persistenceFailed ? 'red' : 'dimmed'} role={persistenceFailed ? 'alert' : undefined}>
            {persistenceFailed
              ? '这个浏览器没有允许保存本次回看；刷新后可能会再次出现。'
              : '这里只记录你的选择，不用它判断牌准，也不会上传这句话。'}
          </Text>
          <Button
            className="readingActionContinueButton"
            variant="light"
            color="violet"
            leftSection={<CalendarDays size={16} />}
            onClick={onContinue}
          >
            看看今天的牌
          </Button>
        </Stack>
      ) : (
        <>
          <Text size="sm" c="dimmed" mt="xs">
            这不是检查，也没有连续打卡。选一个最接近现在的状态就好。
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs" mt="md" className="readingActionOutcomeGrid">
            <Button variant="light" color="teal" onClick={() => onAnswer('done')}>做了</Button>
            <Button variant="light" color="violet" onClick={() => onAnswer('ongoing')}>还在进行</Button>
            <Button variant="light" color="gray" onClick={() => onAnswer('not-fit')}>这步不适合</Button>
          </SimpleGrid>
          <Button variant="subtle" color="gray" mt="xs" onClick={onDefer}>
            不再问这一步
          </Button>
          <Text size="xs" c="dimmed" mt={2}>
            只存在这个浏览器；关闭后不会再主动问。
          </Text>
        </>
      )}
    </Paper>
  );
}
