import {
  FishMutationId,
  BobberCraftIngredient,
  ITEMS,
  MUTATIONS,
} from "../data/items";

/** Stellar Surfer quest: 0 not started … 7 active objective … 8 complete. */
export type AstralSurferQuestStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const ASTRAL_SURFER_CATCH_GOAL = 77;

/** Starline turn-in recipe. */
export const ASTRAL_STARLINE_COST: BobberCraftIngredient[] = [
  {
    itemId: "angelfish",
    count: 2,
    anyFish: true,
    minRarity: "uncommon",
    mutation: "starlight",
  },
  { itemId: "driftwood", count: 5, mutation: "electric" },
  { itemId: "austinite", count: 1 },
];

/** Stage 3 turn-in — lunar set → DEFINED Stellar Surfer. */
export const ASTRAL_SURFER_STAGE3_COST: BobberCraftIngredient[] = [
  { itemId: "nautilus", count: 1, mutation: "lunar" },
  { itemId: "nurse_shark", count: 1, mutation: "lunar" },
  { itemId: "bluefin_tuna", count: 1, mutation: "lunar" },
  { itemId: "molter", count: 1, mutation: "lunar" },
  { itemId: "swamp_frog", count: 1, mutation: "lunar" },
];

/** Stage 4 — return an eel with Ashencast mutation (phantom_eel). */
export const ASTRAL_SURFER_STAGE4_COST: BobberCraftIngredient[] = [
  { itemId: "phantom_eel", count: 1, mutation: "ashencast" },
];

/** Stage 7 — full ascension set. */
export const ASTRAL_SURFER_STAGE7_COST: BobberCraftIngredient[] = [
  { itemId: "sunfish", count: 1, mutation: "lunar" },
  { itemId: "dolphin", count: 1, mutation: "lunar" },
  { itemId: "magma_jellyfish", count: 1, mutation: "lunar" },
  { itemId: "alligator", count: 1, mutation: "lunar" },
  { itemId: "driftwood", count: 20, mutation: "lunar" },
];

/** Player-facing name for a quest ingredient (e.g. "Ashencast eel"). */
export function questIngredientDisplayName(ing: BobberCraftIngredient): string {
  const mutName = ing.mutation
    ? MUTATIONS[ing.mutation]?.name ?? ing.mutation
    : "";
  if (ing.anyFish) {
    const rarity =
      ing.minRarity === "uncommon"
        ? " (Uncommon+)"
        : ing.minRarity
          ? ` (${ing.minRarity}+)`
          : "";
    return mutName ? `${mutName} fish${rarity}` : `Any fish${rarity}`;
  }
  if (ing.itemId === "phantom_eel") {
    return mutName ? `${mutName} eel` : "Eel";
  }
  if (ing.itemId === "swamp_frog") {
    return mutName ? `${mutName} Frog` : "Frog";
  }
  const base = ITEMS[ing.itemId]?.name ?? String(ing.itemId);
  return mutName ? `${mutName} ${base}` : base;
}

type IngredientCounter = {
  countIngredientMatching: (ing: BobberCraftIngredient) => number;
};

/** Checkbox progress lines for a turn-in recipe. */
export function formatQuestIngredientChecklist(
  inv: IngredientCounter,
  costs: BobberCraftIngredient[]
): string {
  return costs
    .map((ing) => {
      const have = Math.min(inv.countIngredientMatching(ing), ing.count);
      const mark = have >= ing.count ? "☑" : "☐";
      return `${mark}  ${have}/${ing.count}  ${questIngredientDisplayName(ing)}`;
    })
    .join("\n");
}

export function astralCostsForStage(
  stage: AstralSurferQuestStage
): BobberCraftIngredient[] | null {
  if (stage === 3) return ASTRAL_SURFER_STAGE3_COST;
  if (stage === 4) return ASTRAL_SURFER_STAGE4_COST;
  if (stage === 7) return ASTRAL_SURFER_STAGE7_COST;
  return null;
}

