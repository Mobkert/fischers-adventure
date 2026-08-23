import Phaser from "phaser";
import { RodStats } from "../data/items";
import { DayNightCycle, lerpColor } from "./DayNightCycle";
import { playWorldLightning } from "../audio/ZeusSfx";

export type WeatherId =
  | "clear"
  | "rain"
  | "sunny"
  | "cloudy"
  | "thunder"
  | "fullmoon"
  | "fog";

export const WEATHER_DURATION_MS = 5 * 60 * 1000;
/** Chance a night becomes Full Moon (skipped if previous night was). */
const FULL_MOON_NIGHT_CHANCE = 0.1;
/** How often a lightning strike may roll during thunder. */
const LIGHTNING_CHECK_MS = 7_000;
const LIGHTNING_CHANCE = 0.4;
/** Share of strikes that also spawn a whirlpool (when none active). */
const WHIRLPOOL_STRIKE_CHANCE = 0.25;
/** Horizontal radius around the player where lightning may strike. */
const STRIKE_NEAR_PLAYER_RANGE = 280;
/** Horizontal hit radius for striking swimming fish. */
const FISH_STRIKE_RADIUS = 58;
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
  /** Icon glyph shown above coins (when no iconTexture). */
  icon: string;
  iconColor: string;
  /** Optional texture key for image weather icons. */
  iconTexture?: string;
  /** Hover tooltip: name + buff/nerf lines. */
  tooltip: string;
}

