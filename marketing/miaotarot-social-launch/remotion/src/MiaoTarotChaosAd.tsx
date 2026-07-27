import { Audio } from "@remotion/media";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { TarotCard } from "./components";
import { enter, map } from "./motion";

export const CHAOS_AD_FPS = 30;
export const CHAOS_AD_WIDTH = 1080;
export const CHAOS_AD_HEIGHT = 1920;
export const CHAOS_AD_DURATION = 450;

const INK = "#1d1422";
const PAPER = "#fff8e9";
const VIOLET = "#7248eb";
const ORANGE = "#f05a32";
const GOLD = "#ffd365";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const Brand: React.FC<{ inverse?: boolean; style?: CSSProperties }> = ({
  inverse = false,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 18px",
      borderRadius: 999,
      background: inverse ? "rgba(255,255,255,0.13)" : "rgba(255,251,240,0.9)",
      border: `2px solid ${
        inverse ? "rgba(255,255,255,0.32)" : "rgba(65,34,77,0.16)"
      }`,
      color: inverse ? "#fff" : "#48265d",
      fontSize: 22,
      fontWeight: 950,
      letterSpacing: 2.5,
      ...style,
    }}
  >
    <span style={{ color: GOLD }}>✦</span>
    MIAOTAROT
  </div>
);

