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

  // Swamp mud-grass variants (wet, mossy floor)
  for (let v = 0; v < 4; v++) {
    g.clear();
    g.fillStyle(0x2a3420);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x3a4a28);
    g.fillRect(0, 0, 32, 10);
    g.fillStyle(0x1e2a18);
    for (let i = 0; i < 14; i++) {
      const x = ((v * 17 + i * 9) % 30) + 1;
      const y = 12 + ((v * 5 + i * 7) % 18);
      g.fillRect(x, y, 2, 2);
    }
    // Mud puddle sheen
    g.fillStyle(0x3a5a38, 0.45);
    g.fillEllipse(10 + v * 3, 20, 10, 5);
    g.fillStyle(0x4a6a2a);
    for (let i = 0; i < 8; i++) {
      const x = ((v * 11 + i * 5) % 28) + 2;
      g.fillRect(x, 0 + (i % 3), 1, 4 + (i % 5));
    }
    g.fillStyle(0x6a8a3a, 0.7);
    g.fillRect(4 + v, 1, 1, 5);
    g.fillRect(22 - v, 2, 1, 4);
    g.generateTexture(`swamp_grass_${v}`, 32, 32);
    // Keep old key so any leftover refs still work
    g.generateTexture(`jungle_grass_${v}`, 32, 32);
  }

  // Bald cypress / swamp tree (knees + hanging moss)
  g.clear();
  const tw = 100;
  const th = 240;
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(tw / 2, th - 4, 78, 14);
  // Flared trunk base
  g.fillStyle(0x3a2a18);
  g.fillTriangle(tw / 2 - 10, 100, tw / 2 - 32, th, tw / 2 + 8, th - 6);
  g.fillTriangle(tw / 2 + 10, 100, tw / 2 + 34, th, tw / 2 - 6, th - 6);
  g.fillStyle(0x4a3820);
  g.fillRect(tw / 2 - 9, 70, 18, th - 74);
  g.fillStyle(0x2a1c10);
  g.fillRect(tw / 2 - 9, 70, 6, th - 74);
  g.fillStyle(0x5a4830);
  g.fillRect(tw / 2 + 2, 90, 3, 50);
  // Cypress knees
  g.fillStyle(0x4a3820);
  g.fillTriangle(tw / 2 - 36, th - 2, tw / 2 - 28, th - 28, tw / 2 - 20, th - 2);
  g.fillTriangle(tw / 2 + 22, th - 2, tw / 2 + 30, th - 32, tw / 2 + 38, th - 2);
  g.fillTriangle(tw / 2 - 8, th - 2, tw / 2, th - 22, tw / 2 + 8, th - 2);
  // Sparse canopy (cypress look)
  g.fillStyle(0x1a3a1c);
  g.fillCircle(tw / 2, 55, 34);
  g.fillStyle(0x2a5a28);
  g.fillCircle(tw / 2 - 18, 48, 22);
  g.fillCircle(tw / 2 + 20, 44, 24);
  g.fillCircle(tw / 2, 32, 20);
  g.fillStyle(0x3a7a38, 0.75);
  g.fillCircle(tw / 2 - 6, 36, 12);
  g.fillCircle(tw / 2 + 10, 28, 10);
  // Spanish moss strands
  g.lineStyle(2, 0x6a7a58, 0.8);
  g.lineBetween(tw / 2 - 22, 55, tw / 2 - 26, 110);
  g.lineBetween(tw / 2 - 26, 110, tw / 2 - 22, 140);
  g.lineBetween(tw / 2 + 24, 52, tw / 2 + 30, 105);
  g.lineBetween(tw / 2 + 30, 105, tw / 2 + 26, 145);
  g.lineBetween(tw / 2 + 8, 48, tw / 2 + 12, 95);
  g.fillStyle(0x7a8a68, 0.7);
  g.fillCircle(tw / 2 - 22, 142, 3);
  g.fillCircle(tw / 2 + 26, 148, 3);
  g.generateTexture("swamp_tree", tw, th);
  g.generateTexture("jungle_tree", tw, th);

  // Extra-tall cypress
  g.clear();
  const ew = 112;
  const eh = 300;
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(ew / 2, eh - 4, 88, 16);
  g.fillStyle(0x322418);
  g.fillTriangle(ew / 2 - 12, 120, ew / 2 - 38, eh, ew / 2 + 10, eh - 8);
  g.fillTriangle(ew / 2 + 12, 120, ew / 2 + 40, eh, ew / 2 - 8, eh - 8);
  g.fillStyle(0x42301c);
  g.fillRect(ew / 2 - 10, 90, 20, eh - 94);
  g.fillStyle(0x24180c);
  g.fillRect(ew / 2 - 10, 90, 7, eh - 94);
  g.fillStyle(0x4a3820);
  g.fillTriangle(ew / 2 - 40, eh - 2, ew / 2 - 32, eh - 36, ew / 2 - 22, eh - 2);
  g.fillTriangle(ew / 2 + 24, eh - 2, ew / 2 + 34, eh - 40, ew / 2 + 42, eh - 2);
  g.fillStyle(0x0f2814);
  g.fillCircle(ew / 2, 70, 40);
  g.fillStyle(0x1a4a22);
  g.fillCircle(ew / 2 - 24, 58, 28);
  g.fillCircle(ew / 2 + 26, 52, 30);
  g.fillCircle(ew / 2, 38, 26);
  g.fillStyle(0x2a6a32, 0.7);
  g.fillCircle(ew / 2, 30, 14);
  g.lineStyle(2, 0x6a7a58, 0.85);
  g.lineBetween(ew / 2 - 28, 65, ew / 2 - 34, 130);
  g.lineBetween(ew / 2 - 34, 130, ew / 2 - 30, 175);
  g.lineBetween(ew / 2 + 28, 60, ew / 2 + 36, 125);
  g.lineBetween(ew / 2 + 36, 125, ew / 2 + 32, 180);
  g.generateTexture("swamp_tree_tall", ew, eh);
  g.generateTexture("jungle_tree_tall", ew, eh);

  // Cattail
  g.clear();
  g.fillStyle(0x2a5a28);
  g.fillRect(7, 8, 2, 28);
  g.fillRect(14, 4, 2, 32);
  g.fillRect(21, 10, 2, 26);
  g.fillStyle(0x6a3a18);
  g.fillRoundedRect(5, 2, 6, 12, 2);
  g.fillRoundedRect(12, 0, 6, 14, 2);
  g.fillRoundedRect(19, 4, 6, 11, 2);
  g.fillStyle(0x8a5a28);
  g.fillRect(6, 4, 4, 3);
  g.fillRect(13, 2, 4, 3);
  g.fillStyle(0x3aaa48);
  g.fillTriangle(8, 20, 2, 14, 8, 16);
  g.fillTriangle(15, 18, 22, 12, 15, 14);
  g.generateTexture("cattail", 28, 40);

  // Fern (kept, slightly swampier)
  g.clear();
  g.fillStyle(0x1a4a24);
  g.fillRect(15, 18, 2, 14);
  for (let i = 0; i < 5; i++) {
    const ang = -1.1 + i * 0.55;
    g.fillStyle(i % 2 === 0 ? 0x2a6a32 : 0x1a4a28);
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

  // Lily pad (murkier)
  g.clear();
  g.fillStyle(0x1a4a28);
  g.fillEllipse(16, 10, 28, 14);
  g.fillStyle(0x2a6a38);
  g.fillEllipse(14, 8, 16, 8);
  g.fillStyle(0x0f2a18);
  g.fillTriangle(16, 10, 30, 6, 30, 14);
  g.fillStyle(0xe8a0b8, 0.9);
  g.fillCircle(12, 7, 3);
  g.fillStyle(0xfff0a0);
  g.fillCircle(12, 7, 1);
  g.generateTexture("lily_pad", 32, 18);

  // Rotting stump
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 34, 40, 10);
  g.fillStyle(0x4a3420);
  g.fillRect(10, 12, 24, 22);
  g.fillStyle(0x3a2818);
  g.fillRect(10, 12, 24, 6);
  g.fillStyle(0x5a4430);
  g.fillCircle(22, 14, 11);
  g.fillStyle(0x2a1c10);
  g.fillCircle(22, 14, 5);
  g.fillStyle(0x3a5a28, 0.7);
  g.fillCircle(14, 10, 4);
  g.fillCircle(28, 18, 3);
  g.generateTexture("swamp_stump", 44, 40);

  // Fallen log
  g.clear();
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(36, 22, 60, 8);
  g.fillStyle(0x4a3020);
  g.fillRect(4, 8, 64, 14);
  g.fillStyle(0x3a2414);
  g.fillRect(4, 8, 64, 5);
  g.fillStyle(0x2a1a10);
  g.fillCircle(8, 15, 5);
  g.fillStyle(0x1a1008);
  g.fillCircle(8, 15, 2);
  g.fillStyle(0x2a5a30, 0.75);
  g.fillCircle(40, 6, 4);
  g.fillCircle(48, 8, 3);
  g.fillStyle(0xc03030, 0.85);
  g.fillCircle(52, 5, 3);
  g.fillStyle(0xf0f0f0, 0.9);
  g.fillCircle(51, 4, 1);
  g.generateTexture("fallen_log", 72, 28);

  // Mossy swamp boulder
  g.clear();
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(22, 30, 40, 10);
  g.fillStyle(0x3a4038);
  g.fillCircle(18, 20, 14);
  g.fillCircle(30, 22, 12);
  g.fillStyle(0x5a6058);
  g.fillCircle(14, 16, 6);
  g.fillStyle(0x2a5a30, 0.7);
  g.fillCircle(26, 12, 6);
  g.fillCircle(34, 18, 5);
  g.fillCircle(12, 22, 4);
  g.generateTexture("jungle_rock", 44, 36);
  g.generateTexture("swamp_rock", 44, 36);

  // Small swamp shack (merchant backdrop)
  g.clear();
  const hw = 120;
  const hh = 100;
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(hw / 2, hh - 2, 90, 10);
  g.fillStyle(0x3a2a18);
  g.fillRect(18, 40, hw - 36, hh - 48);
  g.fillStyle(0x2a1c10);
  g.fillRect(18, 40, 8, hh - 48);
  g.fillStyle(0x4a3828);
  for (let y = 44; y < hh - 10; y += 8) {
    g.fillRect(20, y, hw - 40, 2);
  }
  g.fillStyle(0x2a4018);
  g.fillTriangle(8, 44, hw / 2, 8, hw - 8, 44);
  g.fillStyle(0x1a3010);
  g.fillTriangle(16, 44, hw / 2, 16, hw - 16, 44);
  g.fillStyle(0x1a1208);
  g.fillRect(hw / 2 - 12, hh - 36, 22, 28);
  g.fillStyle(0x5a4830);
  g.fillRect(hw / 2 - 10, hh - 34, 18, 24);
  g.fillStyle(0x7a9acc, 0.55);
  g.fillRect(28, 52, 14, 12);
  g.fillRect(hw - 44, 52, 14, 12);
  g.lineStyle(1, 0x2a1c10);
  g.strokeRect(28, 52, 14, 12);
  g.strokeRect(hw - 44, 52, 14, 12);
  g.generateTexture("swamp_shack", hw, hh);

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

