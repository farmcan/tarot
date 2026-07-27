import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const audioDir = resolve("public/audio");
const sourceDir = resolve(audioDir, "sources");
mkdirSync(sourceDir, { recursive: true });

const sources = [
  {
    file: resolve(sourceDir, "meow-of-a-pleading-cat.oga"),
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Meow_of_a_pleading_cat.oga",
  },
  {
    file: resolve(sourceDir, "purring-cat.oga"),
    url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Purring_cat.oga",
  },
];

for (const source of sources) {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent":
        "MiaoTarot/1.0 (media production; source recorded in repository)",
    },
  });
  if (!response.ok) {
    throw new Error(`Could not download ${source.url}: ${response.status}`);
  }
  writeFileSync(source.file, Buffer.from(await response.arrayBuffer()));
}

const render = (input, output, start, duration, filter) => {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      String(start),
      "-t",
      String(duration),
      "-i",
      input,
      "-af",
      filter,
      "-ar",
      "48000",
      "-ac",
      "2",
      "-c:a",
      "pcm_s16le",
      output,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `ffmpeg failed for ${output}`);
  }
  console.log(output);
};

const meowSource = sources[0].file;
const purrSource = sources[1].file;
render(
  meowSource,
  resolve(audioDir, "miao-reaction-meow.wav"),
  0.26,
  1.35,
  "highpass=f=90,lowpass=f=3500,afade=t=in:st=0:d=0.03,afade=t=out:st=1.18:d=0.17,volume=1.35",
);
render(
  meowSource,
  resolve(audioDir, "miao-flip-meow-1.wav"),
  3.56,
  1.3,
  "highpass=f=90,lowpass=f=3500,afade=t=in:st=0:d=0.02,afade=t=out:st=1.10:d=0.18,volume=1.25",
);
render(
  meowSource,
  resolve(audioDir, "miao-flip-meow-2.wav"),
  6.65,
  1.0,
  "highpass=f=90,lowpass=f=3500,asetrate=8000*1.06,aresample=48000,afade=t=in:st=0:d=0.02,afade=t=out:st=0.82:d=0.18,volume=1.25",
);
render(
  meowSource,
  resolve(audioDir, "miao-flip-meow-3.wav"),
  9.34,
  1.25,
  "highpass=f=90,lowpass=f=3500,asetrate=8000*0.94,aresample=48000,afade=t=in:st=0:d=0.02,afade=t=out:st=1.05:d=0.20,volume=1.25",
);
render(
  purrSource,
  resolve(audioDir, "miao-outro-purr.wav"),
  1.1,
  4,
  "highpass=f=45,lowpass=f=6000,afade=t=in:st=0:d=0.25,afade=t=out:st=3.25:d=0.75,volume=0.8",
);
