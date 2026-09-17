import Phaser from "phaser";
import { createSinkBubbles, playWaterSplash } from "../fx/WaterSplash";
import {
  playBobberSplashSfx,
  playCastLineSfx,
  playSinkBubbleSfx,
} from "../audio/FishingSfx";

export class Bobber {
  sprite: Phaser.GameObjects.Image;
  line: Phaser.GameObjects.Graphics;
  active = false;
  private floatY = 0;
  private lineFromX = 0;
  private lineFromY = 0;
  private sinkTween?: Phaser.Tweens.Tween;
  private castTween?: Phaser.Tweens.Tween;
  private sinking = false;
  private sinkBubbles?: { stop: () => void };
  /** Paint Brush rod — wavy multicolor fishing line. */
  private paintBrushLine = false;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add
      .image(0, 0, "bobber_red")
      .setVisible(false)
      .setDepth(8);
    this.fitDisplay();
    this.line = scene.add.graphics().setDepth(7);
  }

  setPaintBrushLine(on: boolean): void {
    this.paintBrushLine = on;
  }

  setTexture(key: string): void {
    if (this.sprite.scene.textures.exists(key)) {
      this.sprite.setTexture(key);
    }
    this.fitDisplay();
  }

  /** Keep native aspect — bobbers are tall, fish lure is wide. */
  private fitDisplay(): void {
    const frame = this.sprite.frame;
    const nw = Math.max(1, frame.width);
    const nh = Math.max(1, frame.height);
    const maxW = 40;
    const maxH = 34;
    const scale = Math.min(maxW / nw, maxH / nh);
    this.sprite.setDisplaySize(Math.round(nw * scale), Math.round(nh * scale));
  }

  /**
   * Show the bobber on the rod tip during windup (no flight yet).
   */
  stickTo(x: number, y: number, lineFromX: number, lineFromY: number): void {
    this.sinkTween?.stop();
    this.castTween?.stop();
    this.castTween = undefined;
    this.stopBubbles();
    this.active = true;
    this.sinking = false;
    this.sprite.setVisible(true);
    this.sprite.setPosition(x, y);
    this.lineFromX = lineFromX;
    this.lineFromY = lineFromY;
    this.floatY = y;
    this.drawLine(lineFromX, lineFromY);
  }

  /**
   * Cast in an arc to the surface, then sink to `depthY` (deeper line depth).
   * If depthY ≈ surfaceY, it just floats on top.
   * @returns flight duration in ms (before sinking).
   */
  castTo(
    fromX: number,
    fromY: number,
    toX: number,
    surfaceY: number,
    depthY = surfaceY
  ): number {
    this.sinkTween?.stop();
    this.castTween?.stop();
    this.stopBubbles();
    this.active = true;
    this.sinking = false;
    this.sprite.setVisible(true);
    this.sprite.setPosition(fromX, fromY);
    this.lineFromX = fromX;
    this.lineFromY = fromY;
    this.floatY = surfaceY;

    const sinkPx = Math.max(0, depthY - surfaceY);
    const dx = Math.abs(toX - fromX);
    // Higher arc for longer casts; always clear the water a bit.
    const arcHeight = Phaser.Math.Clamp(40 + dx * 0.28, 55, 150);
    const duration = Phaser.Math.Clamp(520 + dx * 0.7, 560, 980);

    playCastLineSfx(this.sprite.scene, { durationMs: duration, volume: 0.3 });

    const flight = { t: 0 };
    this.castTween = this.sprite.scene.tweens.add({
      targets: flight,
      t: 1,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const t = flight.t;
        // Parabola: start at tip, peak mid-flight, land on surface.
        this.sprite.x = fromX + (toX - fromX) * t;
        this.sprite.y =
          fromY + (surfaceY - fromY) * t - arcHeight * 4 * t * (1 - t);
        this.drawLine(this.lineFromX, this.lineFromY);
      },
      onComplete: () => {
        this.castTween = undefined;
        if (!this.active) return;
        this.sprite.setPosition(toX, surfaceY);
        playWaterSplash(this.sprite.scene, toX, surfaceY, 0.85);
        playBobberSplashSfx(this.sprite.scene, 0.85);

        if (sinkPx < 4) {
          this.floatY = surfaceY;
          this.sinking = false;
          this.drawLine(this.lineFromX, this.lineFromY);
          return;
        }
        // Sink the line to rod depth — bubbles while descending
        this.sinking = true;
        const sinkDuration = 280 + sinkPx * 4;
        playSinkBubbleSfx(this.sprite.scene, sinkDuration);
        this.sinkBubbles = createSinkBubbles(this.sprite.scene, () => ({
          x: this.sprite.x,
          y: this.sprite.y,
        }));
        this.sinkTween = this.sprite.scene.tweens.add({
          targets: this.sprite,
          y: depthY,
          duration: sinkDuration,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            this.floatY = this.sprite.y;
            this.drawLine(this.lineFromX, this.lineFromY);
          },
          onComplete: () => {
            this.floatY = depthY;
            this.sinking = false;
            this.stopBubbles();
            this.drawLine(this.lineFromX, this.lineFromY);
          },
        });
      },
    });

    return duration;
  }

  updateLine(fromX: number, fromY: number): void {
    if (!this.active) return;
    this.lineFromX = fromX;
    this.lineFromY = fromY;
    // Don't fight the cast / sink tweens
    if (!this.sinking && !this.castTween) {
      this.sprite.y =
        this.floatY + Math.sin(this.sprite.scene.time.now / 250) * 3;
    }
    this.drawLine(fromX, fromY);
  }

  private drawLine(fromX: number, fromY: number): void {
    this.line.clear();
    if (this.paintBrushLine) {
      this.drawPaintBrushLine(fromX, fromY);
      return;
    }
    this.line.lineStyle(1.5, 0x333333, 0.85);
    this.line.beginPath();
    this.line.moveTo(fromX, fromY);
    this.line.lineTo(this.sprite.x, this.sprite.y);
    this.line.strokePath();
  }

  /** Wavy rainbow fishing line — Paint Brush only. */
  private drawPaintBrushLine(fromX: number, fromY: number): void {
    const toX = this.sprite.x;
    const toY = this.sprite.y;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const tNow = this.sprite.scene.time.now / 1000;
    const segs = Math.max(12, Math.min(28, Math.floor(len / 14)));

    let prevX = fromX;
    let prevY = fromY;
    for (let i = 1; i <= segs; i++) {
      const u = i / segs;
      const wave =
        Math.sin(u * Math.PI * 3.2 + tNow * 4.2) * 7 +
        Math.sin(u * Math.PI * 5.5 - tNow * 2.8) * 3.5;
      const x = fromX + dx * u + nx * wave;
      const y = fromY + dy * u + ny * wave;
      const hue = (u * 300 + tNow * 140) % 360;
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.9, 0.55).color;
      this.line.lineStyle(2.4, color, 0.95);
      this.line.beginPath();
      this.line.moveTo(prevX, prevY);
      this.line.lineTo(x, y);
      this.line.strokePath();
      prevX = x;
      prevY = y;
    }
  }

  private stopBubbles(): void {
    this.sinkBubbles?.stop();
    this.sinkBubbles = undefined;
  }

  reelIn(): void {
    this.castTween?.stop();
    this.castTween = undefined;
    this.sinkTween?.stop();
    this.sinkTween = undefined;
    this.stopBubbles();
    this.sinking = false;
    this.active = false;
    this.sprite.setVisible(false);
    this.line.clear();
  }
}
