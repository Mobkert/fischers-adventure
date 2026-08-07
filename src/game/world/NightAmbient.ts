import Phaser from "phaser";

type GlowEntry = {
  obj: Phaser.GameObjects.Components.AlphaSingle;
  dayAlpha: number;
  nightAlpha: number;
};

/**
 * Soft night lights (lamps / windows) and firefly wrappers.
 * Call update(nightFactor) each frame from GameScene.
 */
export class NightAmbient {
  private glows: GlowEntry[] = [];

  addGlow(
    obj: Phaser.GameObjects.Components.AlphaSingle,
    dayAlpha: number,
    nightAlpha: number
  ): void {
    this.glows.push({ obj, dayAlpha, nightAlpha });
    obj.setAlpha(dayAlpha);
  }

  update(nightFactor: number): void {
    const t = Phaser.Math.Clamp(nightFactor, 0, 1);
    for (const g of this.glows) {
      g.obj.setAlpha(
        Phaser.Math.Linear(g.dayAlpha, g.nightAlpha, t)
      );
    }
  }
}
