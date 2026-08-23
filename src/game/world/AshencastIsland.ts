import Phaser from "phaser";

/** Five hanging Ashencast trees — twisted trunks, 3–5 drooping limbs. */
export function generateAshencastTreeTextures(scene: Phaser.Scene): void {
  const keys = [
    "ashen_tree_a",
    "ashen_tree_b",
    "ashen_tree_c",
    "ashen_tree_d",
    "ashen_tree_e",
  ] as const;
  for (const k of keys) {
    if (scene.textures.exists(k)) scene.textures.remove(k);
  }
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  type Limb = { x: number; y: number; dx: number; len: number; droop: number };
  const variants: { key: string; limbs: Limb[]; canopy: number[][] }[] = [
    {
      key: "ashen_tree_a",
      limbs: [
        { x: -8, y: 88, dx: -48, len: 70, droop: 55 },
        { x: 6, y: 82, dx: 42, len: 62, droop: 48 },
        { x: -2, y: 74, dx: -28, len: 50, droop: 70 },
      ],
      canopy: [
        [-20, 78, 22],
        [18, 74, 20],
        [0, 66, 18],
      ],
    },
    {
      key: "ashen_tree_b",
      limbs: [
        { x: -10, y: 92, dx: -55, len: 78, droop: 62 },
        { x: 8, y: 86, dx: 50, len: 72, droop: 58 },
        { x: -4, y: 78, dx: -36, len: 58, droop: 75 },
        { x: 4, y: 74, dx: 30, len: 52, droop: 68 },
      ],
      canopy: [
        [-28, 80, 24],
        [24, 76, 22],
        [-6, 68, 20],
        [12, 64, 16],
      ],
    },
    {
      key: "ashen_tree_c",
      limbs: [
        { x: -6, y: 86, dx: -40, len: 64, droop: 50 },
        { x: 10, y: 82, dx: 46, len: 68, droop: 72 },
        { x: 0, y: 74, dx: -22, len: 44, droop: 60 },
        { x: 2, y: 70, dx: 26, len: 48, droop: 80 },
        { x: -12, y: 94, dx: -32, len: 40, droop: 45 },
      ],
      canopy: [
        [-22, 76, 20],
        [20, 72, 22],
        [0, 64, 18],
        [-34, 84, 14],
        [36, 80, 15],
      ],
    },
    {
      key: "ashen_tree_d",
      limbs: [
        { x: -14, y: 90, dx: -58, len: 82, droop: 70 },
        { x: 12, y: 86, dx: 54, len: 76, droop: 64 },
        { x: -2, y: 78, dx: 18, len: 40, droop: 90 },
        { x: 0, y: 74, dx: -16, len: 36, droop: 85 },
      ],
      canopy: [
        [-30, 78, 26],
        [28, 74, 24],
        [0, 66, 20],
      ],
    },
    {
      key: "ashen_tree_e",
      limbs: [
        { x: -8, y: 90, dx: -44, len: 66, droop: 58 },
        { x: 8, y: 86, dx: 38, len: 60, droop: 52 },
        { x: -4, y: 78, dx: -50, len: 74, droop: 78 },
        { x: 6, y: 74, dx: 48, len: 70, droop: 82 },
        { x: 0, y: 68, dx: 8, len: 42, droop: 95 },
      ],
      canopy: [
        [-26, 76, 22],
        [24, 72, 21],
        [-8, 64, 17],
        [10, 62, 16],
        [0, 70, 14],
      ],
    },
  ];

  for (const v of variants) {
    g.clear();
    const tw = 160;
    const th = 260;
    const cx = tw / 2;
    // Shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(cx, th - 6, 90, 16);
    // Flared roots
    g.fillStyle(0x3a2818);
    g.fillTriangle(cx - 8, th - 80, cx - 36, th - 4, cx + 4, th - 8);
    g.fillTriangle(cx + 8, th - 80, cx + 38, th - 4, cx - 2, th - 8);
    // Twisted trunk — runs up into the canopy so leaves sit on the wood
    const trunkTop = 52;
    g.fillStyle(0x4a3420);
    g.fillRect(cx - 9, trunkTop, 18, th - trunkTop - 4);
    g.fillStyle(0x2a1c10);
    g.fillRect(cx - 9, trunkTop, 6, th - trunkTop - 4);
    g.fillStyle(0x5a4430);
    g.fillRect(cx + 2, trunkTop + 20, 4, 90);
    // Crown flare where canopy attaches
    g.fillStyle(0x3a2818);
    g.fillTriangle(cx - 10, trunkTop + 8, cx - 22, trunkTop + 28, cx + 4, trunkTop + 22);
    g.fillTriangle(cx + 10, trunkTop + 8, cx + 24, trunkTop + 28, cx - 2, trunkTop + 22);
    g.fillStyle(0x4a3420);
    g.fillEllipse(cx, trunkTop + 14, 28, 16);
    // Bark notches
    g.fillStyle(0x2a1c10, 0.55);
    for (let i = 0; i < 9; i++) {
      g.fillRect(cx - 8 + (i % 2) * 10, trunkTop + 14 + i * 18, 8, 2);
    }

    // Limbs + hanging fronds
    for (const limb of v.limbs) {
      const sx = cx + limb.x;
      const sy = limb.y;
      const ex = sx + limb.dx;
      const ey = sy + 10;
      // Branch wood
      g.lineStyle(5, 0x3a2818, 1);
      g.lineBetween(sx, sy, ex, ey);
      g.lineStyle(3, 0x5a4430, 0.9);
      g.lineBetween(sx, sy - 1, ex, ey - 1);
      // Drooping secondary twigs
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;
      g.lineStyle(2.5, 0x3a2818, 0.95);
      g.lineBetween(midX, midY, midX + limb.dx * 0.25, midY + limb.droop * 0.45);
      g.lineBetween(ex, ey, ex + limb.dx * 0.15, ey + limb.droop * 0.55);
      // Hanging scorched foliage strands
      g.lineStyle(2, 0x8a5030, 0.85);
      for (let s = 0; s < 4; s++) {
        const t = 0.2 + s * 0.2;
        const hx = sx + (ex - sx) * t;
        const hy = sy + (ey - sy) * t;
        const hang = limb.droop * (0.55 + (s % 3) * 0.12);
        g.lineBetween(hx, hy, hx + (limb.dx > 0 ? 4 : -4), hy + hang);
        g.fillStyle(0xc86838, 0.75);
        g.fillCircle(hx + (limb.dx > 0 ? 4 : -4), hy + hang, 3 + (s % 2));
        g.fillStyle(0xe88848, 0.45);
        g.fillCircle(hx + (limb.dx > 0 ? 3 : -3), hy + hang - 4, 2);
      }
    }

    // Warm canopy clumps seated on the trunk crown
    for (const [ox, oy, r] of v.canopy) {
      g.fillStyle(0x6a3820, 0.95);
      g.fillCircle(cx + ox, oy, r);
      g.fillStyle(0xa85830, 0.85);
      g.fillCircle(cx + ox - 4, oy - 4, r * 0.65);
      g.fillStyle(0xd87840, 0.45);
      g.fillCircle(cx + ox + 3, oy - 6, r * 0.35);
      // Ember tips
      g.fillStyle(0xff6633, 0.4);
      g.fillCircle(cx + ox - 2, oy - r * 0.4, 2.5);
    }

    g.generateTexture(v.key, tw, th);
  }

  g.destroy();
}

