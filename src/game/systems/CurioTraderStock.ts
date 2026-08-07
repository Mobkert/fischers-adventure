import {
  FISH_SIZES,
  FishMutationId,
  FishSizeId,
  ITEMS,
  ItemId,
  MUTATIONS,
  mutationSellMult,
  sizeSellMult,
} from "../data/items";

export type CurioStockEntry =
  | {
      id: string;
      kind: "fish";
      itemId: ItemId;
      mutation: FishMutationId | null;
      size: FishSizeId | null;
      fair: number;
      label: string;
    }
  | {
      id: string;
      kind: "rod";
      itemId: ItemId;
      fair: number;
      label: string;
    }
  | {
      id: string;
      kind: "bobber";
      itemId: ItemId;
      fair: number;
      label: string;
      /** Short ingredient summary shown in the list. */
      needsLabel: string;
    };

const RESTOCK_MS = 3 * 60 * 1000;

/** Craft bobbers the Curio may discount — never Mutation Bobber. */
const CURIO_BOBBER_IDS: ItemId[] = ["bobber_double", "bobber_depth"];

/** Coin fair = this fraction of normal craft cost (cheaper deal). */
const BOBBER_PRICE_MULT = 0.65;

/** Common stall fish — fair buy price is a premium over sell value. */
const STALL_FISH: ItemId[] = [
  "sockeye_salmon",
  "flounder",
  "yellowfin_tuna",
  "clownfish",
  "angelfish",
  "white_perch",
  "sunfish",
  "surgeon_fish",
];

const STALL_MUTATIONS: Array<{ id: FishMutationId | null; weight: number }> = [
  { id: null, weight: 70 },
  { id: "glowing", weight: 12 },
  { id: "albino", weight: 8 },
  { id: "neon", weight: 6 },
  { id: "sprout", weight: 4 },
];

/**
 * Curio Trader inventory — restocks every 3 minutes.
 * Earthly Yellowfin ~10%, Augment Rod ~30%, craft bobbers ~8%.
 */
export class CurioTraderStock {
  private entries: CurioStockEntry[] = [];
  private nextRestockAt = 0;
  private seq = 0;
  private ownsRod: (id: ItemId) => boolean = () => false;
  private ownsBobber: (id: ItemId) => boolean = () => false;

  setOwnsRod(fn: (id: ItemId) => boolean): void {
    this.ownsRod = fn;
  }

  setOwnsBobber(fn: (id: ItemId) => boolean): void {
    this.ownsBobber = fn;
  }

  /** Call once when the scene starts. */
  start(nowMs: number): void {
    this.restock(nowMs);
  }

  update(nowMs: number): void {
    if (nowMs >= this.nextRestockAt) {
      this.restock(nowMs);
    }
  }

  getEntries(): CurioStockEntry[] {
    return [...this.entries];
  }

  isEmpty(): boolean {
    return this.entries.length === 0;
  }

  getEntry(id: string): CurioStockEntry | null {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  remove(id: string): boolean {
    const i = this.entries.findIndex((e) => e.id === id);
    if (i < 0) return false;
    this.entries.splice(i, 1);
    return true;
  }

  msUntilRestock(nowMs: number): number {
    return Math.max(0, this.nextRestockAt - nowMs);
  }

  private restock(nowMs: number): void {
    this.entries = [];
    this.nextRestockAt = nowMs + RESTOCK_MS;

    const count = 2 + Math.floor(Math.random() * 2); // 2–3
    for (let i = 0; i < count; i++) {
      this.entries.push(this.rollCommonFish());
    }

    if (Math.random() < 0.1) {
      this.entries.push(this.makeFish("yellowfin_tuna", "earthly", null));
    }

    if (Math.random() < 0.3 && !this.ownsRod("augment_rod")) {
      const price = ITEMS.augment_rod.buyPrice ?? 17000;
      this.entries.push({
        id: this.nextId(),
        kind: "rod",
        itemId: "augment_rod",
        fair: price,
        label: ITEMS.augment_rod.name,
      });
    }

    if (Math.random() < 0.08) {
      const bobber = this.rollCurioBobber();
      if (bobber) this.entries.push(bobber);
    }
  }

  private rollCurioBobber(): CurioStockEntry | null {
    const pool = CURIO_BOBBER_IDS.filter(
      (id) =>
        !this.ownsBobber(id) &&
        ITEMS[id]?.craftCost &&
        id !== "bobber_mutation"
    );
    if (!pool.length) return null;
    const itemId = pool[Math.floor(Math.random() * pool.length)]!;
    const def = ITEMS[itemId];
    const craftCoins = def.craftCost!.coins;
    const fair = Math.max(100, Math.round(craftCoins * BOBBER_PRICE_MULT));
    return {
      id: this.nextId(),
      kind: "bobber",
      itemId,
      fair,
      label: def.name,
      needsLabel: formatBobberNeeds(itemId),
    };
  }

  private rollCommonFish(): CurioStockEntry {
    const itemId =
      STALL_FISH[Math.floor(Math.random() * STALL_FISH.length)] ??
      "sockeye_salmon";
    const mutation = this.pickWeightedMutation();
    let size: FishSizeId | null = null;
    const r = Math.random();
    if (r < 0.08) size = "giant";
    else if (r < 0.22) size = "big";
    return this.makeFish(itemId, mutation, size);
  }

  private pickWeightedMutation(): FishMutationId | null {
    const total = STALL_MUTATIONS.reduce((s, m) => s + m.weight, 0);
    let roll = Math.random() * total;
    for (const m of STALL_MUTATIONS) {
      roll -= m.weight;
      if (roll <= 0) return m.id;
    }
    return null;
  }

  private makeFish(
    itemId: ItemId,
    mutation: FishMutationId | null,
    size: FishSizeId | null
  ): CurioStockEntry {
    const sell = ITEMS[itemId].sellPrice ?? 0;
    const fair = Math.max(
      50,
      Math.round(sell * mutationSellMult(mutation) * sizeSellMult(size) * 2.5)
    );
    return {
      id: this.nextId(),
      kind: "fish",
      itemId,
      mutation,
      size,
      fair,
      label: this.formatFishLabel(itemId, mutation, size),
    };
  }

  private formatFishLabel(
    itemId: ItemId,
    mutation: FishMutationId | null,
    size: FishSizeId | null
  ): string {
    const def = ITEMS[itemId];
    const mut = mutation ? MUTATIONS[mutation].name + " " : "";
    const sz =
      size && size !== "normal" ? FISH_SIZES[size].name + " " : "";
    return `${mut}${sz}${def.name}`;
  }

  private nextId(): string {
    this.seq += 1;
    return `curio_${this.seq}_${Date.now()}`;
  }
}

/** Format remaining restock time as m:ss. */
export function formatCurioRestock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatBobberNeeds(bobberId: ItemId): string {
  const cost = ITEMS[bobberId]?.craftCost;
  if (!cost?.ingredients.length) return "bobber";
  return cost.ingredients
    .map((ing) => {
      const muts =
        ing.mutations && ing.mutations.length
          ? ing.mutations
          : ing.mutation
            ? [ing.mutation]
            : null;
      const mutLabel = muts
        ? muts.map((m) => MUTATIONS[m].name).join("/") + " "
        : "";
      return `${ing.count}× ${mutLabel}${ITEMS[ing.itemId].name}`;
    })
    .join(", ");
}
