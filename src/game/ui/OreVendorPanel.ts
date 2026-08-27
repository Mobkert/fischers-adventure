import Phaser from "phaser";
import {
  ORE_CLUSTER_VENDOR_PRICE,
  ORE_CLUSTER_VENDOR_STOCK_MAX,
} from "../data/items";
import { formatCurioRestock } from "../systems/CurioTraderStock";

/** Ashencast ore peddler — buy 1–20 ore clusters ($240 each). */
export class OreVendorPanel {
  private root: Phaser.GameObjects.Container;
  private amountText!: Phaser.GameObjects.Text;
  private totalText!: Phaser.GameObjects.Text;
  private stockText!: Phaser.GameObjects.Text;
  private buyLabel!: Phaser.GameObjects.Text;
  private buyBtn!: Phaser.GameObjects.Rectangle;
  private minusBtn!: Phaser.GameObjects.Rectangle;
  private plusBtn!: Phaser.GameObjects.Rectangle;
  visible = false;
  private amount = 1;
  private stock = ORE_CLUSTER_VENDOR_STOCK_MAX;
  private restockMs = 0;
  private onBuy?: (amount: number) => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 16;

    this.root = scene.add.container(cx, cy).setDepth(155).setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, 420, 320, 0x1a1814, 0.96)
      .setStrokeStyle(2, 0xc45a3a);

    const title = scene.add
      .text(0, -128, "Ore Peddler", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5);

    const icon = scene.add
      .image(0, -72, "ore_cluster")
      .setDisplaySize(56, 48);

    const priceLine = scene.add
      .text(0, -28, `$${ORE_CLUSTER_VENDOR_PRICE} each`, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    this.stockText = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c8c0b0",
      })
      .setOrigin(0.5);

    this.minusBtn = scene.add
      .rectangle(-70, 48, 44, 40, 0x3a3428)
      .setStrokeStyle(1, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    const minusLabel = scene.add
      .text(-70, 48, "−", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.amountText = scene.add
      .text(0, 48, "1", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.plusBtn = scene.add
      .rectangle(70, 48, 44, 40, 0x3a3428)
      .setStrokeStyle(1, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    const plusLabel = scene.add
      .text(70, 48, "+", {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.totalText = scene.add
      .text(0, 92, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    this.buyBtn = scene.add
      .rectangle(0, 132, 200, 42, 0x5a3a28)
      .setStrokeStyle(1, 0xc45a3a)
      .setInteractive({ useHandCursor: true });
    this.buyLabel = scene.add
      .text(0, 132, "Buy", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hint = scene.add
      .text(0, 172, "− / + amount · Buy · Esc leave", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.minusBtn.on("pointerdown", () => this.setAmount(this.amount - 1));
    this.plusBtn.on("pointerdown", () => this.setAmount(this.amount + 1));
    this.buyBtn.on("pointerover", () => {
      if (this.stock > 0) this.buyBtn.setFillStyle(0x6e4a34);
    });
    this.buyBtn.on("pointerout", () => this.buyBtn.setFillStyle(0x5a3a28));
    this.buyBtn.on("pointerdown", () => this.confirm());

    this.root.add([
      bg,
      title,
      icon,
      priceLine,
      this.stockText,
      this.minusBtn,
      minusLabel,
      this.amountText,
      this.plusBtn,
      plusLabel,
      this.totalText,
      this.buyBtn,
      this.buyLabel,
      hint,
    ]);
  }

  setCallbacks(onBuy: (amount: number) => void, onClose?: () => void): void {
    this.onBuy = onBuy;
    this.onClose = onClose;
  }

  open(stock: number, restockMs: number): void {
    this.stock = stock;
    this.restockMs = restockMs;
    this.amount = stock > 0 ? 1 : 0;
    this.visible = true;
    this.root.setVisible(true);
    this.refresh();
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (!open) this.onClose?.();
  }

  /** Live-refresh stock / cooldown while open. */
  syncState(stock: number, restockMs: number): void {
    if (!this.visible) return;
    this.stock = stock;
    this.restockMs = restockMs;
    if (this.amount > stock) this.amount = Math.max(0, stock);
    if (this.amount < 1 && stock > 0) this.amount = 1;
    this.refresh();
  }

  handleKey(event: KeyboardEvent): boolean {
    if (!this.visible) return false;
    if (event.key === "Escape" || event.key === "x" || event.key === "X") {
      this.setOpen(false);
      return true;
    }
    if (event.key === "Enter") {
      this.confirm();
      return true;
    }
    if (event.key === "-" || event.key === "ArrowLeft") {
      this.setAmount(this.amount - 1);
      return true;
    }
    if (event.key === "+" || event.key === "=" || event.key === "ArrowRight") {
      this.setAmount(this.amount + 1);
      return true;
    }
    return false;
  }

  private setAmount(n: number): void {
    const max = Math.min(ORE_CLUSTER_VENDOR_STOCK_MAX, Math.max(0, this.stock));
    this.amount = Phaser.Math.Clamp(n, max > 0 ? 1 : 0, max);
    this.refresh();
  }

  private refresh(): void {
    if (this.stock <= 0) {
      this.stockText.setText(
        `Sold out · restocks in ${formatCurioRestock(this.restockMs)}`
      );
      this.amountText.setText("—");
      this.totalText.setText("");
      this.buyLabel.setText("Sold out");
      this.buyBtn.setAlpha(0.45);
      this.minusBtn.setAlpha(0.35);
      this.plusBtn.setAlpha(0.35);
      return;
    }
    this.stockText.setText(
      `In stock: ${this.stock} / ${ORE_CLUSTER_VENDOR_STOCK_MAX}`
    );
    this.amountText.setText(String(this.amount));
    const total = this.amount * ORE_CLUSTER_VENDOR_PRICE;
    this.totalText.setText(`Total  $${total.toLocaleString("en-US")}`);
    this.buyLabel.setText(`Buy ${this.amount}`);
    this.buyBtn.setAlpha(1);
    this.minusBtn.setAlpha(1);
    this.plusBtn.setAlpha(1);
  }

  private confirm(): void {
    if (!this.visible || this.stock <= 0 || this.amount < 1) return;
    this.onBuy?.(this.amount);
  }
}
