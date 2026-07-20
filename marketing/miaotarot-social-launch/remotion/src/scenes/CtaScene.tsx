import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ActionChip, BrandPill, TarotCard } from "../components";
import { COLORS, SCENES } from "../constants";
import { enter, map, sceneOpacity } from "../motion";

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 4, 18);
  const ctaIn = enter(frame, 35, 18);
  const trustIn = enter(frame, 58, 16);
  const fanIn = enter(frame, 17, 20);

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity(frame, SCENES.cta.duration, true, false),
        overflow: "hidden",
        background: "#1e122b",
        color: "#fff",
      }}
    >
      <Img
        src={staticFile("assets/miao-hero.jpg")}
        style={{
          position: "absolute",
          width: 1540,
          height: 850,
          left: -305,
          top: -10,
          objectFit: "cover",
          objectPosition: "78% 48%",
          transform: `scale(${1.03 + frame * 0.00055})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(21,8,34,0.02) 0%, rgba(21,8,34,0.18) 28%, #1e122b 46%, #1e122b 100%)",
        }}
      />

      <div style={{ position: "absolute", left: 72, top: 84 }}>
        <BrandPill inverse />
      </div>

      <div
        style={{
          position: "absolute",
          top: 730,
          left: 72,
          right: 72,
          opacity: titleIn,
          transform: `translateY(${map(titleIn, 54, 0)}px)`,
        }}
      >
        <div
          style={{
            fontSize: 108,
            lineHeight: 0.98,
            fontWeight: 950,
            letterSpacing: -6,
          }}
        >
          换个角度
          <br />
          <span style={{ color: "#ffd56d" }}>看清问题</span>
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 34,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          猫不会替你做决定，
          <br />
          但会陪你找到下一步。
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          top: 1118,
          padding: "16px 22px",
          borderRadius: 18,
          border: "2px solid rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.82)",
          fontSize: 24,
          fontWeight: 760,
          letterSpacing: 0.5,
          opacity: trustIn,
        }}
      >
        写下困惑 → 抽一张猫 → 带走一步
      </div>

      <div
        style={{
          position: "absolute",
          top: 1030,
          right: 26,
          width: 500,
          height: 470,
          opacity: fanIn,
          transform: `translateY(${map(fanIn, 90, 0)}px)`,
        }}
      >
        <TarotCard
          width={240}
          flip={1}
          faceSrc="assets/the-fool.avif"
          label="0 · 愚者"
          rotate={-13}
          style={{ position: "absolute", left: 0, top: 50 }}
        />
        <TarotCard
          width={265}
          flip={1}
          faceSrc="assets/the-star.avif"
          label="XVII · 星星"
          rotate={9}
          style={{ position: "absolute", left: 210, top: 0 }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 360,
          opacity: ctaIn,
          transform: `translateY(${map(ctaIn, 30, 0)}px)`,
        }}
      >
        <ActionChip
          style={{
            width: "100%",
            minHeight: 104,
            fontSize: 38,
            background: "#fff",
            color: COLORS.violetDark,
            boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
          }}
        >
          打开 MiaoTarot →
        </ActionChip>
        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            color: "#decfff",
            fontSize: 26,
            fontWeight: 750,
            letterSpacing: 1,
          }}
        >
          免下载 · 30 秒可玩
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 180,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: trustIn,
          fontSize: 22,
          color: "rgba(255,255,255,0.7)",
        }}
      >
        <span>轻量自我观察 · 不预测命运</span>
        <span style={{ color: "#fff", fontWeight: 800 }}>
          tarot-31o.pages.dev
        </span>
      </div>
    </AbsoluteFill>
  );
};
