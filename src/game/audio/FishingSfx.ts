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

function makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

/** Line whipping out — swoosh + faint reel zip. */
export function playCastLineSfx(
  scene: Phaser.Scene,
  opts?: { durationMs?: number; volume?: number }
): void {
  const ctx = getAudioContext(scene);
  if (!ctx) return;

  const now = ctx.currentTime;
  const dur = (opts?.durationMs ?? 520) / 1000;
  const vol = opts?.volume ?? 0.32;

  // Filtered noise swoosh (line cutting air)
  {
    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx, dur + 0.05);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(4200, now);
    filter.frequency.exponentialRampToValueAtTime(380, now + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.06);
  }

  // Thin zip overtone
  {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + dur * 0.85);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol * 0.35, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.7);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }
}

/** Bobber hits the water. */
export function playBobberSplashSfx(
  scene: Phaser.Scene,
  power = 1
): void {
  const ctx = getAudioContext(scene);
  if (!ctx) return;

  const now = ctx.currentTime;
  const p = Phaser.Math.Clamp(power, 0.5, 1.4);
  const vol = 0.38 * p;

  // Body splash — noise through lowpass
  {
    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx, 0.35);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.28);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.34);
  }

  // Wet thump
  {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180 * p, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
    gain.gain.setValueAtTime(vol * 0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Tiny droplet tinkle
  scene.time.delayedCall(40, () => {
    const c = getAudioContext(scene);
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 880 + Math.random() * 200;
    gain.gain.setValueAtTime(0.08 * p, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  });
}

/** Soft bubble pops while the line sinks deeper. */
export function playSinkBubbleSfx(
  scene: Phaser.Scene,
  durationMs: number
): void {
  const ctx = getAudioContext(scene);
  if (!ctx) return;

  const pops = Math.max(3, Math.min(12, Math.floor(durationMs / 120)));
  for (let i = 0; i < pops; i++) {
    const delay = (durationMs / pops) * i + Phaser.Math.Between(0, 40);
    scene.time.delayedCall(delay, () => {
      const c = getAudioContext(scene);
      if (!c) return;
      const now = c.currentTime;

      const osc = c.createOscillator();
      const filter = c.createBiquadFilter();
      const gain = c.createGain();
      filter.type = "bandpass";
      filter.frequency.value = Phaser.Math.Between(400, 900);
      filter.Q.value = 8;
      osc.type = "sine";
      osc.frequency.setValueAtTime(Phaser.Math.Between(280, 520), now);
      osc.frequency.exponentialRampToValueAtTime(
        Phaser.Math.Between(120, 220),
        now + 0.09
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.13);

      // Wet blip
      const n = c.createBufferSource();
      n.buffer = makeNoiseBuffer(c, 0.06);
      const nf = c.createBiquadFilter();
      nf.type = "highpass";
      nf.frequency.value = 1200;
      const ng = c.createGain();
      ng.gain.setValueAtTime(0.06, now);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      n.connect(nf);
      nf.connect(ng);
      ng.connect(c.destination);
      n.start(now);
      n.stop(now + 0.06);
    });
  }
}