export const WEATHER: Record<WeatherId, WeatherDef> = {
  clear: {
    id: "clear",
    name: "Clear",
    luckMult: 1,
    statBonusPercent: 0,
    icon: "◌",
    iconColor: "#c8d0d8",
    tooltip: "Clear\nNo weather effects",
  },
  rain: {
    id: "rain",
    name: "Rain",
    luckMult: 1.15,
    statBonusPercent: 0,
    icon: "☂",
    iconColor: "#7ec8ff",
    tooltip: "Rain\n+15% luck\nRare+ fish swim higher",
  },
  sunny: {
    id: "sunny",
    name: "Sunny",
    luckMult: 1.5,
    statBonusPercent: 0,
    icon: "☀",
    iconColor: "#ffcc44",
    tooltip: "Sunny\n+50% luck",
  },
  cloudy: {
    id: "cloudy",
    name: "Cloudy",
    luckMult: 0.85,
    statBonusPercent: 0,
    icon: "☁",
    iconColor: "#b0b8c0",
    tooltip: "Cloudy\n−15% luck",
  },
  thunder: {
    id: "thunder",
    name: "Thunderstorm",
    luckMult: 4,
    statBonusPercent: 0,
    icon: "⚡",
    iconColor: "#ffe066",
    tooltip:
      "Thunderstorm\n+300% luck\nLightning may strike fish (Thunder)\n25% of strikes spawn a whirlpool\nZeus Rod: +15% stats",
  },
  fullmoon: {
    id: "fullmoon",
    name: "Full Moon",
    luckMult: 2,
    statBonusPercent: 0,
    icon: "○",
    iconColor: "#e8eef8",
    iconTexture: "full_moon_icon",
    tooltip:
      "Full Moon\n+100% luck\n10% Moonlight (2×)\n5% Lunar (4×)",
  },
  fog: {
    id: "fog",
    name: "Fog",
    luckMult: 0.9,
    statBonusPercent: 0,
    icon: "〰",
    iconColor: "#b8c0c8",
    tooltip: "Fog\n−10% luck\nThick mist blankets the shore",
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

  /** Sky / sun / rays / weather clouds */
  private skyGfx?: Phaser.GameObjects.Graphics;
  private sunRoot?: Phaser.GameObjects.Container;
  private moonRoot?: Phaser.GameObjects.Container;
  private sunRays?: Phaser.GameObjects.Graphics;
  private atmosOverlay?: Phaser.GameObjects.Rectangle;
  private weatherClouds: Phaser.GameObjects.Image[] = [];
  private skyWorldLeft = 0;
  private skyWorldWidth = 2000;
  private skyHeight = 400;
  private rayAngle = 0;
  private lastAtmosId: WeatherId | null = null;
  private dayNight?: DayNightCycle;
  /** Edge-detect night for Full Moon rolls. */
  private wasNight = false;
  /** After a Full Moon night, the next night cannot roll one. */
  private blockFullMoonNextNight = false;
  /** 0–1 volcanic sky heat when near Ashencast Isle. */
  private ashenSkyHeat = 0;

  onWeatherChange?: (id: WeatherId, name: string) => void;
  onLightningAnnounce?: (message: string) => void;
  /** Swimming fish that lightning can convert to Thunder. */
  getLightningFishTargets?: () => Array<{
    x: number;
    y: number;
    alreadyThunder: boolean;
    applyThunder: () => void;
  }>;
  /** World X to bias strikes toward (usually the player). */
  getLightningAnchorX?: () => number;
  /** When true, rain/thunder FX stay off (Frostpeak Cave). */
  private rainBlocked = false;

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

  /**
   * Hook GameScene sky/sun so weather can recolor the sky, rays, and clouds.
   */
  bindSky(opts: {
    sky: Phaser.GameObjects.Graphics;
    sun: Phaser.GameObjects.Container;
    moon?: Phaser.GameObjects.Container;
    sunX: number;
    sunY: number;
    worldLeft: number;
    worldWidth: number;
    skyHeight: number;
  }): void {
    this.skyGfx = opts.sky;
    this.sunRoot = opts.sun;
    this.moonRoot = opts.moon;
    this.skyWorldLeft = opts.worldLeft;
    this.skyWorldWidth = opts.worldWidth;
    this.skyHeight = opts.skyHeight;
    this.ensureSunRays();
    this.ensureAtmosOverlay();
    this.syncAtmosphere(true);
  }

  bindDayNight(cycle: DayNightCycle): void {
    this.dayNight = cycle;
    this.wasNight = this.isNightTime();
    this.syncAtmosphere(true);
  }

  /** Blend volcanic red into the sky (0 = normal, 1 = full Ashencast heat). */
  setAshenSkyHeat(factor: number): void {
    const next = Phaser.Math.Clamp(factor, 0, 1);
    if (Math.abs(next - this.ashenSkyHeat) < 0.008) {
      this.ashenSkyHeat = next;
      return;
    }
    this.ashenSkyHeat = next;
    this.syncAtmosphere(false);
  }

  /**
   * Force a weather — fully replaces whatever is active
   * (rain, thunder, sunny rays, full moon, clouds, fog, etc.).
   */
  forceWeather(id: WeatherId): void {
    this.clearAllWeatherFx();
    let next = id;
    if (next === "sunny" && this.isPastDaytime()) {
      next = "clear";
    }
    if (next === "fullmoon" && !this.isNightTime()) {
      next = "clear";
    }
    this.weather = next;
    this.mustBeClearNext = next !== "clear" && next !== "fullmoon";
    this.clearStreak = next === "clear" ? this.clearStreak + 1 : 0;
    this.weatherEndsAt = this.scene.time.now + WEATHER_DURATION_MS;
    this.lastLightningCheck = this.scene.time.now;
    this.onWeatherChange?.(next, WEATHER[next].name);
    this.syncRainFx();
    this.syncAtmosphere(true);
  }

  /** Tear down every weather VFX so a new state never stacks on the old one. */
  private clearAllWeatherFx(): void {
    this.clearWhirlpool();
    this.stopRain();
    if (this.sunRays) {
      this.sunRays.clear();
      this.sunRays.setVisible(false);
    }
    if (this.sunRoot) {
      this.sunRoot.setScale(1);
      this.sunRoot.setAlpha(1);
    }
    if (this.moonRoot) {
      this.moonRoot.setScale(1);
      const cut = this.moonRoot.list[2] as
        | Phaser.GameObjects.GameObject
        | undefined;
      if (cut && "setVisible" in cut) {
        (cut as Phaser.GameObjects.Arc).setVisible(true);
      }
    }
    for (const c of this.weatherClouds) {
      c.setVisible(false);
    }
    // Force syncAtmosphere to rebuild sky / clouds / overlay
    this.lastAtmosId = null;
  }

  isRainy(): boolean {
    return this.weather === "rain" || this.weather === "thunder";
  }

  getDef(): WeatherDef {
    return WEATHER[this.weather];
  }

  /**
   * Zeus Rod only: +15% in Thunderstorm
   * (luck / resilience / control / progress / Thunder mut chance; not depth).
   */
  getZeusBonusPercent(equippedRodId?: string | null): number {
    if (equippedRodId !== "zeus_rod") return 0;
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

  update(delta: number): void {
    const now = this.scene.time.now;
    this.updateFullMoonNightCycle();

    // Full Moon lasts all night — don't roll it away on the timer
    if (this.weather === "fullmoon") {
      this.weatherEndsAt = now + WEATHER_DURATION_MS;
    } else if (now >= this.weatherEndsAt) {
      this.rollNextWeather();
    }

    // Sunny ends the instant day leaves full daylight (sunset / night)
    if (this.weather === "sunny" && this.isPastDaytime()) {
      this.clearSunnyForNight();
    }

    // Full Moon ends when day returns
    if (this.weather === "fullmoon" && !this.isNightTime()) {
      this.clearFullMoonForDay();
    }

    if (this.weather === "thunder" && !this.rainBlocked) {
      if (now - this.lastLightningCheck >= LIGHTNING_CHECK_MS) {
        this.lastLightningCheck = now;
        if (Math.random() < LIGHTNING_CHANCE) {
          this.spawnLightningStrike();
        }
      }
    }

    this.updateWhirlpoolVisual(now);
    this.syncRainFx();
    this.syncAtmosphere(false);
    if (this.weather === "sunny" && this.sunRays?.visible) {
      this.rayAngle += delta * 0.00012;
      this.drawSunRays();
    }
  }

  /**
   * Each night: 10% Full Moon, unless the previous night was Full Moon.
   */
  private updateFullMoonNightCycle(): void {
    const night = this.isNightTime();
    if (!this.wasNight && night) {
      if (this.blockFullMoonNextNight) {
        this.blockFullMoonNextNight = false;
      } else if (
        this.weather !== "fullmoon" &&
        Math.random() < FULL_MOON_NIGHT_CHANCE
      ) {
        this.startFullMoon();
      }
    }
    this.wasNight = night;
  }

  private startFullMoon(): void {
    this.clearAllWeatherFx();
    this.weather = "fullmoon";
    this.mustBeClearNext = false;
    this.clearStreak = 0;
    this.weatherEndsAt = this.scene.time.now + WEATHER_DURATION_MS;
    this.onWeatherChange?.("fullmoon", WEATHER.fullmoon.name);
    this.syncRainFx();
    this.syncAtmosphere(true);
  }

  private clearFullMoonForDay(): void {
    this.blockFullMoonNextNight = true;
    this.clearAllWeatherFx();
    this.weather = "clear";
    this.mustBeClearNext = false;
    this.clearStreak += 1;
    this.weatherEndsAt = this.scene.time.now + WEATHER_DURATION_MS;
    this.onWeatherChange?.("clear", WEATHER.clear.name);
    this.syncAtmosphere(true);
  }

  /** True once sunset has started or it is night (no clock → day). */
  private isPastDaytime(): boolean {
    return (this.dayNight?.getNightFactor() ?? 0) > 0;
  }

  /** True when the day/night clock is in night (or no clock → day). */
  private isNightTime(): boolean {
    return (this.dayNight?.getNightFactor() ?? 0) >= 0.5;
  }

  private clearSunnyForNight(): void {
    this.clearAllWeatherFx();
    this.weather = "clear";
    this.mustBeClearNext = false;
    this.clearStreak += 1;
    this.weatherEndsAt = this.scene.time.now + WEATHER_DURATION_MS;
    this.sunRays?.clear();
    this.sunRays?.setVisible(false);
    this.onWeatherChange?.("clear", WEATHER.clear.name);
    this.syncAtmosphere(true);
  }

  private rollNextWeather(): void {
    this.clearAllWeatherFx();

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

    // No sunny weather once day is over
    if (next === "sunny" && this.isPastDaytime()) {
      next = "clear";
    }

    this.mustBeClearNext = next !== "clear";
    this.clearStreak = next === "clear" ? this.clearStreak + 1 : 0;
    this.weather = next;
    this.weatherEndsAt = this.scene.time.now + WEATHER_DURATION_MS;
    this.lastLightningCheck = this.scene.time.now;
    this.onWeatherChange?.(next, WEATHER[next].name);
    this.syncAtmosphere(true);
  }

  private spawnLightningStrike(): void {
    const x = this.pickStrikeXNearPlayer();
    if (x == null) return;
    const y = this.waterSurfaceY + 28;

    const spawnWhirl =
      !this.whirlpool?.active && Math.random() < WHIRLPOOL_STRIKE_CHANCE;

    playWorldLightning(this.scene, { volumeScale: spawnWhirl ? 1.75 : 1 });
    this.playLightningBoltFx(x);

    const struckFish = this.tryStrikeFish(x);

    if (spawnWhirl) {
      this.onLightningAnnounce?.(
        "⚡ Lightning strikes the water! A deep whirlpool forms…"
      );
      this.scene.cameras.main.flash(220, 200, 220, 255, false);
      this.scene.cameras.main.shake(280, 0.005);
      this.createWhirlpool(x, y);
    } else if (struckFish) {
      this.onLightningAnnounce?.(
        "⚡ Lightning hits a fish — it crackles with Thunder!"
      );
    }
  }

  /** Prefer a water X near the player so strikes stay on-screen. */
  private pickStrikeXNearPlayer(): number | null {
    const anchor =
      this.getLightningAnchorX?.() ?? this.scene.cameras.main.midPoint.x;
    const nearZones = this.waterZones.filter(
      (z) =>
        z.right >= anchor - STRIKE_NEAR_PLAYER_RANGE &&
        z.left <= anchor + STRIKE_NEAR_PLAYER_RANGE
    );
    const pool = nearZones.length > 0 ? nearZones : this.waterZones;
    const zone = pool[Math.floor(Math.random() * pool.length)];
    if (!zone) return null;

    const lo = Math.max(zone.left + 24, anchor - STRIKE_NEAR_PLAYER_RANGE);
    const hi = Math.min(zone.right - 24, anchor + STRIKE_NEAR_PLAYER_RANGE);
    if (hi <= lo) {
      return Phaser.Math.Clamp(anchor, zone.left + 24, zone.right - 24);
    }
    return Phaser.Math.Between(Math.floor(lo), Math.floor(hi));
  }

  private tryStrikeFish(strikeX: number): boolean {
    const targets = this.getLightningFishTargets?.() ?? [];
    let best: (typeof targets)[number] | null = null;
    let bestDist = FISH_STRIKE_RADIUS;
    for (const t of targets) {
      if (t.alreadyThunder) continue;
      if (t.y < this.waterSurfaceY - 10) continue;
      if (t.y > this.waterSurfaceY + WHIRLPOOL_COLUMN_DEPTH_PX) continue;
      const d = Math.abs(t.x - strikeX);
      if (d <= bestDist) {
        bestDist = d;
        best = t;
      }
    }
    if (!best) return false;
    best.applyThunder();
    return true;
  }

  private playLightningBoltFx(x: number): void {
    const scene = this.scene;
    const surface = this.waterSurfaceY;
    const skyY = surface - Phaser.Math.Between(250, 340);

    // Build a jagged path once, then stroke glow / core layers
    const pts: { x: number; y: number }[] = [];
    const forks: { ax: number; ay: number; bx: number; by: number }[] = [];
    pts.push({ x: x + Phaser.Math.Between(-10, 10), y: skyY });
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = x + Phaser.Math.Between(-26, 26) * (1 - t * 0.4);
      const py = Phaser.Math.Linear(skyY, surface + 8, t);
      if (i < steps && Math.random() < 0.4) {
        forks.push({
          ax: px,
          ay: py,
          bx: px + Phaser.Math.Between(16, 42) * (Math.random() < 0.5 ? -1 : 1),
          by: py + Phaser.Math.Between(14, 40),
        });
      }
      pts.push({ x: px, y: py });
    }
    pts.push({ x, y: surface + 10 });

    const bolt = scene.add.graphics().setDepth(42);
    const strokePath = (width: number, color: number, alpha: number) => {
      bolt.lineStyle(width, color, alpha);
      bolt.beginPath();
      bolt.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) {
        bolt.lineTo(pts[i]!.x, pts[i]!.y);
      }
      bolt.strokePath();
      for (const f of forks) {
        bolt.beginPath();
        bolt.moveTo(f.ax, f.ay);
        bolt.lineTo(f.bx, f.by);
        bolt.strokePath();
      }
    };
    strokePath(10, 0x4da6ff, 0.28);
    strokePath(5, 0xffe066, 0.75);
    strokePath(2.2, 0xffffff, 1);

    // Local impact bloom (no camera flash)
    const bloom = scene.add
      .circle(x, surface + 4, 14, 0xffffff, 0.9)
      .setDepth(43)
      .setBlendMode(Phaser.BlendModes.ADD);
    const goldBloom = scene.add
      .circle(x, surface + 4, 22, 0xffe066, 0.7)
      .setDepth(41)
      .setBlendMode(Phaser.BlendModes.ADD);
    const ring = scene.add
      .circle(x, surface + 6, 12, 0x4da6ff, 0)
      .setStrokeStyle(3, 0xa8e8ff, 0.95)
      .setDepth(40);

    for (let i = 0; i < 12; i++) {
      const spark = scene.add
        .circle(x, surface + 2, Phaser.Math.Between(2, 4), i % 2 === 0 ? 0xffffff : 0xffe066, 1)
        .setDepth(44)
        .setBlendMode(Phaser.BlendModes.ADD);
      const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const dist = Phaser.Math.Between(28, 70);
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(ang) * dist,
        y: surface + 2 + Math.sin(ang) * dist * 0.45,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(280, 480),
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }

    // Brief underwater glow column
    const column = scene.add.graphics().setDepth(5);
    column.fillStyle(0xffe066, 0.22);
    column.fillTriangle(x - 18, surface + 6, x + 18, surface + 6, x, surface + 120);
    column.fillStyle(0x4da6ff, 0.16);
    column.fillTriangle(x - 10, surface + 6, x + 10, surface + 6, x, surface + 160);

    scene.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: 380,
      delay: 40,
      ease: "Quad.easeIn",
      onComplete: () => bolt.destroy(),
    });
    scene.tweens.add({
      targets: bloom,
      scale: 3.8,
      alpha: 0,
      duration: 360,
      ease: "Cubic.easeOut",
      onComplete: () => bloom.destroy(),
    });
    scene.tweens.add({
      targets: goldBloom,
      scale: 4.2,
      alpha: 0,
      duration: 480,
      ease: "Cubic.easeOut",
      onComplete: () => goldBloom.destroy(),
    });
    scene.tweens.add({
      targets: ring,
      scale: 5.5,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    scene.tweens.add({
      targets: column,
      alpha: 0,
      duration: 520,
      onComplete: () => column.destroy(),
    });
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

  private ensureSunRays(): void {
    if (this.sunRays) {
      // Keep rays parented to the camera-following sun
      if (this.sunRoot && this.sunRays.parentContainer !== this.sunRoot) {
        this.sunRoot.addAt(this.sunRays, 0);
        this.sunRays.setPosition(0, 0);
      }
      return;
    }
    this.sunRays = this.scene.make.graphics({ x: 0, y: 0 });
    if (this.sunRoot) {
      this.sunRoot.addAt(this.sunRays, 0);
    } else {
      this.scene.add.existing(this.sunRays);
      this.sunRays.setDepth(-1.5);
      this.sunRays.setScrollFactor(0.12, 0.08);
    }
    this.sunRays.setVisible(false);
  }

  private ensureAtmosOverlay(): void {
    if (this.atmosOverlay) return;
    this.atmosOverlay = this.scene.add
      .rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width * 1.2,
        this.scene.scale.height * 1.2,
        0x000000,
        0
      )
      .setScrollFactor(0)
      .setDepth(84);
  }

  private atmosLook(id: WeatherId): {
    top: number;
    bottom: number;
    overlay: number;
    overlayA: number;
    sunVisible: boolean;
    sunBright: boolean;
    rays: boolean;
    cloudCount: number;
    cloudTint: number;
    cloudAlpha: number;
  } {
    switch (id) {
      case "sunny":
        return {
          // Bright midday blue — sun must contrast, not wash into gold
          top: 0x3a9ee8,
          bottom: 0xb8e8ff,
          overlay: 0xfff8e0,
          overlayA: 0.04,
          sunVisible: true,
          sunBright: true,
          rays: true,
          cloudCount: 2,
          cloudTint: 0xffffff,
          cloudAlpha: 0.45,
        };
      case "rain":
        return {
          top: 0x4a5560,
          bottom: 0x7a8894,
          overlay: 0x1a3040,
          overlayA: 0.18,
          sunVisible: false,
          sunBright: false,
          rays: false,
          cloudCount: 16,
          cloudTint: 0x8a96a0,
          cloudAlpha: 0.82,
        };
      case "cloudy":
        return {
          top: 0x6a7580,
          bottom: 0xa0a8b0,
          overlay: 0x405060,
          overlayA: 0.12,
          sunVisible: false,
          sunBright: false,
          rays: false,
          cloudCount: 14,
          cloudTint: 0xb0b8c0,
          cloudAlpha: 0.78,
        };
      case "thunder":
        return {
          top: 0x06060a,
          bottom: 0x161820,
          overlay: 0x000000,
          overlayA: 0.32,
          sunVisible: false,
          sunBright: false,
          rays: false,
          cloudCount: 22,
          cloudTint: 0x2a2e38,
          cloudAlpha: 0.92,
        };
      case "fullmoon":
        return {
          top: 0x0c1838,
          bottom: 0x1a2a50,
          overlay: 0xc8d8ff,
          overlayA: 0.06,
          sunVisible: false,
          sunBright: false,
          rays: false,
          cloudCount: 2,
          cloudTint: 0xd0d8e8,
          cloudAlpha: 0.35,
        };
      case "fog":
        return {
          top: 0x8a949c,
          bottom: 0xc8d0d6,
          overlay: 0xd8dde2,
          overlayA: 0.28,
          sunVisible: false,
          sunBright: false,
          rays: false,
          cloudCount: 10,
          cloudTint: 0xd8dce0,
          cloudAlpha: 0.7,
        };
      case "clear":
      default:
        return {
          top: 0x5eb0e0,
          bottom: 0xd4effc,
          overlay: 0xffffff,
          overlayA: 0,
          sunVisible: true,
          sunBright: false,
          rays: false,
          cloudCount: 0,
          cloudTint: 0xffffff,
          cloudAlpha: 0.5,
        };
    }
  }

  private syncAtmosphere(force: boolean): void {
    if (!this.skyGfx) return;
    const weatherChanged = force || this.lastAtmosId !== this.weather;
    if (weatherChanged) {
      this.lastAtmosId = this.weather;
    }

    const look = this.atmosLook(this.weather);
    const night = this.dayNight?.getNightFactor() ?? 0;
    const warmth = this.dayNight?.getSunsetWarmth() ?? 0;

    const nightTop = 0x0a1228;
    const nightBot = 0x1a2848;
    const sunsetTop = 0xd45828;
    const sunsetBot = 0xffa060;
    const ashenTop = 0xb02818;
    const ashenBot = 0xf07840;

    let top = look.top;
    let bottom = look.bottom;
    if (warmth > 0.001) {
      top = lerpColor(top, sunsetTop, warmth * 0.9);
      bottom = lerpColor(bottom, sunsetBot, warmth * 0.85);
    }
    if (this.ashenSkyHeat > 0.001) {
      const h = this.ashenSkyHeat;
      top = lerpColor(top, ashenTop, h * 0.88);
      bottom = lerpColor(bottom, ashenBot, h * 0.82);
    }
    if (night > 0.001) {
      top = lerpColor(top, nightTop, night);
      bottom = lerpColor(bottom, nightBot, night);
    }

    this.skyGfx.clear();
    this.skyGfx.fillGradientStyle(top, top, bottom, bottom, 1);
    this.skyGfx.fillRect(
      this.skyWorldLeft,
      0,
      this.skyWorldWidth,
      this.skyHeight
    );

    // Celestial bodies from day/night clock (cloud-like parallax)
    if (this.dayNight) {
      const cam = this.scene.cameras.main;
      const cel = this.dayNight.getCelestialPos(
        cam.scrollX,
        cam.scrollY,
        cam.width,
        this.skyHeight,
        0.12,
        0.08
      );

      // Rain/clouds/thunder hide the day sun; sunny only adds rays to it
      const weatherHidesSun =
        this.weather === "rain" ||
        this.weather === "cloudy" ||
        this.weather === "thunder" ||
        this.weather === "fullmoon" ||
        this.weather === "fog";
      if (this.sunRoot) {
        const show = cel.sunVisible && !weatherHidesSun;
        this.sunRoot.setScrollFactor(0.12, 0.08);
        this.sunRoot.setVisible(show);
        this.sunRoot.setPosition(cel.sunX, cel.sunY);
        this.sunRoot.setAlpha(cel.sunAlpha);
        // Punch the disc when sunny so it reads against blue sky
        this.sunRoot.setScale(
          this.weather === "sunny" && show ? 1.28 : 1
        );
        if (this.weather === "sunny" && show) {
          this.sunRoot.setAlpha(1);
        } else if (warmth > 0.2 && show) {
          this.sunRoot.setAlpha(cel.sunAlpha * (0.85 + warmth * 0.15));
        }
      }
      if (this.moonRoot) {
        const full = this.weather === "fullmoon";
        this.moonRoot.setScrollFactor(0.12, 0.08);
        this.moonRoot.setVisible(cel.moonVisible || full);
        this.moonRoot.setPosition(cel.moonX, cel.moonY);
        this.moonRoot.setAlpha(full ? 1 : cel.moonAlpha);
        this.moonRoot.setScale(full ? 1.35 : 1);
        // Child index 2 is the dark crescent cut — hide it for a true full moon
        const cut = this.moonRoot.list[2] as Phaser.GameObjects.Arc | undefined;
        if (cut?.setVisible) cut.setVisible(!full);
      }
    } else if (this.sunRoot) {
      this.sunRoot.setVisible(look.sunVisible);
      this.sunRoot.setAlpha(look.sunBright ? 1 : 0.85);
      this.sunRoot.setScale(look.sunBright ? 1.12 : 1);
      this.moonRoot?.setVisible(false);
    }

    this.ensureSunRays();
    if (this.sunRays) {
      const showRays =
        this.weather === "sunny" &&
        (this.sunRoot?.visible ?? false) &&
        !this.isPastDaytime();
      this.sunRays.setVisible(showRays);
      if (showRays) this.drawSunRays();
      else this.sunRays.clear();
    }

    this.ensureAtmosOverlay();
    if (this.atmosOverlay) {
      const nightA = night * 0.36;
      // Prefer darker of weather vs night overlay (full moon keeps soft silver wash)
      if (this.weather === "fullmoon") {
        this.atmosOverlay.setFillStyle(0xb8c8f0, 0.08);
        this.atmosOverlay.setVisible(true);
      } else if (nightA >= look.overlayA && night > 0.05) {
        this.atmosOverlay.setFillStyle(0x081018, nightA);
        this.atmosOverlay.setVisible(nightA > 0.001);
      } else {
        this.atmosOverlay.setFillStyle(look.overlay, look.overlayA);
        this.atmosOverlay.setVisible(look.overlayA > 0.001);
      }
      // During sunset, soft warm wash on top of clear weather
      if (
        this.weather !== "fullmoon" &&
        warmth > 0.15 &&
        look.overlayA < 0.08 &&
        night < 0.7
      ) {
        this.atmosOverlay.setFillStyle(0xff8844, warmth * 0.12);
        this.atmosOverlay.setVisible(true);
      }
    }

    if (weatherChanged) {
      this.syncWeatherClouds(look.cloudCount, look.cloudTint, look.cloudAlpha);
    }
  }

  private drawSunRays(): void {
    if (!this.sunRays) return;
    const g = this.sunRays;
    g.clear();
    // Local to the camera-following sun container
    const cx = 0;
    const cy = 0;
    const rays = 12;
    const len = 170;
    for (let i = 0; i < rays; i++) {
      const a = this.rayAngle + (i / rays) * Math.PI * 2;
      const a0 = a - 0.05;
      const a1 = a + 0.05;
      g.fillStyle(0xfff2a8, 0.26 + (i % 2) * 0.07);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a0) * len, cy + Math.sin(a0) * len);
      g.lineTo(cx + Math.cos(a1) * len, cy + Math.sin(a1) * len);
      g.closePath();
      g.fillPath();
    }
    // Soft halo behind the disc
    g.fillStyle(0xfff8d0, 0.2);
    g.fillCircle(cx, cy, 58);
    g.fillStyle(0xffffff, 0.16);
    g.fillCircle(cx, cy, 40);
  }

  private syncWeatherClouds(
    count: number,
    tint: number,
    alpha: number
  ): void {
    while (this.weatherClouds.length > count) {
      this.weatherClouds.pop()?.destroy();
    }
    while (this.weatherClouds.length < count) {
      const i = this.weatherClouds.length;
      const x =
        this.skyWorldLeft +
        80 +
        (i * this.skyWorldWidth) / Math.max(count, 1) +
        Phaser.Math.Between(-60, 60);
      const y = 40 + (i % 5) * 28 + Phaser.Math.Between(-10, 14);
      const cloud = this.scene.add
        .image(x, y, "cloud")
        .setDepth(-1)
        .setScrollFactor(0.12, 0.08)
        .setScale(Phaser.Math.FloatBetween(1.1, 2.1));
      this.scene.tweens.add({
        targets: cloud,
        x: cloud.x + Phaser.Math.Between(30, 70),
        duration: Phaser.Math.Between(9000, 16000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
      this.weatherClouds.push(cloud);
    }
    for (const c of this.weatherClouds) {
      c.setTint(tint);
      c.setAlpha(alpha);
      c.setVisible(true);
    }
  }

  /** Block rain visuals (e.g. under the mountain). Weather state still rolls. */
  setRainBlocked(blocked: boolean): void {
    this.rainBlocked = blocked;
    this.syncRainFx();
  }

  private syncRainFx(): void {
    const raining = this.isRainy() && !this.rainBlocked;
    if (raining && !this.rainEmitter) {
      this.startRain();
    } else if (!raining && this.rainEmitter) {
      this.stopRain();
    }
  }

  private startRain(): void {
    const heavy = this.weather === "thunder";
    this.rainEmitter = this.scene.add.particles(0, 0, "rain_drop", {
      x: { min: 0, max: this.scene.scale.width },
      y: -20,
      speedY: { min: heavy ? 520 : 420, max: heavy ? 780 : 620 },
      speedX: { min: -50, max: -10 },
      lifespan: 1800,
      quantity: heavy ? 10 : 6,
      frequency: heavy ? 12 : 16,
      alpha: { start: heavy ? 0.7 : 0.55, end: 0.15 },
      scaleY: { min: 0.8, max: heavy ? 1.8 : 1.4 },
    });
    this.rainEmitter.setScrollFactor(0).setDepth(90);

    this.splashTimer = this.scene.time.addEvent({
      delay: heavy ? 35 : 50,
      loop: true,
      callback: () => this.spawnSplash(),
    });
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
    for (const c of this.weatherClouds) c.destroy();
    this.weatherClouds = [];
    this.sunRays?.destroy();
    this.atmosOverlay?.destroy();
  }
}
