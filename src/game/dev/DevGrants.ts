import type { InventorySystem } from "../systems/InventorySystem";

/**
 * Dev-only one-shot inventory grants and migration cleanup.
 * Production builds alias this module to DevGrants.stub.ts and never call it.
 */
export function applyDevInventoryBootstrap(inventory: InventorySystem): void {
  if (!import.meta.env.DEV) return;

  const forgeClearKey = "fischers_cleared_forge_dev_grant_v1";
  if (!localStorage.getItem(forgeClearKey)) {
    const fi = inventory.ownedRods.indexOf("forge_rod");
    if (fi >= 0) {
      inventory.ownedRods.splice(fi, 1);
    }
    if (!inventory.ownsRod(inventory.getEquippedRodId())) {
      inventory.equipRod("starter_rod");
    }
    localStorage.setItem(forgeClearKey, "1");
  }

  const recoilClearKey = "fischers_cleared_recoil_dev_grant_v1";
  if (!localStorage.getItem(recoilClearKey)) {
    const ri = inventory.ownedRods.indexOf("recoil_rod");
    if (ri >= 0) {
      inventory.ownedRods.splice(ri, 1);
    }
    if (!inventory.ownsRod(inventory.getEquippedRodId())) {
      inventory.equipRod("starter_rod");
    }
    localStorage.setItem(recoilClearKey, "1");
  }

  const recoilCraftKey = "fischers_granted_recoil_craft_v1";
  if (!localStorage.getItem(recoilCraftKey)) {
    inventory.coins = Math.max(inventory.coins, 30000);
    inventory.addItem("phantom_eel", 10);
    inventory.addItem("mushroom_cluster", 2, "bloom");
    inventory.addItem("alligator", 1, "glowing");
    localStorage.setItem(recoilCraftKey, "1");
  }

  const portalClearKey = "fischers_cleared_portal_dev_grant_v1";
  if (!localStorage.getItem(portalClearKey)) {
    const pi = inventory.ownedRods.indexOf("portal_rod");
    if (pi >= 0) {
      inventory.ownedRods.splice(pi, 1);
    }
    if (!inventory.ownsRod(inventory.getEquippedRodId())) {
      inventory.equipRod("starter_rod");
    }
    localStorage.setItem(portalClearKey, "1");
  }

  const portalCraftKey = "fischers_granted_portal_craft_v1";
  if (!localStorage.getItem(portalCraftKey)) {
    inventory.coins = Math.max(inventory.coins, 19000);
    inventory.addItem("angelfish", 1, "starlight");
    inventory.addItem("arapaima", 2);
    inventory.addItem("bluefin_tuna", 15);
    inventory.addItem("driftwood", 6);
    inventory.addItem("mushroom_cluster", 3);
    localStorage.setItem(portalCraftKey, "1");
  }

  const forgeCraftKey = "fischers_granted_forge_craft_v1";
  if (!localStorage.getItem(forgeCraftKey)) {
    inventory.coins = Math.max(inventory.coins, 210000);
    inventory.addItem("serpent_eel", 5, "blasted");
    inventory.addItem("driftwood", 5, "ash");
    inventory.addItem("alligator", 3, "glowing");
    inventory.addItem("angelfish", 2, "starlight");
    localStorage.setItem(forgeCraftKey, "1");
  }

  const birthdayClearKey = "fischers_cleared_birthday_dev_grant_v1";
  if (!localStorage.getItem(birthdayClearKey)) {
    const bi = inventory.ownedRods.indexOf("birthday_rod");
    if (bi >= 0) {
      inventory.ownedRods.splice(bi, 1);
    }
    if (!inventory.ownsRod(inventory.getEquippedRodId())) {
      inventory.equipRod("starter_rod");
    }
    localStorage.setItem(birthdayClearKey, "1");
  }

  const birthdayStripKey = "fischers_stripped_birthday_rod_v2";
  if (!localStorage.getItem(birthdayStripKey)) {
    const bi = inventory.ownedRods.indexOf("birthday_rod");
    if (bi >= 0) {
      inventory.ownedRods.splice(bi, 1);
    }
    if (!inventory.ownsRod(inventory.getEquippedRodId())) {
      inventory.equipRod("starter_rod");
    }
    const promoIdx = inventory.redeemedPromoCodes.indexOf("birthday_rod");
    if (promoIdx >= 0) {
      inventory.redeemedPromoCodes.splice(promoIdx, 1);
    }
    localStorage.setItem(birthdayStripKey, "1");
  }

  const clearKey = "fischers_cleared_amber_perch_test_v1";
  if (!localStorage.getItem(clearKey)) {
    for (const slot of [...inventory.bag, ...inventory.hotbar]) {
      if (slot.itemId === "white_perch" && slot.mutation === "amber") {
        slot.itemId = null;
        slot.count = 0;
        slot.mutation = null;
        slot.size = null;
        slot.keep = false;
      }
    }
    localStorage.setItem(clearKey, "1");
  }
}
