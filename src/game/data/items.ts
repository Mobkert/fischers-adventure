export type ItemId =
  | "starter_rod"
  | "lucky_rod"
  | "firm_rod"
  | "wildflower_rod"
  | "equipment_bag"
  | "sockeye_salmon"
  | "flounder"
  | "yellowfin_tuna"
  | "bluefin_tuna"
  | "phantom_eel"
  | "sunfish";

export type FishMutationId = "bloom";

export type FishRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythical";

export interface MutationDef {
  id: FishMutationId;
  name: string;
  /** Multiplier on base sell price. */
  sellMult: number;
  /** Phaser tint for inventory icons. */
  tint: number;
  toastColor: string;
  label: string;
}

export const MUTATIONS: Record<FishMutationId, MutationDef> = {
  bloom: {
    id: "bloom",
    name: "Bloom",
    sellMult: 3,
    tint: 0xff9ec8,
    toastColor: "#ff9ec8",
    label: "Bloom! ",
  },
};

/** Optional rod-granted mutation when a fish is reeled in. */
export interface RodMutationGrant {
  mutation: FishMutationId;
  /** 0–1 chance on each successful catch. */
  chance: number;
}

export interface RodStats {
  /** % — boosts rarer fish spawn weights near water. */
  luck: number;
  /** % — slows / calms fish in the catch minigame. */
  resilience: number;
  /** % added to the base white zone (base is 20% of the grey bar). */
  control: number;
  /** % — fills the catch progress bar faster. */
  progressSpeed: number;
  /** Meters of line — reach deeper (rarer) fish. 0 = shallow only. */
  lineDepth: number;
}

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  stackable: boolean;
  textureKey: string;
  sellPrice?: number;
  buyPrice?: number;
  /** Where this rod is sold (omit = not in a shop UI). */
  shop?: "village" | "jungle";
  isRod?: boolean;
  isEquipmentBag?: boolean;
  rodStats?: RodStats;
  /** Mutation this rod can apply on a successful catch. */
  rodMutation?: RodMutationGrant;
  rarity?: FishRarity;
  /** Relative chance to spawn in water (among fish species). */
  spawnWeight?: number;
  /** Catch-minigame movement multiplier. */
  minigameSpeed?: number;
  /** Instant direction snaps + rare pauses (vs smooth easing). */
  minigameJerky?: boolean;
  /** Extra catch-progress % from this fish (can be negative). */
  catchProgress?: number;
  /** Jerky AI snaps more often (1 = normal eel, 2+ = brutal). */
  minigameChaos?: number;
  /** Multiplier on progress drain when outside the white zone. */
  drainMult?: number;
  /** Jerky movement ignores mid-tier resilience calming. */
  unstoppableJerky?: boolean;
  displayWidth?: number;
  displayHeight?: number;
}

export const ZERO_ROD_STATS: RodStats = {
  luck: 0,
  resilience: 0,
  control: 0,
  progressSpeed: 0,
  lineDepth: 0,
};

/** Pixels of water depth per meter of line. */
export const DEPTH_PX_PER_METER = 22;
/** Shallow reach with 0m line depth (commons / uncommons). */
export const BASE_LINE_REACH_PX = 48;

/** Max depth below the surface this rod can hook fish. */
export function rodMaxReachPx(lineDepthM: number): number {
  return BASE_LINE_REACH_PX + Math.max(0, lineDepthM) * DEPTH_PX_PER_METER;
}

/** Preferred swim depth band (px below surface) — deeper = rarer. */
export function preferredDepthBand(rarity: FishRarity): {
  min: number;
  max: number;
} {
  switch (rarity) {
    case "common":
      return { min: 22, max: 44 };
    case "uncommon":
      return { min: 34, max: 54 };
    case "rare":
      return { min: 50, max: 74 };
    case "epic":
      return { min: 70, max: 98 };
    case "legendary":
      // Often deep, but can cruise higher too
      return { min: 28, max: 124 };
    case "mythical":
      // Same — sunfish may appear near the surface
      return { min: 28, max: 158 };
  }
}

