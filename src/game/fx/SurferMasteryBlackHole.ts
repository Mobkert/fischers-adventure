import Phaser from "phaser";
import { drawRubberDuckAt } from "../art/RodSkinHeldArt";

/**
 * Mastery reward — trails behind the player. Default void black hole;
 * Rubber Duck skin swaps in a duck + blue splash VFX.
 */
export class SurferMasteryBlackHole {
  private gfx: Phaser.GameObjects.Graphics;
  private fx: Phaser.GameObjects.Graphics;
  private duckImg?: Phaser.GameObjects.Image;
  private active = false;
  private duckMode = false;
  private phase = 0;
  private followX = 0;
  private followY = 0;
  private sparks: Array<{
    a: number;
    r: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
  }> = [];
  private sparkTimer = 0;
  private facing = 1;

  /** 0 idle · (0,1] grant burst in progress. */
  private burstT = 0;
  private readonly burstDuration = 0.58;
  private shards: Array<{
    a: number;
    speed: number;
    r: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
  }> = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(18);
    this.fx = scene.add
      .graphics()
      .setDepth(19)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  setDuckMode(on: boolean): void {
    this.duckMode = on;
    if (on) {
      this.ensureDuckTexture();
      if (!this.duckImg) {
        this.duckImg = this.scene.add
          .image(0, 0, "follower_rubber_duck")
          .setDepth(19)
          .setDisplaySize(36, 32)
          .setVisible(this.active);
      }
    } else if (this.duckImg) {
      this.duckImg.setVisible(false);
    }
  }

  private ensureDuckTexture(): void {
    if (this.scene.textures.exists("follower_rubber_duck")) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    drawRubberDuckAt(g, 24, 24, 1.35);
    g.generateTexture("follower_rubber_duck", 48, 48);
    g.destroy();
  }

  setActive(on: boolean): void {
    this.active = on;
    if (!on) {
      this.sparks = [];
      this.shards = [];
      this.burstT = 0;
      this.gfx.clear();
      this.fx.clear();
      this.gfx.setVisible(false);
      this.fx.setVisible(false);
      this.duckImg?.setVisible(false);
    } else {
      this.gfx.setVisible(true);
      this.fx.setVisible(true);
      if (this.duckMode) this.duckImg?.setVisible(true);
    }
  }

  setDepth(d: number): void {
    this.gfx.setDepth(d);
    this.fx.setDepth(d + 1);
    this.duckImg?.setDepth(d + 2);
  }

  /** Kick off swell → explode. Returns total duration in ms. */
  playGrantBurst(): number {
    this.burstT = 0.001;
    this.shards = [];
    return this.burstDuration * 1000;
  }

  isBursting(): boolean {
    return this.burstT > 0;
  }

  getBurstProgress(): number {
    return this.burstT;
  }

