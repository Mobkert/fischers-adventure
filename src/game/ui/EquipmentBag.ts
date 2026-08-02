import Phaser from "phaser";
import { ITEMS, ItemId, formatRodStats, ZERO_ROD_STATS, MUTATIONS } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

const PANEL_W = 460;
const PANEL_H = 520;
const LIST_TOP = -170;
const LIST_VIEW_H = 380;
const ROW_H = 136;
const ROW_GAP = 12;

/** Vertical rod list opened from hotbar slot 2. */
export class EquipmentBag {
  private root: Phaser.GameObjects.Container;
  private listRoot: Phaser.GameObjects.Container;
  private listContent: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollTrack: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private onChanged?: () => void;
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

    this.panelCx = scene.scale.width / 2;
    this.panelCy = scene.scale.height / 2 - 10;

    this.root = scene.add
      .container(this.panelCx, this.panelCy)
      .setDepth(145)
      .setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x1a1c22, 0.96)
      .setStrokeStyle(2, 0xc4a86a);

    const title = scene.add
      .text(0, -230, "Equipment Bag", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const subtitle = scene.add
      .text(0, -198, "Your rods · Equip swaps hotbar slot 1 · Scroll for more", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.listRoot = scene.add.container(0, LIST_TOP);
    this.listContent = scene.add.container(0, 0);
    this.listRoot.add(this.listContent);

    // World-space mask for the list viewport
    this.maskShape = scene.make.graphics({ x: 0, y: 0 });
    this.redrawMask();
    this.maskShape.setVisible(false);
    this.listRoot.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = scene.add
      .rectangle(210, LIST_TOP + LIST_VIEW_H / 2, 6, LIST_VIEW_H, 0x2a2f3a, 0.9)
      .setOrigin(0.5)
      .setVisible(false);
    this.scrollThumb = scene.add
      .rectangle(210, LIST_TOP, 6, 40, 0xc4a86a, 0.85)
      .setOrigin(0.5, 0)
      .setVisible(false);

    const hint = scene.add
      .text(0, 232, "2 / Esc to close · Mouse wheel to scroll", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#777777",
      })
      .setOrigin(0.5);

    this.root.add([
      bg,
      title,
      subtitle,
      this.listRoot,
      this.scrollTrack,
      this.scrollThumb,
      hint,
    ]);

    this.wheelHandler = (pointer, _gos, _dx, dy) => {
      if (!this.visible) return;
      // Only scroll when pointer is over the panel
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

    const rods = this.inventory.getOwnedRods();
    let y = 0;

    if (rods.length === 0) {
      const empty = this.scene.add
        .text(0, 80, "No rods yet.", {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#888888",
        })
        .setOrigin(0.5);
      this.listContent.add(empty);
      this.contentH = LIST_VIEW_H;
      this.applyScroll();
      return;
    }

    for (const rodId of rods) {
      this.listContent.add(this.makeRow(rodId, y, ROW_H));
      y += ROW_H + ROW_GAP;
    }

    this.contentH = Math.max(0, y - ROW_GAP);
    this.applyScroll();
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

  private makeRow(
    rodId: ItemId,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[rodId];
    const stats = def.rodStats ?? ZERO_ROD_STATS;
    const equipped = this.inventory.equippedRodId === rodId;

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);

    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(56, 56);

    const name = this.scene.add
      .text(-112, y + 12, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0);

    const statsLines = formatRodStats(stats);
    const mutLine =
      def.rodMutation && MUTATIONS[def.rodMutation.mutation]
        ? `\n${MUTATIONS[def.rodMutation.mutation].name}  ${Math.round(def.rodMutation.chance * 100)}%  ·  ${MUTATIONS[def.rodMutation.mutation].sellMult}× sell`
        : "";
    const statsText = this.scene.add
      .text(-112, y + 42, statsLines + mutLine, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#c8c8c8",
        lineSpacing: 3,
      })
      .setOrigin(0, 0);

    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, statsText]);

    if (!equipped) {
      const btn = this.scene.add
        .rectangle(140, y + rowH / 2, 100, 36, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(140, y + rowH / 2, "Equip", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        if (this.inventory.equipRod(rodId)) {
          this.refresh();
          this.onChanged?.();
        }
      });
      row.add([btn, label]);
    } else {
      const tag = this.scene.add
        .text(140, y + rowH / 2 - 8, "Equipped", {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      const note = this.scene.add
        .text(140, y + rowH / 2 + 12, "on hotbar 1", {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#aaa088",
        })
        .setOrigin(0.5);
      row.add([tag, note]);
    }

    return row;
  }
}
