import Phaser from "phaser";
import {
  playStarweaverBulletSfx,
  playStarweaverImpactSfx,
} from "../audio/StarweaverSfx";

export type StarweaverFxTheme = "default" | "ice";

export type StarweaverLockOn = {
  update: (x: number, y: number, dt: number) => void;
  destroy: () => void;
};

/**
 * 5 staggered star-bullets that arc toward the fish (Bezier curves).
 * Coordinates are screen-space (scrollFactor 0).
 * `onAllHit` fires once every bullet has landed.
 */
export function playStarweaverWeaveFx(
  scene: Phaser.Scene,
  fromX: number,
  fromY: number,
  getTarget: () => { x: number; y: number },
  options?: {
    depth?: number;
    onAllHit?: () => void;
    theme?: StarweaverFxTheme;
  }
): void {
  const depth = options?.depth ?? 220;
  const theme = options?.theme ?? "default";
  const ice = theme === "ice";
  const bulletCount = 5;
  let hits = 0;
  const noteHit = () => {
    hits += 1;
    if (hits >= bulletCount) {
      options?.onAllHit?.();
    }
  };

  const flash = scene.add
    .rectangle(fromX, fromY, 52, 14, ice ? 0xa8e8ff : 0x6a9cff, 0.9)
    .setDepth(depth)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 1.9,
    scaleY: 0.35,
    duration: 340,
    ease: "Quad.easeOut",
    onComplete: () => flash.destroy(),
  });

  for (let i = 0; i < bulletCount; i++) {
    const delay = 55 + i * 95 + Phaser.Math.Between(0, 25);
    const side = i % 2 === 0 ? 1 : -1;
    const arc = 48 + i * 10 + Phaser.Math.Between(0, 18);
    scene.time.delayedCall(delay, () => {
      playStarweaverBulletSfx(scene, i);
      if (ice) {
        fireIceSpike(
          scene,
          fromX,
          fromY,
          getTarget,
          side,
          arc,
          depth,
          i,
          noteHit
        );
      } else {
        fireCurvedBullet(
          scene,
          fromX,
          fromY,
          getTarget,
          side,
          arc,
          depth,
          i,
          noteHit
        );
      }
    });
  }
}

function fireCurvedBullet(
  scene: Phaser.Scene,
  fromX: number,
  fromY: number,
  getTarget: () => { x: number; y: number },
  side: number,
  arcStrength: number,
  depth: number,
  index: number,
  onHit?: () => void
): void {
  const start = getTarget();
  const dx0 = start.x - fromX;
  const dy0 = start.y - fromY;
  const len0 = Math.hypot(dx0, dy0) || 1;
  const nx = (-dy0 / len0) * side * arcStrength;
  const ny = (dx0 / len0) * side * arcStrength;

  const gfx = scene.add
    .graphics()
    .setDepth(depth + 2)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);

  const orb = scene.add
    .circle(fromX, fromY, 4.5, 0xffffff, 1)
    .setDepth(depth + 3)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  const halo = scene.add
    .circle(fromX, fromY, 9, 0x4a88ff, 0.55)
    .setDepth(depth + 2)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);

  const trail: Array<{ x: number; y: number }> = [];
  const state = { t: 0 };
  const duration = 320 + index * 18;

  scene.tweens.add({
    targets: state,
    t: 1,
    duration,
    ease: "Cubic.easeIn",
    onUpdate: () => {
      const tgt = getTarget();
      const cx = (fromX + tgt.x) / 2 + nx * (1 - state.t * 0.35);
      const cy = (fromY + tgt.y) / 2 + ny * (1 - state.t * 0.35) - 18;
      const u = state.t;
      const x =
        (1 - u) * (1 - u) * fromX + 2 * (1 - u) * u * cx + u * u * tgt.x;
      const y =
        (1 - u) * (1 - u) * fromY + 2 * (1 - u) * u * cy + u * u * tgt.y;

      orb.setPosition(x, y);
      halo.setPosition(x, y);
      halo.setScale(0.85 + Math.sin(u * Math.PI) * 0.35);

      trail.push({ x, y });
      if (trail.length > 10) trail.shift();

      gfx.clear();
      for (let i = 1; i < trail.length; i++) {
        const a = i / trail.length;
        const p0 = trail[i - 1]!;
        const p1 = trail[i]!;
        gfx.lineStyle(2.4 * a + 0.6, 0xa8c8ff, a * 0.85);
        gfx.lineBetween(p0.x, p0.y, p1.x, p1.y);
      }
      gfx.fillStyle(0xffffff, 0.95);
      gfx.fillCircle(x, y, 2.2);
    },
    onComplete: () => {
      const hit = getTarget();
      playStarweaverImpactSfx(scene, index);
      playBulletImpact(scene, hit.x, hit.y, depth);
      gfx.destroy();
      orb.destroy();
      halo.destroy();
      onHit?.();
    },
  });

  const muzzle = scene.add
    .circle(fromX, fromY, 5, 0xe8f4ff, 0.9)
    .setDepth(depth + 1)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scale: 2.2,
    duration: 160,
    onComplete: () => muzzle.destroy(),
  });
}

