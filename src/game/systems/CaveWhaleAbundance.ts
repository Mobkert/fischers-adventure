import Phaser from "phaser";
import { Fish } from "../entities/Fish";
import { ItemId } from "../data/items";

const CHECK_MS = 5 * 60 * 1000;
const DURATION_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 5 * 60 * 1000;
const BASE_CHANCE = 0.025;
const CHANCE_STEP = 0.025;
const MAX_CHANCE = 0.1;

export type CaveLake = { id: string; left: number; right: number; name: string };

/**
 * Cave whale abundance: every 5 minutes roll (2.5% → +2.5% on miss, cap 10%).
 * On success: one massive whale in a random lake for 5 minutes, then 5 min cooldown.
 */
export class CaveWhaleAbundance {
  private scene: Phaser.Scene;
  private lakes: CaveLake[];
  private waterSurfaceY: number;
  private getLuck: () => number;
  private fishList: Fish[];
  private onAnnounce?: (message: string) => void;

  private checkElapsed = 0;
  private cooldownRemaining = 0;
  private chance = BASE_CHANCE;
  private active = false;
  private activeRemaining = 0;
  private whale: Fish | null = null;
  private ending = false;

  constructor(
    scene: Phaser.Scene,
    lakes: CaveLake[],
    waterSurfaceY: number,
    fishList: Fish[],
    getLuck: () => number,
    onAnnounce?: (message: string) => void
  ) {
    this.scene = scene;
    this.lakes = lakes;
    this.waterSurfaceY = waterSurfaceY;
    this.fishList = fishList;
    this.getLuck = getLuck;
    this.onAnnounce = onAnnounce;
  }

  isActive(): boolean {
    return this.active;
  }

  /** Force an immediate whale spawn (for testing). */
  forceSpawn(preferLakeId?: string): void {
    if (this.active || this.ending) return;
    this.checkElapsed = 0;
    this.cooldownRemaining = 0;
    const preferred = preferLakeId
      ? this.lakes.find((l) => l.id === preferLakeId)
      : undefined;
    this.startAbundance(preferred);
  }

  notifyFishRemoved(fish: Fish): void {
    if (this.whale === fish) this.whale = null;
  }

  update(delta: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= delta;
    }

    if (this.active) {
      this.activeRemaining -= delta;
      if (this.whale && (this.whale.state === "caught" || !this.whale.sprite.active)) {
        this.whale = null;
      }
      if (this.activeRemaining <= 0 && !this.ending) {
        this.endAbundance();
      }
      return;
    }

    if (this.cooldownRemaining > 0) return;

    this.checkElapsed += delta;
    if (this.checkElapsed < CHECK_MS) return;
    this.checkElapsed = 0;
    this.tryRoll();
  }

  private tryRoll(): void {
    if (Math.random() < this.chance) {
      this.startAbundance();
      return;
    }
    this.chance = Math.min(MAX_CHANCE, this.chance + CHANCE_STEP);
  }

  private startAbundance(forceLake?: CaveLake): void {
    const lake = forceLake ?? Phaser.Utils.Array.GetRandom(this.lakes);
    if (!lake) return;

    this.active = true;
    this.activeRemaining = DURATION_MS;
    this.ending = false;
    this.chance = BASE_CHANCE;
    this.spawnWhale(lake);
    this.onAnnounce?.(
      "A massive whale has spawned in the mountain caves"
    );
  }

  private spawnWhale(lake: CaveLake): void {
    const pad = 120;
    const left = lake.left + pad;
    const right = lake.right - pad;
    const x = Phaser.Math.Between(left, right);
    const fish = new Fish(
      this.scene,
      x,
      this.waterSurfaceY + 40,
      left,
      right,
      this.waterSurfaceY,
      this.getLuck,
      "cave",
      "cave_whale" as ItemId,
      () => [],
      () => false,
      { lockSpecies: true, noDespawn: true },
      () => false
    );
    this.whale = fish;
    fish.sprite.setDepth(14);
    this.fishList.push(fish);
  }

  private endAbundance(): void {
    if (this.ending) return;
    this.ending = true;
    this.active = false;
    this.activeRemaining = 0;
    this.cooldownRemaining = COOLDOWN_MS;

    const whale = this.whale;
    this.whale = null;
    if (!whale || whale.state !== "idle" || !whale.sprite.active) {
      this.ending = false;
      return;
    }

    this.onAnnounce?.(
      "The whale dives into the deep sea before disappearing"
    );
    whale.diveDespawn(() => {
      const idx = this.fishList.indexOf(whale);
      if (idx >= 0) this.fishList.splice(idx, 1);
      this.ending = false;
    });
  }
}
