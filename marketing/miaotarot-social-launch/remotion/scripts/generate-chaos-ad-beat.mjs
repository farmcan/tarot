import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const sampleRate = 48_000;
const durationSeconds = 15;
const outputPath = "public/audio/chaos-ad-beat.wav";
const frameCount = sampleRate * durationSeconds;
const left = new Float64Array(frameCount);
const right = new Float64Array(frameCount);
const bpm = 150;
const beatSeconds = 60 / bpm;

let seed = 0x9f6a13d2;
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

const kick = (seconds, accent = 1) => {
  const start = Math.floor(seconds * sampleRate);
  const length = Math.floor(sampleRate * 0.24);
  let phase = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const progress = i / length;
    const frequency = 155 * (1 - progress) ** 3 + 43;
    phase += (Math.PI * 2 * frequency) / sampleRate;
    const body = Math.sin(phase) * Math.exp(-t * 18);
    const click = i < 110 ? noise() * (1 - i / 110) * 0.25 : 0;
    add(start + i, (body * 0.68 + click) * accent);
  }
};

const boom = (seconds, accent = 1) => {
  const start = Math.floor(seconds * sampleRate);
  const length = Math.floor(sampleRate * 0.62);
  let phase = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const frequency = 68 - Math.min(28, t * 60);
    phase += (Math.PI * 2 * frequency) / sampleRate;
    const sub = Math.sin(phase) * Math.exp(-t * 4.7);
    const crack = noise() * Math.exp(-t * 35) * 0.18;
    add(start + i, (sub * 0.68 + crack) * accent);
  }
};

const clap = (seconds) => {
  const start = Math.floor(seconds * sampleRate);
  for (const offsetSeconds of [0, 0.016, 0.033]) {
    const offset = Math.floor(offsetSeconds * sampleRate);
    const length = Math.floor(sampleRate * 0.085);
    let previous = 0;
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const raw = noise();
      const high = raw - previous * 0.78;
      previous = raw;
      add(start + offset + i, high * Math.exp(-t * 39) * 0.2, 0.08);
    }
  }
};

const hat = (seconds, open = false, pan = 0) => {
  const start = Math.floor(seconds * sampleRate);
  const length = Math.floor(sampleRate * (open ? 0.14 : 0.045));
  let previous = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const raw = noise();
    const high = raw - previous * 0.9;
    previous = raw;
    add(
      start + i,
      high * Math.exp(-t * (open ? 22 : 78)) * (open ? 0.085 : 0.065),
      pan,
    );
  }
};

const bass = (seconds, frequency, lengthSeconds, accent = 1) => {
  const start = Math.floor(seconds * sampleRate);
  const length = Math.floor(lengthSeconds * sampleRate);
  let phase = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.012);
    const release = Math.min(1, (lengthSeconds - t) / 0.075);
    const envelope = Math.max(0, Math.min(attack, release));
    phase += (Math.PI * 2 * frequency) / sampleRate;
    const value =
      Math.sin(phase) * 0.72 +
      Math.sin(phase * 2) * 0.2 +
      Math.sin(phase * 3) * 0.08;
    add(start + i, value * envelope * 0.16 * accent);
  }
};

const stab = (seconds, frequency, pan = 0) => {
  const start = Math.floor(seconds * sampleRate);
  const length = Math.floor(sampleRate * 0.16);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 18);
    const value =
      Math.sin(Math.PI * 2 * frequency * t) +
      Math.sin(Math.PI * 2 * frequency * 1.5 * t) * 0.5 +
      Math.sin(Math.PI * 2 * frequency * 2.01 * t) * 0.22;
    add(start + i, value * envelope * 0.065, pan);
  }
};

const riser = (fromSeconds, toSeconds) => {
  const start = Math.floor(fromSeconds * sampleRate);
  const length = Math.floor((toSeconds - fromSeconds) * sampleRate);
  let previous = 0;
  for (let i = 0; i < length; i += 1) {
    const progress = i / length;
    const raw = noise();
    const high = raw - previous * (0.88 - progress * 0.18);
    previous = raw;
    const envelope = progress ** 2 * Math.min(1, (1 - progress) * 8);
    add(start + i, high * envelope * 0.12, progress * 0.6 - 0.3);
  }
};

const inBreak = (seconds) =>
  (seconds >= 4.06 && seconds < 4.39) ||
  (seconds >= 6.44 && seconds < 6.59) ||
  (seconds >= 9.22 && seconds < 9.38);

const roots = [55, 65.41, 49, 73.42];
const totalBeats = Math.ceil(durationSeconds / beatSeconds);
const kickOffsets = [0, 0.75, 1.5, 2.75];

for (let barStart = 0; barStart < totalBeats; barStart += 4) {
  const barSeconds = barStart * beatSeconds;
  for (const offset of kickOffsets) {
    const seconds = barSeconds + offset * beatSeconds;
    if (seconds < durationSeconds && !inBreak(seconds)) {
      kick(seconds, offset === 0 ? 1 : 0.8);
    }
  }
}

for (let beat = 0; beat < totalBeats; beat += 1) {
  const seconds = beat * beatSeconds;
  if (!inBreak(seconds)) {
    if (beat % 4 === 1 || beat % 4 === 3) clap(seconds);
    bass(
      seconds,
      roots[Math.floor(beat / 4) % roots.length],
      beatSeconds * 0.86,
      seconds >= 4.4 && seconds < 6.4 ? 1.2 : 1,
    );
  }
  for (let division = 0; division < 2; division += 1) {
    const hatSeconds = seconds + division * beatSeconds * 0.5;
    if (!inBreak(hatSeconds)) {
      hat(hatSeconds, beat % 4 === 3 && division === 1, division ? 0.22 : -0.22);
    }
  }
  if (beat % 2 === 1 && !inBreak(seconds + beatSeconds * 0.5)) {
    const chordRoot = roots[Math.floor(beat / 4) % roots.length] * 4;
    stab(seconds + beatSeconds * 0.5, chordRoot, beat % 4 === 1 ? -0.28 : 0.28);
  }
}

riser(3.5, 4.36);
riser(8.62, 9.36);
for (const [seconds, accent] of [
  [0, 1.05],
  [4.4, 1.35],
  [4.73, 1.14],
  [5.06, 1.08],
  [6.6, 1.22],
  [9.4, 1.18],
  [11.6, 1.12],
  [13.5, 1.26],
]) {
  boom(seconds, accent);
}

let peak = 0;
for (let i = 0; i < frameCount; i += 1) {
  const seconds = i / sampleRate;
  const fadeIn = Math.min(1, seconds / 0.035);
  const fadeOut =
    seconds < durationSeconds - 0.4
      ? 1
      : Math.max(0, (durationSeconds - seconds) / 0.4);
  left[i] *= fadeIn * fadeOut;
  right[i] *= fadeIn * fadeOut;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}

const normalization = peak > 0 ? 0.89 / peak : 1;
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

const absoluteOutput = resolve(outputPath);
mkdirSync(dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, Buffer.concat([header, pcm]));
console.log(`Generated ${absoluteOutput} (${durationSeconds}s, ${bpm} BPM)`);
