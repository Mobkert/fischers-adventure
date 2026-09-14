import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  FISH_ITEM_IDS,
  AMULET_ITEM_IDS,
  ROD_ITEM_IDS,
  BAIT_ITEM_IDS,
  ORE_CLUSTER_DROPS,
  MUTATIONS,
  FISH_SIZES,
  FishMutationId,
  FishSizeId,
  RARITY_COLOR,
  RARITY_NAME,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

type DeviceTab = "fish" | "amulets" | "rods" | "bait";

const PANEL_W = 480;
const PANEL_H = 540;
const LIST_TOP = -150;
const LIST_VIEW_H = 360;
const ROW_H = 56;
const SIDE_W = 220;

/**
 * Secret operator tablet — infinite grants for fish / amulets / rods / bait.
 * Fish picks open a side panel for mutation + size.
 */
export class AdminDevicePanel {
  private root: Phaser.GameObjects.Container;
  private listRoot: Phaser.GameObjects.Container;
  private listContent: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollTrack: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private sideRoot: Phaser.GameObjects.Container;
  private subtitle!: Phaser.GameObjects.Text;
  private tabLabels: Partial<
    Record<DeviceTab, { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }>
  > = {};
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private tab: DeviceTab = "fish";
  private scrollY = 0;
  private contentH = 0;
  private selectedFish: ItemId | null = null;
  private pickMutation: FishMutationId | null = null;
  private pickSize: FishSizeId = "normal";
  private onGranted?: (message: string) => void;
  private wheelHandler: (
    pointer: Phaser.Input.Pointer,
    _gos: unknown,
    _dx: number,
    dy: number
  ) => void;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;
    const { width, height } = scene.scale;
    this.panelCx = width / 2;
    this.panelCy = height / 2;

    this.root = scene.add.container(this.panelCx, this.panelCy).setDepth(95);
    this.root.setVisible(false);
    this.root.setScrollFactor(0);

    const dim = scene.add
      .rectangle(0, 0, width + 40, height + 40, 0x000000, 0.55)
      .setInteractive();
    dim.on("pointerdown", () => this.setOpen(false));

