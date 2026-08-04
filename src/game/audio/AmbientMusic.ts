import Phaser from "phaser";

export type MusicZone = "island" | "ocean" | "jungle";

const TRACK: Record<MusicZone, string> = {
  island: "music_island",
  ocean: "music_ocean",
  jungle: "music_jungle",
};

const STORAGE_KEY = "fischers_music_volume";
const DEFAULT_VOLUME = 0.25;

/**
 * Zone-based ambient loops (~32s each). Crossfades when the player moves
 * between starter island, open ocean, and jungle.
 */
export class AmbientMusic {
  private scene: Phaser.Scene;
  private current: MusicZone | null = null;
  private unlocked = false;
  private volume = DEFAULT_VOLUME;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.volume = AmbientMusic.loadSavedVolume();
  }

  static loadSavedVolume(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw == null) return DEFAULT_VOLUME;
      const v = Number(raw);
      if (!Number.isFinite(v)) return DEFAULT_VOLUME;
      return Phaser.Math.Clamp(v, 0, 1);
    } catch {
      return DEFAULT_VOLUME;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  /** 0–1 linear gain for music. */
  setVolume(v: number): void {
    this.volume = Phaser.Math.Clamp(v, 0, 1);
    try {
      localStorage.setItem(STORAGE_KEY, String(this.volume));
    } catch {
      /* ignore */
    }
    this.applyVolumeToPlaying();
  }

  private applyVolumeToPlaying(): void {
    if (!this.current) return;
    const s = this.scene.sound.get(TRACK[this.current]);
    if (s?.isPlaying) {
      this.scene.tweens.killTweensOf(s);
      (s as Phaser.Sound.WebAudioSound).setVolume(this.volume);
    }
  }

  /** Call once after first user gesture (browser autoplay policy). */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.scene.sound.locked) {
      this.scene.sound.unlock();
    }
    if (this.current) {
      this.startZone(this.current);
    }
  }

  /** Update which loop should play for the player's world X. */
  setZone(zone: MusicZone): void {
    if (zone === this.current) return;
    const prev = this.current;
    this.current = zone;
    if (!this.unlocked) return;
    this.fadeTo(prev, zone);
  }

  private ensure(zone: MusicZone): Phaser.Sound.BaseSound | null {
    const key = TRACK[zone];
    if (!this.scene.cache.audio.exists(key)) return null;
    let s = this.scene.sound.get(key);
    if (!s) {
      s = this.scene.sound.add(key, { loop: true, volume: 0 });
    }
    return s;
  }

  private startZone(zone: MusicZone): void {
    const s = this.ensure(zone);
    if (!s) return;
    this.scene.tweens.killTweensOf(s);
    if (!s.isPlaying) s.play();
    (s as Phaser.Sound.WebAudioSound).setVolume(this.volume);
  }

  private fadeTo(from: MusicZone | null, to: MusicZone): void {
    const next = this.ensure(to);
    if (!next) return;

    this.scene.tweens.killTweensOf(next);
    if (!next.isPlaying) {
      (next as Phaser.Sound.WebAudioSound).setVolume(0);
      next.play();
    }

    const fadeMs = 1600;
    this.scene.tweens.add({
      targets: next,
      volume: this.volume,
      duration: fadeMs,
      ease: "Sine.easeInOut",
    });

    for (const z of Object.keys(TRACK) as MusicZone[]) {
      if (z === to) continue;
      const s = this.scene.sound.get(TRACK[z]);
      if (!s?.isPlaying) continue;
      this.scene.tweens.killTweensOf(s);
      this.scene.tweens.add({
        targets: s,
        volume: 0,
        duration: fadeMs,
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (this.current !== z) s.stop();
        },
      });
    }
    void from;
  }
}

/** Map world X to music biome. */
export function musicZoneForX(
  x: number,
  bounds: {
    westDockEnd: number;
    dockEnd: number;
    jungleWestDockEnd: number;
    jungleEastDockEnd: number;
  }
): MusicZone {
  if (x >= bounds.jungleWestDockEnd && x <= bounds.jungleEastDockEnd) {
    return "jungle";
  }
  if (x >= bounds.westDockEnd && x <= bounds.dockEnd) {
    return "island";
  }
  return "ocean";
}

/** Display name when entering a biome. */
export function areaNameForZone(zone: MusicZone): string {
  switch (zone) {
    case "island":
      return "Starter Island";
    case "jungle":
      return "Swamp Island";
    case "ocean":
      return "Ocean";
  }
}
