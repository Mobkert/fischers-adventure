import Phaser from "phaser";

/** Held Starweaver — indigo blank with a woven star tip. */
export function drawStarweaverRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  g.lineStyle(5, 0x1a2248, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(3, 0x3d5cff, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(1.5, 0xa8c8ff, 0.85);
  g.lineBetween(handX, handY - 1, tipX, tipY - 1);

  const mx = (handX + tipX) / 2;
  const my = (handY + tipY) / 2;
  g.lineStyle(2, 0x6a8cff, 1);
  g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
  g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);

  g.fillStyle(0xc4a574);
  g.fillRect(handX - 3, handY - 2, 8, 8);
  g.fillStyle(0x2a3a88);
  g.fillRect(handX - 3, handY + 5, 8, 3);
  g.fillStyle(0x7a9cff);
  g.fillCircle(handX + 1, handY + 6, 3.5);
  g.fillStyle(0xe8f0ff);
  g.fillCircle(handX + 1, handY + 6, 1.4);

  // Woven star tip
  g.lineStyle(2, 0xe8f0ff, 1);
  g.strokeCircle(tipX, tipY, 3.2);
  g.fillStyle(0x8ab4ff, 0.95);
  g.fillCircle(tipX, tipY, 2.2);
  g.lineStyle(1.4, 0xffffff, 0.95);
  const arms = 4;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2 - Math.PI / 2;
    g.lineBetween(
      tipX + Math.cos(a) * 1.2,
      tipY + Math.sin(a) * 1.2,
      tipX + Math.cos(a) * 6.5,
      tipY + Math.sin(a) * 6.5
    );
  }
  g.fillStyle(0xffffff, 1);
  g.fillCircle(tipX, tipY, 1.1);
}

/** Bag / forge icon for Starweaver Rod. */
export function drawStarweaverRodIcon(g: Phaser.GameObjects.Graphics): void {
  const IPY = 0;
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
  g.lineStyle(5, 0x1a2248);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0x3d5cff);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xa8c8ff, 0.85);
  g.lineBetween(18, 46, 46, 16);
  g.lineStyle(2, 0x6a8cff);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0x2a3a88);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0x7a9cff);
  g.fillRect(18, 40, 5, 6);
  g.lineStyle(2, 0xe8f0ff);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xffffff);
  g.fillCircle(50, 12, 1.2);
  // Star tip
  const sx = 56;
  const sy = 7 + IPY;
  g.fillStyle(0x8ab4ff, 0.95);
  g.fillCircle(sx, sy, 3.2);
  g.lineStyle(1.5, 0xffffff, 1);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    g.lineBetween(
      sx + Math.cos(a) * 1,
      sy + Math.sin(a) * 1,
      sx + Math.cos(a) * 8,
      sy + Math.sin(a) * 8
    );
  }
  g.fillStyle(0xffffff, 1);
  g.fillCircle(sx, sy, 1.4);
}
