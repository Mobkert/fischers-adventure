import Phaser from "phaser";

/**
 * Subtle Horizonbreaker held VFX — soft tip accretion + a few drifting sparks.
 * Kept light so the constellation rod art stays readable.
 */
export class HorizonbreakerHeldVfx {
  private gfx: Phaser.GameObjects.Graphics;
  private active = false;
  private sparks: Array<{
    t: number;
    life: number;
    maxLife: number;
    side: number;
    size: number;
    color: number;
  }> = [];
  private spawnTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add
      .graphics()
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  setActive(on: boolean): void {
    this.active = on;
    if (!on) {
      this.sparks = [];
      this.gfx.clear();
      this.gfx.setVisible(false);
    } else {
      this.gfx.setVisible(true);
    }
  }

  setDepth(d: number): void {
    this.gfx.setDepth(d);
  }

  update(
    handX: number,
    handY: number,
    tipX: number,
    tipY: number,
    now: number
  ): void {
    if (!this.active) return;
    const dt = 1 / 60;
    const t = now * 0.001;
    const dx = tipX - handX;
    const dy = tipY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.sparks.length < 8) {
      this.spawnTimer = 0.12;
      this.sparks.push({
        t: Phaser.Math.FloatBetween(0.15, 0.85),
        life: Phaser.Math.FloatBetween(0.35, 0.7),
        maxLife: 1,
        side: Math.random() < 0.5 ? -1 : 1,
        size: Phaser.Math.FloatBetween(1.1, 2.2),
        color:
          Math.random() < 0.4
            ? 0xffe066
            : Math.random() < 0.5
              ? 0xc9a0ff
              : 0xff8c42,
      });
      const last = this.sparks[this.sparks.length - 1]!;
      last.maxLife = last.life;
    }

    this.gfx.clear();

    // Soft accretion halo at the black-hole tip
    const pulse = 0.55 + Math.sin(t * 3.2) * 0.2;
    this.gfx.lineStyle(2, 0xff8c42, 0.35 * pulse);
    this.gfx.strokeEllipse(tipX, tipY, 14, 5);
    this.gfx.lineStyle(1.4, 0x9b5de5, 0.4 * pulse);
    this.gfx.strokeEllipse(tipX, tipY, 10, 3.5);
    this.gfx.fillStyle(0xffe066, 0.25 * pulse);
    this.gfx.fillCircle(tipX, tipY, 2.2);

    // Sparse sparks drifting near stars along the shaft
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      const u = s.life / s.maxLife;
      const drift = Math.sin(t * 2 + s.t * 6) * 1.5;
      const x =
        handX + dx * s.t + px * s.side * (3.5 + drift) + px * (1 - u) * 2;
      const y =
        handY + dy * s.t + py * s.side * (3.5 + drift) + py * (1 - u) * 2;
      this.gfx.fillStyle(s.color, 0.2 + u * 0.55);
      this.gfx.fillCircle(x, y, s.size * u);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
