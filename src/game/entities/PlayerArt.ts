import Phaser from "phaser";
import { drawRecoilShotgun } from "../art/RecoilRodArt";
import { drawPortalRod } from "../art/PortalRodArt";
import { drawForgeRod } from "../art/ForgeRodArt";
import { drawBirthdayRod } from "../art/BirthdayRodArt";
import {
  drawGoldenLuckyRod,
  drawUniversalPortalRod,
  drawPufferfirmRod,
  drawPoisonedRod,
  drawPistolRod,
  drawLaserRod,
} from "../art/RodSkinHeldArt";

/** Logical playable area — displayed size stays ~64px via setDisplaySize on the sprite. */
export const PLAYER_FRAME_PAD_TOP = 12;
export const PLAYER_FRAME_PAD_RIGHT = 18;
export const PLAYER_FRAME_W = 64 + PLAYER_FRAME_PAD_RIGHT;
export const PLAYER_FRAME_H = 64 + PLAYER_FRAME_PAD_TOP;

/**
 * Top-center of the head hair strip in frame pixels (idle, lean 0, bob 0).
 * Matches drawPlayerFrame: ox=22, hx=ox-6, hair at hy-1.
 */
export const HEAD_TOP_LOCAL = { x: 23, y: 10 + PLAYER_FRAME_PAD_TOP };

/**
 * Rod tip pixel in the fishing-wait frames (top-left origin of the frame).
 * Used so the cast line attaches exactly to the drawn tip.
 */
export const ROD_TIP_LOCAL = { x: 58, y: 18 + PLAYER_FRAME_PAD_TOP };

/**
 * Tip positions for each `player_fish_*_N` frame (must match `fish` poses).
 * Windup swings the tip left/up behind the back, then whips forward.
 */
export const FISH_FRAME_TIPS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 50, y: 12 + PLAYER_FRAME_PAD_TOP },
  { x: 38, y: 2 + PLAYER_FRAME_PAD_TOP },
  { x: 22, y: 0 + PLAYER_FRAME_PAD_TOP },
  { x: 4, y: 8 + PLAYER_FRAME_PAD_TOP },
  { x: 34, y: 0 + PLAYER_FRAME_PAD_TOP },
  { x: 60, y: 14 + PLAYER_FRAME_PAD_TOP },
  { x: ROD_TIP_LOCAL.x, y: ROD_TIP_LOCAL.y },
  { x: ROD_TIP_LOCAL.x, y: ROD_TIP_LOCAL.y },
];

/** Cast-anim frame index when the bobber should leave the tip. */
export const CAST_RELEASE_FRAME = 5;

const FW = PLAYER_FRAME_W;
const FH = PLAYER_FRAME_H;

export type RodDrawStyle =
  | "starter"
  | "lucky"
  | "firm"
  | "amber"
  | "wildflower"
  | "zeus"
  | "coral"
  | "augment"
  | "tranquil"
  | "crystal"
  | "recoil"
  | "portal"
  | "forge"
  | "birthday"
  /** Same poses/tips as other rods, but no baked rod art (Gallery overlay only). */
  | "hidden"
  | "golden_lucky"
  | "universal_portal"
  | "pufferfirm"
  | "poisoned"
  | "pistol"
  | "laser";

/** Every rod that gets carry + cast player frames and anims — keep in sync with new rods. */
export const ROD_ANIM_STYLES: readonly RodDrawStyle[] = [
  "starter",
  "lucky",
  "firm",
  "amber",
  "wildflower",
  "zeus",
  "coral",
  "augment",
  "tranquil",
  "crystal",
  "recoil",
  "portal",
  "forge",
  "birthday",
  "hidden",
  "golden_lucky",
  "universal_portal",
  "pufferfirm",
  "poisoned",
  "pistol",
  "laser",
];

export function rodAnimStyleReady(scene: Phaser.Scene, style: RodDrawStyle): boolean {
  return scene.textures.exists(`player_fish_${style}_0`);
}

/** Regenerate rod player art if a style is missing (e.g. after hot reload). */
export function ensurePlayerRodArt(scene: Phaser.Scene): void {
  for (const style of ROD_ANIM_STYLES) {
    if (!rodAnimStyleReady(scene, style)) {
      generatePlayerArt(scene);
      return;
    }
  }
}

