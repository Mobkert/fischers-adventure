import Phaser from "phaser";
import {
  ITEMS,
  MAX_INVENTORY_SIZE,
  HOTBAR_SIZE,
  MUTATIONS,
  FISH_SIZES,
  sizeScale,
  mutationSellMult,
  sizeSellMult,
  applyMutationTint,
  InventorySlot,
  isMerchantSellable,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";
import { skinCrateKindForItem, SkinCrateKind } from "../data/rodSkins";

const RARITY_NAME: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythical: "Mythical",
  mystical: "Mystical",
};

const KEEP_COLOR = 0xffe066;
const BAG_BORDER = 0x777777;
const HOTBAR_BORDER = 0xc4a86a;
const LOCKED_BORDER = 0x444444;

export class InventoryPanel {
  private root: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Rectangle;
  private bagLabel!: Phaser.GameObjects.Text;
  private slotFrames: Phaser.GameObjects.Rectangle[] = [];
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private slotIcons: Phaser.GameObjects.Image[] = [];
  private slotHits: Phaser.GameObjects.Rectangle[] = [];
  private hotbarFrames: Phaser.GameObjects.Rectangle[] = [];
  private hotbarIcons: Phaser.GameObjects.Image[] = [];
  private hotbarTexts: Phaser.GameObjects.Text[] = [];
  private hotbarHits: Phaser.GameObjects.Rectangle[] = [];
  private tooltip: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private onChanged?: () => void;
  private onOpenSkinCrate?: (kind: SkinCrateKind) => void;
  private onOpenOreCluster?: () => void;
  visible = false;
  private panelH = 560;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.inventory = inventory;
    const w = 420;
    const h = this.panelH;
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    this.root = scene.add.container(cx, cy).setDepth(120).setVisible(false);
    this.root.setScrollFactor(0);

