import Phaser from "phaser";

/** Inventory icon diagonal — matches other BootScene rods. */
export const SKIN_ICON_HAND = { x: 14, y: 50 };
export const SKIN_ICON_TIP = { x: 50, y: 14 };

function lerp(
  handX: number,
  handY: number,
  tipX: number,
  tipY: number,
  t: number
): { x: number; y: number } {
  return {
    x: Phaser.Math.Linear(handX, tipX, t),
    y: Phaser.Math.Linear(handY, tipY, t),
  };
}

function fillRotRect(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  ang: number,
  color: number,
  alpha = 1
): void {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const hw = w / 2;
  const hh = h / 2;
  const pts = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));
  g.fillStyle(color, alpha);
  g.fillPoints(pts, true);
}

function shaft(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number,
  outer: number,
  mid: number,
  highlight: number
): void {
  g.lineStyle(6, outer, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(4, mid, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(1.6, highlight, 0.85);
  g.lineBetween(handX, handY - 1.2, tipX, tipY - 1.2);
}

function corkGrip(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  butt: number,
  cork: number,
  rings: number
): void {
  g.fillStyle(cork);
  g.fillRoundedRect(handX - 4, handY - 3, 10, 11, 2);
  g.fillStyle(rings, 0.55);
  g.fillRect(handX - 3, handY - 1, 8, 1);
  g.fillRect(handX - 3, handY + 2, 8, 1);
  g.fillRect(handX - 3, handY + 5, 8, 1);
  g.fillStyle(butt);
  g.fillRect(handX - 4, handY + 7, 10, 3);
}

function reelSeat(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  outer: number,
  inner: number
): void {
  g.fillStyle(outer);
  g.fillCircle(handX + 1, handY + 7, 4);
  g.fillStyle(inner);
  g.fillCircle(handX + 1, handY + 7, 2);
  g.lineStyle(1, 0xffffff, 0.35);
  g.strokeCircle(handX + 1, handY + 7, 4);
}

/** Golden Lucky — heavy gold blank, green thread, ornate clover. */
export function drawGoldenLuckyRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  shaft(g, handX, handY, tipX, tipY, 0x8b6914, 0xe8c547, 0xfff3c4);

  // Gold wire wraps
  for (const t of [0.22, 0.38, 0.52, 0.66, 0.8]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    g.lineStyle(2.2, t % 0.3 < 0.15 ? 0x3d8b4f : 0xffd700, 1);
    g.lineBetween(
      p.x + px * 3.5,
      p.y + py * 3.5,
      p.x - px * 3.5,
      p.y - py * 3.5
    );
  }

  corkGrip(g, handX, handY, 0xb8962e, 0xe8c547, 0xd4af37);
  reelSeat(g, handX, handY, 0xd4af37, 0xffe066);

  // Filigree near tip
  const near = lerp(handX, handY, tipX, tipY, 0.88);
  g.lineStyle(1.4, 0xfff1a8, 0.9);
  g.strokeCircle(near.x, near.y, 2.2);

  g.lineStyle(2.4, 0xffe066);
  g.strokeCircle(tipX, tipY, 3.4);
  g.fillStyle(0xfff8d0);
  g.fillCircle(tipX, tipY, 1.4);

  // Layered clover
  const cx = tipX + 5.5;
  const cy = tipY - 4.5;
  g.fillStyle(0x1a5c28, 0.9);
  g.fillCircle(cx - 2.6, cy, 2.8);
  g.fillCircle(cx + 2.6, cy, 2.8);
  g.fillCircle(cx, cy - 2.6, 2.8);
  g.fillCircle(cx, cy + 2.6, 2.8);
  g.fillStyle(0x2d8a3e);
  g.fillCircle(cx - 2.2, cy - 0.3, 2.1);
  g.fillCircle(cx + 2.2, cy - 0.3, 2.1);
  g.fillCircle(cx, cy - 2.2, 2.1);
  g.fillCircle(cx, cy + 2.2, 2.1);
  g.fillStyle(0x58b368);
  g.fillCircle(cx - 1.4, cy - 0.6, 1.1);
  g.fillCircle(cx + 1.4, cy - 0.6, 1.1);
  g.fillStyle(0xffd700);
  g.fillCircle(cx, cy, 1.35);
  g.fillStyle(0xfff8d0);
  g.fillCircle(cx - 0.4, cy - 0.4, 0.5);
  g.lineStyle(1.2, 0x1a5c28);
  g.lineBetween(cx, cy + 2.2, cx + 1.2, cy + 6);
}

/** Universal Portal — nebula shaft + cosmos orb (not a void portal). */
export function drawUniversalPortalRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  shaft(g, handX, handY, tipX, tipY, 0x05030c, 0x1a1040, 0x3b82f6);

  // Nebula bands
  const bands: Array<{ t: number; c: number }> = [
    { t: 0.2, c: 0x3b82f6 },
    { t: 0.35, c: 0xf97316 },
    { t: 0.5, c: 0xec4899 },
    { t: 0.65, c: 0x3b82f6 },
    { t: 0.8, c: 0xf97316 },
  ];
  for (const b of bands) {
    const p = lerp(handX, handY, tipX, tipY, b.t);
    g.lineStyle(2.4, b.c, 0.95);
    g.lineBetween(
      p.x + px * 4,
      p.y + py * 4,
      p.x - px * 4,
      p.y - py * 4
    );
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(p.x + px * 2.2, p.y + py * 2.2, 0.7);
  }

  corkGrip(g, handX, handY, 0x312e81, 0x0f0a1a, 0x1e1b4b);
  reelSeat(g, handX, handY, 0x6366f1, 0xf9a8d4);

  // Universe orb
  const ox = tipX + 2;
  const oy = tipY - 1;
  g.fillStyle(0x3b82f6, 0.25);
  g.fillCircle(ox, oy, 10);
  g.fillStyle(0x0b1026, 1);
  g.fillCircle(ox, oy, 7.2);
  g.fillStyle(0x1e3a8a, 0.85);
  g.fillCircle(ox - 1.5, oy - 0.8, 5);
  g.fillStyle(0xf97316, 0.55);
  g.fillCircle(ox + 2, oy + 1.5, 3.8);
  g.fillStyle(0xec4899, 0.5);
  g.fillCircle(ox - 0.5, oy + 2.2, 3.2);
  g.fillStyle(0x60a5fa, 0.7);
  g.fillCircle(ox + 1.5, oy - 2.5, 2.4);
  // Stars
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(ox - 3.2, oy - 2.4, 0.7);
  g.fillCircle(ox + 3.5, oy + 0.5, 0.55);
  g.fillCircle(ox - 1, oy + 3.5, 0.45);
  g.fillCircle(ox + 2.2, oy - 3.8, 0.5);
  g.fillStyle(0xfde68a, 0.9);
  g.fillCircle(ox + 0.5, oy - 0.2, 0.9);
  g.lineStyle(1.6, 0xe0e7ff, 0.85);
  g.strokeCircle(ox, oy, 7.2);
  g.lineStyle(1, 0xf9a8d4, 0.6);
  g.beginPath();
  g.arc(ox, oy, 5.5, -0.6, 1.4, false);
  g.strokePath();
}