/** Unique volcanic Ashencast buildings — high-detail, no black tower. */
export function generateAshencastHouseTextures(scene: Phaser.Scene): void {
  const keys = [
    "ashen_house_tower", // remove legacy if present
    "ashen_house_kiln",
    "ashen_house_adobe",
    "ashen_house_slate",
    "ashen_house_round",
    "ashen_house_step",
    "ashen_house_warehouse",
    "ashen_house_gable",
    "ashen_house_lantern",
  ] as const;
  for (const k of keys) {
    if (scene.textures.exists(k)) scene.textures.remove(k);
  }
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  const shadow = (w: number, h: number, spread = 0.78) => {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(w / 2, h - 3, w * spread, 12);
  };
  const plinth = (x: number, y: number, w: number, hh: number) => {
    g.fillStyle(0x6a5a50);
    g.fillRect(x, y, w, hh);
    g.fillStyle(0x8a7a70);
    for (let px = x + 4; px < x + w - 6; px += 12) {
      g.fillRect(px, y + 2, 9, 5);
      g.fillStyle(0x5a4a40);
      g.fillRect(px + 2, y + hh - 7, 8, 5);
      g.fillStyle(0x8a7a70);
    }
  };
  const emberWin = (
    x: number,
    y: number,
    ww: number,
    hh: number,
    flower = false
  ) => {
    g.fillStyle(0xd8c8b0);
    g.fillRect(x - 3, y - 3, ww + 6, hh + 8);
    g.fillStyle(0x1a1410);
    g.fillRect(x, y, ww, hh);
    g.fillStyle(0xff9955, 0.78);
    g.fillRect(x + 2, y + 2, (ww - 5) / 2, (hh - 5) / 2);
    g.fillRect(x + ww / 2 + 1, y + 2, (ww - 5) / 2, (hh - 5) / 2);
    g.fillRect(x + 2, y + hh / 2 + 1, (ww - 5) / 2, (hh - 5) / 2);
    g.fillRect(x + ww / 2 + 1, y + hh / 2 + 1, (ww - 5) / 2, (hh - 5) / 2);
    g.fillStyle(0xffe0a0, 0.35);
    g.fillRect(x + 3, y + 3, 5, 4);
    g.lineStyle(1.5, 0xe8dcc8, 1);
    g.strokeRect(x, y, ww, hh);
    g.lineBetween(x + ww / 2, y, x + ww / 2, y + hh);
    g.lineBetween(x, y + hh / 2, x + ww, y + hh / 2);
    g.fillStyle(0xc8b8a0);
    g.fillRect(x - 4, y + hh, ww + 8, 4);
    if (flower) {
      g.fillStyle(0x5c3a21);
      g.fillRect(x - 2, y + hh + 2, ww + 4, 5);
      g.fillStyle(0xe85d75);
      g.fillCircle(x + 4, y + hh + 1, 2.5);
      g.fillStyle(0xf4a261);
      g.fillCircle(x + ww / 2, y + hh, 2.5);
      g.fillStyle(0x2a9d8f);
      g.fillCircle(x + ww - 4, y + hh + 1, 2.5);
    }
  };
  const woodDoor = (x: number, y: number, ww: number, hh: number) => {
    g.fillStyle(0x5c4030);
    g.fillRoundedRect(x - 3, y - 3, ww + 6, hh + 5, 3);
    g.fillStyle(0x3a2418);
    g.fillRect(x, y, ww, hh);
    g.fillStyle(0x2a1810);
    g.fillRect(x + 3, y + 4, ww - 6, hh - 8);
    g.lineStyle(1, 0x6a4a30, 0.7);
    g.lineBetween(x + ww / 2, y + 4, x + ww / 2, y + hh - 4);
    for (let i = 1; i < 4; i++) {
      g.lineBetween(x + 4, y + (hh * i) / 4, x + ww - 4, y + (hh * i) / 4);
    }
    g.fillStyle(0xc4a86a);
    g.fillCircle(x + ww - 8, y + hh / 2, 2.5);
    g.fillStyle(0x8a6a40);
    g.fillCircle(x + ww - 8, y + hh / 2, 1.2);
  };
  const chimney = (x: number, y: number, smoke = true) => {
    g.fillStyle(0x4a3a38);
    g.fillRect(x, y, 18, 34);
    g.fillStyle(0x2a2220);
    g.fillRect(x - 2, y - 4, 22, 8);
    g.fillStyle(0x5a4a48);
    g.fillRect(x + 3, y + 6, 4, 20);
    if (smoke) {
      g.fillStyle(0xff6633, 0.4);
      g.fillCircle(x + 9, y - 6, 6);
      g.fillStyle(0x888888, 0.25);
      g.fillCircle(x + 11, y - 14, 8);
    }
  };

  // 1 — Copper kiln cottage (replaces black tower)
  {
    const w = 168;
    const h = 188;
    g.clear();
    shadow(w, h);
    plinth(16, h - 18, w - 32, 18);
    g.fillStyle(0xb87850);
    g.fillRect(22, 58, w - 44, h - 76);
    g.fillStyle(0x986040);
    g.fillRect(22, 58, 12, h - 76);
    g.fillStyle(0xc88860, 0.35);
    g.fillRect(w - 40, 58, 14, h - 76);
    // Warm plaster patches
    g.fillStyle(0xd4a070, 0.4);
    g.fillRect(48, 90, 28, 18);
    g.fillRect(100, 130, 22, 14);
    // Clay tile roof
    g.fillStyle(0x7a3020);
    g.fillTriangle(8, 62, w / 2, 12, w - 8, 62);
    g.fillStyle(0x9a4830);
    g.fillTriangle(18, 60, w / 2, 22, w - 18, 60);
    g.fillStyle(0xb85838);
    g.fillTriangle(28, 58, w / 2, 30, w - 28, 58);
    g.lineStyle(1, 0x5a2010, 0.5);
    for (let i = 0; i < 7; i++) {
      const t = i / 7;
      g.lineBetween(12 + t * (w / 2 - 14), 58 - t * 42, w - 12 - t * (w / 2 - 14), 58 - t * 42);
    }
    // Domed kiln annex
    g.fillStyle(0x8a5040);
    g.fillEllipse(38, h - 50, 44, 56);
    g.fillStyle(0x6a3830);
    g.fillEllipse(34, h - 50, 30, 48);
    g.fillStyle(0xff6633, 0.55);
    g.fillEllipse(38, h - 72, 22, 14);
    g.fillStyle(0xffaa66, 0.35);
    g.fillCircle(38, h - 76, 6);
    emberWin(70, 78, 28, 32, true);
    emberWin(112, 78, 28, 32, true);
    woodDoor(88, h - 62, 28, 44);
    chimney(128, 28);
    // Copper pipes
    g.lineStyle(3, 0xb87333, 0.9);
    g.lineBetween(48, h - 80, 48, 70);
    g.lineBetween(48, 70, 62, 58);
    g.fillStyle(0xd49050);
    g.fillCircle(48, h - 80, 4);
    g.generateTexture("ashen_house_kiln", w, h);
  }

  // 2 — Adobe courtyard house
  {
    const w = 198;
    const h = 176;
    g.clear();
    shadow(w, h);
    plinth(12, h - 16, w - 24, 16);
    g.fillStyle(0xd4a070);
    g.fillRoundedRect(14, 54, w - 28, h - 70, 5);
    g.fillStyle(0xb88858);
    g.fillRect(14, 54, 14, h - 70);
    g.fillStyle(0xe0b888, 0.4);
    g.fillRect(w - 36, 54, 16, h - 70);
    // Adobe cracks / texture
    g.lineStyle(1, 0xa87850, 0.35);
    for (let y = 62; y < h - 24; y += 11) {
      g.lineBetween(18, y, w - 18, y);
    }
    g.fillStyle(0xc48860, 0.5);
    g.fillRect(40, 100, 20, 8);
    g.fillRect(130, 120, 24, 8);
    // Thick clay roof with ridge
    g.fillStyle(0x8a4030);
    g.fillTriangle(4, 58, w / 2, 10, w - 4, 58);
    g.fillStyle(0xa85038);
    g.fillTriangle(16, 56, w / 2, 20, w - 16, 56);
    g.fillStyle(0xc86848);
    g.fillTriangle(28, 54, w / 2, 28, w - 28, 54);
    g.fillStyle(0x6a3020);
    g.fillRect(w / 2 - 4, 14, 8, 28);
    g.lineStyle(1, 0x6a2818, 0.45);
    for (let y = 28; y < 54; y += 5) {
      g.lineBetween(20 + (y - 28) * 0.6, y, w - 20 - (y - 28) * 0.6, y);
    }
    // Arched windows
    for (const x of [32, 86, 140]) {
      g.fillStyle(0x2a1810);
      g.fillCircle(x + 14, 82, 15);
      g.fillRect(x, 82, 28, 30);
      g.fillStyle(0xff9955, 0.72);
      g.fillCircle(x + 14, 82, 11);
      g.fillRect(x + 4, 82, 20, 24);
      g.fillStyle(0xffe0a0, 0.3);
      g.fillCircle(x + 10, 78, 4);
      g.fillStyle(0xc8b8a0);
      g.fillRect(x - 2, 110, 32, 5);
      g.fillStyle(0x5c3a21);
      g.fillRect(x, 113, 28, 5);
      g.fillStyle(0xe85d75);
      g.fillCircle(x + 6, 112, 2.5);
      g.fillStyle(0x90be6d);
      g.fillCircle(x + 22, 112, 2.5);
    }
    woodDoor(84, h - 58, 32, 42);
    // Courtyard niche
    g.fillStyle(0xa87850);
    g.fillRect(24, h - 40, 20, 22);
    g.fillStyle(0xff8844, 0.5);
    g.fillCircle(34, h - 30, 5);
    chimney(150, 22);
    g.generateTexture("ashen_house_adobe", w, h);
  }

  // 3 — Slate merchant hall
  {
    const w = 220;
    const h = 182;
    g.clear();
    shadow(w, h, 0.82);
    plinth(10, h - 16, w - 20, 16);
    g.fillStyle(0x6a6058);
    g.fillRect(14, 64, w - 28, h - 80);
    g.fillStyle(0x4a443c);
    g.fillRect(14, 64, 12, h - 80);
    g.fillStyle(0x7a746c, 0.4);
    g.fillRect(w - 34, 64, 14, h - 80);
    // Ashlar
    g.lineStyle(1, 0x504840, 0.65);
    for (let y = 72; y < h - 22; y += 12) {
      g.lineBetween(16, y, w - 16, y);
      const off = ((y / 12) % 2) * 10;
      for (let x = 22 + off; x < w - 24; x += 20) {
        g.lineBetween(x, y, x, Math.min(y + 12, h - 22));
      }
    }
    g.fillStyle(0x5a544c, 0.4);
    g.fillRect(48, 88, 16, 9);
    g.fillRect(140, 110, 16, 9);
    // Layered slate roof
    g.fillStyle(0x1a2838);
    g.fillTriangle(2, 68, w / 2, 6, w - 2, 68);
    g.fillStyle(0x2c3a4a);
    g.fillTriangle(12, 66, w / 2, 14, w - 12, 66);
    g.fillStyle(0x3a4a5c);
    g.fillTriangle(22, 64, w / 2, 22, w - 22, 64);
    g.lineStyle(1, 0x1a2838, 0.55);
    for (let i = 0; i < 9; i++) {
      const t = i / 9;
      g.lineBetween(6 + t * (w / 2 - 8), 64 - t * 52, w - 6 - t * (w / 2 - 8), 64 - t * 52);
    }
    // Shop windows with goods
    for (let i = 0; i < 4; i++) {
      const x = 28 + i * 44;
      g.fillStyle(0xd8d0c0);
      g.fillRect(x - 2, 84, 36, 40);
      g.fillStyle(0x1a2430);
      g.fillRect(x, 86, 32, 34);
      g.fillStyle(0x9ec8e0, 0.75);
      g.fillRect(x + 2, 88, 13, 14);
      g.fillRect(x + 17, 88, 13, 14);
      g.fillStyle(0xc45a3a);
      g.fillRect(x + 4, 106, 8, 8);
      g.fillStyle(0xe8c85a);
      g.fillCircle(x + 22, 110, 4);
      g.lineStyle(1.5, 0xe8e0d0, 1);
      g.strokeRect(x, 86, 32, 34);
      g.lineBetween(x + 16, 86, x + 16, 120);
      g.fillStyle(0xc8c0b0);
      g.fillRect(x - 3, 120, 38, 4);
    }
    // Double door with iron
    g.fillStyle(0x3a2a18);
    g.fillRect(92, h - 58, 40, 42);
    g.fillStyle(0x2a1a10);
    g.fillRect(94, h - 54, 16, 38);
    g.fillRect(114, h - 54, 16, 38);
    g.fillStyle(0x8a8a98);
    g.fillCircle(106, h - 34, 2);
    g.fillCircle(118, h - 34, 2);
    chimney(178, 24);
    g.generateTexture("ashen_house_slate", w, h);
  }

  // 4 — Round tower annex (warm stone, not black)
  {
    const w = 186;
    const h = 200;
    g.clear();
    shadow(w, h);
    plinth(50, h - 16, 116, 16);
    g.fillStyle(0xc09068);
    g.fillRect(58, 78, 108, h - 94);
    g.fillStyle(0xa07050);
    g.fillRect(58, 78, 12, h - 94);
    g.lineStyle(1, 0x8a6040, 0.4);
    for (let y = 86; y < h - 24; y += 10) g.lineBetween(60, y, 162, y);
    g.fillStyle(0x7a4830);
    g.fillTriangle(50, 82, 112, 28, 174, 82);
    g.fillStyle(0x9a6040);
    g.fillTriangle(60, 80, 112, 38, 164, 80);
    // Warm round keep
    g.fillStyle(0xb88860);
    g.fillEllipse(44, 118, 58, 150);
    g.fillStyle(0x8a6040);
    g.fillEllipse(38, 118, 40, 138);
    g.fillStyle(0x6a4830);
    g.fillEllipse(44, 48, 54, 26);
    g.fillStyle(0x8a6850);
    g.fillEllipse(44, 46, 42, 16);
    // Ring detail on oval keep (no windows)
    g.lineStyle(1.5, 0x5a4030, 0.5);
    for (let a = 0; a < 6; a++) {
      g.strokeEllipse(44, 118, 50 - a * 2, 140 - a * 4);
    }
    emberWin(84, 96, 26, 30, true);
    emberWin(122, 96, 26, 30, true);
    woodDoor(100, h - 58, 28, 42);
    chimney(148, 36);
    g.generateTexture("ashen_house_round", w, h);
  }

  // 5 — Stepped terrace villa
  {
    const w = 196;
    const h = 192;
    g.clear();
    shadow(w, h);
    plinth(18, h - 14, w - 36, 14);
    g.fillStyle(0xc88858);
    g.fillRect(54, 96, 120, h - 110);
    g.fillStyle(0xa86840);
    g.fillRect(18, 128, 56, h - 142);
    g.fillStyle(0xd49868);
    g.fillRect(142, 64, 44, h - 78);
    g.fillStyle(0xb07048);
    g.fillRect(54, 96, 10, h - 110);
    g.fillStyle(0x8a5840);
    g.fillRect(18, 128, 8, h - 142);
    // Terrace decks with railing
    g.fillStyle(0x5c4030);
    g.fillRect(14, 122, 64, 10);
    g.fillRect(50, 90, 128, 10);
    g.fillRect(138, 58, 52, 10);
    g.fillStyle(0x8b5a2b);
    g.fillRect(16, 124, 60, 4);
    g.fillRect(52, 92, 124, 4);
    g.fillRect(140, 60, 48, 4);
    g.fillStyle(0x3a2a18);
    for (let x = 20; x < 72; x += 8) g.fillRect(x, 112, 3, 12);
    for (let x = 56; x < 170; x += 9) g.fillRect(x, 80, 3, 12);
    for (let x = 144; x < 184; x += 8) g.fillRect(x, 48, 3, 12);
    emberWin(70, 112, 22, 26, true);
    emberWin(108, 112, 22, 26, true);
    emberWin(150, 78, 20, 24, false);
    woodDoor(92, h - 54, 26, 40);
    // Ember lantern post
    g.fillStyle(0x2a2218);
    g.fillRect(168, 28, 4, 34);
    g.fillStyle(0xffaa55, 0.9);
    g.fillCircle(170, 26, 8);
    g.fillStyle(0xffe0a0, 0.3);
    g.fillCircle(170, 26, 14);
    chimney(178, 20, false);
    g.generateTexture("ashen_house_step", w, h);
  }

  // 6 — Basalt warehouse / storehouse
  {
    const w = 210;
    const h = 152;
    g.clear();
    shadow(w, h, 0.85);
    plinth(8, h - 14, w - 16, 14);
    g.fillStyle(0x5a585c);
    g.fillRect(12, 44, w - 24, h - 58);
    g.fillStyle(0x3a383c);
    g.fillRect(12, 44, 14, h - 58);
    g.fillStyle(0x6a686c, 0.35);
    g.fillRect(w - 34, 44, 14, h - 58);
    g.lineStyle(1, 0x2a282c, 0.55);
    for (let y = 52; y < h - 18; y += 11) {
      g.lineBetween(14, y, w - 14, y);
      const off = ((y / 11) % 2) * 9;
      for (let x = 20 + off; x < w - 20; x += 18) {
        g.lineBetween(x, y, x, Math.min(y + 11, h - 18));
      }
    }
    // Parapet roof
    g.fillStyle(0x2a282c);
    g.fillRect(6, 32, w - 12, 16);
    g.fillStyle(0x4a484c);
    g.fillRect(10, 36, w - 20, 10);
    g.fillStyle(0x3a383c);
    for (let x = 14; x < w - 16; x += 14) g.fillRect(x, 28, 8, 10);
    // Loading bays
    for (const x of [28, 118]) {
      g.fillStyle(0x1a1410);
      g.fillRect(x, 62, 56, h - 76);
      g.fillStyle(0x5c4030);
      g.fillRect(x + 3, 66, 22, h - 84);
      g.fillRect(x + 31, 66, 22, h - 84);
      g.lineStyle(2, 0x8a6a48, 0.7);
      g.strokeRect(x + 3, 66, 50, h - 84);
      g.fillStyle(0x8a8a98);
      g.fillCircle(x + 20, h - 40, 2.5);
      g.fillCircle(x + 42, h - 40, 2.5);
    }
    emberWin(94, 68, 18, 22, false);
    // Dock crates
    g.fillStyle(0x8b5a2b);
    g.fillRect(172, h - 40, 24, 20);
    g.fillRect(178, h - 54, 18, 14);
    g.fillStyle(0xa07040);
    g.fillRect(174, h - 38, 20, 3);
    g.generateTexture("ashen_house_warehouse", w, h);
  }

  // 7 — Ash-brick gabled home
  {
    const w = 168;
    const h = 186;
    g.clear();
    shadow(w, h);
    plinth(18, h - 16, w - 36, 16);
    g.fillStyle(0x8a5048);
    g.fillRect(24, 66, w - 48, h - 82);
    g.fillStyle(0x6a3830);
    g.fillRect(24, 66, 12, h - 82);
    g.fillStyle(0x9a6058, 0.35);
    g.fillRect(w - 42, 66, 12, h - 82);
    // Running-bond bricks
    g.lineStyle(1, 0x5a3028, 0.55);
    for (let y = 72; y < h - 22; y += 7) {
      g.lineBetween(26, y, w - 26, y);
      const off = ((y / 7) % 2) * 6;
      for (let x = 30 + off; x < w - 30; x += 12) {
        g.lineBetween(x, y, x, Math.min(y + 7, h - 22));
      }
    }
    g.fillStyle(0x6a3830, 0.45);
    g.fillRect(48, 90, 10, 5);
    g.fillRect(100, 120, 10, 5);
    g.fillRect(70, 140, 10, 5);
    // Layered gable roof
    g.fillStyle(0x3a2a20);
    g.fillTriangle(8, 70, w / 2, 14, w - 8, 70);
    g.fillStyle(0x5a4030);
    g.fillTriangle(18, 68, w / 2, 24, w - 18, 68);
    g.fillStyle(0x6a5040);
    g.fillTriangle(28, 66, w / 2, 32, w - 28, 66);
    g.lineStyle(1, 0x2a1a10, 0.45);
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      g.lineBetween(12 + t * (w / 2 - 14), 66 - t * 46, w - 12 - t * (w / 2 - 14), 66 - t * 46);
    }
    emberWin(38, 88, 28, 32, true);
    emberWin(102, 88, 28, 32, true);
    woodDoor(70, h - 60, 28, 44);
    chimney(120, 26);
    g.generateTexture("ashen_house_gable", w, h);
  }

  // 8 — Lantern inn with balcony
  {
    const w = 178;
    const h = 196;
    g.clear();
    shadow(w, h);
    plinth(16, h - 16, w - 32, 16);
    g.fillStyle(0xb88858);
    g.fillRect(20, 68, w - 40, h - 84);
    g.fillStyle(0x986840);
    g.fillRect(20, 68, 12, h - 84);
    g.fillStyle(0xc89868, 0.35);
    g.fillRect(w - 40, 68, 12, h - 84);
    g.lineStyle(1, 0x8a6040, 0.35);
    for (let y = 76; y < h - 24; y += 10) g.lineBetween(22, y, w - 22, y);
    g.fillStyle(0x4a3020);
    g.fillTriangle(6, 72, w / 2, 12, w - 6, 72);
    g.fillStyle(0x6a4830);
    g.fillTriangle(16, 70, w / 2, 22, w - 16, 70);
    g.fillStyle(0x8a6040);
    g.fillTriangle(26, 68, w / 2, 30, w - 26, 68);
    // Balcony
    g.fillStyle(0x3a2a18);
    g.fillRect(42, 112, 94, 9);
    g.fillStyle(0x5c4030);
    g.fillRect(44, 114, 90, 4);
    for (let x = 48; x < 130; x += 9) {
      g.fillStyle(0x4a3020);
      g.fillRect(x, 98, 3, 16);
    }
    emberWin(52, 76, 24, 28, true);
    emberWin(102, 76, 24, 28, true);
    // Hanging lanterns
    for (const lx of [50, 128]) {
      g.fillStyle(0x2a2218);
      g.fillRect(lx, 118, 3, 18);
      g.fillStyle(0xffcc66, 0.92);
      g.fillCircle(lx + 1, 140, 7);
      g.fillStyle(0xffaa44, 0.3);
      g.fillCircle(lx + 1, 140, 12);
    }
    woodDoor(76, h - 58, 28, 42);
    // Inn signboard
    g.fillStyle(0x5c3a21);
    g.fillRect(36, 128, 3, 20);
    g.fillStyle(0x8b5a2b);
    g.fillRoundedRect(22, 124, 34, 16, 2);
    g.fillStyle(0xffaa66, 0.6);
    g.fillCircle(39, 132, 4);
    chimney(138, 24);
    g.generateTexture("ashen_house_lantern", w, h);
  }

  g.destroy();
}