const Badge: React.FC<{
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}> = ({ children, color = ORANGE, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      padding: "10px 19px",
      borderRadius: 999,
      background: color,
      color: "#fff",
      fontSize: 23,
      lineHeight: 1,
      fontWeight: 950,
      boxShadow: "0 11px 0 rgba(53,25,35,0.13)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Texture: React.FC<{ inverse?: boolean }> = ({ inverse = false }) => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: inverse ? 0.11 : 0.16,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${
          inverse ? "#fff" : "#5b376f"
        } 1px, transparent 1.4px)`,
        backgroundSize: "30px 30px",
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 580,
        height: 580,
        left: -250,
        top: 560,
        borderRadius: "50%",
        background: inverse
          ? "rgba(151,92,255,0.22)"
          : "rgba(114,72,235,0.14)",
        filter: "blur(35px)",
      }}
    />
  </>
);

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 77], [1, 1.055], clamp);
  const questionIn = enter(frame, 0, 7);
  const secondLineIn = enter(frame, 9, 7);
  const soundPulse = 1 + Math.sin(frame / 3) * 0.025;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: PAPER }}>
      <Img
        src={staticFile("assets/hook-ginger-disguise.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto",
          height: 860,
          background:
            "linear-gradient(180deg, rgba(255,249,233,1) 0%, rgba(255,249,233,0.93) 68%, rgba(255,249,233,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Badge>离谱问题 · 001</Badge>
        <Badge
          color="#2d173b"
          style={{ transform: `scale(${soundPulse})`, boxShadow: "none" }}
        >
          🔊 有声
        </Badge>
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 178,
          color: INK,
          fontSize: 95,
          lineHeight: 0.98,
          letterSpacing: -6,
          fontWeight: 1000,
          transform: `translateY(${map(questionIn, 34, 0)}px)`,
          textShadow: "0 3px 0 rgba(255,255,255,0.75)",
        }}
      >
        要不要约前任
      </div>
      <div
        style={{
          position: "absolute",
          left: 46,
          top: 302,
          padding: "8px 18px 18px",
          color: "#fff",
          background: "linear-gradient(105deg, #7248eb, #9c57ef)",
          fontSize: 105,
          lineHeight: 0.98,
          letterSpacing: -7,
          fontWeight: 1000,
          transform: `scale(${map(secondLineIn, 0.96, 1)}) rotate(-1.5deg)`,
          boxShadow: "0 16px 0 rgba(59,34,79,0.13)",
        }}
      >
        吃生姜刺身？
      </div>
      <Brand
        style={{
          position: "absolute",
          left: 54,
          bottom: 64,
        }}
      />
    </AbsoluteFill>
  );
};

const ChaosSwitchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const panelIn = enter(frame, 0, 8);
  const select = enter(frame, 17, 7);
  const tap = enter(frame, 31, 5);
  const shake = frame > 34 ? Math.sin(frame * 2.4) * (1 - tap) * 4 : 0;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: "#fff",
        background: "linear-gradient(145deg, #160d1c, #33174c 56%, #6f36bd)",
      }}
    >
      <Texture inverse />
      <Brand inverse style={{ position: "absolute", left: 54, top: 58 }} />
      <Badge
        color="#f05a32"
        style={{ position: "absolute", right: 54, top: 58 }}
      >
        正常模式先下班
      </Badge>
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top: 205,
          fontSize: 84,
          lineHeight: 1,
          letterSpacing: -5,
          fontWeight: 1000,
        }}
      >
        这题需要
        <br />
        <span style={{ color: GOLD }}>猫嘴失控</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 570,
          padding: "48px 44px 52px",
          borderRadius: 42,
          background: "rgba(255,255,255,0.95)",
          color: INK,
          boxShadow: "0 38px 90px rgba(7,3,12,0.34)",
          opacity: panelIn,
          transform: `translateY(${map(panelIn, 90, 0)}px) rotate(${shake}deg)`,
        }}
      >
        <div style={{ fontSize: 27, fontWeight: 900, color: "#6c5b75" }}>
          猫猫用哪种语气回答？
        </div>
        <div
          style={{
            marginTop: 25,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
          }}
        >
          <div
            style={{
              minHeight: 154,
              padding: "24px 22px",
              borderRadius: 25,
              border: "3px solid #e0d7e6",
              background: "#f7f3f8",
              opacity: 0.55,
            }}
          >
            <div style={{ fontSize: 29, fontWeight: 950 }}>🐈 正常模式</div>
            <div style={{ marginTop: 9, fontSize: 21, color: "#75687b" }}>
              温柔、克制、有礼貌
            </div>
          </div>
          <div
            style={{
              position: "relative",
              minHeight: 154,
              padding: "24px 22px",
              borderRadius: 25,
              border: "4px solid #ffcf5c",
              background: "linear-gradient(135deg, #6d3be3, #a54ef1)",
              color: "#fff",
              transform: `scale(${map(select, 0.93, 1.04 - tap * 0.05)})`,
              boxShadow: `0 0 0 ${map(select, 0, 16)}px rgba(255,207,92,0.16)`,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 1000 }}>💥 发疯模式</div>
            <div style={{ marginTop: 9, fontSize: 21 }}>
              牌义照旧，猫嘴放飞
            </div>
            <div
              style={{
                position: "absolute",
                width: 74,
                height: 74,
                right: -27,
                bottom: -32,
                borderRadius: "50%",
                border: "5px solid #fff",
                background: "#f05a32",
                transform: `scale(${map(tap, 1, 0.82)})`,
                boxShadow: "0 0 0 13px rgba(240,90,50,0.2)",
              }}
            />
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            minHeight: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 24,
            color: "#fff",
            background: "linear-gradient(100deg, #281432, #7248eb)",
            fontSize: 32,
            fontWeight: 1000,
          }}
        >
          开始抽牌
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 250,
          textAlign: "center",
          color: "rgba(255,255,255,0.74)",
          fontSize: 24,
          fontWeight: 850,
        }}
      >
        同一张牌 · 同一牌义 · 只换说法
      </div>
    </AbsoluteFill>
  );
};

const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 3, 8], [0.9, 0.2, 0], clamp);
  const cards = [
    {
      src: "assets/the-moon.avif",
      label: "XVIII · 月亮",
      rotate: -8,
      start: 0,
      x: 120,
    },
    {
      src: "assets/the-tower.avif",
      label: "XVI · 高塔",
      rotate: 0,
      start: 10,
      x: 375,
    },
    {
      src: "assets/the-fool.avif",
      label: "0 · 愚人",
      rotate: 8,
      start: 20,
      x: 630,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: "#fff",
        background: "linear-gradient(155deg, #120a17, #2a1241 58%, #5d2b9a)",
      }}
    >
      <Texture inverse />
      <Brand inverse style={{ position: "absolute", left: 54, top: 58 }} />
      <Badge
        color="#f05a32"
        style={{ position: "absolute", right: 54, top: 58 }}
      >
        BAM × 3
      </Badge>
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          top: 205,
          textAlign: "center",
          fontSize: 76,
          lineHeight: 1.02,
          letterSpacing: -4,
          fontWeight: 1000,
        }}
      >
        塔罗认真抽
        <br />
        <span style={{ color: GOLD }}>猫猫开始胡说</span>
      </div>
      {cards.map((card) => {
        const inProgress = enter(frame, card.start, 8);
        const flip = enter(frame, card.start + 4, 9);
        return (
          <TarotCard
            key={card.label}
            width={330}
            faceSrc={card.src}
            label={card.label}
            rotate={card.rotate}
            flip={flip}
            style={{
              position: "absolute",
              left: card.x,
              top: 680,
              opacity: inProgress,
              transform: `translateY(${map(inProgress, -260, 0)}px) scale(${map(
                inProgress,
                1.34,
                1,
              )})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 260,
          textAlign: "center",
          fontSize: 28,
          fontWeight: 900,
          color: "rgba(255,255,255,0.77)",
        }}
      >
        月亮 · 高塔 · 愚人
      </div>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: flash,
          background: "#fff5d8",
        }}
      />
    </AbsoluteFill>
  );
};

const PunchlineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = enter(frame, 0, 8);
  const yesIn = enter(frame, 5, 6);
  const punchIn = enter(frame, 16, 9);
  const underline = enter(frame, 39, 8);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: PAPER }}>
      <Img
        src={staticFile("assets/hook-ginger-disguise.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "saturate(0.8)",
          opacity: 0.42,
          transform: "scale(1.11)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,249,236,0.97), rgba(255,249,236,0.87) 69%, rgba(43,20,52,0.55))",
        }}
      />
      <Brand style={{ position: "absolute", left: 54, top: 58 }} />
      <Badge
        color="#7248eb"
        style={{ position: "absolute", right: 54, top: 58 }}
      >
        猫猫回话
      </Badge>
      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          top: 220,
          padding: "54px 48px 62px",
          borderRadius: 44,
          background: "rgba(255,255,255,0.96)",
          border: "3px solid rgba(93,49,116,0.17)",
          boxShadow: "0 35px 85px rgba(55,29,68,0.18)",
          opacity: cardIn,
          transform: `translateY(${map(cardIn, 80, 0)}px)`,
        }}
      >
        <div
          style={{
            color: VIOLET,
            fontSize: 45,
            fontWeight: 1000,
            opacity: yesIn,
          }}
        >
          牌说：可以。
        </div>
        <div
          style={{
            marginTop: 35,
            color: INK,
            fontSize: 82,
            lineHeight: 1.02,
            letterSpacing: -5,
            fontWeight: 1000,
            opacity: punchIn,
            transform: `translateX(${map(punchIn, -55, 0)}px)`,
          }}
        >
          反正你们的关系
          <br />
          已经
          <span style={{ position: "relative", color: ORANGE }}>
            够呛
            <span
              style={{
                position: "absolute",
                left: -4,
                right: map(underline, 145, -7),
                bottom: -9,
                height: 12,
                borderRadius: 999,
                background: GOLD,
                zIndex: -1,
                transform: "rotate(-2deg)",
              }}
            />
          </span>
          了。
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          bottom: 275,
          padding: "23px 27px",
          borderRadius: 24,
          background: "rgba(40,20,48,0.93)",
          color: "#fff",
          fontSize: 26,
          fontWeight: 900,
          opacity: enter(frame, 45, 9),
        }}
      >
        🌙 月亮的正经牌义：别把执念误认成缘分
      </div>
    </AbsoluteFill>
  );
};

const SecondJokeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const bubbleIn = enter(frame, 0, 8);
  const replyIn = enter(frame, 13, 9);
  const readIn = enter(frame, 35, 7);
  const zoom = interpolate(frame, [0, 65], [1.12, 1.2], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#271431" }}>
      <Img
        src={staticFile("assets/hook-ginger-disguise.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "55% 47%",
          transform: `scale(${zoom})`,
          filter: "brightness(0.5) saturate(1.2)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(26,12,32,0.35), rgba(26,12,32,0.9))",
        }}
      />
      <Badge
        color="#f05a32"
        style={{
          position: "absolute",
          left: 54,
          top: 58,
          transform: "rotate(-2deg)",
        }}
      >
        第二笑点
      </Badge>
      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          top: 335,
          padding: "36px 38px",
          borderRadius: "38px 38px 38px 10px",
          color: INK,
          background: "rgba(255,250,241,0.97)",
          boxShadow: "0 32px 70px rgba(0,0,0,0.28)",
          opacity: bubbleIn,
          transform: `translateY(${map(bubbleIn, 55, 0)}px)`,
        }}
      >
        <div style={{ fontSize: 27, fontWeight: 950, color: "#725e78" }}>
          月老 🧵
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 77,
            lineHeight: 1.03,
            letterSpacing: -5,
            fontWeight: 1000,
            opacity: replyIn,
          }}
        >
          我只牵线，
          <br />
          <span style={{ color: ORANGE }}>不负责调味。</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 72,
          top: 830,
          color: "rgba(255,255,255,0.72)",
          fontSize: 24,
          fontWeight: 800,
          opacity: readIn,
        }}
      >
        已读 · 不回
      </div>
    </AbsoluteFill>
  );
};

const ProductProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 7);
  const cardsIn = enter(frame, 6, 9);
  const items = [
    ["22 / 78", "两套真牌"],
    ["6", "种牌阵"],
    ["正常 / 发疯", "两种语气"],
  ];

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: "#fff",
        background: "linear-gradient(145deg, #190e20, #411b59 58%, #7c3fd0)",
      }}
    >
      <Texture inverse />
      <Brand inverse style={{ position: "absolute", left: 54, top: 58 }} />
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 190,
          fontSize: 78,
          lineHeight: 1,
          letterSpacing: -4,
          fontWeight: 1000,
          opacity: titleIn,
        }}
      >
        不是段子生成器
        <br />
        <span style={{ color: GOLD }}>是真的能抽牌</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 545,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          opacity: cardsIn,
          transform: `translateY(${map(cardsIn, 70, 0)}px)`,
        }}
      >
        {items.map(([value, label], index) => (
          <div
            key={value}
            style={{
              minHeight: 230,
              padding: "30px 18px",
              borderRadius: 30,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              background:
                index === 2
                  ? "linear-gradient(145deg, #f05a32, #f18d38)"
                  : "rgba(255,255,255,0.13)",
              border: "2px solid rgba(255,255,255,0.28)",
              boxShadow: "0 25px 55px rgba(13,5,19,0.24)",
            }}
          >
            <div
              style={{
                fontSize: value.length > 7 ? 36 : 54,
                lineHeight: 1,
                fontWeight: 1000,
                color: index === 2 ? "#fff" : GOLD,
              }}
            >
              {value}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 24,
                fontWeight: 900,
                color: "rgba(255,255,255,0.82)",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 295,
          textAlign: "center",
          fontSize: 26,
          fontWeight: 850,
          color: "rgba(255,255,255,0.72)",
          opacity: enter(frame, 25, 9),
        }}
      >
        发疯的是说法，不是牌义
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 7);
  const tagIn = enter(frame, 11, 7);
  const zoom = interpolate(frame, [0, 44], [1.08, 1.14], clamp);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#1b1020" }}>
      <Img
        src={staticFile("assets/hook-ginger-disguise.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
          filter: "brightness(0.42) saturate(1.15)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(25,12,31,0.82), rgba(25,12,31,0.45) 68%, rgba(25,12,31,0.92))",
        }}
      />
      <Brand inverse style={{ position: "absolute", left: 54, top: 58 }} />
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 240,
          color: "#fff",
          fontSize: 90,
          lineHeight: 1,
          letterSpacing: -6,
          fontWeight: 1000,
          opacity: titleIn,
          transform: `translateY(${map(titleIn, 45, 0)}px)`,
        }}
      >
        把你的
        <br />
        <span style={{ color: GOLD }}>离谱问题</span>
        <br />
        扔进评论区
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          top: 645,
          padding: "14px 24px 17px",
          color: "#fff",
          background: ORANGE,
          fontSize: 43,
          fontWeight: 1000,
          transform: `rotate(-2deg) scale(${map(tagIn, 0.9, 1)})`,
          opacity: tagIn,
          boxShadow: "0 17px 0 rgba(0,0,0,0.19)",
        }}
      >
        下一题抽你 ↓
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 250,
          color: "rgba(255,255,255,0.78)",
          fontSize: 25,
          lineHeight: 1.4,
          fontWeight: 850,
        }}
      >
        MiaoTarot
        <br />
        认真抽牌，不认真说话
      </div>
    </AbsoluteFill>
  );
};

