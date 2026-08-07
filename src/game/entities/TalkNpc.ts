import Phaser from "phaser";

/** Simple dockside NPC with one speech bubble (no shop). */
export class TalkNpc {
  sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private bubbleBg?: Phaser.GameObjects.Graphics;
  private bubbleText?: Phaser.GameObjects.Text;
  talking = false;

  readonly x: number;
  readonly y: number;
  private readonly lines: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    groundY: number,
    displayName: string,
    lines: string
  ) {
    this.scene = scene;
    this.x = x;
    this.y = groundY;
    this.lines = lines;

    this.sprite = scene.add.sprite(x, this.y, "npc_merchant");
    this.sprite.setDepth(11);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setTint(0xc8e8ff);

    scene.add
      .text(x, this.y - 60, displayName, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#a8d8ff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  isNear(px: number, py: number, radius = 70): boolean {
    return Phaser.Math.Distance.Between(px, py, this.x, this.y - 28) < radius;
  }

  /** Show lore dialogue. Returns true if F was consumed. */
  interact(): boolean {
    // Already open — F closes it
    if (this.talking) {
      this.decline();
      return true;
    }
    // Silent NPC (dialogue not ready yet)
    if (!this.lines.trim()) {
      return true;
    }
    this.talking = true;
    this.showBubble(this.lines);
    return true;
  }

  /** Speak custom lines (quest NPCs). */
  speak(text: string): void {
    this.talking = true;
    this.showBubble(text);
  }

  decline(): void {
    this.clearBubble();
    this.talking = false;
  }

  private showBubble(text: string): void {
    this.clearBubble();
    const maxW = 340;
    this.bubbleText = this.scene.add
      .text(this.x, this.y - 118, text, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: maxW - 24 },
        lineSpacing: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(30);

    const b = this.bubbleText.getBounds();
    const padX = 14;
    const padY = 10;
    this.bubbleBg = this.scene.add.graphics().setDepth(29);
    this.bubbleBg.fillStyle(0x000000, 0.78);
    this.bubbleBg.fillRoundedRect(
      b.x - padX,
      b.y - padY,
      b.width + padX * 2,
      b.height + padY * 2,
      8
    );
    // Tail
    this.bubbleBg.fillTriangle(
      this.x - 8,
      b.bottom + padY - 2,
      this.x + 8,
      b.bottom + padY - 2,
      this.x,
      b.bottom + padY + 12
    );
  }

  private clearBubble(): void {
    this.bubbleBg?.destroy();
    this.bubbleText?.destroy();
    this.bubbleBg = undefined;
    this.bubbleText = undefined;
  }
}
