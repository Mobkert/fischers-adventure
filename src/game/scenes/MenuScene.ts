import Phaser from "phaser";
import {
  getActiveSlotIndex,
  listSaveSlots,
  loadActiveSave,
} from "../save/SaveBank";

export class MenuScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.starting = false;

    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }

    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x6eb6e0, 0x6eb6e0, 0x1e4a3a, 0x2a6a4a, 1);
    bg.fillRect(0, 0, width, height);

    this.add.rectangle(
      width / 2,
      height * 0.78,
      width,
      height * 0.45,
      0x2a7a9a,
      0.35
    );

    this.add
      .text(width / 2, height * 0.2, "Fischer's Adventure", {
        fontFamily: "Georgia, serif",
        fontSize: "56px",
        color: "#f5f0e6",
        stroke: "#1a3d2a",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.3, "Cast your line. Chase the mythics.", {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#d8e8d8",
      })
      .setOrigin(0.5);

    this.makeButton(width / 2, height * 0.46, "Play", 0x2a6b4a, () => {
      this.startGame();
    });

    this.makeButton(width / 2, height * 0.58, "Saves", 0x2a5a88, () => {
      if (this.starting) return;
      this.scene.start("SavesScene");
    });

    const active = getActiveSlotIndex();
    const slot = listSaveSlots()[active];
    const save = loadActiveSave();
    const detail = slot.empty
      ? "Empty slot"
      : `$${save.coins.toLocaleString()} · ${save.ownedRods.length} rods`;

    this.add
      .text(
        width / 2,
        height * 0.7,
        `Active: Slot ${active + 1}  ·  ${detail}`,
        {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#ffe066",
        }
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.9,
        "A/D move · LMB cast · E inventory · 2 equipment bag",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#a8c0b0",
        }
      )
      .setOrigin(0.5);

    this.makeButton(width - 90, 40, "Updates", 0x4a3a28, () => {
      this.showUpdateLog();
    }, 140, 40, "16px");

    // Show update log when the menu opens
    this.showUpdateLog();
  }

  private showUpdateLog(): void {
    const { width, height } = this.scale;
    const root = this.add.container(width / 2, height / 2).setDepth(50);

    const dim = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.55)
      .setInteractive();

    const panel = this.add
      .rectangle(0, 0, 420, 240, 0x1a241c, 0.97)
      .setStrokeStyle(2, 0xc4a86a);

    const title = this.add
      .text(0, -78, "Update Log", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const body = this.add
      .text(0, -10, "Next update expected tomorrow.", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#d0d8d0",
        align: "center",
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5);

    const closeBg = this.add
      .rectangle(0, 78, 140, 40, 0x2a6b4a)
      .setStrokeStyle(1, 0xf0e6d2)
      .setInteractive({ useHandCursor: true });
    const closeLabel = this.add
      .text(0, 78, "OK", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const close = () => root.destroy(true);
    closeBg.on("pointerover", () => closeBg.setFillStyle(0x3a8a5a));
    closeBg.on("pointerout", () => closeBg.setFillStyle(0x2a6b4a));
    closeBg.on("pointerdown", close);
    dim.on("pointerdown", close);

    root.add([dim, panel, title, body, closeBg, closeLabel]);
  }

  private startGame(): void {
    if (this.starting) return;
    this.starting = true;

    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }

    // Tear down anything that could sit on top of / race with the game
    this.scene.stop("UIScene");
    this.scene.stop("ShopScene");
    this.scene.stop("SavesScene");
    this.scene.start("GameScene");
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
    btnW = 280,
    btnH = 56,
    fontSize = "26px"
  ): void {
    const hover = Phaser.Display.Color.IntegerToColor(color).lighten(20).color;
    const bg = this.add
      .rectangle(x, y, btnW, btnH, color, 0.95)
      .setStrokeStyle(2, 0xf0e6d2)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: "Georgia, serif",
        fontSize,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(hover, 0.98));
    bg.on("pointerout", () => bg.setFillStyle(color, 0.95));
    bg.on("pointerdown", onClick);
  }
}
