import { ItemId } from "../data/items";
import { ROD_MASTERY_GOLD_LEVEL } from "./RodMastery";

/** Den quest: 0 = locked/not started · 1 = catching · 2 = golf club claimed. */
export type DenQuestStage = 0 | 1 | 2;

export const DEN_PAINTED_COCONUT_GOAL = 20;

/** Composition VII must be at this mastery level to start Den's quest. */
export const DEN_QUEST_MASTERY_LEVEL = ROD_MASTERY_GOLD_LEVEL;

export const DEN_QUEST_ROD: ItemId = "paint_brush_composition_rod";

export const DEN_PAINTBRUSH_RODS: readonly ItemId[] = [
  "paint_brush_rod",
  "paint_brush_composition_rod",
];

export function normalizeDenQuestStage(raw: unknown): DenQuestStage {
  const n = Math.floor(Number(raw));
  if (n >= 2) return 2;
  if (n >= 1) return 1;
  return 0;
}

export function denQuestTitle(stage: DenQuestStage): string {
  if (stage === 1) return "Den — Golf Club";
  return "Den";
}

export function isPaintBrushRod(rodId: ItemId): boolean {
  return (
    rodId === "paint_brush_rod" || rodId === "paint_brush_composition_rod"
  );
}
