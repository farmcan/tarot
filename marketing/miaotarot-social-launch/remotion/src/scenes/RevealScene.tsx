import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ActionChip,
  BrandPill,
  PaperBackground,
  TarotCard,
} from "../components";
import { COLORS, SCENES } from "../constants";
import { enter, map, sceneOpacity } from "../motion";

export const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flip = enter(frame, 7, 26);
  const quoteIn = enter(frame, 29, 20);
  const meaningIn = enter(frame, 62, 18);
  const actionIn = enter(frame, 100, 18);
  const floatY = Math.sin(frame / 18) * 8;

  return (
    <PaperBackground>
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.reveal.duration, true, true),
        }}
      >
        <div style={{ position: "absolute", left: 74, top: 88 }}>
          <BrandPill text="MIAOTAROT · I 魔术师" />
        </div>

        <TarotCard
          width={575}
          flip={flip}
          style={{
            position: "absolute",
            left: "50%",
            top: 270,
            transform: `translateX(-50%) translateY(${floatY + map(flip, 110, 0)}px) scale(${map(flip, 0.9, 1)})`,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 74,
            right: 74,
            top: 1140,
            padding: "48px 50px",
            borderRadius: 42,
            background: "rgba(255,255,255,0.88)",
            border: "3px solid rgba(114,72,235,0.2)",
            boxShadow: "0 28px 70px rgba(50,30,73,0.14)",
            opacity: quoteIn,
            transform: `translateY(${map(quoteIn, 46, 0)}px)`,
          }}
        >
          <div
            style={{
              fontSize: 69,
              lineHeight: 1.15,
              fontWeight: 950,
              letterSpacing: -3,
            }}
          >
            办法不是没有，
            <br />
            是还没<span style={{ color: COLORS.violet }}>伸爪。</span>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 25,
              color: COLORS.muted,
              fontWeight: 700,
            }}
          >
            魔术师不是“等好运”，而是看见手边已有的工具。
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 74,
            right: 74,
            top: 1445,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            opacity: meaningIn,
            transform: `translateY(${map(meaningIn, 24, 0)}px)`,
          }}
        >
          <ActionChip tone="plain">工具已经够了</ActionChip>
          <ActionChip tone="plain">先用掉一个</ActionChip>
        </div>

        <ActionChip
          style={{
            position: "absolute",
            left: 74,
            right: 74,
            bottom: 270,
            minHeight: 90,
            fontSize: 34,
            opacity: actionIn,
            transform: `scale(${map(actionIn, 0.95, 1)})`,
          }}
        >
          下一步：动一下 →
        </ActionChip>
      </AbsoluteFill>
    </PaperBackground>
  );
};
