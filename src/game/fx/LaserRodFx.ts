import Phaser from "phaser";

const PINK = 0xec4899;
const PURPLE = 0xa855f7;
const HOT = 0xf9a8d4;
const CORE = 0xffffff;

type Spark = {
  t: number;
  along: number;
  side: number;
  speed: number;
  size: number;
  color: number;
};

/**
 * High-detail pink/purple energy VFX wrapping the Laser Zeus rod while held.
 * Root sits on the grip; all drawing is relative so it tracks the shaft.
 */
export class LaserRodHeldVfx {
  private root: Phaser.GameObjects.Container;
  private beam: Phaser.GameObjects.Graphics;
  private tipHalo: Phaser.GameObjects.Arc;
  private tipCore: Phaser.GameObjects.Arc;
  private tipRing: Phaser.GameObjects.Arc;
  private tipRing2: Phaser.GameObjects.Arc;
  private orbiters: Phaser.GameObjects.Arc[] = [];
  private nodes: Phaser.GameObjects.Arc[] = [];
  private sparkGfx: Phaser.GameObjects.Graphics;
  private sparks: Spark[] = [];
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(14).setVisible(false);
    this.beam = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.sparkGfx = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);

    this.tipHalo = scene.add
      .circle(0, 0, 18, PINK, 0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tipCore = scene.add
      .circle(0, 0, 5, CORE, 0.75)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tipRing = scene.add
      .circle(0, 0, 10, PURPLE, 0)
      .setStrokeStyle(2, HOT, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tipRing2 = scene.add
      .circle(0, 0, 14, PINK, 0)
      .setStrokeStyle(1.5, PURPLE, 0.7)
      .setBlendMode(Phaser.BlendModes.ADD);

    for (let i = 0; i < 8; i++) {
      const o = scene.add
        .circle(0, 0, 1.4 + (i % 3) * 0.4, i % 2 === 0 ? HOT : CORE, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.orbiters.push(o);
    }

    for (let i = 0; i < 5; i++) {
      const n = scene.add
        .circle(0, 0, 2.2, i % 2 === 0 ? PURPLE : PINK, 0.7)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.nodes.push(n);
    }

    this.root.add([
      this.beam,
      this.tipHalo,
      this.tipRing2,
      this.tipRing,
      this.tipCore,
      ...this.nodes,
      ...this.orbiters,
      this.sparkGfx,
    ]);

    for (let i = 0; i < 14; i++) {
      this.sparks.push({
        t: Math.random(),
        along: Math.random(),
        side: Math.random() > 0.5 ? 1 : -1,
        speed: 0.35 + Math.random() * 0.55,
        size: 1 + Math.random() * 1.6,
        color: i % 3 === 0 ? CORE : i % 3 === 1 ? HOT : PURPLE,
      });
    }
  }

  setActive(on: boolean): void {
    if (this.visible === on) return;
    this.visible = on;
    this.root.setVisible(on);
  }

  setDepth(depth: number): void {
    this.root.setDepth(depth);
  }

  update(
    handX: number,
    handY: number,
    tipX: number,
    tipY: number,
    now: number
  ): void {
    if (!this.visible) return;

    // Anchor on grip — children are hand-relative so the whole FX rides the rod
    this.root.setPosition(handX, handY);

    const dx = tipX - handX;
    const dy = tipY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const pulse = 0.88 + Math.sin(now / 110) * 0.12;
    const pulse2 = 0.9 + Math.sin(now / 70) * 0.1;

    this.beam.clear();

    // Outer glow shaft
    this.beam.lineStyle(14, PINK, 0.12 * pulse);
    this.beam.lineBetween(0, 0, dx, dy);
    this.beam.lineStyle(9, PURPLE, 0.2 * pulse);
    this.beam.lineBetween(0, 0, dx, dy);
    this.beam.lineStyle(4.5, HOT, 0.45 * pulse2);
    this.beam.lineBetween(0, 0, dx, dy);
    this.beam.lineStyle(1.8, CORE, 0.75);
    this.beam.lineBetween(ux * 2, uy * 2, dx - ux * 2, dy - uy * 2);

    // Energy ribbons twisting along the shaft
    for (let r = 0; r < 3; r++) {
      const phase = now / (180 + r * 40) + r * 2.1;
      this.beam.lineStyle(1.6, r === 1 ? HOT : PURPLE, 0.55);
      this.beam.beginPath();
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const along = t * len;
        const twist = Math.sin(phase + t * Math.PI * 3) * (5 + r);
        const x = ux * along + px * twist;
        const y = uy * along + py * twist;
        if (i === 0) this.beam.moveTo(x, y);
        else this.beam.lineTo(x, y);
      }
      this.beam.strokePath();
    }

    // Occasional arc forks
    const forkChance = (Math.sin(now / 90) + 1) * 0.5;
    if (forkChance > 0.72) {
      const ft = 0.35 + ((now / 300) % 1) * 0.45;
      const fx = ux * len * ft;
      const fy = uy * len * ft;
      const side = Math.sin(now / 50) > 0 ? 1 : -1;
      this.beam.lineStyle(1.4, CORE, 0.65);
      this.beam.lineBetween(
        fx,
        fy,
        fx + px * 10 * side + ux * 4,
        fy + py * 10 * side + uy * 4
      );
      this.beam.lineBetween(
        fx + px * 5 * side,
        fy + py * 5 * side,
        fx + px * 12 * side - ux * 3,
        fy + py * 12 * side - uy * 3
      );
    }

    // Shaft nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const t = 0.15 + (i / (this.nodes.length - 1)) * 0.7;
      const wobble = Math.sin(now / 130 + i * 1.4) * 2.5;
      const nx = ux * len * t + px * wobble;
      const ny = uy * len * t + py * wobble;
      const node = this.nodes[i]!;
      node.setPosition(nx, ny);
      node.setScale(0.7 + Math.sin(now / 90 + i) * 0.35);
      node.setAlpha(0.4 + Math.sin(now / 100 + i * 0.8) * 0.35);
    }

    // Tip bloom
    this.tipHalo.setPosition(dx, dy).setScale(pulse * 1.25);
    this.tipHalo.setAlpha(0.14 + Math.sin(now / 95) * 0.08);
    this.tipCore.setPosition(dx, dy).setScale(pulse2);
    this.tipCore.setAlpha(0.55 + Math.sin(now / 60) * 0.3);
    this.tipRing.setPosition(dx, dy).setScale(pulse).setRotation(now / 380);
    this.tipRing2
      .setPosition(dx, dy)
      .setScale(pulse * 1.05)
      .setRotation(-now / 290);

    // Orbiting tip sparkles
    for (let i = 0; i < this.orbiters.length; i++) {
      const t = now / 260 + i * ((Math.PI * 2) / this.orbiters.length);
      const orbit = 9 + (i % 3) * 3.5;
      const ox = dx + Math.cos(t * 1.4) * orbit;
      const oy = dy + Math.sin(t * 1.7) * orbit * 0.72;
      const o = this.orbiters[i]!;
      o.setPosition(ox, oy);
      o.setAlpha(0.4 + Math.sin(t * 3) * 0.4);
      o.setScale(0.65 + Math.sin(t * 2.2) * 0.4);
    }

    // Drift sparks along / off the shaft
    this.sparkGfx.clear();
    for (const s of this.sparks) {
      s.t += 0.016 * s.speed;
      if (s.t > 1) {
        s.t = 0;
        s.along = Math.random();
        s.side = Math.random() > 0.5 ? 1 : -1;
        s.size = 1 + Math.random() * 1.6;
      }
      const along = s.along * len;
      const rise = s.t * 14;
      const sway = Math.sin(now / 100 + s.along * 8) * 3;
      const sx = ux * along + px * (s.side * (4 + rise * 0.6) + sway);
      const sy =
        uy * along + py * (s.side * (4 + rise * 0.6) + sway) - rise * 0.4;
      const a = (1 - s.t) * 0.85;
      this.sparkGfx.fillStyle(s.color, a);
      this.sparkGfx.fillCircle(sx, sy, s.size * (1 - s.t * 0.4));
    }
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
