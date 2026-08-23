import Phaser from "phaser";
import { playWarningBeep } from "./ZeusSfx";

/** Loud telegraph before the Recoil Rod kicks the catch bar. */
export function playRecoilWarning(scene: Phaser.Scene): void {
  playWarningBeep(scene, { pitch: 420, volume: 0.42, durationMs: 160 });
  scene.time.delayedCall(120, () =>
    playWarningBeep(scene, { pitch: 620, volume: 0.38, durationMs: 140 })
  );
}

/** Heavy shotgun blast when the bar launches. */
export function playRecoilShot(scene: Phaser.Scene): void {
  playWarningBeep(scene, { pitch: 70, volume: 0.48, durationMs: 220 });
  scene.time.delayedCall(30, () =>
    playWarningBeep(scene, { pitch: 140, volume: 0.4, durationMs: 180 })
  );
  scene.time.delayedCall(70, () =>
    playWarningBeep(scene, { pitch: 280, volume: 0.28, durationMs: 100 })
  );
  scene.time.delayedCall(110, () =>
    playWarningBeep(scene, { pitch: 90, volume: 0.22, durationMs: 260 })
  );
}
