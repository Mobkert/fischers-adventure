export type ItemId =
  | "starter_rod"
  | "lucky_rod"
  | "firm_rod"
  | "amber_rod"
  | "wildflower_rod"
  | "zeus_rod"
  | "coral_rod"
  | "augment_rod"
  | "equipment_bag"
  | "bestiary"
  | "bobber_starter"
  | "bobber_double"
  | "bobber_reinforced"
  | "bobber_mutation"
  | "bobber_clover"
  | "bobber_depth"
  | "backpack_starter"
  | "backpack_t1"
  | "backpack_t2"
  | "backpack_t3"
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
  | "alligator"
  | "clownfish"
  | "angelfish"
  | "pufferfish"
  | "nurse_shark"
  | "surgeon_fish"
  | "dolphin"
  | "chilled_clownfish"
  | "crystal_frog"
  | "crystalfin_tuna"
  | "nautilus"
  | "serpent_eel"
  | "cave_whale"
  | "amulet_celestial"
  | "amulet_moonlight"
  | "amulet_tempest"
  | "amulet_dusky"
  | "amulet_sunlit"
  | "amulet_thunder"
  | "gem_red"
  | "gem_green"
  | "gem_blue"
  | "gem_yellow"
  | "gem_purple"
  | "crystal_rod"
  | "hat_tophat"
  | "hat_banana"
  | "hat_cap"
  | "hat_shell"
  | "hat_yellowfin"
  | "hat_gem";

export type AmuletEffectId =
  | "celestial"
  | "moonlight"
  | "tempest"
  | "dusky"
  | "sunlit"
  | "thunder";

export type FishMutationId =
  | "bloom"
  | "glowing"
  | "earthly"
  | "sprout"
  | "starlight"
  | "albino"
  | "neon"
  | "amber"
  | "thunder"
  | "moonlight"
  | "lunar"
  | "tanned";

export type FishSizeId = "normal" | "big" | "giant";

export type FishHabitat = "ocean" | "pond" | "reef" | "cave";

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
  /** Phaser tint for the fish body. */
  tint: number;
  /**
   * Use setTintFill instead of setTint.
   * Needed for near-white tints — multiplicative white does nothing.
   */
  tintFill?: boolean;
  /** Soft glow aura color (ADD blend) around the fish. */
  glowColor?: number;
  toastColor: string;
  label: string;
  /** World-drop chance on spawn (0–1). Rod mutations use rodMutation instead. */
  chance?: number;
}

