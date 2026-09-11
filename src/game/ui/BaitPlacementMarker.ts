import Phaser from "phaser";

/** World-space chum box preview while placing bait. */
export class BaitPlacementMarker {
  private root: Phaser.GameObjects.Container;
  private box: Phaser.GameObjects.Graphics;
  private inner: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private pulse = 0;
  readonly boxW = 280;
  readonly boxH = 100;

  constructor(scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setDepth(12).setScrollFactor(1);
    this.box = scene.add.graphics();
    this.inner = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, "Chum zone", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#7ec8ff",
        stroke: "#0a1420",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.root.add([this.box, this.inner, this.label]);
  }

  update(
    centerX: number,
    zoneTopY: number,
    valid: boolean,
    dt: number
  ): void {
    this.pulse += dt * 3;
    const hw = this.boxW / 2;
    const top = zoneTopY;
    const midY = top + this.boxH / 2;

    this.root.setPosition(centerX, midY);

    const base = valid ? 0x44cc88 : 0xcc4444;
    const glow = valid ? 0x7ec8ff : 0xff8888;
    const alpha = 0.35 + Math.sin(this.pulse) * 0.12;

    this.box.clear();
    this.box.lineStyle(3, glow, 0.85);
    this.box.fillStyle(base, alpha * 0.25);
    this.box.fillRect(-hw, -this.boxH / 2, this.boxW, this.boxH);
    this.box.strokeRect(-hw, -this.boxH / 2, this.boxW, this.boxH);

    this.inner.clear();
    this.inner.lineStyle(1, 0xffffff, 0.25);
    for (let i = -hw + 20; i < hw; i += 20) {
      this.inner.lineBetween(i, -this.boxH / 2, i, this.boxH / 2);
    }
    for (let j = -this.boxH / 2 + 16; j < this.boxH / 2; j += 16) {
      this.inner.lineBetween(-hw, j, hw, j);
    }

    this.label.setPosition(0, -this.boxH / 2 - 14);
    this.label.setColor(valid ? "#a8ffe0" : "#ffaaaa");
    this.label.setText(valid ? "Cast bait here" : "Cast in water");
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
