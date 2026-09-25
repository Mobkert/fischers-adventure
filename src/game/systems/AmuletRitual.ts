import Phaser from "phaser";
import { AmuletEffectId, ItemId, ITEMS } from "../data/items";
import { DayNightCycle } from "./DayNightCycle";
import { WeatherId, WeatherSystem } from "./WeatherSystem";

const EFFECT_WEATHER: Partial<Record<AmuletEffectId, WeatherId>> = {
  moonlight: "fullmoon",
  tempest: "rain",
  dusky: "cloudy",
  sunlit: "sunny",
  thunder: "thunder",
};

const EFFECT_SPARKLE: Record<AmuletEffectId, number> = {
  celestial: 0xffe8a0,
  moonlight: 0xc8d8ff,
  tempest: 0x7ec8ff,
  dusky: 0xb8c0c8,
  sunlit: 0xffe066,
  thunder: 0xffe066,
  cave: 0x7ad0ff,
  paint_bomb: 0xff66cc,
};

/**
 * Spins an amulet above the player, applies weather/time, then sparkle-bursts.
 */
export class AmuletRitual {
  private scene: Phaser.Scene;
  private busy = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  isBusy(): boolean {
    return this.busy;
  }

  play(opts: {
    amuletId: ItemId;
    effect: AmuletEffectId;
    getPlayerPos: () => { x: number; y: number };
    weather: WeatherSystem;
    dayNight: DayNightCycle;
    /** Cave Amulet — called mid-ritual when the whale should appear. */
    onCaveWhale?: () => boolean;
    /** Paint Bomb — place the paint column in island water. */
    onPaintBomb?: () => boolean;
    onDone?: (message: string) => void;
  }): void {
    if (this.busy) return;
    this.busy = true;

    const def = ITEMS[opts.amuletId];
    const sparkleColor = EFFECT_SPARKLE[opts.effect];
    const orb = this.scene.add
      .image(0, 0, def.textureKey)
      .setDepth(25)
      .setDisplaySize(48, 48);
    const glow = this.scene.add
      .circle(0, 0, 34, sparkleColor, 0.35)
      .setDepth(24);

    const follow = () => {
      const p = opts.getPlayerPos();
      orb.setPosition(p.x, p.y - 62);
      glow.setPosition(p.x, p.y - 62);
    };
    follow();

    const spin = this.scene.tweens.add({
      targets: orb,
      angle: 360,
      duration: 500,
      repeat: -1,
    });
    this.scene.tweens.add({
      targets: glow,
      scale: 1.35,
      alpha: 0.12,
      duration: 420,
      yoyo: true,
      repeat: -1,
    });

    const finish = (message: string) => {
      spin.stop();
      this.burstSparkles(orb.x, orb.y, sparkleColor);
      orb.destroy();
      glow.destroy();
      opts.dayNight.setTimeScale(1);
      this.busy = false;
      opts.onDone?.(message);
    };

    if (opts.effect === "celestial") {
      const startNight = opts.dayNight.isNight();
      opts.dayNight.setTimeScale(90);
      const tick = this.scene.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          follow();
          if (opts.dayNight.isNight() !== startNight) {
            tick.remove(false);
            finish(
              startNight
                ? "Dawn breaks across the sky!"
                : "Night falls across the world!"
            );
          }
        },
      });
      // Safety: stop after ~12s if something stalls
      this.scene.time.delayedCall(12000, () => {
        if (!this.busy) return;
        tick.remove(false);
        finish("The heavens settle…");
      });
      return;
    }

    if (opts.effect === "cave") {
      this.playCaveSummon(orb, glow, follow, spin, opts.onCaveWhale, opts.onDone);
      return;
    }

    if (opts.effect === "paint_bomb") {
      this.playPaintBomb(orb, glow, follow, spin, opts.onPaintBomb, opts.onDone);
      return;
    }

    // Weather amulets: spin briefly, then force weather + burst
    this.scene.time.addEvent({
      delay: 40,
      repeat: 35,
      callback: () => follow(),
    });
    this.scene.time.delayedCall(1500, () => {
      const weatherId = EFFECT_WEATHER[opts.effect];
      if (weatherId) opts.weather.forceWeather(weatherId);
      finish(`${def.name} flares to life!`);
    });
  }

  /** Color splash burst, then drop a paint column in nearby water. */
  private playPaintBomb(
    orb: Phaser.GameObjects.Image,
    glow: Phaser.GameObjects.Arc,
    follow: () => void,
    spin: Phaser.Tweens.Tween,
    onPaintBomb?: () => boolean,
    onDone?: (message: string) => void
  ): void {
    const paintCols = [
      0xff3355, 0xffcc33, 0x33aaff, 0x66cc44, 0xff66cc, 0x7755ff,
    ];
    this.scene.time.addEvent({
      delay: 40,
      repeat: 40,
      callback: () => follow(),
    });

    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(120 + i * 160, () => {
        const col = paintCols[i % paintCols.length]!;
        const ring = this.scene.add
          .circle(orb.x, orb.y + 40, 6, col, 0)
          .setStrokeStyle(3, col, 0.9)
          .setDepth(23);
        this.scene.tweens.add({
          targets: ring,
          scale: 3.8 + i * 0.25,
          alpha: 0,
          duration: 700,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      });
    }

    this.scene.time.delayedCall(1600, () => {
      spin.stop();
      this.burstSparkles(orb.x, orb.y, 0xff66cc);
      // Extra colored spark pops
      for (let i = 0; i < 10; i++) {
        const col = paintCols[i % paintCols.length]!;
        const a = (i / 10) * Math.PI * 2;
        const speck = this.scene.add
          .circle(orb.x, orb.y, 3, col, 0.95)
          .setDepth(26);
        this.scene.tweens.add({
          targets: speck,
          x: orb.x + Math.cos(a) * 48,
          y: orb.y + Math.sin(a) * 36,
          alpha: 0,
          scale: 0.2,
          duration: 480,
          onComplete: () => speck.destroy(),
        });
      }
      orb.destroy();
      glow.destroy();
      this.busy = false;
      const ok = onPaintBomb?.() ?? false;
      onDone?.(
        ok
          ? "Paint explodes across the water — catch in the splash for Painted!"
          : "No water nearby to paint…"
      );
    });
  }

  /** Ice-cave portal + rings, then whale summon. */
  private playCaveSummon(
    orb: Phaser.GameObjects.Image,
    glow: Phaser.GameObjects.Arc,
    follow: () => void,
    spin: Phaser.Tweens.Tween,
    onCaveWhale?: () => boolean,
    onDone?: (message: string) => void
  ): void {
    const rings: Phaser.GameObjects.Arc[] = [];
    const fx: Phaser.GameObjects.GameObject[] = [];

    this.scene.time.addEvent({
      delay: 40,
      repeat: 70,
      callback: () => follow(),
    });

    // Rising pulse rings from the player's feet
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(180 + i * 220, () => {
        const p = { x: orb.x, y: orb.y + 50 };
        const ring = this.scene.add
          .circle(p.x, p.y, 8, 0x7ad0ff, 0)
          .setStrokeStyle(3, 0xa8e8ff, 0.85)
          .setDepth(23);
        rings.push(ring);
        this.scene.tweens.add({
          targets: ring,
          scale: 4.5 + i * 0.4,
          alpha: 0,
          y: p.y - 30,
          duration: 900,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      });
    }

    // Ice crystal shards orbiting the amulet
    for (let i = 0; i < 10; i++) {
      const shard = this.scene.add
        .triangle(0, 0, 0, -6, 4, 4, -4, 4, 0xb8e8ff, 0.9)
        .setDepth(26);
      fx.push(shard);
      const baseA = (i / 10) * Math.PI * 2;
      this.scene.tweens.add({
        targets: shard,
        angle: 360,
        duration: 1400,
        repeat: 1,
      });
      this.scene.time.addEvent({
        delay: 30,
        repeat: 55,
        callback: () => {
          if (!shard.active) return;
          const a = baseA + this.scene.time.now * 0.004;
          const r = 28 + Math.sin(this.scene.time.now * 0.008 + i) * 6;
          shard.setPosition(orb.x + Math.cos(a) * r, orb.y + Math.sin(a) * r);
        },
      });
    }

    // Dark ice portal under the amulet
    const portal = this.scene.add
      .ellipse(0, 0, 20, 10, 0x061828, 0.85)
      .setDepth(22)
      .setStrokeStyle(2, 0x4aa8ff, 0.7);
    fx.push(portal);
    this.scene.tweens.add({
      targets: portal,
      scaleX: 3.2,
      scaleY: 2.4,
      alpha: 0.95,
      duration: 1600,
      ease: "Sine.easeInOut",
      yoyo: true,
    });
    this.scene.time.addEvent({
      delay: 30,
      repeat: 55,
      callback: () => {
        if (!portal.active) return;
        portal.setPosition(orb.x, orb.y + 28);
      },
    });

    // Ghost whale silhouette rises through the portal
    this.scene.time.delayedCall(900, () => {
      const whale = this.scene.add.graphics().setDepth(24).setAlpha(0);
      fx.push(whale);
      const drawWhale = (wx: number, wy: number, s: number) => {
        whale.clear();
        whale.fillStyle(0x1a4068, 0.75);
        whale.fillEllipse(wx, wy, 56 * s, 18 * s);
        whale.fillTriangle(
          wx + 28 * s,
          wy,
          wx + 48 * s,
          wy - 10 * s,
          wx + 48 * s,
          wy + 10 * s
        );
        whale.fillStyle(0x7ad0ff, 0.55);
        whale.fillCircle(wx - 14 * s, wy - 2 * s, 3 * s);
      };
      drawWhale(orb.x, orb.y + 40, 0.4);
      this.scene.tweens.add({
        targets: whale,
        alpha: 0.9,
        duration: 400,
      });
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1100,
        ease: "Cubic.easeOut",
        onUpdate: (tw) => {
          const v = tw.getValue() ?? 0;
          drawWhale(orb.x, orb.y + 40 - v * 70, 0.45 + v * 0.7);
          whale.setAlpha(0.95 - v * 0.85);
        },
      });
    });

    this.scene.time.delayedCall(2100, () => {
      for (const o of fx) {
        if ((o as Phaser.GameObjects.GameObject).active) o.destroy();
      }
      for (const r of rings) {
        if (r.active) r.destroy();
      }
      const ok = onCaveWhale?.() ?? false;
      spin.stop();
      const bx = orb.x;
      const by = orb.y;
      this.burstSparkles(bx, by, 0x7ad0ff);
      this.burstSparkles(bx, by + 20, 0xff9944);
      orb.destroy();
      glow.destroy();
      this.busy = false;
      onDone?.(
        ok
          ? "The Cave Amulet tears open the deep — a whale answers!"
          : "The Cave Amulet flares… but the whale could not rise."
      );
    });
  }

  private burstSparkles(x: number, y: number, color: number): void {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 40 + Math.random() * 70;
      const spark = this.scene.add
        .circle(x, y, 2 + Math.random() * 3, color, 0.95)
        .setDepth(26);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist - 20,
        alpha: 0,
        scale: 0.2,
        duration: 500 + Math.random() * 350,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
    for (let i = 0; i < 8; i++) {
      const star = this.scene.add
        .star(x, y, 4, 2, 6, color, 0.9)
        .setDepth(26);
      this.scene.tweens.add({
        targets: star,
        x: x + (Math.random() - 0.5) * 120,
        y: y + (Math.random() - 0.5) * 100 - 30,
        alpha: 0,
        angle: 180,
        duration: 600 + Math.random() * 200,
        onComplete: () => star.destroy(),
      });
    }
  }
}
