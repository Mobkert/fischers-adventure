import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Fish } from "../entities/Fish";
import { Bobber } from "../entities/Bobber";
import { InventorySystem } from "./InventorySystem";
import {
  ITEMS,
  ItemId,
  RARITY_COLOR,
  rodMaxReachPx,
  DEPTH_PX_PER_METER,
  resolveCatchMutation,
  rollFullMoonMutation,
  rollSunnyMutation,
  FishMutationId,
  FishSizeId,
  luckApproachSpeedMult,
} from "../data/items";

export type FishingState =
  | "idle"
  | "casting"
  | "waiting"
  | "second_wait"
  | "bite"
  | "minigame";

export interface WaterZone {
  left: number;
  right: number;
}

export interface CaughtFishResult {
  speciesId: ItemId;
  mutation: FishMutationId | null;
  size: FishSizeId;
}

/** How long to wait for a second bite on the twin-hook bobber (ms). */
const SECOND_BITE_WAIT_MS = 2500;

export class FishingSystem {
  state: FishingState = "idle";
  private player: Player;
  private bobber: Bobber;
  private fishList: Fish[];
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private waterZones: WaterZone[];
  private waterSurfaceY: number;
  private weather: {
    weather: string;
    modifyStats: (
      s: import("../data/items").RodStats,
      rodId?: string | null
    ) => import("../data/items").RodStats;
    isInWhirlpool: (x: number, y: number, r?: number) => boolean;
    getRodMutationChanceBonus?: (rodId?: string | null) => number;
  } | null = null;
  private targetFish: Fish | null = null;
  private secondFish: Fish | null = null;
  /** All fish currently racing the bobber — first to arrive wins. */
  private approachingFish: Fish[] = [];
  private castCooldown = 0;
  /** Bobber glued to rod tip until the cast swing releases. */
  private bobberOnTip = false;
  private pendingCast?: {
    castX: number;
    surfaceY: number;
    depthY: number;
    zone: WaterZone;
    lineDepth: number;
  };
  /** When waiting started (ms) — timeout if nothing bites. */
  private waitingSince = 0;
  private secondWaitUntil = 0;

  onBite?: (speciesId: ItemId) => void;
  onMinigameStart?: () => void;
  onFishingEnd?: (success: boolean) => void;
  onLineTooShort?: () => void;
  /** Fired when a cast finds no fish in range (empty pool, etc.). */
  onNoBite?: () => void;
  /** Camera should follow the bobber while the line is out. */
  onCastCameraFollow?: () => void;
  /** Restore camera to the player when fishing ends. */
  onCastCameraRelease?: () => void;
  /** Abundance fish removed after a successful catch. */
  onAbundanceFishRemoved?: (fish: Fish) => void;
  /** Whether a dolphin abundance is currently active. */
  isAbundanceActive?: () => boolean;
  /** Mutation applied on the last successful catch (primary). */
  lastCatchMutation: FishMutationId | null = null;
  /** Size effect on the last successful catch (primary). */
  lastCatchSize: FishSizeId | null = null;
  /** All fish landed on the last successful catch. */
  lastCaughtFish: CaughtFishResult[] = [];

  constructor(
    scene: Phaser.Scene,
    player: Player,
    bobber: Bobber,
    fishList: Fish[],
    inventory: InventorySystem,
    waterZones: WaterZone[],
    waterSurfaceY: number
  ) {
    this.scene = scene;
    this.player = player;
    this.bobber = bobber;
    this.fishList = fishList;
    this.inventory = inventory;
    this.waterZones = waterZones;
    this.waterSurfaceY = waterSurfaceY;
  }

  setWeather(weather: {
    weather: string;
    modifyStats: (
      s: import("../data/items").RodStats,
      rodId?: string | null
    ) => import("../data/items").RodStats;
    isInWhirlpool: (x: number, y: number, r?: number) => boolean;
    getRodMutationChanceBonus?: (rodId?: string | null) => number;
  }): void {
    this.weather = weather;
  }

  isBobberInWhirlpool(): boolean {
    return (
      this.weather?.isInWhirlpool(this.bobber.sprite.x, this.bobber.sprite.y) ??
      false
    );
  }

