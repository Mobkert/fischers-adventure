import type { InventorySystem } from "../systems/InventorySystem";

/** localStorage key — one-time grant on this browser only. */
const OWNER_GRANT_KEY = "fischers_adventure_owner_bootstrap_v1";
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
