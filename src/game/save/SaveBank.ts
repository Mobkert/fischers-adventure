import {
  HOTBAR_SIZE,
  MAX_INVENTORY_SIZE,
  ITEMS,
  ItemId,
  InventorySlot,
  FishMutationId,
  FishSizeId,
  MUTATIONS,
  FISH_SIZES,
  ROD_ITEM_IDS,
  HAT_ITEM_IDS,
  STARTER_HAT_IDS,
  AugmentUpgrades,
  ZERO_AUGMENT_UPGRADES,
  clampAugmentUpgrades,
} from "../data/items";
import type { WeatherId } from "../systems/WeatherSystem";
import { WEATHER } from "../systems/WeatherSystem";
import { BoatId, BOATS } from "../data/boats";
import {
  normalizeFrostpeakEpicRods,
  normalizeFrostpeakStage,
} from "../systems/FrostpeakQuest";
import { normalizeVaultGemsPlaced } from "../systems/VaultGemQuest";
import { normalizeActiveFishQuest } from "../systems/FishQuest";
import { normalizeAshencastQuestStage } from "../systems/AshencastQuest";
import type { PromoCodeId } from "../systems/PromoCodes";

const SAVES_STORAGE_KEY = "fischers_adventure_saves_v1";
export const SAVE_SLOT_COUNT = 5;

/** Rods defined in data but not granted to players yet. */
const UNOBTAINABLE_RODS: readonly ItemId[] = [];

export interface SaveData {
  v: 1;
  coins: number;
  ownedRods: ItemId[];
  equippedRodId: ItemId;
  ownedBobbers: ItemId[];
  equippedBobberId: ItemId;
  /** Amulet stacks — not sellable. */
  ownedAmulets: Partial<Record<ItemId, number>>;
  /** Highest backpack owned — cannot downgrade. */
  backpackId: ItemId;
  hotbar: InventorySlot[];
  bag: InventorySlot[];
  selectedHotbarIndex: number;
  playerX: number;
  playerY: number;
  tutorialDone: boolean;
  /** Fish species discovered in the bestiary. */
  bestiaryFound: ItemId[];
  /** Discovered fish whose unlock reward was already claimed. */
  bestiaryClaimed: ItemId[];
  /** Augment Rod permanent upgrade counts. */
  augmentUpgrades: AugmentUpgrades;
  /** Boats owned forever once purchased. */
  ownedBoats: import("../data/boats").BoatId[];
  /** In-game clock: minutes since midnight (0–1439). */
  gameMinutes: number;
  /** Active weather id. */
  weatherId: WeatherId;
  /** Frostpeak Hermit quest: 0 not started … 4 cave open. */
  frostpeakQuestStage: import("../systems/FrostpeakQuest").FrostpeakQuestStage;
  /** Rods that have landed an epic during Frostpeak quest 2. */
  frostpeakEpicRods: ItemId[];
  /** Legendary caught with Wildflower during Frostpeak quest 2. */
  frostpeakWildflowerLegendary: boolean;
  /** Cave boards removed after quest complete. */
  frostpeakCaveOpen: boolean;
  /** Accepted the Vault Keeper's lost-gems quest. */
  vaultGemQuestAccepted: boolean;
  /** Gem Vault gems currently seated on pedestals. */
  vaultGemsPlaced: import("../systems/VaultGemQuest").VaultGemId[];
  /** Lifetime coins earned selling to Frostpeak Cave merchants. */
  caveMerchantEarned: number;
  /** Finished the Crystal Gallery memory challenge (ready to claim / claimed). */
  crystalGalleryChallengeDone: boolean;
  /** Owns the Crystal Rod gallery skin. */
  crystalRodSkinOwned: boolean;
  /** Using the gallery skin on the Crystal Rod. */
  crystalRodSkinActive: boolean;
  /** Cosmetic hats unlocked. */
  ownedHats: ItemId[];
  /** Equipped hat, or null for none. */
  equippedHatId: ItemId | null;
  /** Turned in a nautilus to the Entrance shell seeker. */
  nautilusQuestDone: boolean;
  /** One active island fish quest at a time. */
  activeFishQuest: import("../systems/FishQuest").ActiveFishQuest | null;
  /** Ashencast forge anvil quest: 0 not started … 3 anvil fixed. */
  ashencastQuestStage: import("../systems/AshencastQuest").AshencastQuestStage;
  /** One-time promo codes redeemed from Code Guy. */
  redeemedPromoCodes: import("../systems/PromoCodes").PromoCodeId[];
  updatedAt: number;
}

