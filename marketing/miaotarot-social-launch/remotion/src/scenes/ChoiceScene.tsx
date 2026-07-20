import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ActionChip, BrandPill, TarotCard } from "../components";
import { COLORS, SCENES } from "../constants";
import { enter, map, sceneOpacity } from "../motion";

const choices = [
  { label: "左", src: "assets/moon-atlas-left.avif", rotate: -7 },
  { label: "中", src: "assets/moon-atlas-middle.avif", rotate: 0 },
  { label: "右", src: "assets/moon-atlas-right.avif", rotate: 7 },
] as const;

export const ChoiceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = enter(frame, 3, 18);
  const cardsIn = enter(frame, 18, 20);
  const select = enter(frame, 59, 17);

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity(frame, SCENES.choice.duration, false, true),
        overflow: "hidden",
        background: "#21122e",
        color: "#fff",
      }}
    >
      <Img
        src={staticFile("assets/miao-hero.jpg")}
        style={{
          position: "absolute",
          width: 1440,
          height: 730,
          top: -8,
          left: -240,
          objectFit: "cover",
          objectPosition: "78% 48%",
          transform: `scale(${1 + frame * 0.00045})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(26,12,39,0.02) 0%, rgba(26,12,39,0.2) 28%, #21122e 42%, #21122e 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 92,
          display: "flex",
          flexDirection: "column",
          transform: `translateY(${map(titleIn, 28, 0)}px)`,
          opacity: titleIn,
        }}
      >
        <BrandPill inverse text="MIAOTAROT · 今天只问一件事" />
        <div
          style={{
            marginTop: 72,
            fontSize: 130,
            lineHeight: 0.94,
            fontWeight: 950,
            letterSpacing: -8,
            textShadow: "0 12px 40px rgba(20,8,33,0.42)",
          }}
        >
          给你
          <span style={{ color: "#ffd56d" }}> 2 </span>
          秒
        </div>
        <div
          style={{
            marginTop: 24,
            maxWidth: 760,
            fontSize: 50,
            fontWeight: 760,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          左 · 中 · 右，选一张猫
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: cardsIn,
          transform: `translateY(${map(cardsIn, 90, 0)}px)`,
        }}
      >
        {choices.map((choice, index) => {
          const chosen = index === 1;
          const lift = chosen ? map(select, 0, -58) : map(select, 0, 20);
          const scale = chosen ? map(select, 1, 1.09) : map(select, 1, 0.94);
          return (
            <div
              key={choice.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 30,
                transform: `translateY(${lift}px) scale(${scale})`,
                opacity: chosen ? 1 : map(select, 1, 0.68),
              }}
            >
              <TarotCard
                width={275}
                backSrc={choice.src}
                rotate={choice.rotate}
              />
              <div
                style={{
                  width: 66,
                  height: 66,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: chosen && select > 0.5 ? COLORS.violet : "#fff",
                  color:
                    chosen && select > 0.5 ? "#fff" : COLORS.violetDark,
                  fontSize: 30,
                  fontWeight: 900,
                  border: "3px solid rgba(255,255,255,0.5)",
                }}
              >
                {choice.label}
              </div>
            </div>
          );
        })}
      </div>

      <ActionChip
        tone="gold"
        style={{
          position: "absolute",
          left: "50%",
          bottom: 270,
          opacity: select,
          transform: `translateX(-50%) scale(${map(select, 0.85, 1)})`,
          fontSize: 30,
          paddingInline: 34,
        }}
      >
        第一眼，就是答案的入口 ✦
      </ActionChip>
    </AbsoluteFill>
  );
};
