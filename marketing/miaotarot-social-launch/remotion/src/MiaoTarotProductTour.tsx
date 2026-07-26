import { Audio } from "@remotion/media";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ActionChip, BrandPill, PaperBackground, TarotCard } from "./components";
import { COLORS } from "./constants";
import { HotMemeHook } from "./MiaoTarotHotMeme";
import { enter, map } from "./motion";

export const PRODUCT_TOUR_FPS = 30;
export const PRODUCT_TOUR_WIDTH = 1080;
export const PRODUCT_TOUR_HEIGHT = 1920;
export const PRODUCT_TOUR_DURATION = 1170;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const productTourScenes = {
  hook: { from: 0, duration: 90 },
  setup: { from: 90, duration: 120 },
  decks: { from: 210, duration: 180 },
  spreads: { from: 390, duration: 180 },
  draw: { from: 570, duration: 180 },
  meaning: { from: 750, duration: 180 },
  actions: { from: 930, duration: 150 },
  close: { from: 1080, duration: 90 },
} as const;

const SoundBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = (Math.sin(frame / 4) + 1) / 2;

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 80,
        right: 58,
        bottom: 78,
        minHeight: 62,
        padding: "13px 20px",
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(27,17,34,0.86)",
        border: "2px solid rgba(255,255,255,0.28)",
        boxShadow: "0 16px 40px rgba(27,17,34,0.24)",
        color: "#fff",
        fontSize: 24,
        fontWeight: 900,
      }}
    >
      <span style={{ fontSize: 27 }}>🔊</span>
      有声口播
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            style={{
              display: "block",
              width: 5,
              height: 15 + pulse * 18 + index * 3,
              borderRadius: 999,
              background: index === 1 ? "#ffd36b" : "#fff",
            }}
          />
        ))}
      </span>
    </div>
  );
};

const SceneHeader: React.FC<{
  step: string;
  tag?: string;
  inverse?: boolean;
}> = ({ step, tag, inverse = false }) => (
  <div
    style={{
      position: "absolute",
      left: 58,
      right: 58,
      top: 58,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
    }}
  >
    <BrandPill inverse={inverse} text={`MIAOTAROT · ${step}`} />
    {tag ? (
      <ActionChip
        tone={inverse ? "gold" : "plain"}
        style={{ minHeight: 52, padding: "10px 18px", fontSize: 21 }}
      >
        {tag}
      </ActionChip>
    ) : null}
  </div>
);

const StageTitle: React.FC<{
  eyebrow?: string;
  children: ReactNode;
  style?: CSSProperties;
}> = ({ eyebrow, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: 62,
      right: 62,
      top: 180,
      textAlign: "center",
      ...style,
    }}
  >
    {eyebrow ? (
      <div
        style={{
          color: COLORS.violet,
          fontSize: 26,
          fontWeight: 950,
          letterSpacing: 2,
        }}
      >
        {eyebrow}
      </div>
    ) : null}
    <div
      style={{
        marginTop: eyebrow ? 13 : 0,
        color: "inherit",
        fontSize: 76,
        lineHeight: 1.02,
        fontWeight: 1000,
        letterSpacing: -4,
      }}
    >
      {children}
    </div>
  </div>
);

