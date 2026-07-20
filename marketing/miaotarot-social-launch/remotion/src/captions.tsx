import type { Caption } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./constants";
import { enter, map } from "./motion";

export const CAPTIONS: Caption[] = [
  {
    text: "给你两秒。左、中、右，选一张猫。",
    startMs: 0,
    endMs: 3420,
    timestampMs: 0,
    confidence: 1,
  },
  {
    text: "选中间？翻开。",
    startMs: 3420,
    endMs: 5340,
    timestampMs: 3420,
    confidence: 1,
  },
  {
    text: "魔术师说：办法不是没有，是还没伸爪。",
    startMs: 5340,
    endMs: 10520,
    timestampMs: 5340,
    confidence: 1,
  },
  {
    text: "你手上的工具已经够了。下一步，是动一下。",
    startMs: 10520,
    endMs: 15480,
    timestampMs: 10520,
    confidence: 1,
  },
  {
    text: "免下载，三十秒就能抽。打开 MiaoTarot，让猫陪你换个角度看问题。",
    startMs: 15480,
    endMs: 20098,
    timestampMs: 15480,
    confidence: 1,
  },
];

export const VoiceCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const active = CAPTIONS.find(
    (caption) => nowMs >= caption.startMs && nowMs < caption.endMs,
  );
  if (!active) return null;

  const localFrame = frame - Math.round((active.startMs / 1000) * fps);
  const show = enter(localFrame, 0, 6);

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 50,
        left: 72,
        right: 72,
        bottom: 40,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: show,
        transform: `translateY(${map(show, 14, 0)}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 930,
          padding: "14px 24px 16px",
          borderRadius: 18,
          background: "rgba(24,15,33,0.84)",
          border: "2px solid rgba(255,255,255,0.18)",
          boxShadow: "0 14px 38px rgba(0,0,0,0.22)",
          color: "#fff",
          fontSize: 29,
          lineHeight: 1.38,
          fontWeight: 760,
          textAlign: "center",
          textShadow: "0 2px 5px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ color: COLORS.gold }}>✦ </span>
        {active.text}
      </div>
    </div>
  );
};
