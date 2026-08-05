import Phaser from "phaser";

/**
 * Offer coins to the floating Coral Rod — price is never shown.
 * Type digits, Enter to offer, Esc/X to close.
 */
export class CoralRodOfferPanel {
  private root: Phaser.GameObjects.Container;
  private amountText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;
  visible = false;
  private digits = "";
  private onOffer?: (amount: number) => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 10;

    this.root = scene.add.container(cx, cy).setDepth(155).setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, 440, 260, 0x142028, 0.96)
      .setStrokeStyle(2, 0xff8fb8);

    const title = scene.add
      .text(0, -95, "Coral Rod", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#ffe8f0",
      })
      .setOrigin(0.5);

    const icon = scene.add.image(0, -48, "rod_coral").setDisplaySize(56, 56);

    this.hintText = scene.add
      .text(0, 8, "Offer a gift of coins.\nType an amount, then Enter.", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#c8d8e0",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    this.amountText = scene.add
      .text(0, 62, "$0", {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    const footer = scene.add
      .text(0, 105, "Enter — Offer    Esc — Leave", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#8899aa",
      })
      .setOrigin(0.5);

    this.root.add([bg, title, icon, this.hintText, this.amountText, footer]);
  }

  setCallbacks(onOffer: (amount: number) => void, onClose?: () => void): void {
    this.onOffer = onOffer;
    this.onClose = onClose;
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (open) {
      this.digits = "";
      this.refreshAmount();
    }
  }

  /** Handle a key while the panel is open. Returns true if consumed. */
  handleKey(event: KeyboardEvent): boolean {
    if (!this.visible) return false;

    if (event.key === "Escape") {
      this.setOpen(false);
      this.onClose?.();
      return true;
    }
    if (event.key === "Enter") {
      const amount = this.digits === "" ? 0 : parseInt(this.digits, 10);
      this.onOffer?.(Number.isFinite(amount) ? amount : 0);
      return true;
    }
    if (event.key === "Backspace") {
      this.digits = this.digits.slice(0, -1);
      this.refreshAmount();
      return true;
    }
    if (/^[0-9]$/.test(event.key) && this.digits.length < 7) {
      this.digits += event.key;
      this.refreshAmount();
      return true;
    }
    return false;
  }

  private refreshAmount(): void {
    const n = this.digits === "" ? 0 : parseInt(this.digits, 10);
    this.amountText.setText(`$${n.toLocaleString("en-US")}`);
  }
}
