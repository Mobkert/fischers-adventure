import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Fish } from "../entities/Fish";
import { Bobber } from "../entities/Bobber";
import { Sailboat } from "../entities/Sailboat";
import { FishMerchant } from "../entities/FishMerchant";
import { FishingSystem } from "../systems/FishingSystem";
import { InventorySystem } from "../systems/InventorySystem";
import { placeVillage, placeJungle } from "../world/WorldDecor";
import { AmbientMusic, musicZoneForX } from "../audio/AmbientMusic";
import { loadActiveSave, saveActiveSave } from "../save/SaveBank";
import { ItemId } from "../data/items";
import { UIScene } from "./UIScene";

export class GameScene extends Phaser.Scene {
  player!: Player;
  fishList: Fish[] = [];
  bobber!: Bobber;
  fishing!: FishingSystem;
  inventory!: InventorySystem;
  sailboat: Sailboat | null = null;
  merchant!: FishMerchant;
  jungleMerchant!: FishMerchant;
  private music!: AmbientMusic;
  private tutorialDone = false;
  private autosaveTimer?: Phaser.Time.TimerEvent;

  /** West ocean → village → long east ocean → jungle → far ocean */
  readonly westWaterLeft = 0;
  readonly westWaterRight = 640;
  readonly islandLeft = 640;
  readonly islandRight = 1540;
  readonly eastWaterLeft = 1540;
  /** Long voyage before the jungle (~2460px of open water). */
  readonly eastWaterRight = 4000;
  readonly jungleLeft = 4000;
  readonly jungleRight = 5800;
  readonly farWaterLeft = 5800;
  readonly farWaterRight = 6400;
  /** Central swamp pond — fishable, max 3 fish. */
  readonly pondLeft = 4700;
  readonly pondRight = 4980;
  /** @deprecated use east water — kept for sailboat bounds */
  readonly waterLeft = 1540;
  readonly waterRight = 4000;
  readonly groundY = 560;
  readonly waterSurfaceY = 560;
  /** Village east dock tip (into east ocean). */
  readonly dockEnd = 1680;
  /** Village west dock tip (into west ocean). */
  readonly westDockEnd = 500;
  /** Jungle west dock tip (into approach ocean). */
  readonly jungleWestDockEnd = 3860;
  /** Jungle east dock tip (into far ocean). */
  readonly jungleEastDockEnd = 5940;
  /** Blue-roof cottage — rod shop entrance. */
  readonly blueHouseX = 640 + 720;

  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private boatDeckCollider?: Phaser.Physics.Arcade.Collider;
  private wildflowerProp?: Phaser.GameObjects.Image;
  private wildflowerLabel?: Phaser.GameObjects.Text;
  readonly wildflowerRodX = 4000 + 210;
  /** How far below the surface the water graphic / camera can go. */
  readonly deepWaterPx = 720;

  constructor() {
    super("GameScene");
  }

  init(): void {
    // Reset instance fields so a second Play doesn't reuse stale refs
    this.fishList = [];
    this.sailboat = null;
    this.boatDeckCollider = undefined;
    this.wildflowerProp = undefined;
    this.wildflowerLabel = undefined;
    this.autosaveTimer = undefined;
    this.tutorialDone = false;
  }

  create(): void {
    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }

    const save = loadActiveSave();
    this.inventory = new InventorySystem(save);
    this.tutorialDone = save.tutorialDone;

