import Phaser from "phaser";
import { Player } from "./Player";

/**
 * Hull art: center (70, 28), mast stump around (69, 20).
 * Offset from sprite center → mast foot attachment point.
 */
const MAST_FOOT = { x: -1, y: -10 };

export class Sailboat {
  hull: Phaser.Physics.Arcade.Sprite;
  private sail: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private waterLeft: number;
  private waterRight: number;
  private baseY: number;
  occupied = false;
  private player: Player | null = null;
  private facingLeft = false;
  private sailMode: "idle" | "run" | "none" = "none";

  private vel = 0;
  private readonly maxSpeed = 140;
  private readonly turnSmooth = 5;

  constructor(
    scene: Phaser.Scene,
    x: number,
    waterY: number,
    waterLeft: number,
    waterRight: number
  ) {
    this.scene = scene;
    this.waterLeft = waterLeft;
    this.waterRight = waterRight;
    this.baseY = waterY + 8;

    this.hull = scene.physics.add.sprite(x, this.baseY, "sailboat");
    this.hull.setDepth(8);
    this.hull.setOrigin(0.5, 0.5);
    const body = this.hull.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    // Standable deck when empty — must not be pushed under by the player.
    body.setImmovable(true);
    body.setSize(110, 16);
    body.setOffset(15, 26);
    this.hull.setVelocity(0, 0);

    // Origin at bottom-center = mast foot, planted on the deck stump
    this.sail = scene.add
      .sprite(x, this.baseY, "sailboat_sail_0")
      .setOrigin(0.5, 1)
      .setDepth(9);

    this.hull.setAlpha(0);
    this.sail.setAlpha(0);
    scene.tweens.add({
      targets: [this.hull, this.sail],
      alpha: 1,
      duration: 400,
      ease: "Sine.easeOut",
    });

    this.syncVisuals();
    this.playSail("idle");
  }

  getSeatWorld(): { x: number; y: number } {
    return {
      x: this.hull.x + (this.facingLeft ? 4 : -4),
      y: this.hull.y - 18,
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
    this.playSail("idle");
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

    // Lock to waterline every frame (collision must not sink the hull).
    this.hull.setVelocityY(0);
    body.allowGravity = false;
    this.hull.y = this.baseY + bob;
    this.hull.setAngle(heel * (this.facingLeft ? -1 : 1) * 0.4);

    if (!this.occupied || !this.player) {
      this.vel = 0;
      this.hull.setVelocity(0, 0);
      body.reset(this.hull.x, this.baseY + bob);
      this.syncVisuals();
      this.playSail("idle");
      return;
    }

    if (this.player.isFishingAnim()) {
      this.vel = Phaser.Math.Linear(this.vel, 0, 1 - Math.exp(-2.5 * dt));
      this.applyVelocity();
      this.syncVisuals();
      this.seatPlayer();
      this.playSail(Math.abs(this.vel) > 20 ? "run" : "idle");
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

    const moving = Math.abs(this.vel) > 12 && (left || right);
    this.playSail(moving || Math.abs(this.vel) > 25 ? "run" : "idle");
  }

  private applyVelocity(): void {
    const minX = this.waterLeft + 70;
    const maxX = this.waterRight - 70;
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

  /** Plant sail mast foot on the hull mast stump every frame. */
  private syncVisuals(): void {
    this.hull.setFlipX(this.facingLeft);

    const dir = this.facingLeft ? -1 : 1;
    const ang = Phaser.Math.DegToRad(this.hull.angle);
    // Rotate mast offset with hull heel so it stays planted
    const lx = MAST_FOOT.x * dir;
    const ly = MAST_FOOT.y;
    const rx = lx * Math.cos(ang) - ly * Math.sin(ang);
    const ry = lx * Math.sin(ang) + ly * Math.cos(ang);

    this.sail.setPosition(this.hull.x + rx, this.hull.y + ry);
    this.sail.setFlipX(this.facingLeft);
    this.sail.setAngle(this.hull.angle);
  }

  private playSail(mode: "idle" | "run"): void {
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
    this.hull.destroy();
    this.sail.destroy();
  }
}
