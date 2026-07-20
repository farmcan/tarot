import "./index.css";
import { Composition } from "remotion";
import {
  DURATION_IN_FRAMES,
  FPS,
  MiaoTarotLaunch,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./MiaoTarotLaunch";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MiaoTarotLaunch"
      component={MiaoTarotLaunch}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
  );
};
