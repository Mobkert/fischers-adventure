import Phaser from "phaser";
import { InventorySystem } from "../systems/InventorySystem";
import { redeemPromoCode } from "../systems/PromoCodes";

type PanelMode = "code" | "message";

/** Code Guy — promo code entry. */
export class CodeGuyPanel {
  private root: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private codeText: Phaser.GameObjects.Text;
  private footerText: Phaser.GameObjects.Text;
  private inventory!: InventorySystem;
  private mode: PanelMode = "code";
  private codeInput = "";
  visible = false;

  private onClose?: () => void;
  private onCoins?: () => void;
  private onToast?: (msg: string, color: string) => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 16;

    this.root = scene.add.container(cx, cy).setDepth(165).setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, 500, 380, 0x141820, 0.97)
      .setStrokeStyle(2, 0x888888);

    this.titleText = scene.add
      .text(0, -168, "Code Guy", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#e8e0d0",
      })
      .setOrigin(0.5);

    this.bodyText = scene.add
      .text(0, -128, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c8d0d8",
        align: "center",
        wordWrap: { width: 440 },
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);

    this.codeText = scene.add
      .text(0, -20, "", {
        fontFamily: "Consolas, monospace",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#222830",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5);

    this.footerText = scene.add
      .text(0, 168, "", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#8899aa",
        align: "center",
        wordWrap: { width: 440 },
      })
      .setOrigin(0.5);

    this.root.add([
      bg,
      this.titleText,
      this.bodyText,
      this.codeText,
      this.footerText,
    ]);
  }

  setInventory(inv: InventorySystem): void {
    this.inventory = inv;
  }

  setCallbacks(
    onClose?: () => void,
    onCoins?: () => void,
    onToast?: (msg: string, color: string) => void
  ): void {
    this.onClose = onClose;
    this.onCoins = onCoins;
    this.onToast = onToast;
  }

  open(): void {
    this.visible = true;
    this.root.setVisible(true);
    this.codeInput = "";
    this.showCodeMode();
  }

  close(): void {
    this.visible = false;
    this.root.setVisible(false);
    this.onClose?.();
  }

  isOpen(): boolean {
    return this.visible;
  }

  handleKey(event: KeyboardEvent): boolean {
    if (!this.visible) return false;

    if (event.key === "Escape") {
      this.close();
      return true;
    }

    if (this.mode === "message") {
      if (
        event.key === "Enter" ||
        event.key === "f" ||
        event.key === "F" ||
        event.key === "x" ||
        event.key === "X"
      ) {
        this.close();
        return true;
      }
      return true;
    }

    if (event.key === "Enter") {
      this.submitCode();
      return true;
    }
    if (event.key === "Backspace") {
      this.codeInput = this.codeInput.slice(0, -1);
      this.refreshCodeDisplay();
      return true;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (this.codeInput.length >= 48) return true;
      this.codeInput += event.key;
      this.refreshCodeDisplay();
      return true;
    }
    return true;
  }

  private showCodeMode(): void {
    this.mode = "code";
    this.titleText.setText("Code Guy");
    this.bodyText.setText(
      "Got a promo code?\nType it below and press Enter."
    );
    this.codeText.setVisible(true);
    this.footerText.setText("Enter — redeem   Esc — leave");
    this.refreshCodeDisplay();
  }

  private refreshCodeDisplay(): void {
    const shown = this.codeInput.length > 0 ? this.codeInput : " ";
    this.codeText.setText(shown);
  }

  private submitCode(): void {
    const result = redeemPromoCode(this.inventory, this.codeInput);
    if (!result.ok) {
      this.showMessage(result.message, "#ff8866");
      return;
    }
    this.onCoins?.();
    this.showMessage(result.message, "#7dff9a");
  }

  private showMessage(text: string, _color: string): void {
    this.mode = "message";
    this.codeText.setVisible(false);
    this.bodyText.setText(text);
    this.footerText.setText("Enter / Esc — close");
    this.onToast?.(text, _color);
  }
}