const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneIn = enter(frame, 0, 14);
  const chaosIn = enter(frame, 36, 11);
  const footerIn = enter(frame, 72, 12);
  const tap = enter(frame, 92, 8);

  return (
    <PaperBackground tint="violet">
      <SceneHeader step="真实产品" tag="01 / 先说问题" />
      <div
        style={{
          position: "absolute",
          left: 76,
          right: 76,
          top: 160,
          bottom: 260,
          padding: "38px 39px",
          borderRadius: 46,
          background: "rgba(255,255,255,0.96)",
          border: "3px solid rgba(114,72,235,0.2)",
          boxShadow: "0 38px 90px rgba(53,32,76,0.18)",
          opacity: phoneIn,
          transform: `translateY(${map(phoneIn, 70, 0)}px)`,
        }}
      >
        <div
          style={{
            color: COLORS.violet,
            fontSize: 22,
            fontWeight: 900,
          }}
        >
          这次最想问 Miao 的问题
        </div>
        <div
          style={{
            marginTop: 12,
            minHeight: 190,
            padding: "28px 30px",
            borderRadius: 25,
            border: "3px solid #d9cdea",
            background: "#fff",
            fontSize: 39,
            lineHeight: 1.24,
            fontWeight: 900,
            letterSpacing: -1,
          }}
        >
          生姜伪装成土豆接近我，
          <br />
          它到底图什么？
        </div>

        <div style={{ marginTop: 31, fontSize: 25, fontWeight: 950 }}>
          猫猫怎么说
        </div>
        <div
          style={{
            marginTop: 6,
            color: COLORS.muted,
            fontSize: 20,
            fontWeight: 650,
          }}
        >
          只改变表达，不改变抽牌、正逆位或标准牌义
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 17,
            marginTop: 15,
          }}
        >
          <div
            style={{
              minHeight: 126,
              padding: "20px 21px",
              borderRadius: 22,
              background: "#f5f0f8",
              border: "3px solid #ded3e7",
              color: COLORS.muted,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 950 }}>🐈 正常模式</div>
            <div style={{ marginTop: 8, fontSize: 20 }}>
              温和、清楚，把牌义说人话
            </div>
          </div>
          <div
            style={{
              position: "relative",
              minHeight: 126,
              padding: "20px 21px",
              borderRadius: 22,
              background: `linear-gradient(135deg, ${COLORS.violet}, #9d5bed)`,
              border: "3px solid #4f28ae",
              color: "#fff",
              boxShadow: "0 20px 35px rgba(114,72,235,0.25)",
              opacity: chaosIn,
              transform: `scale(${map(chaosIn, 0.94, 1)})`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 1000 }}>💥 发疯模式</div>
            <div style={{ marginTop: 8, fontSize: 20 }}>
              梗更密、反差更大，牌义不乱改
            </div>
            <div
              style={{
                position: "absolute",
                right: 15,
                top: 13,
                width: 35,
                height: 35,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                color: COLORS.violetDark,
                fontSize: 22,
                fontWeight: 1000,
              }}
            >
              ✓
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 25,
            minHeight: 112,
            padding: "21px 23px",
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fbf9ff",
            border: "2px solid #e5dcf2",
            opacity: footerIn,
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>
              和 Miao 边翻边聊
            </div>
            <div
              style={{ marginTop: 6, color: COLORS.muted, fontSize: 19 }}
            >
              每翻一张都能解释，并允许立刻追问
            </div>
          </div>
          <div
            style={{
              width: 70,
              height: 38,
              padding: 4,
              borderRadius: 999,
              display: "flex",
              justifyContent: "flex-end",
              background: COLORS.violet,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#fff",
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            minHeight: 76,
            padding: "0 23px",
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fff",
            border: "2px solid #ded5e7",
            fontSize: 23,
            fontWeight: 850,
            opacity: footerIn,
          }}
        >
          <span>☷ 3 张牌 · 涂鸦 78 张 · 包含逆位</span>
          <span>⌄</span>
        </div>

        <div
          style={{
            marginTop: 22,
            minHeight: 88,
            borderRadius: 25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: `linear-gradient(135deg, ${COLORS.violetDark}, #8d50e7)`,
            boxShadow: "0 22px 42px rgba(76,39,171,0.28)",
            fontSize: 31,
            fontWeight: 1000,
            opacity: footerIn,
            transform: `scale(${1 - tap * 0.035})`,
          }}
        >
          ✦ 开始和 Miao 看牌
        </div>
      </div>
    </PaperBackground>
  );
};

const deckCards = [
  { src: "assets/the-fool.avif", label: "0 · 愚人", rotate: -11 },
  { src: "assets/ace-of-wands.avif", label: "权杖一", rotate: -7 },
  { src: "assets/two-of-cups.avif", label: "圣杯二", rotate: -3 },
  { src: "assets/queen-of-swords.avif", label: "宝剑王后", rotate: 3 },
  { src: "assets/ten-of-pentacles.avif", label: "星币十", rotate: 7 },
  { src: "assets/the-star.avif", label: "XVII · 星星", rotate: 11 },
] as const;

const DecksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 13);
  const fanIn = enter(frame, 25, 20);
  const panelsIn = enter(frame, 92, 14);

  return (
    <PaperBackground>
      <SceneHeader step="真实牌库" tag="两副牌可选" />
      <StageTitle eyebrow="不只有一句段子" style={{ opacity: titleIn }}>
        <span style={{ color: COLORS.violet }}>22 张</span>大牌
        <br />
        或<span style={{ color: "#ef5c37" }}>78 张</span>全牌
      </StageTitle>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 540,
          height: 760,
          opacity: fanIn,
          transform: `translateY(${map(fanIn, 85, 0)}px) scale(${map(
            fanIn,
            0.9,
            1,
          )})`,
        }}
      >
        {deckCards.map((card, index) => {
          const centerDistance = Math.abs(index - 2.5);
          return (
            <TarotCard
              key={card.src}
              width={262}
              faceSrc={card.src}
              flip={1}
              rotate={card.rotate}
              label={card.label}
              style={{
                position: "absolute",
                left: 28 + index * 154,
                top: centerDistance * 22,
                zIndex: index <= 2 ? index : 6 - index,
                filter: "drop-shadow(0 24px 28px rgba(48,27,65,0.18))",
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          bottom: 300,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
          opacity: panelsIn,
        }}
      >
        <div
          style={{
            minHeight: 214,
            padding: "27px 28px",
            borderRadius: 30,
            background: "#fff",
            border: "3px solid rgba(114,72,235,0.18)",
            boxShadow: "0 20px 42px rgba(51,31,70,0.1)",
          }}
        >
          <div style={{ fontSize: 27, fontWeight: 1000 }}>
            经典 22 张
          </div>
          <div
            style={{
              marginTop: 10,
              color: COLORS.violet,
              fontSize: 23,
              fontWeight: 900,
            }}
          >
            大阿卡纳
          </div>
          <div
            style={{
              marginTop: 16,
              color: COLORS.muted,
              fontSize: 20,
              lineHeight: 1.4,
            }}
          >
            精致猫梗塔罗插画
            <br />
            适合聚焦人生主题
          </div>
        </div>
        <div
          style={{
            minHeight: 214,
            padding: "27px 28px",
            borderRadius: 30,
            color: "#fff",
            background: `linear-gradient(135deg, ${COLORS.violetDark}, #8952e7)`,
            border: "3px solid #4d2ba4",
            boxShadow: "0 20px 42px rgba(76,39,171,0.22)",
          }}
        >
          <div style={{ fontSize: 27, fontWeight: 1000 }}>
            涂鸦 78 张
          </div>
          <div
            style={{
              marginTop: 10,
              color: "#ffd36b",
              fontSize: 23,
              fontWeight: 900,
            }}
          >
            完整塔罗牌池
          </div>
          <div
            style={{
              marginTop: 16,
              color: "rgba(255,255,255,0.78)",
              fontSize: 20,
              lineHeight: 1.4,
            }}
          >
            大牌 + 权杖 / 圣杯
            <br />
            宝剑 / 星币四花色
          </div>
        </div>
      </div>
    </PaperBackground>
  );
};

const spreadOptions = [
  { name: "单牌聚焦", count: 1, copy: "看清眼前核心" },
  { name: "双牌对照", count: 2, copy: "比较两股力量" },
  { name: "三牌时间流", count: 3, copy: "过去 · 现在 · 下一步" },
  { name: "四牌局面拆解", count: 4, copy: "把局面分层展开" },
  { name: "选择权衡", count: 5, copy: "比较路径与代价" },
  { name: "关系剖面", count: 5, copy: "看双方与关系" },
] as const;

const SpreadsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 13);
  const gridIn = enter(frame, 26, 18);
  const reversalIn = enter(frame, 115, 14);

  return (
    <PaperBackground tint="violet">
      <SceneHeader step="牌阵" tag="真实支持 6 种" />
      <StageTitle eyebrow="问题不同，结构也不同" style={{ opacity: titleIn }}>
        <span style={{ color: COLORS.violet }}>1–5 张</span>
        <br />6 种牌阵
      </StageTitle>

      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 500,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          opacity: gridIn,
          transform: `translateY(${map(gridIn, 55, 0)}px)`,
        }}
      >
        {spreadOptions.map((spread, index) => (
          <div
            key={spread.name}
            style={{
              minHeight: 205,
              padding: "24px 25px",
              borderRadius: 27,
              background:
                index === 4 || index === 5
                  ? "linear-gradient(135deg, #fff, #f4ecff)"
                  : "#fff",
              border: `3px solid ${
                index === 4 || index === 5
                  ? "rgba(114,72,235,0.32)"
                  : "rgba(89,59,104,0.13)"
              }`,
              boxShadow: "0 18px 36px rgba(56,35,76,0.09)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 27, fontWeight: 1000 }}>
                {spread.name}
              </div>
              <div
                style={{
                  minWidth: 48,
                  height: 48,
                  padding: "0 13px",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  background: COLORS.violet,
                  fontSize: 23,
                  fontWeight: 1000,
                }}
              >
                {spread.count}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 7,
                marginTop: 22,
                minHeight: 31,
                alignItems: "center",
              }}
            >
              {Array.from({ length: spread.count }).map((_, dotIndex) => (
                <div
                  key={`${spread.name}-${dotIndex}`}
                  style={{
                    width: spread.count === 5 ? 35 : 42,
                    height: spread.count === 5 ? 49 : 58,
                    borderRadius: 7,
                    border: "2px solid rgba(76,39,171,0.25)",
                    background:
                      dotIndex === 0
                        ? "linear-gradient(145deg, #8d62f0, #f0c66e)"
                        : "#ede6f7",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 14,
                color: COLORS.muted,
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              {spread.copy}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          bottom: 290,
          minHeight: 126,
          padding: "22px 28px",
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#251631",
          color: "#fff",
          boxShadow: "0 22px 46px rgba(35,20,44,0.2)",
          opacity: reversalIn,
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 1000 }}>
            正位 / 逆位都保留
          </div>
          <div
            style={{
              marginTop: 7,
              color: "rgba(255,255,255,0.68)",
              fontSize: 20,
            }}
          >
            开启后约 28% 的牌会倒置
          </div>
        </div>
        <div
          style={{
            minWidth: 124,
            height: 62,
            padding: 6,
            borderRadius: 999,
            display: "flex",
            justifyContent: "flex-end",
            background: COLORS.violet,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
        </div>
      </div>
    </PaperBackground>
  );
};

const DrawScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 12);
  const pilesIn = enter(frame, 17, 15);
  const moveToCards = enter(frame, 68, 13);
  const flip = enter(frame, 103, 31);
  const trustIn = enter(frame, 135, 14);

  const pileOpacity = pilesIn * (1 - moveToCards);
  const cardsOpacity = moveToCards;

  return (
    <PaperBackground tint="night">
      <SceneHeader inverse step="亲手抽牌" tag="过去 · 现在 · 下一步" />
      <StageTitle
        eyebrow="牌序在点击那一刻固定"
        style={{ color: "#fff", opacity: titleIn }}
      >
        你来<span style={{ color: "#ffd36b" }}>洗、切、抽</span>
      </StageTitle>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 580,
          height: 650,
          opacity: pileOpacity,
        }}
      >
        {[-1, 0, 1].map((pile) => (
          <div
            key={pile}
            style={{
              position: "absolute",
              left: "50%",
              top: Math.abs(pile) * 25,
              transform: `translateX(calc(-50% + ${pile * 310}px)) translateY(${map(
                pilesIn,
                70,
                0,
              )}px)`,
            }}
          >
            {[3, 2, 1, 0].map((layer) => (
              <TarotCard
                key={layer}
                width={260}
                style={{
                  position: "absolute",
                  left: layer * -7,
                  top: layer * -7,
                  filter: "drop-shadow(0 22px 22px rgba(0,0,0,0.22))",
                }}
              />
            ))}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 485,
            textAlign: "center",
            color: "rgba(255,255,255,0.72)",
            fontSize: 25,
            fontWeight: 800,
          }}
        >
          凭第一眼选一叠 · 不提前看牌面与正逆位
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 35,
          right: 35,
          top: 545,
          height: 770,
          opacity: cardsOpacity,
        }}
      >
        {[
          {
            src: "assets/the-fool.avif",
            label: "0 · 愚人",
            position: "过去",
            rotate: -5,
          },
          {
            src: "assets/the-moon.avif",
            label: "XVIII · 月亮",
            position: "现在",
            rotate: 0,
          },
          {
            src: "assets/two-of-cups.avif",
            label: "圣杯二 · 逆位",
            position: "下一步",
            rotate: 185,
          },
        ].map((card, index) => (
          <div
            key={card.position}
            style={{
              position: "absolute",
              left: 18 + index * 325,
              top: index === 1 ? 0 : 60,
            }}
          >
            <div
              style={{
                marginBottom: 14,
                textAlign: "center",
                color: index === 1 ? "#ffd36b" : "#fff",
                fontSize: 24,
                fontWeight: 950,
              }}
            >
              {card.position}
            </div>
            <TarotCard
              width={index === 1 ? 330 : 292}
              faceSrc={card.src}
              flip={flip}
              rotate={card.rotate}
              label={card.label}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          bottom: 310,
          minHeight: 124,
          padding: "22px 27px",
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          background: "rgba(255,255,255,0.13)",
          border: "2px solid rgba(255,255,255,0.26)",
          color: "#fff",
          opacity: trustIn,
          fontSize: 27,
          fontWeight: 950,
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ color: "#ffd36b", fontSize: 33 }}>✦</span>
        AI 不洗牌 · 不选牌 · 不换牌
      </div>
    </PaperBackground>
  );
};

const MeaningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 12);
  const cardIn = enter(frame, 15, 14);
  const standardIn = enter(frame, 48, 14);
  const chaosIn = enter(frame, 98, 16);
  const underline = enter(frame, 124, 12);

  return (
    <PaperBackground>
      <SceneHeader step="解读" tag="标准牌义优先" />
      <StageTitle
        eyebrow="同一张牌，先看基础"
        style={{ top: 165, opacity: titleIn }}
      >
        再听猫<span style={{ color: COLORS.violet }}>说人话</span>
      </StageTitle>

      <TarotCard
        width={360}
        faceSrc="assets/the-moon.avif"
        flip={1}
        label="XVIII · 月亮"
        style={{
          position: "absolute",
          left: "50%",
          top: 470,
          opacity: cardIn,
          transform: `translateX(-50%) translateY(${map(cardIn, 70, 0)}px)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          top: 1010,
          minHeight: 204,
          padding: "27px 31px",
          borderRadius: 30,
          display: "grid",
          gridTemplateColumns: "210px 1fr",
          alignItems: "center",
          gap: 28,
          background: "#fff",
          border: "3px solid rgba(114,72,235,0.18)",
          boxShadow: "0 22px 50px rgba(55,34,82,0.12)",
          opacity: standardIn,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "9px 14px",
              borderRadius: 999,
              color: "#fff",
              background: COLORS.violet,
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            标准牌义
          </div>
          <div style={{ marginTop: 14, fontSize: 28, fontWeight: 1000 }}>
            月亮 · 正位
          </div>
          <div
            style={{ marginTop: 6, color: COLORS.muted, fontSize: 20 }}
          >
            牌位：现在
          </div>
        </div>
        <div
          style={{
            paddingLeft: 27,
            borderLeft: "2px solid #e7deef",
            fontSize: 34,
            lineHeight: 1.35,
            fontWeight: 950,
          }}
        >
          幻象 · 不确定 · 辨别
          <div
            style={{
              marginTop: 10,
              color: COLORS.muted,
              fontSize: 21,
              fontWeight: 700,
            }}
          >
            别把第一眼直接当成事实
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          top: 1240,
          minHeight: 280,
          padding: "31px 35px",
          borderRadius: 32,
          color: "#fff",
          background: "linear-gradient(135deg, #2d1937, #55306f)",
          boxShadow: "0 24px 54px rgba(38,21,47,0.24)",
          opacity: chaosIn,
          transform: `translateY(${map(chaosIn, 50, 0)}px)`,
        }}
      >
        <div
          style={{
            color: "#ffd36b",
            fontSize: 23,
            fontWeight: 950,
          }}
        >
          💥 发疯模式 · 猫猫回话
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 51,
            lineHeight: 1.18,
            letterSpacing: -2,
            fontWeight: 1000,
          }}
        >
          它图的不是你，
          <br />
          是你
          <span style={{ position: "relative", color: "#ff8164" }}>
            毫无防备
            <span
              style={{
                position: "absolute",
                left: 0,
                right: map(underline, 158, -3),
                bottom: -8,
                height: 9,
                borderRadius: 999,
                background: "#ffd36b",
              }}
            />
          </span>
          的那一口。
        </div>
      </div>
    </PaperBackground>
  );
};

const postReadingActions = [
  {
    icon: "💬",
    title: "继续追问",
    copy: "围绕已翻开的牌继续聊，不必重抽",
    accent: "#7248eb",
  },
  {
    icon: "◷",
    title: "回看最近 8 次",
    copy: "保存在当前浏览器，刷新后也能回来",
    accent: "#1a9b8c",
  },
  {
    icon: "↗",
    title: "生成分享图",
    copy: "选择主牌、复制文案、保存 PNG",
    accent: "#ef5c37",
  },
] as const;

const ActionsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 12);

  return (
    <PaperBackground tint="violet">
      <SceneHeader step="抽牌以后" tag="不是看完就走" />
      <StageTitle eyebrow="一次阅读还能继续" style={{ opacity: titleIn }}>
        带走<span style={{ color: COLORS.violet }}>下一步</span>
      </StageTitle>

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          top: 505,
          display: "flex",
          flexDirection: "column",
          gap: 25,
        }}
      >
        {postReadingActions.map((action, index) => {
          const progress = enter(frame, 24 + index * 24, 14);
          return (
            <div
              key={action.title}
              style={{
                minHeight: 250,
                padding: "31px 34px",
                borderRadius: 32,
                display: "grid",
                gridTemplateColumns: "105px 1fr auto",
                alignItems: "center",
                gap: 25,
                background: "#fff",
                border: "3px solid rgba(83,54,114,0.12)",
                boxShadow: "0 20px 44px rgba(55,34,82,0.1)",
                opacity: progress,
                transform: `translateX(${map(progress, 70, 0)}px)`,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  background: action.accent,
                  fontSize: 46,
                  fontWeight: 1000,
                  boxShadow: `0 16px 32px ${action.accent}33`,
                }}
              >
                {action.icon}
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 1000 }}>
                  {action.title}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    color: COLORS.muted,
                    fontSize: 23,
                    lineHeight: 1.42,
                    fontWeight: 700,
                  }}
                >
                  {action.copy}
                </div>
              </div>
              <div
                style={{
                  color: action.accent,
                  fontSize: 38,
                  fontWeight: 1000,
                }}
              >
                ›
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          bottom: 290,
          textAlign: "center",
          color: COLORS.muted,
          fontSize: 23,
          fontWeight: 800,
          opacity: enter(frame, 105, 14),
        }}
      >
        基础牌义、猫咪总结和行动建议不依赖 AI
      </div>
    </PaperBackground>
  );
};

const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 0, 11);
  const cardsIn = enter(frame, 10, 13);
  const ctaIn = enter(frame, 35, 13);

  return (
    <PaperBackground tint="night">
      <SceneHeader inverse step="打开 MIAOTAROT" tag="不预测命运" />
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 210,
          textAlign: "center",
          color: "#fff",
          opacity: titleIn,
        }}
      >
        <div
          style={{
            color: "#ffd36b",
            fontSize: 26,
            fontWeight: 950,
            letterSpacing: 2,
          }}
        >
          塔罗不给标准答案
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 80,
            lineHeight: 1.05,
            letterSpacing: -4,
            fontWeight: 1000,
          }}
        >
          把问题交给牌
          <br />
          <span style={{ color: "#d9c5ff" }}>把选择留给自己</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 660,
          height: 680,
          opacity: cardsIn,
          transform: `translateY(${map(cardsIn, 70, 0)}px)`,
        }}
      >
        {[
          {
            src: "assets/the-lovers.avif",
            label: "VI · 恋人",
            left: 105,
            rotate: -10,
          },
          {
            src: "assets/the-moon.avif",
            label: "XVIII · 月亮",
            left: 385,
            rotate: 0,
          },
          {
            src: "assets/the-star.avif",
            label: "XVII · 星星",
            left: 665,
            rotate: 10,
          },
        ].map((card, index) => (
          <TarotCard
            key={card.src}
            width={index === 1 ? 320 : 292}
            faceSrc={card.src}
            flip={1}
            rotate={card.rotate}
            label={card.label}
            style={{
              position: "absolute",
              left: card.left,
              top: index === 1 ? 0 : 60,
              zIndex: index === 1 ? 2 : 1,
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          bottom: 325,
          minHeight: 118,
          borderRadius: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          color: "#fff",
          background: `linear-gradient(135deg, ${COLORS.violet}, #a35bed)`,
          border: "3px solid rgba(255,255,255,0.25)",
          boxShadow: "0 26px 50px rgba(28,15,38,0.28)",
          opacity: ctaIn,
          transform: `scale(${map(ctaIn, 0.92, 1)})`,
          fontSize: 38,
          fontWeight: 1000,
        }}
      >
        🐈 打开 MiaoTarot，问点真的
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 255,
          textAlign: "center",
          color: "rgba(255,255,255,0.64)",
          fontSize: 22,
          fontWeight: 800,
          opacity: ctaIn,
        }}
      >
        也可以先拿一个怪问题来试
      </div>
    </PaperBackground>
  );
};

