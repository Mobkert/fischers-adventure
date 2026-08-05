import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Fish } from "../entities/Fish";
import { Bobber } from "../entities/Bobber";
import { Sailboat } from "../entities/Sailboat";
import { FishMerchant } from "../entities/FishMerchant";
import { TalkNpc } from "../entities/TalkNpc";
import { FishingSystem } from "../systems/FishingSystem";
import { InventorySystem } from "../systems/InventorySystem";
import { WeatherSystem } from "../systems/WeatherSystem";
import { DolphinAbundance } from "../systems/DolphinAbundance";
import { CoralRodSpawn } from "../systems/CoralRodSpawn";
import { placeVillage, placeJungle, placeCoralReef } from "../world/WorldDecor";
import { AmbientMusic, musicZoneForX, areaNameForZone, MusicZone } from "../audio/AmbientMusic";
import { loadActiveSave, saveActiveSave } from "../save/SaveBank";
import { ItemId } from "../data/items";
import { UIScene } from "./UIScene";

export class GameScene extends Phaser.Scene {
  player!: Player;
  fishList: Fish[] = [];
  bobber!: Bobber;
  fishing!: FishingSystem;
  inventory!: InventorySystem;
  weather!: WeatherSystem;
  private dolphinAbundance!: DolphinAbundance;
  private coralRodSpawn!: CoralRodSpawn;
  sailboat: Sailboat | null = null;
  merchant!: FishMerchant;
  jungleMerchant!: FishMerchant;
  reefGuide!: TalkNpc;
  private music!: AmbientMusic;
  private tutorialDone = false;
  private autosaveTimer?: Phaser.Time.TimerEvent;
  private lastAreaZone: MusicZone | "reef" | null = null;
  private skyVisual?: {
    sky: Phaser.GameObjects.Graphics;
    sun: Phaser.GameObjects.Container;
    sunX: number;
    sunY: number;
    worldLeft: number;
    worldWidth: number;
    skyH: number;
  };

  /** West ocean → village → long east ocean → jungle → far ocean */
  /** Coral reef far west of the starter left port. */
  readonly westWaterLeft = -3400;
  readonly reefLeft = -3200;
  readonly reefRight = -1700;
  /** Dark↔light water blend ends here (east of reef). */
  readonly reefBlendEnd = -1400;
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
  /** Red-roof cottage — bobber workshop entrance. */
  readonly redHouseX = 640 + 220;
  /** Green cottage — backpack shop entrance. */
  readonly greenHouseX = 640 + 480;

  private ground!: Phaser.Physics.Arcade.StaticGroup;
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
    this.wildflowerProp = undefined;
    this.wildflowerLabel = undefined;
    this.autosaveTimer = undefined;
    this.tutorialDone = false;
    this.lastAreaZone = null;
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

    // One-shot cleanup of the Amber White Perch test grant
    const clearKey = "fischers_cleared_amber_perch_test_v1";
    if (!localStorage.getItem(clearKey)) {
      for (const slot of [...this.inventory.bag, ...this.inventory.hotbar]) {
        if (slot.itemId === "white_perch" && slot.mutation === "amber") {
          slot.itemId = null;
          slot.count = 0;
          slot.mutation = null;
          slot.size = null;
          slot.keep = false;
        }
      }
      localStorage.setItem(clearKey, "1");
    }

