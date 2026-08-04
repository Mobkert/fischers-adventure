import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  BOBBER_SHOP_IDS,
  formatBobberStats,
  MUTATIONS,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

interface BobberShopData {
  inventory: InventorySystem;
}

const CARD_H = 175;
const CARD_GAP = 12;
const LIST_VIEW_H = 340;

function fitBobberIcon(
  key: string,
  scene: Phaser.Scene,
  maxSide: number
): [number, number] {
  const tex = scene.textures.get(key);
  const frame = tex?.get();
  const nw = Math.max(1, frame?.width ?? maxSide);
  const nh = Math.max(1, frame?.height ?? maxSide);
  const scale = Math.min(maxSide / nw, maxSide / nh);
  return [Math.round(nw * scale), Math.round(nh * scale)];
}

/** Red-house workshop — buy / craft / equip bobbers. */
export class BobberShopScene extends Phaser.Scene {
  private inventory!: InventorySystem;
  private coinText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;
  private listContent!: Phaser.GameObjects.Container;
  private maskShape!: Phaser.GameObjects.Graphics;
  private scrollTrack!: Phaser.GameObjects.Rectangle;
  private scrollThumb!: Phaser.GameObjects.Rectangle;
  private scrollY = 0;
  private contentH = 0;
  private listCx = 0;
  private listTop = 0;
  private equippedLabel!: Phaser.GameObjects.Text;

  constructor() {
    super("BobberShopScene");
  }

  init(data: BobberShopData): void {
    this.inventory = data.inventory;
  }

