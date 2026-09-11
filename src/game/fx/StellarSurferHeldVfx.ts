import Phaser from "phaser";

/** Soft galactic sparkles along the held Stellar Surfer board. */
export class StellarSurferHeldVfx {
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
    this.gfx = scene.add.graphics().setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
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
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.sparks.length < 14) {
      this.spawnTimer = 0.05;
      this.sparks.push({
        t: Math.random(),
        life: Phaser.Math.FloatBetween(0.25, 0.55),
        maxLife: 1,
        side: Math.random() < 0.5 ? -1 : 1,
        size: Phaser.Math.FloatBetween(1.2, 2.6),
        color: Math.random() < 0.4 ? 0xffe066 : Math.random() < 0.5 ? 0xc9a0ff : 0x7ec8ff,
      });
      const last = this.sparks[this.sparks.length - 1]!;
      last.maxLife = last.life;
    }

    const dx = tipX - handX;
    const dy = tipY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;

    this.gfx.clear();
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.life -= dt;
      s.t += dt * 0.35;
      if (s.life <= 0 || s.t > 1.05) {
        this.sparks.splice(i, 1);
        continue;
      }
      const u = s.life / s.maxLife;
      const x = handX + dx * Math.min(1, s.t) + px * s.side * (3 + (1 - u) * 4);
      const y = handY + dy * Math.min(1, s.t) + py * s.side * (3 + (1 - u) * 4);
      this.gfx.fillStyle(s.color, 0.25 + u * 0.65);
      this.gfx.fillCircle(x, y, s.size * u);
    }

    // Soft ribbon glow
    const pulse = 0.35 + Math.sin(now / 220) * 0.15;
    this.gfx.lineStyle(3, 0x8a5cff, pulse * 0.45);
    this.gfx.lineBetween(handX, handY, tipX, tipY);
    this.gfx.lineStyle(1.5, 0xffe0a0, pulse * 0.35);
    this.gfx.lineBetween(handX, handY, tipX, tipY);
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
