import type { InventorySystem } from "../systems/InventorySystem";

/** Production no-op — real dev grants live in DevGrants.ts (dev builds only). */
export function applyDevInventoryBootstrap(_inventory: InventorySystem): void {}
