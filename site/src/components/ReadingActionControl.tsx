import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { BookmarkPlus, Check, Pencil, Trash2 } from 'lucide-react';
import type { SavedReadingAction } from '../domain/readingAction';

const outcomeLabels = {
  done: '做了',
  ongoing: '还在进行',
  'not-fit': '这步不适合',
} as const;

export function ReadingActionControl({
  suggestedAction,
  savedAction,
  onSave,
  onRemove,
  variant = 'result',
}: {
  suggestedAction: string;
  savedAction: SavedReadingAction | null;
  onSave: (action: string) => boolean;
  onRemove: () => boolean;
  variant?: 'bridge' | 'result';
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draft, setDraft] = useState(savedAction?.action ?? suggestedAction);
  const [saveError, setSaveError] = useState(false);
  const candidates = suggestedAction
    .split(/\s*[／/]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
  const hasMultipleCandidates = candidates.length > 1;

  useEffect(() => {
    setDraft(savedAction?.action ?? suggestedAction);
    setEditing(false);
    setConfirmingDelete(false);
    setSaveError(false);
  }, [savedAction?.action, suggestedAction]);

  const body = (
    <Stack gap="xs">
      {savedAction ? (
        <>
          <Group gap="xs">
            <Badge color="teal" variant="light" leftSection={<Check size={12} />}>
              {savedAction.outcome
                ? `已回看 · ${outcomeLabels[savedAction.outcome]}`
                : '已记住'}
            </Badge>
            <Text size="xs" c="dimmed">只存在这个浏览器</Text>
          </Group>

          {!editing && (
            <>
              <Text size="sm" fw={720} className="savedReadingActionText">
                “{savedAction.action}”
              </Text>
              {!savedAction.outcome && (
                <Text size="xs" c="dimmed">
                  之后 7 天内回来时，猫猫会轻轻问一次后来怎么样；没有通知和连续打卡。
                </Text>
              )}
            </>
          )}
        </>
      ) : !editing ? (
        <>
          {hasMultipleCandidates ? (
            <>
              <Text size="xs" fw={760}>先选一个更像你愿意试的方向</Text>
              <Group gap="xs" className="readingActionCandidates">
                {candidates.map((candidate) => (
                  <Button
                    key={candidate}
                    size="compact-sm"
                    variant={variant === 'bridge' ? 'white' : 'light'}
                    color="teal"
                    onClick={() => {
                      setDraft(candidate);
                      setEditing(true);
                    }}
                  >
                    {candidate}
                  </Button>
                ))}
              </Group>
            </>
          ) : (
            <Button
              className="rememberReadingActionButton"
              size="sm"
              variant={variant === 'bridge' ? 'white' : 'light'}
              color="teal"
              leftSection={<BookmarkPlus size={16} />}
              onClick={() => setEditing(true)}
            >
              记住这一步
            </Button>
          )}
          <Text size="xs" c="dimmed">
            可以改成更像你会做的话；只保存在这个浏览器。
          </Text>
        </>
      ) : null}

      {editing && (
        <div className="readingActionEditor" data-testid="reading-action-editor">
          <Textarea
            label="你想带走哪一步？"
            description="可以改成更像你会做的话，最多 120 字。"
            aria-label="你想带走哪一步？"
            value={draft}
            maxLength={120}
            minRows={2}
            autosize
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              setSaveError(false);
            }}
          />
          {saveError && (
            <Text size="xs" c="red" mt={6} role="alert">
              这个浏览器没有允许保存。你仍可以截图或复制这一步。
            </Text>
          )}
          <Group gap="xs" mt="sm">
            <Button
              size="sm"
              color="teal"
              disabled={!draft.trim()}
              onClick={() => {
                if (!onSave(draft)) {
                  setSaveError(true);
                  return;
                }
                setEditing(false);
              }}
            >
              保存这一步
            </Button>
            <Button
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => {
                setDraft(savedAction?.action ?? suggestedAction);
                setEditing(false);
                setSaveError(false);
              }}
            >
              先不保存
            </Button>
          </Group>
        </div>
      )}

      {savedAction && !editing && !confirmingDelete && (
        <Group gap="xs">
          <Button
            size="compact-sm"
            variant="subtle"
            color="gray"
            leftSection={<Pencil size={14} />}
            onClick={() => setEditing(true)}
          >
            修改
          </Button>
          <Button
            size="compact-sm"
            variant="subtle"
            color="red"
            leftSection={<Trash2 size={14} />}
            onClick={() => setConfirmingDelete(true)}
          >
            删除这一步
          </Button>
        </Group>
      )}

      {savedAction && confirmingDelete && (
        <div className="readingActionDeleteConfirm" role="group" aria-label="确认删除保存的行动">
          <Text size="sm" fw={720}>确定删除这一步？</Text>
          <Text size="xs" c="dimmed" mt={2}>之后不会再出现这次回看。</Text>
          <Group gap="xs" mt="sm">
            <Button
              size="sm"
              color="red"
              onClick={() => {
                if (onRemove()) setConfirmingDelete(false);
              }}
            >
              删除
            </Button>
            <Button size="sm" variant="subtle" color="gray" onClick={() => setConfirmingDelete(false)}>
              取消
            </Button>
          </Group>
        </div>
      )}
    </Stack>
  );

  return variant === 'result' ? (
    <Paper withBorder p="md" className="readingActionControl isResult" data-testid="reading-action-control">
      {body}
    </Paper>
  ) : (
    <div className="readingActionControl isBridge" data-testid="reading-action-control">
      {body}
    </div>
  );
}