export function rodStyleFromItemId(itemId: string): RodDrawStyle {
  if (itemId === "lucky_rod") return "lucky";
  if (itemId === "firm_rod") return "firm";
  if (itemId === "amber_rod") return "amber";
  if (itemId === "wildflower_rod") return "wildflower";
  if (itemId === "zeus_rod") return "zeus";
  if (itemId === "coral_rod") return "coral";
  if (itemId === "augment_rod") return "augment";
  if (itemId === "tranquil_rod") return "tranquil";
  if (itemId === "crystal_rod") return "crystal";
  if (itemId === "recoil_rod") return "recoil";
  if (itemId === "portal_rod") return "portal";
  if (itemId === "forge_rod") return "forge";
  if (itemId === "birthday_rod") return "birthday";
  return "starter";
}

/** Resolve baked / overlay style for a rod + optional active skin id. */
export function rodStyleForSkin(
  rodItemId: string,
  skinId: string | null | undefined
): RodDrawStyle {
  switch (skinId) {
    case "golden_lucky":
      return "golden_lucky";
    case "universal_portal":
      return "universal_portal";
    case "pufferfirm":
      return "hidden";
    case "poisoned":
      return "poisoned";
    case "pistol":
      return "pistol";
    case "laser":
      return "laser";
    case "gallery":
      return "hidden";
    default:
      return rodStyleFromItemId(rodItemId);
  }
}

export type PlayerPose = {
  bob: number;
  legBack: number; // x offset of back leg
  legFront: number;
  legBackY: number;
  legFrontY: number;
  armX: number;
  armY: number;
  armLen: number;
  bodyLean: number;
  /** Show fishing rod */
  rod?: boolean;
  /** Cast forward vs resting on the shoulder while walking. */
  rodPose?: "cast" | "carry";
  rodStyle?: RodDrawStyle;
  /** Tip position in frame pixels (overrides defaults). */
  tipX?: number;
  tipY?: number;
  /** Draw rod behind the body (windup behind the back). */
  rodBehind?: boolean;
};

