import Phaser from "phaser";
import {
  FROSTPEAK_CRATE_DUPLICATE_REFUND,
  FROSTPEAK_CRATE_PRICE,
  SKIN_CRATE_DUPLICATE_REFUND,
  SKIN_CRATE_PRICE,
  SkinCrateKind,
} from "../data/rodSkins";
import { InventorySystem } from "../systems/InventorySystem";

interface SkinShopData {
  inventory: InventorySystem;
}

/** Collectors Island red brick house — sells Skin Crates. */
export class SkinShopScene extends Phaser.Scene {
  private inventory!: InventorySystem;
  private coinText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;

  constructor() {
    super("SkinShopScene");
  }

  init(data: SkinShopData): void {
    this.inventory = data.inventory;
  }

  create(): void {
    this.drawInterior();
    this.buildUi();

    const keyboard = this.input.keyboard!;
    const leave = () => this.leaveShop();
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on("down", leave);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on("down", leave);
  }

  private leaveShop(): void {
    this.scene.resume("GameScene");
    this.scene.resume("UIScene");
    const ui = this.scene.get("UIScene") as
      | { onCoinsChanged?: () => void }
      | undefined;
    ui?.onCoinsChanged?.();
    this.scene.stop();
  }

  private drawInterior(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const g = this.add.graphics().setDepth(0);

    g.fillGradientStyle(0x5a2a22, 0x5a2a22, 0x3a1814, 0x3a1814, 1);
    g.fillRect(0, 0, w, h);

    g.lineStyle(1, 0x7a3a30, 0.35);
    for (let y = 40; y < h * 0.68; y += 22) {
      g.lineBetween(0, y, w, y);
    }
    for (let y = 40; y < h * 0.68; y += 44) {
      for (let x = 0; x < w; x += 56) {
        g.lineBetween(
          x + ((y / 22) % 2 === 0 ? 28 : 0),
          y,
          x + ((y / 22) % 2 === 0 ? 28 : 0),
          y + 22
        );
      }
    }

    g.fillStyle(0x2a1810, 1);
    g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle(0x4a3020, 1);
    g.fillRect(0, h * 0.62, w, 10);

    g.fillStyle(0x3a2818, 1);
    g.fillRect(0, h * 0.78, w, h * 0.22);
    for (let y = h * 0.78; y < h; y += 14) {
      g.fillStyle(0x2a1a10, 0.45);
      g.fillRect(0, y, w, 2);
    }

    this.drawShelf(w * 0.5, h * 0.38, 560, 200);
  }

  private drawShelf(cx: number, cy: number, sw: number, sh: number): void {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x1a100c, 0.9);
    g.fillRoundedRect(cx - sw / 2, cy - sh / 2, sw, sh, 8);
    g.lineStyle(3, 0xc4a86a, 0.7);
    g.strokeRoundedRect(cx - sw / 2, cy - sh / 2, sw, sh, 8);
    g.lineStyle(2, 0x6a4a30, 0.8);
    g.lineBetween(cx - sw / 2 + 12, cy - 18, cx + sw / 2 - 12, cy - 18);
    g.lineBetween(cx - sw / 2 + 12, cy + 40, cx + sw / 2 - 12, cy + 40);
  }

  private buildUi(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add
      .text(w / 2, 36, "Collectors Skin Boutique", {
        fontFamily: "Georgia, serif",
        fontSize: "30px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(
        w / 2,
        68,
        "Sealed rod-skin crates · Open in Inventory · W / ESC to leave",
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#c8a888",
        }
      )
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

    const cy = h * 0.4;
    this.buildCrateCard({
      cx: w / 2 - 150,
      cy,
      kind: "collectors",
      texture: "skin_crate",
      title: "Skin Crate",
      price: SKIN_CRATE_PRICE,
      accent: 0xc4a86a,
      hover: 0xffe066,
      fill: 0x2a1814,
    });
    this.buildCrateCard({
      cx: w / 2 + 150,
      cy,
      kind: "frostpeak",
      texture: "frostpeak_crate",
      title: "Frostpeak Crate",
      price: FROSTPEAK_CRATE_PRICE,
      accent: 0x8ec8e8,
      hover: 0xd8f0ff,
      fill: 0x142838,
    });

    this.add
      .text(
        w / 2 - 150,
        h * 0.68,
        "Odds: Golden Lucky 39% · Universal Portal 25%\n" +
          "Pufferfirm 15% · Poisoned 10% · Pistol 7% · Laser 3%\n" +
          `Dupes → $${SKIN_CRATE_DUPLICATE_REFUND.toLocaleString()}`,
        {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#b0a090",
          align: "center",
          lineSpacing: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(
        w / 2 + 150,
        h * 0.68,
        "Odds: Frigid 39% · Icicle 25%\n" +
          "Frozen Lotus 15% · Halo of Ice 10% · Hyperboreal 7% · Hyperthermic 3%\n" +
          `Dupes → $${FROSTPEAK_CRATE_DUPLICATE_REFUND.toLocaleString()}`,
        {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#a0c0d8",
          align: "center",
          lineSpacing: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.refreshCoins();
  }

  private buildCrateCard(opts: {
    cx: number;
    cy: number;
    kind: SkinCrateKind;
    texture: string;
    title: string;
    price: number;
    accent: number;
    hover: number;
    fill: number;
  }): void {
    const card = this.add
      .rectangle(opts.cx, opts.cy, 240, 200, opts.fill, 0.95)
      .setStrokeStyle(2, opts.accent)
      .setDepth(12)
      .setInteractive({ useHandCursor: true });

    this.add
      .image(opts.cx, opts.cy - 36, opts.texture)
      .setDisplaySize(72, 72)
      .setDepth(13);

    this.add
      .text(opts.cx, opts.cy + 24, opts.title, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5)
      .setDepth(13);

    this.add
      .text(opts.cx, opts.cy + 52, `$${opts.price.toLocaleString()}`, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffe066",
      })
      .setOrigin(0.5)
      .setDepth(13);

    this.add
      .text(opts.cx, opts.cy + 78, "Click to buy · Open in Inventory", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#a89078",
      })
      .setOrigin(0.5)
      .setDepth(13);

    card.on("pointerover", () => card.setStrokeStyle(2, opts.hover));
    card.on("pointerout", () => card.setStrokeStyle(2, opts.accent));
    card.on("pointerdown", () => this.tryBuy(opts.kind));
  }

  private tryBuy(kind: SkinCrateKind): void {
    const result = this.inventory.buyCrate(kind);
    this.showToast(result.message, result.ok ? "#7dff9a" : "#ff8866");
    this.refreshCoins();
  }

  private refreshCoins(): void {
    this.coinText.setText(`$${this.inventory.coins.toLocaleString()}`);
  }

  private showToast(msg: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(this.scale.width / 2, this.scale.height - 48, msg, {
        fontFamily: "Arial",
        fontSize: "16px",
        color,
        backgroundColor: "#1a100cee",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.time.delayedCall(2200, () => {
      this.toast?.destroy();
      this.toast = undefined;
    });
  }
}