  update(
    playerX: number,
    playerY: number,
    facingLeft: boolean,
    dtMs: number
  ): void {
    if (!this.active) return;
    const dt = Math.min(0.05, dtMs / 1000);
    this.phase += dt;
    this.facing = facingLeft ? -1 : 1;

    // Trail close; depth is set above the player so pads don't bury it.
    const targetX = playerX - this.facing * 44;
    const targetY = playerY - 6;
    if (this.followX === 0 && this.followY === 0) {
      this.followX = targetX;
      this.followY = targetY;
    } else {
      const ease = 1 - Math.exp(-7 * dt);
      this.followX += (targetX - this.followX) * ease;
      this.followY += (targetY - this.followY) * ease;
    }

    if (this.burstT > 0) {
      this.burstT += dt / this.burstDuration;
      if (this.burstT >= 0.38 && this.shards.length === 0) {
        for (let i = 0; i < 22; i++) {
          this.shards.push({
            a: (i / 22) * Math.PI * 2 + Math.random() * 0.35,
            speed: Phaser.Math.FloatBetween(90, 210),
            r: Phaser.Math.FloatBetween(4, 12),
            life: Phaser.Math.FloatBetween(0.28, 0.5),
            maxLife: 1,
            size: Phaser.Math.FloatBetween(1.6, 4.2),
            color: this.duckMode
              ? Math.random() < 0.4
                ? 0x4aa8e8
                : Math.random() < 0.5
                  ? 0x8fd4ff
                  : 0xffffff
              : Math.random() < 0.3
                ? 0xff8c42
                : Math.random() < 0.5
                  ? 0xc9a0ff
                  : 0xffe8b0,
          });
          const last = this.shards[this.shards.length - 1]!;
          last.maxLife = last.life;
        }
      }
      if (this.burstT >= 1) {
        this.burstT = 0;
      }
    }

    this.sparkTimer -= dt;
    const sparkCap = this.burstT > 0 ? 28 : 18;
    if (this.sparkTimer <= 0 && this.sparks.length < sparkCap) {
      this.sparkTimer = this.burstT > 0 && this.burstT < 0.4 ? 0.02 : 0.04;
      this.sparks.push({
        a: Math.random() * Math.PI * 2,
        r: Phaser.Math.FloatBetween(18, 36),
        life: Phaser.Math.FloatBetween(0.35, 0.7),
        maxLife: 1,
        size: Phaser.Math.FloatBetween(1.2, 2.8),
        color: this.duckMode
          ? Math.random() < 0.4
            ? 0x4aa8e8
            : Math.random() < 0.5
              ? 0x8fd4ff
              : 0xffffff
          : Math.random() < 0.35
            ? 0xff8c42
            : Math.random() < 0.5
              ? 0xc9a0ff
              : 0xffe0a8,
      });
      const last = this.sparks[this.sparks.length - 1]!;
      last.maxLife = last.life;
    }

    const cx = this.followX;
    const cy = this.followY;
    const t = this.phase;
    const b = this.burstT;
    let burstScale = 1;
    if (b > 0 && b < 0.38) {
      const u = b / 0.38;
      burstScale = 1 + u * u * 0.85;
    } else if (b >= 0.38) {
      const u = (b - 0.38) / 0.62;
      burstScale = 1.85 - u * 0.95;
    }
    const pulse = (0.92 + Math.sin(t * 2.6) * 0.08) * burstScale;
    const spinBoost = b > 0 && b < 0.45 ? 1 + b * 4 : 1;

    this.gfx.clear();
    this.fx.clear();

    if (this.duckMode) {
      this.drawDuckFollower(cx, cy, t, pulse, burstScale, spinBoost, b, dt);
    } else {
      this.drawVoidFollower(cx, cy, t, pulse, burstScale, spinBoost, b, dt);
    }
  }

  private drawDuckFollower(
    cx: number,
    cy: number,
    t: number,
    pulse: number,
    _burstScale: number,
    spinBoost: number,
    b: number,
    dt: number
  ): void {
    // Blue water splash under/around the duck
    this.gfx.fillStyle(0x1a5080, 0.35);
    this.gfx.fillEllipse(cx, cy + 8, 42 * pulse, 16 * pulse);
    this.fx.fillStyle(0x4aa8e8, 0.22);
    this.fx.fillEllipse(cx, cy + 6, 34 * pulse, 12 * pulse);
    this.fx.fillStyle(0x8fd4ff, 0.18);
    this.fx.fillEllipse(cx - 6, cy + 4, 18 * pulse, 7 * pulse);

    for (let i = 0; i < 4; i++) {
      const spin = t * (1.2 + i * 0.25) * spinBoost + i;
      const rx = (14 + i * 5) * pulse;
      const ry = (6 + i * 1.4) * pulse;
      this.fx.lineStyle(
        Math.max(1, 2 - i * 0.25),
        i % 2 ? 0x8fd4ff : 0xffffff,
        0.2 + (4 - i) * 0.05
      );
      this.fx.beginPath();
      const segs = 24;
      for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * Math.PI * 2 + spin;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        if (s === 0) this.fx.moveTo(x, y);
        else this.fx.lineTo(x, y);
      }
      this.fx.strokePath();
    }

