import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const apiKey = process.env.DASHSCOPE_API_KEY;
if (!apiKey) {
  throw new Error("DASHSCOPE_API_KEY is required");
}

const manifestPath = resolve(
  process.argv.find((argument) => argument.endsWith(".json")) ||
    "qwen-tts-manifest.json",
);
const onlyArgument = process.argv.find((argument) =>
  argument.startsWith("--only="),
);
const only = onlyArgument?.slice("--only=".length);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const endpoint =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

const run = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} failed`);
  }
  return result.stdout.trim();
};

const synthesize = async (item) => {
  const outputPath = resolve(item.output);
  mkdirSync(resolve(outputPath, ".."), { recursive: true });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: manifest.model,
      input: {
        text: item.text,
        voice: item.voice,
        language_type: item.languageType || "Chinese",
        instructions: item.instructions,
        optimize_instructions: true,
      },
    }),
  });
  const payload = await response.json();
  if (
    !response.ok ||
    (payload.status_code !== undefined && payload.status_code !== 200) ||
    payload.code
  ) {
    throw new Error(
      `DashScope request failed (${response.status}): ${
        payload.message || payload.code || "unknown error"
      }`,
    );
  }

  const audioUrl = payload.output?.audio?.url;
  if (!audioUrl) {
    throw new Error("DashScope response did not include an audio URL");
  }

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Audio download failed (${audioResponse.status})`);
  }

  const sourceExtension =
    extname(new URL(audioUrl).pathname).toLowerCase() || ".wav";
  const sourcePath = `${outputPath}.source${sourceExtension}`;
  const normalizedPath = `${outputPath}.normalized.wav`;
  writeFileSync(sourcePath, Buffer.from(await audioResponse.arrayBuffer()));

  run("ffmpeg", [
    "-y",
    "-i",
    sourcePath,
    "-af",
    "highpass=f=70,lowpass=f=15000,dynaudnorm=f=150:g=7:p=0.92",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-c:a",
    "pcm_s16le",
    normalizedPath,
  ]);
  renameSync(normalizedPath, outputPath);
  rmSync(sourcePath);

  const duration = Number(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      outputPath,
    ]),
  );
  const sha256 = createHash("sha256")
    .update(readFileSync(outputPath))
    .digest("hex");

  const provenancePath = `${outputPath}.json`;
  writeFileSync(
    provenancePath,
    `${JSON.stringify(
      {
        provider: "Alibaba Cloud Model Studio / Bailian",
        endpointRegion: "cn-beijing",
        model: manifest.model,
        voice: item.voice,
        languageType: item.languageType || "Chinese",
        text: item.text,
        instructions: item.instructions,
        optimizeInstructions: true,
        generatedAt: new Date().toISOString(),
        requestId: payload.request_id,
        usage: payload.usage,
        durationSeconds: duration,
        sha256,
        output: item.output,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `${item.id}: ${duration.toFixed(2)}s, ${item.voice}, ${item.output}`,
  );
};

const selected = only
  ? manifest.segments.filter((item) => item.id === only)
  : manifest.segments;
if (selected.length === 0) {
  throw new Error(`No TTS segment matched --only=${only}`);
}

for (const item of selected) {
  await synthesize(item);
}
