import Phaser from "phaser";
import { BoatDef, BoatId, BOATS } from "../data/boats";
import { Player } from "./Player";
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

    this.syncVisuals();
    if (this.sail) this.playSail("idle");
  }

  get boatId(): BoatId {
    return this.def.id;
  }

  getSeatWorld(): { x: number; y: number } {
    const ox = this.def.seatOffset.x;
    return {
      x: this.hull.x + (this.facingLeft ? -ox : ox),
      y: this.hull.y + this.def.seatOffset.y,
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
      return;
    }

    if (this.player.isFishingAnim()) {
      this.vel = Phaser.Math.Linear(this.vel, 0, 1 - Math.exp(-2.5 * dt));
      this.applyVelocity();
      this.syncVisuals();
      this.seatPlayer();
      this.updateWake(delta);
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
    this.hull.destroy();
    this.sail?.destroy();
  }
}
