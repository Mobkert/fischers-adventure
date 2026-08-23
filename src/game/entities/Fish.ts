import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  FishHabitat,
  FishSizeId,
  FishMutationId,
  MUTATIONS,
  rollSpawnDepthOffset,
  rollFishSpecies,
  rollFishSize,
  rollWorldMutation,
  rollSunnyMutation,
  sizeScale,
  applyMutationTint,
} from "../data/items";
import { playWaterSplash } from "../fx/WaterSplash";
import { playTranquilBubblePopFx } from "../fx/TranquilBubblePop";
import { CAVE_FISH_MAX_DEPTH_PX } from "../world/FrostpeakCaveWorld";

export type FishState = "idle" | "approaching" | "bitten" | "caught";

export class Fish {
  sprite: Phaser.Physics.Arcade.Sprite;
  /** Soft ADD-blend aura behind the fish for glowing mutations. */
  private glow?: Phaser.GameObjects.Image;
  /** Tranquil Rod — glass bubble enveloping the hooked fish. */
  private tranquilBubble?: Phaser.GameObjects.Arc;
  private tranquilBubbleShine?: Phaser.GameObjects.Arc;
  private tranquilBubbleActive = false;
  state: FishState = "idle";
  speciesId: ItemId;
  size: FishSizeId = "normal";
  mutation: FishMutationId | null = null;
  readonly habitat: FishHabitat;
  private idleMinX: number;
  private idleMaxX: number;
  private surfaceY: number;
  private baseY: number;

  private velX = 0;
  private targetVelX = 0;
  private accel = 55;
  private maxSpeed = 70;
  private nextDecisionAt = 0;
  private pauseUntil = 0;
  private getLuck: () => number;
  /** Species blocked from spawning (e.g. only one mushroom cluster). */
  private getExcludeSpecies: (self: Fish) => ItemId[];
  private getIsRainy: () => boolean = () => false;
  private getIsSunny: () => boolean = () => false;