export const MUTATIONS: Record<FishMutationId, MutationDef> = {
  bloom: {
    id: "bloom",
    name: "Bloom",
    sellMult: 3,
    tint: 0xff9ec8,
    glowColor: 0xffb6d9,
    toastColor: "#ff9ec8",
    label: "Bloom! ",
  },
  glowing: {
    id: "glowing",
    name: "Glowing",
    sellMult: 2,
    tint: 0xfff0a0,
    glowColor: 0xffe066,
    toastColor: "#ffe066",
    label: "Glowing! ",
    chance: 0.02,
  },
  earthly: {
    id: "earthly",
    name: "Earthly",
    sellMult: 4,
    tint: 0xa67c52,
    glowColor: 0x5a9a4a,
    toastColor: "#a67c52",
    label: "Earthly! ",
    chance: 0.01,
  },
  sprout: {
    id: "sprout",
    name: "Sprout",
    sellMult: 6,
    tint: 0x7CFC00,
    glowColor: 0xa8ff60,
    toastColor: "#7CFC00",
    label: "Sprout! ",
  },
  starlight: {
    id: "starlight",
    name: "Starlight",
    sellMult: 8,
    tint: 0xb48cff,
    glowColor: 0xffb84d,
    toastColor: "#b48cff",
    label: "Starlight! ",
    chance: 0.0025,
  },
  albino: {
    id: "albino",
    name: "Albino",
    sellMult: 1.5,
    // Near-white fill — setTint(0xffffff) is a no-op (multiply by 1)
    tint: 0xfff5f0,
    tintFill: true,
    glowColor: 0xffffff,
    toastColor: "#f5f0e8",
    label: "Albino! ",
    chance: 0.04,
  },
  neon: {
    id: "neon",
    name: "Neon",
    sellMult: 3,
    tint: 0xff66cc,
    glowColor: 0x39ff14,
    toastColor: "#ff66cc",
    label: "Neon! ",
    chance: 0.015,
  },
  amber: {
    id: "amber",
    name: "Amber",
    sellMult: 2,
    tint: 0xff8c2a,
    glowColor: 0xffb040,
    toastColor: "#ff8c2a",
    label: "Amber! ",
  },
  thunder: {
    id: "thunder",
    name: "Thunder",
    sellMult: 5,
    tint: 0x4da6ff,
    glowColor: 0xffe066,
    toastColor: "#ffe066",
    label: "Thunder! ",
  },
  moonlight: {
    id: "moonlight",
    name: "Moonlight",
    sellMult: 2,
    tint: 0x6eb6ff,
    glowColor: 0xa8d8ff,
    toastColor: "#8ec8ff",
    label: "Moonlight! ",
  },
  lunar: {
    id: "lunar",
    name: "Lunar",
    sellMult: 4,
    tint: 0x5aa8ff,
    glowColor: 0xffe066,
    toastColor: "#ffe066",
    label: "Lunar! ",
  },
  tanned: {
    id: "tanned",
    name: "Tanned",
    sellMult: 2,
    tint: 0xc49868,
    glowColor: 0xd4a878,
    toastColor: "#c49868",
    label: "Tanned! ",
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

/** Persistent upgrade counts for the Augment Rod. */
export type AugmentStatKey =
  | "luck"
  | "resilience"
  | "control"
  | "progressSpeed"
  | "lineDepth";

export type AugmentUpgrades = Record<AugmentStatKey, number>;

export const AUGMENT_UPGRADE_CAPS: AugmentUpgrades = {
  luck: 3,
  resilience: 3,
  control: 4,
  progressSpeed: 4,
  lineDepth: 2,
};

/** Chance to open the Augment upgrade panel after a successful catch. */
export const AUGMENT_UPGRADE_CHANCE = 0.075;

export const ZERO_AUGMENT_UPGRADES: AugmentUpgrades = {
  luck: 0,
  resilience: 0,
  control: 0,
  progressSpeed: 0,
  lineDepth: 0,
};

export function clampAugmentUpgrades(
  raw: Partial<AugmentUpgrades> | null | undefined
): AugmentUpgrades {
  const out = { ...ZERO_AUGMENT_UPGRADES };
  if (!raw || typeof raw !== "object") return out;
  for (const key of Object.keys(AUGMENT_UPGRADE_CAPS) as AugmentStatKey[]) {
    const n = Math.floor(Number(raw[key]) || 0);
    out[key] = Math.max(0, Math.min(AUGMENT_UPGRADE_CAPS[key], n));
  }
  return out;
}

/** Apply Augment Rod upgrade counts onto base rod stats. */
export function applyAugmentUpgrades(
  base: RodStats,
  upgrades: AugmentUpgrades
): RodStats {
  return {
    luck: base.luck + upgrades.luck * 5,
    resilience: base.resilience + upgrades.resilience * 5,
    control: base.control + upgrades.control * 5,
    progressSpeed: base.progressSpeed + upgrades.progressSpeed * 5,
    lineDepth: base.lineDepth + upgrades.lineDepth,
  };
}

export function augmentHasUpgradeableStat(upgrades: AugmentUpgrades): boolean {
  return (Object.keys(AUGMENT_UPGRADE_CAPS) as AugmentStatKey[]).some(
    (k) => upgrades[k] < AUGMENT_UPGRADE_CAPS[k]
  );
}

export interface BobberStats {
  luck?: number;
  control?: number;
  progressSpeed?: number;
  lineDepth?: number;
  /** Extra attract radius in px (base attract is 340). */
  attractBonus?: number;
  /** How many fish can hook on one cast. */
  hooks?: 1 | 2;
  /** Multiplier on world-mutation chances on catch (not amber/bloom). */
  mutationChanceMult?: number;
}

export interface BobberCraftIngredient {
  itemId: ItemId;
  count: number;
  /** Required mutation on the fish (e.g. earthly yellowfin). */
  mutation?: FishMutationId;
  /** Accept any of these mutations (e.g. earthly or sprout). */
  mutations?: FishMutationId[];
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
  shop?: "village" | "jungle" | "cloud";
  /** Sold / crafted in the red-house bobber workshop. */
  bobberShop?: boolean;
  /** Sold in the green-house pack shop. */
  backpackShop?: boolean;
  isRod?: boolean;
  isEquipmentBag?: boolean;
  isBestiary?: boolean;
  isBobber?: boolean;
  isBackpack?: boolean;
  isAmulet?: boolean;
  /** Cosmetic hat unlocked for the accessories tab. */
  isHat?: boolean;
  /** Effect triggered when using this amulet from the equipment bag. */
  amuletEffect?: AmuletEffectId;
  /** Bag slot capacity when this backpack is owned. */
  bagSlots?: number;
  rodStats?: RodStats;
  bobberStats?: BobberStats;
  /** Coin + fish cost to craft (red house). */
  craftCost?: { coins: number; ingredients: BobberCraftIngredient[] };
  /** Mutation this rod can apply on a successful catch. */
  rodMutation?: RodMutationGrant;
  /**
   * On catch, roll world mutations at normal rates if the fish has none
   * (excludes amber / bloom / thunder — same pool as swimming fish).
   */
  grantsWorldMutations?: boolean;
  /** Catch-minigame special ability (Crystal Rod burst, etc.). */
  rodMinigamePower?: "crystal_burst";
  /** Quest item — never sold by merchants. */
  isQuestItem?: boolean;
  rarity?: FishRarity;
  /** Relative chance to spawn in water (among fish species). */
  spawnWeight?: number;
  /** Ocean (default), pond, or coral reef fish. */
  habitat?: FishHabitat;
  /** Never races the bobber (e.g. mushroom cluster). */
  ignoresBobber?: boolean;
  /** Only appears during a special abundance event (e.g. dolphin). */
  abundanceOnly?: boolean;
  /** Override preferred swim depth (px below surface). */
  depthBand?: { min: number; max: number };
  /** Extra chance to roll the shallow half of depthBand (like legends). */
  depthCanShallow?: boolean;
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
  /** Override pause length in the catch minigame (seconds). */
  minigamePauseDuration?: { min: number; max: number };
  /** Jump in arcs above the surface while idle (dolphins). */
  surfaceJumps?: boolean;
  /** Periodically spout water upward from the blowhole (whales). */
  surfaceSpout?: boolean;
  /** Added to rod resilience during the catch minigame (can be negative). */
  catchResilience?: number;
  /** Texture faces left (default fish face right). */
  facesLeft?: boolean;
  displayWidth?: number;
  displayHeight?: number;
  /** Override sprite size in the catch minigame (keeps world size separate). */
  minigameDisplayWidth?: number;
  minigameDisplayHeight?: number;
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
 * Rain pulls rare+ fish higher in the water column.
 */
export function rollSpawnDepthOffset(
  rarity: FishRarity,
  rainy = false,
  overrideBand?: { min: number; max: number } | null,
  canShallow = false
): number {
  const band = overrideBand ?? preferredDepthBand(rarity);
  const rarePlus =
    rarity === "rare" ||
    rarity === "epic" ||
    rarity === "legendary" ||
    rarity === "mythical";

  if (rainy && rarePlus) {
    // Bias toward the upper half of the band
    const mid = (band.min + band.max) / 2;
    const highMax = Math.max(band.min + 8, mid);
    return Math.floor(band.min + Math.random() * (highMax - band.min + 1));
  }

  if (rarity === "legendary" || rarity === "mythical" || canShallow) {
    if (Math.random() < 0.4) {
      const shallowMax = Math.min(
        Math.max(band.min + 12, (band.min + band.max) / 2),
        band.max
      );
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
      "A stout rod that tames wild fish. 30% resilience and solid control.",
    stackable: false,
    textureKey: "rod_firm",
    isRod: true,
    buyPrice: 1500,
    shop: "village",
    rodStats: {
      luck: -30,
      resilience: 30,
      control: 20,
      progressSpeed: 10,
      lineDepth: 2,
    },
  },
  amber_rod: {
    id: "amber_rod",
    name: "Amber Rod",
    description:
      "A balanced yellow rod — 15% Amber mutation (2× sell, orange glow).",
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
    rodMutation: { mutation: "amber", chance: 0.15 },
  },
  wildflower_rod: {
    id: "wildflower_rod",
    name: "Wildflower Rod",
    description:
      "Orange and pink swamp rod. Deep line, high luck — 15% Bloom (3× sell).",
    stackable: false,
    textureKey: "rod_wildflower",
    isRod: true,
    buyPrice: 14500,
    shop: "jungle",
    rodStats: {
      luck: 75,
      resilience: -35,
      control: 25,
      progressSpeed: 10,
      lineDepth: 3,
    },
    rodMutation: { mutation: "bloom", chance: 0.15 },
  },
  zeus_rod: {
    id: "zeus_rod",
    name: "Zeus Rod",
    description:
      "Forged in storm clouds — 5% Thunder (5×). +15% stats in Thunderstorms (not depth).",
    stackable: false,
    textureKey: "rod_zeus",
    isRod: true,
    buyPrice: 60000,
    shop: "cloud",
    rodStats: {
      luck: 85,
      resilience: 10,
      control: 20,
      progressSpeed: 30,
      lineDepth: 4,
    },
    rodMutation: { mutation: "thunder", chance: 0.05 },
  },
  coral_rod: {
    id: "coral_rod",
    name: "Coral Rod",
    description:
      "A rare reef relic. World mutations on catch at normal rates (no Amber/Bloom). It only accepts the right gift.",
    stackable: false,
    textureKey: "rod_coral",
    isRod: true,
    buyPrice: 43000,
    grantsWorldMutations: true,
    rodStats: {
      luck: 60,
      resilience: 15,
      control: 15,
      progressSpeed: 20,
      lineDepth: 3,
    },
  },
  augment_rod: {
    id: "augment_rod",
    name: "Augment Rod",
    description:
      "A unique grey rod with a star tip. Each catch has a 7.5% chance to upgrade one of its stats.",
    stackable: false,
    textureKey: "rod_augment",
    isRod: true,
    buyPrice: 17000,
    rodStats: {
      luck: 35,
      resilience: 5,
      control: 5,
      progressSpeed: 0,
      lineDepth: 2,
    },
  },
  crystal_rod: {
    id: "crystal_rod",
    name: "Crystal Rod",
    description:
      "Restored vault crystal. Every 0.5s while fighting a fish, 15% chance to burst — stun and +10% progress.",
    stackable: false,
    textureKey: "rod_crystal",
    isRod: true,
    rodMinigamePower: "crystal_burst",
    rodStats: {
      luck: 70,
      resilience: 5,
      control: 15,
      progressSpeed: 15,
      lineDepth: 4,
    },
  },
  gem_red: {
    id: "gem_red",
    name: "Ruby Gem",
    description: "A lost vault jewel. Unsellable — return it to a pedestal.",
    stackable: false,
    textureKey: "gem_red",
    isQuestItem: true,
  },
  gem_green: {
    id: "gem_green",
    name: "Emerald Gem",
    description: "A lost vault jewel. Unsellable — return it to a pedestal.",
    stackable: false,
    textureKey: "gem_green",
    isQuestItem: true,
  },
  gem_blue: {
    id: "gem_blue",
    name: "Sapphire Gem",
    description: "A lost vault jewel. Unsellable — return it to a pedestal.",
    stackable: false,
    textureKey: "gem_blue",
    isQuestItem: true,
  },
  gem_yellow: {
    id: "gem_yellow",
    name: "Topaz Gem",
    description: "A lost vault jewel. Unsellable — return it to a pedestal.",
    stackable: false,
    textureKey: "gem_yellow",
    isQuestItem: true,
  },
  gem_purple: {
    id: "gem_purple",
    name: "Amethyst Gem",
    description: "A lost vault jewel. Unsellable — return it to a pedestal.",
    stackable: false,
    textureKey: "gem_purple",
    isQuestItem: true,
  },
  equipment_bag: {
    id: "equipment_bag",
    name: "Equipment Bag",
    description: "Holds your fishing rods. Open to equip one.",
    stackable: false,
    textureKey: "equipment_bag",
    isEquipmentBag: true,
  },
  hat_tophat: {
    id: "hat_tophat",
    name: "Top Hat",
    description: "A finely detailed top hat. Yours from the start.",
    stackable: false,
    textureKey: "hat_tophat",
    isHat: true,
  },
  hat_banana: {
    id: "hat_banana",
    name: "Banana Peel",
    description: "A slippery classic. Free for every angler.",
    stackable: false,
    textureKey: "hat_banana",
    isHat: true,
  },
  hat_cap: {
    id: "hat_cap",
    name: "Straw Hat",
    description: "A finely woven straw hat. Yours from the start.",
    stackable: false,
    textureKey: "hat_cap",
    isHat: true,
  },
  hat_shell: {
    id: "hat_shell",
    name: "Shell Hat",
    description: "A nautilus shell worn as a hat. Gift from a grateful cave friend.",
    stackable: false,
    textureKey: "hat_shell",
    isHat: true,
  },
  hat_yellowfin: {
    id: "hat_yellowfin",
    name: "Yellowfin Hat",
    description: "Awarded for landing a Yellowfin Tuna.",
    stackable: false,
    textureKey: "yellowfin_tuna",
    isHat: true,
  },
  hat_gem: {
    id: "hat_gem",
    name: "Gem Halo",
    description: "A floating coral gem above your head. Gift of the reef.",
    stackable: false,
    textureKey: "hat_gem",
    isHat: true,
  },
  bestiary: {
    id: "bestiary",
    name: "Bestiary",
    description: "A book of waters and the fish you've discovered.",
    stackable: false,
    textureKey: "bestiary_book",
    isBestiary: true,
  },
  bobber_starter: {
    id: "bobber_starter",
    name: "Red Bobber",
    description: "Your starter bobber — one hook, reliable and simple.",
    stackable: false,
    textureKey: "bobber_red",
    isBobber: true,
    bobberShop: true,
    bobberStats: { hooks: 1 },
  },
  bobber_double: {
    id: "bobber_double",
    name: "Twin Hook Bobber",
    description:
      "Two hooks — wait for a second bite (2–3s). Dual catches are much harder.",
    stackable: false,
    textureKey: "bobber_red_double",
    isBobber: true,
    bobberShop: true,
    bobberStats: { hooks: 2 },
    craftCost: {
      coins: 30000,
      ingredients: [{ itemId: "arapaima", count: 2 }],
    },
  },
  bobber_reinforced: {
    id: "bobber_reinforced",
    name: "Reinforced Bobber",
    description: "Sturdy grey bobber. +10% Control and +10% Progress Speed.",
    stackable: false,
    textureKey: "bobber_grey",
    isBobber: true,
    bobberShop: true,
    buyPrice: 3300,
    bobberStats: { hooks: 1, control: 10, progressSpeed: 10 },
  },
  bobber_mutation: {
    id: "bobber_mutation",
    name: "Mutation Bobber",
    description:
      "Yellow-green bobber. Doubles world mutation chances on catch (not Amber/Bloom). Craft: $25k + Earthly or Sprout Yellowfin.",
    stackable: false,
    textureKey: "bobber_yellow",
    isBobber: true,
    bobberShop: true,
    bobberStats: { hooks: 1, mutationChanceMult: 2 },
    craftCost: {
      coins: 25000,
      ingredients: [
        {
          itemId: "yellowfin_tuna",
          count: 1,
          mutations: ["earthly", "sprout"],
        },
      ],
    },
  },
  bobber_clover: {
    id: "bobber_clover",
    name: "Clover Bobber",
    description: "Lucky clover lure. +15% Luck.",
    stackable: false,
    textureKey: "lure_clover",
    isBobber: true,
    bobberShop: true,
    buyPrice: 2500,
    bobberStats: { hooks: 1, luck: 15 },
  },
  bobber_depth: {
    id: "bobber_depth",
    name: "Depth Lure",
    description:
      "Green fish lure. +1m line depth and wider attract range for deep fish.",
    stackable: false,
    textureKey: "lure_green_fish",
    isBobber: true,
    bobberShop: true,
    bobberStats: { hooks: 1, lineDepth: 1, attractBonus: 120 },
    craftCost: {
      coins: 5000,
      ingredients: [{ itemId: "mushroom_cluster", count: 3 }],
    },
  },
  amulet_celestial: {
    id: "amulet_celestial",
    name: "Celestial Amulet",
    description: "Spins the heavens — races time to the next day or night.",
    stackable: true,
    textureKey: "amulet_celestial",
    buyPrice: 20000,
    isAmulet: true,
    amuletEffect: "celestial",
  },
  amulet_moonlight: {
    id: "amulet_moonlight",
    name: "Moonlight Amulet",
    description: "Calls a Full Moon (replaces other weather). Night only.",
    stackable: true,
    textureKey: "amulet_moonlight",
    buyPrice: 30000,
    isAmulet: true,
    amuletEffect: "moonlight",
  },
  amulet_tempest: {
    id: "amulet_tempest",
    name: "Tempest Amulet",
    description: "Summons rain (replaces other weather).",
    stackable: true,
    textureKey: "amulet_tempest",
    buyPrice: 20000,
    isAmulet: true,
    amuletEffect: "tempest",
  },
  amulet_dusky: {
    id: "amulet_dusky",
    name: "Dusky Amulet",
    description: "Heavy clouds (replaces other weather).",
    stackable: true,
    textureKey: "amulet_dusky",
    buyPrice: 10000,
    isAmulet: true,
    amuletEffect: "dusky",
  },
  amulet_sunlit: {
    id: "amulet_sunlit",
    name: "Sunlit Amulet",
    description: "Bright sun (replaces other weather). Day only.",
    stackable: true,
    textureKey: "amulet_sunlit",
    buyPrice: 20000,
    isAmulet: true,
    amuletEffect: "sunlit",
  },
  amulet_thunder: {
    id: "amulet_thunder",
    name: "Thunder Amulet",
    description: "Thunderstorm (replaces other weather).",
    stackable: true,
    textureKey: "amulet_thunder",
    buyPrice: 200000,
    isAmulet: true,
    amuletEffect: "thunder",
  },
  backpack_starter: {
    id: "backpack_starter",
    name: "Starter Pack",
    description: "Your first pack — 10 bag slots.",
    stackable: false,
    textureKey: "backpack_icon",
    isBackpack: true,
    bagSlots: 10,
  },
  backpack_t1: {
    id: "backpack_t1",
    name: "Traveler Pack",
    description: "Tier 1 backpack — 15 bag slots. Permanent upgrade.",
    stackable: false,
    textureKey: "backpack_icon",
    isBackpack: true,
    backpackShop: true,
    buyPrice: 5000,
    bagSlots: 15,
  },
  backpack_t2: {
    id: "backpack_t2",
    name: "Explorer Pack",
    description: "Tier 2 backpack — 20 bag slots. Permanent upgrade.",
    stackable: false,
    textureKey: "backpack_icon",
    isBackpack: true,
    backpackShop: true,
    buyPrice: 10000,
    bagSlots: 20,
  },
  backpack_t3: {
    id: "backpack_t3",
    name: "Master Pack",
    description: "Tier 3 backpack — 25 bag slots. Permanent upgrade.",
    stackable: false,
    textureKey: "backpack_icon",
    isBackpack: true,
    backpackShop: true,
    buyPrice: 15000,
    bagSlots: 25,
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
  clownfish: {
    id: "clownfish",
    name: "Clownfish",
    description: "A common reef clownfish. Slow, prefers the deep coral.",
    stackable: true,
    textureKey: "clownfish",
    sellPrice: 30,
    rarity: "common",
    habitat: "reef",
    spawnWeight: 8,
    minigameSpeed: 0.7,
    depthBand: { min: 72, max: 118 },
    displayWidth: 36,
    displayHeight: 22,
  },
  angelfish: {
    id: "angelfish",
    name: "Angelfish",
    description: "An uncommon reef angelfish. Medium pace, mid-depth.",
    stackable: true,
    textureKey: "angelfish",
    sellPrice: 100,
    rarity: "uncommon",
    habitat: "reef",
    spawnWeight: 5,
    minigameSpeed: 1.1,
    depthBand: { min: 40, max: 72 },
    displayWidth: 42,
    displayHeight: 28,
  },
  pufferfish: {
    id: "pufferfish",
    name: "Pufferfish",
    description:
      "A rare reef puffer. Fast and aggressive — can hug the shallows or go deep.",
    stackable: true,
    textureKey: "pufferfish",
    sellPrice: 200,
    rarity: "rare",
    habitat: "reef",
    spawnWeight: 3.2,
    minigameSpeed: 1.45,
    minigameJerky: true,
    depthBand: { min: 18, max: 120 },
    depthCanShallow: true,
    // Near clownfish size (36×22), keep puffer aspect
    displayWidth: 38,
    displayHeight: 26,
  },
  nurse_shark: {
    id: "nurse_shark",
    name: "Nurse Shark",
    description:
      "An epic reef shark. Nearly as fast as a sunfish, deep and aggressive.",
    stackable: true,
    textureKey: "nurse_shark",
    sellPrice: 780,
    rarity: "epic",
    habitat: "reef",
    spawnWeight: 1,
    minigameSpeed: 1.85,
    minigameJerky: true,
    minigameChaos: 0.6,
    unstoppableJerky: true,
    depthBand: { min: 88, max: 140 },
    displayWidth: 90,
    displayHeight: 34,
  },
  surgeon_fish: {
    id: "surgeon_fish",
    name: "Surgeon Fish",
    description:
      "A legendary surgeonfish. Fast swimmer that slows your catch progress.",
    stackable: true,
    textureKey: "surgeon_fish",
    sellPrice: 2605,
    rarity: "legendary",
    habitat: "reef",
    spawnWeight: 1,
    minigameSpeed: 1.55,
    minigameJerky: true,
    catchProgress: -30,
    displayWidth: 56,
    displayHeight: 22,
  },
  dolphin: {
    id: "dolphin",
    name: "Dolphin",
    description:
      "A mythical dolphin. Only during reef abundances — fast, fierce, −80% progress, long pauses.",
    stackable: true,
    textureKey: "dolphin",
    sellPrice: 10000,
    rarity: "mythical",
    habitat: "reef",
    abundanceOnly: true,
    spawnWeight: 0,
    minigameSpeed: 1.95,
    minigameJerky: true,
    minigameChaos: 0.5,
    unstoppableJerky: true,
    minigamePauseChance: 0.28,
    minigamePauseDuration: { min: 1, max: 2 },
    surfaceJumps: true,
    catchProgress: -80,
    depthBand: { min: 16, max: 48 },
    displayWidth: 92,
    displayHeight: 28,
  },
  chilled_clownfish: {
    id: "chilled_clownfish",
    name: "Chilled Clownfish",
    description:
      "A common cave clownfish. Slow, but a touch quicker than its reef cousin.",
    stackable: true,
    textureKey: "chilled_clownfish",
    sellPrice: 200,
    rarity: "common",
    habitat: "cave",
    spawnWeight: 8,
    minigameSpeed: 0.82,
    depthBand: { min: 28, max: 170 },
    displayWidth: 42,
    displayHeight: 30,
  },
  crystal_frog: {
    id: "crystal_frog",
    name: "Crystal Frog",
    description: "An uncommon cave frog — quick bursts like its swamp kin.",
    stackable: true,
    textureKey: "crystal_frog",
    sellPrice: 260,
    rarity: "uncommon",
    habitat: "cave",
    spawnWeight: 5,
    minigameSpeed: 1.35,
    minigamePauseChance: 0.48,
    depthBand: { min: 36, max: 200 },
    displayWidth: 44,
    displayHeight: 24,
  },
  crystalfin_tuna: {
    id: "crystalfin_tuna",
    name: "Crystalfin Tuna",
    description:
      "A rare crystal-backed tuna. A bit faster than a pufferfish.",
    stackable: true,
    textureKey: "crystalfin_tuna",
    sellPrice: 540,
    rarity: "rare",
    habitat: "cave",
    spawnWeight: 3.2,
    minigameSpeed: 1.52,
    minigameJerky: true,
    depthBand: { min: 48, max: 240 },
    displayWidth: 72,
    displayHeight: 37,
  },
  nautilus: {
    id: "nautilus",
    name: "Nautilus",
    description: "An epic shelled hunter of the mountain lakes. Fast.",
    stackable: true,
    textureKey: "nautilus",
    sellPrice: 1000,
    rarity: "epic",
    habitat: "cave",
    spawnWeight: 1,
    minigameSpeed: 1.75,
    minigameJerky: true,
    depthBand: { min: 60, max: 260 },
    displayWidth: 56,
    displayHeight: 40,
  },
  serpent_eel: {
    id: "serpent_eel",
    name: "Serpent Eel",
    description:
      "A legendary cave serpent. Far faster than a surgeon fish.",
    stackable: true,
    textureKey: "serpent_eel",
    sellPrice: 6500,
    rarity: "legendary",
    habitat: "cave",
    spawnWeight: 1,
    minigameSpeed: 2.05,
    minigameJerky: true,
    minigameChaos: 0.65,
    catchProgress: -25,
    depthBand: { min: 50, max: 280 },
    displayWidth: 110,
    displayHeight: 22,
  },
  cave_whale: {
    id: "cave_whale",
    name: "Cave Whale",
    description:
      "A mythical mountain whale. Slow and massive — −90% catch progress. Only during cave abundances.",
    stackable: true,
    textureKey: "cave_whale",
    sellPrice: 25140,
    rarity: "mythical",
    habitat: "cave",
    abundanceOnly: true,
    spawnWeight: 0,
    minigameSpeed: 1.15,
    minigameJerky: true,
    minigameChaos: 0.35,
    unstoppableJerky: true,
    catchProgress: -90,
    catchResilience: -55,
    drainMult: 1.7,
    surfaceSpout: true,
    // Native aspect in the world; smaller icon in the catch bar
    depthBand: { min: 36, max: 58 },
    displayWidth: 360,
    displayHeight: 117,
    minigameDisplayWidth: 70,
    minigameDisplayHeight: 23,
  },
};

export const FISH_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].sellPrice != null);

/** Coins claimed the first time a fish is unlocked in the bestiary. */
export const BESTIARY_CLAIM_REWARD: Record<FishRarity, number> = {
  common: 30,
  uncommon: 75,
  rare: 150,
  epic: 350,
  legendary: 650,
  mythical: 1000,
};

export interface BestiaryArea {
  id: FishHabitat;
  name: string;
  subtitle: string;
  fishIds: ItemId[];
}

const RARITY_SORT_ORDER: Record<FishRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
};

function fishIdsByHabitat(habitat: FishHabitat): ItemId[] {
  return FISH_ITEM_IDS.filter((id) =>
    habitat === "ocean"
      ? (ITEMS[id].habitat ?? "ocean") === "ocean"
      : ITEMS[id].habitat === habitat
  ).sort(
    (a, b) =>
      RARITY_SORT_ORDER[ITEMS[a].rarity ?? "common"] -
      RARITY_SORT_ORDER[ITEMS[b].rarity ?? "common"]
  );
}

export const BESTIARY_AREAS: BestiaryArea[] = [
  {
    id: "ocean",
    name: "Ocean",
    subtitle: "Open waters beyond the docks",
    fishIds: fishIdsByHabitat("ocean"),
  },
  {
    id: "reef",
    name: "Coral Reef",
    subtitle: "Shallow western reef waters",
    fishIds: fishIdsByHabitat("reef"),
  },
  {
    id: "pond",
    name: "Swamp Pond",
    subtitle: "Murky waters in the jungle swamp",
    fishIds: fishIdsByHabitat("pond"),
  },
  {
    id: "cave",
    name: "Frostpeak Cave",
    subtitle: "Icy lakes under the mountain",
    fishIds: fishIdsByHabitat("cave"),
  },
];

export const ROD_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].isRod);