/** Hyperboreal — ice spikes instead of star orbs. */
function fireIceSpike(
  scene: Phaser.Scene,
  fromX: number,
  fromY: number,
  getTarget: () => { x: number; y: number },
  side: number,
  arcStrength: number,
  depth: number,
  index: number,
  onHit?: () => void
): void {
  const start = getTarget();
  const dx0 = start.x - fromX;
  const dy0 = start.y - fromY;
  const len0 = Math.hypot(dx0, dy0) || 1;
  const nx = (-dy0 / len0) * side * arcStrength;
  const ny = (dx0 / len0) * side * arcStrength;

  const spike = scene.add
    .graphics()
    .setDepth(depth + 3)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  const trailGfx = scene.add
    .graphics()
    .setDepth(depth + 2)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);

  const trail: Array<{ x: number; y: number; ang: number }> = [];
  const state = { t: 0 };
  const duration = 300 + index * 16;

  const drawSpike = (x: number, y: number, ang: number) => {
    spike.clear();
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const len = 16;
    const half = 4.2;
    const tipX = x + c * len;
    const tipY = y + s * len;
    const bx = x - c * 3;
    const by = y - s * 3;
    const lx = bx - s * half;
    const ly = by + c * half;
    const rx = bx + s * half;
    const ry = by - c * half;
    spike.fillStyle(0x7ec8e8, 0.95);
    spike.fillTriangle(lx, ly, tipX, tipY, rx, ry);
    spike.fillStyle(0xe8f8ff, 0.95);
    spike.fillTriangle(
      x - s * 1.4,
      y + c * 1.4,
      tipX,
      tipY,
      x + s * 1.4,
      y - c * 1.4
    );
    spike.fillStyle(0xffffff, 0.85);
    spike.fillCircle(x, y, 2);
  };

  scene.tweens.add({
    targets: state,
    t: 1,
    duration,
    ease: "Cubic.easeIn",
    onUpdate: () => {
      const tgt = getTarget();
      const cx = (fromX + tgt.x) / 2 + nx * (1 - state.t * 0.35);
      const cy = (fromY + tgt.y) / 2 + ny * (1 - state.t * 0.35) - 18;
      const u = state.t;
      const x =
        (1 - u) * (1 - u) * fromX + 2 * (1 - u) * u * cx + u * u * tgt.x;
      const y =
        (1 - u) * (1 - u) * fromY + 2 * (1 - u) * u * cy + u * u * tgt.y;
      const look = getTarget();
      const ang = Math.atan2(look.y - y, look.x - x);
      drawSpike(x, y, ang);

      trail.push({ x, y, ang });
      if (trail.length > 9) trail.shift();
      trailGfx.clear();
      for (let i = 1; i < trail.length; i++) {
        const a = i / trail.length;
        const p0 = trail[i - 1]!;
        const p1 = trail[i]!;
        trailGfx.lineStyle(2.8 * a + 0.5, 0xb8e8ff, a * 0.8);
        trailGfx.lineBetween(p0.x, p0.y, p1.x, p1.y);
      }
    },
    onComplete: () => {
      const hit = getTarget();
      playStarweaverImpactSfx(scene, index);
      playIceImpact(scene, hit.x, hit.y, depth);
      spike.destroy();
      trailGfx.destroy();
      onHit?.();
    },
  });

  const muzzle = scene.add
    .circle(fromX, fromY, 6, 0xd0f0ff, 0.95)
    .setDepth(depth + 1)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: muzzle,
    alpha: 0,
    scale: 2.4,
    duration: 170,
    onComplete: () => muzzle.destroy(),
  });
}

