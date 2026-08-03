export type ItemId =
  | "starter_rod"
  | "lucky_rod"
  | "firm_rod"
  | "amber_rod"
  | "wildflower_rod"
  | "equipment_bag"
  | "sockeye_salmon"
  | "flounder"
  | "yellowfin_tuna"
  | "bluefin_tuna"
  | "phantom_eel"
  | "sunfish"
  | "swamp_frog"
  | "whisker_catfish"
  | "white_perch"
  | "mushroom_cluster"
  | "arapaima"
  | "alligator";

export type FishMutationId =
  | "bloom"
  | "glowing"
  | "earthly"
  | "starlight"
  | "albino"
  | "neon";

export type FishSizeId = "normal" | "big" | "giant";

export type FishHabitat = "ocean" | "pond";

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
  /** World-drop chance on catch (0–1). Rod mutations use rodMutation instead. */
  chance?: number;
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
  glowing: {
    id: "glowing",
    name: "Glowing",
    sellMult: 2,
    tint: 0x88ffaa,
    toastColor: "#88ffaa",
    label: "Glowing! ",
    chance: 0.02,
  },
  earthly: {
    id: "earthly",
    name: "Earthly",
    sellMult: 4,
    tint: 0xc4a06a,
    toastColor: "#c4a06a",
    label: "Earthly! ",
    chance: 0.01,
  },
  starlight: {
    id: "starlight",
    name: "Starlight",
    sellMult: 8,
    tint: 0xd4c4ff,
    toastColor: "#d4c4ff",
    label: "Starlight! ",
    chance: 0.0025,
  },
  albino: {
    id: "albino",
    name: "Albino",
    sellMult: 1.5,
    tint: 0xf5f0e8,
    toastColor: "#f5f0e8",
    label: "Albino! ",
    chance: 0.04,
  },
  neon: {
    id: "neon",
    name: "Neon",
    sellMult: 3,
    tint: 0x66ffee,
    toastColor: "#66ffee",
    label: "Neon! ",
    chance: 0.015,
  },
};

export interface SizeDef {
  id: FishSizeId;
  name: string;
  sellMult: number;
  /** Multiplier on display size in water / inventory. */
  scale: number;
  /** Chance when a fish spawns in the world. */
  spawnChance: number;
}

