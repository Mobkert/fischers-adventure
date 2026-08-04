import Phaser from "phaser";
import { RodStats } from "../data/items";

export type WeatherId = "clear" | "rain" | "sunny" | "cloudy" | "thunder";

export const WEATHER_DURATION_MS = 5 * 60 * 1000;
/** How often a lightning strike may roll during thunder. */
const LIGHTNING_CHECK_MS = 25_000;
const LIGHTNING_CHANCE = 0.15;
/** Horizontal radius of the whirlpool thunder column. */
const WHIRLPOOL_COLUMN_RADIUS = 58;
/** How far the vortex VFX stretches underwater. */
const WHIRLPOOL_COLUMN_DEPTH_PX = 260;

export interface WeatherDef {
  id: WeatherId;
  name: string;
  /** Multiplier on luck (spawn / approach). */
  luckMult: number;
  /** Flat % added to luck/res/control/progress (not depth). */
  statBonusPercent: number;
  /** Icon glyph shown above coins. */
  icon: string;
  iconColor: string;
}

export const WEATHER: Record<WeatherId, WeatherDef> = {
  clear: {
    id: "clear",
    name: "Clear",
    luckMult: 1,
    statBonusPercent: 0,
    icon: "◌",
    iconColor: "#c8d0d8",
  },
  rain: {
    id: "rain",
    name: "Rain",
    luckMult: 1,
    statBonusPercent: 0,
    icon: "☂",
    iconColor: "#7ec8ff",
  },
  sunny: {
    id: "sunny",
    name: "Sunny",
    luckMult: 1.5,
    statBonusPercent: 0,
    icon: "☀",
    iconColor: "#ffcc44",
  },
  cloudy: {
    id: "cloudy",
    name: "Cloudy",
    luckMult: 0.85,
    statBonusPercent: 0,
    icon: "☁",
    iconColor: "#b0b8c0",
  },
  thunder: {
    id: "thunder",
    name: "Thunderstorm",
    luckMult: 4,
    statBonusPercent: 0,
    icon: "⚡",
    iconColor: "#ffe066",
  },
};

export interface WhirlpoolInfo {
  x: number;
  y: number;
  active: boolean;
}

type WaterZone = { left: number; right: number };

/**
 * Global weather: rolls every 5 minutes, drives rain FX, storm bonuses,
 * and thunder whirlpools.
 */
export class WeatherSystem {
  private scene: Phaser.Scene;
  private waterZones: WaterZone[];
  private waterSurfaceY: number;
  private groundY: number;

  weather: WeatherId = "clear";
  private weatherEndsAt = 0;
  private mustBeClearNext = false;
  /** Consecutive clear periods — pity after 3. */
  private clearStreak = 1;
  private lastLightningCheck = 0;

  whirlpool: WhirlpoolInfo | null = null;
  private whirlRoot?: Phaser.GameObjects.Container;
  private rainEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private splashTimer?: Phaser.Time.TimerEvent;
  private rainGfx?: Phaser.GameObjects.Rectangle;

  onWeatherChange?: (id: WeatherId, name: string) => void;
  onLightningAnnounce?: (message: string) => void;

  constructor(
    scene: Phaser.Scene,
    waterZones: WaterZone[],
    waterSurfaceY: number,
    groundY: number
  ) {
    this.scene = scene;
    this.waterZones = waterZones;
    this.waterSurfaceY = waterSurfaceY;
    this.groundY = groundY;
    this.weatherEndsAt = scene.time.now + WEATHER_DURATION_MS;
    this.setupRainParticles();
  }

  /** Force a weather for testing / events. Special weathers still require Clear next. */
  forceWeather(id: WeatherId): void {
    this.clearWhirlpool();
    this.weather = id;
    this.mustBeClearNext = id !== "clear";
    this.clearStreak = id === "clear" ? this.clearStreak + 1 : 0;
    this.weatherEndsAt = this.scene.time.now + WEATHER_DURATION_MS;
    this.lastLightningCheck = this.scene.time.now;
    this.onWeatherChange?.(id, WEATHER[id].name);
    this.syncRainFx();
  }

  isRainy(): boolean {
    return this.weather === "rain" || this.weather === "thunder";
  }

  getDef(): WeatherDef {
    return WEATHER[this.weather];
  }

