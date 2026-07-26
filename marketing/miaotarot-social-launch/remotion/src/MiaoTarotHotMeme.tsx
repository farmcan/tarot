import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ActionChip, BrandPill, PaperBackground, TarotCard } from "./components";
import { COLORS } from "./constants";
import { enter, map } from "./motion";

export const HOT_MEME_FPS = 30;
export const HOT_MEME_WIDTH = 1080;
export const HOT_MEME_HEIGHT = 1920;
export const HOT_MEME_DURATION = 540;

export type HotHookVariant = "ginger" | "faucet";

const hookCopy: Record<
  HotHookVariant,
  { asset: string; lines: string[]; accent: string }
> = {
  ginger: {
    asset: "assets/hook-ginger-disguise.png",
    lines: ["生姜伪装成土豆", "接近我", "到底图什么？"],
    accent: "到底图什么？",
  },
  faucet: {
    asset: "assets/hook-faucet-bomb.png",
    lines: ["我洗澡是在调水温", "还是在拆弹？"],
    accent: "还是在拆弹？",
  },
};

export const HotMemeHook: React.FC<{ variant: HotHookVariant }> = ({
  variant,
}) => {
  const frame = useCurrentFrame();
  const copy = hookCopy[variant];
  const zoom = interpolate(frame, [0, 44], [1, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#f7edd9" }}>
      <Img
        src={staticFile(copy.asset)}
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
          inset: "0 0 auto 0",
          height: 680,
          background:
            "linear-gradient(180deg, rgba(255,249,236,0.98) 0%, rgba(255,249,236,0.88) 68%, rgba(255,249,236,0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            padding: "13px 21px",
            borderRadius: 999,
            color: "#fff",
            background: "#ef5c37",
            fontSize: 25,
            fontWeight: 900,
            letterSpacing: 1,
            boxShadow: "0 10px 0 rgba(97,37,22,0.14)",
            transform: "rotate(-1.5deg)",
          }}
        >
          #全宇宙最阴的物件
        </div>
        <div
          style={{
            fontSize: 23,
            fontWeight: 950,
            letterSpacing: 2.5,
            color: COLORS.violetDark,
          }}
        >
          MIAOTAROT
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 170,
          color: "#221427",
          fontSize: variant === "ginger" ? 91 : 88,
          lineHeight: 0.98,
          letterSpacing: -5,
          fontWeight: 1000,
          textShadow: "0 3px 0 rgba(255,255,255,0.8)",
        }}
      >
        {copy.lines.map((line) => (
          <div
            key={line}
            style={{
              width: "fit-content",
              marginTop: 8,
              padding:
                line === copy.accent ? "6px 16px 12px 12px" : undefined,
              color: line === copy.accent ? "#fff" : undefined,
              background:
                line === copy.accent
                  ? "linear-gradient(100deg, #6e42e8, #9c5cf1)"
                  : undefined,
              transform:
                line === copy.accent ? "rotate(-1.2deg)" : undefined,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 64,
          bottom: 72,
          padding: "15px 22px",
          borderRadius: 18,
          background: "rgba(255,250,239,0.88)",
          border: "2px solid rgba(58,35,60,0.15)",
          fontSize: 25,
          fontWeight: 850,
          color: "#332037",
          backdropFilter: "blur(12px)",
        }}
      >
        今天给塔罗问点没用的 · 01
      </div>
    </AbsoluteFill>
  );
};

const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneIn = enter(frame, 0, 13);
  const chaosIn = enter(frame, 15, 9);
  const buttonTap = enter(frame, 38, 7);

  return (
    <PaperBackground tint="violet">
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <BrandPill text="MIAOTAROT · 真实产品" />
        <ActionChip tone="gold" style={{ minHeight: 52, fontSize: 23 }}>
          你还真问啊？
        </ActionChip>
      </div>

      <div
        style={{
          position: "absolute",
          left: 92,
          right: 92,
          top: 200,
          bottom: 180,
          padding: "52px 48px",
          borderRadius: 52,
          background: "rgba(255,255,255,0.94)",
          border: "3px solid rgba(114,72,235,0.2)",
          boxShadow: "0 38px 90px rgba(53,32,76,0.18)",
          transform: `translateY(${map(phoneIn, 90, 0)}px) scale(${map(phoneIn, 0.96, 1)})`,
          opacity: phoneIn,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 27,
            borderBottom: "2px solid #e9e1f0",
          }}
        >
          <div style={{ fontSize: 29, fontWeight: 1000, letterSpacing: 2 }}>
            MIAOTAROT
          </div>
          <div style={{ fontSize: 23, color: COLORS.muted }}>
            一场 60 秒的小小自我对话
          </div>
        </div>

        <div
          style={{
            marginTop: 38,
            color: COLORS.violetDark,
            fontSize: 24,
            fontWeight: 850,
          }}
        >
          这次想问猫什么？
        </div>
        <div
          style={{
            marginTop: 12,
            minHeight: 186,
            padding: "30px 31px",
            borderRadius: 25,
            border: "3px solid #d9cdea",
            background: "#fff",
            fontSize: 37,
            lineHeight: 1.25,
            fontWeight: 850,
            letterSpacing: -1,
          }}
        >
          菜里的生姜伪装成土豆接近我，它到底图什么？
        </div>

        <div
          style={{
            marginTop: 43,
            fontSize: 25,
            fontWeight: 900,
            color: "#382440",
          }}
        >
          猫猫用哪种语气回答？
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 17 }}>
          <div
            style={{
              flex: 1,
              minHeight: 112,
              padding: "20px 22px",
              borderRadius: 22,
              background: "#f5f0f8",
              border: "3px solid #ded3e7",
              color: COLORS.muted,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 900 }}>🐈 正常模式</div>
            <div style={{ marginTop: 7, fontSize: 20 }}>温柔地把话说清楚</div>
          </div>
          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: 112,
              padding: "20px 22px",
              borderRadius: 22,
              background: `linear-gradient(135deg, ${COLORS.violet}, #9d5bed)`,
              border: "3px solid #4f28ae",
              color: "#fff",
              boxShadow: "0 20px 35px rgba(114,72,235,0.25)",
              transform: `scale(${map(chaosIn, 0.95, 1)})`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 1000 }}>💥 发疯模式</div>
            <div style={{ marginTop: 7, fontSize: 20 }}>
              牌义照旧，猫嘴失控
            </div>
            <div
              style={{
                position: "absolute",
                width: 68,
                height: 68,
                right: -20,
                top: -23,
                borderRadius: "50%",
                border: `5px solid rgba(239,92,55,${0.9 - chaosIn * 0.35})`,
                boxShadow: `0 0 0 ${12 + chaosIn * 13}px rgba(239,92,55,${0.2 - chaosIn * 0.1})`,
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 44,
            minHeight: 96,
            borderRadius: 25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: `linear-gradient(135deg, ${COLORS.violetDark}, #8d50e7)`,
            fontSize: 34,
            fontWeight: 950,
            transform: `scale(${1 - buttonTap * 0.035})`,
            boxShadow: "0 22px 42px rgba(76,39,171,0.28)",
          }}
        >
          和猫猫聊一下
        </div>

        <div
          style={{
            marginTop: 31,
            padding: "23px 27px",
            borderRadius: 22,
            background: "#fff6dc",
            color: "#654a13",
            fontSize: 25,
            lineHeight: 1.35,
            fontWeight: 750,
          }}
        >
          同一张牌 · 同一牌义 · 只换说法
        </div>
      </div>
    </PaperBackground>
  );
};

const CardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cardsIn = enter(frame, 0, 12);
  const flip = enter(frame, 12, 22);
  const glow = (Math.sin(frame / 4) + 1) / 2;

  return (
    <PaperBackground tint="night">
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 78,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <BrandPill inverse text="MIAOTAROT · 1 / 3" />
        <ActionChip tone="gold" style={{ minHeight: 50, fontSize: 22 }}>
          发疯模式 ON
        </ActionChip>
      </div>

      <div
        style={{
          position: "absolute",
          top: 218,
          left: 64,
          right: 64,
          textAlign: "center",
          fontSize: 74,
          lineHeight: 1.06,
          fontWeight: 1000,
          letterSpacing: -4,
        }}
      >
        这题居然
        <br />
        抽到了<span style={{ color: "#ffd36b" }}>月亮</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: -120,
          top: 690,
          opacity: 0.52 * cardsIn,
          transform: `rotate(-12deg) translateY(${map(cardsIn, 80, 0)}px)`,
        }}
      >
        <TarotCard width={350} />
      </div>
      <div
        style={{
          position: "absolute",
          right: -120,
          top: 690,
          opacity: 0.52 * cardsIn,
          transform: `rotate(12deg) translateY(${map(cardsIn, 80, 0)}px)`,
        }}
      >
        <TarotCard width={350} backSrc="assets/moon-atlas-right.avif" />
      </div>
      <TarotCard
        width={550}
        flip={flip}
        faceSrc="assets/the-moon.avif"
        label="XVIII · 月亮"
        style={{
          position: "absolute",
          left: "50%",
          top: 590,
          transform: `translateX(-50%) translateY(${map(cardsIn, 110, 0)}px) scale(${0.96 + glow * 0.015})`,
          opacity: cardsIn,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 78,
          right: 78,
          bottom: 310,
          textAlign: "center",
          fontSize: 28,
          fontWeight: 850,
          color: "rgba(255,255,255,0.78)",
        }}
      >
        月亮 · 幻象 / 不确定 / 别把第一眼当事实
      </div>
    </PaperBackground>
  );
};

const AnswerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = enter(frame, 0, 12);
  const setupIn = enter(frame, 7, 11);
  const punchIn = enter(frame, 20, 12);
  const underline = enter(frame, 39, 10);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#f8efdc" }}>
      <Img
        src={staticFile("assets/hook-ginger-disguise.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "saturate(0.75)",
          opacity: 0.48,
          transform: "scale(1.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,250,240,0.93), rgba(255,250,240,0.84) 64%, rgba(87,48,109,0.64))",
        }}
      />

      <div style={{ position: "absolute", left: 62, top: 66 }}>
        <BrandPill text="MIAOTAROT · 猫猫回话" />
      </div>
      <ActionChip
        tone="gold"
        style={{ position: "absolute", right: 62, top: 66, fontSize: 22 }}
      >
        本次演示 · 每次不同
      </ActionChip>

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          top: 205,
          padding: "48px 48px 55px",
          borderRadius: 42,
          background: "rgba(255,255,255,0.95)",
          border: "3px solid rgba(94,51,123,0.18)",
          boxShadow: "0 34px 80px rgba(52,30,70,0.18)",
          opacity: cardIn,
          transform: `translateY(${map(cardIn, 65, 0)}px)`,
        }}
      >
        <div
          style={{
            fontSize: 29,
            lineHeight: 1.3,
            color: COLORS.violetDark,
            fontWeight: 900,
            opacity: setupIn,
          }}
        >
          月亮牌提醒你识别幻象。
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 74,
            lineHeight: 1.05,
            letterSpacing: -4,
            fontWeight: 1000,
            opacity: punchIn,
            transform: `translateX(${map(punchIn, -35, 0)}px)`,
          }}
        >
          它图的不是你，
          <br />
          是你
          <span style={{ position: "relative", color: "#ef5c37" }}>
            毫无防备
            <span
              style={{
                position: "absolute",
                left: -5,
                right: map(underline, 185, -8),
                bottom: -9,
                height: 12,
                borderRadius: 999,
                background: "#efb52f",
                transform: "rotate(-2deg)",
                zIndex: -1,
              }}
            />
          </span>
          的那一口。
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          bottom: 330,
          padding: "29px 34px",
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          gap: 25,
          background: "rgba(42,23,52,0.91)",
          color: "#fff",
          boxShadow: "0 26px 50px rgba(36,20,43,0.28)",
          opacity: enter(frame, 48, 13),
        }}
      >
        <div style={{ fontSize: 44 }}>🌙</div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 950 }}>
            发疯的是说法，不是牌义
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 21,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            月亮仍然对应幻象、不确定与辨别
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CommentScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 12);
  const chipsIn = enter(frame, 12, 12);
  const loopIn = enter(frame, 42, 14);

  return (
    <PaperBackground>
      <div style={{ position: "absolute", left: 66, top: 68 }}>
        <BrandPill text="今天给塔罗问点没用的 · 01" />
      </div>
      <div
        style={{
          position: "absolute",
          left: 66,
          right: 66,
          top: 255,
          fontSize: 91,
          lineHeight: 1.04,
          fontWeight: 1000,
          letterSpacing: -5,
          opacity: titleIn,
          transform: `translateY(${map(titleIn, 55, 0)}px)`,
        }}
      >
        下一个
        <br />
        <span style={{ color: "#ef5c37" }}>最阴物件</span>
        <br />
        猫先审谁？
      </div>

      <div
        style={{
          position: "absolute",
          left: 66,
          right: 66,
          top: 650,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          opacity: chipsIn,
          transform: `translateX(${map(chipsIn, 70, 0)}px)`,
        }}
      >
        {[
          ["A", "透明胶带的开口"],
          ["B", "叠在一起的塑料凳"],
          ["C", "冷热水龙头"],
        ].map(([index, label]) => (
          <div
            key={index}
            style={{
              minHeight: 116,
              padding: "22px 30px",
              borderRadius: 26,
              display: "flex",
              alignItems: "center",
              gap: 24,
              background: "#fff",
              border: "3px solid rgba(114,72,235,0.18)",
              boxShadow: "0 18px 36px rgba(61,40,82,0.1)",
              fontSize: 33,
              fontWeight: 900,
            }}
          >
            <span
              style={{
                width: 62,
                height: 62,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                background: COLORS.violet,
                fontSize: 28,
              }}
            >
              {index}
            </span>
            {label}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 66,
          right: 66,
          bottom: 330,
          padding: "29px 34px",
          borderRadius: 28,
          textAlign: "center",
          color: "#fff",
          background: "linear-gradient(135deg, #ef5c37, #f18f3b)",
          boxShadow: "0 22px 0 rgba(119,50,27,0.14)",
          fontSize: 34,
          fontWeight: 1000,
          opacity: loopIn,
          transform: `rotate(${map(loopIn, 2.5, -1)}deg) scale(${map(loopIn, 0.92, 1)})`,
        }}
      >
        评论区留下案发现场 ↓
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 250,
          textAlign: "center",
          color: COLORS.muted,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        MiaoTarot · 正常 / 发疯两种语气
      </div>
    </PaperBackground>
  );
};