export const BOBBER_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].isBobber);

export const AMULET_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].isAmulet);

export const HAT_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].isHat);

/** Free hats every save starts with. */
export const STARTER_HAT_IDS: ItemId[] = [
  "hat_tophat",
  "hat_banana",
  "hat_cap",
];

export const AMULET_SHOP_IDS: ItemId[] = AMULET_ITEM_IDS.filter(
  (id) => ITEMS[id].buyPrice != null
);

export const BOBBER_SHOP_IDS: ItemId[] = BOBBER_ITEM_IDS.filter(
  (id) => ITEMS[id].bobberShop && id !== "bobber_starter"
);

export const BACKPACK_ITEM_IDS: ItemId[] = (
  Object.keys(ITEMS) as ItemId[]
).filter((id) => ITEMS[id].isBackpack);

/** Shop list — upgrades only (starter is free / default). */
export const BACKPACK_SHOP_IDS: ItemId[] = BACKPACK_ITEM_IDS.filter(
  (id) => ITEMS[id].backpackShop
);

export function backpackTier(backpackId: ItemId): number {
  switch (backpackId) {
    case "backpack_starter":
      return 0;
    case "backpack_t1":
      return 1;
    case "backpack_t2":
      return 2;
    case "backpack_t3":
      return 3;
    default:
      return -1;
  }
}