const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 6], [0, 0.82, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        background: "#fff3cc",
      }}
    />
  );
};

const ChaosAdAudio: React.FC = () => (
  <>
    <Audio
      src={staticFile("audio/chaos-ad-beat.wav")}
      volume={(frame) =>
        interpolate(
          frame,
          [0, 6, 72, 80, 126, 132, 191, 198, 279, 286, 341, 348, 401, 407, 440, 449],
          [
            0.34, 0.46, 0.46, 0.58, 0.58, 0.68, 0.68, 0.35, 0.35, 0.38, 0.38,
            0.54, 0.54, 0.32, 0.32, 0,
          ],
          clamp,
        )
      }
    />
    <Sequence durationInFrames={78} premountFor={CHAOS_AD_FPS}>
      <Audio src={staticFile("audio/chaos-ad-question.wav")} volume={1.18} />
    </Sequence>
    <Sequence from={197} durationInFrames={85} premountFor={CHAOS_AD_FPS}>
      <Audio src={staticFile("audio/chaos-ad-answer.wav")} volume={1.2} />
    </Sequence>
    <Sequence from={282} durationInFrames={64} premountFor={CHAOS_AD_FPS}>
      <Audio src={staticFile("audio/chaos-ad-moon.wav")} volume={1.18} />
    </Sequence>
    <Sequence from={377} durationInFrames={73} premountFor={CHAOS_AD_FPS}>
      <Audio src={staticFile("audio/chaos-ad-cta.wav")} volume={1.18} />
    </Sequence>
    {[78, 348, 405].map((from) => (
      <Sequence
        key={`tap-${from}`}
        from={from}
        durationInFrames={20}
        premountFor={CHAOS_AD_FPS}
      >
        <Audio src={staticFile("audio/sfx-touch-hot.wav")} volume={0.85} />
      </Sequence>
    ))}
    {[132, 142, 152].map((from) => (
      <Sequence
        key={`flip-${from}`}
        from={from}
        durationInFrames={30}
        premountFor={CHAOS_AD_FPS}
      >
        <Audio src={staticFile("audio/sfx-flip-hot.wav")} volume={0.9} />
      </Sequence>
    ))}
    <Sequence from={198} durationInFrames={44} premountFor={CHAOS_AD_FPS}>
      <Audio src={staticFile("audio/sfx-chime-hot.wav")} volume={0.62} />
    </Sequence>
  </>
);

export const MiaoTarotChaosAd: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <Sequence durationInFrames={78} premountFor={CHAOS_AD_FPS}>
      <HookScene />
    </Sequence>
    <Sequence from={78} durationInFrames={54} premountFor={CHAOS_AD_FPS}>
      <ChaosSwitchScene />
    </Sequence>
    <Sequence from={132} durationInFrames={66} premountFor={CHAOS_AD_FPS}>
      <RevealScene />
    </Sequence>
    <Sequence from={198} durationInFrames={84} premountFor={CHAOS_AD_FPS}>
      <PunchlineScene />
    </Sequence>
    <Sequence from={282} durationInFrames={66} premountFor={CHAOS_AD_FPS}>
      <SecondJokeScene />
    </Sequence>
    <Sequence from={348} durationInFrames={57} premountFor={CHAOS_AD_FPS}>
      <ProductProofScene />
    </Sequence>
    <Sequence from={405} durationInFrames={45} premountFor={CHAOS_AD_FPS}>
      <CtaScene />
    </Sequence>

    {[78, 132, 198, 282, 348, 405].map((cut) => (
      <Sequence
        key={`flash-${cut}`}
        from={cut - 2}
        durationInFrames={7}
        premountFor={CHAOS_AD_FPS}
      >
        <CutFlash />
      </Sequence>
    ))}
    <ChaosAdAudio />
  </AbsoluteFill>
);