/** Higher-detail side-view cubic character frames + animations. */
export function generatePlayerArt(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  const idle: PlayerPose[] = [
    { bob: 0, legBack: 0, legFront: 0, legBackY: 0, legFrontY: 0, armX: 0, armY: 0, armLen: 0, bodyLean: 0 },
    { bob: 0, legBack: 0, legFront: 0, legBackY: 0, legFrontY: 0, armX: 0, armY: 0, armLen: 0, bodyLean: 0 },
    { bob: 1, legBack: 0, legFront: 0, legBackY: 0, legFrontY: 0, armX: 0, armY: 0, armLen: 0, bodyLean: 0 },
    { bob: 0, legBack: 0, legFront: 0, legBackY: 0, legFrontY: 0, armX: 0, armY: 0, armLen: 0, bodyLean: 0 },
  ];

  const walk: PlayerPose[] = [
    { bob: 0, legBack: -3, legFront: 3, legBackY: 0, legFrontY: -1, armX: 2, armY: 0, armLen: 1, bodyLean: 0 },
    { bob: 0, legBack: -1, legFront: 1, legBackY: -1, legFrontY: 0, armX: 1, armY: 0, armLen: 0, bodyLean: 0 },
    { bob: 0, legBack: 3, legFront: -3, legBackY: -1, legFrontY: 0, armX: -1, armY: 0, armLen: 1, bodyLean: 0 },
    { bob: 0, legBack: 4, legFront: -4, legBackY: 0, legFrontY: -1, armX: -2, armY: 0, armLen: 1, bodyLean: 1 },
    { bob: 0, legBack: 1, legFront: -1, legBackY: -1, legFrontY: 0, armX: -1, armY: 0, armLen: 0, bodyLean: 0 },
    { bob: 0, legBack: -3, legFront: 3, legBackY: -1, legFrontY: 0, armX: 1, armY: 0, armLen: 1, bodyLean: 0 },
  ];

  const jump: PlayerPose[] = [
    { bob: -1, legBack: -2, legFront: 1, legBackY: 1, legFrontY: 2, armX: 1, armY: -2, armLen: 2, bodyLean: 0 },
    { bob: -2, legBack: -2, legFront: 2, legBackY: 2, legFrontY: 3, armX: 2, armY: -3, armLen: 2, bodyLean: 0 },
    { bob: -1, legBack: -1, legFront: 1, legBackY: 1, legFrontY: 1, armX: 1, armY: -1, armLen: 1, bodyLean: 0 },
  ];

  const fish: PlayerPose[] = [
    // 0 ready — tip still ahead, starting the lift
    {
      bob: 0,
      legBack: -1,
      legFront: 1,
      legBackY: 0,
      legFrontY: 0,
      armX: 2,
      armY: -2,
      armLen: 1,
      bodyLean: 0,
      rod: true,
      tipX: FISH_FRAME_TIPS[0].x,
      tipY: FISH_FRAME_TIPS[0].y,
    },
    // 1 lift — tip rising
    {
      bob: 0,
      legBack: -1,
      legFront: 1,
      legBackY: 0,
      legFrontY: 0,
      armX: -1,
      armY: -3,
      armLen: 1,
      bodyLean: -1,
      rod: true,
      tipX: FISH_FRAME_TIPS[1].x,
      tipY: FISH_FRAME_TIPS[1].y,
    },
    // 2 over the shoulder — tipping back
    {
      bob: 0,
      legBack: -2,
      legFront: 2,
      legBackY: 0,
      legFrontY: 0,
      armX: -4,
      armY: -4,
      armLen: 2,
      bodyLean: -1,
      rod: true,
      rodBehind: true,
      tipX: FISH_FRAME_TIPS[2].x,
      tipY: FISH_FRAME_TIPS[2].y,
    },
    // 3 peak — rod fully behind the back
    {
      bob: 0,
      legBack: -2,
      legFront: 3,
      legBackY: 0,
      legFrontY: 0,
      armX: -7,
      armY: -2,
      armLen: 2,
      bodyLean: -2,
      rod: true,
      rodBehind: true,
      tipX: FISH_FRAME_TIPS[3].x,
      tipY: FISH_FRAME_TIPS[3].y,
    },
    // 4 mid-swing — coming over the top
    {
      bob: 0,
      legBack: -2,
      legFront: 2,
      legBackY: 0,
      legFrontY: 0,
      armX: 0,
      armY: -5,
      armLen: 2,
      bodyLean: 0,
      rod: true,
      tipX: FISH_FRAME_TIPS[4].x,
      tipY: FISH_FRAME_TIPS[4].y,
    },
    // 5 snap forward — bobber releases
    {
      bob: 0,
      legBack: -2,
      legFront: 2,
      legBackY: 0,
      legFrontY: 0,
      armX: 6,
      armY: -4,
      armLen: 2,
      bodyLean: 2,
      rod: true,
      tipX: FISH_FRAME_TIPS[5].x,
      tipY: FISH_FRAME_TIPS[5].y,
    },
    // 6–7 hold / waiting
    {
      bob: 0,
      legBack: -1,
      legFront: 1,
      legBackY: 0,
      legFrontY: 0,
      armX: 3,
      armY: -3,
      armLen: 2,
      bodyLean: 0,
      rod: true,
      tipX: FISH_FRAME_TIPS[6].x,
      tipY: FISH_FRAME_TIPS[6].y,
    },
    {
      bob: 0,
      legBack: -1,
      legFront: 1,
      legBackY: 0,
      legFrontY: 0,
      armX: 3,
      armY: -2,
      armLen: 2,
      bodyLean: 0,
      rod: true,
      tipX: FISH_FRAME_TIPS[7].x,
      tipY: FISH_FRAME_TIPS[7].y,
    },
  ];

  idle.forEach((pose, i) => {
    g.clear();
    drawPlayerFrame(g, pose);
    g.generateTexture(`player_idle_${i}`, FW, FH);
  });
  walk.forEach((pose, i) => {
    g.clear();
    drawPlayerFrame(g, pose);
    g.generateTexture(`player_walk_${i}`, FW, FH);
  });
  jump.forEach((pose, i) => {
    g.clear();
    drawPlayerFrame(g, pose);
    g.generateTexture(`player_jump_${i}`, FW, FH);
  });

  // Idle / walk / jump with rod resting over the shoulder (hotbar selected)
  const rodStyles: RodDrawStyle[] = [...ROD_ANIM_STYLES];
  const withCarry = (pose: PlayerPose): PlayerPose => ({
    ...pose,
    rod: true,
    rodPose: "carry",
    // Grip a bit higher; tip arcs back over the shoulder
    armX: pose.armX + 1,
    armY: pose.armY - 2,
    armLen: Math.max(pose.armLen, 1),
  });
  for (const style of rodStyles) {
    idle.forEach((pose, i) => {
      g.clear();
      drawPlayerFrame(g, { ...withCarry(pose), rodStyle: style });
      g.generateTexture(`player_idle_rod_${style}_${i}`, FW, FH);
    });
    walk.forEach((pose, i) => {
      g.clear();
      drawPlayerFrame(g, { ...withCarry(pose), rodStyle: style });
      g.generateTexture(`player_walk_rod_${style}_${i}`, FW, FH);
    });
    jump.forEach((pose, i) => {
      g.clear();
      drawPlayerFrame(g, { ...withCarry(pose), rodStyle: style });
      g.generateTexture(`player_jump_rod_${style}_${i}`, FW, FH);
    });
  }

  for (const style of rodStyles) {
    fish.forEach((pose, i) => {
      g.clear();
      drawPlayerFrame(g, { ...pose, rodStyle: style, rodPose: "cast" });
      g.generateTexture(`player_fish_${style}_${i}`, FW, FH);
    });
  }
  // Legacy keys → starter (safety for any leftover refs)
  fish.forEach((pose, i) => {
    g.clear();
    drawPlayerFrame(g, { ...pose, rodStyle: "starter", rodPose: "cast" });
    g.generateTexture(`player_fish_${i}`, FW, FH);
  });

  // Sitting in boat
  const sit: PlayerPose = {
    bob: 4,
    legBack: -2,
    legFront: 2,
    legBackY: 6,
    legFrontY: 6,
    armX: 2,
    armY: 2,
    armLen: 0,
    bodyLean: 0,
  };
  g.clear();
  drawPlayerFrame(g, sit);
  g.generateTexture("player_sit_0", FW, FH);
  for (const style of rodStyles) {
    g.clear();
    drawPlayerFrame(g, {
      ...sit,
      rod: true,
      rodPose: "carry",
      rodStyle: style,
      armY: 0,
      armLen: 1,
    });
    g.generateTexture(`player_sit_rod_${style}`, FW, FH);
  }

  // Rowing strokes (seated + arm pull)
  const row: PlayerPose[] = [
    { bob: 4, legBack: -2, legFront: 2, legBackY: 6, legFrontY: 6, armX: -3, armY: 0, armLen: 1, bodyLean: -1 },
    { bob: 4, legBack: -2, legFront: 2, legBackY: 6, legFrontY: 6, armX: 0, armY: -1, armLen: 1, bodyLean: 0 },
    { bob: 4, legBack: -2, legFront: 2, legBackY: 6, legFrontY: 6, armX: 4, armY: -2, armLen: 2, bodyLean: 1 },
    { bob: 4, legBack: -2, legFront: 2, legBackY: 6, legFrontY: 6, armX: 1, armY: 0, armLen: 1, bodyLean: 0 },
  ];
  row.forEach((pose, i) => {
    g.clear();
    drawPlayerFrame(g, pose);
    g.generateTexture(`player_row_${i}`, FW, FH);
  });

  // Default single-frame fallback
  g.clear();
  drawPlayerFrame(g, idle[0]);
  g.generateTexture("player", FW, FH);
  g.destroy();

  createPlayerAnimations(scene);
}