function playBulletImpact(
  scene: Phaser.Scene,
  x: number,
  y: number,
  depth: number
): void {
  const ring = scene.add
    .circle(x, y, 5, 0x000000, 0)
    .setStrokeStyle(2, 0x8ab4ff, 1)
    .setDepth(depth + 4)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: ring,
    scale: 2.6,
    alpha: 0,
    duration: 220,
    ease: "Cubic.easeOut",
    onComplete: () => ring.destroy(),
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = scene.add
      .circle(x, y, 1.8, i % 2 ? 0xffffff : 0x6a9cff, 1)
      .setDepth(depth + 4)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(a) * 22,
      y: y + Math.sin(a) * 22,
      alpha: 0,
      duration: 240,
      ease: "Quad.easeOut",
      onComplete: () => p.destroy(),
    });
  }
}

function playIceImpact(
  scene: Phaser.Scene,
  x: number,
  y: number,
  depth: number
): void {
  const ring = scene.add
    .circle(x, y, 5, 0x000000, 0)
    .setStrokeStyle(2, 0xc8f0ff, 1)
    .setDepth(depth + 4)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: ring,
    scale: 2.8,
    alpha: 0,
    duration: 240,
    ease: "Cubic.easeOut",
    onComplete: () => ring.destroy(),
  });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.2;
    const shard = scene.add
      .triangle(
        x,
        y,
        0,
        -5,
        2.2,
        3,
        -2.2,
        3,
        i % 2 ? 0xffffff : 0x9ad8f0,
        1
      )
      .setDepth(depth + 4)
      .setScrollFactor(0)
      .setAngle(Phaser.Math.RadToDeg(a));
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(a) * 26,
      y: y + Math.sin(a) * 26,
      alpha: 0,
      scale: 0.4,
      duration: 280,
      ease: "Quad.easeOut",
      onComplete: () => shard.destroy(),
    });
  }
}

/**
 * Targeting lock that sits on the stunned fish — rotating reticle + brackets.
 * Ice theme: frosted ice cube instead of LOCKED reticle.
 */
export function createStarweaverLockOn(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options?: { depth?: number; theme?: StarweaverFxTheme }
): StarweaverLockOn {
  if (options?.theme === "ice") {
    return createIceCubeLockOn(scene, x, y, options?.depth ?? 225);
  }

  const depth = options?.depth ?? 225;
  const root = scene.add
    .container(x, y)
    .setDepth(depth)
    .setScrollFactor(0)
    .setAlpha(0);

  const outer = scene.add
    .circle(0, 0, 28, 0x000000, 0)
    .setStrokeStyle(2, 0x6a9cff, 0.85)
    .setBlendMode(Phaser.BlendModes.ADD);
  const outerDash = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  const inner = scene.add
    .circle(0, 0, 14, 0x000000, 0)
    .setStrokeStyle(1.5, 0xffffff, 0.75)
    .setBlendMode(Phaser.BlendModes.ADD);
  const core = scene.add
    .circle(0, 0, 3.5, 0x8ab4ff, 0.9)
    .setBlendMode(Phaser.BlendModes.ADD);

  const brackets = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  const drawBrackets = (pulse: number) => {
    brackets.clear();
    const s = 22 + pulse * 4;
    const arm = 9;
    brackets.lineStyle(2.2, 0xe8f4ff, 0.95);
    brackets.lineBetween(-s, -s + arm, -s, -s);
    brackets.lineBetween(-s, -s, -s + arm, -s);
    brackets.lineBetween(s - arm, -s, s, -s);
    brackets.lineBetween(s, -s, s, -s + arm);
    brackets.lineBetween(-s, s - arm, -s, s);
    brackets.lineBetween(-s, s, -s + arm, s);
    brackets.lineBetween(s - arm, s, s, s);
    brackets.lineBetween(s, s, s, s - arm);
  };
  drawBrackets(0);

  const scan = scene.add
    .rectangle(0, -26, 44, 2, 0xa8c8ff, 0.75)
    .setBlendMode(Phaser.BlendModes.ADD);

  const label = scene.add
    .text(0, 36, "LOCKED", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#c8e4ff",
      stroke: "#1a3060",
      strokeThickness: 2,
    })
    .setOrigin(0.5)
    .setAlpha(0.9);

  root.add([outer, outerDash, inner, core, brackets, scan, label]);

  scene.tweens.add({
    targets: root,
    alpha: 1,
    scale: { from: 1.55, to: 1 },
    duration: 220,
    ease: "Back.easeOut",
  });

  let age = 0;
  let spin = 0;

  const redrawDashed = (angle: number) => {
    outerDash.clear();
    const segs = 12;
    for (let i = 0; i < segs; i++) {
      if (i % 2 === 0) continue;
      const a0 = angle + (i / segs) * Math.PI * 2;
      const a1 = angle + ((i + 0.55) / segs) * Math.PI * 2;
      outerDash.lineStyle(2, 0xffffff, 0.55);
      outerDash.beginPath();
      outerDash.arc(0, 0, 34, a0, a1, false);
      outerDash.strokePath();
    }
  };

  return {
    update: (nx: number, ny: number, dt: number) => {
      age += dt;
      spin += dt * 2.4;
      root.setPosition(nx, ny);
      outer.setAngle(Phaser.Math.RadToDeg(spin));
      inner.setAngle(Phaser.Math.RadToDeg(-spin * 1.6));
      const pulse = 0.5 + Math.sin(age * 7) * 0.5;
      core.setScale(0.85 + pulse * 0.35);
      core.setAlpha(0.7 + pulse * 0.3);
      drawBrackets(Math.sin(age * 5) * 0.5 + 0.5);
      redrawDashed(spin);
      scan.setY(-28 + ((age * 55) % 56));
      scan.setAlpha(0.35 + pulse * 0.4);
      label.setAlpha(0.65 + Math.sin(age * 6) * 0.25);
    },
    destroy: () => {
      scene.tweens.killTweensOf(root);
      scene.tweens.add({
        targets: root,
        alpha: 0,
        scale: 1.35,
        duration: 180,
        ease: "Quad.easeIn",
        onComplete: () => root.destroy(true),
      });
    },
  };
}

