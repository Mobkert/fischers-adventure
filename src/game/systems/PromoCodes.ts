import type { InventorySystem } from "./InventorySystem";

export type PromoCodeId =
  | "birthday_rod"
  | "free_coins_10k"
  | "free_fish_gift_3"
  | "sorry_for_bugs"
  | "free_skin_crates"
  | "ore_area_awesome"
  | "new_stuff"
  | "serpent_eels"
  | "free_stellar_surfer"
  | "w_update"
  | "finally_cave_whale"
  | "admin_code"
  | "starry_night"
  | "dusty"
  | "oasis";

export type PromoRedeemResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const CODE_MAP: Record<string, PromoCodeId> = {
  "BirthdayRodIsSoCool!$777": "birthday_rod",
  FreeBirthdayGift1: "free_coins_10k",
  FreeBirthdayGift2: "free_fish_gift_3",
  SORRYFORBUGS: "sorry_for_bugs",
  FREESKINCRATES: "free_skin_crates",
  OREAREAWESOME: "ore_area_awesome",
  NEWSTUFF: "new_stuff",
  SERPENTEELS: "serpent_eels",
  W_UPDATE: "w_update",
  FINALYCAVEWHALE: "finally_cave_whale",
  DUSTY: "dusty",
  OASIS: "oasis",
  // Secret — not listed in update log
  ADMINCODE: "admin_code",
  // Secret — Paint Brush rod
  ".STARRYNIGHT.": "starry_night",
  // Secret — not listed in update log / Code Guy hints
  ")(freestellarsurfer!!!)(": "free_stellar_surfer",
};

/** Codes that can no longer be redeemed. */
const EXPIRED_PROMO_CODES = new Set<PromoCodeId>([
  "birthday_rod",
  "free_coins_10k",
  "free_fish_gift_3",
  "sorry_for_bugs",
  "free_skin_crates",
  "new_stuff",
  "ore_area_awesome",
  "admin_code",
  "w_update",
  "serpent_eels",
]);

export function normalizePromoCodeInput(raw: string): string {
  return raw.trim();
}

export function promoCodeIdForInput(input: string): PromoCodeId | null {
  return CODE_MAP[normalizePromoCodeInput(input)] ?? null;
}

export function hasRedeemedPromo(
  inventory: InventorySystem,
  codeId: PromoCodeId
): boolean {
  return inventory.redeemedPromoCodes.includes(codeId);
}

export function redeemPromoCode(
  inventory: InventorySystem,
  input: string
): PromoRedeemResult {
  const codeId = promoCodeIdForInput(input);
  if (!codeId) {
    return { ok: false, message: "That code isn't on his list." };
  }
  if (EXPIRED_PROMO_CODES.has(codeId)) {
    return {
      ok: false,
      message: "That code has expired. Sorry!",
    };
  }
  if (hasRedeemedPromo(inventory, codeId)) {
    return { ok: false, message: "You already redeemed that code." };
  }

  switch (codeId) {
    case "sorry_for_bugs": {
      // Expired — kept for type exhaustiveness; EXPIRED_PROMO_CODES blocks first.
      return { ok: false, message: "That code has expired. Sorry!" };
    }
    case "new_stuff": {
      if (
        !inventory.hasItem("frostpeak_crate") &&
        inventory.countEmptyBagSlots() < 1
      ) {
        return {
          ok: false,
          message: "Need 1 free bag slot for Frostpeak Crates.",
        };
      }
      if (!inventory.addItem("frostpeak_crate", 4)) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.coins += 10000;
      inventory.grantAmulet("amulet_tempest");
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy hands you $10,000, 4 Frostpeak Crates, and a Tempest Amulet!",
      };
    }
    case "free_skin_crates": {
      if (!inventory.hasItem("skin_crate") && inventory.countEmptyBagSlots() < 1) {
        return { ok: false, message: "Need 1 free bag slot for Skin Crates." };
      }
      if (!inventory.addItem("skin_crate", 3)) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.coins += 5000;
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: "Code Guy hands you $5,000 and 3 Skin Crates!",
      };
    }
    case "ore_area_awesome": {
      if (
        !inventory.hasItem("ore_cluster") &&
        inventory.countEmptyBagSlots() < 1
      ) {
        return { ok: false, message: "Need 1 free bag slot for Ore Clusters." };
      }
      if (!inventory.addItem("ore_cluster", 10)) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.coins += 2200;
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: "Code Guy hands you $2,200 and 10 Ore Clusters!",
      };
    }
    case "serpent_eels": {
      // Expired — kept for type exhaustiveness; EXPIRED_PROMO_CODES blocks first.
      return { ok: false, message: "That code has expired. Sorry!" };
    }
    case "free_stellar_surfer": {
      const result = inventory.grantAscendedStellarSurfer();
      if (!result.ok) return result;
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: "Code Guy slips you the ascended Stellar Surfer. Keep it quiet.",
      };
    }
    case "w_update": {
      // Expired — kept for type exhaustiveness; EXPIRED_PROMO_CODES blocks first.
      return { ok: false, message: "That code has expired. Sorry!" };
    }
    case "finally_cave_whale": {
      inventory.grantAmulet("amulet_cave");
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy slips you a Cave Amulet — ADMIN rarity. Use it to summon a cave whale.",
      };
    }
    case "dusty": {
      if (
        !inventory.hasItem("skin_crate") &&
        inventory.countEmptyBagSlots() < 1
      ) {
        return {
          ok: false,
          message: "Need 1 free bag slot for a Skin Crate.",
        };
      }
      if (!inventory.addItem("skin_crate", 1)) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.grantAmulet("amulet_dusky");
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: "Code Guy hands you a Dusky Amulet and a Skin Crate!",
      };
    }
    case "oasis": {
      if (
        !inventory.hasItem("frostpeak_crate") &&
        inventory.countEmptyBagSlots() < 1
      ) {
        return {
          ok: false,
          message: "Need 1 free bag slot for a Frostpeak Crate.",
        };
      }
      if (!inventory.addItem("frostpeak_crate", 1)) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.grantAmulet("amulet_sunlit");
      inventory.grantAmulet("amulet_cave");
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy hands you a Sunlit Amulet, a Frostpeak Crate, and a Cave Amulet!",
      };
    }
    case "starry_night": {
      if (inventory.ownsRod("paint_brush_rod")) {
        inventory.markPromoRedeemed(codeId);
        return {
          ok: true,
          message:
            "You already hold Paint Brush (Starry Night) — code marked used.",
        };
      }
      if (!inventory.addItem("paint_brush_rod")) {
        return {
          ok: false,
          message: "Couldn't grant Paint Brush (Starry Night).",
        };
      }
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy hands you Paint Brush (Starry Night) — Starry Night catches await.",
      };
    }
    case "admin_code": {
      // Expired — kept for type exhaustiveness; EXPIRED_PROMO_CODES blocks first.
      return { ok: false, message: "That code has expired. Sorry!" };
    }
    default:
      return { ok: false, message: "That code fizzled out." };
  }
}