  /**
   * Zeus Rod only: +7% in Rain, +15% in Thunderstorm
   * (luck / resilience / control / progress / Thunder mut chance; not depth).
   */
  getZeusBonusPercent(equippedRodId?: string | null): number {
    if (equippedRodId !== "zeus_rod") return 0;
    if (this.weather === "rain") return 7;
    if (this.weather === "thunder") return 15;
    return 0;
  }

  /** Apply weather luck mult + Zeus flat % bonuses (depth unchanged). */
  modifyStats(stats: RodStats, equippedRodId?: string | null): RodStats {
    const def = this.getDef();
    const b = this.getZeusBonusPercent(equippedRodId);
    return {
      luck: Math.round((stats.luck + b) * def.luckMult),
      resilience: stats.resilience + b,
      control: stats.control + b,
      progressSpeed: stats.progressSpeed + b,
      lineDepth: stats.lineDepth,
    };
  }

  /** Effective luck for spawn rolls. */
  getLuck(baseLuck: number, equippedRodId?: string | null): number {
    return this.modifyStats(
      {
        luck: baseLuck,
        resilience: 0,
        control: 0,
        progressSpeed: 0,
        lineDepth: 0,
      },
      equippedRodId
    ).luck;
  }

  /** Extra Thunder (or rod) mutation chance as 0–1 for Zeus under weather. */
  getRodMutationChanceBonus(equippedRodId?: string | null): number {
    return this.getZeusBonusPercent(equippedRodId) / 100;
  }

  /**
   * Thunder catch zone: bobber in the whirlpool column
   * (any depth — shallow or deep casts both count).
   */
  isInWhirlpool(x: number, y: number, radius = WHIRLPOOL_COLUMN_RADIUS): boolean {
    if (!this.whirlpool?.active) return false;
    if (Math.abs(x - this.whirlpool.x) > radius) return false;
    // Must be at/under the surface swirl (not above water)
    return y >= this.waterSurfaceY - 8;
  }

  /** Anywhere in the visible column (for prompts / near checks). */
  isInWhirlpoolColumn(x: number, radius = WHIRLPOOL_COLUMN_RADIUS): boolean {
    if (!this.whirlpool?.active) return false;
    return Math.abs(x - this.whirlpool.x) <= radius;
  }

  /** Shore / boat proximity — mostly horizontal so docks can reach it. */
  isNearWhirlpool(playerX: number, playerY: number, radiusX = 160): boolean {
    if (!this.whirlpool?.active) return false;
    const dx = Math.abs(playerX - this.whirlpool.x);
    const dy = Math.abs(playerY - this.whirlpool.y);
    return dx <= radiusX && dy <= 140;
  }

  update(_delta: number): void {
    const now = this.scene.time.now;
    if (now >= this.weatherEndsAt) {
      this.rollNextWeather();
    }

    if (this.weather === "thunder") {
      if (now - this.lastLightningCheck >= LIGHTNING_CHECK_MS) {
        this.lastLightningCheck = now;
        if (!this.whirlpool?.active && Math.random() < LIGHTNING_CHANCE) {
          this.spawnLightningStrike();
        }
      }
    }

    this.updateWhirlpoolVisual(now);
    this.syncRainFx();
  }

  private rollNextWeather(): void {
    this.clearWhirlpool();

    let next: WeatherId = "clear";
    if (this.mustBeClearNext) {
      next = "clear";
    } else if (this.clearStreak >= 3) {
      // Pity after 3 clears — always a special weather, then odds reset
      const r = Math.random();
      if (r < 0.5) next = "rain";
      else if (r < 0.5 + 0.3) next = "sunny";
      else if (r < 0.5 + 0.3 + 0.15) next = "cloudy";
      else next = "thunder";
    } else {
      const r = Math.random();
      // Normal: rain 15%, sunny 3%, cloudy 1%, thunder 0.5%
      if (r < 0.15) next = "rain";
      else if (r < 0.15 + 0.03) next = "sunny";
      else if (r < 0.15 + 0.03 + 0.01) next = "cloudy";
      else if (r < 0.15 + 0.03 + 0.01 + 0.005) next = "thunder";
      else next = "clear";
    }

    this.mustBeClearNext = next !== "clear";
    this.clearStreak = next === "clear" ? this.clearStreak + 1 : 0;
    this.weather = next;
    this.weatherEndsAt = this.scene.time.now + WEATHER_DURATION_MS;
    this.lastLightningCheck = this.scene.time.now;
    this.onWeatherChange?.(next, WEATHER[next].name);
  }