    const panel = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x161820, 0.98)
      .setStrokeStyle(2, 0xff8844);

    const title = scene.add
      .text(0, -PANEL_H / 2 + 24, "Admin Device", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.subtitle = scene.add
      .text(0, -PANEL_H / 2 + 88, "Grant anything · infinite uses", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.listRoot = scene.add.container(0, LIST_TOP);
    this.listContent = scene.add.container(0, 0);
    this.listRoot.add(this.listContent);

    this.maskShape = scene.make.graphics({ x: 0, y: 0 });
    this.maskShape.setVisible(false);
    this.listRoot.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = scene.add
      .rectangle(PANEL_W / 2 - 18, LIST_TOP + LIST_VIEW_H / 2, 6, LIST_VIEW_H, 0x2a3a40, 0.9)
      .setVisible(false);
    this.scrollThumb = scene.add
      .rectangle(PANEL_W / 2 - 18, LIST_TOP, 6, 40, 0xff8844, 0.9)
      .setOrigin(0.5, 0)
      .setVisible(false);

    const closeBg = scene.add
      .rectangle(0, PANEL_H / 2 - 32, 120, 34, 0x3a2a20)
      .setStrokeStyle(1, 0xff8844)
      .setInteractive({ useHandCursor: true });
    const closeLabel = scene.add
      .text(0, PANEL_H / 2 - 32, "Close", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    closeBg.on("pointerover", () => closeBg.setFillStyle(0x4a3a28));
    closeBg.on("pointerout", () => closeBg.setFillStyle(0x3a2a20));
    closeBg.on("pointerdown", () => this.setOpen(false));

    this.sideRoot = scene.add.container(PANEL_W / 2 + SIDE_W / 2 + 8, 0);
    this.sideRoot.setVisible(false);

    // Panel first, then chrome — tabs must sit above the panel fill
    this.root.add([
      dim,
      panel,
      title,
      this.subtitle,
      this.listRoot,
      this.scrollTrack,
      this.scrollThumb,
      closeBg,
      closeLabel,
      this.sideRoot,
    ]);

    const tabs: { id: DeviceTab; label: string }[] = [
      { id: "fish", label: "Fish" },
      { id: "amulets", label: "Amulets" },
      { id: "rods", label: "Rods" },
      { id: "bait", label: "Bait" },
    ];
    const tabW = 96;
    const tabY = -PANEL_H / 2 + 58;
    const startX = -((tabs.length - 1) * (tabW + 8)) / 2;
    tabs.forEach((t, i) => {
      const x = startX + i * (tabW + 8);
      const bg = scene.add
        .rectangle(x, tabY, tabW, 28, 0x2a2f3a, 0.95)
        .setStrokeStyle(2, 0x666666)
        .setInteractive({ useHandCursor: true });
      const label = scene.add
        .text(x, tabY, t.label, {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5);
      bg.on("pointerdown", () => this.setTab(t.id));
      this.tabLabels[t.id] = { bg, label };
      this.root.add([bg, label]);
    });

    this.wheelHandler = (pointer, _gos, _dx, dy) => {
      if (!this.visible) return;
      const localX = pointer.x - this.panelCx;
      const localY = pointer.y - this.panelCy;
      if (
        Math.abs(localX) > PANEL_W / 2 + (this.sideRoot.visible ? SIDE_W + 16 : 0) ||
        Math.abs(localY) > PANEL_H / 2
      ) {
        return;
      }
      this.setScroll(this.scrollY + dy * 0.5);
    };
    scene.input.on("wheel", this.wheelHandler);
  }

  setOnGranted(cb: (message: string) => void): void {
    this.onGranted = cb;
  }

  toggle(): void {
    this.setOpen(!this.visible);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (!open) {
      this.selectedFish = null;
      this.sideRoot.setVisible(false);
      return;
    }
    this.scrollY = 0;
    this.redrawMask();
    this.refresh();
  }

  private setTab(tab: DeviceTab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.selectedFish = null;
    this.sideRoot.setVisible(false);
    this.scrollY = 0;
    this.refresh();
  }

  private redrawMask(): void {
    this.maskShape.clear();
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(
      this.panelCx - PANEL_W / 2 + 16,
      this.panelCy + LIST_TOP,
      PANEL_W - 48,
      LIST_VIEW_H
    );
  }

  private setScroll(y: number): void {
    const max = Math.max(0, this.contentH - LIST_VIEW_H);
    this.scrollY = Phaser.Math.Clamp(y, 0, max);
    this.applyScroll();
  }

  private applyScroll(): void {
    this.listContent.setY(-this.scrollY);
    const max = Math.max(0, this.contentH - LIST_VIEW_H);
    const show = max > 0;
    this.scrollTrack.setVisible(show);
    this.scrollThumb.setVisible(show);
    if (!show) return;
    const thumbH = Math.max(28, (LIST_VIEW_H / this.contentH) * LIST_VIEW_H);
    const travel = LIST_VIEW_H - thumbH;
    this.scrollThumb.setY(LIST_TOP + (this.scrollY / max) * travel);
    this.scrollThumb.setSize(6, thumbH);
  }

  private styleTabs(): void {
    (Object.keys(this.tabLabels) as DeviceTab[]).forEach((t) => {
      const entry = this.tabLabels[t];
      if (!entry) return;
      const active = t === this.tab;
      entry.bg.setStrokeStyle(2, active ? 0xc4a86a : 0x666666);
      entry.bg.setFillStyle(active ? 0x3a3428 : 0x2a2f3a, 0.95);
      entry.label.setColor(active ? "#f0e6d2" : "#aaaaaa");
    });
  }

  refresh(): void {
    this.styleTabs();
    for (const child of [...this.listContent.list]) {
      child.destroy(true);
    }

    this.subtitle.setText(
      this.tab === "fish"
        ? "Fish & ores · fish open a side panel; ores use Give"
        : this.tab === "amulets"
          ? "Amulets · Give (includes ADMIN / Cave Amulet)"
          : this.tab === "rods"
            ? "Rods · Give to unlock ownership"
            : "Bait · Give ×1"
    );

    let y = 0;
    if (this.tab === "fish") {
      const fishIds = [...FISH_ITEM_IDS].sort((a, b) =>
        ITEMS[a].name.localeCompare(ITEMS[b].name)
      );
      for (const id of fishIds) {
        this.listContent.add(this.makeRow(id, y, "fish"));
        y += ROW_H + 6;
      }
      this.listContent.add(
        this.scene.add
          .text(0, y + 6, "Ores (from Ore Clusters)", {
            fontFamily: "Arial",
            fontSize: "13px",
            color: "#c4a86a",
          })
          .setOrigin(0.5, 0)
      );
      y += 28;
      const oreIds = ORE_CLUSTER_DROPS.map((d) => d.itemId);
      for (const id of oreIds) {
        this.listContent.add(this.makeRow(id, y, "ore"));
        y += ROW_H + 6;
      }
    } else {
      const ids = this.idsForTab();
      for (const id of ids) {
        this.listContent.add(this.makeRow(id, y, this.tab));
        y += ROW_H + 6;
      }
    }
    this.contentH = Math.max(LIST_VIEW_H, y + 8);
    this.applyScroll();
    if (this.tab === "fish" && this.selectedFish) {
      this.buildFishSide(this.selectedFish);
    } else {
      this.sideRoot.setVisible(false);
    }
  }

  private idsForTab(): ItemId[] {
    switch (this.tab) {
      case "fish":
        return [...FISH_ITEM_IDS].sort((a, b) =>
          ITEMS[a].name.localeCompare(ITEMS[b].name)
        );
      case "amulets":
        return [...AMULET_ITEM_IDS].sort((a, b) =>
          ITEMS[a].name.localeCompare(ITEMS[b].name)
        );
      case "rods":
        return [...ROD_ITEM_IDS].sort((a, b) =>
          ITEMS[a].name.localeCompare(ITEMS[b].name)
        );
      case "bait":
        return [...BAIT_ITEM_IDS].sort((a, b) =>
          ITEMS[a].name.localeCompare(ITEMS[b].name)
        );
    }
  }

  private fitIcon(key: string, maxSide: number): [number, number] {
    const tex = this.scene.textures.get(key);
    const frame = tex?.get();
    const nw = Math.max(1, frame?.width ?? maxSide);
    const nh = Math.max(1, frame?.height ?? maxSide);
    const scale = Math.min(maxSide / nw, maxSide / nh);
    return [Math.round(nw * scale), Math.round(nh * scale)];
  }

  private makeRow(
    id: ItemId,
    y: number,
    kind: DeviceTab | "ore"
  ): Phaser.GameObjects.Container {
    const def = ITEMS[id];
    const selected = kind === "fish" && this.selectedFish === id;
    const card = this.scene.add
      .rectangle(0, y, PANEL_W - 56, ROW_H, selected ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, selected ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);

    const texKey = this.scene.textures.exists(def.textureKey)
      ? def.textureKey
      : "rod";
    const [iw, ih] = this.fitIcon(texKey, 40);
    const icon = this.scene.add
      .image(-PANEL_W / 2 + 52, y + ROW_H / 2, texKey)
      .setDisplaySize(iw, ih);

    const rarity = def.rarity;
    const nameColor =
      rarity === "admin"
        ? "#ff9944"
        : rarity
          ? RARITY_COLOR[rarity]
          : "#ffffff";

    const name = this.scene.add
      .text(-PANEL_W / 2 + 80, y + 10, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: nameColor,
      })
      .setOrigin(0, 0);

    const subBits: string[] = [];
    if (kind === "ore") subBits.push("Ore cluster drop");
    if (rarity) subBits.push(RARITY_NAME[rarity] ?? rarity);
    if (kind === "rods" && this.inventory.ownsRod(id)) subBits.push("owned");
    if (kind === "amulets") {
      const n = this.inventory.getAmuletCount(id);
      if (n > 0) subBits.push(`owned ×${n}`);
    }
    if (kind === "bait") {
      const n = this.inventory.getBaitCount(id);
      if (n > 0) subBits.push(`owned ×${n}`);
    }
    const sub = this.scene.add
      .text(-PANEL_W / 2 + 80, y + 32, subBits.join(" · ") || " ", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#aaaaaa",
      })
      .setOrigin(0, 0);

    const kids: Phaser.GameObjects.GameObject[] = [card, icon, name, sub];

    if (kind === "fish") {
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => this.onRowClick(id));
      card.on("pointerover", () => {
        if (!selected) card.setFillStyle(0x343a48, 0.95);
      });
      card.on("pointerout", () => {
        if (!selected) card.setFillStyle(0x2a2f3a, 0.95);
      });
    } else {
      const btn = this.scene.add
        .rectangle(PANEL_W / 2 - 78, y + ROW_H / 2, 88, 32, 0x4a3d6b)
        .setStrokeStyle(1, 0xb48cff)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(PANEL_W / 2 - 78, y + ROW_H / 2, "Give", {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      btn.on("pointerover", () => btn.setFillStyle(0x5c4a82));
      btn.on("pointerout", () => btn.setFillStyle(0x4a3d6b));
      btn.on("pointerdown", () => {
        if (kind === "ore") this.grantOre(id);
        else this.grantSimple(id);
      });
      kids.push(btn, label);
    }

    return this.scene.add.container(0, 0, kids);
  }

  private onRowClick(id: ItemId): void {
    if (this.tab === "fish") {
      this.selectedFish = id;
      this.pickMutation = null;
      this.pickSize = "normal";
      this.refresh();
      this.buildFishSide(id);
      return;
    }
    this.grantSimple(id);
  }

  private grantOre(id: ItemId): void {
    const def = ITEMS[id];
    if (!this.inventory.addItem(id, 1)) {
      this.onGranted?.(`Bag full — couldn't add ${def.name}.`);
      return;
    }
    this.onGranted?.(`Granted ${def.name}.`);
    this.refresh();
  }

  private grantSimple(id: ItemId): void {
    const def = ITEMS[id];
    if (this.tab === "amulets") {
      if (!this.inventory.grantAmulet(id)) {
        this.onGranted?.(`Couldn't grant ${def.name}.`);
        return;
      }
      this.onGranted?.(`Granted ${def.name}.`);
      this.refresh();
      return;
    }
    if (this.tab === "rods") {
      if (this.inventory.ownsRod(id)) {
        this.onGranted?.(`You already own ${def.name}.`);
        return;
      }
      if (!this.inventory.addItem(id)) {
        this.onGranted?.(`Couldn't grant ${def.name}.`);
        return;
      }
      this.onGranted?.(`Unlocked ${def.name}.`);
      this.refresh();
      return;
    }
    if (this.tab === "bait") {
      if (!this.inventory.addBait(id, 1)) {
        this.onGranted?.(`Couldn't grant ${def.name}.`);
        return;
      }
      this.onGranted?.(`Granted ${def.name} ×1.`);
      this.refresh();
    }
  }

  private buildFishSide(fishId: ItemId): void {
    for (const child of [...this.sideRoot.list]) {
      child.destroy(true);
    }
    const def = ITEMS[fishId];
    const bg = this.scene.add
      .rectangle(0, 0, SIDE_W, PANEL_H - 40, 0x1a1e28, 0.98)
      .setStrokeStyle(2, 0x4aa8ff);

    const title = this.scene.add
      .text(0, -PANEL_H / 2 + 36, def.name, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#e8f0ff",
        wordWrap: { width: SIDE_W - 20 },
        align: "center",
      })
      .setOrigin(0.5, 0);

    const mutLabel = this.scene.add
      .text(0, -PANEL_H / 2 + 68, "Mutation", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#8890a0",
      })
      .setOrigin(0.5);

    const kids: Phaser.GameObjects.GameObject[] = [bg, title, mutLabel];

    const mutIds: Array<FishMutationId | null> = [
      null,
      ...(Object.keys(MUTATIONS) as FishMutationId[]),
    ];
    let my = -PANEL_H / 2 + 82;
    const colW = (SIDE_W - 28) / 2;
    const gap = 4;
    mutIds.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = -colW / 2 - gap / 2 + col * (colW + gap);
      const y = my + row * 17;
      const label = m ? MUTATIONS[m].name : "None";
      const on = this.pickMutation === m;
      const btn = this.scene.add
        .rectangle(x, y, colW, 15, on ? 0x3a5080 : 0x2a3040, 0.95)
        .setStrokeStyle(1, on ? 0x7ec8ff : 0x445060)
        .setInteractive({ useHandCursor: true });
      const tx = this.scene.add
        .text(x, y, label, {
          fontFamily: "Arial",
          fontSize: "9px",
          color: on ? "#ffffff" : "#c8d0d8",
        })
        .setOrigin(0.5);
      btn.on("pointerdown", () => {
        this.pickMutation = m;
        this.buildFishSide(fishId);
      });
      kids.push(btn, tx);
    });

    my += Math.ceil(mutIds.length / 2) * 17 + 10;
    const sizeLabel = this.scene.add
      .text(0, my, "Effect / Size", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#8890a0",
      })
      .setOrigin(0.5);
    kids.push(sizeLabel);
    my += 14;

    const sizes = Object.keys(FISH_SIZES) as FishSizeId[];
    for (const s of sizes) {
      const on = this.pickSize === s;
      const btn = this.scene.add
        .rectangle(0, my, SIDE_W - 24, 18, on ? 0x3a5080 : 0x2a3040, 0.95)
        .setStrokeStyle(1, on ? 0x7ec8ff : 0x445060)
        .setInteractive({ useHandCursor: true });
      const tx = this.scene.add
        .text(0, my, FISH_SIZES[s].name, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: on ? "#ffffff" : "#c8d0d8",
        })
        .setOrigin(0.5);
      btn.on("pointerdown", () => {
        this.pickSize = s;
        this.buildFishSide(fishId);
      });
      kids.push(btn, tx);
      my += 22;
    }

    const grantBg = this.scene.add
      .rectangle(0, PANEL_H / 2 - 48, SIDE_W - 24, 32, 0x2a6b4a)
      .setStrokeStyle(1, 0x7ecf9a)
      .setInteractive({ useHandCursor: true });
    const grantTx = this.scene.add
      .text(0, PANEL_H / 2 - 48, "Grant fish", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    grantBg.on("pointerover", () => grantBg.setFillStyle(0x3a8a5a));
    grantBg.on("pointerout", () => grantBg.setFillStyle(0x2a6b4a));
    grantBg.on("pointerdown", () => this.grantFish(fishId));
    kids.push(grantBg, grantTx);

    this.sideRoot.add(kids);
    this.sideRoot.setVisible(true);
  }

  private grantFish(fishId: ItemId): void {
    const def = ITEMS[fishId];
    const mut = this.pickMutation;
    const size = this.pickSize === "normal" ? null : this.pickSize;
    if (!this.inventory.addItem(fishId, 1, mut, size)) {
      this.onGranted?.(`Bag full — couldn't add ${def.name}.`);
      return;
    }
    const mutName = mut ? MUTATIONS[mut].name : "None";
    const sizeName = FISH_SIZES[this.pickSize].name;
    this.onGranted?.(`Granted ${def.name} (${mutName}, ${sizeName}).`);
  }
}
