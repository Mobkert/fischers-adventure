import Phaser from "phaser";
import { playTranquilBubblePopFx } from "../fx/TranquilBubblePop";
import { playLightningCrack, playWarningBeep } from "../audio/ZeusSfx";
import { playRecoilShot, playRecoilWarning } from "../audio/RecoilSfx";
import {
  playForgeArmSfx,
  playForgeHitSfx,
  playForgeLaunchSfx,
} from "../audio/ForgeRodSfx";
import { playForgeWeaponHitFx } from "../fx/ForgeRodFx";
import { playStarweaverWeaveFx, createStarweaverLockOn, StarweaverLockOn } from "../fx/StarweaverFx";

export type CatchMinigameResultMeta = {
  guaranteeThunder?: boolean;
  guaranteeAshencast?: boolean;
  guaranteeConfetti?: boolean;
  /** How many Recoil shotgun kicks fired during this fight. */
  recoilKicks?: number;
  /** Tranquil bubble popped during this fight (75% Tranquil mutation). */
  bubbleCatch?: boolean;
};

type BirthdayBalloonKind = "blue" | "red" | "green";

type BirthdayBalloon = {
  kind: BirthdayBalloonKind;
  root: Phaser.GameObjects.Container;
  vy: number;
};

export class CatchMinigame {
  private root: Phaser.GameObjects.Container;
  private greyBar!: Phaser.GameObjects.Rectangle;
  private whiteBar!: Phaser.GameObjects.Rectangle;
  /** Optional skin replacement for the control bar (e.g. Pufferfirm). */
  private whiteBarSkin?: Phaser.GameObjects.Image;
  private poisonVines?: Phaser.GameObjects.Graphics;
  private poisonVinePhase = 0;
  private panel!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  /** Deep-space backdrop + stars for Laser skin UI. */
  private laserSpaceGfx?: Phaser.GameObjects.Graphics;
  private laserSparkGfx?: Phaser.GameObjects.Graphics;
  private laserSpacePhase = 0;
  /** Frostpeak skin chrome (lotus / ice frames / VFX). */
  private frostChromeGfx?: Phaser.GameObjects.Graphics;
  private frostFxGfx?: Phaser.GameObjects.Graphics;
  private frostChromePhase = 0;
  private laserSparkSpawnTimer = 0;
  private laserStars: Array<{
    x: number;
    y: number;
    size: number;
    phase: number;
    bright: number;
  }> = [];
  private laserSparks: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
    forks: number;
  }> = [];
  private fishIcon!: Phaser.GameObjects.Image;
  private fishGlow!: Phaser.GameObjects.Image;
  private fishIcon2!: Phaser.GameObjects.Image;
  private fishGlow2!: Phaser.GameObjects.Image;
  private dualCatch = false;
  private facesLeft2 = false;
  private glowColor2: number | null = null;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private bubbleMarker!: Phaser.GameObjects.Arc;
  private fishBubble!: Phaser.GameObjects.Arc;
  private fishBubbleShine!: Phaser.GameObjects.Arc;
  private fishBubbleW = 42;
  private fishBubbleH = 14;
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
  private pauseDuration: { min: number; max: number } | null = null;
  private facesLeft = false;
  private fishRotateDeg = 0;
  private glowColor: number | null = null;
  private progress = 0.2;
  private fillRate = 0.12; // ~6.5s of solid tracking from 20% → 100%
  private readonly baseFillRate = 0.12;
  private drainRate = 0.16;
  private readonly baseDrainRate = 0.16;
  /** Crystal Rod: roll burst every 0.5s. */
  private crystalBurst = false;
  private crystalBurstTimer = 0;
  private readonly crystalBurstProgressGain = 0.05;
  private readonly crystalBurstStunPause = 0.425;
  private readonly crystalBurstStunDecision = 0.45;
  /** Tranquil Rod: bubble on the fish; at 50% progress it pops and fill speeds up. */
  private tranquilBubble = false;
  private bubbleActive = false;
  /** True if the tranquil bubble popped this fight. */
  private bubbleCatch = false;
  private tranquilRush = false;
  private readonly bubbleBurstProgress = 0.5;
  /** Fill rate after the bubble pops (~0.4s from 50% → 100% in the white zone). */
  private readonly tranquilRushFillRate = 1.25;
  /** Zeus Rod: periodic lightning zones on the catch bar. */
  private zeusStrike = false;
  /** Active rod skin id for visual overrides. */
  private rodSkinId: string | null = null;
  private laserElectrifyTween?: Phaser.Tweens.Tween;
  private zeusRollTimer = 0;
  /** Chance per second to telegraph; halves after each strike (25% → 12.5% → …). */
  private zeusStrikeChance = 0.25;
  private zeusPhase: "idle" | "warn" | "strike" = "idle";
  private zeusZoneX = 0;
  private readonly zeusZoneW = 96;
  private zeusWarnBeepsLeft = 0;
  private zeusWarnTimer = 0;
  private zeusWarnVisible = false;
  private electrified = false;
  private guaranteeThunder = false;
  private zeusZoneRect!: Phaser.GameObjects.Rectangle;
  private zeusWarnIcon!: Phaser.GameObjects.Text;
  private elecSparks: Phaser.GameObjects.Rectangle[] = [];
  /** Recoil Rod: after 4 fish moves, warn then blast the bar across. */
  private recoilKick = false;
  private recoilFishMoves = 0;
  /** Total shotgun kicks fired during this fight (for mutation boost). */
  private recoilKickCount = 0;
  private recoilPhase: "idle" | "warn" | "kick" | "burst" = "idle";
  private recoilWarnTimer = 0;
  private recoilWarnRoot!: Phaser.GameObjects.Container;
  private recoilWarnIcon!: Phaser.GameObjects.Text;
  private readonly recoilProgressGain = 0.225;
  /** Bar slides quickly to the far side instead of teleporting. */
  private recoilKickActive = false;
  private recoilKickTarget = 0;
  private readonly recoilKickSpeed = 1350;
  /** Testing: 3rd kick becomes a rapid burst instead of a normal shot. */
  private recoilBurstActive = false;
  private recoilBurstElapsed = 0;
  private recoilBurstShotTimer = 0;
  private readonly recoilBurstDuration = 2;
  private readonly recoilBurstInterval = 0.2;
  /** Burst shots only nudge progress (testing). */
  private readonly recoilBurstProgressGain = 0.1;
  /** Only one burst per fight (on the 3rd kick) when mastery is unlocked. */
  private recoilBurstUsed = false;
  private recoilBurstMastery = false;
  /** Forge Rod: swords/axes after 3 fish moves. */
  private forgeStrike = false;
  private forgeFishMoves = 0;
  private forgeCooldownMoves = 0;
  private forgePhase: "idle" | "arming" | "launching" = "idle";
  private forgeArmingTimer = 0;
  private forgeWeaponsPending = 0;
  /** Forge Rod — +5 progress speed percentage points per sword (stacks). */
  private baseProgressSpeed = 0;
  private forgeSwordSpeedAdd = 0;
  private readonly forgeSwordSpeedBonus = 5;
  private readonly forgeAxeProgressGain = 0.1;
  private readonly forgeEmberSwordChance = 0.025;
  private forgeWeaponSprites: Phaser.GameObjects.Image[] = [];
  /** Forge Rod — at least one orange ember weapon in the volley guarantees Ashencast. */
  private forgeHadEmberWeapon = false;
  /** Starweaver Rod: sacrifice progress after 3 fish moves to stun. */
  private starweaverWeave = false;
  private starweaverFishMoves = 0;
  private starweaverCooldownMoves = 0;
  /** Remaining stun lock-on time (separate from generic fishPauseTimer). */
  private starweaverStunLeft = 0;
  private starweaverLock: StarweaverLockOn | null = null;
  /** True while bullets are in flight or stun lock is active — blocks move counting. */
  private starweaverBusy = false;
  /** Birthday Rod: party balloons, zone tick, instant confetti catch. */
  private birthdayParty = false;
  private birthdayBalloons: BirthdayBalloon[] = [];
  private birthdayBalloonLayer!: Phaser.GameObjects.Container;
  private birthdaySpawnTimer = 0;
  private birthdayBarTickTimer = 0;
  private birthdayZoneTickInterval = 0.5;
  private readonly birthdayZoneTickIntervalStart = 0.5;
  private readonly birthdayZoneTickIntervalMin = 0.1;
  private readonly birthdayZoneTickIntervalStep = 0.1;
  private whiteBarWidthTween?: Phaser.Tweens.Tween;
  private readonly birthdayBalloonW = 48;
  private readonly birthdayBalloonH = 58;
  private readonly birthdayBalloonHitR = 38;
  /** Red balloon +10% progress speed stacks (updates Progress hint). */
  private birthdayBalloonSpeedAdd = 0;
  /** +1% progress speed every 0.5s while fish stays in the white zone. */
  private birthdayZoneSpeedAdd = 0;
  /** Green balloon +10% white bar width stacks. */
  private birthdayBarSizeMult = 1;
  private birthdayControlShare = 0;
  private guaranteeConfetti = false;
  private birthdayInstaPending = false;
  private birthdayNextSpawn = 1;
  private prevRightDown = false;
  private baseFishMaxSpeed = 155;
  private baseFishAccel = 220;
  /** White zone starts at this share of the grey bar; control % adds on top. */
  private readonly baseWhiteShare = 0.2;
  /** Acceleration when holding (right) or releasing (left gravity). */
  private readonly accel = 980;
  private readonly maxSpeed = 520;
  /** How hard it rebounds off the grey bar edges. */
  private readonly bounceRestitution = 0.72;
  /** Soft damping so it doesn't feel endless. */
  private readonly drag = 1.6;
  /**
   * Wall bounce chain: impact speed picks 0–3 bounces; chain stays armed
   * until those are spent and the bar leaves the wall (no endless ping-pong).
   */
  private leftBounceRemaining = 0;
  private rightBounceRemaining = 0;
  private leftBounceChain = false;
  private rightBounceChain = false;
  private holdKey!: Phaser.Input.Keyboard.Key;
  private onResult?: (success: boolean, meta?: CatchMinigameResultMeta) => void;
  private onTranquilBubblePop?: () => void;
  private baseY: number;

  constructor(scene: Phaser.Scene) {
    // Sit in the hotbar's place at the bottom of the screen
    const cx = scene.scale.width / 2;
    this.baseY = scene.scale.height - 78;
    const cy = this.baseY;

    this.root = scene.add.container(cx, cy).setDepth(150).setVisible(false);
    this.root.setScrollFactor(0);

    this.panel = scene.add
      .rectangle(0, 0, 560, 132, 0x111118, 0.92)
      .setStrokeStyle(2, 0xffffff);
    this.title = scene.add
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

    this.fishGlow = scene.add
      .image(0, -8, "fish")
      .setDisplaySize(52, 20)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.fishIcon = scene.add.image(0, -8, "fish").setDisplaySize(42, 14);
    this.fishGlow2 = scene.add
      .image(18, -8, "fish")
      .setDisplaySize(52, 20)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.fishIcon2 = scene.add
      .image(18, -8, "fish")
      .setDisplaySize(42, 14)
      .setVisible(false);

    this.progressBg = scene.add
      .rectangle(0, 34, this.barWidth, 14, 0x333333)
      .setStrokeStyle(1, 0x222222);
    this.progressFill = scene.add
      .rectangle(-this.barWidth / 2, 34, 0, 10, 0x4caf50)
      .setOrigin(0, 0.5);
    this.bubbleMarker = scene.add
      .circle(-this.barWidth / 2 + this.barWidth * this.bubbleBurstProgress, 34, 8, 0x8fe9ff, 0.95)
      .setStrokeStyle(2, 0xf7ffff)
      .setVisible(false);
    this.fishBubble = scene.add
      .circle(0, -8, 24, 0x8fe9ff, 0.34)
      .setStrokeStyle(3, 0xf7ffff, 0.95)
      .setVisible(false);
    this.fishBubbleShine = scene.add
      .circle(0, -8, 4, 0xffffff, 0.88)
      .setVisible(false);

    this.zeusZoneRect = scene.add
      .rectangle(0, -8, this.zeusZoneW, this.barHeight + 4, 0xffe066, 0.28)
      .setStrokeStyle(2, 0xffcc33, 0.9)
      .setVisible(false);
    this.zeusWarnIcon = scene.add
      .text(0, -8, "⚠", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setVisible(false);

    for (let i = 0; i < 6; i++) {
      const spark = scene.add
        .rectangle(0, -8, 3, 10, 0xa8e8ff, 0.85)
        .setVisible(false)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.elecSparks.push(spark);
    }

    this.recoilWarnRoot = scene.add
      .container(scene.scale.width / 2, scene.scale.height / 2 - 48)
      .setDepth(260)
      .setScrollFactor(0)
      .setVisible(false);
    const recoilRing = scene.add
      .circle(0, 0, 42, 0xff5533, 0.22)
      .setStrokeStyle(4, 0xff8866, 0.95);
    this.recoilWarnIcon = scene.add
      .text(0, 0, "⚠", {
        fontFamily: "Arial",
        fontSize: "56px",
        color: "#ff6644",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.recoilWarnRoot.add([recoilRing, this.recoilWarnIcon]);

    this.hint = scene.add
      .text(0, 54, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#bbbbbb",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.root.add([
      this.panel,
      this.title,
      this.greyBar,
      this.zeusZoneRect,
      this.whiteBar,
      ...this.elecSparks,
      this.fishGlow,
      this.fishBubble,
      this.fishBubbleShine,
      this.fishIcon,
      this.fishGlow2,
      this.fishIcon2,
      this.zeusWarnIcon,
      this.progressBg,
      this.progressFill,
      this.bubbleMarker,
      this.hint,
    ]);

    this.holdKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.birthdayBalloonLayer = scene.add
      .container(0, 0)
      .setDepth(180)
      .setScrollFactor(0)
      .setVisible(false);
  }

  start(
    onResult: (success: boolean, meta?: CatchMinigameResultMeta) => void,
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
      /** Override idle pause chance (0–1). */
      pauseChance?: number;
      /** Override pause length in seconds. */
      pauseDuration?: { min: number; max: number };
      /** Texture faces left by default. */
      facesLeft?: boolean;
      /** Rotate fish icon in the catch bar (deg). */
      rotateDeg?: number;
      /** Body tint for mutations. */
      tint?: number | null;
      /** Use solid fill tint (albino / near-white). */
      tintFill?: boolean;
      /** Glow aura color for mutations. */
      glowColor?: number | null;
      /** Crystal Rod burst ability. */
      crystalBurst?: boolean;
      /** Tranquil Rod bubble starts on the hooked fish. */
      tranquilBubble?: boolean;
      /** Zeus Rod lightning strike zones. */
      zeusStrike?: boolean;
      /** Recoil Rod shotgun kick after fish moves. */
      recoilKick?: boolean;
      /** Unlocked Recoil mastery — 3rd kick becomes a rapid burst. */
      recoilBurstMastery?: boolean;
      /** Forge Rod sword/axe volley after fish moves. */
      forgeStrike?: boolean;
      /** Starweaver Rod progress sacrifice stun. */
      starweaverWeave?: boolean;
      /** Birthday Rod party abilities. */
      birthdayParty?: boolean;
      /** Active rod skin id (crate / gallery) for VFX overrides. */
      rodSkinId?: string | null;
      /** Fired when the tranquil bubble pops (sync in-world fish). */
      onTranquilBubblePop?: () => void;
      /** Second hooked fish (twin-hook bobber). */
      second?: {
        textureKey?: string;
        displayWidth?: number;
        displayHeight?: number;
        facesLeft?: boolean;
        tint?: number | null;
        tintFill?: boolean;
        glowColor?: number | null;
      };
    }
  ): void {
    this.onResult = onResult;
    this.onTranquilBubblePop = options?.onTranquilBubblePop;
    this.active = true;
    this.ready = false;
    this.readyTimer = this.readyDuration;
    this.progress = 0.2;
    this.whiteX = 0;
    this.whiteVel = 0;
    this.leftBounceRemaining = 0;
    this.rightBounceRemaining = 0;
    this.leftBounceChain = false;
    this.rightBounceChain = false;
    this.fishX = 0;
    this.fishVel = 0;
    this.pauseChance =
      options?.pauseChance != null ? options.pauseChance : null;
    this.pauseDuration = options?.pauseDuration ?? null;
    this.facesLeft = !!options?.facesLeft;
    this.fishRotateDeg = options?.rotateDeg ?? 0;
    this.glowColor = options?.glowColor ?? null;
    this.crystalBurst = !!options?.crystalBurst;
    this.crystalBurstTimer = 0;
    this.dualCatch = !!options?.second;
    this.tranquilBubble = !!options?.tranquilBubble;
    this.bubbleActive = this.tranquilBubble;
    this.bubbleCatch = false;
    this.tranquilRush = false;
    this.zeusStrike = !!options?.zeusStrike;
    this.zeusRollTimer = 0;
    this.zeusStrikeChance = 0.25;
    this.zeusPhase = "idle";
    this.zeusWarnBeepsLeft = 0;
    this.zeusWarnTimer = 0;
    this.zeusWarnVisible = false;
    this.electrified = false;
    this.guaranteeThunder = false;
    this.zeusZoneRect.setVisible(false).setAlpha(0.28);
    this.zeusWarnIcon.setVisible(false).setAlpha(1).setScale(1);
    for (const s of this.elecSparks) s.setVisible(false);
    this.recoilKick = !!options?.recoilKick;
    this.recoilFishMoves = 0;
    this.recoilKickCount = 0;
    this.recoilPhase = "idle";
    this.recoilWarnTimer = 0;
    this.recoilKickActive = false;
    this.recoilKickTarget = 0;
    this.recoilBurstActive = false;
    this.recoilBurstElapsed = 0;
    this.recoilBurstShotTimer = 0;
    this.recoilBurstUsed = false;
    this.recoilBurstMastery = !!options?.recoilBurstMastery;
    this.recoilWarnRoot.setVisible(false).setAlpha(1).setScale(1);
    this.recoilWarnIcon.setAlpha(1).setScale(1);
    this.forgeStrike = !!options?.forgeStrike;
    this.starweaverWeave = !!options?.starweaverWeave;
    this.resetStarweaverState();
    this.forgeFishMoves = 0;
    this.forgeCooldownMoves = 0;
    this.forgePhase = "idle";
    this.forgeArmingTimer = 0;
    this.forgeWeaponsPending = 0;
    this.forgeSwordSpeedAdd = 0;
    this.forgeHadEmberWeapon = false;
    this.clearForgeWeapons();
    this.birthdayParty = !!options?.birthdayParty;
    this.rodSkinId = options?.rodSkinId ?? null;
    this.laserElectrifyTween?.stop();
    this.laserElectrifyTween = undefined;
    this.birthdayBalloonSpeedAdd = 0;
    this.birthdayZoneSpeedAdd = 0;
    this.birthdayBarSizeMult = 1;
    this.birthdayControlShare = 0;
    this.birthdaySpawnTimer = 0;
    this.birthdayBarTickTimer = 0;
    this.birthdayZoneTickInterval = this.birthdayZoneTickIntervalStart;
    this.birthdayNextSpawn = Phaser.Math.FloatBetween(0.85, 1.45);
    this.guaranteeConfetti = false;
    this.birthdayInstaPending =
      this.birthdayParty && Math.random() < 0.15;
    this.prevRightDown = false;
    this.clearBirthdayBalloons();
    this.birthdayBalloonLayer.setVisible(this.birthdayParty);
    this.whiteBar.setFillStyle(0xffffff, 0.95);
    this.whiteBar.setStrokeStyle(1, 0xcccccc);
    this.whiteBar.setVisible(true);
    this.whiteBarSkin?.destroy();
    this.whiteBarSkin = undefined;
    this.poisonVines?.destroy();
    this.poisonVines = undefined;
    this.poisonVinePhase = 0;
    this.clearLaserSpaceUi();
    this.clearFrostChromeUi();
    this.applyRodSkinVisuals();
    this.facesLeft2 = !!options?.second?.facesLeft;
    this.glowColor2 = options?.second?.glowColor ?? null;

    const control = options?.control ?? 0;
    this.birthdayControlShare = control / 100;
    const resilience = options?.resilience ?? 0;
    const progressSpeed = options?.progressSpeed ?? 0;
    this.baseProgressSpeed = progressSpeed;
    this.forgeSwordSpeedAdd = 0;
    // Allow <1 chaos so mythical fish can sprint across the bar before turning
    this.jerkyChaos = Math.max(0.35, options?.chaos ?? 1);

    // Control = extra % of the grey bar (0 → 20% wide, +20 → 40% wide)
    this.applyWhiteBarWidth();

    // Progress speed boosts fill rate (forge swords add percentage points later)
    this.applyProgressSpeedFillRate();
    this.drainRate = this.baseDrainRate * (options?.drainMult ?? 1);
    this.progressBg.setFillStyle(this.bubbleActive ? 0x163f62 : 0x333333);
    this.progressBg.setStrokeStyle(1, this.bubbleActive ? 0x7ddfff : 0x222222);
    this.progressFill.setFillStyle(this.bubbleActive ? 0x59bfff : 0x4caf50);
    this.applyRodSkinThemeColors();
    this.bubbleMarker
      .setVisible(this.bubbleActive)
      .setAlpha(1)
      .setScale(1);
    this.fishBubble
      .setVisible(this.bubbleActive)
      .setAlpha(1)
      .setScale(1);
    this.fishBubbleShine
      .setVisible(this.bubbleActive)
      .setAlpha(1)
      .setScale(1);

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
    this.baseFishAccel = this.fishAccel;
    this.baseFishMaxSpeed = this.fishMaxSpeed;
    const tex = options?.textureKey ?? "fish";
    const dw = options?.displayWidth ?? 42;
    const dh = options?.displayHeight ?? 14;
    this.fishBubbleW = dw;
    this.fishBubbleH = dh;
    this.fishIcon.setTexture(tex);
    this.fishIcon.setDisplaySize(dw, dh);
    this.fishIcon.setAngle(this.fishRotateDeg);
    this.fishIcon.clearTint();
    if (options?.tint != null) {
      if (options.tintFill) {
        this.fishIcon.setTintFill(options.tint);
      } else {
        this.fishIcon.setTint(options.tint);
      }
    }
    this.fishGlow.setTexture(tex);
    this.fishGlow.setDisplaySize(dw * 1.4, dh * 1.55);
    this.fishGlow.setAngle(this.fishRotateDeg);
    if (this.glowColor != null) {
      this.fishGlow.setTint(this.glowColor);
      this.fishGlow.setAlpha(0.5);
    } else {
      this.fishGlow.clearTint();
      this.fishGlow.setAlpha(0);
    }

    if (this.dualCatch && options?.second) {
      const s = options.second;
      const tex2 = s.textureKey ?? "fish";
      const dw2 = s.displayWidth ?? 42;
      const dh2 = s.displayHeight ?? 14;
      this.fishIcon2.setVisible(true).setTexture(tex2).setDisplaySize(dw2, dh2);
      this.fishIcon2.clearTint();
      if (s.tint != null) {
        if (s.tintFill) this.fishIcon2.setTintFill(s.tint);
        else this.fishIcon2.setTint(s.tint);
      }
      this.fishGlow2.setVisible(true).setTexture(tex2).setDisplaySize(dw2 * 1.4, dh2 * 1.55);
      if (this.glowColor2 != null) {
        this.fishGlow2.setTint(this.glowColor2);
        this.fishGlow2.setAlpha(0.5);
      } else {
        this.fishGlow2.clearTint();
        this.fishGlow2.setAlpha(0);
      }
    } else {
      this.fishIcon2.setVisible(false);
      this.fishGlow2.setVisible(false).setAlpha(0);
    }
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

  /** Bigger catch bar for phone screens. */
  setMobileLayout(on: boolean): void {
    this.root.setScale(on ? 1.35 : 1);
    this.root.setY(on ? this.root.scene.scale.height - 200 : this.baseY);
  }

  update(
    delta: number,
    pointerDown: boolean,
    pointerRightDown = false,
    pointerX = 0,
    pointerY = 0
  ): void {
    if (!this.active) return;

    const dt = Math.min(delta / 1000, 0.05);

    // Silent pause — UI shown, nothing moves yet
    if (!this.ready) {
      this.readyTimer -= dt;
      if (this.readyTimer <= 0) {
        this.ready = true;
        this.whiteVel = 0;
        if (this.birthdayInstaPending) {
          this.triggerBirthdayInstaCatch();
          return;
        }
      }
      if (this.rodSkinId === "poisoned") {
        this.poisonVinePhase += dt;
        this.redrawPoisonVines();
      }
      if (this.rodSkinId === "laser") {
        this.updateLaserSpaceUi(dt);
      }
      if (this.isFrostChromeSkin()) {
        this.updateFrostChromeUi(dt);
      }
      this.syncVisuals();
      return;
    }

    if (this.rodSkinId === "poisoned") {
      this.poisonVinePhase += dt;
      this.redrawPoisonVines();
    }
    if (this.rodSkinId === "laser") {
      this.updateLaserSpaceUi(dt);
    }
    if (this.isFrostChromeSkin()) {
      this.updateFrostChromeUi(dt);
    }

    this.updateWhiteBarPhysics(dt, pointerDown || this.holdKey.isDown);
    this.updateFish(dt);
    this.updateCrystalBurst(dt);
    this.updateZeusStrike(dt);
    this.updateRecoilKick(dt);
    this.updateForgeStrike(dt);
    this.updateStarweaverLock(dt);
    this.updateBirthdayParty(
      dt,
      pointerRightDown && !this.prevRightDown,
      pointerX,
      pointerY
    );
    this.prevRightDown = pointerRightDown;

    const halfWhite = this.whiteWidth / 2;
    const overlapping =
      this.fishX >= this.whiteX - halfWhite &&
      this.fishX <= this.whiteX + halfWhite;

    if (this.electrified && overlapping) {
      this.guaranteeThunder = true;
      this.applyElectrifiedSlow(true);
    } else {
      this.applyElectrifiedSlow(false);
    }

    if (overlapping) {
      const rate = this.tranquilRush ? this.tranquilRushFillRate : this.fillRate;
      this.progress = Math.min(1, this.progress + rate * dt);
      if (this.birthdayParty) {
        this.birthdayBarTickTimer += dt;
        if (this.birthdayBarTickTimer >= this.birthdayZoneTickInterval) {
          this.birthdayBarTickTimer -= this.birthdayZoneTickInterval;
          this.birthdayZoneSpeedAdd += 1;
          this.birthdayZoneTickInterval = Math.max(
            this.birthdayZoneTickIntervalMin,
            this.birthdayZoneTickInterval - this.birthdayZoneTickIntervalStep
          );
          this.applyProgressSpeedFillRate();
        }
      }
    } else {
      this.progress = Math.max(0, this.progress - this.drainRate * dt);
      if (this.birthdayParty) {
        this.birthdayBarTickTimer = 0;
        this.birthdayZoneTickInterval = this.birthdayZoneTickIntervalStart;
        if (this.birthdayZoneSpeedAdd > 0) {
          this.birthdayZoneSpeedAdd = 0;
          this.applyProgressSpeedFillRate();
        }
      }
    }

    if (this.bubbleActive && this.progress >= this.bubbleBurstProgress) {
      this.triggerTranquilBubblePop();
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

  private updateCrystalBurst(dt: number): void {
    if (!this.crystalBurst || !this.ready) return;
    this.crystalBurstTimer += dt;
    if (this.crystalBurstTimer < 0.5) return;
    this.crystalBurstTimer = 0;
    if (Math.random() >= 0.15) return;

    this.fishPauseTimer = Math.max(
      this.fishPauseTimer,
      this.crystalBurstStunPause
    );
    this.fishTargetVel = 0;
    this.fishVel = 0;
    this.fishDecisionTimer = Math.max(
      this.fishDecisionTimer,
      this.crystalBurstStunDecision
    );
    this.progress = Math.min(1, this.progress + this.crystalBurstProgressGain);
    this.playCrystalBurstFx();
  }

  private updateRecoilKick(dt: number): void {
    if (!this.recoilKick || !this.ready) return;

    if (this.recoilBurstActive) {
      this.recoilBurstElapsed += dt;
      this.recoilBurstShotTimer += dt;
      while (
        this.recoilBurstShotTimer >= this.recoilBurstInterval &&
        this.recoilBurstElapsed < this.recoilBurstDuration
      ) {
        this.recoilBurstShotTimer -= this.recoilBurstInterval;
        this.fireRecoilShot(this.recoilBurstProgressGain);
      }
      if (this.recoilBurstElapsed >= this.recoilBurstDuration) {
        this.recoilBurstActive = false;
        this.recoilBurstElapsed = 0;
        this.recoilBurstShotTimer = 0;
        if (!this.recoilKickActive) this.recoilPhase = "idle";
        else this.recoilPhase = "kick";
        this.recoilFishMoves = 0;
      }
      return;
    }

    if (this.recoilPhase === "warn") {
      this.recoilWarnTimer -= dt;
      if (this.recoilWarnTimer <= 0) {
        this.triggerRecoilKick();
      }
    }
  }

  private beginRecoilWarning(): void {
    if (this.recoilBurstActive) return;
    this.recoilPhase = "warn";
    this.recoilWarnTimer = 0.55;
    this.recoilWarnRoot.setVisible(true).setAlpha(1).setScale(1);
    this.recoilWarnIcon.setAlpha(1).setScale(1.2);
    playRecoilWarning(this.root.scene);
    this.root.scene.tweens.killTweensOf(this.recoilWarnRoot);
    this.root.scene.tweens.add({
      targets: this.recoilWarnIcon,
      scale: 1,
      duration: 140,
      ease: "Back.easeOut",
    });
    this.root.scene.tweens.add({
      targets: this.recoilWarnRoot,
      scale: { from: 0.85, to: 1.08 },
      duration: 220,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
    });
  }

  private triggerRecoilKick(): void {
    // Mastery: 3rd kick of the fight → rapid-fire burst.
    if (
      this.recoilBurstMastery &&
      !this.recoilBurstUsed &&
      this.recoilKickCount === 2
    ) {
      this.startRecoilBurst();
      return;
    }
    this.fireRecoilShot();
    this.recoilPhase = "kick";
    this.recoilFishMoves = 0;
  }

  private startRecoilBurst(): void {
    this.recoilBurstUsed = true;
    this.recoilBurstActive = true;
    this.recoilBurstElapsed = 0;
    this.recoilBurstShotTimer = 0;
    this.recoilPhase = "burst";
    this.recoilWarnRoot.setVisible(false);
    this.root.scene.tweens.killTweensOf(this.recoilWarnRoot);
    // Immediate first blast, then every 0.2s for 2s (+10% each).
    this.fireRecoilShot(this.recoilBurstProgressGain);
  }

  /** One shotgun blast: sling bar + progress + SFX. */
  private fireRecoilShot(progressGain = this.recoilProgressGain): void {
    const scene = this.root.scene;
    this.recoilWarnRoot.setVisible(false);
    this.root.scene.tweens.killTweensOf(this.recoilWarnRoot);
    playRecoilShot(scene);

    const whiteMin = -this.barWidth / 2 + this.whiteWidth / 2;
    const whiteMax = this.barWidth / 2 - this.whiteWidth / 2;
    const onLeft = this.whiteX <= 0;
    const target = onLeft ? whiteMax : whiteMin;
    this.recoilKickTarget = target;
    this.recoilKickActive = true;
    this.whiteVel = onLeft ? this.recoilKickSpeed : -this.recoilKickSpeed;

    this.progress = Math.min(1, this.progress + progressGain);
    this.recoilKickCount += 1;

    // Little kick punch — world + HUD cameras
    scene.cameras.main.shake(110, 0.0035);
    const game = scene.scene.get("GameScene") as Phaser.Scene | undefined;
    game?.cameras.main.shake(130, 0.0045);

    this.whiteBar.setFillStyle(0xff8866, 0.98);
    this.whiteBar.setStrokeStyle(2, 0xffcc44);
    const flashColor = this.rodSkinId === "pistol" ? 0xa8b0b8 : 0xffaa66;
    if (this.rodSkinId === "pistol") {
      this.whiteBar.setFillStyle(0x9aa0a8, 0.98);
      this.whiteBar.setStrokeStyle(2, 0xd0d4d8);
    }
    this.root.scene.tweens.killTweensOf(this.whiteBar);
    this.whiteBar.setScale(1, 1);
    this.root.scene.tweens.add({
      targets: this.whiteBar,
      scaleX: 1.28,
      scaleY: 0.82,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.whiteBar.setScale(1, 1);
        if (!this.electrified) {
          this.whiteBar.setFillStyle(0xffffff, 0.95);
          this.whiteBar.setStrokeStyle(1, 0xcccccc);
        }
      },
    });

    const cx = this.root.x + this.whiteX;
    const cy = this.root.y;
    const flash = scene.add
      .rectangle(cx, cy, this.whiteWidth + 40, this.barHeight + 30, flashColor, 0.75)
      .setDepth(255)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.6,
      duration: 280,
      onComplete: () => flash.destroy(),
    });
  }

  private clearRecoilTelegraph(): void {
    this.recoilWarnRoot.setVisible(false);
    this.root.scene.tweens.killTweensOf(this.recoilWarnRoot);
    this.recoilPhase = "idle";
    this.recoilWarnTimer = 0;
    this.recoilKickActive = false;
    this.recoilBurstActive = false;
    this.recoilBurstElapsed = 0;
    this.recoilBurstShotTimer = 0;
  }

  private updateForgeStrike(dt: number): void {
    if (!this.forgeStrike || !this.ready) return;
    if (this.forgePhase !== "arming") return;
    this.forgeArmingTimer -= dt;
    if (this.forgeArmingTimer <= 0) {
      this.launchForgeWeapons();
    }
  }

  private beginForgeArming(): void {
    this.forgePhase = "arming";
    this.forgeArmingTimer = 1;
    this.forgeFishMoves = 0;
    this.spawnForgeWeapons();
    playForgeArmSfx(this.root.scene);
  }

  /**
   * Sacrifice 5–15% catch progress, fire 5 bullets, then stun once they all hit.
   * 5% → 1s stun, 15% → 3s stun (linear).
   */
  private triggerStarweaverWeave(): void {
    this.starweaverFishMoves = 0;
    this.starweaverBusy = true;
    this.starweaverCooldownMoves = 3;
    const sacrifice = Phaser.Math.FloatBetween(0.05, 0.15);
    const taken = Math.min(this.progress, sacrifice);
    this.progress = Math.max(0, this.progress - taken);
    const stunSec = taken * 20; // 0.05→1s, 0.15→3s

    const fishScreen = () => ({
      x: this.root.x + this.fishIcon.x,
      y: this.root.y + this.fishIcon.y,
    });

    const fromX =
      this.root.x -
      this.barWidth / 2 +
      this.barWidth * Math.max(0.05, this.progress + taken * 0.5);
    const fromY = this.root.y + 34;
    playStarweaverWeaveFx(this.root.scene, fromX, fromY, fishScreen, {
      depth: 220,
      theme: this.rodSkinId === "hyperboreal" ? "ice" : "default",
      onAllHit: () => this.applyStarweaverStun(stunSec),
    });
  }

  /** Apply stun + lock-on after the full volley connects. */
  private applyStarweaverStun(stunSec: number): void {
    if (!this.active || !this.starweaverBusy) return;
    // Pause timer alone freezes movement — do NOT hold fishDecisionTimer for
    // the full stun (it doesn't tick while busy, so the fish would stay still
    // after the lock UI ends).
    this.fishPauseTimer = stunSec;
    this.fishTargetVel = 0;
    this.fishVel = 0;
    this.fishDecisionTimer = 0.05;

    this.clearStarweaverLock();
    this.starweaverStunLeft = stunSec;
    this.starweaverBusy = true;
    const lockAt = {
      x: this.root.x + this.fishIcon.x,
      y: this.root.y + this.fishIcon.y,
    };
    this.starweaverLock = createStarweaverLockOn(
      this.root.scene,
      lockAt.x,
      lockAt.y,
      {
        depth: 225,
        theme: this.rodSkinId === "hyperboreal" ? "ice" : "default",
      }
    );
  }

  private clearStarweaverLock(): void {
    this.starweaverLock?.destroy();
    this.starweaverLock = null;
    this.starweaverStunLeft = 0;
  }

  /** End stun + lock together so the fish resumes immediately. */
  private endStarweaverStun(): void {
    this.clearStarweaverLock();
    this.starweaverBusy = false;
    // Clear any leftover pause so the fish isn't frozen after the lock fades
    this.fishPauseTimer = 0;
    this.fishDecisionTimer = Math.min(this.fishDecisionTimer, 0.08);
  }

  private resetStarweaverState(): void {
    this.clearStarweaverLock();
    this.starweaverBusy = false;
    this.starweaverFishMoves = 0;
    this.starweaverCooldownMoves = 0;
  }

  private updateStarweaverLock(dt: number): void {
    if (!this.starweaverLock) {
      // Still weaving (bullets in flight) — keep busy until stun starts
      return;
    }
    if (this.starweaverStunLeft <= 0) {
      this.endStarweaverStun();
      return;
    }
    this.starweaverStunLeft -= dt;
    // Keep pause timer matched to the lock so they end together
    this.fishPauseTimer = Math.max(0, this.starweaverStunLeft);
    this.fishTargetVel = 0;
    this.fishVel = 0;
    this.starweaverLock.update(
      this.root.x + this.fishIcon.x,
      this.root.y + this.fishIcon.y,
      dt
    );
    if (this.starweaverStunLeft <= 0) {
      this.endStarweaverStun();
    }
  }

  private spawnForgeWeapons(): void {
    this.clearForgeWeapons();
    const scene = this.root.scene;
    const total = Phaser.Math.Between(8, 12);
    const swords = Phaser.Math.Between(0, total);
    const axes = total - swords;
    const kinds: ("sword" | "axe")[] = [
      ...Array.from({ length: swords }, () => "sword" as const),
      ...Array.from({ length: axes }, () => "axe" as const),
    ];
    Phaser.Utils.Array.Shuffle(kinds);

    const target = this.forgeProgressCenter();
    const count = kinds.length;
    const radius = Math.max(58, this.barWidth * 0.48);
    const angleStart = -Math.PI * 0.88;
    const angleEnd = -Math.PI * 0.12;
    let emberSwordChosen = false;

    for (let i = 0; i < count; i++) {
      const kind = kinds[i]!;
      const iceForge = this.rodSkinId === "hyperthermic";
      const tex = iceForge
        ? kind === "sword"
          ? "forge_icicle"
          : "forge_ice_spike"
        : kind === "sword"
          ? "forge_sword"
          : "forge_axe";
      const t = count === 1 ? 0.5 : i / (count - 1);
      const arcAng = Phaser.Math.Linear(angleStart, angleEnd, t);
      const wx = target.x + Math.cos(arcAng) * radius;
      const wy = target.y + Math.sin(arcAng) * radius;
      const aimDeg = Phaser.Math.RadToDeg(
        Math.atan2(target.y - wy, target.x - wx)
      );

      const img = scene.add
        .image(wx, wy, tex)
        .setDisplaySize(
          iceForge
            ? kind === "sword"
              ? 28
              : 32
            : kind === "sword"
              ? 22
              : 26,
          iceForge
            ? kind === "sword"
              ? 42
              : 40
            : kind === "sword"
              ? 32
              : 34
        )
        .setDepth(155)
        .setScrollFactor(0)
        .setAngle(aimDeg + 90)
        .setData("kind", kind);
      if (
        kind === "sword" &&
        !emberSwordChosen &&
        Math.random() < this.forgeEmberSwordChance
      ) {
        if (iceForge) {
          img.setTint(0xa8e8ff);
        } else {
          img.setTint(0xff8833);
        }
        img.setData("ember", true);
        emberSwordChosen = true;
        this.forgeHadEmberWeapon = true;
      }
      scene.tweens.add({
        targets: img,
        y: wy - 3,
        duration: 260,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 35,
      });
      this.forgeWeaponSprites.push(img);
    }
  }

  private launchForgeWeapons(): void {
    if (this.forgeWeaponSprites.length === 0) {
      this.finishForgeVolley();
      return;
    }
    this.forgePhase = "launching";
    this.forgeWeaponsPending = this.forgeWeaponSprites.length;
    const scene = this.root.scene;
    const sprites = [...this.forgeWeaponSprites];
    this.forgeWeaponSprites = [];

    const target = this.forgeProgressCenter();

    sprites.forEach((sprite) => {
      const kind = (sprite.getData("kind") as "sword" | "axe") ?? "sword";
      scene.tweens.killTweensOf(sprite);
      scene.time.delayedCall(Phaser.Math.Between(0, 420), () => {
        if (!this.active) {
          sprite.destroy();
          return;
        }
        playForgeLaunchSfx(scene, kind);
        const hitX = target.x + Phaser.Math.Between(-10, 10);
        const hitY = target.y + Phaser.Math.Between(-4, 4);
        const flyDeg = Phaser.Math.RadToDeg(
          Math.atan2(hitY - sprite.y, hitX - sprite.x)
        );
        sprite.setAngle(flyDeg + 90);
        scene.tweens.add({
          targets: sprite,
          x: hitX,
          y: hitY,
          duration: Phaser.Math.Between(220, 380),
          ease: "Quad.easeIn",
          onComplete: () => {
            this.applyForgeWeaponHit(kind, hitX, hitY);
            sprite.destroy();
            this.forgeWeaponsPending -= 1;
            if (this.forgeWeaponsPending <= 0) {
              this.finishForgeVolley();
            }
          },
        });
      });
    });
  }

  /** Center of the progress bar — arch of weapons faces inward here. */
  private forgeProgressCenter(): { x: number; y: number } {
    return { x: this.root.x, y: this.root.y + 34 };
  }

  private applyForgeWeaponHit(
    kind: "sword" | "axe",
    x: number,
    y: number
  ): void {
    playForgeHitSfx(this.root.scene, kind);
    playForgeWeaponHitFx(this.root.scene, x, y, kind);
    if (kind === "sword") {
      this.forgeSwordSpeedAdd += this.forgeSwordSpeedBonus;
      this.applyProgressSpeedFillRate();
    } else {
      this.progress = Math.min(1, this.progress + this.forgeAxeProgressGain);
    }
    this.syncVisuals();
  }

  private totalProgressSpeed(): number {
    return (
      this.baseProgressSpeed +
      this.forgeSwordSpeedAdd +
      this.birthdayBalloonSpeedAdd +
      this.birthdayZoneSpeedAdd
    );
  }

  private applyProgressSpeedFillRate(): void {
    const total = this.totalProgressSpeed();
    this.fillRate = this.baseFillRate * (1 + total / 100);
    this.setProgressHint(total);
  }

  private finishForgeVolley(): void {
    this.forgePhase = "idle";
    this.forgeCooldownMoves = 9;
    this.forgeFishMoves = 0;
  }

  private clearForgeWeapons(): void {
    const scene = this.root.scene;
    for (const sprite of this.forgeWeaponSprites) {
      scene.tweens.killTweensOf(sprite);
      sprite.destroy();
    }
    this.forgeWeaponSprites = [];
    this.forgeWeaponsPending = 0;
  }

  private updateZeusStrike(dt: number): void {
    if (!this.zeusStrike || !this.ready) return;

    if (this.zeusPhase === "idle") {
      this.zeusRollTimer += dt;
      if (this.zeusRollTimer < 1) return;
      this.zeusRollTimer = 0;
      if (Math.random() >= this.zeusStrikeChance) return;
      this.beginZeusWarning();
      return;
    }

    if (this.zeusPhase === "warn") {
      this.zeusWarnTimer -= dt;
      if (this.zeusWarnTimer > 0) return;
      if (this.zeusWarnVisible) {
        // End of "on" blink → hide briefly
        this.zeusWarnVisible = false;
        this.zeusWarnIcon.setVisible(false);
        this.zeusZoneRect.setAlpha(0.12);
        this.zeusWarnTimer = 0.16;
        this.zeusWarnBeepsLeft -= 1;
        if (this.zeusWarnBeepsLeft <= 0) {
          this.triggerZeusLightning();
        }
      } else {
        // End of "off" → next beep
        this.zeusWarnVisible = true;
        this.zeusWarnIcon.setVisible(true).setAlpha(1).setScale(1.15);
        this.zeusZoneRect.setAlpha(0.4);
        playWarningBeep(this.root.scene, {
          pitch: 760 + (3 - this.zeusWarnBeepsLeft) * 90,
        });
        this.root.scene.tweens.add({
          targets: this.zeusWarnIcon,
          scale: 1,
          duration: 120,
          ease: "Back.easeOut",
        });
        this.zeusWarnTimer = 0.22;
      }
    }
  }

  private beginZeusWarning(): void {
    const half = this.barWidth / 2 - this.zeusZoneW / 2 - 8;
    this.zeusZoneX = Phaser.Math.FloatBetween(-half, half);
    this.zeusPhase = "warn";
    this.zeusWarnBeepsLeft = 3;
    this.zeusWarnVisible = true;
    this.zeusWarnTimer = 0.22;
    this.zeusZoneRect
      .setVisible(true)
      .setPosition(this.zeusZoneX, -8)
      .setAlpha(0.4);
    this.zeusWarnIcon
      .setVisible(true)
      .setPosition(this.zeusZoneX, -8)
      .setAlpha(1)
      .setScale(1.2);
    playWarningBeep(this.root.scene, { pitch: 760 });
    this.root.scene.tweens.add({
      targets: this.zeusWarnIcon,
      scale: 1,
      duration: 120,
      ease: "Back.easeOut",
    });
  }

  private triggerZeusLightning(): void {
    this.zeusPhase = "strike";
    this.zeusStrikeChance *= 0.5;
    this.zeusWarnIcon.setVisible(false);
    playLightningCrack(this.root.scene);
    this.playZeusLightningFx();

    const zL = this.zeusZoneX - this.zeusZoneW / 2;
    const zR = this.zeusZoneX + this.zeusZoneW / 2;
    const fishHit = this.fishX >= zL && this.fishX <= zR;
    const halfWhite = this.whiteWidth / 2;
    const barL = this.whiteX - halfWhite;
    const barR = this.whiteX + halfWhite;
    const barHit = barL < zR && barR > zL;

    if (fishHit) {
      this.clearZeusTelegraph();
      this.finish(true);
      return;
    }
    if (barHit) {
      this.setElectrified(true);
    }
    this.root.scene.time.delayedCall(280, () => {
      if (!this.active) return;
      this.clearZeusTelegraph();
      this.zeusPhase = "idle";
      this.zeusRollTimer = 0.35;
    });
  }

  private clearZeusTelegraph(): void {
    this.zeusZoneRect.setVisible(false);
    this.zeusWarnIcon.setVisible(false);
    this.zeusWarnVisible = false;
  }

  private setElectrified(on: boolean): void {
    this.electrified = on;
    this.laserElectrifyTween?.stop();
    this.laserElectrifyTween = undefined;
    if (on) {
      if (this.rodSkinId === "laser") {
        this.whiteBar.setFillStyle(0xffffff, 0.95);
        this.whiteBar.setStrokeStyle(2, 0xf9a8d4);
        for (const s of this.elecSparks) {
          s.setVisible(true);
          s.setFillStyle(0xf472b6, 0.9);
        }
        // Fade white → pink → purple
        const state = { t: 0 };
        this.laserElectrifyTween = this.root.scene.tweens.add({
          targets: state,
          t: 1,
          duration: 900,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            const t = state.t;
            const r = Math.round(255 + (168 - 255) * t);
            const g = Math.round(255 + (85 - 255) * Math.min(1, t * 1.2));
            const b = Math.round(255 + (247 - 255) * t);
            const color = (r << 16) | (g << 8) | b;
            this.whiteBar.setFillStyle(color, 0.95);
            this.whiteBar.setStrokeStyle(2, t > 0.5 ? 0xa855f7 : 0xec4899);
          },
        });
      } else {
        this.whiteBar.setFillStyle(0xc8f0ff, 0.95);
        this.whiteBar.setStrokeStyle(2, 0xffe066);
        for (const s of this.elecSparks) {
          s.setVisible(true);
          s.setFillStyle(0xa8e8ff, 0.85);
        }
      }
    } else {
      this.whiteBar.setFillStyle(0xffffff, 0.95);
      this.whiteBar.setStrokeStyle(1, 0xcccccc);
      for (const s of this.elecSparks) s.setVisible(false);
      this.applyElectrifiedSlow(false);
    }
  }

  private applyElectrifiedSlow(on: boolean): void {
    if (on) {
      this.fishMaxSpeed = this.baseFishMaxSpeed * 0.78;
      this.fishAccel = this.baseFishAccel * 0.85;
      this.fishVel *= 0.98;
      this.fishTargetVel *= 0.98;
    } else {
      this.fishMaxSpeed = this.baseFishMaxSpeed;
      this.fishAccel = this.baseFishAccel;
    }
  }

  private playZeusLightningFx(): void {
    if (this.rodSkinId === "laser") {
      this.playLaserBeamFx();
      return;
    }
    const scene = this.root.scene;
    const cx = this.root.x + this.zeusZoneX;
    const cy = this.root.y - 8;
    const bolt = scene.add.graphics().setDepth(220).setScrollFactor(0);
    bolt.lineStyle(4, 0xffffff, 1);
    let x = cx + Phaser.Math.Between(-6, 6);
    let y = cy - 70;
    bolt.beginPath();
    bolt.moveTo(x, y);
    for (let i = 0; i < 5; i++) {
      x += Phaser.Math.Between(-18, 18);
      y += 16 + (i % 2) * 6;
      bolt.lineTo(x, y);
    }
    bolt.lineTo(cx, cy + 18);
    bolt.strokePath();
    bolt.lineStyle(2, 0xffe066, 0.95);
    bolt.strokePath();

    const flash = scene.add
      .rectangle(cx, cy, this.zeusZoneW + 20, this.barHeight + 24, 0xffffff, 0.85)
      .setDepth(219)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    const glow = scene.add
      .circle(cx, cy, 16, 0xffe066, 0.9)
      .setDepth(221)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 220,
      onComplete: () => flash.destroy(),
    });
    scene.tweens.add({
      targets: glow,
      scale: 3.2,
      alpha: 0,
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
    scene.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: 280,
      onComplete: () => bolt.destroy(),
    });

    for (let i = 0; i < 10; i++) {
      const spark = scene.add
        .circle(cx, cy, 2.5, i % 2 === 0 ? 0xffffff : 0xffe066, 1)
        .setDepth(222)
        .setScrollFactor(0);
      const ang = (i / 10) * Math.PI * 2;
      scene.tweens.add({
        targets: spark,
        x: cx + Math.cos(ang) * Phaser.Math.Between(28, 56),
        y: cy + Math.sin(ang) * Phaser.Math.Between(16, 36),
        alpha: 0,
        duration: 320,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private playLaserBeamFx(): void {
    const scene = this.root.scene;
    const cx = this.root.x + this.zeusZoneX;
    const cy = this.root.y - 8;
    const beam = scene.add.graphics().setDepth(220).setScrollFactor(0);
    // Outer glow
    beam.fillStyle(0xec4899, 0.35);
    beam.fillRect(cx - 10, cy - 90, 20, 110);
    beam.fillStyle(0xa855f7, 0.55);
    beam.fillRect(cx - 5, cy - 90, 10, 110);
    beam.fillStyle(0xffffff, 0.95);
    beam.fillRect(cx - 2, cy - 90, 4, 110);
    // Impact bloom
    beam.fillStyle(0xf9a8d4, 0.7);
    beam.fillCircle(cx, cy + 6, 18);
    beam.fillStyle(0xffffff, 0.9);
    beam.fillCircle(cx, cy + 6, 8);

    const flash = scene.add
      .rectangle(cx, cy, this.zeusZoneW + 24, this.barHeight + 28, 0xf472b6, 0.8)
      .setDepth(219)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 280,
      onComplete: () => flash.destroy(),
    });
    scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 340,
      onComplete: () => beam.destroy(),
    });

    for (let i = 0; i < 12; i++) {
      const spark = scene.add
        .circle(cx, cy, 2.2, i % 2 === 0 ? 0xffffff : 0xd946ef, 1)
        .setDepth(222)
        .setScrollFactor(0);
      const ang = (i / 12) * Math.PI * 2;
      scene.tweens.add({
        targets: spark,
        x: cx + Math.cos(ang) * Phaser.Math.Between(24, 52),
        y: cy + Math.sin(ang) * Phaser.Math.Between(12, 30),
        alpha: 0,
        duration: 360,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private playCrystalBurstFx(): void {
    const scene = this.root.scene;
    const bx = this.root.x + this.whiteX;
    const by = this.root.y;
    const poisoned = this.rodSkinId === "poisoned";
    const ringCol = poisoned ? 0x39ff14 : 0xffffff;
    const sparkCol = poisoned ? 0x7cfc00 : 0xffffff;
    const ring = scene.add
      .circle(bx, by, 8, ringCol, 0.9)
      .setDepth(200)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    const flash = scene.add
      .circle(bx, by, 6, poisoned ? 0x98fb98 : 0xffffff, 1)
      .setDepth(201)
      .setScrollFactor(0);
    scene.tweens.add({
      targets: ring,
      scale: 4.5,
      alpha: 0,
      duration: 420,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    scene.tweens.add({
      targets: flash,
      scale: 2.2,
      alpha: 0,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => flash.destroy(),
    });
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      if (poisoned) {
        // Gloop blobs
        const blob = scene.add
          .circle(bx, by, 4, sparkCol, 0.95)
          .setDepth(202)
          .setScrollFactor(0);
        scene.tweens.add({
          targets: blob,
          x: bx + Math.cos(ang) * 40,
          y: by + Math.sin(ang) * 22 + 18,
          alpha: 0,
          scale: 1.6,
          duration: 480,
          ease: "Cubic.easeOut",
          onComplete: () => blob.destroy(),
        });
      } else {
        const spark = scene.add
          .circle(bx, by, 3, sparkCol, 0.95)
          .setDepth(202)
          .setScrollFactor(0);
        scene.tweens.add({
          targets: spark,
          x: bx + Math.cos(ang) * 48,
          y: by + Math.sin(ang) * 28,
          alpha: 0,
          scale: 0.2,
          duration: 380,
          ease: "Cubic.easeOut",
          onComplete: () => spark.destroy(),
        });
      }
    }
  }

  /**
   * Poisoned skin — vine clusters only in the top UI corners, hanging down.
   */
  private redrawPoisonVines(): void {
    const g = this.poisonVines;
    if (!g) return;
    g.clear();

    const hw = this.barWidth / 2 + 16;
    const corners: Array<{ x: number; dirX: number }> = [
      { x: -hw, dirX: 1 },
      { x: hw, dirX: -1 },
    ];

    for (let c = 0; c < corners.length; c++) {
      const corner = corners[c]!;
      // 4 vines per cluster, hanging downward from the top corner
      for (let v = 0; v < 4; v++) {
        const basePhase =
          this.poisonVinePhase * (1.1 + v * 0.18) + c * 0.9 + v * 0.55;
        const wave = Math.sin(basePhase) * 5.5;
        const wave2 = Math.cos(basePhase * 1.35) * 3.2;
        // Spread vines horizontally across each corner cluster
        const ox = corner.x + corner.dirX * (v * 14 + 6);
        const oy = -52 + v * 3;

        g.lineStyle(2.6 + (v % 2), v % 2 === 0 ? 0x2d5a2d : 0x1a4a22, 0.95);
        g.beginPath();
        g.moveTo(ox, oy);
        let x = ox;
        let y = oy;
        const segs = 6;
        for (let i = 1; i <= segs; i++) {
          const t = i / segs;
          const sway = wave * t + wave2 * t * t;
          // Grow downward; sway sideways — fan outward as they hang
          x = ox + corner.dirX * (8 + i * 5) + sway * corner.dirX * 0.85;
          y = oy + 8 + i * 12 + Math.abs(sway) * 0.25;
          x += Math.sin(basePhase + i * 0.8) * 6.5 * t * corner.dirX;
          g.lineTo(x, y);
        }
        g.strokePath();

        // Leaves near the hanging tip
        const leafSway = Math.sin(basePhase + 1.2) * 2;
        g.fillStyle(0x3d8b4f, 0.92);
        g.fillEllipse(x + 3 + leafSway, y + 2, 9, 4.5);
        g.fillStyle(0x228b22, 0.88);
        g.fillEllipse(x - 4 - leafSway * 0.5, y + 5, 7, 3.5);
        g.fillStyle(0x4caf50, 0.75);
        g.fillEllipse(x + 1, y + 8 + leafSway * 0.3, 5, 2.5);
      }
    }
  }

  private applyRodSkinVisuals(): void {
    const scene = this.root.scene;
    // Reset chrome to defaults; themed skins override below
    this.panel.setVisible(true);
    this.panel.setFillStyle(0x111118, 0.92).setStrokeStyle(2, 0xffffff);
    this.title
      .setText("Keep the fish in the white zone!")
      .setColor("#ffffff");

    if (this.rodSkinId === "pufferfirm" && scene.textures.exists("pufferfish")) {
      // Semi-transparent stretched puffer as the control zone — keep fish on top
      this.whiteBar.setVisible(false);
      this.whiteBarSkin = scene.add
        .image(this.whiteX, -8, "pufferfish")
        .setDisplaySize(this.whiteWidth, Math.max(18, this.barHeight - 18))
        .setOrigin(0.5)
        .setAlpha(0.72);
      // Insert behind fish icons so the hooked fish stays visible
      const fishIdx = this.root.getIndex(this.fishIcon);
      if (fishIdx >= 0) this.root.addAt(this.whiteBarSkin, fishIdx);
      else this.root.add(this.whiteBarSkin);
      this.root.bringToTop(this.fishGlow);
      this.root.bringToTop(this.fishIcon);
      this.root.bringToTop(this.fishGlow2);
      this.root.bringToTop(this.fishIcon2);
    }

    if (this.rodSkinId === "poisoned") {
      // Green-tinted UI + waving vine clusters in the corners only
      this.greyBar.setFillStyle(0x3a5a3a);
      this.greyBar.setStrokeStyle(2, 0x1a3a1a);
      this.poisonVines = scene.add.graphics();
      this.root.add(this.poisonVines);
      this.poisonVinePhase = 0;
      this.redrawPoisonVines();
    } else {
      this.greyBar.setFillStyle(0x6e6e6e);
      this.greyBar.setStrokeStyle(2, 0x333333);
    }

    if (this.rodSkinId === "laser") {
      this.setupLaserSpaceUi();
      this.zeusZoneRect.setFillStyle(0xec4899, 0.28);
      this.zeusZoneRect.setStrokeStyle(2, 0xa855f7, 0.9);
      this.zeusWarnIcon.setColor("#f9a8d4");
    } else {
      this.zeusZoneRect.setFillStyle(0xffe066, 0.28);
      this.zeusZoneRect.setStrokeStyle(2, 0xffcc33, 0.9);
      this.zeusWarnIcon.setColor("#ffe066");
    }

    if (this.isFrostChromeSkin()) {
      this.setupFrostChromeUi();
    }

    this.applyRodSkinThemeColors();
  }

  /** Progress / panel tints that must win over start() defaults. */
  private applyRodSkinThemeColors(): void {
    if (this.rodSkinId === "poisoned" && !this.bubbleActive) {
      this.progressBg.setFillStyle(0x1a3020);
      this.progressBg.setStrokeStyle(1, 0x1a3a1a);
      this.progressFill.setFillStyle(0x4caf50);
    }
    if (this.rodSkinId === "laser" && !this.bubbleActive) {
      // Space backdrop is drawn in laserSpaceGfx — keep panel mostly clear
      this.panel.setFillStyle(0x060614, 0.15).setStrokeStyle(2, 0xa855f7, 0.85);
      this.title
        .setText("Keep the fish in the laser zone!")
        .setColor("#f9a8d4");
      this.greyBar.setFillStyle(0x16122a);
      this.greyBar.setStrokeStyle(2, 0x6b21a8);
      this.progressBg.setFillStyle(0x0c0618);
      this.progressBg.setStrokeStyle(1, 0x7c3aed);
      this.progressFill.setFillStyle(0xec4899);
      this.hint.setColor("#c4b5fd");
    }
    if (this.rodSkinId === "frozen_lotus" && !this.bubbleActive) {
      this.panel.setVisible(false);
      this.title.setText("Keep the fish in the lotus!").setColor("#f0f8ff");
      this.greyBar.setFillStyle(0xd8e8f8);
      this.greyBar.setStrokeStyle(2, 0xa0c0d8);
      this.whiteBar.setFillStyle(0xffffff, 0.98);
      this.whiteBar.setStrokeStyle(1, 0xe8f0ff);
      this.progressBg.setFillStyle(0xc8dce8);
      this.progressBg.setStrokeStyle(1, 0x90b0c8);
      this.progressFill.setFillStyle(0x7ec8e8);
      this.hint.setColor("#90b0c8");
    }
    if (this.rodSkinId === "halo_of_ice" && !this.bubbleActive) {
      this.panel.setFillStyle(0xf0f8ff, 0.88).setStrokeStyle(2, 0x8ec8e8, 0.95);
      this.title.setText("Keep the fish in the frost ring!").setColor("#3a6a88");
      this.greyBar.setFillStyle(0xd0e8f8);
      this.greyBar.setStrokeStyle(2, 0x7ab0d0);
      this.whiteBar.setFillStyle(0xffffff, 0.98);
      this.whiteBar.setStrokeStyle(1, 0xb0d8f0);
      this.progressBg.setFillStyle(0xc0dcec);
      this.progressBg.setStrokeStyle(1, 0x80b0d0);
      this.progressFill.setFillStyle(0x6ab8e0);
      this.hint.setColor("#5a90b0");
    }
    if (this.rodSkinId === "hyperboreal" && !this.bubbleActive) {
      this.panel.setFillStyle(0x0c2030, 0.55).setStrokeStyle(2, 0xa8e0ff, 0.9);
      this.title.setText("Keep the fish in the polar zone!").setColor("#d8f0ff");
      this.greyBar.setFillStyle(0x2a4a62);
      this.greyBar.setStrokeStyle(2, 0x8ec8e8);
      this.whiteBar.setFillStyle(0xe8f8ff, 0.95);
      this.whiteBar.setStrokeStyle(1, 0xffffff);
      this.progressBg.setFillStyle(0x163040);
      this.progressBg.setStrokeStyle(1, 0x7ec8e8);
      this.progressFill.setFillStyle(0x9ad8f0);
      this.hint.setColor("#a8d0e8");
    }
    if (this.rodSkinId === "hyperthermic" && !this.bubbleActive) {
      this.panel.setFillStyle(0x081828, 0.4).setStrokeStyle(2, 0xc8f0ff, 0.95);
      this.title
        .setText("Keep the fish in the flash-freeze!")
        .setColor("#e8f8ff");
      this.greyBar.setFillStyle(0x1a3850);
      this.greyBar.setStrokeStyle(2, 0xa8e0ff);
      this.whiteBar.setFillStyle(0xf0fbff, 0.98);
      this.whiteBar.setStrokeStyle(1, 0xffffff);
      this.progressBg.setFillStyle(0x102838);
      this.progressBg.setStrokeStyle(1, 0x90d0f0);
      this.progressFill.setFillStyle(0xb8ecff);
      this.hint.setColor("#c0e4f8");
    }
  }

  private isFrostChromeSkin(): boolean {
    return (
      this.rodSkinId === "frozen_lotus" ||
      this.rodSkinId === "halo_of_ice" ||
      this.rodSkinId === "hyperboreal" ||
      this.rodSkinId === "hyperthermic"
    );
  }

  private clearFrostChromeUi(): void {
    this.frostChromeGfx?.destroy();
    this.frostChromeGfx = undefined;
    this.frostFxGfx?.destroy();
    this.frostFxGfx = undefined;
    this.frostChromePhase = 0;
  }

  private setupFrostChromeUi(): void {
    const scene = this.root.scene;
    this.clearFrostChromeUi();
    this.frostChromeGfx = scene.add.graphics();
    this.frostFxGfx = scene.add
      .graphics()
      .setBlendMode(Phaser.BlendModes.ADD);
    this.root.addAt(this.frostChromeGfx, 0);
    const titleIdx = this.root.getIndex(this.title);
    if (titleIdx >= 0) this.root.addAt(this.frostFxGfx, titleIdx + 1);
    else this.root.add(this.frostFxGfx);
    this.frostChromePhase = 0;
    this.redrawFrostChrome();
  }

  private updateFrostChromeUi(dt: number): void {
    this.frostChromePhase += dt;
    this.redrawFrostChrome();
  }

  private redrawFrostChrome(): void {
    const g = this.frostChromeGfx;
    const fx = this.frostFxGfx;
    if (!g || !fx) return;
    g.clear();
    fx.clear();
    const t = this.frostChromePhase;
    const skin = this.rodSkinId;

    if (skin === "frozen_lotus") {
      this.drawFrozenLotusPanel(g, fx, t);
      return;
    }
    if (skin === "halo_of_ice") {
      this.drawHaloOfIceChrome(g, fx, t);
      return;
    }
    if (skin === "hyperboreal") {
      this.drawHyperborealChrome(g, fx, t);
      return;
    }
    if (skin === "hyperthermic") {
      this.drawHyperthermicChrome(g, fx, t);
    }
  }

  /** White lotus silhouette instead of a rectangular panel. */
  private drawFrozenLotusPanel(
    g: Phaser.GameObjects.Graphics,
    fx: Phaser.GameObjects.Graphics,
    t: number
  ): void {
    const petals = 8;
    const rx = 290;
    const ry = 78;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + Math.sin(t * 0.6) * 0.04;
      const px = Math.cos(a) * rx * 0.42;
      const py = Math.sin(a) * ry * 0.55;
      g.fillStyle(0xffffff, 0.92);
      g.fillEllipse(px, py, 150, 72);
      g.fillStyle(0xf0f8ff, 0.75);
      g.fillEllipse(px * 0.85, py * 0.85, 110, 52);
    }
    g.fillStyle(0xffffff, 0.96);
    g.fillEllipse(0, 0, 420, 118);
    g.fillStyle(0xe8f4ff, 0.55);
    g.fillEllipse(0, 4, 360, 88);
    g.lineStyle(2.5, 0xc8e0f0, 0.85);
    g.strokeEllipse(0, 0, 420, 118);

    // Soft petal tips / frost sparkles
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + t * 0.15;
      const px = Math.cos(a) * 235;
      const py = Math.sin(a) * 62;
      fx.fillStyle(0xffffff, 0.35 + Math.sin(t * 3 + i) * 0.2);
      fx.fillCircle(px, py, 3 + (i % 3));
    }
  }

  private drawHaloOfIceChrome(
    g: Phaser.GameObjects.Graphics,
    fx: Phaser.GameObjects.Graphics,
    t: number
  ): void {
    // Soft icy border glow behind the white/light-blue panel
    g.lineStyle(6, 0xb8e0f8, 0.35);
    g.strokeRoundedRect(-286, -70, 572, 140, 18);
    g.lineStyle(2, 0xffffff, 0.55);
    g.strokeRoundedRect(-282, -66, 564, 132, 16);

    // Swirling frost ring VFX near title / center top of chrome
    const cx = 0;
    const cy = -52;
    for (let ring = 0; ring < 3; ring++) {
      const r = 18 + ring * 9;
      fx.lineStyle(1.6 - ring * 0.3, 0xa8d8f0, 0.45 + Math.sin(t * 4 + ring) * 0.2);
      fx.beginPath();
      fx.arc(cx, cy, r, t * (1.2 + ring * 0.4), t * (1.2 + ring * 0.4) + Math.PI * 1.4, false);
      fx.strokePath();
    }
    fx.fillStyle(0xffffff, 0.55 + Math.sin(t * 5) * 0.25);
    fx.fillCircle(cx, cy, 4);
    for (let i = 0; i < 8; i++) {
      const a = t * 2 + (i / 8) * Math.PI * 2;
      fx.fillStyle(0xd0f0ff, 0.5);
      fx.fillCircle(cx + Math.cos(a) * 28, cy + Math.sin(a) * 10, 1.6);
    }
  }

  private drawHyperborealChrome(
    g: Phaser.GameObjects.Graphics,
    fx: Phaser.GameObjects.Graphics,
    t: number
  ): void {
    g.fillStyle(0x102838, 0.55);
    g.fillRoundedRect(-288, -72, 576, 144, 12);
    g.lineStyle(2.5, 0xa8e0ff, 0.9);
    g.strokeRoundedRect(-288, -72, 576, 144, 12);

    // Hanging icicles along top edge
    const top = -72;
    for (let i = 0; i < 18; i++) {
      const x = -270 + i * 31 + Math.sin(t * 1.2 + i) * 2;
      const len = 10 + ((i * 7) % 14) + Math.sin(t * 2 + i * 0.5) * 2;
      g.fillStyle(0xb8e4f8, 0.9);
      g.fillTriangle(x - 4, top, x + 4, top, x, top + len);
      g.fillStyle(0xffffff, 0.75);
      g.fillTriangle(x - 1.5, top + 1, x + 1.2, top + 1, x, top + len * 0.7);
    }

    // Drift sparkles
    for (let i = 0; i < 12; i++) {
      const x = ((i * 97 + t * 28) % 560) - 280;
      const y = -40 + Math.sin(t * 1.5 + i) * 28;
      fx.fillStyle(0xffffff, 0.35 + (i % 3) * 0.15);
      fx.fillCircle(x, y, 1.2 + (i % 2));
    }
  }

  private drawHyperthermicChrome(
    g: Phaser.GameObjects.Graphics,
    fx: Phaser.GameObjects.Graphics,
    t: number
  ): void {
    // Deep freeze glass panel with intense VFX
    g.fillStyle(0x061420, 0.5);
    g.fillRoundedRect(-292, -76, 584, 152, 14);
    g.lineStyle(3, 0xc8f0ff, 0.95);
    g.strokeRoundedRect(-292, -76, 584, 152, 14);
    g.lineStyle(1.5, 0xffffff, 0.55);
    g.strokeRoundedRect(-286, -70, 572, 140, 12);

    // Jagged ice crown along top
    const top = -76;
    for (let i = 0; i < 22; i++) {
      const x = -275 + i * 26;
      const h = 14 + ((i * 11) % 18) + Math.sin(t * 3 + i) * 3;
      fx.fillStyle(0xa8e0ff, 0.85);
      fx.fillTriangle(x - 5, top, x + 5, top, x, top + h);
      fx.fillStyle(0xffffff, 0.7);
      fx.fillTriangle(x - 2, top + 1, x + 1.5, top + 1, x, top + h * 0.65);
    }

    // Orbiting crystal shards
    for (let i = 0; i < 10; i++) {
      const a = t * 1.8 + (i / 10) * Math.PI * 2;
      const rx = 250 + Math.sin(t + i) * 8;
      const ry = 48;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry * 0.55;
      fx.fillStyle(i % 2 ? 0xffffff : 0x9ad8f0, 0.75);
      fx.fillTriangle(x, y - 6, x + 3, y + 4, x - 3, y + 4);
    }

    // Center frost bloom pulse
    const pulse = 0.5 + Math.sin(t * 4) * 0.5;
    fx.lineStyle(2, 0xd0f0ff, 0.35 + pulse * 0.35);
    fx.strokeCircle(0, -8, 40 + pulse * 12);
    fx.fillStyle(0xffffff, 0.12 + pulse * 0.08);
    fx.fillCircle(0, -8, 18 + pulse * 6);
  }

  private clearLaserSpaceUi(): void {
    this.laserSpaceGfx?.destroy();
    this.laserSpaceGfx = undefined;
    this.laserSparkGfx?.destroy();
    this.laserSparkGfx = undefined;
    this.laserStars = [];
    this.laserSparks = [];
    this.laserSpacePhase = 0;
    this.laserSparkSpawnTimer = 0;
  }

  private setupLaserSpaceUi(): void {
    const scene = this.root.scene;
    this.clearLaserSpaceUi();
    this.laserSpaceGfx = scene.add.graphics();
    this.laserSparkGfx = scene.add
      .graphics()
      .setBlendMode(Phaser.BlendModes.ADD);
    // Space behind panel; sparks above chrome but under the fish bar
    this.root.addAt(this.laserSpaceGfx, 0);
    const titleIdx = this.root.getIndex(this.title);
    if (titleIdx >= 0) this.root.addAt(this.laserSparkGfx, titleIdx + 1);
    else this.root.add(this.laserSparkGfx);

    this.laserStars = [];
    for (let i = 0; i < 48; i++) {
      const pos = this.randomLaserChromePoint();
      this.laserStars.push({
        x: pos.x,
        y: pos.y,
        size: Phaser.Math.FloatBetween(0.6, 2.1),
        phase: Math.random() * Math.PI * 2,
        bright: 0.35 + Math.random() * 0.65,
      });
    }
    this.laserSparkSpawnTimer = 0.05;
    this.redrawLaserSpace();
    this.redrawLaserSparks();
  }

  /** Points on the UI chrome — never inside the fish movement bar. */
  private randomLaserChromePoint(): { x: number; y: number } {
    const barHalfW = this.barWidth / 2 + 6;
    const barTop = -8 - this.barHeight / 2 - 4;
    const barBot = -8 + this.barHeight / 2 + 4;
    const band = Phaser.Math.Between(0, 3);
    if (band === 0) {
      return {
        x: Phaser.Math.FloatBetween(-268, 268),
        y: Phaser.Math.FloatBetween(-62, barTop),
      };
    }
    if (band === 1) {
      return {
        x: Phaser.Math.FloatBetween(-268, 268),
        y: Phaser.Math.FloatBetween(barBot, 60),
      };
    }
    if (band === 2) {
      return {
        x: Phaser.Math.FloatBetween(-272, -barHalfW),
        y: Phaser.Math.FloatBetween(-58, 58),
      };
    }
    return {
      x: Phaser.Math.FloatBetween(barHalfW, 272),
      y: Phaser.Math.FloatBetween(-58, 58),
    };
  }

  private isInLaserFishBar(x: number, y: number): boolean {
    const barHalfW = this.barWidth / 2 + 4;
    const barHalfH = this.barHeight / 2 + 4;
    return Math.abs(x) <= barHalfW && Math.abs(y - -8) <= barHalfH;
  }

  private spawnLaserSpark(): void {
    const pos = this.randomLaserChromePoint();
    const colors = [0xffffff, 0xf9a8d4, 0xd946ef, 0xc4b5fd, 0xa855f7];
    this.laserSparks.push({
      x: pos.x,
      y: pos.y,
      vx: Phaser.Math.FloatBetween(-28, 28),
      vy: Phaser.Math.FloatBetween(-22, 22),
      life: 0,
      maxLife: Phaser.Math.FloatBetween(0.22, 0.55),
      size: Phaser.Math.FloatBetween(1.2, 2.8),
      color: colors[Phaser.Math.Between(0, colors.length - 1)]!,
      forks: Phaser.Math.Between(2, 4),
    });
  }

  private updateLaserSpaceUi(dt: number): void {
    this.laserSpacePhase += dt;
    this.redrawLaserSpace();

    this.laserSparkSpawnTimer -= dt;
    while (this.laserSparkSpawnTimer <= 0) {
      this.spawnLaserSpark();
      if (Math.random() < 0.45) this.spawnLaserSpark();
      this.laserSparkSpawnTimer += Phaser.Math.FloatBetween(0.04, 0.12);
    }

    for (let i = this.laserSparks.length - 1; i >= 0; i--) {
      const s = this.laserSparks[i]!;
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life >= s.maxLife || this.isInLaserFishBar(s.x, s.y)) {
        this.laserSparks.splice(i, 1);
      }
    }
    this.redrawLaserSparks();
  }

  private redrawLaserSpace(): void {
    const g = this.laserSpaceGfx;
    if (!g) return;
    g.clear();
    const t = this.laserSpacePhase;

    // Deep space panel fill (panel rect is mostly transparent for laser)
    g.fillStyle(0x050512, 0.94);
    g.fillRoundedRect(-280, -66, 560, 132, 8);

    // Soft nebula wash
    g.fillStyle(0x4c1d95, 0.28 + Math.sin(t * 0.7) * 0.08);
    g.fillEllipse(-120, -10, 220, 90);
    g.fillStyle(0x9d174d, 0.2 + Math.cos(t * 0.55) * 0.06);
    g.fillEllipse(130, 8, 200, 80);
    g.fillStyle(0x312e81, 0.24);
    g.fillEllipse(20, -28, 160, 50);
    g.fillStyle(0x7e22ce, 0.14);
    g.fillEllipse(-40, 30, 280, 40);

    // Starfield (chrome only — not on the fish track)
    for (let i = 0; i < this.laserStars.length; i++) {
      const s = this.laserStars[i]!;
      const twinkle =
        0.45 +
        0.55 * (0.5 + 0.5 * Math.sin(t * (2.2 + (i % 5) * 0.35) + s.phase));
      const a = s.bright * twinkle;
      const col = i % 5 === 0 ? 0xf9a8d4 : i % 5 === 1 ? 0xc4b5fd : 0xffffff;
      g.fillStyle(col, a);
      g.fillCircle(s.x, s.y, s.size * (0.85 + twinkle * 0.25));
      if (s.size > 1.4) {
        g.fillStyle(col, a * 0.35);
        g.fillCircle(s.x, s.y, s.size * 2.2);
      }
    }

    // Thin cosmic rim
    g.lineStyle(1.5, 0xec4899, 0.35 + Math.sin(t * 1.4) * 0.15);
    g.strokeRoundedRect(-282, -68, 564, 136, 10);
    g.lineStyle(1, 0xa855f7, 0.55);
    g.strokeRoundedRect(-278, -64, 556, 128, 8);
  }

  private redrawLaserSparks(): void {
    const g = this.laserSparkGfx;
    if (!g) return;
    g.clear();
    for (const s of this.laserSparks) {
      const u = s.life / s.maxLife;
      const a = (1 - u) * (u < 0.15 ? u / 0.15 : 1);
      g.fillStyle(s.color, a);
      g.fillCircle(s.x, s.y, s.size * (1 - u * 0.35));
      g.fillStyle(0xffffff, a * 0.85);
      g.fillCircle(s.x, s.y, s.size * 0.35);
      g.lineStyle(1.1, s.color, a * 0.9);
      for (let f = 0; f < s.forks; f++) {
        const ang = (f / s.forks) * Math.PI * 2 + s.life * 9 + f;
        const len = 4 + s.size * 2.2 * (1 - u);
        const x2 = s.x + Math.cos(ang) * len;
        const y2 = s.y + Math.sin(ang) * len;
        if (this.isInLaserFishBar(x2, y2)) continue;
        g.beginPath();
        g.moveTo(s.x, s.y);
        g.lineTo(
          s.x + Math.cos(ang) * len * 0.55 + Math.cos(ang + 0.8) * 2,
          s.y + Math.sin(ang) * len * 0.55 + Math.sin(ang + 0.8) * 2
        );
        g.lineTo(x2, y2);
        g.strokePath();
      }
    }
  }

  private bubbleCoverRadius(w: number, h: number): number {
    return Math.max(w, h) * 0.68 + 10;
  }

  private layoutFishBubble(fx: number, fy: number): void {
    const r = this.bubbleCoverRadius(this.fishBubbleW, this.fishBubbleH);
    const pulse = 0.82 + Math.sin(Date.now() / 170) * 0.1;
    this.fishBubble
      .setVisible(true)
      .setPosition(fx, fy)
      .setRadius(r)
      .setScale(pulse);
    this.fishBubbleShine
      .setVisible(true)
      .setPosition(fx - r * 0.28, fy - r * 0.32)
      .setRadius(Math.max(3, r * 0.14));
  }

  private triggerTranquilBubblePop(): void {
    this.bubbleActive = false;
    this.tranquilRush = true;
    this.bubbleCatch = true;
    this.progressBg.setFillStyle(0x1a4a32);
    this.progressBg.setStrokeStyle(1, 0x6dff9a);
    this.progressFill.setFillStyle(0x7dffb0);
    this.playTranquilBubblePopFx();
    this.onTranquilBubblePop?.();
  }

  private playTranquilBubblePopFx(): void {
    const scene = this.root.scene;
    const fishR = this.bubbleCoverRadius(this.fishBubbleW, this.fishBubbleH);
    const fishX = this.root.x + this.fishIcon.x;
    const fishY = this.root.y + this.fishIcon.y;
    const markerX =
      this.root.x + (-this.barWidth / 2 + this.barWidth * this.bubbleBurstProgress);
    const markerY = this.root.y + 34;

    if (this.bubbleMarker.visible) {
      scene.tweens.add({
        targets: this.bubbleMarker,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 130,
        ease: "Back.easeOut",
      });
    }

    playTranquilBubblePopFx(scene, markerX, markerY, 10, {
      depth: 210,
      scrollFactor: 0,
      intensity: 0.52,
    });

    playTranquilBubblePopFx(scene, fishX, fishY, fishR, {
      depth: 205,
      scrollFactor: 0,
      intensity: 1,
    });

    const rushFlash = scene.add
      .rectangle(
        this.root.x - this.barWidth / 2,
        markerY,
        this.barWidth * (1 - this.bubbleBurstProgress),
        10,
        0x7dffb0,
        0.85
      )
      .setOrigin(0, 0.5)
      .setDepth(204)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: rushFlash,
      alpha: 0,
      scaleX: 1.04,
      duration: 420,
      ease: "Sine.easeOut",
      onComplete: () => rushFlash.destroy(),
    });

    this.fishBubble.setVisible(false);
    this.fishBubbleShine.setVisible(false);
    this.bubbleMarker.setVisible(false);
  }

  private updateWhiteBarPhysics(dt: number, holding: boolean): void {
    if (this.recoilKickActive) {
      const dir = Math.sign(this.recoilKickTarget - this.whiteX);
      const dist = Math.abs(this.recoilKickTarget - this.whiteX);
      const step = this.recoilKickSpeed * dt;
      if (dist <= step) {
        this.whiteX = this.recoilKickTarget;
        this.whiteVel = dir * 160;
        this.recoilKickActive = false;
        if (!this.recoilBurstActive) this.recoilPhase = "idle";
      } else {
        this.whiteX += dir * step;
        this.whiteVel = dir * this.recoilKickSpeed;
      }
      return;
    }

    // Hold accelerates right; release pulls left (like gravity / spring bias)
    const force = holding ? this.accel : -this.accel;
    this.whiteVel += force * dt;

    // Light drag for smoother feel
    this.whiteVel *= Math.max(0, 1 - this.drag * dt);
    this.whiteVel = Phaser.Math.Clamp(this.whiteVel, -this.maxSpeed, this.maxSpeed);

    this.whiteX += this.whiteVel * dt;

    const whiteMin = -this.barWidth / 2 + this.whiteWidth / 2;
    const whiteMax = this.barWidth / 2 - this.whiteWidth / 2;
    const leavePad = 2;

    // End a spent bounce chain only after leaving the wall (keeps mid-chain hits armed)
    if (this.whiteX > whiteMin + leavePad && this.leftBounceRemaining <= 0) {
      this.leftBounceChain = false;
    }
    if (this.whiteX < whiteMax - leavePad && this.rightBounceRemaining <= 0) {
      this.rightBounceChain = false;
    }

    if (this.whiteX < whiteMin) {
      this.whiteX = whiteMin;
      this.handleWallHit("left");
    } else if (this.whiteX > whiteMax) {
      this.whiteX = whiteMax;
      this.handleWallHit("right");
    }
  }

  /** Impact speed → how many bounces this wall chain gets (0–3). */
  private bounceBudgetFromImpact(impact: number): number {
    const t = Phaser.Math.Clamp(impact / this.maxSpeed, 0, 1);
    if (t < 0.12) return 0;
    if (t < 0.35) return 1;
    if (t < 0.65) return 2;
    return 3;
  }

  /** Hit left/right grey-bar edge. Left wall rebounds right (+vel). */
  private handleWallHit(side: "left" | "right"): void {
    const impact = Math.abs(this.whiteVel);
    const outward = side === "left" ? 1 : -1;
    const inChain =
      side === "left" ? this.leftBounceChain : this.rightBounceChain;

    if (!inChain) {
      const budget = this.bounceBudgetFromImpact(impact);
      if (side === "left") {
        this.leftBounceRemaining = budget;
        this.leftBounceChain = true;
      } else {
        this.rightBounceRemaining = budget;
        this.rightBounceChain = true;
      }
    }

    const remaining =
      side === "left" ? this.leftBounceRemaining : this.rightBounceRemaining;

    if (remaining > 0) {
      if (side === "left") this.leftBounceRemaining -= 1;
      else this.rightBounceRemaining -= 1;
      this.playWallBounce(outward, impact);
      return;
    }

    // Out of bounces — deaden into the wall (still free to accelerate away)
    if (side === "left") {
      this.whiteVel = Math.max(0, this.whiteVel);
    } else {
      this.whiteVel = Math.min(0, this.whiteVel);
    }
  }

  /** Bounce off a wall. `dir` is the outward normal (+1 left wall, -1 right wall). */
  private playWallBounce(dir: number, impact: number): void {
    const rebound = Math.max(impact * this.bounceRestitution, 40);
    this.whiteVel = dir * rebound;

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
    // Don't pick new swim moves while paused / Starweaver weaving or stunned
    if (this.fishPauseTimer <= 0 && !this.starweaverBusy) {
      this.fishDecisionTimer -= dt;
      if (this.fishDecisionTimer <= 0) {
        this.pickFishBehavior();
      }
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
    if (
      this.recoilKick &&
      this.recoilPhase === "idle" &&
      !this.recoilBurstActive &&
      this.ready
    ) {
      this.recoilFishMoves += 1;
      if (this.recoilFishMoves >= 4) {
        this.beginRecoilWarning();
      }
    }

    if (this.forgeStrike && this.ready && this.forgePhase === "idle") {
      if (this.forgeCooldownMoves > 0) {
        this.forgeCooldownMoves -= 1;
      } else {
        this.forgeFishMoves += 1;
        if (this.forgeFishMoves >= 3) {
          this.beginForgeArming();
        }
      }
    }

    if (this.starweaverWeave && this.ready && !this.starweaverBusy) {
      if (this.starweaverCooldownMoves > 0) {
        this.starweaverCooldownMoves -= 1;
      } else {
        this.starweaverFishMoves += 1;
        if (this.starweaverFishMoves >= 3) {
          this.triggerStarweaverWeave();
        }
      }
    }

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
        this.fishPauseTimer = this.rollPauseDuration(0.12, 0.35);
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
      this.fishPauseTimer = this.rollPauseDuration(0.35, 1.1) / m;
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

  private rollPauseDuration(fallbackMin: number, fallbackMax: number): number {
    if (this.pauseDuration) {
      return Phaser.Math.FloatBetween(
        this.pauseDuration.min,
        this.pauseDuration.max
      );
    }
    return Phaser.Math.FloatBetween(fallbackMin, fallbackMax);
  }

  private syncVisuals(): void {
    this.whiteBar.setX(this.whiteX);
    this.whiteBarSkin?.setX(this.whiteX);
    if (this.zeusPhase !== "idle") {
      this.zeusZoneRect.setX(this.zeusZoneX);
      this.zeusWarnIcon.setX(this.zeusZoneX);
    }
    if (this.electrified) {
      const t = Date.now() / 70;
      for (let i = 0; i < this.elecSparks.length; i++) {
        const s = this.elecSparks[i]!;
        const side = i % 2 === 0 ? -1 : 1;
        const along = ((i / this.elecSparks.length) * 2 - 1) * (this.whiteWidth * 0.42);
        s.setPosition(
          this.whiteX + along + Math.sin(t + i) * 2,
          -8 + side * (this.barHeight * 0.28) + Math.cos(t * 1.4 + i) * 3
        );
        s.setAlpha(0.45 + Math.sin(t * 2 + i) * 0.4);
        s.setAngle(Math.sin(t + i * 0.7) * 25);
      }
    }
    const offset = this.dualCatch ? -14 : 0;
    this.fishIcon.setX(this.fishX + offset);
    this.fishGlow.setX(this.fishX + offset);
    if (this.dualCatch) {
      this.fishIcon2.setX(this.fishX + 14);
      this.fishGlow2.setX(this.fishX + 14);
    }
    if (Math.abs(this.fishVel) > 8) {
      if (this.fishRotateDeg !== 0) {
        // Sideways species (magma jelly): tip points the way it's swimming
        const ang =
          this.fishVel >= 0 ? this.fishRotateDeg : -this.fishRotateDeg;
        this.fishIcon.setFlipX(false);
        this.fishGlow.setFlipX(false);
        this.fishIcon.setAngle(ang);
        this.fishGlow.setAngle(ang);
      } else {
        const flip = this.facesLeft ? this.fishVel > 0 : this.fishVel < 0;
        this.fishIcon.setFlipX(flip);
        this.fishGlow.setFlipX(flip);
      }
      if (this.dualCatch) {
        const flip2 = this.facesLeft2 ? this.fishVel > 0 : this.fishVel < 0;
        this.fishIcon2.setFlipX(flip2);
        this.fishGlow2.setFlipX(flip2);
      }
    }
    if (this.glowColor != null) {
      const pulse = 0.38 + Math.sin(Date.now() / 220) * 0.18;
      this.fishGlow.setAlpha(pulse);
    }
    if (this.dualCatch && this.glowColor2 != null) {
      const pulse = 0.38 + Math.sin(Date.now() / 220) * 0.18;
      this.fishGlow2.setAlpha(pulse);
    }
    this.progressFill.width = this.barWidth * this.progress;
    if (this.bubbleActive) {
      this.layoutFishBubble(this.fishIcon.x + offset, this.fishIcon.y);
      this.bubbleMarker
        .setVisible(true)
        .setX(-this.barWidth / 2 + this.barWidth * this.bubbleBurstProgress);
    } else {
      this.fishBubble.setVisible(false);
      this.fishBubbleShine.setVisible(false);
      this.bubbleMarker.setVisible(false);
    }
    if (this.tranquilRush) {
      const rushPulse = 0.92 + Math.sin(Date.now() / 90) * 0.08;
      this.progressFill.setScale(1, rushPulse);
    } else {
      this.progressFill.setScale(1, 1);
    }
  }

  private setProgressHint(progressSpeed: number): void {
    const rounded = Math.round(progressSpeed);
    if (rounded > 0) {
      this.hint.setText(`Progress  +${rounded}%`).setColor("#7dce7a").setVisible(true);
    } else if (rounded < 0) {
      this.hint.setText(`Progress  ${rounded}%`).setColor("#ff8866").setVisible(true);
    } else {
      this.hint.setText("").setVisible(false);
    }
  }

  private applyWhiteBarWidth(animateMs = 0): void {
    const whiteShare = Math.min(
      0.85,
      (this.baseWhiteShare + this.birthdayControlShare) * this.birthdayBarSizeMult
    );
    const target = this.barWidth * whiteShare;
    this.whiteBarWidthTween?.stop();
    this.whiteBarWidthTween = undefined;
    if (animateMs <= 0 || Math.abs(target - this.whiteWidth) < 0.5) {
      this.whiteWidth = target;
      this.whiteBar.setSize(this.whiteWidth, this.barHeight - 10);
      this.whiteBar.updateDisplayOrigin();
      this.whiteBarSkin?.setDisplaySize(this.whiteWidth, this.barHeight - 6);
      return;
    }
    const scene = this.root.scene;
    const state = { w: this.whiteWidth };
    this.whiteBarWidthTween = scene.tweens.add({
      targets: state,
      w: target,
      duration: animateMs,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        this.whiteWidth = state.w;
        this.whiteBar.setSize(this.whiteWidth, this.barHeight - 10);
        this.whiteBar.updateDisplayOrigin();
        this.whiteBarSkin?.setDisplaySize(this.whiteWidth, this.barHeight - 6);
      },
      onComplete: () => {
        this.whiteBarWidthTween = undefined;
      },
    });
  }

  private triggerBirthdayInstaCatch(): void {
    this.guaranteeConfetti = true;
    this.progress = 1;
    this.playBirthdayConfettiFx();
    this.syncVisuals();
    this.root.scene.time.delayedCall(650, () => {
      if (this.active) this.finish(true);
    });
  }

  private birthdayBarScreenBounds(): {
    left: number;
    right: number;
    spawnY: number;
    topY: number;
  } {
    const matrix = this.root.getWorldTransformMatrix();
    const barY = matrix.transformPoint(0, -8).y;
    const leftX = matrix.transformPoint(-this.barWidth / 2 + 24, 0).x;
    const rightX = matrix.transformPoint(this.barWidth / 2 - 24, 0).x;
    return {
      left: Math.min(leftX, rightX),
      right: Math.max(leftX, rightX),
      spawnY: barY + 28,
      topY: 20,
    };
  }

  private updateBirthdayParty(
    dt: number,
    rightClick: boolean,
    pointerX: number,
    pointerY: number
  ): void {
    if (!this.birthdayParty || !this.ready) return;

    this.birthdaySpawnTimer += dt;
    if (this.birthdaySpawnTimer >= this.birthdayNextSpawn) {
      this.birthdaySpawnTimer = 0;
      this.birthdayNextSpawn = Phaser.Math.FloatBetween(0.85, 1.45);
      this.spawnBirthdayBalloon();
    }

    const bounds = this.birthdayBarScreenBounds();
    for (let i = this.birthdayBalloons.length - 1; i >= 0; i--) {
      const b = this.birthdayBalloons[i]!;
      b.root.y -= b.vy * dt;
      b.root.setScale(1 + Math.sin(Date.now() / 320 + i) * 0.05);
      if (b.root.y < bounds.topY) {
        this.destroyBirthdayBalloon(i);
      }
    }

    if (rightClick) {
      this.tryPopBirthdayBalloon(pointerX, pointerY);
    }
  }

  private spawnBirthdayBalloon(): void {
    const bounds = this.birthdayBarScreenBounds();
    const kinds: BirthdayBalloonKind[] = ["blue", "red", "green"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)]!;
    const colors: Record<BirthdayBalloonKind, { fill: number; stroke: number }> =
      {
        blue: { fill: 0x4488ff, stroke: 0xa8d4ff },
        red: { fill: 0xff4455, stroke: 0xffaab0 },
        green: { fill: 0x44cc66, stroke: 0xa8ffbb },
      };
    const c = colors[kind];
    const w = this.birthdayBalloonW;
    const h = this.birthdayBalloonH;
    const x = Phaser.Math.Between(Math.floor(bounds.left), Math.floor(bounds.right));
    const y = bounds.spawnY;
    const scene = this.root.scene;
    const string = scene.add
      .rectangle(0, h * 0.38, 2, h * 0.45, 0xcccccc, 0.85)
      .setOrigin(0.5, 0);
    const balloon = scene.add
      .ellipse(0, 0, w, h, c.fill, 0.94)
      .setStrokeStyle(2.5, c.stroke, 0.95);
    const shine = scene.add
      .ellipse(-w * 0.18, -h * 0.22, w * 0.28, h * 0.18, 0xffffff, 0.45);
    const root = scene.add.container(x, y, [string, balloon, shine]);
    root.setScrollFactor(0);
    this.birthdayBalloonLayer.add(root);
    this.birthdayBalloons.push({
      kind,
      root,
      vy: Phaser.Math.Between(110, 145),
    });
  }

  private tryPopBirthdayBalloon(pointerX: number, pointerY: number): void {
    const hitR = this.birthdayBalloonHitR;
    for (let i = this.birthdayBalloons.length - 1; i >= 0; i--) {
      const b = this.birthdayBalloons[i]!;
      const dx = pointerX - b.root.x;
      const dy = pointerY - b.root.y;
      if (dx * dx + dy * dy > hitR * hitR) continue;
      this.popBirthdayBalloon(i);
      return;
    }
  }

  private popBirthdayBalloon(index: number): void {
    const b = this.birthdayBalloons[index];
    if (!b) return;
    const x = b.root.x;
    const y = b.root.y;
    const kind = b.kind;

    if (kind === "blue") {
      this.progress = Math.min(1, this.progress + 0.1);
    } else if (kind === "red") {
      this.birthdayBalloonSpeedAdd += 10;
      this.applyProgressSpeedFillRate();
    } else {
      this.birthdayBarSizeMult *= 1.1;
      this.applyWhiteBarWidth(420);
    }

    this.playBirthdayBalloonPopFx(x, y, kind);
    this.destroyBirthdayBalloon(index);
    this.syncVisuals();
  }

  private playBirthdayBalloonPopFx(
    x: number,
    y: number,
    kind: BirthdayBalloonKind
  ): void {
    const scene = this.root.scene;
    const burst = scene.add
      .circle(0, 0, 12, 0xffffff, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.birthdayBalloonLayer.add(burst);
    burst.setPosition(x, y);
    scene.tweens.add({
      targets: burst,
      scale: 2.6,
      alpha: 0,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => burst.destroy(),
    });
    const sparkColor =
      kind === "red" ? 0xff6677 : kind === "green" ? 0x66ff88 : 0x88bbff;
    for (let j = 0; j < 6; j++) {
      const ang = (j / 6) * Math.PI * 2;
      const spark = scene.add.circle(0, 0, 4, sparkColor, 0.95);
      this.birthdayBalloonLayer.add(spark);
      spark.setPosition(x, y);
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(ang) * 34,
        y: y + Math.sin(ang) * 34,
        alpha: 0,
        scale: 0.15,
        duration: 280,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private destroyBirthdayBalloon(index: number): void {
    const b = this.birthdayBalloons[index];
    if (!b) return;
    this.birthdayBalloons.splice(index, 1);
    b.root.destroy();
  }

  private clearBirthdayBalloons(): void {
    this.whiteBarWidthTween?.stop();
    this.whiteBarWidthTween = undefined;
    for (const b of this.birthdayBalloons) {
      b.root.destroy();
    }
    this.birthdayBalloons = [];
  }

  private playBirthdayConfettiFx(): void {
    const scene = this.root.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const colors = [
      0xff3344, 0xffee44, 0x44ccff, 0xff66cc, 0x66ff88, 0xffaa22, 0xaa66ff,
    ];
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h * 0.35);
      const color = colors[i % colors.length]!;
      const piece =
        Math.random() > 0.5
          ? scene.add.rectangle(x, y, Phaser.Math.Between(4, 9), Phaser.Math.Between(6, 14), color, 0.95)
          : scene.add.circle(x, y, Phaser.Math.Between(3, 6), color, 0.95);
      piece.setDepth(220).setScrollFactor(0).setAngle(Math.random() * 360);
      scene.tweens.add({
        targets: piece,
        x: x + Phaser.Math.Between(-120, 120),
        y: y + Phaser.Math.Between(80, h * 0.75),
        angle: piece.angle + Phaser.Math.Between(-540, 540),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1400),
        ease: "Cubic.easeOut",
        onComplete: () => piece.destroy(),
      });
    }
    const flash = scene.add
      .rectangle(w / 2, h / 2, w, h, 0xffffff, 0.35)
      .setDepth(219)
      .setScrollFactor(0);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  private finish(success: boolean): void {
    this.active = false;
    this.ready = false;
    this.clearZeusTelegraph();
    this.clearRecoilTelegraph();
    this.clearForgeWeapons();
    this.resetStarweaverState();
    this.clearBirthdayBalloons();
    this.birthdayBalloonLayer.setVisible(false);
    this.forgePhase = "idle";
    this.setElectrified(false);
    this.zeusPhase = "idle";
    this.clearLaserSpaceUi();
    this.root.setVisible(false);
    const cb = this.onResult;
    const meta: CatchMinigameResultMeta | undefined =
      this.guaranteeThunder ||
      this.forgeHadEmberWeapon ||
      this.guaranteeConfetti ||
      this.recoilKickCount > 0 ||
      this.bubbleCatch
        ? {
            ...(this.guaranteeThunder ? { guaranteeThunder: true } : {}),
            ...(this.forgeHadEmberWeapon ? { guaranteeAshencast: true } : {}),
            ...(this.guaranteeConfetti ? { guaranteeConfetti: true } : {}),
            ...(this.recoilKickCount > 0
              ? { recoilKicks: this.recoilKickCount }
              : {}),
            ...(this.bubbleCatch ? { bubbleCatch: true } : {}),
          }
        : undefined;
    this.onResult = undefined;
    this.onTranquilBubblePop = undefined;
    this.guaranteeThunder = false;
    this.forgeHadEmberWeapon = false;
    this.guaranteeConfetti = false;
    this.recoilKickCount = 0;
    this.bubbleCatch = false;
    this.birthdayInstaPending = false;
    cb?.(success, meta);
  }

  forceClose(): void {
    if (!this.active) return;
    this.finish(false);
  }
}
