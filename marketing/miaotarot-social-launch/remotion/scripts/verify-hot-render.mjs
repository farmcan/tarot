import { statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const videoPath = resolve(
  process.argv[2] || "out/miaotarot-hot-meme-ginger-1080x1920.mp4",
);
const expectedDuration = Number(process.argv[3] || 11);
const file = statSync(videoPath);

if (file.size < 1_000_000) {
  throw new Error(`Render is unexpectedly small: ${file.size} bytes`);
}

const probe = spawnSync(
  "ffprobe",
  [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate",
    "-of",
    "json",
    videoPath,
  ],
  { encoding: "utf8" },
);

if (probe.status !== 0) {
  throw new Error(probe.stderr || "ffprobe failed");
}

const metadata = JSON.parse(probe.stdout);
const video = metadata.streams.find((stream) => stream.codec_type === "video");
const audio = metadata.streams.find((stream) => stream.codec_type === "audio");
const duration = Number(metadata.format.duration);

if (!video || video.codec_name !== "h264") {
  throw new Error(`Expected H.264, received ${video?.codec_name}`);
}
if (video.width !== 1080 || video.height !== 1920) {
  throw new Error(`Expected 1080x1920, received ${video.width}x${video.height}`);
}
if (video.r_frame_rate !== "30/1") {
  throw new Error(`Expected 30fps, received ${video.r_frame_rate}`);
}
if (!audio || audio.codec_name !== "aac") {
  throw new Error(`Expected AAC audio, received ${audio?.codec_name}`);
}
if (
  duration < expectedDuration - 0.05 ||
  duration > expectedDuration + 0.12
) {
  throw new Error(
    `Expected a ${expectedDuration.toFixed(2)}s timeline, received ${duration}s`,
  );
}

const decode = spawnSync(
  "ffmpeg",
  ["-v", "error", "-i", videoPath, "-f", "null", "-"],
  { encoding: "utf8" },
);

if (decode.status !== 0) {
  throw new Error(decode.stderr || "Full decode failed");
}

console.log(
  `Verified ${video.width}x${video.height} ${video.r_frame_rate} H.264 + AAC, ${duration.toFixed(2)}s, ${(file.size / 1_000_000).toFixed(1)}MB`,
);
