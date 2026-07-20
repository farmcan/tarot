import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FPS, SCENES } from "./constants";
import { ChoiceScene } from "./scenes/ChoiceScene";
import { CtaScene } from "./scenes/CtaScene";
import { ProofScene } from "./scenes/ProofScene";
import { RevealScene } from "./scenes/RevealScene";
import { ShareScene } from "./scenes/ShareScene";

export {
  DURATION_IN_FRAMES,
  FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./constants";

const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 4, 9], [0, 0.65, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, [0, 9], [-780, 1400]);
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <div
        style={{
          width: 560,
          height: 2300,
          transform: `translateX(${x}px) rotate(13deg)`,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
          filter: "blur(26px)",
        }}
      />
    </AbsoluteFill>
  );
};

const Sfx: React.FC = () => (
  <>
    <Sequence from={55} durationInFrames={30} premountFor={FPS}>
      <Audio src={staticFile("audio/sfx-touch.wav")} volume={0.28} />
    </Sequence>
    <Sequence from={188} durationInFrames={36} premountFor={FPS}>
      <Audio src={staticFile("audio/sfx-flip.wav")} volume={0.34} />
    </Sequence>
    <Sequence from={243} durationInFrames={48} premountFor={FPS}>
      <Audio src={staticFile("audio/sfx-chime.wav")} volume={0.28} />
    </Sequence>
    <Sequence from={437} durationInFrames={30} premountFor={FPS}>
      <Audio src={staticFile("audio/sfx-touch.wav")} volume={0.2} />
    </Sequence>
    <Sequence from={536} durationInFrames={48} premountFor={FPS}>
      <Audio src={staticFile("audio/sfx-chime.wav")} volume={0.18} />
    </Sequence>
  </>
);

export const MiaoTarotLaunch: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#1e122b" }}>
      <Sequence
        from={SCENES.choice.from}
        durationInFrames={SCENES.choice.duration}
        premountFor={FPS}
      >
        <ChoiceScene />
      </Sequence>
      <Sequence
        from={SCENES.proof.from}
        durationInFrames={SCENES.proof.duration}
        premountFor={FPS}
      >
        <ProofScene />
      </Sequence>
      <Sequence
        from={SCENES.reveal.from}
        durationInFrames={SCENES.reveal.duration}
        premountFor={FPS}
      >
        <RevealScene />
      </Sequence>
      <Sequence
        from={SCENES.share.from}
        durationInFrames={SCENES.share.duration}
        premountFor={FPS}
      >
        <ShareScene />
      </Sequence>
      <Sequence
        from={SCENES.cta.from}
        durationInFrames={SCENES.cta.duration}
        premountFor={FPS}
      >
        <CtaScene />
      </Sequence>

      {[99, 234, 399, 504].map((cut) => (
        <Sequence
          key={cut}
          from={cut - 5}
          durationInFrames={10}
          premountFor={15}
        >
          <CutFlash />
        </Sequence>
      ))}

      <Audio src={staticFile("audio/narration.wav")} volume={1} />
      <Sfx />
    </AbsoluteFill>
  );
};
