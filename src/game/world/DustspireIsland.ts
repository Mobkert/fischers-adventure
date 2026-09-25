import Phaser from "phaser";
import type { NightAmbient } from "./NightAmbient";

/** High-detail sand floor tile for Dustspire walkways. */
export function generateDustspireFloorTexture(scene: Phaser.Scene): void {
  const key = "dust_sand_floor";
  // Never remove while ground tiles may already reference this key — that
  // blanks the WebGL renderer mid-create.
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const w = 64;
  const h = 32;
  g.clear();
  // Base sand
  g.fillStyle(0xd8b878);
  g.fillRect(0, 0, w, h);
  // Warm / cool grain bands
  g.fillStyle(0xe8c890, 0.55);
  g.fillRect(0, 0, w, 8);
  g.fillStyle(0xc4a060, 0.45);
  g.fillRect(0, 14, w, 6);
  g.fillStyle(0xb89050, 0.35);
  g.fillRect(0, 24, w, 8);
  // Ripple strokes
  g.lineStyle(1, 0xe8d4a0, 0.4);
  for (let i = 0; i < 5; i++) {
    const y = 4 + i * 6;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(12, y - 1);
    g.lineTo(28, y + 1);
    g.lineTo(44, y - 1);
    g.lineTo(64, y);
    g.strokePath();
  }
  // Specks / pebbles
  g.fillStyle(0xa88848, 0.55);
  g.fillCircle(8, 10, 1.2);
  g.fillCircle(22, 20, 1.5);
  g.fillCircle(40, 7, 1);
  g.fillCircle(52, 18, 1.3);
  g.fillCircle(16, 26, 1.1);
  g.fillStyle(0xf0e0b0, 0.5);
  g.fillCircle(30, 12, 0.9);
  g.fillCircle(48, 26, 1);
  g.fillCircle(60, 9, 0.8);
  // Soft edge shadow
  g.fillStyle(0x000000, 0.06);
  g.fillRect(0, h - 3, w, 3);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Very high-detail oasis palm variants. */
export function generateDustspirePalmTextures(scene: Phaser.Scene): void {
  const keys = ["dust_palm_a", "dust_palm_b", "dust_palm_c"] as const;
  if (keys.every((k) => scene.textures.exists(k))) return;
  for (const k of keys) {
    if (scene.textures.exists(k)) scene.textures.remove(k);
  }
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  const drawFrond = (
    cx: number,
    cy: number,
    angleDeg: number,
    len: number,
    droop: number,
    dark: boolean
  ) => {
    const rad = (angleDeg * Math.PI) / 180;
    const tipX = cx + Math.cos(rad) * len;
    const tipY = cy + Math.sin(rad) * len + droop;
    const midX = cx + Math.cos(rad) * (len * 0.55);
    const midY = cy + Math.sin(rad) * (len * 0.45) + droop * 0.35;
    // Stem
    g.lineStyle(2.2, dark ? 0x3a6a28 : 0x4a8a38, 0.95);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(midX, midY);
    g.lineTo(tipX, tipY);
    g.strokePath();
    // Leaflet pairs along frond
    const steps = 9;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const lx = cx + (tipX - cx) * t;
      const ly = cy + (tipY - cy) * t;
      const spread = 10 + (1 - t) * 16;
      const nx = -Math.sin(rad) * spread;
      const ny = Math.cos(rad) * spread * 0.35;
      g.lineStyle(
        1.4,
        dark
          ? i % 2 === 0
            ? 0x2f6b30
            : 0x3a8038
          : i % 2 === 0
            ? 0x5aaa48
            : 0x6ec058,
        0.9 - t * 0.25
      );
      g.beginPath();
      g.moveTo(lx, ly);
      g.lineTo(lx + nx, ly + ny + 2);
      g.strokePath();
      g.beginPath();
      g.moveTo(lx, ly);
      g.lineTo(lx - nx, ly + ny + 2);
      g.strokePath();
      // Leaf tip highlight
      if (i % 3 === 0) {
        g.fillStyle(0x9ad878, 0.45);
        g.fillCircle(lx + nx * 0.6, ly + ny * 0.5, 1.2);
      }
    }
    // Tip cluster
    g.fillStyle(dark ? 0x3a8038 : 0x6ec058, 0.7);
    g.fillEllipse(tipX, tipY, 8, 5);
  };

  const drawTrunk = (cx: number, baseY: number, h: number, lean: number) => {
    // Root flare
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, baseY - 2, 28, 10);
    g.fillStyle(0x6a4a28);
    g.fillEllipse(cx, baseY - 4, 22, 8);
    g.fillStyle(0x8a6840);
    g.fillEllipse(cx - 6, baseY - 5, 8, 5);
    g.fillEllipse(cx + 7, baseY - 5, 7, 4);
    // Segmented trunk
    const segs = 11;
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs;
      const t1 = (i + 1) / segs;
      const y0 = baseY - h * t0;
      const y1 = baseY - h * t1;
      const x0 = cx + lean * t0 * t0;
      const x1 = cx + lean * t1 * t1;
      const w0 = 11 - t0 * 5;
      const w1 = 11 - t1 * 5;
      g.fillStyle(i % 2 === 0 ? 0xb89058 : 0xa87848);
      g.fillTriangle(x0 - w0, y0, x0 + w0, y0, x1 + w1, y1);
      g.fillTriangle(x0 - w0, y0, x1 + w1, y1, x1 - w1, y1);
      // Ring scar
      g.lineStyle(1, 0x6a4828, 0.55);
      g.lineBetween(x0 - w0 + 1, y0, x0 + w0 - 1, y0);
      // Bark notch highlight
      g.fillStyle(0xd4b078, 0.35);
      g.fillRect(x0 - w0 * 0.3, y0 - 4, 3, 5);
    }
    // Crown collar
    const topX = cx + lean;
    const topY = baseY - h;
    g.fillStyle(0x5a8a38);
    g.fillEllipse(topX, topY + 4, 16, 10);
    g.fillStyle(0x3a6828);
    g.fillEllipse(topX, topY + 2, 10, 6);
    // Dates / nuts
    g.fillStyle(0x8a5030);
    g.fillCircle(topX - 6, topY + 10, 3);
    g.fillCircle(topX + 5, topY + 12, 2.5);
    g.fillCircle(topX, topY + 14, 2.8);
    g.fillStyle(0xc87040);
    g.fillCircle(topX - 6, topY + 9, 1.5);
    g.fillCircle(topX + 5, topY + 11, 1.2);
  };

  // Palm A — tall classic
  {
    const w = 200;
    const h = 260;
    const cx = w / 2;
    g.clear();
    drawTrunk(cx, h - 4, 168, 10);
    const crownY = h - 4 - 168;
    const crownX = cx + 10;
    const fronds: [number, number, number, boolean][] = [
      [-110, 78, 28, true],
      [-70, 72, 18, false],
      [-30, 68, 8, true],
      [20, 70, 10, false],
      [65, 74, 20, true],
      [105, 80, 32, false],
      [-95, 88, 42, false],
      [90, 90, 48, true],
      [-50, 58, 4, false],
      [45, 56, 2, true],
      [0, 52, -2, false],
    ];
    for (const [ang, len, droop, dark] of fronds) {
      drawFrond(crownX, crownY, ang, len, droop, dark);
    }
    g.generateTexture("dust_palm_a", w, h);
  }

  // Palm B — leaning, fuller crown
  {
    const w = 220;
    const h = 240;
    const cx = w / 2 - 8;
    g.clear();
    drawTrunk(cx, h - 4, 150, -22);
    const crownY = h - 4 - 150;
    const crownX = cx - 22;
    const fronds: [number, number, number, boolean][] = [
      [-130, 82, 34, true],
      [-95, 76, 22, false],
      [-55, 70, 12, true],
      [-15, 66, 6, false],
      [25, 68, 10, true],
      [70, 76, 24, false],
      [110, 84, 36, true],
      [-115, 94, 50, false],
      [100, 96, 52, true],
      [-40, 54, 0, false],
      [40, 52, 2, true],
      [5, 48, -4, false],
      [-80, 62, 16, true],
    ];
    for (const [ang, len, droop, dark] of fronds) {
      drawFrond(crownX, crownY, ang, len, droop, dark);
    }
    g.generateTexture("dust_palm_b", w, h);
  }

  // Palm C — shorter twin-lean with dense canopy
  {
    const w = 190;
    const h = 220;
    const cx = w / 2;
    g.clear();
    drawTrunk(cx, h - 4, 132, 16);
    const crownY = h - 4 - 132;
    const crownX = cx + 16;
    const fronds: [number, number, number, boolean][] = [
      [-100, 70, 26, true],
      [-60, 64, 14, false],
      [-20, 60, 6, true],
      [25, 62, 8, false],
      [65, 68, 18, true],
      [100, 76, 30, false],
      [-85, 82, 40, false],
      [85, 86, 44, true],
      [0, 50, -2, false],
      [-40, 54, 4, true],
      [45, 52, 2, false],
    ];
    for (const [ang, len, droop, dark] of fronds) {
      drawFrond(crownX, crownY, ang, len, droop, dark);
    }
    g.generateTexture("dust_palm_c", w, h);
  }

  g.destroy();
}