  private fishingStats() {
    const base = this.inventory.getFishingStats();
    return (
      this.weather?.modifyStats(base, this.inventory.getEquippedRodId()) ?? base
    );
  }

  private isNearAnyShore(): boolean {
    const px = this.player.sprite.x;
    for (const z of this.waterZones) {
      if (px >= z.left - 220 && px <= z.left + 100) return true;
      if (px >= z.right - 100 && px <= z.right + 220) return true;
    }
    return false;
  }

  canCast(): boolean {
    const inBoat = this.player.isOnBoat();
    const selected = this.inventory.getSelectedItem();
    const holdingRod = !!selected && !!ITEMS[selected]?.isRod;
    return (
      this.state === "idle" &&
      this.castCooldown <= 0 &&
      holdingRod &&
      (this.isNearAnyShore() || inBoat)
    );
  }

  isBusy(): boolean {
    return this.state !== "idle";
  }

  private pickZone(castHintX: number): WaterZone {
    for (const z of this.waterZones) {
      if (castHintX >= z.left && castHintX <= z.right) return z;
    }
    const px = this.player.sprite.x;
    let best = this.waterZones[0];
    let bestDist = Infinity;
    for (const z of this.waterZones) {
      const mid = (z.left + z.right) / 2;
      const edgeDist = Math.min(Math.abs(px - z.left), Math.abs(px - z.right));
      const d = Math.min(edgeDist, Math.abs(px - mid));
      if (d < bestDist) {
        bestDist = d;
        best = z;
      }
    }
    return best;
  }

  tryCast(pointerWorldX: number): boolean {
    if (!this.canCast()) return false;

    const zone = this.pickZone(pointerWorldX);
    const castX = Phaser.Math.Clamp(
      this.player.isOnBoat()
        ? pointerWorldX
        : pointerWorldX < this.player.sprite.x
          ? Math.min(pointerWorldX, this.player.sprite.x - 20)
          : Math.max(pointerWorldX, this.player.sprite.x + 20),
      zone.left + 40,
      zone.right - 40
    );
    const stats = this.fishingStats();
    const lineDepth = stats.lineDepth ?? 0;
    const surfaceY = this.waterSurfaceY + 16;
    const depthY = surfaceY + lineDepth * DEPTH_PX_PER_METER;

    this.state = "casting";
    this.secondFish = null;
    this.player.setLocked(true);
    this.player.setFacing(castX >= this.player.sprite.x ? "right" : "left");

    const bobberTex =
      ITEMS[this.inventory.getEquippedBobberId()]?.textureKey ?? "bobber_red";
    this.bobber.setTexture(bobberTex);

    this.pendingCast = { castX, surfaceY, depthY, zone, lineDepth };
    this.bobberOnTip = true;

    // Show bobber on the tip immediately and lock camera to it.
    const tip = this.player.getRodTip();
    this.bobber.stickTo(tip.x, tip.y, tip.x, tip.y);
    this.onCastCameraFollow?.();

    this.player.playFishCast(this.inventory.getEquippedRodId(), () => {
      this.releaseBobberCast();
    });

    return true;
  }

  /** Launch the bobber when the rod snaps forward. */
  private releaseBobberCast(): void {
    if (!this.pendingCast || !this.bobberOnTip) return;
    const { castX, surfaceY, depthY, zone, lineDepth } = this.pendingCast;
    this.pendingCast = undefined;
    this.bobberOnTip = false;

    const tip = this.player.getRodTip();
    const flightMs = this.bobber.castTo(
      tip.x,
      tip.y,
      castX,
      surfaceY,
      depthY
    );

    const waitMs =
      flightMs +
      30 +
      (lineDepth > 0 ? 280 + lineDepth * DEPTH_PX_PER_METER * 4 : 0);
    this.scene.time.delayedCall(waitMs, () => {
      if (this.state !== "casting") return;
      this.state = "waiting";
      this.player.playFishWait();
      this.pickAndApproachFish(castX, depthY, zone);
    });
  }