export interface SaveSlotSummary {
  index: number;
  empty: boolean;
  active: boolean;
  coins: number;
  rods: number;
  fish: number;
  updatedAt: number;
}

interface SaveBank {
  version: 1;
  activeSlot: number;
  slots: (SaveData | null)[];
}

const DEFAULT_PLAYER_X = 640 + 420;
const DEFAULT_PLAYER_Y = 560 - 40;

function emptySlot(): InventorySlot {
  return { itemId: null, count: 0, mutation: null, size: null, keep: false };
}

function parseMutation(raw: unknown): FishMutationId | null {
  if (typeof raw !== "string") return null;
  return raw in MUTATIONS ? (raw as FishMutationId) : null;
}

function parseSize(raw: unknown): FishSizeId | null {
  if (typeof raw !== "string") return null;
  if (raw === "normal" || !(raw in FISH_SIZES)) return null;
  return raw as FishSizeId;
}

function cloneSlot(raw: unknown): InventorySlot {
  if (!raw || typeof raw !== "object") return emptySlot();
  const s = raw as Partial<InventorySlot>;
  const itemId =
    typeof s.itemId === "string" && s.itemId in ITEMS
      ? (s.itemId as ItemId)
      : null;
  return {
    itemId,
    count: itemId ? Math.max(0, Number(s.count) || 0) : 0,
    mutation: itemId ? parseMutation(s.mutation) : null,
    size: itemId ? parseSize(s.size) : null,
    keep: itemId ? Boolean(s.keep) : false,
  };
}

function cloneSlots(raw: unknown, size: number): InventorySlot[] {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length: size }, (_, i) => cloneSlot(arr[i]));
}

function parseFishIdList(raw: unknown): ItemId[] {
  if (!Array.isArray(raw)) return [];
  const out: ItemId[] = [];
  for (const id of raw) {
    if (
      typeof id === "string" &&
      id in ITEMS &&
      ITEMS[id as ItemId].sellPrice != null
    ) {
      out.push(id as ItemId);
    }
  }
  return [...new Set(out)];
}

export function defaultSave(): SaveData {
  const hotbar = Array.from({ length: HOTBAR_SIZE }, emptySlot);
  hotbar[0] = { itemId: "starter_rod", count: 1, mutation: null, size: null, keep: false };
  hotbar[1] = { itemId: "equipment_bag", count: 1, mutation: null, size: null, keep: false };
  hotbar[2] = { itemId: "bestiary", count: 1, mutation: null, size: null, keep: false };
  return {
    v: 1,
    coins: 0,
    ownedRods: ["starter_rod"],
    equippedRodId: "starter_rod",
    ownedBobbers: ["bobber_starter"],
    equippedBobberId: "bobber_starter",
    ownedAmulets: {},
    backpackId: "backpack_starter",
    hotbar,
    bag: Array.from({ length: MAX_INVENTORY_SIZE }, emptySlot),
    selectedHotbarIndex: 0,
    playerX: DEFAULT_PLAYER_X,
    playerY: DEFAULT_PLAYER_Y,
    tutorialDone: false,
    bestiaryFound: [],
    bestiaryClaimed: [],
    augmentUpgrades: { ...ZERO_AUGMENT_UPGRADES },
    ownedBoats: ["sailboat"],
    gameMinutes: 13 * 60, // 1:00 PM
    weatherId: "clear",
    frostpeakQuestStage: 0,
    frostpeakEpicRods: [],
    frostpeakWildflowerLegendary: false,
    frostpeakCaveOpen: false,
    vaultGemQuestAccepted: false,
    vaultGemsPlaced: [],
    caveMerchantEarned: 0,
    crystalGalleryChallengeDone: false,
    crystalRodSkinOwned: false,
    crystalRodSkinActive: false,
    ownedHats: [...STARTER_HAT_IDS],
    equippedHatId: null,
    nautilusQuestDone: false,
    activeFishQuest: null,
    ashencastQuestStage: 0,
    redeemedPromoCodes: [],
    updatedAt: Date.now(),
  };
}

