import Phaser from "phaser";
import {
  drawRecoilShotgun,
  RECOIL_ROD_ICON_HAND,
  RECOIL_ROD_ICON_TIP,
} from "../art/RecoilRodArt";
import { drawPortalRodIcon } from "../art/PortalRodArt";
import { drawForgeRodIcon } from "../art/ForgeRodArt";
import { drawBirthdayRodIcon } from "../art/BirthdayRodArt";
import { generateCraftStarlightFishIcon } from "../art/CraftIngredientArt";
import {
  generateHouseTextures,
  generateTerrainTextures,
} from "../world/WorldDecor";
import { generateAshencastTreeTextures, generateAshencastHouseTextures } from "../world/AshencastIsland";
import { generatePlayerArt } from "../entities/PlayerArt";
import { generateBoatArt } from "../entities/BoatArt";
import { generateMerchantTexture, generateCodeGuyTexture } from "../entities/FishMerchant";
import { generateHatTextures } from "./hatTextures";
import { generateRodSkinTextures } from "../art/RodSkinArt";

/** Detailed fishing-rod icons (handle bottom-left → tip top-right). */
export function generateRodTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  /** Padded canvas — tip ornaments (clover, portal, bolts) need headroom. */
  const S = 72;
  const IPY = 8;

  // —— Starter rod: cork grip, wood blank, simple guide ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
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
  g.fillEllipse(22, 56 + IPY, 28, 8);
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
  const cy = 8 + IPY;
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
  g.fillEllipse(22, 56 + IPY, 30, 8);
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
  g.fillEllipse(22, 56 + IPY, 28, 8);
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
  g.fillCircle(56, 7 + IPY, 3.2);
  g.fillStyle(0xffe066);
  g.fillCircle(55, 6 + IPY, 1.4);
  g.generateTexture("rod_amber", S, S);

  // —— Wildflower rod: orange blank, pink wraps, blossom tip ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
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
  const fy = 7 + IPY;
  g.fillStyle(0xf472b6);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.fillCircle(fx + Math.cos(a) * 4.2, fy + Math.sin(a) * 4.2, 2.6);
  }
  g.fillStyle(0xfde68a);
  g.fillCircle(fx, fy, 2.2);
  g.generateTexture("rod_wildflower", S, S);

  // —— Zeus rod: storm blue blank, gold lightning wraps ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
  g.lineStyle(5, 0x2a5080);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0x4da6ff);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xa8d4ff, 0.8);
  g.lineBetween(18, 46, 46, 16);
  g.lineStyle(2, 0xffe066);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0xffe066);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0x4da6ff);
  g.fillRect(18, 40, 5, 6);
  g.lineStyle(2, 0xffe066);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xffffff);
  g.fillCircle(50, 12, 1.2);
  // bolt tip
  g.lineStyle(2, 0xffe066);
  g.lineBetween(54, 4 + IPY, 58, 10 + IPY);
  g.lineBetween(58, 10 + IPY, 56, 10 + IPY);
  g.lineBetween(56, 10 + IPY, 60, 16 + IPY);
  g.generateTexture("rod_zeus", S, S);

  // —— Coral rod: pink-teal blank, coral wraps ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
  g.lineStyle(5, 0x2a6b6b);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0x5ec4b8);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xff9ec8, 0.85);
  g.lineBetween(18, 46, 46, 16);
  g.lineStyle(2, 0xff8fb8);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0xff8fb8);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0x5ec4b8);
  g.fillRect(18, 40, 5, 6);
  g.lineStyle(2, 0xffb6d9);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xffe8f0);
  g.fillCircle(50, 12, 1.2);
  // small coral tip
  g.fillStyle(0xff6b9d);
  g.fillCircle(56, 7 + IPY, 2.8);
  g.fillStyle(0x5ec4b8);
  g.fillCircle(58, 10 + IPY, 2.2);
  g.fillStyle(0xffb6d9);
  g.fillCircle(54, 11 + IPY, 1.8);
  g.generateTexture("rod_coral", S, S);

  // —— Augment rod: grey blank, cool grey star tip ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
  g.lineStyle(5, 0x4a5058);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0x8a929c);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xc0c8d0, 0.8);
  g.lineBetween(18, 46, 46, 16);
  g.lineStyle(2, 0x6a727c);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  g.fillStyle(0x3a3e44);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0x6a7078);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0x9aa2aa);
  g.fillRect(18, 40, 5, 6);
  g.lineStyle(2, 0xb8c0c8);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xe8eef2);
  g.fillCircle(50, 12, 1.2);
  // cool grey star at tip
  const sx = 56;
  const sy = 7 + IPY;
  g.fillStyle(0xa8b0b8);
  g.fillCircle(sx, sy, 5);
  g.fillStyle(0xd0d8e0);
  // 5-point star via overlapping diamonds
  g.fillTriangle(sx, sy - 6, sx + 2.2, sy - 1, sx - 2.2, sy - 1);
  g.fillTriangle(sx, sy + 6, sx + 2.2, sy + 1, sx - 2.2, sy + 1);
  g.fillTriangle(sx - 6, sy, sx - 1, sy - 2.2, sx - 1, sy + 2.2);
  g.fillTriangle(sx + 6, sy, sx + 1, sy - 2.2, sx + 1, sy + 2.2);
  g.fillStyle(0xf0f4f8);
  g.fillCircle(sx, sy, 1.8);
  g.generateTexture("rod_augment", S, S);

  // —— Tranquil rod: deep blue blank, silver wraps, bubble-glass tip ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
  g.lineStyle(5, 0x2d5f8e);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0x63b4d9);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xd7f4ff, 0.85);
  g.lineBetween(18, 46, 46, 16);
  g.lineStyle(2, 0xa8c9d8);
  g.lineBetween(20, 44, 24, 40);
  g.lineBetween(28, 36, 32, 32);
  g.lineBetween(36, 28, 40, 24);
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0x5ea7d4);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0x9dd8f0);
  g.fillRect(18, 40, 5, 6);
  g.lineStyle(2, 0xe7fbff);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xffffff);
  g.fillCircle(50, 12, 1.2);
  g.fillStyle(0x8fe9ff, 0.95);
  g.fillCircle(56, 7 + IPY, 4.8);
  g.lineStyle(1.5, 0xeaffff, 0.95);
  g.strokeCircle(56, 7 + IPY, 4.8);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(54.5, 5.3 + IPY, 1.3);
  g.fillStyle(0xbcefff, 0.55);
  g.fillCircle(57.8, 8.3 + IPY, 1.8);
  g.generateTexture("rod_tranquil", S, S);

  // —— Crystal rod: icy blank, rainbow gem tip ——
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(22, 56 + IPY, 28, 8);
  g.lineStyle(5, 0x3a6078);
  g.lineBetween(12, 52, 50, 12);
  g.lineStyle(3, 0x7ec8e8);
  g.lineBetween(14, 50, 48, 14);
  g.lineStyle(1.5, 0xd0f0ff, 0.85);
  g.lineBetween(18, 46, 46, 16);
  g.lineStyle(2, 0xff88cc);
  g.lineBetween(20, 44, 24, 40);
  g.lineStyle(2, 0x88ffaa);
  g.lineBetween(28, 36, 32, 32);
  g.lineStyle(2, 0x88aaff);
  g.lineBetween(36, 28, 40, 24);
  g.fillStyle(0xc4a574);
  g.fillRoundedRect(8, 44, 14, 12, 3);
  g.fillStyle(0x7ec8e8);
  g.fillRect(8, 54, 14, 3);
  g.fillStyle(0xa0d8f0);
  g.fillRect(18, 40, 5, 6);
  g.lineStyle(2, 0xe0f8ff);
  g.strokeCircle(50, 12, 3.5);
  g.fillStyle(0xffffff);
  g.fillCircle(50, 12, 1.2);
  g.fillStyle(0xff6688);
  g.fillTriangle(56, 2 + IPY, 52, 10 + IPY, 60, 10 + IPY);
  g.fillStyle(0xffe0ee);
  g.fillCircle(56, 6 + IPY, 1.4);
  g.generateTexture("rod_crystal", S, S);

  // —— Recoil rod: same shotgun art as the held weapon ——
  g.clear();
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(28, 54 + IPY, 30, 8);
  drawRecoilShotgun(
    g,
    RECOIL_ROD_ICON_HAND.x,
    RECOIL_ROD_ICON_HAND.y,
    RECOIL_ROD_ICON_TIP.x,
    RECOIL_ROD_ICON_TIP.y
  );
  g.generateTexture("rod_recoil", S, S);

  // —— Portal rod: purple-black blank, void portal tip ——
  g.clear();
  drawPortalRodIcon(g);
  g.generateTexture("rod_portal", S, S);

  g.clear();
  drawForgeRodIcon(g);
  g.generateTexture("rod_forge", S, S);

  g.clear();
  drawBirthdayRodIcon(g);
  g.generateTexture("rod_birthday", S, S);

  g.destroy();
}

