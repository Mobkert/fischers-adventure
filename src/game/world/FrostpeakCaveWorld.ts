import Phaser from "phaser";

/** Local cave width (before world offset). */
export const CAVE_LOCAL_W = 9800;
/**
 * How far cave water / shell extend below the surface.
 * Matches GameScene.deepWaterPx so deep casts don't reveal sky.
 */
export const CAVE_WATER_DEPTH_PX = 720;
/** Cave fish only patrol this far down — below is visual abyss only. */
export const CAVE_FISH_MAX_DEPTH_PX = 280;
/** Spawn X inside Entrance Hall (local). */
export const CAVE_SPAWN_LOCAL_X = 240;
/** Leave when standing left of this local X. */
export const CAVE_EXIT_LOCAL_X = 320;

/** World Y of the cave column floor (below deep water). */
export function caveBottomY(groundY: number): number {
  return groundY + CAVE_WATER_DEPTH_PX + 40;
}

export type CaveLand = {
  id: string;
  name: string;
  left: number;
  right: number;
  theme: "entrance" | "crystal" | "vault" | "sanctum";
};

export type CaveWater = { id: string; name: string; left: number; right: number };

export type CavePort = {
  id: string;
  landX: number;
  dockLeft: number;
  dockRight: number;
  boatX: number;
  waterL: number;
  waterR: number;
  label: string;
};

/** Chambers in local coords (0 … CAVE_LOCAL_W). */
export const CAVE_LANDS_LOCAL: CaveLand[] = [
  { id: "entrance", name: "Entrance Hall", left: 0, right: 1280, theme: "entrance" },
  { id: "crystal", name: "Crystal Gallery", left: 2680, right: 4180, theme: "crystal" },
  { id: "vault", name: "Gem Vault", left: 6380, right: 7780, theme: "vault" },
  { id: "sanctum", name: "Frozen Sanctum", left: 8680, right: 9800, theme: "sanctum" },
];

export const CAVE_WATERS_LOCAL: CaveWater[] = [
  { id: "channel", name: "Ice Channel", left: 1280, right: 2680 },
  { id: "lake", name: "Great Lake", left: 4180, right: 6380 },
  { id: "abyss", name: "Abyss Reach", left: 7780, right: 8680 },
];

export const CAVE_PORTS_LOCAL: CavePort[] = [
  {
    id: "entrance-east",
    landX: 1180,
    dockLeft: 1160,
    dockRight: 1320,
    boatX: 1380,
    waterL: 1280,
    waterR: 2680,
    label: "Ice Channel Port",
  },
  {
    id: "crystal-west",
    landX: 2780,
    dockLeft: 2640,
    dockRight: 2820,
    boatX: 2580,
    waterL: 1280,
    waterR: 2680,
    label: "Crystal West Port",
  },
  {
    id: "crystal-east",
    landX: 4080,
    dockLeft: 4040,
    dockRight: 4220,
    boatX: 4280,
    waterL: 4180,
    waterR: 6380,
    label: "Great Lake Port",
  },
  {
    id: "vault-west",
    landX: 6480,
    dockLeft: 6340,
    dockRight: 6520,
    boatX: 6280,
    waterL: 4180,
    waterR: 6380,
    label: "Vault West Port",
  },
  {
    id: "vault-east",
    landX: 7680,
    dockLeft: 7640,
    dockRight: 7820,
    boatX: 7880,
    waterL: 7780,
    waterR: 8680,
    label: "Abyss Port",
  },
  {
    id: "sanctum-west",
    landX: 8780,
    dockLeft: 8640,
    dockRight: 8820,
    boatX: 8580,
    waterL: 7780,
    waterR: 8680,
    label: "Sanctum Port",
  },
];

export function offsetCavePort(port: CavePort, originX: number): CavePort {
  return {
    ...port,
    landX: port.landX + originX,
    dockLeft: port.dockLeft + originX,
    dockRight: port.dockRight + originX,
    boatX: port.boatX + originX,
    waterL: port.waterL + originX,
    waterR: port.waterR + originX,
  };
}

export function offsetCaveWater(
  water: CaveWater,
  originX: number
): CaveWater {
  return {
    ...water,
    left: water.left + originX,
    right: water.right + originX,
  };
}

export function offsetCaveLand(land: CaveLand, originX: number): CaveLand {
  return {
    ...land,
    left: land.left + originX,
    right: land.right + originX,
  };
}

