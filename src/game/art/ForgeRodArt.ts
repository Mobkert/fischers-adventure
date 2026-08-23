/** Forge Rod — thick iron blank with a mini furnace on the shaft. */

function drawFurnace(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  scale = 1
): void {
  const s = scale;
  // Stone/brick hearth
  g.fillStyle(0x3a2820, 1);
  g.fillRoundedRect(cx - 7 * s, cy - 5 * s, 14 * s, 11 * s, 2 * s);
  g.fillStyle(0x5a4030, 1);
  g.fillRect(cx - 6 * s, cy - 4 * s, 12 * s, 2 * s);
  g.fillRect(cx - 6 * s, cy + 2 * s, 12 * s, 2 * s);
  g.lineStyle(1 * s, 0x2a1810, 0.9);
  g.strokeRoundedRect(cx - 7 * s, cy - 5 * s, 14 * s, 11 * s, 2 * s);

  // Iron mouth + chimney
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(cx - 4.5 * s, cy - 2 * s, 9 * s, 5 * s);
  g.fillStyle(0x282830, 1);
  g.fillRect(cx - 2 * s, cy - 7 * s, 4 * s, 5 * s);
  g.lineStyle(1 * s, 0x404048, 1);
  g.strokeRect(cx - 2 * s, cy - 7 * s, 4 * s, 5 * s);

  // Ember glow
  g.fillStyle(0xff6622, 0.85);
  g.fillEllipse(cx, cy + 0.5 * s, 6 * s, 3.5 * s);
  g.fillStyle(0xffaa44, 0.95);
  g.fillEllipse(cx, cy + 0.5 * s, 4 * s, 2.2 * s);
  g.fillStyle(0xffeeaa, 0.9);
  g.fillCircle(cx - 1 * s, cy + 0.2 * s, 1.2 * s);
  g.fillCircle(cx + 1.4 * s, cy + 0.8 * s, 0.9 * s);

  // Heat shimmer lines
  g.lineStyle(1 * s, 0xff8844, 0.55);
  g.lineBetween(cx - 3 * s, cy - 8 * s, cx - 1 * s, cy - 10 * s);
  g.lineBetween(cx + 1 * s, cy - 9 * s, cx + 3 * s, cy - 11 * s);
  g.lineStyle(1 * s, 0xffcc66, 0.45);
  g.lineBetween(cx, cy - 8.5 * s, cx + 0.5 * s, cy - 11.5 * s);
}

export function drawForgeRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const perpX = Math.cos(ang + Math.PI / 2);
  const perpY = Math.sin(ang + Math.PI / 2);
  const lerp = (t: number) => ({
    x: Phaser.Math.Linear(handX, tipX, t),
    y: Phaser.Math.Linear(handY, tipY, t),
  });
  const furnace = lerp(0.38);

  // Thick iron blank — triple stroke
  g.lineStyle(8, 0x1a1210, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(5.5, 0x4a3830, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(2.5, 0x8a7060, 0.85);
  g.lineBetween(handX + perpX, handY + perpY, tipX + perpX, tipY + perpY);

  // Riveted bands
  for (const t of [0.18, 0.52, 0.78]) {
    const p = lerp(t);
    g.lineStyle(2, 0x2a2018, 1);
    g.lineBetween(
      p.x + perpX * 4.5,
      p.y + perpY * 4.5,
      p.x - perpX * 4.5,
      p.y - perpY * 4.5
    );
    g.fillStyle(0x6a5848);
    g.fillCircle(p.x + perpX * 3.2, p.y + perpY * 3.2, 1.1);
    g.fillCircle(p.x - perpX * 3.2, p.y - perpY * 3.2, 1.1);
  }

  // Leather grip
  g.fillStyle(0x5a3218, 1);
  g.fillRect(handX - 4, handY - 3, 10, 10);
  g.fillStyle(0x7a4a28, 1);
  g.fillRect(handX - 3, handY - 1, 8, 2);
  g.fillRect(handX - 3, handY + 2, 8, 2);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(handX - 4, handY + 6, 10, 3);

  // Brass reel seat
  g.fillStyle(0x8a6020, 1);
  g.fillCircle(handX + 1, handY + 7, 4);
  g.fillStyle(0xc8a030, 1);
  g.fillCircle(handX + 1, handY + 7, 2.2);

  drawFurnace(g, furnace.x, furnace.y, 0.72);

  // Forged hook ring at tip
  g.lineStyle(2.5, 0xc8a030, 1);
  g.strokeCircle(tipX, tipY, 3.2);
  g.lineStyle(1.5, 0xffeeaa, 0.8);
  g.strokeCircle(tipX, tipY, 2);
  g.fillStyle(0xffaa44, 0.75);
  g.fillCircle(tipX + 2, tipY - 2, 1.2);
}

/** Equipment-bag icon. */
export function drawForgeRodIcon(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(26, 58, 28, 8);

  g.lineStyle(7, 0x1a1210);
  g.lineBetween(14, 54, 48, 16);
  g.lineStyle(4.5, 0x5a4030);
  g.lineBetween(16, 52, 46, 18);
  g.lineStyle(2, 0x9a8070, 0.8);
  g.lineBetween(18, 50, 44, 20);

  g.lineStyle(2, 0x3a2818);
  g.lineBetween(22, 44, 26, 40);
  g.lineBetween(30, 36, 34, 32);
  g.lineBetween(38, 28, 42, 24);

  g.fillStyle(0x5a3218);
  g.fillRoundedRect(10, 46, 14, 12, 3);
  g.fillStyle(0x8a6020);
  g.fillRect(10, 56, 14, 3);
  g.fillStyle(0xc8a030);
  g.fillRect(20, 42, 6, 7);

  drawFurnace(g, 28, 38, 0.95);

  g.lineStyle(2, 0xc8a030);
  g.strokeCircle(48, 16, 3.5);
  g.fillStyle(0xffaa44, 0.8);
  g.fillCircle(50, 14, 1.4);
}