function generateAmuletTextures(scene: Phaser.Scene): void {
  type Spec = {
    key: string;
    gem: number;
    gemDark: number;
    metal: number;
    metalDark: number;
    glow: number;
    accent: number;
    style: "celestial" | "moon" | "tempest" | "dusky" | "sun" | "thunder";
  };
  const specs: Spec[] = [
    {
      key: "amulet_celestial",
      gem: 0xffe8a0,
      gemDark: 0xd4a020,
      metal: 0xe0c070,
      metalDark: 0x8a6a28,
      glow: 0xfff6d0,
      accent: 0xfff8e8,
      style: "celestial",
    },
    {
      key: "amulet_moonlight",
      gem: 0xc8d8ff,
      gemDark: 0x6a88c8,
      metal: 0xd0d8e8,
      metalDark: 0x6a7080,
      glow: 0xe8f0ff,
      accent: 0xffffff,
      style: "moon",
    },
    {
      key: "amulet_tempest",
      gem: 0x5eb0ff,
      gemDark: 0x2868b0,
      metal: 0x8a9aaa,
      metalDark: 0x3a4858,
      glow: 0xa8d8ff,
      accent: 0xe0f0ff,
      style: "tempest",
    },
    {
      key: "amulet_dusky",
      gem: 0xa8aeb8,
      gemDark: 0x505860,
      metal: 0x7a7068,
      metalDark: 0x3a342e,
      glow: 0xd0d4d8,
      accent: 0xe8e8e8,
      style: "dusky",
    },
    {
      key: "amulet_sunlit",
      gem: 0xffd24a,
      gemDark: 0xe08010,
      metal: 0xf0c040,
      metalDark: 0xa07018,
      glow: 0xffe890,
      accent: 0xfff8d0,
      style: "sun",
    },
    {
      key: "amulet_thunder",
      gem: 0xffe066,
      gemDark: 0xc8a020,
      metal: 0x6a7888,
      metalDark: 0x2a3038,
      glow: 0xfff0a0,
      accent: 0xffffff,
      style: "thunder",
    },
  ];

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const S = 64;
  const cx = 32;
  const cy = 38;

  for (const s of specs) {
    g.clear();

    // Outer soft glow
    g.fillStyle(s.glow, 0.18);
    g.fillCircle(cx, cy, 26);
    g.fillStyle(s.glow, 0.28);
    g.fillCircle(cx, cy, 20);

    // Braided leather cord
    g.lineStyle(4, 0x2a1a10);
    g.beginPath();
    g.moveTo(cx - 1, 2);
    g.lineTo(cx - 3, 12);
    g.lineTo(cx, 18);
    g.lineTo(cx + 2, 24);
    g.strokePath();
    g.lineStyle(2, 0x5c3a21);
    g.beginPath();
    g.moveTo(cx + 1, 2);
    g.lineTo(cx - 1, 12);
    g.lineTo(cx + 2, 18);
    g.lineTo(cx + 3, 24);
    g.strokePath();
    g.lineStyle(1, 0x8b6914, 0.7);
    g.lineBetween(cx, 4, cx - 2, 14);
    g.lineBetween(cx, 14, cx + 1, 22);

    // Bail / jump ring
    g.lineStyle(3, s.metalDark);
    g.strokeCircle(cx, 26, 4);
    g.lineStyle(1.5, s.metal);
    g.strokeCircle(cx, 26, 4);

    // Ornate metal bezel (octagon-ish via overlapping)
    g.fillStyle(s.metalDark);
    g.fillCircle(cx, cy, 16);
    g.fillStyle(s.metal);
    g.fillCircle(cx, cy, 14);
    g.fillStyle(s.metalDark, 0.55);
    g.fillCircle(cx + 1, cy + 2, 12);

    // Filigree prongs
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * 14;
      const py = cy + Math.sin(a) * 14;
      g.fillStyle(s.metal);
      g.fillCircle(px, py, 2.2);
      g.fillStyle(s.accent, 0.5);
      g.fillCircle(px - 0.5, py - 0.5, 0.9);
    }

    // Inner gem cup
    g.fillStyle(0x1a1210, 0.5);
    g.fillCircle(cx, cy + 1, 10);
    g.fillStyle(s.gemDark);
    g.fillCircle(cx, cy, 9.5);
    g.fillStyle(s.gem);
    g.fillCircle(cx - 0.5, cy - 0.5, 8);

    // Style-specific gem face details
    if (s.style === "celestial") {
      // Sun disc + tiny crescent
      g.fillStyle(s.accent, 0.85);
      g.fillCircle(cx - 2, cy - 1, 4);
      g.fillStyle(s.gemDark, 0.9);
      g.fillCircle(cx + 3, cy + 1, 3.5);
      g.fillStyle(s.gem);
      g.fillCircle(cx + 4.5, cy, 3);
      // Rays
      g.lineStyle(1.2, s.accent, 0.7);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.lineBetween(
          cx + Math.cos(a) * 3,
          cy + Math.sin(a) * 3,
          cx + Math.cos(a) * 7,
          cy + Math.sin(a) * 7
        );
      }
    } else if (s.style === "moon") {
      g.fillStyle(s.accent, 0.9);
      g.fillCircle(cx - 1, cy - 1, 5.5);
      g.fillStyle(s.gemDark, 0.95);
      g.fillCircle(cx + 2, cy - 2, 4.5);
      // Craters
      g.fillStyle(s.gemDark, 0.45);
      g.fillCircle(cx - 3, cy + 1, 1.2);
      g.fillCircle(cx - 1, cy + 3, 0.8);
    } else if (s.style === "tempest") {
      // Wave arcs
      g.lineStyle(1.8, s.accent, 0.85);
      g.beginPath();
      g.moveTo(cx - 6, cy + 2);
      g.lineTo(cx - 2, cy - 1);
      g.lineTo(cx + 2, cy + 2);
      g.lineTo(cx + 6, cy - 1);
      g.strokePath();
      g.lineStyle(1.4, s.accent, 0.55);
      g.beginPath();
      g.moveTo(cx - 5, cy + 4);
      g.lineTo(cx - 1, cy + 1);
      g.lineTo(cx + 3, cy + 4);
      g.strokePath();
      // Rain dots
      g.fillStyle(s.accent, 0.7);
      g.fillCircle(cx - 3, cy - 4, 0.8);
      g.fillCircle(cx + 1, cy - 5, 0.7);
      g.fillCircle(cx + 4, cy - 3, 0.8);
    } else if (s.style === "dusky") {
      // Fog swirls
      g.lineStyle(2, s.accent, 0.4);
      g.strokeCircle(cx - 2, cy, 4);
      g.strokeCircle(cx + 2, cy + 1, 3.5);
      g.fillStyle(s.accent, 0.25);
      g.fillEllipse(cx, cy - 2, 10, 4);
      g.fillEllipse(cx + 1, cy + 3, 8, 3);
    } else if (s.style === "sun") {
      g.fillStyle(s.accent, 0.95);
      g.fillCircle(cx, cy - 0.5, 4);
      g.lineStyle(1.6, s.accent, 0.85);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.lineBetween(
          cx + Math.cos(a) * 5,
          cy + Math.sin(a) * 5,
          cx + Math.cos(a) * 8,
          cy + Math.sin(a) * 8
        );
      }
    } else if (s.style === "thunder") {
      // Lightning bolt
      g.fillStyle(s.accent, 0.95);
      g.beginPath();
      g.moveTo(cx + 1, cy - 7);
      g.lineTo(cx - 3, cy - 1);
      g.lineTo(cx + 1, cy - 1);
      g.lineTo(cx - 2, cy + 7);
      g.lineTo(cx + 4, cy);
      g.lineTo(cx, cy);
      g.closePath();
      g.fillPath();
      g.fillStyle(s.gem, 0.5);
      g.fillTriangle(cx, cy - 5, cx - 1, cy - 1, cx + 2, cy - 1);
    }

    // Specular highlight
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(cx - 3, cy - 3, 2.2);
    g.fillStyle(0xffffff, 0.25);
    g.fillEllipse(cx + 2, cy + 3, 5, 2);

    // Tiny chain glints on cord
    g.fillStyle(s.metal, 0.8);
    g.fillCircle(cx - 1, 8, 1);
    g.fillCircle(cx, 16, 1);

    g.generateTexture(s.key, S, S);
  }
  g.destroy();
}

