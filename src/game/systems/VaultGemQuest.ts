/** Quest gems restored to the Gem Vault pedestals. */
export const VAULT_GEM_IDS = [
  "gem_red",
  "gem_green",
  "gem_blue",
  "gem_yellow",
  "gem_purple",
] as const;

export type VaultGemId = (typeof VAULT_GEM_IDS)[number];

export const VAULT_GEM_COLORS: Record<VaultGemId, number> = {
  gem_red: 0xff4466,
  gem_green: 0x44ffaa,
  gem_blue: 0x4488ff,
  gem_yellow: 0xffdd44,
  gem_purple: 0xdd88ff,
};

export const VAULT_GEM_NAMES: Record<VaultGemId, string> = {
  gem_red: "Ruby Gem",
  gem_green: "Emerald Gem",
  gem_blue: "Sapphire Gem",
  gem_yellow: "Topaz Gem",
  gem_purple: "Amethyst Gem",
};

/** Cave merchant lifetime sales needed for the green gem. */
export const VAULT_GREEN_SELL_THRESHOLD = 10_000;
/** Coins paid at the Sanctum altar for the blue gem. */
export const VAULT_BLUE_ALTAR_COST = 4_000;

/** Local vault land mid (matches CAVE_LANDS_LOCAL vault). */
export const VAULT_LAND_MID_LOCAL = (6380 + 7780) / 2;

/** Pedestal X offsets from vault mid (left → right: R G B Y P). */
export const VAULT_PEDESTAL_OFFSETS = [-160, -80, 0, 80, 160];

export function isVaultGemId(id: string | null | undefined): id is VaultGemId {
  return !!id && (VAULT_GEM_IDS as readonly string[]).includes(id);
}

export function normalizeVaultGemsPlaced(raw: unknown): VaultGemId[] {
  if (!Array.isArray(raw)) return [];
  const out: VaultGemId[] = [];
  for (const id of raw) {
    if (typeof id === "string" && isVaultGemId(id) && !out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}

export function vaultPedestalWorldX(
  caveOriginX: number,
  index: number
): number {
  return (
    caveOriginX + VAULT_LAND_MID_LOCAL + (VAULT_PEDESTAL_OFFSETS[index] ?? 0)
  );
}
