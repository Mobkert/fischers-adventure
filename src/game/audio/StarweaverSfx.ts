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

/**
 * Magical star-bullet fire — soft whoosh + rising chirp.
 * Pitch steps up slightly for each staggered shot in the volley.
 */
export function playStarweaverBulletSfx(
  scene: Phaser.Scene,
  bulletIndex = 0
): void {
  const ctx = getAudioContext(scene);
  if (!ctx) return;

  const now = ctx.currentTime;
  const step = Math.max(0, Math.min(4, bulletIndex));
  const base = 520 + step * 95;

  // Airy whoosh (noise-ish via detuned saw + filter sweep)
  const whoosh = ctx.createOscillator();
  const whooshGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  whoosh.type = "sawtooth";
  whoosh.frequency.value = 90 + step * 12;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400 + step * 80, now);
  filter.frequency.exponentialRampToValueAtTime(1800 + step * 200, now + 0.12);
  filter.Q.value = 2.2;
  whooshGain.gain.setValueAtTime(0.0001, now);
  whooshGain.gain.exponentialRampToValueAtTime(0.12, now + 0.018);
  whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  whoosh.connect(filter);
  filter.connect(whooshGain);
  whooshGain.connect(ctx.destination);
  whoosh.start(now);
  whoosh.stop(now + 0.18);

  // Bright chirp (sine → triangle stack)
  const chirp = ctx.createOscillator();
  const chirp2 = ctx.createOscillator();
  const chirpGain = ctx.createGain();
  chirp.type = "sine";
  chirp2.type = "triangle";
  chirp.frequency.setValueAtTime(base, now);
  chirp.frequency.exponentialRampToValueAtTime(base * 2.15, now + 0.11);
  chirp2.frequency.setValueAtTime(base * 1.01, now);
  chirp2.frequency.exponentialRampToValueAtTime(base * 2.2, now + 0.11);
  chirpGain.gain.setValueAtTime(0.0001, now);
  chirpGain.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
  chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  chirp.connect(chirpGain);
  chirp2.connect(chirpGain);
  chirpGain.connect(ctx.destination);
  chirp.start(now);
  chirp2.start(now);
  chirp.stop(now + 0.16);
  chirp2.stop(now + 0.16);

  // Tiny high sparkle
  const spark = ctx.createOscillator();
  const sparkGain = ctx.createGain();
  spark.type = "square";
  spark.frequency.value = base * 3.2;
  sparkGain.gain.setValueAtTime(0.0001, now);
  sparkGain.gain.exponentialRampToValueAtTime(0.06, now + 0.008);
  sparkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  spark.connect(sparkGain);
  sparkGain.connect(ctx.destination);
  spark.start(now);
  spark.stop(now + 0.06);
}

/** Soft crystalline hit when a bullet reaches the fish. */
export function playStarweaverImpactSfx(
  scene: Phaser.Scene,
  bulletIndex = 0
): void {
  const ctx = getAudioContext(scene);
  if (!ctx) return;

  const now = ctx.currentTime;
  const pitch = 880 + Math.max(0, Math.min(4, bulletIndex)) * 70;

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc2.type = "triangle";
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.55, now + 0.1);
  osc2.frequency.setValueAtTime(pitch * 1.5, now);
  osc2.frequency.exponentialRampToValueAtTime(pitch * 0.8, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.14);
  osc2.stop(now + 0.14);
}
