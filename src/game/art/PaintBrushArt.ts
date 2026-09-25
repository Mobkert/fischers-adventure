import Phaser from "phaser";

/** How far past the pose tip the white bristles reach (line attaches here). */
export const PAINT_BRUSH_TIP_T = 1.36;

/** World/local tip at the end of the white brush head. */
export function paintBrushTip(
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): { x: number; y: number } {
  return {
    x: handX + (tipX - handX) * PAINT_BRUSH_TIP_T,
    y: handY + (tipY - handY) * PAINT_BRUSH_TIP_T,
  };
}

/** Classic paint brush — tapered stick + shaped white bristle head. */
export function drawPaintBrushRod(
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

  // Contact shadow
  g.lineStyle(7, 0x000000, 0.14);
  g.lineBetween(
    at(-0.02, 1.4).x,
    at(-0.02, 1.4).y,
    at(0.78, 1.4).x,
    at(0.78, 1.4).y
  );

  // —— Tapered wooden handle (thicker at butt → thinner at ferrule) ——
  const handlePoly = (halfW: (t: number) => number, color: number, alpha = 1) => {
    g.fillStyle(color, alpha);
    g.beginPath();
    const steps = 12;
    g.moveTo(at(-0.04, halfW(-0.04)).x, at(-0.04, halfW(-0.04)).y);
    for (let i = 1; i <= steps; i++) {
      const t = -0.04 + (0.72 - -0.04) * (i / steps);
      const p = at(t, halfW(t));
      g.lineTo(p.x, p.y);
    }
    for (let i = steps; i >= 0; i--) {
      const t = -0.04 + (0.72 - -0.04) * (i / steps);
      const p = at(t, -halfW(t));
      g.lineTo(p.x, p.y);
    }
    g.closePath();
    g.fillPath();
  };
  const woodW = (t: number) => 2.85 - t * 1.1;
  handlePoly((t) => woodW(t) + 0.7, 0x2a1810);
  handlePoly((t) => woodW(t) + 0.15, 0x6a3e1c);
  handlePoly(woodW, 0xa06a34);
  // Highlight strip along the top edge
  g.fillStyle(0xe0b070, 0.75);
  g.beginPath();
  for (let i = 0; i <= 10; i++) {
    const t = -0.02 + 0.7 * (i / 10);
    const p = at(t, woodW(t) * 0.55);
    if (i === 0) g.moveTo(p.x, p.y);
    else g.lineTo(p.x, p.y);
  }
  for (let i = 10; i >= 0; i--) {
    const t = -0.02 + 0.7 * (i / 10);
    const p = at(t, woodW(t) * 0.15);
    g.lineTo(p.x, p.y);
  }
  g.closePath();
  g.fillPath();
  // Grain
  for (let i = 0; i < 8; i++) {
    const t = 0.04 + i * 0.08;
    const w = woodW(t) * 0.85;
    const p = at(t);
    g.lineStyle(0.9, i % 2 ? 0x7a4a22 : 0xc4894a, 0.5);
    g.lineBetween(p.x + px * w, p.y + py * w, p.x - px * w, p.y - py * w);
  }
  // Butt cap
  const butt = at(-0.05);
  g.fillStyle(0x2a1810, 1);
  g.fillCircle(butt.x, butt.y, 3.1);
  g.fillStyle(0x8a5530, 1);
  g.fillCircle(butt.x, butt.y, 2.3);
  g.fillStyle(0xe0b070, 0.8);
  g.fillCircle(butt.x + px * 0.6, butt.y + py * 0.6, 0.85);

  // —— Cylindrical ferrule with lip ——
  const f0 = 0.70;
  const f1 = 0.82;
  const ferruleHalf = 3.6;
  // Outer metal body
  g.fillStyle(0x3a4450, 1);
  g.beginPath();
  g.moveTo(at(f0, ferruleHalf + 0.6).x, at(f0, ferruleHalf + 0.6).y);
  g.lineTo(at(f1, ferruleHalf + 0.4).x, at(f1, ferruleHalf + 0.4).y);
  g.lineTo(at(f1, -(ferruleHalf + 0.4)).x, at(f1, -(ferruleHalf + 0.4)).y);
  g.lineTo(at(f0, -(ferruleHalf + 0.6)).x, at(f0, -(ferruleHalf + 0.6)).y);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x9aa8b4, 1);
  g.beginPath();
  g.moveTo(at(f0, ferruleHalf).x, at(f0, ferruleHalf).y);
  g.lineTo(at(f1, ferruleHalf - 0.15).x, at(f1, ferruleHalf - 0.15).y);
  g.lineTo(at(f1, -(ferruleHalf - 0.15)).x, at(f1, -(ferruleHalf - 0.15)).y);
  g.lineTo(at(f0, -ferruleHalf).x, at(f0, -ferruleHalf).y);
  g.closePath();
  g.fillPath();
  // Specular band
  g.fillStyle(0xe8eef4, 0.85);
  g.beginPath();
  g.moveTo(at(f0, ferruleHalf * 0.55).x, at(f0, ferruleHalf * 0.55).y);
  g.lineTo(at(f1, ferruleHalf * 0.45).x, at(f1, ferruleHalf * 0.45).y);
  g.lineTo(at(f1, ferruleHalf * 0.05).x, at(f1, ferruleHalf * 0.05).y);
  g.lineTo(at(f0, ferruleHalf * 0.15).x, at(f0, ferruleHalf * 0.15).y);
  g.closePath();
  g.fillPath();
  // Crimp rings + front lip
  for (const t of [0.725, 0.76, 0.795]) {
    const p = at(t);
    g.lineStyle(1.7, 0x5a6874, 1);
    g.lineBetween(
      p.x + px * (ferruleHalf + 0.2),
      p.y + py * (ferruleHalf + 0.2),
      p.x - px * (ferruleHalf + 0.2),
      p.y - py * (ferruleHalf + 0.2)
    );
  }
  // Front opening lip (where bristles exit)
  g.fillStyle(0x6a7888, 1);
  g.fillEllipse(at(f1).x, at(f1).y, ferruleHalf * 2.05, 3.4);
  g.fillStyle(0xc8d0d8, 1);
  g.fillEllipse(at(f1).x, at(f1).y, ferruleHalf * 1.7, 2.6);

  // —— Shaped white bristle head ——
  // Profile: packed cylinder out of ferrule → soft belly → rounded tip
  // half-width curve along the brush length (u: 0 at ferrule → 1 at tip)
  const brushHalf = (u: number) => {
    // Wide root, slight belly swell, then soft round tip (not a hard point)
    const root = 7.2;
    const belly = 8.4;
    const tipR = 2.1;
    if (u < 0.18) return root * (0.75 + u / 0.18 * 0.25);
    if (u < 0.55) {
      const v = (u - 0.18) / 0.37;
      return root + (belly - root) * Math.sin(v * Math.PI * 0.5);
    }
    const v = (u - 0.55) / 0.45;
    const ease = 1 - Math.pow(1 - v, 1.6);
    return belly + (tipR - belly) * ease;
  };
  const brushStart = 0.82;
  const brushLen = 0.52; // longer bristle head along the rod
  const brushPoint = (u: number, side: number) =>
    at(brushStart + u * brushLen, side * brushHalf(u));

  // Outer soft halo (irregular)
  g.fillStyle(0xd0d8e0, 0.4);
  g.beginPath();
  g.moveTo(brushPoint(0, 1).x, brushPoint(0, 1).y);
  for (let i = 1; i <= 16; i++) {
    const u = i / 16;
    const puff = 1.15 + Math.sin(u * 9) * 0.06;
    const p = at(
      brushStart + u * brushLen,
      brushHalf(u) * puff
    );
    g.lineTo(p.x, p.y);
  }
  for (let i = 16; i >= 0; i--) {
    const u = i / 16;
    const puff = 1.15 + Math.cos(u * 8) * 0.06;
    const p = at(
      brushStart + u * brushLen,
      -brushHalf(u) * puff
    );
    g.lineTo(p.x, p.y);
  }
  g.closePath();
  g.fillPath();

  // Main white silhouette (smooth curved body)
  g.fillStyle(0xa8b4c0, 1);
  g.beginPath();
  g.moveTo(brushPoint(0, 1).x, brushPoint(0, 1).y);
  for (let i = 1; i <= 18; i++) {
    const p = brushPoint(i / 18, 1.08);
    g.lineTo(p.x, p.y);
  }
  // Rounded tip cap
  const tipC = at(brushStart + brushLen + 0.01);
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 8;
    g.lineTo(
      tipC.x + ux * Math.cos(a) * 2.4 + px * Math.sin(a) * 2.4,
      tipC.y + uy * Math.cos(a) * 2.4 + py * Math.sin(a) * 2.4
    );
  }
  for (let i = 18; i >= 0; i--) {
    const p = brushPoint(i / 18, -1.08);
    g.lineTo(p.x, p.y);
  }
  g.closePath();
  g.fillPath();

  g.fillStyle(0xffffff, 1);
  g.beginPath();
  g.moveTo(brushPoint(0, 1).x, brushPoint(0, 1).y);
  for (let i = 1; i <= 18; i++) {
    const p = brushPoint(i / 18, 1);
    g.lineTo(p.x, p.y);
  }
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / 8;
    g.lineTo(
      tipC.x + ux * Math.cos(a) * 2.0 + px * Math.sin(a) * 2.0,
      tipC.y + uy * Math.cos(a) * 2.0 + py * Math.sin(a) * 2.0
    );
  }
  for (let i = 18; i >= 0; i--) {
    const p = brushPoint(i / 18, -1);
    g.lineTo(p.x, p.y);
  }
  g.closePath();
  g.fillPath();

  // Underside shade following the belly curve
  g.fillStyle(0xd0d8e0, 0.72);
  g.beginPath();
  g.moveTo(brushPoint(0.05, -0.1).x, brushPoint(0.05, -0.1).y);
  for (let i = 1; i <= 14; i++) {
    const u = i / 14;
    const p = brushPoint(u, -0.92);
    g.lineTo(p.x, p.y);
  }
  for (let i = 14; i >= 0; i--) {
    const u = i / 14;
    const p = brushPoint(u, -0.15);
    g.lineTo(p.x, p.y);
  }
  g.closePath();
  g.fillPath();

  // Lit crest along the upper belly
  g.fillStyle(0xffffff, 0.95);
  g.beginPath();
  for (let i = 0; i <= 12; i++) {
    const u = 0.08 + (0.75 * i) / 12;
    const p = brushPoint(u, 0.55);
    if (i === 0) g.moveTo(p.x, p.y);
    else g.lineTo(p.x, p.y);
  }
  for (let i = 12; i >= 0; i--) {
    const u = 0.08 + (0.75 * i) / 12;
    const p = brushPoint(u, 0.12);
    g.lineTo(p.x, p.y);
  }
  g.closePath();
  g.fillPath();

  // Layered bristle strands following the shaped profile
  for (let i = -7; i <= 7; i++) {
    const side = i / 7;
    const u0 = 0.02;
    const u1 = 0.88 + (1 - Math.abs(side)) * 0.1;
    const a = brushPoint(u0, side * 0.95);
    const b = brushPoint(u1, side * 0.55);
    // Slight curve via mid control
    const midU = (u0 + u1) * 0.5;
    const m = brushPoint(midU, side * (0.85 + Math.abs(side) * 0.1));
    const col =
      Math.abs(i) <= 1 ? 0xeef2f6 : Math.abs(i) % 2 === 0 ? 0xd0d8e0 : 0xb8c4d0;
    g.lineStyle(Math.abs(i) <= 1 ? 1.2 : 0.95, col, 0.88);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(m.x, m.y);
    g.lineTo(b.x, b.y);
    g.strokePath();
  }
  // Fine tip filaments (soft rounded fringe)
  for (let i = -5; i <= 5; i++) {
    const side = i / 5;
    const a = brushPoint(0.72, side * 0.7);
    const b = at(
      brushStart + brushLen + 0.02,
      side * 1.6 + Math.sin(i * 1.3) * 0.35
    );
    g.lineStyle(0.75, 0xc4ccd6, 0.7);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  // Bristle plug in the ferrule mouth
  g.fillStyle(0xe8eef4, 1);
  g.fillEllipse(at(f1).x + ux * 0.5, at(f1).y + uy * 0.5, ferruleHalf * 1.55, 2.8);
  g.fillStyle(0xc0c8d0, 0.7);
  g.fillEllipse(at(f1).x, at(f1).y, ferruleHalf * 1.2, 1.8);

  // Tip highlight
  g.fillStyle(0xffffff, 1);
  g.fillCircle(tipC.x + ux * 0.5, tipC.y + uy * 0.5, 2.2);
  g.fillStyle(0xf4f8fc, 0.95);
  g.fillCircle(
    tipC.x - ux * 0.3 + px * 0.6,
    tipC.y - uy * 0.3 + py * 0.6,
    1.0
  );
}

