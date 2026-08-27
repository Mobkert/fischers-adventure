import Phaser from "phaser";
import {
  ROD_SKINS,
  SkinCrateKind,
  crateSkinIds,
  crateItemId,
  crateDuplicateRefund,
  skinCrateOddsPercent,
} from "../data/rodSkins";
import { ITEMS } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

/**
 * Skin Crate prep menu — shows every crate skin + odds, then Open 1 / Open 3.
 */
export class SkinCrateMenu {
  private root: Phaser.GameObjects.Container;
  private dim!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private oddsLayer!: Phaser.GameObjects.Container;
  private open1Btn!: Phaser.GameObjects.Rectangle;
  private open1Label!: Phaser.GameObjects.Text;
  private open3Btn!: Phaser.GameObjects.Rectangle;
  private open3Label!: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private kind: SkinCrateKind = "collectors";
  visible = false;
  private onOpen?: (count: 1 | 3, kind: SkinCrateKind) => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
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

    this.title = scene.add
      .text(w / 2, h / 2 - 178, "Skin Crate", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5);

    this.subtitle = scene.add
      .text(w / 2, h / 2 - 148, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#a89078",
      })
      .setOrigin(0.5);

    this.countText = scene.add
      .text(w / 2, h / 2 - 122, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c4b5fd",
      })
      .setOrigin(0.5);

    this.oddsLayer = scene.add.container(w / 2, h / 2 - 20);

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
      this.title,
      this.subtitle,
      this.countText,
      this.oddsLayer,
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
      if (this.crateCount() >= 3) {
        this.open3Btn.setFillStyle(0x5a4a78);
      }
    });
    this.open3Btn.on("pointerout", () => this.refreshButtons());
    this.open3Btn.on("pointerdown", () => this.requestOpen(3));
  }

  setOnOpen(cb: (count: 1 | 3, kind: SkinCrateKind) => void): void {
    this.onOpen = cb;
  }

  setOnClose(cb: () => void): void {
    this.onClose = cb;
  }

  open(kind: SkinCrateKind = "collectors"): void {
    this.kind = kind;
    this.visible = true;
    this.root.setVisible(true);
    this.rebuildOdds();
    this.refresh();
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.root.setVisible(false);
    this.onClose?.();
  }

  private crateCount(): number {
    return this.inventory.countItem(crateItemId(this.kind));
  }

  private rebuildOdds(): void {
    for (const child of [...this.oddsLayer.list]) {
      child.destroy(true);
    }
    const ids = crateSkinIds(this.kind);
    const gap = 108;
    const startX = -((ids.length - 1) * gap) / 2;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      const def = ROD_SKINS[id];
      const x = startX + i * gap;
      const card = this.scene.add.container(x, 0);
      const bg = this.scene.add
        .rectangle(0, 0, 96, 150, 0x2a2430, 1)
        .setStrokeStyle(2, rarityColor(def.crateWeight));
      const icon = this.scene.add
        .image(0, -28, def.textureKey)
        .setDisplaySize(
          id === "pufferfirm" ? 72 : 48,
          id === "pufferfirm" ? 28 : 48
        );
      const name = this.scene.add
        .text(0, 28, def.label, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#e8dcc8",
          align: "center",
          wordWrap: { width: 88 },
        })
        .setOrigin(0.5);
      const rod = this.scene.add
        .text(0, 48, ITEMS[def.rodId]?.name?.replace(" Rod", "") ?? "", {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#8a8070",
        })
        .setOrigin(0.5);
      const pct = this.scene.add
        .text(0, 66, `${skinCrateOddsPercent(id, this.kind)}%`, {
          fontFamily: "Arial Black, Arial",
          fontSize: "16px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      card.add([bg, icon, name, rod, pct]);
      this.oddsLayer.add(card);
    }
  }

  refresh(): void {
    const refund = crateDuplicateRefund(this.kind);
    const frost = this.kind === "frostpeak";
    this.title.setText(frost ? "Frostpeak Crate" : "Skin Crate");
    this.subtitle.setText(
      `Pick a finish · Duplicates refund $${refund.toLocaleString()}`
    );
    this.countText.setColor(frost ? "#a8d8ff" : "#c4b5fd");
    const n = this.crateCount();
    const label = frost ? "Frostpeak Crate" : "Skin Crate";
    this.countText.setText(
      n === 1 ? `You have 1 ${label}` : `You have ${n} ${label}s`
    );
    this.refreshButtons();
  }

  private refreshButtons(): void {
    const n = this.crateCount();
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
    if (this.crateCount() < count) return;
    this.onOpen?.(count, this.kind);
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
