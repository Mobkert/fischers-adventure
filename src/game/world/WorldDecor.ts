import Phaser from "phaser";
import { NightAmbient } from "./NightAmbient";

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
  generateTownHouseTextures(scene);
}

/** Collector's town buildings — brick / stone / plaster, not timber cottages. */
function generateTownHouseTextures(scene: Phaser.Scene): void {
  drawTownBrickShop(scene, "town_house_a");
  drawTownStoneHall(scene, "town_house_b");
  drawTownPlasterRow(scene, "town_house_c");
  drawTownTealShop(scene, "town_house_d");
  drawTownYellowHome(scene, "town_house_e");
}

function drawTownBrickShop(scene: Phaser.Scene, key: string): void {
  const w = 178;
  const h = 178;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(w / 2, h - 2, 148, 10);

  // Stone plinth with staggered blocks
  g.fillStyle(0x6a6860);
  g.fillRect(12, h - 20, w - 24, 20);
  g.fillStyle(0x8a8880);
  for (let x = 16; x < w - 20; x += 13) {
    g.fillRect(x, h - 18, 10, 6);
    g.fillStyle(0x5a5850);
    g.fillRect(x + 2, h - 10, 9, 6);
    g.fillStyle(0x8a8880);
  }

  // Brick walls with shade edge
  g.fillStyle(0xa85a48);
  g.fillRect(16, 44, w - 32, h - 64);
  g.fillStyle(0x8e4a3a);
  g.fillRect(16, 44, 9, h - 64);
  g.fillStyle(0xb86858, 0.35);
  g.fillRect(w - 28, 44, 12, h - 64);
  // Brick courses (running bond)
  g.lineStyle(1, 0x7a3a2e, 0.55);
  for (let y = 50; y < h - 24; y += 7) {
    g.lineBetween(16, y, w - 16, y);
    const off = ((y / 7) % 2) * 6;
    for (let x = 18 + off; x < w - 20; x += 12) {
      g.lineBetween(x, y, x, Math.min(y + 7, h - 24));
    }
  }
  // Occasional darker bricks for texture
  g.fillStyle(0x8a4034, 0.45);
  g.fillRect(34, 64, 10, 5);
  g.fillRect(78, 85, 10, 5);
  g.fillRect(120, 57, 10, 5);
  g.fillRect(52, 120, 10, 5);

  // Flat cornice / parapet roof (layered)
  g.fillStyle(0x2a2824);
  g.fillRect(6, 24, w - 12, 6);
  g.fillStyle(0x3a3834);
  g.fillRect(8, 28, w - 16, 16);
  g.fillStyle(0x524e48);
  g.fillRect(10, 30, w - 20, 12);
  g.fillStyle(0x6a6660);
  g.fillRect(12, 32, w - 24, 3);
  // Dentils under cornice
  g.fillStyle(0x2a2824);
  for (let x = 14; x < w - 16; x += 8) {
    g.fillRect(x, 40, 4, 5);
  }
  // Gutter
  g.fillStyle(0x4a4844);
  g.fillRect(8, 42, w - 16, 3);
  g.fillStyle(0x3a3834);
  g.fillRect(10, 43, 3, 6);
  g.fillRect(w - 13, 43, 3, 6);

  drawTownChimney(g, w - 42, 10, true);

  // Large shop display window with goods
  const sx = 24;
  const sy = 82;
  g.fillStyle(0xd8d0c0);
  g.fillRect(sx - 3, sy - 3, 62, 50);
  g.fillStyle(0x1a2430);
  g.fillRect(sx, sy, 56, 44);
  // Pane glass
  g.fillStyle(0x9ec8e0, 0.82);
  g.fillRect(sx + 2, sy + 2, 24, 18);
  g.fillRect(sx + 30, sy + 2, 24, 18);
  g.fillRect(sx + 2, sy + 24, 24, 18);
  g.fillRect(sx + 30, sy + 24, 24, 18);
  // Goods on shelves (lower panes)
  g.fillStyle(0xc45a3a);
  g.fillRect(sx + 6, sy + 30, 8, 8);
  g.fillStyle(0xe8c85a);
  g.fillCircle(sx + 18, sy + 34, 4);
  g.fillStyle(0x4a7a5a);
  g.fillRect(sx + 34, sy + 28, 6, 10);
  g.fillStyle(0xd4a060);
  g.fillRect(sx + 44, sy + 32, 8, 6);
  g.fillStyle(0x7a4a8a);
  g.fillCircle(sx + 12, sy + 12, 3);
  g.fillStyle(0xf0e8d0, 0.5);
  g.fillRect(sx + 36, sy + 6, 10, 4);
  g.lineStyle(2, 0xe8e0d0, 1);
  g.strokeRect(sx, sy, 56, 44);
  g.lineBetween(sx + 28, sy, sx + 28, sy + 44);
  g.lineBetween(sx, sy + 22, sx + 56, sy + 22);
  // Window ledge
  g.fillStyle(0xc8c0b0);
  g.fillRect(sx - 4, sy + 44, 64, 5);

  // Striped awning with scallops
  g.fillStyle(0x1a4058);
  g.fillRect(sx - 6, sy - 14, 68, 12);
  g.fillStyle(0x2a5a7a);
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) g.fillStyle(0x2a5a7a);
    else g.fillStyle(0xd8e8f0);
    g.fillRect(sx - 4 + i * 11, sy - 13, 10, 10);
  }
  // Scalloped edge
  for (let i = 0; i < 6; i++) {
    g.fillStyle(i % 2 === 0 ? 0x2a5a7a : 0xd8e8f0);
    g.fillCircle(sx + 1 + i * 11, sy - 2, 5);
  }
  // Awning poles
  g.fillStyle(0x4a4840);
  g.fillRect(sx - 4, sy - 2, 2, 8);
  g.fillRect(sx + 54, sy - 2, 2, 8);

  // Upper windows + flower boxes
  drawTownWindow(g, 28, 50, true);
  drawTownWindow(g, w - 64, 50, true);
  g.fillStyle(0x5c3a21);
  g.fillRect(24, 78, 36, 6);
  g.fillRect(w - 68, 78, 36, 6);
  g.fillStyle(0xe85d75);
  g.fillCircle(32, 76, 3);
  g.fillStyle(0xf4a261);
  g.fillCircle(42, 75, 3);
  g.fillStyle(0x2a9d8f);
  g.fillCircle(52, 76, 3);
  g.fillStyle(0xe9c46a);
  g.fillCircle(w - 60, 75, 3);
  g.fillStyle(0xe76f51);
  g.fillCircle(w - 50, 76, 3);
  g.fillStyle(0x90be6d);
  g.fillCircle(w - 40, 75, 3);

  drawTownDoor(g, w / 2 + 18, h - 68, 28, 46, 0x3a2418);

  // Signboard above door
  g.fillStyle(0xd8c8a0);
  g.fillRect(w / 2 + 14, h - 78, 36, 10);
  g.fillStyle(0x6a5030);
  g.fillRect(w / 2 + 18, h - 75, 28, 4);

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawTownStoneHall(scene: Phaser.Scene, key: string): void {
  const w = 196;
  const h = 184;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(w / 2, h - 2, 168, 10);

  // Heavy stone base
  g.fillStyle(0x5a5850);
  g.fillRect(12, h - 18, w - 24, 18);
  g.fillStyle(0x7a7870);
  for (let x = 16; x < w - 20; x += 16) {
    g.fillRect(x, h - 16, 13, 6);
    g.fillStyle(0x4a4840);
    g.fillRect(x + 3, h - 8, 12, 5);
    g.fillStyle(0x7a7870);
  }

  // Cut stone walls
  g.fillStyle(0xc8c2b4);
  g.fillRect(18, 54, w - 36, h - 72);
  g.fillStyle(0xb0aa9c);
  g.fillRect(18, 54, 11, h - 72);
  g.fillStyle(0xd8d4c8, 0.4);
  g.fillRect(w - 34, 54, 16, h - 72);
  // Ashlar block courses
  g.lineStyle(1, 0x9a9488, 0.75);
  for (let y = 60; y < h - 22; y += 13) {
    g.lineBetween(18, y, w - 18, y);
    const off = ((y / 13) % 2) * 11;
    for (let x = 22 + off; x < w - 26; x += 22) {
      g.lineBetween(x, y, x, Math.min(y + 13, h - 22));
    }
  }
  // Subtle block shading
  g.fillStyle(0xa8a094, 0.35);
  g.fillRect(40, 72, 18, 10);
  g.fillRect(110, 98, 18, 10);
  g.fillRect(60, 130, 18, 10);

  // Slate pitched roof (layered)
  g.fillStyle(0x1a2838);
  g.fillTriangle(4, 60, w / 2, 4, w - 4, 60);
  g.fillStyle(0x2c3a4a);
  g.fillTriangle(10, 58, w / 2, 10, w - 10, 58);
  g.fillStyle(0x3a4a5c);
  g.fillTriangle(18, 56, w / 2, 16, w - 18, 56);
  g.lineStyle(1, 0x1a2838, 0.55);
  for (let y = 20; y < 54; y += 5) {
    const t = (y - 14) / 42;
    const half = (w / 2 - 18) * t;
    g.lineBetween(w / 2 - half, y, w / 2 + half, y);
  }
  // Ridge + bargeboards
  g.fillStyle(0x1a2030);
  g.fillRect(w / 2 - 3, 4, 6, 12);
  g.lineStyle(2, 0x1a2838, 0.9);
  g.lineBetween(10, 58, w / 2, 10);
  g.lineBetween(w - 10, 58, w / 2, 10);
  // Gutters
  g.fillStyle(0x3a4450);
  g.fillRect(14, 56, w - 28, 3);
  g.fillRect(16, 58, 3, 7);
  g.fillRect(w - 19, 58, 3, 7);

  drawTownChimney(g, w - 48, 14, false);

  // Tall arched center window
  const ax = w / 2;
  const ay = 68;
  g.fillStyle(0xe8e0d0);
  g.fillRect(ax - 20, ay - 2, 40, 56);
  g.fillStyle(0x1a2030);
  g.fillRect(ax - 18, ay, 36, 52);
  g.fillStyle(0x1a2030);
  g.beginPath();
  g.arc(ax, ay, 18, Math.PI, 0, false);
  g.fillPath();
  g.fillStyle(0xb8d4e8, 0.85);
  g.fillRect(ax - 16, ay + 4, 14, 20);
  g.fillRect(ax + 2, ay + 4, 14, 20);
  g.fillRect(ax - 16, ay + 28, 14, 20);
  g.fillRect(ax + 2, ay + 28, 14, 20);
  g.fillStyle(0xd0e8f4, 0.5);
  g.beginPath();
  g.arc(ax, ay, 15, Math.PI, 0, false);
  g.fillPath();
  g.lineStyle(2.5, 0xe8e0d0, 1);
  g.strokeRect(ax - 18, ay, 36, 52);
  g.beginPath();
  g.arc(ax, ay, 18, Math.PI, 0, false);
  g.strokePath();
  g.lineBetween(ax, ay, ax, ay + 52);
  g.lineBetween(ax - 18, ay + 26, ax + 18, ay + 26);
  // Mullion rose
  g.lineStyle(1.5, 0xd0c8b8, 0.9);
  g.lineBetween(ax - 10, ay - 8, ax + 10, ay - 8);

  drawTownWindow(g, 30, 78, false);
  drawTownWindow(g, w - 66, 78, true);

  // Fluted columns flanking entrance
  const drawFlutedCol = (cx: number) => {
    g.fillStyle(0xc8c4b8);
    g.fillRect(cx, 102, 12, h - 120);
    g.fillStyle(0xe8e4d8);
    g.fillRect(cx + 2, 102, 3, h - 120);
    g.fillStyle(0xb0aca0);
    g.fillRect(cx + 7, 102, 2, h - 120);
    g.fillStyle(0xd8d4c8);
    g.fillRect(cx + 10, 102, 1, h - 120);
    // Capital
    g.fillStyle(0xe8e4d8);
    g.fillRect(cx - 3, 98, 18, 6);
    g.fillRect(cx - 1, 94, 14, 5);
    // Base
    g.fillStyle(0xb8b4a8);
    g.fillRect(cx - 2, h - 22, 16, 5);
  };
  drawFlutedCol(28);
  drawFlutedCol(w - 40);

  // Pediment strip above door
  g.fillStyle(0xd8d4c8);
  g.fillRect(w / 2 - 24, h - 76, 48, 6);
  g.fillStyle(0xc0bcb0);
  g.fillTriangle(w / 2 - 22, h - 76, w / 2, h - 86, w / 2 + 22, h - 76);

  drawTownDoor(g, w / 2 - 15, h - 70, 30, 48, 0x4a3428);

  // Door lantern
  g.fillStyle(0x3a3830);
  g.fillRect(w / 2 + 18, h - 78, 3, 10);
  g.fillStyle(0x2a2820);
  g.fillRect(w / 2 + 14, h - 72, 11, 14);
  g.fillStyle(0xffe8a3, 0.9);
  g.fillRect(w / 2 + 16, h - 70, 7, 9);
  g.lineStyle(1, 0x4a4840, 1);
  g.strokeRect(w / 2 + 14, h - 72, 11, 14);
  g.lineBetween(w / 2 + 19, h - 72, w / 2 + 19, h - 58);
  g.lineBetween(w / 2 + 14, h - 65, w / 2 + 25, h - 65);

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawTownPlasterRow(scene: Phaser.Scene, key: string): void {
  const w = 172;
  const h = 174;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(w / 2, h - 2, 142, 10);

  g.fillStyle(0x7a756c);
  g.fillRect(14, h - 18, w - 28, 18);
  g.fillStyle(0x918a7e);
  for (let x = 18; x < w - 24; x += 14) {
    g.fillRect(x, h - 16, 11, 5);
    g.fillStyle(0x6a655c);
    g.fillRect(x + 2, h - 9, 10, 5);
    g.fillStyle(0x918a7e);
  }

  // Cream plaster walls
  g.fillStyle(0xf5efe4);
  g.fillRect(18, 50, w - 36, h - 68);
  g.fillStyle(0xe8e0d4);
  g.fillRect(18, 50, 8, h - 68);
  // Soft plaster mottling
  g.fillStyle(0xede6da, 0.5);
  g.fillRect(40, 70, 20, 14);
  g.fillRect(100, 110, 24, 12);

  // Corner quoins (alternating light/dark stone)
  for (let y = 52; y < h - 24; y += 14) {
    const light = ((y / 14) % 2) === 0;
    g.fillStyle(light ? 0xe0d8c8 : 0xc8c0b0);
    g.fillRect(18, y, 12, 11);
    g.fillRect(w - 30, y, 12, 11);
    g.fillStyle(light ? 0xc8c0b0 : 0xb8b0a0);
    g.fillRect(18, y, 2, 11);
    g.fillRect(w - 20, y, 2, 11);
  }

  // Terracotta tile roof (layered)
  g.fillStyle(0x8a3818);
  g.fillTriangle(6, 56, w / 2, 8, w - 6, 56);
  g.fillStyle(0xa84828);
  g.fillTriangle(12, 54, w / 2, 12, w - 12, 54);
  g.fillStyle(0xc06038);
  g.fillTriangle(18, 52, w / 2, 18, w - 18, 52);
  g.lineStyle(1, 0x8a3818, 0.65);
  for (let y = 22; y < 50; y += 5) {
    const t = (y - 16) / 36;
    const half = (w / 2 - 18) * t;
    g.lineBetween(w / 2 - half, y, w / 2 + half, y);
  }
  // Ridge tiles
  g.fillStyle(0x7a3010);
  g.fillRect(w / 2 - 3, 8, 6, 10);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(w / 2, 10 + i * 3, 2.5);
  }
  // Gutters / eaves
  g.fillStyle(0x6a5038);
  g.fillRect(14, 52, w - 28, 3);
  g.fillRect(16, 54, 3, 6);
  g.fillRect(w - 19, 54, 3, 6);

  drawTownChimney(g, 36, 16, true);

  // Iron balcony
  g.fillStyle(0x4a4848);
  g.fillRect(38, 92, w - 76, 5);
  g.fillStyle(0x3a3838);
  g.fillRect(36, 90, w - 72, 3);
  // Balusters with decorative tops
  for (let x = 42; x < w - 48; x += 9) {
    g.fillStyle(0x5a5858);
    g.fillRect(x, 76, 2, 16);
    g.fillCircle(x + 1, 76, 2);
  }
  // Handrail
  g.fillStyle(0x6a6868);
  g.fillRect(38, 74, w - 76, 3);
  // Scroll brackets
  g.lineStyle(2, 0x4a4848, 0.9);
  g.lineBetween(40, 95, 34, 108);
  g.lineBetween(w - 40, 95, w - 34, 108);

  // Upper windows behind balcony rail
  drawTownWindow(g, 34, 52, true);
  drawTownWindow(g, w - 70, 52, true);
  // Flower boxes on balcony
  g.fillStyle(0x5c3a21);
  g.fillRect(38, 88, 32, 5);
  g.fillRect(w - 74, 88, 32, 5);
  g.fillStyle(0xe85d75);
  g.fillCircle(46, 86, 3);
  g.fillStyle(0xf4a261);
  g.fillCircle(56, 85, 3);
  g.fillStyle(0x2a9d8f);
  g.fillCircle(66, 86, 3);
  g.fillStyle(0xe9c46a);
  g.fillCircle(w - 66, 85, 3);
  g.fillStyle(0xe76f51);
  g.fillCircle(w - 56, 86, 3);
  g.fillStyle(0x90be6d);
  g.fillCircle(w - 46, 85, 3);

  // Ground-floor windows
  drawTownWindow(g, 34, 108, false);
  drawTownWindow(g, w - 70, 108, false);
  // Lower flower boxes
  g.fillStyle(0x5c3a21);
  g.fillRect(30, 136, 36, 5);
  g.fillRect(w - 74, 136, 36, 5);
  g.fillStyle(0xc45a8a);
  g.fillCircle(38, 134, 2.5);
  g.fillStyle(0x5a9a4a);
  g.fillCircle(48, 133, 2.5);
  g.fillStyle(0xe8a030);
  g.fillCircle(58, 134, 2.5);
  g.fillStyle(0xd45060);
  g.fillCircle(w - 66, 133, 2.5);
  g.fillStyle(0x4a8a7a);
  g.fillCircle(w - 56, 134, 2.5);
  g.fillStyle(0xe8c040);
  g.fillCircle(w - 46, 133, 2.5);

  drawTownDoor(g, w / 2 - 14, h - 66, 28, 44, 0x5c3a28);

  // String course moulding
  g.fillStyle(0xe0d8c8);
  g.fillRect(18, 100, w - 36, 3);

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawTownTealShop(scene: Phaser.Scene, key: string): void {
  const w = 168;
  const h = 172;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(w / 2, h - 2, 138, 10);

  g.fillStyle(0x5a5850);
  g.fillRect(12, h - 18, w - 24, 18);
  g.fillStyle(0x7a7870);
  for (let x = 16; x < w - 20; x += 13) {
    g.fillRect(x, h - 16, 10, 5);
    g.fillStyle(0x4a4840);
    g.fillRect(x + 2, h - 9, 9, 5);
    g.fillStyle(0x7a7870);
  }

  // Teal clapboard walls
  g.fillStyle(0x3a7a78);
  g.fillRect(16, 48, w - 32, h - 66);
  g.fillStyle(0x2e6564);
  g.fillRect(16, 48, 8, h - 66);
  g.lineStyle(1, 0x2a5554, 0.55);
  for (let y = 54; y < h - 22; y += 6) {
    g.lineBetween(16, y, w - 16, y);
  }
  // Corner trim
  g.fillStyle(0xf0e8d8, 0.85);
  g.fillRect(16, 48, 3, h - 66);
  g.fillRect(w - 19, 48, 3, h - 66);

  // Dark shingle roof (layered)
  g.fillStyle(0x1a1a22);
  g.fillTriangle(4, 54, w / 2, 6, w - 4, 54);
  g.fillStyle(0x2a2a32);
  g.fillTriangle(10, 52, w / 2, 12, w - 10, 52);
  g.fillStyle(0x3a3a44);
  g.fillTriangle(16, 50, w / 2, 16, w - 16, 50);
  g.lineStyle(1, 0x1a1a22, 0.6);
  for (let y = 18; y < 48; y += 5) {
    const t = (y - 14) / 36;
    const half = (w / 2 - 16) * t;
    g.lineBetween(w / 2 - half, y, w / 2 + half, y);
  }
  // Scalloped shingle tips
  g.fillStyle(0x2a2a32);
  for (let i = 0; i < 9; i++) {
    const tx = 20 + i * ((w - 40) / 8);
    g.fillCircle(tx, 50, 3);
  }
  g.fillStyle(0x1a1a22);
  g.fillRect(w / 2 - 3, 6, 6, 10);
  // Gutters
  g.fillStyle(0x3a3a40);
  g.fillRect(12, 50, w - 24, 3);
  g.fillRect(14, 52, 3, 6);
  g.fillRect(w - 17, 52, 3, 6);

  drawTownChimney(g, w - 44, 14, true);

  // Bay shop window (projecting)
  const bx = 22;
  const by = 78;
  // Bay sides (perspective wedges)
  g.fillStyle(0x2a5554);
  g.fillTriangle(bx - 6, by, bx, by, bx, by + 46);
  g.fillTriangle(bx - 6, by + 46, bx, by, bx, by + 46);
  g.fillTriangle(bx + 58, by, bx + 64, by, bx + 58, by + 46);
  g.fillTriangle(bx + 58, by + 46, bx + 64, by, bx + 64, by + 46);
  g.fillStyle(0xd8d0c0);
  g.fillRect(bx - 2, by - 2, 62, 50);
  g.fillStyle(0x1a2430);
  g.fillRect(bx, by, 58, 46);
  // Three bay panes
  g.fillStyle(0xa8d4e8, 0.85);
  g.fillRect(bx + 2, by + 2, 16, 20);
  g.fillRect(bx + 21, by + 2, 16, 20);
  g.fillRect(bx + 40, by + 2, 16, 20);
  g.fillRect(bx + 2, by + 25, 16, 18);
  g.fillRect(bx + 21, by + 25, 16, 18);
  g.fillRect(bx + 40, by + 25, 16, 18);
  // Goods display
  g.fillStyle(0xc45a3a);
  g.fillRect(bx + 5, by + 30, 7, 8);
  g.fillStyle(0xe8c85a);
  g.fillCircle(bx + 28, by + 34, 4);
  g.fillStyle(0x4a6a9a);
  g.fillRect(bx + 44, by + 28, 8, 10);
  g.fillStyle(0xd4a060);
  g.fillRect(bx + 8, by + 8, 6, 6);
  g.fillStyle(0x8a4a6a);
  g.fillCircle(bx + 48, by + 12, 3);
  g.lineStyle(2, 0xe0d8c8, 1);
  g.strokeRect(bx, by, 58, 46);
  g.lineBetween(bx + 19, by, bx + 19, by + 46);
  g.lineBetween(bx + 38, by, bx + 38, by + 46);
  g.lineBetween(bx, by + 23, bx + 58, by + 23);
  // Bay roof ledge
  g.fillStyle(0x2a2a32);
  g.fillRect(bx - 8, by - 8, 74, 6);

  // Red / cream striped canopy
  g.fillStyle(0xa03828);
  g.fillRect(bx - 4, by - 18, 66, 12);
  for (let i = 0; i < 6; i++) {
    g.fillStyle(i % 2 === 0 ? 0xd45040 : 0xf0e8d8);
    g.fillRect(bx - 2 + i * 11, by - 17, 10, 10);
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle(i % 2 === 0 ? 0xd45040 : 0xf0e8d8);
    g.fillCircle(bx + 3 + i * 11, by - 6, 5);
  }
  g.fillStyle(0x4a4840);
  g.fillRect(bx, by - 6, 2, 6);
  g.fillRect(bx + 54, by - 6, 2, 6);

  // Upper window
  drawTownWindow(g, w - 60, 54, true);
  g.fillStyle(0x5c3a21);
  g.fillRect(w - 64, 82, 36, 5);
  g.fillStyle(0xe85d75);
  g.fillCircle(w - 56, 80, 3);
  g.fillStyle(0xf4a261);
  g.fillCircle(w - 46, 79, 3);
  g.fillStyle(0x2a9d8f);
  g.fillCircle(w - 36, 80, 3);

  drawTownDoor(g, w / 2 + 20, h - 66, 26, 44, 0x2a1a12);

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawTownYellowHome(scene: Phaser.Scene, key: string): void {
  const w = 176;
  const h = 178;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(w / 2, h - 2, 148, 10);

  g.fillStyle(0x6a6860);
  g.fillRect(14, h - 18, w - 28, 18);
  g.fillStyle(0x8a8880);
  for (let x = 18; x < w - 24; x += 14) {
    g.fillRect(x, h - 16, 11, 5);
    g.fillStyle(0x5a5850);
    g.fillRect(x + 2, h - 9, 10, 5);
    g.fillStyle(0x8a8880);
  }

  // Warm yellow clapboard
  g.fillStyle(0xe8c85a);
  g.fillRect(18, 52, w - 36, h - 70);
  g.fillStyle(0xd4b448);
  g.fillRect(18, 52, 9, h - 70);
  g.lineStyle(1, 0xc4a438, 0.55);
  for (let y = 58; y < h - 24; y += 6) {
    g.lineBetween(18, y, w - 18, y);
  }
  // White corner trim / fascia
  g.fillStyle(0xf5f0e4, 0.95);
  g.fillRect(18, 52, 3, h - 70);
  g.fillRect(w - 21, 52, 3, h - 70);
  g.fillRect(18, 52, w - 36, 3);

  // Green roof (layered) + bargeboards
  g.fillStyle(0x1a4a2a);
  g.fillTriangle(6, 58, w / 2, 8, w - 6, 58);
  g.fillStyle(0x2a5a3a);
  g.fillTriangle(12, 56, w / 2, 12, w - 12, 56);
  g.fillStyle(0x3a7a4a);
  g.fillTriangle(18, 54, w / 2, 18, w - 18, 54);
  g.lineStyle(1, 0x1a4a2a, 0.55);
  for (let y = 22; y < 52; y += 5) {
    const t = (y - 16) / 38;
    const half = (w / 2 - 18) * t;
    g.lineBetween(w / 2 - half, y, w / 2 + half, y);
  }
  g.fillStyle(0x1a3a24);
  g.fillRect(w / 2 - 3, 8, 6, 10);
  g.lineStyle(2, 0xf5f0e4, 0.85);
  g.lineBetween(12, 56, w / 2, 12);
  g.lineBetween(w - 12, 56, w / 2, 12);
  // Gutters
  g.fillStyle(0x4a6a50);
  g.fillRect(14, 54, w - 28, 3);
  g.fillRect(16, 56, 3, 6);
  g.fillRect(w - 19, 56, 3, 6);

  drawTownChimney(g, w - 46, 16, true);

  // Dormer
  g.fillStyle(0xe8c85a);
  g.fillRect(w / 2 - 16, 28, 32, 26);
  g.fillStyle(0xd4b448);
  g.fillRect(w / 2 - 16, 28, 4, 26);
  g.fillStyle(0x1a4a2a);
  g.fillTriangle(w / 2 - 18, 32, w / 2, 12, w / 2 + 18, 32);
  g.fillStyle(0x2a5a3a);
  g.fillTriangle(w / 2 - 14, 30, w / 2, 16, w / 2 + 14, 30);
  g.fillStyle(0x1a2430);
  g.fillRect(w / 2 - 10, 34, 20, 16);
  g.fillStyle(0xffe8a3, 0.9);
  g.fillRect(w / 2 - 8, 36, 7, 6);
  g.fillRect(w / 2 + 1, 36, 7, 6);
  g.fillRect(w / 2 - 8, 44, 7, 5);
  g.fillRect(w / 2 + 1, 44, 7, 5);
  g.lineStyle(1.5, 0xf5f0e4, 1);
  g.strokeRect(w / 2 - 10, 34, 20, 16);
  g.lineBetween(w / 2, 34, w / 2, 50);
  g.lineBetween(w / 2 - 10, 42, w / 2 + 10, 42);

  // Upper windows + flower boxes
  drawTownWindow(g, 28, 62, true);
  drawTownWindow(g, w - 64, 62, false);
  g.fillStyle(0x5c3a21);
  g.fillRect(24, 90, 36, 6);
  g.fillRect(w - 68, 90, 36, 6);
  g.fillStyle(0xe85d75);
  g.fillCircle(32, 88, 3);
  g.fillStyle(0xf4a261);
  g.fillCircle(42, 87, 3);
  g.fillStyle(0x2a9d8f);
  g.fillCircle(52, 88, 3);
  g.fillStyle(0xe9c46a);
  g.fillCircle(w - 60, 87, 3);
  g.fillStyle(0xe76f51);
  g.fillCircle(w - 50, 88, 3);
  g.fillStyle(0x90be6d);
  g.fillCircle(w - 40, 87, 3);

  // Porch floor / deck
  g.fillStyle(0xa09070);
  g.fillRect(22, h - 36, w - 44, 10);
  g.fillStyle(0x8a7a58);
  g.fillRect(20, h - 28, w - 40, 4);
  // Porch posts
  g.fillStyle(0xf5f0e4);
  g.fillRect(26, h - 78, 5, 44);
  g.fillRect(w - 31, h - 78, 5, 44);
  g.fillStyle(0xe8e0d0);
  g.fillRect(24, h - 80, 9, 5);
  g.fillRect(w - 33, h - 80, 9, 5);
  // Porch rail with balusters
  g.fillStyle(0xf5f0e4);
  g.fillRect(30, h - 58, w - 60, 3);
  g.fillRect(30, h - 42, w - 60, 3);
  for (let x = 36; x < w - 40; x += 10) {
    g.fillRect(x, h - 56, 2, 16);
  }

  // Lower side windows behind porch
  drawTownWindow(g, 36, 104, false);
  drawTownWindow(g, w - 72, 104, true);

  drawTownDoor(g, w / 2 - 14, h - 72, 28, 42, 0x5c3a21);

  // Porch roof overhang
  g.fillStyle(0x2a5a3a);
  g.fillRect(16, h - 82, w - 32, 6);
  g.fillStyle(0x3a7a4a);
  g.fillRect(18, h - 80, w - 36, 3);

  g.generateTexture(key, w, h);
  g.destroy();
}

function drawTownWindow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  lit: boolean
): void {
  g.fillStyle(0xe8e0d0);
  g.fillRect(x - 2, y - 2, 30, 28);
  g.fillStyle(0xd0c8b8);
  g.fillRect(x - 3, y + 24, 32, 4);
  g.fillStyle(0x1a2430);
  g.fillRect(x, y, 26, 22);
  g.fillStyle(lit ? 0xffe8a3 : 0x7eb8d4, lit ? 0.92 : 0.65);
  g.fillRect(x + 2, y + 2, 10, 8);
  g.fillRect(x + 14, y + 2, 10, 8);
  g.fillRect(x + 2, y + 12, 10, 8);
  g.fillRect(x + 14, y + 12, 10, 8);
  if (lit) {
    g.fillStyle(0xfff6d0, 0.35);
    g.fillRect(x + 3, y + 3, 4, 3);
  }
  g.lineStyle(1.5, 0xc8c0b0, 1);
  g.strokeRect(x, y, 26, 22);
  g.lineBetween(x + 13, y, x + 13, y + 22);
  g.lineBetween(x, y + 11, x + 26, y + 11);
  g.fillStyle(0x3d6b4f);
  g.fillRect(x - 8, y, 6, 22);
  g.fillRect(x + 28, y, 6, 22);
  g.lineStyle(1, 0x2a4a36, 0.85);
  g.lineBetween(x - 5, y + 2, x - 5, y + 20);
  g.lineBetween(x + 31, y + 2, x + 31, y + 20);
}

function drawTownDoor(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number
): void {
  g.fillStyle(color);
  g.fillRoundedRect(x, y, w, h, 2);
  g.fillStyle(0x000000, 0.18);
  g.fillRect(x + 2, y + 4, w - 4, 3);
  g.fillRect(x + 2, y + h * 0.45, w - 4, 2);
  g.fillRect(x + 2, y + h * 0.7, w - 4, 2);
  g.lineStyle(1.5, 0x2a1a10, 0.7);
  g.strokeRoundedRect(x, y, w, h, 2);
  g.fillStyle(0xd4af37);
  g.fillCircle(x + w - 6, y + h * 0.48, 2.2);
  g.fillStyle(0x8a8880);
  g.fillRect(x - 4, y + h - 2, w + 8, 5);
  g.fillStyle(0x9a9890);
  g.fillRect(x - 6, y + h + 2, w + 12, 4);
}

function drawTownChimney(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  brick = true
): void {
  g.fillStyle(brick ? 0x8a5040 : 0x6b5b4b);
  g.fillRect(x, y, 16, 32);
  g.fillStyle(brick ? 0x6e3a30 : 0x56463a);
  g.fillRect(x - 2, y - 4, 20, 7);
  g.lineStyle(1, brick ? 0x5a2e24 : 0x4a3c32, 0.6);
  g.lineBetween(x, y + 10, x + 16, y + 10);
  g.lineBetween(x, y + 20, x + 16, y + 20);
  g.lineBetween(x + 8, y, x + 8, y + 28);
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

  // Tall town tree — denser canopy, longer trunk
  g.clear();
  {
    const tw = 96;
    const th = 168;
    const cx = tw / 2;
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, th - 3, 42, 10);
    // Trunk with bark ridges
    g.fillStyle(0x5c3a21);
    g.fillRect(cx - 8, 78, 16, th - 86);
    g.fillStyle(0x4a2e18);
    g.fillRect(cx - 8, 78, 5, th - 86);
    g.fillStyle(0x6b4423);
    g.fillRect(cx + 2, 78, 3, th - 86);
    g.lineStyle(1, 0x3a2414, 0.55);
    for (let y = 85; y < th - 14; y += 11) {
      g.lineBetween(cx - 6, y, cx + 6, y + 3);
    }
    // Branch forks
    g.fillStyle(0x5c3a21);
    g.fillTriangle(cx - 6, 95, cx - 28, 72, cx - 2, 88);
    g.fillTriangle(cx + 6, 92, cx + 30, 68, cx + 2, 86);
    g.fillStyle(0x4a2e18);
    g.fillRect(cx - 26, 70, 10, 4);
    g.fillRect(cx + 16, 66, 12, 4);
    // Layered canopy
    g.fillStyle(0x1e4a24);
    g.fillCircle(cx, 52, 36);
    g.fillCircle(cx - 22, 58, 26);
    g.fillCircle(cx + 24, 56, 28);
    g.fillStyle(0x2f6b3a);
    g.fillCircle(cx - 8, 40, 28);
    g.fillCircle(cx + 14, 38, 26);
    g.fillCircle(cx, 28, 22);
    g.fillStyle(0x4a9344);
    g.fillCircle(cx - 12, 34, 16);
    g.fillCircle(cx + 10, 30, 15);
    g.fillCircle(cx + 2, 22, 14);
    g.fillStyle(0x6fbf5c, 0.85);
    g.fillCircle(cx - 6, 24, 9);
    g.fillCircle(cx + 12, 28, 8);
    g.fillCircle(cx + 4, 18, 7);
    // Specular leaf flecks
    g.fillStyle(0x8fd46e, 0.75);
    g.fillCircle(cx - 10, 22, 3);
    g.fillCircle(cx + 8, 20, 2.5);
    g.fillCircle(cx + 16, 34, 2);
    // Roots
    g.fillStyle(0x5c3a21);
    g.fillRect(cx - 14, th - 12, 10, 8);
    g.fillRect(cx + 4, th - 10, 12, 6);
    g.fillRect(cx - 4, th - 8, 8, 8);
    g.generateTexture("tree_tall", tw, th);
  }

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

  // Compact trader stall (Collectors bargainers)
  g.clear();
  const stallW = 72;
  const stallH = 64;
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(stallW / 2, stallH - 1, 58, 7);
  g.fillStyle(0x5c3a21);
  g.fillRect(6, 22, 4, 38);
  g.fillRect(stallW - 10, 22, 4, 38);
  g.fillStyle(0xc45c4a);
  g.fillRect(2, 12, stallW - 4, 12);
  g.fillStyle(0xf0e6d0);
  for (let i = 0; i < 5; i++) g.fillRect(4 + i * 13, 12, 6, 12);
  g.fillStyle(0x5c3a21);
  g.fillRect(2, 10, stallW - 4, 3);
  g.fillStyle(0xa06a3a);
  g.fillRect(4, 48, stallW - 8, 10);
  g.fillStyle(0x7a4a28);
  g.fillRect(4, 56, stallW - 8, 3);
  g.fillStyle(0x6b4423);
  g.fillRect(12, 36, 14, 12);
  g.fillRect(44, 34, 16, 14);
  g.fillStyle(0xd8e8f0);
  g.fillRect(28, 38, 14, 8);
  g.generateTexture("trader_stand", stallW, stallH);

  // Concrete town road
  g.clear();
  g.fillStyle(0x8a8e92);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(0x969a9e);
  g.fillRect(0, 0, 32, 8);
  g.fillStyle(0x7a7e82);
  g.fillRect(2, 10, 6, 3);
  g.fillRect(14, 18, 8, 2);
  g.fillRect(22, 8, 5, 4);
  g.fillStyle(0xa0a4a8, 0.7);
  g.fillRect(8, 24, 4, 2);
  g.fillRect(20, 14, 3, 2);
  // seam line
  g.fillStyle(0x6e7276, 0.8);
  g.fillRect(15, 0, 2, 32);
  g.generateTexture("concrete", 32, 32);

  // Street lamp — straight centered pole, lantern on top (not side-arm)
  g.clear();
  const lw = 24;
  const lh = 100;
  const cx = lw / 2;
  g.fillStyle(0x000000, 0.14);
  g.fillEllipse(cx, lh - 2, 16, 5);
  // Base
  g.fillStyle(0x3a3a42);
  g.fillRect(cx - 7, lh - 12, 14, 8);
  g.fillStyle(0x4a4a54);
  g.fillRect(cx - 5, lh - 14, 10, 4);
  // Straight pole
  g.fillStyle(0x3a3a42);
  g.fillRect(cx - 2, 34, 4, lh - 46);
  g.fillStyle(0x2e2e36);
  g.fillRect(cx - 1, 34, 1, lh - 46);
  // Collar under lantern
  g.fillStyle(0x4a4a54);
  g.fillRect(cx - 5, 30, 10, 5);
  // Lantern cage (centered)
  g.fillStyle(0x2a2a32);
  g.fillRect(cx - 8, 10, 16, 22);
  g.fillStyle(0xffe8a0, 0.95);
  g.fillRect(cx - 6, 14, 12, 14);
  g.fillStyle(0xfff6d0, 0.45);
  g.fillCircle(cx, 21, 7);
  // Cage bars
  g.lineStyle(1, 0x3a3a42, 0.85);
  g.lineBetween(cx, 12, cx, 30);
  g.lineBetween(cx - 6, 21, cx + 6, 21);
  // Cap
  g.fillStyle(0x3a3a42);
  g.fillRect(cx - 9, 8, 18, 4);
  g.fillTriangle(cx - 10, 10, cx, 1, cx + 10, 10);
  g.fillStyle(0x5a5a64);
  g.fillRect(cx - 1, 0, 2, 4);
  g.generateTexture("lamp_post", lw, lh);

  // Terracotta pot with leafy bush
  g.clear();
  {
    const pw = 36;
    const ph = 48;
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(pw / 2, ph - 2, 22, 5);
    // Pot
    g.fillStyle(0xb86a3a);
    g.fillTriangle(8, 28, pw / 2, ph - 4, pw - 8, 28);
    g.fillStyle(0xd4844a);
    g.fillRect(7, 24, pw - 14, 8);
    g.fillStyle(0xa05a30);
    g.fillRect(7, 30, pw - 14, 2);
    g.fillStyle(0xe8a060);
    g.fillRect(6, 22, pw - 12, 4);
    // Soil
    g.fillStyle(0x4a3420);
    g.fillEllipse(pw / 2, 24, 20, 6);
    // Foliage clusters
    g.fillStyle(0x2e6b34);
    g.fillCircle(pw / 2, 14, 11);
    g.fillCircle(pw / 2 - 8, 16, 8);
    g.fillCircle(pw / 2 + 8, 15, 8);
    g.fillStyle(0x3f8a3a);
    g.fillCircle(pw / 2 - 3, 10, 7);
    g.fillCircle(pw / 2 + 5, 11, 6);
    g.fillStyle(0x5aad4e);
    g.fillCircle(pw / 2 + 1, 8, 5);
    // Leaf highlights
    g.fillStyle(0x7ec85a, 0.7);
    g.fillCircle(pw / 2 - 4, 9, 2.5);
    g.fillCircle(pw / 2 + 6, 12, 2);
    // Tiny flower accents
    g.fillStyle(0xe85d75);
    g.fillCircle(pw / 2 - 7, 14, 2);
    g.fillStyle(0xf4a261);
    g.fillCircle(pw / 2 + 8, 13, 2);
    g.generateTexture("pot_plant_a", pw, ph);
  }

  // Square planter with tall blooms
  g.clear();
  {
    const pw = 40;
    const ph = 52;
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(pw / 2, ph - 2, 24, 5);
    // Ceramic planter
    g.fillStyle(0xd8d0c0);
    g.fillRoundedRect(8, 30, pw - 16, 18, 2);
    g.fillStyle(0xc0b8a8);
    g.fillRect(8, 30, 4, 18);
    g.fillStyle(0xe8e0d4);
    g.fillRect(8, 28, pw - 16, 5);
    g.lineStyle(1, 0xa09888, 0.8);
    g.strokeRoundedRect(8, 30, pw - 16, 18, 2);
    // Soil
    g.fillStyle(0x3a2818);
    g.fillEllipse(pw / 2, 30, 22, 5);
    // Stems
    g.fillStyle(0x3a6a28);
    g.fillRect(pw / 2 - 6, 12, 2, 18);
    g.fillRect(pw / 2 + 2, 10, 2, 20);
    g.fillRect(pw / 2 + 8, 14, 2, 16);
    g.fillRect(pw / 2 - 12, 16, 2, 14);
    // Blooms
    g.fillStyle(0xe85d75);
    g.fillCircle(pw / 2 - 5, 10, 4);
    g.fillStyle(0xff9ec8);
    g.fillCircle(pw / 2 - 5, 9, 2);
    g.fillStyle(0xf4a261);
    g.fillCircle(pw / 2 + 3, 8, 4.5);
    g.fillStyle(0xffe066);
    g.fillCircle(pw / 2 + 3, 7, 2);
    g.fillStyle(0x7ec8ff);
    g.fillCircle(pw / 2 + 9, 12, 3.5);
    g.fillStyle(0xc77dff);
    g.fillCircle(pw / 2 - 11, 14, 3.5);
    // Leaves
    g.fillStyle(0x4a9a3a);
    g.fillEllipse(pw / 2 - 2, 20, 8, 4);
    g.fillEllipse(pw / 2 + 6, 18, 7, 3.5);
    g.generateTexture("pot_plant_b", pw, ph);
  }

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

/** Detailed floor crack with hanging rope — entrance to the amulet cave. */
export function placeCaveCrack(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  depth: number
): void {
  const g = scene.add.graphics().setDepth(depth);

  // Deep void (layered ellipses for depth)
  g.fillStyle(0x050308, 0.55);
  g.fillEllipse(x + 2, groundY + 6, 118, 36);
  g.fillStyle(0x0a0604, 0.95);
  g.fillEllipse(x, groundY + 3, 96, 28);
  g.fillStyle(0x140c08, 1);
  g.fillEllipse(x, groundY + 1, 78, 20);
  g.fillStyle(0x1e140c, 1);
  g.fillEllipse(x - 2, groundY, 58, 12);
  // Absolute dark throat
  g.fillStyle(0x020104, 1);
  g.fillEllipse(x, groundY + 2, 34, 8);

  // Warm cavern glow from below
  g.fillStyle(0xffb060, 0.07);
  g.fillEllipse(x, groundY + 5, 44, 14);
  g.fillStyle(0xffd090, 0.05);
  g.fillEllipse(x - 4, groundY + 3, 22, 8);

  // Outer ruptured stone plates
  const plates: Array<[number, number, number, number, number]> = [
    [x - 52, groundY - 8, 22, 10, 0x3a2c20],
    [x - 38, groundY - 4, 18, 9, 0x4a3828],
    [x + 34, groundY - 6, 24, 11, 0x3a2c20],
    [x + 48, groundY - 3, 16, 8, 0x4a3828],
    [x - 10, groundY - 10, 20, 8, 0x2e2218],
    [x + 12, groundY - 9, 18, 7, 0x3a2c20],
  ];
  for (const [px, py, w, h, c] of plates) {
    g.fillStyle(c);
    g.fillRoundedRect(px - w / 2, py - h / 2, w, h, 2);
    g.fillStyle(0x1a120c, 0.45);
    g.fillRoundedRect(px - w / 2 + 1, py, w - 2, h / 2, 1);
    g.lineStyle(1, 0x6a5848, 0.5);
    g.strokeRoundedRect(px - w / 2, py - h / 2, w, h, 2);
  }

  // Jagged crack lip (north edge)
  g.lineStyle(6, 0x1a1008, 1);
  g.beginPath();
  g.moveTo(x - 54, groundY - 3);
  g.lineTo(x - 40, groundY + 5);
  g.lineTo(x - 26, groundY - 2);
  g.lineTo(x - 14, groundY + 7);
  g.lineTo(x - 2, groundY - 1);
  g.lineTo(x + 10, groundY + 8);
  g.lineTo(x + 22, groundY - 2);
  g.lineTo(x + 36, groundY + 6);
  g.lineTo(x + 50, groundY - 3);
  g.strokePath();

  // Highlighted inner rim
  g.lineStyle(2.5, 0x7a6048, 0.9);
  g.beginPath();
  g.moveTo(x - 44, groundY - 1);
  g.lineTo(x - 32, groundY + 3);
  g.lineTo(x - 18, groundY);
  g.lineTo(x - 6, groundY + 4);
  g.lineTo(x + 6, groundY);
  g.lineTo(x + 18, groundY + 5);
  g.lineTo(x + 30, groundY);
  g.lineTo(x + 42, groundY + 3);
  g.strokePath();
  g.lineStyle(1.2, 0xc4a86a, 0.35);
  g.beginPath();
  g.moveTo(x - 40, groundY);
  g.lineTo(x - 20, groundY + 2);
  g.lineTo(x, groundY + 1);
  g.lineTo(x + 20, groundY + 3);
  g.lineTo(x + 38, groundY);
  g.strokePath();

  // Branching hairline fissures
  g.lineStyle(1.4, 0x1a120c, 0.85);
  const fissures: Array<[number, number, number, number]> = [
    [x - 62, groundY - 6, x - 46, groundY + 1],
    [x - 58, groundY - 12, x - 44, groundY - 4],
    [x + 46, groundY + 1, x + 64, groundY - 7],
    [x + 42, groundY - 3, x + 58, groundY - 14],
    [x - 16, groundY - 14, x - 4, groundY - 2],
    [x + 4, groundY - 12, x + 18, groundY - 1],
    [x - 28, groundY - 16, x - 22, groundY - 6],
    [x + 24, groundY - 15, x + 30, groundY - 5],
  ];
  for (const [x0, y0, x1, y1] of fissures) {
    g.lineBetween(x0, y0, x1, y1);
  }
  g.lineStyle(1, 0x0a0806, 0.55);
  g.lineBetween(x - 50, groundY - 18, x - 36, groundY - 8);
  g.lineBetween(x + 38, groundY - 9, x + 52, groundY - 18);

  // Moss & lichen on rims
  g.fillStyle(0x3a5a28, 0.55);
  g.fillEllipse(x - 36, groundY - 5, 14, 5);
  g.fillEllipse(x + 30, groundY - 4, 12, 4);
  g.fillStyle(0x4a6a30, 0.4);
  g.fillEllipse(x - 20, groundY - 7, 8, 3);
  g.fillEllipse(x + 8, groundY - 8, 10, 3);

  // Gravel & rubble pile
  const rubble: Array<[number, number, number, number]> = [
    [x - 34, groundY - 2, 3.5, 0x4a3828],
    [x - 28, groundY - 1, 2.5, 0x5a4838],
    [x - 22, groundY - 3, 2, 0x3a2c20],
    [x + 22, groundY - 2, 3, 0x4a3828],
    [x + 28, groundY - 1, 2.2, 0x6a5848],
    [x + 34, groundY - 3, 2.8, 0x3a2c20],
    [x + 6, groundY - 4, 2, 0x5a4838],
    [x - 6, groundY - 5, 1.8, 0x4a3828],
    [x + 14, groundY - 3, 1.5, 0x2e2218],
    [x - 14, groundY - 2, 2.2, 0x6a5848],
  ];
  for (const [rx, ry, rr, c] of rubble) {
    g.fillStyle(c);
    g.fillCircle(rx, ry, rr);
    g.fillStyle(0xffffff, 0.08);
    g.fillCircle(rx - rr * 0.3, ry - rr * 0.3, rr * 0.35);
  }

  // Wooden stake + iron ring anchoring the rope
  g.fillStyle(0x2a1a10);
  g.fillRoundedRect(x - 14, groundY - 58, 20, 10, 2);
  g.fillStyle(0x5c3a21);
  g.fillRoundedRect(x - 13, groundY - 57, 18, 7, 2);
  g.fillStyle(0x8b5a2b);
  g.fillRect(x - 11, groundY - 56, 3, 5);
  g.fillRect(x - 4, groundY - 56, 2, 5);
  g.fillRect(x + 3, groundY - 56, 3, 5);
  // Iron ring
  g.lineStyle(3, 0x4a4a50);
  g.strokeCircle(x - 2, groundY - 50, 5);
  g.lineStyle(1.5, 0x8a8a90, 0.7);
  g.strokeCircle(x - 2, groundY - 50, 5);
  g.fillStyle(0x2a2a30);
  g.fillCircle(x - 2, groundY - 50, 2);

  // Twisted rope into the dark (multiple strands)
  const rope = scene.add.graphics().setDepth(depth + 1);
  const ropePts = [
    [x - 2, groundY - 50],
    [x - 5, groundY - 38],
    [x - 1, groundY - 26],
    [x + 3, groundY - 16],
    [x - 1, groundY - 6],
    [x + 1, groundY + 2],
  ] as const;
  // Shadow strand
  rope.lineStyle(5, 0x2a1a0c, 0.55);
  rope.beginPath();
  rope.moveTo(ropePts[0][0] + 2, ropePts[0][1]);
  for (let i = 1; i < ropePts.length; i++) {
    rope.lineTo(ropePts[i][0] + 2, ropePts[i][1]);
  }
  rope.strokePath();
  // Main hemp
  rope.lineStyle(4, 0x6b4a1e);
  rope.beginPath();
  rope.moveTo(ropePts[0][0], ropePts[0][1]);
  for (let i = 1; i < ropePts.length; i++) {
    rope.lineTo(ropePts[i][0], ropePts[i][1]);
  }
  rope.strokePath();
  // Highlight strand
  rope.lineStyle(1.8, 0xd4b070, 0.85);
  rope.beginPath();
  rope.moveTo(ropePts[0][0] - 1.2, ropePts[0][1]);
  for (let i = 1; i < ropePts.length; i++) {
    rope.lineTo(ropePts[i][0] - 1.2, ropePts[i][1]);
  }
  rope.strokePath();
  // Twist marks
  rope.lineStyle(1, 0x3a2414, 0.6);
  for (let i = 0; i < ropePts.length - 1; i++) {
    const mx = (ropePts[i][0] + ropePts[i + 1][0]) / 2;
    const my = (ropePts[i][1] + ropePts[i + 1][1]) / 2;
    rope.lineBetween(mx - 3, my - 1, mx + 3, my + 1);
  }
  // End fray disappearing into pit
  rope.lineStyle(1.2, 0x8b6914, 0.5);
  rope.lineBetween(x, groundY + 2, x - 3, groundY + 6);
  rope.lineBetween(x, groundY + 2, x + 3, groundY + 7);
  rope.lineBetween(x, groundY + 2, x + 1, groundY + 8);

  // Soft underground lantern glow + spark motes
  const glow = scene.add
    .ellipse(x, groundY + 4, 48, 14, 0xffc878, 0.1)
    .setDepth(depth - 1);
  scene.tweens.add({
    targets: glow,
    alpha: 0.04,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
  for (let i = 0; i < 5; i++) {
    const mote = scene.add
      .circle(
        x + (i - 2) * 7,
        groundY + 1 + (i % 2),
        1.2 + (i % 3) * 0.4,
        0xffe8a0,
        0.55
      )
      .setDepth(depth + 2);
    scene.tweens.add({
      targets: mote,
      y: mote.y - 10 - i * 2,
      alpha: 0,
      duration: 1600 + i * 200,
      delay: i * 180,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeOut",
    });
  }
}

export function placeVillage(
  scene: Phaser.Scene,
  groundY: number,
  islandLeft: number,
  islandRight: number,
  night?: NightAmbient
): void {
  const depth = 3;
  // Local X offset so village sits on the island strip
  const ox = islandLeft;

  // Distant hills (tied to starter island — no world-wide parallax bleed)
  const hills = scene.add.graphics().setScrollFactor(1).setDepth(0);
  hills.fillStyle(0x6fae6a, 0.55);
  hills.fillEllipse(ox + 180, 480, 420, 140);
  hills.fillStyle(0x5e9a5c, 0.5);
  hills.fillEllipse(ox + 520, 490, 380, 120);
  hills.fillStyle(0x4e8a55, 0.45);
  hills.fillEllipse(ox + 820, 500, 340, 110);

  // Clouds
  for (let i = 0; i < 5; i++) {
    const cloud = scene.add
      .image(ox + 120 + i * 220, 70 + (i % 3) * 30, "cloud")
      .setScrollFactor(0.94)
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

  // Chimney smoke — tops of each cottage chimney (house origin is bottom-center)
  const chimneyLocalX = 47; // texture center → chimney center (w=180)
  const chimneyLocalY = 146; // texture bottom → chimney cap top (h=160)
  const smokeHouses = [
    { x: redHouseX, scale: 1 },
    { x: greenHouseX, scale: 1.05 },
    { x: blueHouseX, scale: 0.95 },
  ];
  for (const house of smokeHouses) {
    const cx = house.x + chimneyLocalX * house.scale;
    const cy = groundY - chimneyLocalY * house.scale;
    for (let s = 0; s < 3; s++) {
      const smoke = scene.add
        .circle(cx, cy - s * 6, 4 + s, 0xd0d0d0, 0.35)
        .setDepth(depth + 2);
      scene.tweens.add({
        targets: smoke,
        y: smoke.y - 40,
        x: smoke.x + 6,
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

  // Street lamps + warm night glows along the path / yards
  const lampXs = [
    ox + 170,
    Math.round((redHouseX + merchantStandX) / 2),
    Math.round((merchantStandX + greenHouseX) / 2),
    Math.round((greenHouseX + blueHouseX) / 2),
    ox + 800,
    islandLeft + 40,
    islandRight - 40,
  ];
  for (const lx of lampXs) {
    scene.add
      .image(lx, groundY, "lamp_post")
      .setDepth(depth + 2)
      .setOrigin(0.5, 1)
      .setScale(0.92);
    const lanternY = groundY - 78;
    const halo = scene.add
      .circle(lx, lanternY, 36, 0xffe08a, 0.04)
      .setDepth(depth + 1.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    const pool = scene.add
      .ellipse(lx, groundY - 2, 56, 18, 0xffe8a0, 0.04)
      .setDepth(depth + 0.5);
    night?.addGlow(halo, 0.02, 0.55);
    night?.addGlow(pool, 0.03, 0.32);
    if (night) {
      scene.tweens.add({
        targets: halo,
        scale: 1.12,
        duration: 1800 + (Math.abs(lx) % 7) * 160,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // Soft window lights on cottages (brighten at night)
  const windowGlows: Array<{ x: number; y: number; r: number }> = [
    { x: redHouseX - 28, y: groundY - 70, r: 14 },
    { x: redHouseX + 22, y: groundY - 70, r: 12 },
    { x: greenHouseX - 20, y: groundY - 74, r: 13 },
    { x: greenHouseX + 26, y: groundY - 74, r: 11 },
    { x: blueHouseX - 24, y: groundY - 68, r: 12 },
    { x: blueHouseX + 20, y: groundY - 68, r: 14 },
  ];
  for (const w of windowGlows) {
    const glow = scene.add
      .circle(w.x, w.y, w.r, 0xffd078, 0.05)
      .setDepth(depth + 1.2)
      .setBlendMode(Phaser.BlendModes.ADD);
    night?.addGlow(glow, 0.02, 0.48);
  }
}

/** Dense swamp island — cypress, cattails, murky pond (Wildflower rod still here). */
export function placeSwamp(
  scene: Phaser.Scene,
  groundY: number,
  swampLeft: number,
  swampRight: number,
  pondLeft: number,
  pondRight: number,
  night?: NightAmbient
): void {
  const depth = 3;
  const ox = swampLeft;
  const width = swampRight - swampLeft;
  const mid = (swampLeft + swampRight) / 2;

  // Far murky ridges (stay with the swamp)
  const ridges = scene.add.graphics().setScrollFactor(1).setDepth(0);
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

  // Cypress belt (skip pond + wildflower clearing + shack + secret tree + cave rope)
  const wildflowerClearX = ox + 210;
  const secretTreeX = pondRight + 70;
  // Just past the pond, further right toward mid-swamp
  const caveCrackX = pondRight + 230;
  const treeSpots: { x: number; key: string; scale: number }[] = [];
  for (let x = ox + 40; x < swampRight - 35; x += 64) {
    if (x > pondLeft - 55 && x < pondRight + 55) continue;
    if (Math.abs(x - wildflowerClearX) < 70) continue;
    if (Math.abs(x - secretTreeX) < 55) continue;
    if (Math.abs(x - caveCrackX) < 60) continue;
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
    if (Math.abs(x - secretTreeX) < 50) continue;
    if (Math.abs(x - caveCrackX) < 55) continue;
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

  // Amulet cave rope — just past the pond, toward the west (left) port
  placeCaveCrack(scene, caveCrackX, groundY, depth + 5);

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

  // Fireflies — brighter, with a night halo that intensifies after dark
  for (let i = 0; i < 12; i++) {
    const fx = Phaser.Math.Between(swampLeft + 40, swampRight - 40);
    if (fx > pondLeft && fx < pondRight) continue;
    const fy = groundY - Phaser.Math.Between(40, 160);
    const wrap = scene.add.container(fx, fy).setDepth(depth + 5);
    const halo = scene.add
      .circle(0, 0, 5, 0xc8ff60, 0.35)
      .setBlendMode(Phaser.BlendModes.ADD);
    const bug = scene.add.circle(0, 0, 2.2, 0xe8ff80, 0.95);
    wrap.add([halo, bug]);
    night?.addGlow(wrap, 0.5, 1);
    scene.tweens.add({
      targets: wrap,
      x: fx + Phaser.Math.Between(-22, 22),
      y: fy + Phaser.Math.Between(-18, 18),
      duration: 1200 + i * 80,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    scene.tweens.add({
      targets: [bug, halo],
      alpha: 0.2,
      duration: 900 + i * 70,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Grass / reed tufts
  const tufts = scene.add.graphics().setDepth(depth + 2);
  for (let i = 0; i < 90; i++) {
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
  pondRight: number,
  night?: NightAmbient
): void {
  placeSwamp(scene, groundY, jungleLeft, jungleRight, pondLeft, pondRight, night);
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

  // Clear shallow reef water — translucent over coral only (sand stays on top)
  const water = scene.add.graphics().setDepth(4);
  water.fillStyle(0x6ec4e4, 0.35);
  water.fillRect(reefLeft, surfaceY, w, 36);
  water.fillStyle(0x4eb0d4, 0.42);
  water.fillRect(reefLeft, surfaceY + 30, w, 50);
  water.fillStyle(0x3a9cc4, 0.48);
  water.fillRect(reefLeft, surfaceY + 72, w, 60);
  water.fillStyle(0x2a88b0, 0.45);
  water.fillRect(reefLeft, surfaceY + 125, w, Math.max(20, sandY - surfaceY - 140));
  water.fillStyle(0x90d4e8, 0.14);
  water.fillRect(reefLeft, sandY - 28, w, 32);

  // Deep fill behind the sand shelf (depth 2) so sky doesn't show under the bed
  const underSand = scene.add.graphics().setDepth(2);
  underSand.fillStyle(0x1a7098, 1);
  underSand.fillRect(reefLeft, sandY + 30, w, 160);
  underSand.fillStyle(0x0e4868, 1);
  underSand.fillRect(reefLeft, sandY + 180, w, 400);

  // Clean light → dark blend into normal ocean
  const steps = 14;
  const blendDeep = 520;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const x = reefRight + (i / steps) * blendW;
    const seg = blendW / steps + 1.5;
    const r = Math.round(110 + (46 - 110) * t);
    const g = Math.round(196 + (111 - 196) * t);
    const b = Math.round(228 + (159 - 228) * t);
    water.fillStyle((r << 16) | (g << 8) | b, 0.35 + t * 0.38);
    water.fillRect(x, surfaceY, seg, 48);
    const r2 = Math.round(78 + (31 - 78) * t);
    const g2 = Math.round(176 + (111 - 176) * t);
    const b2 = Math.round(212 + (159 - 212) * t);
    water.fillStyle((r2 << 16) | (g2 << 8) | b2, 0.42 + t * 0.38);
    water.fillRect(x, surfaceY + 40, seg, 120);
    const r3 = Math.round(58 + (20 - 58) * t);
    const g3 = Math.round(152 + (90 - 152) * t);
    const b3 = Math.round(196 + (130 - 196) * t);
    water.fillStyle((r3 << 16) | (g3 << 8) | b3, 0.5 + t * 0.38);
    water.fillRect(x, surfaceY + 140, seg, 160);
    const r4 = Math.round(42 + (12 - 42) * t);
    const g4 = Math.round(110 + (61 - 110) * t);
    const b4 = Math.round(160 + (92 - 160) * t);
    water.fillStyle((r4 << 16) | (g4 << 8) | b4, 0.65 + t * 0.3);
    water.fillRect(x, surfaceY + 280, seg, 140);
    const r5 = Math.round(28 + (7 - 28) * t);
    const g5 = Math.round(70 + (30 - 70) * t);
    const b5 = Math.round(110 + (48 - 110) * t);
    water.fillStyle((r5 << 16) | (g5 << 8) | b5, 0.82 + t * 0.16);
    water.fillRect(x, surfaceY + 400, seg, blendDeep - 400);
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

/**
 * Collector's Island — harbor town west of the coral reef.
 * Concrete main street, townhouses, lamps; east beach joins the reef.
 */
export function placeCollectorsIsland(
  scene: Phaser.Scene,
  groundY: number,
  left: number,
  right: number,
  westDock: number,
  eastDock: number,
  night?: NightAmbient
): void {
  const depth = 3;
  const mid = (left + right) / 2;
  const westShore = left + 96;
  const eastShore = right - 96;
  const fishStandX = mid + 140;
  const curioStandX = mid - 80;

  // Distant ridges (stay with Collector's Island)
  const hills = scene.add.graphics().setScrollFactor(1).setDepth(0);
  hills.fillStyle(0x7ab06a, 0.45);
  hills.fillEllipse(mid - 420, 470, 620, 160);
  hills.fillStyle(0x6a9a5c, 0.4);
  hills.fillEllipse(mid + 80, 485, 540, 140);
  hills.fillStyle(0x5a8a50, 0.35);
  hills.fillEllipse(mid + 480, 495, 420, 120);

  for (let i = 0; i < 5; i++) {
    const cloud = scene.add
      .image(left + 200 + i * 380, 55 + (i % 3) * 28, "cloud")
      .setScrollFactor(0.94)
      .setAlpha(0.8)
      .setDepth(0)
      .setScale(0.75 + (i % 3) * 0.18);
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + 36,
      duration: 16000 + i * 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Beach sand at both shores
  const sand = scene.add.graphics().setDepth(depth);
  sand.fillStyle(0xf2e4b0, 1);
  sand.fillRect(left - 12, groundY - 6, westShore - left + 24, 20);
  sand.fillRect(eastShore - 12, groundY - 6, right - eastShore + 40, 20);
  sand.fillStyle(0xe8d8a0, 0.95);
  for (let i = 0; i < 8; i++) {
    sand.fillEllipse(left + 40 + i * 28, groundY + 2, 40 + (i % 3) * 8, 10);
  }
  for (let i = 0; i < 10; i++) {
    sand.fillEllipse(eastShore + 20 + i * 32, groundY + 2, 42 + (i % 4) * 8, 10);
  }

  // Houses sit on the back edge of the road (feet touch the street)
  const houseY = groundY - 22;
  // Thin rear sidewalk under house fronts (concrete, not grass)
  const walk = scene.add.graphics().setDepth(depth);
  walk.fillStyle(0x8e9296, 1);
  walk.fillRect(westShore + 4, houseY - 2, eastShore - westShore - 8, 14);
  walk.fillStyle(0xa0a4a8, 0.7);
  walk.fillRect(westShore + 4, houseY - 2, eastShore - westShore - 8, 3);
  // Seam where sidewalk meets road
  walk.fillStyle(0xb0b4b8, 0.95);
  walk.fillRect(westShore + 6, groundY - 24, eastShore - westShore - 12, 3);

  // Townhouses on the back of the street (behind road layer, feet on curb)
  const houses: { x: number; key: string; scale: number }[] = [
    { x: mid - 980, key: "town_house_e", scale: 0.88 },
    { x: mid - 820, key: "town_house_a", scale: 0.92 },
    { x: mid - 660, key: "town_house_d", scale: 0.95 },
    { x: mid - 500, key: "town_house_c", scale: 0.9 },
    { x: mid - 340, key: "town_house_b", scale: 0.98 },
    // gap for curio stand (~ mid - 80)
    { x: mid + 40, key: "town_house_a", scale: 0.94 },
    // gap for fish stand (~ mid + 140)
    { x: mid + 280, key: "town_house_e", scale: 0.9 },
    { x: mid + 430, key: "town_house_d", scale: 0.92 },
    { x: mid + 580, key: "town_house_c", scale: 0.88 },
    { x: mid + 730, key: "town_house_b", scale: 0.95 },
    { x: mid + 880, key: "town_house_a", scale: 0.9 },
    { x: mid + 1020, key: "town_house_e", scale: 0.86 },
  ];
  for (const h of houses) {
    scene.add
      .image(h.x, houseY, h.key)
      .setDepth(depth + 0.5)
      .setOrigin(0.5, 1)
      .setScale(h.scale);
  }

  // Potted plants beside houses — drawn in front of lamps
  const pots: { x: number; key: string; scale: number }[] = [
    { x: mid - 980 + 72, key: "pot_plant_a", scale: 0.95 },
    { x: mid - 980 - 70, key: "pot_plant_b", scale: 0.85 },
    { x: mid - 820 + 78, key: "pot_plant_b", scale: 0.9 },
    { x: mid - 660 - 72, key: "pot_plant_a", scale: 0.92 },
    { x: mid - 660 + 68, key: "pot_plant_b", scale: 0.88 },
    { x: mid - 500 - 78, key: "pot_plant_b", scale: 0.9 },
    { x: mid - 500 + 74, key: "pot_plant_a", scale: 0.95 },
    { x: mid - 340 + 88, key: "pot_plant_a", scale: 1.05 },
    { x: mid - 340 - 82, key: "pot_plant_b", scale: 0.9 },
    { x: mid + 40 - 72, key: "pot_plant_a", scale: 0.92 },
    { x: mid + 40 + 78, key: "pot_plant_b", scale: 0.95 },
    { x: mid + 280 - 70, key: "pot_plant_b", scale: 0.95 },
    { x: mid + 280 + 72, key: "pot_plant_a", scale: 0.88 },
    { x: mid + 430 - 68, key: "pot_plant_a", scale: 0.9 },
    { x: mid + 580 + 70, key: "pot_plant_b", scale: 0.92 },
    { x: mid + 730 + 90, key: "pot_plant_a", scale: 0.9 },
    { x: mid + 730 - 75, key: "pot_plant_b", scale: 0.95 },
    { x: mid + 880 + 72, key: "pot_plant_a", scale: 0.9 },
    { x: mid + 1020 - 68, key: "pot_plant_b", scale: 0.88 },
    { x: mid + 1020 + 64, key: "pot_plant_a", scale: 0.85 },
  ];
  for (const p of pots) {
    scene.add
      .image(p.x, houseY, p.key)
      .setDepth(depth + 0.85)
      .setOrigin(0.5, 1)
      .setScale(p.scale);
  }

  // Tall trees flanking the lone red brick house, denser toward the
  // white/blue stone hall on the left (mid - 340)
  const loneBrickX = mid + 40;
  const blueWhiteHouseX = mid - 340;
  for (const t of [
    // Right of red house
    { x: loneBrickX + 58, scale: 0.85 },
    { x: loneBrickX + 95, scale: 1.0 },
    { x: loneBrickX + 135, scale: 1.08 },
    { x: loneBrickX + 170, scale: 0.9 },
    // Left of red house → stretch to white/blue stone hall
    { x: loneBrickX - 55, scale: 0.92 },
    { x: loneBrickX - 95, scale: 1.05 },
    { x: loneBrickX - 130, scale: 0.88 },
    { x: loneBrickX - 175, scale: 1.02 },
    { x: loneBrickX - 215, scale: 0.95 },
    { x: loneBrickX - 255, scale: 1.1 },
    { x: loneBrickX - 295, scale: 0.9 },
    { x: loneBrickX - 335, scale: 1.0 },
    // Nestle beside the white/blue house
    { x: blueWhiteHouseX + 95, scale: 0.95 },
    { x: blueWhiteHouseX + 55, scale: 1.06 },
  ]) {
    scene.add
      .image(t.x, houseY, "tree_tall")
      .setDepth(depth + 0.4)
      .setOrigin(0.5, 1)
      .setScale(t.scale);
  }

  // Undergrowth between those trees — bushes & flower patches
  const groveLeft = blueWhiteHouseX + 40;
  const groveRight = loneBrickX + 160;
  for (let x = groveLeft; x < groveRight; x += 28) {
    // Skip right on tree trunks / house centers
    if (Math.abs(x - loneBrickX) < 48) continue;
    if (Math.abs(x - blueWhiteHouseX) < 50) continue;
    if (Math.abs(x - curioStandX) < 40) continue;
    const kind = Math.abs(x) % 5;
    if (kind === 0 || kind === 2) {
      scene.add
        .image(x, houseY, "bush")
        .setDepth(depth + 0.55)
        .setOrigin(0.5, 1)
        .setScale(0.7 + (kind % 3) * 0.12);
    } else if (kind === 1 || kind === 4) {
      scene.add
        .image(x, houseY - 2, "flowers")
        .setDepth(depth + 0.6)
        .setOrigin(0.5, 1)
        .setScale(0.95 + (kind % 2) * 0.15);
      if (kind === 4) {
        scene.add
          .image(x + 12, houseY - 1, "flowers")
          .setDepth(depth + 0.6)
          .setOrigin(0.5, 1)
          .setScale(0.8);
      }
    } else {
      scene.add
        .image(x, houseY, "bush")
        .setDepth(depth + 0.55)
        .setOrigin(0.5, 1)
        .setScale(0.55)
        .setTint(0xa8c878);
      scene.add
        .image(x + 14, houseY - 2, "flowers")
        .setDepth(depth + 0.6)
        .setOrigin(0.5, 1)
        .setScale(0.85);
    }
  }
  // A couple extra low bushes tucked near the red house flanks
  for (const bx of [loneBrickX - 42, loneBrickX + 48, blueWhiteHouseX + 78]) {
    scene.add
      .image(bx, houseY, "bush")
      .setDepth(depth + 0.55)
      .setOrigin(0.5, 1)
      .setScale(0.8);
  }

  // Concrete main street in front of the houses
  const roadY = groundY - 4;
  for (let x = westShore + 10; x < eastShore - 10; x += 28) {
    scene.add
      .image(x, roadY, "concrete")
      .setDepth(depth + 1.5)
      .setAlpha(0.98)
      .setScale(1.15, 0.72);
    scene.add
      .image(x, roadY - 10, "concrete")
      .setDepth(depth + 1.5)
      .setAlpha(0.92)
      .setScale(1.15, 0.55)
      .setTint(0x9aa0a6);
  }
  // Front curb lines
  const curb = scene.add.graphics().setDepth(depth + 1.6);
  curb.fillStyle(0xb8bcc0, 0.9);
  curb.fillRect(westShore + 8, groundY - 22, eastShore - westShore - 16, 3);
  curb.fillRect(westShore + 8, groundY + 2, eastShore - westShore - 16, 3);

  // Chimney / vent smoke on a few halls
  for (const h of [
    { x: mid - 340, scale: 0.98, ox: 55, oy: 150 },
    { x: mid + 40, scale: 0.94, ox: 50, oy: 140 },
    { x: mid + 730, scale: 0.95, ox: 55, oy: 150 },
  ]) {
    const sx = h.x + h.ox * h.scale;
    const sy = houseY - h.oy * h.scale;
    for (let s = 0; s < 3; s++) {
      const smoke = scene.add
        .circle(sx, sy - s * 5, 3.5 + s, 0xd0d0d0, 0.3)
        .setDepth(depth + 1);
      scene.tweens.add({
        targets: smoke,
        y: smoke.y - 34,
        x: smoke.x + 4,
        alpha: 0,
        scale: 2,
        duration: 2600 + s * 350,
        delay: s * 450,
        repeat: -1,
      });
    }
  }

  // Trader stands on the road (in front)
  scene.add
    .image(fishStandX, groundY, "trader_stand")
    .setDepth(depth + 2)
    .setOrigin(0.5, 1)
    .setScale(1.15);
  scene.add
    .image(curioStandX, groundY, "trader_stand")
    .setDepth(depth + 2)
    .setOrigin(0.5, 1)
    .setScale(1.05)
    .setTint(0xe8d8c0);

  // Street lamps on the road, in gaps between facades
  const facades = [
    ...houses.map((h) => h.x),
    fishStandX,
    curioStandX,
  ].sort((a, b) => a - b);
  const lampXs: number[] = [];
  for (let i = 0; i < facades.length - 1; i++) {
    const gap = facades[i + 1] - facades[i];
    if (gap < 110 || gap > 280) continue;
    const lx = Math.round((facades[i] + facades[i + 1]) / 2);
    lampXs.push(lx);
  }
  for (const lx of lampXs) {
    scene.add
      .image(lx, houseY, "lamp_post")
      .setDepth(depth + 0.7)
      .setOrigin(0.5, 1);
    const lanternY = houseY - 78;
    const halo = scene.add
      .circle(lx, lanternY, 36, 0xffe08a, 0.04)
      .setDepth(depth + 0.65)
      .setBlendMode(Phaser.BlendModes.ADD);
    const pool = scene.add
      .ellipse(lx, houseY - 2, 56, 18, 0xffe8a0, 0.04)
      .setDepth(depth + 0.6);
    night?.addGlow(halo, 0.02, 0.55);
    night?.addGlow(pool, 0.03, 0.32);
    if (night) {
      scene.tweens.add({
        targets: halo,
        scale: 1.12,
        duration: 2000 + (Math.abs(lx) % 5) * 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // Side trees / planters (town fringe, not jungle dense)
  const clearX = [
    ...houses.map((h) => h.x),
    fishStandX,
    curioStandX,
    ...lampXs,
  ];
  for (const [tx, sc] of [
    [left + 140, 0.8],
    [westShore + 50, 0.7],
    [mid - 420, 0.85],
    [mid + 460, 0.9],
    [eastShore - 50, 0.7],
    [right - 160, 0.75],
  ] as const) {
    if (clearX.some((cx) => Math.abs(tx - cx) < 100)) continue;
    if (tx >= blueWhiteHouseX - 20 && tx <= loneBrickX + 200) continue;
    scene.add
      .image(tx, groundY + 2, "tree")
      .setDepth(depth)
      .setOrigin(0.5, 1)
      .setScale(sc);
  }

  // Planter flowers along curbs
  for (let x = westShore + 60; x < eastShore - 40; x += 90) {
    if (clearX.some((cx) => Math.abs(x - cx) < 55)) continue;
    scene.add
      .image(x, groundY - 18, "flowers")
      .setDepth(depth + 2)
      .setOrigin(0.5, 1)
      .setScale(0.85);
  }

  // Shore bushes / rocks
  for (let x = left + 40; x < westShore; x += 44) {
    scene.add
      .image(x, groundY - 2, "bush")
      .setDepth(depth + 2)
      .setOrigin(0.5, 1)
      .setScale(0.7)
      .setTint(0xc8b070);
  }
  for (let x = eastShore + 20; x < right - 30; x += 42) {
    scene.add
      .image(x, groundY - 2, "bush")
      .setDepth(depth + 2)
      .setOrigin(0.5, 1)
      .setScale(0.72)
      .setTint(0xd0c080);
  }
  for (const [rx, sc] of [
    [left + 55, 1],
    [left + 110, 0.7],
    [eastShore + 40, 0.9],
    [right - 80, 1],
    [right - 130, 0.75],
  ] as const) {
    scene.add
      .image(rx, groundY - 6, "rock")
      .setDepth(depth + 2)
      .setScale(sc);
  }

  // Town welcome sign (east / reef approach)
  const sign = scene.add.graphics().setDepth(depth + 3);
  const signX = right - 140;
  sign.fillStyle(0x4a4a52);
  sign.fillRect(signX, groundY - 58, 5, 58);
  sign.fillStyle(0xe8e4d8);
  sign.fillRoundedRect(signX - 48, groundY - 96, 100, 44, 3);
  sign.fillStyle(0x3a3a40);
  sign.fillRect(signX - 44, groundY - 92, 92, 3);
  scene.add
    .text(signX + 2, groundY - 74, "COLLECTORS", {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#1a1208",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setDepth(depth + 4);
  scene.add
    .text(signX + 2, groundY - 60, "HARBOR", {
      fontFamily: "Georgia, serif",
      fontSize: "9px",
      color: "#3a2810",
    })
    .setOrigin(0.5)
    .setDepth(depth + 4);

  // Docks with posts into water
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

  const westPlanks = Math.max(4, Math.floor((left - westDock) / 28));
  for (let i = 0; i < westPlanks; i++) {
    scene.add
      .image(left - 10 - i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
    drawPost(left - 22 - i * 28);
  }
  const eastPlanks = Math.max(4, Math.floor((eastDock - right) / 28));
  for (let i = 0; i < eastPlanks; i++) {
    scene.add
      .image(right + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
    drawPost(right + 18 + i * 28);
  }

  // Soft mist at reef join
  for (let i = 0; i < 3; i++) {
    const mist = scene.add.graphics().setDepth(2).setAlpha(0.1 + i * 0.03);
    mist.fillStyle(0xb8e8f0, 1);
    mist.fillEllipse(
      eastShore + 80 + i * 60,
      groundY - 40 - i * 18,
      160 + i * 40,
      36
    );
    scene.tweens.add({
      targets: mist,
      alpha: 0.04,
      x: mist.x + (i % 2 === 0 ? 20 : -16),
      duration: 3800 + i * 700,
      yoyo: true,
      repeat: -1,
    });
  }
}

/**
 * Frostpeak Isle — far east of the swamp. Tall snowy mountains loom in the
 * background (scenery only — not climbable). Cold shores and sparse pines.
 */
export function placeFrostpeakIsle(
  scene: Phaser.Scene,
  groundY: number,
  left: number,
  right: number,
  westDock: number,
  eastDock: number,
  _night?: NightAmbient,
  caveOpen = false
): { caveBoards?: Phaser.GameObjects.Container } {
  const mid = (left + right) / 2;
  const depth = 3;
  const westShore = left + 110;
  const eastShore = right - 110;

  drawFrostpeakMountains(scene, mid, groundY);

  // Cave mouth at the foot of the tallest peak (near hermit)
  const caveX = mid + 50;
  const caveBoards = drawFrostpeakCaveEntrance(
    scene,
    caveX,
    groundY,
    depth + 2,
    caveOpen
  );

  // Cold misty clouds (stay over the isle)
  for (let i = 0; i < 7; i++) {
    const cloud = scene.add
      .image(left + 140 + i * 340, 42 + (i % 3) * 22, "cloud")
      .setScrollFactor(0.92)
      .setAlpha(0.78)
      .setDepth(0)
      .setTint(0xe8f0f8)
      .setScale(0.85 + (i % 3) * 0.16);
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + 36,
      duration: 20000 + i * 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Snowy / pale shore
  const sand = scene.add.graphics().setDepth(depth);
  sand.fillStyle(0xe8eef4, 1);
  sand.fillRect(left - 16, groundY - 6, westShore - left + 28, 22);
  sand.fillRect(eastShore - 16, groundY - 6, right - eastShore + 48, 22);
  sand.fillStyle(0xd8e0e8, 0.95);
  for (let i = 0; i < 12; i++) {
    sand.fillEllipse(left + 36 + i * 30, groundY + 2, 36 + (i % 3) * 10, 9);
  }
  for (let i = 0; i < 14; i++) {
    sand.fillEllipse(eastShore + 16 + i * 32, groundY + 2, 40 + (i % 4) * 8, 10);
  }
  // Frosted ground strip
  sand.fillStyle(0xd0d8e0, 0.9);
  sand.fillRect(westShore, groundY - 4, eastShore - westShore, 14);
  sand.fillStyle(0xffffff, 0.35);
  for (let i = 0; i < 50; i++) {
    sand.fillCircle(
      westShore + 20 + ((i * 97) % (eastShore - westShore - 40)),
      groundY - 3 + (i % 4),
      1 + (i % 3)
    );
  }

  // Rocky foothills (walkable-level scenery, not a climb path)
  drawFrostpeakFoothills(scene, left, right, mid, groundY, depth);

  // Evergreen pines
  const pines = [
    left + 180,
    left + 320,
    mid - 700,
    mid - 520,
    mid + 480,
    mid + 660,
    right - 340,
    right - 200,
  ];
  for (let i = 0; i < pines.length; i++) {
    drawSnowPine(scene, pines[i], groundY, depth + 4, 0.85 + (i % 3) * 0.12);
  }

  // Scattered boulders + snow patches
  const props = scene.add.graphics().setDepth(depth + 3);
  props.fillStyle(0x6a7078);
  props.fillEllipse(mid - 400, groundY - 8, 50, 22);
  props.fillEllipse(mid + 380, groundY - 10, 60, 24);
  props.fillEllipse(mid - 120, groundY - 6, 36, 16);
  props.fillStyle(0x8a9098);
  props.fillEllipse(mid - 395, groundY - 14, 30, 14);
  props.fillStyle(0xffffff, 0.55);
  props.fillEllipse(mid - 400, groundY - 16, 28, 8);
  props.fillEllipse(mid + 375, groundY - 18, 34, 9);

  // Dock planks
  const drawPost = (x: number) => {
    scene.add
      .rectangle(x, groundY + 18, 6, 28, 0x5a5048)
      .setDepth(4)
      .setOrigin(0.5, 0);
  };
  const westPlanks = Math.max(4, Math.floor((left - westDock) / 28));
  for (let i = 0; i < westPlanks; i++) {
    scene.add
      .image(westDock + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
    drawPost(westDock + 18 + i * 28);
  }
  const eastPlanks = Math.max(4, Math.floor((eastDock - right) / 28));
  for (let i = 0; i < eastPlanks; i++) {
    scene.add
      .image(right + 10 + i * 28, groundY, "dock")
      .setDepth(5)
      .setOrigin(0.5, 0);
    drawPost(right + 18 + i * 28);
  }

  // Cold breath mist near shore
  for (let i = 0; i < 4; i++) {
    const mist = scene.add.graphics().setDepth(depth + 5).setAlpha(0.12 + i * 0.02);
    mist.fillStyle(0xd8e8f0, 1);
    mist.fillEllipse(mid - 200 + i * 140, groundY - 28 - i * 10, 160 + i * 40, 28);
    scene.tweens.add({
      targets: mist,
      alpha: 0.04,
      x: mist.x + (i % 2 === 0 ? 22 : -18),
      duration: 4000 + i * 600,
      yoyo: true,
      repeat: -1,
    });
  }

  // Weathered sign
  const sign = scene.add.graphics().setDepth(depth + 5);
  sign.fillStyle(0x5a5048);
  sign.fillRect(mid - 780, groundY - 70, 6, 70);
  sign.fillStyle(0xc8d0d8);
  sign.fillRoundedRect(mid - 830, groundY - 98, 100, 40, 3);
  sign.fillStyle(0x3a4048);
  sign.fillRect(mid - 826, groundY - 92, 92, 2);
  scene.add
    .text(mid - 780, groundY - 78, "FROSTPEAK", {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#2a3038",
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(depth + 6);

  return { caveBoards };
}

/** Stone-and-ice cave mouth at the base of the tallest Frostpeak. */
function drawFrostpeakCaveEntrance(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  depth: number,
  caveOpen: boolean
): Phaser.GameObjects.Container | undefined {
  const g = scene.add.graphics().setDepth(depth);
  const mouthW = 92;
  const mouthH = 118;
  const archTop = groundY - mouthH;

  // Rock face buttress around the opening
  g.fillStyle(0x3a4450);
  g.beginPath();
  g.moveTo(x - mouthW * 0.85, groundY + 6);
  g.lineTo(x - mouthW * 0.75, archTop + 20);
  g.lineTo(x - mouthW * 0.25, archTop - 18);
  g.lineTo(x + mouthW * 0.25, archTop - 18);
  g.lineTo(x + mouthW * 0.75, archTop + 20);
  g.lineTo(x + mouthW * 0.85, groundY + 6);
  g.closePath();
  g.fillPath();

  // Outer stone ring
  g.fillStyle(0x4a5560);
  g.beginPath();
  g.moveTo(x - mouthW * 0.7, groundY + 2);
  g.lineTo(x - mouthW * 0.62, archTop + 28);
  g.lineTo(x - mouthW * 0.15, archTop - 6);
  g.lineTo(x + mouthW * 0.15, archTop - 6);
  g.lineTo(x + mouthW * 0.62, archTop + 28);
  g.lineTo(x + mouthW * 0.7, groundY + 2);
  g.closePath();
  g.fillPath();

  // Snow / ice crust on the lintel
  g.fillStyle(0xf0f4f8, 0.95);
  g.beginPath();
  g.moveTo(x - mouthW * 0.55, archTop + 8);
  g.lineTo(x - mouthW * 0.2, archTop - 22);
  g.lineTo(x + mouthW * 0.2, archTop - 22);
  g.lineTo(x + mouthW * 0.55, archTop + 8);
  g.lineTo(x + mouthW * 0.35, archTop + 18);
  g.lineTo(x - mouthW * 0.35, archTop + 18);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xffffff, 0.7);
  g.fillEllipse(x, archTop - 8, 70, 16);
  // Icicles
  g.fillStyle(0xd0e4f0, 0.9);
  for (let i = 0; i < 7; i++) {
    const ix = x - 36 + i * 12;
    const ih = 10 + (i % 3) * 8;
    g.fillTriangle(ix, archTop + 14, ix + 7, archTop + 14, ix + 3.5, archTop + 14 + ih);
  }

  // Deep cave void (arched)
  g.fillStyle(0x06080c);
  g.beginPath();
  g.moveTo(x - mouthW * 0.48, groundY);
  g.lineTo(x - mouthW * 0.48, archTop + 40);
  g.lineTo(x - mouthW * 0.12, archTop + 4);
  g.lineTo(x + mouthW * 0.12, archTop + 4);
  g.lineTo(x + mouthW * 0.48, archTop + 40);
  g.lineTo(x + mouthW * 0.48, groundY);
  g.closePath();
  g.fillPath();

  // Inner throat layers
  g.fillStyle(0x0a0c12);
  g.fillEllipse(x, groundY - 48, mouthW * 0.72, mouthH * 0.78);
  g.fillStyle(0x040508);
  g.fillEllipse(x + 4, groundY - 42, mouthW * 0.48, mouthH * 0.55);
  g.fillStyle(0x020304);
  g.fillEllipse(x + 8, groundY - 38, mouthW * 0.28, mouthH * 0.35);

  // Cold blue glow from within
  g.fillStyle(0x4080c0, 0.08);
  g.fillEllipse(x, groundY - 40, 50, 70);
  g.fillStyle(0x70b0e0, 0.05);
  g.fillEllipse(x - 4, groundY - 50, 28, 40);
  const glow = scene.add
    .ellipse(x, groundY - 44, 56, 72, 0x66aadd, 0.06)
    .setDepth(depth + 0.1)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: glow,
    alpha: 0.14,
    duration: 2200,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  // Floor stones / threshold
  g.fillStyle(0x5a6068);
  g.fillRect(x - mouthW * 0.55, groundY - 4, mouthW * 1.1, 10);
  g.fillStyle(0x3a4048);
  g.fillRect(x - mouthW * 0.5, groundY - 2, mouthW, 4);
  g.fillStyle(0xe8eef4, 0.5);
  g.fillEllipse(x - 20, groundY - 6, 24, 6);
  g.fillEllipse(x + 18, groundY - 5, 20, 5);

  // Side boulders framing the door
  g.fillStyle(0x4a5058);
  g.fillEllipse(x - mouthW * 0.72, groundY - 18, 36, 42);
  g.fillEllipse(x + mouthW * 0.72, groundY - 22, 40, 48);
  g.fillStyle(0x6a7078);
  g.fillEllipse(x - mouthW * 0.72, groundY - 28, 22, 20);
  g.fillEllipse(x + mouthW * 0.72, groundY - 32, 24, 22);
  g.fillStyle(0xf0f4f8, 0.55);
  g.fillEllipse(x - mouthW * 0.72, groundY - 38, 18, 8);
  g.fillEllipse(x + mouthW * 0.7, groundY - 42, 20, 9);

  if (caveOpen) return undefined;

  // Boarded-up planks (removable after Hermit quest)
  const boards = scene.add.container(0, 0).setDepth(depth + 0.5);
  const bg = scene.add.graphics();
  boards.add(bg);
  const plankL = x - mouthW * 0.52;
  const plankR = x + mouthW * 0.52;
  const plankW = plankR - plankL;
  const boardYs = [
    groundY - 22,
    groundY - 40,
    groundY - 58,
    groundY - 76,
    groundY - 94,
  ];
  for (let i = 0; i < boardYs.length; i++) {
    const by = boardYs[i];
    const bw = plankW - 6 + (i % 2) * 4;
    const bx = x - bw / 2 + (i % 2 === 0 ? -2 : 3);
    bg.fillStyle(0x2a2018, 0.55);
    bg.fillRoundedRect(bx + 2, by + 2, bw, 15, 2);
    bg.fillStyle(i % 2 === 0 ? 0x6a5040 : 0x5a4434);
    bg.fillRoundedRect(bx, by, bw, 14, 2);
    bg.fillStyle(0x8a7058, 0.45);
    bg.fillRect(bx + 4, by + 3, bw - 8, 3);
    bg.fillStyle(0x3a2a20, 0.5);
    bg.fillRect(bx + 6, by + 10, bw - 12, 1.5);
    bg.fillStyle(0x2a2a28);
    bg.fillCircle(bx + 10, by + 7, 2);
    bg.fillCircle(bx + bw - 10, by + 7, 2);
    bg.fillStyle(0x6a6a68, 0.7);
    bg.fillCircle(bx + 10, by + 6.5, 1);
    bg.fillCircle(bx + bw - 10, by + 6.5, 1);
  }
  bg.lineStyle(7, 0x4a3828, 0.95);
  bg.lineBetween(plankL + 8, groundY - 18, plankR - 10, groundY - 100);
  bg.lineStyle(7, 0x5a4838, 0.9);
  bg.lineBetween(plankR - 8, groundY - 18, plankL + 10, groundY - 100);
  bg.lineStyle(2, 0x8a7058, 0.4);
  bg.lineBetween(plankL + 10, groundY - 20, plankR - 12, groundY - 98);
  bg.lineBetween(plankR - 10, groundY - 20, plankL + 12, groundY - 98);
  bg.fillStyle(0x2a2a28);
  bg.fillCircle(plankL + 14, groundY - 22, 2.5);
  bg.fillCircle(plankR - 14, groundY - 22, 2.5);
  bg.fillCircle(plankL + 16, groundY - 96, 2.5);
  bg.fillCircle(plankR - 16, groundY - 96, 2.5);

  for (let i = 0; i < 3; i++) {
    const mist = scene.add.ellipse(
      x - 10 + i * 12,
      groundY - 30 - i * 8,
      40 + i * 16,
      14,
      0xc8d8e8,
      0.08
    );
    boards.add(mist);
    scene.tweens.add({
      targets: mist,
      alpha: 0.02,
      x: mist.x - 16,
      duration: 2800 + i * 500,
      yoyo: true,
      repeat: -1,
    });
  }

  return boards;
}

/** Tall snowy range behind Frostpeak — scenery only (not climbable). */
function drawFrostpeakMountains(
  scene: Phaser.Scene,
  mid: number,
  groundY: number
): void {
  // Locked to the island (no strong parallax) so the peak actually looms over you
  const sf = 1;
  const z = -1;
  const base = groundY + 8;
  // Summit nearly fills the sky (~540px tall)
  const summitY = 18;
  const summitX = mid + 40;

  // Atmospheric haze behind the range
  const haze = scene.add.graphics().setScrollFactor(sf).setDepth(z);
  haze.fillStyle(0xb8c8d8, 0.35);
  haze.fillEllipse(mid, groundY - 200, 1600, 420);

  // ——— FAR RIDGE (silhouettes behind the main mass) ———
  const far = scene.add.graphics().setScrollFactor(sf).setDepth(z);
  far.fillStyle(0x7a8a9a, 0.7);
  far.beginPath();
  far.moveTo(mid - 1100, base);
  far.lineTo(mid - 820, groundY - 260);
  far.lineTo(mid - 600, groundY - 180);
  far.lineTo(mid - 380, groundY - 340);
  far.lineTo(mid - 160, groundY - 200);
  far.lineTo(mid + 80, groundY - 380);
  far.lineTo(mid + 300, groundY - 220);
  far.lineTo(mid + 560, groundY - 400);
  far.lineTo(mid + 820, groundY - 240);
  far.lineTo(mid + 1100, base);
  far.closePath();
  far.fillPath();
  far.fillStyle(0xf0f4f8, 0.65);
  far.fillTriangle(mid - 880, groundY - 200, mid - 820, groundY - 260, mid - 760, groundY - 190);
  far.fillTriangle(mid - 440, groundY - 270, mid - 380, groundY - 340, mid - 320, groundY - 260);
  far.fillTriangle(mid + 20, groundY - 300, mid + 80, groundY - 380, mid + 140, groundY - 290);
  far.fillTriangle(mid + 500, groundY - 320, mid + 560, groundY - 400, mid + 620, groundY - 310);

  // ——— MAIN MOUNTAIN (dominant central peak) ———
  const mtn = scene.add.graphics().setScrollFactor(sf).setDepth(z);
  // Deep under-mass
  mtn.fillStyle(0x3a4858);
  mtn.beginPath();
  mtn.moveTo(mid - 780, base);
  mtn.lineTo(mid - 520, groundY - 280);
  mtn.lineTo(mid - 280, groundY - 160);
  mtn.lineTo(summitX - 200, groundY - 360);
  mtn.lineTo(summitX, summitY);
  mtn.lineTo(summitX + 240, groundY - 320);
  mtn.lineTo(mid + 480, groundY - 180);
  mtn.lineTo(mid + 700, groundY - 300);
  mtn.lineTo(mid + 980, base);
  mtn.closePath();
  mtn.fillPath();

  // Lit face (left / sun side)
  mtn.fillStyle(0x5a6a7a);
  mtn.beginPath();
  mtn.moveTo(summitX, summitY);
  mtn.lineTo(summitX - 200, groundY - 360);
  mtn.lineTo(mid - 280, groundY - 160);
  mtn.lineTo(mid - 100, groundY - 80);
  mtn.lineTo(summitX - 40, groundY - 200);
  mtn.closePath();
  mtn.fillPath();

  // Shadow face (right)
  mtn.fillStyle(0x2a3848);
  mtn.beginPath();
  mtn.moveTo(summitX, summitY);
  mtn.lineTo(summitX + 240, groundY - 320);
  mtn.lineTo(mid + 480, groundY - 180);
  mtn.lineTo(mid + 200, groundY - 100);
  mtn.lineTo(summitX + 60, groundY - 220);
  mtn.closePath();
  mtn.fillPath();

  // Mid-tone body
  mtn.fillStyle(0x4a5868);
  mtn.beginPath();
  mtn.moveTo(mid - 780, base);
  mtn.lineTo(mid - 520, groundY - 280);
  mtn.lineTo(mid - 280, groundY - 160);
  mtn.lineTo(mid - 100, groundY - 80);
  mtn.lineTo(mid + 200, groundY - 100);
  mtn.lineTo(mid + 480, groundY - 180);
  mtn.lineTo(mid + 700, groundY - 300);
  mtn.lineTo(mid + 980, base);
  mtn.closePath();
  mtn.fillPath();

  // Left shoulder peak
  mtn.fillStyle(0x4a5a6a);
  mtn.beginPath();
  mtn.moveTo(mid - 900, base);
  mtn.lineTo(mid - 680, groundY - 420);
  mtn.lineTo(mid - 420, groundY - 140);
  mtn.lineTo(mid - 300, base);
  mtn.closePath();
  mtn.fillPath();
  mtn.fillStyle(0x3a4a5a);
  mtn.fillTriangle(mid - 680, groundY - 420, mid - 420, groundY - 140, mid - 560, groundY - 120);
  mtn.fillStyle(0x6a7a8a);
  mtn.fillTriangle(mid - 680, groundY - 420, mid - 780, groundY - 200, mid - 620, groundY - 180);

  // Right shoulder peak
  mtn.fillStyle(0x4a5a6a);
  mtn.beginPath();
  mtn.moveTo(mid + 400, base);
  mtn.lineTo(mid + 620, groundY - 440);
  mtn.lineTo(mid + 880, groundY - 160);
  mtn.lineTo(mid + 1050, base);
  mtn.closePath();
  mtn.fillPath();
  mtn.fillStyle(0x2a3848);
  mtn.fillTriangle(mid + 620, groundY - 440, mid + 880, groundY - 160, mid + 740, groundY - 140);

  // Cliff bands / strata (detail)
  mtn.lineStyle(2, 0x2a3038, 0.45);
  for (let i = 0; i < 12; i++) {
    const y = groundY - 80 - i * 36;
    const w = 180 + i * 28;
    mtn.lineBetween(summitX - w * 0.4, y, summitX + w * 0.35, y + 8);
  }
  // Rocky outcrops
  mtn.fillStyle(0x3a4450);
  for (let i = 0; i < 16; i++) {
    const ox = mid - 500 + i * 70 + (i % 3) * 15;
    const oy = groundY - 60 - (i % 5) * 55;
    mtn.fillEllipse(ox, oy, 28 + (i % 4) * 8, 14 + (i % 3) * 4);
  }

  // ——— SNOW & ICE (high detail) ———
  const snow = scene.add.graphics().setScrollFactor(sf).setDepth(z);
  // Main summit crown
  snow.fillStyle(0xffffff, 0.98);
  snow.beginPath();
  snow.moveTo(summitX, summitY);
  snow.lineTo(summitX - 90, summitY + 70);
  snow.lineTo(summitX - 50, summitY + 95);
  snow.lineTo(summitX - 10, summitY + 55);
  snow.lineTo(summitX + 40, summitY + 100);
  snow.lineTo(summitX + 85, summitY + 60);
  snow.lineTo(summitX + 55, summitY + 40);
  snow.closePath();
  snow.fillPath();

  // Long snow fields down the lit face
  snow.fillStyle(0xf4f8fc, 0.92);
  snow.beginPath();
  snow.moveTo(summitX - 20, summitY + 50);
  snow.lineTo(summitX - 160, groundY - 280);
  snow.lineTo(summitX - 80, groundY - 260);
  snow.lineTo(summitX - 40, groundY - 340);
  snow.lineTo(summitX + 10, groundY - 200);
  snow.lineTo(summitX + 30, groundY - 300);
  snow.closePath();
  snow.fillPath();

  // Shadow-side snow patches
  snow.fillStyle(0xd8e4f0, 0.85);
  snow.beginPath();
  snow.moveTo(summitX + 30, summitY + 55);
  snow.lineTo(summitX + 180, groundY - 260);
  snow.lineTo(summitX + 110, groundY - 240);
  snow.lineTo(summitX + 70, groundY - 320);
  snow.closePath();
  snow.fillPath();

  // Left peak snow
  snow.fillStyle(0xffffff, 0.95);
  snow.fillTriangle(
    mid - 680,
    groundY - 420,
    mid - 740,
    groundY - 320,
    mid - 620,
    groundY - 300
  );
  snow.fillStyle(0xe8f0f8, 0.8);
  snow.fillTriangle(
    mid - 680,
    groundY - 400,
    mid - 720,
    groundY - 280,
    mid - 640,
    groundY - 270
  );

  // Right peak snow
  snow.fillStyle(0xffffff, 0.95);
  snow.fillTriangle(
    mid + 620,
    groundY - 440,
    mid + 560,
    groundY - 340,
    mid + 700,
    groundY - 320
  );
  snow.fillStyle(0xd0dce8, 0.75);
  snow.fillTriangle(
    mid + 620,
    groundY - 420,
    mid + 680,
    groundY - 300,
    mid + 580,
    groundY - 290
  );

  // Mid-slope snow benches
  snow.fillStyle(0xf0f4f8, 0.8);
  snow.fillEllipse(summitX - 120, groundY - 200, 160, 36);
  snow.fillEllipse(summitX + 100, groundY - 180, 140, 30);
  snow.fillEllipse(mid - 500, groundY - 160, 120, 28);
  snow.fillEllipse(mid + 650, groundY - 150, 130, 26);
  snow.fillEllipse(summitX - 40, groundY - 120, 200, 40);

  // Glacier tongues
  snow.fillStyle(0xc8dcec, 0.7);
  snow.beginPath();
  snow.moveTo(summitX - 60, groundY - 240);
  snow.lineTo(summitX - 140, groundY - 80);
  snow.lineTo(summitX - 40, groundY - 70);
  snow.lineTo(summitX + 20, groundY - 200);
  snow.closePath();
  snow.fillPath();
  snow.fillStyle(0xb0d0e8, 0.55);
  snow.fillEllipse(summitX - 70, groundY - 140, 60, 80);

  // Crevasse lines in snow
  snow.lineStyle(1.5, 0xa0b8c8, 0.6);
  snow.lineBetween(summitX - 30, summitY + 80, summitX - 100, groundY - 300);
  snow.lineBetween(summitX + 20, summitY + 90, summitX + 90, groundY - 280);
  snow.lineBetween(summitX - 80, groundY - 250, summitX - 50, groundY - 150);
  snow.lineBetween(mid - 700, groundY - 380, mid - 660, groundY - 280);

  // Ice glints / sparkle
  snow.fillStyle(0xffffff, 0.7);
  snow.fillEllipse(summitX + 8, summitY + 25, 28, 10);
  snow.fillEllipse(summitX - 40, groundY - 360, 22, 8);
  snow.fillEllipse(mid - 670, groundY - 400, 18, 7);
  snow.fillEllipse(mid + 630, groundY - 410, 20, 8);
  const glint = scene.add
    .ellipse(summitX + 5, summitY + 22, 36, 12, 0xffffff, 0.2)
    .setScrollFactor(sf)
    .setDepth(z)
    .setAngle(-32);
  scene.tweens.add({
    targets: glint,
    alpha: 0.55,
    duration: 2600,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  // ——— NEAR FOOTHILLS (still non-climbable backdrop, in front of main mass slightly) ———
  const near = scene.add.graphics().setScrollFactor(sf).setDepth(z);
  near.fillStyle(0x3a4858, 0.92);
  near.beginPath();
  near.moveTo(mid - 700, base);
  near.lineTo(mid - 480, groundY - 140);
  near.lineTo(mid - 240, groundY - 70);
  near.lineTo(mid - 40, groundY - 160);
  near.lineTo(mid + 180, groundY - 60);
  near.lineTo(mid + 400, groundY - 150);
  near.lineTo(mid + 640, groundY - 80);
  near.lineTo(mid + 820, base);
  near.closePath();
  near.fillPath();
  near.fillStyle(0xe8eef4, 0.55);
  near.fillEllipse(mid - 40, groundY - 145, 100, 32);
  near.fillEllipse(mid + 380, groundY - 135, 80, 26);
  near.fillEllipse(mid - 460, groundY - 120, 70, 22);

  // Falling snow across the face of the mountain
  for (let i = 0; i < 28; i++) {
    const flake = scene.add
      .circle(
        mid - 600 + i * 55 + (i % 5) * 10,
        40 + (i % 9) * 45,
        1.4 + (i % 3) * 0.7,
        0xffffff,
        0.6
      )
      .setScrollFactor(sf)
      .setDepth(z + 0.1);
    scene.tweens.add({
      targets: flake,
      y: flake.y + 160 + (i % 4) * 40,
      x: flake.x + (i % 2 === 0 ? 24 : -18),
      alpha: 0.08,
      duration: 4800 + i * 280,
      repeat: -1,
      ease: "Sine.easeIn",
    });
  }
}

function drawFrostpeakFoothills(
  scene: Phaser.Scene,
  left: number,
  right: number,
  mid: number,
  groundY: number,
  depth: number
): void {
  const rock = scene.add.graphics().setDepth(depth + 0.5);
  rock.fillStyle(0x5a6068);
  rock.beginPath();
  rock.moveTo(left - 20, groundY + 16);
  rock.lineTo(left + 50, groundY - 70);
  rock.lineTo(left + 180, groundY - 110);
  rock.lineTo(left + 300, groundY - 50);
  rock.lineTo(left + 340, groundY + 16);
  rock.closePath();
  rock.fillPath();
  rock.fillStyle(0xe8eef4, 0.7);
  rock.fillTriangle(left + 140, groundY - 90, left + 180, groundY - 110, left + 210, groundY - 70);

  rock.fillStyle(0x5a6068);
  rock.beginPath();
  rock.moveTo(right + 20, groundY + 16);
  rock.lineTo(right - 50, groundY - 80);
  rock.lineTo(right - 190, groundY - 120);
  rock.lineTo(right - 320, groundY - 45);
  rock.lineTo(right - 360, groundY + 16);
  rock.closePath();
  rock.fillPath();
  rock.fillStyle(0xe8eef4, 0.7);
  rock.fillTriangle(
    right - 150,
    groundY - 90,
    right - 190,
    groundY - 120,
    right - 230,
    groundY - 70
  );

  rock.fillStyle(0x6a7078);
  rock.fillEllipse(mid - 560, groundY - 36, 180, 80);
  rock.fillEllipse(mid + 560, groundY - 40, 200, 85);
  rock.fillStyle(0xf0f4f8, 0.45);
  rock.fillEllipse(mid - 550, groundY - 55, 100, 28);
  rock.fillEllipse(mid + 550, groundY - 60, 110, 30);
}

function drawSnowPine(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  depth: number,
  scale: number
): void {
  const g = scene.add.graphics().setDepth(depth);
  const s = scale;
  g.fillStyle(0x4a3a28);
  g.fillRect(x - 4 * s, groundY - 40 * s, 8 * s, 40 * s);
  g.fillStyle(0x2a4a38);
  g.fillTriangle(x, groundY - 150 * s, x - 36 * s, groundY - 55 * s, x + 36 * s, groundY - 55 * s);
  g.fillStyle(0x356048);
  g.fillTriangle(x, groundY - 130 * s, x - 30 * s, groundY - 45 * s, x + 30 * s, groundY - 45 * s);
  g.fillStyle(0x3a7050);
  g.fillTriangle(x, groundY - 105 * s, x - 22 * s, groundY - 35 * s, x + 22 * s, groundY - 35 * s);
  // Snow on boughs
  g.fillStyle(0xf0f4f8, 0.85);
  g.fillTriangle(x, groundY - 150 * s, x - 18 * s, groundY - 115 * s, x + 18 * s, groundY - 115 * s);
  g.fillEllipse(x - 12 * s, groundY - 60 * s, 16 * s, 5 * s);
  g.fillEllipse(x + 10 * s, groundY - 52 * s, 14 * s, 4 * s);
  g.fillEllipse(x, groundY - 42 * s, 12 * s, 4 * s);
}




/** @deprecated — use ./AshencastIsland */
export { placeAshencastIsland } from "./AshencastIsland";
