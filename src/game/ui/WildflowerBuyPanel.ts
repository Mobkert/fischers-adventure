import Phaser from "phaser";
import { ITEMS, formatRodStats, MUTATIONS } from "../data/items";

/** Inspect Wildflower Rod stats, then F / click to confirm purchase. */
export class WildflowerBuyPanel {
  private root: Phaser.GameObjects.Container;
  visible = false;
  private onConfirm?: () => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 20;

    this.root = scene.add.container(cx, cy).setDepth(150).setVisible(false);
    this.root.setScrollFactor(0);

    const def = ITEMS.wildflower_rod;
    const stats = def.rodStats!;

    const bg = scene.add
      .rectangle(0, 0, 420, 360, 0x1a1c22, 0.96)
      .setStrokeStyle(2, 0xf472b6);

    const title = scene.add
      .text(0, -140, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#ffe8f0",
      })
      .setOrigin(0.5);

    const icon = scene.add
      .image(0, -78, def.textureKey)
      .setDisplaySize(64, 64);

    const price = scene.add
      .text(0, -38, `$${def.buyPrice}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    const statsText = scene.add
      .text(0, 4, formatRodStats(stats), {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#d8d8d8",
        align: "center",
        lineSpacing: 5,
      })
      .setOrigin(0.5, 0);

    const bloom = MUTATIONS.bloom;
    const mutText = scene.add
      .text(
        0,
        78,
        `Bloom mutation  ${Math.round((def.rodMutation?.chance ?? 0) * 100)}%  ·  ${bloom.sellMult}× sell`,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: bloom.toastColor,
        }
      )
      .setOrigin(0.5);

    const buyBtn = scene.add
      .rectangle(0, 118, 200, 42, 0x3d6b4f)
      .setStrokeStyle(1, 0x7dce7a)
      .setInteractive({ useHandCursor: true });

    const buyLabel = scene.add
      .text(0, 118, "Buy", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hint = scene.add
      .text(0, 156, "F or click to buy · X to cancel", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#888888",
      })
      .setOrigin(0.5);

    buyBtn.on("pointerover", () => buyBtn.setFillStyle(0x4a8a62));
    buyBtn.on("pointerout", () => buyBtn.setFillStyle(0x3d6b4f));
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
