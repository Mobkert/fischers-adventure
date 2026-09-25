import Phaser from "phaser";

function ensureSandGrainTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("sand_wind_grain")) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(2, 2, 2);
  g.generateTexture("sand_wind_grain", 4, 4);
  g.destroy();
}

/**
 * Soft horizontal sand swooshes + drifting grains for Dustspire / nearby seas.
 * Particles are camera-locked (like rain) so wind always reads across the view.
 */
export class DesertSandWind {
  private scene: Phaser.Scene;
  private grains?: Phaser.GameObjects.Particles.ParticleEmitter;
  private intensity = 0;
  private swooshAccum = 0;
  private active = false;
  private readonly groundY: number;

  constructor(scene: Phaser.Scene, groundY: number) {
    this.scene = scene;
    this.groundY = groundY;
    ensureSandGrainTexture(scene);
  }

  /** @param intensity 0–1 how strong the desert wind should be */
  setIntensity(intensity: number): void {
    this.intensity = Phaser.Math.Clamp(intensity, 0, 1);
    if (this.intensity > 0.04) {
      this.ensureEmitter();
      this.active = true;
      const e = this.grains!;
      e.setVisible(true);
      e.frequency = Phaser.Math.Linear(100, 24, this.intensity);
      e.quantity = this.intensity > 0.55 ? 2 : 1;
    } else if (this.active) {
      this.grains?.setVisible(false);
      this.active = false;
    }
  }

  update(delta: number): void {
    if (!this.active || this.intensity < 0.04) return;

    this.swooshAccum += delta * this.intensity;
    const interval = Phaser.Math.Linear(1500, 560, this.intensity);
    while (this.swooshAccum >= interval) {
      this.swooshAccum -= interval;
      this.spawnSwoosh();
    }
  }

  destroy(): void {
    this.grains?.destroy();
    this.grains = undefined;
    this.active = false;
  }

  private ensureEmitter(): void {
    if (this.grains) return;
    const w = this.scene.scale.width;
    const h = Math.min(this.groundY + 40, this.scene.scale.height);
    this.grains = this.scene.add.particles(0, 0, "sand_wind_grain", {
      x: { min: w - 10, max: w + 30 },
      y: { min: 50, max: h - 30 },
      speedX: { min: -260, max: -110 },
      speedY: { min: -22, max: 32 },
      lifespan: { min: 1000, max: 2000 },
      quantity: 1,
      frequency: 50,
      alpha: { start: 0.5, end: 0 },
      scale: { start: 0.65, end: 0.12 },
      tint: [0xe8d4a0, 0xd4b078, 0xc4a060, 0xf0e0c0],
      gravityY: 6,
    });
    this.grains.setScrollFactor(0).setDepth(28);
  }

  private spawnSwoosh(): void {
    const cam = this.scene.cameras.main;
    const viewH = Math.min(cam.height, this.groundY - cam.scrollY + 20);
    const y =
      cam.scrollY +
      Phaser.Math.Between(60, Math.max(100, Math.floor(viewH - 50)));
    const startX = cam.scrollX + cam.width + Phaser.Math.Between(20, 90);
    const travel = cam.width * Phaser.Math.FloatBetween(0.6, 1.05);
    const h = Phaser.Math.FloatBetween(5, 11);
    const w = Phaser.Math.FloatBetween(80, 170);
    const alpha = 0.14 + this.intensity * 0.3;

    const streak = this.scene.add
      .ellipse(startX, y, w, h, 0xe8d4a0, alpha)
      .setDepth(27)
      .setAngle(Phaser.Math.FloatBetween(-9, -2));

    const trail = this.scene.add
      .ellipse(startX + 22, y + 3, w * 0.5, h * 1.5, 0xd4b078, alpha * 0.5)
      .setDepth(26)
      .setAngle(streak.angle);

    this.scene.tweens.add({
      targets: [streak, trail],
      x: `-=${travel}`,
      alpha: 0,
      scaleX: 1.4,
      duration: Phaser.Math.Between(950, 1550),
      ease: "Sine.easeOut",
      onComplete: () => {
        streak.destroy();
        trail.destroy();
      },
    });

    this.scene.tweens.add({
      targets: [streak, trail],
      y: y + Phaser.Math.FloatBetween(-20, 24),
      duration: 1300,
      ease: "Sine.easeInOut",
    });
  }
}
