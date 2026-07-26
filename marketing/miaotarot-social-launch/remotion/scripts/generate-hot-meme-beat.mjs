import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const sampleRate = 48_000;
const durationSeconds = Number(process.argv[2] || 18);
const outputPath =
  process.argv[3] || "public/audio/hot-meme-beat.wav";
const frameCount = sampleRate * durationSeconds;
const left = new Float64Array(frameCount);
const right = new Float64Array(frameCount);
const bpm = 140;
const beatSeconds = 60 / bpm;

let seed = 0x51a0cafe;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
};

const add = (index, value, pan = 0) => {
  if (index < 0 || index >= frameCount) return;
  const leftGain = Math.sqrt((1 - pan) / 2);
  const rightGain = Math.sqrt((1 + pan) / 2);
  left[index] += value * leftGain;
  right[index] += value * rightGain;
};

const addKick = (startSeconds, accent = 1) => {
  const length = Math.floor(sampleRate * 0.18);
  const start = Math.floor(startSeconds * sampleRate);
  let phase = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const progress = i / length;
    const frequency = 118 * (1 - progress) + 46 * progress;
    phase += (Math.PI * 2 * frequency) / sampleRate;
    const body = Math.sin(phase) * Math.exp(-t * 22);
    const click = i < 90 ? (1 - i / 90) * noise() * 0.18 : 0;
    add(start + i, (body * 0.62 + click) * accent);
  }
};

const addHat = (startSeconds, open = false, pan = 0) => {
  const length = Math.floor(sampleRate * (open ? 0.11 : 0.045));
  const start = Math.floor(startSeconds * sampleRate);
  let previous = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const raw = noise();
    const highPassed = raw - previous * 0.83;
    previous = raw;
    const envelope = Math.exp(-t * (open ? 28 : 70));
    add(start + i, highPassed * envelope * (open ? 0.09 : 0.07), pan);
  }
};

const addClap = (startSeconds) => {
  const start = Math.floor(startSeconds * sampleRate);
  const bursts = [0, 0.018, 0.036];
  for (const burst of bursts) {
    const offset = Math.floor(burst * sampleRate);
    const length = Math.floor(sampleRate * 0.075);
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const tone = Math.sin(Math.PI * 2 * 920 * t) * 0.13;
      const value = (noise() * 0.23 + tone) * Math.exp(-t * 42);
      add(start + offset + i, value, 0.08);
    }
  }
};

const addBass = (startSeconds, frequency, lengthSeconds, accent = 1) => {
  const start = Math.floor(startSeconds * sampleRate);
  const length = Math.floor(lengthSeconds * sampleRate);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.018);
    const release = Math.min(1, (lengthSeconds - t) / 0.08);
    const envelope = Math.max(0, Math.min(attack, release));
    const fundamental = Math.sin(Math.PI * 2 * frequency * t);
    const harmonic = Math.sin(Math.PI * 2 * frequency * 2 * t) * 0.18;
    add(start + i, (fundamental + harmonic) * envelope * 0.13 * accent);
  }
};

const addPluck = (startSeconds, frequency, pan) => {
  const start = Math.floor(startSeconds * sampleRate);
  const length = Math.floor(sampleRate * 0.17);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 20);
    const value =
      (Math.sin(Math.PI * 2 * frequency * t) +
        Math.sin(Math.PI * 2 * frequency * 2.01 * t) * 0.28) *
      envelope *
      0.075;
    add(start + i, value, pan);
  }
};

const revealBreak =
  durationSeconds > 25
    ? { from: 21.95, to: 22.25 }
    : { from: 5.82, to: 6.08 };
const inRevealBreak = (seconds) =>
  seconds >= revealBreak.from && seconds <= revealBreak.to;
const totalBeats = Math.ceil(durationSeconds / beatSeconds);
const bassNotes = [110, 130.81, 98, 146.83];
const pluckNotes = [440, 523.25, 659.25, 523.25, 783.99, 659.25];

for (let beat = 0; beat < totalBeats; beat += 1) {
  const time = beat * beatSeconds;
  const beatInBar = beat % 4;

  if (!inRevealBreak(time)) {
    if (beatInBar === 0 || beatInBar === 2) {
      addKick(time, beatInBar === 0 ? 1 : 0.82);
    }
    if (beatInBar === 1 || beatInBar === 3) {
      addClap(time);
    }
    addBass(
      time,
      bassNotes[Math.floor(beat / 4) % bassNotes.length],
      beatSeconds * 0.82,
      time >= 5.05 && time < 8.1 ? 1.2 : 1,
    );
  }

  for (let half = 0; half < 2; half += 1) {
    const hatTime = time + half * beatSeconds * 0.5;
    if (!inRevealBreak(hatTime)) {
      addHat(hatTime, beatInBar === 3 && half === 1, half === 0 ? -0.25 : 0.25);
    }
  }

  const pluckTime = time + beatSeconds * 0.5;
  if (!inRevealBreak(pluckTime) && beat % 2 === 1) {
    addPluck(
      pluckTime,
      pluckNotes[beat % pluckNotes.length],
      beat % 4 === 1 ? -0.32 : 0.32,
    );
  }
}

const answerDrop = durationSeconds > 25 ? 28.25 : 8.2;
addKick(answerDrop, 1.18);
addPluck(answerDrop + 0.04, 783.99, -0.18);
addPluck(answerDrop + 0.15, 987.77, 0.18);

let peak = 0;
for (let i = 0; i < frameCount; i += 1) {
  const fadeOut =
    i < sampleRate * (durationSeconds - 0.65)
      ? 1
      : Math.max(
          0,
          1 -
            (i / sampleRate - (durationSeconds - 0.65)) / 0.65,
        );
  left[i] *= fadeOut;
  right[i] *= fadeOut;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}

const normalization = peak > 0 ? 0.84 / peak : 1;
const pcm = Buffer.alloc(frameCount * 4);
for (let i = 0; i < frameCount; i += 1) {
  pcm.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, left[i] * normalization)) * 32767),
    i * 4,
  );
  pcm.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, right[i] * normalization)) * 32767),
    i * 4 + 2,
  );
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);

const output = resolve(outputPath);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, Buffer.concat([header, pcm]));
console.log(`Generated ${output} (${durationSeconds}s, ${sampleRate}Hz stereo)`);
