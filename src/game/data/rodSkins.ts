import { ItemId } from "./items";
import type { RodDrawStyle } from "../entities/PlayerArt";

/** Cosmetic rod skins (crate + gallery). */
export type RodSkinId =
  | "gallery"
  | "golden_lucky"
  | "universal_portal"
  | "pufferfirm"
  | "poisoned"
  | "pistol"
  | "laser"
  | "frigid"
  | "frozen_lotus"
  | "icicle"
  | "halo_of_ice"
  | "hyperboreal"
  | "hyperthermic";

export type SkinCrateKind = "collectors" | "frostpeak";

export type RodSkinLayout = {
  originX: number;
  originY: number;
  displayW: number;
  displayH: number;
  tipFracX: number;
  tipFracY: number;
  textureAngleDeg: number;
};

export type RodSkinDef = {
  id: RodSkinId;
  rodId: ItemId;
  label: string;
  description: string;
  textureKey: string;
  /** Weight in its crate pool (0 = not in any crate). */
  crateWeight: number;
  /** Which crate sells this skin. */
  cratePool: SkinCrateKind | null;
  layout: RodSkinLayout;
  /**
   * Gallery-only: floating overlay sprite (knuckle-blaster).
   * Crate skins use baked `drawStyle` like normal rods.
   */
  overlay: boolean;
  /** Baked player rod style (crate skins). */
  drawStyle?: RodDrawStyle;
};

/** Gallery knuckle-blaster overlay layout. */
const GALLERY_LAYOUT: RodSkinLayout = {
  originX: 0.18,
  originY: 0.55,
  displayW: 62,
  displayH: 38,
  tipFracX: 0.9,
  tipFracY: 0.5,
  textureAngleDeg: 0,
};

/** Unused for baked skins — kept for type completeness / UI sizing hints. */
const ROD_ICON_LAYOUT: RodSkinLayout = {
  originX: 0.22,
  originY: 0.72,
  displayW: 48,
  displayH: 48,
  tipFracX: 0.78,
  tipFracY: 0.2,
  textureAngleDeg: -46,
};

export const ROD_SKINS: Record<RodSkinId, RodSkinDef> = {
  gallery: {
    id: "gallery",
    rodId: "crystal_rod",
    label: "Gallery",
    description: "Crystal gallery finish.",
    textureKey: "crystal_rod_skin",
    crateWeight: 0,
    cratePool: null,
    layout: { ...GALLERY_LAYOUT },
    overlay: true,
  },
  golden_lucky: {
    id: "golden_lucky",
    rodId: "lucky_rod",
    label: "Golden Lucky",
    description: "Gilded Lucky Rod with a touch of green.",
    textureKey: "skin_golden_lucky",
    crateWeight: 39,
    cratePool: "collectors",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "golden_lucky",
  },
  universal_portal: {
    id: "universal_portal",
    rodId: "portal_rod",
    label: "Universal Portal",
    description: "Cosmic universe finish — blue, orange & pink.",
    textureKey: "skin_universal_portal",
    crateWeight: 25,
    cratePool: "collectors",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "universal_portal",
  },
  pufferfirm: {
    id: "pufferfirm",
    rodId: "firm_rod",
    label: "Pufferfirm",
    description: "A stretched pufferfish for the Firm Rod.",
    textureKey: "pufferfish",
    crateWeight: 15,
    cratePool: "collectors",
    layout: {
      originX: 0.12,
      originY: 0.5,
      displayW: 78,
      displayH: 30,
      tipFracX: 0.92,
      tipFracY: 0.42,
      textureAngleDeg: 0,
    },
    overlay: true,
  },
  poisoned: {
    id: "poisoned",
    rodId: "crystal_rod",
    label: "Poisoned",
    description: "Toxic crystal finish with green gloop bursts.",
    textureKey: "skin_poisoned",
    crateWeight: 10,
    cratePool: "collectors",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "poisoned",
  },
  pistol: {
    id: "pistol",
    rodId: "recoil_rod",
    label: "Pistol",
    description: "Compact detailed pistol — grey Recoil blasts.",
    textureKey: "skin_pistol",
    crateWeight: 7,
    cratePool: "collectors",
    layout: { ...ROD_ICON_LAYOUT, displayW: 42, displayH: 42 },
    overlay: false,
    drawStyle: "pistol",
  },
  laser: {
    id: "laser",
    rodId: "zeus_rod",
    label: "Laser",
    description: "Pink-purple laser Zeus with beam strikes.",
    textureKey: "skin_laser",
    crateWeight: 3,
    cratePool: "collectors",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "laser",
  },
  frigid: {
    id: "frigid",
    rodId: "amber_rod",
    label: "Frigid",
    description: "Amber Rod sheathed in ice crystals and hanging icicles.",
    textureKey: "skin_frigid",
    crateWeight: 39,
    cratePool: "frostpeak",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "frigid",
  },
  icicle: {
    id: "icicle",
    rodId: "augment_rod",
    label: "Icicle",
    description: "A razor spiky icicle for the Augment Rod.",
    textureKey: "skin_icicle",
    crateWeight: 25,
    cratePool: "frostpeak",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "icicle",
  },
  frozen_lotus: {
    id: "frozen_lotus",
    rodId: "wildflower_rod",
    label: "Frozen Lotus",
    description: "Wildflower bloomed into a frost lotus — catch UI is a white lotus.",
    textureKey: "skin_frozen_lotus",
    crateWeight: 15,
    cratePool: "frostpeak",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "frozen_lotus",
  },
  halo_of_ice: {
    id: "halo_of_ice",
    rodId: "coral_rod",
    label: "Halo of Ice",
    description: "A ring of ice with swirling frost at its heart.",
    textureKey: "skin_halo_of_ice",
    crateWeight: 10,
    cratePool: "frostpeak",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "halo_of_ice",
  },
  hyperboreal: {
    id: "hyperboreal",
    rodId: "starweaver_rod",
    label: "Hyperboreal",
    description:
      "Starweaver clad in polar ice — ice-spike volleys and a frozen lock.",
    textureKey: "skin_hyperboreal",
    crateWeight: 7,
    cratePool: "frostpeak",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "hyperboreal",
  },
  hyperthermic: {
    id: "hyperthermic",
    rodId: "forge_rod",
    label: "Hyperthermic",
    description:
      "Forge Rod flash-frozen — icicle swords and ice-spike axes in the catch.",
    textureKey: "skin_hyperthermic",
    crateWeight: 3,
    cratePool: "frostpeak",
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "hyperthermic",
  },
};

