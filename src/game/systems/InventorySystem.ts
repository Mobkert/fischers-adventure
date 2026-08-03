import {
  FISH_ITEM_IDS,
  HOTBAR_SIZE,
  INVENTORY_SIZE,
  ITEMS,
  ItemId,
  InventorySlot,
  RodStats,
  ZERO_ROD_STATS,
  ROD_ITEM_IDS,
  FishMutationId,
  FishSizeId,
  mutationSellMult,
  sizeSellMult,
} from "../data/items";
import { SaveData, cloneSave, defaultSave } from "../save/SaveBank";

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

  bag: InventorySlot[] = Array.from({ length: INVENTORY_SIZE }, () => ({
    itemId: null,
    count: 0,
    mutation: null,
    size: null,
    keep: false,
  }));

  /** Rods the player owns (shown in the equipment bag). */
  ownedRods: ItemId[] = ["starter_rod"];
  equippedRodId: ItemId = "starter_rod";

  selectedHotbarIndex = 0;
  coins = 0;

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
    }
  }

  applySave(raw: SaveData): void {
    const save = cloneSave(raw);
    this.coins = save.coins;
    this.ownedRods = [...save.ownedRods];
    this.equippedRodId = save.equippedRodId;
    this.selectedHotbarIndex = save.selectedHotbarIndex;
    this.hotbar = save.hotbar.map((s) => ({ ...s }));
    this.bag = save.bag.map((s) => ({ ...s }));
    // Keep bag / equipment bag consistent
    this.hotbar[1] = {
      itemId: "equipment_bag",
      count: 1,
      mutation: null,
      size: null,
      keep: false,
    };
    if (!this.ownsRod(this.equippedRodId)) {
      this.equippedRodId = "starter_rod";
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
  }): SaveData {
    return cloneSave({
      ...defaultSave(),
      coins: this.coins,
      ownedRods: [...this.ownedRods],
      equippedRodId: this.equippedRodId,
      hotbar: this.hotbar.map((s) => ({ ...s })),
      bag: this.bag.map((s) => ({ ...s })),
      selectedHotbarIndex: this.selectedHotbarIndex,
      playerX: extra.playerX,
      playerY: extra.playerY,
      tutorialDone: extra.tutorialDone,
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

  getEquippedRodStats(): RodStats {
    return ITEMS[this.equippedRodId].rodStats ?? { ...ZERO_ROD_STATS };
  }

  ownsRod(rodId: ItemId): boolean {
    return this.ownedRods.includes(rodId);
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
        return true;
      }
    }

    const empty = this.bag.find((s) => s.itemId === null);
    if (!empty) return false;
    empty.itemId = itemId;
    empty.count = count;
    empty.mutation = mutation;
    empty.size = size;
    empty.keep = false;
    return true;
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
}