/**
 * Pick a spawn depth offset. Legendaries / mythicals lean deep but
 * still have a solid chance to spawn higher up.
 */
export function rollSpawnDepthOffset(rarity: FishRarity): number {
  const band = preferredDepthBand(rarity);
  if (rarity === "legendary" || rarity === "mythical") {
    if (Math.random() < 0.4) {
      // Higher in the water column
      const shallowMax = Math.min(70, band.max);
      return Math.floor(
        band.min + Math.random() * (shallowMax - band.min + 1)
      );
    }
  }
  return Math.floor(band.min + Math.random() * (band.max - band.min + 1));
}

/** Toast / ! colors by rarity. */
export const RARITY_COLOR: Record<FishRarity, string> = {
  common: "#7CFC00",
  uncommon: "#7ec8ff",
  rare: "#c9a0ff",
  epic: "#9b5de5",
  legendary: "#ffd54a",
  mythical: "#ff69b4",
};

export const RARITY_LABEL: Record<FishRarity, string> = {
  common: "",
  uncommon: "Uncommon! ",
  rare: "Rare! ",
  epic: "Epic! ",
  legendary: "Legendary! ",
  mythical: "Mythical! ",
};

export const ITEMS: Record<ItemId, ItemDef> = {
  starter_rod: {
    id: "starter_rod",
    name: "Starter Rod",
    description: "A basic fishing rod with no special stats.",
    stackable: false,
    textureKey: "rod",
    isRod: true,
    rodStats: { ...ZERO_ROD_STATS },
  },
  lucky_rod: {
    id: "lucky_rod",
    name: "Lucky Rod",
    description:
      "A fortune-favored rod. More luck for rare fish, but less resilience.",
    stackable: false,
    textureKey: "rod_lucky",
    isRod: true,
    buyPrice: 800,
    shop: "village",
    rodStats: {
      luck: 50,
      resilience: -15,
      control: 0,
      progressSpeed: 0,
      lineDepth: 0,
    },
  },
  firm_rod: {
    id: "firm_rod",
    name: "Firm Rod",
    description:
      "A stout rod that tames wild fish. Rare legendaries, strong resilience.",
    stackable: false,
    textureKey: "rod_firm",
    isRod: true,
    buyPrice: 1500,
    shop: "village",
    rodStats: {
      luck: -30,
      resilience: 50,
      control: 20,
      progressSpeed: 10,
      lineDepth: 2,
    },
  },
  wildflower_rod: {
    id: "wildflower_rod",
    name: "Wildflower Rod",
    description:
      "Orange and pink jungle rod. Deep line, high luck — 20% Bloom (3× sell).",
    stackable: false,
    textureKey: "rod_wildflower",
    isRod: true,
    buyPrice: 22000,
    shop: "jungle",
    rodStats: {
      luck: 75,
      resilience: -35,
      control: 35,
      progressSpeed: 30,
      lineDepth: 3,
    },
    rodMutation: { mutation: "bloom", chance: 0.2 },
  },
  equipment_bag: {
    id: "equipment_bag",
    name: "Equipment Bag",
    description: "Holds your fishing rods. Open to equip one.",
    stackable: false,
    textureKey: "equipment_bag",
    isEquipmentBag: true,
  },
  sockeye_salmon: {
    id: "sockeye_salmon",
    name: "Sockeye Salmon",
    description: "A common red sockeye. The Merchant pays $19 each.",
    stackable: true,
    textureKey: "fish",
    sellPrice: 19,
    rarity: "common",
    spawnWeight: 8,
    minigameSpeed: 1,
    displayWidth: 48,
    displayHeight: 16,
  },
  flounder: {
    id: "flounder",
    name: "Flounder",
    description: "An uncommon flatfish. The Merchant pays $40 each.",
    stackable: true,
    textureKey: "flatfish",
    sellPrice: 40,
    rarity: "uncommon",
    spawnWeight: 5,
    minigameSpeed: 1.15,
    displayWidth: 50,
    displayHeight: 22,
  },
  yellowfin_tuna: {
    id: "yellowfin_tuna",
    name: "Yellowfin Tuna",
    description: "A rare tuna with a yellow stripe. Worth $90.",
    stackable: true,
    textureKey: "yellowfin_tuna",
    sellPrice: 90,
    rarity: "rare",
    spawnWeight: 3.2,
    minigameSpeed: 1.25,
    displayWidth: 56,
    displayHeight: 20,
  },
  bluefin_tuna: {
    id: "bluefin_tuna",
    name: "Bluefin Tuna",
    description:
      "An epic heavy tuna. Fast and big; slows your catch progress. Worth $223.",
    stackable: true,
    textureKey: "bluefin_tuna",
    sellPrice: 223,
    rarity: "epic",
    spawnWeight: 1.35,
    minigameSpeed: 1.4,
    catchProgress: -20,
    displayWidth: 64,
    displayHeight: 24,
  },
  phantom_eel: {
    id: "phantom_eel",
    name: "Eel",
    description:
      "A legendary grey eel that darts fast. The Merchant pays $600 each.",
    stackable: true,
    textureKey: "phantom_eel",
    sellPrice: 600,
    rarity: "legendary",
    spawnWeight: 1,
    minigameSpeed: 1.55,
    minigameJerky: true,
    displayWidth: 64,
    displayHeight: 14,
  },
  sunfish: {
    id: "sunfish",
    name: "Sunfish",
    description:
      "A mythical ocean sunfish. Luck finds it — landing it is another story. Worth $1335.",
    stackable: true,
    textureKey: "sunfish",
    sellPrice: 1335,
    rarity: "mythical",
    spawnWeight: 0.18,
    minigameSpeed: 1.9,
    minigameJerky: true,
    /** Low chaos = holds a direction longer before snapping around. */
    minigameChaos: 0.55,
    catchProgress: -40,
    drainMult: 1.45,
    unstoppableJerky: true,
    displayWidth: 44,
    displayHeight: 44,
  },
};