export const SHOP_ROD_IDS: ItemId[] = ROD_ITEM_IDS.filter(
  (id) => ITEMS[id].buyPrice != null && ITEMS[id].shop === "village"
);

export const JUNGLE_SHOP_ROD_IDS: ItemId[] = ROD_ITEM_IDS.filter(
  (id) => ITEMS[id].buyPrice != null && ITEMS[id].shop === "jungle"
);

/**
 * Absolute spawn share for epic / legendary / mythical.
 * These rise with luck (including luck over 100%) and never shrink
 * from mythical crowding.
 *
 * Ocean: base + 2.5% per +25% luck (epic / legendary / mythical)
 * Pond:  base + 1.25% per +25% luck (half ocean scaling)
 * Reef:  epic 3% + 2.5%/25 luck · legendary 2% + 1%/25 luck
 *        (mythical reef fish are abundance-only)
 * Cave:  epic 2.35% + 0.75%/25 luck · legendary 0.5% + 0.75%/25 luck
 *        (mythical cave fish are abundance-only)
 *
 * Bases — Ocean: Epic 7.5%, Legendary 5%, Mythical 1%
 *          Pond:  Epic 4%,   Legendary 2.5%, Mythical 0.5%
 *          Reef:  Epic 3%,   Legendary 0.5%
 *          Cave:  Epic 2.35%, Legendary 0.5%
 */