function createIceCubeLockOn(
  scene: Phaser.Scene,
  x: number,
  y: number,
  depth: number
): StarweaverLockOn {
  const root = scene.add
    .container(x, y)
    .setDepth(depth)
    .setScrollFactor(0)
    .setAlpha(0);

  const cube = scene.add.graphics().setBlendMode(Phaser.BlendModes.NORMAL);
  const frost = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  const shards = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);

  const drawCube = (pulse: number) => {
    cube.clear();
    const s = 18 + pulse * 2;
    // isometric-ish ice cube
    cube.fillStyle(0xb8e4f8, 0.55);
    cube.fillRect(-s, -s, s * 2, s * 2);
    cube.fillStyle(0xe8f8ff, 0.72);
    cube.fillRect(-s + 3, -s + 3, s * 2 - 6, s * 2 - 6);
    cube.lineStyle(2.2, 0xffffff, 0.95);
    cube.strokeRect(-s, -s, s * 2, s * 2);
    // Face highlight
    cube.fillStyle(0xffffff, 0.35);
    cube.fillTriangle(-s + 2, -s + 2, s - 4, -s + 2, -s + 2, s - 6);
    // Inner crack
    cube.lineStyle(1.2, 0x7ab8d8, 0.7);
    cube.lineBetween(-s * 0.4, -s * 0.2, s * 0.35, s * 0.45);
    cube.lineBetween(-s * 0.1, s * 0.5, s * 0.5, -s * 0.15);

    frost.clear();
    frost.lineStyle(2, 0xd0f0ff, 0.55 + pulse * 0.35);
    frost.strokeCircle(0, 0, s + 10 + pulse * 3);
    frost.fillStyle(0xffffff, 0.25 + pulse * 0.15);
    frost.fillCircle(0, 0, 4);

    shards.clear();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + pulse;
      const r = s + 14;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      shards.fillStyle(i % 2 ? 0xffffff : 0xa8d8f0, 0.85);
      shards.fillTriangle(
        sx,
        sy - 5,
        sx + 2.5,
        sy + 3,
        sx - 2.5,
        sy + 3
      );
    }
  };
  drawCube(0);

  root.add([cube, frost, shards]);

  scene.tweens.add({
    targets: root,
    alpha: 1,
    scale: { from: 1.6, to: 1 },
    duration: 240,
    ease: "Back.easeOut",
  });

  let age = 0;

  return {
    update: (nx: number, ny: number, dt: number) => {
      age += dt;
      root.setPosition(nx, ny);
      const pulse = 0.5 + Math.sin(age * 6) * 0.5;
      drawCube(pulse);
      root.setAngle(Math.sin(age * 1.8) * 4);
    },
    destroy: () => {
      scene.tweens.killTweensOf(root);
      scene.tweens.add({
        targets: root,
        alpha: 0,
        scale: 1.4,
        duration: 200,
        ease: "Quad.easeIn",
        onComplete: () => root.destroy(true),
      });
    },
  };
}
