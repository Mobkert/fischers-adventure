import Phaser from "phaser";

const ICON = 64;
const CRATE_WORLD_W = 96;
const CRATE_WORLD_H = 88;

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  key: string,
  w: number,
  h: number,
  draw: DrawFn
): void {
  g.clear();
  draw(g);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  g.generateTexture(key, w, h);
}

function iconPlate(g: Phaser.GameObjects.Graphics, tint = 0x1a2228): void {
  g.fillStyle(tint, 0.55);
  g.fillRoundedRect(4, 4, 56, 56, 8);
  g.lineStyle(1, 0x7ec8ff, 0.22);
  g.strokeRoundedRect(4, 4, 56, 56, 8);
}

function sphere(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  base: number,
  hi: number,
  lo: number
): void {
  g.fillStyle(lo, 0.35);
  g.fillCircle(x + 1, y + 1, r);
  g.fillStyle(base, 1);
  g.fillCircle(x, y, r);
  g.fillStyle(hi, 0.75);
  g.fillCircle(x - r * 0.28, y - r * 0.28, r * 0.38);
}

function drawDetailedCrate(g: Phaser.GameObjects.Graphics, large: boolean): void {
  const ox = large ? 8 : 6;
  const oy = large ? 10 : 8;
  const bw = large ? 80 : 52;
  const bh = large ? 58 : 38;
  const cx = ox + bw / 2;

  // Ground shadow
  g.fillStyle(0x000000, large ? 0.32 : 0.28);
  g.fillEllipse(cx, oy + bh + (large ? 6 : 4), bw * 0.78, large ? 10 : 7);

  // Back plank (depth)
  g.fillStyle(0x4a3018);
  g.fillRoundedRect(ox + 3, oy + 3, bw, bh, large ? 5 : 3);

  // Main box body
  g.fillStyle(0x7a5230);
  g.fillRoundedRect(ox, oy, bw, bh, large ? 5 : 3);
  g.fillStyle(0x8f6538);
  g.fillRoundedRect(ox + 2, oy + 2, bw - 4, bh * 0.42, large ? 4 : 2);

  // Plank lines
  g.lineStyle(large ? 2 : 1, 0x5a3820, 0.85);
  const plankCount = large ? 5 : 4;
  for (let i = 1; i < plankCount; i++) {
    const py = oy + (bh / plankCount) * i;
    g.lineBetween(ox + 3, py, ox + bw - 3, py);
  }
  g.lineBetween(cx, oy + 3, cx, oy + bh - 3);

  // Metal bands
  g.fillStyle(0x6a6a72);
  g.fillRect(ox - 1, oy + bh * 0.22, bw + 2, large ? 5 : 3);
  g.fillRect(ox - 1, oy + bh * 0.68, bw + 2, large ? 5 : 3);
  g.fillStyle(0x9898a8);
  g.fillRect(ox + 2, oy + bh * 0.22 + 1, bw - 4, 1);
  g.fillRect(ox + 2, oy + bh * 0.68 + 1, bw - 4, 1);

  // Rope coil on top
  g.lineStyle(large ? 3 : 2, 0xc4a86a, 1);
  g.strokeCircle(cx, oy - (large ? 4 : 2), large ? 11 : 7);
  g.lineStyle(large ? 2 : 1, 0x8b6914, 0.8);
  g.strokeCircle(cx, oy - (large ? 4 : 2), large ? 7 : 4);

  // Hook + worm peeking out
  g.lineStyle(large ? 3 : 2, 0xb0b0b8, 1);
  g.beginPath();
  g.arc(cx + (large ? 14 : 9), oy - (large ? 2 : 1), large ? 9 : 6, 0.2, Math.PI * 1.15);
  g.strokePath();
  g.fillStyle(0xa07828);
  g.fillEllipse(cx - (large ? 10 : 6), oy + 4, large ? 14 : 9, large ? 5 : 3);
  g.fillStyle(0xc49440);
  g.fillCircle(cx - (large ? 14 : 9), oy + 3, large ? 3 : 2);

  // Corner nails
  g.fillStyle(0x888890);
  const nail = large ? 2.5 : 1.5;
  for (const [nx, ny] of [
    [ox + 5, oy + 5],
    [ox + bw - 5, oy + 5],
    [ox + 5, oy + bh - 5],
    [ox + bw - 5, oy + bh - 5],
  ]) {
    g.fillCircle(nx, ny, nail);
  }

  // Sticker label
  const lx = cx - (large ? 18 : 12);
  const ly = oy + bh * 0.38;
  const lw = large ? 36 : 24;
  const lh = large ? 16 : 11;
  g.fillStyle(0xf4ead8);
  g.fillRoundedRect(lx, ly, lw, lh, large ? 3 : 2);
  g.lineStyle(1, 0x8b6914, 0.7);
  g.strokeRoundedRect(lx, ly, lw, lh, large ? 3 : 2);
  g.fillStyle(0x2a6a38);
  g.fillCircle(lx + (large ? 8 : 5), ly + lh / 2, large ? 4 : 3);
  g.fillStyle(0xcc4444);
  g.fillCircle(lx + (large ? 14 : 9), ly + lh / 2, large ? 3 : 2);
  g.fillStyle(0x4488cc);
  g.fillCircle(lx + (large ? 19 : 13), ly + lh / 2, large ? 3 : 2);

  // Outer rim
  g.lineStyle(large ? 2 : 1, 0x3a2410, 0.9);
  g.strokeRoundedRect(ox, oy, bw, bh, large ? 5 : 3);
}

