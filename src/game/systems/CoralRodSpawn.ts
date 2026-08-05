import Phaser from "phaser";
import { InventorySystem } from "./InventorySystem";

const CHECK_MS = 5 * 60 * 1000;
const BASE_CHANCE = 0.032;
const CHANCE_STEP = 0.032;
const CHANCE_CAP = 0.176;
const NEAR_RADIUS = 110;

/**
 * Silent Coral Rod float on the reef surface (4–6 min), no announcement.
 * Rolls every 5 min: starts 3.2%, +3.2% each miss, caps at 17.6%, resets on spawn.
 */
export class CoralRodSpawn {
  private scene: Phaser.Scene;
  private reefLeft: number;
  private reefRight: number;
  private waterSurfaceY: number;
  private inventory: InventorySystem;

  private checkElapsed = 0;
  private chance = BASE_CHANCE;
  private active = false;
  private lifetime = 0;
  private fading = false;
  private root?: Phaser.GameObjects.Container;
  private rodImg?: Phaser.GameObjects.Image;
  private glow?: Phaser.GameObjects.Image;
  private bobPhase = 0;

  constructor(
    scene: Phaser.Scene,
    reefLeft: number,
    reefRight: number,
    waterSurfaceY: number,
    inventory: InventorySystem
  ) {
    this.scene = scene;
    this.reefLeft = reefLeft;
    this.reefRight = reefRight;
    this.waterSurfaceY = waterSurfaceY;
    this.inventory = inventory;
  }

  isActive(): boolean {
    return this.active && !this.fading;
  }

  getX(): number {
    return this.root?.x ?? 0;
  }

  getY(): number {
    return this.root?.y ?? this.waterSurfaceY;
  }

  isNear(x: number, y: number, radius = NEAR_RADIUS): boolean {
    if (!this.isActive() || !this.root) return false;
    return Phaser.Math.Distance.Between(x, y, this.root.x, this.root.y) <= radius;
  }

  /** Force a float now (debug / testing). */
  forceSpawn(): void {
    if (this.inventory.ownsRod("coral_rod")) return;
    if (this.active) this.clear();
    this.spawnFloat();
  }

  update(delta: number): void {
    if (this.active) {
      this.lifetime -= delta;
      this.bobPhase += delta * 0.004;
      if (this.root && this.rodImg) {
        const bob = Math.sin(this.bobPhase) * 3.5;
        this.rodImg.setY(bob);
        this.glow?.setY(bob);
        this.rodImg.setAngle(Math.sin(this.bobPhase * 0.7) * 6);
        this.glow?.setAlpha(0.35 + Math.sin(this.bobPhase * 1.3) * 0.12);
      }
      if (!this.fading && this.lifetime <= 0) {
        this.beginFade();
      }
      return;
    }

    if (this.inventory.ownsRod("coral_rod")) return;

    this.checkElapsed += delta;
    if (this.checkElapsed < CHECK_MS) return;
    this.checkElapsed = 0;

    if (Math.random() < this.chance) {
      this.chance = BASE_CHANCE;
      this.spawnFloat();
      return;
    }
    this.chance = Math.min(CHANCE_CAP, this.chance + CHANCE_STEP);
  }

  private spawnFloat(): void {
    const pad = 120;
    const x = Phaser.Math.Between(this.reefLeft + pad, this.reefRight - pad);
    const y = this.waterSurfaceY - 2;

    this.root = this.scene.add.container(x, y).setDepth(12);
    this.glow = this.scene.add
      .image(0, 0, "rod_coral")
      .setDisplaySize(56, 56)
      .setTint(0xff9ec8)
      .setAlpha(0.4)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.rodImg = this.scene.add
      .image(0, 0, "rod_coral")
      .setDisplaySize(48, 48)
      .setAngle(-18);
    this.root.add([this.glow, this.rodImg]);

    this.active = true;
    this.fading = false;
    this.lifetime = Phaser.Math.Between(4 * 60_000, 6 * 60_000);
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  private beginFade(): void {
    if (!this.root || this.fading) return;
    this.fading = true;
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 1600,
      ease: "Sine.In",
      onComplete: () => this.clear(),
    });
  }

  /** Remove after a successful offer. */
  claim(): void {
    this.clear();
  }

  private clear(): void {
    this.scene.tweens.killTweensOf(this.root ?? []);
    this.root?.destroy(true);
    this.root = undefined;
    this.rodImg = undefined;
    this.glow = undefined;
    this.active = false;
    this.fading = false;
    this.lifetime = 0;
  }
}
