import Phaser from "phaser";

export const PLAYER_FRAME_W = 64;
export const PLAYER_FRAME_H = 64;

/**
 * Rod tip pixel in the fishing-wait frames (top-left origin of the frame).
 * Used so the cast line attaches exactly to the drawn tip.
 */
export const ROD_TIP_LOCAL = { x: 58, y: 18 };

const FW = PLAYER_FRAME_W;
const FH = PLAYER_FRAME_H;

export type RodDrawStyle =
  | "starter"
  | "lucky"
  | "firm"
  | "amber"
  | "wildflower"
  | "zeus"
  | "coral";

export function rodStyleFromItemId(itemId: string): RodDrawStyle {
  if (itemId === "lucky_rod") return "lucky";
  if (itemId === "firm_rod") return "firm";
  if (itemId === "amber_rod") return "amber";
  if (itemId === "wildflower_rod") return "wildflower";
  if (itemId === "zeus_rod") return "zeus";
  if (itemId === "coral_rod") return "coral";
  return "starter";
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
    // windup — tip pulled back
    {
      bob: 0,
      legBack: -1,
      legFront: 1,
      legBackY: 0,
      legFrontY: 0,
      armX: -2,
      armY: -1,
      armLen: 1,
      bodyLean: -1,
      rod: true,
      tipX: 40,
      tipY: 10,
    },
    // cast forward — tip out
    {
      bob: 0,
      legBack: -2,
      legFront: 2,
      legBackY: 0,
      legFrontY: 0,
      armX: 4,
      armY: -4,
      armLen: 2,
      bodyLean: 1,
      rod: true,
      tipX: 60,
      tipY: 14,
    },
    // hold / waiting — tip matches ROD_TIP_LOCAL
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
      tipX: ROD_TIP_LOCAL.x,
      tipY: ROD_TIP_LOCAL.y,
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
      tipX: ROD_TIP_LOCAL.x,
      tipY: ROD_TIP_LOCAL.y,
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
  const rodStyles: RodDrawStyle[] = [
    "starter",
    "lucky",
    "firm",
    "amber",
    "wildflower",
    "zeus",
    "coral",
  ];
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
  // Keep the body on the left so the rod has room on the right
  const ox = 22 + pose.bodyLean;
  const oy = 8 + pose.bob;

  // Soft contact shadow
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(ox, 60, 18, 5);

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
  const ax = ox + 5 + pose.armX;
  const ay = oy + 20 + pose.armY;
  g.fillStyle(0x4b5563);
  g.fillRect(ax, ay, 6, 4);
  g.fillStyle(0xc4a484);
  g.fillRect(ax, ay + 4, 6, 10 + pose.armLen * 0.25);
  g.fillRect(ax, ay + 12 + pose.armLen * 0.25, 5, 4);

  const handX = ax + 3;
  const handY = ay + 13;
  const carrying = pose.rod && pose.rodPose === "carry";

  // Cast rod sits behind the head; carry rod is drawn after (foreground)
  if (pose.rod && !carrying) {
    drawHeldRod(
      g,
      handX,
      handY,
      pose.tipX ?? ROD_TIP_LOCAL.x,
      pose.tipY ?? ROD_TIP_LOCAL.y,
      pose.rodStyle ?? "starter"
    );
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
    const tipX = pose.tipX ?? ox - 4;
    const tipY = pose.tipY ?? oy - 6;
    drawHeldRod(g, handX, handY, tipX, tipY, pose.rodStyle ?? "starter");
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

  const rodStyles: RodDrawStyle[] = [
    "starter",
    "lucky",
    "firm",
    "amber",
    "wildflower",
    "zeus",
    "coral",
  ];
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
    if (!anims.exists(castKey)) {
      anims.create({
        key: castKey,
        frames: [
          { key: `player_fish_${style}_0` },
          { key: `player_fish_${style}_1` },
        ],
        frameRate: 8,
        repeat: 0,
      });
    }
    if (!anims.exists(waitKey)) {
      anims.create({
        key: waitKey,
        frames: [
          { key: `player_fish_${style}_2` },
          { key: `player_fish_${style}_3` },
        ],
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  // Legacy aliases → starter
  if (!anims.exists("player-fish-cast")) {
    anims.create({
      key: "player-fish-cast",
      frames: [
        { key: "player_fish_starter_0" },
        { key: "player_fish_starter_1" },
      ],
      frameRate: 8,
      repeat: 0,
    });
  }
  if (!anims.exists("player-fish-wait")) {
    anims.create({
      key: "player-fish-wait",
      frames: [
        { key: "player_fish_starter_2" },
        { key: "player_fish_starter_3" },
      ],
      frameRate: 3,
      repeat: -1,
    });
  }

  if (!anims.exists("player-row")) {
    anims.create({
      key: "player-row",
      frames: [0, 1, 2, 3].map((i) => ({ key: `player_row_${i}` })),
      frameRate: 8,
      repeat: -1,
    });
  }
}
