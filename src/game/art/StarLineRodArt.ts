import Phaser from "phaser";

/** Held Star Line — fractured shaft pieces with dark-matter gaps. */
export function drawStarLineRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const dx = tipX - handX;
  const dy = tipY - handY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  // Soft dark-matter mist between shards
  for (let i = 0; i < 5; i++) {
    const t = 0.12 + i * 0.18;
    const x = handX + dx * t;
    const y = handY + dy * t;
    g.fillStyle(0x3a1a68, 0.35);
    g.fillCircle(x + px * (i % 2 === 0 ? 2 : -2), y + py * 1.5, 4.5);
    g.fillStyle(0x9b5de5, 0.22);
    g.fillCircle(x, y, 2.8);
  }

  // Floating rock chips along the line
  const rocks: Array<{ t: number; side: number; r: number }> = [
    { t: 0.22, side: 1, r: 3.2 },
    { t: 0.48, side: -1, r: 2.6 },
    { t: 0.72, side: 1, r: 2.9 },
  ];
  for (const rock of rocks) {
    const x = handX + dx * rock.t + px * rock.side * 5;
    const y = handY + dy * rock.t + py * rock.side * 5;
    g.fillStyle(0x2a2438, 1);
    g.fillCircle(x, y, rock.r + 0.8);
    g.fillStyle(0x5a5368, 1);
    g.fillCircle(x - 0.6, y - 0.5, rock.r);
    g.fillStyle(0x8a8498, 0.7);
    g.fillCircle(x - 1.1, y - 1, rock.r * 0.35);
  }

  // Broken shaft segments
  const segs = [
    { a: 0.0, b: 0.16 },
    { a: 0.22, b: 0.38 },
    { a: 0.44, b: 0.58 },
    { a: 0.64, b: 0.8 },
    { a: 0.86, b: 1.0 },
  ];
  for (const s of segs) {
    const x0 = handX + dx * s.a;
    const y0 = handY + dy * s.a;
    const x1 = handX + dx * s.b;
    const y1 = handY + dy * s.b;
    g.lineStyle(5, 0x0a0614, 1);
    g.lineBetween(x0, y0, x1, y1);
    g.lineStyle(3, 0x2a1848, 1);
    g.lineBetween(x0, y0, x1, y1);
    g.lineStyle(1.4, 0x7a5cff, 0.75);
    g.lineBetween(x0 - px, y0 - py, x1 - px, y1 - py);
  }

  // Dark-matter bridges in the gaps
  for (let i = 0; i < segs.length - 1; i++) {
    const a = segs[i]!.b;
    const b = segs[i + 1]!.a;
    const x0 = handX + dx * a;
    const y0 = handY + dy * a;
    const x1 = handX + dx * b;
    const y1 = handY + dy * b;
    g.lineStyle(2.2, 0xc9a0ff, 0.55);
    g.lineBetween(x0, y0, x1, y1);
    g.lineStyle(1, 0xffffff, 0.35);
    g.lineBetween(x0, y0, x1, y1);
  }

  g.fillStyle(0x1a1428);
  g.fillRect(handX - 3, handY - 2, 8, 8);
  g.fillStyle(0x4a2a78);
  g.fillRect(handX - 3, handY + 5, 8, 3);
  g.fillStyle(0xb8a0ff);
  g.fillCircle(handX + 1, handY + 6, 3.2);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(handX + 1, handY + 6, 1.2);

  // Tip star shard
  g.fillStyle(0xff8ad8, 0.9);
  g.fillCircle(tipX, tipY, 3.4);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(tipX, tipY, 1.4);
  g.lineStyle(1.5, 0xffc8f0, 0.9);
  g.lineBetween(tipX - 5, tipY, tipX + 5, tipY);
  g.lineBetween(tipX, tipY - 5, tipX, tipY + 5);
}

/** Bag / forge icon for Star Line Rod. */
export function drawStarLineRodIcon(g: Phaser.GameObjects.Graphics): void {
  const IPY = 0;
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);

  // Mist
  g.fillStyle(0x4a2080, 0.35);
  g.fillCircle(28, 34 + IPY, 8);
  g.fillStyle(0x9b5de5, 0.2);
  g.fillCircle(36, 26 + IPY, 6);

  const hx = 12;
  const hy = 52 + IPY;
  const tx = 54;
  const ty = 10 + IPY;
  const segs = [
    [0, 0.18],
    [0.26, 0.42],
    [0.5, 0.66],
    [0.74, 0.92],
  ] as const;
  for (const [a, b] of segs) {
    const x0 = hx + (tx - hx) * a;
    const y0 = hy + (ty - hy) * a;
    const x1 = hx + (tx - hx) * b;
    const y1 = hy + (ty - hy) * b;
    g.lineStyle(5, 0x0a0614);
    g.lineBetween(x0, y0, x1, y1);
    g.lineStyle(3, 0x2a1848);
    g.lineBetween(x0, y0, x1, y1);
  }
  g.lineStyle(2, 0xc9a0ff, 0.7);
  g.lineBetween(hx + (tx - hx) * 0.18, hy + (ty - hy) * 0.18, hx + (tx - hx) * 0.26, hy + (ty - hy) * 0.26);
  g.lineBetween(hx + (tx - hx) * 0.42, hy + (ty - hy) * 0.42, hx + (tx - hx) * 0.5, hy + (ty - hy) * 0.5);
  g.lineBetween(hx + (tx - hx) * 0.66, hy + (ty - hy) * 0.66, hx + (tx - hx) * 0.74, hy + (ty - hy) * 0.74);

  g.fillStyle(0x3a3448);
  g.fillCircle(30, 30 + IPY, 3.5);
  g.fillCircle(42, 20 + IPY, 2.8);
  g.fillStyle(0x6a6478);
  g.fillCircle(29.5, 29.5 + IPY, 2.2);

  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44 + IPY, 14, 12, 3);
  g.fillStyle(0x4a2a78);
  g.fillRect(8, 54 + IPY, 14, 3);

  g.fillStyle(0xff8ad8);
  g.fillCircle(tx, ty, 4);
  g.fillStyle(0xffffff);
  g.fillCircle(tx, ty, 1.5);
  g.lineStyle(1.5, 0xffc8f0);
  g.lineBetween(tx - 6, ty, tx + 6, ty);
  g.lineBetween(tx, ty - 6, tx, ty + 6);
}