/** High-detail cactus textures. */
export function generateDustspireCactusTextures(scene: Phaser.Scene): void {
  const keys = ["dust_cactus_a", "dust_cactus_b", "dust_cactus_c"] as const;
  if (keys.every((k) => scene.textures.exists(k))) return;
  for (const k of keys) {
    if (scene.textures.exists(k)) scene.textures.remove(k);
  }
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  const spines = (x: number, y: number, h: number, w: number) => {
    for (let i = 0; i < 8; i++) {
      const sy = y + 6 + i * ((h - 12) / 8);
      g.lineStyle(1, 0xe8e0c8, 0.7);
      g.lineBetween(x - w * 0.45, sy, x - w * 0.45 - 5, sy - 2);
      g.lineBetween(x + w * 0.45, sy + 2, x + w * 0.45 + 5, sy);
    }
  };

  const column = (cx: number, baseY: number, hh: number, ww: number) => {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(cx, baseY, ww + 8, 8);
    // Body
    g.fillStyle(0x3a7a40);
    g.fillRoundedRect(cx - ww / 2, baseY - hh, ww, hh, ww * 0.4);
    g.fillStyle(0x4a9a50);
    g.fillRoundedRect(cx - ww / 2 + 2, baseY - hh + 2, ww * 0.35, hh - 4, 4);
    g.fillStyle(0x2a5a30);
    g.fillRoundedRect(cx + ww * 0.15, baseY - hh + 4, ww * 0.28, hh - 8, 3);
    // Ribs
    g.lineStyle(1.2, 0x2f6b38, 0.55);
    for (let i = -1; i <= 1; i++) {
      g.lineBetween(cx + i * (ww * 0.28), baseY - hh + 6, cx + i * (ww * 0.28), baseY - 4);
    }
    spines(cx, baseY - hh, hh, ww);
    // Flower bud tip
    g.fillStyle(0xe87890);
    g.fillCircle(cx, baseY - hh - 2, 3.5);
    g.fillStyle(0xfff0a0);
    g.fillCircle(cx, baseY - hh - 2, 1.5);
  };

  // Tall saguaro
  {
    const w = 72;
    const h = 110;
    g.clear();
    column(w / 2, h - 4, 90, 18);
    // Arms
    g.fillStyle(0x3a7a40);
    g.fillRoundedRect(10, 42, 22, 12, 5);
    g.fillRoundedRect(10, 28, 12, 28, 6);
    g.fillStyle(0x4a9a50);
    g.fillRect(12, 30, 4, 24);
    spines(16, 28, 28, 12);
    g.fillStyle(0x3a7a40);
    g.fillRoundedRect(40, 50, 22, 12, 5);
    g.fillRoundedRect(50, 36, 12, 28, 6);
    g.fillStyle(0x4a9a50);
    g.fillRect(52, 38, 4, 24);
    spines(56, 36, 28, 12);
    g.fillStyle(0xe87890);
    g.fillCircle(16, 26, 2.5);
    g.fillCircle(56, 34, 2.5);
    g.generateTexture("dust_cactus_a", w, h);
  }

  // Barrel cactus
  {
    const w = 56;
    const h = 58;
    g.clear();
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(w / 2, h - 2, 36, 8);
    g.fillStyle(0x3a7a40);
    g.fillEllipse(w / 2, h - 18, 34, 36);
    g.fillStyle(0x4a9a50);
    g.fillEllipse(w / 2 - 4, h - 22, 18, 22);
    g.fillStyle(0x2a5a30);
    g.fillEllipse(w / 2 + 8, h - 16, 12, 20);
    for (let i = 0; i < 6; i++) {
      const ang = -70 + i * 28;
      const rad = (ang * Math.PI) / 180;
      g.lineStyle(1, 0xe8e0c8, 0.75);
      const ox = w / 2 + Math.cos(rad) * 14;
      const oy = h - 20 + Math.sin(rad) * 12;
      g.lineBetween(ox, oy, ox + Math.cos(rad) * 7, oy + Math.sin(rad) * 5);
    }
    g.fillStyle(0xe87050);
    g.fillCircle(w / 2, h - 36, 4);
    g.fillStyle(0xffd080);
    g.fillCircle(w / 2, h - 36, 2);
    g.generateTexture("dust_cactus_b", w, h);
  }

  // Cluster prickly pear
  {
    const w = 70;
    const h = 72;
    g.clear();
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(w / 2, h - 2, 40, 8);
    const pads: [number, number, number, number][] = [
      [w / 2, h - 18, 22, 18],
      [w / 2 - 16, h - 36, 18, 16],
      [w / 2 + 14, h - 40, 18, 16],
      [w / 2 - 4, h - 54, 14, 14],
      [w / 2 + 18, h - 56, 12, 12],
    ];
    for (const [px, py, pw, ph] of pads) {
      g.fillStyle(0x3a8040);
      g.fillEllipse(px, py, pw, ph);
      g.fillStyle(0x5aaa50, 0.55);
      g.fillEllipse(px - 3, py - 2, pw * 0.5, ph * 0.5);
      g.fillStyle(0xe8e0c8, 0.7);
      g.fillCircle(px - 4, py - 2, 1);
      g.fillCircle(px + 5, py + 3, 1);
      g.fillCircle(px + 2, py - 5, 0.8);
    }
    g.fillStyle(0xe05070);
    g.fillCircle(w / 2 - 4, h - 60, 2.5);
    g.fillCircle(w / 2 + 18, h - 62, 2);
    g.generateTexture("dust_cactus_c", w, h);
  }

  g.destroy();
}

