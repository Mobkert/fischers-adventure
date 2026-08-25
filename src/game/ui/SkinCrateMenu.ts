import Phaser from "phaser";
import {
  CRATE_SKIN_IDS,
  ROD_SKINS,
  skinCrateOddsPercent,
  SKIN_CRATE_DUPLICATE_REFUND,
} from "../data/rodSkins";
import { ITEMS } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

/**
 * Skin Crate prep menu — shows every crate skin + odds, then Open 1 / Open 3.
 */
export class SkinCrateMenu {
  private root: Phaser.GameObjects.Container;
  private dim!: Phaser.GameObjects.Rectangle;
  private countText!: Phaser.GameObjects.Text;
  private open1Btn!: Phaser.GameObjects.Rectangle;
  private open1Label!: Phaser.GameObjects.Text;
  private open3Btn!: Phaser.GameObjects.Rectangle;
  private open3Label!: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  visible = false;
  private onOpen?: (count: 1 | 3) => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.inventory = inventory;
    const w = scene.scale.width;
    const h = scene.scale.height;

    this.root = scene.add.container(0, 0).setDepth(390).setVisible(false);
    this.root.setScrollFactor(0);

    this.dim = scene.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setInteractive();

    const panel = scene.add
      .rectangle(w / 2, h / 2, 720, 420, 0x16121c, 0.98)
      .setStrokeStyle(3, 0xc4a86a);

    const title = scene.add
      .text(w / 2, h / 2 - 178, "Skin Crate", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5);

    const subtitle = scene.add
      .text(
        w / 2,
        h / 2 - 148,
        `Pick a finish · Duplicates refund $${SKIN_CRATE_DUPLICATE_REFUND.toLocaleString()}`,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#a89078",
        }
      )
      .setOrigin(0.5);

    this.countText = scene.add
      .text(w / 2, h / 2 - 122, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c4b5fd",
      })
      .setOrigin(0.5);

    const oddsLayer = scene.add.container(w / 2, h / 2 - 20);
    const ids = CRATE_SKIN_IDS;
    const gap = 108;
    const startX = -((ids.length - 1) * gap) / 2;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      const def = ROD_SKINS[id];
      const x = startX + i * gap;
      const card = scene.add.container(x, 0);
      const bg = scene.add
        .rectangle(0, 0, 96, 150, 0x2a2430, 1)
        .setStrokeStyle(2, rarityColor(def.crateWeight));
      const icon = scene.add
        .image(0, -28, def.textureKey)
        .setDisplaySize(
          id === "pufferfirm" ? 72 : 48,
          id === "pufferfirm" ? 28 : 48
        );
      const name = scene.add
        .text(0, 28, def.label, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#e8dcc8",
          align: "center",
          wordWrap: { width: 88 },
        })
        .setOrigin(0.5);
      const rod = scene.add
        .text(0, 48, ITEMS[def.rodId]?.name?.replace(" Rod", "") ?? "", {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#8a8070",
        })
        .setOrigin(0.5);
      const pct = scene.add
        .text(0, 66, `${skinCrateOddsPercent(id)}%`, {
          fontFamily: "Arial Black, Arial",
          fontSize: "16px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      card.add([bg, icon, name, rod, pct]);
      oddsLayer.add(card);
    }

    this.open1Btn = scene.add
      .rectangle(w / 2 - 90, h / 2 + 150, 150, 44, 0x3a4a6b)
      .setStrokeStyle(2, 0x7aa0d0)
      .setInteractive({ useHandCursor: true });
    this.open1Label = scene.add
      .text(w / 2 - 90, h / 2 + 150, "Open 1", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.open3Btn = scene.add
      .rectangle(w / 2 + 90, h / 2 + 150, 150, 44, 0x4a3a68)
      .setStrokeStyle(2, 0xb8a0e0)
      .setInteractive({ useHandCursor: true });
    this.open3Label = scene.add
      .text(w / 2 + 90, h / 2 + 150, "Open 3", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hint = scene.add
      .text(w / 2, h / 2 + 188, "Click outside to close", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#777068",
      })
      .setOrigin(0.5);

    this.root.add([
      this.dim,
      panel,
      title,
      subtitle,
      this.countText,
      oddsLayer,
      this.open1Btn,
      this.open1Label,
      this.open3Btn,
      this.open3Label,
      hint,
    ]);

    this.dim.on("pointerdown", () => this.close());

    this.open1Btn.on("pointerover", () => this.open1Btn.setFillStyle(0x4a5a7b));
    this.open1Btn.on("pointerout", () => this.open1Btn.setFillStyle(0x3a4a6b));
    this.open1Btn.on("pointerdown", () => this.requestOpen(1));

    this.open3Btn.on("pointerover", () => {
      if (this.inventory.countItem("skin_crate") >= 3) {
        this.open3Btn.setFillStyle(0x5a4a78);
      }
    });
    this.open3Btn.on("pointerout", () => this.refreshButtons());
    this.open3Btn.on("pointerdown", () => this.requestOpen(3));
  }

  setOnOpen(cb: (count: 1 | 3) => void): void {
    this.onOpen = cb;
  }

  setOnClose(cb: () => void): void {
    this.onClose = cb;
  }

  open(): void {
    this.visible = true;
    this.root.setVisible(true);
    this.refresh();
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.root.setVisible(false);
    this.onClose?.();
  }

  refresh(): void {
    const n = this.inventory.countItem("skin_crate");
    this.countText.setText(
      n === 1 ? "You have 1 Skin Crate" : `You have ${n} Skin Crates`
    );
    this.refreshButtons();
  }

  private refreshButtons(): void {
    const n = this.inventory.countItem("skin_crate");
    const can1 = n >= 1;
    const can3 = n >= 3;
    this.open1Btn.setAlpha(can1 ? 1 : 0.4);
    this.open1Label.setAlpha(can1 ? 1 : 0.4);
    this.open1Btn.setFillStyle(0x3a4a6b);
    this.open3Btn.setAlpha(can3 ? 1 : 0.35);
    this.open3Label.setAlpha(can3 ? 1 : 0.35);
    this.open3Btn.setFillStyle(can3 ? 0x4a3a68 : 0x2a2a32);
    this.open3Label.setText(can3 ? "Open 3" : "Open 3 (need 3)");
  }

  private requestOpen(count: 1 | 3): void {
    if (this.inventory.countItem("skin_crate") < count) return;
    this.onOpen?.(count);
  }

  isBusy(): boolean {
    return this.visible;
  }
}

function rarityColor(weight: number): number {
  if (weight <= 3) return 0xff66aa;
  if (weight <= 7) return 0xc084fc;
  if (weight <= 15) return 0x60a5fa;
  if (weight <= 25) return 0x4ade80;
  return 0x9ca3af;
}
