import {
  FISH_ITEM_IDS,
  FISH_SIZES,
  HOTBAR_SIZE,
  MAX_INVENTORY_SIZE,
  ITEMS,
  ItemId,
  InventorySlot,
  MUTATIONS,
  RodStats,
  ZERO_ROD_STATS,
  ROD_ITEM_IDS,
  AMULET_ITEM_IDS,
  FishMutationId,
  FishSizeId,
  mutationSellMult,
  sizeSellMult,
  BESTIARY_CLAIM_REWARD,
  BESTIARY_AREAS,
  FishHabitat,
  BASE_ATTRACT_RADIUS,
  backpackSlotCount,
  backpackTier,
  AugmentStatKey,
  AugmentUpgrades,
  ZERO_AUGMENT_UPGRADES,
  AUGMENT_UPGRADE_CAPS,
  applyAugmentUpgrades,
  augmentHasUpgradeableStat,
  STARTER_HAT_IDS,
  formatCraftIngredientLabel,
  fishMeetsMinRarity,
  isMerchantSellable,
  ORE_CLUSTER_VENDOR_PRICE,
  ORE_CLUSTER_VENDOR_STOCK_MAX,
  ORE_CLUSTER_VENDOR_RESTOCK_MS,
  rollOreFromCluster,
  BAIT_CRATE_PRICE,
  BAIT_CRATE_BUY_MAX,
  BAIT_ITEM_IDS,
  rollBaitFromCrate,
  baitHasFishTargets,
  BAIT_USE_COOLDOWN_MS,
  LimitedEditionInfo,
} from "../data/items";
import { SaveData, cloneSave, defaultSave } from "../save/SaveBank";
import type { WeatherId } from "./WeatherSystem";
import { BoatId, BOATS, BOAT_IDS } from "../data/boats";
import {
  ASTRAL_STARLINE_COST,
  ASTRAL_SURFER_CATCH_GOAL,
  ASTRAL_SURFER_STAGE3_COST,
  ASTRAL_SURFER_STAGE4_COST,
  ASTRAL_SURFER_STAGE7_COST,
  isStarlightCatch,
} from "./AstralWardenQuest";
import { RESONATED_HAT_COST } from "./ResonatedHatQuest";
import {
  FROSTPEAK_EPIC_RODS,
  FROSTPEAK_MYTHICAL_MIN_VALUE,
  FrostpeakQuestStage,
  fishSellValue,
  missingEpicRods,
  rodDisplayName,
} from "./FrostpeakQuest";
import {
  ANVIL_PIECE_IDS,
  AshencastQuestStage,
} from "./AshencastQuest";
import type { PromoCodeId } from "./PromoCodes";
import {
  isRodSkinId,
  ROD_SKINS,
  RodSkinId,
  rollSkinCrate,
  rollCrateSkin,
  crateItemId,
  crateDuplicateRefund,
  SKIN_CRATE_DUPLICATE_REFUND,
  SKIN_CRATE_PRICE,
  FROSTPEAK_CRATE_PRICE,
  SkinCrateKind,
  skinsForRod,
} from "../data/rodSkins";
import {
  VaultGemId,
  VAULT_GEM_IDS,
  VAULT_GREEN_SELL_THRESHOLD,
  isVaultGemId,
} from "./VaultGemQuest";
import {
  ActiveFishQuest,
  FishQuestIslandId,
  FISH_QUEST_HABITAT_LABEL,
  FISH_QUEST_ISLAND_NAMES,
  fishQuestCoinReward,
  rollFishQuestAmulet,
  rollFishQuestTarget,
} from "./FishQuest";
import {
  isStellarMerchantMutation,
  stellarMerchantMutationMult,
} from "./StellarMerchant";

function sameMutation(
  a: FishMutationId | null | undefined,
  b: FishMutationId | null | undefined
): boolean {
  return (a ?? null) === (b ?? null);
}

function samePaintTint(
  a: number | null | undefined,
  b: number | null | undefined
): boolean {
  return (a ?? null) === (b ?? null);
}

function sameSize(
  a: FishSizeId | null | undefined,
  b: FishSizeId | null | undefined
): boolean {
  return (a ?? "normal") === (b ?? "normal");
}

export class InventorySystem {
  hotbar: InventorySlot[] = Array.from({ length: HOTBAR_SIZE }, () => ({
    itemId: null,
    count: 0,
    mutation: null,
    size: null,
    keep: false,
  }));

  bag: InventorySlot[] = Array.from({ length: MAX_INVENTORY_SIZE }, () => ({
    itemId: null,
    count: 0,
    mutation: null,
    size: null,
    keep: false,
  }));

  /** Rods the player owns (shown in the equipment bag). */
  ownedRods: ItemId[] = ["starter_rod"];
  equippedRodId: ItemId = "starter_rod";
  ownedBobbers: ItemId[] = ["bobber_starter"];
  equippedBobberId: ItemId = "bobber_starter";
  ownedAmulets: Partial<Record<ItemId, number>> = {};
  ownedBait: Partial<Record<ItemId, number>> = {};
  /** Session-only bait cooldown — not saved (chummed fish don't persist). */
  baitCooldownUntil = 0;
  ownedBoats: BoatId[] = ["sailboat"];
  frostpeakQuestStage: FrostpeakQuestStage = 0;
  frostpeakEpicRods: ItemId[] = [];
  frostpeakWildflowerLegendary = false;
  frostpeakCaveOpen = false;
  vaultGemQuestAccepted = false;
  vaultGemsPlaced: VaultGemId[] = [];
  caveMerchantEarned = 0;
  crystalGalleryChallengeDone = false;
  crystalRodSkinOwned = false;
  crystalRodSkinActive = false;
  ownedRodSkins: string[] = [];
  activeRodSkins: Record<string, string> = {};
  ownedHats: ItemId[] = [...STARTER_HAT_IDS];
  equippedHatId: ItemId | null = null;
  nautilusQuestDone = false;
  astralStarlineDone = false;
  astralSurferQuestStage = 0;
  astralSurferStarlightCaught = false;
  astralSurferDolphinStarline = false;
  astralSurferCatchCount = 0;
  astralSurferDolphinSurfer = false;
  stellarSurferAscended = false;
  stellarSkyDiscovered = false;
  resonatedHatQuestStarted = false;
  resonatedHatDone = false;
  activeFishQuest: ActiveFishQuest | null = null;
  ashencastQuestStage: AshencastQuestStage = 0;
  oreVendorStock = ORE_CLUSTER_VENDOR_STOCK_MAX;
  /** Wall-clock ms when stock refills; 0 if stocked. */
  oreVendorRestockAt = 0;
  curioStockSave: import("./CurioTraderStock").CurioStockSave | null = null;
  redeemedPromoCodes: PromoCodeId[] = [];
  /**
   * Recoil mastery progress (set RECOIL_MASTERY_ENABLED to ship).
   * recoilMasteryAshSold stores Blasted fish sold count.
   */
  recoilMasteryCatches = 0;
  recoilMasteryAshSold = 0;
  portalMasteryLegendaries = 0;
  portalMasteryTideUses = 0;
  surferMasteryRideMs = 0;
  surferMasteryDupes = 0;
  surferMasteryEventHorizon = 0;
  backpackId: ItemId = "backpack_starter";

  selectedHotbarIndex = 0;
  coins = 0;
  bestiaryFound: ItemId[] = [];
  bestiaryClaimed: ItemId[] = [];
  augmentUpgrades: AugmentUpgrades = { ...ZERO_AUGMENT_UPGRADES };

  constructor(save?: SaveData) {
    if (save) {
      this.applySave(save);
    } else {
      this.hotbar[0] = {
        itemId: "starter_rod",
        count: 1,
        mutation: null,
        size: null,
        keep: false,
      };
      this.hotbar[1] = {
        itemId: "equipment_bag",
        count: 1,
        mutation: null,
        size: null,
        keep: false,
      };
      this.hotbar[2] = {
        itemId: "bestiary",
        count: 1,
        mutation: null,
        size: null,
        keep: false,
      };
      this.hotbar[3] = {
        itemId: "tide_compass",
        count: 1,
        mutation: null,
        size: null,
        keep: false,
      };
    }
  }

  applySave(raw: SaveData): void {
    const save = cloneSave(raw);
    this.coins = save.coins;
    this.ownedRods = [...save.ownedRods];
    this.equippedRodId = save.equippedRodId;
    this.ownedBobbers = [...save.ownedBobbers];
    this.equippedBobberId = save.equippedBobberId;
    this.ownedAmulets = { ...save.ownedAmulets };
    this.ownedBait = { ...save.ownedBait };
    this.baitCooldownUntil = 0;
    this.ownedBoats = [...save.ownedBoats];
    this.frostpeakQuestStage = save.frostpeakQuestStage;
    this.frostpeakEpicRods = [...save.frostpeakEpicRods];
    this.frostpeakWildflowerLegendary = save.frostpeakWildflowerLegendary;
    this.frostpeakCaveOpen = save.frostpeakCaveOpen;
    this.vaultGemQuestAccepted = save.vaultGemQuestAccepted;
    this.vaultGemsPlaced = [...save.vaultGemsPlaced];
    this.caveMerchantEarned = save.caveMerchantEarned;
    this.crystalGalleryChallengeDone = save.crystalGalleryChallengeDone;
    this.crystalRodSkinOwned = save.crystalRodSkinOwned;
    this.crystalRodSkinActive = save.crystalRodSkinActive;
    this.ownedRodSkins = [...save.ownedRodSkins];
    this.activeRodSkins = { ...save.activeRodSkins };
    // Keep legacy crystal flags in sync with unified skin lists
    if (this.ownedRodSkins.includes("gallery")) this.crystalRodSkinOwned = true;
    if (this.activeRodSkins["crystal_rod"] === "gallery") {
      this.crystalRodSkinActive = true;
    } else if (this.crystalRodSkinOwned && this.crystalRodSkinActive) {
      if (!this.ownedRodSkins.includes("gallery")) {
        this.ownedRodSkins.push("gallery");
      }
      this.activeRodSkins["crystal_rod"] = "gallery";
    }
    // Skins are kept even without the rod — restore pending finishes on load
    for (const skinId of this.ownedRodSkins) {
      if (!isRodSkinId(skinId)) continue;
      const def = ROD_SKINS[skinId];
      if (!this.activeRodSkins[def.rodId]) {
        this.activeRodSkins[def.rodId] = skinId;
      }
    }
    for (const rodId of this.ownedRods) {
      this.applyPendingSkinsForRod(rodId);
    }
    this.ownedHats = [...save.ownedHats];
    this.equippedHatId = save.equippedHatId;
    this.nautilusQuestDone = save.nautilusQuestDone;
    this.astralStarlineDone = save.astralStarlineDone;
    this.astralSurferQuestStage = save.astralSurferQuestStage;
    this.astralSurferStarlightCaught = save.astralSurferStarlightCaught;
    this.astralSurferDolphinStarline = save.astralSurferDolphinStarline;
    this.astralSurferCatchCount = save.astralSurferCatchCount;
    this.astralSurferDolphinSurfer = save.astralSurferDolphinSurfer;
    this.stellarSurferAscended = save.stellarSurferAscended;
    this.stellarSkyDiscovered = save.stellarSkyDiscovered;
    this.resonatedHatQuestStarted = save.resonatedHatQuestStarted;
    this.resonatedHatDone = save.resonatedHatDone;
    if (this.ownsHat("hat_resonated")) {
      this.resonatedHatDone = true;
      this.resonatedHatQuestStarted = true;
    }
    this.activeFishQuest = save.activeFishQuest
      ? { ...save.activeFishQuest }
      : null;
    this.ashencastQuestStage = save.ashencastQuestStage;
    this.oreVendorStock = save.oreVendorStock;
    this.oreVendorRestockAt = save.oreVendorRestockAt;
    this.curioStockSave = save.curioStockSave
      ? {
          nextRestockAt: save.curioStockSave.nextRestockAt,
          entries: save.curioStockSave.entries.map((e) => ({ ...e })),
        }
      : null;
    this.redeemedPromoCodes = [...save.redeemedPromoCodes];
    this.recoilMasteryCatches = save.recoilMasteryCatches;
    this.recoilMasteryAshSold = save.recoilMasteryAshSold;
    this.portalMasteryLegendaries = save.portalMasteryLegendaries ?? 0;
    this.portalMasteryTideUses = save.portalMasteryTideUses ?? 0;
    this.surferMasteryRideMs = save.surferMasteryRideMs ?? 0;
    this.surferMasteryDupes = save.surferMasteryDupes ?? 0;
    this.surferMasteryEventHorizon = save.surferMasteryEventHorizon ?? 0;
    this.backpackId = save.backpackId;
    this.selectedHotbarIndex = save.selectedHotbarIndex;
    this.hotbar = save.hotbar.map((s) => ({ ...s }));
    this.bag = save.bag.map((s) => ({ ...s }));
    while (this.bag.length < MAX_INVENTORY_SIZE) {
      this.bag.push({
        itemId: null,
        count: 0,
        mutation: null,
        size: null,
        keep: false,
      });
    }
    this.bestiaryFound = [...save.bestiaryFound];
    this.bestiaryClaimed = [...save.bestiaryClaimed];
    this.augmentUpgrades = { ...save.augmentUpgrades };
    // Keep bag / equipment bag / bestiary / tide compass consistent
    this.hotbar[1] = {
      itemId: "equipment_bag",
      count: 1,
      mutation: null,
      size: null,
      keep: false,
    };
    this.hotbar[2] = {
      itemId: "bestiary",
      count: 1,
      mutation: null,
      size: null,
      keep: false,
    };
    this.hotbar[3] = {
      itemId: "tide_compass",
      count: 1,
      mutation: null,
      size: null,
      keep: false,
    };
    if (!this.ownsRod(this.equippedRodId)) {
      this.equippedRodId = "starter_rod";
    }
    if (!this.ownsBobber(this.equippedBobberId)) {
      this.equippedBobberId = "bobber_starter";
    }
    this.hotbar[0] = {
      itemId: this.equippedRodId,
      count: 1,
      mutation: null,
      size: null,
      keep: false,
    };
    this.stripUnearnedAstralRods();
    this.ensureSurferMasteryRewards();
  }

