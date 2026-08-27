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
  rollWorldMutation,
  rollFullMoonMutation,
  rollSunnyMutation,
  FishMutationId,
  FishSizeId,
  luckApproachSpeedMult,
  fishRarityRank,
  PORTAL_PULL_RADIUS_PX,
} from "../data/items";
import {
  playPortalPullFx,
  PortalRodTipVfx,
} from "../fx/PortalRodFx";

/** Successful Tranquil catches needed before the bubble minigame procs. */
const TRANQUIL_BUBBLE_CATCHES = 2;

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

  private portalTipFx: PortalRodTipVfx | null = null;
  private portalPullUsed = false;

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

  private tranquilBubbleProc = false;
  private tranquilBubbleCatchCountdown = TRANQUIL_BUBBLE_CATCHES;

  private shouldShowTranquilBubble(): boolean {
    return (
      ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
      "tranquil_bubble"
    );
  }

  private hasPortalPull(): boolean {
    return (
      ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
      "portal_pull"
    );
  }

  private syncPortalTipFx(): void {
    if (!this.hasPortalPull() || this.state === "idle") {
      this.portalTipFx?.setActive(false);
      return;
    }
    if (!this.portalTipFx) {
      this.portalTipFx = new PortalRodTipVfx(this.scene);
    }
    this.portalTipFx.setActive(true);
    const tip = this.player.getRodTip();
    this.portalTipFx.update(tip.x, tip.y, this.scene.time.now);
  }

  private stopPortalFx(): void {
    this.portalTipFx?.setActive(false);
    this.portalPullUsed = false;
  }

  private applyTranquilBubble(fish: Fish): void {
    if (this.tranquilBubbleProc) {
      fish.setTranquilBubble(true);
    }
  }

  /** Bubble minigame procs after 2 Tranquil catches; failures reset the streak. */
  private rollTranquilBubble(): void {
    this.tranquilBubbleProc = false;
    if (!this.shouldShowTranquilBubble()) return;
    this.tranquilBubbleProc = this.tranquilBubbleCatchCountdown <= 0;
  }

  private advanceTranquilBubbleCounter(success: boolean): void {
    if (this.inventory.getEquippedRodId() !== "tranquil_rod") return;
    if (!success) {
      this.tranquilBubbleCatchCountdown = TRANQUIL_BUBBLE_CATCHES;
      return;
    }
    if (this.tranquilBubbleProc) {
      this.tranquilBubbleCatchCountdown = TRANQUIL_BUBBLE_CATCHES;
      return;
    }
    this.tranquilBubbleCatchCountdown = Math.max(
      0,
      this.tranquilBubbleCatchCountdown - 1
    );
  }

  getTranquilBubbleProc(): boolean {
    return this.tranquilBubbleProc;
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
    const rodId = this.inventory.getEquippedRodId();
    let lineDepth = stats.lineDepth ?? 0;
    if (rodId === "tranquil_rod") {
      const roll = Math.random();
      if (roll < 0.15) lineDepth += 2;
      else if (roll < 0.55) lineDepth += 1;
    }
    const bobStats = ITEMS[this.inventory.getEquippedBobberId()]?.bobberStats;
    if (bobStats?.lineDepthOverride != null) {
      lineDepth = bobStats.lineDepthOverride;
    }
    const surfaceY = this.waterSurfaceY + 16;
    const depthY = surfaceY + lineDepth * DEPTH_PX_PER_METER;

    this.state = "casting";
    this.secondFish = null;
    this.portalPullUsed = false;
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

    const skinId = this.inventory.getActiveRodSkinId(rodId);
    this.player.playFishCast(
      rodId,
      () => {
        this.releaseBobberCast();
      },
      skinId === "default" ? null : skinId
    );

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

    if (pool.length === 0 && !this.hasPortalPull()) {
      const deepNearby = this.fishList.some(
        (f) =>
          f.state === "idle" &&
          nearBobber(f) &&
          !inReach(f) &&
          f.sprite.x >= zone.left - 40 &&
          f.sprite.x <= zone.right + 40
      );
      if (deepNearby) this.onLineTooShort?.();
    }

    this.approachingFish = [];
    this.targetFish = null;

    if (this.hasPortalPull()) {
      this.portalPullRarestFish(bobberX, bobberY, zone, reach);
    }

    const racers = pool.filter((f) => !f.ignoresBobber());
    for (const fish of racers) {
      if (this.approachingFish.includes(fish)) continue;
      const rarity = ITEMS[fish.speciesId].rarity ?? "common";
      const speedMult = luckApproachSpeedMult(luck, rarity);
      fish.approachBobber(bobberX, bobberY + 12, speedMult);
      this.approachingFish.push(fish);
    }
  }

  /** Portal Rod — warp the rarest idle fish within 400px to the bobber once per cast. */
  private portalPullRarestFish(
    bobberX: number,
    bobberY: number,
    zone: WaterZone,
    reach: number
  ): void {
    if (this.portalPullUsed) return;

    const candidates = this.fishList.filter(
      (f) =>
        f.state === "idle" &&
        !f.isDespawning() &&
        !f.ignoresBobber() &&
        f.depthBelowSurface() <= reach + 6 &&
        f.distanceTo(bobberX, bobberY) <= PORTAL_PULL_RADIUS_PX &&
        f.sprite.x >= zone.left - 40 &&
        f.sprite.x <= zone.right + 40
    );
    if (candidates.length === 0) return;

    candidates.sort(
      (a, b) => fishRarityRank(b.speciesId) - fishRarityRank(a.speciesId)
    );
    const fish = candidates[0];
    this.portalPullUsed = true;

    const fromX = fish.sprite.x;
    const fromY = fish.sprite.y;
    const angle = Phaser.Math.Angle.Between(bobberX, bobberY, fromX, fromY);
    const landX = bobberX + Math.cos(angle) * 52;
    const landY = bobberY + Math.sin(angle) * 52;
    const stats = this.fishingStats();
    const luck = stats.luck ?? 0;
    const rarity = ITEMS[fish.speciesId].rarity ?? "common";
    const speedMult = luckApproachSpeedMult(luck, rarity) * 1.75;

    playPortalPullFx(
      this.scene,
      fish,
      fromX,
      fromY,
      landX,
      landY,
      () => {
        if (this.state !== "waiting" && this.state !== "second_wait") return;
        fish.approachBobber(bobberX, bobberY + 12, speedMult);
        if (!this.approachingFish.includes(fish)) {
          this.approachingFish.push(fish);
        }
      }
    );
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

    this.syncPortalTipFx();
  }

  private updateRace(): void {
    const bx = this.bobber.sprite.x;
    const by = this.bobber.sprite.y + 8;
    let winner: Fish | null = null;
    let stillRacing = 0;
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
  }

  private beginSecondWait(): void {
    if (!this.targetFish) return;
    this.state = "second_wait";
    this.rollTranquilBubble();
    this.targetFish.markBitten();
    this.applyTranquilBubble(this.targetFish);
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
    this.rollTranquilBubble();
    this.targetFish.markBitten();
    this.applyTranquilBubble(this.targetFish);
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

  private resolveMutationFor(
    fish: Fish,
    meta?: {
      guaranteeThunder?: boolean;
      guaranteeAshencast?: boolean;
      guaranteeConfetti?: boolean;
      recoilKicks?: number;
      bubbleCatch?: boolean;
    }
  ): FishMutationId | null {
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
    // Bubble catch: 75% Tranquil on unmutated fish
    if (meta?.bubbleCatch && !fish.mutation) {
      if (Math.random() < 0.75) return "tranquil";
    }
    const rodId = this.inventory.getEquippedRodId();
    const rodChanceBonus =
      this.weather?.getRodMutationChanceBonus?.(rodId) ?? 0;
    const mutMult = this.inventory.getMutationChanceMult();

    // 4+ Recoil blasts: always Ash or Blasted on ANY fish (ignores color tags).
    // 25% Ash / 75% Blasted — mutually exclusive so you always get one.
    if (
      (meta?.recoilKicks ?? 0) >= 4 &&
      rodId === "recoil_rod" &&
      !fish.mutation
    ) {
      if (mutMult > 1) {
        const boosted = rollWorldMutation(mutMult * dolphinMult);
        if (boosted) return boosted;
      }
      return Math.random() < 0.75 ? "blasted" : "ash";
    }

    return resolveCatchMutation(
      rodId,
      fish.speciesId,
      fish.mutation,
      mutMult,
      rodChanceBonus,
      dolphinMult
    );
  }

  completeCatch(
    success: boolean,
    meta?: {
      guaranteeThunder?: boolean;
      guaranteeAshencast?: boolean;
      guaranteeConfetti?: boolean;
      recoilKicks?: number;
      bubbleCatch?: boolean;
    }
  ): void {
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
        const mutation =
          meta?.guaranteeThunder && !fish.mutation
            ? // Electrified Zeus bar: only if fish has no mutation already
              // 75% Electric (2.5×), 25% Thunder (5×)
              Math.random() < 0.25
                ? ("thunder" as const)
                : ("electric" as const)
            : meta?.guaranteeThunder && fish.mutation
              ? fish.mutation
              : meta?.guaranteeAshencast
                ? ("ashencast" as const)
                : meta?.guaranteeConfetti
                  ? ("confetti" as const)
                  : this.resolveMutationFor(fish, meta);
        const size = fish.size;
        const added = this.inventory.addItem(
          fish.speciesId,
          1,
          mutation,
          size
        );
        const persist = !!ITEMS[fish.speciesId].persistOnFail;
        if (!added && persist) {
          // Bag full / already owned — keep the world floater alive.
          fish.resetIdle();
          continue;
        }
        fish.markCaught();
        if (added) {
          this.lastCaughtFish.push({
            speciesId: fish.speciesId,
            mutation,
            size,
          });
          if (this.inventory.getEquippedRodId() === "recoil_rod") {
            this.inventory.recordRecoilMasteryCatch(1);
          }
        }
        this.scene.time.delayedCall(2500, () => {
          if (
            ITEMS[fish.speciesId].abundanceOnly ||
            ITEMS[fish.speciesId].persistOnFail
          ) {
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
        // Quest / persist floaters always stay in the water on a failed fight.
        if (ITEMS[fish.speciesId].persistOnFail) {
          fish.resetIdle();
          continue;
        }
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
    this.advanceTranquilBubbleCounter(success);
    this.tranquilBubbleProc = false;
    this.stopPortalFx();
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

  popTargetTranquilBubble(): void {
    this.targetFish?.popTranquilBubble();
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
    this.tranquilBubbleProc = false;
    this.stopPortalFx();
    this.state = "idle";
    this.castCooldown = 400;
  }
}