export const FISH_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].sellPrice != null);

export const ROD_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].isRod);

export const SHOP_ROD_IDS: ItemId[] = ROD_ITEM_IDS.filter(
  (id) => ITEMS[id].buyPrice != null && ITEMS[id].shop === "village"
);

export const JUNGLE_SHOP_ROD_IDS: ItemId[] = ROD_ITEM_IDS.filter(
  (id) => ITEMS[id].buyPrice != null && ITEMS[id].shop === "jungle"
);

/**
 * Mythical spawn share from rod luck.
 * +2.5% chance per +25% luck → 75% luck = 7.5% mythics in the area.
 */
function mythicalSpawnShare(luckPercent: number): number {
  if (luckPercent <= 0) {
    // No luck bonus; tiny leftover if slightly negative luck
    return Math.max(0, (luckPercent / 25) * 0.025);
  }
  return Math.min(0.2, (luckPercent / 25) * 0.025);
}

/** Roll a fish species, biased by rod luck (%). */
export function rollFishSpecies(luckPercent = 0): ItemId {
  const fish = FISH_ITEM_IDS;
  const weights: number[] = [];
  let otherTotal = 0;
  let mythicalIndex = -1;

  for (let i = 0; i < fish.length; i++) {
    const id = fish[i];
    const def = ITEMS[id];
    let w = def.spawnWeight ?? 1;
    const rarity = def.rarity ?? "common";

    if (rarity === "mythical") {
      mythicalIndex = i;
      weights.push(0);
      continue;
    }

    // +2.5% relative weight per +25% luck for rare+ (half the old rate)
    if (rarity === "legendary" || rarity === "epic") {
      const scale =
        luckPercent >= 0
          ? 1 + (luckPercent / 25) * 0.025
          : Math.max(0.12, 1 + luckPercent * 0.011);
      w *= scale;
    } else if (rarity === "rare") {
      w *=
        luckPercent >= 0
          ? 1 + (luckPercent / 25) * 0.025
          : Math.max(0.2, 1 + luckPercent * 0.008);
    } else if (rarity === "uncommon") {
      w *= 1 + (luckPercent / 25) * 0.01;
    }

    weights.push(Math.max(0.01, w));
    otherTotal += weights[i];
  }

  let total = otherTotal;
  if (mythicalIndex >= 0) {
    const share = mythicalSpawnShare(luckPercent);
    const mythicalW =
      share > 0 && otherTotal > 0
        ? (share * otherTotal) / (1 - share)
        : share > 0
          ? 0.01
          : 0;
    weights[mythicalIndex] = mythicalW;
    total += mythicalW;
  }

  // If somehow total is 0, fall back to first fish
  if (total <= 0) return fish[0];

  let roll = Math.random() * total;
  for (let i = 0; i < fish.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return fish[i];
  }
  return fish[0];
}