  /**
   * Remove free Stellar Surfer / Star Line until earned via Astral Warden.
   */
  private stripUnearnedAstralRods(): void {
    const keepSurfer =
      this.stellarSurferAscended || this.astralSurferQuestStage >= 3;
    if (!keepSurfer && this.ownsRod("test_rod")) {
      this.ownedRods = this.ownedRods.filter((id) => id !== "test_rod");
      if (this.equippedRodId === "test_rod") {
        this.equippedRodId = "starter_rod";
        this.hotbar[0] = {
          itemId: "starter_rod",
          count: 1,
          mutation: null,
          size: null,
          keep: false,
        };
      }
    }
    if (!this.stellarSurferAscended) {
      this.ownedBoats = this.ownedBoats.filter((id) => id !== "stellar_surfer");
    }
    if (!this.astralStarlineDone && this.ownsRod("star_line_rod")) {
      // Keep Star Line if Surfer quest already past stage 1 (needed it)
      if (this.astralSurferQuestStage < 1) {
        this.ownedRods = this.ownedRods.filter((id) => id !== "star_line_rod");
        if (this.equippedRodId === "star_line_rod") {
          this.equippedRodId = this.ownsRod("test_rod")
            ? "test_rod"
            : "starter_rod";
          this.hotbar[0] = {
            itemId: this.equippedRodId,
            count: 1,
            mutation: null,
            size: null,
            keep: false,
          };
        }
      } else {
        this.astralStarlineDone = true;
      }
    }
  }

  toSave(extra: {
    playerX: number;
    playerY: number;
    tutorialDone: boolean;
    gameMinutes: number;
    weatherId: WeatherId;
  }): SaveData {
    return cloneSave({
      ...defaultSave(),
      coins: this.coins,
      ownedRods: [...this.ownedRods],
      equippedRodId: this.equippedRodId,
      ownedBobbers: [...this.ownedBobbers],
      equippedBobberId: this.equippedBobberId,
      ownedAmulets: { ...this.ownedAmulets },
      ownedBait: { ...this.ownedBait },
      ownedBoats: [...this.ownedBoats],
      backpackId: this.backpackId,
      hotbar: this.hotbar.map((s) => ({ ...s })),
      bag: this.bag.map((s) => ({ ...s })),
      selectedHotbarIndex: this.selectedHotbarIndex,
      playerX: extra.playerX,
      playerY: extra.playerY,
      tutorialDone: extra.tutorialDone,
      bestiaryFound: [...this.bestiaryFound],
      bestiaryClaimed: [...this.bestiaryClaimed],
      augmentUpgrades: { ...this.augmentUpgrades },
      gameMinutes: extra.gameMinutes,
      weatherId: extra.weatherId,
      frostpeakQuestStage: this.frostpeakQuestStage,
      frostpeakEpicRods: [...this.frostpeakEpicRods],
      frostpeakWildflowerLegendary: this.frostpeakWildflowerLegendary,
      frostpeakCaveOpen: this.frostpeakCaveOpen,
      vaultGemQuestAccepted: this.vaultGemQuestAccepted,
      vaultGemsPlaced: [...this.vaultGemsPlaced],
      caveMerchantEarned: this.caveMerchantEarned,
      crystalGalleryChallengeDone: this.crystalGalleryChallengeDone,
      crystalRodSkinOwned:
        this.crystalRodSkinOwned || this.ownedRodSkins.includes("gallery"),
      crystalRodSkinActive:
        this.activeRodSkins["crystal_rod"] === "gallery" ||
        this.crystalRodSkinActive,
      ownedRodSkins: [...this.ownedRodSkins],
      activeRodSkins: { ...this.activeRodSkins },
      ownedHats: [...this.ownedHats],
      equippedHatId: this.equippedHatId,
      nautilusQuestDone: this.nautilusQuestDone,
      astralStarlineDone: this.astralStarlineDone,
      astralSurferQuestStage: this.astralSurferQuestStage,
      astralSurferStarlightCaught: this.astralSurferStarlightCaught,
      astralSurferDolphinStarline: this.astralSurferDolphinStarline,
      astralSurferCatchCount: this.astralSurferCatchCount,
      astralSurferDolphinSurfer: this.astralSurferDolphinSurfer,
      stellarSurferAscended: this.stellarSurferAscended,
      stellarSkyDiscovered: this.stellarSkyDiscovered,
      resonatedHatQuestStarted: this.resonatedHatQuestStarted,
      resonatedHatDone: this.resonatedHatDone,
      activeFishQuest: this.activeFishQuest
        ? { ...this.activeFishQuest }
        : null,
      ashencastQuestStage: this.ashencastQuestStage,
      oreVendorStock: this.oreVendorStock,
      oreVendorRestockAt: this.oreVendorRestockAt,
      curioStockSave: this.curioStockSave
        ? {
            nextRestockAt: this.curioStockSave.nextRestockAt,
            entries: this.curioStockSave.entries.map((e) => ({ ...e })),
          }
        : null,
      redeemedPromoCodes: [...this.redeemedPromoCodes],
      recoilMasteryCatches: this.recoilMasteryCatches,
      recoilMasteryAshSold: this.recoilMasteryAshSold,
      portalMasteryLegendaries: this.portalMasteryLegendaries,
      portalMasteryTideUses: this.portalMasteryTideUses,
      surferMasteryRideMs: this.surferMasteryRideMs,
      surferMasteryDupes: this.surferMasteryDupes,
      surferMasteryEventHorizon: this.surferMasteryEventHorizon,
      updatedAt: Date.now(),
    });
  }

  markPromoRedeemed(codeId: PromoCodeId): void {
    if (!this.redeemedPromoCodes.includes(codeId)) {
      this.redeemedPromoCodes.push(codeId);
    }
  }

  /**
   * Recoil Rod mastery (rapid 3rd-kick burst).
   * Archived for now — flip to true when shipping the feature.
   */
  static readonly RECOIL_MASTERY_ENABLED = true;
  static readonly RECOIL_MASTERY_CATCH_GOAL = 50;
  static readonly RECOIL_MASTERY_BLASTED_SELL_GOAL = 30;

  isRecoilBurstMasteryUnlocked(): boolean {
    if (!InventorySystem.RECOIL_MASTERY_ENABLED) return false;
    return (
      this.recoilMasteryCatches >= InventorySystem.RECOIL_MASTERY_CATCH_GOAL &&
      this.recoilMasteryAshSold >=
        InventorySystem.RECOIL_MASTERY_BLASTED_SELL_GOAL
    );
  }

  recordRecoilMasteryCatch(count = 1): void {
    if (!InventorySystem.RECOIL_MASTERY_ENABLED || count <= 0) return;
    this.recoilMasteryCatches += count;
  }

  /** Count Blasted fish sold toward Recoil mastery (stored in recoilMasteryAshSold). */
  recordBlastedFishSold(count = 1): void {
    if (!InventorySystem.RECOIL_MASTERY_ENABLED || count <= 0) return;
    this.recoilMasteryAshSold += count;
  }

  static readonly PORTAL_MASTERY_ENABLED = true;
  static readonly PORTAL_MASTERY_LEGENDARY_GOAL = 15;
  static readonly PORTAL_MASTERY_TIDE_GOAL = 10;
  static readonly PORTAL_MASTERY_GATE_DUPE_CHANCE = 0.3;

  isPortalMasteryUnlocked(): boolean {
    if (!InventorySystem.PORTAL_MASTERY_ENABLED) return false;
    return (
      this.portalMasteryLegendaries >=
        InventorySystem.PORTAL_MASTERY_LEGENDARY_GOAL &&
      this.portalMasteryTideUses >= InventorySystem.PORTAL_MASTERY_TIDE_GOAL
    );
  }

  recordPortalMasteryLegendary(count = 1): void {
    if (!InventorySystem.PORTAL_MASTERY_ENABLED || count <= 0) return;
    this.portalMasteryLegendaries += count;
  }

  recordPortalMasteryTideUse(count = 1): void {
    if (!InventorySystem.PORTAL_MASTERY_ENABLED || count <= 0) return;
    if (this.getEquippedRodId() !== "portal_rod") return;
    this.portalMasteryTideUses += count;
  }

  static readonly SURFER_MASTERY_ENABLED = true;
  static readonly SURFER_MASTERY_RIDE_MS = 5 * 60 * 1000;
  static readonly SURFER_MASTERY_DUPE_GOAL = 50;
  static readonly SURFER_MASTERY_EVENT_HORIZON_GOAL = 33;
  static readonly SURFER_MASTERY_GRANT_MS = 30_000;

  /** Ascended Surfer only — DEFINED form cannot progress or claim mastery. */
  canProgressStellarSurferMastery(): boolean {
    return (
      InventorySystem.SURFER_MASTERY_ENABLED &&
      this.ownsRod("test_rod") &&
      this.stellarSurferAscended &&
      !this.isStellarSurferDefined()
    );
  }

  isStellarSurferMasteryUnlocked(): boolean {
    if (!this.canProgressStellarSurferMastery()) return false;
    return (
      this.surferMasteryRideMs >= InventorySystem.SURFER_MASTERY_RIDE_MS &&
      this.surferMasteryDupes >= InventorySystem.SURFER_MASTERY_DUPE_GOAL &&
      this.surferMasteryEventHorizon >=
        InventorySystem.SURFER_MASTERY_EVENT_HORIZON_GOAL
    );
  }

  /** Grant Rubber Duck skin when Surfer mastery is complete. */
  ensureSurferMasteryRewards(): void {
    if (!this.isStellarSurferMasteryUnlocked()) return;
    if (!this.ownsRodSkin("rubber_duck")) {
      this.ownedRodSkins.push("rubber_duck");
      if (
        !this.activeRodSkins["test_rod"] ||
        this.activeRodSkins["test_rod"] === "default"
      ) {
        this.activeRodSkins["test_rod"] = "rubber_duck";
      }
    }
  }

  isRubberDuckSurferSkinActive(): boolean {
    return (
      this.getEquippedRodId() === "test_rod" &&
      this.getActiveRodSkinId("test_rod") === "rubber_duck"
    );
  }

  recordSurferMasteryRideMs(ms: number): void {
    if (!this.canProgressStellarSurferMastery() || ms <= 0) return;
    if (this.surferMasteryRideMs >= InventorySystem.SURFER_MASTERY_RIDE_MS) {
      return;
    }
    this.surferMasteryRideMs = Math.min(
      InventorySystem.SURFER_MASTERY_RIDE_MS,
      this.surferMasteryRideMs + Math.floor(ms)
    );
    this.ensureSurferMasteryRewards();
  }

  recordSurferMasteryDupe(count = 1): void {
    if (!this.canProgressStellarSurferMastery() || count <= 0) return;
    this.surferMasteryDupes += count;
    this.ensureSurferMasteryRewards();
  }

  recordSurferMasteryEventHorizon(count = 1): void {
    if (!this.canProgressStellarSurferMastery() || count <= 0) return;
    this.surferMasteryEventHorizon += count;
    this.ensureSurferMasteryRewards();
  }

  getSelectedItem(): ItemId | null {
    return this.hotbar[this.selectedHotbarIndex]?.itemId ?? null;
  }

  selectHotbar(index: number): void {
    if (index >= 0 && index < HOTBAR_SIZE) {
      this.selectedHotbarIndex = index;
    }
  }

  getEquippedRodId(): ItemId {
    return this.equippedRodId;
  }

  getEquippedBobberId(): ItemId {
    return this.equippedBobberId;
  }

  getBackpackId(): ItemId {
    return this.backpackId;
  }

  /** Empty bag slots still available under the current backpack capacity. */
  countEmptyBagSlots(): number {
    const cap = this.getBagCapacity();
    let n = 0;
    for (let i = 0; i < cap; i++) {
      if (this.bag[i]?.itemId == null) n++;
    }
    return n;
  }

  /** Usable bag slots for the current backpack. */
  getBagCapacity(): number {
    return backpackSlotCount(this.backpackId);
  }

  getEquippedRodStats(): RodStats {
    return this.getFishingStats();
  }

