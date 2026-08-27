import type { InventorySystem } from "../systems/InventorySystem";

/**
 * Local-dev-only inventory cheats / one-shot migrations.
 *
 * Production (`vite build`) aliases this file to DevGrants.stub.ts — the
 * real grant code never ships. Even in `npm run dev`, grants only run when
 * you opt in (so recipe tweaks never dump free items into your save):
 *
 *   localStorage.setItem("fischers_dev_grants", "1")
 *
 * Then reload. Clear with localStorage.removeItem("fischers_dev_grants").
 */
const DEV_GRANTS_OPT_IN = "fischers_dev_grants";

function isLocalDevHost(): boolean {
  if (typeof location === "undefined") return false;
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function applyDevInventoryBootstrap(inventory: InventorySystem): void {
  // Belt-and-suspenders: stubbed in prod; localhost DEV only
  if (!import.meta.env.DEV) return;
  if (!isLocalDevHost()) return;

  // Explicit one-shot gifts (requested in chat) — no general opt-in needed
  const starweaverCraftKey = "fischers_granted_starweaver_craft_v1";
  if (!localStorage.getItem(starweaverCraftKey)) {
    inventory.coins = Math.max(inventory.coins, 70000);
    inventory.addItem("taaffite", 2);
    inventory.addItem("rhodochrosite", 1);
    inventory.addItem("driftwood", 2, "tranquil");
    inventory.addItem("angelfish", 1, "starlight");
    inventory.addItem("ruby", 7);
    localStorage.setItem(starweaverCraftKey, "1");
  }

  // Frostpeak crate skins + matching rods for testing
  const frostpeakSkinsKey = "fischers_granted_frostpeak_skins_v1";
  if (!localStorage.getItem(frostpeakSkinsKey)) {
    const frostSkins: Array<{
      skin: "frigid" | "frozen_lotus" | "icicle" | "halo_of_ice" | "hyperboreal" | "hyperthermic";
      rod:
        | "amber_rod"
        | "wildflower_rod"
        | "augment_rod"
        | "coral_rod"
        | "starweaver_rod"
        | "forge_rod";
    }> = [
      { skin: "frigid", rod: "amber_rod" },
      { skin: "icicle", rod: "augment_rod" },
      { skin: "frozen_lotus", rod: "wildflower_rod" },
      { skin: "halo_of_ice", rod: "coral_rod" },
      { skin: "hyperboreal", rod: "starweaver_rod" },
      { skin: "hyperthermic", rod: "forge_rod" },
    ];
    for (const { skin, rod } of frostSkins) {
      if (!inventory.ownsRod(rod)) {
        inventory.addItem(rod);
      }
      if (!inventory.ownsRodSkin(skin)) {
        inventory.ownedRodSkins.push(skin);
      }
      inventory.activeRodSkins[rod] = skin;
    }
    localStorage.setItem(frostpeakSkinsKey, "1");
  }

  if (localStorage.getItem(DEV_GRANTS_OPT_IN) !== "1") return;

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

  // Test-only: Laser Zeus skin (this file is stubbed out in production builds)
  const laserSkinKey = "fischers_granted_laser_skin_v1";
  if (!localStorage.getItem(laserSkinKey)) {
    if (!inventory.ownsRod("zeus_rod")) {
      inventory.addItem("zeus_rod");
    }
    if (!inventory.ownsRodSkin("laser")) {
      inventory.ownedRodSkins.push("laser");
    }
    inventory.activeRodSkins["zeus_rod"] = "laser";
    inventory.equipRod("zeus_rod");
    localStorage.setItem(laserSkinKey, "1");
  }

  // Birthday Rod: codes expired, but never strip from owned rods / equipment bag.

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