    if (this.duckImg) {
      this.duckImg.setVisible(true);
      this.duckImg.setPosition(cx, cy);
      this.duckImg.setFlipX(this.facing < 0);
      const bob = Math.sin(t * 3.2) * 1.5;
      this.duckImg.setPosition(cx, cy + bob);
      this.duckImg.setDisplaySize(36 * pulse, 32 * pulse);
      this.duckImg.setRotation(Math.sin(t * 1.4) * 0.08);
    }

    const ringPulse = 0.45 + Math.sin(t * 4.5) * 0.35;
    this.fx.lineStyle(2.2, 0x8fd4ff, 0.35 + ringPulse * 0.3);
    this.fx.strokeEllipse(cx, cy, 30 * pulse, 12 * pulse);
    this.fx.lineStyle(1.4, 0xffffff, 0.25 + ringPulse * 0.2);
    this.fx.strokeEllipse(cx, cy, 38 * pulse, 15 * pulse);

    if (b >= 0.38) {
      const u = Math.min(1, (b - 0.38) / 0.55);
      const flash = Math.max(0, 1 - u * 1.4);
      if (flash > 0) {
        this.fx.fillStyle(0xd0f0ff, 0.5 * flash);
        this.fx.fillCircle(cx, cy, 10 + u * 18);
        this.fx.fillStyle(0x4aa8e8, 0.35 * flash);
        this.fx.fillCircle(cx, cy, 6 + u * 10);
      }
      for (let i = 0; i < 3; i++) {
        const ru = Math.min(1, u + i * 0.08);
        const alpha = Math.max(0, 0.55 - ru * 0.55 - i * 0.08);
        if (alpha <= 0) continue;
        const rr = (22 + i * 10) * (0.4 + ru * 1.8);
        this.fx.lineStyle(2.4 - i * 0.4, i === 1 ? 0x8fd4ff : 0xffffff, alpha);
        this.fx.strokeEllipse(cx, cy, rr, rr * 0.62);
      }
    } else if (b > 0) {
      const u = b / 0.38;
      this.fx.fillStyle(0x4aa8e8, 0.12 + u * 0.28);
      this.fx.fillCircle(cx, cy, 8 + u * 14);
      this.fx.fillStyle(0xffffff, 0.08 + u * 0.2);
      this.fx.fillCircle(cx, cy, 4 + u * 6);
    }