/** Walkable spans (chamber + docks) in world X. */
export function caveWalkZones(
  originX: number
): { min: number; max: number }[] {
  // Inset so the player body can't hang off the first/last floor tiles
  const pad = 36;
  return [
    { min: originX + pad, max: originX + 1320 },
    { min: originX + 2640, max: originX + 4220 },
    { min: originX + 6340, max: originX + 7820 },
    { min: originX + 8640, max: originX + CAVE_LOCAL_W - pad },
  ];
}

/**
 * Draw Frostpeak Cave far east of the overworld and add ground collision tiles.
 */
export function placeFrostpeakCave(
  scene: Phaser.Scene,
  originX: number,
  groundY: number,
  ground: Phaser.Physics.Arcade.StaticGroup
): {
  lands: CaveLand[];
  waters: CaveWater[];
  ports: CavePort[];
} {
  const lands = CAVE_LANDS_LOCAL.map((l) => offsetCaveLand(l, originX));
  const waters = CAVE_WATERS_LOCAL.map((w) => offsetCaveWater(w, originX));
  const ports = CAVE_PORTS_LOCAL.map((p) => offsetCavePort(p, originX));

  drawCaveShell(scene, originX, groundY);
  for (const land of lands) drawLandChamber(scene, land, groundY);
  for (const water of waters) drawWaterBody(scene, water, groundY);
  for (const port of ports) drawPort(scene, port, groundY);
  drawCaveEndWalls(scene, originX, groundY, ground);

  for (const land of lands) {
    for (let x = land.left; x < land.right; x += 32) {
      ground
        .create(x + 16, groundY + 16, "sand")
        .setVisible(false)
        .refreshBody();
    }
  }
  for (const port of ports) {
    const w = port.dockRight - port.dockLeft;
    const dock = ground
      .create(port.dockLeft + w / 2, groundY + 8, "dock")
      .setDisplaySize(w, 16)
      .setVisible(false);
    dock.refreshBody();
  }

  return { lands, waters, ports };
}

function drawCaveEndWalls(
  scene: Phaser.Scene,
  originX: number,
  groundY: number,
  ground: Phaser.Physics.Arcade.StaticGroup
): void {
  const bottom = caveBottomY(groundY);
  const wallW = 48;
  const g = scene.add.graphics().setDepth(4);

  // West wall (Entrance Hall — closes the void)
  const westX = originX;
  g.fillStyle(0x0a1018, 1);
  g.fillRect(westX - wallW, 0, wallW + 8, bottom);
  g.fillStyle(0x1a2838, 1);
  g.fillRect(westX - 12, 0, 18, groundY + 4);
  g.fillStyle(0x2a4050, 0.7);
  for (let y = 40; y < groundY - 20; y += 70) {
    g.fillTriangle(westX + 4, y, westX - 28, y + 30, westX + 4, y + 60);
  }
  g.fillStyle(0xa8c8e0, 0.25);
  g.fillRect(westX - 4, 20, 4, groundY - 40);

  // East wall (Frozen Sanctum tip)
  const eastX = originX + CAVE_LOCAL_W;
  g.fillStyle(0x0a1018, 1);
  g.fillRect(eastX - 8, 0, wallW + 8, bottom);
  g.fillStyle(0x1a2838, 1);
  g.fillRect(eastX - 6, 0, 18, groundY + 4);
  g.fillStyle(0x2a4050, 0.7);
  for (let y = 40; y < groundY - 20; y += 70) {
    g.fillTriangle(eastX - 4, y, eastX + 28, y + 30, eastX - 4, y + 60);
  }
  g.fillStyle(0xa8c8e0, 0.25);
  g.fillRect(eastX, 20, 4, groundY - 40);

  // Invisible tall blockers so you can't walk into the void
  const westBlock = ground
    .create(westX - wallW / 2, groundY / 2, "sand")
    .setVisible(false)
    .setDisplaySize(wallW, groundY + 40);
  westBlock.refreshBody();
  const eastBlock = ground
    .create(eastX + wallW / 2, groundY / 2, "sand")
    .setVisible(false)
    .setDisplaySize(wallW, groundY + 40);
  eastBlock.refreshBody();
}