    this.bg = scene.add
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
    this.bagLabel = scene.add
      .text(0, -h / 2 + 148, "Bag", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    const hint = scene.add
      .text(
        0,
        h / 2 - 22,
        "E close · Left-click Skin Crate / Ore Cluster to open · Right-click fish/ores to favorite",
        {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#aaaaaa",
        }
      )
      .setOrigin(0.5);

    this.root.add([this.bg, title, hotbarLabel, this.bagLabel, hint]);

    const slotSize = 52;
    const gap = 8;
    const cols = 5;
    const gridW = cols * slotSize + (cols - 1) * gap;
    const startX = -gridW / 2 + slotSize / 2;

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const x = startX + i * (slotSize + gap);
      const y = -h / 2 + 96;
      const frame = scene.add
        .rectangle(x, y, slotSize, slotSize, 0x2f2f3a, 0.95)
        .setStrokeStyle(1, HOTBAR_BORDER);
      const hit = scene.add
        .rectangle(x, y, slotSize, slotSize, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: false });
      const icon = scene.add.image(x, y - 6, "rod").setVisible(false).setScale(0.65);
      const text = scene.add
        .text(x + 18, y + 14, "", {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#ffffff",
        })
        .setOrigin(1, 0.5);
      this.hotbarFrames.push(frame);
      this.hotbarIcons.push(icon);
      this.hotbarTexts.push(text);
      this.hotbarHits.push(hit);
      this.root.add([frame, hit, icon, text]);
      this.bindSlot(
        hit,
        () => this.inventory.hotbar[i],
        () => {
          if (this.inventory.toggleKeepHotbar(i) != null) {
            this.refresh();
            this.onChanged?.();
          }
        },
        () => this.tryLeftClickSlot(() => this.inventory.hotbar[i])
      );
    }

    const bagStartY = -h / 2 + 188;
    for (let i = 0; i < MAX_INVENTORY_SIZE; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (slotSize + gap);
      const y = bagStartY + row * (slotSize + gap);

      const frame = scene.add
        .rectangle(x, y, slotSize, slotSize, 0x2f2f3a, 0.95)
        .setStrokeStyle(1, BAG_BORDER);
      const hit = scene.add
        .rectangle(x, y, slotSize, slotSize, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: false });
      const icon = scene.add
        .image(x, y - 6, "fish")
        .setVisible(false)
        .setDisplaySize(40, 14);
      const text = scene.add
        .text(x + 18, y + 14, "", {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#ffffff",
        })
        .setOrigin(1, 0.5);

      this.slotFrames.push(frame);
      this.slotIcons.push(icon);
      this.slotTexts.push(text);
      this.slotHits.push(hit);
      this.root.add([frame, hit, icon, text]);
      const slotIndex = i;
      this.bindSlot(
        hit,
        () => this.inventory.bag[slotIndex],
        () => {
          if (slotIndex >= this.inventory.getBagCapacity()) return;
          if (this.inventory.toggleKeepBag(slotIndex) != null) {
            this.refresh();
            this.onChanged?.();
          }
        },
        () => {
          if (slotIndex >= this.inventory.getBagCapacity()) return;
          this.tryLeftClickSlot(() => this.inventory.bag[slotIndex]);
        }
      );
    }

    this.tooltip = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#f0e6d2",
        backgroundColor: "#1a1a22ee",
        padding: { x: 8, y: 6 },
        align: "left",
      })
      .setOrigin(0, 0)
      .setDepth(200)
      .setScrollFactor(0)
      .setVisible(false);

    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.visible || !this.tooltip.visible) return;
      this.tooltip.setPosition(p.x + 14, p.y + 14);
    });
  }

  setOnChanged(cb: () => void): void {
    this.onChanged = cb;
  }

  setOnOpenSkinCrate(cb: (kind: SkinCrateKind) => void): void {
    this.onOpenSkinCrate = cb;
  }

  setOnOpenOreCluster(cb: () => void): void {
    this.onOpenOreCluster = cb;
  }

  private tryOpenCrate(getSlot: () => InventorySlot): void {
    const slot = getSlot();
    const kind = slot.itemId ? skinCrateKindForItem(slot.itemId) : null;
    if (!kind || slot.count <= 0) return;
    this.onOpenSkinCrate?.(kind);
  }

  private tryOpenOreCluster(getSlot: () => InventorySlot): void {
    const slot = getSlot();
    if (slot.itemId !== "ore_cluster" || slot.count <= 0) return;
    this.onOpenOreCluster?.();
  }

  private tryLeftClickSlot(getSlot: () => InventorySlot): void {
    const slot = getSlot();
    if (slot.itemId === "skin_crate" || slot.itemId === "frostpeak_crate") {
      this.tryOpenCrate(getSlot);
      return;
    }
    if (slot.itemId === "ore_cluster") {
      this.tryOpenOreCluster(getSlot);
    }
  }

  private bindSlot(
    hit: Phaser.GameObjects.Rectangle,
    getSlot: () => InventorySlot,
    onRightClick: () => void,
    onLeftClick?: () => void
  ): void {
    hit.on("pointerover", (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      const text = this.formatTooltip(getSlot());
      if (!text) {
        this.tooltip.setVisible(false);
        return;
      }
      this.tooltip.setText(text);
      this.tooltip.setPosition(p.x + 14, p.y + 14);
      this.tooltip.setVisible(true);
    });
    hit.on("pointerout", () => {
      this.tooltip.setVisible(false);
    });
    hit.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      if (p.rightButtonDown()) {
        onRightClick();
        const text = this.formatTooltip(getSlot());
        if (text) {
          this.tooltip.setText(text);
          this.tooltip.setVisible(true);
        }
      } else if (onLeftClick) {
        onLeftClick();
      }
    });
  }

  private formatTooltip(slot: InventorySlot): string | null {
    if (!slot.itemId) return null;
    const def = ITEMS[slot.itemId];
    const lines: string[] = [def.name];

    if (def.sellPrice != null) {
      const rarity = def.rarity ?? "common";
      lines.push(RARITY_NAME[rarity] ?? rarity);
      if (slot.mutation && MUTATIONS[slot.mutation]) {
        lines.push(`Mutation: ${MUTATIONS[slot.mutation].name}`);
      } else {
        lines.push("Mutation: None");
      }
      const sizeId = slot.size && slot.size !== "normal" ? slot.size : null;
      if (sizeId && FISH_SIZES[sizeId]) {
        lines.push(`Effect: ${FISH_SIZES[sizeId].name}`);
      } else {
        lines.push("Effect: None");
      }
      const unit =
        def.sellPrice *
        mutationSellMult(slot.mutation) *
        sizeSellMult(slot.size);
      lines.push(`Sell: $${Math.round(unit)}`);
      if (slot.keep) {
        lines.push(
          ITEMS[slot.itemId!]?.isMineral
            ? "Favorited — won't sell"
            : "Kept — won't sell"
        );
      }
      if (slot.itemId === "ore_cluster") {
        lines.push("Left-click to open");
      }
    } else if (slot.itemId === "skin_crate" || slot.itemId === "frostpeak_crate") {
      lines.push(def.description);
      lines.push("Left-click to open");
    } else if (slot.itemId === "ore_cluster") {
      lines.push(def.description);
      lines.push("Left-click to open");
    } else {
      lines.push(def.description);
    }

    return lines.join("\n");
  }

  toggle(): void {
    this.visible = !this.visible;
    this.root.setVisible(this.visible);
    if (this.visible) this.refresh();
    else this.tooltip.setVisible(false);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (open) this.refresh();
    else this.tooltip.setVisible(false);
  }

  refresh(): void {
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = this.inventory.hotbar[i];
      const canFavorite =
        !!slot.itemId && isMerchantSellable(slot.itemId);
      const kept = canFavorite && !!slot.keep;
      this.hotbarFrames[i].setStrokeStyle(
        kept ? 3 : 1,
        kept ? KEEP_COLOR : HOTBAR_BORDER
      );

      if (slot.itemId) {
        const def = ITEMS[slot.itemId];
        this.hotbarIcons[i].setTexture(def.textureKey).setVisible(true);
        if (slot.mutation && MUTATIONS[slot.mutation]) {
          applyMutationTint(this.hotbarIcons[i], slot.mutation);
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

    for (let i = 0; i < MAX_INVENTORY_SIZE; i++) {
      const capacity = this.inventory.getBagCapacity();
      const unlocked = i < capacity;
      const slot = this.inventory.bag[i];
      this.slotFrames[i].setVisible(true);
      this.slotHits[i].setVisible(unlocked);
      this.slotHits[i].setActive(unlocked);

      if (!unlocked) {
        this.slotFrames[i].setFillStyle(0x1a1a22, 0.7);
        this.slotFrames[i].setStrokeStyle(1, LOCKED_BORDER);
        this.slotIcons[i].setVisible(false);
        this.slotTexts[i].setText("");
        continue;
      }

      const canFavorite =
        !!slot?.itemId && isMerchantSellable(slot.itemId);
      const kept = canFavorite && !!slot.keep;
      this.slotFrames[i].setFillStyle(0x2f2f3a, 0.95);
      this.slotFrames[i].setStrokeStyle(
        kept ? 3 : 1,
        kept ? KEEP_COLOR : BAG_BORDER
      );

      if (slot?.itemId) {
        const def = ITEMS[slot.itemId];
        const icon = this.slotIcons[i];
        icon.setTexture(def.textureKey).setVisible(true);
        const s = sizeScale(slot.size);
        if (def.displayWidth && def.displayHeight) {
          const fit = Math.min(
            40 / (def.displayWidth * Math.min(s, 1.35)),
            28 / (def.displayHeight * Math.min(s, 1.35))
          );
          icon.setDisplaySize(
            Math.round(def.displayWidth * Math.min(s, 1.35) * fit),
            Math.round(def.displayHeight * Math.min(s, 1.35) * fit)
          );
        } else {
          icon.setDisplaySize(28 * Math.min(s, 1.25), 28 * Math.min(s, 1.25));
        }
        if (slot.mutation && MUTATIONS[slot.mutation]) {
          applyMutationTint(icon, slot.mutation);
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

    const pack = ITEMS[this.inventory.getBackpackId()];
    this.bagLabel.setText(
      `Bag · ${pack.name} (${this.inventory.getBagCapacity()} slots)`
    );
  }
}
