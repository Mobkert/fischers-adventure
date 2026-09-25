import Phaser from "phaser";
import { PAINT_COLORS } from "../art/PaintBrushArt";

export const PAINT_BOMB_DURATION_MS = 3 * 60 * 1000;
export const PAINT_BOMB_RADIUS = 72;

type PaintBombState = {
  x: number;
  y: number;
  endsAt: number;
  root: Phaser.GameObjects.Container;
};

/**
 * Temporary paint column in water — catches inside grant Painted (like thunder whirlpool).
 */
export class PaintBombZone {
  private scene: Phaser.Scene;
  private bomb: PaintBombState | null = null;
  private onExpire?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setOnExpire(cb: () => void): void {
    this.onExpire = cb;
  }

  isActive(): boolean {
    return this.bomb != null;
  }

  get remainingMs(): number {
    if (!this.bomb) return 0;
    return Math.max(0, this.bomb.endsAt - this.scene.time.now);
  }

  isInZone(x: number, y: number, radius = PAINT_BOMB_RADIUS): boolean {
    if (!this.bomb) return false;
    if (Math.abs(x - this.bomb.x) > radius) return false;
    // Allow casting from surface down into the column
    return y >= this.bomb.y - 40 && y <= this.bomb.y + 280;
  }

  isNearPlayer(playerX: number, playerY: number, radius = 90): boolean {
    if (!this.bomb) return false;
    const dx = Math.abs(playerX - this.bomb.x);
    const dy = Math.abs(playerY - this.bomb.y);
    return dx <= radius && dy <= 110;
  }

  spawn(x: number, y: number, durationMs = PAINT_BOMB_DURATION_MS): void {
    this.clear();
    const endsAt = this.scene.time.now + durationMs;
    const root = this.scene.add.container(x, y).setDepth(6);

    // Surface paint rings
    const rings: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 4; i++) {
      const col = PAINT_COLORS[i % PAINT_COLORS.length]!;
      const ring = this.scene.add
        .circle(0, 0, 16 + i * 12, col, 0)
        .setStrokeStyle(3, col, 0.7);
      rings.push(ring);
      root.add(ring);
    }

    const core = this.scene.add.circle(0, 0, 14, 0xff66cc, 0.55);
    const core2 = this.scene.add.circle(-4, -3, 7, 0x33aaff, 0.65);
    const core3 = this.scene.add.circle(5, 2, 6, 0xffcc33, 0.7);
    root.add([core, core2, core3]);

    // Underwater paint column
    const column = this.scene.add.graphics();
    column.fillStyle(0xff66aa, 0.22);
    column.fillTriangle(-32, 6, 32, 6, 0, 240);
    column.fillStyle(0x66ccff, 0.12);
    column.fillTriangle(-16, 6, 16, 6, 0, 220);
    root.add(column);

    const deepBlobs: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 7; i++) {
      const t = (i + 1) / 7;
      const dy = 28 + t * 200;
      const r = 18 - t * 10;
      const col = PAINT_COLORS[(i + 3) % PAINT_COLORS.length]!;
      const blob = this.scene.add
        .circle(
          Math.sin(i * 1.7) * 10,
          dy,
          Math.max(4, r),
          col,
          0.35 - t * 0.15
        );
      deepBlobs.push(blob);
      root.add(blob);
    }

    ensurePaintDropTexture(this.scene);
    const emitter = this.scene.add.particles(0, 0, "paint_bomb_drop", {
      speed: { min: 18, max: 65 },
      angle: { min: 0, max: 360 },
      lifespan: 1000,
      quantity: 2,
      frequency: 45,
      scale: { start: 1.1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: PAINT_COLORS,
      blendMode: "ADD",
      emitZone: {
        type: "edge",
        source: new Phaser.Geom.Circle(0, 0, 38),
        quantity: 14,
      },
    });
    root.add(emitter);

    const drip = this.scene.add.particles(0, 20, "paint_bomb_drop", {
      x: { min: -18, max: 18 },
      y: { min: 0, max: 180 },
      speedY: { min: 30, max: 90 },
      speedX: { min: -20, max: 20 },
      lifespan: 1400,
      quantity: 1,
      frequency: 55,
      scale: { start: 0.95, end: 0 },
      alpha: { start: 0.75, end: 0 },
      tint: PAINT_COLORS,
      blendMode: "ADD",
    });
    root.add(drip);

    const tagged = root as Phaser.GameObjects.Container & {
      _rings?: Phaser.GameObjects.Arc[];
      _blobs?: Phaser.GameObjects.Arc[];
    };
    tagged._rings = rings;
    tagged._blobs = deepBlobs;

    this.bomb = { x, y, endsAt, root };
  }

  update(now: number): void {
    if (!this.bomb) return;
    if (now >= this.bomb.endsAt) {
      this.clear();
      this.onExpire?.();
      return;
    }
    const tagged = this.bomb.root as Phaser.GameObjects.Container & {
      _rings?: Phaser.GameObjects.Arc[];
      _blobs?: Phaser.GameObjects.Arc[];
    };
    tagged._rings?.forEach((ring, i) => {
      ring.setScale(1 + Math.sin(now / 200 + i) * 0.1);
      ring.rotation = (now / (350 + i * 70)) * (i % 2 === 0 ? 1 : -1);
    });
    tagged._blobs?.forEach((blob, i) => {
      blob.x = Math.sin(now / 280 + i * 1.3) * (8 + i);
      blob.setScale(1 + Math.sin(now / 240 + i) * 0.15);
    });
  }

  clear(): void {
    this.bomb?.root.destroy(true);
    this.bomb = null;
  }

  destroy(): void {
    this.clear();
  }
}

function ensurePaintDropTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("paint_bomb_drop")) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture("paint_bomb_drop", 6, 6);
  g.destroy();
}