  /** Rod stats merged with equipped bobber bonuses (and Augment upgrades). */
  getFishingStats(): RodStats {
    let rod = ITEMS[this.equippedRodId].rodStats ?? { ...ZERO_ROD_STATS };
    if (this.equippedRodId === "augment_rod") {
      rod = applyAugmentUpgrades(rod, this.augmentUpgrades);
    }
    if (this.equippedRodId === "test_rod" && this.isStellarSurferDefined()) {
      rod = {
        luck: Math.floor(rod.luck / 2),
        resilience: Math.floor(rod.resilience / 2),
        control: rod.control,
        progressSpeed: Math.floor(rod.progressSpeed / 2),
        lineDepth: Math.max(1, Math.floor(rod.lineDepth / 2)),
      };
    }
    if (this.equippedRodId === "portal_rod" && this.isPortalMasteryUnlocked()) {
      rod = {
        luck: rod.luck + 25,
        resilience: rod.resilience + 25,
        control: rod.control,
        progressSpeed: rod.progressSpeed + 25,
        lineDepth: 4,
      };
    }
    const bob = ITEMS[this.equippedBobberId]?.bobberStats ?? {};
    const lineDepth =
      bob.lineDepthOverride != null
        ? bob.lineDepthOverride
        : rod.lineDepth + (bob.lineDepth ?? 0);
    return {
      luck: rod.luck + (bob.luck ?? 0),
      resilience: rod.resilience,
      control: rod.control + (bob.control ?? 0),
      progressSpeed: rod.progressSpeed + (bob.progressSpeed ?? 0),
      lineDepth,
    };
  }

  /** Display stats for a rod (includes Augment upgrades when relevant). */
  getRodDisplayStats(rodId: ItemId): RodStats {
    const base = ITEMS[rodId]?.rodStats ?? { ...ZERO_ROD_STATS };
    if (rodId === "augment_rod") {
      return applyAugmentUpgrades(base, this.augmentUpgrades);
    }
    if (rodId === "test_rod" && this.isStellarSurferDefined()) {
      return {
        luck: Math.floor(base.luck / 2),
        resilience: Math.floor(base.resilience / 2),
        control: base.control,
        progressSpeed: Math.floor(base.progressSpeed / 2),
        lineDepth: Math.max(1, Math.floor(base.lineDepth / 2)),
      };
    }
    if (rodId === "portal_rod" && this.isPortalMasteryUnlocked()) {
      return {
        luck: base.luck + 25,
        resilience: base.resilience + 25,
        control: base.control,
        progressSpeed: base.progressSpeed + 25,
        lineDepth: 4,
      };
    }
    return { ...base };
  }

  getAugmentUpgrades(): AugmentUpgrades {
    return { ...this.augmentUpgrades };
  }

  canAugmentUpgrade(): boolean {
    return (
      this.ownsRod("augment_rod") &&
      augmentHasUpgradeableStat(this.augmentUpgrades)
    );
  }

  applyAugmentUpgrade(stat: AugmentStatKey): boolean {
    if (this.augmentUpgrades[stat] >= AUGMENT_UPGRADE_CAPS[stat]) {
      return false;
    }
    this.augmentUpgrades[stat] += 1;
    return true;
  }

  /**
   * Buy a Curio Trader listing at the bargained price.
   * Fish go to the bag; rods/bobbers are owned (not auto-equipped).
   * Bobbers still consume craft fish ingredients.
   */
  buyCurioAtPrice(
    entry: {
      kind: "fish" | "rod" | "bobber" | "misc";
      itemId: ItemId;
      mutation?: FishMutationId | null;
      size?: FishSizeId | null;
    },
    price: number
  ): { ok: boolean; message: string } {
    const cost = Math.max(0, Math.round(price));
    const def = ITEMS[entry.itemId];
    if (!def) return { ok: false, message: "Unknown item." };
    if (this.coins < cost) {
      return {
        ok: false,
        message: `Need $${cost} — you have $${this.coins}.`,
      };
    }
    if (entry.kind === "misc") {
      // Unique quest curios can't be bought twice; stackables (e.g. ore) can.
      if (!def.stackable && this.hasItem(entry.itemId)) {
        return { ok: false, message: `You already have the ${def.name}.` };
      }
      this.coins -= cost;
      if (!this.addItem(entry.itemId)) {
        this.coins += cost;
        return { ok: false, message: "Bag is full." };
      }
      return { ok: true, message: `Bought ${def.name} for $${cost}!` };
    }
    if (entry.kind === "rod") {
      if (!def.isRod || entry.itemId === "tranquil_rod" || entry.itemId === "recoil_rod" || entry.itemId === "portal_rod" || entry.itemId === "forge_rod" || entry.itemId === "starweaver_rod" || entry.itemId === "birthday_rod" || entry.itemId === "star_line_rod") {
        return { ok: false, message: "That isn't a rod." };
      }
      if (this.ownsRod(entry.itemId)) {
        return { ok: false, message: `You already own the ${def.name}.` };
      }
      this.coins -= cost;
      this.registerOwnedRod(entry.itemId);
      return { ok: true, message: `Bought ${def.name} for $${cost}!` };
    }
    if (entry.kind === "bobber") {
      if (!def.isBobber || !def.craftCost) {
        return { ok: false, message: "That bobber isn't for sale." };
      }
      if (entry.itemId === "bobber_mutation") {
        return { ok: false, message: "He won't sell that bobber." };
      }
      if (this.ownsBobber(entry.itemId)) {
        return { ok: false, message: `You already own the ${def.name}.` };
      }
      // Still need the craft fish — only the coin price is discounted
      for (const ing of def.craftCost.ingredients) {
        const have = this.countIngredientMatching(ing);
        if (have < ing.count) {
          return {
            ok: false,
            message: `Need ${formatCraftIngredientLabel(ing)} (have ${have}).`,
          };
        }
      }
      this.coins -= cost;
      for (const ing of def.craftCost.ingredients) {
        this.removeIngredientMatching(ing);
      }
      this.ownedBobbers.push(entry.itemId);
      return {
        ok: true,
        message: `Bought ${def.name} for $${cost} (fish used)!`,
      };
    }
    if (def.sellPrice == null || def.isQuestItem) {
      return { ok: false, message: "That isn't for sale." };
    }
    this.coins -= cost;
    const added = this.addItem(
      entry.itemId,
      1,
      entry.mutation ?? null,
      entry.size ?? null
    );
    if (!added) {
      this.coins += cost;
      return { ok: false, message: "Your bag is full." };
    }
    return { ok: true, message: `Bought for $${cost}.` };
  }

  getAttractRadius(): number {
    const bonus =
      ITEMS[this.equippedBobberId]?.bobberStats?.attractBonus ?? 0;
    return BASE_ATTRACT_RADIUS + bonus;
  }

  getBobberHooks(): 1 | 2 {
    return ITEMS[this.equippedBobberId]?.bobberStats?.hooks === 2 ? 2 : 1;
  }

  getMutationChanceMult(): number {
    const bobberMult =
      ITEMS[this.equippedBobberId]?.bobberStats?.mutationChanceMult ?? 1;
    const rodMult =
      ITEMS[this.equippedRodId]?.worldMutationChanceMult ?? 1;
    return bobberMult * rodMult;
  }

  ownsRod(rodId: ItemId): boolean {
    return this.ownedRods.includes(rodId);
  }

  ownsBobber(bobberId: ItemId): boolean {
    return this.ownedBobbers.includes(bobberId);
  }

  getOwnedBobbers(): ItemId[] {
    return [...this.ownedBobbers];
  }

  equipRod(rodId: ItemId): boolean {
    if (!ITEMS[rodId]?.isRod || !this.ownsRod(rodId)) return false;
    this.equippedRodId = rodId;
    this.hotbar[0] = {
      itemId: rodId,
      count: 1,
      mutation: null,
      size: null,
      keep: false,
    };
    this.selectedHotbarIndex = 0;
    return true;
  }

  equipBobber(bobberId: ItemId): boolean {
    if (!ITEMS[bobberId]?.isBobber || !this.ownsBobber(bobberId)) return false;
    this.equippedBobberId = bobberId;
    return true;
  }

  /** Buy a shop rod if affordable and not already owned. */
  buyRod(rodId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[rodId];
    if (!def?.isRod || def.buyPrice == null || rodId === "tranquil_rod" || rodId === "recoil_rod" || rodId === "portal_rod" || rodId === "forge_rod" || rodId === "starweaver_rod" || rodId === "birthday_rod" || rodId === "star_line_rod" || rodId === "voidharvester_rod" || rodId === "paint_brush_rod") {
      return { ok: false, message: "That isn't for sale." };
    }
    if (this.ownsRod(rodId)) {
      return { ok: false, message: `You already own the ${def.name}.` };
    }
    if (this.coins < def.buyPrice) {
      return {
        ok: false,
        message: `Need $${def.buyPrice} — you have $${this.coins}.`,
      };
    }
    this.coins -= def.buyPrice;
    this.registerOwnedRod(rodId);
    return { ok: true, message: `Purchased ${def.name}!` };
  }

  /**
   * Offer coins to the floating Coral Rod.
   * Only the exact gift amount works — never reveals the price in the message.
   */
  offerCoralRod(amount: number): { ok: boolean; message: string } {
    if (this.ownsRod("coral_rod")) {
      return { ok: false, message: "You already own the Coral Rod." };
    }
    const gift = Math.floor(amount);
    const price = ITEMS.coral_rod.buyPrice ?? 43000;
    if (gift !== price || this.coins < gift) {
      return {
        ok: false,
        message: `The coral rod doesn't accept your gift of $${gift.toLocaleString("en-US")}.`,
      };
    }
    this.coins -= gift;
    this.registerOwnedRod("coral_rod");
    this.unlockHat("hat_gem");
    return { ok: true, message: "The Coral Rod accepts your gift…" };
  }

  buyBobber(bobberId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[bobberId];
    if (!def?.isBobber || def.buyPrice == null) {
      return { ok: false, message: "That isn't for sale." };
    }
    if (this.ownsBobber(bobberId)) {
      return { ok: false, message: `You already own the ${def.name}.` };
    }
    if (this.coins < def.buyPrice) {
      return {
        ok: false,
        message: `Need $${def.buyPrice} — you have $${this.coins}.`,
      };
    }
    this.coins -= def.buyPrice;
    this.ownedBobbers.push(bobberId);
    return { ok: true, message: `Purchased ${def.name}!` };
  }

  getAmuletCount(amuletId: ItemId): number {
    return Math.max(0, this.ownedAmulets[amuletId] ?? 0);
  }

  getOwnedAmulets(): Array<{ id: ItemId; count: number }> {
    return AMULET_ITEM_IDS.map((id) => ({
      id,
      count: this.getAmuletCount(id),
    })).filter((e) => e.count > 0);
  }

  getBaitCount(baitId: ItemId): number {
    return Math.max(0, this.ownedBait[baitId] ?? 0);
  }

  getOwnedBait(): Array<{ id: ItemId; count: number }> {
    return BAIT_ITEM_IDS.map((id) => ({
      id,
      count: this.getBaitCount(id),
    })).filter((e) => e.count > 0);
  }

  addBait(baitId: ItemId, count = 1): boolean {
    const def = ITEMS[baitId];
    if (!def?.isBait || count <= 0) return false;
    this.ownedBait[baitId] = this.getBaitCount(baitId) + count;
    return true;
  }

  getBaitCooldownMs(nowMs = Date.now()): number {
    if (this.baitCooldownUntil <= 0) return 0;
    const left = this.baitCooldownUntil - nowMs;
    if (left <= 0) {
      this.baitCooldownUntil = 0;
      return 0;
    }
    return left;
  }

  useBait(baitId: ItemId): { ok: boolean; message: string } {
    const check = this.canStartBaitUse(baitId);
    if (!check.ok) return check;
    const next = this.getBaitCount(baitId) - 1;
    if (next <= 0) delete this.ownedBait[baitId];
    else this.ownedBait[baitId] = next;
    this.baitCooldownUntil = Date.now() + BAIT_USE_COOLDOWN_MS;
    return {
      ok: true,
      message: `Cast ${ITEMS[baitId]!.name} · bait cooldown 2:00`,
    };
  }

