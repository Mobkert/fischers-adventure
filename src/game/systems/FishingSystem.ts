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
  rollCatchMutation,
  FishMutationId,
  FishSizeId,
  luckApproachSpeedMult,
} from "../data/items";

export type FishingState =
  | "idle"
  | "casting"
  | "waiting"
  | "bite"
  | "minigame";

export interface WaterZone {
  left: number;
  right: number;
}

/** How close a fish must be to race the bobber. */
const ATTRACT_RADIUS = 340;

export class FishingSystem {
  state: FishingState = "idle";
  private player: Player;
  private bobber: Bobber;
  private fishList: Fish[];
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private waterZones: WaterZone[];
  private waterSurfaceY: number;
  private targetFish: Fish | null = null;
  /** All fish currently racing the bobber — first to arrive wins. */
  private approachingFish: Fish[] = [];
  private castCooldown = 0;
  /** When waiting started (ms) — timeout if nothing bites. */
  private waitingSince = 0;

  onBite?: (speciesId: ItemId) => void;
  onMinigameStart?: () => void;
  onFishingEnd?: (success: boolean) => void;
  onLineTooShort?: () => void;
  /** Camera should follow the bobber while the line is out. */
  onCastCameraFollow?: () => void;
  /** Restore camera to the player when fishing ends. */
  onCastCameraRelease?: () => void;
  /** Mutation applied on the last successful catch (if any). */
  lastCatchMutation: FishMutationId | null = null;
  /** Size effect on the last successful catch. */
  lastCatchSize: FishSizeId | null = null;

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

  private isNearAnyShore(): boolean {
    const px = this.player.sprite.x;
    for (const z of this.waterZones) {
      // Land on the left of this water (east shore / dock)
      if (px >= z.left - 220 && px <= z.left + 100) return true;
      // Land on the right of this water (west shore)
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
    // Prefer zone containing the click / hint
    for (const z of this.waterZones) {
      if (castHintX >= z.left && castHintX <= z.right) return z;
    }
    // Else nearest zone to the player
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
    const lineDepth = this.inventory.getEquippedRodStats().lineDepth ?? 0;
    const surfaceY = this.waterSurfaceY + 16;
    const depthY = surfaceY + lineDepth * DEPTH_PX_PER_METER;

    this.state = "casting";
    this.player.setLocked(true);
    this.player.playFishCast(this.inventory.getEquippedRodId());

    // Face toward the cast
    this.player.setFacing(castX >= this.player.sprite.x ? "right" : "left");

    const tip = this.player.getRodTip();
    this.bobber.castTo(tip.x, tip.y, castX, surfaceY, depthY);
    this.onCastCameraFollow?.();

    // Wait for cast + sink before attracting fish
    const waitMs = 480 + (lineDepth > 0 ? 280 + lineDepth * DEPTH_PX_PER_METER * 4 : 0);
    this.scene.time.delayedCall(waitMs, () => {
      if (this.state !== "casting") return;
      this.state = "waiting";
      this.player.playFishWait();
      this.pickAndApproachFish(castX, depthY, zone);
    });

    return true;
  }

  private pickAndApproachFish(
    bobberX: number,
    bobberY: number,
    zone: WaterZone
  ): void {
    const reach = rodMaxReachPx(
      this.inventory.getEquippedRodStats().lineDepth ?? 0
    );
    const luck = this.inventory.getEquippedRodStats().luck ?? 0;
    const inReach = (f: Fish) => f.depthBelowSurface() <= reach + 6;
    const nearBobber = (f: Fish) =>
      f.distanceTo(bobberX, bobberY) <= ATTRACT_RADIUS;

    // Prefer fish near the bobber in this water zone + within line depth
    let pool = this.fishList.filter(
      (f) =>
        f.state === "idle" &&
        inReach(f) &&
        nearBobber(f) &&
        f.sprite.x >= zone.left - 40 &&
        f.sprite.x <= zone.right + 40
    );

    // Fallback: any idle fish in reach near the bobber (any zone)
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
      this.cancelCast();
      return;
    }

    // Mushrooms etc. ignore bait — racers chase; ignore-bait stay idle until contact
    const racers = pool.filter((f) => !f.ignoresBobber());
    this.approachingFish = racers;
    this.targetFish = null;
    this.waitingSince = this.scene.time.now;
    for (const fish of racers) {
      const rarity = ITEMS[fish.speciesId].rarity ?? "common";
      const speedMult = luckApproachSpeedMult(luck, rarity);
      fish.approachBobber(bobberX, bobberY + 12, speedMult);
    }
    // If only ignore-bait nearby, wait for the bobber to float onto them
  }