/** Desert adobe / sandstone house textures unique to Dustspire. */
export function generateDustspireHouseTextures(scene: Phaser.Scene): void {
  const keys = [
    "dust_house_adobe",
    "dust_house_dome",
    "dust_house_tower",
    "dust_house_bazaar",
    "dust_house_arch",
    "dust_house_tent",
    "dust_house_well",
    "dust_house_spire",
  ] as const;
  if (keys.every((k) => scene.textures.exists(k))) return;
  for (const k of keys) {
    if (scene.textures.exists(k)) scene.textures.remove(k);
  }
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  const shadow = (w: number, h: number) => {
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(w / 2, h - 2, w * 0.76, 12);
  };
  const sandPlinth = (x: number, y: number, w: number, hh: number) => {
    g.fillStyle(0xb89058);
    g.fillRect(x, y, w, hh);
    g.fillStyle(0xd4b078);
    g.fillRect(x, y, w, 3);
    g.fillStyle(0x8a6840);
    g.fillRect(x, y + hh - 3, w, 3);
    for (let px = x + 4; px < x + w - 4; px += 9) {
      g.fillStyle(0xc8a868, 0.7);
      g.fillRect(px, y + 4, 6, hh - 8);
      g.lineStyle(1, 0x6a4828, 0.35);
      g.strokeRect(px, y + 4, 6, hh - 8);
    }
  };
  const adobeWall = (
    x: number,
    y: number,
    w: number,
    h: number,
    base = 0xd4b078
  ) => {
    g.fillStyle(base);
    g.fillRect(x, y, w, h);
    // Brick courses
    for (let row = 0; row < Math.floor(h / 8); row++) {
      const yy = y + row * 8;
      g.lineStyle(1, 0xb89058, 0.35);
      g.lineBetween(x, yy, x + w, yy);
      const offset = row % 2 === 0 ? 0 : 8;
      for (let bx = x + offset; bx < x + w; bx += 16) {
        g.lineStyle(1, 0xa87848, 0.28);
        g.lineBetween(bx, yy, bx, Math.min(yy + 8, y + h));
      }
    }
    // Sun-bleached highlight
    g.fillStyle(0xf0e0b8, 0.22);
    g.fillRect(x + 4, y + 4, Math.max(8, w * 0.18), h - 8);
    // Shadow edge
    g.fillStyle(0x000000, 0.1);
    g.fillRect(x + w - 8, y, 8, h);
  };
  const coolWin = (x: number, y: number, ww: number, hh: number) => {
    g.fillStyle(0xe8d4a8);
    g.fillRect(x - 3, y - 3, ww + 6, hh + 8);
    g.fillStyle(0xc8b080);
    g.fillRect(x - 3, y + hh + 2, ww + 6, 4);
    g.fillStyle(0x142028);
    g.fillRect(x, y, ww, hh);
    g.fillStyle(0x3ab8d8, 0.65);
    g.fillRect(x + 2, y + 2, (ww - 5) / 2, (hh - 5) / 2);
    g.fillRect(x + ww / 2 + 1, y + 2, (ww - 5) / 2, (hh - 5) / 2);
    g.fillRect(x + 2, y + hh / 2 + 1, (ww - 5) / 2, (hh - 5) / 2);
    g.fillRect(x + ww / 2 + 1, y + hh / 2 + 1, (ww - 5) / 2, (hh - 5) / 2);
    g.fillStyle(0xc8f0ff, 0.4);
    g.fillRect(x + 3, y + 3, 4, 3);
    g.lineStyle(1.5, 0xd0b878, 1);
    g.strokeRect(x, y, ww, hh);
    g.lineBetween(x + ww / 2, y, x + ww / 2, y + hh);
    g.lineBetween(x, y + hh / 2, x + ww, y + hh / 2);
    // Flower box
    g.fillStyle(0x5c4030);
    g.fillRect(x - 2, y + hh + 3, ww + 4, 5);
    g.fillStyle(0xe85d75);
    g.fillCircle(x + 4, y + hh + 2, 2);
    g.fillStyle(0xf4a261);
    g.fillCircle(x + ww / 2, y + hh + 1, 2);
    g.fillStyle(0x2a9d8f);
    g.fillCircle(x + ww - 4, y + hh + 2, 2);
  };
  const carvedDoor = (x: number, y: number, ww: number, hh: number) => {
    g.fillStyle(0x8a6a38);
    g.fillRoundedRect(x - 3, y - 3, ww + 6, hh + 5, 4);
    g.fillStyle(0x5c4020);
    g.fillRect(x, y, ww, hh);
    g.fillStyle(0x3a2810);
    g.fillRect(x + 3, y + 4, ww - 6, hh - 8);
    g.lineStyle(1, 0xc4a060, 0.85);
    g.strokeRoundedRect(x + 2, y + 2, ww - 4, hh - 6, 3);
    g.lineBetween(x + ww / 2, y + 6, x + ww / 2, y + hh - 6);
    for (let i = 1; i < 4; i++) {
      g.lineBetween(x + 5, y + (hh * i) / 4, x + ww - 5, y + (hh * i) / 4);
    }
    // Carved diamond
    g.fillStyle(0xc4a060, 0.5);
    g.fillTriangle(
      x + ww / 2,
      y + hh * 0.35,
      x + ww / 2 - 5,
      y + hh * 0.45,
      x + ww / 2 + 5,
      y + hh * 0.45
    );
    g.fillStyle(0xe8c878);
    g.fillCircle(x + ww - 8, y + hh / 2, 2.5);
    g.fillStyle(0x8a6a40);
    g.fillCircle(x + ww - 8, y + hh / 2, 1.2);
  };
  const clayRoof = (x: number, y: number, w: number, rows: number) => {
    for (let r = 0; r < rows; r++) {
      g.fillStyle(r % 2 === 0 ? 0xb87040 : 0xa06030);
      g.fillRect(x, y + r * 5, w, 5);
      for (let t = 0; t < Math.floor(w / 10); t++) {
        g.fillStyle(0xd49058, 0.45);
        g.fillEllipse(x + 5 + t * 10, y + r * 5 + 2, 8, 4);
      }
    }
  };

  // 1 — Flat-roof adobe
  {
    const w = 168;
    const h = 180;
    g.clear();
    shadow(w, h);
    sandPlinth(12, h - 18, w - 24, 18);
    adobeWall(16, 52, w - 32, h - 70);
    clayRoof(12, 42, w - 24, 3);
    g.fillStyle(0x8a6840);
    g.fillRect(10, 36, w - 20, 8);
    g.fillStyle(0xc8a868);
    for (let i = 0; i < 7; i++) g.fillRect(16 + i * 20, 38, 12, 4);
    // Parapet notches
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0xd4b078);
      g.fillRect(18 + i * 24, 28, 14, 10);
      g.fillStyle(0xb89058);
      g.fillRect(18 + i * 24, 28, 14, 2);
    }
    coolWin(34, 78, 24, 28);
    coolWin(w - 58, 78, 24, 28);
    carvedDoor(w / 2 - 15, h - 74, 30, 56);
    // Chimney
    g.fillStyle(0xa06040);
    g.fillRect(w - 44, 18, 16, 32);
    g.fillStyle(0x6a4030);
    g.fillRect(w - 46, 14, 20, 7);
    g.fillStyle(0x888888, 0.3);
    g.fillCircle(w - 36, 10, 7);
    g.generateTexture("dust_house_adobe", w, h);
  }

  // 2 — Domed oasis house
  {
    const w = 160;
    const h = 190;
    g.clear();
    shadow(w, h);
    sandPlinth(14, h - 18, w - 28, 18);
    adobeWall(26, 86, w - 52, h - 104, 0xc8a060);
    // Dome layers
    g.fillStyle(0xb88848);
    g.fillEllipse(w / 2, 88, w - 36, 78);
    g.fillStyle(0xe0c080);
    g.fillEllipse(w / 2, 82, w - 48, 68);
    g.fillStyle(0xf0d8a0, 0.55);
    g.fillEllipse(w / 2 - 10, 70, 40, 32);
    g.fillStyle(0xd4b070);
    g.fillEllipse(w / 2, 48, 26, 16);
    g.fillStyle(0xe8c878);
    g.fillEllipse(w / 2, 42, 12, 8);
    // Dome tile arcs
    g.lineStyle(1.2, 0xa87848, 0.4);
    for (let i = 0; i < 4; i++) {
      g.strokeEllipse(w / 2, 88 - i * 8, w - 44 - i * 10, 70 - i * 12);
    }
    coolWin(38, 108, 20, 24);
    coolWin(w - 58, 108, 20, 24);
    carvedDoor(w / 2 - 13, h - 70, 26, 52);
    g.fillStyle(0x2a8a6a);
    g.fillEllipse(20, h - 26, 14, 10);
    g.fillEllipse(w - 20, h - 24, 12, 9);
    g.fillStyle(0x4aba80);
    g.fillCircle(20, h - 30, 4);
    g.fillCircle(w - 20, h - 28, 3.5);
    g.generateTexture("dust_house_dome", w, h);
  }

  // 3 — Watchtower
  {
    const w = 128;
    const h = 230;
    g.clear();
    shadow(w, h);
    sandPlinth(26, h - 16, w - 52, 16);
    adobeWall(36, 48, w - 72, h - 64, 0xb89058);
    // Upper deck
    g.fillStyle(0xd4b070);
    g.fillRect(30, 40, w - 60, 16);
    g.fillStyle(0x8a6840);
    g.fillRect(26, 32, w - 52, 10);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0xc8a868);
      g.fillRect(30 + i * 14, 18, 10, 16);
      g.fillStyle(0xa87848);
      g.fillRect(30 + i * 14, 18, 10, 3);
    }
    coolWin(w / 2 - 11, 78, 22, 26);
    coolWin(w / 2 - 11, 122, 22, 26);
    carvedDoor(w / 2 - 13, h - 66, 26, 50);
    g.fillStyle(0xffe8a0, 0.5);
    g.fillCircle(w / 2, 14, 10);
    g.fillStyle(0xe8c878);
    g.fillCircle(w / 2, 14, 5);
    g.generateTexture("dust_house_tower", w, h);
  }

  // 4 — Bazaar stall house
  {
    const w = 190;
    const h = 168;
    g.clear();
    shadow(w, h);
    sandPlinth(8, h - 16, w - 16, 16);
    adobeWall(14, 64, w - 28, h - 80, 0xd0a868);
    // Peak roof
    g.fillStyle(0xa04030);
    g.fillTriangle(4, 68, w / 2, 14, w - 4, 68);
    g.fillStyle(0xd06040);
    g.fillTriangle(18, 68, w / 2, 26, w - 18, 68);
    // Roof tile lines
    g.lineStyle(1, 0x802828, 0.4);
    for (let i = 0; i < 5; i++) {
      const yy = 30 + i * 8;
      g.lineBetween(20 + i * 6, yy, w - 20 - i * 6, yy);
    }
    g.fillStyle(0xf0d090);
    g.fillRect(20, 66, w - 40, 8);
    // Striped awning
    for (let i = 0; i < 7; i++) {
      g.fillStyle(i % 2 === 0 ? 0xe8a040 : 0xc84830);
      g.fillRect(26 + i * 20, 74, 18, 20);
      g.fillStyle(0x000000, 0.12);
      g.fillRect(26 + i * 20, 90, 18, 4);
    }
    coolWin(30, 106, 22, 24);
    carvedDoor(w / 2 - 15, h - 68, 30, 52);
    coolWin(w - 52, 106, 22, 24);
    g.fillStyle(0xa06030);
    g.fillRect(w - 50, 36, 18, 28);
    g.fillStyle(0x6a4020);
    g.fillRect(w - 52, 32, 22, 6);
    g.generateTexture("dust_house_bazaar", w, h);
  }

  // 5 — Arch courtyard house
  {
    const w = 178;
    const h = 184;
    g.clear();
    shadow(w, h);
    sandPlinth(10, h - 18, w - 20, 18);
    adobeWall(18, 54, w - 36, h - 72, 0xc8a878);
    clayRoof(12, 44, w - 24, 3);
    g.fillStyle(0xe8d0a0);
    g.fillRect(12, 38, w - 24, 10);
    // Central arch with depth
    g.fillStyle(0x2a2218);
    g.fillRect(w / 2 - 24, h - 84, 48, 66);
    g.fillStyle(0xc8a878);
    g.fillCircle(w / 2, h - 84, 24);
    g.fillStyle(0x1a1810);
    g.fillCircle(w / 2, h - 84, 17);
    g.fillRect(w / 2 - 17, h - 84, 34, 66);
    // Arch trim
    g.lineStyle(2, 0xe8d0a0, 0.7);
    g.strokeCircle(w / 2, h - 84, 24);
    coolWin(32, 80, 20, 24);
    coolWin(w - 52, 80, 20, 24);
    g.fillStyle(0x2a9a70);
    g.fillEllipse(w / 2, h - 18, 32, 12);
    g.fillStyle(0x4aba80);
    g.fillCircle(w / 2 - 6, h - 24, 4);
    g.fillCircle(w / 2 + 8, h - 22, 3.5);
    g.generateTexture("dust_house_arch", w, h);
  }

  // 6 — Nomad pavilion
  {
    const w = 168;
    const h = 158;
    g.clear();
    shadow(w, h);
    sandPlinth(18, h - 14, w - 36, 14);
    // Canvas tent
    g.fillStyle(0xc06030);
    g.fillTriangle(8, h - 52, w / 2, 16, w - 8, h - 52);
    g.fillStyle(0xe88850);
    g.fillTriangle(24, h - 52, w / 2, 32, w - 24, h - 52);
    g.fillStyle(0xf0b070, 0.4);
    g.fillTriangle(40, h - 52, w / 2, 44, w - 40, h - 52);
    // Stripe bands
    g.lineStyle(2, 0xa04020, 0.45);
    g.lineBetween(30, 50, w - 30, 50);
    g.lineBetween(24, 70, w - 24, 70);
    g.lineBetween(18, 90, w - 18, 90);
    // Center pole
    g.fillStyle(0x6a4020);
    g.fillRect(w / 2 - 3, 14, 6, h - 28);
    g.fillStyle(0xc4a060);
    g.fillCircle(w / 2, 12, 5);
    g.fillStyle(0xe8c890);
    g.fillRect(28, h - 56, w - 56, 42);
    g.fillStyle(0xc07040);
    g.fillRect(34, h - 50, w - 68, 8);
    carvedDoor(w / 2 - 13, h - 60, 26, 46);
    g.generateTexture("dust_house_tent", w, h);
  }

  // 7 — Well house
  {
    const w = 150;
    const h = 172;
    g.clear();
    shadow(w, h);
    sandPlinth(16, h - 16, w - 32, 16);
    adobeWall(28, 58, w - 56, h - 74, 0xb89868);
    clayRoof(22, 48, w - 44, 2);
    g.fillStyle(0x8a7048);
    g.fillRect(18, 40, w - 36, 10);
    coolWin(40, 82, 20, 22);
    carvedDoor(w / 2 - 12, h - 64, 24, 48);
    // Stone well
    g.fillStyle(0x7a7870);
    g.fillEllipse(w - 34, h - 26, 32, 16);
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 === 0 ? 0x8a8880 : 0x6a6860);
      g.fillRect(w - 48 + (i % 4) * 8, h - 40 + Math.floor(i / 4) * 8, 7, 7);
    }
    g.fillStyle(0x2a4050);
    g.fillEllipse(w - 34, h - 30, 18, 9);
    g.fillStyle(0x3a90b0, 0.5);
    g.fillEllipse(w - 34, h - 31, 12, 5);
    g.fillStyle(0x6a6050);
    g.fillRect(w - 48, h - 62, 5, 32);
    g.fillRect(w - 26, h - 62, 5, 32);
    g.fillStyle(0xa09070);
    g.fillRect(w - 50, h - 66, 30, 6);
    g.fillStyle(0xc4a060);
    g.fillRect(w - 36, h - 64, 3, 28);
    g.generateTexture("dust_house_well", w, h);
  }

  // 8 — Sandstone spire shrine
  {
    const w = 140;
    const h = 236;
    g.clear();
    shadow(w, h);
    sandPlinth(24, h - 16, w - 48, 16);
    adobeWall(38, 78, w - 76, h - 94, 0xc8a870);
    // Pyramid crown
    g.fillStyle(0xb88850);
    g.fillTriangle(22, 84, w / 2, 8, w - 22, 84);
    g.fillStyle(0xe0c090);
    g.fillTriangle(36, 84, w / 2, 24, w - 36, 84);
    g.fillStyle(0xf0d8a8, 0.5);
    g.fillTriangle(48, 84, w / 2, 40, w - 48, 84);
    // Stepped bands
    g.fillStyle(0xa87848);
    g.fillRect(32, 78, w - 64, 8);
    g.fillRect(40, 70, w - 80, 8);
    coolWin(w / 2 - 10, 108, 20, 24);
    carvedDoor(w / 2 - 13, h - 68, 26, 52);
    g.fillStyle(0xffe8a0, 0.45);
    g.fillCircle(w / 2, 18, 14);
    g.fillStyle(0xe8c878);
    g.fillCircle(w / 2, 18, 5);
    g.generateTexture("dust_house_spire", w, h);
  }

  g.destroy();
}

