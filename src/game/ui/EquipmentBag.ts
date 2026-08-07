import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  formatRodStats,
  formatBobberStats,
  MUTATIONS,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

const PANEL_W = 460;
const PANEL_H = 520;
const LIST_TOP = -150;
const LIST_VIEW_H = 360;
const ROW_H = 136;
const BOBBER_ROW_H = 118;
const ROW_GAP = 12;

const AMULET_ROW_H = 100;
const HAT_ROW_H = 96;

type BagTab = "rods" | "bobbers" | "amulets" | "hats";

/** Vertical rod / bobber / amulet / hat list opened from hotbar slot 2. */
export class EquipmentBag {
  private root: Phaser.GameObjects.Container;
  private listRoot: Phaser.GameObjects.Container;
  private listContent: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollTrack: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private subtitle!: Phaser.GameObjects.Text;
  private tabRodsBg!: Phaser.GameObjects.Rectangle;
  private tabBobbersBg!: Phaser.GameObjects.Rectangle;
  private tabAmuletsBg!: Phaser.GameObjects.Rectangle;
  private tabHatsBg!: Phaser.GameObjects.Rectangle;
  private tabRodsLabel!: Phaser.GameObjects.Text;
  private tabBobbersLabel!: Phaser.GameObjects.Text;
  private tabAmuletsLabel!: Phaser.GameObjects.Text;
  private tabHatsLabel!: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private tab: BagTab = "rods";
  private onChanged?: (message: string) => void;
  private onAmuletUsed?: (amuletId: ItemId) => void;
  private onHatChanged?: () => void;
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

