import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  SHOP_ROD_IDS,
  formatRodStats,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

interface ShopSceneData {
  inventory: InventorySystem;
}

const CARD_H = 168;
const CARD_GAP = 14;
const LIST_VIEW_H = 320;

/** High-detail rod shop interior (blue house). */
export class ShopScene extends Phaser.Scene {
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

  constructor() {
    super("ShopScene");
  }

  init(data: ShopSceneData): void {
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
          Math.abs(pointer.x - this.listCx) < 260 &&
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

    // Warm plaster walls
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0xf2e4c9, 0xf2e4c9, 0xe0cfaa, 0xe0cfaa, 1);
    g.fillRect(0, 0, w, h);

    // Wainscoting
    g.fillStyle(0x6b4423, 1);
    g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(0, h * 0.62, w, 10);
    for (let x = 0; x < w; x += 48) {
      g.fillStyle(0x5c3a21, 0.35);
      g.fillRect(x, h * 0.62 + 10, 2, h * 0.38);
    }

    // Floor boards
    g.fillStyle(0xa06a3a, 1);
    g.fillRect(0, h * 0.78, w, h * 0.22);
    for (let y = h * 0.78; y < h; y += 14) {
      g.fillStyle(0x8b5a2b, 0.45);
      g.fillRect(0, y, w, 2);
    }
    for (let x = 40; x < w; x += 70) {
      g.lineStyle(1, 0x5c3a21, 0.35);
      g.lineBetween(x, h * 0.78, x + 20, h);
    }

    // Back wall shelf unit
    g.fillStyle(0x4a2f18, 1);
    g.fillRoundedRect(80, 70, w - 160, 280, 8);
    g.fillStyle(0x6b4423, 1);
    g.fillRect(100, 100, w - 200, 12);
    g.fillRect(100, 180, w - 200, 12);
    g.fillRect(100, 260, w - 200, 12);

    // Decorative jars / tackle on shelves
    for (let i = 0; i < 6; i++) {
      const x = 140 + i * 160;
      g.fillStyle(0xc45c4a, 1);
      g.fillRoundedRect(x, 118, 28, 36, 4);
      g.fillStyle(0xe8d5a3, 1);
      g.fillRect(x + 4, 122, 20, 8);
      g.fillStyle(0x3a6ea5, 1);
      g.fillRoundedRect(x + 50, 200, 34, 40, 6);
      g.fillStyle(0xf0e6d2, 1);
      g.fillCircle(x + 67, 214, 6);
    }

    // Windows with light beams
    for (const wx of [220, w - 280]) {
      g.fillStyle(0x87b8d4, 1);
      g.fillRect(wx, 90, 110, 90);
      g.lineStyle(6, 0x5c3a21, 1);
      g.strokeRect(wx, 90, 110, 90);
      g.lineBetween(wx + 55, 90, wx + 55, 180);
      g.lineBetween(wx, 135, wx + 110, 135);
      g.fillStyle(0xfff6d5, 0.12);
      g.fillTriangle(wx + 55, 180, wx - 40, h * 0.78, wx + 150, h * 0.78);
    }

    // Shop counter
    g.fillStyle(0x5c3a21, 1);
    g.fillRoundedRect(w / 2 - 280, h * 0.55, 560, 90, 6);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(w / 2 - 280, h * 0.55, 560, 16);
    g.fillStyle(0xc4a86a, 0.5);
    g.fillRect(w / 2 - 260, h * 0.55 + 4, 120, 6);

    // Hanging sign
    g.fillStyle(0x3a2a1a, 1);
    g.fillRect(w / 2 - 2, 28, 4, 36);
    g.fillStyle(0xe8d5a3, 1);
    g.fillRoundedRect(w / 2 - 130, 24, 260, 44, 6);
    this.add
      .text(w / 2, 46, "Bluefin Tackle Shop", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#3a2a1a",
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Shopkeeper behind counter
    this.drawShopkeeper(w / 2 + 160, h * 0.55);
  }

  private drawShopkeeper(x: number, y: number): void {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(x, y + 8, 36, 10);
    g.fillStyle(0x2c3e50, 1);
    g.fillRect(x - 14, y - 50, 28, 36);
    g.fillStyle(0xe8e0d0, 1);
    g.fillRect(x - 12, y - 30, 24, 18);
    g.fillStyle(0xc4a484, 1);
    g.fillRect(x - 12, y - 70, 24, 22);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(x - 14, y - 74, 28, 8);
    g.fillRect(x + 4, y - 62, 3, 3);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(x - 22, y - 20, 10, 28);
  }

