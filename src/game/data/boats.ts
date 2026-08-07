export type BoatId = "sailboat" | "speedboat" | "jetski";

export interface BoatDef {
  id: BoatId;
  name: string;
  description: string;
  /** 0 = free starter. */
  buyPrice: number;
  maxSpeed: number;
  hullKey: string;
  iconKey: string;
  hasSail: boolean;
  /** Padding from water edges. */
  halfWidth: number;
  seatOffset: { x: number; y: number };
  body: { w: number; h: number; ox: number; oy: number };
  /** Engine wake strength (null = sail / no wake). */
  wake: { power: number; frequency: number } | null;
  /** Hull texture display size (for non-default scales). */
  displayScale?: number;
}

export const BOATS: Record<BoatId, BoatDef> = {
  sailboat: {
    id: "sailboat",
    name: "Sailboat",
    description: "A wooden sloop. Steady and free forever.",
    buyPrice: 0,
    maxSpeed: 140,
    hullKey: "sailboat",
    iconKey: "sailboat_icon",
    hasSail: true,
    halfWidth: 70,
    seatOffset: { x: -4, y: -18 },
    body: { w: 110, h: 16, ox: 15, oy: 26 },
    wake: null,
  },
  speedboat: {
    id: "speedboat",
    name: "Speedboat",
    description: "Medium sport hull. Fast cruise with a loud wake.",
    buyPrice: 25000,
    maxSpeed: 265,
    hullKey: "speedboat",
    iconKey: "speedboat_icon",
    hasSail: false,
    halfWidth: 62,
    seatOffset: { x: -6, y: -16 },
    body: { w: 100, h: 14, ox: 14, oy: 24 },
    wake: { power: 1.15, frequency: 28 },
  },
  jetski: {
    id: "jetski",
    name: "Jet Ski",
    description: "Tiny and blistering. Spray everywhere.",
    buyPrice: 60000,
    maxSpeed: 400,
    hullKey: "jetski",
    iconKey: "jetski_icon",
    hasSail: false,
    halfWidth: 42,
    seatOffset: { x: 0, y: -14 },
    body: { w: 56, h: 12, ox: 10, oy: 18 },
    wake: { power: 1.55, frequency: 16 },
  },
};

export const BOAT_IDS: BoatId[] = ["sailboat", "speedboat", "jetski"];