  canStartBaitUse(baitId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[baitId];
    if (!def?.isBait) {
      return { ok: false, message: "That isn't bait." };
    }
    if (this.getBaitCount(baitId) <= 0) {
      return { ok: false, message: `You have no ${def.name}.` };
    }
    if (!baitHasFishTargets(baitId)) {
      return { ok: false, message: "This bait has no fish targets." };
    }
    const cd = this.getBaitCooldownMs();
    if (cd > 0) {
      const totalSec = Math.ceil(cd / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return {
        ok: false,
        message: `Bait cooldown ${m}:${s.toString().padStart(2, "0")}`,
      };
    }
    return { ok: true, message: "" };
  }

  buyBaitCrates(amount: number): { ok: boolean; message: string; bought: number } {
    const n = Math.floor(amount);
    if (n < 1) {
      return { ok: false, message: "Pick an amount.", bought: 0 };
    }
    if (n > BAIT_CRATE_BUY_MAX) {
      return {
        ok: false,
        message: `Max ${BAIT_CRATE_BUY_MAX} at a time.`,
        bought: 0,
      };
    }
    const total = n * BAIT_CRATE_PRICE;
    if (this.coins < total) {
      return {
        ok: false,
        message: `Need $${total.toLocaleString("en-US")} — you have $${this.coins.toLocaleString("en-US")}.`,
        bought: 0,
      };
    }
    this.coins -= total;
    let added = 0;
    for (let i = 0; i < n; i++) {
      if (!this.addItem("bait_crate")) break;
      added++;
    }
    if (added < n) {
      this.coins += (n - added) * BAIT_CRATE_PRICE;
    }
    if (added <= 0) {
      return { ok: false, message: "Bag is full.", bought: 0 };
    }
    return {
      ok: true,
      message: `Purchased ${added} bait crate${added === 1 ? "" : "s"}!`,
      bought: added,
    };
  }

  /** Crack one bait crate — loot goes to bait tab, not bag. */
  openBaitCrate(): { ok: boolean; baitId?: ItemId; message: string } {
    if (!this.hasItem("bait_crate")) {
      return { ok: false, message: "No bait crate." };
    }
    const baitId = rollBaitFromCrate();
    if (!this.removeOneItem("bait_crate")) {
      return { ok: false, message: "No bait crate." };
    }
    this.addBait(baitId);
    return {
      ok: true,
      baitId,
      message: `Found ${ITEMS[baitId].name}! (Equipment Bag › Bait)`,
    };
  }

  ownsBoat(boatId: BoatId): boolean {
    return this.ownedBoats.includes(boatId);
  }

  getOwnedBoats(): BoatId[] {
    return BOAT_IDS.filter((id) => this.ownsBoat(id));
  }

  buyBoat(boatId: BoatId): { ok: boolean; message: string } {
    const def = BOATS[boatId];
    if (!def) return { ok: false, message: "Unknown boat." };
    if (def.buyPrice < 0) {
      return { ok: false, message: "That craft isn't for sale." };
    }
    if (this.ownsBoat(boatId)) {
      return { ok: false, message: `You already own the ${def.name}.` };
    }
    if (def.buyPrice <= 0) {
      this.ownedBoats.push(boatId);
      return { ok: true, message: `${def.name} claimed!` };
    }
    if (this.coins < def.buyPrice) {
      return {
        ok: false,
        message: `Need $${def.buyPrice.toLocaleString("en-US")} — you have $${this.coins.toLocaleString("en-US")}.`,
      };
    }
    this.coins -= def.buyPrice;
    this.ownedBoats.push(boatId);
    return { ok: true, message: `Purchased ${def.name}!` };
  }

  buyAmulet(amuletId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[amuletId];
    if (!def?.isAmulet || def.buyPrice == null || def.rarity === "admin") {
      return { ok: false, message: "That isn't for sale." };
    }
    if (this.coins < def.buyPrice) {
      return {
        ok: false,
        message: `Need $${def.buyPrice.toLocaleString("en-US")} — you have $${this.coins.toLocaleString("en-US")}.`,
      };
    }
    this.coins -= def.buyPrice;
    this.ownedAmulets[amuletId] = this.getAmuletCount(amuletId) + 1;
    return { ok: true, message: `Purchased ${def.name}!` };
  }

  /** Buy a non-amulet shelf item in the amulet cave (e.g. anvil shard). */
  buyCaveShelfItem(itemId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[itemId];
    if (!def || def.buyPrice == null || def.isAmulet) {
      return { ok: false, message: "That isn't for sale." };
    }
    if (this.hasItem(itemId)) {
      return { ok: false, message: `You already have the ${def.name}.` };
    }
    if (this.coins < def.buyPrice) {
      return {
        ok: false,
        message: `Need $${def.buyPrice.toLocaleString("en-US")} — you have $${this.coins.toLocaleString("en-US")}.`,
      };
    }
    this.coins -= def.buyPrice;
    if (!this.addItem(itemId)) {
      this.coins += def.buyPrice;
      return { ok: false, message: "Bag is full." };
    }
    return { ok: true, message: `Purchased ${def.name}!` };
  }

  /**
   * Consume one amulet if owned. Caller applies the world effect.
   * @param isDay true when daytime (nightFactor near 0)
   */
  useAmulet(
    amuletId: ItemId,
    isDay: boolean
  ): { ok: boolean; message: string; effect?: import("../data/items").AmuletEffectId } {
    const def = ITEMS[amuletId];
    if (!def?.isAmulet || !def.amuletEffect) {
      return { ok: false, message: "That isn't an amulet." };
    }
    if (this.getAmuletCount(amuletId) <= 0) {
      return { ok: false, message: `You have no ${def.name}.` };
    }
    if (def.amuletEffect === "moonlight" && isDay) {
      return { ok: false, message: "Moonlight Amulet only works at night." };
    }
    if (def.amuletEffect === "sunlit" && !isDay) {
      return { ok: false, message: "Sunlit Amulet only works during the day." };
    }
    const next = this.getAmuletCount(amuletId) - 1;
    if (next <= 0) delete this.ownedAmulets[amuletId];
    else this.ownedAmulets[amuletId] = next;
    return {
      ok: true,
      message: `Used ${def.name}!`,
      effect: def.amuletEffect,
    };
  }

  /**
   * Count bag/hotbar stacks for crafting.
   * Size is ignored (big/giant always OK).
   * If `mutation` is null/omitted, any mutation (or none) counts.
   * If mutations are listed, the fish must have one of those (any size).
   */
  countFishMatching(
    itemId: ItemId,
    mutation?: FishMutationId | FishMutationId[] | null
  ): number {
    let n = 0;
    const allowed = Array.isArray(mutation)
      ? mutation
      : mutation != null
        ? [mutation]
        : null;
    for (const slot of this.craftCandidateSlots()) {
      if (!this.slotMatchesCraft(slot, itemId, allowed)) continue;
      n += slot.count;
    }
    return n;
  }

  private craftCandidateSlots(): InventorySlot[] {
    // Prefer spending non-favorited stacks first when removing
    return [...this.bag, ...this.hotbar].sort(
      (a, b) => Number(!!a.keep) - Number(!!b.keep)
    );
  }

  private slotMatchesCraft(
    slot: InventorySlot,
    itemId: ItemId,
    allowed: FishMutationId[] | null
  ): boolean {
    if (slot.itemId !== itemId || slot.count <= 0) return false;
    // Size never matters for recipes
    if (allowed) {
      if (!slot.mutation || !allowed.includes(slot.mutation)) return false;
    }
    return true;
  }

  private slotMatchesIngredient(
    slot: InventorySlot,
    ing: import("../data/items").BobberCraftIngredient
  ): boolean {
    if (!slot.itemId || slot.count <= 0) return false;

    if (ing.anyFish) {
      if (!FISH_ITEM_IDS.includes(slot.itemId)) return false;
      if (ing.minRarity && !fishMeetsMinRarity(slot.itemId, ing.minRarity)) {
        return false;
      }
    } else {
      const ids =
        ing.itemIds && ing.itemIds.length > 0 ? ing.itemIds : [ing.itemId];
      if (!ids.includes(slot.itemId)) return false;
    }

    const allowed = this.craftIngredientMutations(ing);
    if (allowed) {
      return !!slot.mutation && allowed.includes(slot.mutation);
    }
    if (ing.anyMutation) {
      if (slot.mutation) return true;
      if (ing.sizes?.length && slot.size && ing.sizes.includes(slot.size)) {
        return true;
      }
      return false;
    }
    if (ing.sizes?.length) {
      return !!slot.size && ing.sizes.includes(slot.size);
    }
    return true;
  }

  countIngredientMatching(
    ing: import("../data/items").BobberCraftIngredient
  ): number {
    let n = 0;
    for (const slot of this.craftCandidateSlots()) {
      if (!this.slotMatchesIngredient(slot, ing)) continue;
      n += slot.count;
    }
    return n;
  }

  removeIngredientMatching(
    ing: import("../data/items").BobberCraftIngredient
  ): boolean {
    if (this.countIngredientMatching(ing) < ing.count) return false;
    let left = ing.count;
    for (const slot of this.craftCandidateSlots()) {
      if (left <= 0) break;
      if (!this.slotMatchesIngredient(slot, ing)) continue;
      const take = Math.min(slot.count, left);
      slot.count -= take;
      left -= take;
      if (slot.count <= 0) {
        slot.itemId = null;
        slot.count = 0;
        slot.mutation = null;
        slot.size = null;
        slot.paintTint = null;
        slot.keep = false;
      }
    }
    return left === 0;
  }

  private removeFishMatching(
    itemId: ItemId,
    count: number,
    mutation?: FishMutationId | FishMutationId[]
  ): boolean {
    if (this.countFishMatching(itemId, mutation ?? null) < count) return false;
    const allowed = Array.isArray(mutation)
      ? mutation
      : mutation != null
        ? [mutation]
        : null;
    let left = count;
    for (const slot of this.craftCandidateSlots()) {
      if (left <= 0) break;
      if (!this.slotMatchesCraft(slot, itemId, allowed)) continue;
      const take = Math.min(slot.count, left);
      slot.count -= take;
      left -= take;
      if (slot.count <= 0) {
        slot.itemId = null;
        slot.count = 0;
        slot.mutation = null;
        slot.size = null;
        slot.paintTint = null;
        slot.keep = false;
      }
    }
    return left === 0;
  }

  private craftIngredientMutations(
    ing: import("../data/items").BobberCraftIngredient
  ): FishMutationId[] | null {
    if (ing.mutations && ing.mutations.length > 0) return ing.mutations;
    if (ing.mutation) return [ing.mutation];
    return null;
  }

  /** Public wrapper for forge / shop UI ingredient checks. */
  getCraftIngredientMutations(
    ing: import("../data/items").BobberCraftIngredient
  ): FishMutationId[] | null {
    return this.craftIngredientMutations(ing);
  }

  canCraftForgeRod(rodId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[rodId];
    if (!def?.isRod || !def.craftCost) {
      return { ok: false, message: "That can't be forged." };
    }
    if (def.limitedEdition && !def.limitedEdition.currentlyObtainable) {
      return { ok: false, message: `${def.name} is no longer obtainable.` };
    }
    if (this.ownsRod(rodId)) {
      return { ok: false, message: `You already own the ${def.name}.` };
    }
    if (def.craftCost.coins > 0 && this.coins < def.craftCost.coins) {
      return {
        ok: false,
        message: `Need $${def.craftCost.coins} — you have $${this.coins}.`,
      };
    }
    for (const ing of def.craftCost.ingredients) {
      const have = this.countIngredientMatching(ing);
      if (have < ing.count) {
        const label = formatCraftIngredientLabel(ing);
        return {
          ok: false,
          message: `Need ${label} (have ${have}).`,
        };
      }
    }
    return { ok: true, message: "Ready to forge." };
  }

  craftForgeRod(rodId: ItemId): { ok: boolean; message: string } {
    const check = this.canCraftForgeRod(rodId);
    if (!check.ok) return check;
    const def = ITEMS[rodId];
    const cost = def.craftCost!;
    if (cost.coins > 0) this.coins -= cost.coins;
    for (const ing of cost.ingredients) {
      this.removeIngredientMatching(ing);
    }
    this.registerOwnedRod(rodId);
    this.equipRod(rodId);
    return { ok: true, message: `Forged the ${def.name}!` };
  }

  canCraftBobber(bobberId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[bobberId];
    if (!def?.isBobber || !def.craftCost) {
      return { ok: false, message: "That can't be crafted." };
    }
    if (this.ownsBobber(bobberId)) {
      return { ok: false, message: `You already own the ${def.name}.` };
    }
    if (this.coins < def.craftCost.coins) {
      return {
        ok: false,
        message: `Need $${def.craftCost.coins} — you have $${this.coins}.`,
      };
    }
    for (const ing of def.craftCost.ingredients) {
      const have = this.countIngredientMatching(ing);
      if (have < ing.count) {
        const label = formatCraftIngredientLabel(ing);
        return {
          ok: false,
          message: `Need ${label} (have ${have}).`,
        };
      }
    }
    return { ok: true, message: "Ready to craft." };
  }

  craftBobber(bobberId: ItemId): { ok: boolean; message: string } {
    const check = this.canCraftBobber(bobberId);
    if (!check.ok) return check;
    const def = ITEMS[bobberId];
    const cost = def.craftCost!;
    this.coins -= cost.coins;
    for (const ing of cost.ingredients) {
      this.removeIngredientMatching(ing);
    }
    this.ownedBobbers.push(bobberId);
    return { ok: true, message: `Crafted ${def.name}!` };
  }

  buyBackpack(backpackId: ItemId): { ok: boolean; message: string } {
    const def = ITEMS[backpackId];
    if (!def?.isBackpack || def.buyPrice == null) {
      return { ok: false, message: "That isn't for sale." };
    }
    const nextTier = backpackTier(backpackId);
    const curTier = backpackTier(this.backpackId);
    if (nextTier <= curTier) {
      return {
        ok: false,
        message:
          nextTier < curTier
            ? "You can't go back to a smaller pack."
            : `You already have the ${def.name}.`,
      };
    }
    if (nextTier !== curTier + 1) {
      return {
        ok: false,
        message: "Buy the previous pack tier first.",
      };
    }
    if (this.coins < def.buyPrice) {
      return {
        ok: false,
        message: `Need $${def.buyPrice} — you have $${this.coins}.`,
      };
    }
    this.coins -= def.buyPrice;
    this.backpackId = backpackId;
    return {
      ok: true,
      message: `Upgraded to ${def.name}! (${def.bagSlots} slots)`,
    };
  }

  addItem(
    itemId: ItemId,
    count = 1,
    mutation: FishMutationId | null = null,
    size: FishSizeId | null = null,
    paintTint: number | null = null
  ): boolean {
    if (ITEMS[itemId].isRod) {
      if (this.ownsRod(itemId)) return false;
      this.registerOwnedRod(itemId);
      return true;
    }

    if (!ITEMS[itemId].stackable && this.hasItem(itemId)) {
      return false;
    }

    const resolvedPaint =
      mutation === "painted"
        ? paintTint ??
          [
            0xff3355, 0xff6633, 0xffcc33, 0x66cc44, 0x33aaff, 0x7755ff, 0xff66cc,
            0xffffff, 0x00e5c0, 0xff2244,
          ][Math.floor(Math.random() * 10)]!
        : null;

    if (ITEMS[itemId].stackable) {
      const stack = this.findStack(itemId, mutation, size, resolvedPaint);
      if (stack) {
        stack.count += count;
        this.discoverFish(itemId);
        return true;
      }
    }

    const empty = this.bag.find(
      (s, i) => i < this.getBagCapacity() && s.itemId === null
    );
    if (!empty) return false;
    empty.itemId = itemId;
    empty.count = count;
    empty.mutation = mutation;
    empty.size = size;
    empty.keep = false;
    empty.paintTint = resolvedPaint;
    this.discoverFish(itemId);
    return true;
  }

  hasItem(itemId: ItemId): boolean {
    return [...this.bag, ...this.hotbar].some(
      (s) => s.itemId === itemId && s.count > 0
    );
  }

  /** Total count of an item across bag + hotbar. */
  countItem(itemId: ItemId): number {
    return [...this.bag, ...this.hotbar]
      .filter((s) => s.itemId === itemId)
      .reduce((sum, s) => sum + s.count, 0);
  }

  /** Remove one unit of a bag/hotbar item (not rods/amulets). */
  removeOneItem(itemId: ItemId): boolean {
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (slot.itemId !== itemId || slot.count <= 0) continue;
      slot.count -= 1;
      if (slot.count <= 0) {
        slot.itemId = null;
        slot.count = 0;
        slot.mutation = null;
        slot.size = null;
        slot.paintTint = null;
        slot.keep = false;
      }
      return true;
    }
    return false;
  }

