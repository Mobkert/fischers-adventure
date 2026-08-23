import Phaser from "phaser";
import type { Fish } from "../entities/Fish";
import { playPortalArriveSfx, playPortalOpenSfx } from "../audio/PortalSfx";
const PORTAL_PURPLE = 0x9333ff;
const PORTAL_VIOLET = 0xc084fc;
const PORTAL_VOID = 0x08040f;

function spawnPortalBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  depth: number,
  scale = 1
): void {
  for (let i = 0; i < 4; i++) {
    const ring = scene.add
      .circle(x, y, 10 * scale * (0.75 - i * 0.08), PORTAL_PURPLE, 0.34 - i * 0.06)
      .setStrokeStyle(Math.max(1, 3 - i), PORTAL_VIOLET, 0.92 - i * 0.15)
      .setDepth(depth + i)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.8 + i * 0.4,
      scaleY: 2.2 + i * 0.35,
      alpha: 0,
      duration: 340 + i * 80,
      delay: i * 40,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  const voidCore = scene.add
    .circle(x, y, 7 * scale, PORTAL_VOID, 0.95)
    .setDepth(depth + 5)
    .setStrokeStyle(2, 0x7c3aed, 1);
  scene.tweens.add({
    targets: voidCore,
    scaleX: 0.2,
    scaleY: 0.2,
    alpha: 0,
    duration: 280,
    ease: "Quad.easeIn",
    onComplete: () => voidCore.destroy(),
  });

  const flash = scene.add
    .circle(x, y, 5 * scale, 0xffffff, 0.85)
    .setDepth(depth + 6)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: flash,
    scaleX: 2.4,
    scaleY: 2.4,
    alpha: 0,
    duration: 180,
    ease: "Quad.easeOut",
    onComplete: () => flash.destroy(),
  });

  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.15, 0.15);
    const dist = Phaser.Math.FloatBetween(18, 42) * scale;
    const shard = scene.add
      .ellipse(x, y, 8, 3, i % 2 ? 0xe9d5ff : 0xa855f7, 0.9)
      .setDepth(depth + 4)
      .setRotation(ang);
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist * 0.65,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      angle: shard.angle + Phaser.Math.Between(-120, 120),
      duration: Phaser.Math.Between(320, 480),
      ease: "Cubic.easeOut",
      onComplete: () => shard.destroy(),
    });
  }
}

/** Warp the rarest fish toward the bobber with twin portal bursts. */
export function playPortalPullFx(
  scene: Phaser.Scene,
  fish: Fish,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  onArrive: () => void
): void {
  const depth = fish.sprite.depth + 8;
  const sx = fish.sprite.scaleX;
  const sy = fish.sprite.scaleY;
  spawnPortalBurst(scene, fromX, fromY, depth, 1.1);
  playPortalOpenSfx(scene);

  scene.tweens.add({    targets: fish.sprite,
    scaleX: sx * 0.15,
    scaleY: sy * 0.15,
    alpha: 0.15,
    duration: 160,
    ease: "Quad.easeIn",
    onComplete: () => {
      spawnPortalBurst(scene, toX, toY, depth + 2, 0.95);
      playPortalArriveSfx(scene);
      fish.sprite.setPosition(toX, toY);
      scene.tweens.add({
        targets: fish.sprite,
        scaleX: sx,
        scaleY: sy,
        alpha: 1,
        duration: 220,
        ease: "Back.easeOut",
        onComplete: onArrive,
      });
    },
  });

  // Energy trail along the warp path
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / (steps + 1);
    const px = Phaser.Math.Linear(fromX, toX, t);
    const py = Phaser.Math.Linear(fromY, toY, t);
    scene.time.delayedCall(40 + i * 28, () => {
      const spark = scene.add
        .circle(px, py, Phaser.Math.FloatBetween(2, 4), 0xddd6fe, 0.9)
        .setDepth(depth + 3)
        .setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0.1,
        duration: 220,
        onComplete: () => spark.destroy(),
      });
    });
  }
}

/** Animated portal at the rod tip while the line is out. */
export class PortalRodTipVfx {
  private root: Phaser.GameObjects.Container;
  private outer: Phaser.GameObjects.Arc;
  private mid: Phaser.GameObjects.Arc;
  private inner: Phaser.GameObjects.Arc;
  private voidCore: Phaser.GameObjects.Arc;
  private glint: Phaser.GameObjects.Arc;
  private halo: Phaser.GameObjects.Arc;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(620).setVisible(false);
    this.halo = scene.add
      .circle(0, 0, 14, PORTAL_PURPLE, 0.14)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.outer = scene.add
      .circle(0, 0, 9, PORTAL_PURPLE, 0)
      .setStrokeStyle(2, PORTAL_VIOLET, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.mid = scene.add
      .circle(0, 0, 6.5, 0x7c3aed, 0)
      .setStrokeStyle(1.5, 0xa855f7, 0.85)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.inner = scene.add
      .circle(0, 0, 4.8, 0xc4b5fd, 0)
      .setStrokeStyle(1, 0xe9d5ff, 0.75)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.voidCore = scene.add.circle(0, 0, 3.2, PORTAL_VOID, 0.92);
    this.glint = scene.add
      .circle(2, -2, 1.2, 0xffffff, 0.85)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.add([
      this.halo,
      this.outer,
      this.mid,
      this.inner,
      this.voidCore,
      this.glint,
    ]);
  }

  setActive(on: boolean): void {
    if (this.visible === on) return;
    this.visible = on;
    this.root.setVisible(on);
  }

  update(x: number, y: number, now: number): void {
    if (!this.visible) return;
    this.root.setPosition(x + 4, y - 3);
    const pulse = 0.88 + Math.sin(now / 140) * 0.12;
    const spin = now / 420;
    this.halo.setScale(pulse * 1.15);
    this.outer.setScale(pulse).setRotation(spin);
    this.mid.setScale(pulse * 0.92).setRotation(-spin * 1.35);
    this.inner.setScale(pulse * 0.85).setRotation(spin * 1.8);
    this.voidCore.setScale(pulse * 0.78);
    this.glint.setAlpha(0.55 + Math.sin(now / 90) * 0.35);
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
