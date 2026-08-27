import Phaser from "phaser";

export type FrostHeldTheme =
  | "hyperthermic"
  | "hyperboreal"
  | "halo_of_ice"
  | "frozen_lotus";

const ICE = 0x7ec8e8;
const ICE_LT = 0xc8ecff;
const ICE_CORE = 0xffffff;
const ICE_DEEP = 0x4a88b0;
const AURORA = 0xa8d0ff;
const LOTUS = 0xe8f4ff;
const LOTUS_PINK = 0xd8e8f8;

type Flake = {
  t: number;
  along: number;
  side: number;
  speed: number;
  size: number;
  color: number;
};

/**
 * Held-rod frost VFX for Frostpeak skins.
 * Root anchors on the grip; drawing is hand-relative so it tracks the shaft.
 */
export class FrostRodHeldVfx {
  private root: Phaser.GameObjects.Container;
  private shaft: Phaser.GameObjects.Graphics;
  private tipGfx: Phaser.GameObjects.Graphics;
  private flakeGfx: Phaser.GameObjects.Graphics;
  private tipHalo: Phaser.GameObjects.Arc;
  private tipCore: Phaser.GameObjects.Arc;
  private tipRing: Phaser.GameObjects.Arc;
  private tipRing2: Phaser.GameObjects.Arc;
  private orbiters: Phaser.GameObjects.Arc[] = [];
  private crystals: Phaser.GameObjects.Arc[] = [];
  private flakes: Flake[] = [];
  private visible = false;
  private theme: FrostHeldTheme = "hyperthermic";
  private flakeBudget = 18;

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(14).setVisible(false);
    this.shaft = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.tipGfx = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.flakeGfx = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);

    this.tipHalo = scene.add
      .circle(0, 0, 20, ICE, 0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tipCore = scene.add
      .circle(0, 0, 5, ICE_CORE, 0.8)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tipRing = scene.add
      .circle(0, 0, 11, ICE, 0)
      .setStrokeStyle(2, ICE_LT, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tipRing2 = scene.add
      .circle(0, 0, 16, ICE_DEEP, 0)
      .setStrokeStyle(1.5, ICE_CORE, 0.65)
      .setBlendMode(Phaser.BlendModes.ADD);

    for (let i = 0; i < 10; i++) {
      this.orbiters.push(
        scene.add
          .circle(0, 0, 1.3 + (i % 3) * 0.35, i % 2 ? ICE_CORE : ICE_LT, 0.9)
          .setBlendMode(Phaser.BlendModes.ADD)
      );
    }
    for (let i = 0; i < 6; i++) {
      this.crystals.push(
        scene.add
          .circle(0, 0, 2, i % 2 ? ICE : AURORA, 0.7)
          .setBlendMode(Phaser.BlendModes.ADD)
      );
    }

    this.root.add([
      this.shaft,
      this.tipHalo,
      this.tipRing2,
      this.tipRing,
      this.tipCore,
      this.tipGfx,
      ...this.crystals,
      ...this.orbiters,
      this.flakeGfx,
    ]);

    this.rebuildFlakes(18);
  }

  setTheme(theme: FrostHeldTheme): void {
    const changed = this.theme !== theme;
    this.theme = theme;
    if (changed) {
      this.flakeBudget =
        theme === "frozen_lotus"
          ? 8
          : theme === "hyperthermic"
            ? 20
            : theme === "hyperboreal" || theme === "halo_of_ice"
              ? 18
              : 14;
      this.rebuildFlakes(this.flakeBudget);
    }

    // Hyperthermic uses custom forge-ice drawing — hide laser-like tip rings/orbiters
    const softTip =
      theme === "hyperboreal" ||
      theme === "halo_of_ice" ||
      theme === "frozen_lotus";
    this.tipHalo.setVisible(softTip);
    this.tipCore.setVisible(softTip);
    this.tipRing.setVisible(softTip);
    this.tipRing2.setVisible(theme === "halo_of_ice");
    for (const o of this.orbiters) {
      o.setVisible(theme === "hyperboreal" || theme === "halo_of_ice");
    }
    for (const c of this.crystals) {
      c.setVisible(theme === "hyperboreal");
    }
  }

  private rebuildFlakes(n: number): void {
    this.flakes = [];
    for (let i = 0; i < n; i++) {
      this.flakes.push({
        t: Math.random(),
        along: Math.random(),
        side: Math.random() > 0.5 ? 1 : -1,
        speed: 0.25 + Math.random() * 0.55,
        size: 1 + Math.random() * 1.8,
        color:
          i % 4 === 0
            ? ICE_CORE
            : i % 4 === 1
              ? ICE_LT
              : i % 4 === 2
                ? ICE
                : AURORA,
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

    this.root.setPosition(handX, handY);
    const dx = tipX - handX;
    const dy = tipY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const pulse = 0.88 + Math.sin(now / 120) * 0.12;
    const pulse2 = 0.9 + Math.sin(now / 75) * 0.1;

    this.shaft.clear();
    this.tipGfx.clear();
    this.flakeGfx.clear();

    switch (this.theme) {
      case "hyperthermic":
        this.drawHyperthermic(dx, dy, len, ux, uy, px, py, now, pulse, pulse2);
        break;
      case "hyperboreal":
        this.drawHyperboreal(dx, dy, len, ux, uy, px, py, now, pulse, pulse2);
        break;
      case "halo_of_ice":
        this.drawHalo(dx, dy, len, ux, uy, px, py, now, pulse, pulse2);
        break;
      case "frozen_lotus":
        this.drawLotus(dx, dy, len, ux, uy, px, py, now, pulse);
        break;
    }

    this.updateFlakes(len, ux, uy, px, py, now);
  }

  private drawHyperthermic(
    dx: number,
    dy: number,
    len: number,
    ux: number,
    uy: number,
    px: number,
    py: number,
    now: number,
    pulse: number,
    _pulse2: number
  ): void {
    // Subtle cold metal sheen on the blank (not a neon energy wrap)
    this.shaft.lineStyle(7, ICE_DEEP, 0.1 * pulse);
    this.shaft.lineBetween(0, 0, dx, dy);
    this.shaft.lineStyle(2.2, ICE_LT, 0.22);
    this.shaft.lineBetween(ux * 3, uy * 3, dx - ux * 4, dy - uy * 4);

    // Riveted frost bands that flash like chilled iron
    for (const t of [0.16, 0.48, 0.78]) {
      const flash = 0.35 + Math.sin(now / 160 + t * 8) * 0.35;
      const bx = ux * len * t;
      const by = uy * len * t;
      this.shaft.lineStyle(3.2, ICE, 0.25 + flash * 0.45);
      this.shaft.lineBetween(bx + px * 6, by + py * 6, bx - px * 6, by - py * 6);
      this.shaft.fillStyle(ICE_CORE, 0.4 + flash * 0.4);
      this.shaft.fillCircle(bx + px * 4.5, by + py * 4.5, 1.4);
      this.shaft.fillCircle(bx - px * 4.5, by - py * 4.5, 1.4);
    }

    // Mid-shaft frost furnace (forge motif, iced over)
    const ft = 0.38;
    const fx = ux * len * ft;
    const fy = uy * len * ft;
    const s = 0.85 + Math.sin(now / 140) * 0.06;
    this.shaft.fillStyle(0x1a2838, 0.85);
    this.shaft.fillRoundedRect(fx - 8 * s, fy - 6 * s, 16 * s, 13 * s, 2);
    this.shaft.fillStyle(0x4a6880, 0.9);
    this.shaft.fillRect(fx - 7 * s, fy - 5 * s, 14 * s, 2.2 * s);
    this.shaft.fillRect(fx - 7 * s, fy + 3 * s, 14 * s, 2.2 * s);
    this.shaft.fillStyle(0x0a1828, 1);
    this.shaft.fillRect(fx - 5 * s, fy - 2.5 * s, 10 * s, 5.5 * s);
    // Chimney
    this.shaft.fillStyle(0x2a4050, 1);
    this.shaft.fillRect(fx - 2.2 * s, fy - 10 * s, 4.4 * s, 5 * s);
    this.shaft.lineStyle(1, ICE_LT, 0.7);
    this.shaft.strokeRect(fx - 2.2 * s, fy - 10 * s, 4.4 * s, 5 * s);

    // Ice-flame in the furnace mouth (vertical plumes, not tip orbits)
    const roar = 0.7 + Math.sin(now / 90) * 0.3;
    for (let i = 0; i < 5; i++) {
      const ox = (i - 2) * 1.6 * s;
      const h = (5 + (i % 3) * 2.5) * s * roar;
      const wobble = Math.sin(now / 70 + i * 1.4) * 1.2 * s;
      this.shaft.fillStyle(i % 2 ? ICE : ICE_DEEP, 0.55);
      this.shaft.fillTriangle(
        fx + ox - 1.8 * s,
        fy + 1.5 * s,
        fx + ox + 1.8 * s,
        fy + 1.5 * s,
        fx + ox + wobble,
        fy + 1.5 * s - h
      );
      this.shaft.fillStyle(ICE_CORE, 0.65);
      this.shaft.fillTriangle(
        fx + ox - 0.7 * s,
        fy + 1.2 * s,
        fx + ox + 0.7 * s,
        fy + 1.2 * s,
        fx + ox + wobble * 0.5,
        fy + 1.2 * s - h * 0.7
      );
    }
    // Cold steam rising from chimney (world-up)
    for (let i = 0; i < 4; i++) {
      const life = ((now / 400 + i * 0.22) % 1);
      const sy = fy - 10 * s - life * 16;
      const sx = fx + Math.sin(now / 180 + i * 2) * (2 + life * 4);
      this.shaft.fillStyle(ICE_LT, (1 - life) * 0.45);
      this.shaft.fillCircle(sx, sy, 2.2 + life * 3);
    }

    // Side ice spikes growing off the blank (weapon-like, forge silhouette)
    for (let i = 0; i < 6; i++) {
      const t = 0.22 + i * 0.12;
      const side = i % 2 === 0 ? 1 : -1;
      const grow = 0.75 + Math.sin(now / 200 + i * 1.1) * 0.25;
      const bx = ux * len * t;
      const by = uy * len * t;
      const reach = (7 + (i % 3) * 3) * grow;
      const tipx = bx + px * side * reach + ux * 2;
      const tipy = by + py * side * reach + uy * 2;
      this.shaft.fillStyle(ICE_DEEP, 0.9);
      this.shaft.fillTriangle(
        bx + px * side * 2,
        by + py * side * 2,
        bx - px * side * 0.5 + ux * 1.5,
        by - py * side * 0.5 + uy * 1.5,
        tipx,
        tipy
      );
      this.shaft.fillStyle(ICE_CORE, 0.75);
      this.shaft.fillTriangle(
        bx + px * side * 2.2,
        by + py * side * 2.2,
        bx + ux,
        by + uy,
        tipx * 0.7 + bx * 0.3,
        tipy * 0.7 + by * 0.3
      );
    }

    // Gravity-hanging icicles (drip down the screen, not along the shaft)
    for (let i = 0; i < 8; i++) {
      const t = 0.14 + i * 0.095;
      const sway = Math.sin(now / 220 + i * 1.7) * 1.8;
      const bx = ux * len * t + px * sway * 0.4;
      const by = uy * len * t + py * sway * 0.4;
      const h = 8 + (i % 4) * 3 + Math.sin(now / 160 + i) * 2;
      this.shaft.fillStyle(ICE, 0.88);
      this.shaft.fillTriangle(bx - 2.4, by, bx + 2.4, by, bx + sway * 0.15, by + h);
      this.shaft.fillStyle(ICE_CORE, 0.7);
      this.shaft.fillTriangle(bx - 0.9, by + 1, bx + 0.8, by + 1, bx, by + h * 0.72);
      // Melt drip
      const drip = ((now / 350 + i * 0.18) % 1);
      if (drip > 0.15) {
        const dyDrip = by + h * 0.85 + (drip - 0.15) * 14;
        this.shaft.fillStyle(ICE_LT, (1 - drip) * 0.7);
        this.shaft.fillCircle(bx, dyDrip, 1.1);
      }
    }

    // Tip = jagged ice spear crown (no spinning rings)
    const tipPulse = 0.85 + Math.sin(now / 110) * 0.15;
    this.tipGfx.fillStyle(ICE_DEEP, 0.25 * tipPulse);
    this.tipGfx.fillCircle(dx, dy, 10);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.38 + Math.sin(now / 300 + i) * 0.08;
      const reach = (9 + (i === 3 ? 5 : i % 2) * 3) * tipPulse;
      const tx = dx + Math.cos(a) * reach;
      const ty = dy + Math.sin(a) * reach;
      this.tipGfx.fillStyle(ICE, 0.9);
      this.tipGfx.fillTriangle(
        dx + Math.cos(a + 0.35) * 3,
        dy + Math.sin(a + 0.35) * 3,
        dx + Math.cos(a - 0.35) * 3,
        dy + Math.sin(a - 0.35) * 3,
        tx,
        ty
      );
      this.tipGfx.fillStyle(ICE_CORE, 0.8);
      this.tipGfx.fillTriangle(
        dx + Math.cos(a + 0.15) * 1.4,
        dy + Math.sin(a + 0.15) * 1.4,
        dx + Math.cos(a - 0.15) * 1.4,
        dy + Math.sin(a - 0.15) * 1.4,
        dx + Math.cos(a) * reach * 0.75,
        dy + Math.sin(a) * reach * 0.75
      );
    }
    this.tipGfx.fillStyle(ICE_CORE, 0.55 + Math.sin(now / 80) * 0.25);
    this.tipGfx.fillCircle(dx, dy, 2.6);

    // Occasional frost crack flash across the blank
    if (Math.sin(now / 95) > 0.78) {
      const ct = 0.3 + ((now / 500) % 0.4);
      const cx = ux * len * ct;
      const cy = uy * len * ct;
      this.shaft.lineStyle(1.4, ICE_CORE, 0.7);
      this.shaft.lineBetween(
        cx + px * 5,
        cy + py * 5,
        cx - px * 4 + ux * 6,
        cy - py * 4 + uy * 6
      );
      this.shaft.lineBetween(
        cx - px * 2,
        cy - py * 2,
        cx + px * 3 + ux * 4,
        cy + py * 3 + uy * 4
      );
    }
  }

  private drawHyperboreal(
    dx: number,
    dy: number,
    len: number,
    ux: number,
    uy: number,
    px: number,
    py: number,
    now: number,
    pulse: number,
    pulse2: number
  ): void {
    this.shaft.lineStyle(12, AURORA, 0.12 * pulse);
    this.shaft.lineBetween(0, 0, dx, dy);
    this.shaft.lineStyle(7, ICE, 0.2 * pulse);
    this.shaft.lineBetween(0, 0, dx, dy);
    this.shaft.lineStyle(3, ICE_LT, 0.4);
    this.shaft.lineBetween(0, 0, dx, dy);

    // Aurora sheets
    for (let r = 0; r < 3; r++) {
      const phase = now / (200 + r * 50) + r * 2;
      this.shaft.lineStyle(2.2, r === 1 ? ICE_CORE : AURORA, 0.4);
      this.shaft.beginPath();
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const along = t * len;
        const wave =
          Math.sin(phase + t * Math.PI * 2.5) * (8 + r * 3) +
          Math.cos(phase * 0.7 + t * 4) * 2;
        const x = ux * along + px * wave;
        const y = uy * along + py * wave;
        if (i === 0) this.shaft.moveTo(x, y);
        else this.shaft.lineTo(x, y);
      }
      this.shaft.strokePath();
    }

    for (let i = 0; i < this.crystals.length; i++) {
      const t = 0.2 + (i / Math.max(1, this.crystals.length - 1)) * 0.65;
      const wobble = Math.sin(now / 160 + i) * 3.5;
      const c = this.crystals[i]!;
      c.setPosition(ux * len * t + px * wobble, uy * len * t + py * wobble);
      c.setScale(0.8 + Math.sin(now / 100 + i * 0.9) * 0.35);
      c.setAlpha(0.5 + Math.sin(now / 90 + i) * 0.3);
    }

    this.placeTipBloom(dx, dy, now, pulse, pulse2, 1.15);
    // Ice cube-ish tip accent
    const s = 7 + Math.sin(now / 100) * 1.2;
    this.tipGfx.lineStyle(1.6, ICE_CORE, 0.75);
    this.tipGfx.strokeRect(dx - s, dy - s, s * 2, s * 2);
    this.tipGfx.fillStyle(ICE_LT, 0.2);
    this.tipGfx.fillRect(dx - s + 2, dy - s + 2, s * 2 - 4, s * 2 - 4);
    this.orbitTip(dx, dy, now, 13, 1.35);
  }

  private drawHalo(
    dx: number,
    dy: number,
    len: number,
    ux: number,
    uy: number,
    px: number,
    py: number,
    now: number,
    pulse: number,
    pulse2: number
  ): void {
    // Soft shaft frost
    this.shaft.lineStyle(9, ICE, 0.12 * pulse);
    this.shaft.lineBetween(0, 0, dx, dy);
    this.shaft.lineStyle(4, ICE_LT, 0.28);
    this.shaft.lineBetween(0, 0, dx, dy);

    // Light swirl along blank
    const phase = now / 180;
    this.shaft.lineStyle(1.5, ICE_CORE, 0.45);
    this.shaft.beginPath();
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const twist = Math.sin(phase + t * Math.PI * 2.5) * 5;
      const x = ux * len * t + px * twist;
      const y = uy * len * t + py * twist;
      if (i === 0) this.shaft.moveTo(x, y);
      else this.shaft.lineTo(x, y);
    }
    this.shaft.strokePath();

    this.placeTipBloom(dx, dy, now, pulse, pulse2, 1.5);

    // Prominent ice ring + swirling core
    const r0 = 12 + Math.sin(now / 140) * 1.5;
    this.tipGfx.lineStyle(3.2, ICE, 0.85);
    this.tipGfx.strokeCircle(dx, dy, r0);
    this.tipGfx.lineStyle(2, ICE_CORE, 0.9);
    this.tipGfx.strokeCircle(dx, dy, r0);
    this.tipGfx.lineStyle(1.2, ICE_LT, 0.7);
    this.tipGfx.strokeCircle(dx, dy, r0 - 2.5);

    // Crystal nubs on ring
    for (let i = 0; i < 10; i++) {
      const a = now / 420 + (i / 10) * Math.PI * 2;
      const rx = dx + Math.cos(a) * r0;
      const ry = dy + Math.sin(a) * r0;
      this.tipGfx.fillStyle(i % 2 ? ICE_CORE : ICE_LT, 0.9);
      this.tipGfx.fillCircle(rx, ry, 1.6);
    }

    // Swirling frost inside ring
    for (let ring = 0; ring < 3; ring++) {
      const rr = 3.5 + ring * 2.4;
      this.tipGfx.lineStyle(
        1.4 - ring * 0.25,
        ring === 1 ? ICE_CORE : ICE_LT,
        0.45 + Math.sin(now / 90 + ring) * 0.2
      );
      this.tipGfx.beginPath();
      this.tipGfx.arc(
        dx,
        dy,
        rr,
        now / (120 - ring * 20),
        now / (120 - ring * 20) + Math.PI * 1.35,
        false
      );
      this.tipGfx.strokePath();
    }
    this.tipGfx.fillStyle(ICE_CORE, 0.55 + Math.sin(now / 70) * 0.25);
    this.tipGfx.fillCircle(dx, dy, 3.2);

    this.orbitTip(dx, dy, now, 16, 1.5);
  }

  private drawLotus(
    dx: number,
    dy: number,
    len: number,
    ux: number,
    uy: number,
    px: number,
    py: number,
    now: number,
    pulse: number
  ): void {
    // Soft white glow only — a few VFX
    this.shaft.lineStyle(8, LOTUS, 0.1 * pulse);
    this.shaft.lineBetween(0, 0, dx, dy);
    this.shaft.lineStyle(3, ICE_LT, 0.2);
    this.shaft.lineBetween(len * 0.35 * ux, len * 0.35 * uy, dx, dy);

    this.tipHalo.setPosition(dx, dy).setScale(pulse * 0.9).setAlpha(0.1);
    this.tipCore.setPosition(dx, dy).setScale(pulse).setAlpha(0.45);
    this.tipRing
      .setPosition(dx, dy)
      .setScale(pulse)
      .setAlpha(0.5)
      .setRotation(now / 500);

    // Occasional petal wisps near tip
    for (let i = 0; i < 5; i++) {
      const a = now / 380 + (i / 5) * Math.PI * 2;
      const r = 8 + Math.sin(now / 200 + i) * 2;
      const x = dx + Math.cos(a) * r;
      const y = dy + Math.sin(a) * r * 0.7;
      this.tipGfx.fillStyle(LOTUS_PINK, 0.35 + Math.sin(a * 2) * 0.15);
      this.tipGfx.fillEllipse(x, y, 6, 3.2);
    }

    // Soft mid-shaft shimmer
    const mid = 0.55;
    const mx = ux * len * mid;
    const my = uy * len * mid;
    this.shaft.fillStyle(ICE_CORE, 0.25 + Math.sin(now / 150) * 0.12);
    this.shaft.fillCircle(mx + px * 2, my + py * 2, 2.2);
  }

  private placeTipBloom(
    dx: number,
    dy: number,
    now: number,
    pulse: number,
    pulse2: number,
    scale: number
  ): void {
    this.tipHalo
      .setPosition(dx, dy)
      .setScale(pulse * scale)
      .setAlpha(0.14 + Math.sin(now / 100) * 0.08);
    this.tipCore
      .setPosition(dx, dy)
      .setScale(pulse2)
      .setAlpha(0.55 + Math.sin(now / 65) * 0.28);
    this.tipRing
      .setPosition(dx, dy)
      .setScale(pulse)
      .setRotation(now / 360);
    this.tipRing2
      .setPosition(dx, dy)
      .setScale(pulse * 1.05)
      .setRotation(-now / 280);
  }

  private orbitTip(
    dx: number,
    dy: number,
    now: number,
    baseR: number,
    speed: number
  ): void {
    for (let i = 0; i < this.orbiters.length; i++) {
      if (!this.orbiters[i]!.visible) continue;
      const t = now / (280 / speed) + i * ((Math.PI * 2) / this.orbiters.length);
      const orbit = baseR + (i % 3) * 3.2;
      const o = this.orbiters[i]!;
      o.setPosition(dx + Math.cos(t * 1.35) * orbit, dy + Math.sin(t * 1.6) * orbit * 0.7);
      o.setAlpha(0.4 + Math.sin(t * 3) * 0.4);
      o.setScale(0.65 + Math.sin(t * 2.2) * 0.4);
    }
  }

  private updateFlakes(
    len: number,
    ux: number,
    uy: number,
    px: number,
    py: number,
    now: number
  ): void {
    // Hyperthermic: cold steam from the frost furnace + falling ice chips
    if (this.theme === "hyperthermic") {
      const fx = ux * len * 0.38;
      const fy = uy * len * 0.38;
      for (let i = 0; i < this.flakes.length; i++) {
        const s = this.flakes[i]!;
        s.t += 0.014 * s.speed;
        if (s.t > 1) {
          s.t = 0;
          s.along = Math.random();
          s.side = Math.random() > 0.5 ? 1 : -1;
          s.size = 1.2 + Math.random() * 2;
        }
        const a = (1 - s.t) * 0.75;
        if (i % 2 === 0) {
          // Steam plume rising from furnace chimney
          const sx = fx + Math.sin(now / 160 + i) * (2 + s.t * 6) * s.side;
          const sy = fy - 8 - s.t * 22;
          this.flakeGfx.fillStyle(ICE_LT, a * 0.55);
          this.flakeGfx.fillCircle(sx, sy, s.size * (1 + s.t));
        } else {
          // Ice chips shedding from side spikes / tip
          const along = (0.25 + s.along * 0.65) * len;
          const sx =
            ux * along +
            px * s.side * (6 + s.t * 10) +
            Math.sin(now / 100 + i) * 2;
          const sy = uy * along + py * s.side * (4 + s.t * 4) + s.t * 14;
          this.flakeGfx.fillStyle(s.color, a);
          this.flakeGfx.fillTriangle(
            sx,
            sy - s.size,
            sx + s.size * 0.75,
            sy + s.size * 0.55,
            sx - s.size * 0.75,
            sy + s.size * 0.55
          );
        }
      }
      return;
    }

    const riseMul = this.theme === "frozen_lotus" ? 8 : 12;
    for (const s of this.flakes) {
      s.t += 0.016 * s.speed;
      if (s.t > 1) {
        s.t = 0;
        s.along = Math.random();
        s.side = Math.random() > 0.5 ? 1 : -1;
        s.size = 1 + Math.random() * 1.8;
      }
      const along = s.along * len;
      const rise = s.t * riseMul;
      const sway = Math.sin(now / 110 + s.along * 8) * 3;
      const sx = ux * along + px * (s.side * (3.5 + rise * 0.55) + sway);
      const sy =
        uy * along + py * (s.side * (3.5 + rise * 0.55) + sway) - rise * 0.45;
      const a = (1 - s.t) * (this.theme === "frozen_lotus" ? 0.55 : 0.85);
      this.flakeGfx.fillStyle(s.color, a);
      this.flakeGfx.fillCircle(sx, sy, s.size * (1 - s.t * 0.4));
    }
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
