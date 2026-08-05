import Phaser from "phaser";
import { Fish } from "../entities/Fish";
import { ItemId } from "../data/items";

const CHECK_MS = 5 * 60 * 1000;
const DURATION_MS = 7 * 60 * 1000;
const DOLPHIN_COUNT = 3;
const BASE_CHANCE = 0.025;
const CHANCE_STEP = 0.025;

/**
 * Timed coral-reef dolphin abundance:
 * every 5 minutes roll (starts 2.5%, +2.5% each miss, never twice in a row).
 * On success: 3 jumping dolphins at the reef for 7 minutes.
 */
export class DolphinAbundance {
  private scene: Phaser.Scene;
  private reefLeft: number;
  private reefRight: number;
  private waterSurfaceY: number;
  private getLuck: () => number;
  private getIsRainy: () => boolean;
  private fishList: Fish[];
  private onAnnounce?: (message: string) => void;

  private checkElapsed = 0;
  private chance = BASE_CHANCE;
  private lastWasAbundance = false;
  private active = false;
  private activeRemaining = 0;
  private dolphins: Fish[] = [];

  constructor(
    scene: Phaser.Scene,
    reefLeft: number,
    reefRight: number,
    waterSurfaceY: number,
    fishList: Fish[],
    getLuck: () => number,
    getIsRainy: () => boolean,
    onAnnounce?: (message: string) => void
  ) {
    this.scene = scene;
    this.reefLeft = reefLeft;
    this.reefRight = reefRight;
    this.waterSurfaceY = waterSurfaceY;
    this.fishList = fishList;
    this.getLuck = getLuck;
    this.getIsRainy = getIsRainy;
    this.onAnnounce = onAnnounce;
  }

  isActive(): boolean {
    return this.active;
  }

  /** Remove a dolphin from the abundance tracking when caught. */
  notifyFishRemoved(fish: Fish): void {
    this.dolphins = this.dolphins.filter((d) => d !== fish);
  }

  update(delta: number): void {
    if (this.active) {
      this.activeRemaining -= delta;
      // Prune destroyed / caught dolphins
      this.dolphins = this.dolphins.filter(
        (d) => d.state !== "caught" && d.sprite.active
      );
      if (this.activeRemaining <= 0) {
        this.endAbundance();
      }
      return;
    }

    this.checkElapsed += delta;
    if (this.checkElapsed < CHECK_MS) return;
    this.checkElapsed = 0;
    this.tryRoll();
  }

  private tryRoll(): void {
    if (this.lastWasAbundance) {
      // Never twice in a row — treat as a miss for pity
      this.lastWasAbundance = false;
      this.chance = Math.min(1, this.chance + CHANCE_STEP);
      return;
    }

    if (Math.random() < this.chance) {
      this.startAbundance();
      return;
    }

    this.chance = Math.min(1, this.chance + CHANCE_STEP);
  }

  private startAbundance(): void {
    this.active = true;
    this.activeRemaining = DURATION_MS;
    this.lastWasAbundance = true;
    this.chance = BASE_CHANCE;
    this.spawnDolphins();
    this.onAnnounce?.("Dolphin abundance at the Coral Reef!");
  }

  private spawnDolphins(): void {
    const pad = 80;
    const left = this.reefLeft + pad;
    const right = this.reefRight - pad;
    for (let i = 0; i < DOLPHIN_COUNT; i++) {
      const x = Phaser.Math.Between(left, right);
      const fish = new Fish(
        this.scene,
        x,
        this.waterSurfaceY + 30,
        left,
        right,
        this.waterSurfaceY,
        this.getLuck,
        "reef",
        "dolphin" as ItemId,
        () => [],
        this.getIsRainy,
        { lockSpecies: true, noDespawn: true }
      );
      this.dolphins.push(fish);
      this.fishList.push(fish);
    }
  }

  private endAbundance(): void {
    this.active = false;
    this.activeRemaining = 0;
    for (const d of this.dolphins) {
      // Leave fish mid-fight; fishing system removes them after the catch
      if (d.state !== "idle") continue;
      const idx = this.fishList.indexOf(d);
      if (idx >= 0) this.fishList.splice(idx, 1);
      d.destroy();
    }
    this.dolphins = this.dolphins.filter((d) => d.state !== "idle");
    this.onAnnounce?.("The dolphins swim away…");
  }
}
