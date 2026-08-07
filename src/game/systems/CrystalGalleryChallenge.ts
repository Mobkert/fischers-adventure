import Phaser from "phaser";

export type GalleryCrystal = {
  index: number;
  x: number;
  y: number;
  color: number;
  root: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Arc;
};

type ChallengePhase = "idle" | "showing" | "input" | "won" | "failed";

const COLORS = [0x66ddff, 0xff88cc, 0xaaff88, 0xffdd66, 0x88aaff, 0xff66aa];
const TARGET_LEN = 6;

/**
 * Crystal Gallery memory challenge — light sequence grows to 6 crystals.
 */
export class CrystalGalleryChallenge {
  private scene: Phaser.Scene;
  private crystals: GalleryCrystal[] = [];
  private phase: ChallengePhase = "idle";
  private sequence: number[] = [];
  private inputIndex = 0;
  private busy = false;
  private onProgress?: (msg: string) => void;
  private onComplete?: () => void;
  private onFail?: (msg: string) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setCallbacks(opts: {
    onProgress?: (msg: string) => void;
    onComplete?: () => void;
    onFail?: (msg: string) => void;
  }): void {
    this.onProgress = opts.onProgress;
    this.onComplete = opts.onComplete;
    this.onFail = opts.onFail;
  }

  /** Place 6 pressable crystals — 3 left / 3 right of gallery center. */
  spawn(caveOriginX: number, groundY: number): void {
    // Leave a gap in the middle for the Gallery Curator (~3430)
    const localXs = [2980, 3160, 3320, 3540, 3700, 3880];
    for (let i = 0; i < 6; i++) {
      const x = caveOriginX + localXs[i];
      const y = groundY;
      const color = COLORS[i];
      const root = this.scene.add.container(x, y).setDepth(11);
      const glow = this.scene.add
        .circle(0, -40, 30, color, 0)
        .setBlendMode(Phaser.BlendModes.ADD);
      const stem = this.scene.add.rectangle(0, -14, 12, 32, 0x3a5060, 1);
      const gem = this.scene.add.graphics();
      gem.fillStyle(color, 0.65);
      gem.fillTriangle(0, -62, -15, -30, 15, -30);
      gem.fillTriangle(0, -10, -15, -30, 15, -30);
      gem.lineStyle(2, 0xffffff, 0.45);
      gem.strokeTriangle(0, -62, -15, -30, 15, -30);
      gem.strokeTriangle(0, -10, -15, -30, 15, -30);
      const hit = this.scene.add
        .rectangle(0, -36, 44, 64, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      root.add([glow, stem, gem, hit]);

      const crystal: GalleryCrystal = {
        index: i,
        x,
        y,
        color,
        root,
        glow,
      };
      hit.on("pointerdown", () => this.onCrystalPressed(crystal));
      this.crystals.push(crystal);
    }
  }

  isBusy(): boolean {
    return this.phase === "showing" || this.phase === "input" || this.busy;
  }

  isRunning(): boolean {
    return this.phase === "showing" || this.phase === "input";
  }

  /** Begin a new challenge (caller checks crystal rod owned). */
  start(): boolean {
    if (this.isBusy()) return false;
    this.sequence = [];
    this.inputIndex = 0;
    this.phase = "idle";
    this.extendAndShow();
    return true;
  }

  private extendAndShow(): void {
    const next = Phaser.Math.Between(0, this.crystals.length - 1);
    this.sequence.push(next);
    this.inputIndex = 0;
    this.phase = "showing";
    this.busy = true;
    this.onProgress?.(
      `Watch the crystals… (${this.sequence.length}/${TARGET_LEN})`
    );
    this.playSequence(0);
  }

  private playSequence(at: number): void {
    if (at >= this.sequence.length) {
      this.busy = false;
      this.phase = "input";
      this.onProgress?.(
        `Your turn — repeat the pattern (${this.sequence.length}/${TARGET_LEN})`
      );
      return;
    }
    const idx = this.sequence[at];
    this.flashCrystal(this.crystals[idx], () => {
      this.scene.time.delayedCall(220, () => this.playSequence(at + 1));
    });
  }

  private flashCrystal(c: GalleryCrystal, done: () => void): void {
    c.glow.setAlpha(0.9);
    c.glow.setScale(1);
    this.scene.tweens.add({
      targets: c.glow,
      alpha: 0,
      scale: 1.7,
      duration: 480,
      ease: "Cubic.easeOut",
      onComplete: () => {
        c.glow.setScale(1);
        done();
      },
    });
    this.scene.tweens.add({
      targets: c.root,
      scaleX: 1.1,
      scaleY: 1.1,
      yoyo: true,
      duration: 200,
    });
  }

  private onCrystalPressed(c: GalleryCrystal): void {
    if (this.phase !== "input" || this.busy) return;
    this.flashCrystal(c, () => undefined);

    const expected = this.sequence[this.inputIndex];
    if (c.index !== expected) {
      this.phase = "failed";
      this.busy = false;
      this.onFail?.("Wrong crystal — the pattern fades. Talk to try again.");
      this.dimAll();
      return;
    }

    this.inputIndex += 1;
    if (this.inputIndex < this.sequence.length) return;

    if (this.sequence.length >= TARGET_LEN) {
      this.phase = "won";
      this.busy = false;
      this.onComplete?.();
      this.celebrate();
      return;
    }

    this.busy = true;
    this.scene.time.delayedCall(500, () => this.extendAndShow());
  }

  private dimAll(): void {
    for (const c of this.crystals) {
      c.glow.setAlpha(0);
      c.glow.setScale(1);
    }
  }

  private celebrate(): void {
    for (const c of this.crystals) {
      this.scene.tweens.add({
        targets: c.glow,
        alpha: 0.75,
        duration: 200,
        yoyo: true,
        repeat: 3,
        delay: c.index * 60,
      });
    }
  }

  isNearAny(px: number, py: number, radius = 55): boolean {
    return this.crystals.some(
      (c) => Phaser.Math.Distance.Between(px, py, c.x, c.y - 30) < radius
    );
  }
}
