import Phaser from "phaser";

/** Local width of the Stellar Sky pocket. */
export const STELLAR_LOCAL_W = 2600;
/** Spawn X inside the floating isle (local). */
export const STELLAR_SPAWN_LOCAL_X = 1280;
/** Return portal center (local). */
export const STELLAR_PORTAL_LOCAL_X = 420;
export const STELLAR_LAND_LEFT = 280;
export const STELLAR_LAND_RIGHT = 2320;

export type StellarSkyPlaceResult = {
  portalX: number;
  npcX: number;
  /** Stellar Merchant stand (left of the Warden). */
  merchantX: number;
  landLeft: number;
  landRight: number;
  /** Tear down visuals, tweens, and ground colliders. */
  destroy: () => void;
};

/** Tall galactic being — void robe, nebula core, star crown. */
export function generateGalacticBeingTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("galactic_being")) return;
  const g = scene.add.graphics();
  const W = 64;
  const H = 96;

  g.fillStyle(0x6a3cff, 0.18);
  g.fillEllipse(32, 50, 54, 78);
  g.fillStyle(0x7ec8ff, 0.12);
  g.fillEllipse(32, 48, 40, 64);

  g.fillStyle(0x0a0618, 1);
  g.fillRoundedRect(18, 28, 28, 58, 10);
  g.fillStyle(0x1a0a40, 1);
  g.fillRoundedRect(20, 30, 24, 54, 9);

  g.fillStyle(0x3d1a88, 0.85);
  g.fillTriangle(22, 36, 30, 88, 22, 88);
  g.fillStyle(0x6a3cff, 0.55);
  g.fillTriangle(42, 40, 42, 88, 34, 88);
  g.fillStyle(0xff8c42, 0.35);
  g.fillTriangle(28, 48, 36, 88, 30, 88);

  g.fillStyle(0x7ec8ff, 0.9);
  g.fillCircle(32, 52, 7);
  g.fillStyle(0xe8d0ff, 0.95);
  g.fillCircle(32, 52, 4);
  g.fillStyle(0xffe066, 1);
  g.fillCircle(32, 52, 2);

  g.lineStyle(2, 0xc9a0ff, 0.9);
  g.strokeCircle(32, 38, 14);
  g.lineStyle(1.2, 0x7ec8ff, 0.7);
  g.strokeCircle(32, 38, 18);

  g.lineStyle(3, 0x6a3cff, 0.85);
  g.lineBetween(18, 44, 8, 62);
  g.lineBetween(46, 44, 56, 62);
  g.lineStyle(1.5, 0x7ec8ff, 0.9);
  g.lineBetween(18, 44, 8, 62);
  g.lineBetween(46, 44, 56, 62);
  g.fillStyle(0xffe066, 0.95);
  g.fillCircle(8, 62, 2.5);
  g.fillCircle(56, 62, 2.5);

  g.fillStyle(0x120828, 1);
  g.fillCircle(32, 24, 12);
  g.fillStyle(0x2a1848, 1);
  g.fillCircle(32, 24, 10);
  g.fillStyle(0x7ec8ff, 0.55);
  g.fillEllipse(32, 26, 14, 10);
  g.fillStyle(0xff8c42, 0.7);
  g.fillCircle(28, 24, 2.2);
  g.fillStyle(0x7ec8ff, 0.85);
  g.fillCircle(36, 24, 2.2);
  g.fillStyle(0xffe066, 0.9);
  g.fillCircle(32, 28, 1.4);

  const crown = [
    [32, 6],
    [24, 12],
    [40, 12],
    [18, 16],
    [46, 16],
  ];
  for (const [cx, cy] of crown) {
    g.fillStyle(0xffe066, 0.95);
    g.fillCircle(cx, cy, 2);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx, cy, 1);
  }
  g.lineStyle(1, 0xc9a0ff, 0.8);
  g.strokeCircle(32, 14, 11);

  g.fillStyle(0x7ec8ff, 0.5);
  g.fillCircle(26, 90, 1.5);
  g.fillCircle(32, 93, 2);
  g.fillCircle(38, 90, 1.5);
  g.fillStyle(0xff8c42, 0.45);
  g.fillCircle(30, 86, 1.2);

  g.generateTexture("galactic_being", W, H);
  g.destroy();
}

