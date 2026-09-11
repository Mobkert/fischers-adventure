import Phaser from "phaser";
import { FishRarity, FishMutationId } from "../data/items";

/** Play catch reward dings based on rarity / mutation. */
export function playCatchSfx(
  scene: Phaser.Scene,
  rarity: FishRarity,
  mutation: FishMutationId | null
): void {
  const fancy =
    !!mutation ||
    rarity === "epic" ||
    rarity === "legendary" ||
    rarity === "mythical" ||
    rarity === "mystical";

  const key = fancy ? "sfx_ding_triple" : "sfx_ding";
  if (!scene.cache.audio.exists(key)) return;

  try {
    if (scene.sound.locked) scene.sound.unlock();
    scene.sound.play(key, { volume: 0.55 });
  } catch {
    // Ignore if audio context isn't ready yet
  }
}

/** Black-hole duplicate — single ding, higher pitch (never triple). */
export function playCatchDuplicateDing(scene: Phaser.Scene): void {
  if (!scene.cache.audio.exists("sfx_ding")) return;
  try {
    if (scene.sound.locked) scene.sound.unlock();
    scene.sound.play("sfx_ding", { volume: 0.55, rate: 1.45 });
  } catch {
    // Ignore if audio context isn't ready yet
  }
}
