import Phaser from "phaser";
import { BargainKind } from "../systems/BargainLogic";
import { NpcSpeechBubble } from "../ui/NpcSpeechBubble";

/** Side-view bargainer NPC — same look as the village merchant. */
export class BargainerNpc {
  sprite: Phaser.GameObjects.Sprite;
  readonly kind: BargainKind;
  readonly name: string;
  private scene: Phaser.Scene;
  readonly x: number;
  readonly y: number;
  talking = false;
  private bubble?: NpcSpeechBubble;
  private nameTag: Phaser.GameObjects.Text;
  private onNo?: () => void;

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

  showBubble(message: string, onNo?: () => void): void {
    this.clearBubble();
    this.talking = true;
    this.onNo = onNo;
    this.bubble = new NpcSpeechBubble(this.scene, this.x, this.y - 100, "simple");
    this.bubble.show(message, "#f0e6d2", {
      onYes: () => {
        /* Panel stays open — Yes just acknowledges the pitch */
      },
      onNo: () => {
        this.onNo?.();
        this.decline();
      },
      yesLabel: "Yes",
      noLabel: "No",
    });
  }

  clearBubble(): void {
    this.bubble?.destroy();
    this.bubble = undefined;
    this.talking = false;
    this.onNo = undefined;
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
