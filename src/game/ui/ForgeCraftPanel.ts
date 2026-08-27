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
  "starweaver_rod",
];

const PANEL_W = 460;
const PANEL_H = 520;
const LIST_TOP = -130;
const LIST_VIEW_H = 340;
const ROW_H = 68;
const ROW_GAP = 10;

/** Ashencast forge — pick a rod, review ingredients, craft. */
export class ForgeCraftPanel {
  private root: Phaser.GameObjects.Container;
  private listShell: Phaser.GameObjects.Container;
  private listContent: Phaser.GameObjects.Container;
  private detailRoot: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollTrack: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private open = false;
  private onClose?: () => void;
  private onCrafted?: () => void;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  private statusText?: Phaser.GameObjects.Text;
  private scrollY = 0;
  private contentH = 0;
  private wheelHandler: (
    pointer: Phaser.Input.Pointer,
    _gos: unknown,
    _dx: number,
    dy: number
  ) => void;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.panelCx = w / 2;
    this.panelCy = h / 2;

    this.root = scene.add
      .container(this.panelCx, this.panelCy)
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
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x1a1210, 0.96)
      .setStrokeStyle(2, 0xc45a3a);

    const title = scene.add
      .text(0, -228, "Ashencast Forge", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#ffcc99",
      })
      .setOrigin(0.5);
    const sub = scene.add
      .text(0, -192, "Select a rod to forge · Scroll for more", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#a89080",
      })
      .setOrigin(0.5);
    const hint = scene.add
      .text(0, 232, "ESC / F — Close · Mouse wheel to scroll", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#887868",
      })
      .setOrigin(0.5);

    this.listShell = scene.add.container(0, LIST_TOP);
    this.listContent = scene.add.container(0, 0);
    this.listShell.add(this.listContent);

    this.maskShape = scene.make.graphics({ x: 0, y: 0 });
    this.redrawMask();
    this.maskShape.setVisible(false);
    this.listShell.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = scene.add
      .rectangle(210, LIST_TOP + LIST_VIEW_H / 2, 6, LIST_VIEW_H, 0x2a2018, 0.9)
      .setOrigin(0.5)
      .setVisible(false);
    this.scrollThumb = scene.add
      .rectangle(210, LIST_TOP, 6, 40, 0xc45a3a, 0.9)
      .setOrigin(0.5, 0)
      .setVisible(false);

    this.detailRoot = scene.add.container(0, 0);
    this.detailRoot.setVisible(false);

    this.root.add([
      dim,
      bg,
      title,
      sub,
      this.listShell,
      this.scrollTrack,
      this.scrollThumb,
      this.detailRoot,
      hint,
    ]);

    this.wheelHandler = (pointer, _gos, _dx, dy) => {
      if (!this.open || !this.listShell.visible) return;
      const localX = pointer.x - this.panelCx;
      const localY = pointer.y - this.panelCy;
      if (
        Math.abs(localX) > PANEL_W / 2 ||
        Math.abs(localY) > PANEL_H / 2
      ) {
        return;
      }
      this.setScroll(this.scrollY + dy * 0.5);
    };
    scene.input.on("wheel", this.wheelHandler);

    this.buildList();
  }

  setOnCrafted(cb: () => void): void {
    this.onCrafted = cb;
  }

  private redrawMask(): void {
    this.maskShape.clear();
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(
      this.panelCx - PANEL_W / 2 + 20,
      this.panelCy + LIST_TOP,
      PANEL_W - 56,
      LIST_VIEW_H
    );
  }

  private maxScroll(): number {
    return Math.max(0, this.contentH - LIST_VIEW_H);
  }

  private setScroll(y: number): void {
    this.scrollY = Phaser.Math.Clamp(y, 0, this.maxScroll());
    this.applyScroll();
  }

  private applyScroll(): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll());
    this.listContent.setY(-this.scrollY);
    const max = this.maxScroll();
    const showBar = max > 0 && this.listShell.visible;
    this.scrollTrack.setVisible(showBar);
    this.scrollThumb.setVisible(showBar);
    if (!showBar) return;
    const thumbH = Math.max(28, (LIST_VIEW_H / this.contentH) * LIST_VIEW_H);
    const trackTravel = LIST_VIEW_H - thumbH;
    this.scrollThumb.setSize(6, thumbH);
    this.scrollThumb.setY(
      LIST_TOP + (max > 0 ? (this.scrollY / max) * trackTravel : 0)
    );
  }

  private buildList(): void {
    for (const child of [...this.listContent.list]) {
      child.destroy(true);
    }

    let y = 0;
    for (const id of FORGE_ROD_IDS) {
      this.addRodRow(id, y);
      y += ROW_H + ROW_GAP;
    }
    this.contentH = Math.max(0, y - ROW_GAP);
    this.applyScroll();
  }

  /** Flat hit target (no nested container) so Phaser picks up clicks reliably. */
  private addRodRow(id: ItemId, y: number): void {
    const def = ITEMS[id];
    const owned = this.inventory.ownsRod(id);
    const cy = y + ROW_H / 2;
    const hit = this.scene.add
      .rectangle(0, cy, 400, ROW_H, owned ? 0x2a3428 : 0x2a2018, 0.95)
      .setStrokeStyle(1, owned ? 0x6a9a5a : 0x8a6040)
      .setInteractive({ useHandCursor: true });
    const icon = this.scene.add
      .image(-160, cy, def.textureKey)
      .setDisplaySize(44, 44);
    const name = this.scene.add
      .text(-120, cy - 12, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#ffe8d0",
      })
      .setOrigin(0, 0.5);
    const tag = this.scene.add
      .text(-120, cy + 14, owned ? "Owned" : "Tap for recipe", {
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

    this.listContent.add([hit, icon, name, tag]);
  }

  private ingredientLabel(ing: BobberCraftIngredient): string {
    return formatCraftIngredientLabel(ing);
  }

  private setListVisible(visible: boolean): void {
    this.listShell.setVisible(visible);
    if (!visible) {
      this.scrollTrack.setVisible(false);
      this.scrollThumb.setVisible(false);
    } else {
      this.applyScroll();
    }
  }

  private showDetail(id: ItemId): void {
    this.detailRoot.removeAll(true);
    this.setListVisible(false);
    this.detailRoot.setVisible(true);

    const def = ITEMS[id];
    const owned = this.inventory.ownsRod(id);
    const cost = def.craftCost;

    const back = this.scene.add
      .text(-200, -200, "← Back", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c4a890",
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      this.detailRoot.setVisible(false);
      this.setListVisible(true);
      this.buildList();
    });

    const icon = this.scene.add
      .image(-150, -155, def.textureKey)
      .setDisplaySize(56, 56);
    const name = this.scene.add
      .text(-110, -168, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#ffe8d0",
      })
      .setOrigin(0, 0.5);
    const desc = this.scene.add
      .text(-110, -140, def.description, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#b8a090",
        wordWrap: { width: 280 },
      })
      .setOrigin(0, 0);

    const needTitle = this.scene.add
      .text(0, -55, "Materials needed  ·  size & extra mutations OK", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffcc99",
      })
      .setOrigin(0.5);

    this.detailRoot.add([back, icon, name, desc, needTitle]);

    let y = -28;
    if (cost) {
      if (cost.coins > 0) {
        const haveCoins = this.inventory.coins >= cost.coins;
        const coinLine = this.scene.add
          .text(
            0,
            y,
            `$${cost.coins.toLocaleString()}  (you have $${this.inventory.coins.toLocaleString()})`,
            {
              fontFamily: "Arial",
              fontSize: "14px",
              color: haveCoins ? "#8fca7a" : "#e89070",
            }
          )
          .setOrigin(0.5);
        this.detailRoot.add(coinLine);
        y += 26;
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
        y += 26;
      }
    }

    this.statusText = this.scene.add
      .text(0, y + 4, "", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#e8d8c8",
      })
      .setOrigin(0.5);
    this.detailRoot.add(this.statusText);

    const btnY = Math.min(Math.max(y + 32, 140), 198);
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
    this.scrollY = 0;
    this.redrawMask();
    this.setListVisible(true);
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
    this.scene.input.off("wheel", this.wheelHandler);
    this.listShell.clearMask(true);
    this.maskShape.destroy();
    this.root.destroy(true);
  }
}
