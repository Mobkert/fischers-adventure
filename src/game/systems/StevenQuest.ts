import { ItemId } from "../data/items";

/** Steven quest stages: 0 = not started … 7 = fossil rod claimed. */
export type StevenQuestStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const STEVEN_DECAYED_NAUTILUS_GOAL = 3;
/** Quest 6: pay Steven this much for the Fossil Rod. */
export const STEVEN_FOSSIL_ROD_PRICE = 79999;

export function normalizeStevenQuestStage(raw: unknown): StevenQuestStage {
  const n = Math.floor(Number(raw));
  if (n >= 7) return 7;
  if (n >= 6) return 6;
  if (n >= 5) return 5;
  if (n >= 4) return 4;
  if (n >= 3) return 3;
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

export function stevenQuestTitle(stage: StevenQuestStage): string {
  switch (stage) {
    case 1:
      return "Steven — Quest 1";
    case 2:
      return "Steven — Quest 2";
    case 3:
      return "Steven — Quest 3";
    case 4:
      return "Steven — Quest 4";
    case 5:
      return "Steven — Quest 5";
    case 6:
      return "Steven — Quest 6";
    default:
      return "Steven";
  }
}

export type StevenQuestReward = {
  toast: string;
  grantAmulets?: { id: ItemId; count: number }[];
  grantRod?: ItemId;
  unlockPaintBombRecipe?: boolean;
};
