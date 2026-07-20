export const FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const DURATION_IN_FRAMES = 603;

export const SCENES = {
  choice: { from: 0, duration: 99 },
  proof: { from: 99, duration: 135 },
  reveal: { from: 234, duration: 165 },
  share: { from: 399, duration: 105 },
  cta: { from: 504, duration: 99 },
} as const;

export const COLORS = {
  ink: "#24182f",
  muted: "#746a7d",
  violet: "#7248eb",
  violetDark: "#4c27ab",
  lilac: "#e8ddff",
  paper: "#fffdf8",
  cream: "#f6efe5",
  gold: "#d7a649",
  pink: "#ee76ab",
  teal: "#1a9b8c",
} as const;
