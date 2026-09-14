import Phaser from "phaser";

/** Colossal Buster-style slab past a normal rod tip. */
export const VOIDHARVESTER_TIP_EXTEND = 2.35;

/** Extended tip from hand → base tip (cast point = blade tip corner). */
export function voidharvesterBladeTip(
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): { x: number; y: number } {
  return {
    x: handX + (tipX - handX) * VOIDHARVESTER_TIP_EXTEND,
    y: handY + (tipY - handY) * VOIDHARVESTER_TIP_EXTEND,
  };
}

/**
 * The Voidharvester — colossal Buster-style black/purple greatsword.
 * Blade roots flush into the crossguard; line casts from the tip corner.
 */
export function drawVoidharvesterRod(
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

  const at = (t: number, off = 0) => ({
    x: handX + dx * t + px * off,
    y: handY + dy * t + py * off,
  });

  g.fillStyle(0x2a1040, 0.14);
  g.fillCircle(at(0.5).x, at(0.5).y, 9);
  g.fillCircle(at(0.72).x, at(0.72).y, 8);

  // —— Pommel ——
  const pommel = at(-0.05);
  g.fillStyle(0x050308, 1);
  g.fillCircle(pommel.x, pommel.y, 5);
  g.fillStyle(0x1c1428, 1);
  g.fillCircle(pommel.x, pommel.y, 3.6);
  g.lineStyle(1.3, 0x4a3080, 0.85);
  g.strokeCircle(pommel.x, pommel.y, 3.8);

  // —— Long two-hand grip ——
  // Guard sits at 0.2; blade roots into the front of the guard (no gap)
  const guardT = 0.2;
  const gripEnd = at(guardT - 0.01);
  g.lineStyle(10, 0x08040e, 1);
  g.lineBetween(handX - ux * 1.5, handY - uy * 1.5, gripEnd.x, gripEnd.y);
  g.lineStyle(7.2, 0x1a1420, 1);
  g.lineBetween(handX - ux * 1.5, handY - uy * 1.5, gripEnd.x, gripEnd.y);
  for (let i = 0; i < 8; i++) {
    const t = 0.005 + i * 0.022;
    const p = at(t);
    const slant = (i % 2 === 0 ? 1 : -1) * 0.55;
    g.lineStyle(2.3, i % 2 === 0 ? 0x2a2030 : 0x18121c, 1);
    g.lineBetween(
      p.x + px * 3.5 + ux * slant,
      p.y + py * 3.5 + uy * slant,
      p.x - px * 3.5 + ux * slant,
      p.y - py * 3.5 + uy * slant
    );
  }

  // —— Colossal blade (drawn under the guard so it reads as socketed in) ——
  const bladeW = 14.5;
  // Root flush against the front face of the guard
  const root = at(guardT + 0.01);
  const spineRoot = {
    x: root.x + px * bladeW * 0.52,
    y: root.y + py * bladeW * 0.52,
  };
  const edgeRoot = {
    x: root.x - px * bladeW * 0.52,
    y: root.y - py * bladeW * 0.52,
  };
  // Also extend a short tang into the guard so there's no visual gap
  const tang = at(guardT - 0.04);
  const spineTang = {
    x: tang.x + px * bladeW * 0.42,
    y: tang.y + py * bladeW * 0.42,
  };
  const edgeTang = {
    x: tang.x - px * bladeW * 0.42,
    y: tang.y - py * bladeW * 0.42,
  };

  const spineTip = at(0.8, bladeW * 0.5);
  const edgeTip = { x: tipX, y: tipY };
  const tipMid = {
    x: (spineTip.x + tipX) * 0.5,
    y: (spineTip.y + tipY) * 0.5,
  };

  // Tang into the handle/guard
  g.fillStyle(0x0a0810, 1);
  g.fillTriangle(
    spineTang.x,
    spineTang.y,
    edgeTang.x,
    edgeTang.y,
    edgeRoot.x,
    edgeRoot.y
  );
  g.fillTriangle(
    spineTang.x,
    spineTang.y,
    spineRoot.x,
    spineRoot.y,
    edgeRoot.x,
    edgeRoot.y
  );

  // Main slab body
  g.fillStyle(0x0c0a12, 1);
  g.fillTriangle(
    spineRoot.x,
    spineRoot.y,
    edgeRoot.x,
    edgeRoot.y,
    edgeTip.x,
    edgeTip.y
  );
  g.fillTriangle(
    spineRoot.x,
    spineRoot.y,
    spineTip.x,
    spineTip.y,
    edgeTip.x,
    edgeTip.y
  );

  // Face plate
  g.fillStyle(0x18141f, 1);
  g.fillTriangle(
    spineRoot.x - px * 2,
    spineRoot.y - py * 2,
    edgeRoot.x + px * 3.2,
    edgeRoot.y + py * 3.2,
    edgeTip.x + px * 2 - ux * 3,
    edgeTip.y + py * 2 - uy * 3
  );

  // Cutting edge strip
  g.fillStyle(0x6a5a88, 1);
  g.fillTriangle(
    edgeRoot.x,
    edgeRoot.y,
    edgeRoot.x + px * 3.4,
    edgeRoot.y + py * 3.4,
    edgeTip.x + px * 2,
    edgeTip.y + py * 2
  );
  g.fillTriangle(
    edgeRoot.x,
    edgeRoot.y,
    edgeTip.x + px * 2,
    edgeTip.y + py * 2,
    edgeTip.x,
    edgeTip.y
  );
  g.lineStyle(1.4, 0xb0a0d0, 0.55);
  g.lineBetween(edgeRoot.x, edgeRoot.y, edgeTip.x, edgeTip.y);

  // Thick spine
  g.lineStyle(4.2, 0x1a1428, 1);
  g.lineBetween(spineRoot.x, spineRoot.y, spineTip.x, spineTip.y);
  g.lineStyle(1.3, 0x3a3060, 0.5);
  g.lineBetween(
    spineRoot.x - px * 1,
    spineRoot.y - py * 1,
    spineTip.x - px * 1,
    spineTip.y - py * 1
  );

  // Diagonal chisel tip
  g.fillStyle(0x2a2038, 1);
  g.fillTriangle(
    spineTip.x,
    spineTip.y,
    edgeTip.x,
    edgeTip.y,
    tipMid.x + ux * 1.5,
    tipMid.y + uy * 1.5
  );
  g.lineStyle(1.8, 0x8a78b8, 0.8);
  g.lineBetween(spineTip.x, spineTip.y, edgeTip.x, edgeTip.y);

  // —— Crossguard ON TOP of the blade root (blade locked into it) ——
  const guard = at(guardT);
  const gHalf = 13.5;
  const gBack = 5.5;
  const gFront = 2.2;
  const gCorners = [
    { x: guard.x + px * gHalf - ux * gBack, y: guard.y + py * gHalf - uy * gBack },
    { x: guard.x + px * gHalf + ux * gFront, y: guard.y + py * gHalf + uy * gFront },
    { x: guard.x - px * gHalf + ux * gFront, y: guard.y - py * gHalf + uy * gFront },
    { x: guard.x - px * gHalf - ux * gBack, y: guard.y - py * gHalf - uy * gBack },
  ];
  g.fillStyle(0x0a0610, 1);
  g.fillTriangle(
    gCorners[0].x,
    gCorners[0].y,
    gCorners[1].x,
    gCorners[1].y,
    gCorners[2].x,
    gCorners[2].y
  );
  g.fillTriangle(
    gCorners[0].x,
    gCorners[0].y,
    gCorners[2].x,
    gCorners[2].y,
    gCorners[3].x,
    gCorners[3].y
  );
  g.fillStyle(0x1e1630, 1);
  g.fillTriangle(
    guard.x + px * (gHalf - 1.4) - ux * 2,
    guard.y + py * (gHalf - 1.4) - uy * 2,
    guard.x + px * (gHalf - 1.4) + ux * 0.6,
    guard.y + py * (gHalf - 1.4) + uy * 0.6,
    guard.x - px * (gHalf - 1.4) + ux * 0.6,
    guard.y - py * (gHalf - 1.4) + uy * 0.6
  );
  g.fillTriangle(
    guard.x + px * (gHalf - 1.4) - ux * 2,
    guard.y + py * (gHalf - 1.4) - uy * 2,
    guard.x - px * (gHalf - 1.4) + ux * 0.6,
    guard.y - py * (gHalf - 1.4) + uy * 0.6,
    guard.x - px * (gHalf - 1.4) - ux * 2,
    guard.y - py * (gHalf - 1.4) - uy * 2
  );
  // Rivets
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    const r = { x: guard.x + px * i * 2.5, y: guard.y + py * i * 2.5 };
    g.fillStyle(0x0a0614, 1);
    g.fillCircle(r.x, r.y, 1.45);
    g.fillStyle(0x3a2860, 0.9);
    g.fillCircle(r.x - 0.35, r.y - 0.4, 0.55);
  }

  // —— Void slots near the guard ——
  for (const off of [0, 0.065]) {
    const s = at(0.32 + off, bladeW * 0.16);
    g.fillStyle(0x050208, 1);
    g.fillCircle(s.x, s.y, 4);
    g.fillStyle(0x1a0a30, 1);
    g.fillCircle(s.x, s.y, 2.9);
    g.lineStyle(1.4, 0x7a50c0, 0.95);
    g.strokeCircle(s.x, s.y, 3.1);
    g.fillStyle(0x9b5de5, 0.55);
    g.fillCircle(s.x, s.y, 1.45);
    g.fillStyle(0xc9a0ff, 0.35);
    g.fillCircle(s.x - 0.55, s.y - 0.65, 0.65);
  }
  const plate = at(0.34, bladeW * 0.14);
  g.lineStyle(1.5, 0x2a1848, 0.75);
  g.strokeRect(plate.x - 6.5, plate.y - 11, 13, 22);

  // Etch lines
  g.lineStyle(1.1, 0x5a40a0, 0.55);
  g.lineBetween(at(0.45, 2).x, at(0.45, 2).y, at(0.52, -1.5).x, at(0.52, -1.5).y);
  g.lineBetween(at(0.52, -1.5).x, at(0.52, -1.5).y, at(0.6, 3).x, at(0.6, 3).y);
  g.lineBetween(at(0.48, -4).x, at(0.48, -4).y, at(0.56, -4).x, at(0.56, -4).y);
  g.lineBetween(at(0.5, 5).x, at(0.5, 5).y, at(0.58, 4).x, at(0.58, 4).y);

  // Scratches
  g.lineStyle(0.9, 0x2a2038, 0.45);
  g.lineBetween(at(0.68, 4).x, at(0.68, 4).y, at(0.76, 1.5).x, at(0.76, 1.5).y);
  g.lineBetween(at(0.64, -3).x, at(0.64, -3).y, at(0.72, -5).x, at(0.72, -5).y);
}

/** Wide bag icon so the greatsword isn’t squished. */
export function drawVoidharvesterRodIcon(g: Phaser.GameObjects.Graphics): void {
  const W = 136;
  const H = 108;
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(52, 96, 52, 9);
  g.fillStyle(0x140820, 0.35);
  g.fillEllipse(74, 50, 56, 40);
  const tip = voidharvesterBladeTip(18, 88, 52, 28);
  drawVoidharvesterRod(g, 18, 88, tip.x, tip.y);
  void W;
  void H;
}

export const VOIDHARVESTER_ICON_W = 136;
export const VOIDHARVESTER_ICON_H = 108;