/** Bag / hotbar icon — tapered stick + shaped white brush. */
export function drawPaintBrushRodIcon(g: Phaser.GameObjects.Graphics): void {
  const IPY = 8;
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(24, 56 + IPY, 28, 7);

  // Tapered wood (butt thick → ferrule thin)
  g.fillStyle(0x2a1810, 1);
  g.beginPath();
  g.moveTo(14, 56 + IPY);
  g.lineTo(18, 58 + IPY);
  g.lineTo(41, 30 + IPY);
  g.lineTo(38, 27 + IPY);
  g.lineTo(12, 52 + IPY);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xa06a34, 1);
  g.beginPath();
  g.moveTo(15, 55 + IPY);
  g.lineTo(17.5, 56.5 + IPY);
  g.lineTo(40, 29.5 + IPY);
  g.lineTo(38.2, 28 + IPY);
  g.lineTo(13.5, 52.5 + IPY);
  g.closePath();
  g.fillPath();
  g.lineStyle(1.1, 0xe0b070, 0.85);
  g.lineBetween(15.5, 53 + IPY, 39, 28.5 + IPY);
  for (let i = 0; i < 5; i++) {
    const t = 0.18 + i * 0.12;
    const x = 15 + (39 - 15) * t;
    const y = 54.5 + IPY + (29 - 54.5) * t;
    g.lineStyle(0.85, i % 2 ? 0x7a4a22 : 0xc4894a, 0.5);
    g.lineBetween(x - 1.6, y - 1.3, x + 1.6, y + 1.3);
  }
  g.fillStyle(0x8a5530, 1);
  g.fillCircle(14.5, 54.5 + IPY, 2.4);
  g.fillStyle(0xe0b070, 0.8);
  g.fillCircle(14, 53.8 + IPY, 0.8);

  // Ferrule cylinder
  g.fillStyle(0x3a4450, 1);
  g.beginPath();
  g.moveTo(38, 31 + IPY);
  g.lineTo(45, 25 + IPY);
  g.lineTo(42, 21.5 + IPY);
  g.lineTo(35.5, 27.5 + IPY);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xb0bcc8, 1);
  g.beginPath();
  g.moveTo(38.5, 30 + IPY);
  g.lineTo(44.2, 24.5 + IPY);
  g.lineTo(42.2, 22.5 + IPY);
  g.lineTo(36.5, 28 + IPY);
  g.closePath();
  g.fillPath();
  g.lineStyle(1.3, 0x5a6874, 1);
  g.lineBetween(39.2, 26.5 + IPY, 41.8, 29 + IPY);
  g.lineBetween(41, 24.8 + IPY, 43.5, 27.2 + IPY);
  g.fillStyle(0xc8d0d8, 1);
  g.fillEllipse(43.5, 23.5 + IPY, 7, 3.2);

  // Shaped white head: longer belly + rounded tip
  const ox = 44;
  const oy = 23 + IPY;
  g.fillStyle(0xa8b4c0, 1);
  g.beginPath();
  g.moveTo(ox - 1, oy + 4);
  g.lineTo(ox + 3, oy + 6.5);
  g.lineTo(ox + 11, oy + 2);
  g.lineTo(ox + 18, oy - 4);
  g.lineTo(ox + 20, oy - 9);
  g.lineTo(ox + 16, oy - 12);
  g.lineTo(ox + 6, oy - 6);
  g.lineTo(ox - 0.5, oy - 1);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xffffff, 1);
  g.beginPath();
  g.moveTo(ox, oy + 3);
  g.lineTo(ox + 3.2, oy + 5.2);
  g.lineTo(ox + 10.5, oy + 1.4);
  g.lineTo(ox + 17, oy - 4.2);
  g.lineTo(ox + 18.5, oy - 8.5);
  g.lineTo(ox + 15, oy - 10.8);
  g.lineTo(ox + 6.2, oy - 5);
  g.lineTo(ox + 0.5, oy - 0.5);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xd0d8e0, 0.7);
  g.beginPath();
  g.moveTo(ox + 1, oy + 1);
  g.lineTo(ox + 10, oy + 1.5);
  g.lineTo(ox + 17.5, oy - 4);
  g.lineTo(ox + 14, oy - 8);
  g.lineTo(ox + 4, oy - 2);
  g.closePath();
  g.fillPath();
  for (let i = -4; i <= 4; i++) {
    g.lineStyle(0.9, Math.abs(i) < 2 ? 0xe8eef4 : 0xc0c8d0, 0.9);
    g.lineBetween(
      ox + 2 + i * 0.7,
      oy + 2.5 - i * 0.55,
      ox + 16 + i * 0.35,
      oy - 6 - i * 0.25
    );
  }
  g.fillStyle(0xffffff, 1);
  g.fillCircle(ox + 17.5, oy - 9.2, 2.4);
  g.fillStyle(0xf4f8fc, 1);
  g.fillCircle(ox + 16.8, oy - 9.8, 1.0);
}
const STARRY_PALETTE = {
  nightDeep: 0x0a1430,
  nightMid: 0x1a3868,
  swirlBlue: 0x3a6ab8,
  swirlCyan: 0x6aa8d8,
  swirlLite: 0xa8d0f0,
  hill: 0x142038,
  cypress: 0x0c1820,
  star: 0xffe066,
  starHot: 0xfff6c8,
  moon: 0xf0e8a0,
  village: 0x1a2848,
};

