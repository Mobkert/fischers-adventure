import Phaser from "phaser";

const BW = 140;
const BH = 56;
const SH = 88; // sail canvas height (extends above hull)

/** High-detail side-view sailboat + billowing sail frames. */
export function generateBoatArt(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  drawSailboatHull(g);
  g.generateTexture("sailboat", BW, BH);

  g.clear();
  drawSailboatHull(g);
  // Compact sail for menu icon (fits in hull frame)
  drawSailIcon(g);
  g.generateTexture("sailboat_icon", BW, BH);

  // Sail billow amounts (0 = slack, 1 = full wind)
  const billows = [0.15, 0.35, 0.55, 0.75, 0.9, 0.7, 0.45, 0.25];
  billows.forEach((b, i) => {
    g.clear();
    drawSail(g, b, 0, 0);
    g.generateTexture(`sailboat_sail_${i}`, BW, SH);
  });

  g.destroy();

  if (!scene.anims.exists("sail-idle")) {
    scene.anims.create({
      key: "sail-idle",
      frames: [0, 1, 2, 1].map((i) => ({ key: `sailboat_sail_${i}` })),
      frameRate: 4,
      repeat: -1,
    });
  }
  if (!scene.anims.exists("sail-run")) {
    scene.anims.create({
      key: "sail-run",
      frames: [3, 4, 5, 4, 3, 5].map((i) => ({ key: `sailboat_sail_${i}` })),
      frameRate: 8,
      repeat: -1,
    });
  }
}

function drawSailboatHull(g: Phaser.GameObjects.Graphics): void {
  // reflection
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(BW / 2, BH - 5, 108, 9);

  // Hull outer
  g.fillStyle(0x3e2a1a);
  g.beginPath();
  g.moveTo(10, 30);
  g.lineTo(30, 20);
  g.lineTo(108, 20);
  g.lineTo(132, 32);
  g.lineTo(118, 44);
  g.lineTo(22, 44);
  g.closePath();
  g.fillPath();

  // Hull inner
  g.fillStyle(0x6b4423);
  g.beginPath();
  g.moveTo(24, 32);
  g.lineTo(34, 24);
  g.lineTo(104, 24);
  g.lineTo(120, 33);
  g.lineTo(110, 40);
  g.lineTo(30, 40);
  g.closePath();
  g.fillPath();

  // Planks
  g.lineStyle(1, 0x2c1a0e, 0.5);
  g.lineBetween(26, 28, 116, 28);
  g.lineBetween(24, 34, 118, 34);
  g.lineBetween(26, 38, 114, 38);

  // Gunwale
  g.lineStyle(3, 0x2a1810, 1);
  g.lineBetween(30, 20, 108, 20);
  g.lineStyle(2, 0x8b5a2b, 0.85);
  g.lineBetween(30, 19, 108, 19);

  // Bow / stern
  g.fillStyle(0x2c1a0e);
  g.fillTriangle(6, 32, 24, 22, 24, 42);
  g.fillStyle(0x5c3a21);
  g.fillTriangle(10, 32, 24, 26, 24, 38);

  // Cabin / cockpit coaming
  g.fillStyle(0x5a3d24);
  g.fillRect(52, 22, 36, 6);
  g.fillStyle(0x8b6914);
  g.fillRect(54, 22, 32, 3);

  // Seat
  g.fillStyle(0xa67c2d);
  g.fillRect(60, 28, 22, 4);

  // Paint stripe
  g.fillStyle(0xc4a06a, 0.9);
  g.fillRect(32, 30, 78, 2);
  g.fillStyle(0x2c4a6e, 0.85);
  g.fillRect(32, 32, 78, 2);

  // Mast stump on deck (sail mast foot seats here)
  g.fillStyle(0x2c1a0e);
  g.fillRect(66, 16, 7, 10);
  g.fillStyle(0x5c3a21);
  g.fillRect(67, 16, 5, 8);
  g.fillStyle(0x8b6914);
  g.fillRect(68, 16, 3, 4);

  // Cleat
  g.fillStyle(0x888888);
  g.fillRect(40, 21, 6, 3);
  g.fillRect(98, 21, 6, 3);
}

/**
 * Sail + mast drawn in a taller canvas. billow 0..1.
 * Mast sits above the hull mast-step (centered ~x69).
 */
