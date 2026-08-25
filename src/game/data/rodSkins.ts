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
  | "laser";

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
  /** Weight in skin crate (0 = not in crate). */
  crateWeight: number;
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
    layout: {
      originX: 0.12,
      originY: 0.5,
      displayW: 78,
      displayH: 30,
      tipFracX: 0.92,
      tipFracY: 0.42,
      textureAngleDeg: 0,
    },
    // Use your pufferfish image as an in-hand overlay (like Gallery)
    overlay: true,
  },
  poisoned: {
    id: "poisoned",
    rodId: "crystal_rod",
    label: "Poisoned",
    description: "Toxic crystal finish with green gloop bursts.",
    textureKey: "skin_poisoned",
    crateWeight: 10,
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
    layout: { ...ROD_ICON_LAYOUT },
    overlay: false,
    drawStyle: "laser",
  },
};

export const SKIN_CRATE_PRICE = 15000;
export const SKIN_CRATE_DUPLICATE_REFUND = 7500;

export const CRATE_SKIN_IDS: RodSkinId[] = (
  Object.keys(ROD_SKINS) as RodSkinId[]
).filter((id) => ROD_SKINS[id].crateWeight > 0);

export function skinsForRod(rodId: ItemId): RodSkinDef[] {
  return (Object.values(ROD_SKINS) as RodSkinDef[]).filter(
    (s) => s.rodId === rodId
  );
}

export function rollSkinCrate(): RodSkinId {
  const entries = CRATE_SKIN_IDS.map((id) => ({
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

/** Display % for crate odds UI (weights are authored to sum to 100). */
export function skinCrateOddsPercent(id: RodSkinId): number {
  const total = CRATE_SKIN_IDS.reduce(
    (n, sid) => n + ROD_SKINS[sid].crateWeight,
    0
  );
  if (total <= 0) return 0;
  return Math.round((ROD_SKINS[id].crateWeight / total) * 100);
}

export function isRodSkinId(id: string): id is RodSkinId {
  return id in ROD_SKINS;
}
