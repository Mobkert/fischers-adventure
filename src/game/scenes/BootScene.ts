import Phaser from "phaser";
import {
  generateHouseTextures,
  generateTerrainTextures,
} from "../world/WorldDecor";
import { generatePlayerArt } from "../entities/PlayerArt";
import { generateBoatArt } from "../entities/BoatArt";
import { generateMerchantTexture } from "../entities/FishMerchant";

/** Detailed fishing-rod icons (handle bottom-left → tip top-right). */
function generateRodTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const S = 64;

  // —— Starter rod: cork grip, wood blank, simple guide ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56, 28, 8);
  // blank
  g.lineStyle(5, 0x6b4423);
  g.lineBetween(12, 52, 52, 12);
  g.lineStyle(3, 0x8b5a2b);
  g.lineBetween(14, 50, 50, 14);
  g.lineStyle(1, 0xa07040, 0.7);
  g.lineBetween(18, 46, 48, 16);
  // cork handle
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0xa88850);
  g.fillRect(10, 46, 10, 2);
  g.fillRect(10, 50, 10, 2);
  // reel seat ring
  g.fillStyle(0x5a5a5a);
  g.fillRect(18, 40, 5, 6);
  // tip guide / eyelet
  g.lineStyle(2, 0xb0b0b0);
  g.strokeCircle(52, 12, 4);
  g.fillStyle(0xe8e8e8);
  g.fillCircle(52, 12, 1.5);
  g.generateTexture("rod", S, S);

  // —— Lucky rod: gold wraps + clover at tip ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56, 28, 8);
  g.lineStyle(5, 0x5c3a21);
  g.lineBetween(12, 52, 48, 14);
  g.lineStyle(3, 0x7a5230);
  g.lineBetween(14, 50, 46, 16);
  // gold thread wraps
  g.lineStyle(2, 0xd4af37);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  // green accent wrap
  g.lineStyle(2, 0x3d8b4f);
  g.lineBetween(24, 40, 28, 36);
  // cork + gold butt cap
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0xd4af37);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0xb8962e);
  g.fillRect(18, 40, 5, 6);
  // tip eyelet
  g.lineStyle(2, 0xd4af37);
  g.strokeCircle(48, 14, 3.5);
  // four-leaf clover at tip
  const cx = 54;
  const cy = 8;
  g.fillStyle(0x2d8a3e);
  g.fillCircle(cx - 3, cy, 3.2);
  g.fillCircle(cx + 3, cy, 3.2);
  g.fillCircle(cx, cy - 3, 3.2);
  g.fillCircle(cx, cy + 3, 3.2);
  g.fillStyle(0x58b368);
  g.fillCircle(cx - 2.5, cy - 0.5, 1.6);
  g.fillCircle(cx + 2.5, cy - 0.5, 1.6);
  g.fillCircle(cx, cy - 2.5, 1.6);
  g.fillStyle(0x1a5c28);
  g.fillCircle(cx, cy, 1.4);
  g.lineStyle(1.5, 0x1a5c28);
  g.lineBetween(cx, cy + 2, cx + 1, cy + 7);
  g.generateTexture("rod_lucky", S, S);

  // —— Firm rod: thick graphite blank, metal seat, steel tip ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56, 30, 8);
  g.lineStyle(7, 0x1a1a22);
  g.lineBetween(11, 52, 50, 12);
  g.lineStyle(4, 0x2a2a35);
  g.lineBetween(13, 50, 48, 14);
  g.lineStyle(1, 0x4a4a58, 0.8);
  g.lineBetween(16, 46, 46, 16);
  // EVA / rubber grip
  g.fillStyle(0x2c2c2c);
  g.fillRoundedRect(7, 43, 16, 14, 3);
  g.fillStyle(0x3a3a3a);
  for (let i = 0; i < 4; i++) {
    g.fillRect(9, 45 + i * 3, 12, 1);
  }
  // metal reel seat
  g.fillStyle(0x8a9098);
  g.fillRect(18, 38, 7, 8);
  g.fillStyle(0xc0c8d0);
  g.fillRect(19, 39, 5, 2);
  // steel tip + guide
  g.lineStyle(2, 0xc0c8d0);
  g.lineBetween(44, 16, 52, 10);
  g.strokeCircle(52, 10, 4);
  g.fillStyle(0xe8eef2);
  g.fillCircle(52, 10, 1.5);
  g.generateTexture("rod_firm", S, S);

  // —— Amber rod: yellow blank, warm wraps, balanced ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56, 28, 8);
  g.lineStyle(5, 0xc9a227);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0xe8c547);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xffe066, 0.75);
  g.lineBetween(18, 46, 46, 16);
  // warm amber wraps
  g.lineStyle(2, 0xf0a020);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  g.lineStyle(2, 0xffd54a);
  g.lineBetween(24, 40, 28, 36);
  // cork + amber butt
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0xe8a020);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0xd4af37);
  g.fillRect(18, 40, 5, 6);
  // tip eyelet
  g.lineStyle(2, 0xffe066);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xfff3c4);
  g.fillCircle(50, 12, 1.2);
  // small amber gem at tip
  g.fillStyle(0xffb020);
  g.fillCircle(56, 7, 3.2);
  g.fillStyle(0xffe066);
  g.fillCircle(55, 6, 1.4);
  g.generateTexture("rod_amber", S, S);

  // —— Wildflower rod: orange blank, pink wraps, blossom tip ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56, 28, 8);
  g.lineStyle(5, 0xc45a12);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0xe87830);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xffa060, 0.75);
  g.lineBetween(18, 46, 46, 16);
  // pink thread wraps
  g.lineStyle(2, 0xf472b6);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  g.lineStyle(2, 0xfb7185);
  g.lineBetween(24, 40, 28, 36);
  // cork + pink butt
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0xf472b6);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0xe87830);
  g.fillRect(18, 40, 5, 6);
  // tip eyelet
  g.lineStyle(2, 0xf9a8d4);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xffe4f0);
  g.fillCircle(50, 12, 1.2);
  // wildflower at tip
  const fx = 56;
  const fy = 7;
  g.fillStyle(0xf472b6);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.fillCircle(fx + Math.cos(a) * 4.2, fy + Math.sin(a) * 4.2, 2.6);
  }
  g.fillStyle(0xffb4d4);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.fillCircle(fx + Math.cos(a) * 3.2, fy + Math.sin(a) * 3.2, 1.4);
  }
  g.fillStyle(0xffe066);
  g.fillCircle(fx, fy, 2.2);
  g.fillStyle(0x2d8a3e);
  g.fillCircle(fx - 1, fy + 5, 1.5);
  g.lineStyle(1.5, 0x1a5c28);
  g.lineBetween(fx, fy + 2, fx - 1, fy + 7);
  g.generateTexture("rod_wildflower", S, S);

  g.destroy();
}

