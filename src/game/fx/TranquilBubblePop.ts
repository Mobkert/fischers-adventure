import Phaser from "phaser";

export type TranquilBubblePopOptions = {
  depth?: number;
  scrollFactor?: number;
  /** Visual intensity — use ~0.45 for the progress-bar marker. */
  intensity?: number;
};

/**
 * Glass bubble burst — expanding rings, flash, droplets, and shell shards.
 */
export function playTranquilBubblePopFx(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  opts?: TranquilBubblePopOptions
): void {
  const depth = opts?.depth ?? 200;
  const scrollFactor = opts?.scrollFactor ?? 1;
  const intensity = Phaser.Math.Clamp(opts?.intensity ?? 1, 0.35, 1.4);
  const r = Math.max(6, radius) * intensity;

  // Staggered shockwave rings
  for (let i = 0; i < 3; i++) {
    const ring = scene.add
      .circle(x, y, r * (0.82 - i * 0.06), 0x8fe9ff, 0.38 - i * 0.1)
      .setStrokeStyle(Math.max(1, 3 - i), 0xf7ffff, 0.95 - i * 0.18)
      .setDepth(depth + i)
      .setScrollFactor(scrollFactor);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.4 + i * 0.35,
      scaleY: 2.4 + i * 0.35,
      alpha: 0,
      duration: 260 + i * 90,
      delay: i * 45,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  // Core white flash
  const flash = scene.add
    .circle(x, y, r * 0.45, 0xffffff, 0.98)
    .setDepth(depth + 4)
    .setScrollFactor(scrollFactor)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: flash,
    scaleX: 2.6,
    scaleY: 2.6,
    alpha: 0,
    duration: 190,
    ease: "Quad.easeOut",
    onComplete: () => flash.destroy(),
  });

  // Cyan bloom
  const bloom = scene.add
    .circle(x, y, r * 0.35, 0x59dfff, 0.55)
    .setDepth(depth + 3)
    .setScrollFactor(scrollFactor)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: bloom,
    scaleX: 3.2,
    scaleY: 2.4,
    alpha: 0,
    duration: 320,
    ease: "Sine.easeOut",
    onComplete: () => bloom.destroy(),
  });

  // Shell shards
  const shardCount = Math.max(6, Math.round(10 * intensity));
  for (let i = 0; i < shardCount; i++) {
    const ang = (i / shardCount) * Math.PI * 2;
    const shard = scene.add
      .ellipse(x, y, 10 * intensity, 4 * intensity, 0xc8f7ff, 0.9)
      .setDepth(depth + 3)
      .setScrollFactor(scrollFactor)
      .setRotation(ang);
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(ang) * r * Phaser.Math.FloatBetween(1.4, 2.2),
      y: y + Math.sin(ang) * r * Phaser.Math.FloatBetween(0.7, 1.3),
      alpha: 0,
      scaleX: 0.15,
      scaleY: 0.15,
      angle: shard.angle + Phaser.Math.Between(-90, 90),
      duration: Phaser.Math.Between(300, 420),
      ease: "Cubic.easeOut",
      onComplete: () => shard.destroy(),
    });
  }

  // Spray droplets
  const dropCount = Math.max(10, Math.round(18 * intensity));
  for (let i = 0; i < dropCount; i++) {
    const ang =
      (i / dropCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
    const dist = r * Phaser.Math.FloatBetween(0.9, 2.4);
    const drop = scene.add
      .circle(
        x,
        y,
        Phaser.Math.FloatBetween(2, 5) * intensity,
        i % 3 === 0 ? 0xffffff : 0x9feaff,
        0.95
      )
      .setDepth(depth + 5)
      .setScrollFactor(scrollFactor);
    scene.tweens.add({
      targets: drop,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist * 0.55 + Phaser.Math.Between(8, 28),
      alpha: 0,
      scale: 0.08,
      duration: Phaser.Math.Between(280, 500),
      ease: "Cubic.easeOut",
      onComplete: () => drop.destroy(),
    });
  }

  // Rising mist wisps (full-size fish pops)
  if (intensity >= 0.7) {
    for (let i = 0; i < 7; i++) {
      const wisp = scene.add
        .circle(
          x + Phaser.Math.Between(-r * 0.45, r * 0.45),
          y,
          Phaser.Math.Between(3, 7),
          0xd7fbff,
          0.55
        )
        .setDepth(depth + 2)
        .setScrollFactor(scrollFactor);
      scene.tweens.add({
        targets: wisp,
        y: y - Phaser.Math.Between(28, 72),
        x: wisp.x + Phaser.Math.Between(-22, 22),
        alpha: 0,
        scale: Phaser.Math.Between(1.4, 2.2),
        duration: 520 + i * 35,
        ease: "Sine.easeOut",
        onComplete: () => wisp.destroy(),
      });
    }
  }
}

/** Horizonbreaker void bubble burst — orange/purple rings + dark sparks. */
export function playHorizonBubblePopFx(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  opts?: TranquilBubblePopOptions
): void {
  const depth = opts?.depth ?? 200;
  const scrollFactor = opts?.scrollFactor ?? 1;
  const r = Math.max(6, radius);

  for (let i = 0; i < 3; i++) {
    const ring = scene.add
      .circle(x, y, r * (0.8 - i * 0.05), i % 2 ? 0xff8c42 : 0x9b5de5, 0.4 - i * 0.1)
      .setStrokeStyle(Math.max(1, 3 - i), i % 2 ? 0xffe066 : 0xc9a0ff, 0.9)
      .setDepth(depth + i)
      .setScrollFactor(scrollFactor);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.2 + i * 0.3,
      scaleY: 2.2 + i * 0.3,
      alpha: 0,
      duration: 280 + i * 80,
      delay: i * 40,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  const core = scene.add
    .circle(x, y, r * 0.4, 0x000000, 0.95)
    .setDepth(depth + 4)
    .setScrollFactor(scrollFactor);
  scene.tweens.add({
    targets: core,
    scaleX: 0.2,
    scaleY: 0.2,
    alpha: 0,
    duration: 220,
    ease: "Quad.easeIn",
    onComplete: () => core.destroy(),
  });

  const flash = scene.add
    .circle(x, y, r * 0.35, 0xffe066, 0.85)
    .setDepth(depth + 5)
    .setScrollFactor(scrollFactor)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: flash,
    scaleX: 2.4,
    scaleY: 2.4,
    alpha: 0,
    duration: 200,
    ease: "Quad.easeOut",
    onComplete: () => flash.destroy(),
  });

  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const spark = scene.add
      .circle(
        x,
        y,
        Phaser.Math.FloatBetween(1.5, 3.2),
        i % 2 ? 0xff8c42 : 0xc9a0ff,
        0.95
      )
      .setDepth(depth + 6)
      .setScrollFactor(scrollFactor);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(ang) * r * Phaser.Math.FloatBetween(1.2, 2.1),
      y: y + Math.sin(ang) * r * Phaser.Math.FloatBetween(0.7, 1.4),
      alpha: 0,
      scale: 0.1,
      duration: Phaser.Math.Between(260, 420),
      ease: "Cubic.easeOut",
      onComplete: () => spark.destroy(),
    });
  }
}