/** Regenerate bag icons if any rod icon is missing (hot reload / new rod added). */
export function ensureRodIconTextures(scene: Phaser.Scene): void {
  const required = [
    "rod_tranquil",
    "rod_birthday",
    "rod_forge",
    "rod_portal",
    "rod_recoil",
  ];
  for (const key of required) {
    if (!scene.textures.exists(key)) {
      generateRodTextures(scene);
      return;
    }
  }
}

/** Generate game textures at runtime. */
function makeTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  generatePlayerArt(scene);
  generateBoatArt(scene);
  generateMerchantTexture(scene);
  generateCodeGuyTexture(scene);

  // Bobber fallback only — real art is loaded in preload (do not overwrite keys)
  g.clear();
  g.fillStyle(0xff3333);
  g.fillCircle(8, 6, 6);
  g.fillStyle(0xffffff);
  g.fillCircle(8, 10, 5);
  g.generateTexture("bobber", 16, 16);

  generateRodTextures(scene);

  // Vault quest gems
  const gemDefs: { key: string; color: number; highlight: number }[] = [
    { key: "gem_red", color: 0xff4466, highlight: 0xffaabb },
    { key: "gem_green", color: 0x44ffaa, highlight: 0xb8ffe0 },
    { key: "gem_blue", color: 0x4488ff, highlight: 0xaaccff },
    { key: "gem_yellow", color: 0xffdd44, highlight: 0xfff0a0 },
    { key: "gem_purple", color: 0xdd88ff, highlight: 0xf0ccff },
  ];
  for (const gem of gemDefs) {
    g.clear();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 28, 18, 5);
    g.fillStyle(gem.color);
    g.fillTriangle(16, 4, 6, 18, 26, 18);
    g.fillTriangle(16, 30, 6, 18, 26, 18);
    g.fillStyle(gem.highlight);
    g.fillTriangle(16, 8, 11, 16, 18, 16);
    g.generateTexture(gem.key, 32, 32);
  }

  // Ashencast anvil shards — high-detail metallic fragments
  const shardDefs: {
    key: string;
    metal: number;
    metalDark: number;
    metalLite: number;
    accent: number;
  }[] = [
    {
      key: "anvil_piece_curio",
      metal: 0x9aa2ac,
      metalDark: 0x5a626c,
      metalLite: 0xd8dee6,
      accent: 0xc4a86a,
    },
    {
      key: "anvil_piece_ocean",
      metal: 0x7a8a98,
      metalDark: 0x3a4a58,
      metalLite: 0xb8c8d8,
      accent: 0x5a9aaa,
    },
    {
      key: "anvil_piece_cave",
      metal: 0xa89078,
      metalDark: 0x5a4030,
      metalLite: 0xe0c8a8,
      accent: 0xc87848,
    },
  ];
  for (const shard of shardDefs) {
    g.clear();
    const S = 48;
    // Drop shadow
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(S / 2, S - 6, 28, 7);

    // Main irregular plate (broken anvil face)
    g.fillStyle(shard.metalDark);
    g.fillTriangle(8, 14, 38, 10, 42, 34);
    g.fillTriangle(6, 22, 28, 16, 18, 40);
    g.fillStyle(shard.metal);
    g.fillTriangle(10, 16, 36, 12, 38, 32);
    g.fillTriangle(9, 24, 26, 18, 20, 38);

    // Beveled edge highlight
    g.fillStyle(shard.metalLite, 0.75);
    g.fillTriangle(12, 17, 30, 14, 22, 20);
    g.fillStyle(shard.metalLite, 0.4);
    g.fillTriangle(28, 18, 36, 14, 34, 26);

    // Fracture cracks
    g.lineStyle(1.5, shard.metalDark, 0.9);
    g.lineBetween(16, 18, 24, 30);
    g.lineBetween(24, 22, 32, 28);
    g.lineBetween(14, 28, 22, 34);
    g.lineStyle(1, 0x1a1a22, 0.55);
    g.lineBetween(18, 20, 26, 31);
    g.lineBetween(26, 24, 33, 29);

    // Rivet / bolt heads
    g.fillStyle(shard.metalDark);
    g.fillCircle(15, 22, 2.4);
    g.fillCircle(30, 20, 2.2);
    g.fillCircle(22, 32, 2);
    g.fillStyle(shard.metalLite, 0.85);
    g.fillCircle(14.4, 21.4, 1);
    g.fillCircle(29.4, 19.4, 0.9);
    g.fillCircle(21.4, 31.4, 0.85);

    // Horn stub chip
    g.fillStyle(shard.metal);
    g.fillTriangle(6, 18, 12, 16, 10, 24);
    g.fillStyle(shard.metalLite, 0.5);
    g.fillTriangle(7, 18, 11, 17, 9, 21);

    // Ember / mineral accent flecks
    g.fillStyle(shard.accent, 0.7);
    g.fillCircle(26, 26, 1.4);
    g.fillCircle(19, 30, 1.1);
    g.fillCircle(33, 24, 1);
    g.fillStyle(0xffaa66, 0.35);
    g.fillCircle(26, 26, 2.4);

    // Outer rim scratch
    g.lineStyle(1, shard.metalLite, 0.35);
    g.strokeTriangle(11, 17, 35, 13, 37, 31);

    g.generateTexture(shard.key, S, S);
  }

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

  generateHatTextures(scene);

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

  // Backpack shop icon (not worn on the player)
  g.clear();
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(16, 28, 20, 5);
  g.fillStyle(0x5a4030);
  g.fillRoundedRect(6, 8, 20, 18, 3);
  g.fillStyle(0x8b5a2b);
  g.fillRect(6, 8, 20, 5);
  g.fillStyle(0xc4a86a);
  g.fillRect(14, 14, 4, 6);
  g.fillStyle(0x3a2a1a);
  g.fillCircle(16, 17, 2);
  g.generateTexture("backpack_icon", 32, 32);

  generateAmuletTextures(scene);

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
  generateAshencastTreeTextures(scene);
  generateAshencastHouseTextures(scene);
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
    this.load.image("clownfish", "images/clownfish.png");
    this.load.image("angelfish", "images/angelfish.png");
    this.load.image("pufferfish", "images/pufferfish.png");
    this.load.image("nurse_shark", "images/nurse_shark.png");
    this.load.image("surgeon_fish", "images/surgeon_fish.png");
    this.load.image("dolphin", "images/dolphin.png");
    this.load.image("chilled_clownfish", "images/chilled_clownfish.png");
    this.load.image("crystal_frog", "images/crystal_frog.png");
    this.load.image("crystalfin_tuna", "images/crystalfin_tuna.png");
    this.load.image("nautilus", "images/nautilus.png");
    this.load.image("serpent_eel", "images/serpent_eel.png");
    this.load.image("cave_whale", "images/cave_whale.png");
    this.load.image("ashencast_trout", "images/ashencast_trout.png");
    this.load.image("driftwood", "images/driftwood.png");
    this.load.image("ore_cluster", "images/ore_cluster.png");
    this.load.image("gold_nugget", "images/gold_nugget.png");
    this.load.image("emerald_gem", "images/emerald_gem.png");
    this.load.image("coal_ore", "images/coal_ore.png");
    this.load.image("ruby_gem", "images/ruby_gem.png");
    this.load.image("jade_shards", "images/jade_shards.png");
    this.load.image("green_crystal", "images/green_crystal.png");
    this.load.image("amethyst_teardrop", "images/amethyst_teardrop.png");
    this.load.image("pink_ore", "images/pink_ore.png");
    this.load.image("painite", "images/painite.png");
    this.load.image("volcanic_hermitcrab", "images/volcanic_hermitcrab.png");
    this.load.image("ash_flounder", "images/ash_flounder.png");
    this.load.image("molter", "images/molter.png");
    this.load.image("pyrefin", "images/pyrefin.png");
    this.load.image("magma_jellyfish", "images/magma_jellyfish.png");
    this.load.image("crystal_rod_skin", "images/crystal_rod_skin.png");
    this.load.image("bobber_red", "images/bobber_red.png");
    this.load.image("bobber_red_double", "images/bobber_red_double.png");
    this.load.image("bobber_yellow", "images/bobber_yellow.png");
    this.load.image("bobber_grey", "images/bobber_grey.png");
    this.load.image("bobber_inflated", "images/bobber_inflated.png");
    this.load.image("forge_sword", "images/forge_sword.png");
    this.load.image("forge_axe", "images/forge_axe.png");
    this.load.image("lure_green_fish", "images/lure_green_fish.png");
    this.load.image("lure_clover", "images/lure_clover.png");
    this.load.image("full_moon_icon", "images/full_moon_icon.png");
    // Free procedural ambient loops (~32s each)
    this.load.audio("music_island", "audio/music_island.wav");
    this.load.audio("music_ocean", "audio/music_ocean.wav");
    this.load.audio("music_jungle", "audio/music_jungle.wav");
    this.load.audio("music_reef", "audio/music_reef.wav");
    this.load.audio("music_collectors", "audio/music_collectors.wav");
    this.load.audio("music_ashencast", "audio/music_ashencast.wav");
    this.load.audio("music_frostpeak", "audio/music_frostpeak.wav");
    this.load.audio("music_frostpeak_cave", "audio/music_frostpeak_cave.wav");
    this.load.audio("sfx_ding", "audio/sfx_ding.wav");
    this.load.audio("sfx_ding_triple", "audio/sfx_ding_triple.wav");
  }

  create(): void {
    makeTextures(this);
    generateCraftStarlightFishIcon(this);
    generateRodSkinTextures(this);
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