    const worldLeft = this.westWaterLeft;
    const worldWidth = this.farWaterRight - worldLeft + 80;
    const worldHeight = 720;
    // Deep water column — camera can dive far below the surface
    const cameraHeight = this.waterSurfaceY + this.deepWaterPx + 40;
    this.physics.world.setBounds(worldLeft, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(worldLeft, 0, worldWidth, cameraHeight);

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
    placeCoralReef(
      this,
      this.waterSurfaceY,
      this.reefLeft,
      this.reefRight,
      this.reefBlendEnd
    );
    this.createWaterVisual();

    const spawn = this.resolveSafeSpawn(save.playerX, save.playerY);
    this.player = new Player(this, spawn.x, spawn.y);
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
    this.reefGuide = new TalkNpc(
      this,
      this.islandLeft + 90,
      this.groundY,
      "Dock Guide",
      "Over there is a coral reef — I've heard there are\n" +
        "rewards there, but quite rare ones.\n\n" +
        "If I can remember, some told me there's a fishing\n" +
        "rod there priced around 40k… but when I checked,\n" +
        "I couldn't find it."
    );
    this.placeWildflowerRodProp();

    this.bobber = new Bobber(this);
    this.spawnFish();

    const waterZones = [
      { left: this.westWaterLeft, right: this.westWaterRight },
      { left: this.eastWaterLeft, right: this.eastWaterRight },
      { left: this.farWaterLeft, right: this.farWaterRight },
      { left: this.pondLeft, right: this.pondRight },
    ];

    this.weather = new WeatherSystem(
      this,
      waterZones,
      this.waterSurfaceY,
      this.groundY
    );
    if (this.skyVisual) {
      this.weather.bindSky({
        sky: this.skyVisual.sky,
        sun: this.skyVisual.sun,
        sunX: this.skyVisual.sunX,
        sunY: this.skyVisual.sunY,
        worldLeft: this.skyVisual.worldLeft,
        worldWidth: this.skyVisual.worldWidth,
        skyHeight: this.skyVisual.skyH,
      });
    }

    const getLuck = () =>
      this.weather.getLuck(
        this.inventory.getFishingStats().luck,
        this.inventory.getEquippedRodId()
      );
    const getIsRainy = () => this.weather.isRainy();
    this.dolphinAbundance = new DolphinAbundance(
      this,
      this.reefLeft,
      this.reefRight,
      this.waterSurfaceY,
      this.fishList,
      getLuck,
      getIsRainy,
      (msg) => {
        const ui = this.scene.get("UIScene") as UIScene;
        ui.showWeatherBanner(msg, "#7ec8ff");
      }
    );
    this.coralRodSpawn = new CoralRodSpawn(
      this,
      this.reefLeft,
      this.reefRight,
      this.waterSurfaceY,
      this.inventory
    );

    this.fishing = new FishingSystem(
      this,
      this.player,
      this.bobber,
      this.fishList,
      this.inventory,
      waterZones,
      this.waterSurfaceY
    );
    this.fishing.setWeather(this.weather);
    this.fishing.onCastCameraFollow = () => this.followBobberCamera();
    this.fishing.onCastCameraRelease = () => this.followPlayerCamera();
    this.fishing.onAbundanceFishRemoved = (fish) => {
      this.dolphinAbundance.notifyFishRemoved(fish);
    };
    this.fishing.isAbundanceActive = () => this.dolphinAbundance.isActive();

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
      weather: this.weather,
      getPointerDown: () => this.input.activePointer.isDown,
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
      tryEnterBobberShop: () => this.tryEnterBobberShop(),
      tryEnterBackpackShop: () => this.tryEnterBackpackShop(),
      tryEnterWhirlpoolCloud: () => this.tryEnterWhirlpoolCloud(),
      isNearCoralRodOnBoat: () => this.isNearCoralRodOnBoat(),
      tryOpenCoralRodOffer: () => this.tryOpenCoralRodOffer(),
      offerCoralRodGift: (amount: number) => this.offerCoralRodGift(amount),
      isNearBlueHouse: () => this.isNearBlueHouse(),
      isNearRedHouse: () => this.isNearRedHouse(),
      isNearGreenHouse: () => this.isNearGreenHouse(),
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
    // Wider than the dock tips so boarding overhang never falls into village clamp
    return (
      x >= this.jungleWestDockEnd - 80 && x <= this.jungleEastDockEnd + 80
    );
  }

  private isOnVillageIsland(): boolean {
    const x = this.player.sprite.x;
    return x >= this.westDockEnd - 80 && x <= this.dockEnd + 80;
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
  }