/** Pufferfirm — stretched pufferfish silhouette (matches player pufferfish art). */
export function drawPufferfirmRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const dx = tipX - handX;
  const dy = tipY - handY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const half = 5;

  g.fillStyle(0xf0d020, 1);
  g.fillTriangle(
    handX + nx * half,
    handY + ny * half,
    handX - nx * half,
    handY - ny * half,
    tipX - nx * (half * 0.6),
    tipY - ny * (half * 0.6)
  );
  g.fillTriangle(
    handX + nx * half,
    handY + ny * half,
    tipX + nx * (half * 0.6),
    tipY + ny * (half * 0.6),
    tipX - nx * (half * 0.6),
    tipY - ny * (half * 0.6)
  );
  g.fillStyle(0xd4a820, 1);
  g.fillTriangle(
    handX - nx * 2,
    handY - ny * 2,
    handX - dx * 0.12 - nx * 6,
    handY - dy * 0.12 - ny * 6,
    handX - dx * 0.12 + nx * 2,
    handY - dy * 0.12 + ny * 2
  );
  g.fillStyle(0x111111, 1);
  g.fillCircle(tipX - dx * 0.12, tipY - dy * 0.12, 1.8);
  g.fillStyle(0x2c2c2c);
  g.fillRect(handX - 3, handY - 2, 8, 8);
}

/** Poisoned Crystal — toxic blank, drip crystals, vine wraps. */
export function drawPoisonedRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  shaft(g, handX, handY, tipX, tipY, 0x0d2818, 0x2d6a3e, 0x7cfc00);

  // Vine wraps
  for (const t of [0.18, 0.34, 0.5, 0.66, 0.82]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    g.lineStyle(2, 0x1a4a22, 1);
    g.lineBetween(
      p.x + px * 4,
      p.y + py * 4,
      p.x - px * 3.5,
      p.y - py * 3.5
    );
    g.fillStyle(0x3d8b4f, 0.95);
    g.fillEllipse(p.x + px * 3.5, p.y + py * 3.5, 5, 2.4);
    g.fillStyle(0x228b22, 0.9);
    g.fillEllipse(p.x - px * 2.5, p.y - py * 2.5, 4, 2);
  }

  corkGrip(g, handX, handY, 0x145214, 0x1a3020, 0x2d5a2d);
  reelSeat(g, handX, handY, 0x39ff14, 0x98fb98);

  // Crystal clusters
  const crystals: Array<{ t: number; s: number }> = [
    { t: 0.42, s: 1 },
    { t: 0.62, s: 0.85 },
    { t: 0.78, s: 1.15 },
  ];
  for (const c of crystals) {
    const p = lerp(handX, handY, tipX, tipY, c.t);
    const s = c.s;
    g.fillStyle(0x145214, 0.95);
    g.fillTriangle(
      p.x - 2 * s,
      p.y + 3 * s,
      p.x,
      p.y - 9 * s,
      p.x + 3 * s,
      p.y + 2 * s
    );
    g.fillStyle(0x39ff14, 0.9);
    g.fillTriangle(
      p.x - 1 * s,
      p.y + 1.5 * s,
      p.x + 0.5 * s,
      p.y - 6 * s,
      p.x + 2.2 * s,
      p.y + 1 * s
    );
    g.fillStyle(0x98fb98, 0.85);
    g.fillCircle(p.x + 0.4 * s, p.y - 3 * s, 0.9 * s);
  }

  // Toxic drip
  const drip = lerp(handX, handY, tipX, tipY, 0.7);
  g.fillStyle(0x39ff14, 0.9);
  g.fillCircle(drip.x + px * 2, drip.y + py * 2 + 3, 1.4);
  g.fillCircle(drip.x + px * 1.5, drip.y + py * 1.5 + 6, 1);
  g.fillCircle(drip.x + px, drip.y + py + 9, 0.7);

  g.fillStyle(0x39ff14, 0.55);
  g.fillCircle(tipX, tipY, 5);
  g.fillStyle(0x7cfc00, 0.9);
  g.fillCircle(tipX, tipY, 3);
  g.fillStyle(0xdeffb0);
  g.fillCircle(tipX - 0.5, tipY - 0.8, 1.2);
}

