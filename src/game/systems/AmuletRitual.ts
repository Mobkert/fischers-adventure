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
