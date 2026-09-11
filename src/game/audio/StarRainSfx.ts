import Phaser from "phaser";

function getAudioContext(scene: Phaser.Scene): AudioContext | null {
  try {
    if (scene.sound.locked) scene.sound.unlock();
    const mgr = scene.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = (mgr as unknown as { context?: AudioContext }).context;
    if (!ctx) return null;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type SpaceBus = {
  ctx: AudioContext;
  input: GainNode;
};

let spaceBus: SpaceBus | null = null;

/** Dry bus — no echo. */
function getSpaceBus(ctx: AudioContext): SpaceBus {
  if (spaceBus && spaceBus.ctx === ctx) return spaceBus;

  const input = ctx.createGain();
  input.gain.value = 1;
  input.connect(ctx.destination);

  spaceBus = { ctx, input };
  return spaceBus;
}

/**
 * Mystical star-hit — soft chime, minor-color cluster, gentle shimmer.
 * Pitch climbs with each successive ding. No echo.
 */
export function playStarRainDingSfx(
  scene: Phaser.Scene,
  hitIndex = 0
): void {
  const ctx = getAudioContext(scene);
  if (!ctx) return;

  const now = ctx.currentTime;
  const step = Math.max(0, hitIndex);
  // Soft mystic ladder (starts around G4)
  const root = Math.min(392 * Math.pow(2, step / 18), 1568);
  const bus = getSpaceBus(ctx);

  // —— Soft veiled thump (ritual body) ——
  {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(root * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(root * 0.32, now + 0.28);
    filter.type = "lowpass";
    filter.frequency.value = 520;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bus.input);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  // —— Mystical chord: root · minor 3rd · 5th · octave · soft 7th ——
  const tones: Array<{
    mult: number;
    type: OscillatorType;
    vol: number;
    len: number;
    attack: number;
  }> = [
    { mult: 1, type: "sine", vol: 0.2, len: 0.85, attack: 0.04 },
    { mult: 1.189, type: "sine", vol: 0.14, len: 0.8, attack: 0.05 }, // ~min 3rd
    { mult: 1.498, type: "triangle", vol: 0.1, len: 0.72, attack: 0.06 }, // 5th
    { mult: 2, type: "sine", vol: 0.09, len: 0.7, attack: 0.05 },
    { mult: 1.782, type: "sine", vol: 0.055, len: 0.65, attack: 0.08 }, // ~min 7th
  ];

  for (const t of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = root * t.mult;
    osc.type = t.type;
    osc.frequency.setValueAtTime(freq, now);
    // Slow float — mystical drift
    osc.frequency.exponentialRampToValueAtTime(freq * 0.985, now + t.len);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(t.vol, now + t.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.len);
    osc.connect(gain);
    gain.connect(bus.input);
    osc.start(now);
    osc.stop(now + t.len + 0.04);
  }

  // —— Soft choir-ish overtone (gentle AM shimmer via second osc sum) ——
  {
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const outGain = ctx.createGain();
    carrier.type = "sine";
    mod.type = "sine";
    carrier.frequency.setValueAtTime(root * 2.5, now);
    mod.frequency.setValueAtTime(5.5, now);
    modGain.gain.value = root * 0.35;
    outGain.gain.setValueAtTime(0.0001, now);
    outGain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
    outGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(outGain);
    outGain.connect(bus.input);
    carrier.start(now);
    mod.start(now);
    carrier.stop(now + 0.95);
    mod.stop(now + 0.95);
  }

  // —— Crystal dust (very soft, high, filtered) ——
  {
    const dur = 0.16;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const u = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - u, 2.2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = root * 3.1;
    bp.Q.value = 6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(bus.input);
    src.start(now);
    src.stop(now + dur);
  }
}
