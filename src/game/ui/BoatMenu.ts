import Phaser from "phaser";
import { BOAT_IDS, BOATS, BoatId } from "../data/boats";
import { InventorySystem } from "../systems/InventorySystem";

const PANEL_W = 480;
const PANEL_H = 400;
const LIST_TOP = -130;
const LIST_VIEW_H = 280;
const CARD_H = 108;
const CARD_GAP = 10;

/** Scrollable port boat shop — buy once, spawn forever. */
export class BoatMenu {
  private root: Phaser.GameObjects.Container;
  private listRoot: Phaser.GameObjects.Container;
  private listContent: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollTrack: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private coinLabel: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private scrollY = 0;
  private contentH = 0;
  private onSpawn?: (boatId: BoatId) => void;
  private onBuy?: (boatId: BoatId) => void;
  private onChanged?: () => void;
  private wheelHandler: (
    pointer: Phaser.Input.Pointer,
    _gos: unknown,
    _dx: number,
    dy: number
  ) => void;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;
    this.panelCx = scene.scale.width / 2;
    this.panelCy = scene.scale.height / 2;

    this.root = scene.add
      .container(this.panelCx, this.panelCy)
      .setDepth(140)
      .setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x1a1f28, 0.96)
      .setStrokeStyle(2, 0xc4a86a);

    const title = scene.add
      .text(0, -174, "Port — Boats", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.coinLabel = scene.add
      .text(0, -146, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    this.listRoot = scene.add.container(0, LIST_TOP);
    this.listContent = scene.add.container(0, 0);
    this.listRoot.add(this.listContent);

    this.maskShape = scene.make.graphics({ x: 0, y: 0 });
    this.redrawMask();
    this.maskShape.setVisible(false);
    this.listRoot.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = scene.add
      .rectangle(216, LIST_TOP + LIST_VIEW_H / 2, 6, LIST_VIEW_H, 0x2a2f3a, 0.9)
      .setOrigin(0.5)
      .setVisible(false);
    this.scrollThumb = scene.add
      .rectangle(216, LIST_TOP, 6, 40, 0xc4a86a, 0.85)
      .setOrigin(0.5, 0)
      .setVisible(false);

    const hint = scene.add
      .text(0, 178, "B / Esc to close · Mouse wheel to scroll", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#777777",
      })
      .setOrigin(0.5);

    this.root.add([
      bg,
      title,
      this.coinLabel,
      this.listRoot,
      this.scrollTrack,
      this.scrollThumb,
      hint,
    ]);

    this.wheelHandler = (pointer, _gos, _dx, dy) => {
      if (!this.visible) return;
      const localX = pointer.x - this.panelCx;
      const localY = pointer.y - this.panelCy;
      if (Math.abs(localX) > PANEL_W / 2 || Math.abs(localY) > PANEL_H / 2) {
        return;
      }
      this.setScroll(this.scrollY + dy * 0.5);
    };
    scene.input.on("wheel", this.wheelHandler);
  }

  setOnSpawn(cb: (boatId: BoatId) => void): void {
    this.onSpawn = cb;
  }

  setOnBuy(cb: (boatId: BoatId) => void): void {
    this.onBuy = cb;
  }

  setOnChanged(cb: () => void): void {
    this.onChanged = cb;
  }

  toggle(): void {
    this.setOpen(!this.visible);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (open) {
      this.scrollY = 0;
      this.redrawMask();
      this.refresh();
    }
  }

  refresh(): void {
    for (const child of [...this.listContent.list]) {
      child.destroy(true);
    }
    this.coinLabel.setText(
      `Your coins: $${this.inventory.coins.toLocaleString("en-US")}`
    );

    let y = 0;
    for (const id of BOAT_IDS) {
      this.listContent.add(this.makeCard(id, y));
      y += CARD_H + CARD_GAP;
    }
    this.contentH = Math.max(0, y - CARD_GAP);
    this.applyScroll();
  }

  private makeCard(boatId: BoatId, y: number): Phaser.GameObjects.Container {
    const def = BOATS[boatId];
    const owned = this.inventory.ownsBoat(boatId);

    const card = this.scene.add
      .rectangle(0, y, 420, CARD_H, owned ? 0x243040 : 0x2a3140, 0.95)
      .setStrokeStyle(2, owned ? 0x7ec8e3 : 0x8b7355)
      .setOrigin(0.5, 0);

    const icon = this.scene.add
      .image(-140, y + CARD_H / 2, def.iconKey)
      .setDisplaySize(96, 40);

    const name = this.scene.add
      .text(-70, y + 14, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0, 0);

    const speedLine = `Speed  ${def.maxSpeed} · ${def.hasSail ? "Sail" : "Motor"}`;
    const desc = this.scene.add
      .text(-70, y + 42, `${def.description}\n${speedLine}`, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c8c8c8",
        lineSpacing: 3,
        wordWrap: { width: 200 },
      })
      .setOrigin(0, 0);

    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, desc]);

    if (owned) {
      const tag = this.scene.add
        .text(140, y + 28, "Owned", {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#7ec8e3",
        })
        .setOrigin(0.5);
      const btn = this.scene.add
        .rectangle(140, y + 68, 110, 34, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(140, y + 68, "Spawn", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        this.onSpawn?.(boatId);
        this.setOpen(false);
      });
      row.add([tag, btn, label]);
    } else {
      const price = this.scene.add
        .text(140, y + 28, `$${def.buyPrice.toLocaleString("en-US")}`, {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      const canAfford = this.inventory.coins >= def.buyPrice;
      const btn = this.scene.add
        .rectangle(140, y + 68, 110, 34, canAfford ? 0x4a3d6b : 0x3a3a44)
        .setStrokeStyle(1, canAfford ? 0xb48cff : 0x666666)
        .setInteractive({ useHandCursor: canAfford });
      const label = this.scene.add
        .text(140, y + 68, "Buy", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: canAfford ? "#ffffff" : "#888888",
        })
        .setOrigin(0.5);
      if (canAfford) {
        btn.on("pointerover", () => btn.setFillStyle(0x5c4a82));
        btn.on("pointerout", () => btn.setFillStyle(0x4a3d6b));
        btn.on("pointerdown", () => {
          this.onBuy?.(boatId);
          this.refresh();
          this.onChanged?.();
        });
      }
      row.add([price, btn, label]);
    }

    return row;
  }

  private redrawMask(): void {
    this.maskShape.clear();
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(
      this.panelCx - PANEL_W / 2 + 20,
      this.panelCy + LIST_TOP,
      PANEL_W - 50,
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
    const showBar = max > 0;
    this.scrollTrack.setVisible(showBar);
    this.scrollThumb.setVisible(showBar);
    if (!showBar) return;
    const thumbH = Math.max(28, (LIST_VIEW_H / this.contentH) * LIST_VIEW_H);
    const trackTravel = LIST_VIEW_H - thumbH;
    const thumbY =
      LIST_TOP + (max > 0 ? (this.scrollY / max) * trackTravel : 0);
    this.scrollThumb.setY(thumbY);
    this.scrollThumb.setSize(6, thumbH);
  }
}