    this.updateParticles(cx, cy, dt, spinBoost);
  }

  private drawVoidFollower(
    cx: number,
    cy: number,
    t: number,
    pulse: number,
    burstScale: number,
    spinBoost: number,
    b: number,
    dt: number
  ): void {
    this.duckImg?.setVisible(false);

    this.gfx.fillStyle(0x0a0414, 0.55);
    this.gfx.fillEllipse(cx, cy, 54 * pulse, 40 * pulse);
    this.gfx.fillStyle(0x000000, 0.92);
    this.gfx.fillEllipse(cx, cy, 28 * pulse, 22 * pulse);
    this.gfx.fillStyle(0x1a0828, 0.7);
    this.gfx.fillEllipse(cx, cy, 16 * pulse, 12 * pulse);
    this.gfx.fillStyle(0x000000, 1);
    this.gfx.fillCircle(cx, cy, 7 * pulse);

    for (let i = 0; i < 5; i++) {
      const spin = t * (1.4 + i * 0.28) * spinBoost + i * 0.6;
      const rx = (16 + i * 5.5) * pulse;
      const ry = (7 + i * 1.6) * pulse;
      const col = i % 3 === 0 ? 0xff8c42 : i % 3 === 1 ? 0x9b5de5 : 0xffd06a;
      this.gfx.lineStyle(Math.max(1, 2.2 - i * 0.25), col, 0.22 + (5 - i) * 0.05);
      this.gfx.beginPath();
      const segs = 28;
      for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * Math.PI * 2 + spin;
        const warp = 1 + Math.sin(a * 2 + spin * 0.4) * 0.1;
        const x = cx + Math.cos(a) * rx * warp;
        const y = cy + Math.sin(a) * ry * warp;
        if (s === 0) this.gfx.moveTo(x, y);
        else this.gfx.lineTo(x, y);
      }
      this.gfx.strokePath();
    }

    const ringPulse = 0.45 + Math.sin(t * 4.5) * 0.35;
    this.fx.lineStyle(2.4, 0xffc070, 0.4 + ringPulse * 0.35);
    this.fx.strokeEllipse(cx, cy, 34 * pulse, 14 * pulse);
    this.fx.lineStyle(1.6, 0xfff0c8, 0.3 + ringPulse * 0.25);
    this.fx.strokeEllipse(cx, cy, 40 * pulse, 16 * pulse);
    this.fx.lineStyle(1.4, 0xc9a0ff, 0.28);
    this.fx.strokeEllipse(cx, cy, 46 * pulse, 18 * pulse);

    const jet = 0.35 + Math.sin(t * 5.2) * 0.3;
    this.fx.lineStyle(2, 0xb48cff, 0.22 + jet * 0.3);
    this.fx.lineBetween(
      cx,
      cy - 10 * burstScale,
      cx + Math.sin(t * 2) * 3,
      cy - 28 * burstScale
    );
    this.fx.lineBetween(
      cx,
      cy + 8 * burstScale,
      cx - Math.sin(t * 2) * 3,
      cy + 22 * burstScale
    );

    if (b >= 0.38) {
      const u = Math.min(1, (b - 0.38) / 0.55);
      const flash = Math.max(0, 1 - u * 1.4);
      if (flash > 0) {
        this.fx.fillStyle(0xfff4d0, 0.55 * flash);
        this.fx.fillCircle(cx, cy, 10 + u * 18);
        this.fx.fillStyle(0xc9a0ff, 0.35 * flash);
        this.fx.fillCircle(cx, cy, 6 + u * 10);
      }
      for (let i = 0; i < 3; i++) {
        const ru = Math.min(1, u + i * 0.08);
        const alpha = Math.max(0, 0.55 - ru * 0.55 - i * 0.08);
        if (alpha <= 0) continue;
        const rr = (22 + i * 10) * (0.4 + ru * 1.8);
        this.fx.lineStyle(2.4 - i * 0.4, i === 1 ? 0xffc070 : 0xe0b0ff, alpha);
        this.fx.strokeEllipse(cx, cy, rr, rr * 0.62);
      }
    } else if (b > 0) {
      const u = b / 0.38;
      this.fx.fillStyle(0xffc070, 0.12 + u * 0.28);
      this.fx.fillCircle(cx, cy, 8 + u * 14);
      this.fx.fillStyle(0xffffff, 0.08 + u * 0.2);
      this.fx.fillCircle(cx, cy, 4 + u * 6);
    }

    this.updateParticles(cx, cy, dt, spinBoost);
  }

  private updateParticles(
    cx: number,
    cy: number,
    dt: number,
    spinBoost: number
  ): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.life -= dt;
      s.a += dt * 2.4 * spinBoost;
      s.r += dt * 10;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      const u = s.life / s.maxLife;
      const x = cx + Math.cos(s.a) * s.r * 0.55;
      const y = cy + Math.sin(s.a) * s.r * 0.28;
      this.fx.fillStyle(s.color, 0.2 + u * 0.7);
      this.fx.fillCircle(x, y, s.size * u);
    }

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i]!;
      s.life -= dt;
      s.r += s.speed * dt;
      s.speed *= 1 - 2.2 * dt;
      if (s.life <= 0) {
        this.shards.splice(i, 1);
        continue;
      }
      const u = s.life / s.maxLife;
      const x = cx + Math.cos(s.a) * s.r;
      const y = cy + Math.sin(s.a) * s.r * 0.72;
      this.fx.fillStyle(s.color, 0.25 + u * 0.75);
      this.fx.fillCircle(x, y, s.size * u);
      if (u > 0.4) {
        this.fx.lineStyle(1.2, s.color, u * 0.45);
        this.fx.lineBetween(
          x,
          y,
          x - Math.cos(s.a) * 8,
          y - Math.sin(s.a) * 6
        );
      }
    }
  }

  destroy(): void {
    this.gfx.destroy();
    this.fx.destroy();
    this.duckImg?.destroy();
  }
}
