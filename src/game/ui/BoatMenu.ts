import Phaser from "phaser";

export class BoatMenu {
  private root: Phaser.GameObjects.Container;
  visible = false;
  private onSpawn?: () => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    this.root = scene.add.container(cx, cy).setDepth(140).setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, 460, 280, 0x1a1f28, 0.95)
      .setStrokeStyle(2, 0xc4a86a);

    const title = scene.add
      .text(0, -112, "Port — Boats", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const card = scene.add
      .rectangle(0, 10, 380, 160, 0x2a3140, 0.95)
      .setStrokeStyle(2, 0x8b7355)
      .setInteractive({ useHandCursor: true });

    const icon = scene.add.image(-110, 5, "sailboat_icon").setScale(1.15);

    const name = scene.add
      .text(20, -40, "Sailboat", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0, 0.5);

    const desc = scene.add
      .text(20, 0, "A small wooden sloop.\nSail with A / D. Press F to board.", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c8c8c8",
        lineSpacing: 4,
      })
      .setOrigin(0, 0.5);

    const spawnBtn = scene.add
      .rectangle(20, 55, 140, 36, 0x3d6b4f)
      .setStrokeStyle(1, 0x7dce7a)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    const spawnLabel = scene.add
      .text(90, 55, "Spawn", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hint = scene.add
      .text(0, 120, "Press B to close", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#888888",
      })
      .setOrigin(0.5);

    const launch = () => {
      this.onSpawn?.();
      this.setOpen(false);
    };

    card.on("pointerdown", launch);
    spawnBtn.on("pointerdown", launch);
    spawnBtn.on("pointerover", () => spawnBtn.setFillStyle(0x4a8a62));
    spawnBtn.on("pointerout", () => spawnBtn.setFillStyle(0x3d6b4f));

    this.root.add([bg, title, card, icon, name, desc, spawnBtn, spawnLabel, hint]);
  }

  setOnSpawn(cb: () => void): void {
    this.onSpawn = cb;
  }

  toggle(): void {
    this.setOpen(!this.visible);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
  }
}
