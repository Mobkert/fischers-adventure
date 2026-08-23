/** Shared Portal Rod art — purple/black blank with a void portal at the tip. */

export function drawPortalAtTip(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  scale = 1
): void {
  const s = scale;
  // Outer energy halo
  g.fillStyle(0x6b21ff, 0.22);
  g.fillCircle(cx, cy, 9 * s);
  g.fillStyle(0x9333ff, 0.16);
  g.fillCircle(cx, cy, 12 * s);

  // Spinning arc segments (static snapshot — reads as swirl)
  g.lineStyle(2.2 * s, 0xc084fc, 0.95);
  g.strokeCircle(cx, cy, 7.5 * s);
  g.lineStyle(1.6 * s, 0xa855f7, 0.85);
  g.beginPath();
  g.arc(cx, cy, 6.2 * s, -0.4, 1.8, false);
  g.strokePath();
  g.beginPath();
  g.arc(cx, cy, 5.4 * s, 2.1, 4.4, false);
  g.strokePath();
  g.lineStyle(1.2 * s, 0xe9d5ff, 0.75);
  g.beginPath();
  g.arc(cx, cy, 4.6 * s, 0.8, 2.6, false);
  g.strokePath();

  // Black void core
  g.fillStyle(0x050508, 0.98);
  g.fillCircle(cx, cy, 3.8 * s);
  g.fillStyle(0x1a0a2e, 0.9);
  g.fillCircle(cx, cy, 2.6 * s);

  // Violet event horizon ring
  g.lineStyle(1.8 * s, 0x7c3aed, 1);
  g.strokeCircle(cx, cy, 3.9 * s);
  g.lineStyle(1 * s, 0xddd6fe, 0.9);
  g.strokeCircle(cx, cy, 4.8 * s);

  // Bright rim shards
  g.fillStyle(0xe9d5ff, 0.95);
  g.fillCircle(cx + 4.2 * s, cy - 1.2 * s, 1.1 * s);
  g.fillCircle(cx - 3.6 * s, cy + 2.4 * s, 0.85 * s);
  g.fillStyle(0xffffff, 0.88);
  g.fillCircle(cx + 1.8 * s, cy - 3.2 * s, 0.7 * s);

  // Inner star glint
  g.fillStyle(0xc4b5fd, 0.75);
  g.fillCircle(cx - 1.1 * s, cy + 0.8 * s, 0.55 * s);
}

export function drawPortalRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  // Black-purple blank
  g.lineStyle(5, 0x120818, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(3, 0x3b0764, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(1.5, 0x9333ff, 0.72);
  g.lineBetween(handX, handY - 1, tipX, tipY - 1);

  const mx = (handX + tipX) / 2;
  const my = (handY + tipY) / 2;
  g.lineStyle(2, 0x6b21ff, 1);
  g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
  g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
  g.lineStyle(2, 0xa855f7, 1);
  g.lineBetween(mx + 2, my - 2, mx + 6, my - 5);

  // Dark grip + purple reel seat
  g.fillStyle(0x1a1024);
  g.fillRect(handX - 3, handY - 2, 8, 8);
  g.fillStyle(0x4c1d95);
  g.fillRect(handX - 3, handY + 5, 8, 3);
  g.fillStyle(0x6d28d9);
  g.fillCircle(handX + 1, handY + 6, 3.5);
  g.fillStyle(0xc4b5fd);
  g.fillCircle(handX + 1, handY + 6, 1.5);

  g.lineStyle(2, 0xc4b5fd);
  g.strokeCircle(tipX, tipY, 2.8);
  drawPortalAtTip(g, tipX + 3, tipY - 2, 0.82);
}

/** Equipment-bag icon (handle bottom-left → tip top-right). */
export function drawPortalRodIcon(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(24, 58, 26, 8);

  g.lineStyle(5, 0x120818);
  g.lineBetween(14, 54, 46, 18);
  g.lineStyle(3, 0x4c1d95);
  g.lineBetween(16, 52, 44, 20);
  g.lineStyle(1.5, 0x9333ff, 0.75);
  g.lineBetween(20, 48, 42, 22);

  g.lineStyle(2, 0x7c3aed);
  g.lineBetween(22, 46, 26, 42);
  g.lineBetween(30, 38, 34, 34);
  g.lineStyle(2, 0xa855f7);
  g.lineBetween(36, 30, 40, 26);

  g.fillStyle(0x1a1024);
  g.fillRoundedRect(10, 46, 14, 12, 3);
  g.fillStyle(0x2e1065);
  g.fillRect(12, 48, 10, 2);
  g.fillRect(12, 52, 10, 2);
  g.fillStyle(0x4c1d95);
  g.fillRect(10, 56, 14, 3);
  g.fillStyle(0x6d28d9);
  g.fillRect(20, 42, 5, 6);

  g.lineStyle(2, 0xc4b5fd);
  g.strokeCircle(46, 18, 3.5);
  drawPortalAtTip(g, 51, 13, 0.92);
}
