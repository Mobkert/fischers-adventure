import Phaser from "phaser";

export function ensureSplashTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists("water_splash_drop")) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 3.5);
  g.fillStyle(0xb8e4ff, 1);
  g.fillCircle(3, 3, 1.6);
  g.generateTexture("water_splash_drop", 8, 8);
  g.clear();
  g.fillStyle(0xe8f6ff, 1);
  g.fillEllipse(12, 6, 22, 10);
  g.generateTexture("water_splash_sheet", 24, 12);
  g.destroy();
}

/**
 * Burst splash at the waterline — used for dolphin leap exit / entry.
 */
export function playWaterSplash(
  scene: Phaser.Scene,
  x: number,
  surfaceY: number,
  power = 1
): void {
  ensureSplashTextures(scene);
  const p = Phaser.Math.Clamp(power, 0.6, 1.6);
  const depth = 13;

  // Expanding surface ring
  const ring = scene.add
    .ellipse(x, surfaceY + 2, 14, 6, 0xd0ecff, 0.7)
    .setDepth(depth)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: ring,
    scaleX: 5.2 * p,
    scaleY: 2.4 * p,
    alpha: 0,
    duration: 480,
    ease: "Cubic.Out",
    onComplete: () => ring.destroy(),
  });

  // Second softer ring
  const ring2 = scene.add
    .ellipse(x, surfaceY + 2, 10, 4, 0xffffff, 0.45)
    .setDepth(depth);
  scene.tweens.add({
    targets: ring2,
    scaleX: 3.4 * p,
    scaleY: 1.6 * p,
    alpha: 0,
    duration: 360,
    ease: "Quad.Out",
    onComplete: () => ring2.destroy(),
  });

  // Foam sheet flash
  const sheet = scene.add
    .image(x, surfaceY + 1, "water_splash_sheet")
    .setDepth(depth)
    .setAlpha(0.85)
    .setScale(0.6 * p, 0.5 * p);
  scene.tweens.add({
    targets: sheet,
    scaleX: 2.8 * p,
    scaleY: 1.1 * p,
    alpha: 0,
    y: surfaceY + 4,
    duration: 320,
    ease: "Quad.Out",
    onComplete: () => sheet.destroy(),
  });

  // Droplet burst upward
  const drops = scene.add.particles(x, surfaceY, "water_splash_drop", {
    speed: { min: 90 * p, max: 240 * p },
    angle: { min: -125, max: -55 },
    gravityY: 680,
    lifespan: { min: 420, max: 780 },
    quantity: 0,
    scale: { start: 1.15 * p, end: 0.15 },
    alpha: { start: 0.95, end: 0 },
    tint: [0xffffff, 0xd8f0ff, 0x9fd0ff],
    emitting: false,
  });
  drops.setDepth(depth + 1);
  drops.explode(Math.round(12 * p));

  // Side spray
  const spray = scene.add.particles(x, surfaceY + 2, "water_splash_drop", {
    speed: { min: 40 * p, max: 140 * p },
    angle: { min: -30, max: 30 },
    gravityY: 420,
    lifespan: { min: 280, max: 520 },
    quantity: 0,
    scale: { start: 0.7 * p, end: 0.1 },
    alpha: { start: 0.7, end: 0 },
    tint: [0xffffff, 0xb8e0ff],
    emitting: false,
  });
  spray.setDepth(depth + 1);
  spray.explode(Math.round(8 * p));
  // Mirrored left spray
  const sprayL = scene.add.particles(x, surfaceY + 2, "water_splash_drop", {
    speed: { min: 40 * p, max: 140 * p },
    angle: { min: 150, max: 210 },
    gravityY: 420,
    lifespan: { min: 280, max: 520 },
    quantity: 0,
    scale: { start: 0.7 * p, end: 0.1 },
    alpha: { start: 0.7, end: 0 },
    tint: [0xffffff, 0xb8e0ff],
    emitting: false,
  });
  sprayL.setDepth(depth + 1);
  sprayL.explode(Math.round(8 * p));

  scene.time.delayedCall(900, () => {
    drops.destroy();
    spray.destroy();
    sprayL.destroy();
  });
}

function ensureBubbleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("water_bubble")) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(5, 5, 4.5);
  g.lineStyle(1.2, 0xffffff, 0.9);
  g.strokeCircle(5, 5, 4.5);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(3.5, 3.2, 1.4);
  g.generateTexture("water_bubble", 10, 10);
  g.destroy();
}

/**
 * Rising bubbles that follow a sinking bobber until `stop()` is called.
 */
export function createSinkBubbles(
  scene: Phaser.Scene,
  getPos: () => { x: number; y: number }
): { stop: () => void } {
  ensureBubbleTexture(scene);
  const emitter = scene.add.particles(0, 0, "water_bubble", {
    speedX: { min: -18, max: 18 },
    speedY: { min: -55, max: -28 },
    lifespan: { min: 420, max: 900 },
    frequency: 70,
    quantity: 1,
    scale: { start: 0.55, end: 0.15 },
    alpha: { start: 0.75, end: 0 },
    tint: [0xffffff, 0xd8f4ff, 0xb0e0ff],
    blendMode: Phaser.BlendModes.ADD,
  });
  emitter.setDepth(12);

  const follow = scene.time.addEvent({
    delay: 40,
    loop: true,
    callback: () => {
      const p = getPos();
      emitter.setPosition(p.x, p.y);
    },
  });
  // Seed at current pos
  const start = getPos();
  emitter.setPosition(start.x, start.y);

  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      follow.remove(false);
      emitter.stop();
      scene.time.delayedCall(950, () => emitter.destroy());
    },
  };
}
