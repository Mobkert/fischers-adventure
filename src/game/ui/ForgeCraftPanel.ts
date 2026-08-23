import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  formatCraftIngredientLabel,
  BobberCraftIngredient,
  getCraftIngredientIconKey,
  fitCraftIngredientIconSize,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

const FORGE_ROD_IDS: ItemId[] = [
  "tranquil_rod",
  "recoil_rod",
  "portal_rod",
  "forge_rod",
];

/** Ashencast forge — pick a rod, review ingredients, craft. */
export class ForgeCraftPanel {
  private root: Phaser.GameObjects.Container;
  private listRoot: Phaser.GameObjects.Container;
  private detailRoot: Phaser.GameObjects.Container;
  private open = false;
  private onClose?: () => void;
  private onCrafted?: () => void;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private statusText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.root = scene.add
      .container(w / 2, h / 2)
      .setScrollFactor(0)
      .setDepth(200);
    this.root.setVisible(false);

    const dim = scene.add
      .rectangle(0, 0, w + 40, h + 40, 0x000000, 0.45)
      .setInteractive();
    dim.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
    });

    const bg = scene.add
      .rectangle(0, 0, 460, 520, 0x1a1210, 0.96)
      .setStrokeStyle(2, 0xc45a3a);

    const title = scene.add
      .text(0, -168, "Ashencast Forge", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#ffcc99",
      })
      .setOrigin(0.5);
    const hint = scene.add
      .text(0, 228, "ESC / F — Close", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#887868",
      })
      .setOrigin(0.5);

    this.listRoot = scene.add.container(0, 0);
    this.detailRoot = scene.add.container(0, 0);
    this.detailRoot.setVisible(false);

    this.root.add([dim, bg, title, this.listRoot, this.detailRoot, hint]);
    this.buildList();
  }

  setOnCrafted(cb: () => void): void {
    this.onCrafted = cb;
  }

  private buildList(): void {
    this.listRoot.removeAll(true);
    const sub = this.scene.add
      .text(0, -118, "Select a rod to forge", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#a89080",
      })
      .setOrigin(0.5);
    this.listRoot.add(sub);

    let y = -60;
    for (const id of FORGE_ROD_IDS) {
      this.addRodRow(id, y);
      y += 78;
    }
  }

  /** Flat hit target (no nested container) so Phaser picks up clicks reliably. */
  private addRodRow(id: ItemId, y: number): void {
    const def = ITEMS[id];
    const owned = this.inventory.ownsRod(id);
    const hit = this.scene.add
      .rectangle(0, y, 400, 68, owned ? 0x2a3428 : 0x2a2018, 0.95)
      .setStrokeStyle(1, owned ? 0x6a9a5a : 0x8a6040)
      .setInteractive({ useHandCursor: true });
    const icon = this.scene.add
      .image(-160, y, def.textureKey)
      .setDisplaySize(44, 44);
    const name = this.scene.add
      .text(-120, y - 12, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#ffe8d0",
      })
      .setOrigin(0, 0.5);
    const tag = this.scene.add
      .text(-120, y + 14, owned ? "Owned" : "Tap for recipe", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: owned ? "#8fca7a" : "#c4a890",
      })
      .setOrigin(0, 0.5);

    hit.on("pointerover", () =>
      hit.setFillStyle(owned ? 0x354830 : 0x3a2c20, 0.95)
    );
    hit.on("pointerout", () =>
      hit.setFillStyle(owned ? 0x2a3428 : 0x2a2018, 0.95)
    );
    hit.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      this.showDetail(id);
    });

    this.listRoot.add([hit, icon, name, tag]);
  }

  private ingredientLabel(ing: BobberCraftIngredient): string {
    return formatCraftIngredientLabel(ing);
  }

  private showDetail(id: ItemId): void {
    this.detailRoot.removeAll(true);
    this.listRoot.setVisible(false);
    this.detailRoot.setVisible(true);

    const def = ITEMS[id];
    const owned = this.inventory.ownsRod(id);
    const cost = def.craftCost;

    const back = this.scene.add
      .text(-200, -118, "← Back", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c4a890",
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      this.detailRoot.setVisible(false);
      this.listRoot.setVisible(true);
      this.buildList();
    });

    const icon = this.scene.add
      .image(-150, -70, def.textureKey)
      .setDisplaySize(56, 56);
    const name = this.scene.add
      .text(-110, -82, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#ffe8d0",
      })
      .setOrigin(0, 0.5);
    const desc = this.scene.add
      .text(-110, -52, def.description, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#b8a090",
        wordWrap: { width: 280 },
      })
      .setOrigin(0, 0);

    const needTitle = this.scene.add
      .text(0, -8, "Materials needed  ·  size & extra mutations OK", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffcc99",
      })
      .setOrigin(0.5);

    this.detailRoot.add([back, icon, name, desc, needTitle]);

    let y = 22;
    if (cost) {
      if (cost.coins > 0) {
        const haveCoins = this.inventory.coins >= cost.coins;
        const coinLine = this.scene.add
          .text(0, y, `$${cost.coins.toLocaleString()}  (you have $${this.inventory.coins.toLocaleString()})`, {
            fontFamily: "Arial",
            fontSize: "14px",
            color: haveCoins ? "#8fca7a" : "#e89070",
          })
          .setOrigin(0.5);
        this.detailRoot.add(coinLine);
        y += 28;
      }
      for (const ing of cost.ingredients) {
        const have = this.inventory.countIngredientMatching(ing);
        const ok = have >= ing.count;
        const line = this.scene.add
          .text(
            0,
            y,
            `${this.ingredientLabel(ing)}  (${have}/${ing.count})`,
            {
              fontFamily: "Arial",
              fontSize: "14px",
              color: ok ? "#8fca7a" : "#e89070",
            }
          )
          .setOrigin(0.5);
        const iconKey = getCraftIngredientIconKey(ing);
        const [tw, th] = fitCraftIngredientIconSize(this.scene, ing, 40, 28);
        const thumb = this.scene.add
          .image(-190, y, iconKey)
          .setDisplaySize(tw, th);
        this.detailRoot.add([thumb, line]);
        y += 28;
      }
    }

    this.statusText = this.scene.add
      .text(0, y + 6, "", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#e8d8c8",
      })
      .setOrigin(0.5);
    this.detailRoot.add(this.statusText);

    const btnY = Math.max(y + 36, 140);
    const btn = this.scene.add
      .rectangle(0, btnY, 160, 40, owned ? 0x3a3a44 : 0x3d6b4f)
      .setStrokeStyle(1, 0xc4a86a)
      .setInteractive({ useHandCursor: !owned });
    const btnLabel = this.scene.add
      .text(0, btnY, owned ? "Owned" : "Craft", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#fff8e8",
      })
      .setOrigin(0.5);
    if (!owned) {
      btn.on("pointerdown", (p: Phaser.Input.Pointer) => {
        p.event?.stopPropagation?.();
        const result = this.inventory.craftForgeRod(id);
        this.statusText?.setText(result.message);
        this.statusText?.setColor(result.ok ? "#8fca7a" : "#e89070");
        if (result.ok) {
          this.onCrafted?.();
          this.showDetail(id);
          this.buildList();
        }
      });
    }
    this.detailRoot.add([btn, btnLabel]);
  }

  isOpen(): boolean {
    return this.open;
  }

  get visible(): boolean {
    return this.open;
  }

  show(onClose?: () => void): void {
    this.onClose = onClose;
    this.open = true;
    this.detailRoot.setVisible(false);
    this.listRoot.setVisible(true);
    this.buildList();
    this.root.setVisible(true);
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.root.setVisible(false);
    const cb = this.onClose;
    this.onClose = undefined;
    cb?.();
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
