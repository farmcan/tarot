import "./index.css";
import { Composition } from "remotion";
import {
  DURATION_IN_FRAMES,
  FPS,
  MiaoTarotLaunch,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./MiaoTarotLaunch";
import {
  HOT_MEME_DURATION,
  HOT_MEME_FPS,
  HOT_MEME_HEIGHT,
  HOT_MEME_WIDTH,
  HotMemeHook,
  MiaoTarotHotMeme,
} from "./MiaoTarotHotMeme";
import {
  MiaoTarotProductTour,
  PRODUCT_TOUR_DURATION,
  PRODUCT_TOUR_FPS,
  PRODUCT_TOUR_HEIGHT,
  PRODUCT_TOUR_WIDTH,
} from "./MiaoTarotProductTour";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MiaoTarotProductTour"
        component={MiaoTarotProductTour}
        durationInFrames={PRODUCT_TOUR_DURATION}
        fps={PRODUCT_TOUR_FPS}
        width={PRODUCT_TOUR_WIDTH}
        height={PRODUCT_TOUR_HEIGHT}
      />
      <Composition
        id="MiaoTarotHotMemeGinger"
        component={MiaoTarotHotMeme}
        durationInFrames={HOT_MEME_DURATION}
        fps={HOT_MEME_FPS}
        width={HOT_MEME_WIDTH}
        height={HOT_MEME_HEIGHT}
      />
      <Composition
        id="MiaoTarotHotHookGinger"
        component={HotMemeHook}
        durationInFrames={45}
        fps={HOT_MEME_FPS}
        width={HOT_MEME_WIDTH}
        height={HOT_MEME_HEIGHT}
        defaultProps={{ variant: "ginger" as const }}
      />
      <Composition
        id="MiaoTarotHotHookFaucet"
        component={HotMemeHook}
        durationInFrames={45}
        fps={HOT_MEME_FPS}
        width={HOT_MEME_WIDTH}
        height={HOT_MEME_HEIGHT}
        defaultProps={{ variant: "faucet" as const }}
      />
      <Composition
        id="MiaoTarotLaunch"
        component={MiaoTarotLaunch}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};