  /** Crack one ore cluster from the bag/hotbar into a rolled mineral. */
  openOreCluster(): { ok: boolean; oreId?: ItemId; message: string } {
    if (!this.hasItem("ore_cluster")) {
      return { ok: false, message: "No ore cluster." };
    }
    const oreId = rollOreFromCluster();
    if (!this.removeOneItem("ore_cluster")) {
      return { ok: false, message: "No ore cluster." };
    }
    if (!this.addItem(oreId)) {
      this.addItem("ore_cluster");
      return { ok: false, message: "Inventory full!" };
    }
    return {
      ok: true,
      oreId,
      message: `Found ${ITEMS[oreId].name}!`,
    };
  }

  /** Apply wall-clock restock if the 10-minute timer has elapsed. */
  refreshOreVendorStock(nowMs = Date.now()): void {
    if (this.oreVendorRestockAt > 0 && nowMs >= this.oreVendorRestockAt) {
      this.oreVendorStock = ORE_CLUSTER_VENDOR_STOCK_MAX;
      this.oreVendorRestockAt = 0;
    }
  }

  getOreVendorStock(nowMs = Date.now()): number {
    this.refreshOreVendorStock(nowMs);
    return this.oreVendorStock;
  }

  getOreVendorRestockMs(nowMs = Date.now()): number {
    this.refreshOreVendorStock(nowMs);
    if (this.oreVendorStock > 0 || this.oreVendorRestockAt <= 0) return 0;
    return Math.max(0, this.oreVendorRestockAt - nowMs);
  }

  buyOreClusters(
    amount: number,
    nowMs = Date.now()
  ): { ok: boolean; message: string; bought: number } {
    this.refreshOreVendorStock(nowMs);
    const n = Math.floor(amount);
    if (n < 1) {
      return { ok: false, message: "Pick an amount.", bought: 0 };
    }
    if (this.oreVendorStock <= 0) {
      return {
        ok: false,
        message: "Sold out — come back after the restock.",
        bought: 0,
      };
    }
    const buy = Math.min(n, this.oreVendorStock, ORE_CLUSTER_VENDOR_STOCK_MAX);
    const cost = buy * ORE_CLUSTER_VENDOR_PRICE;
    if (this.coins < cost) {
      return {
        ok: false,
        message: `Need $${cost.toLocaleString("en-US")} — you have $${this.coins.toLocaleString("en-US")}.`,
        bought: 0,
      };
    }
    const hasStack = !!this.findStack("ore_cluster");
    const hasEmpty = this.bag.some(
      (s, i) => i < this.getBagCapacity() && s.itemId === null
    );
    if (!hasStack && !hasEmpty) {
      return { ok: false, message: "Inventory full!", bought: 0 };
    }

    this.coins -= cost;
    for (let i = 0; i < buy; i++) {
      if (!this.addItem("ore_cluster")) {
        // Refund leftover unplaced (shouldn't happen after capacity check)
        this.coins += (buy - i) * ORE_CLUSTER_VENDOR_PRICE;
        this.oreVendorStock -= i;
        if (this.oreVendorStock <= 0) {
          this.oreVendorStock = 0;
          this.oreVendorRestockAt = nowMs + ORE_CLUSTER_VENDOR_RESTOCK_MS;
        }
        return {
          ok: i > 0,
          message:
            i > 0
              ? `Bought ${i} Ore Cluster${i === 1 ? "" : "s"} (bag filled).`
              : "Inventory full!",
          bought: i,
        };
      }
    }
    this.oreVendorStock -= buy;
    if (this.oreVendorStock <= 0) {
      this.oreVendorStock = 0;
      this.oreVendorRestockAt = nowMs + ORE_CLUSTER_VENDOR_RESTOCK_MS;
    }
    return {
      ok: true,
      message: `Bought ${buy} Ore Cluster${buy === 1 ? "" : "s"} for $${cost.toLocaleString("en-US")}!`,
      bought: buy,
    };
  }

  isVaultGemAvailable(gemId: VaultGemId): boolean {
    if (!this.vaultGemQuestAccepted) return false;
    if (this.vaultGemsPlaced.includes(gemId)) return false;
    if (this.hasItem(gemId)) return false;
    return true;
  }

  /** True if gem is already found (inventory or pedestal). */
  hasVaultGemProgress(gemId: VaultGemId): boolean {
    return this.vaultGemsPlaced.includes(gemId) || this.hasItem(gemId);
  }

  /** Active until Crystal Rod is earned. */
  isVaultGemQuestActive(): boolean {
    return this.vaultGemQuestAccepted && !this.ownsRod("crystal_rod");
  }

  vaultGemsFoundCount(): number {
    return VAULT_GEM_IDS.filter((id) => this.hasVaultGemProgress(id)).length;
  }

  placeVaultGem(gemId: VaultGemId): boolean {
    if (!this.vaultGemQuestAccepted) return false;
    if (!isVaultGemId(gemId)) return false;
    if (this.vaultGemsPlaced.includes(gemId)) return false;
    if (!this.removeOneItem(gemId)) return false;
    this.vaultGemsPlaced.push(gemId);
    return true;
  }

  allVaultGemsPlaced(): boolean {
    return VAULT_GEM_IDS.every((id) => this.vaultGemsPlaced.includes(id));
  }

  /**
   * Record cave-merchant sale earnings; grants emerald when threshold crossed.
   * Returns the newly granted gem id if any.
   */
  recordCaveMerchantSale(earned: number): VaultGemId | null {
    if (!this.vaultGemQuestAccepted || earned <= 0) return null;
    const before = this.caveMerchantEarned;
    this.caveMerchantEarned += earned;
    if (
      before < VAULT_GREEN_SELL_THRESHOLD &&
      this.caveMerchantEarned >= VAULT_GREEN_SELL_THRESHOLD &&
      this.isVaultGemAvailable("gem_green")
    ) {
      if (this.addItem("gem_green")) return "gem_green";
    }
    return null;
  }

  grantCrystalRodReward(): { ok: boolean; message: string } {
    if (!this.allVaultGemsPlaced()) {
      return { ok: false, message: "The pedestals are not yet complete." };
    }
    if (this.ownsRod("crystal_rod")) {
      return { ok: false, message: "You already hold the Crystal Rod." };
    }
    if (!this.addItem("crystal_rod")) {
      return { ok: false, message: "Could not grant the Crystal Rod." };
    }
    this.equipRod("crystal_rod");
    return {
      ok: true,
      message: "The vault awakens — you received the Crystal Rod!",
    };
  }

  /** Texture for UI / hotbar — active skin when equipped. */
  getRodTextureKey(rodId: ItemId): string {
    const skin = this.getActiveRodSkin(rodId);
    if (skin) return skin.textureKey;
    return ITEMS[rodId]?.textureKey ?? "rod";
  }

  ownsRodSkin(skinId: string): boolean {
    if (skinId === "gallery") {
      return this.crystalRodSkinOwned || this.ownedRodSkins.includes("gallery");
    }
    return this.ownedRodSkins.includes(skinId);
  }

  /**
   * Register a newly obtained rod and apply any skins already unlocked for it
   * (e.g. from a Skin Crate opened before owning the rod).
   */
  private registerOwnedRod(rodId: ItemId): void {
    if (!this.ownedRods.includes(rodId)) {
      this.ownedRods.push(rodId);
    }
    this.applyPendingSkinsForRod(rodId);
  }

  /**
   * Keep crate skins independent of rod ownership: if the player already owns a
   * skin for this rod, make sure it becomes (or stays) the active finish.
   */
  private applyPendingSkinsForRod(rodId: ItemId): void {
    const active = this.activeRodSkins[rodId];
    if (active && active !== "default" && this.ownsRodSkin(active)) {
      const def = isRodSkinId(active) ? ROD_SKINS[active] : null;
      if (!def || def.rodId === rodId) return;
    }
    const pending = skinsForRod(rodId).find((s) => this.ownsRodSkin(s.id));
    if (pending) {
      this.activeRodSkins[rodId] = pending.id;
      if (rodId === "crystal_rod") {
        this.crystalRodSkinActive = pending.id === "gallery";
      }
    }
  }

  /**
   * Unlock a rod skin permanently. Does NOT require owning the matching rod —
   * the finish is saved and auto-applies when the rod is obtained later.
   */
  private unlockRodSkin(
    skinId: RodSkinId,
    duplicateRefund = SKIN_CRATE_DUPLICATE_REFUND
  ): {
    duplicate: boolean;
    refund: number;
    message: string;
  } {
    const def = ROD_SKINS[skinId];
    const rodName = ITEMS[def.rodId]?.name ?? "rod";
    if (this.ownsRodSkin(skinId)) {
      this.coins += duplicateRefund;
      return {
        duplicate: true,
        refund: duplicateRefund,
        message: `Duplicate ${def.label} — $${duplicateRefund.toLocaleString()} refunded.`,
      };
    }
    if (!this.ownedRodSkins.includes(skinId)) {
      this.ownedRodSkins.push(skinId);
    }
    // Always remember the finish for this rod, even if the rod isn't owned yet
    this.activeRodSkins[def.rodId] = skinId;
    if (skinId === "poisoned") {
      this.crystalRodSkinActive = false;
    } else if (skinId === "gallery") {
      this.crystalRodSkinOwned = true;
      this.crystalRodSkinActive = true;
    }
    const haveRod = this.ownsRod(def.rodId);
    return {
      duplicate: false,
      refund: 0,
      message: haveRod
        ? `Unlocked ${def.label} for the ${rodName}!`
        : `Unlocked ${def.label}! It'll equip when you get the ${rodName}.`,
    };
  }

  /** Buy a rod skin for coins (Stellar Merchant cosmic shop, etc.). */
  buyRodSkin(
    skinId: RodSkinId,
    price: number
  ): { ok: boolean; message: string } {
    const def = ROD_SKINS[skinId];
    if (!def) return { ok: false, message: "Unknown skin." };
    if (this.ownsRodSkin(skinId)) {
      return { ok: false, message: `You already own ${def.label}.` };
    }
    if (this.coins < price) {
      return {
        ok: false,
        message: `Need $${price.toLocaleString()} for ${def.label}.`,
      };
    }
    this.coins -= price;
    const unlocked = this.unlockRodSkin(skinId, 0);
    return { ok: true, message: unlocked.message };
  }

  /** Buy a limited rod from the Stellar Merchant shop (custom price / materials). */
  buyStellarShopRod(
    rodId: ItemId,
    price: number,
    requiresItem?: ItemId
  ): { ok: boolean; message: string } {
    const def = ITEMS[rodId];
    if (!def?.isRod) return { ok: false, message: "Unknown rod." };
    if (this.ownsRod(rodId)) {
      return { ok: false, message: `You already own the ${def.name}.` };
    }
    if (requiresItem && !this.hasItem(requiresItem)) {
      const reqName = ITEMS[requiresItem]?.name ?? requiresItem;
      return {
        ok: false,
        message: `Need ${reqName} to buy the ${def.name}.`,
      };
    }
    if (this.coins < price) {
      return {
        ok: false,
        message: `Need $${price.toLocaleString()} for ${def.name}.`,
      };
    }
    this.coins -= price;
    if (requiresItem && !this.removeOneItem(requiresItem)) {
      this.coins += price;
      const reqName = ITEMS[requiresItem]?.name ?? requiresItem;
      return { ok: false, message: `Need ${reqName} to buy the ${def.name}.` };
    }
    this.registerOwnedRod(rodId);
    const mat =
      requiresItem && ITEMS[requiresItem]
        ? ` (used ${ITEMS[requiresItem].name})`
        : "";
    return { ok: true, message: `Purchased ${def.name}!${mat}` };
  }

  /** Remove a rod from ownership (testing cleanup / dev grants). */
  stripRodOwnership(rodId: ItemId): void {
    if (!this.ownsRod(rodId)) return;
    this.ownedRods = this.ownedRods.filter((id) => id !== rodId);
    if (this.equippedRodId === rodId) {
      this.equippedRodId = "starter_rod";
      this.hotbar[0] = {
        itemId: "starter_rod",
        count: 1,
        mutation: null,
        size: null,
        keep: false,
      };
    }
  }

