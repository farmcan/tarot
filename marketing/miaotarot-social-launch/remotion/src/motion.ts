import { Easing, interpolate } from "remotion";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const enter = (
  frame: number,
  start: number,
  duration = 16,
): number =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

export const exit = (
  frame: number,
  start: number,
  duration = 10,
): number =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

export const map = (
  progress: number,
  from: number,
  to: number,
): number => interpolate(progress, [0, 1], [from, to], clamp);

export const sceneOpacity = (
  frame: number,
  duration: number,
  fadeIn = true,
  fadeOut = true,
): number => {
  const intro = fadeIn ? enter(frame, 0, 8) : 1;
  const outro = fadeOut ? 1 - exit(frame, duration - 8, 8) : 1;
  return Math.min(intro, outro);
};
