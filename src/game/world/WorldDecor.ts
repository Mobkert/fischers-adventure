import Phaser from "phaser";

/** Draw a high-detail cottage (side-view friendly) into a texture. */
export function generateHouseTextures(scene: Phaser.Scene): void {
  drawCottage(scene, "house_a", {
    wall: 0xf3e2c8,
    wallShade: 0xe0c9a8,
    timber: 0x5c3a21,
    roof: 0x8b2e2e,
    roofDark: 0x6e2222,
    door: 0x6b3f22,
    trim: 0xffffff,
  });
  drawCottage(scene, "house_b", {
    wall: 0xe8f0e4,
    wallShade: 0xd0ddd0,
    timber: 0x3f2a1a,
    roof: 0x3d5a40,
    roofDark: 0x2c4030,
    door: 0x4a3424,
    trim: 0xf7f1e3,
  });
  drawCottage(scene, "house_c", {
    wall: 0xf7e8d4,
    wallShade: 0xebd4b8,
    timber: 0x4a2f1c,
    roof: 0x4a5568,
    roofDark: 0x2d3748,
    door: 0x7a4a28,
    trim: 0xfffaf0,
  });
}

interface CottagePalette {
  wall: number;
  wallShade: number;
  timber: number;
  roof: number;
  roofDark: number;
  door: number;
  trim: number;
}

function drawCottage(
  scene: Phaser.Scene,
  key: string,
  p: CottagePalette
): void {
  const w = 180;
  const h = 160;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  // Ground shadow (slightly above bottom so foundation reads on grass)
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(w / 2, h - 2, 150, 10);

  // Stone foundation flush with bottom of texture
  g.fillStyle(0x7a756c);
  g.fillRect(18, h - 20, w - 36, 20);
  g.fillStyle(0x918a7e);
  for (let x = 22; x < w - 28; x += 14) {
    g.fillRect(x, h - 18, 11, 6);
    g.fillStyle(0x6a655c);
    g.fillRect(x + 3, h - 10, 10, 6);
    g.fillStyle(0x918a7e);
  }

  // Main wall
  g.fillStyle(p.wall);
  g.fillRect(22, 48, w - 44, h - 68);
  g.fillStyle(p.wallShade);
  g.fillRect(22, 48, 8, h - 68);

  // Timber framing
  g.lineStyle(3, p.timber, 1);
  g.strokeRect(22, 48, w - 44, h - 68);
  g.lineBetween(22, 88, w - 22, 88);
  g.lineBetween(w / 2, 48, w / 2, h - 20);
  // diagonal beams
  g.lineStyle(2, p.timber, 0.85);
  g.lineBetween(22, 48, w / 2, 88);
  g.lineBetween(w - 22, 48, w / 2, 88);
  g.lineBetween(22, 88, w / 2, h - 20);
  g.lineBetween(w - 22, 88, w / 2, h - 20);

  // Roof (layered tiles)
  g.fillStyle(p.roofDark);
  g.fillTriangle(8, 54, w / 2, 8, w - 8, 54);
  g.fillStyle(p.roof);
  g.fillTriangle(16, 52, w / 2, 14, w - 16, 52);
  // tile lines
  g.lineStyle(1, p.roofDark, 0.55);
  for (let y = 22; y < 50; y += 6) {
    const t = (y - 14) / 38;
    const half = (w / 2 - 16) * t;
    g.lineBetween(w / 2 - half, y, w / 2 + half, y);
  }
  // ridge
  g.fillStyle(0x2a1a12);
  g.fillRect(w / 2 - 3, 8, 6, 10);

  // Chimney
  g.fillStyle(0x6b5b4b);
  g.fillRect(w - 52, 18, 18, 34);
  g.fillStyle(0x56463a);
  g.fillRect(w - 54, 14, 22, 8);
  // brick lines
  g.lineStyle(1, 0x4a3c32, 0.6);
  g.lineBetween(w - 52, 28, w - 34, 28);
  g.lineBetween(w - 52, 38, w - 34, 38);
  g.lineBetween(w - 43, 18, w - 43, 48);

  // Windows
  drawWindow(g, 40, 58, p.trim, true);
  drawWindow(g, w - 72, 58, p.trim, true);
  drawWindow(g, 40, 98, p.trim, false);
  drawWindow(g, w - 72, 98, p.trim, false);

  // Door
  g.fillStyle(p.door);
  g.fillRoundedRect(w / 2 - 14, h - 62, 28, 42, 3);
  g.fillStyle(0x3a2414);
  g.fillRect(w / 2 - 12, h - 60, 24, 4);
  g.fillRect(w / 2 - 12, h - 44, 24, 2);
  g.fillRect(w / 2 - 12, h - 32, 24, 2);
  // handle
  g.fillStyle(0xd4af37);
  g.fillCircle(w / 2 + 8, h - 40, 2);
  // steps sitting on foundation
  g.fillStyle(0x8a8478);
  g.fillRect(w / 2 - 18, h - 22, 36, 5);
  g.fillStyle(0x9a9488);
  g.fillRect(w / 2 - 20, h - 18, 40, 4);

  // Flower boxes under front windows
  g.fillStyle(0x5c3a21);
  g.fillRect(36, 86, 36, 6);
  g.fillRect(w - 76, 86, 36, 6);
  g.fillStyle(0xe85d75);
  g.fillCircle(44, 84, 3);
  g.fillStyle(0xf4a261);
  g.fillCircle(54, 83, 3);
  g.fillStyle(0x2a9d8f);
  g.fillCircle(64, 84, 3);
  g.fillStyle(0xe9c46a);
  g.fillCircle(w - 68, 83, 3);
  g.fillStyle(0xe76f51);
  g.fillCircle(w - 58, 84, 3);
  g.fillStyle(0x90be6d);
  g.fillCircle(w - 48, 83, 3);

  // Ivy / detail on wall
  g.fillStyle(0x3a7d44, 0.75);
  g.fillCircle(28, 70, 4);
  g.fillCircle(32, 78, 3);
  g.fillCircle(26, 86, 3);
  g.fillCircle(w - 30, 100, 4);
  g.fillCircle(w - 26, 108, 3);

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawWindow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  trim: number,
  lit: boolean
): void {
  g.fillStyle(0x2c3e50);
  g.fillRect(x, y, 28, 24);
  g.fillStyle(lit ? 0xffe8a3 : 0x7eb8d4, lit ? 0.95 : 0.7);
  g.fillRect(x + 2, y + 2, 11, 9);
  g.fillRect(x + 15, y + 2, 11, 9);
  g.fillRect(x + 2, y + 13, 11, 9);
  g.fillRect(x + 15, y + 13, 11, 9);
  g.lineStyle(2, trim, 1);
  g.strokeRect(x, y, 28, 24);
  g.lineBetween(x + 14, y, x + 14, y + 24);
  g.lineBetween(x, y + 12, x + 28, y + 12);
  // shutters
  g.fillStyle(0x3d6b4f);
  g.fillRect(x - 7, y, 6, 24);
  g.fillRect(x + 29, y, 6, 24);
  g.lineStyle(1, 0x2a4a36, 0.8);
  g.lineBetween(x - 4, y + 2, x - 4, y + 22);
  g.lineBetween(x + 32, y + 2, x + 32, y + 22);
}

