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
  | "starry_night";

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
  // Secret — expire later; not listed in update log
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
  "admin_code",
  "ore_area_awesome",
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
          "Code Guy hands you 15 Serpent Lure, 20 Bait Crates, and a Blasted Serpent Eel (Worthless — $0 sell)!",
      };
    }
    case "free_stellar_surfer": {
      if (inventory.ownsRod("test_rod") && inventory.isStellarSurferAscended()) {
        inventory.markPromoRedeemed(codeId);
        return {
          ok: true,
          message: "You already ride the stars — code marked used.",
        };
      }
      if (!inventory.ownsRod("test_rod") && !inventory.addItem("test_rod")) {
        return { ok: false, message: "Couldn't grant the Stellar Surfer." };
      }
      inventory.stellarSurferAscended = true;
      inventory.astralSurferQuestStage = 8;
      inventory.astralStarlineDone = true;
      if (!inventory.ownsBoat("stellar_surfer")) {
        inventory.ownedBoats.push("stellar_surfer");
      }
      inventory.equipRod("test_rod");
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: "Code Guy slips you the ascended Stellar Surfer. Keep it quiet.",
      };
    }
    case "w_update": {
      if (
        !inventory.hasItem("austinite") &&
        inventory.countEmptyBagSlots() < 1
      ) {
        return {
          ok: false,
          message: "Need 1 free bag slot for Austinite.",
        };
      }
      if (!inventory.addItem("austinite", 1)) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.coins += 10000;
      inventory.grantAmulet("amulet_moonlight");
      inventory.grantAmulet("amulet_celestial");
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy hands you $10,000, a Moonlight Amulet, a Celestial Amulet, and 1 Austinite!",
      };
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
    case "starry_night": {
      if (inventory.ownsRod("paint_brush_rod")) {
        inventory.markPromoRedeemed(codeId);
        return {
          ok: true,
          message: "You already hold the Paint Brush — code marked used.",
        };
      }
      if (!inventory.addItem("paint_brush_rod")) {
        return { ok: false, message: "Couldn't grant the Paint Brush." };
      }
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy hands you a Paint Brush — Starry Night catches await.",
      };
    }
    case "admin_code": {
      if (inventory.hasItem("admin_device")) {
        inventory.markPromoRedeemed(codeId);
        return {
          ok: true,
          message: "You already carry the Admin Device — code marked used.",
        };
      }
      if (inventory.countEmptyBagSlots() < 1) {
        return { ok: false, message: "Need 1 free bag slot for the Admin Device." };
      }
      if (!inventory.addItem("admin_device")) {
        return { ok: false, message: "Couldn't grant the Admin Device." };
      }
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message:
          "Code Guy presses a sealed tablet into your hands. Left-click it anytime.",
      };
    }
    default:
      return { ok: false, message: "That code fizzled out." };
  }
}
