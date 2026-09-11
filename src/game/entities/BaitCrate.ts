import Phaser from "phaser";

/** Ground bait crate shop — interact with F to buy bait crates. */
export class BaitCrate {
  readonly x: number;
  readonly y: number;
  readonly islandName: string;
  private root: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    x: number,
    groundY: number,
    islandName: string
  ) {
    this.x = x;
    this.y = groundY;
    this.islandName = islandName;

    this.root = scene.add.container(x, groundY).setDepth(11);

    const shadow = scene.add
      .ellipse(0, -2, 68, 14, 0x000000, 0.34)
      .setOrigin(0.5, 0.5);

    const stand = scene.add.graphics();
    stand.fillStyle(0x4a3428, 1);
    stand.fillRoundedRect(-34, -12, 68, 12, 3);
    stand.fillStyle(0x6a4a38);
    stand.fillRoundedRect(-32, -10, 64, 4, 2);
    stand.lineStyle(1, 0x8b6914, 0.85);
    stand.strokeRoundedRect(-34, -12, 68, 12, 3);
    stand.lineBetween(-28, -8, 28, -8);
    stand.lineBetween(-28, -5, 28, -5);

    const crateKey = scene.textures.exists("bait_crate_world")
      ? "bait_crate_world"
      : "bait_crate";
    const crate = scene.add
      .image(0, 0, crateKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(72, 66);

    const signPost = scene.add.graphics();
    signPost.fillStyle(0x3a2818, 1);
    signPost.fillRect(-3, -58, 6, 14);
    signPost.fillStyle(0x5a4030);
    signPost.fillRect(-2, -56, 4, 12);

    const signBg = scene.add.graphics();
    signBg.fillStyle(0x0e1824, 0.94);
    signBg.fillRoundedRect(-62, -92, 124, 40, 6);
    signBg.fillStyle(0x1a3048, 0.55);
    signBg.fillRoundedRect(-60, -90, 120, 14, 4);
    signBg.lineStyle(2, 0x7ec8ff, 0.95);
    signBg.strokeRoundedRect(-62, -92, 124, 40, 6);

    const signTitle = scene.add
      .text(0, -82, "Bait Crates", {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: "#e8f4ff",
        stroke: "#0a1420",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    const signHint = scene.add
      .text(0, -64, "F to buy", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#9ad8ff",
        stroke: "#0a1420",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.root.add([
      shadow,
      stand,
      crate,
      signPost,
      signBg,
      signTitle,
      signHint,
    ]);
  }

  isNear(px: number, py: number, radius = 85): boolean {
    const dx = px - this.x;
    const dy = py - (this.y - 28);
    return dx * dx + dy * dy <= radius * radius;
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