function normalizeWeatherId(raw: unknown): WeatherId {
  if (typeof raw === "string" && raw in WEATHER) return raw as WeatherId;
  return "clear";
}

function normalizeGameMinutes(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return 13 * 60;
  return ((n % (24 * 60)) + 24 * 60) % (24 * 60);
}

function normalizeOwnedBoats(raw: unknown): BoatId[] {
  const out: BoatId[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === "string" && id in BOATS) out.push(id as BoatId);
    }
  }
  if (!out.includes("sailboat")) out.unshift("sailboat");
  return [...new Set(out)];
}

function normalizeRodId(id: unknown): ItemId | null {
  if (typeof id !== "string" || !(id in ITEMS)) return null;
  return ITEMS[id as ItemId].isRod ? (id as ItemId) : null;
}

function normalizeBobberId(id: unknown): ItemId | null {
  if (typeof id !== "string" || !(id in ITEMS)) return null;
  return ITEMS[id as ItemId].isBobber ? (id as ItemId) : null;
}

function normalizeHatId(id: unknown): ItemId | null {
  if (typeof id !== "string" || !(id in ITEMS)) return null;
  return ITEMS[id as ItemId].isHat ? (id as ItemId) : null;
}

function normalizeOwnedHats(raw: unknown): ItemId[] {
  const out: ItemId[] = [...STARTER_HAT_IDS];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      const hat = normalizeHatId(id);
      if (hat) out.push(hat);
    }
  }
  return [...new Set(out)].filter((id) => HAT_ITEM_IDS.includes(id));
}

function normalizeOwnedAmulets(
  raw: unknown
): Partial<Record<ItemId, number>> {
  const out: Partial<Record<ItemId, number>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!(key in ITEMS)) continue;
    const id = key as ItemId;
    if (!ITEMS[id].isAmulet) continue;
    const n = Math.floor(Number(value) || 0);
    if (n > 0) out[id] = n;
  }
  return out;
}

function normalizeBackpackId(id: unknown): ItemId | null {
  if (typeof id !== "string" || !(id in ITEMS)) return null;
  return ITEMS[id as ItemId].isBackpack ? (id as ItemId) : null;
}

function normalizePromoCodes(raw: unknown): PromoCodeId[] {
  const valid: PromoCodeId[] = [
    "birthday_rod",
    "free_coins_10k",
    "free_fish_gift_3",
    "sorry_for_bugs",
  ];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (id): id is PromoCodeId =>
      typeof id === "string" && valid.includes(id as PromoCodeId)
  );
}

