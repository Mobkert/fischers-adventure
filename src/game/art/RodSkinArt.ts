import Phaser from "phaser";
import {
  drawGoldenLuckyRod,
  drawUniversalPortalRod,
  drawPufferfirmRod,
  drawPoisonedRod,
  drawPistolRod,
  drawLaserRod,
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

  g.destroy();
}