  /**
   * Skins owned / selectable for a rod.
   * Every rod has Default; extra skins come from gallery / crates.
   */
  getRodSkinOptions(rodId: ItemId): Array<{
    id: string;
    label: string;
    textureKey: string;
    owned: boolean;
    limitedEdition?: LimitedEditionInfo;
  }> {
    const def = ITEMS[rodId];
    const baseTex = def?.textureKey ?? "rod";
    const options: Array<{
      id: string;
      label: string;
      textureKey: string;
      owned: boolean;
      limitedEdition?: LimitedEditionInfo;
    }> = [
      {
        id: "default",
        label: "Default",
        textureKey: baseTex,
        owned: true,
      },
    ];
    for (const skin of skinsForRod(rodId)) {
      options.push({
        id: skin.id,
        label: skin.label,
        textureKey: skin.textureKey,
        owned: this.ownsRodSkin(skin.id),
        limitedEdition: skin.limitedEdition,
      });
    }
    return options;
  }

  getActiveRodSkinId(rodId: ItemId): string {
    const active = this.activeRodSkins[rodId];
    if (active && active !== "default" && this.ownsRodSkin(active)) {
      return active;
    }
    // Legacy crystal gallery
    if (
      rodId === "crystal_rod" &&
      this.ownsRodSkin("gallery") &&
      this.crystalRodSkinActive &&
      !active
    ) {
      return "gallery";
    }
    return "default";
  }

  getActiveRodSkin(
    rodId: ItemId
  ): { id: string; label: string; textureKey: string } | null {
    const id = this.getActiveRodSkinId(rodId);
    const opt = this.getRodSkinOptions(rodId).find((s) => s.id === id);
    if (!opt || !opt.owned) return null;
    if (id === "default") return null;
    return opt;
  }

  setRodSkin(
    rodId: ItemId,
    skinId: string
  ): { ok: boolean; message: string } {
    if (!this.ownsRod(rodId)) {
      return { ok: false, message: "You don't own that rod." };
    }
    const opt = this.getRodSkinOptions(rodId).find((s) => s.id === skinId);
    if (!opt) {
      return { ok: false, message: "That skin doesn't exist." };
    }
    if (!opt.owned) {
      return { ok: false, message: "You don't own that skin yet." };
    }

    if (skinId === "default") {
      delete this.activeRodSkins[rodId];
      if (rodId === "crystal_rod") this.crystalRodSkinActive = false;
    } else {
      this.activeRodSkins[rodId] = skinId;
      if (rodId === "crystal_rod") {
        this.crystalRodSkinActive = skinId === "gallery";
      }
    }

    const rodName = ITEMS[rodId]?.name ?? "Rod";
    return {
      ok: true,
      message:
        skinId === "default"
          ? `${rodName} Default skin applied.`
          : `${rodName} ${opt.label} skin applied.`,
    };
  }

  toggleCrystalRodSkin(): { ok: boolean; message: string } {
    if (!this.ownsRod("crystal_rod")) {
      return { ok: false, message: "You need the Crystal Rod first." };
    }
    if (!this.ownsRodSkin("gallery")) {
      return {
        ok: false,
        message: "No skin yet — visit the Crystal Gallery.",
      };
    }
    const next =
      this.getActiveRodSkinId("crystal_rod") === "gallery"
        ? "default"
        : "gallery";
    return this.setRodSkin("crystal_rod", next);
  }

  markCrystalGalleryChallengeDone(): void {
    this.crystalGalleryChallengeDone = true;
  }

  claimCrystalRodSkin(): { ok: boolean; message: string } {
    if (!this.crystalGalleryChallengeDone) {
      return { ok: false, message: "Complete the crystal memory challenge first." };
    }
    if (this.ownsRodSkin("gallery")) {
      return { ok: false, message: "You already have the Crystal Rod skin." };
    }
    this.crystalRodSkinOwned = true;
    this.crystalRodSkinActive = true;
    if (!this.ownedRodSkins.includes("gallery")) {
      this.ownedRodSkins.push("gallery");
    }
    this.activeRodSkins["crystal_rod"] = "gallery";
    return {
      ok: true,
      message: "Crystal Rod skin unlocked!",
    };
  }

  buySkinCrate(): { ok: boolean; message: string } {
    return this.buyCrate("collectors");
  }

  buyFrostpeakSkinCrate(): { ok: boolean; message: string } {
    return this.buyCrate("frostpeak");
  }

  buyCrate(kind: SkinCrateKind): { ok: boolean; message: string } {
    const price =
      kind === "frostpeak" ? FROSTPEAK_CRATE_PRICE : SKIN_CRATE_PRICE;
    const itemId = crateItemId(kind);
    const label =
      kind === "frostpeak" ? "Frostpeak Crate" : "Skin Crate";
    if (this.coins < price) {
      return {
        ok: false,
        message: `Need $${price.toLocaleString()} for a ${label}.`,
      };
    }
    if (!this.addItem(itemId)) {
      return { ok: false, message: "Bag is full — free a slot first." };
    }
    this.coins -= price;
    return {
      ok: true,
      message: `${label} purchased! Open it from your inventory.`,
    };
  }

  /**
   * Consume one crate and resolve a skin roll.
   * Duplicates refund coins; new skins are granted and auto-equipped.
   */
  openSkinCrate(): {
    ok: boolean;
    message: string;
    skinId?: RodSkinId;
    duplicate?: boolean;
    refund?: number;
  } {
    return this.openCrate("collectors");
  }

  openCrate(kind: SkinCrateKind): {
    ok: boolean;
    message: string;
    skinId?: RodSkinId;
    duplicate?: boolean;
    refund?: number;
  } {
    const itemId = crateItemId(kind);
    const label =
      kind === "frostpeak" ? "Frostpeak Crate" : "Skin Crate";
    if (!this.hasItem(itemId)) {
      return { ok: false, message: `You don't have a ${label}.` };
    }
    if (!this.removeOneItem(itemId)) {
      return { ok: false, message: "Couldn't open the crate." };
    }

    const skinId = rollCrateSkin(kind);
    return {
      ok: true,
      skinId,
      ...this.unlockRodSkin(skinId, crateDuplicateRefund(kind)),
    };
  }

  /** Peek a crate roll without consuming (for reveal UI). Prefer openSkinCrate. */
  peekSkinCrateRoll(): RodSkinId {
    return rollSkinCrate();
  }

  peekCrateRoll(kind: SkinCrateKind): RodSkinId {
    return rollCrateSkin(kind);
  }

  /** Grant a rolled skin after the reveal animation (crate already consumed).
   *  Call once per roll in order for multi-opens — first new unlock keeps the
   *  skin; later copies of the same skin in the batch refund as duplicates.
   */
  resolveSkinCrateRoll(skinId: RodSkinId): {
    duplicate: boolean;
    refund: number;
    message: string;
  } {
    return this.unlockRodSkin(skinId);
  }

  resolveCrateRoll(
    skinId: RodSkinId,
    kind: SkinCrateKind
  ): {
    duplicate: boolean;
    refund: number;
    message: string;
  } {
    return this.unlockRodSkin(skinId, crateDuplicateRefund(kind));
  }

  /** Consume crate only — used before reveal animation. */
  consumeSkinCrate(): boolean {
    return this.removeOneItem("skin_crate");
  }

  consumeCrate(kind: SkinCrateKind): boolean {
    return this.removeOneItem(crateItemId(kind));
  }

  isBestiaryFound(itemId: ItemId): boolean {
    return this.bestiaryFound.includes(itemId);
  }

  isBestiaryClaimed(itemId: ItemId): boolean {
    return this.bestiaryClaimed.includes(itemId);
  }

  /** Every fish species discovered in the bestiary. */
  isBestiaryComplete(): boolean {
    return FISH_ITEM_IDS.every((id) => this.bestiaryFound.includes(id));
  }

  /** Species unlocked in the bestiary. */
  bestiaryFoundCount(): number {
    return this.bestiaryFound.length;
  }

  /** How many species discovered in a bestiary habitat tab. */
  bestiaryFoundInHabitat(habitat: FishHabitat): number {
    const area = BESTIARY_AREAS.find((a) => a.id === habitat);
    if (!area) return 0;
    let n = 0;
    for (const id of area.fishIds) {
      if (this.bestiaryFound.includes(id)) n += 1;
    }
    return n;
  }

  /** Vault Keeper requires this many bestiary entries to start. */
  static readonly VAULT_QUEST_BESTIARY_MIN = 5;

  acceptVaultGemQuest(): boolean {
    if (this.vaultGemQuestAccepted) return false;
    if (this.bestiaryFoundCount() < InventorySystem.VAULT_QUEST_BESTIARY_MIN) {
      return false;
    }
    this.vaultGemQuestAccepted = true;
    return true;
  }

  /** Returns true if this is a newly discovered species. */
  discoverFish(itemId: ItemId): boolean {
    if (!FISH_ITEM_IDS.includes(itemId) || ITEMS[itemId].isQuestItem) return false;
    if (this.bestiaryFound.includes(itemId)) return false;
    this.bestiaryFound.push(itemId);
    return true;
  }

  ownsHat(hatId: ItemId): boolean {
    return this.ownedHats.includes(hatId);
  }

  getOwnedHats(): ItemId[] {
    return [...this.ownedHats];
  }

  getEquippedHatId(): ItemId | null {
    return this.equippedHatId;
  }

  /** Unlock a hat if not already owned. Returns true when newly unlocked. */
  unlockHat(hatId: ItemId): boolean {
    if (!ITEMS[hatId]?.isHat) return false;
    if (this.ownedHats.includes(hatId)) return false;
    this.ownedHats.push(hatId);
    return true;
  }

  equipHat(hatId: ItemId | null): boolean {
    if (hatId === null) {
      this.equippedHatId = null;
      return true;
    }
    if (!this.ownsHat(hatId)) return false;
    this.equippedHatId = hatId;
    return true;
  }

  /** Equipped Resonated Hat — required to enter Stellar Sky. */
  canResonateToStellarSky(): boolean {
    return this.equippedHatId === "hat_resonated" && this.ownsHat("hat_resonated");
  }

  tryTurnInResonatedHat(): {
    ok: boolean;
    message: "already" | "need_more" | "done";
  } {
    if (this.resonatedHatDone || this.ownsHat("hat_resonated")) {
      this.resonatedHatDone = true;
      this.resonatedHatQuestStarted = true;
      return { ok: false, message: "already" };
    }
    for (const ing of RESONATED_HAT_COST) {
      if (this.countIngredientMatching(ing) < ing.count) {
        return { ok: false, message: "need_more" };
      }
    }
    for (const ing of RESONATED_HAT_COST) {
      this.removeIngredientMatching(ing);
    }
    this.unlockHat("hat_resonated");
    this.equipHat("hat_resonated");
    this.resonatedHatDone = true;
    this.resonatedHatQuestStarted = true;
    return { ok: true, message: "done" };
  }

  /**
   * Turn in one nautilus to the Entrance shell seeker for the Shell Hat.
   */
  turnInNautilusForShellHat(): { ok: boolean; message: string; unlocked: boolean } {
    if (this.nautilusQuestDone || this.ownsHat("hat_shell")) {
      this.nautilusQuestDone = true;
      return {
        ok: false,
        message: "You already brought my nautilus back — enjoy the shell hat!",
        unlocked: false,
      };
    }
    if (!this.hasItem("nautilus")) {
      return {
        ok: false,
        message:
          "Hey! I lost my nautilus in the water — can you get him for me?",
        unlocked: false,
      };
    }
    if (!this.removeOneItem("nautilus")) {
      return {
        ok: false,
        message: "Hmm… can't seem to take that nautilus.",
        unlocked: false,
      };
    }
    this.nautilusQuestDone = true;
    const unlocked = this.unlockHat("hat_shell");
    this.equipHat("hat_shell");
    return {
      ok: true,
      message: unlocked
        ? "You found him! Take this Shell Hat — it's yours!"
        : "Thanks for bringing my nautilus home!",
      unlocked,
    };
  }

  /** DEFINED Stellar Surfer (quest stage 3–6) — nerfed until ascended. */
  isStellarSurferDefined(): boolean {
    return (
      this.ownsRod("test_rod") &&
      !this.stellarSurferAscended &&
      this.astralSurferQuestStage >= 3 &&
      this.astralSurferQuestStage < 8
    );
  }

  isStellarSurferAscended(): boolean {
    return this.stellarSurferAscended;
  }

  canDeployStellarSurferBoat(): boolean {
    return this.ownsRod("test_rod") && this.stellarSurferAscended;
  }

  tryTurnInAstralStarline(): { ok: boolean; message: string } {
    if (this.astralStarlineDone || this.ownsRod("star_line_rod")) {
      this.astralStarlineDone = true;
      return { ok: false, message: "already" };
    }
    for (const ing of ASTRAL_STARLINE_COST) {
      if (this.countIngredientMatching(ing) < ing.count) {
        return { ok: false, message: "need_more" };
      }
    }
    for (const ing of ASTRAL_STARLINE_COST) {
      this.removeIngredientMatching(ing);
    }
    this.addItem("star_line_rod");
    this.astralStarlineDone = true;
    return { ok: true, message: "done" };
  }

  startAstralSurferQuest(): boolean {
    if (this.astralSurferQuestStage > 0) return false;
    if (!this.ownsRod("star_line_rod")) return false;
    this.astralSurferQuestStage = 1;
    this.astralSurferStarlightCaught = false;
    this.astralSurferDolphinStarline = false;
    this.astralSurferCatchCount = 0;
    this.astralSurferDolphinSurfer = false;
    return true;
  }