/** Pistol — compact high-detail sidearm along the cast line. */
export function drawPistolRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);
  const muzzle = lerp(handX, handY, tipX, tipY, 0.72);
  const slide = lerp(handX, handY, tipX, tipY, 0.42);
  const grip = lerp(handX, handY, tipX, tipY, 0.12);
  const trigger = lerp(handX, handY, tipX, tipY, 0.28);

  // Slide body
  fillRotRect(g, slide.x, slide.y, 22, 8, ang, 0x2a2a32);
  fillRotRect(g, slide.x, slide.y - 0.8, 20, 2.5, ang, 0x4a4a55);
  fillRotRect(g, slide.x + Math.cos(ang) * 2, slide.y + Math.sin(ang) * 2, 14, 1.2, ang, 0x6a6a78);

  // Serrations
  for (let i = 0; i < 5; i++) {
    const p = lerp(handX, handY, tipX, tipY, 0.32 + i * 0.035);
    g.lineStyle(1, 0x1a1a22, 0.9);
    g.lineBetween(
      p.x + px * 3.2,
      p.y + py * 3.2,
      p.x - px * 3.2,
      p.y - py * 3.2
    );
  }

  // Barrel / muzzle
  fillRotRect(g, muzzle.x, muzzle.y, 10, 5, ang, 0x1a1a20);
  fillRotRect(g, muzzle.x, muzzle.y, 8, 2.5, ang, 0x3a3a44);
  g.fillStyle(0x0a0a0e);
  g.fillCircle(muzzle.x + Math.cos(ang) * 4, muzzle.y + Math.sin(ang) * 4, 1.6);
  g.lineStyle(1, 0x808890, 0.7);
  g.strokeCircle(muzzle.x + Math.cos(ang) * 4, muzzle.y + Math.sin(ang) * 4, 1.8);

  // Grip
  fillRotRect(g, grip.x + px * 2, grip.y + py * 2, 7, 14, ang + 0.15, 0x3a2a1a);
  fillRotRect(g, grip.x + px * 2, grip.y + py * 2, 5, 12, ang + 0.15, 0x5a4030);
  for (let i = 0; i < 4; i++) {
    const gy = grip.y + py * 2 + Math.sin(ang + 0.15) * (i * 2.6 - 4);
    const gx = grip.x + px * 2 + Math.cos(ang + 0.15) * (i * 2.6 - 4);
    g.fillStyle(0x2a1a10, 0.7);
    fillRotRect(g, gx, gy, 4.5, 1.1, ang + 0.15, 0x2a1a10);
  }

  // Trigger guard + trigger
  g.lineStyle(1.8, 0x555560);
  g.strokeCircle(trigger.x - px * 1.5, trigger.y - py * 1.5 + 2, 3.4);
  g.fillStyle(0x222228);
  g.fillTriangle(
    trigger.x - px,
    trigger.y - py + 1,
    trigger.x + Math.cos(ang) * 3,
    trigger.y + Math.sin(ang) * 3 + 2,
    trigger.x - px * 0.5,
    trigger.y - py * 0.5 + 4
  );

  // Sights
  const rear = lerp(handX, handY, tipX, tipY, 0.22);
  const front = lerp(handX, handY, tipX, tipY, 0.62);
  g.fillStyle(0xc0c0c8);
  fillRotRect(g, rear.x - px * 3.5, rear.y - py * 3.5, 3, 2.5, ang, 0xc0c0c8);
  fillRotRect(g, front.x - px * 3.2, front.y - py * 3.2, 2, 2.5, ang, 0xe8e8f0);
  g.fillStyle(0xff6644);
  g.fillCircle(front.x - px * 3.2, front.y - py * 3.2, 0.7);
}

