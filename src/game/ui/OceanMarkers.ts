import Phaser from "phaser";

export interface OceanMarkerInfo {
  name: string;
  side: "left" | "right";
}

/** Edge labels while sailing — nearest island left / right. */
export class OceanMarkers {
  private root: Phaser.GameObjects.Container;
  private leftText: Phaser.GameObjects.Text;
  private rightText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const cy = 78;

    this.root = scene.add.container(0, 0).setDepth(105).setScrollFactor(0);
    this.root.setVisible(false);

    this.leftText = scene.add
      .text(18, cy, "", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#e8f4ff",
        stroke: "#000000",
        strokeThickness: 5,
        align: "left",
      })
      .setOrigin(0, 0.5);

    this.rightText = scene.add
      .text(w - 18, cy, "", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#e8f4ff",
        stroke: "#000000",
        strokeThickness: 5,
        align: "right",
      })
      .setOrigin(1, 0.5);

    this.root.add([this.leftText, this.rightText]);
  }

  setMarkers(markers: OceanMarkerInfo[] | null): void {
    if (!markers || markers.length === 0) {
      this.root.setVisible(false);
      return;
    }

    const left = markers.find((m) => m.side === "left");
    const right = markers.find((m) => m.side === "right");

    if (left) {
      this.leftText.setText(`◀  ${left.name}`).setVisible(true);
    } else {
      this.leftText.setVisible(false);
    }

    if (right) {
      this.rightText.setText(`${right.name}  ▶`).setVisible(true);
    } else {
      this.rightText.setVisible(false);
    }

    this.rightText.setX(this.scene.scale.width - 18);
    this.root.setVisible(true);
  }
}
