import Phaser from "phaser";
import { playWarningBeep } from "./ZeusSfx";

function playPortalSweep(
  scene: Phaser.Scene,
  opts: {
    fromHz: number;
    toHz: number;
    volume: number;
    durationMs: number;
    type?: OscillatorType;
  }
): void {
  try {
    if (scene.sound.locked) scene.sound.unlock();
    const mgr = scene.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx: AudioContext | undefined = (
      mgr as unknown as { context?: AudioContext }
    ).context;
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? "sine";
    gain.gain.value = opts.volume;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const dur = opts.durationMs / 1000;
    const from = Math.max(20, opts.fromHz);
    const to = Math.max(20, opts.toHz);
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + dur);
    gain.gain.setValueAtTime(opts.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch {
    // Audio unavailable
  }
}

/** Source portal — fish getting sucked in. */
export function playPortalOpenSfx(scene: Phaser.Scene): void {
  playPortalSweep(scene, {
    fromHz: 420,
    toHz: 90,
    volume: 0.26,
    durationMs: 190,
    type: "sine",
  });
  scene.time.delayedCall(30, () =>
    playWarningBeep(scene, { pitch: 240, volume: 0.2, durationMs: 110 })
  );
  scene.time.delayedCall(70, () =>
    playWarningBeep(scene, { pitch: 140, volume: 0.16, durationMs: 140 })
  );
}

/** Destination portal — fish warps to the bobber. */
export function playPortalArriveSfx(scene: Phaser.Scene): void {
  playPortalSweep(scene, {
    fromHz: 160,
    toHz: 920,
    volume: 0.24,
    durationMs: 170,
    type: "triangle",
  });
  scene.time.delayedCall(45, () =>
    playWarningBeep(scene, { pitch: 660, volume: 0.22, durationMs: 90 })
  );
  scene.time.delayedCall(85, () =>
    playWarningBeep(scene, { pitch: 880, volume: 0.16, durationMs: 130 })
  );
}