export function mutationSellMult(mutation?: FishMutationId | null): number {
  if (!mutation) return 1;
  return MUTATIONS[mutation]?.sellMult ?? 1;
}

/** Roll a rod-granted mutation for a successful catch (or null). */
export function rollRodMutation(rodId: ItemId): FishMutationId | null {
  const grant = ITEMS[rodId]?.rodMutation;
  if (!grant) return null;
  if (Math.random() < grant.chance) return grant.mutation;
  return null;
}

/**
 * How fast a fish swims toward the bobber based on rod luck.
 * -50% → commons/uncommons race in; +50% → legendaries; +100% → mythicals.
 * Spawn/luck weights are unchanged — this only affects approach speed.
 */
export function luckApproachSpeedMult(
  luckPercent: number,
  rarity: FishRarity
): number {
  const L = luckPercent;
  let boost = 0;

  if (rarity === "common" || rarity === "uncommon") {
    // Full boost at -50%, fades out by 0%
    boost = L >= 0 ? 0 : Math.min(1, -L / 50) * 0.8;
  } else if (rarity === "rare") {
    // Light mid-luck interest
    boost = Math.max(0, 1 - Math.abs(L - 20) / 45) * 0.3;
  } else if (rarity === "epic") {
    boost = Math.max(0, 1 - Math.abs(L - 35) / 45) * 0.4;
  } else if (rarity === "legendary") {
    // Peak at +50%
    boost = Math.max(0, 1 - Math.abs(L - 50) / 50) * 0.9;
  } else if (rarity === "mythical") {
    // Peak at +100%
    boost = Math.max(0, 1 - Math.abs(L - 100) / 55) * 1.1;
  }

  return 1 + boost;
}

export function formatRodStats(stats: RodStats): string {
  const allZero =
    stats.luck === 0 &&
    stats.resilience === 0 &&
    stats.control === 0 &&
    stats.progressSpeed === 0 &&
    stats.lineDepth === 0;
  if (allZero) {
    return "Luck  0%   Resilience  0%\nControl  0%   Progress  0%\nLine Depth  0m\nNo bonus stats";
  }
  const fmt = (v: number) => `${v > 0 ? "+" : ""}${v}%`;
  return [
    `Luck  ${fmt(stats.luck)}   Resilience  ${fmt(stats.resilience)}`,
    `Control  ${fmt(stats.control)}   Progress  ${fmt(stats.progressSpeed)}`,
    `Line Depth  ${stats.lineDepth}m`,
  ].join("\n");
}

export interface InventorySlot {
  itemId: ItemId | null;
  count: number;
  /** Fish mutation — stacks only with the same mutation. */
  mutation?: FishMutationId | null;
}

export const HOTBAR_SIZE = 5;
export const INVENTORY_SIZE = 10;
