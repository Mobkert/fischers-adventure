import Phaser from "phaser";

/** Promo code NPC — same style as merchants, black suit. */
export class CodeGuyNpc {
  sprite: Phaser.GameObjects.Sprite;

  readonly x: number;
  readonly y: number;

  constructor(scene: Phaser.Scene, x: number, groundY: number) {
    this.x = x;
    this.y = groundY;

    this.sprite = scene.add.sprite(x, groundY, "npc_code_guy");
    this.sprite.setDepth(11);
    this.sprite.setOrigin(0.5, 1);

    scene.add
      .text(x, this.y - 60, "Code Guy", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffe8a0",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  isNear(px: number, py: number, radius = 70): boolean {
    return Phaser.Math.Distance.Between(px, py, this.x, this.y - 28) < radius;
  }
}