/**
 * Stellar Merchant — cosmic trader being (rings, moon face, gold nebula).
 * Same genre as the Astral Warden, different silhouette and palette.
 */
export function generateStellarMerchantTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("stellar_merchant")) {
    scene.textures.remove("stellar_merchant");
  }
  const g = scene.add.graphics();
  const W = 68;
  const H = 92;

  // Soft gold aura (merchant warmth vs warden violet)
  g.fillStyle(0xffc860, 0.14);
  g.fillEllipse(34, 52, 58, 72);
  g.fillStyle(0x7ec8ff, 0.1);
  g.fillEllipse(34, 48, 44, 58);

  // Wide layered robe — teal / midnight, not purple void
  g.fillStyle(0x061828, 1);
  g.fillRoundedRect(16, 30, 36, 54, 14);
  g.fillStyle(0x0a3048, 1);
  g.fillRoundedRect(18, 32, 32, 50, 12);
  g.fillStyle(0x1a5878, 0.85);
  g.fillTriangle(20, 40, 28, 86, 20, 86);
  g.fillStyle(0xffc860, 0.4);
  g.fillTriangle(48, 42, 48, 86, 40, 86);
  // Gold trade sash
  g.fillStyle(0xe8b040, 0.95);
  g.fillRect(22, 54, 24, 5);
  g.fillStyle(0xffe066, 1);
  g.fillCircle(28, 56.5, 1.6);
  g.fillCircle(34, 56.5, 1.6);
  g.fillCircle(40, 56.5, 1.6);

  // Orbital rings around torso (Saturn-like — unique vs warden)
  g.lineStyle(2.5, 0xffc860, 0.85);
  g.strokeEllipse(34, 58, 52, 16);
  g.lineStyle(1.4, 0x7ec8ff, 0.75);
  g.strokeEllipse(34, 58, 46, 12);

  // Arms as comet trails
  g.lineStyle(3.5, 0x1a5878, 0.9);
  g.lineBetween(18, 46, 6, 68);
  g.lineBetween(50, 46, 62, 68);
  g.lineStyle(1.8, 0xffc860, 0.9);
  g.lineBetween(18, 46, 6, 68);
  g.lineBetween(50, 46, 62, 68);
  g.fillStyle(0xffe066, 1);
  g.fillCircle(6, 68, 3);
  g.fillCircle(62, 68, 3);
  g.fillStyle(0xffffff, 0.75);
  g.fillCircle(6, 68, 1.2);
  g.fillCircle(62, 68, 1.2);

  // Moon face (crescent) — trader of lunar tides
  g.fillStyle(0xe8f0ff, 1);
  g.fillCircle(34, 26, 13);
  g.fillStyle(0x0a3048, 1);
  g.fillCircle(40, 24, 11);
  // Soft eye glow on the crescent
  g.fillStyle(0x7ec8ff, 0.95);
  g.fillCircle(28, 26, 2.2);
  g.fillStyle(0xffe066, 0.9);
  g.fillCircle(28, 26, 1);

  // Coin constellation halo (not a star crown)
  const coins = [
    [34, 6],
    [22, 12],
    [46, 12],
    [16, 22],
    [52, 22],
  ];
  for (const [cx, cy] of coins) {
    g.fillStyle(0xe8b040, 0.95);
    g.fillCircle(cx, cy, 2.4);
    g.fillStyle(0xffe066, 1);
    g.fillCircle(cx, cy, 1.2);
  }
  g.lineStyle(1.2, 0xffc860, 0.65);
  g.strokeCircle(34, 16, 14);

  // Floating trade orbs at hem
  g.fillStyle(0x7ec8ff, 0.55);
  g.fillCircle(26, 88, 2);
  g.fillCircle(34, 90, 2.5);
  g.fillCircle(42, 88, 2);
  g.fillStyle(0xffc860, 0.5);
  g.fillCircle(30, 84, 1.4);
  g.fillCircle(38, 84, 1.4);

  g.generateTexture("stellar_merchant", W, H);
  g.destroy();
}