  private pickAndApproachFish(
    bobberX: number,
    bobberY: number,
    zone: WaterZone
  ): void {
    const stats = this.fishingStats();
    const reach = rodMaxReachPx(stats.lineDepth ?? 0);
    const luck = stats.luck ?? 0;
    const attract = this.inventory.getAttractRadius();
    const inReach = (f: Fish) => f.depthBelowSurface() <= reach + 6;
    const nearBobber = (f: Fish) =>
      f.distanceTo(bobberX, bobberY) <= attract;

    let pool = this.fishList.filter(
      (f) =>
        f.state === "idle" &&
        inReach(f) &&
        nearBobber(f) &&
        f.sprite.x >= zone.left - 40 &&
        f.sprite.x <= zone.right + 40
    );

    if (pool.length === 0) {
      pool = this.fishList.filter(
        (f) => f.state === "idle" && inReach(f) && nearBobber(f)
      );
    }

    if (pool.length === 0) {
      const deepNearby = this.fishList.some(
        (f) =>
          f.state === "idle" &&
          nearBobber(f) &&
          !inReach(f) &&
          f.sprite.x >= zone.left - 40 &&
          f.sprite.x <= zone.right + 40
      );
      if (deepNearby) this.onLineTooShort?.();
      this.onNoBite?.();
      this.cancelCast();
      return;
    }

    const racers = pool.filter((f) => !f.ignoresBobber());
    this.approachingFish = racers;
    this.targetFish = null;
    this.waitingSince = this.scene.time.now;
    for (const fish of racers) {
      const rarity = ITEMS[fish.speciesId].rarity ?? "common";
      const speedMult = luckApproachSpeedMult(luck, rarity);
      fish.approachBobber(bobberX, bobberY + 12, speedMult);
    }
  }

  update(delta: number): void {
    if (this.castCooldown > 0) {
      this.castCooldown -= delta;
    }

    if (this.bobberOnTip) {
      const tip = this.player.getRodTip();
      this.bobber.stickTo(tip.x, tip.y, tip.x, tip.y);
    } else if (this.bobber.active) {
      const tip = this.player.getRodTip();
      this.bobber.updateLine(tip.x, tip.y);
    }

    if (this.state === "waiting") {
      this.updateRace();
    } else if (this.state === "second_wait") {
      this.updateSecondWait();
    }
  }

  private updateRace(): void {
    const bx = this.bobber.sprite.x;
    const by = this.bobber.sprite.y + 8;
    let winner: Fish | null = null;
    let stillRacing = 0;
    const attract = this.inventory.getAttractRadius();
    const reach = rodMaxReachPx(this.fishingStats().lineDepth ?? 0);

    for (const fish of this.approachingFish) {
      if (fish.state === "approaching") {
        fish.updateApproachTarget(bx, by);
        stillRacing++;
        if (!winner && fish.distanceTo(bx, by) < fish.biteRadius()) {
          winner = fish;
        }
      }
    }

    if (!winner) {
      for (const fish of this.fishList) {
        if (
          fish.state === "idle" &&
          !fish.isDespawning() &&
          fish.ignoresBobber() &&
          fish.depthBelowSurface() <= reach + 6 &&
          fish.distanceTo(bx, by) < fish.biteRadius()
        ) {
          winner = fish;
          break;
        }
      }
    }

    if (winner) {
      this.targetFish = winner;
      const dual = this.inventory.getBobberHooks() === 2;
      if (dual) {
        // Keep other racers going for a second hook
        this.approachingFish = this.approachingFish.filter(
          (f) => f === winner || f.state === "approaching"
        );
        this.beginSecondWait();
      } else {
        for (const fish of this.approachingFish) {
          if (fish !== winner && fish.state === "approaching") {
            fish.abortApproach();
          }
        }
        this.approachingFish = [winner];
        this.triggerBiteAndMinigame();
      }
      return;
    }

    if (stillRacing === 0 && this.approachingFish.length > 0) {
      this.approachingFish = [];
    }

    const waited = this.scene.time.now - this.waitingSince;
    if (this.approachingFish.length === 0 && waited > 7000) {
      this.cancelCast();
      return;
    }

    if (this.approachingFish.length === 0) {
      const baitNearby = this.fishList.some(
        (f) =>
          f.state === "idle" &&
          !f.isDespawning() &&
          f.ignoresBobber() &&
          f.depthBelowSurface() <= reach + 6 &&
          f.distanceTo(bx, by) <= attract
      );
      if (!baitNearby) {
        this.cancelCast();
      }
    }
  }

