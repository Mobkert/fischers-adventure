import Phaser from "phaser";
import {
  SKIN_CRATE_DUPLICATE_REFUND,
  SKIN_CRATE_PRICE,
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

    // Display shelf behind crate
    this.drawShelf(w * 0.5, h * 0.38, 280, 180);
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
      .text(w / 2, 42, "Collectors Skin Boutique", {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(
        w / 2,
        78,
        "Rod skins from sealed crates · Duplicates refund $7,500 · W / ESC to leave",
        {
          fontFamily: "Arial",
          fontSize: "14px",
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

    // Crate product card
    const cx = w / 2;
    const cy = h * 0.4;
    const card = this.add
      .rectangle(cx, cy, 260, 200, 0x2a1814, 0.95)
      .setStrokeStyle(2, 0xc4a86a)
      .setDepth(12)
      .setInteractive({ useHandCursor: true });

    this.add
      .image(cx, cy - 36, "skin_crate")
      .setDisplaySize(72, 72)
      .setDepth(13);

    this.add
      .text(cx, cy + 24, "Skin Crate", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5)
      .setDepth(13);

    this.add
      .text(cx, cy + 52, `$${SKIN_CRATE_PRICE.toLocaleString()}`, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffe066",
      })
      .setOrigin(0.5)
      .setDepth(13);

    this.add
      .text(cx, cy + 78, "Click to buy · Open in Inventory", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#a89078",
      })
      .setOrigin(0.5)
      .setDepth(13);

    card.on("pointerover", () => card.setStrokeStyle(2, 0xffe066));
    card.on("pointerout", () => card.setStrokeStyle(2, 0xc4a86a));
    card.on("pointerdown", () => this.tryBuy());

    this.add
      .text(
        w / 2,
        h * 0.72,
        "Odds: Golden Lucky 39% · Universal Portal 25% · Pufferfirm 15%\n" +
          `Poisoned 10% · Pistol 7% · Laser 3% · Dupes → $${SKIN_CRATE_DUPLICATE_REFUND.toLocaleString()}`,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#b0a090",
          align: "center",
          lineSpacing: 4,
        }
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.refreshCoins();
  }

  private tryBuy(): void {
    const result = this.inventory.buySkinCrate();
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