/** Generate game textures at runtime. */
function makeTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  generatePlayerArt(scene);
  generateBoatArt(scene);
  generateMerchantTexture(scene);

  // Bobber
  g.clear();
  g.fillStyle(0xff3333);
  g.fillCircle(8, 6, 6);
  g.fillStyle(0xffffff);
  g.fillCircle(8, 10, 5);
  g.generateTexture("bobber", 16, 16);

  generateRodTextures(scene);

  // Equipment bag
  g.clear();
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(16, 28, 22, 6);
  g.fillStyle(0x6b4423);
  g.fillRoundedRect(6, 10, 20, 16, 3);
  g.fillStyle(0x8b5a2b);
  g.fillRect(6, 10, 20, 4);
  g.fillStyle(0xc4a86a);
  g.fillRect(13, 6, 6, 6);
  g.fillStyle(0x3a2a1a);
  g.fillRect(14, 16, 4, 5);
  g.generateTexture("equipment_bag", 32, 32);

  // Bestiary book
  g.clear();
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(16, 28, 22, 6);
  g.fillStyle(0x5c3d1e);
  g.fillRoundedRect(7, 6, 18, 22, 2);
  g.fillStyle(0x8b5a2b);
  g.fillRoundedRect(9, 7, 15, 20, 2);
  g.fillStyle(0xf0e6d2);
  g.fillRect(10, 9, 12, 16);
  g.fillStyle(0xc4a86a);
  g.fillRect(15, 6, 2, 22);
  g.fillStyle(0xb8860b);
  g.fillCircle(16, 17, 3);
  g.generateTexture("bestiary_book", 32, 32);

  // Water tile
  g.clear();
  g.fillStyle(0x3a9ad9, 0.85);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(0x5eb8ef, 0.5);
  g.fillRect(0, 4, 32, 4);
  g.fillRect(0, 16, 32, 3);
  g.generateTexture("water", 32, 32);

  // Keep sand for underwater floor
  g.clear();
  g.fillStyle(0xc2a36a);
  g.fillRect(0, 0, 32, 32);
  g.fillStyle(0xa88850);
  g.fillRect(4, 8, 3, 3);
  g.fillRect(18, 20, 4, 3);
  g.generateTexture("sand", 32, 32);

  g.destroy();

  generateTerrainTextures(scene);
  generateHouseTextures(scene);
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.image("fish", "images/sockeye_salmon.png");
    this.load.image("flatfish", "images/flatfish.png");
    this.load.image("yellowfin_tuna", "images/yellowfin_tuna.png");
    this.load.image("bluefin_tuna", "images/bluefin_tuna.png");
    this.load.image("phantom_eel", "images/phantom_eel.png");
    this.load.image("sunfish", "images/sunfish.png");
    this.load.image("swamp_frog", "images/swamp_frog.png");
    this.load.image("whisker_catfish", "images/whisker_catfish.png");
    this.load.image("pale_minnow", "images/pale_minnow.png");
    this.load.image("spotted_mushrooms", "images/spotted_mushrooms.png");
    this.load.image("brown_gar", "images/brown_gar.png");
    this.load.image("crocodile", "images/crocodile.png");
    // Free procedural ambient loops (~32s each)
    this.load.audio("music_island", "audio/music_island.wav");
    this.load.audio("music_ocean", "audio/music_ocean.wav");
    this.load.audio("music_jungle", "audio/music_jungle.wav");
    this.load.audio("sfx_ding", "audio/sfx_ding.wav");
    this.load.audio("sfx_ding_triple", "audio/sfx_ding_triple.wav");
  }

  create(): void {
    makeTextures(this);
    this.createSaveFolderIcon();
    this.scene.start("MenuScene");
  }

  private createSaveFolderIcon(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    g.fillStyle(0xd4af37);
    g.fillRoundedRect(4, 10, 24, 18, 2);
    g.fillStyle(0xc4a86a);
    g.fillRoundedRect(6, 6, 12, 6, 2);
    g.fillStyle(0x8b7355);
    g.fillRect(10, 16, 12, 8);
    g.generateTexture("icon_save_folder", 32, 32);
    g.destroy();
  }
}