export type DustRiverPort = {
  id: string;
  landX: number;
  dockLeft: number;
  dockRight: number;
  boatX: number;
  waterL: number;
  waterR: number;
  label: string;
};

/**
 * High-detail desert island with an inland river and boat docks on both banks.
 */
export function placeDustspireIsland(
  scene: Phaser.Scene,
  groundY: number,
  left: number,
  right: number,
  riverLeft: number,
  riverRight: number,
  westDock: number,
  eastDock: number,
  _night?: NightAmbient
): { riverPorts: DustRiverPort[] } {
  generateDustspireFloorTexture(scene);
  generateDustspireHouseTextures(scene);
  generateDustspirePalmTextures(scene);
  generateDustspireCactusTextures(scene);

  const depth = 3;
  const mid = (left + right) / 2;
  const houseY = groundY;
  const westMid = (left + riverLeft) / 2;
  const eastMid = (riverRight + right) / 2;

  // —— Distant dunes ——
  const dunes = scene.add.graphics().setScrollFactor(1).setDepth(0);
  const base = groundY - 8;
  dunes.fillStyle(0xc8a060, 0.55);
  dunes.fillTriangle(mid - 900, base, mid - 200, 200, mid + 500, base);
  dunes.fillStyle(0xd4b078, 0.5);
  dunes.fillTriangle(mid - 600, base, mid + 100, 170, mid + 780, base);
  dunes.fillStyle(0xe0c090, 0.42);
  dunes.fillTriangle(mid - 400, base, mid - 40, 210, mid + 360, base);
  dunes.fillStyle(0xb88850, 0.35);
  dunes.fillTriangle(mid + 200, base, mid + 520, 230, mid + 900, base);
  dunes.fillStyle(0xffe8b0, 0.12);
  dunes.fillEllipse(mid - 120, 280, 420, 36);
  dunes.fillEllipse(mid + 280, 300, 360, 28);

  for (let i = 0; i < 18; i++) {
    const mote = scene.add
      .circle(
        left + 80 + i * 175,
        groundY - 40 - (i % 5) * 22,
        1.2 + (i % 3) * 0.6,
        0xf0d8a0,
        0.35
      )
      .setDepth(1)
      .setScrollFactor(1);
    scene.tweens.add({
      targets: mote,
      x: mote.x + 30 + (i % 4) * 10,
      y: mote.y - 20,
      alpha: 0.08,
      duration: 2800 + i * 120,
      delay: i * 90,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  for (let i = 0; i < 8; i++) {
    scene.add
      .image(left + 140 + i * 380, 42 + (i % 3) * 14, "cloud")
      .setScrollFactor(0.88)
      .setTint(0xffe8c8)
      .setAlpha(0.32 + (i % 3) * 0.06)
      .setDepth(0)
      .setScale(0.5 + (i % 3) * 0.1);
  }

  // —— Detailed sand floor (tiled) ——
  const tileFloor = (x0: number, x1: number) => {
    for (let x = x0; x < x1; x += 64) {
      const tile = scene.add
        .image(x + 32, groundY + 2, "dust_sand_floor")
        .setDepth(2.4)
        .setOrigin(0.5, 0);
      if ((Math.floor(x / 64) + Math.floor(x0 / 64)) % 2 === 1) {
        tile.setFlipX(true);
      }
    }
  };
  tileFloor(left, riverLeft);
  tileFloor(riverRight, right);

  // Bank lips with stone
  const lips = scene.add.graphics().setDepth(2.5);
  lips.fillStyle(0xc4a060, 1);
  lips.fillRect(riverLeft - 12, groundY - 12, 14, 30);
  lips.fillRect(riverRight - 2, groundY - 12, 14, 30);
  lips.fillStyle(0xa88850);
  for (let i = 0; i < 4; i++) {
    lips.fillRect(riverLeft - 10, groundY - 8 + i * 7, 10, 5);
    lips.fillRect(riverRight, groundY - 8 + i * 7, 10, 5);
  }

  // —— Inland river ——
  const riverW = riverRight - riverLeft;
  const water = scene.add.graphics().setDepth(4);
  water.fillStyle(0x3a9ab8, 0.5);
  water.fillRect(riverLeft, groundY, riverW, 48);
  water.fillStyle(0x2a7898, 0.75);
  water.fillRect(riverLeft, groundY + 40, riverW, 120);
  water.fillStyle(0x1a5878, 0.9);
  water.fillRect(riverLeft, groundY + 140, riverW, 160);
  water.fillStyle(0x0e3850, 0.96);
  water.fillRect(riverLeft, groundY + 280, riverW, 200);
  water.fillStyle(0x071e30, 0.98);
  water.fillRect(riverLeft, groundY + 460, riverW, 280);
  water.lineStyle(1.5, 0x7ec8e0, 0.28);
  for (let i = 0; i < 10; i++) {
    const y = groundY + 8 + i * 14;
    water.strokeEllipse(riverLeft + riverW / 2, y, riverW - 40 - i * 8, 10);
  }

  const banks = scene.add.graphics().setDepth(depth + 0.3);
  for (let x = riverLeft + 20; x < riverRight - 20; x += 48) {
    banks.fillStyle(0x4a8a50, 0.75);
    banks.fillRect(x, groundY - 20, 3, 20);
    banks.fillStyle(0x6ab060, 0.6);
    banks.fillEllipse(x + 1, groundY - 22, 16, 9);
    banks.fillStyle(0x8ad078, 0.4);
    banks.fillCircle(x - 4, groundY - 24, 2.5);
    banks.fillCircle(x + 6, groundY - 23, 2);
  }

  // —— Ocean + river docks (planks flush to shore, deep pilings like Ashencast) ——
  const posts = scene.add.graphics().setDepth(4.5);
  const postDepth = 480;
  const drawPost = (x: number) => {
    posts.fillStyle(0x2a1a10);
    posts.fillRect(x - 3, groundY, 6, postDepth);
    posts.fillStyle(0x8a6840);
    posts.fillRect(x - 3, groundY, 2, postDepth);
    posts.fillStyle(0xb89058, 0.7);
    posts.fillRect(x - 4, groundY - 4, 8, 6);
    posts.fillStyle(0x1a1008, 0.45);
    posts.fillRect(x - 4, groundY + 10, 8, 5);
  };

  /** Lay planks so the walkway fully bridges [fromX → toX] with no shore gap. */
  const layDock = (fromX: number, toX: number, tint = 0xb88850) => {
    const left = Math.min(fromX, toX);
    const right = Math.max(fromX, toX);
    const step = 28;
    // Start half a plank in so the tip is covered; keep placing until past the far edge
    for (let x = left + 10; x <= right + 6; x += step) {
      scene.add
        .image(x, groundY, "dock")
        .setDepth(5)
        .setOrigin(0.5, 0)
        .setTint(tint);
      drawPost(x + 8);
    }
    // Shore-join plank so the dock visually meets the island floor
    const joinX = fromX < toX ? right - 6 : left + 6;
    scene.add
      .image(joinX, groundY, "dock")
      .setDepth(5.1)
      .setOrigin(0.5, 0)
      .setTint(tint);
  };

  layDock(westDock, left);
  layDock(right, eastDock);

  const riverPorts: DustRiverPort[] = [
    {
      id: "dust-river-west",
      landX: riverLeft - 70,
      dockLeft: riverLeft - 110,
      dockRight: riverLeft + 30,
      boatX: riverLeft + 50,
      waterL: riverLeft,
      waterR: riverRight,
      label: "Dustspire West Bank",
    },
    {
      id: "dust-river-east",
      landX: riverRight + 70,
      dockLeft: riverRight - 30,
      dockRight: riverRight + 110,
      boatX: riverRight - 50,
      waterL: riverLeft,
      waterR: riverRight,
      label: "Dustspire East Bank",
    },
  ];

  for (const port of riverPorts) {
    layDock(port.dockLeft, port.dockRight, 0xa87840);
    scene.add
      .text(port.landX, groundY - 92, port.label, {
        fontFamily: "Georgia, serif",
        fontSize: "11px",
        color: "#e8d4a0",
        stroke: "#3a2810",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(depth + 3)
      .setAlpha(0.85);
  }

  // —— Houses (spaced ≥220px so façades never overlap) ——
  const place = (x: number, key: string, scale = 0.9) => {
    scene.add
      .image(x, houseY, key)
      .setDepth(depth + 0.55)
      .setOrigin(0.5, 1)
      .setScale(scale);
  };

  // West bank (~1240px shore) — ≥230px centers so façades never overlap
  place(left + 240, "dust_house_tent", 0.86);
  place(left + 480, "dust_house_bazaar", 0.9);
  place(left + 720, "dust_house_adobe", 0.9);
  place(left + 960, "dust_house_well", 0.84);
  place(left + 1200, "dust_house_dome", 0.88);

  // East bank (~1160px shore)
  place(riverRight + 200, "dust_house_arch", 0.9);
  place(riverRight + 450, "dust_house_spire", 0.88);
  place(riverRight + 720, "dust_house_tower", 0.86);
  place(right - 240, "dust_house_adobe", 0.88);

  // —— High-detail palms along the oasis ——
  const palms: { x: number; key: string; scale: number }[] = [
    { x: riverLeft - 150, key: "dust_palm_a", scale: 0.92 },
    { x: riverLeft - 40, key: "dust_palm_b", scale: 0.85 },
    { x: riverRight + 50, key: "dust_palm_c", scale: 0.9 },
    { x: riverRight + 160, key: "dust_palm_a", scale: 0.8 },
    { x: westMid + 200, key: "dust_palm_b", scale: 0.78 },
    { x: eastMid - 200, key: "dust_palm_c", scale: 0.82 },
  ];
  for (const p of palms) {
    scene.add
      .image(p.x, groundY + 2, p.key)
      .setDepth(depth + 0.7)
      .setOrigin(0.5, 1)
      .setScale(p.scale);
  }

  // —— Cacti ——
  const cacti: { x: number; key: string; scale: number }[] = [
    { x: left + 160, key: "dust_cactus_a", scale: 0.95 },
    { x: left + 420, key: "dust_cactus_b", scale: 1 },
    { x: westMid - 320, key: "dust_cactus_c", scale: 0.95 },
    { x: westMid + 300, key: "dust_cactus_a", scale: 0.88 },
    { x: eastMid - 320, key: "dust_cactus_b", scale: 1 },
    { x: eastMid + 320, key: "dust_cactus_c", scale: 0.92 },
    { x: right - 160, key: "dust_cactus_a", scale: 0.9 },
    { x: right - 400, key: "dust_cactus_c", scale: 0.88 },
  ];
  for (const c of cacti) {
    scene.add
      .image(c.x, groundY + 2, c.key)
      .setDepth(depth + 0.45)
      .setOrigin(0.5, 1)
      .setScale(c.scale);
  }

  // —— Market crates / pottery ——
  const cargo = scene.add.graphics().setDepth(depth + 2);
  const pot = (x: number, y: number, r: number) => {
    cargo.fillStyle(0xb87040);
    cargo.fillEllipse(x, y, r * 2, r * 1.6);
    cargo.fillStyle(0xd49058);
    cargo.fillEllipse(x, y - r * 0.4, r * 1.2, r * 0.7);
    cargo.fillStyle(0x8a5030);
    cargo.fillEllipse(x, y - r * 0.7, r * 0.7, r * 0.35);
    cargo.fillStyle(0xe8c878, 0.5);
    cargo.fillEllipse(x - r * 0.2, y - r * 0.5, r * 0.35, r * 0.2);
  };
  const crate = (x: number, y: number, w: number, h: number) => {
    cargo.fillStyle(0xa87840);
    cargo.fillRect(x, y, w, h);
    cargo.fillStyle(0xc89858);
    cargo.fillRect(x + 2, y + 2, w - 4, 3);
    cargo.fillStyle(0x6a4828);
    cargo.fillRect(x + w / 2 - 1, y, 2, h);
    cargo.lineStyle(1, 0x5a3818, 0.4);
    cargo.strokeRect(x, y, w, h);
  };
  crate(westMid - 40, groundY - 30, 24, 18);
  crate(westMid - 12, groundY - 24, 20, 14);
  pot(westMid + 200, groundY - 16, 10);
  pot(westMid + 222, groundY - 14, 8);
  crate(eastMid + 40, groundY - 28, 26, 16);
  pot(eastMid - 200, groundY - 15, 9);
  pot(eastMid - 178, groundY - 13, 7);

  for (const lx of [
    left + 340,
    westMid - 40,
    riverLeft - 90,
    riverRight + 90,
    eastMid + 40,
    right - 300,
  ]) {
    const lamp = scene.add.graphics().setDepth(depth + 2.2);
    lamp.fillStyle(0x3a2a18);
    lamp.fillRect(lx - 2, groundY - 74, 4, 74);
    lamp.fillStyle(0xffc878, 0.95);
    lamp.fillCircle(lx, groundY - 82, 8);
    const glow = scene.add
      .circle(lx, groundY - 82, 20, 0xffd090, 0.2)
      .setDepth(depth + 2);
    scene.tweens.add({
      targets: glow,
      alpha: 0.07,
      scale: 1.3,
      duration: 1000 + Math.abs(lx % 180),
      yoyo: true,
      repeat: -1,
    });
  }

  scene.add
    .text(left + 180, groundY - 110, "Dustspire Island", {
      fontFamily: "Georgia, serif",
      fontSize: "15px",
      color: "#f0e0b8",
      stroke: "#4a3018",
      strokeThickness: 4,
    })
    .setOrigin(0, 1)
    .setDepth(depth + 3)
    .setAlpha(0.9);

  return { riverPorts };
}