  private beginSecondWait(): void {
    if (!this.targetFish) return;
    this.state = "second_wait";
    this.targetFish.markBitten();
    this.secondWaitUntil = this.scene.time.now + SECOND_BITE_WAIT_MS;
    const rarity = ITEMS[this.targetFish.speciesId].rarity ?? "common";
    const bangColor =
      rarity === "common" ? "#ff2222" : RARITY_COLOR[rarity];
    this.player.showExclamation(bangColor);
    this.onBite?.(this.targetFish.speciesId);
  }

  private updateSecondWait(): void {
    if (!this.targetFish) {
      this.cancelCast();
      return;
    }
    const bx = this.bobber.sprite.x;
    const by = this.bobber.sprite.y + 8;
    const reach = rodMaxReachPx(this.fishingStats().lineDepth ?? 0);
    let second: Fish | null = null;

    for (const fish of this.approachingFish) {
      if (fish === this.targetFish) continue;
      if (fish.state === "approaching") {
        fish.updateApproachTarget(bx, by);
        if (fish.distanceTo(bx, by) < fish.biteRadius()) {
          second = fish;
          break;
        }
      }
    }

    if (!second) {
      for (const fish of this.fishList) {
        if (
          fish !== this.targetFish &&
          fish.state === "idle" &&
          !fish.isDespawning() &&
          fish.ignoresBobber() &&
          fish.depthBelowSurface() <= reach + 6 &&
          fish.distanceTo(bx, by) < fish.biteRadius()
        ) {
          second = fish;
          break;
        }
      }
    }

    if (second) {
      this.secondFish = second;
      second.markBitten();
      for (const fish of this.approachingFish) {
        if (
          fish !== this.targetFish &&
          fish !== second &&
          fish.state === "approaching"
        ) {
          fish.abortApproach();
        }
      }
      this.approachingFish = [this.targetFish, second];
      this.state = "bite";
      this.scene.time.delayedCall(500, () => {
        if (this.state !== "bite") return;
        this.state = "minigame";
        this.onMinigameStart?.();
      });
      return;
    }

    if (this.scene.time.now >= this.secondWaitUntil) {
      for (const fish of this.approachingFish) {
        if (fish !== this.targetFish && fish.state === "approaching") {
          fish.abortApproach();
        }
      }
      this.approachingFish = this.targetFish ? [this.targetFish] : [];
      this.secondFish = null;
      this.state = "bite";
      this.scene.time.delayedCall(400, () => {
        if (this.state !== "bite") return;
        this.state = "minigame";
        this.onMinigameStart?.();
      });
    }
  }

  private releaseApproaching(except?: Fish | null): void {
    for (const fish of this.approachingFish) {
      if (except && fish === except) continue;
      if (fish.state === "approaching") fish.abortApproach();
    }
    this.approachingFish = except ? [except] : [];
  }

  private triggerBiteAndMinigame(): void {
    if (!this.targetFish) return;
    this.state = "bite";
    this.targetFish.markBitten();
    const rarity = ITEMS[this.targetFish.speciesId].rarity ?? "common";
    const bangColor =
      rarity === "common" ? "#ff2222" : RARITY_COLOR[rarity];
    this.player.showExclamation(bangColor);
    this.onBite?.(this.targetFish.speciesId);

    this.scene.time.delayedCall(700, () => {
      if (this.state !== "bite") return;
      this.state = "minigame";
      this.onMinigameStart?.();
    });
  }

