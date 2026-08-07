import Phaser from "phaser";
import { BargainKind } from "../systems/BargainLogic";

/** Side-view bargainer NPC — same look as the village merchant. */
export class BargainerNpc {
  sprite: Phaser.GameObjects.Sprite;
  readonly kind: BargainKind;
  readonly name: string;
  private scene: Phaser.Scene;
  readonly x: number;
  readonly y: number;
  talking = false;
  private bubbleBg?: Phaser.GameObjects.Graphics;
  private bubbleText?: Phaser.GameObjects.Text;
  private nameTag: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    groundY: number,
    kind: BargainKind,
    name: string,
    tint = 0xffffff
  ) {
    this.scene = scene;
    this.x = x;
    this.y = groundY;
    this.kind = kind;
    this.name = name;

    this.sprite = scene.add.sprite(x, groundY, "npc_merchant");
    this.sprite.setDepth(11);
    this.sprite.setOrigin(0.5, 1);
    if (tint !== 0xffffff) this.sprite.setTint(tint);

    this.nameTag = scene.add
      .text(x, groundY - 60, name, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: kind === "fish_buy" ? "#ffe8a0" : "#e8d0a0",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  isNear(px: number, py: number, radius = 70): boolean {
    return Phaser.Math.Distance.Between(px, py, this.x, this.y - 28) < radius;
  }

  showBubble(message: string): void {
    this.clearBubble();
    this.talking = true;
    this.bubbleText = this.scene.add
      .text(this.x, this.y - 100, message, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#f0e6d2",
        align: "center",
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5, 1)
      .setDepth(30);
    const b = this.bubbleText.getBounds();
    this.bubbleBg = this.scene.add.graphics().setDepth(29);
    this.bubbleBg.fillStyle(0x000000, 0.78);
    this.bubbleBg.fillRoundedRect(
      b.x - 8,
      b.y - 6,
      b.width + 16,
      b.height + 12,
      6
    );
  }

  clearBubble(): void {
    this.bubbleBg?.destroy();
    this.bubbleText?.destroy();
    this.bubbleBg = undefined;
    this.bubbleText = undefined;
    this.talking = false;
  }

  decline(): void {
    this.clearBubble();
  }

  destroy(): void {
    this.clearBubble();
    this.sprite.destroy();
    this.nameTag.destroy();
  }
}
