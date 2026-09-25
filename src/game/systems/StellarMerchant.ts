import type { FishMutationId, ItemId } from "../data/items";
import { mutationSellMult } from "../data/items";
import type { RodSkinId } from "../data/rodSkins";

/** Mutations the Stellar Merchant will buy. */
export const STELLAR_MERCHANT_MUTATIONS = new Set<FishMutationId>([
  "starstruck",
  "event_horizon",
  "lunar",
  "moonlight",
]);

/** Pays this many times the normal merchant sell value (non-Starstruck). */
export const STELLAR_MERCHANT_PRICE_MULT = 2;

/** Starstruck sells at 2× here instead of the usual 0.9× shore mult. */
export const STELLAR_MERCHANT_STARSTRUCK_MULT = 2;

export type StellarShopSkinOffer = {
  kind: "skin";
  skinId: RodSkinId;
  price: number;
  label: string;
  blurb: string;
};

export type StellarShopRodOffer = {
  kind: "rod";
  rodId: ItemId;
  price: number;
  label: string;
  blurb: string;
  /** Consumed from bag/hotbar on purchase (e.g. painite). */
  requiresItem?: ItemId;
};

export type StellarShopOffer = StellarShopSkinOffer | StellarShopRodOffer;

/** Cosmic goods sold at the Stellar Merchant shop. */
export const STELLAR_SHOP_OFFERS: readonly StellarShopOffer[] = [
  {
    kind: "skin",
    skinId: "horizonbreaker",
    price: 75000,
    label: "Horizonbreaker",
    blurb: "Tranquil Rod — scattered stars & a black-hole tip",
  },
];

/** @deprecated use STELLAR_SHOP_OFFERS */
export const STELLAR_SHOP_SKINS: readonly StellarShopSkinOffer[] =
  STELLAR_SHOP_OFFERS.filter((o): o is StellarShopSkinOffer => o.kind === "skin");

export function isStellarMerchantMutation(
  mutation?: FishMutationId | null
): boolean {
  return !!mutation && STELLAR_MERCHANT_MUTATIONS.has(mutation);
}

/**
 * Mutation × premium multiplier used by the Stellar Merchant.
 * Starstruck: flat 2× (replaces shore 0.9×). Others: shore mut × 2.
 */
export function stellarMerchantMutationMult(
  mutation?: FishMutationId | null
): number {
  if (mutation === "starstruck") return STELLAR_MERCHANT_STARSTRUCK_MULT;
  return mutationSellMult(mutation) * STELLAR_MERCHANT_PRICE_MULT;
}
