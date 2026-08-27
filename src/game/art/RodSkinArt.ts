import Phaser from "phaser";
import {
  drawGoldenLuckyRod,
  drawUniversalPortalRod,
  drawPufferfirmRod,
  drawPoisonedRod,
  drawPistolRod,
  drawLaserRod,
  drawFrigidRod,
  drawFrozenLotusRod,
  drawIcicleRod,
  drawHaloOfIceRod,
  drawHyperborealRod,
  drawHyperthermicRod,
  drawSkinRodIcon,
} from "./RodSkinHeldArt";

/** Generate high-detail UI / hotbar textures for crate rod skins. */
export function generateRodSkinTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const S = 64;

  const bake = (
    key: string,
    draw: (
      g: Phaser.GameObjects.Graphics,
      hx: number,
      hy: number,
      tx: number,
      ty: number
    ) => void
  ) => {
    g.clear();
    drawSkinRodIcon(g, draw);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    g.generateTexture(key, S, S);
  };

  bake("skin_golden_lucky", drawGoldenLuckyRod);
  bake("skin_universal_portal", drawUniversalPortalRod);
  bake("skin_poisoned", drawPoisonedRod);
  bake("skin_pistol", drawPistolRod);
  bake("skin_laser", drawLaserRod);

  bake("skin_frigid", drawFrigidRod);
  bake("skin_frozen_lotus", drawFrozenLotusRod);
  bake("skin_icicle", drawIcicleRod);
  bake("skin_halo_of_ice", drawHaloOfIceRod);
  bake("skin_hyperboreal", drawHyperborealRod);
  bake("skin_hyperthermic", drawHyperthermicRod);

  // Pufferfirm — use the real pufferfish image stretched (not procedural)
  if (scene.textures.exists("pufferfish")) {
    const src = scene.textures
      .get("pufferfish")
      .getSourceImage() as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(32, 34);
    ctx.rotate((-46 * Math.PI) / 180);
    ctx.drawImage(src, -36, -12, 72, 24);
    ctx.restore();
    if (scene.textures.exists("skin_pufferfirm")) {
      scene.textures.remove("skin_pufferfirm");
    }
    scene.textures.addCanvas("skin_pufferfirm", canvas);
  } else {
    bake("skin_pufferfirm", drawPufferfirmRod);
  }

  // Skin crate icon
  g.clear();
  g.fillStyle(0x3a2818);
  g.fillRoundedRect(8, 14, 48, 40, 4);
  g.fillStyle(0x5a4030);
  g.fillRoundedRect(10, 16, 44, 36, 3);
  g.fillStyle(0xc4a86a);
  g.fillRect(8, 28, 48, 6);
  g.fillStyle(0x8b6914);
  g.fillRect(28, 14, 8, 40);
  g.lineStyle(2, 0xffe066, 0.9);
  g.strokeRoundedRect(8, 14, 48, 40, 4);
  g.fillStyle(0xff66aa);
  g.fillCircle(32, 34, 5);
  g.fillStyle(0xffe066);
  g.fillCircle(32, 34, 2.5);
  // Mini sparkles on crate
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(18, 22, 1);
  g.fillCircle(46, 40, 1.2);
  if (scene.textures.exists("skin_crate")) scene.textures.remove("skin_crate");
  g.generateTexture("skin_crate", S, S);

  // Frostpeak crate — icy blue crate with snowflake
  g.clear();
  g.fillStyle(0x1a3a55);
  g.fillRoundedRect(8, 14, 48, 40, 4);
  g.fillStyle(0x3a6a88);
  g.fillRoundedRect(10, 16, 44, 36, 3);
  g.fillStyle(0xa8d0e8);
  g.fillRect(8, 28, 48, 6);
  g.fillStyle(0x6a98b8);
  g.fillRect(28, 14, 8, 40);
  g.lineStyle(2, 0xd0ecff, 0.95);
  g.strokeRoundedRect(8, 14, 48, 40, 4);
  // Snowflake
  const sx = 32;
  const sy = 34;
  g.lineStyle(1.8, 0xffffff, 0.95);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    g.lineBetween(
      sx + Math.cos(a) * 6,
      sy + Math.sin(a) * 6,
      sx - Math.cos(a) * 6,
      sy - Math.sin(a) * 6
    );
  }
  g.fillStyle(0xe8f8ff, 0.95);
  g.fillCircle(sx, sy, 2.2);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(sx, sy, 1.1);
  // Frost sparkles on crate
  g.fillStyle(0xffffff, 0.75);
  g.fillCircle(18, 22, 1);
  g.fillCircle(46, 40, 1.2);
  g.fillCircle(44, 20, 0.8);
  if (scene.textures.exists("frostpeak_crate")) {
    scene.textures.remove("frostpeak_crate");
  }
  g.generateTexture("frostpeak_crate", S, S);

  generateForgeIceWeaponTextures(scene, g);

  g.destroy();
}

