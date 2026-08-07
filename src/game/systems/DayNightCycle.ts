/**
 * In-game clock: 1 real second = 1 game minute, 1 real minute = 1 game hour.
 * Day 6:30–18:00 · Night 18:00–6:30
 * Sunset fades 17:00→18:00 · Dawn fades 5:30→6:30
 */
export class DayNightCycle {
  /** Minutes since midnight (0–1439). Default noon-ish until save loads. */
  private gameMinutes = 13 * 60;
  /** Multiplier on clock speed (1 = normal). */
  private timeScale = 1;

  update(deltaMs: number): void {
    // 1000 real ms → 1 game minute (scaled)
    this.gameMinutes =
      (this.gameMinutes + (deltaMs / 1000) * this.timeScale + 24 * 60) %
      (24 * 60);
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  getTimeScale(): number {
    return this.timeScale;
  }

  /** Set clock to absolute minutes since midnight (0–1439). */
  setGameMinutes(minutes: number): void {
    const m = Math.floor(minutes);
    this.gameMinutes = ((m % (24 * 60)) + 24 * 60) % (24 * 60);
  }

  /** Total minutes since midnight. */
  getTotalMinutes(): number {
    return Math.floor(this.gameMinutes) % (24 * 60);
  }

  getHour24(): number {
    return Math.floor(this.getTotalMinutes() / 60);
  }

  getMinute(): number {
    return this.getTotalMinutes() % 60;
  }

  /** e.g. "2:05 PM" */
  formatTime(): string {
    const total = this.getTotalMinutes();
    let h = Math.floor(total / 60);
    const m = total % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  /**
   * 0 = full day lighting, 1 = full night.
   * Ramps during sunset (5–6 PM) and dawn (5:30–6:30 AM).
   */
  getNightFactor(): number {
    const m = this.gameMinutes;
    // Dawn 5:30–6:30 → 1 → 0
    if (m >= 330 && m < 390) return 1 - (m - 330) / 60;
    // Day 6:30–5:00 PM
    if (m >= 390 && m < 1020) return 0;
    // Sunset 5:00–6:00 PM → 0 → 1
    if (m >= 1020 && m < 1080) return (m - 1020) / 60;
    // Night
    return 1;
  }

  /** Warm orange sky bias during sunset/dawn (peaks mid-transition). */
  getSunsetWarmth(): number {
    const m = this.gameMinutes;
    if (m >= 1020 && m < 1080) {
      return Math.sin(((m - 1020) / 60) * Math.PI);
    }
    if (m >= 330 && m < 390) {
      return Math.sin(((m - 330) / 60) * Math.PI);
    }
    return 0;
  }

  isNight(): boolean {
    return this.getNightFactor() >= 0.5;
  }

  /** HUD glyph — sun by day, moon by night. */
  getIcon(): string {
    return this.isNight() ? "☾" : "☀";
  }

  getIconColor(): string {
    return this.isNight() ? "#c8d0e8" : "#ffe066";
  }

  getTooltip(): string {
    const phase =
      this.getNightFactor() <= 0.05
        ? "Daytime"
        : this.getNightFactor() >= 0.95
          ? "Nighttime"
          : this.gameMinutes >= 1020 && this.gameMinutes < 1080
            ? "Sunset"
            : "Dawn";
    return `${this.formatTime()}\n${phase}`;
  }

  /**
   * Sun / moon placement — screen-anchored with cloud-like parallax.
   * Sun and moon never overlap: each only rises after the other is gone.
   * Moon rises on the opposite side from where the sun set (left vs right).
   */
  getCelestialPos(
    camScrollX: number,
    camScrollY: number,
    viewW: number,
    skyHeight: number,
    scrollFactorX = 0.12,
    scrollFactorY = 0.08
  ): {
    sunX: number;
    sunY: number;
    sunVisible: boolean;
    sunAlpha: number;
    moonX: number;
    moonY: number;
    moonVisible: boolean;
    moonAlpha: number;
  } {
    const m = this.gameMinutes;
    const screenLeft = viewW * 0.18;
    const screenRight = viewW * 0.72;
    const highY = skyHeight * 0.16;
    const lowY = skyHeight * 0.55;
    const below = skyHeight * 0.95;

    const toWorld = (sx: number, sy: number) => ({
      x: camScrollX * scrollFactorX + sx,
      y: camScrollY * scrollFactorY + sy,
    });

    // Sun: 6:30 AM → 6:00 PM (gone at 6 PM). Moon: 6:00 PM → 6:30 AM.
    const SUN_START = 390; // 6:30 AM
    const SUN_END = 1080; // 6:00 PM
    const NIGHT_LEN = 750; // 6 PM → 6:30 AM
    const RISE_SET_MIN = 50; // game minutes to rise / set

    const sunOn = m >= SUN_START && m < SUN_END;
    const moonOn = m >= SUN_END || m < SUN_START;

    let sunSX = screenLeft;
    let sunSY = below;
    let sunVisible = false;
    let sunAlpha = 1;

    if (sunOn) {
      // Left (rise) → right (set) — opposite of moon's night path start
      const t = (m - SUN_START) / (SUN_END - SUN_START);
      sunSX = screenLeft + (screenRight - screenLeft) * t;
      const arc = 1 - Math.pow((t - 0.5) * 2, 2);
      sunSY = lowY + (highY - lowY) * arc;
      sunVisible = true;
      sunAlpha = 1;

      // Rise from below on the left once the moon is gone
      const sinceRise = m - SUN_START;
      if (sinceRise < RISE_SET_MIN) {
        const rise = sinceRise / RISE_SET_MIN;
        sunSY = below + (sunSY - below) * rise;
        sunAlpha = Math.min(1, rise * 1.15);
      }

      // Sink below on the right before 6 PM (moon waits until sun is gone)
      const untilSet = SUN_END - m;
      if (untilSet < RISE_SET_MIN) {
        const sink = 1 - untilSet / RISE_SET_MIN;
        sunSY = sunSY + (below - sunSY) * sink;
        sunAlpha = Math.min(sunAlpha, 1 - sink * 0.95);
        if (sink > 0.98) sunVisible = false;
      }
    }

    let moonSX = screenRight;
    let moonSY = below;
    let moonVisible = false;
    let moonAlpha = 0;

    if (moonOn) {
      // Night progress 0 at 6 PM → 1 at 6:30 AM
      let t: number;
      if (m >= SUN_END) t = (m - SUN_END) / NIGHT_LEN;
      else t = (360 + m) / NIGHT_LEN;
      t = PhaserMathClamp(t, 0, 1);

      // Opposite side from the sun: sun sets on the right → moon rises on the left
      moonSX = screenLeft + (screenRight - screenLeft) * t;
      const arc = 1 - Math.pow((t - 0.5) * 2, 2);
      moonSY = lowY + (highY - lowY) * Math.max(0.3, arc);
      moonVisible = true;
      moonAlpha = 1;

      // Rise from below on the left only after the sun is gone
      if (t * NIGHT_LEN < RISE_SET_MIN) {
        const rise = (t * NIGHT_LEN) / RISE_SET_MIN;
        moonSY = below + (moonSY - below) * rise;
        moonAlpha = Math.min(1, rise * 1.15);
        if (rise < 0.02) moonVisible = false;
      }

      // Sink on the right before the sun rises
      if ((1 - t) * NIGHT_LEN < RISE_SET_MIN) {
        const sink = 1 - ((1 - t) * NIGHT_LEN) / RISE_SET_MIN;
        moonSY = moonSY + (below - moonSY) * sink;
        moonAlpha = Math.min(moonAlpha, 1 - sink * 0.95);
        if (sink > 0.98) moonVisible = false;
      }
    }

    const sun = toWorld(sunSX, sunSY);
    const moon = toWorld(moonSX, moonSY);

    return {
      sunX: sun.x,
      sunY: sun.y,
      sunVisible,
      sunAlpha,
      moonX: moon.x,
      moonY: moon.y,
      moonVisible,
      moonAlpha,
    };
  }
}

function PhaserMathClamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerpColor(a: number, b: number, t: number): number {
  const tt = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * tt);
  const g = Math.round(ag + (bg - ag) * tt);
  const bl = Math.round(ab + (bb - ab) * tt);
  return (r << 16) | (g << 8) | bl;
}
