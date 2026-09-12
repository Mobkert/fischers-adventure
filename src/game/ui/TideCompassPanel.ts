import Phaser from "phaser";
import {
  TIDE_COMPASS_BESTIARY_MIN,
  TIDE_COMPASS_DESTINATIONS,
  TIDE_COMPASS_TRAVEL_COST,
  TideCompassDestId,
  BESTIARY_AREAS,
  tideCompassTravelCost,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

const PANEL_W = 480;
const PANEL_H = 520;
const LIST_TOP = -180;
const ROW_H = 54;
const ROW_GAP = 6;

/** Tide Compass — warp map opened from hotbar slot 4. */
export class TideCompassPanel {
  private root: Phaser.GameObjects.Container;
  private listRoot: Phaser.GameObjects.Container;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private onTravel?: (destId: TideCompassDestId) => void;
  private getHere: () => TideCompassDestId | null = () => null;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;
    this.panelCx = scene.scale.width / 2;
    this.panelCy = scene.scale.height / 2 - 10;

    this.root = scene.add
      .container(this.panelCx, this.panelCy)
      .setDepth(145)
      .setVisible(false);
    this.root.setScrollFactor(0);

    const dim = scene.add
      .rectangle(0, 0, scene.scale.width + 40, scene.scale.height + 40, 0x000000, 0.5)
      .setInteractive();
    dim.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
    });

    const bg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x121820, 0.97)
      .setStrokeStyle(2, 0x7ec8e8);

    const title = scene.add
      .text(0, -228, "Tide Compass", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#e8f4ff",
      })
      .setOrigin(0.5);
    const sub = scene.add
      .text(
        0,
        -198,
        `$${TIDE_COMPASS_TRAVEL_COST.toLocaleString("en-US")} most warps · Stellar Sky $50,000`,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#8aa8c0",
        }
      )
      .setOrigin(0.5);

    this.listRoot = scene.add.container(0, LIST_TOP);
    const hint = scene.add
      .text(0, 228, "4 / Esc to close", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#667788",
      })
      .setOrigin(0.5);

    this.root.add([dim, bg, title, sub, this.listRoot, hint]);
  }

  setOnTravel(cb: (destId: TideCompassDestId) => void): void {
    this.onTravel = cb;
  }

  setHereCheck(fn: () => TideCompassDestId | null): void {
    this.getHere = fn;
  }

  toggle(): void {
    this.setOpen(!this.visible);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (open) this.refresh();
  }

  refresh(): void {
    for (const child of [...this.listRoot.list]) {
      child.destroy(true);
    }

    const here = this.getHere();
    let y = 0;
    for (const dest of TIDE_COMPASS_DESTINATIONS) {
      const cost = tideCompassTravelCost(dest.id);
      const canAfford = this.inventory.coins >= cost;
      const found = this.inventory.bestiaryFoundInHabitat(dest.bestiaryHabitat);
      const area = BESTIARY_AREAS.find((a) => a.id === dest.bestiaryHabitat);
      const total = area?.fishIds.length ?? 0;
      let unlocked: boolean;
      let needsHat = false;
      if (dest.requireDiscovered) {
        unlocked = this.inventory.stellarSkyDiscovered;
        if (unlocked && !this.inventory.canResonateToStellarSky()) {
          needsHat = true;
        }
      } else if (dest.requireFullBestiary) {
        unlocked = total > 0 && found >= total;
      } else {
        unlocked = found >= TIDE_COMPASS_BESTIARY_MIN;
      }
      const isHere = here === dest.id;
      const canTravel = unlocked && canAfford && !isHere && !needsHat;

      const row = this.scene.add.container(0, y);
      const card = this.scene.add
        .rectangle(0, ROW_H / 2, 420, ROW_H, canTravel ? 0x1a3048 : 0x1a1e24, 0.95)
        .setStrokeStyle(1, canTravel ? 0x6ab0e0 : 0x3a4450)
        .setInteractive({ useHandCursor: canTravel });

      const name = this.scene.add
        .text(-190, ROW_H / 2 - 10, dest.name, {
          fontFamily: "Georgia, serif",
          fontSize: "16px",
          color: canTravel ? "#e8f4ff" : "#8890a0",
        })
        .setOrigin(0, 0.5);

      let status: string;
      if (isHere) {
        status = `${dest.subtitle} · You are here`;
      } else if (dest.requireDiscovered && !unlocked) {
        status = "Hidden among the stars · Hover the full moon…";
      } else if (needsHat) {
        status = "Equip Resonated Hat to resonate here";
      } else if (!unlocked) {
        status = dest.requireFullBestiary
          ? `${dest.subtitle} · ${found}/${total} (complete bestiary)`
          : `${dest.subtitle} · ${found}/${total} (need ${TIDE_COMPASS_BESTIARY_MIN})`;
      } else if (!canAfford) {
        status = `${dest.subtitle} · Need $${cost.toLocaleString("en-US")}`;
      } else {
        status = `${dest.subtitle} · $${cost.toLocaleString("en-US")} · Tap to warp`;
      }

      const detail = this.scene.add
        .text(-190, ROW_H / 2 + 12, status, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: canTravel ? "#8ec8e8" : "#6a7080",
        })
        .setOrigin(0, 0.5);

      if (canTravel) {
        card.on("pointerover", () => card.setFillStyle(0x244060, 0.95));
        card.on("pointerout", () => card.setFillStyle(0x1a3048, 0.95));
        card.on("pointerdown", (p: Phaser.Input.Pointer) => {
          p.event?.stopPropagation?.();
          this.setOpen(false);
          this.onTravel?.(dest.id);
        });
      }

      row.add([card, name, detail]);
      this.listRoot.add(row);
      y += ROW_H + ROW_GAP;
    }
  }
}
