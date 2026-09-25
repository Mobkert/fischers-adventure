import Phaser from "phaser";
import { ITEMS, formatRodStats, formatRodMutationLines } from "../data/items";

/** Inspect Dusty Rod stats, then F / click to confirm purchase. */
export class DustyRodBuyPanel {
  private root: Phaser.GameObjects.Container;
  visible = false;
  private onConfirm?: () => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 20;

    this.root = scene.add.container(cx, cy).setDepth(150).setVisible(false);
    this.root.setScrollFactor(0);

    const def = ITEMS.dusty_rod;
    const stats = def.rodStats!;
    const mutLines = formatRodMutationLines(def);

    const bg = scene.add
      .rectangle(0, 0, 440, 400, 0x1a1814, 0.96)
      .setStrokeStyle(2, 0xc4a878);

    const title = scene.add
      .text(0, -158, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f5ecd8",
      })
      .setOrigin(0.5);

    const icon = scene.add.image(0, -98, def.textureKey).setDisplaySize(64, 64);

    const price = scene.add
      .text(0, -58, `$${def.buyPrice}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    const statsText = scene.add
      .text(0, -20, formatRodStats(stats), {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#d8d8d8",
        align: "center",
        lineSpacing: 5,
      })
      .setOrigin(0.5, 0);

    const mutText = scene.add
      .text(0, 72, mutLines, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#e8c878",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);

    const buyBtn = scene.add
      .rectangle(0, 148, 200, 42, 0x6b5340)
      .setStrokeStyle(1, 0xc4a878)
      .setInteractive({ useHandCursor: true });

    const buyLabel = scene.add
      .text(0, 148, "Buy", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hint = scene.add
      .text(0, 186, "F or click to buy · X to cancel", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#888888",
      })
      .setOrigin(0.5);

    buyBtn.on("pointerover", () => buyBtn.setFillStyle(0x8a6a4a));
    buyBtn.on("pointerout", () => buyBtn.setFillStyle(0x6b5340));
    buyBtn.on("pointerdown", () => this.confirm());

    this.root.add([
      bg,
      title,
      icon,
      price,
      statsText,
      mutText,
      buyBtn,
      buyLabel,
      hint,
    ]);
  }

  setCallbacks(onConfirm: () => void, onClose?: () => void): void {
    this.onConfirm = onConfirm;
    this.onClose = onClose;
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (!open) this.onClose?.();
  }

  confirm(): void {
    if (!this.visible) return;
    this.onConfirm?.();
  }

  close(): void {
    if (!this.visible) return;
    this.setOpen(false);
  }
}