/** Laser Zeus — pink/purple energy blank with tip core + sparkles. */
export function drawLaserRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  // Soft aura along shaft
  g.lineStyle(9, 0xec4899, 0.18);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(7, 0xa855f7, 0.22);
  g.lineBetween(handX, handY, tipX, tipY);

  shaft(g, handX, handY, tipX, tipY, 0x1a0a28, 0x7c3aed, 0xf472b6);

  // Energy wraps + nodes
  for (const t of [0.2, 0.36, 0.52, 0.68, 0.84]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    const c = t < 0.5 ? 0xd946ef : 0xf472b6;
    g.lineStyle(2.2, c, 0.95);
    g.lineBetween(
      p.x + px * 4,
      p.y + py * 4,
      p.x - px * 4,
      p.y - py * 4
    );
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(p.x, p.y, 1.1);
    g.fillStyle(c, 0.85);
    g.fillCircle(p.x + px * 3.5, p.y + py * 3.5, 1.4);
  }

  corkGrip(g, handX, handY, 0x4a044e, 0x1a0a28, 0x701a75);
  reelSeat(g, handX, handY, 0xd946ef, 0xf9a8d4);

  // Tip core
  g.fillStyle(0xec4899, 0.35);
  g.fillCircle(tipX, tipY, 9);
  g.fillStyle(0xa855f7, 0.5);
  g.fillCircle(tipX, tipY, 6.5);
  g.fillStyle(0xf472b6, 0.75);
  g.fillCircle(tipX, tipY, 4);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(tipX, tipY, 1.8);
  g.lineStyle(1.5, 0xfce7f3, 0.9);
  g.strokeCircle(tipX, tipY, 6.5);

  // Orbit sparkles
  const sparks = [
    { dx: -6, dy: -5, r: 1.2, c: 0xf9a8d4 },
    { dx: 6, dy: -3, r: 0.9, c: 0xffffff },
    { dx: 5, dy: 5, r: 1.1, c: 0xd8b4fe },
    { dx: -5, dy: 4, r: 0.8, c: 0xf472b6 },
    { dx: 0, dy: -8, r: 0.7, c: 0xffffff },
  ];
  for (const s of sparks) {
    g.fillStyle(s.c, 0.95);
    g.fillCircle(tipX + s.dx, tipY + s.dy, s.r);
  }
}

/** Frigid — Amber blank sheathed in pale ice, hanging icicles, tip crystals. */
export function drawFrigidRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  shaft(g, handX, handY, tipX, tipY, 0x4a7a9a, 0xa8d8f0, 0xe8f8ff);

  // Frost wraps
  for (const t of [0.2, 0.36, 0.52, 0.68, 0.84]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    g.lineStyle(2.1, t < 0.5 ? 0x7ec8e8 : 0xc8ecff, 0.95);
    g.lineBetween(
      p.x + px * 3.6,
      p.y + py * 3.6,
      p.x - px * 3.6,
      p.y - py * 3.6
    );
  }

  // Hanging icicles along blank
  for (const t of [0.28, 0.44, 0.6, 0.74]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    const len = 4 + (t * 4) % 3;
    g.fillStyle(0xb8e4f8, 0.85);
    g.fillTriangle(
      p.x + px * 2.2 - 1.2,
      p.y + py * 2.2,
      p.x + px * 2.2 + 1.2,
      p.y + py * 2.2,
      p.x + px * 2.2,
      p.y + py * 2.2 + len
    );
    g.fillStyle(0xffffff, 0.55);
    g.fillTriangle(
      p.x + px * 2.2 - 0.5,
      p.y + py * 2.2 + 0.4,
      p.x + px * 2.2 + 0.4,
      p.y + py * 2.2 + 0.4,
      p.x + px * 2.2,
      p.y + py * 2.2 + len * 0.7
    );
  }

  corkGrip(g, handX, handY, 0x6a9ab8, 0xc8e0f0, 0x8ab8d0);
  reelSeat(g, handX, handY, 0x9ad0e8, 0xe8f8ff);

  // Ice crystal clusters near tip
  const crystals: Array<{ t: number; s: number }> = [
    { t: 0.82, s: 0.9 },
    { t: 0.9, s: 1.15 },
  ];
  for (const c of crystals) {
    const p = lerp(handX, handY, tipX, tipY, c.t);
    const s = c.s;
    g.fillStyle(0x7eb8d8, 0.9);
    g.fillTriangle(
      p.x - 2.2 * s,
      p.y + 2 * s,
      p.x,
      p.y - 7 * s,
      p.x + 2.4 * s,
      p.y + 1.6 * s
    );
    g.fillStyle(0xd0f0ff, 0.9);
    g.fillTriangle(
      p.x - 1 * s,
      p.y + 0.8 * s,
      p.x + 0.3 * s,
      p.y - 5 * s,
      p.x + 1.6 * s,
      p.y + 0.6 * s
    );
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(p.x + 0.2 * s, p.y - 2.5 * s, 0.7 * s);
  }

  g.lineStyle(2.2, 0xc8ecff);
  g.strokeCircle(tipX, tipY, 3.2);
  g.fillStyle(0xe8f8ff);
  g.fillCircle(tipX, tipY, 1.4);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(tipX - 0.5, tipY - 0.6, 0.6);
}