  tryTalkToMerchant(): boolean {
    if (this.player.isOnBoat()) return false;
    if (this.fishing.isBusy()) return false;

    const ui = this.scene.get("UIScene") as UIScene;

    if (
      this.reefGuide.talking ||
      this.reefGuide.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      return this.reefGuide.interact();
    }

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
        this.inventory.getKeptFishCount(),
        this.inventory.getSellableFishValue()
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
    this.reefGuide.decline();
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
      .text(x + 8, this.groundY - 78, "Wildflower Rod\n$14500 · F to inspect", {
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

  isNearCoralRodOnBoat(): boolean {
    if (!this.player.isOnBoat() || !this.sailboat) return false;
    if (this.inventory.ownsRod("coral_rod")) return false;
    return this.coralRodSpawn.isNear(
      this.player.sprite.x,
      this.player.sprite.y
    );
  }

  tryOpenCoralRodOffer(): boolean {
    if (!this.isNearCoralRodOnBoat()) return false;
    if (this.fishing.isBusy()) return false;
    const ui = this.scene.get("UIScene") as UIScene;
    ui.openCoralRodOffer();
    return true;
  }

  offerCoralRodGift(amount: number): boolean {
    if (!this.coralRodSpawn.isActive()) {
      const ui = this.scene.get("UIScene") as UIScene;
      ui.closeCoralRodOffer();
      ui.showToast("The rod has drifted away…", "#ffaa66");
      return true;
    }
    const ui = this.scene.get("UIScene") as UIScene;
    const result = this.inventory.offerCoralRod(amount);
    ui.showToast(result.message, result.ok ? "#ff9ec8" : "#ffaa66");
    ui.onCoinsChanged();
    if (result.ok) {
      this.coralRodSpawn.claim();
      ui.closeCoralRodOffer();
      this.inventory.equipRod("coral_rod");
      this.player.syncCarriedRod(this.inventory.getSelectedItem());
      this.persistSave();
    }
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

      let landX = this.dockEnd - 40;
      if (this.isBoatNearWestPort()) landX = this.islandLeft + 40;
      else if (this.isBoatNearJungleWestPort()) landX = this.jungleLeft + 50;
      else if (this.isBoatNearJungleEastPort()) landX = this.jungleRight - 50;
      else if (this.isBoatNearEastPort()) landX = this.dockEnd - 40;

      this.sailboat.disembark(this.player, landX, this.groundY);
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

    this.sailboat.board(this.player);
    ui.showToast("A/D to sail · F near port to exit", "#7ec8e3");
    return true;
  }

  private createBackground(): void {
    const worldLeft = this.westWaterLeft;
    const worldWidth = this.farWaterRight - worldLeft + 80;
    const skyH = this.waterSurfaceY + 8;
    // World-space sky so it scrolls away when the camera dives underwater
    const sky = this.add.graphics().setDepth(-2);
    sky.fillGradientStyle(0x5eb0e0, 0x5eb0e0, 0xd4effc, 0xd4effc, 1);
    sky.fillRect(worldLeft, 0, worldWidth, skyH);

    const sunX = 160;
    const sunY = 90;
    const sun = this.add.container(sunX, sunY).setDepth(-1);
    sun.add([
      this.add.circle(0, 0, 52, 0xfff0b0, 0.25),
      this.add.circle(0, 0, 36, 0xffe08a, 0.95),
      this.add.circle(-8, -6, 10, 0xfff6d0, 0.7),
    ]);

    this.skyVisual = { sky, sun, sunX, sunY, worldLeft, worldWidth, skyH };
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
      // Deep west approach only — reef draws its own sand
      [this.reefBlendEnd, this.westWaterRight],
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
    // Deep west ocean (after the light→dark blend) + other oceans
    this.drawWaterBody(this.reefBlendEnd, this.westWaterRight);
    this.drawWaterBody(this.eastWaterLeft, this.eastWaterRight);
    this.drawWaterBody(this.farWaterLeft, this.farWaterRight);
    // Far west tip past the reef (still deep)
    if (this.westWaterLeft < this.reefLeft) {
      this.drawWaterBody(this.westWaterLeft, this.reefLeft);
    }

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

  isNearRedHouse(): boolean {
    if (this.player.isOnBoat()) return false;
    return Math.abs(this.player.sprite.x - this.redHouseX) < 70;
  }

  isNearGreenHouse(): boolean {
    if (this.player.isOnBoat()) return false;
    return Math.abs(this.player.sprite.x - this.greenHouseX) < 70;
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

  tryEnterBobberShop(): boolean {
    if (!this.isNearRedHouse()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.merchant.talking || this.jungleMerchant.talking) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("BobberShopScene", { inventory: this.inventory });
    return true;
  }

  tryEnterBackpackShop(): boolean {
    if (!this.isNearGreenHouse()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.merchant.talking || this.jungleMerchant.talking) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("BackpackShopScene", { inventory: this.inventory });
    return true;
  }

  tryEnterWhirlpoolCloud(): boolean {
    if (!this.weather?.isNearWhirlpool(this.player.sprite.x, this.player.sprite.y)) {
      return false;
    }
    if (this.fishing.isBusy()) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("CloudShopScene", {
      inventory: this.inventory,
      persistSave: () => this.persistSave(),
    });
    return true;
  }

  private spawnFish(): void {
    const getLuck = () =>
      this.weather
        ? this.weather.getLuck(
            this.inventory.getFishingStats().luck,
            this.inventory.getEquippedRodId()
          )
        : this.inventory.getFishingStats().luck;
    const getExcludeSpecies = (self: Fish): ItemId[] => {
      const otherCluster = this.fishList.some(
        (f) => f !== self && f.speciesId === "mushroom_cluster"
      );
      return otherCluster ? ["mushroom_cluster"] : [];
    };
    const getIsRainy = () => this.weather?.isRainy() ?? false;
    const zones: {
      left: number;
      right: number;
      count: number;
      habitat: "ocean" | "pond" | "reef";
    }[] = [
      {
        left: this.reefLeft,
        right: this.reefRight,
        count: 8,
        habitat: "reef",
      },
      {
        // Deep west approach east of the reef blend
        left: this.reefBlendEnd,
        right: this.westWaterRight,
        count: 10,
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
          getExcludeSpecies,
          getIsRainy
        );
        this.fishList.push(fish);
      }
    }
  }

  update(_time: number, delta: number): void {
    this.weather?.update(delta);
    this.dolphinAbundance?.update(delta);
    this.coralRodSpawn?.update(delta);
    this.player.syncCarriedRod(this.inventory.getSelectedItem());
    this.player.update();
    for (const fish of this.fishList) {
      fish.update(delta);
    }
    this.fishing.update(delta);
    this.sailboat?.update(delta);

    const areaId = this.getAreaId(this.player.sprite.x);
    const musicZone =
      areaId === "reef" ? "reef" : (areaId as MusicZone);
    this.music.setZone(musicZone);

    const ui = this.scene.get("UIScene") as UIScene;
    if (areaId !== this.lastAreaZone) {
      this.lastAreaZone = areaId;
      ui.showAreaBanner(this.getAreaName(areaId));
    }

    if (areaId === "ocean" || areaId === "reef") {
      ui.setOceanMarkers(this.getOceanMarkers(this.player.sprite.x));
    } else {
      ui.setOceanMarkers(null);
    }

    if (this.player.isOnBoat() && this.sailboat) {
      if (this.fishing.isBusy()) {
        ui.setPrompt("Fishing…");
      } else if (this.isNearCoralRodOnBoat()) {
        ui.setPrompt("F — Approach the floating rod");
      } else if (this.isBoatNearAnyPort()) {
        ui.setPrompt("LMB cast · F leave port");
      } else {
        ui.setPrompt("A/D sail · LMB cast");
      }
    } else if (this.merchant.talking || this.jungleMerchant.talking) {
      ui.setPrompt("F — Confirm    X — Decline");
    } else if (this.reefGuide.talking) {
      ui.setPrompt("F / X — Close");
    } else if (
      this.reefGuide.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to Dock Guide");
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
          ? "F — Buy ($14500)    X — Cancel"
          : "F — Inspect Wildflower Rod"
      );
    } else if (this.weather?.isNearWhirlpool(this.player.sprite.x, this.player.sprite.y)) {
      ui.setPrompt("F — Enter · Cast into the whirlpool for Thunder");
    } else if (this.isNearBlueHouse()) {
      ui.setPrompt("W — Enter Bluefin Tackle Shop");
    } else if (this.isNearRedHouse()) {
      ui.setPrompt("W — Enter Bobber Workshop");
    } else if (this.isNearGreenHouse()) {
      ui.setPrompt("W — Enter Pack Outfitter");
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
    if (uiScene.isCoralRodOfferOpen() && !this.isNearCoralRodOnBoat()) {
      uiScene.closeCoralRodOffer();
    }
    if (
      this.reefGuide.talking &&
      !this.reefGuide.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      this.reefGuide.decline();
    }
  }

  private getAreaId(x: number): MusicZone | "reef" {
    if (x >= this.reefLeft && x < this.reefRight) return "reef";
    return musicZoneForX(x, {
      westDockEnd: this.westDockEnd,
      dockEnd: this.dockEnd,
      jungleWestDockEnd: this.jungleWestDockEnd,
      jungleEastDockEnd: this.jungleEastDockEnd,
    });
  }

  private getAreaName(id: MusicZone | "reef"): string {
    if (id === "reef") return "Coral Reef";
    return areaNameForZone(id);
  }

  /**
   * Islands / reef left & right while at sea.
   * Each side lists landmarks nearest-first; UI stacks farther ones underneath, faded.
   */
  private getOceanMarkers(playerX: number): {
    side: "left" | "right";
    names: string[];
  }[] {
    const landmarks = [
      {
        name: "Coral Reef",
        x: (this.reefLeft + this.reefRight) / 2,
      },
      {
        name: "Starter Island",
        x: (this.islandLeft + this.islandRight) / 2,
      },
      {
        name: "Swamp Island",
        x: (this.jungleLeft + this.jungleRight) / 2,
      },
    ];

    const leftNames = landmarks
      .filter((lm) => lm.x < playerX - 120)
      .sort((a, b) => b.x - a.x) // nearest first (largest x still left of player)
      .map((lm) => lm.name);

    const rightNames = landmarks
      .filter((lm) => lm.x > playerX + 120)
      .sort((a, b) => a.x - b.x) // nearest first (smallest x still right of player)
      .map((lm) => lm.name);

    const out: { side: "left" | "right"; names: string[] }[] = [];
    if (leftNames.length) out.push({ side: "left", names: leftNames });
    if (rightNames.length) out.push({ side: "right", names: rightNames });
    return out;
  }

  /** True if X is on walkable village or swamp docks/island. */
  private isWalkableLandX(x: number): boolean {
    if (x >= this.westDockEnd + 16 && x <= this.dockEnd - 16) return true;
    if (x >= this.jungleWestDockEnd + 16 && x <= this.jungleEastDockEnd - 16) {
      return true;
    }
    return false;
  }

  /**
   * Boat / ocean saves put you in open water. Resume on the nearest solid
   * shore inland — never on dock tips over the water.
   */
  private resolveSafeSpawn(
    saveX: number,
    _saveY: number
  ): { x: number; y: number } {
    const landY = this.groundY - 40;
    const x = Phaser.Math.Clamp(saveX, this.westWaterLeft + 40, this.farWaterRight + 40);

    if (this.isWalkableLandX(x)) {
      // Prefer inland when saved on the outer dock planks
      if (x >= this.westDockEnd + 16 && x < this.islandLeft + 40) {
        return { x: this.islandLeft + 100, y: landY };
      }
      if (x > this.islandRight - 40 && x <= this.dockEnd - 16) {
        return { x: this.islandRight - 100, y: landY };
      }
      if (x >= this.jungleWestDockEnd + 16 && x < this.jungleLeft + 40) {
        return { x: this.jungleLeft + 100, y: landY };
      }
      if (x > this.jungleRight - 40 && x <= this.jungleEastDockEnd - 16) {
        return { x: this.jungleRight - 100, y: landY };
      }
      return { x, y: landY };
    }

    // West ocean
    if (x < this.westDockEnd + 16) {
      return { x: this.islandLeft + 100, y: landY };
    }
    // Between starter island and swamp
    if (x < this.jungleWestDockEnd + 16) {
      const mid = (this.dockEnd + this.jungleWestDockEnd) / 2;
      return x < mid
        ? { x: this.islandRight - 100, y: landY }
        : { x: this.jungleLeft + 100, y: landY };
    }
    // Far ocean east of swamp
    return { x: this.jungleRight - 100, y: landY };
  }

  private clampPlayerToLand(): void {
    const x = this.player.sprite.x;

    if (this.isOnJungleIsland()) {
      const minX = this.jungleWestDockEnd + 16;
      const maxX = this.jungleEastDockEnd - 16;
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

    // Stranded between islands — pull to nearest land (never village-clamp swamp coords)
    if (x > this.dockEnd + 80 && x < this.jungleWestDockEnd - 80) {
      const mid = (this.dockEnd + this.jungleWestDockEnd) / 2;
      this.player.sprite.x =
        x < mid ? this.dockEnd - 16 : this.jungleWestDockEnd + 16;
      this.player.sprite.setVelocityX(0);
      return;
    }

    if (!this.isOnVillageIsland() && x >= this.jungleWestDockEnd - 80) {
      this.player.sprite.x = this.jungleWestDockEnd + 16;
      this.player.sprite.setVelocityX(0);
      return;
    }

    const maxX = this.dockEnd - 16;
    const minX = this.westDockEnd + 16;
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