export const FISH_SIZES: Record<FishSizeId, SizeDef> = {
  normal: { id: "normal", name: "Normal", sellMult: 1, scale: 1, spawnChance: 0 },
  big: { id: "big", name: "Big", sellMult: 2, scale: 1.45, spawnChance: 0.08 },
  giant: {
    id: "giant",
    name: "Giant",
    sellMult: 4,
    scale: 2.15,
    spawnChance: 0.015,
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
  /** Ocean (default) or pond-only fish. */
  habitat?: FishHabitat;
  /** Never races the bobber (e.g. mushroom cluster). */
  ignoresBobber?: boolean;
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
  /** Override idle pause chance in the catch minigame (0–1). */
  minigamePauseChance?: number;
  /** Texture faces left (default fish face right). */
  facesLeft?: boolean;
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
  amber_rod: {
    id: "amber_rod",
    name: "Amber Rod",
    description:
      "A balanced yellow rod — solid all-rounder for pond and ocean.",
    stackable: false,
    textureKey: "rod_amber",
    isRod: true,
    buyPrice: 7000,
    shop: "village",
    rodStats: {
      luck: 30,
      resilience: 15,
      control: 10,
      progressSpeed: 0,
      lineDepth: 2,
    },
  },
  wildflower_rod: {
    id: "wildflower_rod",
    name: "Wildflower Rod",
    description:
      "Orange and pink swamp rod. Deep line, high luck — 20% Bloom (3× sell).",
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
    description: "A common red sockeye.",
    stackable: true,
    textureKey: "fish",
    sellPrice: 19,
    rarity: "common",
    habitat: "ocean",
    spawnWeight: 8,
    minigameSpeed: 1,
    displayWidth: 48,
    displayHeight: 16,
  },
  flounder: {
    id: "flounder",
    name: "Flounder",
    description: "An uncommon flatfish.",
    stackable: true,
    textureKey: "flatfish",
    sellPrice: 40,
    rarity: "uncommon",
    habitat: "ocean",
    spawnWeight: 5,
    minigameSpeed: 1.15,
    displayWidth: 50,
    displayHeight: 22,
  },
  yellowfin_tuna: {
    id: "yellowfin_tuna",
    name: "Yellowfin Tuna",
    description: "A rare tuna with a yellow stripe.",
    stackable: true,
    textureKey: "yellowfin_tuna",
    sellPrice: 90,
    rarity: "rare",
    habitat: "ocean",
    spawnWeight: 3.2,
    minigameSpeed: 1.25,
    displayWidth: 56,
    displayHeight: 20,
  },
  bluefin_tuna: {
    id: "bluefin_tuna",
    name: "Bluefin Tuna",
    description:
      "An epic heavy tuna. Fast and big; slows your catch progress.",
    stackable: true,
    textureKey: "bluefin_tuna",
    sellPrice: 223,
    rarity: "epic",
    habitat: "ocean",
    spawnWeight: 1.35,
    minigameSpeed: 1.4,
    catchProgress: -20,
    displayWidth: 64,
    displayHeight: 24,
  },
  phantom_eel: {
    id: "phantom_eel",
    name: "Eel",
    description: "A legendary grey eel that darts fast.",
    stackable: true,
    textureKey: "phantom_eel",
    sellPrice: 600,
    rarity: "legendary",
    habitat: "ocean",
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
      "A mythical ocean sunfish. Luck finds it — landing it is another story.",
    stackable: true,
    textureKey: "sunfish",
    sellPrice: 1335,
    rarity: "mythical",
    habitat: "ocean",
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
  swamp_frog: {
    id: "swamp_frog",
    name: "Swamp Frog",
    description: "An epic swamp frog — quick bursts, long pauses.",
    stackable: true,
    textureKey: "swamp_frog",
    sellPrice: 300,
    rarity: "epic",
    habitat: "pond",
    spawnWeight: 1.4,
    minigameSpeed: 1.35,
    minigamePauseChance: 0.48,
    displayWidth: 38,
    displayHeight: 28,
  },
  whisker_catfish: {
    id: "whisker_catfish",
    name: "Whisker Catfish",
    description: "A rare whiskered catfish. Medium-fast.",
    stackable: true,
    textureKey: "whisker_catfish",
    sellPrice: 140,
    rarity: "rare",
    habitat: "pond",
    spawnWeight: 3.2,
    minigameSpeed: 1.28,
    displayWidth: 56,
    displayHeight: 28,
  },
  white_perch: {
    id: "white_perch",
    name: "White Perch",
    description: "An uncommon pale perch. Slow and steady.",
    stackable: true,
    textureKey: "pale_minnow",
    sellPrice: 60,
    rarity: "uncommon",
    habitat: "pond",
    spawnWeight: 5,
    minigameSpeed: 0.85,
    displayWidth: 48,
    displayHeight: 22,
  },
  mushroom_cluster: {
    id: "mushroom_cluster",
    name: "Mushroom Cluster",
    description: "A common floating mushroom patch. Ignores bait.",
    stackable: true,
    textureKey: "spotted_mushrooms",
    sellPrice: 11,
    rarity: "common",
    habitat: "pond",
    spawnWeight: 8,
    ignoresBobber: true,
    minigameSpeed: 0.38,
    minigamePauseChance: 0.35,
    displayWidth: 40,
    displayHeight: 36,
  },
  arapaima: {
    id: "arapaima",
    name: "Arapaima",
    description: "A legendary swamp giant. Fast and barely pauses.",
    stackable: true,
    textureKey: "brown_gar",
    sellPrice: 1000,
    rarity: "legendary",
    habitat: "pond",
    spawnWeight: 1,
    minigameSpeed: 1.65,
    minigameJerky: true,
    minigameChaos: 0.7,
    minigamePauseChance: 0.03,
    displayWidth: 108,
    displayHeight: 32,
  },
  alligator: {
    id: "alligator",
    name: "Alligator",
    description:
      "A mythical swamp alligator. Blistering speed; −50% catch progress.",
    stackable: true,
    textureKey: "crocodile",
    sellPrice: 5560,
    rarity: "mythical",
    habitat: "pond",
    spawnWeight: 0.18,
    minigameSpeed: 2.15,
    minigameJerky: true,
    minigameChaos: 0.5,
    catchProgress: -50,
    drainMult: 1.5,
    unstoppableJerky: true,
    minigamePauseChance: 0.04,
    facesLeft: true,
    // Native art 314×59 — keep ~same thickness, correct aspect (was squished)
    displayWidth: 117,
    displayHeight: 22,
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
 * Absolute spawn share for epic / legendary / mythical.
 * These rise with luck and never shrink from mythical crowding.
 *
 * Ocean:
 *   Epic (Bluefin)  7.5% + 1.5% per +25% luck
 *   Legendary (Eel) 5.0% + 2.5% per +25% luck
 *   Mythical (Sunfish) 1.0% + 2.5% per +25% luck
 * Pond:
 *   Epic (Frog) 4.0% + 1.25% per +25% luck
 *   Legendary (Arapaima) 2.5% + 1.25% per +25% luck
 *   Mythical (Alligator) 0.5% + 1.25% per +25% luck  (half ocean mythical)
 */
function absoluteRareShare(
  rarity: FishRarity,
  luckPercent: number,
  habitat: FishHabitat
): number | null {
  const n = luckPercent / 25;
  if (habitat === "ocean") {
    if (rarity === "epic") return Math.max(0, 0.075 + n * 0.015);
    if (rarity === "legendary") return Math.max(0, 0.05 + n * 0.025);
    if (rarity === "mythical") return Math.max(0, 0.01 + n * 0.025);
  } else {
    if (rarity === "epic") return Math.max(0, 0.04 + n * 0.0125);
    if (rarity === "legendary") return Math.max(0, 0.025 + n * 0.0125);
    if (rarity === "mythical") return Math.max(0, 0.005 + n * 0.0125);
  }
  return null;
}

/** Roll a fish species for a habitat, biased by rod luck (%). */
export function rollFishSpecies(
  luckPercent = 0,
  habitat: FishHabitat = "ocean",
  exclude: readonly ItemId[] = []
): ItemId {
  const excluded = new Set(exclude);
  const fish = FISH_ITEM_IDS.filter(
    (id) =>
      (ITEMS[id].habitat ?? "ocean") === habitat && !excluded.has(id)
  );
  if (fish.length === 0) return "sockeye_salmon";

  const weights = new Array(fish.length).fill(0);
  let fixedTotal = 0;
  let poolWeight = 0;

  for (let i = 0; i < fish.length; i++) {
    const def = ITEMS[fish[i]];
    const rarity = def.rarity ?? "common";
    const abs = absoluteRareShare(rarity, luckPercent, habitat);
    if (abs != null) {
      weights[i] = abs;
      fixedTotal += abs;
      continue;
    }
    // Common / uncommon / rare share the remainder by spawnWeight
    let w = def.spawnWeight ?? 1;
    if (rarity === "rare") {
      w *=
        luckPercent >= 0
          ? 1 + (luckPercent / 25) * 0.01
          : Math.max(0.2, 1 + luckPercent * 0.008);
    } else if (rarity === "uncommon") {
      w *= 1 + Math.max(0, luckPercent / 25) * 0.005;
    }
    weights[i] = Math.max(0.01, w);
    poolWeight += weights[i];
  }

  // Cap fixed rarities if they somehow exceed 100%
  if (fixedTotal > 0.95) {
    const scale = 0.95 / fixedTotal;
    for (let i = 0; i < fish.length; i++) {
      const rarity = ITEMS[fish[i]].rarity ?? "common";
      if (absoluteRareShare(rarity, luckPercent, habitat) != null) {
        weights[i] *= scale;
      }
    }
    fixedTotal = 0.95;
  }

  const remainder = Math.max(0, 1 - fixedTotal);
  if (poolWeight > 0 && remainder > 0) {
    for (let i = 0; i < fish.length; i++) {
      const rarity = ITEMS[fish[i]].rarity ?? "common";
      if (absoluteRareShare(rarity, luckPercent, habitat) == null) {
        weights[i] = (weights[i] / poolWeight) * remainder;
      }
    }
  } else if (remainder <= 0 || poolWeight <= 0) {
    // No pool fish — renormalize fixed shares only
    for (let i = 0; i < fish.length; i++) {
      const rarity = ITEMS[fish[i]].rarity ?? "common";
      if (absoluteRareShare(rarity, luckPercent, habitat) == null) {
        weights[i] = 0;
      }
    }
  }

  let total = 0;
  for (const w of weights) total += w;
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

export function sizeSellMult(size?: FishSizeId | null): number {
  if (!size || size === "normal") return 1;
  return FISH_SIZES[size]?.sellMult ?? 1;
}

export function sizeScale(size?: FishSizeId | null): number {
  if (!size || size === "normal") return 1;
  return FISH_SIZES[size]?.scale ?? 1;
}

/** Roll Big / Giant when a fish appears in the world. */
export function rollFishSize(): FishSizeId {
  const r = Math.random();
  if (r < FISH_SIZES.giant.spawnChance) return "giant";
  if (r < FISH_SIZES.giant.spawnChance + FISH_SIZES.big.spawnChance) {
    return "big";
  }
  return "normal";
}

/** Rod mutation first, otherwise a world random mutation. */
export function rollCatchMutation(rodId: ItemId): FishMutationId | null {
  const grant = ITEMS[rodId]?.rodMutation;
  if (grant && Math.random() < grant.chance) return grant.mutation;

  const world: { id: FishMutationId; chance: number }[] = (
    Object.values(MUTATIONS) as MutationDef[]
  )
    .filter((m) => m.chance != null && m.id !== "bloom")
    .map((m) => ({ id: m.id, chance: m.chance! }));

  // Sequential independent rolls — first hit wins (rarer later in list)
  // Order by chance descending so common mutations checked first
  world.sort((a, b) => b.chance - a.chance);
  for (const entry of world) {
    if (Math.random() < entry.chance) return entry.id;
  }
  return null;
}

/** @deprecated use rollCatchMutation */
export function rollRodMutation(rodId: ItemId): FishMutationId | null {
  return rollCatchMutation(rodId);
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
  /** Fish mutation — stacks only with the same mutation + size. */
  mutation?: FishMutationId | null;
  /** Size effect on the fish. */
  size?: FishSizeId | null;
  /** Kept fish — yellow highlight, skipped when selling. */
  keep?: boolean;
}

export const HOTBAR_SIZE = 5;
export const INVENTORY_SIZE = 10;