type CaptionCue = {
  from: number;
  to: number;
  text: string;
};

const captionCues: CaptionCue[] = [
  { from: 0, to: 90, text: "生姜伪装成土豆接近我，它到底图什么？" },
  { from: 90, to: 180, text: "我把问题交给 MiaoTarot，选了发疯模式。" },
  { from: 180, to: 235, text: "但它不只有一句段子。" },
  { from: 235, to: 340, text: "经典 22 张大牌，或涂鸦 78 张全牌。" },
  { from: 340, to: 500, text: "1 到 5 张，6 种牌阵都能选。" },
  { from: 500, to: 580, text: "正位、逆位也保留。" },
  { from: 580, to: 720, text: "牌由你亲手洗、切、抽；AI 不洗牌，也不换牌。" },
  { from: 720, to: 855, text: "先看牌名、牌位和标准含义。" },
  { from: 855, to: 945, text: "再听猫用正常或发疯的方式，把话说清楚。" },
  { from: 945, to: 1050, text: "还能继续追问、回看最近 8 次、生成分享图。" },
  { from: 1050, to: 1125, text: "它不替你预测命运，只帮你换个角度看清问题。" },
  { from: 1125, to: 1170, text: "把问题交给牌，把选择留给自己。" },
];

const ProductTourCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = captionCues.find(
    (item) => frame >= item.from && frame < item.to,
  );
  if (!cue) return null;

  const cueFrame = frame - cue.from;
  const progress = enter(cueFrame, 0, 6);

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 70,
        left: 64,
        right: 64,
        bottom: 168,
        display: "flex",
        justifyContent: "center",
        opacity: progress,
        transform: `translateY(${map(progress, 12, 0)}px)`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 930,
          padding: "13px 22px 15px",
          borderRadius: 18,
          color: "#fff",
          background: "rgba(23,14,31,0.86)",
          border: "2px solid rgba(255,255,255,0.16)",
          boxShadow: "0 14px 38px rgba(0,0,0,0.2)",
          fontSize: 28,
          lineHeight: 1.34,
          fontWeight: 800,
          textAlign: "center",
          textShadow: "0 2px 5px rgba(0,0,0,0.3)",
        }}
      >
        <span style={{ color: "#ffd36b" }}>✦ </span>
        {cue.text}
      </div>
    </div>
  );
};

