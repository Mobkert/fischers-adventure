import { FishRarity, ItemId, ITEMS, RodStats } from "../data/items";

/** Max rod mastery level. */
export const ROD_MASTERY_MAX_LEVEL = 20;

/** Level at which legacy rod mastery abilities unlock. */
export const ROD_MASTERY_ABILITY_LEVEL = 15;

/** Level at which the rod gains its golden mastery look + sparkles. */
export const ROD_MASTERY_GOLD_LEVEL = 10;

/** Level at which the rod gains its rainbow mastery look + tip trail. */
export const ROD_MASTERY_RAINBOW_LEVEL = 20;

/** XP required to go from level 1 → 2. */
export const ROD_MASTERY_BASE_XP = 600;

/** Extra XP added to the requirement for each level after the first. */
export const ROD_MASTERY_XP_STEP = 400;

export interface RodMasteryProgress {
  /** Current level (1–20). */
  level: number;
  /** XP toward the next level (0 when maxed). */
  xp: number;
}

export interface RodXpGrantResult {
  rodId: ItemId;
  xpGained: number;
  fromLevel: number;
  fromXp: number;
  toLevel: number;
  toXp: number;
  levelsGained: number;
  /** True if this grant crossed the ability unlock threshold. */
  abilityUnlocked: boolean;
  maxed: boolean;
}

/** Per-fish XP — named catches match the design table; others use fair rarity defaults. */
const FISH_XP_OVERRIDES: Partial<Record<ItemId, number>> = {
  // Ocean starter lane
  driftwood: 10,
  sockeye_salmon: 20,
  flounder: 60,
  yellowfin_tuna: 120,
  bluefin_tuna: 245,
  phantom_eel: 360,
  sunfish: 570,
  // Swamp
  mushroom_cluster: 12,
  white_perch: 55,
  whisker_catfish: 115,
  swamp_frog: 240,
  arapaima: 380,
  alligator: 620,
  // Dustspire
  coconut: 14,
  coconut_crab: 58,
  skeletal_seahorse: 125,
  decayed_nautilus: 250,
  cactifin: 390,
  leopard_shark: 640,
  // Coral reef
  clownfish: 15,
  angelfish: 62,
  pufferfish: 130,
  nurse_shark: 255,
  surgeon_fish: 400,
  dolphin: 4000,
  // Frostpeak cave
  chilled_clownfish: 16,
  crystal_frog: 65,
  crystalfin_tuna: 135,
  nautilus: 260,
  serpent_eel: 410,
  cave_whale: 7000,
  // Ashencast
  ore_cluster: 18,
  volcanic_hermitcrab: 70,
  ash_flounder: 140,
  molter: 270,
  pyrefin: 430,
  magma_jellyfish: 680,
  ashencast_trout: 1200,
};

const RARITY_XP: Record<FishRarity, number> = {
  common: 15,
  uncommon: 60,
  rare: 125,
  epic: 250,
  legendary: 380,
  mythical: 600,
  mystical: 1200,
  admin: 5000,
};

export function emptyRodMastery(): RodMasteryProgress {
  return { level: 1, xp: 0 };
}

export function clampRodMastery(
  raw: Partial<RodMasteryProgress> | null | undefined
): RodMasteryProgress {
  const level = Math.max(
    1,
    Math.min(ROD_MASTERY_MAX_LEVEL, Math.floor(Number(raw?.level) || 1))
  );
  const need = xpRequiredForLevel(level);
  const xp =
    level >= ROD_MASTERY_MAX_LEVEL
      ? 0
      : Math.max(0, Math.min(need - 1, Math.floor(Number(raw?.xp) || 0)));
  return { level, xp };
}

/**
 * XP needed to advance from `level` to `level + 1`.
 * L1→2 = 600, L2→3 = 1000, … (+400 each step).
 */
export function xpRequiredForLevel(level: number): number {
  if (level < 1 || level >= ROD_MASTERY_MAX_LEVEL) return 0;
  return ROD_MASTERY_BASE_XP + (level - 1) * ROD_MASTERY_XP_STEP;
}

/** Progress 0–1 toward the next level (1 when maxed). */
export function rodMasteryFill(progress: RodMasteryProgress): number {
  if (progress.level >= ROD_MASTERY_MAX_LEVEL) return 1;
  const need = xpRequiredForLevel(progress.level);
  if (need <= 0) return 1;
  return Math.max(0, Math.min(1, progress.xp / need));
}