function drawCaveShell(
  scene: Phaser.Scene,
  originX: number,
  groundY: number
): void {
  const g = scene.add.graphics().setDepth(0);
  const bottom = caveBottomY(groundY);
  g.fillGradientStyle(0x04060c, 0x04060c, 0x152030, 0x0a1218, 1);
  g.fillRect(originX, 0, CAVE_LOCAL_W, bottom);

  g.fillStyle(0x101820);
  g.fillRect(originX, 0, CAVE_LOCAL_W, 70);
  for (let x = originX + 20; x < originX + CAVE_LOCAL_W; x += 56) {
    const h = 45 + ((x * 13) % 100);
    g.fillStyle(0x243040);
    g.fillTriangle(x, 0, x + 20, h, x - 14, h * 0.8);
    g.fillStyle(0xa8c8e0, 0.35);
    g.fillTriangle(x + 2, h * 0.5, x + 8, h, x - 2, h * 0.65);
  }

  for (let i = 0; i < 12; i++) {
    const cx = originX + 400 + i * 800;
    g.fillStyle(0x121a24, 0.5);
    g.fillEllipse(cx, 200, 500, 180);
  }

  for (let i = 0; i < 40; i++) {
    const flake = scene.add
      .circle(
        originX + 100 + i * 240 + (i % 5) * 30,
        30 + (i % 8) * 25,
        1.2 + (i % 3) * 0.5,
        0xffffff,
        0.4
      )
      .setDepth(2);
    scene.tweens.add({
      targets: flake,
      y: flake.y + 200,
      x: flake.x + (i % 2 === 0 ? 16 : -12),
      alpha: 0.05,
      duration: 4800 + i * 120,
      repeat: -1,
    });
  }
}

function drawLandChamber(
  scene: Phaser.Scene,
  land: CaveLand,
  groundY: number
): void {
  const g = scene.add.graphics().setDepth(3);
  const { left, right, theme, name } = land;
  const mid = (left + right) / 2;
  const w = right - left;

  g.fillStyle(0x2a343e);
  g.fillRect(left, groundY, w, 90);
  g.fillStyle(0x3a4855);
  g.fillRect(left, groundY, w, 12);
  g.fillStyle(0xe8f0f8, 0.28);
  for (let i = 0; i < Math.floor(w / 70); i++) {
    g.fillEllipse(left + 40 + i * 70, groundY + 3, 36, 7);
  }

  if (theme === "entrance") {
    g.fillStyle(0x1a2430, 0.6);
    g.fillRect(left, 80, w, groundY - 80);
    drawEntranceDecor(scene, g, left, mid, groundY);
  } else if (theme === "crystal") {
    g.fillStyle(0x142838, 0.55);
    g.fillRect(left, 80, w, groundY - 80);
    drawCrystalDecor(scene, g, left, right, groundY);
  } else if (theme === "vault") {
    g.fillStyle(0x1c1810, 0.55);
    g.fillRect(left, 80, w, groundY - 80);
    drawVaultDecor(g, left, right, mid, groundY);
  } else {
    g.fillStyle(0x101828, 0.6);
    g.fillRect(left, 80, w, groundY - 80);
    drawSanctumDecor(scene, g, left, right, mid, groundY);
  }

  for (let x = left + 180; x < right - 100; x += 320) {
    g.fillStyle(0x4a6070, 0.75);
    g.fillRect(x - 14, 90, 28, groundY - 100);
    g.fillStyle(0x8ab0c8, 0.4);
    g.fillRect(x - 6, 100, 8, groundY - 120);
  }

  g.fillStyle(0x3a4048);
  g.fillRoundedRect(mid - 70, groundY - 118, 140, 28, 4);
  scene.add
    .text(mid, groundY - 104, name.toUpperCase(), {
      fontFamily: "Georgia, serif",
      fontSize: "11px",
      color: "#c8d8e8",
    })
    .setOrigin(0.5)
    .setDepth(6);
}

