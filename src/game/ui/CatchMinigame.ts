import Phaser from "phaser";

export class CatchMinigame {
  private root: Phaser.GameObjects.Container;
  private greyBar!: Phaser.GameObjects.Rectangle;
  private whiteBar!: Phaser.GameObjects.Rectangle;
  private fishIcon!: Phaser.GameObjects.Image;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private hint!: Phaser.GameObjects.Text;

  private active = false;
  private ready = false;
  private readyTimer = 0;
  private readonly readyDuration = 1.0; // seconds frozen before play
  private barWidth = 420;
  private barHeight = 48;
  private whiteWidth = 84;
  private whiteX = 0;
  private whiteVel = 0;
  private fishX = 0;
  private fishVel = 0;
  private fishTargetVel = 0;
  private fishDecisionTimer = 0;
  private fishPauseTimer = 0;
  private fishAccel = 180;
  private fishMaxSpeed = 140;
  private speedMult = 1;
  private jerky = false;
  private jerkyChaos = 1;
  /** Override idle pause chance in soft AI (null = default 0.2). */
  private pauseChance: number | null = null;
  private facesLeft = false;
  private progress = 0.2;
  private fillRate = 0.12; // ~6.5s of solid tracking from 20% → 100%
  private readonly baseFillRate = 0.12;
  private drainRate = 0.16;
  private readonly baseDrainRate = 0.16;
  /** White zone starts at this share of the grey bar; control % adds on top. */
  private readonly baseWhiteShare = 0.2;
  /** Acceleration when holding (right) or releasing (left gravity). */
  private readonly accel = 980;
  private readonly maxSpeed = 520;
  /** How hard it rebounds off the grey bar edges. */
  private readonly bounceRestitution = 0.78;
  /** Soft damping so it doesn't feel endless. */
  private readonly drag = 1.6;
  private holdKey!: Phaser.Input.Keyboard.Key;
  private onResult?: (success: boolean) => void;

