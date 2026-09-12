import { BobberCraftIngredient } from "../data/items";
import { formatQuestIngredientChecklist } from "./AstralWardenQuest";

/** Turn-in for the Resonated (cosmic) Top Hat. */
export const RESONATED_HAT_COST: BobberCraftIngredient[] = [
  {
    itemId: "angelfish",
    count: 1,
    anyFish: true,
    mutation: "moonlight",
  },
  { itemId: "emerald", count: 5 },
  { itemId: "ruby", count: 3 },
  { itemId: "vivianite", count: 1 },
];

export const RESONATED_HAT_NPC_NAME = "Cosmic Haberdasher";

export const RESONATED_HAT_LINES = {
  greet:
    "Ah… a traveler of tides.\n" +
    "I stitch hats that hum with the full moon itself.\n\n" +
    "Bring me tribute, and I will craft you a Resonated Hat —\n" +
    "a cosmic top hat that lets you answer the moon's pull\n" +
    "into the Stellar Sky.",
  needMore:
    "The cosmos still wants more for the Resonance.\n" +
    "Check your list — Moonlight fish, gems, vivianite.",
  done:
    "Perfect. The band sings with Moonlight…\n\n" +
    "Wear the Resonated Hat. Hover the full moon,\n" +
    "or open your Tide Compass — only then will the\n" +
    "Stellar Sky open. Without it, the void stays sealed.",
  already:
    "You already wear the Resonance in your wardrobe.\n" +
    "Equip the hat when you wish to step among the stars.",
};

export function resonatedHatChecklist(inv: {
  countIngredientMatching: (ing: BobberCraftIngredient) => number;
}): string {
  return formatQuestIngredientChecklist(inv, RESONATED_HAT_COST);
}