  recordAstralCatch(opts: {
    speciesId: ItemId;
    mutation: FishMutationId | null;
    rodId: ItemId;
  }): { toast?: string; advanced?: boolean } {
    const stage = this.astralSurferQuestStage;
    if (stage < 1 || stage >= 8) return {};

    if (stage === 1 && isStarlightCatch(opts.mutation)) {
      if (!this.astralSurferStarlightCaught) {
        this.astralSurferStarlightCaught = true;
        return { toast: "Astral Warden: Starlight catch recorded!", advanced: true };
      }
    }
    if (
      stage === 2 &&
      opts.speciesId === "dolphin" &&
      opts.rodId === "star_line_rod"
    ) {
      if (!this.astralSurferDolphinStarline) {
        this.astralSurferDolphinStarline = true;
        return {
          toast: "Astral Warden: Dolphin on Star Line!",
          advanced: true,
        };
      }
    }
    if (
      (stage === 5 || (stage > 5 && stage < 8)) &&
      opts.rodId === "test_rod" &&
      this.astralSurferCatchCount < ASTRAL_SURFER_CATCH_GOAL
    ) {
      // Only count toward goal while on stage 5
      if (stage === 5) {
        this.astralSurferCatchCount += 1;
        if (this.astralSurferCatchCount >= ASTRAL_SURFER_CATCH_GOAL) {
          return {
            toast: `Astral Warden: ${ASTRAL_SURFER_CATCH_GOAL} Surfer catches!`,
            advanced: true,
          };
        }
        if (this.astralSurferCatchCount % 11 === 0) {
          return {
            toast: `Surfer catches ${this.astralSurferCatchCount}/${ASTRAL_SURFER_CATCH_GOAL}`,
          };
        }
      }
    }
    if (
      stage === 6 &&
      opts.speciesId === "dolphin" &&
      opts.rodId === "test_rod"
    ) {
      if (!this.astralSurferDolphinSurfer) {
        this.astralSurferDolphinSurfer = true;
        return {
          toast: "Astral Warden: Dolphin on Stellar Surfer!",
          advanced: true,
        };
      }
    }
    return {};
  }

  tryAdvanceAstralSurferFromTalk(): {
    ok: boolean;
    grantedDefined?: boolean;
    ascended?: boolean;
    messageKey: string;
  } {
    const stage = this.astralSurferQuestStage;
    if (stage === 1 && this.astralSurferStarlightCaught) {
      this.astralSurferQuestStage = 2;
      return { ok: true, messageKey: "surferStage1Done" };
    }
    if (stage === 2 && this.astralSurferDolphinStarline) {
      this.astralSurferQuestStage = 3;
      return { ok: true, messageKey: "surferStage2Done" };
    }
    if (stage === 3) {
      for (const ing of ASTRAL_SURFER_STAGE3_COST) {
        if (this.countIngredientMatching(ing) < ing.count) {
          return { ok: false, messageKey: "surferStage3Need" };
        }
      }
      for (const ing of ASTRAL_SURFER_STAGE3_COST) {
        this.removeIngredientMatching(ing);
      }
      if (!this.ownsRod("test_rod")) this.addItem("test_rod");
      this.astralSurferQuestStage = 4;
      return { ok: true, grantedDefined: true, messageKey: "surferStage3Done" };
    }
    if (stage === 4) {
      for (const ing of ASTRAL_SURFER_STAGE4_COST) {
        if (this.countIngredientMatching(ing) < ing.count) {
          return { ok: false, messageKey: "surferStage4Need" };
        }
      }
      for (const ing of ASTRAL_SURFER_STAGE4_COST) {
        this.removeIngredientMatching(ing);
      }
      this.astralSurferQuestStage = 5;
      this.astralSurferCatchCount = 0;
      return { ok: true, messageKey: "surferStage4Done" };
    }
    if (stage === 5 && this.astralSurferCatchCount >= ASTRAL_SURFER_CATCH_GOAL) {
      this.astralSurferQuestStage = 6;
      return { ok: true, messageKey: "surferStage5Done" };
    }
    if (stage === 6 && this.astralSurferDolphinSurfer) {
      this.astralSurferQuestStage = 7;
      return { ok: true, messageKey: "surferStage6Done" };
    }
    if (stage === 7) {
      for (const ing of ASTRAL_SURFER_STAGE7_COST) {
        if (this.countIngredientMatching(ing) < ing.count) {
          return { ok: false, messageKey: "surferStage7Need" };
        }
      }
      for (const ing of ASTRAL_SURFER_STAGE7_COST) {
        this.removeIngredientMatching(ing);
      }
      if (!this.ownsRod("test_rod")) this.addItem("test_rod");
      this.stellarSurferAscended = true;
      this.astralSurferQuestStage = 8;
      if (!this.ownedBoats.includes("stellar_surfer")) {
        this.ownedBoats.push("stellar_surfer");
      }
      return { ok: true, ascended: true, messageKey: "surferStage7Done" };
    }
    return { ok: false, messageKey: "wait" };
  }

  grantAmulet(amuletId: ItemId): boolean {
    if (!ITEMS[amuletId]?.isAmulet) return false;
    this.ownedAmulets[amuletId] = this.getAmuletCount(amuletId) + 1;
    return true;
  }

  /**
   * Talk to a Fish Quest angler on an island.
   * One active quest world-wide — must finish before accepting another.
   */
  talkFishQuest(islandId: FishQuestIslandId): {
    text: string;
    toast?: string;
    toastColor?: string;
    changed: boolean;
  } {
    const islandName = FISH_QUEST_ISLAND_NAMES[islandId];
    const habitatLabel =
      FISH_QUEST_HABITAT_LABEL[
        islandId === "swamp"
          ? "pond"
          : islandId === "collectors"
            ? "reef"
            : "ocean"
      ];

    const active = this.activeFishQuest;

    if (active && active.islandId === islandId) {
      const target = active.targetSpecies;
      const def = ITEMS[target];
      const name = def?.name ?? "fish";
      if (this.hasItem(target)) {
        this.removeOneItem(target);
        const coins = fishQuestCoinReward(target);
        this.coins += coins;
        const amuletId = rollFishQuestAmulet(target);
        let amuletLine = "";
        let toast = `+$${coins.toLocaleString()} for the ${name}!`;
        let toastColor = "#7CFC00";
        if (amuletId) {
          this.grantAmulet(amuletId);
          const aName = ITEMS[amuletId].name;
          amuletLine = `\n\nA bonus gift — you received a ${aName}!`;
          toast = `+$${coins.toLocaleString()} · ${aName}!`;
          toastColor = amuletId === "amulet_thunder" ? "#ffe066" : "#c8b0ff";
        }
        this.activeFishQuest = null;
        return {
          text:
            `Perfect catch! Here's $${coins.toLocaleString()} for that ${name}.` +
            amuletLine +
            `\n\nCome back anytime for another ${habitatLabel} request.`,
          toast,
          toastColor,
          changed: true,
        };
      }
      return {
        text:
          `Still need a ${name} from the ${habitatLabel}.\n` +
          `Catch one and bring it back — no mythicals on my list.`,
        changed: false,
      };
    }

    if (active && active.islandId !== islandId) {
      const other = FISH_QUEST_ISLAND_NAMES[active.islandId];
      const need = ITEMS[active.targetSpecies]?.name ?? "fish";
      return {
        text:
          `You've already got a job from ${other} — they want a ${need}.\n` +
          `Finish that before I can give you a new request.`,
        changed: false,
      };
    }

    const target = rollFishQuestTarget(islandId);
    if (!target) {
      return {
        text: "Hmm… nothing swimming in these waters right now. Try later.",
        changed: false,
      };
    }
    this.activeFishQuest = { islandId, targetSpecies: target };
    const name = ITEMS[target].name;
    const rarity = ITEMS[target].rarity ?? "common";
    return {
      text:
        `Hey! I'm Fish Quest of ${islandName}.\n\n` +
        `Bring me a ${name} (${rarity}) from the ${habitatLabel},\n` +
        `and I'll pay you well` +
        (rarity === "epic" || rarity === "legendary"
          ? " — maybe even an amulet."
          : ".") +
        `\n\nQuest accepted!`,
      toast: `Fish Quest: catch a ${name}`,
      toastColor: "#7ec8e8",
      changed: true,
    };
  }

  claimBestiaryReward(itemId: ItemId): {
    ok: boolean;
    reward: number;
    message: string;
  } {
    const def = ITEMS[itemId];
    if (!def || def.sellPrice == null) {
      return { ok: false, reward: 0, message: "Unknown fish." };
    }
    if (!this.isBestiaryFound(itemId)) {
      return { ok: false, reward: 0, message: "You haven't caught this yet." };
    }
    if (this.isBestiaryClaimed(itemId)) {
      return { ok: false, reward: 0, message: "Already claimed." };
    }
    const rarity = def.rarity ?? "common";
    const reward = BESTIARY_CLAIM_REWARD[rarity];
    this.bestiaryClaimed.push(itemId);
    this.coins += reward;
    return {
      ok: true,
      reward,
      message: `Claimed $${reward} for discovering ${def.name}!`,
    };
  }

  /** Toggle keep/favorite on a bag fish or ore slot (won't be sold). */
  toggleKeepBag(index: number): boolean | null {
    const slot = this.bag[index];
    if (!slot?.itemId || !isMerchantSellable(slot.itemId)) return null;
    slot.keep = !slot.keep;
    return !!slot.keep;
  }

  /** Toggle keep/favorite on a hotbar fish or ore slot. */
  toggleKeepHotbar(index: number): boolean | null {
    const slot = this.hotbar[index];
    if (!slot?.itemId || !isMerchantSellable(slot.itemId)) return null;
    slot.keep = !slot.keep;
    return !!slot.keep;
  }

  private findStack(
    itemId: ItemId,
    mutation: FishMutationId | null = null,
    size: FishSizeId | null = null,
    paintTint: number | null = null
  ): InventorySlot | undefined {
    const match = (s: InventorySlot) =>
      s.itemId === itemId &&
      sameMutation(s.mutation, mutation) &&
      sameSize(s.size, size) &&
      samePaintTint(s.paintTint, paintTint);
    return this.bag.find(match) ?? this.hotbar.find(match);
  }

  getFishCount(): number {
    return [...this.bag, ...this.hotbar]
      .filter((s) => s.itemId != null && FISH_ITEM_IDS.includes(s.itemId))
      .reduce((sum, s) => sum + s.count, 0);
  }

  getSellableFishCount(): number {
    return [...this.bag, ...this.hotbar]
      .filter(
        (s) =>
          s.itemId != null &&
          isMerchantSellable(s.itemId) &&
          !s.keep &&
          !ITEMS[s.itemId].isQuestItem &&
          ITEMS[s.itemId].sellPrice != null
      )
      .reduce((sum, s) => sum + s.count, 0);
  }