/** Frozen Lotus — cool shaft with a white/pale-blue lotus bloom tip. */
export function drawFrozenLotusRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  shaft(g, handX, handY, tipX, tipY, 0x3a6a88, 0x7ab8d8, 0xd0ecff);

  // Cool thread wraps
  for (const t of [0.22, 0.4, 0.58, 0.76]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    g.lineStyle(2, t % 0.3 < 0.15 ? 0xa8d8f0 : 0xe0f4ff, 0.95);
    g.lineBetween(
      p.x + px * 3.5,
      p.y + py * 3.5,
      p.x - px * 3.5,
      p.y - py * 3.5
    );
  }

  corkGrip(g, handX, handY, 0x5a88a8, 0xb8d8e8, 0x88b0c8);
  reelSeat(g, handX, handY, 0x9ad0e8, 0xf0faff);

  // Stem near tip
  const stem = lerp(handX, handY, tipX, tipY, 0.88);
  g.lineStyle(1.6, 0x8ac0d8, 0.9);
  g.lineBetween(stem.x, stem.y, tipX + 4, tipY - 3.5);

  // Lotus bloom — layered petals
  const cx = tipX + 5;
  const cy = tipY - 4;
  const petalColors = [0x8ab8d0, 0xb8dcf0, 0xe0f4ff, 0xffffff];
  for (let layer = 0; layer < 3; layer++) {
    const r = 5.2 - layer * 1.2;
    const pr = 2.8 - layer * 0.45;
    g.fillStyle(petalColors[layer], 0.92);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + layer * 0.2;
      g.fillEllipse(
        cx + Math.cos(a) * r * 0.55,
        cy + Math.sin(a) * r * 0.55,
        pr * 1.4,
        pr
      );
    }
  }
  g.fillStyle(0xc8e8f8, 0.95);
  g.fillCircle(cx, cy, 2.4);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx, cy, 1.3);
  g.fillStyle(0xa8d8f0, 0.8);
  g.fillCircle(cx - 0.3, cy - 0.3, 0.55);

  // Frost dust around bloom
  g.fillStyle(0xffffff, 0.75);
  g.fillCircle(cx - 5, cy - 3, 0.7);
  g.fillCircle(cx + 5.5, cy + 1, 0.55);
  g.fillCircle(cx + 2, cy - 6, 0.5);
}

/** Icicle — long translucent spiky taper with facets and a sharp tip. */
export function drawIcicleRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const dx = tipX - handX;
  const dy = tipY - handY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const half = 5.5;

  // Soft outer glow
  g.fillStyle(0xa8d8f0, 0.22);
  g.fillTriangle(
    handX + nx * (half + 1.5),
    handY + ny * (half + 1.5),
    handX - nx * (half + 1.5),
    handY - ny * (half + 1.5),
    tipX,
    tipY
  );

  // Main translucent body
  g.fillStyle(0x7ab8d8, 0.72);
  g.fillTriangle(
    handX + nx * half,
    handY + ny * half,
    handX - nx * half,
    handY - ny * half,
    tipX,
    tipY
  );
  g.fillStyle(0xc8ecff, 0.78);
  g.fillTriangle(
    handX + nx * (half * 0.55),
    handY + ny * (half * 0.55),
    handX - nx * (half * 0.25),
    handY - ny * (half * 0.25),
    tipX - dx * 0.08,
    tipY - dy * 0.08
  );

  // Facet ridges
  for (const t of [0.2, 0.38, 0.55, 0.72]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    const w = half * (1 - t * 0.75);
    g.lineStyle(1.2, 0xffffff, 0.55);
    g.lineBetween(
      p.x + nx * w * 0.85,
      p.y + ny * w * 0.85,
      p.x - nx * w * 0.35,
      p.y - ny * w * 0.35
    );
  }

  // Side spikes
  for (const t of [0.3, 0.5, 0.68]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    const w = half * (1 - t * 0.7);
    g.fillStyle(0xb0e0f8, 0.85);
    g.fillTriangle(
      p.x + nx * w,
      p.y + ny * w,
      p.x + nx * (w + 3.5),
      p.y + ny * (w + 3.5) + dy * 0.04,
      p.x + nx * w * 0.4 + dx * 0.04,
      p.y + ny * w * 0.4 + dy * 0.04
    );
  }

  // Grip butt
  g.fillStyle(0x5a7888, 0.95);
  g.fillRect(handX - 3.5, handY - 2, 9, 9);
  g.fillStyle(0x90b8c8, 0.9);
  g.fillRect(handX - 2.5, handY, 7, 2);
  g.fillStyle(0xd0ecff, 0.85);
  g.fillRect(handX - 3.5, handY + 6, 9, 2);

  // Sharp tip highlight
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(tipX, tipY, 1.1);
  g.fillStyle(0xe8f8ff, 0.8);
  g.fillTriangle(
    tipX - nx * 1.2,
    tipY - ny * 1.2,
    tipX + nx * 1.2,
    tipY + ny * 1.2,
    tipX + dx * 0.06,
    tipY + dy * 0.06
  );
}

