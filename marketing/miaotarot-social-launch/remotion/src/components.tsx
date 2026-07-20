import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "./constants";

export const PaperBackground: React.FC<{
  tint?: "light" | "violet" | "night";
  children?: ReactNode;
}> = ({ tint = "light", children }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 42) * 18;
  const palette =
    tint === "night"
      ? ["#171023", "#2a1646", "#5e38a8"]
      : tint === "violet"
        ? ["#f4edff", "#fff9f2", "#e6d7ff"]
        : ["#fffaf2", "#f7efff", "#eee3ff"];

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: `linear-gradient(150deg, ${palette[0]} 0%, ${palette[1]} 58%, ${palette[2]} 100%)`,
        color: tint === "night" ? "#fff" : COLORS.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 680,
          height: 680,
          left: -260 + drift,
          top: 520,
          borderRadius: "50%",
          background: "rgba(140, 88, 238, 0.16)",
          filter: "blur(34px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          right: -210 - drift,
          top: 80,
          borderRadius: "50%",
          background: "rgba(247, 173, 105, 0.16)",
          filter: "blur(28px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: tint === "night" ? 0.14 : 0.24,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1.4px)",
          backgroundSize: "34px 34px",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

export const BrandPill: React.FC<{ inverse?: boolean; text?: string }> = ({
  inverse = false,
  text = "MIAOTAROT",
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 13,
      alignSelf: "flex-start",
      padding: "13px 22px",
      borderRadius: 999,
      fontSize: 24,
      lineHeight: 1,
      fontWeight: 850,
      letterSpacing: 3.5,
      color: inverse ? "#fff" : COLORS.violetDark,
      background: inverse ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.76)",
      border: `2px solid ${inverse ? "rgba(255,255,255,0.35)" : "rgba(114,72,235,0.18)"}`,
      boxShadow: "0 14px 36px rgba(64, 37, 104, 0.1)",
      backdropFilter: "blur(10px)",
    }}
  >
    <span style={{ color: inverse ? "#ffd76a" : COLORS.gold }}>✦</span>
    {text}
  </div>
);

export const ActionChip: React.FC<{
  children: ReactNode;
  tone?: "violet" | "gold" | "plain";
  style?: CSSProperties;
}> = ({ children, tone = "violet", style }) => {
  const tones = {
    violet: { background: COLORS.violet, color: "#fff" },
    gold: { background: "#fff0bd", color: "#64480e" },
    plain: { background: "rgba(255,255,255,0.78)", color: COLORS.ink },
  } as const;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 60,
        padding: "14px 24px",
        borderRadius: 999,
        fontSize: 27,
        fontWeight: 780,
        border: "2px solid rgba(83, 54, 114, 0.12)",
        boxShadow: "0 14px 30px rgba(55, 34, 82, 0.1)",
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Corner: React.FC<{ position: "tl" | "tr" | "bl" | "br" }> = ({
  position,
}) => {
  const isBottom = position.startsWith("b");
  const isRight = position.endsWith("r");
  return (
    <div
      style={{
        position: "absolute",
        width: 36,
        height: 36,
        top: isBottom ? undefined : 12,
        bottom: isBottom ? 12 : undefined,
        left: isRight ? undefined : 12,
        right: isRight ? 12 : undefined,
        borderTop: isBottom ? undefined : `3px solid ${COLORS.gold}`,
        borderBottom: isBottom ? `3px solid ${COLORS.gold}` : undefined,
        borderLeft: isRight ? undefined : `3px solid ${COLORS.gold}`,
        borderRight: isRight ? `3px solid ${COLORS.gold}` : undefined,
        borderRadius: 8,
        opacity: 0.9,
      }}
    />
  );
};

const CardFace: React.FC<{ faceSrc: string; label?: string }> = ({
  faceSrc,
  label = "I · 魔术师",
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: 10,
      borderRadius: 30,
      background:
        "linear-gradient(145deg, #fff7d0 0%, #b37aff 34%, #f2c66d 66%, #fff1c6 100%)",
      boxShadow: "0 28px 70px rgba(37, 19, 55, 0.28)",
      backfaceVisibility: "hidden",
    }}
  >
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        padding: 12,
        borderRadius: 22,
        background: "#fffaf0",
        border: "2px solid rgba(83, 44, 84, 0.5)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "calc(100% - 84px)",
          overflow: "hidden",
          borderRadius: 13,
          border: "2px solid rgba(89, 53, 78, 0.42)",
          background: "#efe3c5",
        }}
      >
        <Img
          src={staticFile(faceSrc)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          height: 84,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#442a42",
          fontFamily: "Georgia, serif",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        {label}
      </div>
      {(["tl", "tr", "bl", "br"] as const).map((position) => (
        <Corner key={position} position={position} />
      ))}
    </div>
  </div>
);

const CardBack: React.FC<{ backSrc: string }> = ({ backSrc }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 30,
      padding: 10,
      background: "linear-gradient(145deg, #e4bc67, #7e50ca, #f2d58d)",
      boxShadow: "0 28px 70px rgba(37, 19, 55, 0.28)",
      transform: "rotateY(180deg)",
      backfaceVisibility: "hidden",
    }}
  >
    <Img
      src={staticFile(backSrc)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: 21,
        border: "2px solid rgba(255,255,255,0.54)",
      }}
    />
  </div>
);

export const TarotCard: React.FC<{
  width: number;
  backSrc?: string;
  faceSrc?: string;
  flip?: number;
  rotate?: number;
  label?: string;
  style?: CSSProperties;
}> = ({
  width,
  backSrc = "assets/moon-atlas-middle.avif",
  faceSrc = "assets/the-magician.avif",
  flip = 0,
  rotate = 0,
  label,
  style,
}) => {
  const height = (width * 7) / 5;
  return (
    <div style={{ width, height, perspective: 1400, ...style }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateZ(${rotate}deg) rotateY(${180 - flip * 180}deg)`,
        }}
      >
        <CardFace faceSrc={faceSrc} label={label} />
        <CardBack backSrc={backSrc} />
      </div>
    </div>
  );
};

export const TapTarget: React.FC<{
  progress: number;
  label?: string;
  style?: CSSProperties;
}> = ({ progress, label = "翻开", style }) => (
  <div
    style={{
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: "50%",
      border: `5px solid rgba(255,255,255,${0.9 - progress * 0.35})`,
      background: "rgba(114,72,235,0.72)",
      boxShadow: `0 0 0 ${18 + progress * 24}px rgba(114,72,235,${0.22 - progress * 0.12})`,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 26,
      fontWeight: 850,
      ...style,
    }}
  >
    {label}
  </div>
);

export const PhoneShell: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      width: 850,
      height: 1420,
      padding: 18,
      borderRadius: 68,
      background: "#1e1725",
      boxShadow: "0 44px 110px rgba(48, 29, 68, 0.3)",
      border: "3px solid rgba(255,255,255,0.36)",
      ...style,
    }}
  >
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 50,
        background: "#fcfaff",
        border: "2px solid #d9d0e8",
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: 5,
          width: 250,
          height: 34,
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: 999,
          background: "#1e1725",
        }}
      />
      {children}
    </div>
  </div>
);