function drawEntranceDecor(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  left: number,
  mid: number,
  groundY: number
): void {
  g.fillStyle(0x06080c);
  g.beginPath();
  g.moveTo(left + 40, groundY);
  g.lineTo(left + 40, groundY - 170);
  g.lineTo(left + 110, groundY - 220);
  g.lineTo(left + 180, groundY - 170);
  g.lineTo(left + 180, groundY);
  g.closePath();
  g.fillPath();
  scene.add
    .text(left + 110, groundY - 240, "Exit to Frostpeak", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#a8c8d8",
      stroke: "#000",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(6);

  drawJewelPile(g, mid - 200, groundY - 4, 0xffd700);
  drawJewelPile(g, mid - 80, groundY - 2, 0xe8e8ff);
  drawCrystal(g, mid + 120, groundY - 16, 0x66ddff, 1);
  drawCrystal(g, mid + 220, groundY - 12, 0xff88cc, 0.85);

  g.fillStyle(0x3a2410);
  g.fillRoundedRect(mid + 300, groundY - 42, 70, 42, 4);
  g.fillStyle(0x6b4423);
  g.fillRoundedRect(mid + 303, groundY - 39, 64, 36, 3);
  g.fillStyle(0xffe066);
  g.fillCircle(mid + 335, groundY - 22, 5);
}

function drawCrystalDecor(
  _scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  left: number,
  right: number,
  _groundY: number
): void {
  // Ceiling chandelier only — floor crystals are the memory-challenge props
  const mid = (left + right) / 2;
  g.lineStyle(2, 0x8aa0b0, 0.7);
  g.lineBetween(mid, 0, mid, 130);
  for (let i = -4; i <= 4; i++) {
    g.fillStyle(0x88ddff, 0.5);
    g.fillTriangle(
      mid + i * 26,
      130,
      mid + i * 26 - 9,
      185 + Math.abs(i) * 6,
      mid + i * 26 + 9,
      185 + Math.abs(i) * 6
    );
  }
}

function drawVaultDecor(
  g: Phaser.GameObjects.Graphics,
  _left: number,
  _right: number,
  mid: number,
  groundY: number
): void {
  // Empty pedestals — gems were lost; restored via the vault quest
  for (let i = 0; i < 5; i++) {
    const px = mid - 160 + i * 80;
    g.fillStyle(0x4a5058);
    g.fillRect(px - 10, groundY - 36, 20, 36);
    g.fillStyle(0x6a7078);
    g.fillEllipse(px, groundY - 36, 28, 10);
    g.fillStyle(0x2a3038, 0.55);
    g.fillEllipse(px, groundY - 38, 16, 6);
  }

  g.lineStyle(3, 0xc4a86a, 0.45);
  g.strokeEllipse(mid, groundY - 160, 280, 120);
}

function drawSanctumDecor(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  left: number,
  right: number,
  mid: number,
  groundY: number
): void {
  g.fillStyle(0x3a5060);
  g.fillRect(mid - 50, groundY - 70, 100, 70);
  g.fillStyle(0x8ab0c8, 0.6);
  g.fillRect(mid - 40, groundY - 100, 80, 30);
  g.fillStyle(0xd0e8f8, 0.5);
  g.fillTriangle(
    mid,
    groundY - 160,
    mid - 35,
    groundY - 100,
    mid + 35,
    groundY - 100
  );

  drawCrystal(g, left + 160, groundY - 20, 0xa0e0ff, 1.3);
  drawCrystal(g, right - 160, groundY - 20, 0xa0e0ff, 1.3);
  drawCrystal(g, mid - 120, groundY - 14, 0xffffff, 0.9);
  drawCrystal(g, mid + 120, groundY - 14, 0xffffff, 0.9);

  const glow = scene.add
    .circle(mid, groundY - 120, 80, 0x88ccff, 0.1)
    .setDepth(4);
  scene.tweens.add({
    targets: glow,
    alpha: 0.22,
    duration: 2200,
    yoyo: true,
    repeat: -1,
  });
}

function drawWaterBody(
  scene: Phaser.Scene,
  water: CaveWater,
  groundY: number
): void {
  const g = scene.add.graphics().setDepth(2);
  const { left, right, name } = water;
  const mid = (left + right) / 2;
  const w = right - left;
  const top = groundY;
  const deep = CAVE_WATER_DEPTH_PX;

  // Layered column — deep casts stay underwater (no sky under the lake)
  g.fillStyle(0x0a2838);
  g.fillRect(left, top, w, Math.min(80, deep));
  g.fillStyle(0x0c3040);
  g.fillRect(left, top + 60, w, Math.min(140, Math.max(0, deep - 60)));
  g.fillStyle(0x081828);
  g.fillRect(left, top + 180, w, Math.min(200, Math.max(0, deep - 180)));
  g.fillStyle(0x050e18);
  g.fillRect(left, top + 360, w, Math.max(120, deep - 360));

  g.fillStyle(0x123848);
  g.fillEllipse(mid, top + 140, w * 0.9, 180);
  g.fillStyle(0x184858);
  g.fillEllipse(mid, top + 260, w * 0.65, 220);
  g.fillStyle(0x0a2030);
  g.fillEllipse(mid, top + 380, w * 0.4, 200);

  g.fillStyle(0x1a5070, 0.5);
  g.fillRect(left, top - 2, w, 16);
  g.fillStyle(0x3a90b0, 0.3);
  g.fillRect(left, top, w, 5);
  g.fillStyle(0xa0d8f0, 0.18);
  g.fillRect(left + 30, top + 1, w - 60, 3);

  g.fillStyle(0xd0e4f0, 0.65);
  g.fillEllipse(left + 12, top + 2, 36, 14);
  g.fillEllipse(right - 12, top + 2, 36, 14);

  for (let i = 0; i < Math.min(10, Math.floor(w / 180)); i++) {
    const patch = scene.add
      .ellipse(left + 100 + i * 180, top + 50, 60, 16, 0x66bbee, 0.06)
      .setDepth(3);
    scene.tweens.add({
      targets: patch,
      alpha: 0.13,
      x: patch.x + 10,
      duration: 2600 + i * 150,
      yoyo: true,
      repeat: -1,
    });
  }

  scene.add
    .text(mid, top + 40, name, {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#6a90a8",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(4)
    .setAlpha(0.7);
}

function drawPort(
  scene: Phaser.Scene,
  port: CavePort,
  groundY: number
): void {
  const g = scene.add.graphics().setDepth(5);
  const { dockLeft, dockRight, landX, label } = port;
  const w = dockRight - dockLeft;

  for (let x = dockLeft; x < dockRight; x += 28) {
    scene.add
      .image(x + 14, groundY, "dock")
      .setOrigin(0.5, 0.15)
      .setDepth(5)
      .setTint(0xc8b090);
  }
  g.fillStyle(0x4a3828);
  g.fillRect(dockLeft + 6, groundY - 28, 6, 36);
  g.fillRect(dockRight - 12, groundY - 28, 6, 36);
  g.fillStyle(0x6a5040);
  g.fillRect(dockLeft + 7, groundY - 26, 4, 32);
  g.fillRect(dockRight - 11, groundY - 26, 4, 32);

  g.lineStyle(2, 0x8b6914, 0.7);
  g.lineBetween(dockLeft + 8, groundY - 22, dockRight - 8, groundY - 22);

  scene.add
    .text(landX, groundY - 48, label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#d0c0a0",
      stroke: "#000000",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(6);

  const lx = dockLeft + w / 2;
  const lamp = scene.add
    .circle(lx, groundY - 36, 18, 0xffc878, 0.12)
    .setDepth(4);
  scene.tweens.add({
    targets: lamp,
    alpha: 0.22,
    duration: 1800,
    yoyo: true,
    repeat: -1,
  });
}

function drawCrystal(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number,
  scale: number
): void {
  const s = 22 * scale;
  g.fillStyle(color, 0.85);
  g.fillTriangle(x, y - s * 2.2, x - s * 0.7, y, x + s * 0.7, y);
  g.fillStyle(color, 0.55);
  g.fillTriangle(
    x - s * 0.5,
    y - s * 0.3,
    x - s * 1.1,
    y + s * 0.4,
    x - s * 0.1,
    y + s * 0.2
  );
  g.fillTriangle(
    x + s * 0.5,
    y - s * 0.3,
    x + s * 1.1,
    y + s * 0.4,
    x + s * 0.1,
    y + s * 0.2
  );
  g.fillStyle(0xffffff, 0.4);
  g.fillTriangle(x - 2, y - s * 2, x - s * 0.25, y - s * 0.6, x + 2, y - s * 0.8);
}

function drawJewelPile(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  tint: number
): void {
  g.fillStyle(0x2a2010, 0.5);
  g.fillEllipse(x, y + 4, 70, 16);
  g.fillStyle(tint, 0.9);
  g.fillCircle(x - 12, y - 6, 8);
  g.fillCircle(x + 6, y - 10, 7);
  g.fillCircle(x + 16, y - 4, 6);
  g.fillCircle(x - 2, y - 2, 9);
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(x - 14, y - 9, 2);
  g.fillCircle(x + 4, y - 13, 2);
}