export function astralSurferStageLabel(stage: AstralSurferQuestStage): string {
  switch (stage) {
    case 1:
      return "Catch any Starlight fish";
    case 2:
      return "Catch a Dolphin with Star Line";
    case 3:
      return "Bring 5 Lunar fish to the Warden";
    case 4:
      return "Return an Ashencast eel";
    case 5:
      return `Catch ${ASTRAL_SURFER_CATCH_GOAL} fish with Defined Surfer`;
    case 6:
      return "Catch a Dolphin with Stellar Surfer";
    case 7:
      return "Bring the Lunar tribute for ascension";
    case 8:
      return "Stellar Surfer ascended";
    default:
      return "Not started";
  }
}

/** Quest-tracker / wait-speech body for the active Surfer stage. */
export function astralSurferObjectiveList(
  inv: IngredientCounter & {
    astralSurferStarlightCaught: boolean;
    astralSurferDolphinStarline: boolean;
    astralSurferCatchCount: number;
    astralSurferDolphinSurfer: boolean;
  },
  stage: AstralSurferQuestStage
): string {
  const costs = astralCostsForStage(stage);
  if (costs) {
    const lines = formatQuestIngredientChecklist(inv, costs);
    const ready = costs.every(
      (ing) => inv.countIngredientMatching(ing) >= ing.count
    );
    return ready
      ? `${lines}\nAll ready — return to the Warden`
      : `${lines}\nReturn to the Astral Warden`;
  }
  if (stage === 1) {
    const ok = inv.astralSurferStarlightCaught;
    return (
      `${ok ? "☑" : "☐"}  Catch any Starlight fish` +
      (ok ? "\nReturn to the Warden" : "")
    );
  }
  if (stage === 2) {
    const ok = inv.astralSurferDolphinStarline;
    return (
      `${ok ? "☑" : "☐"}  Catch a Dolphin with Star Line` +
      (ok ? "\nReturn to the Warden" : "")
    );
  }
  if (stage === 5) {
    const n = Math.min(inv.astralSurferCatchCount, ASTRAL_SURFER_CATCH_GOAL);
    const ok = n >= ASTRAL_SURFER_CATCH_GOAL;
    return (
      `${ok ? "☑" : "☐"}  Surfer catches ${n}/${ASTRAL_SURFER_CATCH_GOAL}` +
      (ok ? "\nReturn to the Warden" : "")
    );
  }
  if (stage === 6) {
    const ok = inv.astralSurferDolphinSurfer;
    return (
      `${ok ? "☑" : "☐"}  Catch a Dolphin with Stellar Surfer` +
      (ok ? "\nReturn to the Warden" : "")
    );
  }
  return astralSurferStageLabel(stage);
}