/** Halo of Ice — coral-branch shaft ending in an ice ring with swirling sparkles. */
export function drawHaloOfIceRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  shaft(g, handX, handY, tipX, tipY, 0x2a5a6a, 0x5ea8b8, 0xb8e8f0);

  // Coral-like ice branches along shaft
  const branches: Array<{ t: number; side: number; len: number }> = [
    { t: 0.22, side: 1, len: 5 },
    { t: 0.38, side: -1, len: 4.2 },
    { t: 0.52, side: 1, len: 5.5 },
    { t: 0.66, side: -1, len: 4.8 },
    { t: 0.8, side: 1, len: 3.8 },
  ];
  for (const b of branches) {
    const p = lerp(handX, handY, tipX, tipY, b.t);
    const ex = p.x + px * b.side * b.len;
    const ey = p.y + py * b.side * b.len;
    g.lineStyle(2.4, 0x7ec8d8, 0.95);
    g.lineBetween(p.x, p.y, ex, ey);
    g.fillStyle(0xc8ecff, 0.9);
    g.fillCircle(ex, ey, 1.6);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(ex - 0.3, ey - 0.3, 0.6);
    // Tiny fork
    g.lineStyle(1.4, 0xa8dce8, 0.85);
    g.lineBetween(
      ex,
      ey,
      ex + px * b.side * 2.2 + Math.cos(ang) * 1.5,
      ey + py * b.side * 2.2 + Math.sin(ang) * 1.5
    );
  }

  corkGrip(g, handX, handY, 0x4a7888, 0x88b8c8, 0x6a98a8);
  reelSeat(g, handX, handY, 0x7ec8d8, 0xe0f8ff);

  // Ice halo / ring at tip
  const hx = tipX + 1;
  const hy = tipY - 1;
  g.fillStyle(0xa8d8f0, 0.2);
  g.fillCircle(hx, hy, 10);
  g.lineStyle(3.2, 0x6ab0c8, 0.95);
  g.strokeCircle(hx, hy, 7.5);
  g.lineStyle(2, 0xd0f0ff, 0.9);
  g.strokeCircle(hx, hy, 7.5);
  g.lineStyle(1.2, 0xffffff, 0.75);
  g.strokeCircle(hx, hy, 6.2);

  // Crystal nubs on ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = hx + Math.cos(a) * 7.5;
    const ry = hy + Math.sin(a) * 7.5;
    g.fillStyle(0xc8ecff, 0.95);
    g.fillCircle(rx, ry, 1.5);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(rx - 0.3, ry - 0.3, 0.55);
  }

  // Swirling icy sparkles inside ring
  const swirl = [
    { a: 0.3, r: 3.2, s: 1.1, c: 0xffffff },
    { a: 1.4, r: 4.5, s: 0.85, c: 0xd0f0ff },
    { a: 2.6, r: 2.8, s: 1.0, c: 0xa8e0f8 },
    { a: 3.8, r: 4.0, s: 0.7, c: 0xffffff },
    { a: 5.0, r: 3.5, s: 0.95, c: 0xe0f8ff },
    { a: 5.8, r: 2.2, s: 0.6, c: 0xffffff },
  ];
  g.lineStyle(1.2, 0xc8ecff, 0.55);
  g.beginPath();
  g.arc(hx, hy, 4, -0.4, 2.8, false);
  g.strokePath();
  g.lineStyle(1, 0xffffff, 0.4);
  g.beginPath();
  g.arc(hx, hy, 2.8, 1.2, 4.2, false);
  g.strokePath();
  for (const s of swirl) {
    g.fillStyle(s.c, 0.95);
    g.fillCircle(hx + Math.cos(s.a) * s.r, hy + Math.sin(s.a) * s.r, s.s);
  }
  g.fillStyle(0xe8f8ff, 0.9);
  g.fillCircle(hx, hy, 1.4);
}