  private spawnLightningStrike(): void {
    const zone =
      this.waterZones[Math.floor(Math.random() * this.waterZones.length)];
    const pad = Math.min(50, Math.floor((zone.right - zone.left) / 4));
    const x = Phaser.Math.Between(zone.left + pad, zone.right - pad);
    const y = this.waterSurfaceY + 28;

    this.onLightningAnnounce?.(
      "⚡ Lightning strikes the water! A deep whirlpool forms…"
    );

    // Flash bolt
    const bolt = this.scene.add.graphics().setDepth(40);
    bolt.lineStyle(4, 0xffffff, 1);
    bolt.beginPath();
    bolt.moveTo(x - 10, this.waterSurfaceY - 220);
    bolt.lineTo(x + 8, this.waterSurfaceY - 120);
    bolt.lineTo(x - 6, this.waterSurfaceY - 120);
    bolt.lineTo(x + 14, this.waterSurfaceY + 10);
    bolt.strokePath();
    bolt.lineStyle(2, 0xffe066, 0.9);
    bolt.beginPath();
    bolt.moveTo(x - 6, this.waterSurfaceY - 220);
    bolt.lineTo(x + 4, this.waterSurfaceY - 100);
    bolt.lineTo(x + 10, this.waterSurfaceY + 10);
    bolt.strokePath();

    this.scene.cameras.main.flash(180, 200, 220, 255, false);
    this.scene.cameras.main.shake(220, 0.004);

    this.scene.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: 500,
      onComplete: () => bolt.destroy(),
    });

    this.createWhirlpool(x, y);
  }

  private createWhirlpool(x: number, y: number): void {
    this.clearWhirlpool();
    this.whirlpool = { x, y, active: true };

    const root = this.scene.add.container(x, y).setDepth(6);
    const rings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 4; i++) {
      const ring = this.scene.add
        .circle(0, 0, 18 + i * 14, 0x1a4a6a, 0)
        .setStrokeStyle(3, i % 2 === 0 ? 0x4da6ff : 0xffe066, 0.75);
      rings.push(ring);
      root.add(ring);
    }
    const core = this.scene.add.circle(0, 0, 12, 0x0a2030, 0.85);
    const spark = this.scene.add.circle(0, 0, 6, 0xffe066, 0.9);
    root.add([core, spark]);

    // Deep vortex column stretching far underwater
    const column = this.scene.add.graphics();
    column.fillStyle(0x0a2840, 0.35);
    column.fillTriangle(
      -28,
      8,
      28,
      8,
      0,
      WHIRLPOOL_COLUMN_DEPTH_PX
    );
    column.fillStyle(0x4da6ff, 0.12);
    column.fillTriangle(
      -14,
      8,
      14,
      8,
      0,
      WHIRLPOOL_COLUMN_DEPTH_PX * 0.92
    );
    root.add(column);

    const deepRings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 6; i++) {
      const t = (i + 1) / 6;
      const dy = 36 + t * (WHIRLPOOL_COLUMN_DEPTH_PX - 40);
      const r = 22 - t * 14;
      const ring = this.scene.add
        .circle(0, dy, Math.max(4, r), 0x1a4a6a, 0)
        .setStrokeStyle(
          2,
          i % 2 === 0 ? 0x4da6ff : 0xffe066,
          0.55 - t * 0.25
        );
      deepRings.push(ring);
      root.add(ring);
    }

    // Swirl particles at surface
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x7ec8ff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture("whirl_drop", 6, 6);
    g.destroy();

    const emitter = this.scene.add.particles(0, 0, "whirl_drop", {
      speed: { min: 20, max: 70 },
      angle: { min: 0, max: 360 },
      lifespan: 900,
      quantity: 2,
      frequency: 40,
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.85, end: 0 },
      blendMode: "ADD",
      emitZone: {
        type: "edge",
        source: new Phaser.Geom.Circle(0, 0, 40),
        quantity: 12,
      },
    });
    root.add(emitter);

    // Sparks drifting down the column
    const deepEmitter = this.scene.add.particles(0, 40, "whirl_drop", {
      x: { min: -16, max: 16 },
      y: { min: 0, max: WHIRLPOOL_COLUMN_DEPTH_PX * 0.7 },
      speedY: { min: 40, max: 110 },
      speedX: { min: -25, max: 25 },
      lifespan: 1600,
      quantity: 1,
      frequency: 70,
      scale: { start: 1, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x4da6ff, 0xffe066],
      blendMode: "ADD",
    });
    root.add(deepEmitter);

    this.whirlRoot = root;
    const tagged = root as Phaser.GameObjects.Container & {
      _rings?: Phaser.GameObjects.Arc[];
      _deepRings?: Phaser.GameObjects.Arc[];
    };
    tagged._rings = rings;
    tagged._deepRings = deepRings;
  }

  private updateWhirlpoolVisual(now: number): void {
    if (!this.whirlRoot || !this.whirlpool?.active) return;
    const tagged = this.whirlRoot as Phaser.GameObjects.Container & {
      _rings?: Phaser.GameObjects.Arc[];
      _deepRings?: Phaser.GameObjects.Arc[];
    };
    tagged._rings?.forEach((ring, i) => {
      ring.setScale(1 + Math.sin(now / 180 + i) * 0.08);
      ring.rotation = (now / (400 + i * 80)) * (i % 2 === 0 ? 1 : -1);
    });
    tagged._deepRings?.forEach((ring, i) => {
      ring.setScale(1 + Math.sin(now / 220 + i * 0.7) * 0.12);
      ring.rotation = (now / (500 + i * 90)) * (i % 2 === 0 ? -1 : 1);
    });
  }

  private clearWhirlpool(): void {
    this.whirlpool = null;
    this.whirlRoot?.destroy(true);
    this.whirlRoot = undefined;
  }

  private setupRainParticles(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xa8d8ff, 1);
    g.fillRect(0, 0, 2, 10);
    g.generateTexture("rain_drop", 2, 10);
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 3);
    g.generateTexture("rain_splash", 8, 8);
    g.destroy();
  }

  private syncRainFx(): void {
    const raining = this.isRainy();
    if (raining && !this.rainEmitter) {
      this.startRain();
    } else if (!raining && this.rainEmitter) {
      this.stopRain();
    }
  }

  private startRain(): void {
    this.rainEmitter = this.scene.add.particles(0, 0, "rain_drop", {
      x: { min: 0, max: this.scene.scale.width },
      y: -20,
      speedY: { min: 420, max: 620 },
      speedX: { min: -40, max: -10 },
      lifespan: 1800,
      quantity: 6,
      frequency: 16,
      alpha: { start: 0.55, end: 0.15 },
      scaleY: { min: 0.8, max: 1.4 },
    });
    this.rainEmitter.setScrollFactor(0).setDepth(90);

    this.splashTimer = this.scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => this.spawnSplash(),
    });

    // Soft blue overlay
    this.rainGfx = this.scene.add
      .rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height,
        0x1a3a55,
        0.12
      )
      .setScrollFactor(0)
      .setDepth(85);
  }

  private spawnSplash(): void {
    if (!this.isRainy()) return;
    const cam = this.scene.cameras.main;
    const wx = cam.scrollX + Math.random() * cam.width;
    // Prefer water surface + some ground
    const onWater = Math.random() < 0.65;
    const wy = onWater
      ? this.waterSurfaceY + Phaser.Math.FloatBetween(-2, 6)
      : this.groundY - Phaser.Math.FloatBetween(2, 18);

    const splash = this.scene.add
      .image(wx, wy, "rain_splash")
      .setDepth(7)
      .setAlpha(0.7)
      .setTint(onWater ? 0x9ecfff : 0xffffff)
      .setScale(0.4);
    this.scene.tweens.add({
      targets: splash,
      alpha: 0,
      scale: 1.6,
      y: wy - 4,
      duration: 280,
      onComplete: () => splash.destroy(),
    });
  }

  private stopRain(): void {
    this.rainEmitter?.stop();
    this.rainEmitter?.destroy();
    this.rainEmitter = undefined;
    this.splashTimer?.remove(false);
    this.splashTimer = undefined;
    this.rainGfx?.destroy();
    this.rainGfx = undefined;
  }

  destroy(): void {
    this.stopRain();
    this.clearWhirlpool();
  }
}