function drawPlayerFrame(g: Phaser.GameObjects.Graphics, pose: PlayerPose): void {
  // Keep the body on the left so the rod has room on the right; pad top/right in canvas.
  const ox = 22 + pose.bodyLean;
  const oy = 8 + pose.bob + PLAYER_FRAME_PAD_TOP;

  // Soft contact shadow
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(ox, 60 + PLAYER_FRAME_PAD_TOP, 18, 5);

  const carrying = pose.rod && pose.rodPose === "carry";
  const tipX = pose.tipX ?? ROD_TIP_LOCAL.x;
  const tipY = pose.tipY ?? ROD_TIP_LOCAL.y;

  // Early arm estimate so a behind-back rod can be drawn under the body
  const ax = ox + 5 + pose.armX;
  const ay = oy + 20 + pose.armY;
  const handX = ax + 3;
  const handY = ay + 13;

  if (pose.rod && pose.rodBehind && !carrying) {
    drawHeldRod(g, handX, handY, tipX, tipY, pose.rodStyle ?? "starter");
  }

  // Legs — flat blocks
  g.fillStyle(0x3a3f4a);
  g.fillRect(ox - 7 + pose.legBack, oy + 34 + pose.legBackY, 7, 17);
  g.fillStyle(0x2a2e36);
  g.fillRect(ox - 7 + pose.legBack, oy + 49 + pose.legBackY, 9, 3);

  g.fillStyle(0x4a505c);
  g.fillRect(ox + 1 + pose.legFront, oy + 34 + pose.legFrontY, 7, 17);
  g.fillStyle(0x2a2e36);
  g.fillRect(ox + 1 + pose.legFront, oy + 49 + pose.legFrontY, 9, 3);

  // Torso — muted slate
  g.fillStyle(0x4b5563);
  g.fillRect(ox - 8, oy + 18, 16, 17);
  g.fillStyle(0x3f4654);
  g.fillRect(ox - 8, oy + 18, 4, 17);

  // Arm
  g.fillStyle(0x4b5563);
  g.fillRect(ax, ay, 6, 4);
  g.fillStyle(0xc4a484);
  g.fillRect(ax, ay + 4, 6, 10 + pose.armLen * 0.25);
  g.fillRect(ax, ay + 12 + pose.armLen * 0.25, 5, 4);

  // Cast rod in front of torso when not tucked behind the back
  if (pose.rod && !carrying && !pose.rodBehind) {
    drawHeldRod(g, handX, handY, tipX, tipY, pose.rodStyle ?? "starter");
  }

  // Head — plain cube
  const hx = ox - 6;
  const hy = oy + 3;
  g.fillStyle(0xb8956e);
  g.fillRect(ox - 2, oy + 15, 5, 3);
  g.fillStyle(0xc4a484);
  g.fillRect(hx, hy, 14, 13);
  g.fillStyle(0xb8956e);
  g.fillRect(hx, hy, 3, 13);
  g.fillStyle(0x2c2c2c);
  g.fillRect(hx, hy - 1, 14, 4);
  g.fillStyle(0x1a1a1a);
  g.fillRect(hx + 9, hy + 6, 2, 2);

  // Shoulder-carry rod in front of the body / neck
  if (carrying) {
    const carryTipX = pose.tipX ?? ox - 4;
    const carryTipY = pose.tipY ?? oy - 6;
    drawHeldRod(
      g,
      handX,
      handY,
      carryTipX,
      carryTipY,
      pose.rodStyle ?? "starter"
    );
  }
}

function drawHeldRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number,
  style: RodDrawStyle
): void {
  if (style === "hidden") return;

  if (style === "firm") {
    g.lineStyle(6, 0x1a1a22, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0x3a3a48, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1, 0x6a6a78, 0.75);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    // rubber grip
    g.fillStyle(0x2c2c2c);
    g.fillRect(handX - 3, handY - 2, 9, 9);
    g.fillStyle(0x3a3a3a);
    g.fillRect(handX - 2, handY, 7, 1);
    g.fillRect(handX - 2, handY + 3, 7, 1);
    // metal reel
    g.fillStyle(0x8a9098);
    g.fillCircle(handX + 1, handY + 6, 4);
    g.fillStyle(0xc0c8d0);
    g.fillCircle(handX + 1, handY + 6, 2);
    // steel tip
    g.lineStyle(2, 0xc0c8d0);
    g.strokeCircle(tipX, tipY, 3.5);
    g.fillStyle(0xe8eef2);
    g.fillCircle(tipX, tipY, 1.5);
    return;
  }

  if (style === "lucky") {
    g.lineStyle(5, 0x5c3a21, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0x7a5230, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    // gold wraps along shaft
    g.lineStyle(2, 0xd4af37, 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineBetween(handX + 4, handY - 3, handX + 8, handY - 6);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.lineStyle(2, 0x3d8b4f, 1);
    g.lineBetween(mx + 3, my - 3, mx + 7, my - 6);
    // cork + gold butt
    g.fillStyle(0xc4a574);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0xd4af37);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0xb8962e);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xd4af37);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    // gold eyelet
    g.lineStyle(2, 0xd4af37);
    g.strokeCircle(tipX, tipY, 3);
    g.fillStyle(0xffe066);
    g.fillCircle(tipX, tipY, 1.2);
    // clover just past the tip
    const cx = tipX + 5;
    const cy = tipY - 4;
    g.fillStyle(0x2d8a3e);
    g.fillCircle(cx - 2.2, cy, 2.4);
    g.fillCircle(cx + 2.2, cy, 2.4);
    g.fillCircle(cx, cy - 2.2, 2.4);
    g.fillCircle(cx, cy + 2.2, 2.4);
    g.fillStyle(0x1a5c28);
    g.fillCircle(cx, cy, 1.1);
    return;
  }

  if (style === "amber") {
    g.lineStyle(5, 0xc9a227, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0xe8c547, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1.5, 0xffe066, 0.7);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineStyle(2, 0xf0a020, 1);
    g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.lineStyle(2, 0xffd54a, 1);
    g.lineBetween(mx + 2, my - 2, mx + 6, my - 5);
    g.fillStyle(0xc4a574);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0xe8a020);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0xd4af37);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xffe066);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    g.lineStyle(2, 0xffe066);
    g.strokeCircle(tipX, tipY, 2.8);
    g.fillStyle(0xffb020);
    g.fillCircle(tipX + 4, tipY - 3, 2.6);
    g.fillStyle(0xffe066);
    g.fillCircle(tipX + 3.5, tipY - 3.5, 1.1);
    return;
  }

  if (style === "wildflower") {
    g.lineStyle(5, 0xc45a12, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0xe87830, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1.5, 0xffa060, 0.7);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineStyle(2, 0xf472b6, 1);
    g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.lineStyle(2, 0xfb7185, 1);
    g.lineBetween(mx + 2, my - 2, mx + 6, my - 5);
    g.fillStyle(0xc4a574);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0xf472b6);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0xe87830);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xffb4d4);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    g.lineStyle(2, 0xf9a8d4);
    g.strokeCircle(tipX, tipY, 2.8);
    // blossom at tip
    const fx = tipX + 4;
    const fy = tipY - 3;
    g.fillStyle(0xf472b6);
    g.fillCircle(fx - 2.2, fy, 2.2);
    g.fillCircle(fx + 2.2, fy, 2.2);
    g.fillCircle(fx, fy - 2.2, 2.2);
    g.fillCircle(fx, fy + 2.2, 2.2);
    g.fillStyle(0xffe066);
    g.fillCircle(fx, fy, 1.6);
    return;
  }

  if (style === "zeus") {
    g.lineStyle(5, 0x2a5080, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0x4da6ff, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1.5, 0xa8d4ff, 0.75);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineStyle(2, 0xffe066, 1);
    g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.fillStyle(0xc4a574);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0xffe066);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0x4da6ff);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xffe066);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    g.lineStyle(2, 0xffe066);
    g.strokeCircle(tipX, tipY, 2.8);
    g.lineStyle(2, 0xffe066);
    g.lineBetween(tipX + 2, tipY - 6, tipX + 5, tipY - 1);
    g.lineBetween(tipX + 5, tipY - 1, tipX + 3, tipY - 1);
    g.lineBetween(tipX + 3, tipY - 1, tipX + 7, tipY + 4);
    return;
  }

  if (style === "tranquil") {
    g.lineStyle(5, 0x2d5f8e, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0x63b4d9, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1.5, 0xd7f4ff, 0.78);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineStyle(2, 0xa8c9d8, 1);
    g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.fillStyle(0xc4a574);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0x5ea7d4);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0x9dd8f0);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xeaffff);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    g.lineStyle(2, 0xe7fbff);
    g.strokeCircle(tipX, tipY, 2.8);
    g.fillStyle(0x8fe9ff, 0.95);
    g.fillCircle(tipX + 4, tipY - 3, 3.2);
    g.lineStyle(1.2, 0xf7ffff, 0.95);
    g.strokeCircle(tipX + 4, tipY - 3, 3.2);
    g.fillStyle(0xffffff);
    g.fillCircle(tipX + 2.8, tipY - 4.2, 1);
    return;
  }

  if (style === "coral") {
    g.lineStyle(5, 0x2a6b6b, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0x5ec4b8, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1.5, 0xff9ec8, 0.8);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineStyle(2, 0xff8fb8, 1);
    g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.fillStyle(0xc4a574);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0xff8fb8);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0x5ec4b8);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xffb6d9);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    g.lineStyle(2, 0xffb6d9);
    g.strokeCircle(tipX, tipY, 2.8);
    g.fillStyle(0xff6b9d);
    g.fillCircle(tipX + 4, tipY - 3, 2.4);
    g.fillStyle(0x5ec4b8);
    g.fillCircle(tipX + 6, tipY - 1, 1.8);
    return;
  }

  if (style === "augment") {
    g.lineStyle(5, 0x4a5058, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0x8a929c, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1.5, 0xc0c8d0, 0.75);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineStyle(2, 0x6a727c, 1);
    g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.fillStyle(0x3a3e44);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0x6a7078);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0x9aa2aa);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xd0d8e0);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    g.lineStyle(2, 0xb8c0c8);
    g.strokeCircle(tipX, tipY, 2.8);
    // cool grey star at tip
    const sx = tipX + 4;
    const sy = tipY - 3;
    g.fillStyle(0xa8b0b8);
    g.fillCircle(sx, sy, 4);
    g.fillStyle(0xd8e0e8);
    g.fillTriangle(sx, sy - 5, sx + 1.8, sy - 0.5, sx - 1.8, sy - 0.5);
    g.fillTriangle(sx, sy + 5, sx + 1.8, sy + 0.5, sx - 1.8, sy + 0.5);
    g.fillTriangle(sx - 5, sy, sx - 0.5, sy - 1.8, sx - 0.5, sy + 1.8);
    g.fillTriangle(sx + 5, sy, sx + 0.5, sy - 1.8, sx + 0.5, sy + 1.8);
    g.fillStyle(0xf0f4f8);
    g.fillCircle(sx, sy, 1.4);
    return;
  }

  if (style === "recoil") {
    drawRecoilShotgun(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "portal") {
    drawPortalRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "forge") {
    drawForgeRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "birthday") {
    drawBirthdayRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "crystal") {
    g.lineStyle(5, 0x3a6078, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(3, 0x7ec8e8, 1);
    g.lineBetween(handX, handY, tipX, tipY);
    g.lineStyle(1.5, 0xd0f0ff, 0.8);
    g.lineBetween(handX, handY - 1, tipX, tipY - 1);
    const mx = (handX + tipX) / 2;
    const my = (handY + tipY) / 2;
    g.lineStyle(2, 0xff88cc, 1);
    g.lineBetween(handX + 3, handY - 3, handX + 7, handY - 6);
    g.lineStyle(2, 0x88ffaa, 1);
    g.lineBetween(mx - 2, my + 1, mx + 2, my - 2);
    g.lineStyle(2, 0x88aaff, 1);
    g.lineBetween(mx + 3, my - 3, mx + 7, my - 6);
    g.fillStyle(0xc4a574);
    g.fillRect(handX - 3, handY - 2, 8, 8);
    g.fillStyle(0x7ec8e8);
    g.fillRect(handX - 3, handY + 5, 8, 3);
    g.fillStyle(0xa0d8f0);
    g.fillCircle(handX + 1, handY + 6, 3.5);
    g.fillStyle(0xe0f8ff);
    g.fillCircle(handX + 1, handY + 6, 1.5);
    g.lineStyle(2, 0xe0f8ff);
    g.strokeCircle(tipX, tipY, 2.8);
    g.fillStyle(0xff6688);
    g.fillTriangle(tipX + 4, tipY - 7, tipX + 1, tipY - 1, tipX + 7, tipY - 1);
    g.fillStyle(0xffe0ee);
    g.fillCircle(tipX + 4, tipY - 4, 1.2);
    return;
  }

  if (style === "golden_lucky") {
    drawGoldenLuckyRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "universal_portal") {
    drawUniversalPortalRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "pufferfirm") {
    drawPufferfirmRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "poisoned") {
    drawPoisonedRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "pistol") {
    drawPistolRod(g, handX, handY, tipX, tipY);
    return;
  }

  if (style === "laser") {
    drawLaserRod(g, handX, handY, tipX, tipY);
    return;
  }

  // starter — wood blank
  g.lineStyle(5, 0x3e2a1a, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(3, 0x6b4423, 1);
  g.lineBetween(handX, handY, tipX, tipY);
  g.lineStyle(1.5, 0x8b6914, 0.7);
  g.lineBetween(handX, handY - 1, tipX, tipY - 1);
  g.fillStyle(0x2c2118);
  g.fillRect(handX - 3, handY - 2, 8, 8);
  g.fillStyle(0x4a3728);
  g.fillRect(handX - 2, handY - 1, 6, 6);
  g.fillStyle(0x3a3a3a);
  g.fillCircle(handX + 1, handY + 5, 4);
  g.fillStyle(0x666666);
  g.fillCircle(handX + 1, handY + 5, 2);
  g.fillStyle(0x222222);
  g.fillCircle(tipX, tipY, 3);
  g.fillStyle(0xcccccc);
  g.fillCircle(tipX, tipY, 1.5);
}

function createPlayerAnimations(scene: Phaser.Scene): void {
  const anims = scene.anims;

  if (!anims.exists("player-idle")) {
    anims.create({
      key: "player-idle",
      frames: [0, 1, 2, 3].map((i) => ({ key: `player_idle_${i}` })),
      frameRate: 3,
      repeat: -1,
    });
  }

  if (!anims.exists("player-walk")) {
    anims.create({
      key: "player-walk",
      frames: [0, 1, 2, 3, 4, 5].map((i) => ({ key: `player_walk_${i}` })),
      frameRate: 9,
      repeat: -1,
    });
  }

  if (!anims.exists("player-jump")) {
    anims.create({
      key: "player-jump",
      frames: [0, 1, 2].map((i) => ({ key: `player_jump_${i}` })),
      frameRate: 8,
      repeat: 0,
    });
  }

  const rodStyles: RodDrawStyle[] = [...ROD_ANIM_STYLES];
  for (const style of rodStyles) {
    const idleKey = `player-idle-rod-${style}`;
    const walkKey = `player-walk-rod-${style}`;
    const jumpKey = `player-jump-rod-${style}`;
    if (!anims.exists(idleKey)) {
      anims.create({
        key: idleKey,
        frames: [0, 1, 2, 3].map((i) => ({
          key: `player_idle_rod_${style}_${i}`,
        })),
        frameRate: 3,
        repeat: -1,
      });
    }
    if (!anims.exists(walkKey)) {
      anims.create({
        key: walkKey,
        frames: [0, 1, 2, 3, 4, 5].map((i) => ({
          key: `player_walk_rod_${style}_${i}`,
        })),
        frameRate: 9,
        repeat: -1,
      });
    }
    if (!anims.exists(jumpKey)) {
      anims.create({
        key: jumpKey,
        frames: [0, 1, 2].map((i) => ({
          key: `player_jump_rod_${style}_${i}`,
        })),
        frameRate: 8,
        repeat: 0,
      });
    }
  }

  for (const style of rodStyles) {
    const castKey = `player-fish-cast-${style}`;
    const waitKey = `player-fish-wait-${style}`;
    if (anims.exists(castKey)) anims.remove(castKey);
    if (anims.exists(waitKey)) anims.remove(waitKey);
    anims.create({
      key: castKey,
      frames: [
        { key: `player_fish_${style}_0`, duration: 110 },
        { key: `player_fish_${style}_1`, duration: 130 },
        { key: `player_fish_${style}_2`, duration: 150 },
        { key: `player_fish_${style}_3`, duration: 320 }, // hold behind the back
        { key: `player_fish_${style}_4`, duration: 90 },
        { key: `player_fish_${style}_5`, duration: 160 }, // release
      ],
      repeat: 0,
    });
    anims.create({
      key: waitKey,
      frames: [
        { key: `player_fish_${style}_6` },
        { key: `player_fish_${style}_7` },
      ],
      frameRate: 3,
      repeat: -1,
    });
  }

  // Legacy aliases → starter
  if (anims.exists("player-fish-cast")) anims.remove("player-fish-cast");
  if (anims.exists("player-fish-wait")) anims.remove("player-fish-wait");
  anims.create({
    key: "player-fish-cast",
    frames: [
      { key: "player_fish_starter_0", duration: 110 },
      { key: "player_fish_starter_1", duration: 130 },
      { key: "player_fish_starter_2", duration: 150 },
      { key: "player_fish_starter_3", duration: 320 },
      { key: "player_fish_starter_4", duration: 90 },
      { key: "player_fish_starter_5", duration: 160 },
    ],
    repeat: 0,
  });
  anims.create({
    key: "player-fish-wait",
    frames: [
      { key: "player_fish_starter_6" },
      { key: "player_fish_starter_7" },
    ],
    frameRate: 3,
    repeat: -1,
  });

  if (!anims.exists("player-row")) {
    anims.create({
      key: "player-row",
      frames: [0, 1, 2, 3].map((i) => ({ key: `player_row_${i}` })),
      frameRate: 8,
      repeat: -1,
    });
  }
}