/** Flavor lines — galactic / lunar themed. */
export const ASTRAL_WARDEN_LINES = {
  greet: [
    "Traveler of tides… the Stellar Sky listens.",
    "Lunar light bends around you. Speak your wish.",
    "I am the Astral Warden — keeper of star-forged blanks.",
  ],
  needStarlineFirst:
    "The Stellar Surfer answers only those who already command the Star Line.\n" +
    "Weave starlight into a rod first — then return, and we speak of surfing galaxies.",
  starlineStart:
    "Star Line… a thread of living dark matter.\n\n" +
    "Bring me tribute from the void:\n" +
    "• 2 Starlight fish (Uncommon or rarer)\n" +
    "• 5 Electric Driftwood\n" +
    "• 1 Austinite\n\n" +
    "Then the Star Line shall be yours.",
  starlineNeedMore:
    "The cosmos still hungers.\n" +
    "I need 2 Uncommon+ Starlight fish,\n" +
    "5 Electric Driftwood, and 1 Austinite.",
  starlineDone:
    "Yes… the Star Line sings in your hands.\n" +
    "Seven stars will dance for you under night's dome.\n" +
    "May Lunar light crown your perfect casts.",
  alreadyHasStarline:
    "You already hold the Star Line.\n" +
    "Its oval of stars needs no second birth.",
  surferStart:
    "So. You seek the Stellar Surfer — the board that rides Event Horizons.\n\n" +
    "First prove you can touch Starlight itself.\n" +
    "Catch any Starlight fish. Starweaver's gift counts.\n" +
    "Mutation Bobber and Coral Rod may coax it from the deep.\n" +
    "Do not bring it — only catch it. The sky will know.",
  surferStage1Wait:
    "The void has not yet tasted your Starlight catch.\n" +
    "Cast until a Starlight mutation kisses your line.",
  surferStage1Done:
    "Starlight answers you. Worthy… for now.\n\n" +
    "Stage two: catch a Dolphin while the Star Line is in your hands.\n" +
    "Let the oval guide you through open water.",
  surferStage2Wait:
    "Still waiting for a Dolphin taken with Star Line.\n" +
    "The galactic tide rewards patience.",
  surferStage2Done:
    "A dolphin under star-thread… elegant.\n\n" +
    "Stage three: gather Lunar specimens and return.\n" +
    "Lunar Nautilus, Lunar Nurse Shark, Lunar Bluefin,\n" +
    "Lunar Molter, and a Lunar Frog.\n" +
    "Then I gift you a DEFINED Stellar Surfer —\n" +
    "half its might, stars to 0.3s, no boat, no mutations.",
  surferStage3Need:
    "Bring the Lunar five:\n" +
    "Nautilus · Nurse Shark · Bluefin · Molter · Frog\n" +
    "— each crowned with Lunar.",
  surferStage3Done:
    "Behold — a DEFINED Stellar Surfer.\n" +
    "Its rain of stars slows only to 0.3…\n" +
    "no Event Horizon, no galactic boat… yet.\n" +
    "Stats halved, save Control — your grip on the void.\n\n" +
    "Stage four: catch and return an eel with the Ashencast mutation.",
  surferStage4Need:
    "Return one Ashencast eel.\n" +
    "Crowned with Ashencast (5×).",
  surferStage4Done:
    "The eel's ash sings. Good.\n\n" +
    `Stage five: land ${ASTRAL_SURFER_CATCH_GOAL} fish while wielding the Surfer.\n` +
    "Defined or ascended — the board must drink the catch.",
  surferStage5Wait: (n: number) =>
    `Surfer catches: ${n}/${ASTRAL_SURFER_CATCH_GOAL}.\n` +
    "Keep riding the star-rain. Lunar currents favor the devoted.",
  surferStage5Done:
    `Seventy-seven catches under the Surfer. The galaxy nods.\n\n` +
    "Stage six: catch a Dolphin with the Stellar Surfer equipped.",
  surferStage6Wait:
    "A Dolphin on the Surfer still awaits.\n" +
    "Surf the open water until the stars agree.",
  surferStage6Done:
    "Dolphin and Surfer — a cosmic pair.\n\n" +
    "Final stage: bring Lunar Sunfish, Lunar Dolphin,\n" +
    "Lunar Magma Jellyfish, Lunar Alligator,\n" +
    "and 20 Lunar Driftwood.\n" +
    "Then the Surfer becomes UNDEFINED — boat, mutations, full star-rain.",
  surferStage7Need:
    "Ascension tribute:\n" +
    "Lunar Sunfish · Dolphin · Magma Jellyfish · Alligator\n" +
    "+ 20 Lunar Driftwood.",
  surferStage7Done:
    "UNDEFINED. Fully awakened.\n" +
    "Event Horizon blooms. Stars race to 0.01.\n" +
    "At any port, press Q — ride the Stellar Surfer itself.\n" +
    "You are worthy of the galactic night. Go.",
  surferComplete:
    "Your Surfer already rides the full Event Horizon.\n" +
    "There is nothing more I can forge for that blank.",
  farewell: "Then walk the void another night. The moon keeps time.",
};

export type AstralCatchFlags = {
  starlightCaught: boolean;
  dolphinStarline: boolean;
  surferCatches: number;
  dolphinSurfer: boolean;
};

export function isStarlightCatch(mutation: FishMutationId | null): boolean {
  return mutation === "starlight";
}
