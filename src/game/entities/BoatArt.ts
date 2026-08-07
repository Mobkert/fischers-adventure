import Phaser from "phaser";

const BW = 140;
const BH = 56;
const SH = 88; // sail canvas height (extends above hull)

/** High-detail side-view sailboat + billowing sail frames + motor boats. */
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

  // Speedboat (same canvas as sailboat for consistent physics offsets)
  g.clear();
  drawSpeedboat(g);
  g.generateTexture("speedboat", BW, BH);
  g.clear();
  drawSpeedboat(g);
  g.generateTexture("speedboat_icon", BW, BH);

  // Jet ski — smaller craft centered in same canvas
  g.clear();
  drawJetski(g);
  g.generateTexture("jetski", BW, BH);
  g.clear();
  drawJetski(g);
  g.generateTexture("jetski_icon", BW, BH);

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

/** Medium sport speedboat — sleek hull, windshield, twin outboards. */
function drawSpeedboat(g: Phaser.GameObjects.Graphics): void {
  // Reflection
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(BW / 2, BH - 4, 100, 8);

  // Lower hull
  g.fillStyle(0x1a2840);
  g.beginPath();
  g.moveTo(12, 34);
  g.lineTo(28, 22);
  g.lineTo(118, 22);
  g.lineTo(132, 30);
  g.lineTo(128, 42);
  g.lineTo(20, 42);
  g.closePath();
  g.fillPath();

  // Upper hull / sheer
  g.fillStyle(0x2e5080);
  g.beginPath();
  g.moveTo(24, 32);
  g.lineTo(32, 24);
  g.lineTo(112, 24);
  g.lineTo(124, 31);
  g.lineTo(118, 38);
  g.lineTo(28, 38);
  g.closePath();
  g.fillPath();

  // White stripe
  g.fillStyle(0xf0f4f8, 0.95);
  g.fillRect(30, 30, 88, 3);
  g.fillStyle(0xe85d4a, 0.9);
  g.fillRect(30, 33, 88, 2);

  // Deck
  g.fillStyle(0xd8dde4);
  g.fillRect(40, 24, 58, 6);
  g.fillStyle(0xb0b8c4);
  g.fillRect(42, 25, 54, 2);

  // Windshield
  g.fillStyle(0x7ec8ff, 0.55);
  g.beginPath();
  g.moveTo(52, 24);
  g.lineTo(58, 14);
  g.lineTo(78, 14);
  g.lineTo(84, 24);
  g.closePath();
  g.fillPath();
  g.lineStyle(1.5, 0xe8f4ff, 0.8);
  g.strokePath();
  g.lineStyle(2, 0x4a5568);
  g.lineBetween(52, 24, 58, 14);
  g.lineBetween(84, 24, 78, 14);

  // Seats
  g.fillStyle(0x2a2a30);
  g.fillRoundedRect(56, 28, 14, 5, 1);
  g.fillRoundedRect(74, 28, 14, 5, 1);
  g.fillStyle(0x4a4a55);
  g.fillRect(57, 28, 12, 2);

  // Bow point detail
  g.fillStyle(0xf0f4f8);
  g.fillTriangle(8, 34, 26, 24, 26, 40);
  g.fillStyle(0xc8d0d8);
  g.fillTriangle(12, 34, 26, 28, 26, 38);

  // Cleats / rails
  g.lineStyle(1.5, 0xc0c8d0);
  g.lineBetween(34, 22, 110, 22);
  g.fillStyle(0xa0a8b0);
  g.fillCircle(38, 22, 2);
  g.fillCircle(108, 22, 2);

  // Twin outboard engines at stern
  g.fillStyle(0x1a1a20);
  g.fillRoundedRect(118, 26, 14, 16, 2);
  g.fillRoundedRect(124, 26, 14, 16, 2);
  g.fillStyle(0x3a3a48);
  g.fillRect(120, 28, 10, 4);
  g.fillRect(126, 28, 10, 4);
  g.fillStyle(0x2a4a6e);
  g.fillCircle(125, 38, 3);
  g.fillCircle(131, 38, 3);
  g.fillStyle(0x5a8ab0);
  g.fillCircle(125, 38, 1.5);
  g.fillCircle(131, 38, 1.5);

  // Name plate glint
  g.fillStyle(0xffe066, 0.35);
  g.fillRect(48, 36, 20, 2);
}

