import Phaser from "phaser";
import { ITEMS } from "../data/items";
import {
  ROD_MASTERY_ABILITY_LEVEL,
  ROD_MASTERY_MAX_LEVEL,
  rodMasteryAccent,
  xpRequiredForLevel,
  type RodXpGrantResult,
} from "../systems/RodMastery";

/**
 * Top-center circular rod XP meter shown after catches / level-ups.
 * Animates fill with overflow across multiple levels.
 */
export class RodXpHud {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container | null = null;
  private ringGfx: Phaser.GameObjects.Graphics | null = null;
  private levelText: Phaser.GameObjects.Text | null = null;
  private levelUpText: Phaser.GameObjects.Text | null = null;
  private abilityText: Phaser.GameObjects.Text | null = null;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  private animToken = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  destroy(): void {
    this.animToken++;
    this.hideTimer?.remove(false);
    this.root?.destroy(true);
    this.root = null;
  }

  /** Draw a static circular meter (also used by Equipment Bag). */
  static drawMeter(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    fill: number,
    level: number,
    thickness = 5
  ): void {
    const accent = rodMasteryAccent(level);
    const start = -Math.PI / 2;
    g.clear();
    // Track
    g.lineStyle(thickness, 0x2a2e38, 0.95);
    g.beginPath();
    g.arc(cx, cy, radius, 0, Math.PI * 2, false);
    g.strokePath();
    // Soft glow under fill
    if (fill > 0.002) {
      g.lineStyle(thickness + 3, accent.glow, 0.22);
      g.beginPath();
      g.arc(cx, cy, radius, start, start + Math.PI * 2 * fill, false);
      g.strokePath();
    }
    // Fill arc
    if (fill > 0.002) {
      g.lineStyle(thickness, accent.fill, 1);
      g.beginPath();
      g.arc(cx, cy, radius, start, start + Math.PI * 2 * fill, false);
      g.strokePath();
    }
    // Outer ring
    g.lineStyle(1.5, accent.ring, 0.85);
    g.beginPath();
    g.arc(cx, cy, radius + thickness * 0.55, 0, Math.PI * 2, false);
    g.strokePath();
    // Inner disc
    g.fillStyle(0x14161c, 0.92);
    g.fillCircle(cx, cy, radius - thickness * 0.85);
  }

  present(result: RodXpGrantResult): void {
    if (result.xpGained <= 0) return;
    this.animToken++;
    const token = this.animToken;
    this.hideTimer?.remove(false);
    this.root?.destroy(true);

    const cx = this.scene.scale.width / 2;
    const cy = 58;
    const root = this.scene.add
      .container(cx, cy)
      .setScrollFactor(0)
      .setDepth(170)
      .setAlpha(0);
    this.root = root;

    const ringGfx = this.scene.add.graphics();
    this.ringGfx = ringGfx;

    const accent = rodMasteryAccent(result.fromLevel);
    const levelText = this.scene.add
      .text(0, 0, String(result.fromLevel), {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: accent.label,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.levelText = levelText;

    const rodName = ITEMS[result.rodId]?.name ?? "Rod";
    const xpText = this.scene.add
      .text(0, 36, `+${result.xpGained} XP · ${rodName}`, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#e8e0d0",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const levelUpText = this.scene.add
      .text(0, -42, "LEVEL UP!", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.6);
    this.levelUpText = levelUpText;

    const abilityText = this.scene.add
      .text(0, -64, "Mastery Ability Unlocked!", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c9a0ff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.abilityText = abilityText;

    root.add([ringGfx, levelText, xpText, levelUpText, abilityText]);

    // Fade in
    this.scene.tweens.add({
      targets: root,
      alpha: 1,
      duration: 220,
      ease: "Cubic.Out",
    });

    void this.animateGrant(result, token).then(() => {
      if (token !== this.animToken) return;
      this.hideTimer = this.scene.time.delayedCall(1600, () => {
        if (token !== this.animToken || !this.root) return;
        this.scene.tweens.add({
          targets: this.root,
          alpha: 0,
          y: cy - 12,
          duration: 380,
          ease: "Cubic.In",
          onComplete: () => {
            if (token !== this.animToken) return;
            this.root?.destroy(true);
            this.root = null;
          },
        });
      });
    });
  }

  private async animateGrant(
    result: RodXpGrantResult,
    token: number
  ): Promise<void> {
    const radius = 28;
    let level = result.fromLevel;
    let xp = result.fromXp;
    let remaining = result.xpGained;

    const paint = (lv: number, into: number) => {
      if (!this.ringGfx || !this.levelText) return;
      const need = xpRequiredForLevel(lv);
      const fill =
        lv >= ROD_MASTERY_MAX_LEVEL ? 1 : need > 0 ? into / need : 1;
      RodXpHud.drawMeter(this.ringGfx, 0, 0, radius, fill, lv, 6);
      const accent = rodMasteryAccent(lv);
      this.levelText.setText(String(lv)).setColor(accent.label);
    };

    paint(level, xp);

    while (remaining > 0 && level < ROD_MASTERY_MAX_LEVEL) {
      if (token !== this.animToken) return;
      const need = xpRequiredForLevel(level);
      const space = need - xp;
      const step = Math.min(remaining, space);
      const fromFill = xp / need;
      const toFill = (xp + step) / need;
      await this.tweenFill(fromFill, toFill, level, token, radius);
      if (token !== this.animToken) return;

      remaining -= step;
      xp += step;
      if (xp >= need) {
        level += 1;
        xp = 0;
        await this.flashLevelUp(level, token);
        if (token !== this.animToken) return;
        if (
          result.abilityUnlocked &&
          level === ROD_MASTERY_ABILITY_LEVEL &&
          this.abilityText
        ) {
          this.abilityText.setAlpha(1);
          this.scene.tweens.add({
            targets: this.abilityText,
            y: -72,
            duration: 500,
            yoyo: true,
            ease: "Sine.Out",
          });
        }
        paint(level, 0);
      }
    }

    // Snap to final
    paint(result.toLevel, result.toXp);
  }

  private tweenFill(
    from: number,
    to: number,
    level: number,
    token: number,
    radius: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const duration = Math.max(180, Math.min(700, (to - from) * 900));
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration,
        ease: "Cubic.Out",
        onUpdate: (tw) => {
          if (token !== this.animToken || !this.ringGfx) return;
          const t = tw.getValue() ?? 0;
          const fill = from + (to - from) * t;
          RodXpHud.drawMeter(this.ringGfx, 0, 0, radius, fill, level, 6);
        },
        onComplete: () => resolve(),
      });
    });
  }

  private flashLevelUp(newLevel: number, token: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.levelUpText || !this.levelText) {
        resolve();
        return;
      }
      const accent = rodMasteryAccent(newLevel);
      this.levelText.setText(String(newLevel)).setColor(accent.label);
      this.levelUpText.setAlpha(1).setScale(0.55);
      this.scene.tweens.add({
        targets: this.levelUpText,
        scale: 1.15,
        duration: 280,
        yoyo: true,
        ease: "Back.Out",
        onComplete: () => {
          if (token !== this.animToken) {
            resolve();
            return;
          }
          this.scene.tweens.add({
            targets: this.levelUpText,
            alpha: 0,
            duration: 220,
            delay: 120,
            onComplete: () => resolve(),
          });
        },
      });
      // Pulse ring
      if (this.ringGfx) {
        this.scene.tweens.add({
          targets: this.ringGfx,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 200,
          yoyo: true,
          ease: "Sine.Out",
        });
      }
    });
  }
}
