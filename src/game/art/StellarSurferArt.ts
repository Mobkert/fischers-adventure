import Phaser from "phaser";

/** Held Stellar Surfer — galactic surfboard used as a fishing blank. */
export function drawStellarSurferRod(
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

  const edge = (t: number, w: number) => ({
    x: handX + dx * t + px * w,
    y: handY + dy * t + py * w,
  });

  // Soft void glow under the deck
  g.fillStyle(0x4a20a0, 0.35);
  for (let i = 0; i < 5; i++) {
    const p = edge(0.15 + i * 0.18, 0);
    g.fillCircle(p.x, p.y, 5 + (i % 2));
  }

  // Board silhouette (thick blank)
  g.lineStyle(11, 0x0a0618, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(8, 0x1a0a40, 1);
  g.lineBetween(handX, handY, tipX, tipY);

  // Nebula deck stripes
  g.lineStyle(5, 0x3d1a88, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(3.2, 0x6a3cff, 0.95);
  g.lineBetween(handX + px * 0.5, handY + py * 0.5, tipX + px * 0.5, tipY + py * 0.5);
  g.lineStyle(2, 0xff8c42, 0.75);
  g.lineBetween(handX - px * 1.2, handY - py * 1.2, tipX - px * 1.2, tipY - py * 1.2);
  g.lineStyle(1.4, 0x7ec8ff, 0.85);
  g.lineBetween(handX + px * 1.4, handY + py * 1.4, tipX + px * 1.4, tipY + py * 1.4);

  // Rail highlights
  g.lineStyle(1.2, 0xe8d0ff, 0.7);
  g.lineBetween(handX + px * 3.2, handY + py * 3.2, tipX + px * 2.4, tipY + py * 2.4);
  g.lineBetween(handX - px * 3.2, handY - py * 3.2, tipX - px * 2.4, tipY - py * 2.4);

  // Nose + tail fins
  const nose = edge(1, 0);
  g.fillStyle(0xc9a0ff, 0.95);
  g.fillTriangle(
    nose.x + ux * 2,
    nose.y + uy * 2,
    nose.x + px * 4 - ux * 2,
    nose.y + py * 4 - uy * 2,
    nose.x - px * 4 - ux * 2,
    nose.y - py * 4 - uy * 2
  );
  g.fillStyle(0xffe066, 0.9);
  g.fillCircle(nose.x, nose.y, 2.2);

  const tail = edge(0.02, 0);
  g.fillStyle(0x2a1848, 1);
  g.fillTriangle(
    tail.x - ux * 2,
    tail.y - uy * 2,
    tail.x + px * 5 + ux * 3,
    tail.y + py * 5 + uy * 3,
    tail.x - px * 5 + ux * 3,
    tail.y - py * 5 + uy * 3
  );

  // Grip cork
  g.fillStyle(0xc4a574);
  g.fillRect(handX - 3, handY - 2, 8, 8);
  g.fillStyle(0x5a30c8);
  g.fillRect(handX - 3, handY + 5, 8, 3);
  g.fillStyle(0xffc070);
  g.fillCircle(handX + 1, handY + 6, 3.2);
  g.fillStyle(0xffffff);
  g.fillCircle(handX + 1, handY + 6, 1.2);

  // Star studs along the deck
  for (let i = 0; i < 4; i++) {
    const p = edge(0.22 + i * 0.2, (i % 2 === 0 ? 1 : -1) * 1.5);
    g.fillStyle(i % 2 ? 0xffe066 : 0xffffff, 0.95);
    g.fillCircle(p.x, p.y, 1.3);
  }
}

/** Bag / hotbar icon — top-down-ish galactic board. */
export function drawStellarSurferIcon(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(32, 56, 36, 8);

  // Board body
  g.fillStyle(0x0a0618, 1);
  g.beginPath();
  g.moveTo(14, 48);
  g.lineTo(22, 18);
  g.lineTo(36, 10);
  g.lineTo(48, 16);
  g.lineTo(52, 46);
  g.lineTo(40, 54);
  g.closePath();
  g.fillPath();

  g.fillStyle(0x1a0a48, 1);
  g.beginPath();
  g.moveTo(17, 46);
  g.lineTo(24, 20);
  g.lineTo(36, 13);
  g.lineTo(46, 18);
  g.lineTo(49, 44);
  g.lineTo(38, 51);
  g.closePath();
  g.fillPath();

  // Nebula wash
  g.fillStyle(0x6a3cff, 0.55);
  g.fillEllipse(34, 32, 18, 28);
  g.fillStyle(0xff8c42, 0.35);
  g.fillEllipse(30, 36, 12, 20);
  g.fillStyle(0x7ec8ff, 0.4);
  g.fillEllipse(38, 28, 10, 16);

  // Center rail
  g.lineStyle(2, 0xe8d0ff, 0.9);
  g.lineBetween(33, 14, 35, 50);
  g.lineStyle(1.2, 0xffe066, 0.8);
  g.lineBetween(31, 16, 33, 48);

  // Nose star
  const stx = 36;
  const sty = 12;
  g.fillStyle(0xffe066);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    g.fillTriangle(
      stx,
      sty,
      stx + Math.cos(a) * 7,
      sty + Math.sin(a) * 7,
      stx + Math.cos(a2) * 2.8,
      sty + Math.sin(a2) * 2.8
    );
  }
  g.fillStyle(0xffffff);
  g.fillCircle(stx, sty, 1.6);

  // Speckles
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(24, 28, 1.2);
  g.fillCircle(42, 34, 1);
  g.fillCircle(28, 42, 1.1);
  g.fillStyle(0xffc070, 0.9);
  g.fillCircle(40, 22, 1.2);
}