export function generateTerrainTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  // Grass tile variants
  for (let v = 0; v < 4; v++) {
    g.clear();
    g.fillStyle(0x3f7d3a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a9344);
    g.fillRect(0, 0, 32, 10);
    // soil speckles
    g.fillStyle(0x2f5e2c);
    for (let i = 0; i < 10; i++) {
      const x = ((v * 17 + i * 13) % 30) + 1;
      const y = 12 + ((v * 9 + i * 7) % 18);
      g.fillRect(x, y, 2, 2);
    }
    // grass blade tips
    g.fillStyle(0x6fbf5c);
    for (let i = 0; i < 8; i++) {
      const x = ((v * 11 + i * 5) % 28) + 2;
      g.fillRect(x, 1 + (i % 3), 1, 4 + (i % 3));
    }
    g.fillStyle(0x8fd46e, 0.8);
    g.fillRect(4 + v, 2, 1, 5);
    g.fillRect(18 - v, 1, 1, 6);
    g.generateTexture(`grass_${v}`, 32, 32);
  }

  // Dirt path
  g.clear();
  g.fillStyle(0xb08968);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(0x9c734f);
  g.fillRect(2, 4, 5, 3);
  g.fillRect(14, 12, 6, 4);
  g.fillRect(22, 22, 4, 3);
  g.fillStyle(0xc4a484);
  g.fillRect(8, 18, 3, 2);
  g.fillRect(20, 6, 4, 2);
  g.generateTexture("path", 32, 32);

  // Shore sand strip
  g.clear();
  g.fillStyle(0xe8d5a3);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(0xd4c08a);
  g.fillRect(4, 8, 3, 3);
  g.fillRect(18, 20, 4, 3);
  g.fillStyle(0x3f7d3a);
  g.fillRect(0, 0, 32, 6);
  g.generateTexture("shore", 32, 32);

  // Fence segment
  g.clear();
  g.fillStyle(0x6b4423);
  g.fillRect(2, 4, 4, 28);
  g.fillRect(26, 4, 4, 28);
  g.fillRect(0, 8, 32, 3);
  g.fillRect(0, 18, 32, 3);
  g.fillStyle(0x8b5a2b);
  g.fillRect(2, 4, 4, 2);
  g.fillRect(26, 4, 4, 2);
  g.generateTexture("fence", 32, 32);

  // Tree — trunk ends at texture bottom so origin (0.5,1) sits on grass
  g.clear();
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(40, 122, 50, 10);
  g.fillStyle(0x5c3a21);
  g.fillRect(34, 68, 12, 56);
  g.fillStyle(0x4a2f18);
  g.fillRect(34, 68, 4, 56);
  // canopy layers
  g.fillStyle(0x2d6a3e);
  g.fillCircle(40, 52, 32);
  g.fillStyle(0x3d8b4f);
  g.fillCircle(28, 45, 20);
  g.fillCircle(54, 43, 22);
  g.fillStyle(0x58b368);
  g.fillCircle(40, 35, 18);
  g.fillStyle(0x7dce7a, 0.7);
  g.fillCircle(34, 31, 8);
  // roots flush with bottom edge
  g.fillStyle(0x5c3a21);
  g.fillRect(32, 120, 16, 8);
  g.generateTexture("tree", 80, 128);

  // Bush
  g.clear();
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(24, 30, 40, 8);
  g.fillStyle(0x2f6b3a);
  g.fillCircle(14, 20, 12);
  g.fillCircle(34, 18, 13);
  g.fillCircle(24, 14, 11);
  g.fillStyle(0x4c9a55);
  g.fillCircle(20, 16, 7);
  g.fillCircle(30, 14, 6);
  // berries
  g.fillStyle(0xc0392b);
  g.fillCircle(18, 18, 2);
  g.fillCircle(28, 12, 2);
  g.generateTexture("bush", 48, 36);

  // Flower cluster
  g.clear();
  const petals = [0xe74c3c, 0xf1c40f, 0x9b59b6, 0x3498db, 0xe91e63];
  for (let i = 0; i < 5; i++) {
    const fx = 6 + i * 5;
    g.fillStyle(0x2ecc71);
    g.fillRect(fx + 1, 8, 2, 8);
    g.fillStyle(petals[i]);
    g.fillCircle(fx + 2, 6, 3);
    g.fillStyle(0xfff3bf);
    g.fillCircle(fx + 2, 6, 1);
  }
  g.generateTexture("flowers", 32, 16);

  // Wooden dock plank
  g.clear();
  g.fillStyle(0x8b5a2b);
  g.fillRect(0, 0, 32, 16);
  g.fillStyle(0x6b4423);
  g.fillRect(0, 0, 32, 2);
  g.fillRect(0, 14, 32, 2);
  g.lineStyle(1, 0x5a381c, 0.5);
  g.lineBetween(8, 0, 8, 16);
  g.lineBetween(20, 0, 20, 16);
  g.generateTexture("dock", 32, 16);

  // Rock
  g.clear();
  g.fillStyle(0x6d6a63);
  g.fillCircle(12, 14, 10);
  g.fillCircle(20, 16, 8);
  g.fillStyle(0x8a8680);
  g.fillCircle(10, 12, 4);
  g.generateTexture("rock", 28, 24);

  // Market stand (behind merchant)
  g.clear();
  const sw = 110;
  const sh = 90;
  // shadow
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(sw / 2, sh - 2, 88, 10);
  // rear posts
  g.fillStyle(0x5c3a21);
  g.fillRect(10, 28, 6, 58);
  g.fillRect(sw - 16, 28, 6, 58);
  g.fillStyle(0x4a2f18);
  g.fillRect(10, 28, 2, 58);
  g.fillRect(sw - 16, 28, 2, 58);
  // backboard / shelf wall
  g.fillStyle(0x8b5a2b);
  g.fillRect(14, 34, sw - 28, 36);
  g.fillStyle(0x6b4423);
  g.fillRect(14, 34, sw - 28, 3);
  g.fillRect(14, 67, sw - 28, 3);
  // striped awning
  g.fillStyle(0xc45c4a);
  g.fillRect(4, 18, sw - 8, 16);
  g.fillStyle(0xf0e6d0);
  for (let i = 0; i < 7; i++) {
    g.fillRect(6 + i * 14, 18, 7, 16);
  }
  g.fillStyle(0x5c3a21);
  g.fillRect(4, 16, sw - 8, 3);
  // awning scallops
  g.fillStyle(0xc45c4a);
  for (let i = 0; i < 7; i++) {
    g.fillCircle(13 + i * 14, 34, 5);
  }
  g.fillStyle(0xf0e6d0);
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 0) g.fillCircle(13 + i * 14, 34, 5);
  }
  // counter
  g.fillStyle(0xa06a3a);
  g.fillRect(8, 70, sw - 16, 12);
  g.fillStyle(0x7a4a28);
  g.fillRect(8, 80, sw - 16, 4);
  g.fillStyle(0x5c3a21);
  g.fillRect(12, 82, 5, 8);
  g.fillRect(sw - 18, 82, 5, 8);
  // crates on counter / shelf
  g.fillStyle(0x6b4423);
  g.fillRect(20, 52, 16, 14);
  g.fillRect(74, 50, 18, 16);
  g.fillStyle(0x8b5a2b);
  g.fillRect(20, 52, 16, 3);
  g.fillRect(74, 50, 18, 3);
  // fish on ice / display
  g.fillStyle(0xd8e8f0);
  g.fillRect(40, 56, 28, 10);
  g.fillStyle(0xa82221);
  g.fillRect(44, 58, 10, 4);
  g.fillRect(56, 59, 9, 3);
  g.fillStyle(0x2d5a3a);
  g.fillRect(52, 58, 3, 3);
  // hanging sign
  g.fillStyle(0x3a2a1a);
  g.fillRect(sw / 2 - 1, 4, 2, 14);
  g.fillStyle(0xe8d5a3);
  g.fillRect(sw / 2 - 22, 4, 44, 14);
  g.fillStyle(0x5c3a21);
  g.fillRect(sw / 2 - 22, 4, 44, 2);
  g.fillRect(sw / 2 - 22, 16, 44, 2);
  g.generateTexture("market_stand", sw, sh);

  // Cloud
  g.clear();
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(30, 24, 16);
  g.fillCircle(48, 20, 20);
  g.fillCircle(66, 24, 16);
  g.fillCircle(40, 30, 14);
  g.fillCircle(56, 30, 14);
  g.generateTexture("cloud", 96, 48);

  // Lush jungle grass variants (darker canopy floor)
  for (let v = 0; v < 4; v++) {
    g.clear();
    g.fillStyle(0x2a4a28);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x1e6b32);
    g.fillRect(0, 0, 32, 11);
    g.fillStyle(0x145028);
    for (let i = 0; i < 12; i++) {
      const x = ((v * 19 + i * 11) % 30) + 1;
      const y = 13 + ((v * 7 + i * 5) % 16);
      g.fillRect(x, y, 2, 2);
    }
    g.fillStyle(0x3aaa48);
    for (let i = 0; i < 10; i++) {
      const x = ((v * 13 + i * 7) % 28) + 2;
      g.fillRect(x, 0 + (i % 3), 1, 5 + (i % 4));
    }
    g.fillStyle(0x6edf6a, 0.75);
    g.fillRect(5 + v, 1, 1, 6);
    g.fillRect(20 - v, 2, 1, 5);
    g.generateTexture(`jungle_grass_${v}`, 32, 32);
  }

  // Tall jungle canopy tree (origin bottom)
  g.clear();
  const tw = 96;
  const th = 220;
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(tw / 2, th - 4, 70, 12);
  // trunk
  g.fillStyle(0x3e2818);
  g.fillRect(tw / 2 - 8, 90, 16, th - 94);
  g.fillStyle(0x2a1a10);
  g.fillRect(tw / 2 - 8, 90, 5, th - 94);
  g.fillStyle(0x5a3a22);
  g.fillRect(tw / 2 + 2, 100, 3, 40);
  // buttress roots
  g.fillStyle(0x3e2818);
  g.fillTriangle(tw / 2 - 8, th - 8, tw / 2 - 28, th, tw / 2 + 2, th - 8);
  g.fillTriangle(tw / 2 + 8, th - 8, tw / 2 + 30, th, tw / 2 - 2, th - 8);
  // multi-layer canopy
  g.fillStyle(0x0f3d1a);
  g.fillCircle(tw / 2, 70, 42);
  g.fillStyle(0x176b2e);
  g.fillCircle(tw / 2 - 22, 58, 28);
  g.fillCircle(tw / 2 + 24, 55, 30);
  g.fillCircle(tw / 2, 42, 26);
  g.fillStyle(0x249a42);
  g.fillCircle(tw / 2 - 12, 48, 18);
  g.fillCircle(tw / 2 + 14, 40, 20);
  g.fillStyle(0x4ecf5e, 0.65);
  g.fillCircle(tw / 2 - 8, 36, 10);
  g.fillCircle(tw / 2 + 10, 32, 9);
  // hanging vine
  g.lineStyle(2, 0x1a5a28, 0.85);
  g.lineBetween(tw / 2 + 28, 70, tw / 2 + 34, 130);
  g.lineBetween(tw / 2 + 34, 130, tw / 2 + 30, 155);
  g.fillStyle(0x2d8a3a);
  g.fillCircle(tw / 2 + 30, 158, 4);
  g.generateTexture("jungle_tree", tw, th);

  // Extra-tall emergent tree
  g.clear();
  const ew = 110;
  const eh = 280;
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(ew / 2, eh - 4, 80, 14);
  g.fillStyle(0x352214);
  g.fillRect(ew / 2 - 9, 110, 18, eh - 114);
  g.fillStyle(0x24160c);
  g.fillRect(ew / 2 - 9, 110, 6, eh - 114);
  g.fillStyle(0x0a3014);
  g.fillCircle(ew / 2, 78, 48);
  g.fillStyle(0x145828);
  g.fillCircle(ew / 2 - 26, 62, 32);
  g.fillCircle(ew / 2 + 28, 58, 34);
  g.fillCircle(ew / 2, 40, 30);
  g.fillStyle(0x1f8a38);
  g.fillCircle(ew / 2 - 10, 48, 20);
  g.fillCircle(ew / 2 + 16, 36, 22);
  g.fillStyle(0x55d060, 0.55);
  g.fillCircle(ew / 2, 28, 12);
  g.generateTexture("jungle_tree_tall", ew, eh);

  // Fern
  g.clear();
  g.fillStyle(0x1a5a28);
  g.fillRect(15, 18, 2, 14);
  for (let i = 0; i < 5; i++) {
    const ang = -1.1 + i * 0.55;
    g.fillStyle(i % 2 === 0 ? 0x2d8a3a : 0x1f6b2e);
    g.fillTriangle(
      16,
      20 + i * 2,
      16 + Math.cos(ang) * 16,
      18 + i * 2 + Math.sin(ang) * 8,
      16 + Math.cos(ang) * 10,
      24 + i * 2
    );
    g.fillTriangle(
      16,
      20 + i * 2,
      16 - Math.cos(ang) * 16,
      18 + i * 2 + Math.sin(ang) * 8,
      16 - Math.cos(ang) * 10,
      24 + i * 2
    );
  }
  g.generateTexture("fern", 32, 36);

  // Lily pad
  g.clear();
  g.fillStyle(0x1a6b2e);
  g.fillEllipse(16, 10, 28, 14);
  g.fillStyle(0x2d9a42);
  g.fillEllipse(14, 8, 16, 8);
  g.fillStyle(0x0f3d1a);
  g.fillTriangle(16, 10, 30, 6, 30, 14);
  g.fillStyle(0xf4a0c0, 0.9);
  g.fillCircle(12, 7, 3);
  g.fillStyle(0xfff0a0);
  g.fillCircle(12, 7, 1);
  g.generateTexture("lily_pad", 32, 18);

  // Fallen log
  g.clear();
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(36, 22, 60, 8);
  g.fillStyle(0x5c3a21);
  g.fillRect(4, 8, 64, 14);
  g.fillStyle(0x4a2f18);
  g.fillRect(4, 8, 64, 5);
  g.fillStyle(0x3a2414);
  g.fillCircle(8, 15, 5);
  g.fillStyle(0x2a1a10);
  g.fillCircle(8, 15, 2);
  g.fillStyle(0x2d6a3e, 0.7);
  g.fillCircle(40, 6, 4);
  g.fillCircle(48, 8, 3);
  g.generateTexture("fallen_log", 72, 28);

  // Jungle boulder
  g.clear();
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(22, 30, 40, 10);
  g.fillStyle(0x4a5548);
  g.fillCircle(18, 20, 14);
  g.fillCircle(30, 22, 12);
  g.fillStyle(0x6a7568);
  g.fillCircle(14, 16, 6);
  g.fillStyle(0x2d6a3e, 0.55);
  g.fillCircle(26, 12, 5);
  g.fillCircle(34, 18, 4);
  g.generateTexture("jungle_rock", 44, 36);

  g.destroy();
}