const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 6], [0, 0.75, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        background: "rgba(255,247,221,0.92)",
      }}
    />
  );
};

const HotMemeSfx: React.FC = () => (
  <>
    {[72, 100, 140, 168, 246, 390].map((from) => (
      <Sequence
        key={`touch-${from}`}
        from={from}
        durationInFrames={22}
        premountFor={HOT_MEME_FPS}
      >
        <Audio src={staticFile("audio/sfx-touch-hot.wav")} volume={0.6} />
      </Sequence>
    ))}
    <Sequence
      from={180}
      durationInFrames={34}
      premountFor={HOT_MEME_FPS}
    >
      <Audio src={staticFile("audio/sfx-flip-hot.wav")} volume={0.75} />
    </Sequence>
    <Sequence
      from={266}
      durationInFrames={46}
      premountFor={HOT_MEME_FPS}
    >
      <Audio src={staticFile("audio/sfx-chime-hot.wav")} volume={0.8} />
    </Sequence>
  </>
);

export const MiaoTarotHotMeme: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#f8efdc" }}>
      <Sequence durationInFrames={72} premountFor={HOT_MEME_FPS}>
        <HotMemeHook variant="ginger" />
      </Sequence>
      <Sequence from={72} durationInFrames={96} premountFor={HOT_MEME_FPS}>
        <ProductScene />
      </Sequence>
      <Sequence from={168} durationInFrames={78} premountFor={HOT_MEME_FPS}>
        <CardScene />
      </Sequence>
      <Sequence from={246} durationInFrames={144} premountFor={HOT_MEME_FPS}>
        <AnswerScene />
      </Sequence>
      <Sequence from={390} durationInFrames={150} premountFor={HOT_MEME_FPS}>
        <CommentScene />
      </Sequence>

      {[72, 168, 246, 390].map((cut) => (
        <Sequence
          key={`cut-${cut}`}
          from={cut - 2}
          durationInFrames={7}
          premountFor={HOT_MEME_FPS}
        >
          <CutFlash />
        </Sequence>
      ))}

      <Audio
        src={staticFile("audio/narration-hot-ginger-v2.wav")}
        volume={1}
      />
      <Audio
        src={staticFile("audio/hot-meme-beat.wav")}
        volume={(frame) =>
          interpolate(
            frame,
            [0, 18, 168, 181, 246, 270, 510, 539],
            [0.14, 0.18, 0.18, 0.05, 0.05, 0.14, 0.14, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )
        }
      />
      <HotMemeSfx />
    </AbsoluteFill>
  );
};