export function cloneSave(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<SaveData>;

  const ownedRods: ItemId[] = Array.isArray(s.ownedRods)
    ? s.ownedRods
        .map(normalizeRodId)
        .filter((id): id is ItemId => id != null)
    : ["starter_rod"];
  if (!ownedRods.includes("starter_rod")) ownedRods.unshift("starter_rod");
  const uniqueRods: ItemId[] = [...new Set(ownedRods)].filter(
    (id) => !UNOBTAINABLE_RODS.includes(id)
  );
  if (!uniqueRods.includes("starter_rod")) uniqueRods.unshift("starter_rod");

  let equipped: ItemId =
    normalizeRodId(s.equippedRodId) ?? uniqueRods[0] ?? "starter_rod";
  if (UNOBTAINABLE_RODS.includes(equipped)) equipped = "starter_rod";
  if (!uniqueRods.includes(equipped)) equipped = uniqueRods[0] ?? "starter_rod";

  const ownedBobbers: ItemId[] = Array.isArray(s.ownedBobbers)
    ? s.ownedBobbers
        .map(normalizeBobberId)
        .filter((id): id is ItemId => id != null)
    : ["bobber_starter"];
  if (!ownedBobbers.includes("bobber_starter")) {
    ownedBobbers.unshift("bobber_starter");
  }
  const uniqueBobbers: ItemId[] = [...new Set(ownedBobbers)];
  let equippedBobber: ItemId =
    normalizeBobberId(s.equippedBobberId) ??
    uniqueBobbers[0] ??
    "bobber_starter";
  if (!uniqueBobbers.includes(equippedBobber)) {
    equippedBobber = uniqueBobbers[0];
  }

  const ownedAmulets = normalizeOwnedAmulets(s.ownedAmulets);

  let backpackId =
    normalizeBackpackId(s.backpackId) ?? "backpack_starter";
  if (!ITEMS[backpackId]?.isBackpack) backpackId = "backpack_starter";

  const hotbar = cloneSlots(s.hotbar, HOTBAR_SIZE);
  // Always keep equipment bag on slot 2 and bestiary on slot 3
  hotbar[1] = { itemId: "equipment_bag", count: 1, mutation: null, size: null, keep: false };
  hotbar[2] = { itemId: "bestiary", count: 1, mutation: null, size: null, keep: false };
  if (
    !hotbar[0].itemId ||
    !ITEMS[hotbar[0].itemId]?.isRod ||
    UNOBTAINABLE_RODS.includes(hotbar[0].itemId as ItemId)
  ) {
    hotbar[0] = { itemId: equipped, count: 1, mutation: null, size: null, keep: false };
  }

  const bag = cloneSlots(s.bag, MAX_INVENTORY_SIZE);
  for (let i = 0; i < bag.length; i++) {
    if (bag[i].itemId && UNOBTAINABLE_RODS.includes(bag[i].itemId as ItemId)) {
      bag[i] = emptySlot();
    }
  }
  let bestiaryFound = parseFishIdList(s.bestiaryFound);
  const bestiaryClaimed = parseFishIdList(s.bestiaryClaimed);
  // Retroactively unlock any fish already in inventory (pre-bestiary saves)
  for (const slot of [...hotbar, ...bag]) {
    if (slot.itemId && ITEMS[slot.itemId]?.sellPrice != null) {
      if (!bestiaryFound.includes(slot.itemId)) bestiaryFound.push(slot.itemId);
    }
  }
  bestiaryFound = [...new Set(bestiaryFound)];

  let ownedHats = normalizeOwnedHats(s.ownedHats);
  if (uniqueRods.includes("coral_rod") && !ownedHats.includes("hat_gem")) {
    ownedHats.push("hat_gem");
  }
  if (
    bestiaryFound.includes("yellowfin_tuna") &&
    !ownedHats.includes("hat_yellowfin")
  ) {
    ownedHats.push("hat_yellowfin");
  }
  if (Boolean(s.nautilusQuestDone) && !ownedHats.includes("hat_shell")) {
    ownedHats.push("hat_shell");
  }
  ownedHats = [...new Set(ownedHats)];
  const equippedHatRaw = normalizeHatId(s.equippedHatId);
  const equippedHatId =
    equippedHatRaw && ownedHats.includes(equippedHatRaw)
      ? equippedHatRaw
      : null;

  return {
    v: 1,
    coins: Math.max(0, Math.floor(Number(s.coins) || 0)),
    ownedRods: uniqueRods,
    equippedRodId: equipped,
    ownedBobbers: uniqueBobbers,
    equippedBobberId: equippedBobber,
    ownedAmulets,
    backpackId,
    hotbar,
    bag,
    selectedHotbarIndex: Math.max(
      0,
      Math.min(HOTBAR_SIZE - 1, Number(s.selectedHotbarIndex) || 0)
    ),
    playerX: Number.isFinite(Number(s.playerX))
      ? Number(s.playerX)
      : DEFAULT_PLAYER_X,
    playerY: Number.isFinite(Number(s.playerY))
      ? Number(s.playerY)
      : DEFAULT_PLAYER_Y,
    tutorialDone: Boolean(s.tutorialDone),
    bestiaryFound,
    bestiaryClaimed,
    augmentUpgrades: clampAugmentUpgrades(s.augmentUpgrades),
    ownedBoats: normalizeOwnedBoats(s.ownedBoats),
    gameMinutes: normalizeGameMinutes(s.gameMinutes),
    weatherId: normalizeWeatherId(s.weatherId),
    frostpeakQuestStage: normalizeFrostpeakStage(s.frostpeakQuestStage),
    frostpeakEpicRods: normalizeFrostpeakEpicRods(s.frostpeakEpicRods),
    frostpeakWildflowerLegendary: Boolean(s.frostpeakWildflowerLegendary),
    frostpeakCaveOpen: Boolean(s.frostpeakCaveOpen),
    vaultGemQuestAccepted: Boolean(s.vaultGemQuestAccepted),
    vaultGemsPlaced: normalizeVaultGemsPlaced(s.vaultGemsPlaced),
    caveMerchantEarned: Math.max(0, Math.floor(Number(s.caveMerchantEarned) || 0)),
    crystalGalleryChallengeDone: Boolean(s.crystalGalleryChallengeDone),
    crystalRodSkinOwned: Boolean(s.crystalRodSkinOwned),
    crystalRodSkinActive: Boolean(s.crystalRodSkinActive),
    ownedHats,
    equippedHatId,
    nautilusQuestDone: Boolean(s.nautilusQuestDone),
    activeFishQuest: normalizeActiveFishQuest(s.activeFishQuest),
    ashencastQuestStage: normalizeAshencastQuestStage(s.ashencastQuestStage),
    redeemedPromoCodes: normalizePromoCodes(s.redeemedPromoCodes),
    updatedAt: Number(s.updatedAt) || Date.now(),
  };
}

