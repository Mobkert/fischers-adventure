import Phaser from "phaser";

export type NpcSpeechChoiceHandlers = {
  onYes: () => void;
  onNo: () => void;
  yesLabel?: string;
  noLabel?: string;
};

export type NpcMenuOption = {
  label: string;
  hotkey?: string;
  fill?: number;
  stroke?: number;
  onClick: () => void;
};

type BubbleStyle = "merchant" | "simple";

/**
 * Speech bubble with optional Yes/No or a vertical menu of choices beside it.
 * Keyboard still uses F = Yes / first option, X = No / last cancel via scene handlers.
 */
export class NpcSpeechBubble {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private choiceBtns: Phaser.GameObjects.Container[] = [];
  private style: BubbleStyle;
  private anchorX: number;
  private anchorY: number;

  constructor(
    scene: Phaser.Scene,
    anchorX: number,
    anchorY: number,
    style: BubbleStyle = "simple"
  ) {
    this.scene = scene;
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.style = style;
    this.root = scene.add.container(0, 0).setDepth(30);
    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: style === "merchant" ? "14px" : "13px",
        color: "#ffffff",
        align: "center",
        lineSpacing: 4,
        wordWrap: { width: style === "merchant" ? 220 : 300 },
      })
      .setOrigin(0.5, 1);
    this.root.add([this.bg, this.label]);
  }

  show(
    text: string,
    color = "#ffffff",
    choices?: NpcSpeechChoiceHandlers
  ): void {
    this.showWithOptions(
      text,
      color,
      choices
        ? [
            {
              label: choices.yesLabel ?? "Yes",
              hotkey: "F",
              fill: 0x2a5a3a,
              stroke: 0x7cfc00,
              onClick: choices.onYes,
            },
            {
              label: choices.noLabel ?? "No",
              hotkey: "X",
              fill: 0x5a2a2a,
              stroke: 0xffaa66,
              onClick: choices.onNo,
            },
          ]
        : undefined
    );
  }

  /** Multi-option menu (e.g. Astral Warden). */
  showWithOptions(
    text: string,
    color = "#ffffff",
    options?: NpcMenuOption[]
  ): void {
    this.clearChoices();
    this.label.setColor(color);
    this.label.setText(text);

    const padX = 14;
    const padY = 10;
    const tw = this.label.width;
    const th = this.label.height;
    const bubbleW = tw + padX * 2;
    const bubbleH = th + padY * 2;

    const hasOpts = !!options && options.length > 0;
    const choiceW = hasOpts ? 118 : 0;
    const choiceGap = hasOpts ? 10 : 0;
    const totalW = bubbleW + (hasOpts ? choiceGap + choiceW : 0);
    const left = this.anchorX - totalW / 2;
    const bubbleCx = left + bubbleW / 2;
    const bubbleBottom = this.anchorY;
    const bubbleTop = bubbleBottom - bubbleH;

    this.label.setPosition(bubbleCx, bubbleBottom - padY);

    this.bg.clear();
    if (this.style === "merchant") {
      this.bg.fillStyle(0x1a1a22, 0.92);
      this.bg.fillRoundedRect(left, bubbleTop, bubbleW, bubbleH, 10);
      this.bg.lineStyle(2, 0xe8d5a3, 1);
      this.bg.strokeRoundedRect(left, bubbleTop, bubbleW, bubbleH, 10);
      this.bg.fillStyle(0x1a1a22, 0.92);
    } else {
      this.bg.fillStyle(0x000000, 0.78);
      this.bg.fillRoundedRect(left, bubbleTop, bubbleW, bubbleH, 8);
    }
    this.bg.fillTriangle(
      this.anchorX - 8,
      bubbleBottom - 2,
      this.anchorX + 8,
      bubbleBottom - 2,
      this.anchorX,
      bubbleBottom + 12
    );

    if (hasOpts && options) {
      const btnX = left + bubbleW + choiceGap + choiceW / 2;
      const btnH = 38;
      const stackH = options.length * btnH + (options.length - 1) * 6;
      let y = bubbleTop + bubbleH / 2 - stackH / 2 + btnH / 2;
      for (const opt of options) {
        const btn = this.makeChoiceButton(
          btnX,
          y,
          opt.label,
          opt.hotkey ?? "",
          opt.fill ?? 0x2a3a5a,
          opt.stroke ?? 0x7ec8e8,
          opt.onClick,
          choiceW - 8
        );
        this.choiceBtns.push(btn);
        this.root.add(btn);
        y += btnH + 6;
      }
    }
  }

  destroy(): void {
    this.clearChoices();
    this.root.destroy(true);
  }

  private clearChoices(): void {
    for (const b of this.choiceBtns) b.destroy(true);
    this.choiceBtns = [];
  }

  private makeChoiceButton(
    x: number,
    y: number,
    label: string,
    hotkey: string,
    fill: number,
    stroke: number,
    onClick: () => void,
    w = 70
  ): Phaser.GameObjects.Container {
    const h = 36;
    const hit = this.scene.add
      .rectangle(0, 0, w, h, fill, 0.95)
      .setStrokeStyle(2, stroke)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(0, hotkey ? -6 : 0, label, {
        fontFamily: "Arial",
        fontSize: w > 80 ? "12px" : "14px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
        wordWrap: { width: w - 8 },
      })
      .setOrigin(0.5);
    const kids: Phaser.GameObjects.GameObject[] = [hit, text];
    if (hotkey) {
      kids.push(
        this.scene.add
          .text(0, 10, hotkey, {
            fontFamily: "Arial",
            fontSize: "10px",
            color: "#c8d0d8",
          })
          .setOrigin(0.5)
      );
    }

    hit.on("pointerover", () => {
      hit.setFillStyle(fill, 1);
      hit.setScale(1.05);
    });
    hit.on("pointerout", () => {
      hit.setFillStyle(fill, 0.95);
      hit.setScale(1);
    });
    hit.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      onClick();
    });

    return this.scene.add.container(x, y, kids);
  }
}
