import Phaser from "phaser";

/** Dark void haze + sparse tip energy for The Voidharvester greatsword. */
export class VoidharvesterHeldVfx {
  private gfx: Phaser.GameObjects.Graphics;
  private active = false;
  private wisps: Array<{
    t: number;
    life: number;
    maxLife: number;
    side: number;
    size: number;
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
      this.wisps = [];
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
    if (this.spawnTimer <= 0 && this.wisps.length < 8) {
      this.spawnTimer = 0.12;
      this.wisps.push({
        t: Phaser.Math.FloatBetween(0.3, 0.95),
        life: Phaser.Math.FloatBetween(0.35, 0.7),
        maxLife: 1,
        side: Math.random() < 0.5 ? -1 : 1,
        size: Phaser.Math.FloatBetween(1.2, 2.2),
      });
      const last = this.wisps[this.wisps.length - 1]!;
      last.maxLife = last.life;
    }

    this.gfx.clear();

    // Low pulse along the blade — muted
    const pulse = 0.4 + Math.sin(t * 2.2) * 0.12;
    for (let i = 0; i < 3; i++) {
      const u = 0.4 + i * 0.18;
      const x = handX + dx * u;
      const y = handY + dy * u;
      this.gfx.fillStyle(0x5a3088, 0.08 * pulse);
      this.gfx.fillCircle(x, y, 4.5);
    }

    // Tip void core — restrained
    this.gfx.fillStyle(0x4a2870, 0.2 * pulse);
    this.gfx.fillCircle(tipX, tipY, 7);
    this.gfx.lineStyle(1.3, 0x8a60b8, 0.4 * pulse);
    this.gfx.strokeCircle(tipX, tipY, 5);
    this.gfx.fillStyle(0xc9a0ff, 0.18 * pulse);
    this.gfx.fillCircle(tipX, tipY, 1.4);

    for (let i = this.wisps.length - 1; i >= 0; i--) {
      const w = this.wisps[i]!;
      w.life -= dt;
      if (w.life <= 0) {
        this.wisps.splice(i, 1);
        continue;
      }
      const u = w.life / w.maxLife;
      const x = handX + dx * w.t + px * w.side * (3.5 + (1 - u) * 3);
      const y = handY + dy * w.t + py * w.side * (3.5 + (1 - u) * 3);
      this.gfx.fillStyle(0x7a50a8, 0.15 + u * 0.35);
      this.gfx.fillCircle(x, y, w.size * u);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
