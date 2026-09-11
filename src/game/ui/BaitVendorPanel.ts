import Phaser from "phaser";
import { BAIT_CRATE_BUY_MAX, BAIT_CRATE_PRICE } from "../data/items";

/** Island bait crate shop — buy 1–50 crates (type digits). */
export class BaitVendorPanel {
  private root: Phaser.GameObjects.Container;
  private amountText!: Phaser.GameObjects.Text;
  private totalText!: Phaser.GameObjects.Text;
  private islandText!: Phaser.GameObjects.Text;
  private buyLabel!: Phaser.GameObjects.Text;
  private buyBtn!: Phaser.GameObjects.Rectangle;
  private minusBtn!: Phaser.GameObjects.Rectangle;
  private plusBtn!: Phaser.GameObjects.Rectangle;
  visible = false;
  private amount = 1;
  private islandName = "";
  private onBuy?: (amount: number) => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 16;

    this.root = scene.add.container(cx, cy).setDepth(155).setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, 420, 340, 0x141820, 0.96)
      .setStrokeStyle(2, 0x7ec8ff);

    const title = scene.add
      .text(0, -138, "Bait Crate", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#e8f4ff",
      })
      .setOrigin(0.5);

    this.islandText = scene.add
      .text(0, -108, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#8899aa",
      })
      .setOrigin(0.5);

    const icon = scene.add.image(0, -62, "bait_crate").setDisplaySize(60, 54);

    const priceLine = scene.add
      .text(0, -18, `$${BAIT_CRATE_PRICE} each · unlimited stock`, {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    this.minusBtn = scene.add
      .rectangle(-70, 36, 44, 40, 0x2a3444)
      .setStrokeStyle(1, 0x7ec8ff)
      .setInteractive({ useHandCursor: true });
    const minusLabel = scene.add
      .text(-70, 36, "−", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#e8f4ff",
      })
      .setOrigin(0.5);

    this.amountText = scene.add
      .text(0, 36, "1", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.plusBtn = scene.add
      .rectangle(70, 36, 44, 40, 0x2a3444)
      .setStrokeStyle(1, 0x7ec8ff)
      .setInteractive({ useHandCursor: true });
    const plusLabel = scene.add
      .text(70, 36, "+", {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#e8f4ff",
      })
      .setOrigin(0.5);

    this.totalText = scene.add
      .text(0, 82, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    this.buyBtn = scene.add
      .rectangle(0, 128, 200, 42, 0x284858)
      .setStrokeStyle(1, 0x7ec8ff)
      .setInteractive({ useHandCursor: true });
    this.buyLabel = scene.add
      .text(0, 128, "Buy", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hint = scene.add
      .text(0, 172, "Type 1–50 · − / + · Enter buy · Esc leave", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#888888",
      })
      .setOrigin(0.5);

    const desc = scene.add
      .text(0, 208, "Open crates in your bag — bait goes to\nEquipment Bag › Bait tab.", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#99aabb",
        align: "center",
      })
      .setOrigin(0.5);

    this.minusBtn.on("pointerdown", () => this.setAmount(this.amount - 1));
    this.plusBtn.on("pointerdown", () => this.setAmount(this.amount + 1));
    this.buyBtn.on("pointerover", () => this.buyBtn.setFillStyle(0x345868));
    this.buyBtn.on("pointerout", () => this.buyBtn.setFillStyle(0x284858));
    this.buyBtn.on("pointerdown", () => this.confirm());

    this.root.add([
      bg,
      title,
      this.islandText,
      icon,
      priceLine,
      this.minusBtn,
      minusLabel,
      this.amountText,
      this.plusBtn,
      plusLabel,
      this.totalText,
      this.buyBtn,
      this.buyLabel,
      hint,
      desc,
    ]);
  }

  setCallbacks(onBuy: (amount: number) => void, onClose?: () => void): void {
    this.onBuy = onBuy;
    this.onClose = onClose;
  }

  open(islandName: string): void {
    this.islandName = islandName;
    this.amount = 1;
    this.visible = true;
    this.root.setVisible(true);
    this.refresh();
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (!open) this.onClose?.();
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
    if (event.key === "Backspace") {
      const digits = String(this.amount);
      const next = digits.length <= 1 ? 0 : parseInt(digits.slice(0, -1), 10);
      this.setAmount(next);
      return true;
    }
    if (/^[0-9]$/.test(event.key)) {
      const digit = parseInt(event.key, 10);
      const next =
        this.amount <= 0 ? digit : this.amount * 10 + digit;
      this.setAmount(next);
      return true;
    }
    return false;
  }

  private setAmount(n: number): void {
    if (n <= 0) {
      this.amount = 0;
    } else {
      this.amount = Phaser.Math.Clamp(Math.floor(n), 1, BAIT_CRATE_BUY_MAX);
    }
    this.refresh();
  }

  private refresh(): void {
    this.islandText.setText(this.islandName);
    this.amountText.setText(this.amount > 0 ? String(this.amount) : "—");
    if (this.amount < 1) {
      this.totalText.setText("");
      this.buyLabel.setText("Buy");
      this.buyBtn.setAlpha(0.45);
      return;
    }
    const total = this.amount * BAIT_CRATE_PRICE;
    this.totalText.setText(`Total  $${total.toLocaleString("en-US")}`);
    this.buyLabel.setText(`Buy ${this.amount}`);
    this.buyBtn.setAlpha(1);
  }

  private confirm(): void {
    if (!this.visible || this.amount < 1) return;
    this.onBuy?.(this.amount);
  }
}