  create(): void {
    this.drawInterior();
    this.buildUi();

    const keyboard = this.input.keyboard!;
    const leave = () => this.leaveShop();
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on("down", leave);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on("down", leave);

    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _gos: unknown,
        _dx: number,
        dy: number
      ) => {
        const inList =
          Math.abs(pointer.x - this.listCx) < 280 &&
          pointer.y >= this.listTop &&
          pointer.y <= this.listTop + LIST_VIEW_H;
        if (!inList) return;
        this.setScroll(this.scrollY + dy * 0.55);
      }
    );
  }

  private leaveShop(): void {
    this.scene.resume("GameScene");
    this.scene.resume("UIScene");
    this.scene.stop();
  }

  private drawInterior(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x3a2218, 0x3a2218, 0x2a1810, 0x2a1810, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x5c3a21, 1);
    g.fillRect(0, h * 0.7, w, h * 0.3);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(0, h * 0.7, w, 8);
  }

  private buildUi(): void {
    const w = this.scale.width;

    this.add
      .text(w / 2, 36, "Bobber Workshop", {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(w / 2, 68, "Buy · Craft · Equip  ·  W / ESC to leave", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c4a86a",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.coinText = this.add
      .text(w - 24, 28, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffe066",
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.equippedLabel = this.add
      .text(w / 2, 96, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#d8ffb0",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Starter equip row
    this.addStarterCard();

    this.listCx = w / 2;
    this.listTop = 210;

    this.add
      .rectangle(
        this.listCx,
        this.listTop + LIST_VIEW_H / 2,
        560,
        LIST_VIEW_H + 16,
        0x1a1410,
        0.92
      )
      .setStrokeStyle(2, 0xc4a86a)
      .setDepth(10);

    const listRoot = this.add.container(this.listCx, this.listTop).setDepth(12);
    this.listContent = this.add.container(0, 0);
    listRoot.add(this.listContent);

    this.maskShape = this.make.graphics({ x: 0, y: 0 });
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(this.listCx - 270, this.listTop, 540, LIST_VIEW_H);
    this.maskShape.setVisible(false);
    listRoot.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = this.add
      .rectangle(
        this.listCx + 262,
        this.listTop + LIST_VIEW_H / 2,
        6,
        LIST_VIEW_H,
        0x2a2f3a,
        0.9
      )
      .setDepth(13)
      .setVisible(false);
    this.scrollThumb = this.add
      .rectangle(this.listCx + 262, this.listTop, 6, 40, 0xc4a86a, 0.9)
      .setOrigin(0.5, 0)
      .setDepth(14)
      .setVisible(false);

    this.refreshList();
    this.refreshHeader();
  }

  private addStarterCard(): void {
    const w = this.scale.width;
    const def = ITEMS.bobber_starter;
    const y = 145;
    const bg = this.add
      .rectangle(w / 2, y, 560, 56, 0x2a2018, 0.95)
      .setStrokeStyle(2, 0xc4a86a)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add
      .image(w / 2 - 220, y, def.textureKey)
      .setDisplaySize(...fitBobberIcon(def.textureKey, this, 44))
      .setDepth(11);
    this.add
      .text(w / 2 - 180, y - 10, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#f0e6d2",
      })
      .setOrigin(0, 0.5)
      .setDepth(11);
    this.add
      .text(w / 2 - 180, y + 12, "Starter · free · click to equip", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#aaaaaa",
      })
      .setOrigin(0, 0.5)
      .setDepth(11);
    bg.on("pointerdown", () => {
      this.inventory.equipBobber("bobber_starter");
      this.showToast(`Equipped ${def.name}`, "#ffe066");
      this.refreshHeader();
      this.refreshList();
    });
  }

  private refreshHeader(): void {
    this.coinText.setText(`$${this.inventory.coins}`);
    const eq = ITEMS[this.inventory.getEquippedBobberId()];
    this.equippedLabel.setText(`Equipped: ${eq.name}`);
  }

  private refreshList(): void {
    for (const child of [...this.listContent.list]) {
      child.destroy(true);
    }
    let y = 8;
    for (const id of BOBBER_SHOP_IDS) {
      this.listContent.add(this.makeCard(id, y));
      y += CARD_H + CARD_GAP;
    }
    this.contentH = Math.max(0, y - CARD_GAP + 8);
    this.scrollY = 0;
    this.applyScroll();
  }

  private craftCostLabel(id: ItemId): string {
    const def = ITEMS[id];
    if (!def.craftCost) return "";
    const bits = [`$${def.craftCost.coins}`];
    for (const ing of def.craftCost.ingredients) {
      const muts =
        ing.mutations && ing.mutations.length > 0
          ? ing.mutations
          : ing.mutation
            ? [ing.mutation]
            : null;
      const mut = muts
        ? muts.map((m) => MUTATIONS[m]?.name ?? m).join("/") + " "
        : "";
      bits.push(`${ing.count}× ${mut}${ITEMS[ing.itemId].name}`);
    }
    return bits.join(" + ");
  }

  private makeCard(id: ItemId, y: number): Phaser.GameObjects.Container {
    const def = ITEMS[id];
    const owned = this.inventory.ownsBobber(id);
    const equipped = this.inventory.getEquippedBobberId() === id;
    const card = this.add.container(0, y);
    const bg = this.add
      .rectangle(0, CARD_H / 2, 520, CARD_H, 0x2a2018, 0.95)
      .setStrokeStyle(2, equipped ? 0x7CFC00 : owned ? 0x6a7355 : 0xc4a86a);

    const icon = this.add
      .image(-200, CARD_H / 2 - 10, def.textureKey)
      .setDisplaySize(...fitBobberIcon(def.textureKey, this, 56));

    const name = this.add
      .text(-155, 28, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#f0e6d2",
      })
      .setOrigin(0, 0);

    const desc = this.add
      .text(-155, 54, def.description, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#bbbbbb",
        wordWrap: { width: 280 },
      })
      .setOrigin(0, 0);

    const stats = this.add
      .text(-155, 100, formatBobberStats(def), {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c4a86a",
      })
      .setOrigin(0, 0);

    let actionLabel = "Owned";
    let actionColor = 0x555555;
    if (!owned) {
      if (def.buyPrice != null) {
        actionLabel = `Buy $${def.buyPrice}`;
        actionColor = 0x2a6b4a;
      } else if (def.craftCost) {
        actionLabel = `Craft · ${this.craftCostLabel(id)}`;
        actionColor = 0x5a4a2a;
      }
    } else if (!equipped) {
      actionLabel = "Equip";
      actionColor = 0x2a4a6b;
    } else {
      actionLabel = "Equipped";
      actionColor = 0x3a5a2a;
    }

    const btn = this.add
      .rectangle(170, CARD_H / 2 + 40, 150, 36, actionColor)
      .setStrokeStyle(1, 0xf0e6d2)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add
      .text(170, CARD_H / 2 + 40, actionLabel, {
        fontFamily: "Arial",
        fontSize: owned && !equipped ? "14px" : "12px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 140 },
      })
      .setOrigin(0.5);

    btn.on("pointerdown", () => {
      if (!owned) {
        const result =
          def.buyPrice != null
            ? this.inventory.buyBobber(id)
            : this.inventory.craftBobber(id);
        this.showToast(
          result.message,
          result.ok ? "#7CFC00" : "#ffaa66"
        );
        if (result.ok) {
          this.inventory.equipBobber(id);
        }
      } else {
        this.inventory.equipBobber(id);
        this.showToast(`Equipped ${def.name}`, "#ffe066");
      }
      this.refreshHeader();
      this.refreshList();
    });

    card.add([bg, icon, name, desc, stats, btn, btnText]);
    return card;
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
      this.listTop + (max > 0 ? (this.scrollY / max) * trackTravel : 0);
    this.scrollThumb.setY(thumbY);
    this.scrollThumb.setSize(6, thumbH);
  }

  private showToast(message: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(this.scale.width / 2, this.scale.height - 40, message, {
        fontFamily: "Arial",
        fontSize: "16px",
        color,
        backgroundColor: "#00000099",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.time.delayedCall(2200, () => this.toast?.destroy());
  }
}
