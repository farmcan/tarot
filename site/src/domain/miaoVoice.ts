export type MiaoVoiceMode = 'normal' | 'chaos';

export const miaoVoiceModes: ReadonlyArray<{
  id: MiaoVoiceMode;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'normal',
    label: '正常模式',
    description: '温和、清楚，把牌义说人话。',
    icon: '🐈',
  },
  {
    id: 'chaos',
    label: '发疯模式',
    description: '梗更密、反差更大，牌义不乱改。',
    icon: '💥',
  },
];

export const chaosQuickQuestions = [
  '我到底在等时机，还是在给拖延续费？',
  '这段关系是双向奔赴，还是我在参加单人接力？',
  '我的事业为什么像猫凌晨跑酷：很忙，但不知道在忙什么？',
] as const;

const VOICE_MODE_SESSION_KEY = 'miaotarot:voice-mode:v1';

export function getInitialMiaoVoiceMode(
  search = typeof window === 'undefined' ? '' : window.location.search,
  storage: Pick<Storage, 'getItem'> | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
): MiaoVoiceMode {
  try {
    const requested = new URLSearchParams(search).get('voice');
    if (requested === 'chaos' || requested === 'normal') return requested;
    return storage?.getItem(VOICE_MODE_SESSION_KEY) === 'chaos' ? 'chaos' : 'normal';
  } catch {
    return 'normal';
  }
}

export function getMiaoQuestionSeed(
  search = typeof window === 'undefined' ? '' : window.location.search,
) {
  try {
    return (new URLSearchParams(search).get('q') || '').trim().slice(0, 500);
  } catch {
    return '';
  }
}

export function saveMiaoVoiceMode(
  voiceMode: MiaoVoiceMode,
  storage: Pick<Storage, 'setItem'> | null = typeof sessionStorage === 'undefined' ? null : sessionStorage,
) {
  try {
    storage?.setItem(VOICE_MODE_SESSION_KEY, voiceMode);
  } catch {
    // Voice selection still works for the current render when storage is unavailable.
  }
}
