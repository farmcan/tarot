import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ActionChip,
  BrandPill,
  PaperBackground,
  PhoneShell,
  TapTarget,
  TarotCard,
} from "../components";
import { COLORS, SCENES } from "../constants";
import { enter, map, sceneOpacity } from "../motion";

export const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneIn = enter(frame, 2, 18);
  const cardsIn = enter(frame, 19, 18);
  const tap = enter(frame, 66, 18);
  const flip = enter(frame, 86, 24);
  const tapPulse = (Math.sin(frame / 5) + 1) / 2;

  return (
    <PaperBackground tint="violet">
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.proof.duration, true, true),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 76,
            right: 76,
            top: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <BrandPill text="MIAOTAROT · 真实网站" />
          <ActionChip tone="plain" style={{ fontSize: 23, minHeight: 52 }}>
            30 秒可玩
          </ActionChip>
        </div>

        <PhoneShell
          style={{
            position: "absolute",
            left: "50%",
            top: 226,
            transform: `translateX(-50%) translateY(${map(phoneIn, 80, 0)}px) scale(${map(phoneIn, 0.94, 1)})`,
            opacity: phoneIn,
          }}
        >
          <div
            style={{
              padding: "78px 42px 46px",
              height: "100%",
              color: COLORS.ink,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 25,
                borderBottom: "2px solid #e5ddee",
              }}
            >
              <div style={{ fontSize: 25, fontWeight: 950, letterSpacing: 2 }}>
                MIAOTAROT
              </div>
              <div style={{ fontSize: 21, color: COLORS.muted }}>一次小对话</div>
            </div>

            <div style={{ marginTop: 42, fontSize: 22, color: COLORS.violet }}>
              01 / 先说说你想看清的事
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 48,
                lineHeight: 1.1,
                fontWeight: 950,
                letterSpacing: -2,
              }}
            >
              这次想看清什么？
            </div>
            <div
              style={{
                marginTop: 24,
                border: "3px solid #d5cbe2",
                borderRadius: 22,
                minHeight: 136,
                padding: "28px 30px",
                background: "#fff",
                fontSize: 29,
                fontWeight: 700,
              }}
            >
              我现在最需要看见什么？
              <span style={{ color: COLORS.violet }}>|</span>
            </div>
            <div
              style={{
                marginTop: 28,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <div style={{ fontSize: 21, color: COLORS.muted }}>选牌 1 / 1</div>
                <div style={{ fontSize: 34, fontWeight: 900, marginTop: 3 }}>
                  凭第一眼点一张
                </div>
              </div>
              <div
                style={{
                  padding: "9px 16px",
                  borderRadius: 999,
                  color: COLORS.violetDark,
                  background: COLORS.lilac,
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                猫猫塔罗
              </div>
            </div>

            <div
              style={{
                position: "relative",
                marginTop: 44,
                height: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingInline: 24,
                opacity: cardsIn,
                transform: `translateY(${map(cardsIn, 54, 0)}px)`,
              }}
            >
              <TarotCard
                width={205}
                backSrc="assets/moon-atlas-left.avif"
                rotate={-7}
              />
              <TarotCard
                width={220}
                backSrc="assets/moon-atlas-middle.avif"
                flip={flip}
                style={{ transform: `translateY(${map(tap, 0, -18)}px)` }}
              />
              <TarotCard
                width={205}
                backSrc="assets/moon-atlas-right.avif"
                rotate={7}
              />
              {tap > 0 && flip < 0.75 ? (
                <TapTarget
                  progress={tapPulse}
                  label={tap > 0.65 ? "翻开" : "点"}
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                marginTop: 34,
                height: 88,
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                background: `linear-gradient(135deg, ${COLORS.violet}, #9e5dec)`,
                boxShadow: "0 20px 42px rgba(114,72,235,0.28)",
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              {flip > 0.72 ? "魔术师 · 已翻开" : "翻开这张猫牌"}
            </div>
            <div
              style={{
                marginTop: 24,
                textAlign: "center",
                fontSize: 20,
                color: COLORS.muted,
              }}
            >
              猫不会替你做决定，只陪你换个角度。
            </div>
          </div>
        </PhoneShell>
      </AbsoluteFill>
    </PaperBackground>
  );
};