/**
 * Full catch-panel Starry Night painting (the big minigame rectangle).
 * Local coords centered on the catch root; panelY is the panel center Y.
 */
export function drawStarryNightPanel(
  g: Phaser.GameObjects.Graphics,
  panelW: number,
  panelH: number,
  panelY: number,
  phase: number
): void {
  const hw = panelW / 2;
  const hh = panelH / 2;
  const top = panelY - hh;
  const bot = panelY + hh;
  const t = phase;

  // Deep night fill
  g.fillStyle(STARRY_PALETTE.nightDeep, 1);
  g.fillRoundedRect(-hw, top, panelW, panelH, 14);

  // Layered night sky wash
  g.fillStyle(STARRY_PALETTE.nightMid, 0.55);
  g.fillEllipse(-40, top + 36, panelW * 0.85, panelH * 0.55);
  g.fillStyle(0x243e78, 0.35);
  g.fillEllipse(80, top + 28, panelW * 0.55, panelH * 0.4);

  // Big Van Gogh swirls across the panel
  for (let i = 0; i < 8; i++) {
    const y = top + 18 + i * (panelH / 10.5);
    g.lineStyle(
      5.5 - i * 0.35,
      i % 2 ? STARRY_PALETTE.swirlBlue : STARRY_PALETTE.swirlCyan,
      0.5 + (i % 3) * 0.08
    );
    g.beginPath();
    for (let s = 0; s <= 56; s++) {
      const u = s / 56;
      const x = -hw + 10 + u * (panelW - 20);
      const wave =
        Math.sin(u * Math.PI * 2.6 + t * 1.15 + i * 0.55) * 10 +
        Math.sin(u * Math.PI * 5.2 - t * 0.85 + i * 1.1) * 4.5;
      const yy = y + wave;
      if (s === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.strokePath();
  }

  // Bright spiral ribbons
  for (let i = 0; i < 4; i++) {
    const y = top + 30 + i * 18;
    g.lineStyle(2.4, STARRY_PALETTE.swirlLite, 0.38);
    g.beginPath();
    for (let s = 0; s <= 40; s++) {
      const u = s / 40;
      const x = -hw + 24 + u * (panelW - 48);
      const wave = Math.sin(u * Math.PI * 4.2 - t * 1.6 + i * 1.7) * 6;
      if (s === 0) g.moveTo(x, y + wave);
      else g.lineTo(x, y + wave);
    }
    g.strokePath();
  }

  // Rolling hills / village band along the bottom
  g.fillStyle(STARRY_PALETTE.hill, 0.92);
  g.beginPath();
  g.moveTo(-hw + 4, bot - 4);
  for (let s = 0; s <= 24; s++) {
    const u = s / 24;
    const x = -hw + 4 + u * (panelW - 8);
    const y =
      bot - 18 - Math.sin(u * Math.PI * 3 + 0.4) * 7 - Math.sin(u * Math.PI * 7) * 3;
    g.lineTo(x, y);
  }
  g.lineTo(hw - 4, bot - 4);
  g.closePath();
  g.fillPath();

  // Tiny village lights / windows
  for (let i = 0; i < 9; i++) {
    const vx = -hw + 70 + i * 48 + Math.sin(i * 1.7) * 6;
    const vy = bot - 22 - (i % 3) * 3;
    g.fillStyle(STARRY_PALETTE.village, 0.95);
    g.fillRect(vx - 4, vy - 8, 8, 10);
    g.fillStyle(STARRY_PALETTE.star, 0.55 + Math.sin(t * 2 + i) * 0.25);
    g.fillRect(vx - 1.5, vy - 5, 2, 2);
  }

  // Cypress silhouette (left)
  g.fillStyle(STARRY_PALETTE.cypress, 0.96);
  g.beginPath();
  const cx = -hw + 48;
  g.moveTo(cx, bot - 6);
  g.lineTo(cx - 16, bot - 6);
  g.lineTo(cx - 10, panelY + 8);
  g.lineTo(cx - 6, top + 22);
  g.lineTo(cx + 2, top + 10);
  g.lineTo(cx + 8, top + 28);
  g.lineTo(cx + 14, panelY);
  g.lineTo(cx + 12, bot - 6);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x152030, 0.7);
  g.beginPath();
  g.moveTo(cx - 2, bot - 6);
  g.lineTo(cx - 6, top + 40);
  g.lineTo(cx + 4, top + 34);
  g.lineTo(cx + 6, bot - 6);
  g.closePath();
  g.fillPath();

  // Crescent moon (upper right)
  const mx = hw - 58;
  const my = top + 34;
  g.fillStyle(STARRY_PALETTE.moon, 0.98);
  g.fillCircle(mx, my, 16);
  g.fillStyle(STARRY_PALETTE.nightMid, 1);
  g.fillCircle(mx + 7, my - 2, 14);
  g.fillStyle(STARRY_PALETTE.starHot, 0.35);
  g.fillCircle(mx - 4, my + 2, 4);

  // Stars scattered across the sky
  for (let i = 0; i < 22; i++) {
    const sx = -hw + 70 + ((i * 53) % (panelW - 120));
    const sy = top + 14 + ((i * 29) % (panelH - 50));
    // Keep stars out of the lower hill band
    if (sy > bot - 28) continue;
    const tw = 0.5 + Math.sin(t * 2.8 + i * 1.2) * 0.4;
    const r = 1.4 + (i % 4) * 0.7;
    g.fillStyle(i % 5 === 0 ? STARRY_PALETTE.starHot : STARRY_PALETTE.star, tw);
    g.fillCircle(sx, sy, r);
    if (i % 3 === 0) {
      g.lineStyle(1.2, STARRY_PALETTE.starHot, tw * 0.85);
      g.lineBetween(sx - r * 2.6, sy, sx + r * 2.6, sy);
      g.lineBetween(sx, sy - r * 2.6, sx, sy + r * 2.6);
    }
  }

  // Soft gold frame
  g.lineStyle(2.5, 0xffe066, 0.8);
  g.strokeRoundedRect(-hw, top, panelW, panelH, 14);
  g.lineStyle(1, 0xfff6c8, 0.35);
  g.strokeRoundedRect(-hw + 3, top + 3, panelW - 6, panelH - 6, 12);
}

/**
 * Van Gogh–inspired Starry Night wash for the catch control bar track.
 */
export function drawStarryNightBar(
  g: Phaser.GameObjects.Graphics,
  barWidth: number,
  barHeight: number,
  barY: number,
  phase: number
): void {
  const hw = barWidth / 2;
  const hh = barHeight / 2;
  const t = phase;

  g.fillStyle(STARRY_PALETTE.nightDeep, 0.55);
  g.fillRoundedRect(-hw, barY - hh, barWidth, barHeight, 6);

  for (let i = 0; i < 5; i++) {
    const y = barY - hh + 6 + i * (barHeight / 6);
    g.lineStyle(
      3.2 - i * 0.3,
      i % 2 ? STARRY_PALETTE.swirlBlue : STARRY_PALETTE.swirlCyan,
      0.45
    );
    g.beginPath();
    for (let s = 0; s <= 36; s++) {
      const u = s / 36;
      const x = -hw + 4 + u * (barWidth - 8);
      const wave =
        Math.sin(u * Math.PI * 3 + t * 1.4 + i * 0.7) * 4 +
        Math.sin(u * Math.PI * 5 - t * 0.9 + i) * 2;
      const yy = y + wave;
      if (s === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.strokePath();
  }

  g.lineStyle(2, 0xffe066, 0.55);
  g.strokeRoundedRect(-hw, barY - hh, barWidth, barHeight, 6);
}

/**
 * Kandinsky-like Composition VII panel — colliding arcs, wedges, and color fields.
 */
export function drawCompositionViiPanel(
  g: Phaser.GameObjects.Graphics,
  panelW: number,
  panelH: number,
  panelY: number,
  phase: number
): void {
  const hw = panelW / 2;
  const hh = panelH / 2;
  const top = panelY - hh;
  const bot = panelY + hh;
  const t = phase;

  // Warm parchment / ochre ground
  g.fillStyle(0xd8c090, 1);
  g.fillRoundedRect(-hw, top, panelW, panelH, 14);
  g.fillStyle(0xc4a878, 0.55);
  g.fillEllipse(-60, top + 40, 280, 90);
  g.fillStyle(0xb89868, 0.4);
  g.fillEllipse(100, bot - 30, 320, 70);

  // Large black crescent / outer circle
  g.lineStyle(7, 0x1a1210, 0.92);
  g.strokeCircle(-40 + Math.sin(t * 0.2) * 4, panelY + 4, 78);
  g.lineStyle(3.5, 0x3a2a20, 0.55);
  g.strokeCircle(-40, panelY + 4, 92);

  // Red wedge / triangle clash
  g.fillStyle(0xc42828, 0.88);
  g.fillTriangle(-160, top + 18, -40, top + 70, -150, bot - 20);
  g.fillStyle(0xe84828, 0.7);
  g.fillTriangle(-140, top + 30, -55, top + 75, -130, bot - 35);

  // Yellow sun disk
  g.fillStyle(0xf0c020, 0.92);
  g.fillCircle(90 + Math.cos(t * 0.35) * 3, top + 38, 34);
  g.fillStyle(0xffe066, 0.55);
  g.fillCircle(90, top + 38, 22);
  g.lineStyle(2.5, 0x8a5010, 0.65);
  g.strokeCircle(90, top + 38, 34);

  // Blue / teal arcs
  for (let i = 0; i < 4; i++) {
    const cx = 40 + i * 28;
    const cy = panelY + 8 + (i % 2) * 10;
    g.lineStyle(4.5 - i * 0.6, i % 2 ? 0x2a6aaa : 0x1a8898, 0.75);
    g.beginPath();
    g.arc(cx, cy, 36 + i * 8, t * 0.4 + i, t * 0.4 + i + Math.PI * 1.2, false);
    g.strokePath();
  }

  // Green / violet checker shards
  const shards: [number, number, number, number, number][] = [
    [120, bot - 28, 0x2a8a48, 38, 16],
    [160, panelY + 20, 0x5a3a88, 28, 22],
    [-100, bot - 18, 0x886028, 44, 14],
    [20, top + 24, 0xc85888, 30, 12],
    [-180, panelY, 0x3a78b8, 24, 28],
  ];
  for (const [sx, sy, col, w, h] of shards) {
    g.fillStyle(col, 0.82);
    g.fillTriangle(
      sx,
      sy - h,
      sx + w,
      sy,
      sx - w * 0.35,
      sy + h * 0.45
    );
  }

  // Black lattice / grid strokes
  for (let i = 0; i < 6; i++) {
    const a0 = t * 0.15 + i * 0.9;
    g.lineStyle(2.2, 0x1a1210, 0.55);
    g.lineBetween(
      -hw + 30 + Math.cos(a0) * 40,
      top + 20 + i * 18,
      hw - 40 + Math.sin(a0) * 30,
      bot - 16 - i * 8
    );
  }

  // Small accent circles
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(-20, top + 50, 6);
  g.fillStyle(0x1a1210, 0.9);
  g.fillCircle(50, bot - 40, 8);
  g.fillStyle(0xe82848, 0.9);
  g.fillCircle(150, panelY - 10, 5);
  g.fillStyle(0xf0c020, 0.9);
  g.fillCircle(-130, panelY + 25, 7);

  // Frame
  g.lineStyle(2.5, 0x4a3020, 0.9);
  g.strokeRoundedRect(-hw, top, panelW, panelH, 14);
  g.lineStyle(1.2, 0xc42828, 0.45);
  g.strokeRoundedRect(-hw + 4, top + 4, panelW - 8, panelH - 8, 12);
}

export function drawCompositionViiBar(
  g: Phaser.GameObjects.Graphics,
  barWidth: number,
  barHeight: number,
  barY: number,
  phase: number
): void {
  const hw = barWidth / 2;
  const hh = barHeight / 2;
  const t = phase;

  g.fillStyle(0xc8b078, 0.92);
  g.fillRoundedRect(-hw, barY - hh, barWidth, barHeight, 6);

  // Abstract color bands along the track
  for (let i = 0; i < 7; i++) {
    const x = -hw + 14 + i * ((barWidth - 28) / 6);
    const cols = [0xc42828, 0xf0c020, 0x2a6aaa, 0x1a1210, 0x2a8a48, 0x5a3a88, 0xe84828];
    g.fillStyle(cols[i % cols.length]!, 0.35 + Math.sin(t * 2 + i) * 0.08);
    g.fillRect(x - 10, barY - hh + 3, 18, barHeight - 6);
  }

  // Arc accents
  g.lineStyle(2.2, 0x1a1210, 0.5);
  g.beginPath();
  g.arc(0, barY, 40, t * 0.5, t * 0.5 + Math.PI, false);
  g.strokePath();

  g.lineStyle(2, 0xc42828, 0.65);
  g.strokeRoundedRect(-hw, barY - hh, barWidth, barHeight, 6);
}

/** Composition VII bag icon — same brush silhouette, Kandinsky tip colors. */
export function drawPaintBrushCompositionRodIcon(
  g: Phaser.GameObjects.Graphics
): void {
  drawPaintBrushRodIcon(g);
  // Overpaint tip with Composition VII palette dashes
  const IPY = 8;
  g.fillStyle(0xc42828, 0.95);
  g.fillCircle(50, 16 + IPY, 5);
  g.fillStyle(0xf0c020, 0.95);
  g.fillCircle(54, 12 + IPY, 3.5);
  g.fillStyle(0x2a6aaa, 0.95);
  g.fillCircle(47, 11 + IPY, 3);
  g.fillStyle(0x1a1210, 0.9);
  g.fillCircle(52, 20 + IPY, 2.5);
}

/** Vibrant paint colors for drops / Painted mutation. */
export const PAINT_COLORS = [
  0xff3355, 0xff6633, 0xffcc33, 0x66cc44, 0x33aaff, 0x7755ff, 0xff66cc, 0xffffff,
  0x00e5c0, 0xff2244,
];

export function rollPaintColor(): number {
  return PAINT_COLORS[Phaser.Math.Between(0, PAINT_COLORS.length - 1)]!;
}

/** Tip past club head face — line attaches here. */
export const GOLF_CLUB_TIP_T = 1.22;

export function golfClubTip(
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): { x: number; y: number } {
  return {
    x: handX + (tipX - handX) * GOLF_CLUB_TIP_T,
    y: handY + (tipY - handY) * GOLF_CLUB_TIP_T,
  };
}

/** Iron golf club — chrome shaft + angled blade head. */
export function drawGolfClubRod(
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

  // Shadow
  g.lineStyle(5, 0x000000, 0.14);
  g.lineBetween(at(0, 1.2).x, at(0, 1.2).y, at(0.95, 1.2).x, at(0.95, 1.2).y);

  // Grip
  g.lineStyle(5.5, 0x1a1a1a, 1);
  g.lineBetween(at(-0.02).x, at(-0.02).y, at(0.22).x, at(0.22).y);
  g.lineStyle(4.2, 0x2e2e2e, 1);
  g.lineBetween(at(0).x, at(0).y, at(0.2).x, at(0.2).y);
  for (let i = 0; i < 5; i++) {
    const t = 0.02 + i * 0.035;
    g.lineStyle(1.2, 0x4a4a4a, 0.7);
    const a = at(t, 2.2);
    const b = at(t, -2.2);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  // Steel shaft
  g.lineStyle(3.4, 0x6a7078, 1);
  g.lineBetween(at(0.2).x, at(0.2).y, at(0.92).x, at(0.92).y);
  g.lineStyle(2.2, 0xc0c8d0, 1);
  g.lineBetween(at(0.2, 0.6).x, at(0.2, 0.6).y, at(0.92, 0.6).x, at(0.92, 0.6).y);
  g.lineStyle(1.1, 0xe8eef4, 0.85);
  g.lineBetween(at(0.22, 1.1).x, at(0.22, 1.1).y, at(0.9, 1.1).x, at(0.9, 1.1).y);

  // Hosel
  const hosel = at(0.92);
  g.fillStyle(0x8a9098, 1);
  g.fillCircle(hosel.x, hosel.y, 2.6);
  g.fillStyle(0xd0d8e0, 1);
  g.fillCircle(hosel.x - ux, hosel.y - uy, 1.4);

  // Club head blade (angled iron face)
  const hx = hosel.x + ux * 4;
  const hy = hosel.y + uy * 4;
  const faceNx = px;
  const faceNy = py;
  g.fillStyle(0x3a4048, 1);
  g.beginPath();
  g.moveTo(hx + faceNx * 2 - ux * 2, hy + faceNy * 2 - uy * 2);
  g.lineTo(hx + faceNx * 9 + ux * 1, hy + faceNy * 9 + uy * 1);
  g.lineTo(hx + faceNx * 10 + ux * 8, hy + faceNy * 10 + uy * 8);
  g.lineTo(hx - faceNx * 1 + ux * 7, hy - faceNy * 1 + uy * 7);
  g.lineTo(hx - faceNx * 2 + ux * 1, hy - faceNy * 2 + uy * 1);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xb8c0c8, 1);
  g.beginPath();
  g.moveTo(hx + faceNx * 1.5 - ux * 0.5, hy + faceNy * 1.5 - uy * 0.5);
  g.lineTo(hx + faceNx * 8 + ux * 0.5, hy + faceNy * 8 + uy * 0.5);
  g.lineTo(hx + faceNx * 8.5 + ux * 6.5, hy + faceNy * 8.5 + uy * 6.5);
  g.lineTo(hx + faceNx * 0.5 + ux * 6, hy + faceNy * 0.5 + uy * 6);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xe8eef4, 0.9);
  g.beginPath();
  g.moveTo(hx + faceNx * 2 + ux * 1, hy + faceNy * 2 + uy * 1);
  g.lineTo(hx + faceNx * 7 + ux * 1.5, hy + faceNy * 7 + uy * 1.5);
  g.lineTo(hx + faceNx * 7.2 + ux * 5, hy + faceNy * 7.2 + uy * 5);
  g.lineTo(hx + faceNx * 2.2 + ux * 4.5, hy + faceNy * 2.2 + uy * 4.5);
  g.closePath();
  g.fillPath();
  // Score lines
  for (let i = 0; i < 4; i++) {
    const t0 = 0.15 + i * 0.18;
    const a = {
      x: hx + faceNx * (2 + t0 * 5) + ux * (1.5 + t0 * 3),
      y: hy + faceNy * (2 + t0 * 5) + uy * (1.5 + t0 * 3),
    };
    const b = {
      x: hx + faceNx * (7 + t0 * 0.5) + ux * (1.5 + t0 * 3),
      y: hy + faceNy * (7 + t0 * 0.5) + uy * (1.5 + t0 * 3),
    };
    g.lineStyle(0.8, 0x5a6068, 0.85);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }
}

/** High-quality golf course catch panel — fairway, sky, red pin flag. */
export function drawGolfCoursePanel(
  g: Phaser.GameObjects.Graphics,
  panelW: number,
  panelH: number,
  panelY: number,
  phase: number
): void {
  const hw = panelW / 2;
  const hh = panelH / 2;
  const top = panelY - hh;
  const bot = panelY + hh;
  const t = phase;

  // Sky
  g.fillStyle(0x7ec8f0, 1);
  g.fillRoundedRect(-hw, top, panelW, panelH, 14);
  g.fillStyle(0xa8dcff, 0.55);
  g.fillEllipse(-60, top + 28, 220, 70);
  g.fillStyle(0xffffff, 0.55);
  g.fillEllipse(-90 + Math.sin(t) * 8, top + 22, 70, 22);
  g.fillEllipse(-50 + Math.cos(t * 0.7) * 6, top + 28, 90, 26);
  g.fillEllipse(100, top + 20, 80, 20);
  g.fillStyle(0xfff6c8, 0.9);
  g.fillCircle(hw - 48, top + 28, 16);
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(hw - 52, top + 24, 6);

  // Distant hills
  g.fillStyle(0x5aaa48, 1);
  g.fillEllipse(-120, bot - 20, 260, 90);
  g.fillStyle(0x4a9840, 1);
  g.fillEllipse(80, bot - 14, 300, 100);

  // Fairway bands
  g.fillStyle(0x6ec85a, 1);
  g.fillRoundedRect(-hw + 4, bot - 52, panelW - 8, 48, 10);
  g.fillStyle(0x5ab848, 0.7);
  for (let i = 0; i < 7; i++) {
    const y = bot - 48 + i * 6;
    g.fillRect(-hw + 8, y, panelW - 16, 3);
  }
  g.fillStyle(0x8ae070, 0.55);
  g.fillEllipse(20, bot - 28, 180, 28);
  g.fillStyle(0x3a8828, 0.35);
  g.fillEllipse(-100, bot - 22, 100, 18);

  // Green mound + hole
  g.fillStyle(0x4aaa38, 1);
  g.fillEllipse(hw - 90, bot - 36, 88, 36);
  g.fillStyle(0x3a9028, 1);
  g.fillEllipse(hw - 90, bot - 34, 60, 22);
  g.fillStyle(0x1a1a1a, 0.85);
  g.fillCircle(hw - 90, bot - 34, 4.5);
  g.fillStyle(0x0a0a0a, 1);
  g.fillCircle(hw - 90, bot - 34, 2.8);

  // Flagstick + red pennant
  const fx = hw - 90;
  const fy = bot - 34;
  g.lineStyle(2.2, 0xe8e0d0, 1);
  g.lineBetween(fx, fy, fx, fy - 52);
  g.fillStyle(0xe8e0d0, 1);
  g.fillCircle(fx, fy - 52, 2);
  const flap = Math.sin(t * 3.2) * 3;
  g.fillStyle(0xe82828, 1);
  g.beginPath();
  g.moveTo(fx, fy - 50);
  g.lineTo(fx + 22 + flap, fy - 42);
  g.lineTo(fx, fy - 34);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xff6060, 0.9);
  g.beginPath();
  g.moveTo(fx, fy - 48);
  g.lineTo(fx + 14 + flap * 0.6, fy - 42);
  g.lineTo(fx, fy - 37);
  g.closePath();
  g.fillPath();

  // Soft frame
  g.lineStyle(2.5, 0x2a5a20, 0.55);
  g.strokeRoundedRect(-hw, top, panelW, panelH, 14);
}

export function drawGolfCourseBar(
  g: Phaser.GameObjects.Graphics,
  barWidth: number,
  barHeight: number,
  barY: number,
  _phase: number
): void {
  const hw = barWidth / 2;
  const hh = barHeight / 2;
  g.fillStyle(0x5aaa48, 0.55);
  g.fillRoundedRect(-hw, barY - hh, barWidth, barHeight, 6);
  g.fillStyle(0x6ec85a, 0.4);
  g.fillRoundedRect(-hw + 2, barY - hh + 2, barWidth - 4, barHeight * 0.45, 4);
  g.lineStyle(2, 0x2a6a20, 0.65);
  g.strokeRoundedRect(-hw, barY - hh, barWidth, barHeight, 6);
}