/** Hyperboreal — icy Starweaver: indigo-ice shaft, woven frost star, crystal ridges. */
export function drawHyperborealRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  // Soft polar aura
  g.lineStyle(10, 0x4a6aff, 0.12);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(7, 0xa8d0ff, 0.16);
  g.lineBetween(handX, handY, tipX, tipY);

  shaft(g, handX, handY, tipX, tipY, 0x1a2248, 0x4a6cff, 0xc8e0ff);

  // Crystalline ridges / frost weave along blank
  for (const t of [0.16, 0.28, 0.4, 0.52, 0.64, 0.76, 0.88]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    const w = 4.2 - t * 1.2;
    g.lineStyle(1.8, 0x8ab4ff, 0.9);
    g.lineBetween(
      p.x + px * w,
      p.y + py * w,
      p.x - px * w,
      p.y - py * w
    );
    g.fillStyle(0xd0e8ff, 0.85);
    g.fillCircle(p.x + px * w, p.y + py * w, 1.1);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(p.x - px * (w * 0.7), p.y - py * (w * 0.7), 0.7);
  }

  // Ice crystal studs
  for (const t of [0.34, 0.58, 0.8]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    g.fillStyle(0x6a90ff, 0.9);
    g.fillTriangle(
      p.x - px * 2.5 - 1.5,
      p.y - py * 2.5 + 1,
      p.x - px * 2.5,
      p.y - py * 2.5 - 5,
      p.x - px * 2.5 + 1.8,
      p.y - py * 2.5 + 0.8
    );
    g.fillStyle(0xe8f0ff, 0.9);
    g.fillTriangle(
      p.x - px * 2.5 - 0.6,
      p.y - py * 2.5 + 0.3,
      p.x - px * 2.5 + 0.2,
      p.y - py * 2.5 - 3.5,
      p.x - px * 2.5 + 1,
      p.y - py * 2.5 + 0.2
    );
  }

  corkGrip(g, handX, handY, 0x2a3a88, 0x8aa0c8, 0x4a68a8);
  reelSeat(g, handX, handY, 0x7a9cff, 0xe8f0ff);

  // Woven frost star tip — multi-layer
  g.fillStyle(0x4a6cff, 0.25);
  g.fillCircle(tipX, tipY, 11);
  g.fillStyle(0x8ab4ff, 0.35);
  g.fillCircle(tipX, tipY, 7.5);
  g.lineStyle(2.2, 0xe8f0ff, 1);
  g.strokeCircle(tipX, tipY, 3.4);
  g.fillStyle(0x6a90ff, 0.95);
  g.fillCircle(tipX, tipY, 2.4);

  // Outer star arms
  g.lineStyle(1.8, 0xffffff, 0.95);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const len = i % 2 === 0 ? 9 : 5.5;
    g.lineBetween(
      tipX + Math.cos(a) * 1.4,
      tipY + Math.sin(a) * 1.4,
      tipX + Math.cos(a) * len,
      tipY + Math.sin(a) * len
    );
  }
  // Inner weave
  g.lineStyle(1.2, 0xa8c8ff, 0.85);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 4;
    g.lineBetween(
      tipX + Math.cos(a) * 2,
      tipY + Math.sin(a) * 2,
      tipX + Math.cos(a) * 5,
      tipY + Math.sin(a) * 5
    );
  }
  g.fillStyle(0xffffff, 1);
  g.fillCircle(tipX, tipY, 1.3);

  // Orbit frost sparkles
  const sparks = [
    { dx: -7, dy: -5, r: 1.1 },
    { dx: 7, dy: -3, r: 0.85 },
    { dx: 6, dy: 6, r: 1.0 },
    { dx: -6, dy: 5, r: 0.7 },
    { dx: 0, dy: -9, r: 0.75 },
    { dx: 9, dy: 1, r: 0.6 },
  ];
  for (const s of sparks) {
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(tipX + s.dx, tipY + s.dy, s.r);
  }
}

