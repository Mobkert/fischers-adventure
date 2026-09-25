import Phaser from "phaser";

/** Hue → RGB (h in 0–360). */
export function hslToRgb(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) {
    r = c;
    g = x;
  } else if (hp < 2) {
    r = x;
    g = c;
  } else if (hp < 3) {
    g = c;
    b = x;
  } else if (hp < 4) {
    g = x;
    b = c;
  } else if (hp < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const m = l - c / 2;
  const R = Math.round(Math.min(255, (r + m) * 255));
  const G = Math.round(Math.min(255, (g + m) * 255));
  const B = Math.round(Math.min(255, (b + m) * 255));
  return (R << 16) | (G << 8) | B;
}

/**
 * Rainbow mastery held VFX — cycling prismatic shaft sheen + tip trail.
 */
export class RainbowMasteryHeldVfx {
  private gfx: Phaser.GameObjects.Graphics;
  private trailGfx: Phaser.GameObjects.Graphics;
  private active = false;
  private sparks: Array<{
    t: number;
    life: number;
    maxLife: number;
    side: number;
    size: number;
    hue: number;
  }> = [];
  private trail: Array<{ x: number; y: number; life: number; hue: number }> =
    [];
  private spawnTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add
      .graphics()
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.trailGfx = scene.add
      .graphics()
      .setDepth(19)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  setActive(on: boolean): void {
    this.active = on;
    if (!on) {
      this.sparks = [];
      this.trail = [];
      this.gfx.clear();
      this.trailGfx.clear();
      this.gfx.setVisible(false);
      this.trailGfx.setVisible(false);
    } else {
      this.gfx.setVisible(true);
      this.trailGfx.setVisible(true);
    }
  }

  setDepth(d: number): void {
    this.trailGfx.setDepth(d);
    this.gfx.setDepth(d + 1);
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
    const dx = tipX - handX;
    const dy = tipY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const phase = now * 0.12;

    // Tip trail breadcrumbs
    this.trail.push({
      x: tipX,
      y: tipY,
      life: 0.45,
      hue: (phase * 0.4) % 360,
    });
    if (this.trail.length > 28) this.trail.shift();

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.sparks.length < 18) {
      this.spawnTimer = 0.04;
      this.sparks.push({
        t: Phaser.Math.FloatBetween(0.05, 0.95),
        life: Phaser.Math.FloatBetween(0.25, 0.55),
        maxLife: 1,
        side: Math.random() < 0.5 ? -1 : 1,
        size: Phaser.Math.FloatBetween(1.2, 2.8),
        hue: Math.random() * 360,
      });
      const last = this.sparks[this.sparks.length - 1]!;
      last.maxLife = last.life;
    }

    this.gfx.clear();
    this.trailGfx.clear();

    // Animated rainbow shaft segments
    const segs = 10;
    for (let i = 0; i < segs; i++) {
      const a = i / segs;
      const b = (i + 1) / segs;
      const hue = (phase + a * 360) % 360;
      const c = hslToRgb(hue, 0.95, 0.55);
      this.gfx.lineStyle(4.2, c, 0.28);
      this.gfx.lineBetween(
        handX + dx * a,
        handY + dy * a,
        handX + dx * b,
        handY + dy * b
      );
      this.gfx.lineStyle(1.8, hslToRgb(hue, 1, 0.72), 0.4);
      this.gfx.lineBetween(
        handX + dx * a + px,
        handY + dy * a + py,
        handX + dx * b + px,
        handY + dy * b + py
      );
    }

    // Tip bloom
    const tipHue = (phase + 40) % 360;
    this.gfx.fillStyle(hslToRgb(tipHue, 1, 0.6), 0.45);
    this.gfx.fillCircle(tipX, tipY, 5.5);
    this.gfx.fillStyle(0xffffff, 0.55);
    this.gfx.fillCircle(tipX, tipY, 2.2);

    // Trail ribbon from tip
    for (let i = this.trail.length - 1; i >= 1; i--) {
      const p = this.trail[i]!;
      const q = this.trail[i - 1]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.trail.splice(i, 1);
        continue;
      }
      const u = p.life / 0.45;
      const col = hslToRgb((p.hue + (1 - u) * 80) % 360, 1, 0.55);
      this.trailGfx.lineStyle(2 + u * 4, col, 0.15 + u * 0.45);
      this.trailGfx.lineBetween(p.x, p.y, q.x, q.y);
      this.trailGfx.fillStyle(col, 0.2 + u * 0.4);
      this.trailGfx.fillCircle(p.x, p.y, 1.2 + u * 2.2);
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.life -= dt;
      s.t += dt * 0.25;
      s.hue = (s.hue + dt * 180) % 360;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      const u = s.life / s.maxLife;
      const along = Math.min(1, Math.max(0, s.t));
      const x = handX + dx * along + px * s.side * (2.5 + (1 - u) * 5);
      const y = handY + dy * along + py * s.side * (2.5 + (1 - u) * 5);
      const col = hslToRgb(s.hue, 1, 0.58);
      this.gfx.fillStyle(col, 0.35 + u * 0.65);
      this.gfx.fillCircle(x, y, s.size * u);
    }
  }

  destroy(): void {
    this.gfx.destroy();
    this.trailGfx.destroy();
  }
}
