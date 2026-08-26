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
    }
  | {
      id: string;
      kind: "misc";
      itemId: ItemId;
      fair: number;
      label: string;
    };

const RESTOCK_MS = 3 * 60 * 1000;

export type CurioStockSave = {
  nextRestockAt: number;
  entries: CurioStockEntry[];
};

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
 * Earthly Yellowfin ~10%, Earthly Angelfish ~20%,
 * Augment Rod ~30%, craft bobbers ~8%.
 * Anvil Shard is always stocked while the Ashencast quest needs it.
 */
export class CurioTraderStock {
  private entries: CurioStockEntry[] = [];
  private nextRestockAt = 0;
  private seq = 0;
  private ownsRod: (id: ItemId) => boolean = () => false;
  private ownsBobber: (id: ItemId) => boolean = () => false;
  private hasItem: (id: ItemId) => boolean = () => false;
  /** True while the Ashencast quest needs the Curio anvil shard. */
  private needsAnvilCurio: () => boolean = () => false;

  setOwnsRod(fn: (id: ItemId) => boolean): void {
    this.ownsRod = fn;
  }

  setOwnsBobber(fn: (id: ItemId) => boolean): void {
    this.ownsBobber = fn;
  }

  setHasItem(fn: (id: ItemId) => boolean): void {
    this.hasItem = fn;
  }

  setNeedsAnvilCurio(fn: () => boolean): void {
    this.needsAnvilCurio = fn;
  }

  /** Force an immediate restock (e.g. when the anvil quest starts). */
  forceRestock(nowMs: number = Date.now()): void {
    this.restock(nowMs);
  }

  /**
   * Restore from save (wall-clock). If the timer already elapsed offline,
   * restocks immediately. Fresh saves with no data get a new stall.
   */
  applyPersisted(save: CurioStockSave | null | undefined, nowMs = Date.now()): void {
    if (
      !save ||
      !Array.isArray(save.entries) ||
      !(save.nextRestockAt > 0)
    ) {
      this.restock(nowMs);
      return;
    }
    this.entries = this.normalizeEntries(save.entries);
    this.nextRestockAt = save.nextRestockAt;
    if (nowMs >= this.nextRestockAt) {
      this.restock(nowMs);
    }
  }

  /** Snapshot for the active save slot. */
  exportPersisted(): CurioStockSave {
    return {
      nextRestockAt: this.nextRestockAt,
      entries: this.entries.map((e) => ({ ...e })),
    };
  }

  /** Call once when the scene starts — prefer applyPersisted for saves. */
  start(nowMs: number = Date.now()): void {
    this.restock(nowMs);
  }

  update(nowMs: number = Date.now()): boolean {
    if (nowMs >= this.nextRestockAt) {
      this.restock(nowMs);
      return true;
    }
    return false;
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

  msUntilRestock(nowMs: number = Date.now()): number {
    return Math.max(0, this.nextRestockAt - nowMs);
  }

  private normalizeEntries(raw: CurioStockEntry[]): CurioStockEntry[] {
    const out: CurioStockEntry[] = [];
    for (const e of raw) {
      if (!e || typeof e !== "object") continue;
      const itemId = e.itemId as ItemId;
      if (!ITEMS[itemId]) continue;
      if (e.kind === "fish") {
        const mutation =
          e.mutation && e.mutation in MUTATIONS ? e.mutation : null;
        const size =
          e.size && e.size in FISH_SIZES && e.size !== "normal"
            ? e.size
            : e.size === "normal"
              ? null
              : null;
        out.push({
          id: String(e.id || this.nextId()),
          kind: "fish",
          itemId,
          mutation,
          size,
          fair: Math.max(1, Math.floor(Number(e.fair) || 1)),
          label:
            typeof e.label === "string" && e.label
              ? e.label
              : this.formatFishLabel(itemId, mutation, size),
        });
      } else if (e.kind === "rod") {
        out.push({
          id: String(e.id || this.nextId()),
          kind: "rod",
          itemId,
          fair: Math.max(1, Math.floor(Number(e.fair) || 1)),
          label:
            typeof e.label === "string" && e.label
              ? e.label
              : ITEMS[itemId].name,
        });
      } else if (e.kind === "bobber") {
        out.push({
          id: String(e.id || this.nextId()),
          kind: "bobber",
          itemId,
          fair: Math.max(1, Math.floor(Number(e.fair) || 1)),
          label:
            typeof e.label === "string" && e.label
              ? e.label
              : ITEMS[itemId].name,
          needsLabel:
            typeof e.needsLabel === "string" && e.needsLabel
              ? e.needsLabel
              : formatBobberNeeds(itemId),
        });
      } else if (e.kind === "misc") {
        out.push({
          id: String(e.id || this.nextId()),
          kind: "misc",
          itemId,
          fair: Math.max(1, Math.floor(Number(e.fair) || 1)),
          label:
            typeof e.label === "string" && e.label
              ? e.label
              : ITEMS[itemId].name,
        });
      }
    }
    return out;
  }

  private restock(nowMs: number): void {
    this.entries = [];
    this.nextRestockAt = nowMs + RESTOCK_MS;

    // Quest shard first so it always appears in the 6-item stall list
    if (
      this.needsAnvilCurio() &&
      !this.hasItem("anvil_piece_curio")
    ) {
      this.entries.push({
        id: this.nextId(),
        kind: "misc",
        itemId: "anvil_piece_curio",
        fair: 5600,
        label: ITEMS.anvil_piece_curio.name,
      });
    }

    const count = 2 + Math.floor(Math.random() * 2); // 2–3
    for (let i = 0; i < count; i++) {
      this.entries.push(this.rollCommonFish());
    }

    if (Math.random() < 0.1) {
      this.entries.push(this.makeFish("yellowfin_tuna", "earthly", null));
    }

    if (Math.random() < 0.2) {
      this.entries.push(this.makeFish("angelfish", "earthly", null));
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
