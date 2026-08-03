import {
  HOTBAR_SIZE,
  INVENTORY_SIZE,
  ITEMS,
  ItemId,
  InventorySlot,
  FishMutationId,
  FishSizeId,
  MUTATIONS,
  FISH_SIZES,
  ROD_ITEM_IDS,
} from "../data/items";

const SAVES_STORAGE_KEY = "fischers_adventure_saves_v1";
export const SAVE_SLOT_COUNT = 5;

export interface SaveData {
  v: 1;
  coins: number;
  ownedRods: ItemId[];
  equippedRodId: ItemId;
  hotbar: InventorySlot[];
  bag: InventorySlot[];
  selectedHotbarIndex: number;
  playerX: number;
  playerY: number;
  tutorialDone: boolean;
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

export function defaultSave(): SaveData {
  const hotbar = Array.from({ length: HOTBAR_SIZE }, emptySlot);
  hotbar[0] = { itemId: "starter_rod", count: 1, mutation: null, size: null, keep: false };
  hotbar[1] = { itemId: "equipment_bag", count: 1, mutation: null, size: null, keep: false };
  return {
    v: 1,
    coins: 0,
    ownedRods: ["starter_rod"],
    equippedRodId: "starter_rod",
    hotbar,
    bag: Array.from({ length: INVENTORY_SIZE }, emptySlot),
    selectedHotbarIndex: 0,
    playerX: DEFAULT_PLAYER_X,
    playerY: DEFAULT_PLAYER_Y,
    tutorialDone: false,
    updatedAt: Date.now(),
  };
}

function normalizeRodId(id: unknown): ItemId | null {
  if (typeof id !== "string" || !(id in ITEMS)) return null;
  return ITEMS[id as ItemId].isRod ? (id as ItemId) : null;
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
  // Unique preserve order
  const uniqueRods: ItemId[] = [...new Set(ownedRods)];

  let equipped: ItemId =
    normalizeRodId(s.equippedRodId) ?? uniqueRods[0] ?? "starter_rod";
  if (!uniqueRods.includes(equipped)) equipped = uniqueRods[0];

  const hotbar = cloneSlots(s.hotbar, HOTBAR_SIZE);
  // Always keep equipment bag on slot 2
  hotbar[1] = { itemId: "equipment_bag", count: 1, mutation: null, size: null, keep: false };
  if (!hotbar[0].itemId || !ITEMS[hotbar[0].itemId]?.isRod) {
    hotbar[0] = { itemId: equipped, count: 1, mutation: null, size: null, keep: false };
  }

  return {
    v: 1,
    coins: Math.max(0, Math.floor(Number(s.coins) || 0)),
    ownedRods: uniqueRods,
    equippedRodId: equipped,
    hotbar,
    bag: cloneSlots(s.bag, INVENTORY_SIZE),
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