  /** Total coins you'd earn selling all unlocked fish. */
  getSellableFishValue(): number {
    let earned = 0;
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (
        !slot.itemId ||
        !isMerchantSellable(slot.itemId) ||
        slot.count <= 0 ||
        slot.keep ||
        ITEMS[slot.itemId].isQuestItem ||
        ITEMS[slot.itemId].sellPrice == null
      ) {
        continue;
      }
      const price = ITEMS[slot.itemId].sellPrice ?? 0;
      const mult = mutationSellMult(slot.mutation) * sizeSellMult(slot.size);
      earned += slot.count * price * mult;
    }
    return Math.round(earned);
  }

  getKeptFishCount(): number {
    return [...this.bag, ...this.hotbar]
      .filter(
        (s) =>
          s.itemId != null &&
          FISH_ITEM_IDS.includes(s.itemId) &&
          !!s.keep
      )
      .reduce((sum, s) => sum + s.count, 0);
  }

  /** Sell all unlocked fish at their item sell prices (mutation + size multipliers). */
  sellAllFish(): { sold: number; earned: number } {
    let sold = 0;
    let earned = 0;
    let ashSold = 0;
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (
        !slot.itemId ||
        !isMerchantSellable(slot.itemId) ||
        slot.count <= 0 ||
        slot.keep ||
        ITEMS[slot.itemId].isQuestItem ||
        ITEMS[slot.itemId].sellPrice == null
      ) {
        continue;
      }
      const price = ITEMS[slot.itemId].sellPrice ?? 0;
      const mult = mutationSellMult(slot.mutation) * sizeSellMult(slot.size);
      if (slot.mutation === "blasted") ashSold += slot.count;
      sold += slot.count;
      earned += slot.count * price * mult;
      slot.itemId = null;
      slot.count = 0;
      slot.mutation = null;
      slot.size = null;
      slot.paintTint = null;
      slot.keep = false;
    }
    this.coins += earned;
    this.recordBlastedFishSold(ashSold);
    return { sold, earned };
  }

  private isStellarMerchantFishSlot(slot: InventorySlot): boolean {
    return (
      !!slot.itemId &&
      FISH_ITEM_IDS.includes(slot.itemId) &&
      !ITEMS[slot.itemId].isQuestItem &&
      ITEMS[slot.itemId].sellPrice != null &&
      !slot.keep &&
      isStellarMerchantMutation(slot.mutation)
    );
  }

  getStellarMerchantSellableCount(): number {
    return [...this.bag, ...this.hotbar]
      .filter((s) => this.isStellarMerchantFishSlot(s))
      .reduce((sum, s) => sum + s.count, 0);
  }

  /** Premium offer for Starstruck / Event Horizon / Lunar / Moonlight fish. */
  getStellarMerchantSellableValue(): number {
    let earned = 0;
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (!this.isStellarMerchantFishSlot(slot) || slot.count <= 0) continue;
      const price = ITEMS[slot.itemId!].sellPrice ?? 0;
      const mult =
        stellarMerchantMutationMult(slot.mutation) * sizeSellMult(slot.size);
      earned += slot.count * price * mult;
    }
    return Math.round(earned);
  }

  sellStellarMerchantFish(): { sold: number; earned: number } {
    let sold = 0;
    let earned = 0;
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (!this.isStellarMerchantFishSlot(slot) || slot.count <= 0) continue;
      const price = ITEMS[slot.itemId!].sellPrice ?? 0;
      const mult =
        stellarMerchantMutationMult(slot.mutation) * sizeSellMult(slot.size);
      sold += slot.count;
      earned += slot.count * price * mult;
      slot.itemId = null;
      slot.count = 0;
      slot.mutation = null;
      slot.size = null;
      slot.paintTint = null;
      slot.keep = false;
    }
    earned = Math.round(earned);
    this.coins += earned;
    return { sold, earned };
  }

  /** Fair coin value for one unit in a sellable fish slot. */
  getFishUnitFairValue(slot: InventorySlot): number {
    if (!slot.itemId || !isMerchantSellable(slot.itemId) || slot.keep) {
      return 0;
    }
    const price = ITEMS[slot.itemId].sellPrice ?? 0;
    return Math.round(
      price * mutationSellMult(slot.mutation) * sizeSellMult(slot.size)
    );
  }

  /** Fish stacks The Appraiser will re-roll (favorites allowed). */
  listAppraisableFishSlots(): InventorySlot[] {
    return [...this.bag, ...this.hotbar].filter((s) => {
      if (!s.itemId || s.count <= 0) return false;
      const def = ITEMS[s.itemId];
      if (!def || def.isMineral || def.isQuestItem || def.isRod || def.isBait) {
        return false;
      }
      return isMerchantSellable(s.itemId) || !!def.isCatchable;
    });
  }

  /** Appraisal fee — scales with the fish's current worth. */
  getAppraiseCost(slot: InventorySlot): number {
    if (!slot.itemId) return 0;
    const base = ITEMS[slot.itemId].sellPrice ?? 0;
    const fair = Math.round(
      base * mutationSellMult(slot.mutation) * sizeSellMult(slot.size)
    );
    return Math.max(50, Math.round(fair * 0.45));
  }

  /**
   * Pay to wipe mutation/size on one fish unit, then apply rolled bonuses.
   * Splits stacks when count > 1.
   */
  appraiseFish(
    slot: InventorySlot,
    mutation: FishMutationId | null,
    size: FishSizeId | null
  ): {
    ok: boolean;
    message: string;
    paid: number;
    itemId?: ItemId;
    mutation?: FishMutationId | null;
    size?: FishSizeId | null;
  } {
    if (!slot.itemId || slot.count <= 0) {
      return { ok: false, message: "Nothing to appraise.", paid: 0 };
    }
    const id = slot.itemId;
    const def = ITEMS[id];
    if (!def || def.isMineral || def.isQuestItem) {
      return { ok: false, message: "I only appraise fish.", paid: 0 };
    }

    const live =
      [...this.bag, ...this.hotbar].find(
        (s) =>
          s.itemId === id &&
          sameMutation(s.mutation, slot.mutation) &&
          sameSize(s.size, slot.size) &&
          s.count > 0
      ) ?? null;
    if (!live) return { ok: false, message: "That fish is gone.", paid: 0 };

    const cost = this.getAppraiseCost(live);
    if (this.coins < cost) {
      return {
        ok: false,
        message: `Need $${cost.toLocaleString("en-US")} — you have $${this.coins.toLocaleString("en-US")}.`,
        paid: 0,
      };
    }

    this.coins -= cost;
    const keep = !!live.keep;

    // Remove one unit from the old stack
    live.count -= 1;
    if (live.count <= 0) {
      live.itemId = null;
      live.count = 0;
      live.mutation = null;
      live.size = null;
      live.paintTint = null;
      live.keep = false;
    }

    // Place the appraised fish (new mutation/size)
    const existing = this.findStack(id, mutation, size);
    if (existing) {
      existing.count += 1;
      if (keep) existing.keep = true;
    } else {
      const empty = this.bag.find(
        (s, i) => i < this.getBagCapacity() && s.itemId === null
      );
      const target =
        empty ??
        (live.itemId === null ? live : null) ??
        this.hotbar.find((s) => s.itemId === null);
      if (!target) {
        // Refund + put fish back without appraisal
        this.coins += cost;
        if (live.itemId === null) {
          live.itemId = id;
          live.count = 1;
          live.mutation = slot.mutation ?? null;
          live.size = slot.size ?? null;
          live.keep = keep;
        } else {
          this.addItem(id, 1, slot.mutation ?? null, slot.size ?? null);
        }
        return { ok: false, message: "Bag is full!", paid: 0 };
      }
      target.itemId = id;
      target.count = 1;
      target.mutation = mutation;
      target.size = size;
      target.keep = keep;
    }

    const mutName = mutation ? MUTATIONS[mutation].name : null;
    const sizeName =
      size && size !== "normal" ? FISH_SIZES[size].name : null;
    const bits: string[] = [];
    if (mutName) bits.push(mutName);
    if (sizeName) bits.push(sizeName);
    const outcome =
      bits.length > 0
        ? bits.join(" · ")
        : "No special traits this time";

    return {
      ok: true,
      paid: cost,
      itemId: id,
      mutation,
      size,
      message: `Appraised ${def.name} (−$${cost.toLocaleString("en-US")}) — ${outcome}!`,
    };
  }

  /** List unlocked fish stacks the player can bargain-sell (one unit each offer). */
  listBargainFishSlots(): InventorySlot[] {
    return [...this.bag, ...this.hotbar].filter(
      (s) =>
        s.itemId != null &&
        isMerchantSellable(s.itemId) &&
        s.count > 0 &&
        !s.keep
    );
  }

  /** Remove one fish matching slot identity; pay `earned` coins. */
  sellFishUnitAtPrice(
    slot: InventorySlot,
    earned: number
  ): { ok: boolean; message: string } {
    if (
      !slot.itemId ||
      !isMerchantSellable(slot.itemId) ||
      slot.count <= 0 ||
      slot.keep
    ) {
      return {
        ok: false,
        message: "Nothing to sell.",
      };
    }
    const id = slot.itemId;
    const mut = slot.mutation;
    const size = slot.size;
    // Find live slot (reference may be stale)
    const live =
      [...this.bag, ...this.hotbar].find(
        (s) =>
          s.itemId === id &&
          s.mutation === mut &&
          s.size === size &&
          !s.keep &&
          s.count > 0
      ) ?? null;
    if (!live) return { ok: false, message: "That fish is gone." };
    if (mut === "blasted") this.recordBlastedFishSold(1);
    live.count -= 1;
    if (live.count <= 0) {
      live.itemId = null;
      live.count = 0;
      live.mutation = null;
      live.size = null;
      live.paintTint = null;
      live.keep = false;
    }
    this.coins += Math.max(0, Math.round(earned));
    return {
      ok: true,
      message: `Sold for $${Math.round(earned)}.`,
    };
  }

  getAllSlots(): InventorySlot[] {
    return [...this.hotbar, ...this.bag];
  }

  getOwnedRods(): ItemId[] {
    // Starter first, then any other owned rods in definition order
    const owned = ROD_ITEM_IDS.filter((id) => this.ownsRod(id));
    return owned.sort((a, b) => {
      if (a === "starter_rod") return -1;
      if (b === "starter_rod") return 1;
      return ROD_ITEM_IDS.indexOf(a) - ROD_ITEM_IDS.indexOf(b);
    });
  }

  /** Frostpeak Hermit — accept quest 1. */
  startFrostpeakQuest(): boolean {
    if (this.frostpeakQuestStage !== 0) return false;
    this.frostpeakQuestStage = 1;
    return true;
  }

  hasFrostpeakAngelfish(): boolean {
    return this.countFishMatching("angelfish", ["earthly", "sprout"]) > 0;
  }

  /** Quest 1 turn-in: Earthly/Sprout Angelfish (any size). */
  turnInFrostpeakAngelfish(): boolean {
    if (this.frostpeakQuestStage !== 1) return false;
    if (!this.removeFishMatching("angelfish", 1, ["earthly", "sprout"])) {
      return false;
    }
    this.frostpeakQuestStage = 2;
    return true;
  }

  /** Quest 2: record an epic caught with a required rod. Returns true if newly counted. */
  recordFrostpeakEpicCatch(rodId: ItemId, rarity: string | undefined): boolean {
    if (this.frostpeakQuestStage !== 2) return false;
    if (rarity !== "epic") return false;
    if (!(FROSTPEAK_EPIC_RODS as readonly string[]).includes(rodId)) return false;
    if (this.frostpeakEpicRods.includes(rodId)) return false;
    this.frostpeakEpicRods.push(rodId);
    return true;
  }

  /** Quest 2: legendary caught with Wildflower Rod. */
  recordFrostpeakWildflowerLegendary(
    rodId: ItemId,
    rarity: string | undefined
  ): boolean {
    if (this.frostpeakQuestStage !== 2) return false;
    if (this.frostpeakWildflowerLegendary) return false;
    if (rodId !== "wildflower_rod") return false;
    if (rarity !== "legendary") return false;
    this.frostpeakWildflowerLegendary = true;
    return true;
  }

  frostpeakEpicMissing(): ItemId[] {
    return missingEpicRods(this.frostpeakEpicRods);
  }

  frostpeakQuest2Complete(): boolean {
    return (
      this.frostpeakEpicMissing().length === 0 &&
      this.frostpeakWildflowerLegendary
    );
  }

  frostpeakEpicProgressLabel(): string {
    const done = this.frostpeakEpicRods.length;
    const total = FROSTPEAK_EPIC_RODS.length;
    const missing = this.frostpeakEpicMissing().map(rodDisplayName);
    const leg = this.frostpeakWildflowerLegendary
      ? "Legendary with Wildflower — done"
      : "Still need: Legendary with Wildflower";
    if (missing.length === 0) {
      return `${done}/${total} epics done\n${leg}`;
    }
    return `${done}/${total}\nStill need epic: ${missing.join(", ")}\n${leg}`;
  }

  /** Advance to quest 3 when all quest-2 goals are done — only via Hermit talk. */
  advanceFrostpeakEpicQuestIfDone(): boolean {
    if (this.frostpeakQuestStage !== 2) return false;
    if (!this.frostpeakQuest2Complete()) return false;
    this.frostpeakQuestStage = 3;
    return true;
  }

  hasFrostpeakMythicalOffer(): boolean {
    return this.findFrostpeakMythicalSlot() != null;
  }

  private findFrostpeakMythicalSlot(): InventorySlot | null {
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (!slot.itemId || slot.count <= 0 || slot.keep) continue;
      if (ITEMS[slot.itemId]?.rarity !== "mythical") continue;
      if (
        fishSellValue(
          slot.itemId,
          slot.mutation ?? null,
          slot.size ?? null
        ) > FROSTPEAK_MYTHICAL_MIN_VALUE
      ) {
        return slot;
      }
    }
    return null;
  }

  /** Quest 3: sellable (unfavorited) mythical sell value > 4000 → open cave. */
  turnInFrostpeakMythical(): boolean {
    if (this.frostpeakQuestStage !== 3) return false;
    const slot = this.findFrostpeakMythicalSlot();
    if (!slot?.itemId) return false;
    slot.count -= 1;
    if (slot.count <= 0) {
      slot.itemId = null;
      slot.count = 0;
      slot.mutation = null;
      slot.size = null;
      slot.paintTint = null;
      slot.keep = false;
    }
    this.frostpeakQuestStage = 4;
    this.frostpeakCaveOpen = true;
    return true;
  }

  startAshencastQuest(): boolean {
    if (this.ashencastQuestStage !== 0) return false;
    this.ashencastQuestStage = 1;
    return true;
  }

  countOwnedAnvilPieces(): number {
    return ANVIL_PIECE_IDS.filter((id) => this.hasItem(id)).length;
  }

  hasAllAnvilPieces(): boolean {
    return ANVIL_PIECE_IDS.every((id) => this.hasItem(id));
  }

  /** Stage 1 → 2: consume all three shards. */
  turnInAnvilPieces(): boolean {
    if (this.ashencastQuestStage !== 1) return false;
    if (!this.hasAllAnvilPieces()) return false;
    for (const id of ANVIL_PIECE_IDS) {
      if (!this.removeOneItem(id)) return false;
    }
    this.ashencastQuestStage = 2;
    return true;
  }

  hasAshencastTrout(): boolean {
    return this.hasItem("ashencast_trout");
  }

  /** Stage 2 → 3: consume trout, unlock forge. */
  turnInAshencastTrout(): boolean {
    if (this.ashencastQuestStage !== 2) return false;
    if (!this.removeOneItem("ashencast_trout")) return false;
    this.ashencastQuestStage = 3;
    return true;
  }

  isAshencastForgeReady(): boolean {
    return this.ashencastQuestStage >= 3;
  }

  ashencastQuestProgressLabel(): string {
    if (this.ashencastQuestStage === 1) {
      return `Anvil pieces ${this.countOwnedAnvilPieces()}/3`;
    }
    if (this.ashencastQuestStage === 2) {
      return this.hasAshencastTrout()
        ? "Ashencast Trout ready"
        : "Need an Ashencast Trout";
    }
    return "";
  }
}