/** Procedural bait crate + bait item icons for BootScene. */
export function generateBaitTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  bake(scene, g, "bait_crate", ICON, ICON, (gfx) => {
    drawDetailedCrate(gfx, false);
  });

  bake(scene, g, "bait_crate_world", CRATE_WORLD_W, CRATE_WORLD_H, (gfx) => {
    drawDetailedCrate(gfx, true);
  });

  bake(scene, g, "bait_worms", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x221a14);
    gfx.lineStyle(3, 0x6b4a18, 1);
    gfx.beginPath();
    gfx.moveTo(12, 44);
    gfx.lineTo(22, 28);
    gfx.lineTo(32, 40);
    gfx.lineTo(42, 24);
    gfx.lineTo(52, 36);
    gfx.strokePath();
    gfx.lineStyle(2, 0xa07828, 0.9);
    for (const [x, y] of [
      [18, 38],
      [28, 32],
      [38, 34],
      [46, 28],
    ]) {
      sphere(gfx, x, y, 4, 0x8b6914, 0xc49440, 0x4a3010);
    }
    gfx.fillStyle(0x2a2010);
    gfx.fillCircle(14, 36, 1.2);
  });

  bake(scene, g, "bait_krill", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x281820);
    for (const [x, y, r] of [
      [18, 30, 5],
      [32, 24, 4.5],
      [44, 32, 5],
      [24, 42, 4],
      [40, 44, 4],
    ]) {
      gfx.fillStyle(0xff6688, 0.35);
      gfx.fillEllipse(x + 1, y + 1, r * 2.2, r * 1.1);
      gfx.fillStyle(0xff8899, 1);
      gfx.fillEllipse(x, y, r * 2.2, r * 1.1);
      gfx.fillStyle(0xffccd8, 0.65);
      gfx.fillEllipse(x - 1.5, y - 1, r * 0.5, r * 0.35);
      gfx.fillStyle(0x442228);
      gfx.fillCircle(x + r * 0.35, y, 0.8);
    }
  });

  bake(scene, g, "bait_brine_pellets", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x142018);
    for (const [x, y, r] of [
      [18, 34, 5],
      [30, 26, 5.5],
      [42, 36, 5],
      [36, 44, 4],
    ]) {
      sphere(gfx, x, y, r, 0x3a7a48, 0x7ecf88, 0x1a4028);
      gfx.fillStyle(0xffffff, 0.25);
      gfx.fillCircle(x - 1, y - 2, 1);
    }
  });

  bake(scene, g, "bait_magnet", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x181820);
    gfx.fillStyle(0x555560);
    gfx.fillRoundedRect(18, 16, 28, 34, 8);
    gfx.fillStyle(0xcc3333);
    gfx.fillRoundedRect(18, 16, 28, 10, 4);
    gfx.fillRoundedRect(18, 40, 28, 10, 4);
    gfx.fillStyle(0x888890);
    gfx.fillRoundedRect(20, 28, 24, 10, 3);
    gfx.fillStyle(0xdddddd);
    gfx.fillCircle(32, 33, 5);
    gfx.fillStyle(0xffffff, 0.5);
    gfx.fillCircle(30, 31, 2);
    gfx.lineStyle(2, 0x333338);
    gfx.strokeRoundedRect(18, 16, 28, 34, 8);
  });

  bake(scene, g, "bait_squid_strips", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x201828);
    gfx.fillStyle(0xd8c8f0);
    gfx.fillRoundedRect(14, 28, 36, 10, 3);
    gfx.fillStyle(0xf0e8ff);
    gfx.fillRoundedRect(18, 18, 28, 12, 4);
    gfx.fillStyle(0x9966cc, 0.55);
    gfx.fillRect(22, 20, 20, 4);
    gfx.lineStyle(1, 0x664488, 0.6);
    for (let i = 0; i < 5; i++) {
      gfx.lineBetween(20 + i * 5, 38, 18 + i * 5, 46);
    }
    gfx.fillStyle(0xffffff, 0.35);
    gfx.fillRect(20, 19, 8, 3);
  });

  bake(scene, g, "bait_moonmoth", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x181028);
    gfx.fillStyle(0x8844cc, 0.25);
    gfx.fillCircle(32, 32, 24);
    gfx.fillStyle(0xcc88ff, 0.9);
    gfx.fillEllipse(32, 34, 22, 12);
    gfx.fillStyle(0xeeccff, 0.55);
    gfx.fillEllipse(32, 32, 14, 7);
    gfx.fillStyle(0xffffff, 0.85);
    gfx.fillCircle(26, 28, 3);
    gfx.fillStyle(0x6622aa);
    gfx.fillCircle(38, 36, 2);
  });

  bake(scene, g, "bait_shimmer_scale", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x181828);
    for (const [x, y, c, a] of [
      [20, 28, 0x88ccff, 0.65],
      [38, 26, 0xffcc88, 0.65],
      [30, 40, 0xcc88ff, 0.65],
      [44, 40, 0xaaffcc, 0.5],
    ]) {
      gfx.fillStyle(c, a);
      gfx.fillCircle(x, y, 6);
      gfx.fillStyle(0xffffff, 0.7);
      gfx.fillCircle(x - 2, y - 2, 2);
    }
    gfx.lineStyle(1, 0xffffff, 0.35);
    gfx.lineBetween(16, 20, 48, 46);
  });

  bake(scene, g, "bait_coral_flakes", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x281818);
    gfx.fillStyle(0xff6644);
    gfx.fillTriangle(14, 44, 32, 16, 50, 44);
    gfx.fillStyle(0xffaa88);
    gfx.fillTriangle(20, 44, 32, 22, 44, 44);
    gfx.fillStyle(0xffccd8, 0.7);
    gfx.fillCircle(28, 26, 3);
    gfx.lineStyle(1, 0xcc4422, 0.5);
    gfx.lineBetween(32, 22, 32, 44);
  });

  bake(scene, g, "bait_swamp_grub", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x182014);
    gfx.fillStyle(0x3a4828);
    gfx.fillEllipse(32, 36, 28, 12);
    gfx.fillStyle(0x5a7040);
    gfx.fillEllipse(32, 34, 24, 10);
    sphere(gfx, 16, 34, 4, 0x7a9050, 0xa0b870, 0x3a4828);
    sphere(gfx, 48, 38, 4, 0x7a9050, 0xa0b870, 0x3a4828);
    gfx.fillStyle(0x1a2010);
    gfx.fillCircle(14, 32, 1.5);
    gfx.lineStyle(1, 0x4a6038, 0.6);
    gfx.lineBetween(22, 36, 42, 36);
  });

  bake(scene, g, "bait_lily_pad", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x142018);
    gfx.fillStyle(0x2a7040);
    gfx.fillCircle(22, 38, 12);
    gfx.fillCircle(42, 34, 10);
    gfx.fillStyle(0x48a858);
    gfx.fillCircle(22, 36, 9);
    gfx.fillCircle(42, 32, 7);
    gfx.lineStyle(2, 0x1a5030, 0.75);
    gfx.lineBetween(22, 38, 22, 20);
    gfx.lineBetween(42, 34, 42, 18);
    gfx.fillStyle(0x88cc88, 0.4);
    gfx.fillCircle(18, 32, 3);
  });

  bake(scene, g, "bait_sulfur_grit", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x201c14);
    gfx.fillStyle(0x6a6450);
    gfx.fillRoundedRect(12, 28, 40, 22, 4);
    for (const [x, y, r] of [
      [18, 36, 4],
      [28, 32, 3.5],
      [38, 38, 4],
      [46, 34, 3],
      [32, 42, 2.5],
    ]) {
      sphere(gfx, x, y, r, 0xdddd44, 0xfff088, 0x888830);
    }
    gfx.fillStyle(0xffaa22, 0.2);
    gfx.fillCircle(30, 36, 10);
  });

  bake(scene, g, "bait_ember_gel", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x281408);
    gfx.fillStyle(0xff6622, 0.22);
    gfx.fillCircle(32, 32, 24);
    gfx.fillStyle(0xff8833, 0.95);
    gfx.fillEllipse(32, 34, 22, 16);
    gfx.fillStyle(0xffcc66, 0.75);
    gfx.fillEllipse(32, 30, 12, 8);
    gfx.fillStyle(0xffffff, 0.55);
    gfx.fillCircle(26, 28, 4);
    gfx.lineStyle(1, 0xff4400, 0.35);
    gfx.strokeEllipse(32, 34, 24, 18);
  });

  bake(scene, g, "bait_reef_shiny", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x141828);
    for (const [x, y] of [
      [18, 28],
      [32, 22],
      [46, 30],
      [24, 42],
      [40, 44],
    ]) {
      gfx.fillStyle(0x88aaff, 0.45);
      gfx.fillCircle(x, y, 5);
      gfx.fillStyle(0xffffff, 0.9);
      gfx.fillCircle(x - 1.5, y - 1.5, 2);
    }
    gfx.lineStyle(1, 0xd8ecff, 0.55);
    gfx.lineBetween(14, 18, 50, 48);
  });

  bake(scene, g, "bait_ice_shavings", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x182028);
    gfx.fillStyle(0xc8ecff);
    gfx.fillTriangle(12, 46, 26, 18, 40, 46);
    gfx.fillTriangle(22, 48, 38, 24, 52, 48);
    gfx.fillStyle(0xffffff, 0.75);
    gfx.fillTriangle(18, 44, 26, 24, 34, 44);
    gfx.lineStyle(1, 0x88c8e8, 0.6);
    gfx.lineBetween(26, 18, 26, 46);
  });

  bake(scene, g, "bait_crystal_shards", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x101828);
    gfx.fillStyle(0x44aadd);
    gfx.fillTriangle(14, 48, 32, 14, 50, 48);
    gfx.fillStyle(0xaaeeff, 0.85);
    gfx.fillTriangle(22, 46, 32, 24, 42, 46);
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillTriangle(26, 40, 32, 28, 38, 40);
    gfx.lineStyle(1, 0x2288cc, 0.5);
    gfx.lineBetween(32, 14, 32, 48);
  });

  bake(scene, g, "bait_serpent_lure", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x181028);
    gfx.lineStyle(4, 0x6622aa, 1);
    gfx.beginPath();
    gfx.moveTo(10, 46);
    gfx.lineTo(22, 26);
    gfx.lineTo(34, 38);
    gfx.lineTo(46, 20);
    gfx.lineTo(54, 32);
    gfx.strokePath();
    gfx.lineStyle(2, 0xcc88ff, 0.85);
    gfx.strokePath();
    sphere(gfx, 24, 30, 5, 0x8844cc, 0xcc88ff, 0x441866);
    gfx.fillStyle(0xff4444);
    gfx.fillCircle(22, 28, 1.5);
  });

  bake(scene, g, "bait_gator_chunks", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x141814);
    gfx.fillStyle(0x2a4030);
    gfx.fillRoundedRect(14, 28, 36, 18, 4);
    gfx.fillStyle(0x4a6848);
    gfx.fillRoundedRect(16, 30, 14, 10, 3);
    gfx.fillRoundedRect(34, 32, 12, 12, 3);
    gfx.fillStyle(0x8a2828, 0.55);
    gfx.fillRect(18, 34, 10, 3);
    gfx.fillRect(36, 38, 8, 2);
    gfx.lineStyle(1, 0x1a2818, 0.7);
    gfx.strokeRoundedRect(14, 28, 36, 18, 4);
  });

  bake(scene, g, "bait_ashen_flies", ICON, ICON, (gfx) => {
    iconPlate(gfx, 0x281408);
    gfx.fillStyle(0xff8844, 0.18);
    gfx.fillCircle(32, 32, 22);
    for (const [x, y, r] of [
      [20, 26, 4],
      [34, 34, 3.5],
      [44, 22, 3],
      [28, 40, 2.5],
    ]) {
      sphere(gfx, x, y, r, 0xff8844, 0xffcc66, 0xcc4400);
      gfx.lineStyle(1, 0xffffff, 0.35);
      gfx.lineBetween(x - 3, y - 4, x + 3, y - 4);
    }
  });

  g.destroy();
}
