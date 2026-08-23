import Phaser from "phaser";

const EMBER = 0xff6622;
const EMBER_CORE = 0xffcc66;

/** Animated embers + heat halo at the forge rod tip / furnace. */
export class ForgeRodTipVfx {
  private root: Phaser.GameObjects.Container;
  private halo: Phaser.GameObjects.Arc;
  private core: Phaser.GameObjects.Arc;
  private sparks: Phaser.GameObjects.Arc[] = [];
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(14).setVisible(false);
    this.halo = scene.add
      .circle(0, 0, 16, EMBER, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.core = scene.add
      .circle(0, 0, 6, EMBER_CORE, 0.55)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add([this.halo, this.core]);
    for (let i = 0; i < 5; i++) {
      const spark = scene.add
        .circle(0, 0, 1.6, 0xffeeaa, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.sparks.push(spark);
      this.root.add(spark);
    }
  }

  setActive(on: boolean): void {
    if (this.visible === on) return;
    this.visible = on;
    this.root.setVisible(on);
  }

  setDepth(depth: number): void {
    this.root.setDepth(depth);
  }

  update(x: number, y: number, now: number): void {
    if (!this.visible) return;
    this.root.setPosition(x - 2, y - 4);
    const pulse = 0.86 + Math.sin(now / 120) * 0.14;
    this.halo.setScale(pulse * 1.2);
    this.core.setScale(pulse * 0.9);
    this.core.setAlpha(0.45 + Math.sin(now / 80) * 0.25);
    for (let i = 0; i < this.sparks.length; i++) {
      const t = now / 280 + i * 1.3;
      const orbit = 7 + i * 1.8;
      const sx = Math.cos(t * 1.6 + i) * orbit;
      const sy = Math.sin(t * 2.1 + i * 0.7) * orbit * 0.65 - 4;
      const spark = this.sparks[i]!;
      spark.setPosition(sx, sy);
      spark.setAlpha(0.35 + Math.sin(t * 3) * 0.35);
      spark.setScale(0.7 + Math.sin(t * 2.5) * 0.35);
    }
  }

  destroy(): void {
    this.root.destroy(true);
  }
}

/** Brief flash when a forge weapon hits the progress bar. */
export function playForgeWeaponHitFx(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: "sword" | "axe"
): void {
  const color = kind === "sword" ? 0xaaccff : 0xff8844;
  const flash = scene.add
    .circle(x, y, 8, color, 0.75)
    .setDepth(220)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: flash,
    scale: 2.2,
    alpha: 0,
    duration: 220,
    ease: "Quad.easeOut",
    onComplete: () => flash.destroy(),
  });
}
