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

export const MIAO_MEME_AD_FPS = 30;
export const MIAO_MEME_AD_WIDTH = 1080;
export const MIAO_MEME_AD_HEIGHT = 1920;
export const MIAO_MEME_AD_DURATION = 612;

const INK = "#211426";
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
      padding: "10px 17px",
      borderRadius: 999,
      color: inverse ? "#fff" : "#48265d",
      background: inverse ? "rgba(255,255,255,0.13)" : "rgba(255,251,240,0.9)",
      border: `2px solid ${
        inverse ? "rgba(255,255,255,0.3)" : "rgba(65,34,77,0.15)"
      }`,
      fontSize: 22,
      fontWeight: 1000,
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
      padding: "10px 20px",
      borderRadius: 999,
      color: "#fff",
      background: color,
      fontSize: 23,
      lineHeight: 1,
      fontWeight: 1000,
      boxShadow: "0 10px 0 rgba(40,20,48,0.13)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Texture: React.FC<{ inverse?: boolean }> = ({ inverse = false }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity: inverse ? 0.1 : 0.15,
      backgroundImage: `radial-gradient(circle at 1px 1px, ${
        inverse ? "#fff" : "#563266"
      } 1px, transparent 1.4px)`,
      backgroundSize: "30px 30px",
    }}
  />
);

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 100], [1.02, 1.095], clamp);
  const nudge = frame > 78 ? Math.sin(frame * 1.7) * 3 : 0;
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
          objectPosition: "52% 50%",
          transform: `scale(${zoom}) translateX(${nudge}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto",
          height: 900,
          background:
            "linear-gradient(180deg, #fff9eb 0%, rgba(255,249,235,0.96) 68%, rgba(255,249,235,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          top: 58,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Badge>网友投稿 · 真的很急</Badge>
        <Badge color={INK} style={{ boxShadow: "none" }}>
          猫：你先等等
        </Badge>
      </div>
      <div
        style={{
          position: "absolute",
          left: 50,
          right: 50,
          top: 188,
          color: INK,
          fontSize: 97,
          lineHeight: 0.98,
          letterSpacing: -7,
          fontWeight: 1000,
          textShadow: "0 3px 0 #fff",
        }}
      >
        要不要约前任
      </div>
      <div
        style={{
          position: "absolute",
          left: 45,
          top: 326,
          padding: "10px 20px 19px",
          color: "#fff",
          background: "linear-gradient(110deg, #7146e7, #a651ef)",
          fontSize: 106,
          lineHeight: 0.96,
          letterSpacing: -7,
          fontWeight: 1000,
          transform: "rotate(-1.5deg)",
          boxShadow: "0 17px 0 rgba(55,30,68,0.14)",
        }}
      >
        吃生姜刺身？
      </div>
      <Brand style={{ position: "absolute", left: 52, bottom: 62 }} />
    </AbsoluteFill>
  );
};

const HuhScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = enter(frame, 0, 5);
  const shake = Math.sin(frame * 2.2) * interpolate(frame, [0, 18], [18, 2], clamp);
  const zoom = interpolate(frame, [0, 42], [1.55, 1.78], clamp);
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: "#1b0f21",
        transform: `translateX(${shake}px)`,
      }}
    >
      <Img
        src={staticFile("assets/the-moon.avif")}
        style={{
          position: "absolute",
          inset: -80,
          width: 1240,
          height: 2080,
          objectFit: "cover",
          transform: `scale(${zoom})`,
          filter: "contrast(1.12) saturate(1.15)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 45%, rgba(0,0,0,0.02), rgba(23,8,29,0.82) 75%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 320,
          textAlign: "center",
          color: "#fff",
          fontSize: 280,
          lineHeight: 0.9,
          fontWeight: 1000,
          letterSpacing: -18,
          textShadow: "0 20px 0 #f05a32, 0 34px 70px rgba(0,0,0,0.7)",
          transform: `scale(${map(pop, 0.5, 1.08)}) rotate(-4deg)`,
        }}
      >
        哈？
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 260,
          textAlign: "center",
          color: "#ffe79d",
          fontSize: 34,
          fontWeight: 1000,
        }}
      >
        （猫脑加载失败）
      </div>
    </AbsoluteFill>
  );
};

const ModeAndFlipScene: React.FC = () => {
  const frame = useCurrentFrame();
  const uiIn = enter(frame, 0, 7);
  const cards = [
    ["assets/the-moon.avif", "月亮", -8, 34, 116],
    ["assets/the-tower.avif", "高塔", 0, 50, 375],
    ["assets/the-fool.avif", "愚人", 8, 66, 634],
  ] as const;
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: "#fff",
        background: "linear-gradient(150deg, #160b1c, #35164c 58%, #7040c6)",
      }}
    >
      <Texture inverse />
      <Brand inverse style={{ position: "absolute", left: 52, top: 58 }} />
      <Badge style={{ position: "absolute", right: 52, top: 58 }}>
        真人真产品
      </Badge>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 190,
          padding: "24px 26px",
          borderRadius: 31,
          background: "#fff",
          boxShadow: "0 34px 75px rgba(0,0,0,0.33)",
          opacity: uiIn,
          transform: `translateY(${map(uiIn, 55, 0)}px)`,
        }}
      >
        <Img
          src={staticFile("assets/real-voice-mode-picker.png")}
          style={{ width: "100%", display: "block", imageRendering: "auto" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 665,
          textAlign: "center",
          fontSize: 72,
          lineHeight: 1,
          fontWeight: 1000,
        }}
      >
        发疯模式
        <span style={{ color: GOLD }}>启动</span>
      </div>
      {cards.map(([src, label, rotate, start, x], index) => {
        const cardIn = enter(frame, start, 8);
        return (
          <div key={label}>
            <TarotCard
              width={330}
              faceSrc={src}
              label={label}
              rotate={rotate}
              flip={enter(frame, start + 4, 7)}
              style={{
                position: "absolute",
                left: x,
                top: 930,
                opacity: cardIn,
                transform: `translateY(${map(cardIn, -280, 0)}px) scale(${map(
                  cardIn,
                  1.25,
                  1,
                )})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + 78,
                top: 845,
                color: index === 1 ? GOLD : "#fff",
                fontSize: 68,
                fontWeight: 1000,
                opacity: cardIn,
                transform: `rotate(${rotate * -0.7}deg)`,
                textShadow: "0 8px 0 #f05a32",
              }}
            >
              喵
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const AnswerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = enter(frame, 0, 8);
  const answerIn = enter(frame, 8, 7);
  const punchIn = enter(frame, 32, 9);
  const tarotIn = enter(frame, 49, 9);
  const underline = enter(frame, 58, 8);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: PAPER }}>
      <Texture />
      <Brand style={{ position: "absolute", left: 52, top: 58 }} />
      <Badge color={VIOLET} style={{ position: "absolute", right: 52, top: 58 }}>
        Miao 发疯插嘴
      </Badge>
      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          top: 210,
          padding: "50px 46px 58px",
          borderRadius: 44,
          background: "#fff",
          border: "3px solid rgba(93,49,116,0.16)",
          boxShadow: "0 36px 82px rgba(55,29,68,0.17)",
          opacity: cardIn,
          transform: `translateY(${map(cardIn, 80, 0)}px)`,
        }}
      >
        <div
          style={{
            color: VIOLET,
            fontSize: 52,
            fontWeight: 1000,
            opacity: answerIn,
          }}
        >
          可以。
        </div>
        <div
          style={{
            marginTop: 38,
            color: INK,
            fontSize: 88,
            lineHeight: 1.02,
            letterSpacing: -6,
            fontWeight: 1000,
            opacity: punchIn,
            transform: `translateX(${map(punchIn, -65, 0)}px)`,
          }}
        >
          关系都这么
          <span style={{ color: ORANGE }}>僵</span>
          了，
          <br />
          正好
          <span style={{ position: "relative", color: VIOLET }}>
            蘸醋
            <span
              style={{
                position: "absolute",
                left: -3,
                right: map(underline, 155, -7),
                bottom: -8,
                height: 13,
                borderRadius: 999,
                background: GOLD,
                zIndex: -1,
                transform: "rotate(-2deg)",
              }}
            />
          </span>
          。
        </div>
      </div>
      <TarotCard
        width={430}
        faceSrc="assets/the-moon.avif"
        label="XVIII · 月亮"
        flip={1}
        style={{
          position: "absolute",
          left: 325,
          top: 780,
          opacity: tarotIn,
          transform: `translateY(${map(tarotIn, 120, 0)}px) scale(${map(
            tarotIn,
            0.91,
            1,
          )})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          bottom: 250,
          padding: "22px 26px",
          borderRadius: 24,
          color: "#fff",
          background: "rgba(40,20,48,0.94)",
          fontSize: 28,
          fontWeight: 900,
          opacity: enter(frame, 71, 9),
        }}
      >
        🌙 正常牌义仍在：先确认真实信号，别拿想象补空白
      </div>
    </AbsoluteFill>
  );
};

const MatchmakerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const bubbleIn = enter(frame, 0, 8);
  const replyIn = enter(frame, 13, 8);
  const exitIn = enter(frame, 58, 7);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#24112d" }}>
      <Img
        src={staticFile("assets/hook-ginger-disguise.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.42) saturate(1.1)",
          transform: `scale(${interpolate(frame, [0, 96], [1.08, 1.18], clamp)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(25,10,31,0.35), rgba(25,10,31,0.92))",
        }}
      />
      <Badge style={{ position: "absolute", left: 52, top: 58 }}>
        第二笑点
      </Badge>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 340,
          padding: "40px 39px 48px",
          borderRadius: "39px 39px 39px 10px",
          color: INK,
          background: "rgba(255,250,241,0.97)",
          boxShadow: "0 34px 72px rgba(0,0,0,0.3)",
          opacity: bubbleIn,
          transform: `translateY(${map(bubbleIn, 65, 0)}px)`,
        }}
      >
        <div style={{ fontSize: 29, fontWeight: 1000, color: "#725e78" }}>
          月老 🧵
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 82,
            lineHeight: 1.02,
            letterSpacing: -5,
            fontWeight: 1000,
            opacity: replyIn,
          }}
        >
          我只牵线，
          <br />
          <span style={{ color: ORANGE }}>不腌姜。</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 92,
          right: 92,
          top: 900,
          padding: "23px 30px",
          borderRadius: 24,
          color: "#fff",
          background: "rgba(0,0,0,0.5)",
          textAlign: "center",
          fontSize: 33,
          fontWeight: 1000,
          opacity: exitIn,
          transform: `scale(${map(exitIn, 0.88, 1)})`,
        }}
      >
        “月老”已退出群聊
      </div>
    </AbsoluteFill>
  );
};

const ProductProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const leftIn = enter(frame, 0, 7);
  const rightIn = enter(frame, 10, 7);
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: "#fff",
        background: "linear-gradient(150deg, #160c1b, #3a1850 58%, #7140c5)",
      }}
    >
      <Texture inverse />
      <Brand inverse style={{ position: "absolute", left: 52, top: 58 }} />
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          top: 190,
          fontSize: 72,
          lineHeight: 1,
          letterSpacing: -4,
          fontWeight: 1000,
        }}
      >
        不是概念稿
        <br />
        <span style={{ color: GOLD }}>真有这个模式</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 520,
          display: "grid",
          gap: 30,
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 31,
            background: "#fff",
            opacity: leftIn,
            transform: `translateX(${map(leftIn, -90, 0)}px) rotate(-1deg)`,
            boxShadow: "0 32px 70px rgba(0,0,0,0.28)",
          }}
        >
          <Img
            src={staticFile("assets/real-voice-mode-picker.png")}
            style={{ display: "block", width: "100%" }}
          />
        </div>
        <div
          style={{
            padding: 24,
            borderRadius: 31,
            background: "#fff",
            opacity: rightIn,
            transform: `translateX(${map(rightIn, 90, 0)}px) rotate(1deg)`,
            boxShadow: "0 32px 70px rgba(0,0,0,0.28)",
          }}
        >
          <Img
            src={staticFile("assets/real-chaos-interpretation.png")}
            style={{ display: "block", width: "100%" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 7);
  const tagIn = enter(frame, 18, 8);
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
          filter: "brightness(0.44) saturate(1.18)",
          transform: `scale(${interpolate(frame, [0, 122], [1.06, 1.16], clamp)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(25,12,31,0.86), rgba(25,12,31,0.38) 69%, rgba(25,12,31,0.94))",
        }}
      />
      <Brand inverse style={{ position: "absolute", left: 52, top: 58 }} />
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          top: 238,
          color: "#fff",
          fontSize: 91,
          lineHeight: 1,
          letterSpacing: -6,
          fontWeight: 1000,
          opacity: titleIn,
          transform: `translateY(${map(titleIn, 55, 0)}px)`,
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
          left: 52,
          top: 660,
          padding: "15px 25px 18px",
          color: "#fff",
          background: ORANGE,
          fontSize: 44,
          fontWeight: 1000,
          opacity: tagIn,
          transform: `rotate(-2deg) scale(${map(tagIn, 0.86, 1)})`,
          boxShadow: "0 17px 0 rgba(0,0,0,0.2)",
        }}
      >
        下一题，猫亲自发疯 ↓
      </div>
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          bottom: 245,
          color: "rgba(255,255,255,0.8)",
          fontSize: 27,
          lineHeight: 1.42,
          fontWeight: 900,
        }}
      >
        认真抽牌 · 保留正常牌义
        <br />
        只让猫嘴失控
      </div>
    </AbsoluteFill>
  );
};

const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 6], [0, 0.85, 0], clamp);
  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", opacity, background: "#fff1bd" }}
    />
  );
};

const MemeAudio: React.FC = () => (
  <>
    <Sequence durationInFrames={100} premountFor={MIAO_MEME_AD_FPS}>
      <Audio src={staticFile("audio/miao-meme-question.wav")} volume={1.1} />
    </Sequence>
    <Sequence from={100} durationInFrames={42} premountFor={MIAO_MEME_AD_FPS}>
      <Audio src={staticFile("audio/miao-reaction-meow.wav")} volume={1.15} />
    </Sequence>
    <Sequence from={142} durationInFrames={60} premountFor={MIAO_MEME_AD_FPS}>
      <Audio src={staticFile("audio/miao-meme-launch.wav")} volume={1.08} />
    </Sequence>
    {[
      [176, "audio/miao-flip-meow-1.wav"],
      [192, "audio/miao-flip-meow-2.wav"],
      [208, "audio/miao-flip-meow-3.wav"],
    ].map(([from, src]) => (
      <Sequence
        key={src}
        from={Number(from)}
        durationInFrames={42}
        premountFor={MIAO_MEME_AD_FPS}
      >
        <Audio src={staticFile(String(src))} volume={1.08} />
      </Sequence>
    ))}
    <Sequence from={226} durationInFrames={108} premountFor={MIAO_MEME_AD_FPS}>
      <Audio src={staticFile("audio/miao-meme-answer.wav")} volume={1.1} />
    </Sequence>
    <Sequence from={334} durationInFrames={96} premountFor={MIAO_MEME_AD_FPS}>
      <Audio
        src={staticFile("audio/miao-meme-matchmaker.wav")}
        volume={1.08}
      />
    </Sequence>
    <Sequence from={430} durationInFrames={182} premountFor={MIAO_MEME_AD_FPS}>
      <Audio
        src={staticFile("audio/miao-outro-purr.wav")}
        volume={(frame) =>
          interpolate(frame, [0, 18, 140, 181], [0, 0.2, 0.2, 0], clamp)
        }
        loop
      />
    </Sequence>
    <Sequence from={490} durationInFrames={122} premountFor={MIAO_MEME_AD_FPS}>
      <Audio
        src={staticFile("audio/miao-meme-cta.wav")}
        playbackRate={1.15}
        volume={1.1}
      />
    </Sequence>
    {[142, 430, 490].map((from) => (
      <Sequence
        key={`tap-${from}`}
        from={from}
        durationInFrames={18}
        premountFor={MIAO_MEME_AD_FPS}
      >
        <Audio src={staticFile("audio/sfx-touch-hot.wav")} volume={0.48} />
      </Sequence>
    ))}
  </>
);

export const MiaoTarotMemeAd: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <Sequence durationInFrames={100} premountFor={MIAO_MEME_AD_FPS}>
      <HookScene />
    </Sequence>
    <Sequence from={100} durationInFrames={42} premountFor={MIAO_MEME_AD_FPS}>
      <HuhScene />
    </Sequence>
    <Sequence from={142} durationInFrames={84} premountFor={MIAO_MEME_AD_FPS}>
      <ModeAndFlipScene />
    </Sequence>
    <Sequence from={226} durationInFrames={108} premountFor={MIAO_MEME_AD_FPS}>
      <AnswerScene />
    </Sequence>
    <Sequence from={334} durationInFrames={96} premountFor={MIAO_MEME_AD_FPS}>
      <MatchmakerScene />
    </Sequence>
    <Sequence from={430} durationInFrames={60} premountFor={MIAO_MEME_AD_FPS}>
      <ProductProofScene />
    </Sequence>
    <Sequence from={490} durationInFrames={122} premountFor={MIAO_MEME_AD_FPS}>
      <CtaScene />
    </Sequence>
    {[100, 142, 226, 334, 430, 490].map((cut) => (
      <Sequence
        key={`flash-${cut}`}
        from={cut - 2}
        durationInFrames={7}
        premountFor={MIAO_MEME_AD_FPS}
      >
        <CutFlash />
      </Sequence>
    ))}
    <MemeAudio />
  </AbsoluteFill>
);
