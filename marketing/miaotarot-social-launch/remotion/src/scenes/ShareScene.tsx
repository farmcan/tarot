import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ActionChip,
  BrandPill,
  PaperBackground,
  TarotCard,
} from "../components";
import { COLORS, SCENES } from "../constants";
import { enter, map, sceneOpacity } from "../motion";

export const ShareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = enter(frame, 2, 18);
  const shareIn = enter(frame, 32, 18);
  const bubbleIn = enter(frame, 61, 16);

  return (
    <PaperBackground tint="violet">
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.share.duration, true, true),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            top: 82,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <BrandPill text="MIAOTAROT · 适合转给朋友" />
        </div>

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 235,
            width: 820,
            height: 1080,
            transform: `translateX(-50%) translateY(${map(cardIn, 90, 0)}px) rotate(${map(cardIn, -2.4, -0.5)}deg)`,
            opacity: cardIn,
            padding: "48px 48px 42px",
            borderRadius: 44,
            background: "#fffefd",
            border: "3px solid rgba(90,52,118,0.18)",
            boxShadow: "0 42px 100px rgba(50,31,78,0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "10px 17px",
                color: "#fff",
                background: COLORS.ink,
                borderRadius: 999,
                fontSize: 19,
                fontWeight: 900,
                letterSpacing: 2.5,
              }}
            >
              MIAOTAROT
            </div>
            <div style={{ fontSize: 21, color: COLORS.muted }}>猫猫塔罗</div>
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 50,
              fontWeight: 950,
              letterSpacing: -2,
            }}
          >
            今天的核心牌
          </div>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 40,
              alignItems: "center",
            }}
          >
            <TarotCard width={330} flip={1} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, color: COLORS.violet, fontWeight: 850 }}>
                I · 魔术师
              </div>
              <div
                style={{
                  marginTop: 21,
                  fontSize: 47,
                  lineHeight: 1.18,
                  fontWeight: 950,
                  letterSpacing: -2,
                }}
              >
                办法不是没有，是还没伸爪。
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 38,
              padding: "30px 32px",
              borderRadius: 26,
              background: "#f3edff",
              border: "2px solid #dfd0ff",
            }}
          >
            <div style={{ fontSize: 21, color: COLORS.muted }}>现在先做</div>
            <div style={{ marginTop: 8, fontSize: 31, fontWeight: 900 }}>
              列出 3 个现成资源，马上用掉一个。
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 48,
              right: 48,
              bottom: 42,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              color: COLORS.muted,
              fontSize: 18,
            }}
          >
            <span>轻量自我观察 · 不预测命运</span>
            <span style={{ color: COLORS.violet, fontWeight: 850 }}>
              tarot-31o.pages.dev
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 1328,
            right: 140,
            maxWidth: 620,
            padding: "27px 32px",
            borderRadius: "34px 34px 8px 34px",
            color: "#fff",
            background: `linear-gradient(135deg, ${COLORS.violet}, #a55fea)`,
            boxShadow: "0 24px 60px rgba(90,53,154,0.26)",
            opacity: bubbleIn,
            transform: `translateY(${map(bubbleIn, 24, 0)}px) scale(${map(bubbleIn, 0.94, 1)})`,
            fontSize: 29,
            lineHeight: 1.35,
            fontWeight: 780,
          }}
        >
          这句像你，也可能像正在犹豫的朋友。
        </div>

        <ActionChip
          style={{
            position: "absolute",
            left: 74,
            right: 74,
            bottom: 260,
            minHeight: 92,
            opacity: shareIn,
            transform: `scale(${map(shareIn, 0.94, 1)})`,
            fontSize: 33,
          }}
        >
          发给那个正犹豫的朋友 ↗
        </ActionChip>
      </AbsoluteFill>
    </PaperBackground>
  );
};
