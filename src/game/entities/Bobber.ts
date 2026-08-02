import Phaser from "phaser";

export class Bobber {
  sprite: Phaser.GameObjects.Image;
  line: Phaser.GameObjects.Graphics;
  active = false;
  private floatY = 0;
  private lineFromX = 0;
  private lineFromY = 0;
  private sinkTween?: Phaser.Tweens.Tween;
  private sinking = false;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.image(0, 0, "bobber").setVisible(false).setDepth(8);
    this.line = scene.add.graphics().setDepth(7);
  }

  /**
   * Cast to the surface, then sink to `depthY` (deeper line depth).
   * If depthY ≈ surfaceY, it just floats on top.
   */
  castTo(
    fromX: number,
    fromY: number,
    toX: number,
    surfaceY: number,
    depthY = surfaceY
  ): void {
    this.sinkTween?.stop();
    this.active = true;
    this.sinking = false;
    this.sprite.setVisible(true);
    this.sprite.setPosition(fromX, fromY);
    this.lineFromX = fromX;
    this.lineFromY = fromY;
    this.floatY = surfaceY;

    const sinkPx = Math.max(0, depthY - surfaceY);

    this.sprite.scene.tweens.add({
      targets: this.sprite,
      x: toX,
      y: surfaceY,
      duration: 450,
      ease: "Quad.easeOut",
      onUpdate: () => this.drawLine(this.lineFromX, this.lineFromY),
      onComplete: () => {
        if (!this.active) return;
        if (sinkPx < 4) {
          this.floatY = surfaceY;
          this.sinking = false;
          this.drawLine(this.lineFromX, this.lineFromY);
          return;
        }
        // Sink the line to rod depth
        this.sinking = true;
        this.sinkTween = this.sprite.scene.tweens.add({
          targets: this.sprite,
          y: depthY,
          duration: 280 + sinkPx * 4,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            this.floatY = this.sprite.y;
            this.drawLine(this.lineFromX, this.lineFromY);
          },
          onComplete: () => {
            this.floatY = depthY;
            this.sinking = false;
            this.drawLine(this.lineFromX, this.lineFromY);
          },
        });
      },
    });
  }

  updateLine(fromX: number, fromY: number): void {
    if (!this.active) return;
    this.lineFromX = fromX;
    this.lineFromY = fromY;
    // Don't fight the sink tween
    if (!this.sinking) {
      this.sprite.y =
        this.floatY + Math.sin(this.sprite.scene.time.now / 250) * 3;
    }
    this.drawLine(fromX, fromY);
  }

  private drawLine(fromX: number, fromY: number): void {
    this.line.clear();
    this.line.lineStyle(1.5, 0x333333, 0.85);
    this.line.beginPath();
    this.line.moveTo(fromX, fromY);
    this.line.lineTo(this.sprite.x, this.sprite.y);
    this.line.strokePath();
  }

  reelIn(): void {
    this.sinkTween?.stop();
    this.sinkTween = undefined;
    this.sinking = false;
    this.active = false;
    this.sprite.setVisible(false);
    this.line.clear();
  }
}