/** +1% luck / resilience / progress speed per level above 1 (level 20 = +19%). */
export function rodLevelStatMult(level: number): number {
  const lv = Math.max(1, Math.min(ROD_MASTERY_MAX_LEVEL, Math.floor(level)));
  return 1 + (lv - 1) * 0.01;
}

/** Control scales slower — +0.25% per level above 1 (level 20 = +4.75%). */
export function rodLevelControlMult(level: number): number {
  const lv = Math.max(1, Math.min(ROD_MASTERY_MAX_LEVEL, Math.floor(level)));
  return 1 + (lv - 1) * 0.0025;
}

export function applyRodLevelStats(
  stats: RodStats,
  level: number
): RodStats {
  const mult = rodLevelStatMult(level);
  const controlMult = rodLevelControlMult(level);
  if (mult === 1 && controlMult === 1) return { ...stats };
  return {
    luck: Math.round(stats.luck * mult),
    resilience: Math.round(stats.resilience * mult),
    control: Math.round(stats.control * controlMult * 100) / 100,
    progressSpeed: Math.round(stats.progressSpeed * mult),
    lineDepth: stats.lineDepth,
  };
}

export function fishMasteryXp(speciesId: ItemId): number {
  const override = FISH_XP_OVERRIDES[speciesId];
  if (override != null) return override;
  const rarity = ITEMS[speciesId]?.rarity;
  if (rarity && rarity in RARITY_XP) return RARITY_XP[rarity];
  return 15;
}

/** Apply XP with overflow leveling. Mutates `progress` in place and returns a HUD summary. */
export function grantRodXp(
  progress: RodMasteryProgress,
  amount: number,
  rodId: ItemId
): RodXpGrantResult {
  const xpGained = Math.max(0, Math.floor(amount));
  const fromLevel = progress.level;
  const fromXp = progress.xp;
  const crossedAbility =
    fromLevel < ROD_MASTERY_ABILITY_LEVEL;

  if (xpGained <= 0 || progress.level >= ROD_MASTERY_MAX_LEVEL) {
    return {
      rodId,
      xpGained: 0,
      fromLevel,
      fromXp,
      toLevel: progress.level,
      toXp: progress.xp,
      levelsGained: 0,
      abilityUnlocked: false,
      maxed: progress.level >= ROD_MASTERY_MAX_LEVEL,
    };
  }

  let remaining = xpGained;
  while (remaining > 0 && progress.level < ROD_MASTERY_MAX_LEVEL) {
    const need = xpRequiredForLevel(progress.level);
    const space = need - progress.xp;
    if (remaining < space) {
      progress.xp += remaining;
      remaining = 0;
      break;
    }
    remaining -= space;
    progress.level += 1;
    progress.xp = 0;
  }

  const abilityUnlocked =
    crossedAbility && progress.level >= ROD_MASTERY_ABILITY_LEVEL;

  return {
    rodId,
    xpGained,
    fromLevel,
    fromXp,
    toLevel: progress.level,
    toXp: progress.xp,
    levelsGained: progress.level - fromLevel,
    abilityUnlocked,
    maxed: progress.level >= ROD_MASTERY_MAX_LEVEL,
  };
}

export function normalizeRodMasteryMap(
  raw: unknown
): Record<string, RodMasteryProgress> {
  const out: Record<string, RodMasteryProgress> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!ITEMS[key as ItemId]?.isRod) continue;
    out[key] = clampRodMastery(
      val && typeof val === "object"
        ? (val as Partial<RodMasteryProgress>)
        : undefined
    );
  }
  return out;
}

/** Rings / arc colors by mastery band. */
export function rodMasteryAccent(level: number): {
  ring: number;
  fill: number;
  glow: number;
  label: string;
} {
  if (level >= ROD_MASTERY_MAX_LEVEL)
    return { ring: 0xffd76a, fill: 0xffe9a8, glow: 0xfff3c8, label: "#ffe9a8" };
  if (level >= ROD_MASTERY_ABILITY_LEVEL)
    return { ring: 0xc9a0ff, fill: 0xb47cff, glow: 0xe0c4ff, label: "#e8d4ff" };
  if (level >= 10)
    return { ring: 0x7ec8ff, fill: 0x4aa8e8, glow: 0xa8dcff, label: "#c8e8ff" };
  if (level >= 5)
    return { ring: 0x7dff9a, fill: 0x4ecf70, glow: 0xb8ffc8, label: "#c8ffd4" };
  return { ring: 0xc4a86a, fill: 0xe8c878, glow: 0xffe6a8, label: "#f0e6d2" };
}
