import Phaser from "phaser";

function getAudioCtx(scene: Phaser.Scene): AudioContext | null {
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

/** Soft pink meteor whoosh as a star dives toward the bar. */
export function playStarLineMeteorSfx(
  scene: Phaser.Scene,
  opts?: { pitch?: number }
): void {
  const ctx = getAudioCtx(scene);
  if (!ctx) return;
  try {
    const pitch = opts?.pitch ?? 520;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(pitch * 1.6, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.55, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {
    // Audio unavailable
  }
}

/** Punchy star-impact explosion when a meteor hits the bar zone. */
export function playStarLineExplosionSfx(scene: Phaser.Scene): void {
  const ctx = getAudioCtx(scene);
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Low boom
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = "sine";
    boom.frequency.setValueAtTime(120, now);
    boom.frequency.exponentialRampToValueAtTime(40, now + 0.28);
    boomGain.gain.setValueAtTime(0.28, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.32);

    // Bright crackle layers
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? "square" : "triangle";
      const p = 680 + i * 220 + Math.random() * 80;
      osc.frequency.setValueAtTime(p, now + i * 0.018);
      osc.frequency.exponentialRampToValueAtTime(p * 0.4, now + 0.12 + i * 0.02);
      gain.gain.setValueAtTime(0.14 - i * 0.03, now + i * 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14 + i * 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.018);
      osc.stop(now + 0.18 + i * 0.02);
    }

    // Noise burst
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.8;
    nGain.gain.setValueAtTime(0.22, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.13);
  } catch {
    // Audio unavailable
  }
}
