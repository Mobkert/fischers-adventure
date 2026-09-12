import Phaser from "phaser";
import { NpcMenuOption, NpcSpeechBubble } from "../ui/NpcSpeechBubble";

/** Simple dockside NPC with one speech bubble (no shop). */
export class TalkNpc {
  sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private nameLabel: Phaser.GameObjects.Text;
  private bubble?: NpcSpeechBubble;
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

    this.nameLabel = scene.add
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
    if (this.talking) {
      this.decline();
      return true;
    }
    if (!this.lines.trim()) {
      return true;
    }
    this.speak(this.lines);
    return true;
  }

  /** Speak custom lines (quest NPCs). */
  speak(text: string): void {
    this.talking = true;
    this.showBubble(text, true);
  }

  /** Speak with a multi-option menu beside the bubble. */
  speakWithMenu(text: string, options: NpcMenuOption[]): void {
    this.talking = true;
    this.clearBubble();
    this.bubble = new NpcSpeechBubble(this.scene, this.x, this.y - 118, "simple");
    this.bubble.showWithOptions(text, "#e8d0ff", options);
  }

  decline(): void {
    this.clearBubble();
    this.talking = false;
  }

  /** Remove sprite + name (e.g. unloadable pocket zones). */
  destroy(): void {
    this.decline();
    this.sprite.destroy();
    this.nameLabel.destroy();
  }

  private showBubble(text: string, withChoices: boolean): void {
    this.clearBubble();
    this.bubble = new NpcSpeechBubble(this.scene, this.x, this.y - 118, "simple");
    this.bubble.show(
      text,
      "#ffffff",
      withChoices
        ? {
            onYes: () => this.decline(),
            onNo: () => this.decline(),
            yesLabel: "Yes",
            noLabel: "No",
          }
        : undefined
    );
  }

  private clearBubble(): void {
    this.bubble?.destroy();
    this.bubble = undefined;
  }
}
