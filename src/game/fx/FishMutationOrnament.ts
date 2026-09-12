import Phaser from "phaser";
import { FishMutationId } from "../data/items";

/** Draw starstruck / event-horizon / gate ornaments centered on a fish icon. */
export function drawFishMutationOrnament(
  g: Phaser.GameObjects.Graphics,
  mutation: FishMutationId | null | undefined,
  displayW: number,
  displayH: number,
  phase = 0,
  flipX = false
): void {
  g.clear();
  if (
    mutation !== "starstruck" &&
    mutation !== "event_horizon" &&
    mutation !== "gate"
  ) {
    return;
  }

  const flip = flipX ? -1 : 1;
  const bw = Math.max(12, displayW);
  const bh = Math.max(8, displayH);
  const t = phase;

  if (mutation === "starstruck") {
    const colors = [0xffe066, 0xffffff, 0xc9a0ff, 0x7ec8ff, 0xffb0e0];
    for (let i = 0; i < 7; i++) {
      const a = t * (1.6 + i * 0.17) + i * 0.9;
      const orbit = 0.35 + (i % 3) * 0.12;
      const x = Math.cos(a) * bw * orbit * flip;
      const y = Math.sin(a * 1.3) * bh * (0.55 + (i % 2) * 0.25);
      const twinkle = 0.4 + Math.sin(t * 5 + i) * 0.35;
      const col = colors[i % colors.length]!;
      g.fillStyle(col, 0.5 + twinkle * 0.45);
      const s = 1.5 + (i % 3) * 0.55;
      g.fillCircle(x, y, s * twinkle);
      g.lineStyle(1.2, col, 0.55 + twinkle * 0.4);
      g.lineBetween(x - s * 2.2, y, x + s * 2.2, y);
      g.lineBetween(x, y - s * 2.2, x, y + s * 2.2);
    }
    return;
  }

  if (mutation === "gate") {
    // Same orbit layout as Starstruck, but little void portals instead of stars
    const rim = [0x9b7cff, 0xc9a0ff, 0x6a4cff, 0xe0d0ff, 0x7a5cff];
    for (let i = 0; i < 7; i++) {
      const a = t * (1.6 + i * 0.17) + i * 0.9;
      const orbit = 0.35 + (i % 3) * 0.12;
      const x = Math.cos(a) * bw * orbit * flip;
      const y = Math.sin(a * 1.3) * bh * (0.55 + (i % 2) * 0.25);
      const pulse = 0.45 + Math.sin(t * 4.5 + i) * 0.3;
      const col = rim[i % rim.length]!;
      const rx = 2.2 + (i % 3) * 0.7;
      const ry = rx * 1.35;
      g.fillStyle(0x0a0618, 0.85);
      g.fillEllipse(x, y, rx * 2, ry * 2);
      g.lineStyle(1.4, col, 0.55 + pulse * 0.4);
      g.strokeEllipse(x, y, rx * 2, ry * 2);
      g.lineStyle(1, 0xffffff, 0.25 + pulse * 0.35);
      g.strokeEllipse(x, y, rx * 1.15, ry * 1.15);
      g.fillStyle(col, 0.35 + pulse * 0.25);
      g.fillCircle(x, y - ry * 0.15, 0.7);
    }
    return;
  }

  // event_horizon
  for (let i = 0; i < 3; i++) {
    const spin = t * (2.2 + i * 0.4) + i;
    const rx = bw * (0.24 + i * 0.08);
    const ry = bh * (0.3 + i * 0.07);
    g.lineStyle(
      1.8 - i * 0.3,
      i % 2 ? 0xff8c42 : 0xc9a0ff,
      0.4 + Math.sin(t * 3 + i) * 0.15
    );
    g.beginPath();
    const segs = 20;
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2 + spin;
      const x = Math.cos(a) * rx * flip;
      const y = Math.sin(a) * ry * 0.55;
      if (s === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }
  const core = Math.max(4, Math.min(bw, bh) * 0.24);
  g.fillStyle(0x000000, 0.95);
  g.fillCircle(0, 0, core);
  g.fillStyle(0x12081c, 0.85);
  g.fillCircle(0, 0, core * 0.65);
  const pulse = 0.5 + Math.sin(t * 4) * 0.35;
  g.lineStyle(2.2, 0xffc070, 0.45 + pulse * 0.4);
  g.strokeEllipse(0, 0, bw * 0.42, bh * 0.48);
  g.lineStyle(1.3, 0xffffff, 0.3 + pulse * 0.3);
  g.strokeEllipse(0, 0, bw * 0.52, bh * 0.58);
  for (let i = 0; i < 5; i++) {
    const a = -t * (3 + i * 0.5) + i * 1.2;
    const r = Math.max(
      2,
      Math.min(bw, bh) * (0.3 - ((t * 0.4 + i * 0.1) % 0.22))
    );
    g.fillStyle(i % 2 ? 0xffe066 : 0xc9a0ff, 0.6);
    g.fillCircle(Math.cos(a) * r * flip, Math.sin(a) * r * 0.5, 1.5);
  }
}