  update(delta: number): void {
    if (this.castCooldown > 0) {
      this.castCooldown -= delta;
    }

    if (this.bobber.active) {
      const tip = this.player.getRodTip();
      this.bobber.updateLine(tip.x, tip.y);
    }

    if (this.state === "waiting") {
      this.updateRace();
    }
  }

  /** Steer all racers; first fish into bite range wins the hook. */
  private updateRace(): void {
    const bx = this.bobber.sprite.x;
    const by = this.bobber.sprite.y + 8;
    let winner: Fish | null = null;
    let stillRacing = 0;

    for (const fish of this.approachingFish) {
      if (fish.state === "approaching") {
        fish.updateApproachTarget(bx, by);
        stillRacing++;
        if (!winner && fish.distanceTo(bx, by) < fish.biteRadius()) {
          winner = fish;
        }
      }
    }

    // Ignore-bait fish (mushroom cluster): hook if bobber floats onto them
    // Skip despawning mushrooms — bobber nearby must not keep them around
    if (!winner) {
      const reach = rodMaxReachPx(
        this.inventory.getEquippedRodStats().lineDepth ?? 0
      );
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
      // Losers peel off — only one gets the hook
      for (const fish of this.approachingFish) {
        if (fish !== winner && fish.state === "approaching") {
          fish.abortApproach();
        }
      }
      this.approachingFish = [winner];
      this.triggerBite();
      return;
    }

    if (stillRacing === 0 && this.approachingFish.length > 0) {
      // Racers gave up — keep waiting briefly for ignore-bait contact
      this.approachingFish = [];
    }

    // Timeout empty waits (e.g. mushroom drift never hits the bobber)
    const waited = this.scene.time.now - this.waitingSince;
    if (this.approachingFish.length === 0 && waited > 7000) {
      this.cancelCast();
      return;
    }

    // No racers and no ignore-bait in attract range → cancel
    if (this.approachingFish.length === 0) {
      const reach = rodMaxReachPx(
        this.inventory.getEquippedRodStats().lineDepth ?? 0
      );
      const baitNearby = this.fishList.some(
        (f) =>
          f.state === "idle" &&
          !f.isDespawning() &&
          f.ignoresBobber() &&
          f.depthBelowSurface() <= reach + 6 &&
          f.distanceTo(bx, by) <= ATTRACT_RADIUS
      );
      if (!baitNearby) {
        this.cancelCast();
      }
    }
  }

  private releaseApproaching(except?: Fish | null): void {
    for (const fish of this.approachingFish) {
      if (except && fish === except) continue;
      if (fish.state === "approaching") fish.abortApproach();
    }
    this.approachingFish = except ? [except] : [];
  }

  private triggerBite(): void {
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

  completeCatch(success: boolean): void {
    this.player.hideExclamation();
    this.bobber.reelIn();
    this.player.setLocked(false);
    this.castCooldown = 500;
    this.onCastCameraRelease?.();
    this.releaseApproaching(this.targetFish);

    if (success && this.targetFish) {
      this.targetFish.markCaught();
      const mutation = rollCatchMutation(this.inventory.getEquippedRodId());
      const size = this.targetFish.size;
      this.lastCatchMutation = mutation;
      this.lastCatchSize = size;
      this.inventory.addItem(this.targetFish.speciesId, 1, mutation, size);
      const fish = this.targetFish;
      this.scene.time.delayedCall(2500, () => {
        fish.resetIdle();
      });
    } else if (this.targetFish) {
      this.lastCatchMutation = null;
      this.lastCatchSize = null;
      this.targetFish.resetIdle();
    } else {
      this.lastCatchMutation = null;
      this.lastCatchSize = null;
    }

    this.approachingFish = [];
    this.targetFish = null;
    this.state = "idle";
    this.onFishingEnd?.(success);
  }

  getTargetSpeciesId() {
    return this.targetFish?.speciesId ?? null;
  }

  getTargetSize(): FishSizeId {
    return this.targetFish?.size ?? "normal";
  }

  cancelCast(): void {
    this.player.hideExclamation();
    this.bobber.reelIn();
    this.player.setLocked(false);
    this.onCastCameraRelease?.();
    this.releaseApproaching(null);
    if (this.targetFish && this.targetFish.state !== "caught") {
      if (this.targetFish.state === "approaching") {
        this.targetFish.abortApproach();
      } else if (this.targetFish.state === "bitten") {
        this.targetFish.resetIdle();
      }
    }
    this.approachingFish = [];
    this.targetFish = null;
    this.state = "idle";
    this.castCooldown = 400;
  }
}