function drawSail(
  g: Phaser.GameObjects.Graphics,
  billow: number,
  ox: number,
  oy: number
): void {
  const mastX = ox + 69;
  const mastTop = oy + 4;
  // Mast foot at the bottom edge so the sprite origin (0.5, 1) sits on the deck
  const mastBot = oy + SH - 1;
  const boomY = oy + SH - 16;

  // Mast
  g.lineStyle(4, 0x3e2918, 1);
  g.lineBetween(mastX, mastTop, mastX, mastBot);
  g.lineStyle(2, 0x8b6914, 0.9);
  g.lineBetween(mastX - 1, mastTop, mastX - 1, mastBot);

  // Mast cap
  g.fillStyle(0x2c1a0e);
  g.fillRect(mastX - 3, mastTop - 2, 6, 4);

  // Spreaders
  g.lineStyle(1.5, 0x5c3a21, 0.8);
  g.lineBetween(mastX - 10, oy + 28, mastX + 10, oy + 28);

  // Boom
  g.lineStyle(3, 0x3e2918, 1);
  g.lineBetween(mastX, boomY, mastX + 48, boomY);
  g.lineStyle(1.5, 0x6b4423, 0.9);
  g.lineBetween(mastX, boomY - 1, mastX + 48, boomY - 1);

  // Sail cloth — triangle with curved belly (billow)
  const headX = mastX;
  const headY = mastTop + 6;
  const clewX = mastX + 46;
  const clewY = boomY;
  const tackX = mastX + 2;
  const tackY = boomY;

  // Control point pushes sail out to the right with wind
  const belly = 10 + billow * 28;
  const midX = mastX + 18 + belly * 0.35;
  const midY = oy + 38 - billow * 4;

  g.fillStyle(0xf5f0e6, 0.92);
  g.beginPath();
  g.moveTo(headX, headY);
  g.lineTo(clewX, clewY);
  g.lineTo(tackX, tackY);
  g.closePath();
  g.fillPath();

  // Billow overlay (curved panel)
  g.fillStyle(0xffffff, 0.2 + billow * 0.25);
  g.beginPath();
  g.moveTo(headX + 2, headY + 4);
  g.lineTo(midX, midY);
  g.lineTo(clewX - 4, clewY - 2);
  g.lineTo(tackX + 4, tackY - 2);
  g.closePath();
  g.fillPath();

  // Seam lines
  g.lineStyle(1, 0xd4c4a8, 0.65);
  g.lineBetween(headX + 1, headY + 8, tackX + 6, tackY - 2);
  g.lineBetween(
    headX + 2,
    headY + 8 + (boomY - headY) * 0.35,
    mastX + 20 + belly * 0.25,
    boomY - 4
  );
  g.lineBetween(
    headX + 2,
    headY + 8 + (boomY - headY) * 0.65,
    mastX + 32 + belly * 0.15,
    boomY - 2
  );

  // Luff along mast
  g.lineStyle(1.5, 0xc4b49a, 0.8);
  g.lineBetween(headX, headY, tackX, tackY);

  // Telltales (flutter with billow)
  const flutter = billow * 6;
  g.lineStyle(1, 0xe85d75, 0.85);
  g.lineBetween(mastX + 8, oy + 30, mastX + 14 + flutter, oy + 32);
  g.lineBetween(mastX + 8, oy + 42, mastX + 16 + flutter * 0.8, oy + 45);

  // Forestay / backstay hints
  g.lineStyle(1, 0x888888, 0.55);
  g.lineBetween(mastX, mastTop, ox + 18, oy + SH - 12);
  g.lineBetween(mastX, mastTop, ox + 120, oy + SH - 14);

  // Flag at masthead
  const flagWave = 4 + billow * 8;
  g.fillStyle(0xc0392b, 0.95);
  g.beginPath();
  g.moveTo(mastX + 2, mastTop + 2);
  g.lineTo(mastX + 2 + flagWave, mastTop + 5);
  g.lineTo(mastX + 2, mastTop + 8);
  g.closePath();
  g.fillPath();
}

/** Small sail drawn into the hull-sized icon texture. */
function drawSailIcon(g: Phaser.GameObjects.Graphics): void {
  const mastX = 69;
  g.lineStyle(3, 0x3e2918, 1);
  g.lineBetween(mastX, 2, mastX, 22);
  g.fillStyle(0xf5f0e6, 0.9);
  g.beginPath();
  g.moveTo(mastX, 4);
  g.lineTo(mastX + 28, 20);
  g.lineTo(mastX + 2, 20);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xc0392b);
  g.fillTriangle(mastX + 1, 2, mastX + 8, 4, mastX + 1, 6);
}
