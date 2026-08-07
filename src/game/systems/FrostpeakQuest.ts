import {
  FishMutationId,
  FishSizeId,
  ItemId,
  ITEMS,
  mutationSellMult,
  sizeSellMult,
} from "../data/items";

/** Hermit quest stages: 0 = not started … 4 = cave opened. */
export type FrostpeakQuestStage = 0 | 1 | 2 | 3 | 4;

/** Rods that must each land an epic during quest 2. */
export const FROSTPEAK_EPIC_RODS: readonly ItemId[] = [
  "amber_rod",
  "firm_rod",
  "wildflower_rod",
  "augment_rod",
  "coral_rod",
] as const;

export const FROSTPEAK_MYTHICAL_MIN_VALUE = 4000;

export function rodDisplayName(id: ItemId): string {
  return ITEMS[id]?.name ?? id;
}

export function fishSellValue(
  itemId: ItemId,
  mutation: FishMutationId | null,
  size: FishSizeId | null
): number {
  const price = ITEMS[itemId]?.sellPrice ?? 0;
  return Math.floor(
    price * mutationSellMult(mutation) * sizeSellMult(size)
  );
}

export function normalizeFrostpeakStage(raw: unknown): FrostpeakQuestStage {
  const n = Math.floor(Number(raw));
  if (n >= 4) return 4;
  if (n >= 3) return 3;
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

export function normalizeFrostpeakEpicRods(raw: unknown): ItemId[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(FROSTPEAK_EPIC_RODS);
  const out: ItemId[] = [];
  for (const id of raw) {
    if (typeof id === "string" && allowed.has(id) && !out.includes(id as ItemId)) {
      out.push(id as ItemId);
    }
  }
  return out;
}

export function missingEpicRods(caught: readonly ItemId[]): ItemId[] {
  return FROSTPEAK_EPIC_RODS.filter((id) => !caught.includes(id));
}
