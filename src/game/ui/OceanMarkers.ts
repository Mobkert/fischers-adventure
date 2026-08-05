import Phaser from "phaser";

export interface OceanMarkerInfo {
  side: "left" | "right";
  /** Nearest first — drawn on top; farther names stack underneath, more transparent. */
  names: string[];
}

const LINE_GAP = 20;
const MAX_STACK = 3;

/** Edge labels while sailing — islands left / right, stacked by distance. */
export class OceanMarkers {
  private root: Phaser.GameObjects.Container;
  private leftStack: Phaser.GameObjects.Container;
  private rightStack: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private cy = 78;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.root = scene.add.container(0, 0).setDepth(105).setScrollFactor(0);
    this.root.setVisible(false);

    this.leftStack = scene.add.container(18, this.cy);
    this.rightStack = scene.add.container(scene.scale.width - 18, this.cy);
    this.root.add([this.leftStack, this.rightStack]);
  }

  setMarkers(markers: OceanMarkerInfo[] | null): void {
    if (!markers || markers.length === 0) {
      this.root.setVisible(false);
      return;
    }

    const left = markers.find((m) => m.side === "left");
    const right = markers.find((m) => m.side === "right");

    this.renderStack(this.leftStack, left?.names ?? [], "left");
    this.renderStack(this.rightStack, right?.names ?? [], "right");

    this.rightStack.setX(this.scene.scale.width - 18);
    this.root.setVisible(true);
  }

  private renderStack(
    stack: Phaser.GameObjects.Container,
    names: string[],
    side: "left" | "right"
  ): void {
    stack.removeAll(true);

    const shown = names.slice(0, MAX_STACK);
    if (shown.length === 0) {
      stack.setVisible(false);
      return;
    }

    stack.setVisible(true);
    const originX = side === "left" ? 0 : 1;
    const align = side === "left" ? "left" : "right";

    shown.forEach((name, i) => {
      const label =
        side === "left" ? `◀  ${name}` : `${name}  ▶`;
      // Nearest (i=0) fully opaque; each behind fades further
      const alpha = i === 0 ? 1 : Math.max(0.28, 0.55 - i * 0.18);
      const text = this.scene.add
        .text(0, i * LINE_GAP, label, {
          fontFamily: "Georgia, serif",
          fontSize: "16px",
          color: "#e8f4ff",
          stroke: "#000000",
          strokeThickness: 5,
          align,
        })
        .setOrigin(originX, 0.5)
        .setAlpha(alpha);
      stack.add(text);
    });
  }
}
