import Phaser from "phaser";

/**
 * Soft gold sparkles along a mastery-gold rod shaft.
 * Used whenever a rod at mastery Lv10+ is held with the default finish.
 */
export class GoldenMasteryHeldVfx {
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
    _now: number
  ): void {
    if (!this.active) return;
    const dt = 1 / 60;
    const dx = tipX - handX;
    const dy = tipY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.sparks.length < 16) {
      this.spawnTimer = 0.045;
      this.sparks.push({
        t: Phaser.Math.FloatBetween(0.05, 0.95),
        life: Phaser.Math.FloatBetween(0.28, 0.6),
        maxLife: 1,
        side: Math.random() < 0.5 ? -1 : 1,
        size: Phaser.Math.FloatBetween(1.1, 2.8),
        color:
          Math.random() < 0.45
            ? 0xffe066
            : Math.random() < 0.55
              ? 0xffd700
              : 0xfff3c4,
      });
      const last = this.sparks[this.sparks.length - 1]!;
      last.maxLife = last.life;
    }

    this.gfx.clear();

    // Soft gold sheen along the shaft
    this.gfx.lineStyle(3.5, 0xffe066, 0.12);
    this.gfx.lineBetween(handX, handY, tipX, tipY);
    this.gfx.lineStyle(1.5, 0xfff3c4, 0.2);
    this.gfx.lineBetween(
      handX + px * 1.2,
      handY + py * 1.2,
      tipX + px * 1.2,
      tipY + py * 1.2
    );

    // Tip glint
    const pulse = 0.35 + 0.25 * Math.sin(_now * 0.008);
    this.gfx.fillStyle(0xffe066, pulse * 0.35);
    this.gfx.fillCircle(tipX, tipY, 4.5);
    this.gfx.fillStyle(0xfff8e0, pulse * 0.5);
    this.gfx.fillCircle(tipX, tipY, 2);

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.life -= dt;
      s.t += dt * 0.2;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      const u = s.life / s.maxLife;
      const along = Math.min(1, Math.max(0, s.t));
      const x = handX + dx * along + px * s.side * (2.5 + (1 - u) * 5);
      const y = handY + dy * along + py * s.side * (2.5 + (1 - u) * 5);
      this.gfx.fillStyle(s.color, 0.3 + u * 0.7);
      this.gfx.fillCircle(x, y, s.size * u);
      if (u > 0.55) {
        this.gfx.fillStyle(0xffffff, (u - 0.55) * 0.8);
        this.gfx.fillCircle(x, y, s.size * u * 0.4);
      }
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