  private approachTargetX = 0;
  private approachTargetY = 0;
  private approachStartedAt = 0;
  private closestApproach = Infinity;
  private approachSpeedMult = 1;
  /** Idle fish despawn after this time (ms). Paused while chasing / hooked. */
  private despawnAt = 0;
  private despawning = false;
  /** Keep this species on respawn (abundance dolphins). */
  private lockSpecies = false;
  /** Skip natural despawn cycle. */
  private noDespawn = false;
  /** Optional custom species roller (Ashencast ocean trout chance). */
  private customRollSpecies?: () => ItemId;
  /** Arc-jump state for surface-jumping species. */
  private jumping = false;
  private jumpT = 0;
  private jumpDuration = 0;
  private jumpStartX = 0;
  private jumpEndX = 0;
  private jumpPeak = 0;
  private nextJumpAt = 0;
  private jumpEntrySplashed = false;
  /** Whale blowhole spout timer. */
  private nextSpoutAt = 0;
  private diving = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    _y: number,
    idleMinX: number,
    idleMaxX: number,
    waterSurfaceY: number,
    getLuck: () => number = () => 0,
    habitat: FishHabitat = "ocean",
    speciesId?: ItemId,
    getExcludeSpecies: (self: Fish) => ItemId[] = () => [],
    getIsRainy: () => boolean = () => false,
    options?: { lockSpecies?: boolean; noDespawn?: boolean; rollSpecies?: () => ItemId },
    getIsSunny: () => boolean = () => false
  ) {
    this.getLuck = getLuck;
    this.getExcludeSpecies = getExcludeSpecies;
    this.getIsRainy = getIsRainy;
    this.getIsSunny = getIsSunny;
    this.habitat = habitat;
    this.lockSpecies = !!options?.lockSpecies;
    this.noDespawn = !!options?.noDespawn;
    this.customRollSpecies = options?.rollSpecies;
    this.speciesId =
      speciesId ??
      this.customRollSpecies?.() ??
      rollFishSpecies(this.getLuck(), habitat, this.getExcludeSpecies(this));
    const rareBonusMult = this.speciesId === "dolphin" ? 0.5 : 1;
    this.size = rollFishSize(rareBonusMult);
    this.mutation = this.rollSpawnMutation(rareBonusMult);
    const def = ITEMS[this.speciesId];
    this.idleMinX = idleMinX;
    this.idleMaxX = idleMaxX;
    this.surfaceY = waterSurfaceY;
    this.baseY = this.depthForSpecies();
    this.sprite = scene.physics.add.sprite(x, this.baseY, def.textureKey);
    this.sprite.setDepth(5);
    this.applySpeciesVisual();
    this.applySpeciesSwimStats();
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    this.pickNewIdleBehavior(true);
    this.scheduleDespawn();
    if (def.surfaceJumps) {
      this.nextJumpAt =
        scene.time.now + Phaser.Math.Between(800, 2800);
    }
    if (def.surfaceSpout) {
      this.nextSpoutAt =
        scene.time.now + Phaser.Math.Between(1200, 2800);
    }
  }

  /** World mutation, then Sunny → Tanned if still plain. */
  private rollSpawnMutation(rareBonusMult: number): FishMutationId | null {
    const world = rollWorldMutation(rareBonusMult);
    if (world) return world;
    if (this.getIsSunny()) {
      return rollSunnyMutation(rareBonusMult);
    }
    return null;
  }

  /** Dive deep and despawn (cave whale timeout). */
  diveDespawn(onDone?: () => void): void {
    if (this.diving) return;
    this.diving = true;
    this.state = "caught";
    this.jumping = false;
    this.velX = 0;
    this.targetVelX = 0;
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngle(0);
    playWaterSplash(this.sprite.scene, this.sprite.x, this.surfaceY, 1.4);
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      y: this.surfaceY + 420,
      alpha: 0,
      duration: 2200,
      ease: "Quad.easeIn",
      onUpdate: () => this.syncGlow(this.sprite.scene.time.now),
      onComplete: () => {
        this.clearGlow();
        this.sprite.destroy();
        onDone?.();
      },
    });
  }

  ignoresBobber(): boolean {
    if (ITEMS[this.speciesId].ignoresBobber) return true;
    // Mid-air dolphins can't take the bait
    return this.jumping;
  }

  /** Depth below surface for this species (rarer → deeper, but legends/mythics can go shallow). */
  private depthForSpecies(): number {
    const def = ITEMS[this.speciesId];
    const rarity = def.rarity ?? "common";
    const maxDepth =
      this.habitat === "pond"
        ? 210
        : this.habitat === "reef"
          ? 155
          : this.habitat === "cave"
            ? CAVE_FISH_MAX_DEPTH_PX
            : undefined;
    const y =
      this.surfaceY +
      rollSpawnDepthOffset(
        rarity,
        this.getIsRainy(),
        def.depthBand ?? null,
        !!def.depthCanShallow
      );
    if (maxDepth != null) {
      return Math.min(y, this.surfaceY + maxDepth);
    }
    return y;
  }

  private applySpeciesVisual(): void {
    const def = ITEMS[this.speciesId];
    const s = sizeScale(this.size);
    const w = (def.displayWidth ?? 48) * s;
    const h = (def.displayHeight ?? 16) * s;
    this.sprite.setTexture(def.textureKey);
    this.sprite.setDisplaySize(w, h);
    this.applyMutationVisual(w, h);
  }

  private clearGlow(): void {
    this.glow?.destroy();
    this.glow = undefined;
  }

  private applyMutationVisual(w: number, h: number): void {
    this.clearGlow();
    applyMutationTint(this.sprite, this.mutation);
    if (!this.mutation) return;
    const mut = MUTATIONS[this.mutation];
    if (mut.glowColor == null) return;

    this.glow = this.sprite.scene.add
      .image(this.sprite.x, this.sprite.y, this.sprite.texture.key)
      .setDepth(this.sprite.depth - 1)
      .setDisplaySize(w * 1.4, h * 1.55)
      .setTint(mut.glowColor)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setFlipX(this.sprite.flipX);
  }

  private syncGlow(now: number): void {
    if (!this.glow) return;
    this.glow.setPosition(this.sprite.x, this.sprite.y);
    this.glow.setFlipX(this.sprite.flipX);
    this.glow.setVisible(this.sprite.visible);
    const pulse = 0.38 + Math.sin(now / 220) * 0.18;
    this.glow.setAlpha(this.sprite.alpha * pulse);
  }

  private applySpeciesSwimStats(): void {
    const speed = ITEMS[this.speciesId].minigameSpeed ?? 1;
    // Mushrooms drift slowly back and forth
    if (this.ignoresBobber()) {
      this.accel = 30;
      this.maxSpeed = 28;
      return;
    }
    // Cave whale — big and lumbering, not a speedster
    if (ITEMS[this.speciesId].surfaceSpout) {
      this.accel = 28;
      this.maxSpeed = 48;
      return;
    }
    this.accel = 55 * (0.85 + speed * 0.2);
    this.maxSpeed = 70 * (0.9 + speed * 0.25);
  }

  /** Bite radius scales with sprite size so big fish (sunfish) still hook. */
  biteRadius(): number {
    const def = ITEMS[this.speciesId];
    const s = sizeScale(this.size);
    const w = (def.displayWidth ?? 48) * s;
    const h = (def.displayHeight ?? 16) * s;
    return 16 + Math.max(w, h) * 0.22;
  }

  /** Flip so the snout leads — most fish face right; some (croc) face left. */
  private setFacing(dirX: number): void {
    if (Math.abs(dirX) < 0.5) return;
    const facesLeft = !!ITEMS[this.speciesId].facesLeft;
    this.sprite.setFlipX(facesLeft ? dirX > 0 : dirX < 0);
  }

  approachBobber(bobberX: number, bobberY: number, speedMult = 1): void {
    if (this.ignoresBobber()) return;
    // Cancel any fade-out despawn if this fish gets a bite chance
    if (this.despawning) {
      this.sprite.scene.tweens.killTweensOf(this.sprite);
      this.despawning = false;
      this.sprite.setAlpha(1);
    }
    this.approachSpeedMult = Math.max(0.4, speedMult);
    this.state = "approaching";
    this.pauseUntil = 0;
    this.approachStartedAt = this.sprite.scene.time.now;
    this.closestApproach = Infinity;
    this.setApproachTarget(bobberX, bobberY);
    this.steerTowardTarget(true);
  }

  /** Stop chasing and resume idle swim (keeps species / depth). */
  abortApproach(): void {
    if (this.state !== "approaching") return;
    this.state = "idle";
    this.approachSpeedMult = 1;
    this.velX = 0;
    this.targetVelX = 0;
    this.sprite.setVelocity(0, 0);
    this.baseY = this.sprite.y;
    this.pickNewIdleBehavior(true);
  }

  /** Keep chasing the bobber while it floats. */
  updateApproachTarget(bobberX: number, bobberY: number): void {
    if (this.state !== "approaching") return;
    this.setApproachTarget(bobberX, bobberY);
  }

  private setApproachTarget(bobberX: number, bobberY: number): void {
    this.approachTargetX = bobberX;
    // Stay underwater — never aim above the surface
    const maxDepth =
      this.habitat === "pond"
        ? 220
        : this.habitat === "reef"
          ? 155
          : this.habitat === "cave"
            ? CAVE_FISH_MAX_DEPTH_PX
            : 165;
    this.approachTargetY = Phaser.Math.Clamp(
      bobberY + 10,
      this.surfaceY + 16,
      this.surfaceY + maxDepth
    );
  }

  markBitten(): void {
    this.state = "bitten";
    this.velX = 0;
    this.targetVelX = 0;
    this.sprite.setVelocity(0, 0);
    // Lock under the surface at the hook
    this.sprite.y = Math.max(this.sprite.y, this.surfaceY + 14);
  }

  /** Show or hide the Tranquil Rod catch bubble around this fish. */
  setTranquilBubble(active: boolean): void {
    if (active === this.tranquilBubbleActive) return;
    this.tranquilBubbleActive = active;
    if (!active) {
      this.clearTranquilBubble();
      return;
    }
    const scene = this.sprite.scene;
    const r = this.tranquilBubbleRadius();
    this.tranquilBubble = scene.add
      .circle(this.sprite.x, this.sprite.y, r, 0x8fe9ff, 0.34)
      .setStrokeStyle(3, 0xf7ffff, 0.95)
      .setDepth(this.sprite.depth + 1);
    this.tranquilBubbleShine = scene.add
      .circle(this.sprite.x - r * 0.28, this.sprite.y - r * 0.32, r * 0.14, 0xffffff, 0.88)
      .setDepth(this.sprite.depth + 2);
  }

  popTranquilBubble(): void {
    if (!this.tranquilBubbleActive) return;
    const scene = this.sprite.scene;
    const r = this.tranquilBubbleRadius();
    playTranquilBubblePopFx(scene, this.sprite.x, this.sprite.y, r, {
      depth: this.sprite.depth + 3,
      scrollFactor: 1,
      intensity: 1,
    });
    this.setTranquilBubble(false);
  }

  private tranquilBubbleRadius(): number {
    return Math.max(this.sprite.displayWidth, this.sprite.displayHeight) * 0.68 + 10;
  }

  private clearTranquilBubble(): void {
    this.tranquilBubble?.destroy();
    this.tranquilBubbleShine?.destroy();
    this.tranquilBubble = undefined;
    this.tranquilBubbleShine = undefined;
    this.tranquilBubbleActive = false;
  }

  private syncTranquilBubble(now: number): void {
    if (!this.tranquilBubbleActive || !this.tranquilBubble) return;
    const r = this.tranquilBubbleRadius();
    const pulse = 0.82 + Math.sin(now / 170) * 0.1;
    this.tranquilBubble
      .setPosition(this.sprite.x, this.sprite.y)
      .setRadius(r)
      .setScale(pulse)
      .setVisible(this.sprite.visible);
    this.tranquilBubbleShine
      ?.setPosition(this.sprite.x - r * 0.28, this.sprite.y - r * 0.32)
      .setRadius(Math.max(3, r * 0.14))
      .setVisible(this.sprite.visible);
  }

  markCaught(): void {
    this.state = "caught";
    this.clearTranquilBubble();
    this.sprite.setVisible(false);
    this.glow?.setVisible(false);
    this.velX = 0;
    this.targetVelX = 0;
    this.sprite.setVelocity(0, 0);
  }

  /** Apply / replace mutation visuals (e.g. thunderstorm lightning hit). */
  setMutation(mutation: FishMutationId | null): void {
    this.mutation = mutation;
    const def = ITEMS[this.speciesId];
    const s = sizeScale(this.size);
    const w = (def.displayWidth ?? 48) * s;
    const h = (def.displayHeight ?? 16) * s;
    this.applyMutationVisual(w, h);
  }

  resetIdle(x?: number, y?: number): void {
    this.despawning = false;
    this.clearTranquilBubble();
    this.state = "idle";
    this.jumping = false;
    if (!this.lockSpecies) {
      this.speciesId =
        this.customRollSpecies?.() ??
        rollFishSpecies(
          this.getLuck(),
          this.habitat,
          this.getExcludeSpecies(this)
        );
      const rareBonusMult = this.speciesId === "dolphin" ? 0.5 : 1;
      this.size = rollFishSize(rareBonusMult);
      this.mutation = this.rollSpawnMutation(rareBonusMult);
    } else if (ITEMS[this.speciesId].persistOnFail) {
      this.size = "normal";
      this.mutation = null;
    }
    this.applySpeciesVisual();
    this.applySpeciesSwimStats();
    this.sprite.setVisible(true);
    this.sprite.setAlpha(1);
    this.sprite.setVelocity(0, 0);
    if (x !== undefined && y !== undefined) {
      this.sprite.setPosition(x, y);
      this.baseY = y;
    } else {
      this.baseY = this.depthForSpecies();
      this.sprite.setPosition(
        Phaser.Math.Between(this.idleMinX, this.idleMaxX),
        this.baseY
      );
    }
    this.syncGlow(this.sprite.scene.time.now);
    this.pickNewIdleBehavior(true);
    this.scheduleDespawn();
    if (ITEMS[this.speciesId].surfaceJumps) {
      this.nextJumpAt =
        this.sprite.scene.time.now + Phaser.Math.Between(600, 2200);
    }
  }

  private scheduleDespawn(): void {
    if (this.noDespawn) {
      this.despawnAt = Number.POSITIVE_INFINITY;
      return;
    }
    const now = this.sprite.scene.time.now;
    // Mushrooms cycle out fast; other fish ~2 minutes
    if (this.ignoresBobber() && !ITEMS[this.speciesId].surfaceJumps) {
      this.despawnAt = now + Phaser.Math.Between(14_000, 26_000);
    } else {
      this.despawnAt = now + Phaser.Math.Between(110_000, 130_000);
    }
  }

  /** True while fading out / about to respawn. */
  isDespawning(): boolean {
    return this.despawning;
  }

  /** How far below the surface this fish is swimming. */
  depthBelowSurface(): number {
    return this.sprite.y - this.surfaceY;
  }

  distanceTo(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y);
  }

  update(delta: number): void {
    const now = this.sprite.scene.time.now;
    const dt = Math.min(delta / 1000, 0.05);

    if (this.state === "idle") {
      // Despawn only while casually swimming — never mid-approach / bite
      if (!this.despawning && now >= this.despawnAt) {
        this.beginDespawn();
        return;
      }
      if (this.despawning) {
        this.syncGlow(now);
        return;
      }
      this.updateIdleSwim(now, dt);
    } else if (this.state === "approaching") {
      this.updateApproach(now, dt);
    } else if (this.state === "bitten") {
      this.clampUnderwater();
    }
    this.syncGlow(now);
    this.syncTranquilBubble(now);
  }

  private beginDespawn(): void {
    this.despawning = true;
    this.velX = 0;
    this.targetVelX = 0;
    this.sprite.setVelocity(0, 0);
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        // Might have been hooked during the fade — abort respawn
        if (this.state !== "idle") {
          this.despawning = false;
          this.sprite.setAlpha(1);
          return;
        }
        this.resetIdle();
      },
    });
  }

  private updateApproach(now: number, _dt: number): void {
    const dist = this.distanceTo(this.approachTargetX, this.approachTargetY);
    this.closestApproach = Math.min(this.closestApproach, dist);

    // Arrived at hook — stop and wait for bite trigger
    if (dist <= this.biteRadius()) {
      this.sprite.setVelocity(0, 0);
      this.sprite.x = Phaser.Math.Linear(
        this.sprite.x,
        this.approachTargetX,
        0.35
      );
      this.sprite.y = Phaser.Math.Linear(
        this.sprite.y,
        this.approachTargetY,
        0.35
      );
      this.clampUnderwater();
      return;
    }

    // Gave up / overshot badly — return to swimming
    const elapsed = now - this.approachStartedAt;
    if (
      elapsed > 4500 ||
      (elapsed > 1200 && dist > this.closestApproach + 80)
    ) {
      this.abortApproach();
      return;
    }

    this.steerTowardTarget(false);
    this.clampUnderwater();

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (Math.abs(body.velocity.x) > 4) {
      this.setFacing(body.velocity.x);
    }
  }

  private steerTowardTarget(immediate: boolean): void {
    const dx = this.approachTargetX - this.sprite.x;
    const dy = this.approachTargetY - this.sprite.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed =
      Phaser.Math.Clamp(dist * 0.55, 36, 110) * this.approachSpeedMult;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    if (immediate) {
      this.sprite.setVelocity(vx, vy);
    } else {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.x = Phaser.Math.Linear(body.velocity.x, vx, 0.18);
      body.velocity.y = Phaser.Math.Linear(body.velocity.y, vy, 0.18);
    }
    this.velX = vx;
    this.targetVelX = vx;
    this.setFacing(dx);
  }

  private clampUnderwater(): void {
    if (this.jumping || this.diving) return;
    const minY = this.surfaceY + 12;
    const maxY =
      this.surfaceY +
      (this.habitat === "pond"
        ? 220
        : this.habitat === "reef"
          ? 155
          : this.habitat === "cave"
            ? CAVE_FISH_MAX_DEPTH_PX
            : 165);
    if (this.sprite.y < minY) {
      this.sprite.y = minY;
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y < 0) body.velocity.y = 0;
    } else if (this.sprite.y > maxY) {
      this.sprite.y = maxY;
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y > 0) body.velocity.y = 0;
    }
  }

  private updateIdleSwim(now: number, dt: number): void {
    if (this.diving) return;
    if (ITEMS[this.speciesId].surfaceJumps) {
      if (this.jumping) {
        this.updateSurfaceJump(dt);
        return;
      }
      if (now >= this.nextJumpAt) {
        this.beginSurfaceJump();
        return;
      }
    }

    if (ITEMS[this.speciesId].surfaceSpout && now >= this.nextSpoutAt) {
      this.fireWhaleSpout();
      this.nextSpoutAt = now + Phaser.Math.Between(1800, 3600);
    }

    if (now >= this.nextDecisionAt) {
      this.pickNewIdleBehavior(false);
    }

    if (this.velX < this.targetVelX) {
      this.velX = Math.min(this.targetVelX, this.velX + this.accel * dt);
    } else if (this.velX > this.targetVelX) {
      this.velX = Math.max(this.targetVelX, this.velX - this.accel * dt);
    }

    if (this.sprite.x <= this.idleMinX + 12 && this.velX < 0) {
      this.targetVelX = 0;
      if (this.sprite.x <= this.idleMinX) {
        this.sprite.x = this.idleMinX;
        this.velX = 0;
        this.targetVelX = Phaser.Math.FloatBetween(18, this.maxSpeed);
        this.pauseUntil = now + Phaser.Math.Between(200, 700);
        this.nextDecisionAt = this.pauseUntil + Phaser.Math.Between(400, 1200);
      }
    } else if (this.sprite.x >= this.idleMaxX - 12 && this.velX > 0) {
      this.targetVelX = 0;
      if (this.sprite.x >= this.idleMaxX) {
        this.sprite.x = this.idleMaxX;
        this.velX = 0;
        this.targetVelX = -Phaser.Math.FloatBetween(18, this.maxSpeed);
        this.pauseUntil = now + Phaser.Math.Between(200, 700);
        this.nextDecisionAt = this.pauseUntil + Phaser.Math.Between(400, 1200);
      }
    }

    if (now < this.pauseUntil) {
      this.velX *= Math.pow(0.88, dt * 60);
      this.sprite.setVelocity(this.velX, 0);
    } else {
      this.sprite.setVelocity(this.velX, 0);
    }

    if (Math.abs(this.velX) > 6) {
      this.setFacing(this.velX);
    }

    const bobAmp = Math.abs(this.velX) < 8 ? 3 : 6;
    this.sprite.y =
      this.baseY + Math.sin(now / 450 + this.sprite.x * 0.05) * bobAmp;
    this.clampUnderwater();
  }

  /** Blowhole spout — water shoots upward like a whale. */
  private fireWhaleSpout(): void {
    const scene = this.sprite.scene;
    const x = this.sprite.x;
    const top = this.sprite.y - this.sprite.displayHeight * 0.35;
    playWaterSplash(scene, x, this.surfaceY, 1.35);
    // Vertical column of spray
    for (let i = 0; i < 10; i++) {
      const drop = scene.add
        .circle(
          x + Phaser.Math.Between(-10, 10),
          top,
          Phaser.Math.Between(2, 4),
          0xd0ecff,
          0.85
        )
        .setDepth(15);
      scene.tweens.add({
        targets: drop,
        y: top - Phaser.Math.Between(70, 140),
        x: drop.x + Phaser.Math.Between(-18, 18),
        alpha: 0,
        duration: 480 + i * 40,
        ease: "Quad.easeOut",
        onComplete: () => drop.destroy(),
      });
    }
  }

  private beginSurfaceJump(): void {
    // Prefer current swim direction so the leap continues the motion
    let dir = Math.sign(this.velX || this.targetVelX);
    if (dir === 0) {
      dir = this.sprite.x > (this.idleMinX + this.idleMaxX) / 2 ? -1 : 1;
    }
    const span = Phaser.Math.Between(160, 240);
    this.jumpStartX = this.sprite.x;
    this.jumpEndX = Phaser.Math.Clamp(
      this.sprite.x + dir * span,
      this.idleMinX + 24,
      this.idleMaxX - 24
    );
    // Low, quick arc — reads as a leap, not a float
    this.jumpPeak = Phaser.Math.Between(28, 44);
    this.jumpDuration = Phaser.Math.FloatBetween(0.48, 0.68);
    this.jumpT = 0;
    this.jumping = true;
    this.jumpEntrySplashed = false;
    this.velX = 0;
    this.targetVelX = 0;
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngle(0);
    this.setFacing(this.jumpEndX - this.jumpStartX);
    this.sprite.setDepth(14);
    // Exit splash as they break the surface
    playWaterSplash(this.sprite.scene, this.sprite.x, this.surfaceY, 1.05);
  }

  private updateSurfaceJump(dt: number): void {
    this.jumpT += dt;
    const u = Math.min(1, this.jumpT / this.jumpDuration);
    // Slight ease so takeoff/landing aren't robotic
    const ease = u * u * (3 - 2 * u);
    const x = Phaser.Math.Linear(this.jumpStartX, this.jumpEndX, ease);
    // Pure parabola through the surface (u=0 and u=1 at waterline)
    const arc = 4 * u * (1 - u);
    const y = this.surfaceY - this.jumpPeak * arc;
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);

    // Pitch follows the tangent of the arc — kept mild for a long flat sprite
    const dx = this.jumpEndX - this.jumpStartX;
    const dyDu = -this.jumpPeak * (4 - 8 * u);
    const dxDu = dx * (6 * u * (1 - u)); // derivative of smoothstep
    const facing = Math.sign(dx) || 1;
    const targetAngle =
      Phaser.Math.Clamp(
        Phaser.Math.RadToDeg(Math.atan2(dyDu, Math.max(40, Math.abs(dxDu)))),
        -22,
        22
      ) * facing;
    this.sprite.setAngle(
      Phaser.Math.Linear(this.sprite.angle, targetAngle, 0.28)
    );

    // Entry splash just before they hit the water again
    if (!this.jumpEntrySplashed && u >= 0.86) {
      this.jumpEntrySplashed = true;
      playWaterSplash(this.sprite.scene, x, this.surfaceY, 1.25);
    }

    if (u >= 1) {
      this.jumping = false;
      this.sprite.setAngle(0);
      this.sprite.setDepth(5);
      this.baseY = this.surfaceY + Phaser.Math.Between(20, 36);
      this.sprite.y = this.baseY;
      // Keep gliding the same way after splashdown
      this.targetVelX =
        facing * Phaser.Math.FloatBetween(this.maxSpeed * 0.55, this.maxSpeed);
      this.velX = this.targetVelX * 0.7;
      this.sprite.setVelocityX(this.velX);
      this.setFacing(this.velX);
      this.nextJumpAt =
        this.sprite.scene.time.now + Phaser.Math.Between(1800, 3800);
      this.nextDecisionAt =
        this.sprite.scene.time.now + Phaser.Math.Between(900, 1600);
    }
  }

  private pickNewIdleBehavior(immediate: boolean): void {
    const now = this.sprite.scene.time.now;

    // Mushroom clusters: only patrol back and forth, no mid-swim pauses
    if (this.ignoresBobber()) {
      const dir =
        this.targetVelX === 0
          ? Math.random() > 0.5
            ? 1
            : -1
          : Math.sign(this.targetVelX || this.velX || 1);
      this.targetVelX = dir * Phaser.Math.FloatBetween(14, this.maxSpeed);
      this.pauseUntil = 0;
      this.nextDecisionAt = now + Phaser.Math.Between(1800, 3200);
      if (immediate) {
        this.velX = this.targetVelX * 0.5;
        this.sprite.setVelocityX(this.velX);
        this.setFacing(this.velX);
      }
      return;
    }

    const roll = Math.random();

    if (roll < 0.22) {
      this.targetVelX = 0;
      this.pauseUntil = now + Phaser.Math.Between(400, 1400);
      this.nextDecisionAt = this.pauseUntil + Phaser.Math.Between(200, 800);
    } else if (roll < 0.4) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      this.targetVelX = dir * Phaser.Math.FloatBetween(10, 28);
      this.nextDecisionAt = now + Phaser.Math.Between(800, 2200);
    } else if (roll < 0.55) {
      this.targetVelX =
        (this.targetVelX === 0
          ? Math.random() > 0.5
            ? 1
            : -1
          : -Math.sign(this.targetVelX || this.velX || 1)) *
        Phaser.Math.FloatBetween(20, this.maxSpeed);
      this.nextDecisionAt = now + Phaser.Math.Between(700, 1800);
    } else {
      const dir = Math.random() > 0.5 ? 1 : -1;
      this.targetVelX = dir * Phaser.Math.FloatBetween(28, this.maxSpeed);
      this.nextDecisionAt = now + Phaser.Math.Between(900, 2600);
    }

    if (immediate) {
      this.velX = this.targetVelX * 0.4;
      this.sprite.setVelocityX(this.velX);
      if (Math.abs(this.velX) > 4) {
        this.setFacing(this.velX);
      }
    }
  }

  destroy(): void {
    this.clearTranquilBubble();
    this.clearGlow();
    this.sprite.destroy();
  }
}