export function placeVillage(
  scene: Phaser.Scene,
  groundY: number,
  islandLeft: number,
  islandRight: number
): void {
  const depth = 3;

  // Distant hills
  const hills = scene.add.graphics().setScrollFactor(0.35).setDepth(0);
  hills.fillStyle(0x6fae6a, 0.55);
  hills.fillEllipse(180, 480, 420, 140);
  hills.fillStyle(0x5e9a5c, 0.5);
  hills.fillEllipse(520, 490, 380, 120);
  hills.fillStyle(0x4e8a55, 0.45);
  hills.fillEllipse(820, 500, 340, 110);

  // Clouds
  for (let i = 0; i < 5; i++) {
    const cloud = scene.add
      .image(120 + i * 220, 70 + (i % 3) * 30, "cloud")
      .setScrollFactor(0.15)
      .setAlpha(0.85)
      .setDepth(0)
      .setScale(0.8 + (i % 3) * 0.15);
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + 40,
      duration: 18000 + i * 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Local X offset so village sits on the island strip
  const ox = islandLeft;

  // Path down the middle of the island toward the shore
  const pathY = groundY - 4;
  for (let x = ox + 160; x < islandRight - 40; x += 28) {
    scene.add
      .image(x, pathY, "path")
      .setDepth(depth)
      .setAlpha(0.95)
      .setScale(1, 0.55);
  }

  // Houses — origin at bottom so they sit on the grass
  // red-roof cottage, green cottage, then blue-roof cottage
  const redHouseX = ox + 220;
  const greenHouseX = ox + 480;
  const blueHouseX = ox + 720;
  const merchantStandX = Math.round((redHouseX + greenHouseX) / 2);

  scene.add
    .image(redHouseX, groundY, "house_a")
    .setDepth(depth + 1)
    .setOrigin(0.5, 1);
  scene.add
    .image(greenHouseX, groundY, "house_b")
    .setDepth(depth + 1)
    .setOrigin(0.5, 1)
    .setScale(1.05);
  scene.add
    .image(blueHouseX, groundY, "house_c")
    .setDepth(depth + 1)
    .setOrigin(0.5, 1)
    .setScale(0.95);

  // Merchant market stand between red & green houses (behind the NPC)
  scene.add
    .image(merchantStandX, groundY, "market_stand")
    .setDepth(depth + 2)
    .setOrigin(0.5, 1);

  // Chimney smoke (near roof / chimney tops)
  for (const hx of [ox + 250, ox + 510, ox + 740]) {
    for (let s = 0; s < 3; s++) {
      const smoke = scene.add
        .circle(hx, groundY - 140 - s * 8, 5 + s, 0xd0d0d0, 0.35)
        .setDepth(depth + 2);
      scene.tweens.add({
        targets: smoke,
        y: smoke.y - 40,
        x: smoke.x + 12,
        alpha: 0,
        scale: 2,
        duration: 2800 + s * 400,
        delay: s * 500,
        repeat: -1,
      });
    }
  }

  // Trees behind / beside houses (cleared around the market stand)
  const trees = [
    [ox + 80, 1.1],
    [ox + 140, 0.9],
    [ox + 600, 1.15],
    [ox + 660, 0.95],
    [ox + 820, 1.05],
    [ox + 860, 0.8],
  ] as const;
  for (const [x, scale] of trees) {
    scene.add
      .image(x, groundY + 2, "tree")
      .setDepth(depth)
      .setOrigin(0.5, 1)
      .setScale(scale);
  }

  // Bushes & flowers along path and yards (skip market stand gap)
  for (let x = islandLeft + 40; x < islandRight - 20; x += 48) {
    if (Math.abs(x - merchantStandX) < 70) continue;
    if (
      Math.abs(x - redHouseX) < 70 ||
      Math.abs(x - greenHouseX) < 70 ||
      Math.abs(x - blueHouseX) < 70
    ) {
      scene.add
        .image(x - 50, groundY - 2, "bush")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.85 + (x % 30) / 100);
      scene.add
        .image(x + 55, groundY - 2, "flowers")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1);
    } else if (x % 96 < 48) {
      scene.add
        .image(x, groundY - 2, "flowers")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(1 + (x % 20) / 40);
    }
  }

  // Rocks near both shores
  scene.add.image(islandRight - 70, groundY - 6, "rock").setDepth(depth + 2);
  scene.add
    .image(islandRight - 110, groundY - 4, "rock")
    .setDepth(depth + 2)
    .setScale(0.7);
  scene.add.image(islandLeft + 70, groundY - 6, "rock").setDepth(depth + 2);
  scene.add
    .image(islandLeft + 110, groundY - 4, "rock")
    .setDepth(depth + 2)
    .setScale(0.75);

  // Wooden docks into both oceans (collision added in GameScene)
  for (let i = 0; i < 5; i++) {
    scene.add
      .image(islandRight + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
    scene.add
      .image(islandLeft - 10 - i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
  }
  // Dock posts — run deep below the camera so bottoms never show
  const posts = scene.add.graphics().setDepth(5);
  const postDepth = 480;
  const drawPost = (x: number) => {
    posts.fillStyle(0x3a2414);
    posts.fillRect(x, groundY, 6, postDepth);
    posts.fillStyle(0x5c3a21);
    posts.fillRect(x, groundY, 2, postDepth);
    // waterline wrap
    posts.fillStyle(0x2a1a10, 0.55);
    posts.fillRect(x - 1, groundY + 8, 8, 6);
  };
  for (let i = 0; i < 5; i++) {
    drawPost(islandRight + 18 + i * 28);
    drawPost(islandLeft - 22 - i * 28);
  }

  // Grass tufts scattered
  const tufts = scene.add.graphics().setDepth(depth + 2);
  for (let i = 0; i < 60; i++) {
    const x = Phaser.Math.Between(islandLeft + 10, islandRight - 15);
    const y = groundY - Phaser.Math.Between(2, 10);
    tufts.fillStyle(Phaser.Math.RND.pick([0x5aa84e, 0x6fbf5c, 0x3f7d3a]));
    tufts.fillRect(x, y, 1, Phaser.Math.Between(4, 9));
    tufts.fillRect(x + 2, y + 1, 1, Phaser.Math.Between(3, 7));
  }

  // Title moved visually softer — caller may still add text
  void scene;
}

/** Dense jungle island with tall trees and a central pond (visual only for now). */
export function placeJungle(
  scene: Phaser.Scene,
  groundY: number,
  jungleLeft: number,
  jungleRight: number,
  pondLeft: number,
  pondRight: number
): void {
  const depth = 3;
  const ox = jungleLeft;
  const width = jungleRight - jungleLeft;
  const mid = (jungleLeft + jungleRight) / 2;

  // Far jungle ridges (parallax)
  const ridges = scene.add.graphics().setScrollFactor(0.4).setDepth(0);
  ridges.fillStyle(0x1a4a28, 0.55);
  ridges.fillEllipse(ox + 200, 470, 520, 160);
  ridges.fillStyle(0x145020, 0.5);
  ridges.fillEllipse(ox + width * 0.45, 485, 480, 140);
  ridges.fillStyle(0x0f3a1c, 0.45);
  ridges.fillEllipse(ox + width * 0.75, 495, 420, 130);

  // Mist / humidity haze over canopy
  const mist = scene.add.graphics().setDepth(1).setAlpha(0.2);
  mist.fillStyle(0xb8e8c8, 1);
  mist.fillEllipse(mid, groundY - 180, width * 0.7, 90);
  scene.tweens.add({
    targets: mist,
    alpha: 0.08,
    duration: 5000,
    yoyo: true,
    repeat: -1,
  });

  // Dirt trail around the pond (breaks at water)
  const pathY = groundY - 4;
  for (let x = ox + 80; x < pondLeft - 20; x += 28) {
    scene.add
      .image(x, pathY, "path")
      .setDepth(depth)
      .setAlpha(0.85)
      .setScale(1, 0.5)
      .setTint(0x8a6a40);
  }
  for (let x = pondRight + 20; x < jungleRight - 60; x += 28) {
    scene.add
      .image(x, pathY, "path")
      .setDepth(depth)
      .setAlpha(0.85)
      .setScale(1, 0.5)
      .setTint(0x8a6a40);
  }

  // Emergent giants + dense canopy belt (skip pond opening)
  const tallSpots: { x: number; key: string; scale: number }[] = [];
  for (let x = ox + 50; x < jungleRight - 40; x += 70) {
    if (x > pondLeft - 50 && x < pondRight + 50) continue;
    const tall = (x / 70) % 3 === 0;
    tallSpots.push({
      x: x + ((x * 13) % 24) - 12,
      key: tall ? "jungle_tree_tall" : "jungle_tree",
      scale: tall ? 0.95 + ((x * 7) % 20) / 100 : 0.85 + ((x * 11) % 30) / 100,
    });
  }
  // Extra front-row trees for depth
  for (let x = ox + 90; x < jungleRight - 50; x += 110) {
    if (x > pondLeft - 40 && x < pondRight + 40) continue;
    tallSpots.push({
      x: x + 20,
      key: "jungle_tree",
      scale: 0.7 + ((x * 3) % 20) / 100,
    });
  }
  for (const t of tallSpots) {
    scene.add
      .image(t.x, groundY + 2, t.key)
      .setDepth(t.key === "jungle_tree_tall" ? depth : depth + 1)
      .setOrigin(0.5, 1)
      .setScale(t.scale);
  }

  // Ferns, bushes, flowers along the floor
  for (let x = ox + 30; x < jungleRight - 20; x += 36) {
    if (x > pondLeft - 10 && x < pondRight + 10) continue;
    const roll = (x * 17) % 100;
    if (roll < 40) {
      scene.add
        .image(x, groundY - 1, "fern")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.9 + (roll % 20) / 40);
    } else if (roll < 65) {
      scene.add
        .image(x, groundY - 1, "bush")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.75 + (roll % 15) / 50)
        .setTint(0x88cc88);
    } else if (roll < 80) {
      scene.add
        .image(x, groundY - 1, "flowers")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1);
    }
  }

  // Fallen logs & mossy rocks
  const props: [number, string, number][] = [
    [ox + 180, "fallen_log", 1],
    [ox + 420, "jungle_rock", 1.1],
    [ox + 520, "fallen_log", 0.85],
    [mid - 200, "jungle_rock", 0.9],
    [mid + 210, "fallen_log", 1.05],
    [mid + 320, "jungle_rock", 1.2],
    [jungleRight - 280, "fallen_log", 0.9],
    [jungleRight - 160, "jungle_rock", 1],
  ];
  for (const [x, key, scale] of props) {
    if (x > pondLeft - 30 && x < pondRight + 30) continue;
    scene.add
      .image(x, groundY - 2, key)
      .setDepth(depth + 2)
      .setOrigin(0.5, 1)
      .setScale(scale);
  }

  // Pond water + reeds + lilies (decorative — no fishing yet)
  const pondW = pondRight - pondLeft;
  const pond = scene.add.graphics().setDepth(4);
  pond.fillStyle(0x0d4a5c, 0.7);
  pond.fillRect(pondLeft, groundY, pondW, 100);
  pond.fillStyle(0x1a7a8a, 0.45);
  pond.fillRect(pondLeft, groundY, pondW, 28);
  pond.fillStyle(0x083040, 0.35);
  pond.fillRect(pondLeft, groundY + 50, pondW, 50);
  // soft bank tint
  pond.fillStyle(0x3d6b2e, 0.5);
  pond.fillRect(pondLeft - 6, groundY - 2, 8, 12);
  pond.fillRect(pondRight - 2, groundY - 2, 8, 12);

  for (let i = 0; i < 5; i++) {
    const strip = scene.add
      .rectangle(
        pondLeft + 30 + i * (pondW / 5),
        groundY + 4,
        36,
        2,
        0xa8e8ff,
        0.35
      )
      .setDepth(6);
    scene.tweens.add({
      targets: strip,
      alpha: 0.06,
      x: strip.x + 10,
      duration: 1600 + i * 120,
      yoyo: true,
      repeat: -1,
    });
  }

  const lilyXs = [
    pondLeft + 40,
    pondLeft + pondW * 0.35,
    pondLeft + pondW * 0.55,
    pondLeft + pondW * 0.78,
  ];
  for (const lx of lilyXs) {
    scene.add
      .image(lx, groundY + 8 + ((lx * 3) % 10), "lily_pad")
      .setDepth(5)
      .setOrigin(0.5, 0.5)
      .setScale(0.9 + ((lx * 5) % 20) / 50);
  }

  // Reeds at pond edges
  const reeds = scene.add.graphics().setDepth(depth + 3);
  for (let i = 0; i < 14; i++) {
    const side = i < 7 ? pondLeft + 4 + i * 6 : pondRight - 40 + (i - 7) * 6;
    reeds.fillStyle(0x1a5a28);
    reeds.fillRect(side, groundY - 18 - (i % 4) * 3, 2, 22 + (i % 5) * 2);
    reeds.fillStyle(0x3aaa48);
    reeds.fillRect(side + 3, groundY - 14 - (i % 3) * 2, 2, 18);
  }

  // Wooden footbridge across the pond (walkable collider added in GameScene)
  const bridgeY = groundY - 2;
  const plankCount = Math.ceil(pondW / 28);
  for (let i = 0; i < plankCount; i++) {
    scene.add
      .image(pondLeft + 14 + i * 28, bridgeY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0.5)
      .setTint(0x6b4a28);
  }
  // Bridge rail posts
  const rails = scene.add.graphics().setDepth(5);
  rails.fillStyle(0x4a2f18);
  rails.fillRect(pondLeft + 8, groundY - 22, 4, 20);
  rails.fillRect(pondRight - 12, groundY - 22, 4, 20);
  rails.fillRect(mid - 2, groundY - 22, 4, 20);
  rails.lineStyle(2, 0x5c3a21, 0.9);
  rails.lineBetween(pondLeft + 10, groundY - 18, pondRight - 10, groundY - 18);

  // West dock into approach ocean (visual)
  for (let i = 0; i < 6; i++) {
    scene.add
      .image(jungleLeft - 10 - i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
  }
  // East dock into far ocean
  for (let i = 0; i < 5; i++) {
    scene.add
      .image(jungleRight + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
  }
  const posts = scene.add.graphics().setDepth(5);
  const postDepth = 480;
  const drawPost = (x: number) => {
    posts.fillStyle(0x3a2414);
    posts.fillRect(x, groundY, 6, postDepth);
    posts.fillStyle(0x5c3a21);
    posts.fillRect(x, groundY, 2, postDepth);
    posts.fillStyle(0x2a1a10, 0.55);
    posts.fillRect(x - 1, groundY + 8, 8, 6);
  };
  for (let i = 0; i < 6; i++) drawPost(jungleLeft - 22 - i * 28);
  for (let i = 0; i < 5; i++) drawPost(jungleRight + 18 + i * 28);

  // Shore rocks
  scene.add
    .image(jungleLeft + 60, groundY - 4, "jungle_rock")
    .setDepth(depth + 2)
    .setOrigin(0.5, 1);
  scene.add
    .image(jungleLeft + 110, groundY - 2, "rock")
    .setDepth(depth + 2)
    .setScale(0.8);
  scene.add
    .image(jungleRight - 70, groundY - 4, "jungle_rock")
    .setDepth(depth + 2)
    .setOrigin(0.5, 1)
    .setScale(1.1);

  // Grass tufts
  const tufts = scene.add.graphics().setDepth(depth + 2);
  for (let i = 0; i < 120; i++) {
    const x = Phaser.Math.Between(jungleLeft + 10, jungleRight - 15);
    if (x > pondLeft && x < pondRight) continue;
    const y = groundY - Phaser.Math.Between(2, 12);
    tufts.fillStyle(Phaser.Math.RND.pick([0x1e6b32, 0x3aaa48, 0x145028]));
    tufts.fillRect(x, y, 1, Phaser.Math.Between(5, 11));
    tufts.fillRect(x + 2, y + 1, 1, Phaser.Math.Between(4, 8));
  }

  // Sign near west shore
  const sign = scene.add.graphics().setDepth(depth + 3);
  sign.fillStyle(0x5c3a21);
  sign.fillRect(ox + 140, groundY - 48, 4, 48);
  sign.fillStyle(0xc4a574);
  sign.fillRect(ox + 118, groundY - 70, 48, 28);
  sign.fillStyle(0x3a2414);
  sign.fillRect(ox + 118, groundY - 70, 48, 3);
  sign.fillRect(ox + 118, groundY - 45, 48, 3);
  scene.add
    .text(ox + 142, groundY - 56, "JUNGLE", {
      fontFamily: "Georgia, serif",
      fontSize: "10px",
      color: "#2a1a10",
    })
    .setOrigin(0.5)
    .setDepth(depth + 4);
}
