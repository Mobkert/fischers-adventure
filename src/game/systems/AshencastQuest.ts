/** Ashencast forge anvil quest stages. */
export type AshencastQuestStage = 0 | 1 | 2 | 3;

/**
 * 0 — not started
 * 1 — find the three anvil pieces
 * 2 — bring an Ashencast Trout
 * 3 — anvil fixed (rod forge unlocked)
 */
export function normalizeAshencastQuestStage(raw: unknown): AshencastQuestStage {
  const n = Math.floor(Number(raw) || 0);
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  return 3;
}

export const ANVIL_PIECE_IDS = [
  "anvil_piece_curio",
  "anvil_piece_ocean",
  "anvil_piece_cave",
] as const;

export type AnvilPieceId = (typeof ANVIL_PIECE_IDS)[number];
