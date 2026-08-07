import { FishMutationId, MUTATIONS } from "../data/items";

/** Shared accept / reject / counter rules for Collector's Island haggling. */

export type BargainKind = "fish_buy" | "curio_sell";

export type BargainOutcome =
  | { type: "accept"; price: number }
  | { type: "reject"; message: string }
  | { type: "counter"; price: number; message: string };

/**
 * Extra haggling room the fish buyer allows for mutated fish.
 * Rarer / higher sell-mult mutations → larger bonus (0–~0.28).
 */
export function mutationBargainBonus(
  mutation?: FishMutationId | null
): number {
  if (!mutation) return 0;
  const m = MUTATIONS[mutation];
  if (!m) return 0;

  // Value of the mutation itself
  let bonus = (m.sellMult - 1) * 0.035;

  // World-drop rarity (lower chance → more generous)
  if (m.chance != null) {
    if (m.chance <= 0.003) bonus += 0.08;
    else if (m.chance <= 0.01) bonus += 0.05;
    else if (m.chance <= 0.02) bonus += 0.03;
    else bonus += 0.015;
  } else {
    // Rod-only (Bloom / Amber / Thunder / Sprout)
    if (m.sellMult >= 6) bonus += 0.05;
    else if (m.sellMult >= 5) bonus += 0.04;
    else if (m.sellMult >= 3) bonus += 0.03;
    else bonus += 0.02;
  }

  return Math.min(0.28, bonus);
}

/**
 * Fish buyer: player names a sell price (wants high).
 * Curio seller: player names a buy price (wants low).
 * Optional mutation makes the fish buyer accept / counter higher.
 */
export function resolveBargainOffer(
  kind: BargainKind,
  fair: number,
  offer: number,
  mutation?: FishMutationId | null
): BargainOutcome {
  const f = Math.max(1, Math.round(fair));
  const p = Math.max(0, Math.round(offer));

  if (kind === "fish_buy") {
    const g = mutationBargainBonus(mutation);
    const acceptMax = f * (1.05 + g);
    const rejectMin = f * (1.35 + g * 0.75);

    if (p <= acceptMax) {
      return { type: "accept", price: p };
    }
    if (p > rejectMin) {
      return { type: "reject", message: "Too rich for my blood." };
    }
    // Counters bias upward with rarer mutations (less stingy than 0.95× fair)
    const lo = 0.95 + g * 0.45;
    const hi = 1.15 + g * 0.55;
    const counter = Math.round(f * (lo + Math.random() * (hi - lo)));
    return {
      type: "counter",
      price: counter,
      message: `I'll go as high as $${counter}.`,
    };
  }

  // curio_sell — player is buying
  if (p >= f * 0.95) {
    return { type: "accept", price: p };
  }
  if (p < f * 0.65) {
    return { type: "reject", message: "That's an insult." };
  }
  const counter = Math.round(f * (0.9 + Math.random() * 0.15));
  return {
    type: "counter",
    price: counter,
    message: `Make it $${counter} and we have a deal.`,
  };
}
