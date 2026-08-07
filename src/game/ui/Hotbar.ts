import Phaser from "phaser";
import { HOTBAR_SIZE, ITEMS, MUTATIONS, applyMutationTint } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

export class Hotbar {
  private container: Phaser.GameObjects.Container;
  private slots: Phaser.GameObjects.Rectangle[] = [];
  private icons: Phaser.GameObjects.Image[] = [];
  private labels: Phaser.GameObjects.Text[] = [];
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private baseY: number;
  private onSlotSelect?: (index: number) => void;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;
    const slotSize = 56;
    const gap = 8;
    const totalWidth = HOTBAR_SIZE * slotSize + (HOTBAR_SIZE - 1) * gap;
    const startX = -totalWidth / 2 + slotSize / 2;
    this.baseY = scene.scale.height - 48;

    this.container = scene.add
      .container(scene.scale.width / 2, this.baseY)
      .setDepth(100);
    this.container.setScrollFactor(0);

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const x = startX + i * (slotSize + gap);
      const slot = scene.add
        .rectangle(x, 0, slotSize, slotSize, 0x2a2a2a, 0.85)
        .setStrokeStyle(2, 0x888888);
      const icon = scene.add.image(x, -4, "rod").setVisible(false).setScale(0.7);
      const label = scene.add
        .text(x - 22, -22, String(i + 1), {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#cccccc",
        })
        .setOrigin(0, 0);

      this.slots.push(slot);
      this.icons.push(icon);
      this.labels.push(label);
      this.container.add([slot, icon, label]);
    }

    this.refresh();
  }

  setOnSlotSelect(cb: (index: number) => void): void {
    this.onSlotSelect = cb;
  }

  /** Raise + enlarge hotbar and enable tap-to-select when mobile controls are on. */
  setMobileLayout(on: boolean): void {
    this.container.setScale(on ? 1.55 : 1);
    this.container.setY(on ? this.scene.scale.height - 250 : this.baseY);
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      slot.removeAllListeners();
      if (on) {
        slot.setInteractive({ useHandCursor: true });
        const index = i;
        slot.on("pointerdown", (p: Phaser.Input.Pointer) => {
          p.event?.stopPropagation?.();
          this.onSlotSelect?.(index);
        });
      } else {
        slot.disableInteractive();
      }
    }
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  refresh(): void {
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slotData = this.inventory.hotbar[i];
      const selected = i === this.inventory.selectedHotbarIndex;
      this.slots[i].setStrokeStyle(3, selected ? 0xffe066 : 0x888888);
      this.slots[i].setFillStyle(selected ? 0x3a3a20 : 0x2a2a2a, 0.9);

      if (slotData.itemId) {
        const def = ITEMS[slotData.itemId];
        const tex = def.isRod
          ? this.inventory.getRodTextureKey(slotData.itemId)
          : def.textureKey;
        this.icons[i].setTexture(tex).setVisible(true);
        if (def.isEquipmentBag || def.isBestiary) {
          this.icons[i].setDisplaySize(34, 34);
        } else if (def.isRod) {
          if (tex === "crystal_rod_skin") {
            this.icons[i].setDisplaySize(48, 30);
          } else {
            this.icons[i].setDisplaySize(40, 40);
          }
        } else {
          this.icons[i].setDisplaySize(28, 28);
        }
        if (slotData.mutation && MUTATIONS[slotData.mutation]) {
          applyMutationTint(this.icons[i], slotData.mutation);
        } else {
          this.icons[i].clearTint();
        }
      } else {
        this.icons[i].setVisible(false);
        this.icons[i].clearTint();
      }
    }
  }
}
