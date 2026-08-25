import { ITEMS, MUTATIONS } from "../data/items";
import type { InventorySystem } from "./InventorySystem";

export type PromoCodeId =
  | "birthday_rod"
  | "free_coins_10k"
  | "free_fish_gift_3"
  | "sorry_for_bugs"
  | "free_skin_crates";

export type PromoRedeemResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const CODE_MAP: Record<string, PromoCodeId> = {
  "BirthdayRodIsSoCool!$777": "birthday_rod",
  FreeBirthdayGift1: "free_coins_10k",
  FreeBirthdayGift2: "free_fish_gift_3",
  SORRYFORBUGS: "sorry_for_bugs",
  FREESKINCRATES: "free_skin_crates",
};

/** Birthday event codes — no longer redeemable. Owned Birthday Rods are kept. */
const EXPIRED_PROMO_CODES = new Set<PromoCodeId>([
  "birthday_rod",
  "free_coins_10k",
  "free_fish_gift_3",
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
      message: "That birthday code has expired. Sorry!",
    };
  }
  if (hasRedeemedPromo(inventory, codeId)) {
    return { ok: false, message: "You already redeemed that code." };
  }

  switch (codeId) {
    case "sorry_for_bugs": {
      // Need room for the tuna (+ optional ocean anvil shard).
      const giveAnvil =
        inventory.ashencastQuestStage <= 1 &&
        !inventory.hasItem("anvil_piece_ocean");
      const slotsNeeded = 1 + (giveAnvil ? 1 : 0);
      if (inventory.countEmptyBagSlots() < slotsNeeded) {
        return {
          ok: false,
          message: `Need ${slotsNeeded} free bag slot${slotsNeeded > 1 ? "s" : ""} for this code.`,
        };
      }
      if (!inventory.addItem("crystalfin_tuna", 1, "starlight")) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.coins += 10000;
      inventory.grantAmulet("amulet_celestial");
      const parts = [
        "$10,000",
        `a ${MUTATIONS.starlight.label}${ITEMS.crystalfin_tuna.name}`,
        ITEMS.amulet_celestial.name,
      ];
      if (giveAnvil) {
        inventory.addItem("anvil_piece_ocean");
        parts.push(ITEMS.anvil_piece_ocean.name);
      }
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: `Sorry about the bugs! Code Guy gives you ${parts.join(", ")}.`,
      };
    }
    case "free_skin_crates": {
      // Stack onto an existing crate stack, or need 1 empty slot
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
    default:
      return { ok: false, message: "That code fizzled out." };
  }
}