/**
 * Build the Stellar Sky pocket — void backdrop, nebulae, floating isle,
 * return portal, and ground tiles for walking.
 * Call `destroy()` when leaving so overworld stays light.
 */
export function placeStellarSky(
  scene: Phaser.Scene,
  originX: number,
  groundY: number,
  groundGroup: Phaser.Physics.Arcade.StaticGroup
): StellarSkyPlaceResult {
  generateGalacticBeingTexture(scene);
  generateStellarMerchantTexture(scene);

  const W = STELLAR_LOCAL_W;
  const skyH = groundY + 520;
  const root = scene.add.container(0, 0).setDepth(-6);
  const fxRoot = scene.add.container(0, 0).setDepth(8);
  const g = scene.add.graphics();
  root.add(g);

  const tweens: Phaser.Tweens.Tween[] = [];
  const groundTiles: Phaser.Physics.Arcade.Sprite[] = [];

  // Deep void gradient bands
  g.fillStyle(0x04010c, 1);
  g.fillRect(originX, 0, W, skyH);
  g.fillStyle(0x0a0618, 1);
  g.fillRect(originX, 0, W, groundY * 0.45);
  g.fillStyle(0x120828, 0.85);
  g.fillRect(originX, groundY * 0.35, W, groundY * 0.35);

  const nebulae: Array<{
    x: number;
    y: number;
    rx: number;
    ry: number;
    color: number;
    a: number;
  }> = [
    { x: 520, y: 160, rx: 280, ry: 110, color: 0x3d1a88, a: 0.45 },
    { x: 980, y: 90, rx: 220, ry: 80, color: 0x1a4068, a: 0.4 },
    { x: 1500, y: 200, rx: 320, ry: 130, color: 0x6a3cff, a: 0.28 },
    { x: 1900, y: 120, rx: 200, ry: 90, color: 0xff8c42, a: 0.18 },
    { x: 700, y: 320, rx: 260, ry: 70, color: 0x2a1848, a: 0.5 },
    { x: 2100, y: 280, rx: 240, ry: 100, color: 0x4a20a0, a: 0.35 },
  ];
  for (const n of nebulae) {
    g.fillStyle(n.color, n.a);
    g.fillEllipse(originX + n.x, n.y, n.rx, n.ry);
    g.fillStyle(0xe8d0ff, n.a * 0.25);
    g.fillEllipse(originX + n.x - 30, n.y - 10, n.rx * 0.45, n.ry * 0.4);
  }

  g.lineStyle(18, 0x3d1a88, 0.25);
  g.beginPath();
  g.moveTo(originX + 200, 80);
  g.lineTo(originX + 600, 140);
  g.lineTo(originX + 1100, 100);
  g.lineTo(originX + 1700, 180);
  g.lineTo(originX + 2400, 90);
  g.strokePath();
  g.lineStyle(8, 0x7ec8ff, 0.2);
  g.beginPath();
  g.moveTo(originX + 250, 95);
  g.lineTo(originX + 650, 150);
  g.lineTo(originX + 1150, 110);
  g.lineTo(originX + 1750, 185);
  g.strokePath();

  g.fillStyle(0x1a2848, 1);
  g.fillCircle(originX + 2100, 70, 48);
  g.fillStyle(0x2a4068, 0.9);
  g.fillCircle(originX + 2090, 62, 48);
  g.fillStyle(0x7ec8ff, 0.25);
  g.fillCircle(originX + 2082, 55, 18);
  g.lineStyle(3, 0xc9a0ff, 0.45);
  g.strokeEllipse(originX + 2100, 70, 110, 18);
  g.lineStyle(1.5, 0xffe066, 0.35);
  g.strokeEllipse(originX + 2100, 70, 128, 22);

  g.fillStyle(0xe8eef8, 0.85);
  g.fillCircle(originX + 420, 70, 16);
  g.fillStyle(0xa8b8d8, 0.5);
  g.fillCircle(originX + 414, 66, 5);
  g.fillCircle(originX + 426, 74, 3);

  // Starfield baked into graphics (no per-star objects)
  const starSeed = [
    0.12, 0.41, 0.73, 0.08, 0.55, 0.91, 0.33, 0.67, 0.19, 0.84, 0.47, 0.02,
    0.61, 0.28, 0.95, 0.14, 0.78, 0.36, 0.52, 0.89, 0.05, 0.43, 0.71, 0.24,
  ];
  for (let i = 0; i < 120; i++) {
    const sx = originX + ((i * 97 + 13) % W);
    const sy = 20 + ((i * 53 + 7) % Math.floor(groundY - 40));
    const bright = starSeed[i % starSeed.length];
    const r = bright > 0.85 ? 2.2 : bright > 0.55 ? 1.4 : 0.9;
    const col =
      bright > 0.9 ? 0xffe066 : bright > 0.7 ? 0x7ec8ff : 0xffffff;
    g.fillStyle(col, 0.35 + bright * 0.65);
    g.fillCircle(sx, sy, r);
    if (bright > 0.88) {
      g.lineStyle(1, col, 0.35);
      g.lineBetween(sx - 5, sy, sx + 5, sy);
      g.lineBetween(sx, sy - 5, sx, sy + 5);
    }
  }

  const shards = [
    { x: 640, y: 220, s: 1 },
    { x: 980, y: 180, s: 0.7 },
    { x: 1600, y: 240, s: 1.1 },
    { x: 1880, y: 170, s: 0.8 },
    { x: 1100, y: 300, s: 0.55 },
  ];
  for (const sh of shards) {
    const cx = originX + sh.x;
    const cy = sh.y;
    const s = sh.s;
    g.fillStyle(0x7ec8ff, 0.55);
    g.fillTriangle(
      cx,
      cy - 18 * s,
      cx + 10 * s,
      cy + 8 * s,
      cx - 10 * s,
      cy + 8 * s
    );
    g.fillStyle(0xe8d0ff, 0.7);
    g.fillTriangle(
      cx,
      cy - 18 * s,
      cx + 4 * s,
      cy,
      cx - 6 * s,
      cy + 2 * s
    );
    g.fillStyle(0xffe066, 0.5);
    g.fillCircle(cx, cy - 2 * s, 2 * s);
  }

  const landL = originX + STELLAR_LAND_LEFT;
  const landR = originX + STELLAR_LAND_RIGHT;
  const landW = landR - landL;
  const mid = (landL + landR) / 2;

  g.fillStyle(0x6a3cff, 0.2);
  g.fillEllipse(mid, groundY + 90, landW * 0.85, 70);
  g.fillStyle(0x7ec8ff, 0.12);
  g.fillEllipse(mid, groundY + 70, landW * 0.55, 40);
  for (let i = 0; i < 9; i++) {
    const tx = landL + 80 + i * ((landW - 160) / 8);
    g.lineStyle(2, i % 2 ? 0x7ec8ff : 0x6a3cff, 0.35);
    g.lineBetween(tx, groundY + 20, tx + (i % 2 ? 20 : -20), groundY + 110);
  }

  g.fillStyle(0x1a0a40, 1);
  g.fillRoundedRect(landL, groundY - 8, landW, 56, 18);
  g.fillStyle(0x2a1848, 1);
  g.fillRoundedRect(landL + 8, groundY - 4, landW - 16, 40, 14);
  g.fillStyle(0x3d2a68, 1);
  g.fillRoundedRect(landL + 4, groundY - 14, landW - 8, 22, 12);
  g.fillStyle(0x5a40a0, 0.9);
  g.fillRoundedRect(landL + 16, groundY - 12, landW - 32, 14, 8);
  g.fillStyle(0x7ec8ff, 0.35);
  for (let x = landL + 30; x < landR - 30; x += 18) {
    g.fillCircle(x, groundY - 14, 3 + ((x * 3) % 3));
  }
  g.fillStyle(0xff8c42, 0.25);
  for (let x = landL + 40; x < landR - 40; x += 37) {
    g.fillCircle(x, groundY - 16, 2);
  }
  g.fillStyle(0xffe066, 0.2);
  g.fillRoundedRect(mid - 40, groundY - 16, 80, 10, 4);
  g.fillStyle(0x7ec8ff, 0.35);
  g.fillRoundedRect(mid - 28, groundY - 14, 56, 6, 3);

  for (const px of [landL + 50, landR - 50, mid - 220, mid + 220]) {
    g.fillStyle(0x120828, 1);
    g.fillRect(px - 6, groundY - 70, 12, 58);
    g.fillStyle(0x6a3cff, 0.7);
    g.fillCircle(px, groundY - 74, 7);
    g.fillStyle(0xffe066, 0.9);
    g.fillCircle(px, groundY - 74, 3);
  }

  const monX = mid + 40;
  g.lineStyle(4, 0x3d1a88, 0.7);
  g.strokeCircle(monX, groundY - 100, 55);
  g.lineStyle(2, 0x7ec8ff, 0.55);
  g.strokeCircle(monX, groundY - 100, 70);
  g.lineStyle(1.5, 0xffe066, 0.4);
  g.strokeEllipse(monX, groundY - 100, 130, 28);
  g.fillStyle(0x1a0a40, 0.85);
  g.fillCircle(monX, groundY - 100, 22);
  g.fillStyle(0x6a3cff, 0.5);
  g.fillCircle(monX, groundY - 100, 12);
  g.fillStyle(0xffe066, 0.85);
  g.fillCircle(monX, groundY - 100, 4);

  const portalX = originX + STELLAR_PORTAL_LOCAL_X;
  g.fillStyle(0x0a0618, 0.9);
  g.fillEllipse(portalX, groundY - 48, 70, 100);
  g.lineStyle(3, 0x6a3cff, 0.9);
  g.strokeEllipse(portalX, groundY - 48, 54, 86);
  g.lineStyle(2, 0x7ec8ff, 0.75);
  g.strokeEllipse(portalX, groundY - 48, 40, 68);
  g.lineStyle(1.5, 0xffe066, 0.65);
  g.strokeEllipse(portalX, groundY - 48, 26, 48);
  g.fillStyle(0x7ec8ff, 0.2);
  g.fillEllipse(portalX, groundY - 48, 22, 40);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.fillStyle(i % 2 ? 0xffe066 : 0xc9a0ff, 0.85);
    g.fillCircle(
      portalX + Math.cos(a) * 38,
      groundY - 48 + Math.sin(a) * 58,
      2
    );
  }

  root.add(
    scene.add
      .text(portalX, groundY - 120, "Return Portal", {
        fontFamily: "Georgia, serif",
        fontSize: "13px",
        color: "#c9a0ff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12)
  );
  root.add(
    scene.add
      .text(portalX, groundY - 102, "F — Leave Stellar Sky", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#8aa8c0",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
  );
  root.add(
    scene.add
      .text(mid, 36, "Stellar Sky", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#e8d0ff",
        stroke: "#120828",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0.85)
  );

  // Fewer, wider colliders — less physics cost while loaded
  for (let x = landL; x < landR; x += 64) {
    const w = Math.min(64, landR - x);
    const tile = groundGroup
      .create(x + w / 2, groundY + 16, "sand")
      .setDisplaySize(w, 32)
      .setVisible(false);
    tile.refreshBody();
    groundTiles.push(tile);
  }

  // A few soft twinkles only (was 40+ forever-tweens)
  for (let i = 0; i < 6; i++) {
    const star = scene.add.circle(
      originX + 200 + ((i * 370) % (W - 400)),
      60 + ((i * 70) % 220),
      2,
      i % 2 ? 0x7ec8ff : 0xffe066,
      0.85
    );
    fxRoot.add(star);
    tweens.push(
      scene.tweens.add({
        targets: star,
        alpha: { from: 0.25, to: 1 },
        scale: { from: 0.7, to: 1.25 },
        duration: 1400 + i * 180,
        yoyo: true,
        repeat: -1,
        delay: i * 120,
        ease: "Sine.easeInOut",
      })
    );
  }

  return {
    portalX,
    npcX: mid + 40,
    merchantX: mid - 180,
    landLeft: landL,
    landRight: landR,
    destroy: () => {
      for (const tw of tweens) tw.stop();
      for (const tile of groundTiles) {
        groundGroup.remove(tile, true, true);
      }
      fxRoot.destroy(true);
      root.destroy(true);
    },
  };
}