/** Dense swamp island — cypress, cattails, murky pond (Wildflower rod still here). */
export function placeSwamp(
  scene: Phaser.Scene,
  groundY: number,
  swampLeft: number,
  swampRight: number,
  pondLeft: number,
  pondRight: number
): void {
  const depth = 3;
  const ox = swampLeft;
  const width = swampRight - swampLeft;
  const mid = (swampLeft + swampRight) / 2;

  // Far murky ridges
  const ridges = scene.add.graphics().setScrollFactor(0.4).setDepth(0);
  ridges.fillStyle(0x1a2a18, 0.6);
  ridges.fillEllipse(ox + 220, 475, 540, 170);
  ridges.fillStyle(0x142418, 0.55);
  ridges.fillEllipse(ox + width * 0.42, 490, 500, 150);
  ridges.fillStyle(0x0e1c12, 0.5);
  ridges.fillEllipse(ox + width * 0.78, 500, 440, 140);

  // Layered swamp fog
  for (let i = 0; i < 3; i++) {
    const fog = scene.add.graphics().setDepth(1).setAlpha(0.12 + i * 0.04);
    fog.fillStyle(0xa8c8a0, 1);
    fog.fillEllipse(
      mid - 80 + i * 100,
      groundY - 160 - i * 25,
      width * (0.45 + i * 0.1),
      70 + i * 20
    );
    scene.tweens.add({
      targets: fog,
      alpha: 0.04,
      x: fog.x + (i % 2 === 0 ? 30 : -24),
      duration: 4200 + i * 900,
      yoyo: true,
      repeat: -1,
    });
  }

  // Muddy boardwalk path (breaks at pond)
  const pathY = groundY - 4;
  for (let x = ox + 70; x < pondLeft - 24; x += 26) {
    scene.add
      .image(x, pathY, "path")
      .setDepth(depth)
      .setAlpha(0.9)
      .setScale(1, 0.48)
      .setTint(0x5a4a30);
  }
  for (let x = pondRight + 24; x < swampRight - 50; x += 26) {
    scene.add
      .image(x, pathY, "path")
      .setDepth(depth)
      .setAlpha(0.9)
      .setScale(1, 0.48)
      .setTint(0x5a4a30);
  }

  // Merchant shack west of pond
  const shackX = ox + 280;
  scene.add
    .image(shackX, groundY, "swamp_shack")
    .setDepth(depth + 1)
    .setOrigin(0.5, 1)
    .setScale(1.05);

  // Cypress belt (skip pond + wildflower clearing + shack)
  const wildflowerClearX = ox + 210;
  const treeSpots: { x: number; key: string; scale: number }[] = [];
  for (let x = ox + 40; x < swampRight - 35; x += 64) {
    if (x > pondLeft - 55 && x < pondRight + 55) continue;
    if (Math.abs(x - wildflowerClearX) < 70) continue;
    if (Math.abs(x - shackX) < 90) continue;
    const tall = (x / 64) % 3 === 0;
    treeSpots.push({
      x: x + ((x * 13) % 20) - 10,
      key: tall ? "swamp_tree_tall" : "swamp_tree",
      scale: tall ? 0.88 + ((x * 7) % 18) / 100 : 0.78 + ((x * 11) % 28) / 100,
    });
  }
  for (let x = ox + 85; x < swampRight - 45; x += 100) {
    if (x > pondLeft - 45 && x < pondRight + 45) continue;
    if (Math.abs(x - wildflowerClearX) < 60) continue;
    if (Math.abs(x - shackX) < 80) continue;
    treeSpots.push({
      x: x + 16,
      key: "swamp_tree",
      scale: 0.62 + ((x * 3) % 22) / 100,
    });
  }
  for (const t of treeSpots) {
    scene.add
      .image(t.x, groundY + 2, t.key)
      .setDepth(t.key === "swamp_tree_tall" ? depth : depth + 1)
      .setOrigin(0.5, 1)
      .setScale(t.scale);
  }

  // Cattails, ferns, bushes along the floor
  for (let x = ox + 25; x < swampRight - 18; x += 28) {
    if (x > pondLeft - 8 && x < pondRight + 8) continue;
    if (Math.abs(x - wildflowerClearX) < 45) continue;
    const roll = (x * 19) % 100;
    if (roll < 35) {
      scene.add
        .image(x, groundY - 1, "cattail")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.95 + (roll % 25) / 50);
    } else if (roll < 55) {
      scene.add
        .image(x, groundY - 1, "fern")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.85 + (roll % 20) / 40);
    } else if (roll < 72) {
      scene.add
        .image(x, groundY - 1, "bush")
        .setDepth(depth + 2)
        .setOrigin(0.5, 1)
        .setScale(0.7 + (roll % 15) / 50)
        .setTint(0x6a8a5a);
    }
  }

  // Dense cattail rings at pond banks
  for (let i = 0; i < 10; i++) {
    scene.add
      .image(pondLeft - 8 - (i % 4) * 10, groundY - 1, "cattail")
      .setDepth(depth + 3)
      .setOrigin(0.5, 1)
      .setScale(1 + (i % 3) * 0.08);
    scene.add
      .image(pondRight + 8 + (i % 4) * 10, groundY - 1, "cattail")
      .setDepth(depth + 3)
      .setOrigin(0.5, 1)
      .setScale(1 + (i % 3) * 0.08);
  }

  // Logs, stumps, mossy rocks
  const props: [number, string, number][] = [
    [ox + 160, "fallen_log", 1],
    [ox + 400, "swamp_stump", 1.05],
    [ox + 480, "swamp_rock", 1.1],
    [ox + 560, "fallen_log", 0.9],
    [mid - 220, "swamp_stump", 0.95],
    [mid + 230, "fallen_log", 1.05],
    [mid + 340, "swamp_rock", 1.15],
    [swampRight - 300, "swamp_stump", 1],
    [swampRight - 200, "fallen_log", 0.88],
    [swampRight - 120, "swamp_rock", 1],
  ];
  for (const [x, key, scale] of props) {
    if (x > pondLeft - 35 && x < pondRight + 35) continue;
    if (Math.abs(x - wildflowerClearX) < 50) continue;
    scene.add
      .image(x, groundY - 2, key)
      .setDepth(depth + 2)
      .setOrigin(0.5, 1)
      .setScale(scale);
  }

  // ——— Pond (kept): deep murky swamp water ———
  const pondW = pondRight - pondLeft;
  const pondDepth = 240;
  const pond = scene.add.graphics().setDepth(4);
  pond.fillStyle(0x0a3028, 0.88);
  pond.fillRect(pondLeft, groundY, pondW, pondDepth);
  pond.fillStyle(0x1a5040, 0.55);
  pond.fillRect(pondLeft, groundY, pondW, 36);
  pond.fillStyle(0x0c3a30, 0.5);
  pond.fillRect(pondLeft, groundY + 50, pondW, 70);
  pond.fillStyle(0x062018, 0.65);
  pond.fillRect(pondLeft, groundY + 120, pondW, 70);
  pond.fillStyle(0x03140e, 0.75);
  pond.fillRect(pondLeft, groundY + 180, pondW, 60);
  pond.fillStyle(0x2a4a28, 0.55);
  pond.fillRect(pondLeft - 8, groundY - 3, 10, 14);
  pond.fillRect(pondRight - 2, groundY - 3, 10, 14);
  // Algae patches
  pond.fillStyle(0x3a6a28, 0.35);
  pond.fillEllipse(pondLeft + pondW * 0.3, groundY + 40, 50, 18);
  pond.fillEllipse(pondLeft + pondW * 0.7, groundY + 90, 40, 14);
  pond.fillEllipse(pondLeft + pondW * 0.45, groundY + 150, 55, 16);

  for (let i = 0; i < 6; i++) {
    const strip = scene.add
      .rectangle(
        pondLeft + 24 + i * (pondW / 6),
        groundY + 5,
        32,
        2,
        0x88c8a0,
        0.28
      )
      .setDepth(6);
    scene.tweens.add({
      targets: strip,
      alpha: 0.05,
      x: strip.x + 8,
      duration: 1800 + i * 140,
      yoyo: true,
      repeat: -1,
    });
  }

  // More lily pads
  for (let i = 0; i < 9; i++) {
    const lx = pondLeft + 28 + (i / 8) * (pondW - 56) + ((i * 17) % 18) - 9;
    scene.add
      .image(lx, groundY + 6 + (i % 5) * 3, "lily_pad")
      .setDepth(5)
      .setOrigin(0.5, 0.5)
      .setScale(0.85 + (i % 4) * 0.08)
      .setAngle((i * 40) % 50 - 25);
  }

  // Footbridge across pond (walkable collider in GameScene)
  const bridgeY = groundY - 2;
  const plankCount = Math.ceil(pondW / 28);
  for (let i = 0; i < plankCount; i++) {
    scene.add
      .image(pondLeft + 14 + i * 28, bridgeY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0.5)
      .setTint(0x5a3a20);
  }
  const rails = scene.add.graphics().setDepth(5);
  rails.fillStyle(0x3a2414);
  rails.fillRect(pondLeft + 8, groundY - 22, 4, 20);
  rails.fillRect(pondRight - 12, groundY - 22, 4, 20);
  rails.fillRect(mid - 2, groundY - 22, 4, 20);
  rails.lineStyle(2, 0x4a3020, 0.9);
  rails.lineBetween(pondLeft + 10, groundY - 18, pondRight - 10, groundY - 18);

  // Docks
  for (let i = 0; i < 6; i++) {
    scene.add
      .image(swampLeft - 10 - i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0)
      .setTint(0x6a4a28);
  }
  for (let i = 0; i < 5; i++) {
    scene.add
      .image(swampRight + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0)
      .setTint(0x6a4a28);
  }
  const posts = scene.add.graphics().setDepth(5);
  const postDepth = 480;
  const drawPost = (x: number) => {
    posts.fillStyle(0x2a1a10);
    posts.fillRect(x, groundY, 6, postDepth);
    posts.fillStyle(0x4a3020);
    posts.fillRect(x, groundY, 2, postDepth);
    posts.fillStyle(0x1a1008, 0.55);
    posts.fillRect(x - 1, groundY + 8, 8, 6);
  };
  for (let i = 0; i < 6; i++) drawPost(swampLeft - 22 - i * 28);
  for (let i = 0; i < 5; i++) drawPost(swampRight + 18 + i * 28);

  // Shore rocks
  scene.add
    .image(swampLeft + 55, groundY - 4, "swamp_rock")
    .setDepth(depth + 2)
    .setOrigin(0.5, 1);
  scene.add
    .image(swampLeft + 105, groundY - 2, "rock")
    .setDepth(depth + 2)
    .setScale(0.8)
    .setTint(0x8a9880);
  scene.add
    .image(swampRight - 65, groundY - 4, "swamp_rock")
    .setDepth(depth + 2)
    .setOrigin(0.5, 1)
    .setScale(1.1);

  // Fireflies
  for (let i = 0; i < 18; i++) {
    const fx = Phaser.Math.Between(swampLeft + 40, swampRight - 40);
    if (fx > pondLeft && fx < pondRight) continue;
    const fy = groundY - Phaser.Math.Between(40, 160);
    const bug = scene.add
      .circle(fx, fy, 1.6, 0xd8f060, 0.85)
      .setDepth(depth + 5);
    scene.tweens.add({
      targets: bug,
      alpha: 0.15,
      x: fx + Phaser.Math.Between(-20, 20),
      y: fy + Phaser.Math.Between(-16, 16),
      duration: 1400 + i * 90,
      yoyo: true,
      repeat: -1,
    });
  }

  // Grass / reed tufts
  const tufts = scene.add.graphics().setDepth(depth + 2);
  for (let i = 0; i < 160; i++) {
    const x = Phaser.Math.Between(swampLeft + 10, swampRight - 15);
    if (x > pondLeft && x < pondRight) continue;
    const y = groundY - Phaser.Math.Between(2, 14);
    tufts.fillStyle(Phaser.Math.RND.pick([0x2a4a24, 0x3a5a28, 0x1a3a18]));
    tufts.fillRect(x, y, 1, Phaser.Math.Between(5, 12));
    tufts.fillRect(x + 2, y + 1, 1, Phaser.Math.Between(4, 9));
  }

  // Sign
  const sign = scene.add.graphics().setDepth(depth + 3);
  sign.fillStyle(0x3a2818);
  sign.fillRect(ox + 130, groundY - 48, 4, 48);
  sign.fillStyle(0x8a6a40);
  sign.fillRect(ox + 108, groundY - 72, 52, 30);
  sign.fillStyle(0x2a1a10);
  sign.fillRect(ox + 108, groundY - 72, 52, 3);
  sign.fillRect(ox + 108, groundY - 45, 52, 3);
  scene.add
    .text(ox + 134, groundY - 58, "SWAMP", {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#1a1208",
    })
    .setOrigin(0.5)
    .setDepth(depth + 4);
}

