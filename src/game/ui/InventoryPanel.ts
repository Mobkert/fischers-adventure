import Phaser from "phaser";
import { ITEMS, INVENTORY_SIZE, HOTBAR_SIZE, MUTATIONS } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

export class InventoryPanel {
  private root: Phaser.GameObjects.Container;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private slotIcons: Phaser.GameObjects.Image[] = [];
  private hotbarIcons: Phaser.GameObjects.Image[] = [];
  private hotbarTexts: Phaser.GameObjects.Text[] = [];
  private inventory: InventorySystem;
  visible = false;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.inventory = inventory;
    const w = 420;
    const h = 400;
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    this.root = scene.add.container(cx, cy).setDepth(120).setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, w, h, 0x1e1e28, 0.95)
      .setStrokeStyle(2, 0xd4c4a8);
    const title = scene.add
      .text(0, -h / 2 + 24, "Inventory", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);
    const hotbarLabel = scene.add
      .text(0, -h / 2 + 56, "Hotbar", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    const bagLabel = scene.add
      .text(0, -40, "Bag", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    const hint = scene.add
      .text(0, h / 2 - 22, "Press E to close", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.root.add([bg, title, hotbarLabel, bagLabel, hint]);

    const slotSize = 56;
    const gap = 10;
    const cols = 5;
    const gridW = cols * slotSize + (cols - 1) * gap;
    const startX = -gridW / 2 + slotSize / 2;

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const x = startX + i * (slotSize + gap);
      const y = -h / 2 + 96;
      const slot = scene.add
        .rectangle(x, y, slotSize, slotSize, 0x2f2f3a, 0.95)
        .setStrokeStyle(1, 0xc4a86a);
      const icon = scene.add.image(x, y - 6, "rod").setVisible(false).setScale(0.65);
      const text = scene.add
        .text(x + 20, y + 16, "", {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#ffffff",
        })
        .setOrigin(1, 0.5);
      this.hotbarIcons.push(icon);
      this.hotbarTexts.push(text);
      this.root.add([slot, icon, text]);
    }

    const bagStartY = -10;
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (slotSize + gap);
      const y = bagStartY + row * (slotSize + gap);

      const slot = scene.add
        .rectangle(x, y, slotSize, slotSize, 0x2f2f3a, 0.95)
        .setStrokeStyle(1, 0x777777);
      const icon = scene.add
        .image(x, y - 6, "fish")
        .setVisible(false)
        .setDisplaySize(40, 14);
      const text = scene.add
        .text(x + 20, y + 16, "", {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#ffffff",
        })
        .setOrigin(1, 0.5);

      this.slotIcons.push(icon);
      this.slotTexts.push(text);
      this.root.add([slot, icon, text]);
    }
  }

  toggle(): void {
    this.visible = !this.visible;
    this.root.setVisible(this.visible);
    if (this.visible) this.refresh();
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (open) this.refresh();
  }

  refresh(): void {
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = this.inventory.hotbar[i];
      if (slot.itemId) {
        const def = ITEMS[slot.itemId];
        this.hotbarIcons[i].setTexture(def.textureKey).setVisible(true);
        if (slot.mutation && MUTATIONS[slot.mutation]) {
          this.hotbarIcons[i].setTint(MUTATIONS[slot.mutation].tint);
        } else {
          this.hotbarIcons[i].clearTint();
        }
        this.hotbarTexts[i].setText(slot.count > 1 ? String(slot.count) : "");
      } else {
        this.hotbarIcons[i].setVisible(false);
        this.hotbarIcons[i].clearTint();
        this.hotbarTexts[i].setText("");
      }
    }

    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const slot = this.inventory.bag[i];
      if (slot.itemId) {
        const def = ITEMS[slot.itemId];
        const icon = this.slotIcons[i];
        icon.setTexture(def.textureKey).setVisible(true);
        if (def.displayWidth && def.displayHeight) {
          const scale = Math.min(40 / def.displayWidth, 28 / def.displayHeight);
          icon.setDisplaySize(
            Math.round(def.displayWidth * scale),
            Math.round(def.displayHeight * scale)
          );
        } else {
          icon.setDisplaySize(28, 28);
        }
        if (slot.mutation && MUTATIONS[slot.mutation]) {
          icon.setTint(MUTATIONS[slot.mutation].tint);
        } else {
          icon.clearTint();
        }
        this.slotTexts[i].setText(slot.count > 1 ? String(slot.count) : "");
      } else {
        this.slotIcons[i].setVisible(false);
        this.slotIcons[i].clearTint();
        this.slotTexts[i].setText("");
      }
    }
  }
}
