import Phaser from "phaser";
import { playWarningBeep } from "./ZeusSfx";

/** Forge weapons arm above the hotbar. */
export function playForgeArmSfx(scene: Phaser.Scene): void {
  playWarningBeep(scene, { pitch: 320, volume: 0.24, durationMs: 120 });
  scene.time.delayedCall(80, () =>
    playWarningBeep(scene, { pitch: 480, volume: 0.2, durationMs: 100 })
  );
}

/** Single weapon launches toward the progress bar. */
export function playForgeLaunchSfx(scene: Phaser.Scene, kind: "sword" | "axe"): void {
  playWarningBeep(scene, {
    pitch: kind === "sword" ? 720 : 420,
    volume: 0.22,
    durationMs: 70,
  });
}

/** Weapon strikes the progress bar. */
export function playForgeHitSfx(scene: Phaser.Scene, kind: "sword" | "axe"): void {
  playWarningBeep(scene, {
    pitch: kind === "sword" ? 880 : 260,
    volume: 0.26,
    durationMs: 90,
  });
}