    this.subtitle = scene.add
      .text(0, -172, "Your rods · Equip swaps hotbar slot 1", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Tabs — four across
    this.tabRodsBg = scene.add
      .rectangle(-162, -200, 96, 28, 0x3a3428, 0.95)
      .setStrokeStyle(2, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    this.tabRodsLabel = scene.add
      .text(-162, -200, "Rods", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);
    this.tabBobbersBg = scene.add
      .rectangle(-54, -200, 96, 28, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.tabBobbersLabel = scene.add
      .text(-54, -200, "Bobbers", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    this.tabAmuletsBg = scene.add
      .rectangle(54, -200, 96, 28, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.tabAmuletsLabel = scene.add
      .text(54, -200, "Amulets", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    this.tabHatsBg = scene.add
      .rectangle(162, -200, 96, 28, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.tabHatsLabel = scene.add
      .text(162, -200, "Hats", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.tabRodsBg.on("pointerdown", () => this.setTab("rods"));
    this.tabBobbersBg.on("pointerdown", () => this.setTab("bobbers"));
    this.tabAmuletsBg.on("pointerdown", () => this.setTab("amulets"));
    this.tabHatsBg.on("pointerdown", () => this.setTab("hats"));

    this.listRoot = scene.add.container(0, LIST_TOP);
    this.listContent = scene.add.container(0, 0);
    this.listRoot.add(this.listContent);

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
      this.tabRodsBg,
      this.tabRodsLabel,
      this.tabBobbersBg,
      this.tabBobbersLabel,
      this.tabAmuletsBg,
      this.tabAmuletsLabel,
      this.tabHatsBg,
      this.tabHatsLabel,
      this.subtitle,
      this.listRoot,
      this.scrollTrack,
      this.scrollThumb,
      hint,
    ]);

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

  private setTab(tab: BagTab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.scrollY = 0;
    this.refresh();
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

  setOnChanged(cb: (message: string) => void): void {
    this.onChanged = cb;
  }

  setOnAmuletUsed(cb: (amuletId: ItemId) => void): void {
    this.onAmuletUsed = cb;
  }

  setOnHatChanged(cb: () => void): void {
    this.onHatChanged = cb;
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

    const styleTab = (
      bg: Phaser.GameObjects.Rectangle,
      label: Phaser.GameObjects.Text,
      active: boolean
    ) => {
      bg.setStrokeStyle(2, active ? 0xc4a86a : 0x666666);
      bg.setFillStyle(active ? 0x3a3428 : 0x2a2f3a, 0.95);
      label.setColor(active ? "#f0e6d2" : "#aaaaaa");
    };
    styleTab(this.tabRodsBg, this.tabRodsLabel, this.tab === "rods");
    styleTab(this.tabBobbersBg, this.tabBobbersLabel, this.tab === "bobbers");
    styleTab(this.tabAmuletsBg, this.tabAmuletsLabel, this.tab === "amulets");
    styleTab(this.tabHatsBg, this.tabHatsLabel, this.tab === "hats");

    this.subtitle.setText(
      this.tab === "rods"
        ? "Your rods · Equip swaps hotbar slot 1"
        : this.tab === "bobbers"
          ? "Your bobbers · Equip for the next cast"
          : this.tab === "amulets"
            ? "Amulets · Use to change weather or time"
            : "Hats · Wear cosmetics on your head"
    );

    let y = 0;
    if (this.tab === "rods") {
      const rods = this.inventory.getOwnedRods();
      if (rods.length === 0) {
        this.listContent.add(
          this.scene.add
            .text(0, 80, "No rods yet.", {
              fontFamily: "Arial",
              fontSize: "16px",
              color: "#888888",
            })
            .setOrigin(0.5)
        );
        this.contentH = LIST_VIEW_H;
        this.applyScroll();
        return;
      }
      for (const rodId of rods) {
        this.listContent.add(this.makeRodRow(rodId, y, ROW_H));
        y += ROW_H + ROW_GAP;
      }
    } else if (this.tab === "bobbers") {
      const bobbers = this.inventory.getOwnedBobbers();
      if (bobbers.length === 0) {
        this.listContent.add(
          this.scene.add
            .text(0, 80, "No bobbers yet.", {
              fontFamily: "Arial",
              fontSize: "16px",
              color: "#888888",
            })
            .setOrigin(0.5)
        );
        this.contentH = LIST_VIEW_H;
        this.applyScroll();
        return;
      }
      for (const bobberId of bobbers) {
        this.listContent.add(this.makeBobberRow(bobberId, y, BOBBER_ROW_H));
        y += BOBBER_ROW_H + ROW_GAP;
      }
    } else if (this.tab === "amulets") {
      const amulets = this.inventory.getOwnedAmulets();
      if (amulets.length === 0) {
        this.listContent.add(
          this.scene.add
            .text(0, 80, "No amulets yet.\nClimb the rope past the swamp pond.", {
              fontFamily: "Arial",
              fontSize: "15px",
              color: "#888888",
              align: "center",
            })
            .setOrigin(0.5)
        );
        this.contentH = LIST_VIEW_H;
        this.applyScroll();
        return;
      }
      for (const { id, count } of amulets) {
        this.listContent.add(this.makeAmuletRow(id, count, y, AMULET_ROW_H));
        y += AMULET_ROW_H + ROW_GAP;
      }
    } else {
      const hats = this.inventory.getOwnedHats();
      // Unequip row
      this.listContent.add(this.makeHatNoneRow(y, HAT_ROW_H));
      y += HAT_ROW_H + ROW_GAP;
      for (const hatId of hats) {
        this.listContent.add(this.makeHatRow(hatId, y, HAT_ROW_H));
        y += HAT_ROW_H + ROW_GAP;
      }
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

  private fitIcon(key: string, maxSide: number): [number, number] {
    const tex = this.scene.textures.get(key);
    const frame = tex?.get();
    const nw = Math.max(1, frame?.width ?? maxSide);
    const nh = Math.max(1, frame?.height ?? maxSide);
    const scale = Math.min(maxSide / nw, maxSide / nh);
    return [Math.round(nw * scale), Math.round(nh * scale)];
  }

  private makeRodRow(
    rodId: ItemId,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[rodId];
    const stats = this.inventory.getRodDisplayStats(rodId);
    const equipped = this.inventory.equippedRodId === rodId;

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);

    const iconKey = this.inventory.getRodTextureKey(rodId);
    const [iw, ih] = this.fitIcon(iconKey, 56);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, iconKey)
      .setDisplaySize(iw, ih);

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
    const worldMutLine = def.grantsWorldMutations
      ? "\nWorld mutations on catch (normal rates)"
      : "";
    const augmentLine =
      rodId === "augment_rod"
        ? "\n7.5% chance to upgrade a stat on catch"
        : "";
    const burstLine =
      def.rodMinigamePower === "crystal_burst"
        ? "\n15% crystal burst every 0.5s in catch"
        : "";
    const statsText = this.scene.add
      .text(
        -112,
        y + 42,
        statsLines + mutLine + worldMutLine + augmentLine + burstLine,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#c8c8c8",
          lineSpacing: 3,
        }
      )
      .setOrigin(0, 0);

    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, statsText]);

    const hasSkinBtn = rodId === "crystal_rod";
    const equipY = hasSkinBtn ? y + rowH / 2 + 18 : y + rowH / 2;

    if (hasSkinBtn) {
      const owned = this.inventory.crystalRodSkinOwned;
      const active = this.inventory.crystalRodSkinActive;
      const skinBtn = this.scene.add
        .rectangle(
          140,
          y + rowH / 2 - 22,
          100,
          30,
          owned ? (active ? 0x4a3a68 : 0x3a4a6b) : 0x2a2a32
        )
        .setStrokeStyle(1, owned ? 0xb8a0e0 : 0x555555);
      const skinLabel = this.scene.add
        .text(
          140,
          y + rowH / 2 - 22,
          owned ? (active ? "Skin On" : "Skin") : "Skin ✕",
          {
            fontFamily: "Arial",
            fontSize: "13px",
            color: owned ? "#ffffff" : "#777777",
          }
        )
        .setOrigin(0.5);
      if (owned) {
        skinBtn.setInteractive({ useHandCursor: true });
        skinBtn.on("pointerover", () =>
          skinBtn.setFillStyle(active ? 0x5a4a78 : 0x4a5a7b)
        );
        skinBtn.on("pointerout", () =>
          skinBtn.setFillStyle(active ? 0x4a3a68 : 0x3a4a6b)
        );
        skinBtn.on("pointerdown", () => {
          const result = this.inventory.toggleCrystalRodSkin();
          this.refresh();
          this.onChanged?.(result.message);
        });
      }
      row.add([skinBtn, skinLabel]);
    }

    if (!equipped) {
      const btn = this.scene.add
        .rectangle(140, equipY, 100, 36, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(140, equipY, "Equip", {
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
          this.onChanged?.(`Equipped ${ITEMS[rodId].name}`);
        }
      });
      row.add([btn, label]);
    } else {
      const tag = this.scene.add
        .text(140, equipY - (hasSkinBtn ? 0 : 8), "Equipped", {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      if (!hasSkinBtn) {
        const note = this.scene.add
          .text(140, equipY + 12, "on hotbar 1", {
            fontFamily: "Arial",
            fontSize: "11px",
            color: "#aaa088",
          })
          .setOrigin(0.5);
        row.add([tag, note]);
      } else {
        row.add(tag);
      }
    }

    return row;
  }

  private makeBobberRow(
    bobberId: ItemId,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[bobberId];
    const equipped = this.inventory.getEquippedBobberId() === bobberId;

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);

    const [iw, ih] = this.fitIcon(def.textureKey, 52);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(iw, ih);

    const name = this.scene.add
      .text(-112, y + 14, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0);

    const statsText = this.scene.add
      .text(-112, y + 42, formatBobberStats(def), {
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
        if (this.inventory.equipBobber(bobberId)) {
          this.refresh();
          this.onChanged?.(`Equipped ${ITEMS[bobberId].name}`);
        }
      });
      row.add([btn, label]);
    } else {
      const tag = this.scene.add
        .text(140, y + rowH / 2, "Equipped", {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      row.add(tag);
    }

    return row;
  }

  private makeHatNoneRow(
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const equipped = this.inventory.getEquippedHatId() === null;
    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);
    const name = this.scene.add
      .text(-150, y + rowH / 2, "No hat", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0.5);
    const row = this.scene.add.container(0, 0);
    row.add([card, name]);
    if (!equipped) {
      const btn = this.scene.add
        .rectangle(140, y + rowH / 2, 100, 36, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(140, y + rowH / 2, "Unequip", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        if (this.inventory.equipHat(null)) {
          this.refresh();
          this.onHatChanged?.();
          this.onChanged?.("Hat removed");
        }
      });
      row.add([btn, label]);
    } else {
      row.add(
        this.scene.add
          .text(140, y + rowH / 2, "Equipped", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffe066",
          })
          .setOrigin(0.5)
      );
    }
    return row;
  }

  private makeHatRow(
    hatId: ItemId,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[hatId];
    const equipped = this.inventory.getEquippedHatId() === hatId;
    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);
    const [iw, ih] = this.fitIcon(def.textureKey, 48);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(iw, ih);
    const name = this.scene.add
      .text(-112, y + 18, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0);
    const desc = this.scene.add
      .text(-112, y + 46, def.description, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c8c8c8",
        wordWrap: { width: 220 },
      })
      .setOrigin(0, 0);
    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, desc]);
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
        if (this.inventory.equipHat(hatId)) {
          this.refresh();
          this.onHatChanged?.();
          this.onChanged?.(`Equipped ${def.name}`);
        }
      });
      row.add([btn, label]);
    } else {
      row.add(
        this.scene.add
          .text(140, y + rowH / 2, "Equipped", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffe066",
          })
          .setOrigin(0.5)
      );
    }
    return row;
  }

  private makeAmuletRow(
    amuletId: ItemId,
    count: number,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[amuletId];

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x6a7355)
      .setOrigin(0.5, 0);

    const [iw, ih] = this.fitIcon(def.textureKey, 52);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(iw, ih);

    const name = this.scene.add
      .text(-112, y + 14, `${def.name}  ×${count}`, {
        fontFamily: "Georgia, serif",
        fontSize: "17px",
        color: "#ffffff",
      })
      .setOrigin(0, 0);

    const desc = this.scene.add
      .text(-112, y + 42, def.description, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c8c8c8",
        wordWrap: { width: 210 },
      })
      .setOrigin(0, 0);

    const btn = this.scene.add
      .rectangle(140, y + rowH / 2, 100, 36, 0x4a3d6b)
      .setStrokeStyle(1, 0xb48cff)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(140, y + rowH / 2, "Use", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    btn.on("pointerover", () => btn.setFillStyle(0x5c4a82));
    btn.on("pointerout", () => btn.setFillStyle(0x4a3d6b));
    btn.on("pointerdown", () => {
      this.onAmuletUsed?.(amuletId);
    });

    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, desc, btn, label]);
    return row;
  }
}
