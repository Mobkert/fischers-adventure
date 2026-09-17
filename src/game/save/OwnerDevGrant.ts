import type { InventorySystem } from "../systems/InventorySystem";

/** localStorage key — one-time grant on this browser only. */
const OWNER_GRANT_KEY = "fischers_adventure_owner_bootstrap_v1";
const STRIP_PAINT_BRUSH_KEY = "fischers_adventure_strip_paint_brush_v1";
const OWNER_GRANT_COINS = 3_000_000;

function isLocalDevHost(): boolean {
  if (typeof location === "undefined") return false;
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

/**
 * One-time localhost DEV bootstrap for the project owner:
 * strips testing Voidharvester, grants $3M.
 * Never runs in production builds or on non-local hosts.
 */
export function applyOwnerDevGrant(inventory: InventorySystem): boolean {
  if (!import.meta.env.DEV) return false;
  if (!isLocalDevHost()) return false;
  if (typeof localStorage === "undefined") return false;
  if (localStorage.getItem(OWNER_GRANT_KEY)) return false;

  inventory.stripRodOwnership("voidharvester_rod");
  inventory.coins += OWNER_GRANT_COINS;
  localStorage.setItem(OWNER_GRANT_KEY, "1");
  return true;
}

/**
 * One-time localhost cleanup: remove free Paint Brush grant from the bag.
 * Keep it if they already redeemed `.STARRYNIGHT.`.
 * Never runs in production builds.
 */
export function stripPaintBrushFreeGrant(inventory: InventorySystem): void {
  if (!import.meta.env.DEV) return;
  if (!isLocalDevHost()) return;
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(STRIP_PAINT_BRUSH_KEY)) return;
  if (!inventory.redeemedPromoCodes.includes("starry_night")) {
    inventory.stripRodOwnership("paint_brush_rod");
  }
  localStorage.setItem(STRIP_PAINT_BRUSH_KEY, "1");
}