  private buildUi(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.coinText = this.add
      .text(w - 24, 24, "", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setDepth(20);

    this.add
      .text(24, 24, "W / Esc — Leave shop", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#5c3a21",
        backgroundColor: "#f0e6d2aa",
        padding: { x: 8, y: 6 },
      })
      .setDepth(20);

    this.listCx = w / 2;
    this.listTop = Math.min(h * 0.55 + 100, h - LIST_VIEW_H - 24);

    this.add
      .text(this.listCx, this.listTop - 28, "Fishing Rods for Sale · Scroll", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#3a2a1a",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Panel behind the list
    this.add
      .rectangle(
        this.listCx,
        this.listTop + LIST_VIEW_H / 2,
        520,
        LIST_VIEW_H + 16,
        0x1e1a22,
        0.88
      )
      .setStrokeStyle(2, 0xc4a86a)
      .setDepth(10);

    const listRoot = this.add
      .container(this.listCx, this.listTop)
      .setDepth(12);
    this.listContent = this.add.container(0, 0);
    listRoot.add(this.listContent);

    this.maskShape = this.make.graphics({ x: 0, y: 0 });
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(
      this.listCx - 250,
      this.listTop,
      500,
      LIST_VIEW_H
    );
    this.maskShape.setVisible(false);
    listRoot.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = this.add
      .rectangle(
        this.listCx + 242,
        this.listTop + LIST_VIEW_H / 2,
        6,
        LIST_VIEW_H,
        0x2a2f3a,
        0.9
      )
      .setDepth(13)
      .setVisible(false);
    this.scrollThumb = this.add
      .rectangle(this.listCx + 242, this.listTop, 6, 40, 0xc4a86a, 0.9)
      .setOrigin(0.5, 0)
      .setDepth(14)
      .setVisible(false);

    let y = 8;
    for (const rodId of SHOP_ROD_IDS) {
      this.listContent.add(this.makeProductCard(rodId, y));
      y += CARD_H + CARD_GAP;
    }
    this.contentH = Math.max(0, y - CARD_GAP + 8);
    this.scrollY = 0;
    this.applyScroll();

    this.refreshCoins();
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

  private makeProductCard(
    rodId: ItemId,
    y: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[rodId];
    const owned = this.inventory.ownsRod(rodId);

    const card = this.add.container(0, y);
    const bg = this.add
      .rectangle(0, CARD_H / 2, 480, CARD_H, 0x2a2430, 0.94)
      .setStrokeStyle(2, owned ? 0x6a7355 : 0xc4a86a);

    const icon = this.add
      .image(-180, CARD_H / 2 - 8, def.textureKey)
      .setDisplaySize(56, 56);

    const name = this.add
      .text(-130, 18, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#f0e6d2",
      })
      .setOrigin(0, 0);

    const price = this.add
      .text(-130, 46, `$${def.buyPrice}`, {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffe066",
      })
      .setOrigin(0, 0);

    const stats = this.add
      .text(-130, 72, formatRodStats(def.rodStats!), {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#d0d0d0",
        lineSpacing: 2,
      })
      .setOrigin(0, 0);

    const btn = this.add
      .rectangle(160, CARD_H / 2 + 40, 120, 36, owned ? 0x444444 : 0x3d6b4f)
      .setStrokeStyle(1, owned ? 0x777777 : 0x7dce7a)
      .setInteractive({ useHandCursor: !owned });

    const btnLabel = this.add
      .text(160, CARD_H / 2 + 40, owned ? "Owned" : "Buy", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    if (!owned) {
      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        const result = this.inventory.buyRod(rodId);
        this.showToast(
          result.message,
          result.ok ? "#7CFC00" : "#ffaa66"
        );
        this.refreshCoins();
        if (result.ok) {
          btn.disableInteractive();
          btn.setFillStyle(0x444444);
          btn.setStrokeStyle(1, 0x777777);
          btnLabel.setText("Owned");
          bg.setStrokeStyle(2, 0x6a7355);
          const game = this.scene.get("GameScene") as {
            persistSave?: () => void;
          };
          game.persistSave?.();
        }
      });
    }

    card.add([bg, icon, name, price, stats, btn, btnLabel]);
    return card;
  }

  private refreshCoins(): void {
    this.coinText.setText(`$${this.inventory.coins}`);
  }

  private showToast(message: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(this.scale.width / 2, 90, message, {
        fontFamily: "Arial",
        fontSize: "20px",
        color,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.tweens.add({
      targets: this.toast,
      alpha: 0,
      delay: 1400,
      duration: 400,
      onComplete: () => {
        this.toast?.destroy();
        this.toast = undefined;
      },
    });
  }
}