function absoluteRareShare(
  rarity: FishRarity,
  luckPercent: number,
  habitat: FishHabitat
): number | null {
  const n = luckPercent / 25;
  if (habitat === "reef") {
    if (rarity === "epic") return Math.max(0, 0.03 + n * 0.025);
    // Same starting rate as pond mythical (alligator / crocodile)
    if (rarity === "legendary") return Math.max(0, 0.005 + n * 0.01);
    return null;
  }
  if (habitat === "cave") {
    if (rarity === "epic") return Math.max(0, 0.0235 + n * 0.0075);
    if (rarity === "legendary") return Math.max(0, 0.005 + n * 0.0075);
    return null;
  }
  const perTier = habitat === "ocean" ? 0.025 : 0.0125;
  if (habitat === "ocean") {
    if (rarity === "epic") return Math.max(0, 0.075 + n * perTier);
    if (rarity === "legendary") return Math.max(0, 0.05 + n * perTier);
    if (rarity === "mythical") return Math.max(0, 0.01 + n * perTier);
  } else {
    if (rarity === "epic") return Math.max(0, 0.04 + n * perTier);
    if (rarity === "legendary") return Math.max(0, 0.025 + n * perTier);
    if (rarity === "mythical") return Math.max(0, 0.005 + n * perTier);
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
      (ITEMS[id].habitat ?? "ocean") === habitat &&
      !ITEMS[id].abundanceOnly &&
      !excluded.has(id)
  );
  if (fish.length === 0) {
    if (habitat === "reef") return "clownfish";
    if (habitat === "cave") return "chilled_clownfish";
    return "sockeye_salmon";
  }

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

/** Apply mutation body color (handles white/albino fill tints). */
export function applyMutationTint(
  image: { clearTint(): void; setTint(tint: number): void; setTintFill(tint: number): void },
  mutation?: FishMutationId | null
): void {
  image.clearTint();
  if (!mutation) return;
  const mut = MUTATIONS[mutation];
  if (!mut) return;
  if (mut.tintFill) {
    image.setTintFill(mut.tint);
  } else {
    image.setTint(mut.tint);
  }
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
export function rollFishSize(chanceMult = 1): FishSizeId {
  const m = Math.max(0, chanceMult);
  const r = Math.random();
  const giant = FISH_SIZES.giant.spawnChance * m;
  const big = FISH_SIZES.big.spawnChance * m;
  if (r < giant) return "giant";
  if (r < giant + big) return "big";
  return "normal";
}

/** World mutations that can appear on swimming fish (not rod/event-only). */
const ROD_ONLY_MUTATIONS = new Set<FishMutationId>([
  "bloom",
  "amber",
  "thunder",
  "moonlight",
  "lunar",
  "tanned",
]);

/** Full moon catch odds (mutually exclusive; lunar checked first). */
export const FULL_MOON_LUNAR_CHANCE = 0.05;
export const FULL_MOON_MOONLIGHT_CHANCE = 0.1;

/** Sunny weather: Tanned spawn/catch chance. */
export const SUNNY_TANNED_CHANCE = 0.1;

/** Roll Moonlight / Lunar during Full Moon weather. */
export function rollFullMoonMutation(
  chanceMult = 1
): FishMutationId | null {
  const m = Math.max(0, chanceMult);
  if (Math.random() < FULL_MOON_LUNAR_CHANCE * m) return "lunar";
  if (Math.random() < FULL_MOON_MOONLIGHT_CHANCE * m) return "moonlight";
  return null;
}

/** Roll Tanned during Sunny weather. */
export function rollSunnyMutation(chanceMult = 1): FishMutationId | null {
  const m = Math.max(0, chanceMult);
  if (Math.random() < SUNNY_TANNED_CHANCE * m) return "tanned";
  return null;
}

/** Chance earthly upgrades into Sprout when applied. */
const EARTHLY_TO_SPROUT_CHANCE = 0.01;

function maybeUpgradeEarthly(
  mutation: FishMutationId | null
): FishMutationId | null {
  if (mutation === "earthly" && Math.random() < EARTHLY_TO_SPROUT_CHANCE) {
    return "sprout";
  }
  return mutation;
}

/**
 * Roll a world mutation (spawn or catch).
 * @param chanceMult doubles rates for Mutation Bobber (amber/bloom excluded).
 */
export function rollWorldMutation(chanceMult = 1): FishMutationId | null {
  const world: { id: FishMutationId; chance: number }[] = (
    Object.values(MUTATIONS) as MutationDef[]
  )
    .filter(
      (m) =>
        m.chance != null &&
        !ROD_ONLY_MUTATIONS.has(m.id) &&
        m.id !== "sprout"
    )
    .map((m) => ({ id: m.id, chance: m.chance! * Math.max(0, chanceMult) }));

  world.sort((a, b) => b.chance - a.chance);
  for (const entry of world) {
    if (Math.random() < entry.chance) {
      return maybeUpgradeEarthly(entry.id);
    }
  }
  return null;
}

/** Rod mutation only (Bloom / Amber / Thunder). Does not roll world mutations. */
export function rollRodMutation(
  rodId: ItemId,
  chanceBonus = 0,
  chanceMult = 1
): FishMutationId | null {
  const grant = ITEMS[rodId]?.rodMutation;
  if (!grant) return null;
  const chance = (grant.chance + chanceBonus) * Math.max(0, chanceMult);
  if (Math.random() < chance) return grant.mutation;
  return null;
}

/** Exact coin gift the floating Coral Rod accepts (never shown in its offer UI). */
export const CORAL_ROD_OFFER_AMOUNT = 43000;

/**
 * Final catch mutation.
 * Already-mutated fish keep their mutation (never overwritten by rod / re-roll).
 * Mutation bobber can roll world mutations at 2× on unmutated fish.
 * Coral Rod rolls world mutations at normal rates (no Amber/Bloom).
 * Rod mutations only apply if the fish still has none.
 * @param speciesMutMult species modifier (e.g. 0.5 = half chance for dolphins)
 */
export function resolveCatchMutation(
  rodId: ItemId,
  worldMutation: FishMutationId | null | undefined,
  mutationChanceMult = 1,
  rodChanceBonus = 0,
  speciesMutMult = 1
): FishMutationId | null {
  if (worldMutation) return worldMutation;
  if (mutationChanceMult > 1) {
    const boosted = rollWorldMutation(mutationChanceMult * speciesMutMult);
    if (boosted) return boosted;
  }
  if (ITEMS[rodId]?.grantsWorldMutations) {
    const fromRod = rollWorldMutation(speciesMutMult);
    if (fromRod) return fromRod;
  }
  return rollRodMutation(rodId, rodChanceBonus, speciesMutMult);
}

/**
 * Final catch mutation: rod grant first, else the fish's world mutation.
 * @deprecated Prefer resolveCatchMutation
 */
export function rollCatchMutation(
  rodId: ItemId,
  worldMutation?: FishMutationId | null
): FishMutationId | null {
  return resolveCatchMutation(rodId, worldMutation ?? null, 1);
}

export const BASE_ATTRACT_RADIUS = 340;

export function formatBobberStats(def: ItemDef): string {
  const s = def.bobberStats ?? {};
  const lines: string[] = [];
  if ((s.hooks ?? 1) > 1) lines.push(`Hooks  ${s.hooks}`);
  if (s.luck) lines.push(`Luck  +${s.luck}%`);
  if (s.control) lines.push(`Control  +${s.control}%`);
  if (s.progressSpeed) lines.push(`Progress  +${s.progressSpeed}%`);
  if (s.lineDepth) lines.push(`Line Depth  +${s.lineDepth}m`);
  if (s.attractBonus) lines.push(`Attract range  +${s.attractBonus}px`);
  if (s.mutationChanceMult && s.mutationChanceMult > 1) {
    lines.push(`World mutations  ×${s.mutationChanceMult} on catch`);
  }
  if (lines.length === 0) lines.push("No bonus stats");
  return lines.join("\n");
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

export function formatRodExtras(def: ItemDef): string {
  const lines: string[] = [];
  if (def.grantsWorldMutations) {
    lines.push("World mutations on catch (normal rates)");
  }
  if (def.id === "augment_rod") {
    lines.push("7.5% chance to upgrade a stat on catch");
  }
  if (def.rodMutation) {
    const m = MUTATIONS[def.rodMutation.mutation];
    lines.push(
      `${m.name}  ${Math.round(def.rodMutation.chance * 100)}%  ·  ${m.sellMult}× sell`
    );
  }
  return lines.join("\n");
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
/** Starter bag size (also backpack_starter.bagSlots). */
export const INVENTORY_SIZE = 10;
/** Largest backpack capacity — bag arrays are this long. */
export const MAX_INVENTORY_SIZE = 25;

export function backpackSlotCount(backpackId: ItemId): number {
  return ITEMS[backpackId]?.bagSlots ?? INVENTORY_SIZE;
}