function emptyBank(): SaveBank {
  return {
    version: 1,
    activeSlot: 0,
    slots: Array.from({ length: SAVE_SLOT_COUNT }, () => null),
  };
}

function countFish(save: SaveData): number {
  return [...save.hotbar, ...save.bag]
    .filter((s) => s.itemId && ITEMS[s.itemId]?.sellPrice != null)
    .reduce((n, s) => n + s.count, 0);
}

export function loadSaveBank(): SaveBank {
  try {
    const raw = localStorage.getItem(SAVES_STORAGE_KEY);
    if (!raw) {
      const bank = emptyBank();
      bank.slots[0] = defaultSave();
      saveSaveBank(bank);
      return bank;
    }
    const parsed = JSON.parse(raw);
    const bank = emptyBank();
    bank.activeSlot = Math.max(
      0,
      Math.min(SAVE_SLOT_COUNT - 1, Number(parsed.activeSlot) || 0)
    );
    const slots = Array.isArray(parsed.slots) ? parsed.slots : [];
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      bank.slots[i] = slots[i] ? cloneSave(slots[i]) : null;
    }
    if (!bank.slots[bank.activeSlot]) {
      bank.slots[bank.activeSlot] = defaultSave();
      saveSaveBank(bank);
    }
    return bank;
  } catch {
    const bank = emptyBank();
    bank.slots[0] = defaultSave();
    return bank;
  }
}

export function saveSaveBank(bank: SaveBank): void {
  localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(bank));
}

export function getActiveSlotIndex(): number {
  return loadSaveBank().activeSlot;
}

