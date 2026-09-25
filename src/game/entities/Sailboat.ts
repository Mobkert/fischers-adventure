import Phaser from "phaser";
import { BoatDef, BoatId, BOATS } from "../data/boats";
import { Player } from "./Player";
import { playerSeatPadLift } from "./PlayerArt";
import { ensureSplashTextures } from "../fx/WaterSplash";

/**
 * Hull art: center (70, 28), mast stump around (69, 20).
 * Offset from sprite center → mast foot attachment point.
 */
const MAST_FOOT = { x: -1, y: -10 };

export class Sailboat {
  hull: Phaser.Physics.Arcade.Sprite;
  private sail?: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private waterLeft: number;
  private waterRight: number;
  private baseY: number;
  private waterY: number;
  readonly def: BoatDef;
  occupied = false;
  private player: Player | null = null;
  private facingLeft = false;
  private sailMode: "idle" | "run" | "none" = "none";

  private vel = 0;
  private maxSpeed: number;
  private readonly turnSmooth = 5;
  private wakeEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private wakeTimer = 0;
  private galacticGfx?: Phaser.GameObjects.Graphics;
  private galacticSparks: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
  }> = [];
  private galacticSpawn = 0;
  private surferCosmetic: "default" | "duck" | "gold" | "rainbow" = "default";

  constructor(
    scene: Phaser.Scene,
    x: number,
    waterY: number,
    waterLeft: number,
    waterRight: number,
    boatId: BoatId = "sailboat"
  ) {
    this.scene = scene;
    this.def = BOATS[boatId];
    this.waterLeft = waterLeft;
    this.waterRight = waterRight;
    this.waterY = waterY;
    this.baseY = waterY + 8;
    this.maxSpeed = this.def.maxSpeed;

    this.hull = scene.physics.add.sprite(x, this.baseY, this.def.hullKey);
    this.hull.setDepth(8);
    this.hull.setOrigin(0.5, 0.5);
    if (this.def.displayScale) this.hull.setScale(this.def.displayScale);
    const body = this.hull.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setImmovable(true);
    body.setSize(this.def.body.w, this.def.body.h);
    body.setOffset(this.def.body.ox, this.def.body.oy);
    this.hull.setVelocity(0, 0);

    if (this.def.hasSail) {
      this.sail = scene.add
        .sprite(x, this.baseY, "sailboat_sail_0")
        .setOrigin(0.5, 1)
        .setDepth(9);
    }

    const fadeTargets = this.sail ? [this.hull, this.sail] : [this.hull];
    for (const t of fadeTargets) t.setAlpha(0);
    scene.tweens.add({
      targets: fadeTargets,
      alpha: 1,
      duration: 400,
      ease: "Sine.easeOut",
    });

    if (this.def.wake) this.setupWake();
    if (this.def.galacticTrail) this.setupGalacticTrail();

    this.syncVisuals();
    if (this.sail) this.playSail("idle");
  }

  get boatId(): BoatId {
    return this.def.id;
  }

  /** @deprecated Prefer setSurferCosmetic. */
  setDuckCosmetic(on: boolean): void {
    this.setSurferCosmetic(on ? "duck" : "default");
  }

  /** Stellar Surfer board finish: default / duck / gold / rainbow. */
  setSurferCosmetic(mode: "default" | "duck" | "gold" | "rainbow"): void {
    if (this.def.id !== "stellar_surfer") return;
    this.surferCosmetic = mode;
    const key =
      mode === "duck"
        ? "stellar_surfer_duck"
        : mode === "gold"
          ? "stellar_surfer_gold"
          : mode === "rainbow"
            ? "stellar_surfer_rainbow"
            : this.def.hullKey;
    if (this.scene.textures.exists(key)) {
      this.hull.setTexture(key);
    }
  }

  getSeatWorld(): { x: number; y: number } {
    const ox = this.def.seatOffset.x;
    return {
      x: this.hull.x + (this.facingLeft ? -ox : ox),
      // Extra player-frame top pad shifts the figure down vs sprite center
      y: this.hull.y + this.def.seatOffset.y - playerSeatPadLift(),
    };
  }

  isNear(x: number, y: number, radius = 78): boolean {
    return (
      Phaser.Math.Distance.Between(x, y, this.hull.x, this.hull.y - 8) < radius
    );
  }

  board(player: Player): void {
    this.occupied = true;
    this.player = player;
    player.enterBoat();
    this.syncVisuals();
    this.seatPlayer();
    const body = player.sprite.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.enable = false;
  }

  disembark(player: Player, dockX: number, groundY: number): void {
    this.occupied = false;
    this.player = null;
    this.vel = 0;
    this.hull.setVelocity(0, 0);
    this.wakeEmitter?.stop();
    if (this.sail) this.playSail("idle");
    player.exitBoat();
    const body = player.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.allowGravity = true;
    player.sprite.setPosition(dockX, groundY - 40);
    player.sprite.setVelocity(0, 0);
  }

  update(delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    const bob =
      Math.sin(this.scene.time.now / 480 + this.hull.x * 0.008) * 2.2;
    const heel = Phaser.Math.Clamp(this.vel / this.maxSpeed, -1, 1) * 2.5;
    const body = this.hull.body as Phaser.Physics.Arcade.Body;

    this.hull.setVelocityY(0);
    body.allowGravity = false;
    this.hull.y = this.baseY + bob;
    this.hull.setAngle(heel * (this.facingLeft ? -1 : 1) * 0.4);

    if (!this.occupied || !this.player) {
      this.vel = 0;
      this.hull.setVelocity(0, 0);
      body.reset(this.hull.x, this.baseY + bob);
      this.syncVisuals();
      this.wakeEmitter?.stop();
      if (this.sail) this.playSail("idle");
      this.clearGalacticTrail();
      return;
    }

    if (this.player.isFishingAnim()) {
      this.vel = Phaser.Math.Linear(this.vel, 0, 1 - Math.exp(-2.5 * dt));
      this.applyVelocity();
      this.syncVisuals();
      this.seatPlayer();
      this.updateWake(delta);
      this.updateGalacticTrail(delta);
      if (this.sail) this.playSail(Math.abs(this.vel) > 20 ? "run" : "idle");
      return;
    }

    const left = this.player.isKeyDown("left");
    const right = this.player.isKeyDown("right");

    let target = 0;
    if (left && !right) {
      this.facingLeft = true;
      target = -this.maxSpeed;
    } else if (right && !left) {
      this.facingLeft = false;
      target = this.maxSpeed;
    }

    const turning =
      target !== 0 && Math.sign(this.vel) !== Math.sign(target) && this.vel !== 0;
    const rate = turning ? this.turnSmooth : target === 0 ? 2.2 : 1.6;
    this.vel = Phaser.Math.Linear(this.vel, target, 1 - Math.exp(-rate * dt));

    this.applyVelocity();
    this.syncVisuals();
    this.seatPlayer();
    this.updateWake(delta);
    this.updateGalacticTrail(delta);

    if (this.sail) {
      const moving = Math.abs(this.vel) > 12 && (left || right);
      this.playSail(moving || Math.abs(this.vel) > 25 ? "run" : "idle");
    }
  }

  private setupWake(): void {
    ensureSplashTextures(this.scene);
    const wake = this.def.wake!;
    this.wakeEmitter = this.scene.add.particles(0, 0, "water_splash_drop", {
      speedX: { min: -30, max: 30 },
      speedY: { min: -90 * wake.power, max: -30 * wake.power },
      lifespan: { min: 280, max: 520 },
      quantity: 2,
      frequency: wake.frequency,
      scale: { start: 0.55 * wake.power, end: 0.1 },
      alpha: { start: 0.75, end: 0 },
      tint: [0xffffff, 0xb8e0ff, 0x7ec8ff],
      emitting: false,
    });
    this.wakeEmitter.setDepth(7);
  }

  private setupGalacticTrail(): void {
    this.galacticGfx = this.scene.add
      .graphics()
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  private clearGalacticTrail(): void {
    this.galacticSparks = [];
    this.galacticGfx?.clear();
  }

  private updateGalacticTrail(delta: number): void {
    if (!this.def.galacticTrail || !this.galacticGfx) return;
    const dt = Math.min(delta / 1000, 0.05);
    const moving = Math.abs(this.vel) > 40;
    const palette =
      this.surferCosmetic === "duck"
        ? [
            0xffe066,
            0xffd84a,
            0x4aa8e8,
            0x8fd4ff,
            0xffffff,
            0xffa84a,
            0x6ec8ff,
            0xfff6c8,
          ]
        : this.surferCosmetic === "gold"
          ? [
              0xffe066,
              0xffd700,
              0xfff3c4,
              0xb8962e,
              0xffc878,
              0xffffff,
              0xe8c547,
              0xfff8e0,
            ]
          : this.surferCosmetic === "rainbow"
            ? [
                0xff3355,
                0xff8800,
                0xffee33,
                0x44dd66,
                0x3388ff,
                0x8844ff,
                0xff44cc,
                0xffffff,
              ]
            : [
                0xffe066,
                0xff9f43,
                0xff6bcb,
                0xc9a0ff,
                0x8a5cff,
                0x7ec8ff,
                0x44ffcc,
                0xffffff,
                0xff4d6d,
                0x5eead4,
              ];
    // Trail sits under the stern of the board
    const dir = this.facingLeft ? 1 : -1;
    const sternX = this.hull.x + dir * (this.def.halfWidth * 0.62);
    const sternY = this.hull.y + 14;

    if (!moving) {
      for (const s of this.galacticSparks) s.life -= dt * 1.4;
    } else {
      this.galacticSpawn -= dt;
      while (this.galacticSpawn <= 0 && this.galacticSparks.length < 42) {
        this.galacticSpawn += 0.022;
        this.galacticSparks.push({
          x: sternX + (Math.random() - 0.5) * 18,
          y: sternY + (Math.random() - 0.5) * 6,
          vx: dir * (70 + Math.random() * 100) + this.vel * 0.28,
          vy: -8 + Math.random() * 22,
          life: 0.55 + Math.random() * 0.55,
          maxLife: 1,
          size: 2.4 + Math.random() * 3.2,
          color: palette[(Math.random() * palette.length) | 0]!,
        });
        const last = this.galacticSparks[this.galacticSparks.length - 1]!;
        last.maxLife = last.life;
      }
    }

    const g = this.galacticGfx;
    g.clear();

    if (moving) {
      const sx = this.hull.x + dir * (this.def.halfWidth * 0.25);
      const sy = sternY + 2;
      const len = 90 + Math.min(50, Math.abs(this.vel) * 0.1);
      if (this.surferCosmetic === "duck") {
        g.lineStyle(14, 0x1a6090, 0.22);
        g.lineBetween(sx, sy, sx + dir * len, sy + 4);
        g.lineStyle(8, 0x4aa8e8, 0.32);
        g.lineBetween(sx, sy + 1, sx + dir * (len * 0.92), sy + 5);
        g.lineStyle(4, 0x8fd4ff, 0.28);
        g.lineBetween(sx, sy, sx + dir * (len * 0.8), sy + 3);
        g.lineStyle(2.5, 0xffe066, 0.4);
        g.lineBetween(sx, sy - 1, sx + dir * (len * 0.7), sy + 2);
      } else if (this.surferCosmetic === "gold") {
        g.lineStyle(14, 0x8a6010, 0.22);
        g.lineBetween(sx, sy, sx + dir * len, sy + 4);
        g.lineStyle(8, 0xd4af37, 0.35);
        g.lineBetween(sx, sy + 1, sx + dir * (len * 0.92), sy + 5);
        g.lineStyle(4, 0xffe066, 0.32);
        g.lineBetween(sx, sy, sx + dir * (len * 0.8), sy + 3);
        g.lineStyle(2.5, 0xfff3c4, 0.45);
        g.lineBetween(sx, sy - 1, sx + dir * (len * 0.7), sy + 2);
      } else if (this.surferCosmetic === "rainbow") {
        g.lineStyle(14, 0xff3355, 0.2);
        g.lineBetween(sx, sy - 2, sx + dir * len, sy + 2);
        g.lineStyle(10, 0xffee33, 0.22);
        g.lineBetween(sx, sy, sx + dir * (len * 0.95), sy + 3);
        g.lineStyle(7, 0x44dd66, 0.25);
        g.lineBetween(sx, sy + 1, sx + dir * (len * 0.88), sy + 4);
        g.lineStyle(5, 0x3388ff, 0.28);
        g.lineBetween(sx, sy + 2, sx + dir * (len * 0.8), sy + 5);
        g.lineStyle(3, 0x8844ff, 0.35);
        g.lineBetween(sx, sy, sx + dir * (len * 0.72), sy + 3);
      } else {
        g.lineStyle(14, 0x4a20a0, 0.22);
        g.lineBetween(sx, sy, sx + dir * len, sy + 4);
        g.lineStyle(8, 0x8a5cff, 0.32);
        g.lineBetween(sx, sy + 1, sx + dir * (len * 0.92), sy + 5);
        g.lineStyle(4, 0xff6bcb, 0.28);
        g.lineBetween(sx, sy, sx + dir * (len * 0.8), sy + 3);
        g.lineStyle(2.5, 0xffe066, 0.4);
        g.lineBetween(sx, sy - 1, sx + dir * (len * 0.7), sy + 2);
      }
    }

    for (let i = this.galacticSparks.length - 1; i >= 0; i--) {
      const s = this.galacticSparks[i]!;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 28 * dt;
      if (s.life <= 0) {
        this.galacticSparks.splice(i, 1);
        continue;
      }
      const u = s.life / s.maxLife;
      g.fillStyle(s.color, 0.25 + u * 0.55);
      g.fillCircle(s.x, s.y, s.size * u);
    }
  }

  private updateWake(delta: number): void {
    if (!this.wakeEmitter || !this.def.wake) return;
    const moving = Math.abs(this.vel) > 35;
    if (!moving) {
      this.wakeEmitter.stop();
      return;
    }
    if (!this.wakeEmitter.emitting) this.wakeEmitter.start();

    const dir = this.facingLeft ? 1 : -1; // spray behind stern
    const sternX = this.hull.x + dir * (this.def.halfWidth * 0.55);
    this.wakeEmitter.setPosition(sternX, this.waterY + 2);

    // Occasional surface sheet splash
    this.wakeTimer += delta;
    if (this.wakeTimer > 90) {
      this.wakeTimer = 0;
      const sheet = this.scene.add
        .ellipse(
          sternX,
          this.waterY + 2,
          18 * this.def.wake.power,
          6,
          0xd0ecff,
          0.45
        )
        .setDepth(7)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: sheet,
        scaleX: 2.2,
        scaleY: 1.4,
        alpha: 0,
        x: sternX + dir * 18,
        duration: 280,
        onComplete: () => sheet.destroy(),
      });
    }
  }

  private applyVelocity(): void {
    const minX = this.waterLeft + this.def.halfWidth;
    const maxX = this.waterRight - this.def.halfWidth;
    this.hull.setVelocityX(this.vel);
    if (this.hull.x < minX) {
      this.hull.x = minX;
      this.vel = Math.max(0, this.vel);
    }
    if (this.hull.x > maxX) {
      this.hull.x = maxX;
      this.vel = Math.min(0, this.vel);
    }
  }

  private syncVisuals(): void {
    this.hull.setFlipX(this.facingLeft);
    if (!this.sail) return;

    const dir = this.facingLeft ? -1 : 1;
    const ang = Phaser.Math.DegToRad(this.hull.angle);
    const lx = MAST_FOOT.x * dir;
    const ly = MAST_FOOT.y;
    const rx = lx * Math.cos(ang) - ly * Math.sin(ang);
    const ry = lx * Math.sin(ang) + ly * Math.cos(ang);

    this.sail.setPosition(this.hull.x + rx, this.hull.y + ry);
    this.sail.setFlipX(this.facingLeft);
    this.sail.setAngle(this.hull.angle);
  }

  private playSail(mode: "idle" | "run"): void {
    if (!this.sail) return;
    if (this.sailMode === mode) return;
    this.sailMode = mode;
    this.sail.play(mode === "run" ? "sail-run" : "sail-idle", true);
    this.sail.setFlipX(this.facingLeft);
  }

  private seatPlayer(): void {
    if (!this.player) return;
    const seat = this.getSeatWorld();
    this.player.sprite.setPosition(seat.x, seat.y);
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.setDepth(11);
    this.player.setFacing(this.facingLeft ? "left" : "right");
  }

  destroy(): void {
    this.wakeEmitter?.destroy();
    this.galacticGfx?.destroy();
    this.galacticSparks = [];
    this.hull.destroy();
    this.sail?.destroy();
  }
}