/** Hyperthermic — icy Forge: frozen iron blank, ice spikes, frost furnace, sparkles. */
export function drawHyperthermicRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);

  // Thick frozen iron blank
  g.lineStyle(9, 0x1a2838, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(6.5, 0x4a6078, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(3.2, 0x8ab0c8, 0.9);
  g.lineBetween(handX + px, handY + py, tipX + px, tipY + py);
  g.lineStyle(1.4, 0xd0ecff, 0.75);
  g.lineBetween(handX - px * 0.8, handY - py * 0.8, tipX - px * 0.8, tipY - py * 0.8);

  // Riveted frost bands
  for (const t of [0.16, 0.48, 0.78]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    g.lineStyle(2.4, 0x2a3848, 1);
    g.lineBetween(
      p.x + px * 5,
      p.y + py * 5,
      p.x - px * 5,
      p.y - py * 5
    );
    g.fillStyle(0xa8c8d8);
    g.fillCircle(p.x + px * 3.6, p.y + py * 3.6, 1.2);
    g.fillCircle(p.x - px * 3.6, p.y - py * 3.6, 1.2);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(p.x + px * 3.6 - 0.3, p.y + py * 3.6 - 0.3, 0.45);
  }

  // Ice spikes along blank
  for (const t of [0.26, 0.4, 0.58, 0.7, 0.86]) {
    const p = lerp(handX, handY, tipX, tipY, t);
    const side = t < 0.5 ? 1 : -1;
    const s = 1 + (t % 0.2) * 2;
    g.fillStyle(0x7ab0c8, 0.95);
    g.fillTriangle(
      p.x + px * side * 3,
      p.y + py * side * 3,
      p.x + px * side * (3 + 4 * s),
      p.y + py * side * (3 + 4 * s) + Math.sin(ang) * 1.5,
      p.x + Math.cos(ang) * 2.5 + px * side * 2,
      p.y + Math.sin(ang) * 2.5 + py * side * 2
    );
    g.fillStyle(0xd0ecff, 0.9);
    g.fillTriangle(
      p.x + px * side * 3.2,
      p.y + py * side * 3.2,
      p.x + px * side * (3 + 2.8 * s),
      p.y + py * side * (3 + 2.8 * s),
      p.x + Math.cos(ang) * 1.5 + px * side * 2.2,
      p.y + Math.sin(ang) * 1.5 + py * side * 2.2
    );
  }

  // Leather-frost grip
  g.fillStyle(0x3a4858, 1);
  g.fillRect(handX - 4, handY - 3, 10, 10);
  g.fillStyle(0x6a88a0, 1);
  g.fillRect(handX - 3, handY - 1, 8, 2);
  g.fillRect(handX - 3, handY + 2, 8, 2);
  g.fillStyle(0x2a3848, 1);
  g.fillRect(handX - 4, handY + 6, 10, 3);

  // Ice-metal reel seat
  g.fillStyle(0x6a90a8, 1);
  g.fillCircle(handX + 1, handY + 7, 4);
  g.fillStyle(0xc8e8f8, 1);
  g.fillCircle(handX + 1, handY + 7, 2.2);

  // Frost furnace motif (blue flame / ice instead of fire)
  const furnace = lerp(handX, handY, tipX, tipY, 0.38);
  const fx = furnace.x;
  const fy = furnace.y;
  const s = 0.72;
  g.fillStyle(0x2a3848, 1);
  g.fillRoundedRect(fx - 7 * s, fy - 5 * s, 14 * s, 11 * s, 2 * s);
  g.fillStyle(0x4a6078, 1);
  g.fillRect(fx - 6 * s, fy - 4 * s, 12 * s, 2 * s);
  g.fillRect(fx - 6 * s, fy + 2 * s, 12 * s, 2 * s);
  g.lineStyle(1 * s, 0x1a2838, 0.9);
  g.strokeRoundedRect(fx - 7 * s, fy - 5 * s, 14 * s, 11 * s, 2 * s);
  g.fillStyle(0x0a1828, 1);
  g.fillRect(fx - 4.5 * s, fy - 2 * s, 9 * s, 5 * s);
  g.fillStyle(0x283848, 1);
  g.fillRect(fx - 2 * s, fy - 7 * s, 4 * s, 5 * s);
  g.lineStyle(1 * s, 0x608898, 1);
  g.strokeRect(fx - 2 * s, fy - 7 * s, 4 * s, 5 * s);

  // Blue ice-flame glow
  g.fillStyle(0x3a80ff, 0.75);
  g.fillEllipse(fx, fy + 0.5 * s, 6 * s, 3.5 * s);
  g.fillStyle(0x70b8ff, 0.9);
  g.fillEllipse(fx, fy + 0.5 * s, 4 * s, 2.2 * s);
  g.fillStyle(0xd0f0ff, 0.95);
  g.fillCircle(fx - 1 * s, fy + 0.2 * s, 1.2 * s);
  g.fillCircle(fx + 1.4 * s, fy + 0.8 * s, 0.9 * s);

  // Ice shimmer rising from chimney
  g.lineStyle(1 * s, 0x80c0ff, 0.6);
  g.lineBetween(fx - 3 * s, fy - 8 * s, fx - 1 * s, fy - 10 * s);
  g.lineBetween(fx + 1 * s, fy - 9 * s, fx + 3 * s, fy - 11 * s);
  g.lineStyle(1 * s, 0xc8ecff, 0.5);
  g.lineBetween(fx, fy - 8.5 * s, fx + 0.5 * s, fy - 11.5 * s);

  // Tip ice ring
  g.lineStyle(2.6, 0xa8d0e8, 1);
  g.strokeCircle(tipX, tipY, 3.4);
  g.lineStyle(1.5, 0xe8f8ff, 0.85);
  g.strokeCircle(tipX, tipY, 2.1);
  g.fillStyle(0x70b8ff, 0.8);
  g.fillCircle(tipX + 2, tipY - 2, 1.3);

  // VFX-like sparkles everywhere
  const sparks = [
    { t: 0.2, ox: 4, oy: -3, r: 1.0 },
    { t: 0.35, ox: -5, oy: 2, r: 0.75 },
    { t: 0.5, ox: 5, oy: -4, r: 0.9 },
    { t: 0.62, ox: -4, oy: -2, r: 0.7 },
    { t: 0.75, ox: 3, oy: 3, r: 0.85 },
    { t: 0.9, ox: -3, oy: -4, r: 0.65 },
    { t: 0.95, ox: 4, oy: 1, r: 0.8 },
  ];
  for (const sp of sparks) {
    const p = lerp(handX, handY, tipX, tipY, sp.t);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(p.x + px * sp.ox * 0.4 + sp.ox * 0.3, p.y + py * sp.oy * 0.4 + sp.oy * 0.3, sp.r);
    g.fillStyle(0xa8d8ff, 0.7);
    g.fillCircle(p.x + px * sp.ox * 0.4 + sp.ox * 0.3 + 1.5, p.y + py * sp.oy * 0.4 + sp.oy * 0.3 - 1, sp.r * 0.55);
  }
}

export function drawSkinRodIcon(
  g: Phaser.GameObjects.Graphics,
  draw: (
    g: Phaser.GameObjects.Graphics,
    hx: number,
    hy: number,
    tx: number,
    ty: number
  ) => void
): void {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56, 28, 8);
  draw(g, SKIN_ICON_HAND.x, SKIN_ICON_HAND.y, SKIN_ICON_TIP.x, SKIN_ICON_TIP.y);
}