export function loadActiveSave(): SaveData {
  const bank = loadSaveBank();
  const slot = bank.slots[bank.activeSlot];
  if (!slot) {
    const fresh = defaultSave();
    bank.slots[bank.activeSlot] = fresh;
    saveSaveBank(bank);
    return cloneSave(fresh);
  }
  return cloneSave(slot);
}

export function saveActiveSave(data: SaveData): void {
  const bank = loadSaveBank();
  bank.slots[bank.activeSlot] = {
    ...cloneSave(data),
    updatedAt: Date.now(),
  };
  saveSaveBank(bank);
}

export function listSaveSlots(): SaveSlotSummary[] {
  const bank = loadSaveBank();
  return bank.slots.map((slot, index) => {
    if (!slot) {
      return {
        index,
        empty: true,
        active: index === bank.activeSlot,
        coins: 0,
        rods: 0,
        fish: 0,
        updatedAt: 0,
      };
    }
    return {
      index,
      empty: false,
      active: index === bank.activeSlot,
      coins: slot.coins || 0,
      rods: slot.ownedRods?.length ?? 0,
      fish: countFish(slot),
      updatedAt: slot.updatedAt || 0,
    };
  });
}

export function switchToSlot(index: number): SaveData {
  const i = Math.max(0, Math.min(SAVE_SLOT_COUNT - 1, Number(index) || 0));
  const bank = loadSaveBank();
  if (!bank.slots[i]) {
    bank.slots[i] = defaultSave();
  }
  bank.activeSlot = i;
  saveSaveBank(bank);
  return cloneSave(bank.slots[i]);
}

export function saveActiveToSlot(index: number): SaveSlotSummary[] {
  const i = Math.max(0, Math.min(SAVE_SLOT_COUNT - 1, Number(index) || 0));
  const bank = loadSaveBank();
  const current = bank.slots[bank.activeSlot] || defaultSave();
  bank.slots[i] = {
    ...cloneSave(current),
    updatedAt: Date.now(),
  };
  saveSaveBank(bank);
  return listSaveSlots();
}

export function clearSaveSlot(index: number): SaveSlotSummary[] {
  const i = Math.max(0, Math.min(SAVE_SLOT_COUNT - 1, Number(index) || 0));
  const bank = loadSaveBank();
  if (i === bank.activeSlot) {
    bank.slots[i] = defaultSave();
  } else {
    bank.slots[i] = null;
  }
  saveSaveBank(bank);
  return listSaveSlots();
}

export function getSlotSave(index: number): SaveData | null {
  const i = Math.max(0, Math.min(SAVE_SLOT_COUNT - 1, Number(index) || 0));
  const bank = loadSaveBank();
  return bank.slots[i] ? cloneSave(bank.slots[i]) : null;
}

export function findEmptySlotIndex(): number {
  const bank = loadSaveBank();
  for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
    if (!bank.slots[i]) return i;
  }
  for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
    const s = bank.slots[i];
    if (
      s &&
      s.ownedRods.length === 1 &&
      s.ownedRods[0] === "starter_rod" &&
      !s.tutorialDone &&
      countFish(s) === 0
    ) {
      return i;
    }
  }
  return -1;
}

export function writeSaveToSlot(index: number, data: SaveData): SaveSlotSummary[] {
  const i = Math.max(0, Math.min(SAVE_SLOT_COUNT - 1, Number(index) || 0));
  const bank = loadSaveBank();
  bank.slots[i] = {
    ...cloneSave(data),
    updatedAt: Date.now(),
  };
  saveSaveBank(bank);
  return listSaveSlots();
}

export function isFreshLookingSave(data: SaveData): boolean {
  return (
    data.ownedRods.length === 1 &&
    data.ownedRods[0] === "starter_rod" &&
    countFish(data) === 0 &&
    !data.tutorialDone
  );
}

export function rodLabelList(rods: ItemId[]): string {
  return rods
    .filter((id) => ROD_ITEM_IDS.includes(id))
    .map((id) => ITEMS[id].name)
    .join(", ");
}
