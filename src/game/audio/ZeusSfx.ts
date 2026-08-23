import Phaser from "phaser";

/** Short warning beep for Zeus rod lightning telegraph. */
export function playWarningBeep(
  scene: Phaser.Scene,
  opts?: { pitch?: number; volume?: number; durationMs?: number }
): void {
  try {
    if (scene.sound.locked) scene.sound.unlock();
    const mgr = scene.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx: AudioContext | undefined =
      // Phaser 3 exposes context on the manager
      (mgr as unknown as { context?: AudioContext }).context;
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const pitch = opts?.pitch ?? 880;
    const volume = opts?.volume ?? 0.22;
    const durationMs = opts?.durationMs ?? 90;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = pitch;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // Audio unavailable
  }
}

/** Deeper crack for the lightning strike itself. */
export function playLightningCrack(scene: Phaser.Scene): void {
  playWarningBeep(scene, { pitch: 180, volume: 0.28, durationMs: 140 });
  scene.time.delayedCall(40, () =>
    playWarningBeep(scene, { pitch: 520, volume: 0.18, durationMs: 70 })
  );
}

/** Louder multi-hit crack for world thunderstorm bolts. */
export function playWorldLightning(
  scene: Phaser.Scene,
  opts?: { volumeScale?: number }
): void {
  const s = opts?.volumeScale ?? 1;
  playWarningBeep(scene, { pitch: 90, volume: 0.34 * s, durationMs: 200 });
  scene.time.delayedCall(35, () =>
    playWarningBeep(scene, { pitch: 200, volume: 0.28 * s, durationMs: 130 })
  );
  scene.time.delayedCall(85, () =>
    playWarningBeep(scene, { pitch: 420, volume: 0.2 * s, durationMs: 90 })
  );
  scene.time.delayedCall(140, () =>
    playWarningBeep(scene, { pitch: 160, volume: 0.16 * s, durationMs: 160 })
  );
}
