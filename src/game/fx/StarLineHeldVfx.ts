import Phaser from "phaser";

/** Floating rock shards + dark-matter wisps along the held Star Line Rod. */
export class StarLineHeldVfx {
  private gfx: Phaser.GameObjects.Graphics;
  private active = false;
  private rocks: Array<{
    t: number;
    side: number;
    phase: number;
    speed: number;
    size: number;
    bob: number;
  }> = [];
  private wisps: Array<{
    t: number;
    life: number;
    maxLife: number;
    side: number;
    size: number;
  }> = [];
  private spawnTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add
      .graphics()
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < 5; i++) {
      this.rocks.push({
        t: 0.15 + i * 0.16,
        side: i % 2 === 0 ? 1 : -1,
        phase: Math.random() * Math.PI * 2,
        speed: 1.4 + Math.random() * 1.2,
        size: 2.2 + (i % 3) * 0.6,
        bob: 3.5 + Math.random() * 2,
      });
    }
  }

  setActive(on: boolean): void {
    this.active = on;
    if (!on) {
      this.wisps = [];
      this.gfx.clear();
      this.gfx.setVisible(false);
    } else {
      this.gfx.setVisible(true);
    }
  }

  setDepth(d: number): void {
    this.gfx.setDepth(d);
  }

  update(
    handX: number,
    handY: number,
    tipX: number,
    tipY: number,
    now: number
  ): void {
    if (!this.active) return;
    const dt = 1 / 60;
    const dx = tipX - handX;
    const dy = tipY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const tSec = now * 0.001;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.wisps.length < 18) {
      this.spawnTimer = 0.04;
      this.wisps.push({
        t: Math.random(),
        life: Phaser.Math.FloatBetween(0.3, 0.7),
        maxLife: 1,
        side: Math.random() < 0.5 ? -1 : 1,
        size: Phaser.Math.FloatBetween(1.2, 2.8),
      });
      const last = this.wisps[this.wisps.length - 1]!;
      last.maxLife = last.life;
    }

    this.gfx.clear();

    // Dark-matter bridges in gaps
    for (let i = 0; i < 4; i++) {
      const a = 0.18 + i * 0.2;
      const b = a + 0.06;
      const pulse = 0.35 + 0.25 * Math.sin(tSec * 4 + i);
      this.gfx.lineStyle(2.2, 0xc9a0ff, pulse);
      this.gfx.lineBetween(
        handX + dx * a,
        handY + dy * a,
        handX + dx * b,
        handY + dy * b
      );
      this.gfx.lineStyle(1, 0xff8ad8, pulse * 0.7);
      this.gfx.lineBetween(
        handX + dx * a,
        handY + dy * a,
        handX + dx * b,
        handY + dy * b
      );
    }

    for (const rock of this.rocks) {
      rock.phase += dt * rock.speed;
      const bob = Math.sin(rock.phase) * rock.bob;
      const x = handX + dx * rock.t + px * rock.side * (4.5 + bob * 0.15);
      const y = handY + dy * rock.t + py * rock.side * (4.5 + bob * 0.15) + bob * 0.35;
      this.gfx.fillStyle(0x6a6080, 0.85);
      this.gfx.fillCircle(x, y, rock.size);
      this.gfx.fillStyle(0xd0c8e8, 0.55);
      this.gfx.fillCircle(x - 0.6, y - 0.7, rock.size * 0.35);
      this.gfx.fillStyle(0x9b5de5, 0.35);
      this.gfx.fillCircle(x + px * rock.side * -1.5, y + py * rock.side * -1.5, rock.size * 0.7);
    }

    for (let i = this.wisps.length - 1; i >= 0; i--) {
      const w = this.wisps[i]!;
      w.life -= dt;
      w.t += dt * 0.4;
      if (w.life <= 0 || w.t > 1.05) {
        this.wisps.splice(i, 1);
        continue;
      }
      const u = w.life / w.maxLife;
      const x = handX + dx * Math.min(1, w.t) + px * w.side * (2 + (1 - u) * 5);
      const y = handY + dy * Math.min(1, w.t) + py * w.side * (2 + (1 - u) * 5);
      this.gfx.fillStyle(Math.random() < 0.35 ? 0xff8ad8 : 0x9b5de5, 0.2 + u * 0.55);
      this.gfx.fillCircle(x, y, w.size * u);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