/** @deprecated alias — island is a swamp now */
export function placeJungle(
  scene: Phaser.Scene,
  groundY: number,
  jungleLeft: number,
  jungleRight: number,
  pondLeft: number,
  pondRight: number
): void {
  placeSwamp(scene, groundY, jungleLeft, jungleRight, pondLeft, pondRight);
}

/**
 * Coral reef — clearer light-blue water, sand floor, spaced tall coral.
 * blendEnd (east of reefRight) is a clean light→dark water transition.
 * No fish spawn here (handled by GameScene zones).
 */
export function placeCoralReef(
  scene: Phaser.Scene,
  surfaceY: number,
  reefLeft: number,
  reefRight: number,
  blendEnd: number
): void {
  const w = reefRight - reefLeft;
  const depth = 200;
  const sandY = surfaceY + depth;
  const blendW = Math.max(80, blendEnd - reefRight);

  // Sand bed under the reef — wide, layered shelf
  const sand = scene.add.graphics().setDepth(3);
  sand.fillStyle(0xf2e4b4, 1);
  sand.fillRect(reefLeft - 20, sandY - 10, w + 40, 40);
  sand.fillStyle(0xe8d8a0, 1);
  sand.fillRect(reefLeft, sandY - 6, w, 90);
  sand.fillStyle(0xd4c080, 1);
  sand.fillRect(reefLeft, sandY + 40, w, 80);
  sand.fillStyle(0xc4b070, 1);
  sand.fillRect(reefLeft, sandY + 100, w, 70);
  sand.fillStyle(0xb8a060, 0.95);
  sand.fillRect(reefLeft, sandY + 155, w, 50);
  // Dune / ripple patches
  sand.fillStyle(0xc8b070, 0.9);
  for (let i = 0; i < 36; i++) {
    const sx = reefLeft + 24 + (i / 35) * (w - 48) + ((i * 19) % 28) - 14;
    sand.fillEllipse(sx, sandY + 8 + (i % 6) * 14, 26 + (i % 4) * 8, 8);
  }
  sand.fillStyle(0xfff6d0, 0.28);
  for (let i = 0; i < 14; i++) {
    sand.fillEllipse(
      reefLeft + 40 + (i / 13) * (w - 80),
      sandY + 20 + (i % 5) * 16,
      32,
      11
    );
  }
  // Sand fades through the blend zone (deeper shelf)
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    sand.fillStyle(0xc8b070, 0.6 * (1 - t));
    sand.fillRect(
      reefRight + (i / 10) * blendW,
      sandY - 4,
      blendW / 10 + 2,
      120
    );
  }

  // Light reef water
  const water = scene.add.graphics().setDepth(4);
  water.fillStyle(0x6ec4e4, 0.32);
  water.fillRect(reefLeft, surfaceY, w, 36);
  water.fillStyle(0x4eb0d4, 0.4);
  water.fillRect(reefLeft, surfaceY + 30, w, 50);
  water.fillStyle(0x3a9cc4, 0.45);
  water.fillRect(reefLeft, surfaceY + 72, w, 60);
  water.fillStyle(0x2a88b0, 0.4);
  water.fillRect(reefLeft, surfaceY + 125, w, depth - 125 + 16);
  water.fillStyle(0x90d4e8, 0.12);
  water.fillRect(reefLeft, sandY - 28, w, 32);

  // Clean light → dark blend with deep water under the transition
  const steps = 14;
  const blendDeep = 520;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const x = reefRight + (i / steps) * blendW;
    const seg = blendW / steps + 1.5;
    const r = Math.round(110 + (46 - 110) * t);
    const g = Math.round(196 + (111 - 196) * t);
    const b = Math.round(228 + (159 - 228) * t);
    water.fillStyle((r << 16) | (g << 8) | b, 0.32 + t * 0.38);
    water.fillRect(x, surfaceY, seg, 48);
    const r2 = Math.round(78 + (31 - 78) * t);
    const g2 = Math.round(176 + (111 - 176) * t);
    const b2 = Math.round(212 + (159 - 212) * t);
    water.fillStyle((r2 << 16) | (g2 << 8) | b2, 0.4 + t * 0.35);
    water.fillRect(x, surfaceY + 40, seg, 120);
    const r3 = Math.round(58 + (20 - 58) * t);
    const g3 = Math.round(152 + (90 - 152) * t);
    const b3 = Math.round(196 + (130 - 196) * t);
    water.fillStyle((r3 << 16) | (g3 << 8) | b3, 0.45 + t * 0.4);
    water.fillRect(x, surfaceY + 140, seg, 160);
    // Extra depth under the transition
    const r4 = Math.round(42 + (12 - 42) * t);
    const g4 = Math.round(110 + (61 - 110) * t);
    const b4 = Math.round(160 + (92 - 160) * t);
    water.fillStyle((r4 << 16) | (g4 << 8) | b4, 0.55 + t * 0.35);
    water.fillRect(x, surfaceY + 280, seg, 140);
    const r5 = Math.round(28 + (7 - 28) * t);
    const g5 = Math.round(70 + (30 - 70) * t);
    const b5 = Math.round(110 + (48 - 110) * t);
    water.fillStyle((r5 << 16) | (g5 << 8) | b5, 0.7 + t * 0.25);
    water.fillRect(x, surfaceY + 400, seg, blendDeep - 400);
  }

  // Sparse surface sparkles
  const strips = Math.max(4, Math.floor(w / 120));
  for (let i = 0; i < strips; i++) {
    const strip = scene.add
      .rectangle(
        reefLeft + 50 + i * 120,
        surfaceY + 4,
        36,
        2,
        0xe8f8ff,
        0.45
      )
      .setDepth(6);
    scene.tweens.add({
      targets: strip,
      alpha: 0.1,
      x: strip.x + 10,
      duration: 1800 + i * 100,
      yoyo: true,
      repeat: -1,
    });
  }

  const coralColors = [
    { tip: 0xff6b9d, mid: 0xe8457a, base: 0xb8285a },
    { tip: 0xff9a5a, mid: 0xf07030, base: 0xc05020 },
    { tip: 0xc77dff, mid: 0x9b4de0, base: 0x6a2aad },
    { tip: 0x5dffb0, mid: 0x2ecf88, base: 0x1a9a62 },
    { tip: 0xffd56a, mid: 0xf0b020, base: 0xc08010 },
    { tip: 0xff5c7a, mid: 0xe03050, base: 0xa01838 },
  ];

  // Main clusters + a few mid-size fillers
  const clusterCount = Math.max(6, Math.floor(w / 160));
  for (let i = 0; i < clusterCount; i++) {
    const cx =
      reefLeft + 70 + (i / Math.max(1, clusterCount - 1)) * (w - 140);
    const palette = coralColors[i % coralColors.length];
    const tall = 70 + (i % 4) * 18;
    drawTallCoral(scene, cx, sandY - 2, tall, palette, i);
  }
  const extra = Math.max(3, Math.floor(clusterCount * 0.45));
  for (let i = 0; i < extra; i++) {
    const cx = reefLeft + 100 + ((i + 0.5) / extra) * (w - 200);
    const palette = coralColors[(i + 2) % coralColors.length];
    drawTallCoral(scene, cx, sandY - 2, 48 + (i % 3) * 12, palette, i + 40);
  }
}