  private resolveMutationFor(fish: Fish): FishMutationId | null {
    // Whirlpool always grants Thunder
    if (
      this.weather?.isInWhirlpool(this.bobber.sprite.x, this.bobber.sprite.y)
    ) {
      return "thunder";
    }
    // Dolphins: half chance for rod / mutation-bobber / full-moon rolls
    const dolphinMult = fish.speciesId === "dolphin" ? 0.5 : 1;
    // Full Moon: Lunar 5% / Moonlight 10% on unmutated fish
    if (this.weather?.weather === "fullmoon" && !fish.mutation) {
      const moonMut = rollFullMoonMutation(dolphinMult);
      if (moonMut) return moonMut;
    }
    // Sunny: Tanned 10% on unmutated fish
    if (this.weather?.weather === "sunny" && !fish.mutation) {
      const sunMut = rollSunnyMutation(dolphinMult);
      if (sunMut) return sunMut;
    }
    const rodId = this.inventory.getEquippedRodId();
    const rodChanceBonus =
      this.weather?.getRodMutationChanceBonus?.(rodId) ?? 0;
    return resolveCatchMutation(
      rodId,
      fish.mutation,
      this.inventory.getMutationChanceMult(),
      rodChanceBonus,
      dolphinMult
    );
  }

  completeCatch(success: boolean): void {
    this.player.hideExclamation();
    this.bobber.reelIn();
    this.player.setLocked(false);
    this.castCooldown = 500;
    this.onCastCameraRelease?.();

    const hooked = [this.targetFish, this.secondFish].filter(
      (f): f is Fish => f != null
    );
    for (const fish of this.approachingFish) {
      if (!hooked.includes(fish) && fish.state === "approaching") {
        fish.abortApproach();
      }
    }

    this.lastCaughtFish = [];
    if (success && hooked.length > 0) {
      for (const fish of hooked) {
        fish.markCaught();
        const mutation = this.resolveMutationFor(fish);
        const size = fish.size;
        this.inventory.addItem(fish.speciesId, 1, mutation, size);
        this.lastCaughtFish.push({
          speciesId: fish.speciesId,
          mutation,
          size,
        });
        this.scene.time.delayedCall(2500, () => {
          if (ITEMS[fish.speciesId].abundanceOnly) {
            const idx = this.fishList.indexOf(fish);
            if (idx >= 0) this.fishList.splice(idx, 1);
            this.onAbundanceFishRemoved?.(fish);
            fish.destroy();
          } else {
            fish.resetIdle();
          }
        });
      }
      this.lastCatchMutation = this.lastCaughtFish[0]?.mutation ?? null;
      this.lastCatchSize = this.lastCaughtFish[0]?.size ?? null;
    } else {
      this.lastCatchMutation = null;
      this.lastCatchSize = null;
      for (const fish of hooked) {
        if (
          ITEMS[fish.speciesId].abundanceOnly &&
          !this.isAbundanceActive?.()
        ) {
          const idx = this.fishList.indexOf(fish);
          if (idx >= 0) this.fishList.splice(idx, 1);
          this.onAbundanceFishRemoved?.(fish);
          fish.destroy();
        } else {
          fish.resetIdle();
        }
      }
    }

    this.approachingFish = [];
    this.targetFish = null;
    this.secondFish = null;
    this.state = "idle";
    this.onFishingEnd?.(success);
  }

  getTargetSpeciesId() {
    return this.targetFish?.speciesId ?? null;
  }

  getSecondSpeciesId() {
    return this.secondFish?.speciesId ?? null;
  }

  getTargetSize(): FishSizeId {
    return this.targetFish?.size ?? "normal";
  }

  getSecondSize(): FishSizeId {
    return this.secondFish?.size ?? "normal";
  }

  getTargetMutation(): FishMutationId | null {
    return this.targetFish?.mutation ?? null;
  }

  getSecondMutation(): FishMutationId | null {
    return this.secondFish?.mutation ?? null;
  }

  hasSecondFish(): boolean {
    return this.secondFish != null;
  }

  cancelCast(): void {
    this.bobberOnTip = false;
    this.pendingCast = undefined;
    this.player.hideExclamation();
    this.bobber.reelIn();
    this.player.setLocked(false);
    this.onCastCameraRelease?.();
    this.releaseApproaching(null);
    for (const fish of [this.targetFish, this.secondFish]) {
      if (!fish || fish.state === "caught") continue;
      if (fish.state === "approaching") fish.abortApproach();
      else if (fish.state === "bitten") fish.resetIdle();
    }
    this.approachingFish = [];
    this.targetFish = null;
    this.secondFish = null;
    this.state = "idle";
    this.castCooldown = 400;
  }
}
