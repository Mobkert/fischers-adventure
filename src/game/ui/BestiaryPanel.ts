import Phaser from "phaser";
import {
  BESTIARY_AREAS,
  BESTIARY_CLAIM_REWARD,
  ITEMS,
  ItemId,
  RARITY_COLOR,
  FishHabitat,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

const PANEL_W = 520;
const PANEL_H = 540;
const GRID_TOP = -118;
const GRID_VIEW_H = 330;
const CELL_W = 140;
const CELL_H = 150;
const COLS = 3;
const GAP = 12;

/** Bestiary opened from hotbar slot 3 — areas, fish, unlock claims. */
export class BestiaryPanel {
  private root: Phaser.GameObjects.Container;
  private gridRoot: Phaser.GameObjects.Container;
  private gridContent: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollTrack: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private progressText: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private areaId: FishHabitat = "ocean";
  private onChanged?: (message: string) => void;
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
      .text(0, -240, "Bestiary", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const subtitle = scene.add
      .text(0, -212, "Catch fish to reveal them · Claim discovery rewards", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.progressText = scene.add
      .text(0, 232, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#c4a86a",
      })
      .setOrigin(0.5);

    this.gridRoot = scene.add.container(0, GRID_TOP);
    this.gridContent = scene.add.container(0, 0);
    this.gridRoot.add(this.gridContent);

    this.maskShape = scene.make.graphics({ x: 0, y: 0 });
    this.redrawMask();
    this.maskShape.setVisible(false);
    this.gridRoot.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = scene.add
      .rectangle(238, GRID_TOP + GRID_VIEW_H / 2, 6, GRID_VIEW_H, 0x2a2f3a, 0.9)
      .setOrigin(0.5);
    this.scrollThumb = scene.add
      .rectangle(238, GRID_TOP + 20, 6, 40, 0xc4a86a, 0.95)
      .setOrigin(0.5);

    this.root.add([
      bg,
      title,
      subtitle,
      this.gridRoot,
      this.scrollTrack,
      this.scrollThumb,
      this.progressText,
    ]);

    this.buildTabs();

    this.wheelHandler = (pointer, _gos, _dx, dy) => {
      if (!this.visible) return;
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

  private buildTabs(): void {
    const tabW = 118;
    const gap = 6;
    // Main row: everything except Ashencast; Ashencast sits under Ocean
    const mainAreas = BESTIARY_AREAS.filter((a) => a.id !== "hotspring");
    const spring = BESTIARY_AREAS.find((a) => a.id === "hotspring");
    const startX = -((mainAreas.length - 1) * (tabW + gap)) / 2;
    const row1Y = -182;
    const row2Y = -150;

    const addTab = (area: (typeof BESTIARY_AREAS)[number], x: number, y: number) => {
      const btn = this.scene.add.container(x, y);
      const bg = this.scene.add
        .rectangle(0, 0, tabW, 26, 0x2a2f3a, 0.95)
        .setStrokeStyle(2, 0x666666)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(0, 0, area.name, {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#dddddd",
        })
        .setOrigin(0.5);
      btn.add([bg, label]);
      bg.on("pointerdown", () => {
        this.areaId = area.id;
        this.scrollY = 0;
        this.refresh();
      });
      this.tabButtons.push(btn);
      this.root.add(btn);
    };

    // Keep tabButtons order aligned with BESTIARY_AREAS for refresh()
    for (const area of BESTIARY_AREAS) {
      if (area.id === "hotspring" && spring) {
        addTab(spring, startX, row2Y);
        continue;
      }
      const i = mainAreas.findIndex((a) => a.id === area.id);
      addTab(area, startX + i * (tabW + gap), row1Y);
    }
  }

  private redrawMask(): void {
    this.maskShape.clear();
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(
      this.panelCx - PANEL_W / 2 + 20,
      this.panelCy + GRID_TOP,
      PANEL_W - 56,
      GRID_VIEW_H
    );
  }

  setOnChanged(cb: (message: string) => void): void {
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
    for (const child of [...this.gridContent.list]) {
      child.destroy(true);
    }

    const area =
      BESTIARY_AREAS.find((a) => a.id === this.areaId) ?? BESTIARY_AREAS[0];

    BESTIARY_AREAS.forEach((a, i) => {
      const btn = this.tabButtons[i];
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      const label = btn.list[1] as Phaser.GameObjects.Text;
      const active = a.id === this.areaId;
      bg.setStrokeStyle(2, active ? 0xc4a86a : 0x666666);
      bg.setFillStyle(active ? 0x3a3428 : 0x2a2f3a, 0.95);
      label.setColor(active ? "#f0e6d2" : "#aaaaaa");
    });

    let found = 0;
    area.fishIds.forEach((id, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const x = (col - (COLS - 1) / 2) * (CELL_W + GAP);
      const y = row * (CELL_H + GAP) + CELL_H / 2;
      this.gridContent.add(this.makeCell(id, x, y));
      if (this.inventory.isBestiaryFound(id)) found++;
    });

    this.contentH = Math.max(
      GRID_VIEW_H,
      Math.ceil(area.fishIds.length / COLS) * (CELL_H + GAP)
    );
    this.progressText.setText(
      `${area.name}: ${found} / ${area.fishIds.length} discovered`
    );
    this.applyScroll();
  }

  private makeCell(fishId: ItemId, x: number, y: number): Phaser.GameObjects.Container {
    const def = ITEMS[fishId];
    const found = this.inventory.isBestiaryFound(fishId);
    const claimed = this.inventory.isBestiaryClaimed(fishId);
    const rarity = def.rarity ?? "common";
    const reward = BESTIARY_CLAIM_REWARD[rarity];
    const cell = this.scene.add.container(x, y);

    const card = this.scene.add
      .rectangle(0, 0, CELL_W, CELL_H, 0x22262e, 0.95)
      .setStrokeStyle(2, found ? Phaser.Display.Color.HexStringToColor(RARITY_COLOR[rarity]).color : 0x444444);

    const icon = this.scene.add.image(0, -28, def.textureKey);
    const maxDim = 56;
    const scale = Math.min(maxDim / icon.width, maxDim / icon.height);
    icon.setScale(scale);
    if (def.facesLeft) icon.setFlipX(true);

    if (found) {
      icon.clearTint();
      icon.setAlpha(1);
    } else {
      // Black silhouette for undiscovered fish
      icon.setTint(0x000000);
      icon.setAlpha(0.92);
    }

    const name = this.scene.add
      .text(0, 22, found ? def.name : "???", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: found ? "#f0e6d2" : "#666666",
        align: "center",
        wordWrap: { width: CELL_W - 12 },
      })
      .setOrigin(0.5);

    const rarityLabel = this.scene.add
      .text(0, 40, found ? rarity : "unknown", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: found ? RARITY_COLOR[rarity] : "#555555",
      })
      .setOrigin(0.5);

    cell.add([card, icon, name, rarityLabel]);

    if (found && !claimed) {
      const claimBtn = this.scene.add
        .rectangle(0, 58, 100, 22, 0x3a5a2a, 1)
        .setStrokeStyle(1, 0x7CFC00)
        .setInteractive({ useHandCursor: true });
      const claimLabel = this.scene.add
        .text(0, 58, `Claim $${reward}`, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#d8ffb0",
        })
        .setOrigin(0.5);
      claimBtn.on("pointerdown", () => {
        const result = this.inventory.claimBestiaryReward(fishId);
        if (result.ok) {
          this.onChanged?.(result.message);
          this.refresh();
        }
      });
      cell.add([claimBtn, claimLabel]);
    } else if (found && claimed) {
      const done = this.scene.add
        .text(0, 58, "Claimed", {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#666666",
        })
        .setOrigin(0.5);
      cell.add(done);
    } else {
      const hint = this.scene.add
        .text(0, 58, "Not caught", {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#555555",
        })
        .setOrigin(0.5);
      cell.add(hint);
    }

    return cell;
  }

  private setScroll(y: number): void {
    const maxScroll = Math.max(0, this.contentH - GRID_VIEW_H);
    this.scrollY = Phaser.Math.Clamp(y, 0, maxScroll);
    this.applyScroll();
  }

  private applyScroll(): void {
    this.gridContent.y = -this.scrollY;
    const maxScroll = Math.max(0, this.contentH - GRID_VIEW_H);
    const trackH = GRID_VIEW_H;
    const thumbH = maxScroll <= 0 ? trackH : Math.max(28, (trackH * trackH) / this.contentH);
    const thumbTravel = trackH - thumbH;
    const t = maxScroll <= 0 ? 0 : this.scrollY / maxScroll;
    this.scrollThumb.setDisplaySize(6, thumbH);
    this.scrollThumb.y = GRID_TOP + thumbH / 2 + t * thumbTravel;
    this.scrollTrack.setVisible(maxScroll > 0);
    this.scrollThumb.setVisible(maxScroll > 0);
  }
}