const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 2, 6], [0, 0.68, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        background: "rgba(255,247,221,0.9)",
      }}
    />
  );
};

const ProductTourSfx: React.FC = () => (
  <>
    {[90, 210, 390, 570, 750, 930, 1080].map((from) => (
      <Sequence
        key={`touch-${from}`}
        from={from}
        durationInFrames={22}
        premountFor={PRODUCT_TOUR_FPS}
      >
        <Audio src={staticFile("audio/sfx-touch-hot.wav")} volume={0.42} />
      </Sequence>
    ))}
    <Sequence from={668} durationInFrames={44} premountFor={PRODUCT_TOUR_FPS}>
      <Audio src={staticFile("audio/sfx-flip-hot.wav")} volume={0.62} />
    </Sequence>
    <Sequence from={848} durationInFrames={52} premountFor={PRODUCT_TOUR_FPS}>
      <Audio src={staticFile("audio/sfx-chime-hot.wav")} volume={0.58} />
    </Sequence>
  </>
);

export const MiaoTarotProductTour: React.FC = () => (
  <AbsoluteFill style={{ background: "#f8efdc" }}>
    <Sequence
      from={productTourScenes.hook.from}
      durationInFrames={productTourScenes.hook.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <HotMemeHook variant="ginger" />
      <SoundBadge />
    </Sequence>
    <Sequence
      from={productTourScenes.setup.from}
      durationInFrames={productTourScenes.setup.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <SetupScene />
    </Sequence>
    <Sequence
      from={productTourScenes.decks.from}
      durationInFrames={productTourScenes.decks.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <DecksScene />
    </Sequence>
    <Sequence
      from={productTourScenes.spreads.from}
      durationInFrames={productTourScenes.spreads.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <SpreadsScene />
    </Sequence>
    <Sequence
      from={productTourScenes.draw.from}
      durationInFrames={productTourScenes.draw.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <DrawScene />
    </Sequence>
    <Sequence
      from={productTourScenes.meaning.from}
      durationInFrames={productTourScenes.meaning.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <MeaningScene />
    </Sequence>
    <Sequence
      from={productTourScenes.actions.from}
      durationInFrames={productTourScenes.actions.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <ActionsScene />
    </Sequence>
    <Sequence
      from={productTourScenes.close.from}
      durationInFrames={productTourScenes.close.duration}
      premountFor={PRODUCT_TOUR_FPS}
    >
      <CloseScene />
    </Sequence>

    {Object.values(productTourScenes)
      .slice(1)
      .map((scene) => (
        <Sequence
          key={`cut-${scene.from}`}
          from={scene.from - 2}
          durationInFrames={7}
          premountFor={PRODUCT_TOUR_FPS}
        >
          <CutFlash />
        </Sequence>
      ))}

    <Audio
      src={staticFile("audio/narration-product-tour.wav")}
      volume={1.08}
    />
    <Audio
      src={staticFile("audio/product-tour-beat.wav")}
      volume={(frame) =>
        interpolate(
          frame,
          [0, 18, 570, 630, 750, 815, 930, 1000, 1138, 1169],
          [0.08, 0.1, 0.1, 0.045, 0.045, 0.075, 0.075, 0.055, 0.055, 0],
          clamp,
        )
      }
    />
    <ProductTourSfx />
    <ProductTourCaption />
  </AbsoluteFill>
);
