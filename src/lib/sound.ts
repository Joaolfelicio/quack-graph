let ctx: AudioContext | null = null;
let lastPlay = 0;
const MIN_INTERVAL_MS = 25;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function gate(): boolean {
  const now = performance.now();
  if (now - lastPlay < MIN_INTERVAL_MS) return false;
  lastPlay = now;
  return true;
}

export function quack(value: number, maxValue: number): void {
  if (!gate()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const basePitch = 180 + (1 - value / Math.max(1, maxValue)) * 320;
  const osc1 = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  osc1.type = 'sawtooth';
  osc2.type = 'sawtooth';
  osc1.frequency.setValueAtTime(basePitch, t0);
  osc2.frequency.setValueAtTime(basePitch * 1.01, t0);
  osc1.frequency.exponentialRampToValueAtTime(basePitch * 0.7, t0 + 0.09);
  osc2.frequency.exponentialRampToValueAtTime(basePitch * 0.7 * 1.01, t0 + 0.09);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(c.destination);
  osc1.start(t0);
  osc2.start(t0);
  osc1.stop(t0 + 0.13);
  osc2.stop(t0 + 0.13);
}

export function splash(value: number, maxValue: number): void {
  if (!gate()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const bufferSize = Math.floor(c.sampleRate * 0.05);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  src.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 600 + (value / Math.max(1, maxValue)) * 900;
  filter.Q.value = 2;
  gain.gain.setValueAtTime(0.08, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
  src.stop(t0 + 0.06);
}
