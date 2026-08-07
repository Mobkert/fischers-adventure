import {
  FISH_ITEM_IDS,
  HOTBAR_SIZE,
  MAX_INVENTORY_SIZE,
  ITEMS,
  ItemId,
  InventorySlot,
  RodStats,
  ZERO_ROD_STATS,
  ROD_ITEM_IDS,
  AMULET_ITEM_IDS,
  FishMutationId,
  FishSizeId,
  mutationSellMult,
  sizeSellMult,
  MUTATIONS,
  BESTIARY_CLAIM_REWARD,
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
} from "../data/items";
import { SaveData, cloneSave, defaultSave } from "../save/SaveBank";
import type { WeatherId } from "./WeatherSystem";
import { BoatId, BOATS, BOAT_IDS } from "../data/boats";
import {
  FROSTPEAK_EPIC_RODS,
  FROSTPEAK_MYTHICAL_MIN_VALUE,
  FrostpeakQuestStage,
  fishSellValue,
  missingEpicRods,
  rodDisplayName,
} from "./FrostpeakQuest";
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

function sameMutation(
  a: FishMutationId | null | undefined,
  b: FishMutationId | null | undefined
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
  ownedBoats: BoatId[] = ["sailboat"];
  frostpeakQuestStage: FrostpeakQuestStage = 0;
  frostpeakEpicRods: ItemId[] = [];
  frostpeakCaveOpen = false;
  vaultGemQuestAccepted = false;
  vaultGemsPlaced: VaultGemId[] = [];
  caveMerchantEarned = 0;
  crystalGalleryChallengeDone = false;
  crystalRodSkinOwned = false;
  crystalRodSkinActive = false;
  ownedHats: ItemId[] = [...STARTER_HAT_IDS];
  equippedHatId: ItemId | null = null;
  nautilusQuestDone = false;
  activeFishQuest: ActiveFishQuest | null = null;
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
    this.ownedBoats = [...save.ownedBoats];
    this.frostpeakQuestStage = save.frostpeakQuestStage;
    this.frostpeakEpicRods = [...save.frostpeakEpicRods];
    this.frostpeakCaveOpen = save.frostpeakCaveOpen;
    this.vaultGemQuestAccepted = save.vaultGemQuestAccepted;
    this.vaultGemsPlaced = [...save.vaultGemsPlaced];
    this.caveMerchantEarned = save.caveMerchantEarned;
    this.crystalGalleryChallengeDone = save.crystalGalleryChallengeDone;
    this.crystalRodSkinOwned = save.crystalRodSkinOwned;
    this.crystalRodSkinActive = save.crystalRodSkinActive;
    this.ownedHats = [...save.ownedHats];
    this.equippedHatId = save.equippedHatId;
    this.nautilusQuestDone = save.nautilusQuestDone;
    this.activeFishQuest = save.activeFishQuest
      ? { ...save.activeFishQuest }
      : null;
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
    // Keep bag / equipment bag / bestiary consistent
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
      frostpeakCaveOpen: this.frostpeakCaveOpen,
      vaultGemQuestAccepted: this.vaultGemQuestAccepted,
      vaultGemsPlaced: [...this.vaultGemsPlaced],
      caveMerchantEarned: this.caveMerchantEarned,
      crystalGalleryChallengeDone: this.crystalGalleryChallengeDone,
      crystalRodSkinOwned: this.crystalRodSkinOwned,
      crystalRodSkinActive: this.crystalRodSkinActive,
      ownedHats: [...this.ownedHats],
      equippedHatId: this.equippedHatId,
      nautilusQuestDone: this.nautilusQuestDone,
      activeFishQuest: this.activeFishQuest
        ? { ...this.activeFishQuest }
        : null,
      updatedAt: Date.now(),
    });
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
    const bob = ITEMS[this.equippedBobberId]?.bobberStats ?? {};
    return {
      luck: rod.luck + (bob.luck ?? 0),
      resilience: rod.resilience,
      control: rod.control + (bob.control ?? 0),
      progressSpeed: rod.progressSpeed + (bob.progressSpeed ?? 0),
      lineDepth: rod.lineDepth + (bob.lineDepth ?? 0),
    };
  }

  /** Display stats for a rod (includes Augment upgrades when relevant). */
  getRodDisplayStats(rodId: ItemId): RodStats {
    const base = ITEMS[rodId]?.rodStats ?? { ...ZERO_ROD_STATS };
    if (rodId === "augment_rod") {
      return applyAugmentUpgrades(base, this.augmentUpgrades);
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
      kind: "fish" | "rod" | "bobber";
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
    if (entry.kind === "rod") {
      if (!def.isRod) return { ok: false, message: "That isn't a rod." };
      if (this.ownsRod(entry.itemId)) {
        return { ok: false, message: `You already own the ${def.name}.` };
      }
      this.coins -= cost;
      this.ownedRods.push(entry.itemId);
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
        const muts = this.craftIngredientMutations(ing);
        const have = this.countFishMatching(ing.itemId, muts);
        if (have < ing.count) {
          const mutLabel = muts
            ? muts.map((m) => MUTATIONS[m]?.name ?? m).join("/") + " "
            : "";
          return {
            ok: false,
            message: `Need ${ing.count}× ${mutLabel}${ITEMS[ing.itemId].name} (have ${have}).`,
          };
        }
      }
      this.coins -= cost;
      for (const ing of def.craftCost.ingredients) {
        this.removeFishMatching(
          ing.itemId,
          ing.count,
          this.craftIngredientMutations(ing) ?? undefined
        );
      }
      this.ownedBobbers.push(entry.itemId);
      return {
        ok: true,
        message: `Bought ${def.name} for $${cost} (fish used)!`,
      };
    }
    if (def.sellPrice == null) {
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
    return (
      ITEMS[this.equippedBobberId]?.bobberStats?.mutationChanceMult ?? 1
    );
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
    if (!def?.isRod || def.buyPrice == null) {
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
    this.ownedRods.push(rodId);
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
    this.ownedRods.push("coral_rod");
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

  ownsBoat(boatId: BoatId): boolean {
    return this.ownedBoats.includes(boatId);
  }

  getOwnedBoats(): BoatId[] {
    return BOAT_IDS.filter((id) => this.ownsBoat(id));
  }

  buyBoat(boatId: BoatId): { ok: boolean; message: string } {
    const def = BOATS[boatId];
    if (!def) return { ok: false, message: "Unknown boat." };
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
    if (!def?.isAmulet || def.buyPrice == null) {
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
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (slot.itemId !== itemId || slot.count <= 0) continue;
      if (allowed) {
        if (!slot.mutation || !allowed.includes(slot.mutation)) continue;
      }
      n += slot.count;
    }
    return n;
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
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (left <= 0) break;
      if (slot.itemId !== itemId || slot.count <= 0) continue;
      if (allowed) {
        if (!slot.mutation || !allowed.includes(slot.mutation)) continue;
      }
      const take = Math.min(slot.count, left);
      slot.count -= take;
      left -= take;
      if (slot.count <= 0) {
        slot.itemId = null;
        slot.count = 0;
        slot.mutation = null;
        slot.size = null;
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
      const muts = this.craftIngredientMutations(ing);
      const have = this.countFishMatching(ing.itemId, muts);
      if (have < ing.count) {
        const mutLabel = muts
          ? muts.map((m) => MUTATIONS[m]?.name ?? m).join("/") + " "
          : "";
        return {
          ok: false,
          message: `Need ${ing.count}× ${mutLabel}${ITEMS[ing.itemId].name} (have ${have}).`,
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
      this.removeFishMatching(
        ing.itemId,
        ing.count,
        this.craftIngredientMutations(ing) ?? undefined
      );
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
    size: FishSizeId | null = null
  ): boolean {
    if (ITEMS[itemId].isRod) {
      if (this.ownsRod(itemId)) return false;
      this.ownedRods.push(itemId);
      return true;
    }

    if (ITEMS[itemId].stackable) {
      // Prefer an unlocked matching stack so kept stacks stay separate
      const stack = this.findStack(itemId, mutation, size, false);
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
    this.discoverFish(itemId);
    return true;
  }

  hasItem(itemId: ItemId): boolean {
    return [...this.bag, ...this.hotbar].some(
      (s) => s.itemId === itemId && s.count > 0
    );
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
        slot.keep = false;
      }
      return true;
    }
    return false;
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

  /** Texture for UI / hotbar — gallery skin when active. */
  getRodTextureKey(rodId: ItemId): string {
    if (
      rodId === "crystal_rod" &&
      this.crystalRodSkinOwned &&
      this.crystalRodSkinActive
    ) {
      return "crystal_rod_skin";
    }
    return ITEMS[rodId]?.textureKey ?? "rod";
  }

  toggleCrystalRodSkin(): { ok: boolean; message: string } {
    if (!this.ownsRod("crystal_rod")) {
      return { ok: false, message: "You need the Crystal Rod first." };
    }
    if (!this.crystalRodSkinOwned) {
      return {
        ok: false,
        message: "No skin yet — visit the Crystal Gallery.",
      };
    }
    this.crystalRodSkinActive = !this.crystalRodSkinActive;
    return {
      ok: true,
      message: this.crystalRodSkinActive
        ? "Crystal Rod skin applied."
        : "Crystal Rod skin removed.",
    };
  }

  markCrystalGalleryChallengeDone(): void {
    this.crystalGalleryChallengeDone = true;
  }

  claimCrystalRodSkin(): { ok: boolean; message: string } {
    if (!this.crystalGalleryChallengeDone) {
      return { ok: false, message: "Complete the crystal memory challenge first." };
    }
    if (this.crystalRodSkinOwned) {
      return { ok: false, message: "You already have the Crystal Rod skin." };
    }
    this.crystalRodSkinOwned = true;
    this.crystalRodSkinActive = true;
    return {
      ok: true,
      message: "Crystal Rod skin unlocked!",
    };
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
    if (!FISH_ITEM_IDS.includes(itemId)) return false;
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

  /** Toggle keep on a bag fish slot (won't be sold). Returns new keep state or null. */
  toggleKeepBag(index: number): boolean | null {
    const slot = this.bag[index];
    if (!slot?.itemId || !FISH_ITEM_IDS.includes(slot.itemId)) return null;
    slot.keep = !slot.keep;
    return !!slot.keep;
  }

  /** Toggle keep on a hotbar fish slot. */
  toggleKeepHotbar(index: number): boolean | null {
    const slot = this.hotbar[index];
    if (!slot?.itemId || !FISH_ITEM_IDS.includes(slot.itemId)) return null;
    slot.keep = !slot.keep;
    return !!slot.keep;
  }

  private findStack(
    itemId: ItemId,
    mutation: FishMutationId | null = null,
    size: FishSizeId | null = null,
    allowKept = false
  ): InventorySlot | undefined {
    const match = (s: InventorySlot) =>
      s.itemId === itemId &&
      sameMutation(s.mutation, mutation) &&
      sameSize(s.size, size) &&
      (allowKept || !s.keep);
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
          FISH_ITEM_IDS.includes(s.itemId) &&
          !s.keep
      )
      .reduce((sum, s) => sum + s.count, 0);
  }

  /** Total coins you'd earn selling all unlocked fish. */
  getSellableFishValue(): number {
    let earned = 0;
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (
        !slot.itemId ||
        !FISH_ITEM_IDS.includes(slot.itemId) ||
        slot.count <= 0 ||
        slot.keep
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
    for (const slot of [...this.bag, ...this.hotbar]) {
      if (
        !slot.itemId ||
        !FISH_ITEM_IDS.includes(slot.itemId) ||
        slot.count <= 0 ||
        slot.keep
      ) {
        continue;
      }
      const price = ITEMS[slot.itemId].sellPrice ?? 0;
      const mult = mutationSellMult(slot.mutation) * sizeSellMult(slot.size);
      sold += slot.count;
      earned += slot.count * price * mult;
      slot.itemId = null;
      slot.count = 0;
      slot.mutation = null;
      slot.size = null;
      slot.keep = false;
    }
    this.coins += earned;
    return { sold, earned };
  }

  /** Fair coin value for one unit in a sellable fish slot. */
  getFishUnitFairValue(slot: InventorySlot): number {
    if (!slot.itemId || !FISH_ITEM_IDS.includes(slot.itemId) || slot.keep) {
      return 0;
    }
    const price = ITEMS[slot.itemId].sellPrice ?? 0;
    return Math.round(
      price * mutationSellMult(slot.mutation) * sizeSellMult(slot.size)
    );
  }

  /** List unlocked fish stacks the player can bargain-sell (one unit each offer). */
  listBargainFishSlots(): InventorySlot[] {
    return [...this.bag, ...this.hotbar].filter(
      (s) =>
        s.itemId != null &&
        FISH_ITEM_IDS.includes(s.itemId) &&
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
      !FISH_ITEM_IDS.includes(slot.itemId) ||
      slot.count <= 0 ||
      slot.keep
    ) {
      return { ok: false, message: "Nothing to sell." };
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
    live.count -= 1;
    if (live.count <= 0) {
      live.itemId = null;
      live.count = 0;
      live.mutation = null;
      live.size = null;
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

  frostpeakEpicMissing(): ItemId[] {
    return missingEpicRods(this.frostpeakEpicRods);
  }

  frostpeakEpicProgressLabel(): string {
    const done = this.frostpeakEpicRods.length;
    const total = FROSTPEAK_EPIC_RODS.length;
    const missing = this.frostpeakEpicMissing().map(rodDisplayName);
    if (missing.length === 0) return `${done}/${total} — all done!`;
    return `${done}/${total}\nStill need: ${missing.join(", ")}`;
  }

  /** Advance to quest 3 when all epic rods are done — only via Hermit talk. */
  advanceFrostpeakEpicQuestIfDone(): boolean {
    if (this.frostpeakQuestStage !== 2) return false;
    if (this.frostpeakEpicMissing().length > 0) return false;
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
      slot.keep = false;
    }
    this.frostpeakQuestStage = 4;
    this.frostpeakCaveOpen = true;
    return true;
  }
}