export const SKIN_CRATE_PRICE = 15000;
export const SKIN_CRATE_DUPLICATE_REFUND = 7500;
export const FROSTPEAK_CRATE_PRICE = 20000;
export const FROSTPEAK_CRATE_DUPLICATE_REFUND = 10000;

export const CRATE_SKIN_IDS: RodSkinId[] = (
  Object.keys(ROD_SKINS) as RodSkinId[]
).filter((id) => ROD_SKINS[id].cratePool === "collectors");

export const FROSTPEAK_CRATE_SKIN_IDS: RodSkinId[] = (
  Object.keys(ROD_SKINS) as RodSkinId[]
).filter((id) => ROD_SKINS[id].cratePool === "frostpeak");

export function skinsForRod(rodId: ItemId): RodSkinDef[] {
  return (Object.values(ROD_SKINS) as RodSkinDef[]).filter(
    (s) => s.rodId === rodId
  );
}

function rollFromPool(ids: RodSkinId[]): RodSkinId {
  const entries = ids.map((id) => ({
    id,
    w: ROD_SKINS[id].crateWeight,
  }));
  const total = entries.reduce((n, e) => n + e.w, 0);
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.w;
    if (r <= 0) return e.id;
  }
  return entries[entries.length - 1]!.id;
}

export function rollSkinCrate(): RodSkinId {
  return rollFromPool(CRATE_SKIN_IDS);
}

export function rollFrostpeakSkinCrate(): RodSkinId {
  return rollFromPool(FROSTPEAK_CRATE_SKIN_IDS);
}

export function rollCrateSkin(kind: SkinCrateKind): RodSkinId {
  return kind === "frostpeak" ? rollFrostpeakSkinCrate() : rollSkinCrate();
}

export function crateSkinIds(kind: SkinCrateKind): RodSkinId[] {
  return kind === "frostpeak" ? FROSTPEAK_CRATE_SKIN_IDS : CRATE_SKIN_IDS;
}

export function crateDuplicateRefund(kind: SkinCrateKind): number {
  return kind === "frostpeak"
    ? FROSTPEAK_CRATE_DUPLICATE_REFUND
    : SKIN_CRATE_DUPLICATE_REFUND;
}

export function crateItemId(kind: SkinCrateKind): ItemId {
  return kind === "frostpeak" ? "frostpeak_crate" : "skin_crate";
}

/** Display % for crate odds UI (weights are authored to sum to 100). */
export function skinCrateOddsPercent(
  id: RodSkinId,
  kind: SkinCrateKind = "collectors"
): number {
  const ids = crateSkinIds(kind);
  const total = ids.reduce((n, sid) => n + ROD_SKINS[sid].crateWeight, 0);
  if (total <= 0) return 0;
  return Math.round((ROD_SKINS[id].crateWeight / total) * 100);
}

export function isRodSkinId(id: string): id is RodSkinId {
  return id in ROD_SKINS;
}

export function skinCrateKindForItem(itemId: string): SkinCrateKind | null {
  if (itemId === "frostpeak_crate") return "frostpeak";
  if (itemId === "skin_crate") return "collectors";
  return null;
}
