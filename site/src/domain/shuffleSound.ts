type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

function createNoiseBuffer(context: AudioContext, duration: number) {
  const frameCount = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    const fade = 1 - index / frameCount;
    channel[index] = (Math.random() * 2 - 1) * fade;
  }

  return buffer;
}

function scheduleCardFlick(context: AudioContext, output: AudioNode, at: number, pitch: number) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();

  source.buffer = createNoiseBuffer(context, 0.075);
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(pitch, at);
  filter.Q.setValueAtTime(0.72, at);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(0.13, at + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.075);
  source.connect(filter).connect(envelope).connect(output);
  source.start(at);
  source.stop(at + 0.08);
}

function scheduleTableTap(context: AudioContext, output: AudioNode, at: number) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(118, at);
  oscillator.frequency.exponentialRampToValueAtTime(58, at + 0.12);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(0.18, at + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  oscillator.connect(envelope).connect(output);
  oscillator.start(at);
  oscillator.stop(at + 0.17);
}

function scheduleCardTurn(context: AudioContext, output: AudioNode, at: number) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();

  source.buffer = createNoiseBuffer(context, 0.18);
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(780, at);
  filter.frequency.exponentialRampToValueAtTime(2600, at + 0.14);
  filter.Q.setValueAtTime(0.58, at);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(0.11, at + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  source.connect(filter).connect(envelope).connect(output);
  source.start(at);
  source.stop(at + 0.19);
}

function scheduleSoftLanding(context: AudioContext, output: AudioNode, at: number) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(176, at);
  oscillator.frequency.exponentialRampToValueAtTime(104, at + 0.08);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(0.065, at + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
  oscillator.connect(envelope).connect(output);
  oscillator.start(at);
  oscillator.stop(at + 0.11);
}

export function playShuffleSound() {
  const context = getAudioContext();
  if (!context) return;

  void context.resume();
  const master = context.createGain();
  const start = context.currentTime + 0.025;
  master.gain.setValueAtTime(0.62, start);
  master.connect(context.destination);

  [0, 0.13, 0.25, 0.38, 0.5, 0.63, 0.76, 0.9, 1.04].forEach((offset, index) => {
    scheduleCardFlick(context, master, start + offset, 1200 + (index % 3) * 290);
  });
  scheduleTableTap(context, master, start + 0.12);
  scheduleTableTap(context, master, start + 1.18);
  window.setTimeout(() => master.disconnect(), 1600);
}

export function playCardFlipSound() {
  const context = getAudioContext();
  if (!context) return;

  void context.resume();
  const master = context.createGain();
  const start = context.currentTime + 0.012;
  master.gain.setValueAtTime(0.48, start);
  master.connect(context.destination);

  scheduleCardTurn(context, master, start);
  scheduleSoftLanding(context, master, start + 0.13);
  window.setTimeout(() => master.disconnect(), 420);
}
