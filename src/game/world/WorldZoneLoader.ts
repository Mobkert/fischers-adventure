/** Proximity-based world chunk loader — defers island content until the player sails near. */

export type WorldZoneSpec = {
  id: string;
  centerX: number;
  /** Load when |playerX - centerX| <= this. */
  loadRadius: number;
  onLoad: () => void;
};

export class WorldZoneLoader {
  private zones: WorldZoneSpec[] = [];
  private loaded = new Set<string>();

  register(zone: WorldZoneSpec): void {
    this.zones.push(zone);
  }

  isLoaded(id: string): boolean {
    return this.loaded.has(id);
  }

  /** Load any zones the player is close enough to enter. */
  refresh(playerX: number): void {
    for (const zone of this.zones) {
      if (this.loaded.has(zone.id)) continue;
      if (Math.abs(playerX - zone.centerX) > zone.loadRadius) continue;
      zone.onLoad();
      this.loaded.add(zone.id);
    }
  }

  /** Force-load a zone (e.g. cave entry) even if outside radius. */
  forceLoad(id: string): void {
    if (this.loaded.has(id)) return;
    const zone = this.zones.find((z) => z.id === id);
    if (!zone) return;
    zone.onLoad();
    this.loaded.add(id);
  }
}
