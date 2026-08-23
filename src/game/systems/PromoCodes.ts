import { ITEMS, MUTATIONS } from "../data/items";
import type { InventorySystem } from "./InventorySystem";

export type PromoCodeId =
  | "birthday_rod"
  | "free_coins_10k"
  | "free_fish_gift_3";

export type PromoRedeemResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const CODE_MAP: Record<string, PromoCodeId> = {
  "BirthdayRodIsSoCool!$777": "birthday_rod",
  FreeBirthdayGift1: "free_coins_10k",
  FreeBirthdayGift2: "free_fish_gift_3",
};

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
  if (hasRedeemedPromo(inventory, codeId)) {
    return { ok: false, message: "You already redeemed that code." };
  }

  switch (codeId) {
    case "birthday_rod": {
      if (inventory.ownsRod("birthday_rod")) {
        return { ok: false, message: "You already own the Birthday Rod." };
      }
      inventory.ownedRods.push("birthday_rod");
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: "Ho ho ho! The Birthday Rod is yours — check your Equipment Bag.",
      };
    }
    case "free_coins_10k": {
      inventory.coins += 10000;
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: "Code Guy slips you $10,000!",
      };
    }
    case "free_fish_gift_3": {
      if (!inventory.addItem("angelfish", 1, "sprout")) {
        return { ok: false, message: "Your bag is full!" };
      }
      inventory.markPromoRedeemed(codeId);
      return {
        ok: true,
        message: `Code Guy gives you a ${MUTATIONS.sprout.label}${ITEMS.angelfish.name}!`,
      };
    }
    default:
      return { ok: false, message: "That code fizzled out." };
  }
}