function drawTallCoral(
  scene: Phaser.Scene,
  x: number,
  baseY: number,
  height: number,
  colors: { tip: number; mid: number; base: number },
  seed: number
): void {
  const g = scene.add.graphics().setDepth(3.5);
  const sway = scene.add.container(x, baseY).setDepth(3.5);

  g.fillStyle(colors.base, 1);
  g.fillRect(-5, -height * 0.35, 10, height * 0.35);
  g.fillStyle(colors.mid, 1);
  g.fillRect(-4, -height * 0.7, 8, height * 0.4);
  g.fillStyle(colors.tip, 0.95);
  g.fillRect(-3, -height, 6, height * 0.35);

  g.lineStyle(1.5, colors.tip, 0.5);
  for (let y = -8; y > -height; y -= 10) {
    g.lineBetween(-5, y, 5, y);
  }

  const branchN = 3 + (seed % 3);
  for (let b = 0; b < branchN; b++) {
    const t = 0.45 + (b / branchN) * 0.45;
    const by = -height * t;
    const dir = b % 2 === 0 ? 1 : -1;
    const len = 14 + ((b + seed) % 5) * 5;
    const ang = dir * (0.6 + (b % 3) * 0.25);
    const ex = Math.cos(ang) * len * dir;
    const ey = by - Math.sin(Math.abs(ang)) * len * 0.85;

    g.lineStyle(5, colors.base, 1);
    g.lineBetween(dir * 2, by, ex, ey);
    g.lineStyle(3.5, colors.mid, 1);
    g.lineBetween(dir * 2, by, ex, ey);
    g.lineStyle(2, colors.tip, 0.9);
    g.lineBetween(dir * 2, by - 1, ex, ey - 1);

    g.fillStyle(colors.tip, 1);
    g.fillCircle(ex, ey, 3.5 + (b % 2));
    g.fillStyle(0xfff0f8, 0.45);
    g.fillCircle(ex - 1, ey - 1, 1.6);

    if (b < 2) {
      const fx = ex + dir * 8;
      const fy = ey - 10;
      g.lineStyle(2.5, colors.mid, 1);
      g.lineBetween(ex, ey, fx, fy);
      g.fillStyle(colors.tip, 1);
      g.fillCircle(fx, fy, 2.8);
    }
  }

  if (seed % 2 === 0) {
    g.fillStyle(colors.mid, 0.55);
    g.beginPath();
    g.arc(
      -2,
      -height * 0.5,
      16,
      Phaser.Math.DegToRad(-110),
      Phaser.Math.DegToRad(-20),
      false
    );
    g.closePath();
    g.fillPath();
    g.lineStyle(1.2, colors.tip, 0.7);
    g.beginPath();
    g.arc(
      -2,
      -height * 0.5,
      16,
      Phaser.Math.DegToRad(-110),
      Phaser.Math.DegToRad(-20),
      false
    );
    g.strokePath();
  }

  g.fillStyle(colors.base, 1);
  g.fillEllipse(0, 2, 18, 8);
  g.fillStyle(0xd4c090, 0.5);
  g.fillEllipse(0, 4, 22, 6);

  sway.add(g);

  scene.tweens.add({
    targets: sway,
    angle: { from: -2.2, to: 2.2 },
    duration: 2200 + (seed % 7) * 180,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}