/** Compact high-detail jet ski. */
function drawJetski(g: Phaser.GameObjects.Graphics): void {
  const ox = 28;
  const oy = 8;

  // Reflection
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(ox + 42, oy + 42, 70, 7);

  // Lower hull
  g.fillStyle(0x0e1a28);
  g.beginPath();
  g.moveTo(ox + 4, oy + 30);
  g.lineTo(ox + 18, oy + 20);
  g.lineTo(ox + 72, oy + 20);
  g.lineTo(ox + 84, oy + 28);
  g.lineTo(ox + 78, oy + 38);
  g.lineTo(ox + 12, oy + 38);
  g.closePath();
  g.fillPath();

  // Body shell
  g.fillStyle(0xe02040);
  g.beginPath();
  g.moveTo(ox + 14, oy + 28);
  g.lineTo(ox + 22, oy + 18);
  g.lineTo(ox + 58, oy + 16);
  g.lineTo(ox + 70, oy + 22);
  g.lineTo(ox + 68, oy + 32);
  g.lineTo(ox + 18, oy + 32);
  g.closePath();
  g.fillPath();

  // Side scoop
  g.fillStyle(0xa01830);
  g.beginPath();
  g.moveTo(ox + 20, oy + 30);
  g.lineTo(ox + 28, oy + 24);
  g.lineTo(ox + 62, oy + 24);
  g.lineTo(ox + 66, oy + 30);
  g.closePath();
  g.fillPath();

  // White accent stripe
  g.fillStyle(0xffffff, 0.92);
  g.fillRect(ox + 24, oy + 26, 40, 2.5);
  g.fillStyle(0xffe066, 0.85);
  g.fillRect(ox + 24, oy + 28, 40, 1.5);

  // Handlebars
  g.lineStyle(3, 0x2a2a30);
  g.lineBetween(ox + 40, oy + 18, ox + 40, oy + 8);
  g.lineStyle(2.5, 0x4a4a55);
  g.lineBetween(ox + 28, oy + 10, ox + 52, oy + 10);
  g.fillStyle(0x1a1a20);
  g.fillCircle(ox + 28, oy + 10, 3);
  g.fillCircle(ox + 52, oy + 10, 3);
  g.fillStyle(0x3a3a48);
  g.fillCircle(ox + 28, oy + 10, 1.5);
  g.fillCircle(ox + 52, oy + 10, 1.5);

  // Seat
  g.fillStyle(0x1a1a22);
  g.fillRoundedRect(ox + 34, oy + 20, 28, 8, 3);
  g.fillStyle(0x3a3a44);
  g.fillRoundedRect(ox + 36, oy + 20, 24, 3, 1);

  // Nose
  g.fillStyle(0xffffff);
  g.fillTriangle(ox + 2, oy + 30, ox + 18, oy + 20, ox + 18, oy + 36);
  g.fillStyle(0xe02040);
  g.fillTriangle(ox + 6, oy + 30, ox + 18, oy + 24, ox + 18, oy + 34);

  // Intake / jet nozzle at stern
  g.fillStyle(0x2a2a30);
  g.fillRoundedRect(ox + 72, oy + 26, 12, 10, 2);
  g.fillStyle(0x4a90c0);
  g.fillCircle(ox + 80, oy + 34, 3.5);
  g.fillStyle(0x7ec8ff, 0.7);
  g.fillCircle(ox + 80, oy + 34, 1.8);

  // Dashboard glint
  g.fillStyle(0x7ec8ff, 0.4);
  g.fillRect(ox + 38, oy + 14, 8, 3);
}