/** Hyperthermic forge volley — high-detail icicle swords + ice-spike axes. */
function generateForgeIceWeaponTextures(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics
): void {
  // Icicle sword — faceted crystal blade with core highlight + frost grip
  g.clear();
  // Soft outer glow
  g.fillStyle(0x6aa8c8, 0.35);
  g.fillTriangle(24, 2, 34, 70, 14, 70);
  // Deep blade body
  g.fillStyle(0x3a7088, 1);
  g.fillTriangle(24, 4, 32, 68, 16, 68);
  // Mid facet
  g.fillStyle(0x7ec8e8, 1);
  g.fillTriangle(24, 6, 29.5, 64, 18.5, 64);
  // Bright core ridge
  g.fillStyle(0xd0f0ff, 1);
  g.fillTriangle(24, 8, 26.8, 52, 21.2, 52);
  g.fillStyle(0xffffff, 0.95);
  g.fillTriangle(24, 10, 25.6, 40, 22.4, 40);
  // Side micro-facets / chips
  g.fillStyle(0xa8dce8, 0.9);
  g.fillTriangle(18.5, 28, 16, 40, 20, 42);
  g.fillTriangle(29.5, 34, 32, 46, 27, 48);
  // Crack lines
  g.lineStyle(1, 0xffffff, 0.55);
  g.lineBetween(23, 18, 22, 48);
  g.lineBetween(25, 22, 26.5, 44);
  // Cross-guard frost
  g.fillStyle(0x8ab8d0, 1);
  g.fillRect(17, 64, 14, 5);
  g.fillStyle(0xc8e8f8, 1);
  g.fillRect(15, 63, 4, 7);
  g.fillRect(29, 63, 4, 7);
  // Grip
  g.fillStyle(0x4a6880, 1);
  g.fillRect(20, 68, 8, 14);
  g.fillStyle(0x90b8d0, 1);
  g.fillRect(21, 70, 6, 2);
  g.fillRect(21, 74, 6, 2);
  g.fillStyle(0xd0e8f0, 1);
  g.fillRect(19, 80, 10, 4);
  // Tip sparkle
  g.fillStyle(0xffffff, 1);
  g.fillCircle(24, 8, 1.8);
  if (scene.textures.exists("forge_icicle")) scene.textures.remove("forge_icicle");
  g.generateTexture("forge_icicle", 48, 88);

  // Ice spike axe — broad jagged crystal head + shaft
  g.clear();
  g.fillStyle(0x4a88a8, 0.4);
  g.fillTriangle(24, 2, 42, 42, 6, 42);
  // Main head
  g.fillStyle(0x3a6888, 1);
  g.fillTriangle(24, 4, 40, 40, 8, 40);
  g.fillStyle(0x7ab8d8, 1);
  g.fillTriangle(24, 8, 34, 38, 14, 38);
  g.fillStyle(0xc8ecff, 1);
  g.fillTriangle(24, 12, 30, 34, 18, 34);
  g.fillStyle(0xffffff, 0.9);
  g.fillTriangle(24, 14, 27, 28, 21, 28);
  // Side spikes (axe flukes)
  g.fillStyle(0x5a98b8, 1);
  g.fillTriangle(8, 28, 0, 18, 14, 38);
  g.fillTriangle(40, 28, 48, 18, 34, 38);
  g.fillStyle(0xa8d8f0, 1);
  g.fillTriangle(8, 30, 3, 22, 12, 36);
  g.fillTriangle(40, 30, 45, 22, 36, 36);
  g.fillStyle(0xe8f8ff, 0.85);
  g.fillTriangle(6, 26, 2, 20, 10, 32);
  g.fillTriangle(42, 26, 46, 20, 38, 32);
  // Extra lower fangs
  g.fillStyle(0x6aa8c8, 1);
  g.fillTriangle(14, 38, 10, 48, 20, 40);
  g.fillTriangle(34, 38, 38, 48, 28, 40);
  // Cracks
  g.lineStyle(1, 0xffffff, 0.5);
  g.lineBetween(22, 14, 20, 34);
  g.lineBetween(26, 16, 28, 32);
  // Shaft
  g.fillStyle(0x4a6880, 1);
  g.fillRect(21, 40, 6, 30);
  g.fillStyle(0x8ab0c8, 1);
  g.fillRect(22, 42, 4, 2);
  g.fillRect(22, 48, 4, 2);
  g.fillRect(22, 54, 4, 2);
  g.fillStyle(0xd0e8f0, 1);
  g.fillRect(19, 68, 10, 5);
  // Pommel crystal
  g.fillStyle(0xa8d8f0, 1);
  g.fillTriangle(24, 78, 28, 72, 20, 72);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(24, 10, 1.6);
  if (scene.textures.exists("forge_ice_spike")) {
    scene.textures.remove("forge_ice_spike");
  }
  g.generateTexture("forge_ice_spike", 48, 84);
}