  constructor(scene: Phaser.Scene) {
    // Sit in the hotbar's place at the bottom of the screen
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height - 78;

    this.root = scene.add.container(cx, cy).setDepth(150).setVisible(false);
    this.root.setScrollFactor(0);

    const panel = scene.add
      .rectangle(0, 0, 560, 132, 0x111118, 0.92)
      .setStrokeStyle(2, 0xffffff);
    const title = scene.add
      .text(0, -48, "Keep the fish in the white zone!", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.greyBar = scene.add
      .rectangle(0, -8, this.barWidth, this.barHeight, 0x6e6e6e)
      .setStrokeStyle(2, 0x333333);

    this.whiteBar = scene.add
      .rectangle(0, -8, this.whiteWidth, this.barHeight - 10, 0xffffff, 0.95)
      .setStrokeStyle(1, 0xcccccc);

    this.fishIcon = scene.add.image(0, -8, "fish").setDisplaySize(42, 14);

    this.progressBg = scene.add
      .rectangle(0, 34, this.barWidth, 14, 0x333333)
      .setStrokeStyle(1, 0x222222);
    this.progressFill = scene.add
      .rectangle(-this.barWidth / 2, 34, 0, 10, 0x4caf50)
      .setOrigin(0, 0.5);

    this.hint = scene.add
      .text(0, 54, "Hold SPACE / LMB → white bar moves right", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#bbbbbb",
      })
      .setOrigin(0.5);

    this.root.add([
      panel,
      title,
      this.greyBar,
      this.whiteBar,
      this.fishIcon,
      this.progressBg,
      this.progressFill,
      this.hint,
    ]);

    this.holdKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  start(
    onResult: (success: boolean) => void,
    options?: {
      textureKey?: string;
      speedMult?: number;
      jerky?: boolean;
      displayWidth?: number;
      displayHeight?: number;
      /** Rod control % — widens white zone. */
      control?: number;
      /** Rod resilience % — calms / slows fish. */
      resilience?: number;
      /** Rod progress speed % — faster fill. */
      progressSpeed?: number;
      /** Jerky snap frequency multiplier. */
      chaos?: number;
      /** Drain rate multiplier when off the white zone. */
      drainMult?: number;
      /** Keep jerky even under high resilience. */
      unstoppableJerky?: boolean;
      /** Override soft/jerky pause chance (0–1). */
      pauseChance?: number;
      /** Texture faces left by default. */
      facesLeft?: boolean;
    }
  ): void {
    this.onResult = onResult;
    this.active = true;
    this.ready = false;
    this.readyTimer = this.readyDuration;
    this.progress = 0.2;
    this.whiteX = 0;
    this.whiteVel = 0;
    this.fishX = 0;
    this.fishVel = 0;
    this.pauseChance =
      options?.pauseChance != null ? options.pauseChance : null;
    this.facesLeft = !!options?.facesLeft;

    const control = options?.control ?? 0;
    const resilience = options?.resilience ?? 0;
    const progressSpeed = options?.progressSpeed ?? 0;
    // Allow <1 chaos so mythical fish can sprint across the bar before turning
    this.jerkyChaos = Math.max(0.35, options?.chaos ?? 1);

    // Control = extra % of the grey bar (0 → 20% wide, +20 → 40% wide)
    const whiteShare = Math.min(
      0.85,
      this.baseWhiteShare + control / 100
    );
    this.whiteWidth = this.barWidth * whiteShare;
    this.whiteBar.setSize(this.whiteWidth, this.barHeight - 10);
    this.whiteBar.updateDisplayOrigin();

    // Progress speed boosts fill rate
    this.fillRate = this.baseFillRate * (1 + progressSpeed / 100);
    this.drainRate = this.baseDrainRate * (options?.drainMult ?? 1);

    // Resilience 50% → fish moves at 50% speed; 0% = normal
    const resFactor = Math.max(0.05, 1 - resilience / 100);
    const baseSpeed = options?.speedMult ?? 1;
    this.speedMult = baseSpeed * resFactor;

    // High resilience calms normal jerky fish; mythical can stay wild
    this.jerky =
      (options?.jerky ?? false) &&
      (options?.unstoppableJerky || resilience < 50);

    this.fishAccel = 220 * this.speedMult;
    this.fishMaxSpeed = 155 * this.speedMult;
    this.fishIcon.setTexture(options?.textureKey ?? "fish");
    this.fishIcon.setDisplaySize(
      options?.displayWidth ?? 42,
      options?.displayHeight ?? 14
    );
    const startDir = Math.random() > 0.5 ? 1 : -1;
    this.fishTargetVel =
      startDir * Phaser.Math.FloatBetween(60, 110) * this.speedMult;
    // Jerky fish snaps velocity immediately
    this.fishVel = this.jerky ? this.fishTargetVel : this.fishTargetVel * 0.5;
    this.fishDecisionTimer = this.jerky
      ? Phaser.Math.FloatBetween(0.18, 0.45) / this.jerkyChaos
      : Phaser.Math.FloatBetween(0.6, 1.4) / Math.max(0.2, this.speedMult);
    this.fishPauseTimer = 0;
    this.whiteBar.setScale(1, 1);
    this.root.setVisible(true);
    this.syncVisuals();
  }

  isActive(): boolean {
    return this.active;
  }

  update(delta: number, pointerDown: boolean): void {
    if (!this.active) return;

    const dt = Math.min(delta / 1000, 0.05);

    // Silent pause — UI shown, nothing moves yet
    if (!this.ready) {
      this.readyTimer -= dt;
      if (this.readyTimer <= 0) {
        this.ready = true;
        this.whiteVel = 0;
      }
      this.syncVisuals();
      return;
    }

    this.updateWhiteBarPhysics(dt, pointerDown || this.holdKey.isDown);
    this.updateFish(dt);

    const halfWhite = this.whiteWidth / 2;
    const overlapping =
      this.fishX >= this.whiteX - halfWhite &&
      this.fishX <= this.whiteX + halfWhite;

    if (overlapping) {
      this.progress = Math.min(1, this.progress + this.fillRate * dt);
    } else {
      this.progress = Math.max(0, this.progress - this.drainRate * dt);
    }

    this.syncVisuals();

    if (this.progress >= 1) {
      this.finish(true);
      return;
    }

    if (this.progress <= 0) {
      this.finish(false);
    }
  }

  private updateWhiteBarPhysics(dt: number, holding: boolean): void {
    // Hold accelerates right; release pulls left (like gravity / spring bias)
    const force = holding ? this.accel : -this.accel;
    this.whiteVel += force * dt;

    // Light drag for smoother feel
    this.whiteVel *= Math.max(0, 1 - this.drag * dt);
    this.whiteVel = Phaser.Math.Clamp(this.whiteVel, -this.maxSpeed, this.maxSpeed);

    this.whiteX += this.whiteVel * dt;

    const whiteMin = -this.barWidth / 2 + this.whiteWidth / 2;
    const whiteMax = this.barWidth / 2 - this.whiteWidth / 2;

    if (this.whiteX < whiteMin) {
      this.whiteX = whiteMin;
      this.bounce(1);
    } else if (this.whiteX > whiteMax) {
      this.whiteX = whiteMax;
      this.bounce(-1);
    }
  }

  /** Bounce off a wall. `dir` is the outward normal (+1 left wall, -1 right wall). */
  private bounce(dir: number): void {
    const impact = Math.abs(this.whiteVel);
    // Snap velocity away from the wall with restitution; boost if hitting hard
    const rebound = Math.max(impact * this.bounceRestitution, 140);
    this.whiteVel = dir * rebound;

    // Quick squash/stretch so the bounce reads clearly
    const squash = Phaser.Math.Clamp(impact / this.maxSpeed, 0.25, 1);
    this.whiteBar.setScale(1 + 0.18 * squash, 1 - 0.22 * squash);
    this.root.scene.tweens.killTweensOf(this.whiteBar);
    this.root.scene.tweens.add({
      targets: this.whiteBar,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: "Back.easeOut",
    });
  }

  private updateFish(dt: number): void {
    this.fishDecisionTimer -= dt;
    if (this.fishDecisionTimer <= 0) {
      this.pickFishBehavior();
    }

    if (this.fishPauseTimer > 0) {
      this.fishPauseTimer -= dt;
      this.fishTargetVel = 0;
      if (this.jerky) {
        this.fishVel = 0;
      }
    }

    if (this.jerky) {
      // Snap — no easing / smooth acceleration
      this.fishVel = this.fishTargetVel;
    } else if (this.fishVel < this.fishTargetVel) {
      this.fishVel = Math.min(
        this.fishTargetVel,
        this.fishVel + this.fishAccel * dt
      );
    } else if (this.fishVel > this.fishTargetVel) {
      this.fishVel = Math.max(
        this.fishTargetVel,
        this.fishVel - this.fishAccel * dt
      );
    }

    this.fishX += this.fishVel * dt;

    const fishMin = -this.barWidth / 2 + 16;
    const fishMax = this.barWidth / 2 - 16;

    if (this.jerky) {
      // Instant bounce at edges — no soft slowdown or pause
      if (this.fishX <= fishMin) {
        this.fishX = fishMin;
        const speed = Phaser.Math.FloatBetween(
          this.fishMaxSpeed * 0.7,
          this.fishMaxSpeed
        );
        this.fishTargetVel = speed;
        this.fishVel = speed;
        this.fishDecisionTimer =
          Phaser.Math.FloatBetween(0.08, 0.28) / this.jerkyChaos;
      } else if (this.fishX >= fishMax) {
        this.fishX = fishMax;
        const speed = Phaser.Math.FloatBetween(
          this.fishMaxSpeed * 0.7,
          this.fishMaxSpeed
        );
        this.fishTargetVel = -speed;
        this.fishVel = -speed;
        this.fishDecisionTimer =
          Phaser.Math.FloatBetween(0.08, 0.28) / this.jerkyChaos;
      }
      return;
    }

    // Soft edge approach: ease to a stop, pause, then turn around
    if (this.fishX <= fishMin + 32 && this.fishVel < 0) {
      this.fishTargetVel = Phaser.Math.Linear(this.fishTargetVel, 0, 0.12);
      if (this.fishX <= fishMin) {
        this.fishX = fishMin;
        this.fishVel = 0;
        this.fishPauseTimer = Phaser.Math.FloatBetween(0.15, 0.45);
        this.fishTargetVel = Phaser.Math.FloatBetween(35, this.fishMaxSpeed);
        this.fishDecisionTimer =
          this.fishPauseTimer + Phaser.Math.FloatBetween(0.4, 1.2);
      }
    } else if (this.fishX >= fishMax - 32 && this.fishVel > 0) {
      this.fishTargetVel = Phaser.Math.Linear(this.fishTargetVel, 0, 0.12);
      if (this.fishX >= fishMax) {
        this.fishX = fishMax;
        this.fishVel = 0;
        this.fishPauseTimer = Phaser.Math.FloatBetween(0.15, 0.45);
        this.fishTargetVel = -Phaser.Math.FloatBetween(35, this.fishMaxSpeed);
        this.fishDecisionTimer =
          this.fishPauseTimer + Phaser.Math.FloatBetween(0.4, 1.2);
      }
    }
  }

  private pickFishBehavior(): void {
    const m = this.speedMult;

    if (this.jerky) {
      const roll = Math.random();
      const pauseChance =
        this.pauseChance != null
          ? this.pauseChance
          : Math.max(0.02, 0.05 * Math.min(1, this.jerkyChaos));
      if (roll < pauseChance) {
        // Rare pause
        this.fishTargetVel = 0;
        this.fishVel = 0;
        this.fishPauseTimer = Phaser.Math.FloatBetween(0.12, 0.35);
        this.fishDecisionTimer =
          this.fishPauseTimer + Phaser.Math.FloatBetween(0.05, 0.12);
        return;
      }
      // Low chaos: keep current direction (sprint across). High chaos: flip often.
      const reverseChance = Phaser.Math.Clamp(
        0.28 + (this.jerkyChaos - 0.55) * 0.35,
        0.18,
        0.8
      );
      let dir: number;
      if (this.fishVel === 0) {
        dir = Math.random() > 0.5 ? 1 : -1;
      } else if (roll < reverseChance) {
        dir = -Math.sign(this.fishVel);
      } else {
        dir = Math.sign(this.fishVel); // keep charging the same way
      }
      const speed = Phaser.Math.FloatBetween(
        this.fishMaxSpeed * 0.75,
        this.fishMaxSpeed
      );
      this.fishTargetVel = dir * speed;
      this.fishVel = this.fishTargetVel;
      // Lower chaos → longer commits before the next decision
      this.fishDecisionTimer =
        Phaser.Math.FloatBetween(0.22, 0.55) / this.jerkyChaos;
      return;
    }

    const roll = Math.random();
    const pauseChance = this.pauseChance != null ? this.pauseChance : 0.2;
    if (roll < pauseChance) {
      // Full stop
      this.fishTargetVel = 0;
      this.fishPauseTimer = Phaser.Math.FloatBetween(0.35, 1.1) / m;
      this.fishDecisionTimer =
        this.fishPauseTimer + Phaser.Math.FloatBetween(0.2, 0.7) / m;
    } else if (roll < pauseChance + 0.2) {
      // Slow drift
      const dir = Math.random() > 0.5 ? 1 : -1;
      this.fishTargetVel = dir * Phaser.Math.FloatBetween(15, 45) * m;
      this.fishDecisionTimer = Phaser.Math.FloatBetween(0.7, 1.8) / m;
    } else if (roll < pauseChance + 0.35) {
      // Smooth reverse
      const dir =
        this.fishVel === 0
          ? Math.random() > 0.5
            ? 1
            : -1
          : -Math.sign(this.fishVel);
      this.fishTargetVel = dir * Phaser.Math.FloatBetween(40, this.fishMaxSpeed);
      this.fishDecisionTimer = Phaser.Math.FloatBetween(0.6, 1.6) / m;
    } else if (roll < pauseChance + 0.55) {
      // Dash
      const dir = Math.random() > 0.5 ? 1 : -1;
      this.fishTargetVel = dir * Phaser.Math.FloatBetween(90, this.fishMaxSpeed);
      this.fishDecisionTimer = Phaser.Math.FloatBetween(0.35, 0.9) / m;
    } else {
      // Normal swim
      const dir = Math.random() > 0.5 ? 1 : -1;
      this.fishTargetVel = dir * Phaser.Math.FloatBetween(45, 100) * m;
      this.fishDecisionTimer = Phaser.Math.FloatBetween(0.8, 2.0) / m;
    }
  }

  private syncVisuals(): void {
    this.whiteBar.setX(this.whiteX);
    this.fishIcon.setX(this.fishX);
    if (Math.abs(this.fishVel) > 8) {
      this.fishIcon.setFlipX(
        this.facesLeft ? this.fishVel > 0 : this.fishVel < 0
      );
    }
    this.progressFill.width = this.barWidth * this.progress;
  }

  private finish(success: boolean): void {
    this.active = false;
    this.ready = false;
    this.root.setVisible(false);
    const cb = this.onResult;
    this.onResult = undefined;
    cb?.(success);
  }

  forceClose(): void {
    if (!this.active) return;
    this.finish(false);
  }
}