export const ASHENCAST_DOCK_PLANK_STEP = 28;
export const ASHENCAST_DOCK_PLANK_HALF = 28;

/** Walkable pier span — matches decorative plank layout in placeAshencastIsland. */
export function ashencastPierCollisionBounds(
  islandLeft: number,
  islandRight: number,
  westDock: number,
  eastDock: number
): {
  westLeft: number;
  westRight: number;
  eastLeft: number;
  eastRight: number;
} {
  const step = ASHENCAST_DOCK_PLANK_STEP;
  const half = ASHENCAST_DOCK_PLANK_HALF;
  const eastPlanks = Math.max(5, Math.floor((eastDock - islandRight) / step));
  const pad = 10;
  return {
    westLeft: westDock + 10 - half - pad,
    westRight: islandLeft,
    eastLeft: islandRight,
    eastRight: islandRight + 10 + (eastPlanks - 1) * step + half + pad,
  };
}

/**
 * Ashencast Isle — harbour (east), forge (mid), hotspring ponds (west).
 * Far west of Collectors across a long ocean gap.
 */
export function placeAshencastIsland(
  scene: Phaser.Scene,
  groundY: number,
  left: number,
  right: number,
  westDock: number,
  eastDock: number,
  springALeft: number,
  springARight: number,
  springBLeft: number,
  springBRight: number,
  anvilBuilt = false
): { forgeX: number; harbourX: number; buildAnvil: () => void } {
  generateAshencastTreeTextures(scene);
  generateAshencastHouseTextures(scene);
  const depth = 3;
  const mid = (left + right) / 2;
  const harbourX = mid + 580;
  const forgeX = mid + 40;
  const westShore = left + 110;
  const eastShore = right - 110;
  /** Feet on the walkable ground (same as starter cottages). */
  const houseY = groundY;

  // —— Distant volcanic ridges (centered on island mid, scroll with terrain) ——
  const hills = scene.add.graphics().setScrollFactor(1).setDepth(0);
  const ridgeBase = groundY - 10;
  hills.fillStyle(0x4a2010, 0.55);
  hills.fillTriangle(mid - 720, ridgeBase, mid, 168, mid + 720, ridgeBase);
  hills.fillStyle(0x6a3018, 0.5);
  hills.fillTriangle(mid - 520, ridgeBase, mid, 138, mid + 520, ridgeBase);
  hills.fillStyle(0x8a4020, 0.45);
  hills.fillTriangle(mid - 340, ridgeBase, mid, 152, mid + 340, ridgeBase);
  hills.fillStyle(0xa85028, 0.4);
  hills.fillTriangle(mid - 180, ridgeBase, mid, 178, mid + 180, ridgeBase);
  // Crater glow — centered on the main peak
  hills.fillStyle(0xff5522, 0.22);
  hills.fillEllipse(mid, 282, 130, 42);
  hills.fillStyle(0xff8844, 0.18);
  hills.fillEllipse(mid - 90, 302, 80, 28);
  hills.fillStyle(0xc45a30, 0.28);
  hills.fillEllipse(mid - 160, 338, 190, 65);
  hills.fillEllipse(mid + 160, 348, 170, 58);

  // Ember / ash haze clouds
  for (let i = 0; i < 12; i++) {
    const cloud = scene.add
      .image(left + 100 + i * 210, 36 + (i % 4) * 16, "cloud")
      .setScrollFactor(0.9)
      .setTint(i % 2 === 0 ? 0xffc8a0 : 0xffe0c0)
      .setAlpha(0.4 + (i % 3) * 0.08)
      .setDepth(0)
      .setScale(0.55 + (i % 4) * 0.12);
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + 24 + (i % 3) * 8,
      alpha: 0.18,
      duration: 11000 + i * 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Rising ember sparks over the ridge
  for (let i = 0; i < 22; i++) {
    const spark = scene.add
      .circle(
        mid - 400 + i * 38,
        groundY - 70 - (i % 6) * 18,
        1.5 + (i % 3),
        i % 2 === 0 ? 0xff6633 : 0xffaa44,
        0.55
      )
      .setDepth(1)
      .setScrollFactor(1);
    scene.tweens.add({
      targets: spark,
      y: spark.y - 55 - (i % 4) * 14,
      alpha: 0,
      duration: 1500 + i * 90,
      delay: i * 70,
      repeat: -1,
      ease: "Sine.easeOut",
      onRepeat: () => {
        spark.setY(groundY - 70 - (i % 6) * 18);
        spark.setAlpha(0.55);
      },
    });
  }

  // Scorched sand beaches
  const sand = scene.add.graphics().setDepth(depth);
  sand.fillStyle(0xd4a070, 1);
  sand.fillRect(left - 16, groundY - 8, westShore - left + 40, 24);
  sand.fillRect(eastShore - 28, groundY - 8, right - eastShore + 48, 24);
  sand.fillStyle(0xc48858, 0.95);
  for (let i = 0; i < 14; i++) {
    sand.fillEllipse(left + 28 + i * 20, groundY + 2, 34 + (i % 4) * 8, 9);
  }
  for (let i = 0; i < 14; i++) {
    sand.fillEllipse(eastShore + 10 + i * 22, groundY + 2, 36 + (i % 3) * 8, 9);
  }
  // Charcoal grit across the isle
  sand.fillStyle(0x4a3a30, 0.35);
  for (let i = 0; i < 55; i++) {
    const gx = left + 80 + ((i * 97) % (right - left - 160));
    if (gx > springALeft - 10 && gx < springARight + 10) continue;
    if (gx > springBLeft - 10 && gx < springBRight + 10) continue;
    sand.fillCircle(gx, groundY - 4 - (i % 5), 1.5 + (i % 3) * 0.5);
  }

  // Continuous scorched turf so grass covers under props / between road gaps
  const turf = scene.add.graphics().setDepth(2.85);
  const paintTurf = (x0: number, x1: number) => {
    if (x1 - x0 < 8) return;
    turf.fillStyle(0xb86840, 1);
    turf.fillRect(x0, groundY - 14, x1 - x0, 28);
    turf.fillStyle(0xc87848, 1);
    turf.fillRect(x0, groundY - 14, x1 - x0, 10);
    turf.fillStyle(0xa85838, 0.75);
    for (let x = x0 + 6; x < x1; x += 14) {
      turf.fillEllipse(x, groundY - 2, 18 + (x % 7), 7);
    }
    turf.fillStyle(0xd48858, 0.85);
    for (let x = x0 + 8; x < x1 - 4; x += 16) {
      turf.fillEllipse(x, groundY + 3, 14, 5);
    }
  };
  paintTurf(left, springALeft - 2);
  paintTurf(springARight + 2, springBLeft - 2);
  paintTurf(springBRight + 2, right);

  // Basalt / cobble road through the island (breaks at ponds)
  const road = scene.add.graphics().setDepth(depth);
  const drawRoadSeg = (x0: number, x1: number) => {
    if (x1 - x0 < 20) return;
    road.fillStyle(0x3a3230, 1);
    road.fillRect(x0, groundY - 16, x1 - x0, 18);
    road.fillStyle(0x524844, 0.85);
    road.fillRect(x0, groundY - 16, x1 - x0, 4);
    road.fillStyle(0x2a2422, 0.55);
    for (let x = x0 + 12; x < x1 - 8; x += 48) {
      road.fillRect(x, groundY - 6, 22, 2);
    }
    // Cracked cobbles
    road.fillStyle(0x48403c, 0.4);
    for (let x = x0 + 20; x < x1 - 16; x += 36) {
      road.fillRect(x, groundY - 12, 8 + (x % 5), 1);
    }
  };
  drawRoadSeg(westShore + 8, springALeft - 12);
  drawRoadSeg(springARight + 12, springBLeft - 12);
  drawRoadSeg(springBRight + 12, forgeX - 70);
  drawRoadSeg(forgeX + 70, harbourX - 120);
  drawRoadSeg(harbourX + 100, eastShore - 8);

  // —— Proper wooden docks (same language as Collectors / Frostpeak) ——
  const posts = scene.add.graphics().setDepth(5);
  const postDepth = 480;
  const drawPost = (x: number) => {
    posts.fillStyle(0x2a1a10);
    posts.fillRect(x, groundY, 6, postDepth);
    posts.fillStyle(0x6a4a28);
    posts.fillRect(x, groundY, 2, postDepth);
    posts.fillStyle(0x1a1008, 0.55);
    posts.fillRect(x - 1, groundY + 8, 8, 6);
  };
  const westPlanks = Math.max(5, Math.floor((left - westDock) / 28));
  for (let i = 0; i < westPlanks; i++) {
    scene.add
      .image(westDock + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0)
      .setTint(0x8a5a30);
    drawPost(westDock + 18 + i * 28);
  }
  const eastPlanks = Math.max(5, Math.floor((eastDock - right) / 28));
  for (let i = 0; i < eastPlanks; i++) {
    scene.add
      .image(right + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0)
      .setTint(0x8a5a30);
    drawPost(right + 18 + i * 28);
  }

  // —— Harbour buildings (unique Ashencast architecture) ——
  const harbourBuildings: { x: number; key: string; scale: number }[] = [
    { x: harbourX - 340, key: "ashen_house_warehouse", scale: 0.92 },
    { x: harbourX - 175, key: "ashen_house_slate", scale: 0.88 },
    { x: harbourX - 10, key: "ashen_house_lantern", scale: 0.9 },
    { x: harbourX + 150, key: "ashen_house_adobe", scale: 0.9 },
    { x: harbourX + 310, key: "ashen_house_kiln", scale: 0.88 },
  ];
  for (const h of harbourBuildings) {
    scene.add
      .image(h.x, houseY, h.key)
      .setDepth(depth + 0.55)
      .setOrigin(0.5, 1)
      .setScale(h.scale);
  }

  // West residential row (between springs and forge; keep clear of harbour)
  const westHouses: { x: number; key: string; scale: number }[] = [
    { x: mid - 380, key: "ashen_house_gable", scale: 0.88 },
    { x: mid - 160, key: "ashen_house_round", scale: 0.82 },
  ];
  for (const h of westHouses) {
    if (h.x > springBLeft - 50 && h.x < springBRight + 50) continue;
    if (Math.abs(h.x - forgeX) < 110) continue;
    scene.add
      .image(h.x, houseY, h.key)
      .setDepth(depth + 0.55)
      .setOrigin(0.5, 1)
      .setScale(h.scale);
  }

  // Crates, barrels, rope piles, nets (harbour cargo — no market stalls)
  const cargo = scene.add.graphics().setDepth(depth + 2);
  const crate = (x: number, y: number, w: number, h: number) => {
    cargo.fillStyle(0x8b5a2b);
    cargo.fillRect(x, y, w, h);
    cargo.fillStyle(0xa07040);
    cargo.fillRect(x + 2, y + 2, w - 4, 3);
    cargo.fillStyle(0x5c3a21);
    cargo.fillRect(x + w / 2 - 1, y, 2, h);
  };
  crate(harbourX - 260, groundY - 34, 26, 22);
  crate(harbourX - 230, groundY - 28, 22, 16);
  crate(harbourX - 248, groundY - 50, 20, 16);
  crate(harbourX + 280, groundY - 40, 30, 28);
  crate(harbourX + 290, groundY - 58, 20, 18);
  crate(harbourX + 320, groundY - 32, 24, 20);
  crate(forgeX - 200, groundY - 30, 22, 18);
  crate(forgeX + 180, groundY - 28, 26, 16);
  cargo.fillStyle(0x6a4a28);
  cargo.fillEllipse(harbourX + 340, groundY - 18, 22, 28);
  cargo.fillEllipse(harbourX + 362, groundY - 16, 18, 24);
  cargo.fillEllipse(harbourX - 300, groundY - 16, 20, 26);
  cargo.fillStyle(0x4a3020);
  cargo.fillEllipse(harbourX + 340, groundY - 26, 10, 8);
  // Fishing nets draped near pier
  cargo.lineStyle(2, 0x5a7068, 0.7);
  for (let n = 0; n < 4; n++) {
    cargo.strokeEllipse(eastShore - 30 - n * 18, groundY - 8, 28, 14 + n * 2);
  }

  // Harbour lanterns with warm glow
  for (const lx of [
    harbourX - 360,
    harbourX - 140,
    harbourX + 40,
    harbourX + 220,
    harbourX + 400,
  ]) {
    const lamp = scene.add.graphics().setDepth(depth + 2.2);
    lamp.fillStyle(0x2a2218);
    lamp.fillRect(lx - 2, groundY - 78, 4, 78);
    lamp.fillStyle(0xffaa55, 0.9);
    lamp.fillCircle(lx, groundY - 86, 9);
    const glow = scene.add
      .circle(lx, groundY - 86, 22, 0xffcc66, 0.22)
      .setDepth(depth + 2);
    scene.tweens.add({
      targets: glow,
      alpha: 0.08,
      scale: 1.25,
      duration: 900 + Math.abs(lx % 200),
      yoyo: true,
      repeat: -1,
    });
  }

  // Mooring posts on pier tips
  for (const mx of [eastDock - 20, eastDock - 50, eastDock - 80, westDock + 20, westDock + 50, westDock + 80]) {
    cargo.fillStyle(0x3a2a18);
    cargo.fillRect(mx, groundY - 28, 5, 28);
    cargo.fillStyle(0x8a6a40);
    cargo.fillCircle(mx + 2, groundY - 30, 5);
  }

  // —— Forge anvil (outline until quest complete, then solid steel) ——
  const ax = forgeX;
  const ay = groundY;
  const pad = scene.add.graphics().setDepth(depth + 1.4);
  pad.fillStyle(0x3a2a22, 0.55);
  pad.fillEllipse(ax, ay - 4, 120, 20);
  pad.fillStyle(0x2a1a14, 0.35);
  pad.fillEllipse(ax, ay - 2, 90, 12);

  const anvil = scene.add.graphics().setDepth(depth + 1.5);
  const drawAnvilOutline = (g: Phaser.GameObjects.Graphics) => {
    g.clear();
    // Outer silhouette — continuous anvil profile
    g.lineStyle(5, 0x1a1a24, 1);
    g.beginPath();
    // Horn tip → horn top → face left → face top → heel → face right
    g.moveTo(ax - 72, ay - 48);
    g.lineTo(ax - 48, ay - 62);
    g.lineTo(ax - 22, ay - 66);
    g.lineTo(ax + 48, ay - 66);
    g.lineTo(ax + 58, ay - 58);
    g.lineTo(ax + 52, ay - 44);
    g.lineTo(ax + 28, ay - 44);
    g.lineTo(ax + 22, ay - 28);
    g.lineTo(ax + 36, ay - 22);
    g.lineTo(ax + 40, ay - 8);
    g.lineTo(ax + 48, ay - 4);
    g.lineTo(ax - 40, ay - 4);
    g.lineTo(ax - 32, ay - 8);
    g.lineTo(ax - 28, ay - 22);
    g.lineTo(ax - 12, ay - 28);
    g.lineTo(ax - 8, ay - 44);
    g.lineTo(ax - 36, ay - 44);
    g.lineTo(ax - 58, ay - 40);
    g.closePath();
    g.strokePath();

    // Mid weight stroke (steel grey)
    g.lineStyle(2.5, 0x6a7080, 0.95);
    g.beginPath();
    g.moveTo(ax - 66, ay - 48);
    g.lineTo(ax - 44, ay - 58);
    g.lineTo(ax - 20, ay - 62);
    g.lineTo(ax + 44, ay - 62);
    g.lineTo(ax + 52, ay - 56);
    g.lineTo(ax + 46, ay - 46);
    g.lineTo(ax + 24, ay - 46);
    g.lineTo(ax + 18, ay - 30);
    g.lineTo(ax + 32, ay - 24);
    g.lineTo(ax + 36, ay - 10);
    g.lineTo(ax + 42, ay - 7);
    g.lineTo(ax - 36, ay - 7);
    g.lineTo(ax - 28, ay - 10);
    g.lineTo(ax - 24, ay - 24);
    g.lineTo(ax - 10, ay - 30);
    g.lineTo(ax - 6, ay - 46);
    g.lineTo(ax - 32, ay - 46);
    g.lineTo(ax - 54, ay - 42);
    g.closePath();
    g.strokePath();

    // Inner face plate + table lines
    g.lineStyle(2, 0xc8d0dc, 0.75);
    g.strokeRoundedRect(ax - 18, ay - 60, 58, 14, 2);
    g.lineBetween(ax - 14, ay - 53, ax + 36, ay - 53);
    // Waist / hardy hole hint
    g.strokeRect(ax + 4, ay - 42, 18, 12);
    g.strokeCircle(ax + 13, ay - 36, 2.5);
    // Base feet detail
    g.lineStyle(2, 0x8a909c, 0.7);
    g.strokeRect(ax - 34, ay - 12, 16, 6);
    g.strokeRect(ax + 22, ay - 12, 16, 6);
    g.lineBetween(ax - 26, ay - 6, ax - 26, ay - 4);
    g.lineBetween(ax + 30, ay - 6, ax + 30, ay - 4);
    // Rivets
    g.fillStyle(0xa8b0bc, 0.8);
    g.fillCircle(ax - 10, ay - 56, 1.6);
    g.fillCircle(ax + 28, ay - 56, 1.6);
    g.fillCircle(ax + 10, ay - 48, 1.4);
    // Ember flecks along the outline
    g.fillStyle(0xff6633, 0.55);
    g.fillCircle(ax - 50, ay - 50, 1.5);
    g.fillCircle(ax + 20, ay - 58, 1.2);
    g.fillCircle(ax + 8, ay - 20, 1.3);
  };

  const drawAnvilBuilt = (g: Phaser.GameObjects.Graphics) => {
    g.clear();
    g.fillStyle(0x3a3a48, 1);
    g.beginPath();
    g.moveTo(ax - 72, ay - 48);
    g.lineTo(ax - 48, ay - 62);
    g.lineTo(ax - 22, ay - 66);
    g.lineTo(ax + 48, ay - 66);
    g.lineTo(ax + 58, ay - 58);
    g.lineTo(ax + 52, ay - 44);
    g.lineTo(ax + 28, ay - 44);
    g.lineTo(ax + 22, ay - 28);
    g.lineTo(ax + 36, ay - 22);
    g.lineTo(ax + 40, ay - 8);
    g.lineTo(ax + 48, ay - 4);
    g.lineTo(ax - 40, ay - 4);
    g.lineTo(ax - 32, ay - 8);
    g.lineTo(ax - 28, ay - 22);
    g.lineTo(ax - 12, ay - 28);
    g.lineTo(ax - 8, ay - 44);
    g.lineTo(ax - 36, ay - 44);
    g.lineTo(ax - 58, ay - 40);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x6a7080, 1);
    g.fillRoundedRect(ax - 20, ay - 64, 64, 16, 3);
    g.fillStyle(0xa8b0c0, 0.55);
    g.fillRoundedRect(ax - 16, ay - 62, 40, 6, 2);
    g.fillStyle(0x2a2a36, 0.7);
    g.fillTriangle(ax - 70, ay - 48, ax - 46, ay - 60, ax - 36, ay - 44);
    g.fillStyle(0x2a2a34, 1);
    g.fillRect(ax + 2, ay - 44, 22, 14);
    g.fillStyle(0x1a1a22, 1);
    g.fillCircle(ax + 13, ay - 37, 3.5);
    g.fillStyle(0x4a5060, 0.8);
    g.fillCircle(ax + 12, ay - 38, 1.5);
    g.fillStyle(0x2a2a36, 1);
    g.fillRect(ax - 36, ay - 12, 18, 8);
    g.fillRect(ax + 22, ay - 12, 18, 8);
    g.fillStyle(0x1a1a24, 1);
    g.fillRect(ax - 42, ay - 4, 90, 6);
    g.fillStyle(0xc8d0dc, 0.9);
    g.fillCircle(ax - 10, ay - 56, 2);
    g.fillCircle(ax + 28, ay - 56, 2);
    g.fillCircle(ax + 10, ay - 48, 1.8);
    g.fillStyle(0xff5522, 0.65);
    g.fillCircle(ax - 40, ay - 52, 2.2);
    g.fillCircle(ax + 18, ay - 58, 1.8);
    g.fillCircle(ax + 6, ay - 22, 2);
    g.fillStyle(0xffaa66, 0.35);
    g.fillCircle(ax - 40, ay - 52, 4);
    g.fillCircle(ax + 18, ay - 58, 3.5);
    g.lineStyle(2.5, 0x1a1a24, 0.95);
    g.beginPath();
    g.moveTo(ax - 72, ay - 48);
    g.lineTo(ax - 48, ay - 62);
    g.lineTo(ax - 22, ay - 66);
    g.lineTo(ax + 48, ay - 66);
    g.lineTo(ax + 58, ay - 58);
    g.lineTo(ax + 52, ay - 44);
    g.lineTo(ax + 28, ay - 44);
    g.lineTo(ax + 22, ay - 28);
    g.lineTo(ax + 36, ay - 22);
    g.lineTo(ax + 40, ay - 8);
    g.lineTo(ax + 48, ay - 4);
    g.lineTo(ax - 40, ay - 4);
    g.lineTo(ax - 32, ay - 8);
    g.lineTo(ax - 28, ay - 22);
    g.lineTo(ax - 12, ay - 28);
    g.lineTo(ax - 8, ay - 44);
    g.lineTo(ax - 36, ay - 44);
    g.lineTo(ax - 58, ay - 40);
    g.closePath();
    g.strokePath();
  };

  let anvilPulse: Phaser.Tweens.Tween | null = null;
  const buildAnvil = () => {
    anvilPulse?.stop();
    anvilPulse = null;
    anvil.setAlpha(1);
    drawAnvilBuilt(anvil);
    ember.setFillStyle(0xff8844, 0.35);
  };

  const ember = scene.add
    .circle(ax + 8, ay - 38, 22, 0xff5522, 0.22)
    .setDepth(depth + 1.2);
  scene.tweens.add({
    targets: ember,
    alpha: 0.05,
    scale: 1.4,
    duration: 900,
    yoyo: true,
    repeat: -1,
  });

  if (anvilBuilt) {
    buildAnvil();
  } else {
    drawAnvilOutline(anvil);
    anvilPulse = scene.tweens.add({
      targets: anvil,
      alpha: 0.12,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  for (const px of [forgeX - 90, forgeX + 95, forgeX - 130, forgeX + 135]) {
    scene.add
      .image(px, groundY - 2, "rock")
      .setDepth(depth + 1)
      .setOrigin(0.5, 1)
      .setScale(0.55 + (Math.abs(px) % 5) * 0.05)
      .setTint(0x8a6050);
  }

  // —— Hotspring ponds (west) ——
  const placeSpringPond = (pl: number, pr: number) => {
    const pondW = pr - pl;
    const pondMid = (pl + pr) / 2;
    const pondDepth = 240;
    const water = scene.add.graphics().setDepth(4);

    // Deep mineral water column (swamp pond language, hot teal palette)
    water.fillStyle(0x0a3838, 0.9);
    water.fillRect(pl, groundY, pondW, pondDepth);
    water.fillStyle(0x1a6860, 0.6);
    water.fillRect(pl, groundY, pondW, 40);
    water.fillStyle(0x0c4840, 0.55);
    water.fillRect(pl, groundY + 50, pondW, 70);
    water.fillStyle(0x062828, 0.7);
    water.fillRect(pl, groundY + 120, pondW, 70);
    water.fillStyle(0x031818, 0.8);
    water.fillRect(pl, groundY + 180, pondW, 60);
    // Warm surface sheen
    water.fillStyle(0x3ab8a0, 0.35);
    water.fillRect(pl + 6, groundY + 2, pondW - 12, 16);
    water.fillStyle(0x88e8d0, 0.12);
    water.fillEllipse(pondMid, groundY + 50, pondW * 0.5, 28);
    water.fillEllipse(pondMid - pondW * 0.15, groundY + 110, pondW * 0.35, 22);

    // Mud / mineral bank lips
    water.fillStyle(0x6a5040, 0.65);
    water.fillRect(pl - 8, groundY - 3, 10, 14);
    water.fillRect(pr - 2, groundY - 3, 10, 14);

    // Surface shimmer
    for (let i = 0; i < 6; i++) {
      const strip = scene.add
        .rectangle(
          pl + 20 + i * (pondW / 6),
          groundY + 5,
          30,
          2,
          0xa8fff0,
          0.32
        )
        .setDepth(6);
      scene.tweens.add({
        targets: strip,
        alpha: 0.05,
        x: strip.x + 8,
        duration: 1600 + i * 140,
        yoyo: true,
        repeat: -1,
      });
    }

    // Steam columns
    for (let p = 0; p < 7; p++) {
      const steam = scene.add
        .circle(
          pondMid - 55 + p * 18,
          groundY - 10 - p * 2,
          6 + (p % 3),
          0xe8f8f4,
          0.34
        )
        .setDepth(depth + 2.5);
      scene.tweens.add({
        targets: steam,
        y: steam.y - 60 - p * 8,
        alpha: 0,
        scale: 2.5,
        duration: 1900 + p * 220,
        delay: p * 220,
        repeat: -1,
        ease: "Sine.easeOut",
        onRepeat: () => {
          steam.setPosition(pondMid - 55 + p * 18, groundY - 10 - p * 2);
          steam.setAlpha(0.34);
          steam.setScale(1);
        },
      });
    }

    // Footbridge planks
    const plankCount = Math.ceil(pondW / 28);
    for (let i = 0; i < plankCount; i++) {
      scene.add
        .image(pl + 14 + i * 28, groundY - 2, "dock")
        .setDepth(5)
        .setOrigin(0.5, 0.5)
        .setTint(0x6a4a28);
    }
    const rails = scene.add.graphics().setDepth(5);
    rails.fillStyle(0x3a2414);
    rails.fillRect(pl + 6, groundY - 22, 4, 20);
    rails.fillRect(pr - 10, groundY - 22, 4, 20);
    rails.fillRect(pondMid - 2, groundY - 22, 4, 20);
    rails.lineStyle(2, 0x4a3020, 0.9);
    rails.lineBetween(pl + 8, groundY - 18, pr - 8, groundY - 18);

    // Bank stones
    for (let i = 0; i < 8; i++) {
      scene.add
        .image(pl - 16 - (i % 4) * 9, groundY - 1, "rock")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.4 + (i % 3) * 0.08)
        .setTint(0x7a6858);
      scene.add
        .image(pr + 16 + (i % 4) * 9, groundY - 1, "rock")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.4 + (i % 3) * 0.08)
        .setTint(0x7a6858);
    }
  };

  placeSpringPond(springALeft, springARight);
  placeSpringPond(springBLeft, springBRight);

  // Warm scrub / ember bushes across land
  const scrub = scene.add.graphics().setDepth(depth + 0.9);
  for (let i = 0; i < 48; i++) {
    const rx = left + 120 + i * 52 + (i % 5) * 8;
    if (rx > springALeft - 24 && rx < springARight + 24) continue;
    if (rx > springBLeft - 24 && rx < springBRight + 24) continue;
    if (Math.abs(rx - forgeX) < 80) continue;
    if (Math.abs(rx - harbourX) < 200) continue;
    scrub.fillStyle(0x6a5038);
    scrub.fillEllipse(rx, groundY - 5, 14 + (i % 4) * 5, 7);
    scrub.fillStyle(0xc45a3a, 0.45);
    scrub.fillCircle(rx - 3, groundY - 12, 2.5);
    scrub.fillCircle(rx + 4, groundY - 10, 2);
    if (i % 3 === 0) {
      scrub.fillStyle(0xff6633, 0.35);
      scrub.fillCircle(rx + 1, groundY - 16, 1.5);
    }
  }

  // Dense hanging Ashencast trees (5 branch variants)
  const treeKeys = [
    "ashen_tree_a",
    "ashen_tree_b",
    "ashen_tree_c",
    "ashen_tree_d",
    "ashen_tree_e",
  ] as const;
  const treeXs: number[] = [];
  for (let x = left + 120; x < right - 120; x += 88) {
    if (x > springALeft - 55 && x < springARight + 55) continue;
    if (x > springBLeft - 55 && x < springBRight + 55) continue;
    if (Math.abs(x - forgeX) < 100) continue;
    if (Math.abs(x - harbourX) < 260) continue;
    treeXs.push(x + ((x * 11) % 34) - 17);
  }
  for (let i = 0; i < treeXs.length; i++) {
    const tx = treeXs[i]!;
    const key = treeKeys[i % treeKeys.length]!;
    scene.add
      .image(tx, groundY + 2, key)
      .setDepth(depth + 0.35)
      .setOrigin(0.5, 1)
      .setScale(0.72 + (Math.abs(tx) % 5) * 0.06);
  }

  // Pots / plants near houses (feet on ground)
  for (const hx of [...harbourBuildings.map((h) => h.x), ...westHouses.map((h) => h.x)]) {
    scene.add
      .image(hx - 52, groundY, "pot_plant_a")
      .setDepth(depth + 0.9)
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setTint(0xe0a070);
    scene.add
      .image(hx + 52, groundY, "pot_plant_b")
      .setDepth(depth + 0.9)
      .setOrigin(0.5, 1)
      .setScale(0.75)
      .setTint(0xd89060);
  }

  // Path lamps between zones
  for (const lx of [
    westShore + 80,
    (springARight + springBLeft) / 2,
    springBRight + 80,
    forgeX - 160,
    forgeX + 160,
    mid + 320,
    harbourX - 420,
  ]) {
    if (lx > springALeft && lx < springARight) continue;
    if (lx > springBLeft && lx < springBRight) continue;
    const lamp = scene.add.graphics().setDepth(depth + 1.8);
    lamp.fillStyle(0x2a2218);
    lamp.fillRect(lx - 2, groundY - 62, 4, 62);
    lamp.fillStyle(0xffcc88, 0.85);
    lamp.fillCircle(lx, groundY - 68, 7);
    const glow = scene.add
      .circle(lx, groundY - 68, 16, 0xffaa55, 0.15)
      .setDepth(depth + 1.7);
    scene.tweens.add({
      targets: glow,
      alpha: 0.05,
      duration: 1100 + (lx % 300),
      yoyo: true,
      repeat: -1,
    });
  }

  // Obsidian totems / stone markers
  const totems = scene.add.graphics().setDepth(depth + 1.5);
  for (const tx of [mid - 400, mid + 360, harbourX - 480]) {
    if (tx > springALeft && tx < springBRight) continue;
    totems.fillStyle(0x2a2228);
    totems.fillRect(tx - 8, groundY - 56, 16, 56);
    totems.fillStyle(0x3a3038);
    totems.fillTriangle(tx, groundY - 78, tx - 14, groundY - 56, tx + 14, groundY - 56);
    totems.fillStyle(0xff6633, 0.5);
    totems.fillCircle(tx, groundY - 40, 4);
  }

  // Soft ash mist at ocean joins (no area-name signage)
  for (let i = 0; i < 4; i++) {
    const mist = scene.add.graphics().setDepth(2).setAlpha(0.1 + i * 0.03);
    mist.fillStyle(0xffc8a0, 1);
    mist.fillEllipse(
      eastShore + 60 + i * 50,
      groundY - 36 - i * 14,
      140 + i * 36,
      32
    );
    scene.tweens.add({
      targets: mist,
      alpha: 0.04,
      x: mist.x + (i % 2 === 0 ? 18 : -14),
      duration: 3600 + i * 600,
      yoyo: true,
      repeat: -1,
    });
  }

  return { forgeX, harbourX, buildAnvil };
}
