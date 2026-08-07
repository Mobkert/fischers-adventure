import {
  AMULET_ITEM_IDS,
  FISH_ITEM_IDS,
  FishHabitat,
  FishRarity,
  ItemId,
  ITEMS,
} from "../data/items";

/** Islands that host a Fish Quest angler. */
export type FishQuestIslandId =
  | "village"
  | "swamp"
  | "collectors"
  | "frostpeak";

export type ActiveFishQuest = {
  islandId: FishQuestIslandId;
  targetSpecies: ItemId;
};

export const FISH_QUEST_ISLAND_IDS: FishQuestIslandId[] = [
  "village",
  "swamp",
  "collectors",
  "frostpeak",
];

export const FISH_QUEST_ISLAND_NAMES: Record<FishQuestIslandId, string> = {
  village: "Starter Isle",
  swamp: "Swamp",
  collectors: "Collector's Harbor",
  frostpeak: "Frostpeak Isle",
};

/** Habitat the angler asks for on each island. */
export const FISH_QUEST_HABITAT: Record<FishQuestIslandId, FishHabitat> = {
  village: "ocean",
  swamp: "pond",
  collectors: "reef",
  frostpeak: "ocean",
};

export const FISH_QUEST_HABITAT_LABEL: Record<FishHabitat, string> = {
  ocean: "ocean",
  pond: "swamp pond",
  reef: "coral reef",
  cave: "cave",
};

const COIN_REWARD: Record<Exclude<FishRarity, "mythical">, number> = {
  common: 75,
  uncommon: 180,
  rare: 450,
  epic: 1400,
  legendary: 3800,
};

/** Non-mythical, non-abundance fish for a habitat. */
export function fishQuestCandidates(habitat: FishHabitat): ItemId[] {
  return FISH_ITEM_IDS.filter((id) => {
    const def = ITEMS[id];
    if (!def || def.sellPrice == null) return false;
    if ((def.rarity ?? "common") === "mythical") return false;
    if (def.abundanceOnly) return false;
    const h = def.habitat ?? "ocean";
    return h === habitat;
  });
}

export function rollFishQuestTarget(islandId: FishQuestIslandId): ItemId | null {
  const pool = fishQuestCandidates(FISH_QUEST_HABITAT[islandId]);
  if (pool.length === 0) return null;
  // Weight by spawnWeight when present
  let total = 0;
  const weights = pool.map((id) => {
    const w = Math.max(1, ITEMS[id].spawnWeight ?? 10);
    total += w;
    return w;
  });
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function fishQuestCoinReward(speciesId: ItemId): number {
  const rarity = (ITEMS[speciesId]?.rarity ?? "common") as FishRarity;
  if (rarity === "mythical") return COIN_REWARD.legendary;
  return COIN_REWARD[rarity] ?? COIN_REWARD.common;
}

/** Amulets that can drop from epic/legendary turn-ins (thunder rolled separately). */
export function standardAmuletPool(): ItemId[] {
  return AMULET_ITEM_IDS.filter((id) => id !== "amulet_thunder");
}

/**
 * Epic/Legendary: 15% chance a standard amulet, 1% chance Thunder Amulet.
 * Common–Rare: no amulet.
 */
export function rollFishQuestAmulet(
  speciesId: ItemId
): ItemId | null {
  const rarity = ITEMS[speciesId]?.rarity ?? "common";
  if (rarity !== "epic" && rarity !== "legendary") return null;

  const roll = Math.random();
  if (roll < 0.01) return "amulet_thunder";
  if (roll < 0.01 + 0.15) {
    const pool = standardAmuletPool();
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}

export function isFishQuestIslandId(raw: unknown): raw is FishQuestIslandId {
  return (
    typeof raw === "string" &&
    (FISH_QUEST_ISLAND_IDS as string[]).includes(raw)
  );
}

export function normalizeActiveFishQuest(
  raw: unknown
): ActiveFishQuest | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<ActiveFishQuest>;
  if (!isFishQuestIslandId(o.islandId)) return null;
  if (typeof o.targetSpecies !== "string" || !(o.targetSpecies in ITEMS)) {
    return null;
  }
  const id = o.targetSpecies as ItemId;
  if (ITEMS[id].sellPrice == null) return null;
  if ((ITEMS[id].rarity ?? "common") === "mythical") return null;
  const habitat = FISH_QUEST_HABITAT[o.islandId];
  const h = ITEMS[id].habitat ?? "ocean";
  if (h !== habitat) return null;
  return { islandId: o.islandId, targetSpecies: id };
}