    const worldWidth = this.farWaterRight + 80;
    const worldHeight = 720;
    // Deep water column — camera can dive far below the surface
    const cameraHeight = this.waterSurfaceY + this.deepWaterPx + 40;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, cameraHeight);

    this.createBackground();
    this.createTerrain();
    placeVillage(this, this.groundY, this.islandLeft, this.islandRight);
    placeJungle(
      this,
      this.groundY,
      this.jungleLeft,
      this.jungleRight,
      this.pondLeft,
      this.pondRight
    );
    this.createWaterVisual();

    const spawnX = Phaser.Math.Clamp(save.playerX, 40, worldWidth - 40);
    const spawnY = Phaser.Math.Clamp(save.playerY, 80, this.groundY - 20);
    this.player = new Player(this, spawnX, spawnY);
    this.player.sprite.setDepth(12);
    this.player.syncCarriedRod(this.inventory.getSelectedItem());
    this.physics.add.collider(this.player.sprite, this.ground);

    // Fish buyer between the red-roof and green houses (in front of market stand)
    this.merchant = new FishMerchant(this, this.islandLeft + 350, this.groundY);
    this.jungleMerchant = new FishMerchant(
      this,
      this.jungleLeft + 320,
      this.groundY,
      "Swamp Merchant"
    );
    this.jungleMerchant.sprite.setTint(0xb8d8a0);
    this.placeWildflowerRodProp();

    this.bobber = new Bobber(this);
    this.spawnFish();

    this.fishing = new FishingSystem(
      this,
      this.player,
      this.bobber,
      this.fishList,
      this.inventory,
      [
        { left: this.westWaterLeft, right: this.westWaterRight },
        { left: this.eastWaterLeft, right: this.eastWaterRight },
        { left: this.farWaterLeft, right: this.farWaterRight },
        { left: this.pondLeft, right: this.pondRight },
      ],
      this.waterSurfaceY
    );
    this.fishing.onCastCameraFollow = () => this.followBobberCamera();
    this.fishing.onCastCameraRelease = () => this.followPlayerCamera();

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(80, 60);

    this.music = new AmbientMusic(this);
    this.music.setZone(
      musicZoneForX(this.player.sprite.x, {
        westDockEnd: this.westDockEnd,
        dockEnd: this.dockEnd,
        jungleWestDockEnd: this.jungleWestDockEnd,
        jungleEastDockEnd: this.jungleEastDockEnd,
      })
    );
    const unlockMusic = () => this.music.unlock();
    this.input.once("pointerdown", unlockMusic);
    this.input.keyboard?.once("keydown", unlockMusic);

    this.scene.launch("UIScene", {
      inventory: this.inventory,
      fishing: this.fishing,
      getPointerDown: () => this.input.activePointer.isDown,
      isOnPort: () => this.isPlayerOnPort(),
      canOpenBoatMenu: () =>
        this.isPlayerOnPort() &&
        !this.player.isOnBoat() &&
        this.fishing.state === "idle",
      spawnSailboat: () => this.spawnSailboat(),
      tryBoardOrExitBoat: () => this.tryBoardOrExitBoat(),
      tryTalkToMerchant: () => this.tryTalkToMerchant(),
      declineMerchant: () => this.declineAnyMerchant(),
      tryBuyJungleRod: () => this.tryBuyWildflowerRod(),
      tryEnterShop: () => this.tryEnterShop(),
      isNearBlueHouse: () => this.isNearBlueHouse(),
      getMusicVolume: () => this.music.getVolume(),
      setMusicVolume: (v: number) => this.music.setVolume(v),
      isTutorialDone: () => this.tutorialDone,
      markTutorialDone: () => {
        this.tutorialDone = true;
      },
      quitToMenu: () => this.quitToMenu(),
      persistSave: () => this.persistSave(),
    });

    this.autosaveTimer = this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => this.persistSave(),
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const ui = this.scene.get("UIScene") as UIScene | undefined;
      if (!ui || !ui.sys.settings.active) return;
      if (ui.isBlockingInput?.()) return;
      if (this.fishing.state === "minigame") return;

      const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
      this.fishing.tryCast(worldX);
    });

    const titleX = this.islandLeft + 420;
    this.add
      .text(titleX, 90, "Fischer's Adventure", {
        fontFamily: "Georgia, serif",
        fontSize: "36px",
        color: "#ffffff",
        stroke: "#1a3d1a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(1)
      .setScrollFactor(0.9);

    this.add
      .text(
        titleX,
        130,
        "A/D move · W shop · F talk/board · B boats · 2 bag · LMB cast · E inv",
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#e8ffe8",
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(1)
      .setScrollFactor(0.9);
  }

  private followBobberCamera(): void {
    this.cameras.main.setDeadzone(40, 40);
    this.cameras.main.startFollow(this.bobber.sprite, true, 0.14, 0.16);
  }

  private followPlayerCamera(): void {
    this.cameras.main.setDeadzone(80, 60);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
  }

  isPlayerOnEastPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.islandRight - 30 && x <= this.dockEnd;
  }

  isPlayerOnWestPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.westDockEnd && x <= this.islandLeft + 30;
  }

  isPlayerOnJungleWestPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.jungleWestDockEnd && x <= this.jungleLeft + 40;
  }

  isPlayerOnJungleEastPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.jungleRight - 40 && x <= this.jungleEastDockEnd;
  }

  isPlayerOnPort(): boolean {
    return (
      this.isPlayerOnEastPort() ||
      this.isPlayerOnWestPort() ||
      this.isPlayerOnJungleWestPort() ||
      this.isPlayerOnJungleEastPort()
    );
  }

  private isOnJungleIsland(): boolean {
    const x = this.player.sprite.x;
    return x >= this.jungleWestDockEnd - 20 && x <= this.jungleEastDockEnd + 20;
  }

  private isBoatNearEastPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x <= this.dockEnd + 120 && x >= this.islandRight - 80;
  }

  private isBoatNearWestPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x >= this.westDockEnd - 120 && x <= this.islandLeft + 80;
  }

  private isBoatNearJungleWestPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x >= this.jungleWestDockEnd - 120 && x <= this.jungleLeft + 80;
  }

  private isBoatNearJungleEastPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x <= this.jungleEastDockEnd + 120 && x >= this.jungleRight - 80;
  }

  private isBoatNearAnyPort(): boolean {
    return (
      this.isBoatNearEastPort() ||
      this.isBoatNearWestPort() ||
      this.isBoatNearJungleWestPort() ||
      this.isBoatNearJungleEastPort()
    );
  }

  spawnSailboat(): void {
    if (this.sailboat) {
      if (this.sailboat.occupied) return;
      this.boatDeckCollider?.destroy();
      this.sailboat.destroy();
      this.sailboat = null;
    }

    const onWest = this.isPlayerOnWestPort();
    const onJungleWest = this.isPlayerOnJungleWestPort();
    const onJungleEast = this.isPlayerOnJungleEastPort();

    let x: number;
    let waterL: number;
    let waterR: number;
    if (onWest) {
      x = this.westDockEnd - 28;
      waterL = this.westWaterLeft;
      waterR = this.westWaterRight;
    } else if (onJungleWest) {
      x = this.jungleWestDockEnd - 28;
      waterL = this.eastWaterLeft;
      waterR = this.eastWaterRight;
    } else if (onJungleEast) {
      x = this.jungleEastDockEnd + 28;
      waterL = this.farWaterLeft;
      waterR = this.farWaterRight;
    } else {
      x = this.dockEnd + 28;
      waterL = this.eastWaterLeft;
      waterR = this.eastWaterRight;
    }

    this.sailboat = new Sailboat(
      this,
      x,
      this.waterSurfaceY,
      waterL,
      waterR
    );

    this.boatDeckCollider = this.physics.add.collider(
      this.player.sprite,
      this.sailboat.hull
    );
  }

  tryTalkToMerchant(): boolean {
    if (this.player.isOnBoat()) return false;
    if (this.fishing.isBusy()) return false;

    const ui = this.scene.get("UIScene") as UIScene;
    const tryOne = (m: FishMerchant) => {
      if (
        !m.talking &&
        !m.isNear(this.player.sprite.x, this.player.sprite.y)
      ) {
        return false;
      }
      return m.interact(
        this.inventory.getSellableFishCount(),
        () => {
          const result = this.inventory.sellAllFish();
          ui.onCoinsChanged();
          this.persistSave();
          return result;
        },
        this.inventory.getKeptFishCount()
      );
    };

    // Prefer the merchant already in conversation, else nearest
    if (this.merchant.talking) return tryOne(this.merchant);
    if (this.jungleMerchant.talking) return tryOne(this.jungleMerchant);
    if (tryOne(this.merchant)) return true;
    return tryOne(this.jungleMerchant);
  }

  declineAnyMerchant(): void {
    this.merchant.decline();
    this.jungleMerchant.decline();
  }

  private placeWildflowerRodProp(): void {
    const x = this.wildflowerRodX;
    this.wildflowerProp = this.add
      .image(x, this.groundY - 4, "rod_wildflower")
      .setOrigin(0.5, 1)
      .setScale(1.15)
      .setAngle(-28)
      .setDepth(6);
    this.wildflowerLabel = this.add
      .text(x + 8, this.groundY - 78, "Wildflower Rod\n$22000 · F to inspect", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#ffe8f0",
        align: "center",
        stroke: "#1a1a12",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.refreshWildflowerProp();
  }

  private refreshWildflowerProp(): void {
    const owned = this.inventory.ownsRod("wildflower_rod");
    this.wildflowerProp?.setVisible(!owned);
    this.wildflowerLabel?.setVisible(!owned);
  }

  isNearWildflowerRod(): boolean {
    if (this.player.isOnBoat()) return false;
    if (this.inventory.ownsRod("wildflower_rod")) return false;
    return Math.abs(this.player.sprite.x - this.wildflowerRodX) < 70;
  }

  tryBuyWildflowerRod(): boolean {
    const ui = this.scene.get("UIScene") as UIScene;
    if (this.fishing.isBusy()) return false;
    if (this.merchant.talking || this.jungleMerchant.talking) return false;

    // Panel already open → confirm purchase
    if (ui.isWildflowerBuyOpen()) {
      if (!this.isNearWildflowerRod()) {
        ui.closeWildflowerBuy();
        return true;
      }
      const result = this.inventory.buyRod("wildflower_rod");
      ui.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
      ui.onCoinsChanged();
      ui.closeWildflowerBuy();
      if (result.ok) {
        this.refreshWildflowerProp();
        this.inventory.equipRod("wildflower_rod");
        this.player.syncCarriedRod(this.inventory.getSelectedItem());
        this.persistSave();
      }
      return true;
    }

    // First F → show stats
    if (!this.isNearWildflowerRod()) return false;
    ui.openWildflowerBuy();
    return true;
  }

  tryBoardOrExitBoat(): boolean {
    const ui = this.scene.get("UIScene") as UIScene;
    if (this.merchant.talking || this.jungleMerchant.talking) return false;
    if (this.fishing.isBusy()) {
      ui.showToast("Finish fishing first.", "#ffaa66");
      return false;
    }

    if (this.player.isOnBoat() && this.sailboat) {
      if (!this.isBoatNearAnyPort()) {
        ui.showToast("Sail closer to a port to get out.", "#ffaa66");
        return false;
      }
      this.boatDeckCollider?.destroy();
      this.boatDeckCollider = undefined;

      let landX = this.dockEnd - 40;
      if (this.isBoatNearWestPort()) landX = this.islandLeft + 40;
      else if (this.isBoatNearJungleWestPort()) landX = this.jungleLeft + 50;
      else if (this.isBoatNearJungleEastPort()) landX = this.jungleRight - 50;
      else if (this.isBoatNearEastPort()) landX = this.dockEnd - 40;

      this.sailboat.disembark(this.player, landX, this.groundY);
      if (this.sailboat) {
        this.boatDeckCollider = this.physics.add.collider(
          this.player.sprite,
          this.sailboat.hull
        );
      }
      ui.showToast("Left the sailboat.", "#c8c8c8");
      return true;
    }

    if (!this.sailboat || this.sailboat.occupied) return false;
    if (
      !this.sailboat.isNear(this.player.sprite.x, this.player.sprite.y) &&
      !this.isPlayerOnPort()
    ) {
      return false;
    }
    if (!this.sailboat.isNear(this.player.sprite.x, this.player.sprite.y, 100)) {
      ui.showToast("Get closer to the sailboat.", "#ffaa66");
      return false;
    }

    this.boatDeckCollider?.destroy();
    this.boatDeckCollider = undefined;
    this.sailboat.board(this.player);
    ui.showToast("A/D to sail · F near port to exit", "#7ec8e3");
    return true;
  }

  private createBackground(): void {
    const worldWidth = this.farWaterRight + 80;
    // World-space sky so it scrolls away when the camera dives underwater
    const sky = this.add.graphics().setDepth(-2);
    sky.fillGradientStyle(0x5eb0e0, 0x5eb0e0, 0xd4effc, 0xd4effc, 1);
    sky.fillRect(0, 0, worldWidth, this.waterSurfaceY + 8);

    this.add.circle(160, 90, 52, 0xfff0b0, 0.25).setDepth(-1);
    this.add.circle(160, 90, 36, 0xffe08a, 0.95).setDepth(-1);
    this.add.circle(152, 84, 10, 0xfff6d0, 0.7).setDepth(-1);
  }

  private addIslandBedrock(left: number, right: number, lushFringe: boolean): void {
    const islandW = right - left;
    const bedrock = this.add.graphics().setDepth(2);
    const underTop = this.groundY + 32;
    const underBottom = this.groundY + 420;
    const underH = underBottom - underTop;

    bedrock.fillStyle(lushFringe ? 0x3a5228 : 0x6b4423);
    bedrock.fillRect(left, underTop, islandW, 56);
    bedrock.fillStyle(lushFringe ? 0x2a3a1c : 0x5a3d24);
    bedrock.fillRect(left, underTop + 40, islandW, 50);
    bedrock.fillStyle(0x4a3220);
    bedrock.fillRect(left, underTop + 80, islandW, 40);

    bedrock.fillStyle(0x3e2918);
    bedrock.fillRect(left, underTop + 110, islandW, 50);
    bedrock.fillStyle(0x5c5650);
    bedrock.fillRect(left, underTop + 150, islandW, underH - 150);
    bedrock.fillStyle(0x4a4540);
    bedrock.fillRect(left, underTop + 200, islandW, underH - 200);
    bedrock.fillStyle(0x3a3632);
    bedrock.fillRect(left, underTop + 280, islandW, underH - 280);

    for (let i = 0; i < 90; i++) {
      const x = left + Phaser.Math.Between(4, islandW - 8);
      const y = underTop + Phaser.Math.Between(8, 140);
      bedrock.fillStyle(
        Phaser.Math.RND.pick(
          lushFringe
            ? [0x3a5228, 0x2a3a1c, 0x4a3220]
            : [0x7a5430, 0x4a2f18, 0x3e2918]
        ),
        0.85
      );
      bedrock.fillRect(x, y, Phaser.Math.Between(2, 5), Phaser.Math.Between(2, 4));
    }
    for (let i = 0; i < 120; i++) {
      const x = left + Phaser.Math.Between(4, islandW - 8);
      const y = underTop + Phaser.Math.Between(160, underH - 10);
      bedrock.fillStyle(
        Phaser.Math.RND.pick([0x6a6560, 0x3a3632, 0x2a2826, 0x7a756e]),
        0.9
      );
      bedrock.fillRect(x, y, Phaser.Math.Between(2, 6), Phaser.Math.Between(2, 5));
    }

    bedrock.fillStyle(lushFringe ? 0x1e6b32 : 0x4a9344);
    for (let x = left; x < right; x += 6) {
      bedrock.fillRect(x, this.groundY + 28, 3, Phaser.Math.Between(3, 7));
    }
  }

  private createTerrain(): void {
    this.ground = this.physics.add.staticGroup();

    // Village island
    for (let x = this.islandLeft; x < this.islandLeft + 64; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    for (let x = this.islandLeft + 64; x < this.islandRight - 64; x += 32) {
      const variant = Math.floor(x / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        this.groundY + 16,
        `grass_${variant}`
      );
      tile.refreshBody();
    }
    for (let x = this.islandRight - 64; x < this.islandRight; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    this.addIslandBedrock(this.islandLeft, this.islandRight, false);

    // Jungle island strip → swamp mud grass (gap at pond; bridge in createWaterVisual)
    for (let x = this.jungleLeft; x < this.jungleLeft + 64; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    for (let x = this.jungleLeft + 64; x < this.pondLeft; x += 32) {
      const variant = Math.floor(x / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        this.groundY + 16,
        `swamp_grass_${variant}`
      );
      tile.refreshBody();
    }
    for (let x = this.pondRight; x < this.jungleRight - 64; x += 32) {
      const variant = Math.floor(x / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        this.groundY + 16,
        `swamp_grass_${variant}`
      );
      tile.refreshBody();
    }
    for (let x = this.jungleRight - 64; x < this.jungleRight; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    this.addIslandBedrock(this.jungleLeft, this.jungleRight, true);

    for (const [left, right] of [
      [this.westWaterLeft, this.westWaterRight],
      [this.eastWaterLeft, this.eastWaterRight],
      [this.farWaterLeft, this.farWaterRight],
    ] as const) {
      for (let x = left; x < right; x += 32) {
        this.add
          .image(x + 16, this.groundY + 96, "sand")
          .setTint(0x7a6840)
          .setDepth(2);
      }
    }
  }

  private drawWaterBody(left: number, right: number): void {
    const waterWidth = right - left;
    const deep = this.deepWaterPx;
    const water = this.add.graphics().setDepth(4);

    // Surface → mid → abyss so deep casts fully cover the sky
    water.fillStyle(0x2e86c1, 0.45);
    water.fillRect(left, this.waterSurfaceY, waterWidth, 48);
    water.fillStyle(0x1f6f9f, 0.72);
    water.fillRect(left, this.waterSurfaceY + 40, waterWidth, 120);
    water.fillStyle(0x145a82, 0.88);
    water.fillRect(left, this.waterSurfaceY + 140, waterWidth, 160);
    water.fillStyle(0x0c3d5c, 0.94);
    water.fillRect(left, this.waterSurfaceY + 280, waterWidth, 200);
    water.fillStyle(0x071e30, 0.98);
    water.fillRect(
      left,
      this.waterSurfaceY + 460,
      waterWidth,
      Math.max(120, deep - 460)
    );

    const strips = Math.max(6, Math.floor(waterWidth / 70));
    for (let i = 0; i < strips; i++) {
      const strip = this.add
        .rectangle(
          left + 40 + i * 70,
          this.waterSurfaceY + 3,
          50,
          2,
          0xc8eaff,
          0.4
        )
        .setDepth(6);
      this.tweens.add({
        targets: strip,
        alpha: 0.08,
        x: strip.x + 16,
        duration: 1400 + i * 90,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createWaterVisual(): void {
    this.drawWaterBody(this.westWaterLeft, this.westWaterRight);
    this.drawWaterBody(this.eastWaterLeft, this.eastWaterRight);
    this.drawWaterBody(this.farWaterLeft, this.farWaterRight);

    const pier = this.ground.create(
      this.islandRight - 40,
      this.groundY + 16,
      "shore"
    );
    pier.setDisplaySize(80, 32);
    pier.refreshBody();

    const westLip = this.ground.create(
      this.islandLeft + 40,
      this.groundY + 16,
      "shore"
    );
    westLip.setDisplaySize(80, 32);
    westLip.refreshBody();

    const jWestLip = this.ground.create(
      this.jungleLeft + 40,
      this.groundY + 16,
      "shore"
    );
    jWestLip.setDisplaySize(80, 32);
    jWestLip.refreshBody();

    const jEastLip = this.ground.create(
      this.jungleRight - 40,
      this.groundY + 16,
      "shore"
    );
    jEastLip.setDisplaySize(80, 32);
    jEastLip.refreshBody();

    const addDock = (left: number, right: number) => {
      const w = right - left;
      const dock = this.ground.create(left + w / 2, this.groundY + 8, "dock");
      dock.setDisplaySize(w, 16);
      dock.refreshBody();
      dock.setVisible(false);
    };
    addDock(this.islandRight, this.dockEnd);
    addDock(this.westDockEnd, this.islandLeft);
    addDock(this.jungleWestDockEnd, this.jungleLeft);
    addDock(this.jungleRight, this.jungleEastDockEnd);

    // Footbridge over jungle pond (until swimming exists)
    const pondW = this.pondRight - this.pondLeft;
    const bridge = this.ground.create(
      this.pondLeft + pondW / 2,
      this.groundY + 6,
      "dock"
    );
    bridge.setDisplaySize(pondW + 16, 14);
    bridge.refreshBody();
    bridge.setVisible(false);
  }

  isNearBlueHouse(): boolean {
    if (this.player.isOnBoat()) return false;
    return Math.abs(this.player.sprite.x - this.blueHouseX) < 70;
  }

  tryEnterShop(): boolean {
    if (!this.isNearBlueHouse()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.merchant.talking || this.jungleMerchant.talking) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("ShopScene", { inventory: this.inventory });
    return true;
  }

  private spawnFish(): void {
    const getLuck = () => this.inventory.getEquippedRodStats().luck;
    const getExcludeSpecies = (self: Fish): ItemId[] => {
      const otherCluster = this.fishList.some(
        (f) => f !== self && f.speciesId === "mushroom_cluster"
      );
      return otherCluster ? ["mushroom_cluster"] : [];
    };
    const zones: {
      left: number;
      right: number;
      count: number;
      habitat: "ocean" | "pond";
    }[] = [
      {
        left: this.westWaterLeft,
        right: this.westWaterRight,
        count: 4,
        habitat: "ocean",
      },
      {
        left: this.eastWaterLeft,
        right: this.eastWaterRight,
        count: 10,
        habitat: "ocean",
      },
      {
        left: this.farWaterLeft,
        right: this.farWaterRight,
        count: 3,
        habitat: "ocean",
      },
      {
        left: this.pondLeft,
        right: this.pondRight,
        count: 3,
        habitat: "pond",
      },
    ];
    for (const zone of zones) {
      for (let i = 0; i < zone.count; i++) {
        const pad = zone.habitat === "pond" ? 30 : 60;
        const x = Phaser.Math.Between(zone.left + pad, zone.right - pad);
        const y = this.waterSurfaceY + Phaser.Math.Between(28, 70);
        const fish = new Fish(
          this,
          x,
          y,
          zone.left + (zone.habitat === "pond" ? 20 : 50),
          zone.right - (zone.habitat === "pond" ? 20 : 50),
          this.waterSurfaceY,
          getLuck,
          zone.habitat,
          undefined,
          getExcludeSpecies
        );
        this.fishList.push(fish);
      }
    }
  }

  update(_time: number, delta: number): void {
    this.player.syncCarriedRod(this.inventory.getSelectedItem());
    this.player.update();
    for (const fish of this.fishList) {
      fish.update(delta);
    }
    this.fishing.update(delta);
    this.sailboat?.update(delta);

    this.music.setZone(
      musicZoneForX(this.player.sprite.x, {
        westDockEnd: this.westDockEnd,
        dockEnd: this.dockEnd,
        jungleWestDockEnd: this.jungleWestDockEnd,
        jungleEastDockEnd: this.jungleEastDockEnd,
      })
    );

    const ui = this.scene.get("UIScene") as UIScene;
    if (this.player.isOnBoat() && this.sailboat) {
      if (this.fishing.isBusy()) {
        ui.setPrompt("Fishing…");
      } else if (this.isBoatNearAnyPort()) {
        ui.setPrompt("LMB cast · F leave port");
      } else {
        ui.setPrompt("A/D sail · LMB cast");
      }
    } else if (this.merchant.talking || this.jungleMerchant.talking) {
      ui.setPrompt("F — Confirm    X — Decline");
    } else if (
      this.merchant.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to The Merchant");
    } else if (
      this.jungleMerchant.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to Swamp Merchant");
    } else if (this.isNearWildflowerRod()) {
      const uiOpen = (this.scene.get("UIScene") as UIScene).isWildflowerBuyOpen();
      ui.setPrompt(
        uiOpen
          ? "F — Buy ($22000)    X — Cancel"
          : "F — Inspect Wildflower Rod"
      );
    } else if (this.isNearBlueHouse()) {
      ui.setPrompt("W — Enter Bluefin Tackle Shop");
    } else if (
      this.sailboat &&
      !this.sailboat.occupied &&
      this.sailboat.isNear(this.player.sprite.x, this.player.sprite.y, 100)
    ) {
      ui.setPrompt("F — Board sailboat");
    } else if (this.isPlayerOnPort()) {
      ui.setPrompt("B — Boat menu");
    } else {
      ui.setPrompt(null);
    }

    if (!this.player.isOnBoat()) {
      this.clampPlayerToLand();
    }

    // Close wildflower inspect if you walk away
    const uiScene = this.scene.get("UIScene") as UIScene;
    if (uiScene.isWildflowerBuyOpen() && !this.isNearWildflowerRod()) {
      uiScene.closeWildflowerBuy();
    }
  }

  private clampPlayerToLand(): void {
    const boat = this.sailboat && !this.sailboat.occupied ? this.sailboat : null;

    if (this.isOnJungleIsland()) {
      let minX = this.jungleWestDockEnd + 16;
      let maxX = this.jungleEastDockEnd - 16;
      if (boat && boat.hull.x < this.jungleLeft) {
        minX = this.jungleWestDockEnd - 50;
      }
      if (boat && boat.hull.x > this.jungleRight) {
        maxX = this.jungleEastDockEnd + 50;
      }
      if (this.player.sprite.x > maxX) {
        this.player.sprite.x = maxX;
        this.player.sprite.setVelocityX(0);
      }
      if (this.player.sprite.x < minX) {
        this.player.sprite.x = minX;
        this.player.sprite.setVelocityX(0);
      }
      return;
    }

    const boatEast =
      boat && boat.hull.x > this.islandRight && boat.hull.x < this.jungleLeft;
    const boatWest = boat && boat.hull.x < this.islandLeft;
    const maxX = boatEast ? this.dockEnd + 50 : this.dockEnd - 16;
    const minX = boatWest ? this.westDockEnd - 50 : this.westDockEnd + 16;
    if (this.player.sprite.x > maxX) {
      this.player.sprite.x = maxX;
      this.player.sprite.setVelocityX(0);
    }
    if (this.player.sprite.x < minX) {
      this.player.sprite.x = minX;
      this.player.sprite.setVelocityX(0);
    }
  }

  persistSave(): void {
    if (!this.inventory || !this.player) return;
    saveActiveSave(
      this.inventory.toSave({
        playerX: this.player.sprite.x,
        playerY: this.player.sprite.y,
        tutorialDone: this.tutorialDone,
      })
    );
  }

  quitToMenu(): void {
    this.persistSave();
    this.autosaveTimer?.remove(false);
    this.sound.stopAll();
    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }
    // Stop parallel scenes first, then switch — never call scene.stop from shutdown()
    this.scene.stop("ShopScene");
    this.scene.stop("UIScene");
    this.scene.start("MenuScene");
  }

  shutdown(): void {
    // Local cleanup only. Do NOT stop/start other scenes here — that races
    // Phaser's scene manager and can freeze the menu with dead buttons.
    this.autosaveTimer?.remove(false);
  }
}
