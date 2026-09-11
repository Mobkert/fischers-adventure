import type { InventorySystem } from "./InventorySystem";

export type PromoCodeId =
  | "birthday_rod"
  | "free_coins_10k"
  | "free_fish_gift_3"
  | "sorry_for_bugs"
  | "free_skin_crates"
  | "ore_area_awesome"
  | "new_stuff"
  | "serpent_eels";

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
};

/** Codes that can no longer be redeemed. */
const EXPIRED_PROMO_CODES = new Set<PromoCodeId>([
  "birthday_rod",
  "free_coins_10k",
  "free_fish_gift_3",
  "sorry_for_bugs",
  "free_skin_crates",
  "new_stuff",
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
      const needCrateSlot = !inventory.hasItem("bait_crate");
      const hasUnsellableBlastedEel = [...inventory.bag, ...inventory.hotbar].some(
        (s) =>
          s.itemId === "serpent_eel" &&
          s.mutation === "blasted" &&
          s.size === "unsellable" &&
          s.count > 0
      );
      const slotsNeeded =
        (needCrateSlot ? 1 : 0) + (hasUnsellableBlastedEel ? 0 : 1);
      if (inventory.countEmptyBagSlots() < slotsNeeded) {
        return {
          ok: false,
          message: `Need ${slotsNeeded} free bag slot${slotsNeeded > 1 ? "s" : ""} for the reward.`,
        };
      }
      if (!inventory.addItem("bait_crate", 20)) {
        return { ok: false, message: "Your bag is full!" };
      }
      if (!inventory.addBait("bait_serpent_lure", 15)) {
        return { ok: false, message: "Couldn't add Serpent Lure bait." };
      }
      if (!inventory.addItem("serpent_eel", 1, "blasted", "unsellable")) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy hands you 15 Serpent Lure, 20 Bait Crates, and a Blasted Serpent Eel (Unsellable)!",
      };
    }
    default:
      return { ok: false, message: "That code fizzled out." };
  }
}
