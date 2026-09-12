import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Fish } from "../entities/Fish";
import { Bobber } from "../entities/Bobber";
import { Sailboat } from "../entities/Sailboat";
import { FishMerchant } from "../entities/FishMerchant";
import { TalkNpc } from "../entities/TalkNpc";
import { BaitCrate } from "../entities/BaitCrate";
import { BaitPlacementMarker } from "../ui/BaitPlacementMarker";
import { CodeGuyNpc } from "../entities/CodeGuyNpc";
import {
  FishQuestIslandId,
  FISH_QUEST_ISLAND_IDS,
} from "../systems/FishQuest";
import { FishingSystem } from "../systems/FishingSystem";
import { InventorySystem } from "../systems/InventorySystem";
import { WeatherSystem } from "../systems/WeatherSystem";
import { DayNightCycle } from "../systems/DayNightCycle";
import { AmuletRitual } from "../systems/AmuletRitual";
import { DolphinAbundance } from "../systems/DolphinAbundance";
import { CoralRodSpawn } from "../systems/CoralRodSpawn";
import {
  placeVillage,
  placeJungle,
  placeCoralReef,
  placeCollectorsIsland,
  placeFrostpeakIsle,
} from "../world/WorldDecor";
import {
  placeAshencastIsland,
  ashencastPierCollisionBounds,
} from "../world/AshencastIsland";
import { applyDevInventoryBootstrap } from "../dev/DevGrants";
import { ensurePlayerRodArt } from "../entities/PlayerArt";
import { ensureRodIconTextures } from "./BootScene";
import { ForgeRodTipVfx } from "../fx/ForgeRodFx";
import { LaserRodHeldVfx } from "../fx/LaserRodFx";
import { FrostRodHeldVfx } from "../fx/FrostRodHeldVfx";
import { StellarSurferHeldVfx } from "../fx/StellarSurferHeldVfx";
import { StarLineHeldVfx } from "../fx/StarLineHeldVfx";
import { SurferMasteryBlackHole } from "../fx/SurferMasteryBlackHole";
import { WorldZoneLoader } from "../world/WorldZoneLoader";
import {
  placeFrostpeakCave,
  caveWalkZones,
  CAVE_LOCAL_W,
  CAVE_SPAWN_LOCAL_X,
  CAVE_EXIT_LOCAL_X,
  type CaveWater,
  type CavePort,
  type CaveLand,
} from "../world/FrostpeakCaveWorld";
import {
  placeStellarSky,
  STELLAR_LOCAL_W,
  STELLAR_SPAWN_LOCAL_X,
} from "../world/StellarSkyWorld";
import { NightAmbient } from "../world/NightAmbient";
import { AmbientMusic, musicZoneForX, areaNameForZone, MusicZone } from "../audio/AmbientMusic";
import { BargainerNpc } from "../entities/BargainerNpc";
import { CurioTraderStock, formatCurioRestock } from "../systems/CurioTraderStock";
import { loadActiveSave, saveActiveSave } from "../save/SaveBank";
import {
  ItemId,
  ITEMS,
  FishHabitat,
  FishMutationId,
  rollAshencastOceanSpecies,
  rollHotspringSpecies,
  ORE_CLUSTER_VENDOR_PRICE,
  BAIT_CRATE_PRICE,
  BaitCastZone,
  getBaitAttractsForHabitat,
  getBaitSpawnPool,
  getBaitWaterZones,
  isBaitCastZone,
  resolveBaitCastZone,
  rollFishSpecies,
  rollFishSize,
} from "../data/items";
import { ROD_SKINS } from "../data/rodSkins";
import { BoatId } from "../data/boats";
import { CaveWhaleAbundance } from "../systems/CaveWhaleAbundance";
import { CrystalGalleryChallenge } from "../systems/CrystalGalleryChallenge";
import {
  VAULT_GEM_IDS,
  VAULT_GEM_COLORS,
  VAULT_GEM_NAMES,
  VAULT_BLUE_ALTAR_COST,
  VAULT_LAND_MID_LOCAL,
  vaultPedestalWorldX,
  type VaultGemId,
} from "../systems/VaultGemQuest";
import { UIScene } from "./UIScene";
import type { BargainSession } from "../ui/BargainPanel";
import { rodDisplayName } from "../systems/FrostpeakQuest";
import {
  ASTRAL_WARDEN_LINES,
  ASTRAL_STARLINE_COST,
  astralSurferObjectiveList,
  formatQuestIngredientChecklist,
} from "../systems/AstralWardenQuest";
import {
  RESONATED_HAT_LINES,
  RESONATED_HAT_NPC_NAME,
  resonatedHatChecklist,
} from "../systems/ResonatedHatQuest";

export class GameScene extends Phaser.Scene {
  player!: Player;
  fishList: Fish[] = [];
  bobber!: Bobber;
  fishing!: FishingSystem;
  inventory!: InventorySystem;
  weather!: WeatherSystem;
  dayNight!: DayNightCycle;
  private amuletRitual!: AmuletRitual;
  private nightAmbient!: NightAmbient;
  private dolphinAbundance!: DolphinAbundance;
  private coralRodSpawn!: CoralRodSpawn;
  private whaleAbundance!: CaveWhaleAbundance;
  curioStock!: CurioTraderStock;
  sailboat: Sailboat | null = null;
  merchant!: FishMerchant;
  jungleMerchant?: FishMerchant;
  /** One fish buyer per Frostpeak Cave chamber. */
  private caveMerchants: FishMerchant[] = [];
  reefGuide!: TalkNpc;
  codeGuy?: CodeGuyNpc;
  frostHermit?: TalkNpc;
  /** Gem Vault keeper — lost the jewels. */
  vaultKeeper?: TalkNpc;
  /** Crystal Gallery curator — memory challenge for rod skin. */
  galleryCurator?: TalkNpc;
  /** Entrance Hall — lost his nautilus, rewards Shell Hat. */
  shellSeeker?: TalkNpc;
  /** Per-island Fish Quest anglers. */
  private fishQuestNpcs: Partial<Record<FishQuestIslandId, TalkNpc>> = {};
  private galleryChallenge?: CrystalGalleryChallenge;
  private vaultPedestalGems: Phaser.GameObjects.Image[] = [];
  private worldGemRoots: Partial<
    Record<VaultGemId, Phaser.GameObjects.Container>
  > = {};
  private redGemBob = 0;
  private frostCaveBoards?: Phaser.GameObjects.Container;
  /** True while teleported into the mountain cave region. */
  private inFrostpeakCave = false;
  /** True while inside the secret Stellar Sky pocket. */
  private inStellarSky = false;
  private stellarLoaded = false;
  private stellarPortalX = 0;
  private stellarLandLeft = 0;
  private stellarLandRight = 0;
  private stellarBeing?: TalkNpc;
  /** Swamp — Resonated Hat quest NPC (between rope & east port). */
  private cosmicHaberdasher?: TalkNpc;
  private stellarAura?: Phaser.GameObjects.Arc;
  private stellarDestroy?: () => void;
  private stellarReturnX = 0;
  private moonHoverMs = 0;
  private moonHoverHint?: Phaser.GameObjects.Text;
  private stellarEnterBusy = false;
  private caveLands: CaveLand[] = [];
  private caveWaters: CaveWater[] = [];
  private cavePorts: CavePort[] = [];
  private lastCaveAreaId = "";
  /** World X of the Frostpeak cave mouth (near hermit). */
  get frostCaveX(): number {
    return (this.frostLeft + this.frostRight) / 2 + 50;
  }
  /** Stellar Sky pocket — far beyond the cave void. */
  readonly stellarOriginX = 26000;
  get stellarEndX(): number {
    return this.stellarOriginX + STELLAR_LOCAL_W;
  }
  fishCollector?: BargainerNpc;
  curioTrader?: BargainerNpc;
  ashenMerchant?: FishMerchant;
  ashenForgeNpc?: TalkNpc;
  orePeddler?: TalkNpc;
  appraiser?: TalkNpc;
  private baitCrates: BaitCrate[] = [];
  private baitPlacementId: ItemId | null = null;
  private baitMarker: BaitPlacementMarker | null = null;
  /** Chum box sits just below the surface. */
  private static readonly BAIT_PLACEMENT_TOP_OFFSET = 8;
  private ashenBuildAnvil?: () => void;
  private anvilOceanFish?: Fish;
  private zoneLoader!: WorldZoneLoader;
  /** Shared water-zone list — cave chambers append when the cave loads. */
  private waterZoneList: { left: number; right: number }[] = [];
  /** Avoid double-drawing the same ocean stretch when adjacent zones both load. */
  private drawnWaterKeys = new Set<string>();
  /** Ocean stretches between islands — spawn once when either end loads. */
  private spawnedFishCorridors = new Set<string>();
  private forgeRodVfx: ForgeRodTipVfx | null = null;
  private laserRodVfx: LaserRodHeldVfx | null = null;
  private frostRodVfx: FrostRodHeldVfx | null = null;
  private stellarSurferVfx: StellarSurferHeldVfx | null = null;
  private starLineVfx: StarLineHeldVfx | null = null;
  private surferMasteryBlackHole: SurferMasteryBlackHole | null = null;
  private surferMasteryGrantMs = 0;
  private surferMasteryGrantPending = false;
  private music!: AmbientMusic;
  private tutorialDone = false;
  private autosaveTimer?: Phaser.Time.TimerEvent;
  private lastAreaZone: MusicZone | "reef" | "collectors" | "frostpeak" | "ashencast" | null = null;
  private skyVisual?: {
    sky: Phaser.GameObjects.Graphics;
    sun: Phaser.GameObjects.Container;
    moon: Phaser.GameObjects.Container;
    sunX: number;
    sunY: number;
    worldLeft: number;
    worldWidth: number;
    skyH: number;
  };

  /** West ocean → Ashencast → Collectors → village → jungle → Frostpeak */
  /** Far west tip beyond Ashencast Isle. */
  readonly westWaterLeft = -14900;
  /** Ashencast Isle — west of Collectors (~6.5k ocean voyage). */
  readonly ashenLeft = -14500;
  readonly ashenRight = -12100;
  readonly ashenWestDock = -14640;
  readonly ashenEastDock = -11960;
  /** Hotspring ponds on Ashencast (west third). */
  readonly ashenSpringALeft = -14220;
  readonly ashenSpringARight = -13980;
  readonly ashenSpringBLeft = -13840;
  readonly ashenSpringBRight = -13580;
  /** Collector's Island — west of the reef (reach reef first, then island). */
  readonly collectorLeft = -5600;
  readonly collectorRight = -3200;
  /** West dock tip into open ocean. */
  readonly collectorWestDock = -5740;
  /** East pier into the reef shallows. */
  readonly collectorEastDock = -3080;
  /** Coral reef between Collectors and Starter approach. */
  readonly reefLeft = -3200;
  readonly reefRight = -1700;
  /** Dark↔light water blend east of reef toward Starter. */
  readonly reefBlendEnd = -1400;
  readonly westWaterRight = 640;
  readonly islandLeft = 640;
  readonly islandRight = 1540;
  readonly eastWaterLeft = 1540;
  /** Long voyage before the jungle (~2460px of open water). */
  readonly eastWaterRight = 4000;
  readonly jungleLeft = 4000;
  readonly jungleRight = 5800;
  /** Open water between swamp and Frostpeak Isle. */
  readonly farWaterLeft = 5800;
  readonly frostLeft = 7800;
  readonly frostRight = 10000;
  /** Water east of Frostpeak Isle (world tip before void gap). */
  readonly farWaterRight = 10800;
  /**
   * Frostpeak Cave — far east past a void gap so you can only reach it
   * by teleporting through the boarded cave mouth.
   */
  readonly caveOriginX = 14000;
  get caveEndX(): number {
    return this.caveOriginX + CAVE_LOCAL_W;
  }
  /** Frostpeak Isle docks. */
  readonly frostWestDock = 7660;
  readonly frostEastDock = 10140;
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
  /** Jungle east dock tip (into far ocean toward Frostpeak). */
  readonly jungleEastDockEnd = 5940;
  /** Blue-roof cottage — rod shop entrance. */
  readonly blueHouseX = 640 + 720;
  /** Red-roof cottage — bobber workshop entrance. */
  readonly redHouseX = 640 + 220;
  /** Floor crack + rope into the amulet cave (swamp, past the pond). */
  readonly caveCrackX = this.pondRight + 230;
  /** Green cottage — backpack shop entrance. */
  readonly greenHouseX = 640 + 480;
  /** Collectors red brick house — skin boutique (between curio & fish stands). */
  readonly collectorSkinHouseX = (-5600 + -3200) / 2 + 40;
  /** Code Guy — between green and blue cottages. */
  readonly codeGuyX = (640 + 480 + 640 + 720) / 2;

  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private groundCollider?: Phaser.Physics.Arcade.Collider;
  private wildflowerProp?: Phaser.GameObjects.Image;
  private wildflowerLabel?: Phaser.GameObjects.Text;
  readonly wildflowerRodX = 4000 + 210;
  /** Tall cypress just east of the pond — silent fall-through secret. */
  readonly secretFallTreeX = 4980 + 70;
  private secretFallReadyAt = 0;
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
    this.groundCollider = undefined;
    this.secretFallReadyAt = 0;
    this.drawnWaterKeys = new Set();
    this.spawnedFishCorridors = new Set();
    // Frostpeak cave — stale flags/arrays made re-entry skip rebuilding ground
    this.inFrostpeakCave = false;
    this.inStellarSky = false;
    this.stellarLoaded = false;
    this.stellarBeing = undefined;
    this.stellarAura = undefined;
    this.stellarDestroy = undefined;
    this.moonHoverMs = 0;
    this.stellarEnterBusy = false;
    this.moonHoverHint?.destroy();
    this.moonHoverHint = undefined;
    this.lastCaveAreaId = "";
    this.caveLands = [];
    this.caveWaters = [];
    this.cavePorts = [];
    this.caveMerchants = [];
    this.frostCaveBoards = undefined;
    this.vaultKeeper = undefined;
    this.shellSeeker = undefined;
    this.galleryCurator = undefined;
    this.galleryChallenge = undefined;
    this.ashenBuildAnvil = undefined;
    this.anvilOceanFish = undefined;
    this.frostHermit = undefined;
    this.ashenMerchant = undefined;
    this.ashenForgeNpc = undefined;
    this.orePeddler = undefined;
    this.appraiser = undefined;
    this.fishCollector = undefined;
    this.curioTrader = undefined;
    this.jungleMerchant = undefined;
    this.cosmicHaberdasher = undefined;
    this.fishQuestNpcs = {};
    this.forgeRodVfx = null;
    this.laserRodVfx = null;
    this.frostRodVfx = null;
    this.vaultPedestalGems = [];
    this.worldGemRoots = {};
    this.redGemBob = 0;
  }

  create(): void {
    ensurePlayerRodArt(this);
    ensureRodIconTextures(this);

    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }

    const save = loadActiveSave();
    this.inventory = new InventorySystem(save);
    if (import.meta.env.DEV && typeof location !== "undefined") {
      const h = location.hostname;
      if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") {
        applyDevInventoryBootstrap(this.inventory);
      }
    }
    this.tutorialDone = save.tutorialDone;

    const worldLeft = this.westWaterLeft;
    const worldWidth = this.caveEndX - worldLeft + 80;
    const worldHeight = 720;
    // Deep water column — camera can dive far below the surface
    const cameraHeight = this.waterSurfaceY + this.deepWaterPx + 40;
    this.physics.world.setBounds(worldLeft, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(worldLeft, 0, worldWidth, cameraHeight);

    this.createBackground();
    this.createTerrain();
    this.nightAmbient = new NightAmbient();
    placeVillage(
      this,
      this.groundY,
      this.islandLeft,
      this.islandRight,
      this.nightAmbient
    );
    this.createVillageWaterVisual();
    this.spawnStarterFish();
    this.initWorldZoneLoader();

    const spawn = this.resolveSafeSpawn(save.playerX, save.playerY);
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.sprite.setDepth(12);
    this.syncPlayerCarriedRod();
    this.groundCollider = this.physics.add.collider(
      this.player.sprite,
      this.ground
    );
    this.zoneLoader.refresh(spawn.x);

    // Fish buyer between the red-roof and green houses (in front of market stand)
    this.merchant = new FishMerchant(this, this.islandLeft + 350, this.groundY);
    this.spawnFishQuestNpc("village");
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
    this.codeGuy = new CodeGuyNpc(this, this.codeGuyX, this.groundY);
    this.syncPlayerHat();
    this.curioStock = new CurioTraderStock();
    this.curioStock.setOwnsRod((id) => this.inventory.ownsRod(id));
    this.curioStock.setOwnsBobber((id) => this.inventory.ownsBobber(id));
    this.curioStock.setHasItem((id) => this.inventory.hasItem(id));
    this.curioStock.setNeedsAnvilCurio(
      () =>
        this.inventory.ashencastQuestStage === 1 &&
        !this.inventory.hasItem("anvil_piece_curio")
    );
    this.curioStock.applyPersisted(this.inventory.curioStockSave, Date.now());
    this.syncCurioStockToInventory();

    this.bobber = new Bobber(this);

    this.waterZoneList = [
      { left: this.westWaterLeft, right: this.ashenLeft },
      { left: this.ashenRight, right: this.collectorLeft },
      { left: this.ashenSpringALeft, right: this.ashenSpringARight },
      { left: this.ashenSpringBLeft, right: this.ashenSpringBRight },
      { left: this.reefLeft, right: this.reefBlendEnd },
      { left: this.reefBlendEnd, right: this.westWaterRight },
      { left: this.eastWaterLeft, right: this.eastWaterRight },
      { left: this.farWaterLeft, right: this.frostLeft },
      { left: this.frostRight, right: this.farWaterRight },
      { left: this.pondLeft, right: this.pondRight },
    ];

    this.weather = new WeatherSystem(
      this,
      this.waterZoneList,
      this.waterSurfaceY,
      this.groundY
    );
    this.dayNight = new DayNightCycle();
    this.amuletRitual = new AmuletRitual(this);
    if (this.skyVisual) {
      this.weather.bindSky({
        sky: this.skyVisual.sky,
        sun: this.skyVisual.sun,
        moon: this.skyVisual.moon,
        sunX: this.skyVisual.sunX,
        sunY: this.skyVisual.sunY,
        worldLeft: this.skyVisual.worldLeft,
        worldWidth: this.skyVisual.worldWidth,
        skyHeight: this.skyVisual.skyH,
      });
    }
    // Publish start: midday + clear skies (day/night still runs from here)
    this.dayNight.setGameMinutes(13 * 60);
    this.dayNight.setTimeScale(1);
    this.weather.bindDayNight(this.dayNight);
    this.weather.forceWeather("clear");
    this.weather.getLightningFishTargets = () =>
      this.fishList
        .filter(
          (f) =>
            f.state !== "caught" &&
            f.sprite.active &&
            f.sprite.visible &&
            f.sprite.alpha > 0.4
        )
        .map((f) => ({
          x: f.sprite.x,
          y: f.sprite.y,
          alreadyThunder: f.mutation === "thunder",
          applyThunder: () => f.setMutation("thunder"),
        }));
    this.weather.getLightningAnchorX = () => this.player.sprite.x;

    const getLuck = () =>
      this.weather.getLuck(
        this.inventory.getFishingStats().luck,
        this.inventory.getEquippedRodId()
      );
    const getIsRainy = () => this.weather.isRainy();
    const getIsSunny = () => this.weather.weather === "sunny";
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
      },
      getIsSunny
    );
    // One-shot: force dolphin abundance (requested in chat)
    if (
      import.meta.env.DEV &&
      typeof localStorage !== "undefined" &&
      !localStorage.getItem("fischers_force_dolphin_abundance_v1")
    ) {
      this.dolphinAbundance.forceStart();
      localStorage.setItem("fischers_force_dolphin_abundance_v1", "1");
    }
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
      this.waterZoneList,
      this.waterSurfaceY
    );
    this.fishing.setWeather(this.weather);
    this.fishing.onCastCameraFollow = () => this.followBobberCamera();
    this.fishing.onCastCameraRelease = () => this.followPlayerCamera();
    this.fishing.onAbundanceFishRemoved = (fish) => {
      this.dolphinAbundance.notifyFishRemoved(fish);
      this.whaleAbundance?.notifyFishRemoved(fish);
      if (fish === this.anvilOceanFish) {
        this.anvilOceanFish = undefined;
      }
    };
    this.fishing.isAbundanceActive = () =>
      this.dolphinAbundance.isActive() || this.whaleAbundance?.isActive();

    this.whaleAbundance = new CaveWhaleAbundance(
      this,
      this.caveWaters,
      this.waterSurfaceY,
      this.fishList,
      () => this.inventory.getFishingStats().luck,
      (msg) => {
        const ui = this.scene.get("UIScene") as UIScene;
        // Same top banner as dolphin abundance — visible in overworld & cave
        ui.showWeatherBanner(msg, "#ff69b4");
      }
    );
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
      dayNight: this.dayNight,
      player: this.player,
      getPointerDown: () => {
        const p = this.input.activePointer;
        if (!p.isDown) return false;
        if (p.rightButtonDown() && !p.leftButtonDown()) return false;
        return true;
      },
      getPointerRightDown: () => this.input.activePointer.rightButtonDown(),
      tryMobileCast: () => this.tryMobileCast(),
      canOpenBoatMenu: () =>
        this.isPlayerOnPort() &&
        !this.player.isOnBoat() &&
        this.fishing.state === "idle",
      spawnBoat: (id: BoatId) => this.spawnBoat(id),
      buyBoat: (id: BoatId) => this.buyBoat(id),
      tryDeployStellarSurfer: () => this.tryDeployStellarSurfer(),
      isRidingStellarSurfer: () => this.isRidingStellarSurfer(),
      tryBoardOrExitBoat: () => this.tryBoardOrExitBoat(),
      tryTalkToMerchant: () => this.tryTalkToMerchant(),
      tryVaultGemInteract: () => this.tryVaultGemInteract(),
      declineMerchant: () => this.declineAnyMerchant(),
      tryBuyJungleRod: () => this.tryBuyWildflowerRod(),
      trySecretFallThrough: () => this.trySecretFallThrough(),
      tryOpenBargain: () => this.tryOpenBargain(),
      completeBargainDeal: (session: BargainSession, price: number) =>
        this.completeBargainDeal(session, price),
      declineBargainers: () => this.declineBargainers(),
      getCurioStock: () => this.curioStock.getEntries(),
      getCurioRestockMs: () => this.curioStock.msUntilRestock(Date.now()),
      tryEnterShop: () => this.tryEnterShop(),
      tryEnterBobberShop: () => this.tryEnterBobberShop(),
      tryEnterBackpackShop: () => this.tryEnterBackpackShop(),
      tryEnterSkinShop: () => this.tryEnterSkinShop(),
      tryEnterWhirlpoolCloud: () => this.tryEnterWhirlpoolCloud(),
      tryEnterAmuletCave: () => this.tryEnterAmuletCave(),
      tryEnterFrostpeakCave: () => this.tryEnterFrostpeakCave(),
      tryLeaveFrostpeakCave: () => this.tryLeaveFrostpeakCave(),
      tryUseAmulet: (id: ItemId) => this.tryUseAmulet(id),
      tryUseBait: (id: ItemId) => this.tryUseBait(id),
      isBaitPlacing: () => this.baitPlacementId != null,
      cancelBaitPlacement: () => this.cancelBaitPlacement(),
      isNearCaveCrack: () => this.isNearCaveCrack(),
      isInFrostpeakCave: () => this.inFrostpeakCave,
      isInStellarSky: () => this.inStellarSky,
      isNearCoralRodOnBoat: () => this.isNearCoralRodOnBoat(),
      tryOpenCoralRodOffer: () => this.tryOpenCoralRodOffer(),
      offerCoralRodGift: (amount: number) => this.offerCoralRodGift(amount),
      isNearBlueHouse: () => this.isNearBlueHouse(),
      isNearRedHouse: () => this.isNearRedHouse(),
      isNearGreenHouse: () => this.isNearGreenHouse(),
      isNearCollectorSkinHouse: () => this.isNearCollectorSkinHouse(),
      getMusicVolume: () => this.music.getVolume(),
      setMusicVolume: (v: number) => this.music.setVolume(v),
      isTutorialDone: () => this.tutorialDone,
      markTutorialDone: () => {
        this.tutorialDone = true;
      },
      quitToMenu: () => this.quitToMenu(),
      persistSave: () => this.persistSave(),
      teleportTideCompass: (id: import("../data/items").TideCompassDestId) =>
        this.teleportTideCompass(id),
      getTideCompassHere: () => this.getTideCompassHere(),
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
      if (ui.isMobileMode?.()) return;
      if (ui.isMobileCapturing?.()) return;
      if (this.fishing.state === "minigame") return;
      if (this.inStellarSky) return;

      const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
      if (this.baitPlacementId) {
        if (pointer.rightButtonDown() && !pointer.leftButtonDown()) return;
        this.tryConfirmBaitCast(worldX);
        return;
      }
      this.fishing.tryCast(worldX);
    });
  }

  /** Cast ahead of the player (mobile CAST button). */
  tryMobileCast(): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    if (ui?.isBlockingInput?.()) return;
    if (this.fishing.state === "minigame") return;
    if (this.inStellarSky) return;
    const facing = this.player.getFacing();
    const aimX =
      this.player.sprite.x + (facing === "left" ? -180 : 180);
    this.fishing.tryCast(aimX);
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
      this.isPlayerOnJungleEastPort() ||
      this.isPlayerOnCollectorEastPort() ||
      this.isPlayerOnCollectorWestPort() ||
      this.isPlayerOnAshenEastPort() ||
      this.isPlayerOnAshenWestPort() ||
      this.isPlayerOnFrostWestPort() ||
      this.isPlayerOnFrostEastPort() ||
      this.isPlayerOnCavePort()
    );
  }

  isPlayerOnCollectorEastPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.collectorRight - 50 && x <= this.collectorEastDock;
  }

  isPlayerOnCollectorWestPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.collectorWestDock && x <= this.collectorLeft + 50;
  }

  isPlayerOnAshenEastPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.ashenRight - 50 && x <= this.ashenEastDock;
  }

  isPlayerOnAshenWestPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.ashenWestDock && x <= this.ashenLeft + 50;
  }

  isPlayerOnFrostWestPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.frostWestDock && x <= this.frostLeft + 50;
  }

  isPlayerOnFrostEastPort(): boolean {
    if (this.player.isOnBoat()) return false;
    const x = this.player.sprite.x;
    return x >= this.frostRight - 50 && x <= this.frostEastDock;
  }

  private isOnJungleIsland(): boolean {
    const x = this.player.sprite.x;
    return x >= this.jungleWestDockEnd && x <= this.jungleEastDockEnd;
  }

  private isOnCollectorsIsland(): boolean {
    const x = this.player.sprite.x;
    return (
      x >= this.collectorWestDock - 40 && x <= this.collectorEastDock + 40
    );
  }

  private isOnAshencastIsland(): boolean {
    const x = this.player.sprite.x;
    return x >= this.ashenWestDock - 40 && x <= this.ashenEastDock + 40;
  }

  private isOnFrostpeak(): boolean {
    const x = this.player.sprite.x;
    return x >= this.frostWestDock - 40 && x <= this.frostEastDock + 40;
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

  private isBoatNearCollectorEastPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x <= this.collectorEastDock + 120 && x >= this.collectorRight - 80;
  }

  private isBoatNearCollectorWestPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x >= this.collectorWestDock - 120 && x <= this.collectorLeft + 80;
  }

  private isBoatNearAshenEastPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x <= this.ashenEastDock + 120 && x >= this.ashenRight - 80;
  }

  private isBoatNearAshenWestPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x >= this.ashenWestDock - 120 && x <= this.ashenLeft + 80;
  }

  private isBoatNearFrostWestPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x >= this.frostWestDock - 120 && x <= this.frostLeft + 80;
  }

  private isBoatNearFrostEastPort(): boolean {
    if (!this.sailboat) return false;
    const x = this.sailboat.hull.x;
    return x <= this.frostEastDock + 120 && x >= this.frostRight - 80;
  }

  private isBoatNearAnyPort(): boolean {
    return (
      this.isBoatNearEastPort() ||
      this.isBoatNearWestPort() ||
      this.isBoatNearJungleWestPort() ||
      this.isBoatNearJungleEastPort() ||
      this.isBoatNearCollectorEastPort() ||
      this.isBoatNearCollectorWestPort() ||
      this.isBoatNearAshenEastPort() ||
      this.isBoatNearAshenWestPort() ||
      this.isBoatNearFrostWestPort() ||
      this.isBoatNearFrostEastPort() ||
      this.cavePortNearBoat() != null
    );
  }

  spawnBoat(boatId: BoatId = "sailboat"): void {
    if (boatId !== "stellar_surfer" && !this.inventory.ownsBoat(boatId)) return;
    if (this.sailboat) {
      if (this.sailboat.occupied) return;
      this.sailboat.destroy();
      this.sailboat = null;
    }

    const onWest = this.isPlayerOnWestPort();
    const onJungleWest = this.isPlayerOnJungleWestPort();
    const onJungleEast = this.isPlayerOnJungleEastPort();
    const onCollectorEast = this.isPlayerOnCollectorEastPort();
    const onCollectorWest = this.isPlayerOnCollectorWestPort();
    const onAshenEast = this.isPlayerOnAshenEastPort();
    const onAshenWest = this.isPlayerOnAshenWestPort();
    const onFrostWest = this.isPlayerOnFrostWestPort();
    const onFrostEast = this.isPlayerOnFrostEastPort();
    const cavePort = this.cavePortNearPlayer();

    let x: number;
    let waterL: number;
    let waterR: number;
    if (cavePort) {
      x = cavePort.boatX;
      waterL = cavePort.waterL;
      waterR = cavePort.waterR;
    } else if (onWest) {
      x = this.westDockEnd - 28;
      waterL = this.westWaterLeft;
      waterR = this.westWaterRight;
    } else if (onCollectorEast) {
      x = this.collectorEastDock + 28;
      waterL = this.reefLeft;
      waterR = this.westWaterRight;
    } else if (onCollectorWest) {
      x = this.collectorWestDock - 28;
      waterL = this.ashenRight;
      waterR = this.collectorLeft;
    } else if (onAshenEast) {
      x = this.ashenEastDock + 28;
      waterL = this.ashenRight;
      waterR = this.collectorLeft;
    } else if (onAshenWest) {
      x = this.ashenWestDock - 28;
      waterL = this.westWaterLeft;
      waterR = this.ashenLeft;
    } else if (onJungleWest) {
      x = this.jungleWestDockEnd - 28;
      waterL = this.eastWaterLeft;
      waterR = this.eastWaterRight;
    } else if (onJungleEast) {
      x = this.jungleEastDockEnd + 28;
      waterL = this.farWaterLeft;
      waterR = this.frostLeft;
    } else if (onFrostWest) {
      x = this.frostWestDock - 28;
      waterL = this.farWaterLeft;
      waterR = this.frostLeft;
    } else if (onFrostEast) {
      x = this.frostEastDock + 28;
      waterL = this.frostRight;
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
      waterR,
      boatId
    );
  }

  /** Equip Stellar Surfer + stand on a port + Q → board underfoot. */
  tryDeployStellarSurfer(): boolean {
    const ui = this.scene.get("UIScene") as UIScene;
    if (this.inventory.getEquippedRodId() !== "test_rod") return false;
    if (!this.inventory.canDeployStellarSurferBoat()) {
      ui.showToast(
        "Your Surfer is still DEFINED — ascend it with the Astral Warden first.",
        "#c9a0ff"
      );
      return true;
    }
    if (!this.isPlayerOnPort()) {
      ui.showToast("Stand on a port to ride the Stellar Surfer.", "#ffaa66");
      return true;
    }
    if (this.player.isOnBoat()) return false;
    if (this.fishing.isBusy() || this.fishing.state !== "idle") {
      ui.showToast("Finish fishing first.", "#ffaa66");
      return true;
    }
    if (this.sailboat?.occupied) {
      ui.showToast("Leave your current boat first.", "#ffaa66");
      return true;
    }
    this.spawnBoat("stellar_surfer");
    if (!this.sailboat) return true;
    this.sailboat.setDuckCosmetic(
      this.inventory.isRubberDuckSurferSkinActive()
    );
    this.sailboat.board(this.player);
    ui.showToast(
      "Stellar Surfer deployed! A/D to ride · LMB cast · F near port to dock",
      "#c9a0ff"
    );
    return true;
  }

  isRidingStellarSurfer(): boolean {
    return (
      this.player.isOnBoat() && this.sailboat?.boatId === "stellar_surfer"
    );
  }

  /** @deprecated use spawnBoat */
  spawnSailboat(): void {
    this.spawnBoat("sailboat");
  }

  buyBoat(boatId: BoatId): { ok: boolean; message: string } {
    const result = this.inventory.buyBoat(boatId);
    if (result.ok) this.persistSave();
    return result;
  }

  tryTalkToMerchant(): boolean {
    const ui = this.scene.get("UIScene") as UIScene;
    if (ui.isForgeOpen?.()) {
      ui.closeForge();
      return true;
    }
    if (ui.isCodeGuyOpen?.()) {
      return true;
    }
    if (this.player.isOnBoat()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.baitPlacementId) return false;

    const baitCrate = this.getNearBaitCrate();
    if (baitCrate) {
      return this.handleBaitCrateTalk(baitCrate);
    }

    if (
      this.codeGuy?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      return this.handleCodeGuyTalk();
    }

    if (this.tryLeaveStellarSky()) return true;

    if (
      this.stellarBeing &&
      (this.stellarBeing.talking ||
        this.stellarBeing.isNear(this.player.sprite.x, this.player.sprite.y))
    ) {
      return this.handleAstralWardenTalk();
    }

    if (
      this.cosmicHaberdasher &&
      (this.cosmicHaberdasher.talking ||
        this.cosmicHaberdasher.isNear(
          this.player.sprite.x,
          this.player.sprite.y
        ))
    ) {
      return this.handleCosmicHaberdasherTalk();
    }

    if (
      this.reefGuide.talking ||
      this.reefGuide.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      return this.reefGuide.interact();
    }

    if (
      this.frostHermit &&
      (this.frostHermit.talking ||
        this.frostHermit.isNear(this.player.sprite.x, this.player.sprite.y))
    ) {
      return this.handleHermitTalk();
    }

    if (
      this.ashenForgeNpc &&
      (this.ashenForgeNpc.talking ||
        this.ashenForgeNpc.isNear(
          this.player.sprite.x,
          this.player.sprite.y
        ))
    ) {
      return this.handleAshencastForgeTalk();
    }

    if (
      this.orePeddler &&
      (this.orePeddler.isNear(this.player.sprite.x, this.player.sprite.y) ||
        ui.isOreVendorOpen?.())
    ) {
      return this.handleOrePeddlerTalk();
    }

    if (
      this.appraiser &&
      (this.appraiser.isNear(this.player.sprite.x, this.player.sprite.y) ||
        ui.isAppraiserOpen?.())
    ) {
      return this.handleAppraiserTalk();
    }

    if (
      this.vaultKeeper &&
      (this.vaultKeeper.talking ||
        this.vaultKeeper.isNear(this.player.sprite.x, this.player.sprite.y))
    ) {
      return this.handleVaultKeeperTalk();
    }

    if (
      this.galleryCurator &&
      (this.galleryCurator.talking ||
        this.galleryCurator.isNear(
          this.player.sprite.x,
          this.player.sprite.y
        ))
    ) {
      return this.handleGalleryCuratorTalk();
    }

    if (
      this.shellSeeker &&
      (this.shellSeeker.talking ||
        this.shellSeeker.isNear(this.player.sprite.x, this.player.sprite.y))
    ) {
      return this.handleShellSeekerTalk();
    }

    for (const islandId of FISH_QUEST_ISLAND_IDS) {
      const npc = this.fishQuestNpcs[islandId];
      if (
        npc &&
        (npc.talking ||
          npc.isNear(this.player.sprite.x, this.player.sprite.y))
      ) {
        return this.handleFishQuestTalk(islandId);
      }
    }

    const tryOne = (m: FishMerchant) => {
      if (
        !m.talking &&
        !m.isNear(this.player.sprite.x, this.player.sprite.y)
      ) {
        return false;
      }
      const isCave = this.caveMerchants.includes(m);
      return m.interact(
        this.inventory.getSellableFishCount(),
        () => {
          const result = this.inventory.sellAllFish();
          if (isCave && result.earned > 0) {
            const gem = this.inventory.recordCaveMerchantSale(result.earned);
            if (gem) {
              ui.showToast(
                "A merchant slips you an Emerald Gem!",
                "#44ffaa"
              );
              this.refreshWorldGems();
              ui.refreshQuestTracker?.();
            }
          }
          ui.onCoinsChanged();
          this.persistSave();
          return result;
        },
        this.inventory.getKeptFishCount(),
        this.inventory.getSellableFishValue()
      );
    };

    // Prefer the merchant already in conversation, else first nearby
    const merchants = this.allFishMerchants();
    const talking = merchants.find((m) => m.talking);
    if (talking) return tryOne(talking);
    for (const m of merchants) {
      if (tryOne(m)) return true;
    }
    return false;
  }

  declineAnyMerchant(): void {
    for (const m of this.allFishMerchants()) m.decline();
    this.reefGuide.decline();
    this.frostHermit?.decline();
    this.vaultKeeper?.decline();
    this.galleryCurator?.decline();
    this.shellSeeker?.decline();
    for (const id of FISH_QUEST_ISLAND_IDS) {
      this.fishQuestNpcs[id]?.decline();
    }
    this.declineBargainers();
    this.stellarBeing?.decline();
    this.cosmicHaberdasher?.decline();
    this.ashenForgeNpc?.decline();
    this.orePeddler?.decline();
    this.appraiser?.decline();
  }

  private allFishMerchants(): FishMerchant[] {
    return [
      this.merchant,
      ...(this.jungleMerchant ? [this.jungleMerchant] : []),
      ...(this.ashenMerchant ? [this.ashenMerchant] : []),
      ...this.caveMerchants,
    ];
  }

  private anyFishMerchantTalking(): boolean {
    return this.allFishMerchants().some((m) => m.talking);
  }

  private nearFishMerchant(): FishMerchant | null {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    return this.allFishMerchants().find((m) => m.isNear(px, py)) ?? null;
  }

  /** Fish buyers on cave lands — Entrance, Vault (west port), Sanctum (west port). */
  private spawnCaveMerchants(): void {
    const stands: { name: string; tint: number; localX: number }[] = [
      { name: "Ice Broker", tint: 0xb8d0e8, localX: 520 },
      // Vault West Port (landX 6480) — stand just inland of the dock
      { name: "Gem Buyer", tint: 0xf0d8a0, localX: 6420 },
      // Sanctum Port (landX 8780)
      { name: "Sanctum Trader", tint: 0xa8e0f0, localX: 8720 },
    ];
    for (const s of stands) {
      const x = this.caveOriginX + s.localX;
      if (this.textures.exists("market_stand")) {
        this.add
          .image(x, this.groundY, "market_stand")
          .setOrigin(0.5, 1)
          .setDepth(9)
          .setTint(0xc8d8e8);
      }
      const m = new FishMerchant(this, x, this.groundY, s.name);
      m.sprite.setTint(s.tint);
      this.caveMerchants.push(m);
    }
  }

  private setupVaultGemQuest(): void {
    const ox = this.caveOriginX;
    const vaultMid = ox + VAULT_LAND_MID_LOCAL;
    this.vaultKeeper = new TalkNpc(
      this,
      vaultMid - 240,
      this.groundY,
      "Vault Keeper",
      ""
    );
    this.vaultKeeper.sprite.setTint(0xf0c878);

    this.vaultPedestalGems = [];
    for (let i = 0; i < VAULT_GEM_IDS.length; i++) {
      const gemId = VAULT_GEM_IDS[i];
      const px = vaultPedestalWorldX(ox, i);
      const img = this.add
        .image(px, this.groundY - 56, gemId)
        .setDisplaySize(28, 28)
        .setDepth(10)
        .setVisible(this.inventory.vaultGemsPlaced.includes(gemId));
      this.vaultPedestalGems.push(img);
      this.tweens.add({
        targets: img,
        y: this.groundY - 62,
        duration: 1400 + i * 90,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Yellow — Entrance Hall floor
    this.spawnWorldGem("gem_yellow", ox + 780, this.groundY - 18, false);
    // Red — floating in Abyss Reach
    this.spawnWorldGem(
      "gem_red",
      ox + (7780 + 8680) / 2,
      this.waterSurfaceY - 4,
      true
    );
    // Purple — Sanctum floor (full moon only)
    this.spawnWorldGem("gem_purple", ox + 9340, this.groundY - 16, false);
    this.refreshWorldGems();
  }

  private spawnWorldGem(
    gemId: VaultGemId,
    x: number,
    y: number,
    floating: boolean
  ): void {
    const root = this.add.container(x, y).setDepth(12);
    const glow = this.add
      .image(0, 0, gemId)
      .setDisplaySize(40, 40)
      .setTint(VAULT_GEM_COLORS[gemId])
      .setAlpha(0.35)
      .setBlendMode(Phaser.BlendModes.ADD);
    const gem = this.add.image(0, 0, gemId).setDisplaySize(30, 30);
    root.add([glow, gem]);
    root.setData("floating", floating);
    root.setData("gemId", gemId);
    this.worldGemRoots[gemId] = root;
  }

  private refreshWorldGems(): void {
    for (const gemId of VAULT_GEM_IDS) {
      const root = this.worldGemRoots[gemId];
      if (!root) continue;
      let show = this.inventory.isVaultGemAvailable(gemId);
      if (gemId === "gem_green" || gemId === "gem_blue") {
        show = false; // granted via sell / altar, not world props
      }
      if (gemId === "gem_purple") {
        show = show && this.weather?.weather === "fullmoon";
      }
      root.setVisible(!!show);
    }
    for (let i = 0; i < VAULT_GEM_IDS.length; i++) {
      const gemId = VAULT_GEM_IDS[i];
      const img = this.vaultPedestalGems[i];
      if (img) img.setVisible(this.inventory.vaultGemsPlaced.includes(gemId));
    }
  }

  private updateVaultGemFx(delta: number): void {
    this.redGemBob += delta * 0.004;
    const red = this.worldGemRoots.gem_red;
    if (red?.visible) {
      const bob = Math.sin(this.redGemBob) * 4;
      const gem = red.list[1] as Phaser.GameObjects.Image | undefined;
      const glow = red.list[0] as Phaser.GameObjects.Image | undefined;
      gem?.setY(bob);
      glow?.setY(bob);
      glow?.setAlpha(0.3 + Math.sin(this.redGemBob * 1.4) * 0.12);
    }
    // Purple may appear/disappear with the moon
    const purple = this.worldGemRoots.gem_purple;
    if (purple) {
      const show =
        this.inventory.isVaultGemAvailable("gem_purple") &&
        this.weather?.weather === "fullmoon";
      purple.setVisible(!!show);
    }
  }

  private setupShellSeeker(): void {
    // Entrance Hall — inland from Ice Broker
    const x = this.caveOriginX + 720;
    this.shellSeeker = new TalkNpc(
      this,
      x,
      this.groundY,
      "Shell Seeker",
      ""
    );
    this.shellSeeker.sprite.setTint(0xe8d0a0);
  }

  private handleFishQuestTalk(islandId: FishQuestIslandId): boolean {
    const npc = this.fishQuestNpcs[islandId];
    if (!npc) return false;
    if (npc.talking) {
      npc.decline();
      return true;
    }
    const ui = this.scene.get("UIScene") as UIScene;
    const result = this.inventory.talkFishQuest(islandId);
    npc.speak(result.text);
    if (result.toast) {
      ui.showToast(result.toast, result.toastColor ?? "#7ec8e8");
    }
    if (result.changed) {
      ui.onCoinsChanged();
      ui.refreshQuestTracker?.();
      this.persistSave();
    }
    return true;
  }

  private handleShellSeekerTalk(): boolean {
    if (!this.shellSeeker) return false;
    if (this.shellSeeker.talking) {
      this.shellSeeker.decline();
      return true;
    }
    const ui = this.scene.get("UIScene") as UIScene;
    if (this.inventory.nautilusQuestDone || this.inventory.ownsHat("hat_shell")) {
      this.shellSeeker.speak(
        "Thanks again for finding my nautilus!\n" +
          "That Shell Hat looks great on you."
      );
      return true;
    }
    const result = this.inventory.turnInNautilusForShellHat();
    this.shellSeeker.speak(result.message);
    if (result.ok) {
      ui.showToast("Unlocked Shell Hat!", "#e8c090");
      this.syncPlayerHat();
      this.persistSave();
    }
    return true;
  }

  private setupCrystalGalleryChallenge(): void {
    const ox = this.caveOriginX;
    // Center of Crystal Gallery (2680–4180) — crystals fan out left & right
    const galleryMid = ox + (2680 + 4180) / 2;
    this.galleryCurator = new TalkNpc(
      this,
      galleryMid,
      this.groundY,
      "Gallery Curator",
      ""
    );
    this.galleryCurator.sprite.setTint(0xe0b0ff);

    this.galleryChallenge = new CrystalGalleryChallenge(this);
    this.galleryChallenge.spawn(ox, this.groundY);
    this.galleryChallenge.setCallbacks({
      onProgress: (msg) => {
        const ui = this.scene.get("UIScene") as UIScene;
        ui.showToast(msg, "#c8b0ff");
      },
      onFail: (msg) => {
        const ui = this.scene.get("UIScene") as UIScene;
        ui.showToast(msg, "#ffaa66");
      },
      onComplete: () => {
        this.inventory.markCrystalGalleryChallengeDone();
        this.persistSave();
        const ui = this.scene.get("UIScene") as UIScene;
        ui.showToast(
          "Pattern complete! Talk to the Gallery Curator.",
          "#b8ffd0"
        );
        ui.showWeatherBanner("Crystal memory mastered!", "#e0b0ff");
      },
    });
  }

  private handleGalleryCuratorTalk(): boolean {
    if (!this.galleryCurator || !this.galleryChallenge) return false;
    if (this.galleryCurator.talking) {
      this.galleryCurator.decline();
      return true;
    }
    const ui = this.scene.get("UIScene") as UIScene;
    const inv = this.inventory;
    let text: string;

    if (this.galleryChallenge.isRunning()) {
      text = "Focus — watch the lights, then press them in order.";
    } else if (inv.crystalRodSkinOwned) {
      text =
        "That skin suits the Crystal Rod.\n" +
        "Toggle it anytime in your Equipment Bag.";
    } else if (inv.crystalGalleryChallengeDone) {
      const claim = inv.claimCrystalRodSkin();
      text =
        "Brilliant memory!\n" +
        "Here — a Crystal Rod skin from the gallery.\n" +
        "Equip the rod and tap Skin in your bag.";
      if (claim.ok) {
        ui.showToast(claim.message, "#e0b0ff");
        ui.onCoinsChanged();
        this.persistSave();
      }
    } else if (!inv.ownsRod("crystal_rod")) {
      text =
        "These gallery crystals remember patterns…\n" +
        "Bring a Crystal Rod if you want to try my challenge.\n" +
        "Win, and I'll paint a skin for your rod.";
    } else {
      text =
        "Ready for the crystal memory challenge?\n\n" +
        "Crystals will light in a growing sequence.\n" +
        "Repeat each pattern until you reach six.\n\n" +
        "Press the glowing crystals — begin!";
      this.galleryChallenge.start();
    }

    this.galleryCurator.speak(text);
    return true;
  }

  private handleVaultKeeperTalk(): boolean {
    if (!this.vaultKeeper) return false;
    if (this.vaultKeeper.talking) {
      this.vaultKeeper.decline();
      return true;
    }
    const ui = this.scene.get("UIScene") as UIScene;
    let text: string;
    if (this.inventory.ownsRod("crystal_rod")) {
      text =
        "The vault shines again thanks to you.\n" +
        "Keep that Crystal Rod — it holds the old magic.";
    } else if (this.inventory.allVaultGemsPlaced()) {
      text =
        "All five gems… the pedestals hum with power!\n" +
        "Take the Crystal Rod — you've earned it.";
      const reward = this.inventory.grantCrystalRodReward();
      if (reward.ok) {
        ui.showToast(reward.message, "#a8e8ff");
        this.syncPlayerCarriedRod();
        this.persistSave();
      }
      ui.refreshQuestTracker?.();
    } else if (!this.inventory.vaultGemQuestAccepted) {
      if (
        this.inventory.bestiaryFoundCount() <
        InventorySystem.VAULT_QUEST_BESTIARY_MIN
      ) {
        const have = this.inventory.bestiaryFoundCount();
        const need = InventorySystem.VAULT_QUEST_BESTIARY_MIN;
        text =
          "These pedestals once held five jewels…\n" +
          "but I won't trust just anyone with that search.\n\n" +
          `Discover ${need} fish in your bestiary first.\n` +
          `(${have}/${need} so far) Then come back.`;
      } else if (this.inventory.acceptVaultGemQuest()) {
        text =
          "I lost the gems — please find them for me!\n\n" +
          "Five jewels for five pedestals:\n" +
          "· Ruby floats in Abyss Reach\n" +
          "· Emerald from rich cave sales\n" +
          "· Sapphire from the Sanctum altar\n" +
          "· Topaz on the Entrance floor\n" +
          "· Amethyst under a full moon in the Sanctum\n\n" +
          "Bring each gem back and place it here.";
        this.refreshWorldGems();
        ui.refreshQuestTracker?.();
        this.persistSave();
      } else {
        text = "Hmm… come back later.";
      }
    } else {
      const found = this.inventory.vaultGemsFoundCount();
      const placed = this.inventory.vaultGemsPlaced.length;
      text =
        "Still hunting those jewels?\n\n" +
        `Found ${found}/5 · Seated ${placed}/5.\n` +
        "Check your quest list — and return each gem\n" +
        "to its pedestal when you have it.";
    }
    this.vaultKeeper.speak(text);
    return true;
  }

  /** Pick up world gems, pay Sanctum altar, or seat gems on pedestals. */
  tryVaultGemInteract(): boolean {
    if (this.fishing.isBusy()) return false;
    if (!this.inventory.vaultGemQuestAccepted) return false;
    const ui = this.scene.get("UIScene") as UIScene;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Pedestals (land only)
    if (!this.player.isOnBoat()) {
      for (let i = 0; i < VAULT_GEM_IDS.length; i++) {
        const gemId = VAULT_GEM_IDS[i];
        const pedX = vaultPedestalWorldX(this.caveOriginX, i);
        if (Math.abs(px - pedX) > 48) continue;
        if (Math.abs(py - (this.groundY - 20)) > 80) continue;
        if (this.inventory.vaultGemsPlaced.includes(gemId)) {
          ui.showToast(
            `${VAULT_GEM_NAMES[gemId]} already rests here.`,
            "#c8d8e8"
          );
          return true;
        }
        if (!this.inventory.hasItem(gemId)) {
          ui.showToast(
            `Need the ${VAULT_GEM_NAMES[gemId]} for this pedestal.`,
            "#ffaa66"
          );
          return true;
        }
        if (!this.inventory.placeVaultGem(gemId)) return true;
        this.refreshWorldGems();
        ui.showToast(`Seated the ${VAULT_GEM_NAMES[gemId]}.`, "#ffe8a0");
        if (this.inventory.allVaultGemsPlaced()) {
          const reward = this.inventory.grantCrystalRodReward();
          if (reward.ok) {
            ui.showToast(reward.message, "#a8e8ff");
            this.syncPlayerCarriedRod();
          }
        }
        ui.refreshQuestTracker?.();
        this.persistSave();
        return true;
      }

      // Sanctum altar — pay 4k for sapphire
      const sanctumMid = this.caveOriginX + (8680 + 9800) / 2;
      if (
        Math.abs(px - sanctumMid) < 70 &&
        this.inventory.isVaultGemAvailable("gem_blue")
      ) {
        if (this.inventory.coins < VAULT_BLUE_ALTAR_COST) {
          ui.showToast(
            `The Sanctum altar asks for $${VAULT_BLUE_ALTAR_COST}.`,
            "#ffaa66"
          );
          return true;
        }
        this.inventory.coins -= VAULT_BLUE_ALTAR_COST;
        if (!this.inventory.addItem("gem_blue")) {
          this.inventory.coins += VAULT_BLUE_ALTAR_COST;
          ui.showToast("Your bag is full.", "#ffaa66");
          return true;
        }
        ui.onCoinsChanged();
        ui.showToast("The altar grants a Sapphire Gem!", "#66aaff");
        this.refreshWorldGems();
        ui.refreshQuestTracker?.();
        this.persistSave();
        return true;
      }
    }

    // World pickups (yellow / purple on land; red from boat or shore)
    for (const gemId of ["gem_yellow", "gem_purple", "gem_red"] as VaultGemId[]) {
      const root = this.worldGemRoots[gemId];
      if (!root?.visible) continue;
      const reach = gemId === "gem_red" ? 110 : 70;
      const near = Phaser.Math.Distance.Between(px, py, root.x, root.y) < reach;
      const boatNear =
        gemId === "gem_red" &&
        this.player.isOnBoat() &&
        this.sailboat &&
        Phaser.Math.Distance.Between(
          this.sailboat.hull.x,
          this.sailboat.hull.y,
          root.x,
          root.y
        ) < reach;
      if (!near && !boatNear) continue;
      if (!this.inventory.isVaultGemAvailable(gemId)) continue;
      if (!this.inventory.addItem(gemId)) {
        ui.showToast("Your bag is full.", "#ffaa66");
        return true;
      }
      this.refreshWorldGems();
      ui.showToast(`Found the ${VAULT_GEM_NAMES[gemId]}!`, "#ffe8a0");
      ui.refreshQuestTracker?.();
      this.persistSave();
      return true;
    }

    return false;
  }

  /** Ashencast Forge Keeper — anvil repair quest. */
  private handleAshencastForgeTalk(): boolean {
    if (!this.ashenForgeNpc) return false;
    if (this.ashenForgeNpc.talking) {
      this.ashenForgeNpc.decline();
      return true;
    }

    const ui = this.scene.get("UIScene") as UIScene;
    const inv = this.inventory;
    let text = "";

    if (inv.ashencastQuestStage === 0) {
      inv.startAshencastQuest();
      text =
        "Could you fix the anvil?\n" +
        "It's in three pieces — scattered far and wide.\n\n" +
        "Find the anvil pieces and bring them back.";
      ui.showToast("Quest started: Find the anvil pieces", "#ffaa88");
      this.refreshAnvilOceanFloater();
      this.curioStock?.forceRestock(Date.now());
      this.syncCurioStockToInventory();
    } else if (inv.ashencastQuestStage === 1) {
      if (inv.turnInAnvilPieces()) {
        text =
          "You've gathered every shard — the frame is whole.\n\n" +
          "Now I need an Ashencast Trout from the hotsprings.\n" +
          "Bring me one and I'll finish the forge.";
        ui.showToast("Quest: Catch an Ashencast Trout", "#7a8cff");
        this.refreshAnvilOceanFloater();
        this.refreshAshencastHotspringFish();
      } else {
        text =
          "Find the anvil pieces.\n" +
          `${inv.ashencastQuestProgressLabel()}\n\n` +
          "· Curio Trader stocks one ($5.6k)\n" +
          "· One drifts on the ocean surface\n" +
          "· One sits in the amulet cave ($5k)";
      }
    } else if (inv.ashencastQuestStage === 2) {
      if (inv.turnInAshencastTrout()) {
        text =
          "The trout's heat seals the metal…\n" +
          "The anvil is fixed!\n\n" +
          "Use the forge to craft the Tranquil Rod.";
        ui.showToast("Ashencast Forge unlocked!", "#7CFC00");
        this.ashenBuildAnvil?.();
      } else {
        text =
          "I still need an Ashencast Trout.\n" +
          "They haunt the Ashencast hotsprings.";
      }
    } else {
      text =
        "The anvil rings true.\n" +
        "Approach the forge to craft your rods.";
      this.openAshencastForge();
    }

    this.ashenForgeNpc.speak(text);
    this.persistSave();
    ui.refreshQuestTracker?.();
    return true;
  }

  private handleOrePeddlerTalk(): boolean {
    if (!this.orePeddler) return false;
    const ui = this.scene.get("UIScene") as UIScene;
    if (ui.isOreVendorOpen()) {
      ui.closeOreVendor();
      return true;
    }
    if (!this.orePeddler.isNear(this.player.sprite.x, this.player.sprite.y)) {
      return false;
    }
    ui.openOreVendor();
    return true;
  }

  private handleAppraiserTalk(): boolean {
    if (!this.appraiser) return false;
    const ui = this.scene.get("UIScene") as UIScene;
    if (ui.isAppraiserOpen()) {
      ui.closeAppraiser();
      return true;
    }
    if (!this.appraiser.isNear(this.player.sprite.x, this.player.sprite.y)) {
      return false;
    }
    ui.openAppraiser();
    return true;
  }

  private spawnBaitCrate(x: number, islandName: string): void {
    this.baitCrates.push(new BaitCrate(this, x, this.groundY, islandName));
  }

  private getNearBaitCrate(): BaitCrate | null {
    for (const crate of this.baitCrates) {
      if (crate.isNear(this.player.sprite.x, this.player.sprite.y)) {
        return crate;
      }
    }
    return null;
  }

  tryBaitCrateTalk(): boolean {
    const crate = this.getNearBaitCrate();
    if (!crate) return false;
    return this.handleBaitCrateTalk(crate);
  }

  private handleBaitCrateTalk(crate: BaitCrate): boolean {
    const ui = this.scene.get("UIScene") as UIScene;
    if (ui.isBaitVendorOpen()) {
      ui.closeBaitVendor();
      return true;
    }
    if (!crate.isNear(this.player.sprite.x, this.player.sprite.y)) {
      return false;
    }
    ui.openBaitVendor(crate.islandName);
    return true;
  }

  private getBaitCastBounds() {
    return {
      westWaterLeft: this.westWaterLeft,
      ashenLeft: this.ashenLeft,
      ashenRight: this.ashenRight,
      collectorLeft: this.collectorLeft,
      collectorRight: this.collectorRight,
      ashenSpringALeft: this.ashenSpringALeft,
      ashenSpringARight: this.ashenSpringARight,
      ashenSpringBLeft: this.ashenSpringBLeft,
      ashenSpringBRight: this.ashenSpringBRight,
      reefLeft: this.reefLeft,
      reefBlendEnd: this.reefBlendEnd,
      westWaterRight: this.westWaterRight,
      islandLeft: this.islandLeft,
      islandRight: this.islandRight,
      eastWaterLeft: this.eastWaterLeft,
      eastWaterRight: this.eastWaterRight,
      jungleLeft: this.jungleLeft,
      jungleRight: this.jungleRight,
      farWaterLeft: this.farWaterLeft,
      frostLeft: this.frostLeft,
      frostRight: this.frostRight,
      farWaterRight: this.farWaterRight,
      pondLeft: this.pondLeft,
      pondRight: this.pondRight,
      caveZones:
        this.inFrostpeakCave && this.caveWaters.length > 0
          ? this.caveWaters.map((w) => ({ left: w.left, right: w.right }))
          : undefined,
    };
  }

  tryUseBait(baitId: ItemId): boolean {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    if (this.baitPlacementId) {
      ui?.showToast("Already placing bait.", "#ffaa66");
      return false;
    }
    if (this.fishing.isBusy()) {
      ui?.showToast("Finish fishing first.", "#ffaa66");
      return false;
    }
    const check = this.inventory.canStartBaitUse(baitId);
    if (!check.ok) {
      ui?.showToast(check.message, "#ffaa66");
      return false;
    }
    this.baitPlacementId = baitId;
    this.baitMarker = new BaitPlacementMarker(this);
    ui?.showToast(
      `Place ${ITEMS[baitId].name} — LMB in water · X/Esc cancel`,
      "#7ec8ff"
    );
    return true;
  }

  cancelBaitPlacement(): void {
    if (!this.baitPlacementId) return;
    this.baitPlacementId = null;
    this.baitMarker?.destroy();
    this.baitMarker = null;
  }

  private getBaitZoneTopY(): number {
    return this.waterSurfaceY + GameScene.BAIT_PLACEMENT_TOP_OFFSET;
  }

  private tryConfirmBaitCast(worldX: number): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    const baitId = this.baitPlacementId;
    if (!baitId) return;

    const bounds = this.getBaitCastBounds();
    const halfW = (this.baitMarker?.boxW ?? 280) / 2;
    const castZone = resolveBaitCastZone(worldX, halfW, bounds);
    if (!castZone) {
      ui?.showToast("Cast bait in fishable water.", "#ff8866");
      return;
    }

    if (getBaitAttractsForHabitat(baitId, castZone.habitat).length === 0) {
      ui?.showToast("This bait doesn't work here.", "#ff8866");
      return;
    }

    const spawnPad =
      castZone.habitat === "pond" || castZone.habitat === "hotspring"
        ? 16
        : 24;
    const spawnLeft = castZone.left + spawnPad;
    const spawnRight = castZone.right - spawnPad;
    const spawnPool = getBaitSpawnPool(
      baitId,
      castZone.habitat,
      this.getBaitJunkExcludeInZone(spawnLeft, spawnRight)
    );
    if (spawnPool.length === 0) {
      ui?.showToast("That junk is already floating nearby.", "#ff8866");
      return;
    }

    const used = this.inventory.useBait(baitId);
    if (!used.ok) {
      ui?.showToast(used.message, "#ff8866");
      this.cancelBaitPlacement();
      return;
    }

    this.spawnBaitFishBurst(baitId, castZone);
    ui?.showToast(used.message, "#7CFC00");
    this.persistSave();
    this.cancelBaitPlacement();
  }

  private getBaitJunkExcludeInZone(left: number, right: number): ItemId[] {
    const junkIds: ItemId[] = [
      "mushroom_cluster",
      "ore_cluster",
      "driftwood",
    ];
    return junkIds.filter((id) =>
      this.fishList.some(
        (f) =>
          f.speciesId === id && f.sprite.x >= left && f.sprite.x <= right
      )
    );
  }

  private spawnBaitFishBurst(baitId: ItemId, castZone: BaitCastZone): void {
    const narrow =
      castZone.habitat === "pond" || castZone.habitat === "hotspring";
    const patrolPad = narrow ? 16 : 24;
    const left = castZone.left + patrolPad;
    const right = castZone.right - patrolPad;
    if (right - left < 40) return;
    const zoneTop = this.getBaitZoneTopY();
    const zoneBottom = zoneTop + (this.baitMarker?.boxH ?? 100);
    const getLuck = () =>
      this.weather
        ? this.weather.getLuck(
            this.inventory.getFishingStats().luck,
            this.inventory.getEquippedRodId()
          )
        : this.inventory.getFishingStats().luck;
    const getExcludeSpecies = (self: Fish): ItemId[] =>
      this.getBaitJunkExcludeInZone(left, right).filter((id) =>
        this.fishList.some((f) => f !== self && f.speciesId === id)
      );
    const speciesPool = getBaitSpawnPool(
      baitId,
      castZone.habitat,
      getExcludeSpecies({} as Fish)
    );
    if (speciesPool.length === 0) return;
    const getIsRainy = () => this.weather?.isRainy() ?? false;
    const getIsSunny = () => this.weather?.weather === "sunny";
    const count = Phaser.Math.Between(2, 3);

    for (let i = 0; i < count; i++) {
      const speciesId = Phaser.Utils.Array.GetRandom(speciesPool);
      const x = Phaser.Math.Between(left + 20, right - 20);
      const y = Phaser.Math.Between(zoneTop + 24, zoneBottom - 24);
      const fish = new Fish(
        this,
        x,
        y,
        left,
        right,
        this.waterSurfaceY,
        getLuck,
        castZone.habitat,
        speciesId,
        getExcludeSpecies,
        getIsRainy,
        { lockSpecies: true },
        getIsSunny
      );
      this.fishList.push(fish);
    }
  }

  private updateBaitPlacement(delta: number): void {
    if (!this.baitPlacementId || !this.baitMarker) return;
    const pointer = this.input.activePointer;
    const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
    const bounds = this.getBaitCastBounds();
    const halfW = this.baitMarker.boxW / 2;
    const valid = isBaitCastZone(worldX, halfW, bounds);
    this.baitMarker.update(
      worldX,
      this.getBaitZoneTopY(),
      valid,
      delta / 1000
    );
  }

  private openAshencastForge(): void {
    if (!this.inventory.isAshencastForgeReady()) return;
    const ui = this.scene.get("UIScene") as UIScene;
    this.player.setLocked(true);
    ui.openForge(() => {
      this.player.setLocked(false);
    });
  }

  /** Code Guy — promo code rewards on starter island. */
  private handleCodeGuyTalk(): boolean {
    if (!this.codeGuy) return false;
    const ui = this.scene.get("UIScene") as UIScene;
    if (ui.isCodeGuyOpen()) return true;
    this.player.setLocked(true);
    ui.openCodeGuy(() => {
      this.player.setLocked(false);
    });
    return true;
  }

  /** Astral Warden — Star Line + Stellar Surfer quests. */
  private handleAstralWardenTalk(): boolean {
    if (!this.stellarBeing) return false;
    if (this.stellarBeing.talking) {
      this.stellarBeing.decline();
      return true;
    }

    const greet =
      ASTRAL_WARDEN_LINES.greet[
        Math.floor(Math.random() * ASTRAL_WARDEN_LINES.greet.length)
      ];

    this.stellarBeing.speakWithMenu(
      `${greet}\n\nWhat blank do you seek among the lunar tides?`,
      [
        {
          label: "Star Line",
          hotkey: "1",
          fill: 0x2a2048,
          stroke: 0xc9a0ff,
          onClick: () => this.handleAstralStarlineOption(),
        },
        {
          label: "Surfer",
          hotkey: "2",
          fill: 0x1a3050,
          stroke: 0x7ec8e8,
          onClick: () => this.handleAstralSurferOption(),
        },
        {
          label: "No",
          hotkey: "X",
          fill: 0x3a2a2a,
          stroke: 0xffaa66,
          onClick: () => {
            this.stellarBeing?.speak(ASTRAL_WARDEN_LINES.farewell);
          },
        },
      ]
    );
    return true;
  }

  private handleAstralStarlineOption(): void {
    if (!this.stellarBeing) return;
    const ui = this.scene.get("UIScene") as UIScene;
    const result = this.inventory.tryTurnInAstralStarline();
    if (result.message === "already") {
      this.stellarBeing.speak(ASTRAL_WARDEN_LINES.alreadyHasStarline);
    } else if (result.ok) {
      this.stellarBeing.speak(ASTRAL_WARDEN_LINES.starlineDone);
      ui.showToast("Star Line Rod forged from starlight!", "#c9a0ff");
      this.persistSave();
      ui.refreshQuestTracker?.();
    } else {
      const list = formatQuestIngredientChecklist(
        this.inventory,
        ASTRAL_STARLINE_COST
      );
      this.stellarBeing.speak(
        `${ASTRAL_WARDEN_LINES.starlineStart}\n\nYour tribute:\n${list}`
      );
    }
  }

  private handleAstralSurferOption(): void {
    if (!this.stellarBeing) return;
    const ui = this.scene.get("UIScene") as UIScene;
    const inv = this.inventory;

    if (!inv.ownsRod("star_line_rod") && !inv.astralStarlineDone) {
      this.stellarBeing.speak(ASTRAL_WARDEN_LINES.needStarlineFirst);
      return;
    }

    if (inv.astralSurferQuestStage === 0) {
      inv.startAstralSurferQuest();
      this.stellarBeing.speak(ASTRAL_WARDEN_LINES.surferStart);
      ui.showToast("Astral quest: Catch any Starlight fish", "#c9a0ff");
      this.persistSave();
      ui.refreshQuestTracker?.();
      return;
    }

    if (inv.astralSurferQuestStage >= 8) {
      this.stellarBeing.speak(ASTRAL_WARDEN_LINES.surferComplete);
      return;
    }

    const adv = inv.tryAdvanceAstralSurferFromTalk();
    if (adv.messageKey === "wait") {
      this.stellarBeing.speak(this.astralSurferWaitSpeech());
      return;
    }

    const key = adv.messageKey as keyof typeof ASTRAL_WARDEN_LINES;
    const raw = ASTRAL_WARDEN_LINES[key];
    const text =
      typeof raw === "function"
        ? raw(inv.astralSurferCatchCount)
        : typeof raw === "string"
          ? raw
          : this.astralSurferWaitSpeech();
    this.stellarBeing.speak(text);

    if (adv.grantedDefined) {
      ui.showToast("DEFINED Stellar Surfer granted!", "#c9a0ff");
    }
    if (adv.ascended) {
      ui.showToast("UNDEFINED Stellar Surfer — boat unlocked!", "#7CFC00");
    }
    this.persistSave();
    ui.refreshQuestTracker?.();
  }

  private astralSurferWaitSpeech(): string {
    const inv = this.inventory;
    const stage = inv.astralSurferQuestStage;
    const list = astralSurferObjectiveList(
      inv,
      stage as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    );
    switch (stage) {
      case 1:
        return `${ASTRAL_WARDEN_LINES.surferStage1Wait}\n\n${list}`;
      case 2:
        return `${ASTRAL_WARDEN_LINES.surferStage2Wait}\n\n${list}`;
      case 3:
        return `${ASTRAL_WARDEN_LINES.surferStage3Need}\n\n${list}`;
      case 4:
        return `${ASTRAL_WARDEN_LINES.surferStage4Need}\n\n${list}`;
      case 5:
        return `${ASTRAL_WARDEN_LINES.surferStage5Wait(inv.astralSurferCatchCount)}\n\n${list}`;
      case 6:
        return `${ASTRAL_WARDEN_LINES.surferStage6Wait}\n\n${list}`;
      case 7:
        return `${ASTRAL_WARDEN_LINES.surferStage7Need}\n\n${list}`;
      default:
        return ASTRAL_WARDEN_LINES.farewell;
    }
  }

  /** Frostpeak Hermit 3-stage cave quest. */
  private handleHermitTalk(): boolean {
    if (!this.frostHermit) return false;
    if (this.frostHermit.talking) {
      this.frostHermit.decline();
      return true;
    }

    const ui = this.scene.get("UIScene") as UIScene;
    const inv = this.inventory;
    let text = "";

    if (inv.frostpeakQuestStage === 0) {
      inv.startFrostpeakQuest();
      text =
        "See that boarded cave? Inside there's jewelry,\n" +
        "crystals, and glittering treasure from the old days.\n" +
        "I've kept it sealed for years.\n\n" +
        "Want in? Prove yourself.\n" +
        "Quest 1: Bring me an Earthly or Sprout Angelfish.\n" +
        "Any size will do.";
      ui.showToast("Quest started: Earthly/Sprout Angelfish", "#a8d8ff");
    } else if (inv.frostpeakQuestStage === 1) {
      if (inv.turnInFrostpeakAngelfish()) {
        text =
          "Aye… that'll do. Quest one done.\n\n" +
          "Quest 2: Catch an Epic with Amber, Firm,\n" +
          "Wildflower, and Augment — and a Legendary\n" +
          "with the Wildflower Rod.\n" +
          "Come back when you're done.";
        ui.showToast("Quest 2: Epics + Wildflower Legendary", "#a8d8ff");
      } else {
        text =
          "Still need an Earthly or Sprout Angelfish.\n" +
          "Size doesn't matter — just the mutation.";
      }
    } else if (inv.frostpeakQuestStage === 2) {
      if (inv.advanceFrostpeakEpicQuestIfDone()) {
        text =
          "You've mastered those rods. Quest two done.\n\n" +
          "Quest 3: Bring a Mythical fish worth more than $4000.\n" +
          "It must be sellable — not favorited.\n" +
          "Prove you're worthy — then I'll open the cave.";
        ui.showToast("Quest 3: Sellable Mythical > $4000", "#a8d8ff");
      } else {
        text =
          "Quest 2 progress:\n" +
          inv.frostpeakEpicProgressLabel();
      }
    } else if (inv.frostpeakQuestStage === 3) {
      if (inv.turnInFrostpeakMythical()) {
        this.openFrostpeakCave();
        text =
          "You've proven worthy.\n" +
          "The boards come down — the cave is open.";
        ui.showToast("Frostpeak Cave opened!", "#7CFC00");
      } else {
        text =
          "Bring me a Mythical fish worth more than $4000.\n" +
          "Unfavorited / sellable only — favorites don't count.";
      }
    } else {
      text =
        "The boards are gone.\n" +
        "Go claim those crystals and jewels — you've earned them.";
    }

    this.frostHermit.speak(text);
    this.persistSave();
    ui.refreshQuestTracker?.();
    return true;
  }

  private openFrostpeakCave(): void {
    if (!this.frostCaveBoards) return;
    const boards = this.frostCaveBoards;
    this.frostCaveBoards = undefined;
    this.tweens.add({
      targets: boards,
      alpha: 0,
      y: boards.y + 20,
      duration: 900,
      ease: "Quad.easeIn",
      onComplete: () => boards.destroy(true),
    });
  }

  /** Called after a successful catch — Frostpeak quest 2 + hat unlocks. */
  onCatchCompleteForQuests(
    caughtList?: { speciesId: ItemId; mutation?: FishMutationId | null }[]
  ): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    const list = caughtList ?? this.fishing.lastCaughtFish;
    const rodId = this.inventory.getEquippedRodId();

    for (const caught of list) {
      if (
        caught.speciesId === "yellowfin_tuna" &&
        this.inventory.unlockHat("hat_yellowfin")
      ) {
        ui?.showToast("Unlocked Yellowfin Hat!", "#f0c830");
        this.persistSave();
      }

      const astral = this.inventory.recordAstralCatch({
        speciesId: caught.speciesId,
        mutation: caught.mutation ?? null,
        rodId,
      });
      if (astral.toast) {
        ui?.showToast(astral.toast, "#c9a0ff");
        this.persistSave();
      }
    }

    this.refreshAnvilOceanFloater();
    ui?.refreshQuestTracker?.();

    if (this.inventory.frostpeakQuestStage !== 2) return;
    let any = false;
    for (const caught of list) {
      const rarity = ITEMS[caught.speciesId]?.rarity;
      if (this.inventory.recordFrostpeakEpicCatch(rodId, rarity)) {
        any = true;
        ui?.showToast(
          `Hermit quest: Epic with ${rodDisplayName(rodId)}!`,
          "#c8b0ff"
        );
      }
      if (this.inventory.recordFrostpeakWildflowerLegendary(rodId, rarity)) {
        any = true;
        ui?.showToast(
          "Hermit quest: Legendary with Wildflower!",
          "#c8b0ff"
        );
      }
    }
    if (!any) return;
    if (this.inventory.frostpeakQuest2Complete()) {
      ui?.showToast(
        "Quest 2 done — return to the Hermit!",
        "#7CFC00"
      );
    }
    ui?.refreshQuestTracker?.();
    this.persistSave();
  }

  declineBargainers(): void {
    this.fishCollector?.decline();
    this.curioTrader?.decline();
  }

  tryOpenBargain(): boolean {
    if (this.player.isOnBoat()) return false;
    if (this.fishing.isBusy()) return false;
    const ui = this.scene.get("UIScene") as UIScene;
    if (ui.isBargainOpen()) return true;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    if (this.fishCollector?.isNear(px, py)) {
      this.fishCollector.showBubble("Got fish? Name your price.", () => {
        ui.closeBargain();
      });
      ui.openBargain("fish_buy", this.fishCollector.name);
      return true;
    }
    if (this.curioTrader?.isNear(px, py)) {
      const empty = this.curioStock.isEmpty();
      this.curioTrader.showBubble(
        empty
          ? "Stall's empty for now — check back later."
          : "Rarities and curios. Name your offer.",
        () => {
          ui.closeBargain();
        }
      );
      ui.openBargain("curio_sell", this.curioTrader.name);
      return true;
    }
    return false;
  }

  completeBargainDeal(session: BargainSession, price: number): void {
    const ui = this.scene.get("UIScene") as UIScene;
    if (session.kind === "fish_buy") {
      const result = this.inventory.sellFishUnitAtPrice(session.slot, price);
      ui.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
      this.fishCollector?.clearBubble();
    } else {
      const entry = this.curioStock.getEntry(session.stockId);
      if (!entry) {
        ui.showToast("That curio was already sold.", "#ffaa66");
        this.curioTrader?.clearBubble();
      } else {
        const result = this.inventory.buyCurioAtPrice(
          {
            kind: entry.kind,
            itemId: entry.itemId,
            mutation: entry.kind === "fish" ? entry.mutation : null,
            size: entry.kind === "fish" ? entry.size : null,
          },
          price
        );
        if (result.ok) {
          this.curioStock.remove(session.stockId);
          this.syncCurioStockToInventory();
        }
        ui.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
        this.curioTrader?.clearBubble();
      }
    }
    ui.onCoinsChanged();
    this.persistSave();
    ui.refreshQuestTracker?.();
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

  /**
   * Silent secret: jump + F by the tall tree just east of the pond
   * briefly disables ground collision so you can fall through.
   */
  trySecretFallThrough(): boolean {
    if (!this.groundCollider) return false;
    if (this.time.now < this.secretFallReadyAt) return false;
    if (this.player.isOnBoat() || this.player.isFishingAnim()) return false;
    if (this.fishing.isBusy()) return false;
    if (Math.abs(this.player.sprite.x - this.secretFallTreeX) > 52) {
      return false;
    }
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) return false;

    this.groundCollider.active = false;
    this.secretFallReadyAt = this.time.now + 1100;
    this.time.delayedCall(1000, () => {
      if (this.groundCollider) this.groundCollider.active = true;
    });
    return true;
  }

  tryBuyWildflowerRod(): boolean {
    const ui = this.scene.get("UIScene") as UIScene;
    if (this.fishing.isBusy()) return false;
    if (this.anyFishMerchantTalking()) return false;

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
        this.syncPlayerCarriedRod();
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
      this.syncPlayerCarriedRod();
      if (this.inventory.ownsHat("hat_gem")) {
        ui.showToast("Unlocked Gem Halo!", "#44ffaa");
        this.syncPlayerHat();
      }
      this.persistSave();
    }
    return true;
  }

  tryBoardOrExitBoat(): boolean {
    const ui = this.scene.get("UIScene") as UIScene;
    if (this.anyFishMerchantTalking()) return false;
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
      else if (this.isBoatNearCollectorEastPort())
        landX = this.collectorRight - 60;
      else if (this.isBoatNearCollectorWestPort())
        landX = this.collectorLeft + 60;
      else if (this.isBoatNearAshenEastPort()) landX = this.ashenRight - 60;
      else if (this.isBoatNearAshenWestPort()) landX = this.ashenLeft + 60;
      else if (this.isBoatNearJungleWestPort()) {
        this.zoneLoader.forceLoad("swamp");
        landX = this.jungleLeft + 50;
      } else if (this.isBoatNearJungleEastPort()) {
        this.zoneLoader.forceLoad("swamp");
        landX = this.jungleRight - 50;
      } else if (this.isBoatNearFrostWestPort()) landX = this.frostLeft + 60;
      else if (this.isBoatNearFrostEastPort()) landX = this.frostRight - 60;
      else if (this.isBoatNearEastPort()) landX = this.dockEnd - 40;
      else {
        const cp = this.cavePortNearBoat();
        if (cp) landX = cp.landX;
      }

      this.sailboat.disembark(this.player, landX, this.groundY);
      const leftName = this.sailboat.def.name;
      const wasStellar = this.sailboat.boatId === "stellar_surfer";
      if (wasStellar) {
        this.sailboat.destroy();
        this.sailboat = null;
      }
      ui.showToast(
        wasStellar
          ? "Stellar Surfer back in hand."
          : `Left the ${leftName}.`,
        "#c8c8c8"
      );
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
      ui.showToast(`Get closer to the ${this.sailboat.def.name}.`, "#ffaa66");
      return false;
    }

    this.sailboat.board(this.player);
    const driveHint = this.sailboat.def.hasSail
      ? "A/D to sail · F near port to exit"
      : "A/D to drive · F near port to exit";
    ui.showToast(driveHint, "#7ec8e3");
    return true;
  }

  private createBackground(): void {
    const worldLeft = this.westWaterLeft;
    const worldWidth = this.caveEndX - worldLeft + 80;
    const skyH = this.waterSurfaceY + 8;
    // World-space sky so it scrolls away when the camera dives underwater
    const sky = this.add.graphics().setDepth(-2);
    sky.fillGradientStyle(0x5eb0e0, 0x5eb0e0, 0xd4effc, 0xd4effc, 1);
    sky.fillRect(worldLeft, 0, worldWidth, skyH);

    const sunX = 160;
    const sunY = 90;
    const sun = this.add.container(sunX, sunY).setDepth(-1);
    sun.add([
      this.add.circle(0, 0, 58, 0xfff6c8, 0.35),
      this.add.circle(0, 0, 38, 0xffe566, 1),
      this.add.circle(0, 0, 28, 0xfff8e0, 0.95),
      this.add.circle(-8, -7, 11, 0xffffff, 0.75),
    ]);

    const moon = this.add.container(400, 100).setDepth(-1).setVisible(false);
    moon.add([
      this.add.circle(0, 0, 40, 0xc8d0e8, 0.2),
      this.add.circle(0, 0, 28, 0xe8eef8, 0.95),
      this.add.circle(8, -4, 22, 0x0a1228, 0.55), // crescent cut
      this.add.circle(-6, 4, 4, 0xd0d8e8, 0.35),
      this.add.circle(4, 8, 3, 0xd0d8e8, 0.3),
    ]);

    this.skyVisual = {
      sky,
      sun,
      moon,
      sunX,
      sunY,
      worldLeft,
      worldWidth,
      skyH,
    };
  }

  private addIslandBedrock(
    left: number,
    right: number,
    lushFringe: boolean,
    surfaceY = this.groundY + 32
  ): void {
    const islandW = right - left;
    const bedrock = this.add.graphics().setDepth(2);
    const underTop = surfaceY;
    const underBottom = this.groundY + 420;
    const underH = Math.max(80, underBottom - underTop);

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
      const y = underTop + Phaser.Math.Between(160, Math.max(170, underH - 10));
      bedrock.fillStyle(
        Phaser.Math.RND.pick([0x6a6560, 0x3a3632, 0x2a2826, 0x7a756e]),
        0.9
      );
      bedrock.fillRect(x, y, Phaser.Math.Between(2, 6), Phaser.Math.Between(2, 5));
    }

    bedrock.fillStyle(lushFringe ? 0x1e6b32 : 0x4a9344);
    for (let x = left; x < right; x += 6) {
      bedrock.fillRect(x, underTop - 4, 3, Phaser.Math.Between(3, 7));
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
  }

  private createJungleTerrain(): void {
    const left = this.jungleLeft;
    const right = this.jungleRight;
    const gy = this.groundY;
    const pl = this.pondLeft;
    const pr = this.pondRight;

    // Solid floor plate (pond stays open water; prevents tile-gap falls)
    const floor = this.add.graphics().setDepth(2.4);
    floor.fillStyle(0x4a6828, 1);
    if (pl > left) {
      floor.fillRect(left, gy - 14, pl - left, 50);
    }
    if (pr < right) {
      floor.fillRect(pr, gy - 14, right - pr, 50);
    }
    floor.fillStyle(0x3d5820, 1);
    floor.fillRect(pl - 10, gy - 10, 12, 28);
    floor.fillRect(pr - 2, gy - 10, 12, 28);

    for (let x = left; x < left + 64; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    for (let x = left + 64; x < pl; x += 32) {
      const variant = Math.floor(x / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        this.groundY + 16,
        `swamp_grass_${variant}`
      );
      tile.refreshBody();
    }
    for (let x = pr; x < right - 64; x += 32) {
      const variant = Math.floor(x / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        this.groundY + 16,
        `swamp_grass_${variant}`
      );
      tile.refreshBody();
    }
    for (let x = right - 64; x < right; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    this.addIslandBedrock(left, right, true);
  }

  /** Flat walkable strip — same collision model as Starter / Swamp (no floating platforms). */
  private createCollectorsTerrain(): void {
    const left = this.collectorLeft;
    const right = this.collectorRight;

    for (let x = left; x < left + 96; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    for (let x = left + 96; x < right - 96; x += 32) {
      const variant = Math.floor(Math.abs(x) / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        this.groundY + 16,
        `grass_${variant}`
      );
      tile.refreshBody();
    }
    for (let x = right - 96; x < right; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }

    this.addIslandBedrock(left, right, false);
  }

  /** Frosted rock shores — walkable strip on Frostpeak Isle. */
  private createFrostpeakTerrain(): void {
    const left = this.frostLeft;
    const right = this.frostRight;

    for (let x = left; x < left + 110; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }
    for (let x = left + 110; x < right - 110; x += 32) {
      const variant = Math.floor(Math.abs(x) / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        this.groundY + 16,
        `grass_${variant}`
      );
      tile.refreshBody();
      tile.setTint(0xc8d0d8);
    }
    for (let x = right - 110; x < right; x += 32) {
      const tile = this.ground.create(x + 16, this.groundY + 16, "shore");
      tile.refreshBody();
    }

    this.addIslandBedrock(left, right, false);
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
  }

  /**
   * Draw an ocean stretch at most once — so Ashencast/Frostpeak can own their
   * approach water even if the neighboring zone hasn't loaded yet.
   */
  private ensureWaterBody(
    left: number,
    right: number,
    _opts?: { sandTint?: number; sandStep?: number }
  ): void {
    const key = `${left}:${right}`;
    if (this.drawnWaterKeys.has(key)) return;
    this.drawnWaterKeys.add(key);
    this.drawWaterBody(left, right);
  }

  private createVillageWaterVisual(): void {
    this.ensureWaterBody(this.reefBlendEnd, this.westWaterRight);
    this.ensureWaterBody(this.eastWaterLeft, this.eastWaterRight);

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

    const addDock = (left: number, right: number) => {
      const w = right - left;
      const dock = this.ground.create(left + w / 2, this.groundY + 8, "dock");
      dock.setDisplaySize(w, 16);
      dock.refreshBody();
      dock.setVisible(false);
    };
    addDock(this.islandRight, this.dockEnd);
    addDock(this.westDockEnd, this.islandLeft);
  }

  private createCollectorsWaterVisual(): void {
    // West voyage toward Ashencast
    this.ensureWaterBody(this.ashenRight, this.collectorLeft, {
      sandTint: 0x7a6840,
      sandStep: 48,
    });
    const addDock = (left: number, right: number) => {
      const w = right - left;
      const dock = this.ground.create(left + w / 2, this.groundY + 8, "dock");
      dock.setDisplaySize(w, 16);
      dock.refreshBody();
      dock.setVisible(false);
    };
    addDock(this.collectorWestDock, this.collectorLeft);
    addDock(this.collectorRight, this.collectorEastDock);
    const cWestLip = this.ground.create(
      this.collectorLeft + 40,
      this.groundY + 16,
      "shore"
    );
    cWestLip.setDisplaySize(80, 32);
    cWestLip.refreshBody();
    const cEastLip = this.ground.create(
      this.collectorRight - 40,
      this.groundY + 16,
      "shore"
    );
    cEastLip.setDisplaySize(80, 32);
    cEastLip.refreshBody();
  }

  private createSwampWaterVisual(): void {
    // Own approach + far ocean so sailing in isn't light-blue before frost loads.
    this.ensureWaterBody(this.eastWaterLeft, this.eastWaterRight);
    this.ensureWaterBody(this.farWaterLeft, this.frostLeft);
    const addDock = (left: number, right: number) => {
      const w = right - left;
      const dock = this.ground.create(left + w / 2, this.groundY + 8, "dock");
      dock.setDisplaySize(w, 16);
      dock.refreshBody();
      dock.setVisible(false);
    };
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
    addDock(this.jungleWestDockEnd, this.jungleLeft);
    addDock(this.jungleRight, this.jungleEastDockEnd);
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

  private createFrostpeakWaterVisual(): void {
    // Own both sides so spawning here isn't light-blue until swamp loads.
    this.ensureWaterBody(this.farWaterLeft, this.frostLeft);
    this.ensureWaterBody(this.frostRight, this.farWaterRight, {
      sandTint: 0x7a6840,
    });
    const addDock = (left: number, right: number) => {
      const w = right - left;
      const dock = this.ground.create(left + w / 2, this.groundY + 8, "dock");
      dock.setDisplaySize(w, 16);
      dock.refreshBody();
      dock.setVisible(false);
    };
    addDock(this.frostWestDock, this.frostLeft);
    addDock(this.frostRight, this.frostEastDock);
    const sWestLip = this.ground.create(
      this.frostLeft + 40,
      this.groundY + 16,
      "shore"
    );
    sWestLip.setDisplaySize(80, 32);
    sWestLip.refreshBody();
    const sEastLip = this.ground.create(
      this.frostRight - 40,
      this.groundY + 16,
      "shore"
    );
    sEastLip.setDisplaySize(80, 32);
    sEastLip.refreshBody();
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

  isNearCollectorSkinHouse(): boolean {
    if (this.player.isOnBoat()) return false;
    return Math.abs(this.player.sprite.x - this.collectorSkinHouseX) < 70;
  }

  tryEnterShop(): boolean {
    if (!this.isNearBlueHouse()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.anyFishMerchantTalking()) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("ShopScene", { inventory: this.inventory });
    return true;
  }

  tryEnterBobberShop(): boolean {
    if (!this.isNearRedHouse()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.anyFishMerchantTalking()) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("BobberShopScene", { inventory: this.inventory });
    return true;
  }

  tryEnterBackpackShop(): boolean {
    if (!this.isNearGreenHouse()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.anyFishMerchantTalking()) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("BackpackShopScene", { inventory: this.inventory });
    return true;
  }

  tryEnterSkinShop(): boolean {
    if (!this.isNearCollectorSkinHouse()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.anyFishMerchantTalking()) return false;
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("SkinShopScene", { inventory: this.inventory });
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

  isNearCaveCrack(): boolean {
    return Math.abs(this.player.sprite.x - this.caveCrackX) < 55;
  }

  tryEnterAmuletCave(): boolean {
    if (!this.isNearCaveCrack()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.amuletRitual.isBusy()) return false;
    // Climb-down feel: brief dip then enter
    this.player.sprite.setVelocity(0, 0);
    this.scene.pause("GameScene");
    this.scene.pause("UIScene");
    this.scene.launch("AmuletCaveScene", {
      inventory: this.inventory,
      persistSave: () => this.persistSave(),
    });
    return true;
  }

  isNearFrostpeakCave(): boolean {
    if (!this.inventory.frostpeakCaveOpen) return false;
    if (this.inFrostpeakCave) return false;
    return Math.abs(this.player.sprite.x - this.frostCaveX) < 70;
  }

  tryEnterFrostpeakCave(): boolean {
    if (!this.isNearFrostpeakCave()) return false;
    if (this.fishing.isBusy()) return false;
    if (this.player.isOnBoat()) return false;
    this.enterFrostpeakCave();
    return true;
  }

  /** Teleport into the mountain cave region (same GameScene). */
  private enterFrostpeakCave(): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    this.zoneLoader.forceLoad("cave");
    if (this.sailboat && !this.sailboat.occupied) {
      this.sailboat.destroy();
      this.sailboat = null;
    }
    this.inFrostpeakCave = true;
    this.lastCaveAreaId = "";
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.setPosition(
      this.caveOriginX + CAVE_SPAWN_LOCAL_X,
      this.groundY - 40
    );
    this.setCaveCameraBounds();
    this.cameras.main.centerOn(
      this.player.sprite.x,
      this.player.sprite.y
    );
    this.weather?.setRainBlocked(true);
    this.spawnCaveBoatAtFirstPort();
    ui?.setOceanMarkers(null);
    ui?.setPrompt(null);
    ui?.showToast(
      "A vast cave under the mountain — ports link the chambers.",
      "#c8e0f8"
    );
    ui?.showAreaBanner("Entrance Hall");
  }

  tryLeaveFrostpeakCave(): boolean {
    if (!this.inFrostpeakCave) return false;
    if (this.fishing.isBusy()) return false;
    if (this.player.isOnBoat()) return false;
    if (this.player.sprite.x > this.caveOriginX + CAVE_EXIT_LOCAL_X) {
      return false;
    }
    this.leaveFrostpeakCave();
    return true;
  }

  private leaveFrostpeakCave(): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    if (this.sailboat) {
      if (this.sailboat.occupied) {
        this.sailboat.disembark(
          this.player,
          this.caveOriginX + CAVE_SPAWN_LOCAL_X,
          this.groundY
        );
      }
      this.sailboat.destroy();
      this.sailboat = null;
    }
    this.inFrostpeakCave = false;
    this.lastCaveAreaId = "";
    for (const m of this.caveMerchants) m.close();
    this.weather?.setRainBlocked(false);
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.setPosition(this.frostCaveX, this.groundY - 40);
    this.setOverworldCameraBounds();
    this.cameras.main.centerOn(
      this.player.sprite.x,
      this.player.sprite.y
    );
    ui?.setPrompt(null);
    ui?.showToast("Back on Frostpeak Isle.", "#c8e0f8");
    ui?.showAreaBanner("Frostpeak Isle");
  }

  /** Tide Compass warp destination for the player's current island, or null at sea. */
  getTideCompassHere(): import("../data/items").TideCompassDestId | null {
    if (this.inStellarSky) return "stellar_sky";
    if (this.inFrostpeakCave) return "frostpeak";
    const areaId = this.getAreaId(this.player.sprite.x);
    switch (areaId) {
      case "island":
        return "starter";
      case "jungle":
        return "swamp";
      case "collectors":
        return "collectors";
      case "reef":
        return "reef";
      case "ashencast":
        return "ashencast";
      case "frostpeak":
        return "frostpeak";
      default:
        return null;
    }
  }

  /** Tide Compass warp — caller handles the black fade. */
  teleportTideCompass(destId: import("../data/items").TideCompassDestId): void {
    if (this.fishing.isBusy()) return;
    if (this.getTideCompassHere() === destId) return;

    if (destId === "stellar_sky") {
      if (!this.inventory.canResonateToStellarSky()) {
        const ui = this.scene.get("UIScene") as UIScene;
        ui.showToast(
          "Equip the Resonated Hat to warp to the Stellar Sky.",
          "#c9a0ff"
        );
        return;
      }
      this.enterStellarSky({ fromMoon: false, playFade: false });
      return;
    }

    if (this.player.isOnBoat() && this.sailboat) {
      const exitX = this.player.sprite.x;
      if (this.sailboat.occupied) {
        this.sailboat.disembark(this.player, exitX, this.groundY);
      }
      this.sailboat.destroy();
      this.sailboat = null;
    }

    // Leave stellar / cave if warping to overworld
    if (this.inStellarSky) {
      this.inStellarSky = false;
      this.unloadStellarSkyZone();
      this.weather?.setRainBlocked(false);
      this.setOverworldCameraBounds();
    }

    if (this.inFrostpeakCave) {
      if (this.sailboat) {
        if (this.sailboat.occupied) {
          this.sailboat.disembark(
            this.player,
            this.caveOriginX + CAVE_SPAWN_LOCAL_X,
            this.groundY
          );
        }
        this.sailboat.destroy();
        this.sailboat = null;
      }
      this.inFrostpeakCave = false;
      this.lastCaveAreaId = "";
      for (const m of this.caveMerchants) m.close();
      this.weather?.setRainBlocked(false);
      this.setOverworldCameraBounds();
    }

    const mid = (a: number, b: number) => (a + b) / 2;
    let x = mid(this.islandLeft, this.islandRight);
    let zone: "swamp" | "collectors" | "reef" | "ashencast" | "frostpeak" | null =
      null;
    let banner = "Starter Island";

    switch (destId) {
      case "starter":
        x = mid(this.islandLeft, this.islandRight);
        banner = "Starter Island";
        break;
      case "swamp":
        x = mid(this.jungleLeft, this.jungleRight);
        zone = "swamp";
        banner = "Swamp Island";
        break;
      case "collectors":
        x = mid(this.collectorLeft, this.collectorRight);
        zone = "collectors";
        banner = "Collector's Island";
        break;
      case "reef":
        x = mid(this.reefLeft, this.reefRight);
        zone = "reef";
        banner = "Coral Reef";
        break;
      case "ashencast":
        x = mid(this.ashenLeft, this.ashenRight);
        zone = "ashencast";
        banner = "Ashencast Isle";
        break;
      case "frostpeak":
        x = mid(this.frostLeft, this.frostRight);
        zone = "frostpeak";
        banner = "Frostpeak Isle";
        break;
    }

    if (zone) this.zoneLoader.forceLoad(zone);
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.setPosition(x, this.groundY - 40);
    this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    ui?.showAreaBanner(banner);
  }

  isNearStellarPortal(): boolean {
    if (!this.inStellarSky) return false;
    return Math.abs(this.player.sprite.x - this.stellarPortalX) < 70;
  }

  tryLeaveStellarSky(): boolean {
    if (!this.isNearStellarPortal()) return false;
    if (this.fishing.isBusy()) return false;
    this.leaveStellarSky();
    return true;
  }

  /** Enter Stellar Sky (moon hover or Tide Compass). */
  enterStellarSky(opts: { fromMoon: boolean; playFade: boolean }): void {
    if (this.stellarEnterBusy && opts.playFade) return;
    const run = () => this.finishEnterStellarSky(opts.fromMoon);
    if (opts.playFade) {
      this.stellarEnterBusy = true;
      this.playStellarFade(run, () => {
        this.stellarEnterBusy = false;
      });
    } else {
      run();
    }
  }

  private finishEnterStellarSky(fromMoon: boolean): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    if (!this.inStellarSky && !this.inFrostpeakCave) {
      this.stellarReturnX = this.player.sprite.x;
    } else if (this.inFrostpeakCave) {
      this.stellarReturnX = this.frostCaveX;
    }

    if (this.player.isOnBoat() && this.sailboat) {
      const exitX = this.player.sprite.x;
      if (this.sailboat.occupied) {
        this.sailboat.disembark(this.player, exitX, this.groundY);
      }
      this.sailboat.destroy();
      this.sailboat = null;
    }

    if (this.inFrostpeakCave) {
      this.inFrostpeakCave = false;
      this.lastCaveAreaId = "";
      for (const m of this.caveMerchants) m.close();
      this.setOverworldCameraBounds();
    }

    this.zoneLoader.forceLoad("stellar_sky");
    this.inStellarSky = true;
    this.moonHoverMs = 0;
    this.clearMoonHoverHint();
    this.player.sprite.setVelocity(0, 0);
    // Place on the platform after ground exists; slight settle above tiles
    const spawnX = this.stellarOriginX + STELLAR_SPAWN_LOCAL_X;
    this.player.sprite.setPosition(spawnX, this.groundY - 40);
    this.setStellarCameraBounds();
    this.cameras.main.centerOn(spawnX, this.groundY - 40);
    // Re-assert after bounds change so collideWorldBounds doesn't shove you into void
    this.player.sprite.setPosition(spawnX, this.groundY - 40);
    this.player.sprite.setVelocity(0, 0);
    this.weather?.setRainBlocked(true);
    ui?.setOceanMarkers(null);
    ui?.setPrompt(null);

    const first = !this.inventory.stellarSkyDiscovered;
    if (first) {
      this.inventory.stellarSkyDiscovered = true;
      this.persistSave();
      ui?.showToast(
        fromMoon
          ? "The full moon tore open the Stellar Sky…"
          : "You discovered the Stellar Sky!",
        "#c9a0ff"
      );
    } else {
      ui?.showToast("Welcome back to the Stellar Sky.", "#c9a0ff");
    }
    ui?.showAreaBanner("Stellar Sky");
  }

  private leaveStellarSky(): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    this.inStellarSky = false;
    this.stellarBeing?.decline();
    this.unloadStellarSkyZone();
    this.weather?.setRainBlocked(false);
    const x = Phaser.Math.Clamp(
      this.stellarReturnX || (this.islandLeft + this.islandRight) / 2,
      this.westWaterLeft + 40,
      this.farWaterRight
    );
    const spawn = this.resolveSafeSpawn(x, this.groundY - 40);
    this.player.sprite.setVelocity(0, 0);
    this.player.sprite.setPosition(spawn.x, spawn.y);
    this.setOverworldCameraBounds();
    this.cameras.main.centerOn(
      this.player.sprite.x,
      this.player.sprite.y
    );
    ui?.setPrompt(null);
    ui?.showToast("Back under familiar skies.", "#c8e0f8");
    ui?.showAreaBanner(this.getAreaName(this.getAreaId(spawn.x)));
  }

  private playStellarFade(onMid: () => void, onDone?: () => void): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    const host = ui ?? this;
    const w = host.scale.width;
    const h = host.scale.height;
    const veil = host.add
      .rectangle(w / 2, h / 2, w + 40, h + 40, 0x000000, 1)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(500);
    host.tweens.add({
      targets: veil,
      alpha: 1,
      duration: 480,
      ease: "Quad.easeIn",
      onComplete: () => {
        onMid();
        host.time.delayedCall(120, () => {
          host.tweens.add({
            targets: veil,
            alpha: 0,
            duration: 560,
            ease: "Quad.easeOut",
            onComplete: () => {
              veil.destroy();
              onDone?.();
            },
          });
        });
      },
    });
  }

  private updateMoonHover(delta: number): void {
    if (
      this.inStellarSky ||
      this.inFrostpeakCave ||
      this.stellarEnterBusy ||
      this.fishing.isBusy()
    ) {
      this.moonHoverMs = 0;
      this.clearMoonHoverHint();
      return;
    }
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    if (ui?.isBlockingInput?.()) {
      this.moonHoverMs = 0;
      this.clearMoonHoverHint();
      return;
    }
    if (this.weather?.weather !== "fullmoon") {
      this.moonHoverMs = 0;
      this.clearMoonHoverHint();
      return;
    }
    if (!this.inventory.canResonateToStellarSky()) {
      const moon = this.skyVisual?.moon;
      if (moon?.visible) {
        const cam = this.cameras.main;
        const screenX = (moon.x - cam.scrollX * moon.scrollFactorX) * cam.zoom;
        const screenY = (moon.y - cam.scrollY * moon.scrollFactorY) * cam.zoom;
        const ptr = this.input.activePointer;
        const radius = 48 * moon.scale * cam.zoom;
        const dist = Phaser.Math.Distance.Between(
          ptr.x,
          ptr.y,
          screenX,
          screenY
        );
        if (dist <= radius) {
          this.showMoonNeedHatHint();
        } else {
          this.clearMoonHoverHint();
        }
      } else {
        this.clearMoonHoverHint();
      }
      this.moonHoverMs = 0;
      return;
    }
    const moon = this.skyVisual?.moon;
    if (!moon?.visible) {
      this.moonHoverMs = 0;
      this.clearMoonHoverHint();
      return;
    }

    const cam = this.cameras.main;
    const screenX = (moon.x - cam.scrollX * moon.scrollFactorX) * cam.zoom;
    const screenY = (moon.y - cam.scrollY * moon.scrollFactorY) * cam.zoom;
    const ptr = this.input.activePointer;
    const radius = 48 * moon.scale * cam.zoom;
    const dist = Phaser.Math.Distance.Between(ptr.x, ptr.y, screenX, screenY);
    if (dist > radius) {
      this.moonHoverMs = 0;
      this.clearMoonHoverHint();
      return;
    }

    this.moonHoverMs += delta;
    const need = 7000;
    const t = Math.min(1, this.moonHoverMs / need);
    this.showMoonHoverHint(t);
    if (this.moonHoverMs >= need) {
      this.moonHoverMs = 0;
      this.clearMoonHoverHint();
      this.enterStellarSky({ fromMoon: true, playFade: true });
    }
  }

  private showMoonHoverHint(t: number): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    const host = ui ?? this;
    if (!this.moonHoverHint) {
      this.moonHoverHint = host.add
        .text(host.scale.width / 2, 56, "", {
          fontFamily: "Georgia, serif",
          fontSize: "18px",
          color: "#e8d0ff",
          stroke: "#120828",
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(420);
    }
    const secs = Math.max(0, Math.ceil(7 * (1 - t)));
    this.moonHoverHint.setText(
      t < 1
        ? `The moon pulls you in… ${secs}`
        : "The moon pulls you in…"
    );
    this.moonHoverHint.setAlpha(0.55 + t * 0.45);
  }

  private showMoonNeedHatHint(): void {
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    const host = ui ?? this;
    if (!this.moonHoverHint) {
      this.moonHoverHint = host.add
        .text(host.scale.width / 2, 56, "", {
          fontFamily: "Georgia, serif",
          fontSize: "16px",
          color: "#e8d0ff",
          stroke: "#120828",
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(420);
    }
    this.moonHoverHint.setText(
      "Equip the Resonated Hat to resonate with the moon"
    );
    this.moonHoverHint.setAlpha(0.9);
  }

  private clearMoonHoverHint(): void {
    this.moonHoverHint?.destroy();
    this.moonHoverHint = undefined;
  }

  private setStellarCameraBounds(): void {
    const cameraHeight = this.waterSurfaceY + this.deepWaterPx + 40;
    this.cameras.main.setBounds(
      this.stellarOriginX,
      0,
      STELLAR_LOCAL_W,
      cameraHeight
    );
    // Keep physics inside the pocket so you can't fall off-world
    this.physics.world.setBounds(
      this.stellarOriginX,
      0,
      STELLAR_LOCAL_W,
      720
    );
  }

  /** Keep the view inside the mountain — no sky past the end walls. */
  private setCaveCameraBounds(): void {
    const cameraHeight = this.waterSurfaceY + this.deepWaterPx + 40;
    this.cameras.main.setBounds(
      this.caveOriginX,
      0,
      CAVE_LOCAL_W,
      cameraHeight
    );
    this.physics.world.setBounds(this.caveOriginX, 0, CAVE_LOCAL_W, 720);
  }

  private setOverworldCameraBounds(): void {
    const worldLeft = this.westWaterLeft;
    const cameraHeight = this.waterSurfaceY + this.deepWaterPx + 40;
    this.cameras.main.setBounds(
      worldLeft,
      0,
      this.caveEndX - worldLeft + 80,
      cameraHeight
    );
    // Keep physics at cave tip while overworld — stellar expands bounds only while inside
    this.physics.world.setBounds(
      worldLeft,
      0,
      this.caveEndX - worldLeft + 80,
      720
    );
  }

  private spawnCaveBoatAtFirstPort(): void {
    if (this.cavePorts.length === 0) return;
    const port = this.cavePorts[0];
    if (this.sailboat) {
      if (this.sailboat.occupied) return;
      this.sailboat.destroy();
      this.sailboat = null;
    }
    const owned = this.inventory.getOwnedBoats();
    const boatId: BoatId = owned.includes("jetski")
      ? "jetski"
      : owned.includes("speedboat")
        ? "speedboat"
        : "sailboat";
    this.sailboat = new Sailboat(
      this,
      port.boatX,
      this.waterSurfaceY,
      port.waterL,
      port.waterR,
      boatId
    );
  }

  private refreshCaveAreaBanner(ui: UIScene): void {
    const x = this.player.isOnBoat()
      ? this.sailboat?.hull.x ?? this.player.sprite.x
      : this.player.sprite.x;
    const land = this.caveLands.find((l) => x >= l.left && x <= l.right);
    const water = this.caveWaters.find((w) => x >= w.left && x <= w.right);
    const id = land?.id ?? water?.id ?? "";
    if (!id || id === this.lastCaveAreaId) return;
    this.lastCaveAreaId = id;
    ui.showAreaBanner(land?.name ?? water?.name ?? "Frostpeak Cave");
  }

  private refreshCavePrompt(ui: UIScene): void {
    if (this.fishing.isBusy()) {
      ui.setPrompt("Fishing…");
      return;
    }
    if (this.anyFishMerchantTalking()) {
      ui.setPrompt("F — Confirm    X — Decline");
      return;
    }
    if (this.vaultKeeper?.talking) {
      ui.setPrompt("F / X — Close");
      return;
    }
    if (this.shellSeeker?.talking || this.galleryCurator?.talking) {
      ui.setPrompt("F / X — Close");
      return;
    }
    if (this.player.isOnBoat()) {
      const red = this.worldGemRoots.gem_red;
      if (
        red?.visible &&
        this.sailboat &&
        Phaser.Math.Distance.Between(
          this.sailboat.hull.x,
          this.sailboat.hull.y,
          red.x,
          red.y
        ) < 110
      ) {
        ui.setPrompt("F — Take the Ruby Gem");
        return;
      }
      const near = this.cavePortNearBoat();
      ui.setPrompt(
        near
          ? `F — Exit at ${near.label} · A/D sail`
          : "A/D sail · F exit at a port"
      );
      return;
    }
    if (
      this.vaultKeeper?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to Vault Keeper");
      return;
    }
    if (
      this.shellSeeker?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to Shell Seeker");
      return;
    }
    if (
      this.galleryCurator?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to Gallery Curator");
      return;
    }
    if (this.galleryChallenge?.isNearAny(this.player.sprite.x, this.player.sprite.y)) {
      ui.setPrompt(
        this.galleryChallenge.isRunning()
          ? "Click the crystals in order"
          : "Talk to the Curator to begin"
      );
      return;
    }
    const nearMerchant = this.nearFishMerchant();
    if (nearMerchant) {
      ui.setPrompt(`F — Talk to ${nearMerchant.displayName}`);
      return;
    }
    const px = this.player.sprite.x;
    if (this.inventory.vaultGemQuestAccepted) {
      for (let i = 0; i < VAULT_GEM_IDS.length; i++) {
        const gemId = VAULT_GEM_IDS[i];
        const pedX = vaultPedestalWorldX(this.caveOriginX, i);
        if (Math.abs(px - pedX) > 48) continue;
        if (this.inventory.vaultGemsPlaced.includes(gemId)) {
          ui.setPrompt(`${VAULT_GEM_NAMES[gemId]} seated`);
          return;
        }
        if (this.inventory.hasItem(gemId)) {
          ui.setPrompt(`F — Place ${VAULT_GEM_NAMES[gemId]}`);
          return;
        }
        ui.setPrompt(`Empty pedestal — needs ${VAULT_GEM_NAMES[gemId]}`);
        return;
      }
      const sanctumMid = this.caveOriginX + (8680 + 9800) / 2;
      if (
        Math.abs(px - sanctumMid) < 70 &&
        this.inventory.isVaultGemAvailable("gem_blue")
      ) {
        ui.setPrompt(`F — Offer $${VAULT_BLUE_ALTAR_COST} to the Sanctum`);
        return;
      }
      for (const gemId of ["gem_yellow", "gem_purple"] as VaultGemId[]) {
        const root = this.worldGemRoots[gemId];
        if (
          root?.visible &&
          Phaser.Math.Distance.Between(
            px,
            this.player.sprite.y,
            root.x,
            root.y
          ) < 70
        ) {
          ui.setPrompt(`F — Take the ${VAULT_GEM_NAMES[gemId]}`);
          return;
        }
      }
    }
    if (this.player.sprite.x <= this.caveOriginX + CAVE_EXIT_LOCAL_X) {
      ui.setPrompt("Enter — Leave cave · F board boat at port");
      return;
    }
    const port = this.cavePortNearPlayer();
    if (port) {
      ui.setPrompt("F — Board boat · B — Boat menu · LMB cast");
      return;
    }
    if (
      this.sailboat &&
      !this.sailboat.occupied &&
      this.sailboat.isNear(this.player.sprite.x, this.player.sprite.y, 100)
    ) {
      ui.setPrompt(`F — Board ${this.sailboat.def.name}`);
      return;
    }
    ui.setPrompt("A/D move · LMB cast from shore · Find a port to sail");
  }

  private cavePortNearPlayer(): CavePort | null {
    if (!this.inFrostpeakCave) return null;
    const x = this.player.sprite.x;
    for (const p of this.cavePorts) {
      if (x >= p.dockLeft - 20 && x <= p.dockRight + 20) return p;
    }
    return null;
  }

  private cavePortNearBoat(): CavePort | null {
    if (!this.inFrostpeakCave || !this.sailboat) return null;
    const x = this.sailboat.hull.x;
    for (const p of this.cavePorts) {
      if (x >= p.dockLeft - 40 && x <= p.dockRight + 40) return p;
      if (Math.abs(x - p.boatX) < 90) return p;
    }
    return null;
  }

  isPlayerOnCavePort(): boolean {
    return this.cavePortNearPlayer() != null;
  }

  tryUseAmulet(amuletId: ItemId): boolean {
    if (this.amuletRitual.isBusy()) return false;
    if (this.fishing.isBusy()) return false;
    const isDay = !this.dayNight.isNight();
    const result = this.inventory.useAmulet(amuletId, isDay);
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    if (!result.ok || !result.effect) {
      ui?.showToast(result.message, "#ffaa66");
      return false;
    }
    ui?.showToast(result.message, "#c8b0ff");
    this.persistSave();
    this.amuletRitual.play({
      amuletId,
      effect: result.effect,
      getPlayerPos: () => ({
        x: this.player.sprite.x,
        y: this.player.sprite.y,
      }),
      weather: this.weather,
      dayNight: this.dayNight,
      onDone: (message) => {
        ui?.showToast(message, "#ffe066");
      },
    });
    return true;
  }

  private spawnOceanCorridor(
    id: string,
    left: number,
    right: number,
    count: number,
    ashencastWaters = false
  ): void {
    if (this.spawnedFishCorridors.has(id)) return;
    this.spawnedFishCorridors.add(id);
    this.spawnFishInZone(left, right, count, "ocean", ashencastWaters);
  }

  /** Collectors ↔ Ashencast open ocean — either island load fills the voyage. */
  private spawnCollectorsAshencastOceanFish(): void {
    const gapL = this.ashenRight;
    const gapR = this.collectorLeft;
    const gapMid = (gapL + gapR) / 2;
    this.spawnOceanCorridor(
      "ocean-ashen-collectors-west",
      gapL,
      gapMid,
      10,
      true
    );
    this.spawnOceanCorridor(
      "ocean-ashen-collectors-east",
      gapMid,
      gapR,
      10,
      true
    );
  }

  /** Swamp approach ↔ Frostpeak open ocean — either island load fills the voyage. */
  private spawnSwampFrostpeakOceanFish(): void {
    this.spawnOceanCorridor(
      "ocean-swamp-frostpeak",
      this.farWaterLeft,
      this.frostLeft,
      6
    );
  }

  private spawnFishInZone(
    left: number,
    right: number,
    count: number,
    habitat: FishHabitat,
    ashencastWaters = false
  ): void {
    const getLuck = () =>
      this.weather
        ? this.weather.getLuck(
            this.inventory.getFishingStats().luck,
            this.inventory.getEquippedRodId()
          )
        : this.inventory.getFishingStats().luck;
    const getExcludeSpecies = (self: Fish): ItemId[] => {
      const exclude: ItemId[] = [];
      if (
        this.fishList.some(
          (f) => f !== self && f.speciesId === "mushroom_cluster"
        )
      ) {
        exclude.push("mushroom_cluster");
      }
      if (
        this.fishList.some((f) => f !== self && f.speciesId === "ore_cluster")
      ) {
        exclude.push("ore_cluster");
      }
      return exclude;
    };
    const getIsRainy = () => this.weather?.isRainy() ?? false;
    const getIsSunny = () => this.weather?.weather === "sunny";
    const narrow = habitat === "pond" || habitat === "hotspring";
    for (let i = 0; i < count; i++) {
      const pad = narrow ? 30 : 60;
      const x = Phaser.Math.Between(left + pad, right - pad);
      const y = this.waterSurfaceY + Phaser.Math.Between(28, 70);
      const rollSpecies =
        habitat === "hotspring"
          ? () =>
              rollHotspringSpecies(
                getLuck(),
                this.inventory.bestiaryFound.includes("ashencast_trout"),
                getExcludeSpecies({} as Fish),
                this.inventory.ashencastQuestStage >= 2,
                this.inventory.ashencastQuestStage === 2
              )
          : ashencastWaters && habitat === "ocean"
            ? () =>
                rollAshencastOceanSpecies(
                  getLuck(),
                  this.inventory.bestiaryFound.includes("ashencast_trout"),
                  getExcludeSpecies({} as Fish)
                )
            : undefined;
      const fish = new Fish(
        this,
        x,
        y,
        left + (narrow ? 20 : 50),
        right - (narrow ? 20 : 50),
        this.waterSurfaceY,
        getLuck,
        habitat,
        undefined,
        getExcludeSpecies,
        getIsRainy,
        rollSpecies ? { rollSpecies } : undefined,
        getIsSunny
      );
      this.fishList.push(fish);
    }
  }

  /** Fish near Starter Isle — other zones spawn when sailed near. */
  private spawnStarterFish(): void {
    this.spawnFishInZone(this.reefBlendEnd, this.westWaterRight, 10, "ocean");
    this.spawnFishInZone(this.eastWaterLeft, this.eastWaterRight, 10, "ocean");
  }

  private spawnFishQuestNpc(islandId: FishQuestIslandId): void {
    if (this.fishQuestNpcs[islandId]) return;
    const spots: Record<FishQuestIslandId, { x: number; tint: number }> = {
      village: { x: this.islandLeft + 480, tint: 0xb0d8ff },
      swamp: { x: this.jungleLeft + 580, tint: 0xb8e0a0 },
      collectors: {
        x: (this.collectorLeft + this.collectorRight) / 2 + 280,
        tint: 0xffc878,
      },
      frostpeak: {
        x: (this.frostLeft + this.frostRight) / 2 - 200,
        tint: 0xc8e8ff,
      },
    };
    const s = spots[islandId];
    const npc = new TalkNpc(this, s.x, this.groundY, "Fish Quest", "");
    npc.sprite.setTint(s.tint);
    this.fishQuestNpcs[islandId] = npc;
  }

  private initWorldZoneLoader(): void {
    this.zoneLoader = new WorldZoneLoader();
    const loadR = 2200;
    this.zoneLoader.register({
      id: "ashencast",
      centerX: (this.ashenLeft + this.ashenRight) / 2,
      loadRadius: loadR,
      onLoad: () => this.loadAshencastZone(),
    });
    this.zoneLoader.register({
      id: "collectors",
      centerX: (this.collectorLeft + this.collectorRight) / 2,
      loadRadius: loadR,
      onLoad: () => this.loadCollectorsZone(),
    });
    this.zoneLoader.register({
      id: "reef",
      centerX: (this.reefLeft + this.reefRight) / 2,
      loadRadius: loadR,
      onLoad: () => this.loadReefZone(),
    });
    this.zoneLoader.register({
      id: "swamp",
      centerX: (this.jungleLeft + this.jungleRight) / 2,
      loadRadius: loadR,
      onLoad: () => this.loadSwampZone(),
    });
    this.zoneLoader.register({
      id: "frostpeak",
      centerX: (this.frostLeft + this.frostRight) / 2,
      loadRadius: loadR,
      onLoad: () => this.loadFrostpeakZone(),
    });
    this.zoneLoader.register({
      id: "cave",
      centerX: this.caveOriginX + CAVE_LOCAL_W / 2,
      loadRadius: 0,
      onLoad: () => this.loadFrostpeakCaveZone(),
    });
    this.zoneLoader.register({
      id: "stellar_sky",
      centerX: this.stellarOriginX + STELLAR_LOCAL_W / 2,
      loadRadius: 0,
      onLoad: () => this.loadStellarSkyZone(),
    });
  }

  private loadStellarSkyZone(): void {
    if (this.stellarLoaded) return;
    this.stellarLoaded = true;
    const placed = placeStellarSky(
      this,
      this.stellarOriginX,
      this.groundY,
      this.ground
    );
    this.stellarPortalX = placed.portalX;
    this.stellarLandLeft = placed.landLeft;
    this.stellarLandRight = placed.landRight;
    this.stellarDestroy = placed.destroy;
    this.stellarBeing = new TalkNpc(
      this,
      placed.npcX,
      this.groundY,
      "Astral Warden",
      ""
    );
    this.stellarBeing.sprite.setTexture("galactic_being");
    this.stellarBeing.sprite.clearTint();
    this.stellarBeing.sprite.setDisplaySize(72, 108);
    this.stellarAura = this.add.circle(
      placed.npcX,
      this.groundY - 48,
      42,
      0x6a3cff,
      0.22
    );
    this.stellarAura.setDepth(10);
    this.tweens.add({
      targets: this.stellarAura,
      alpha: { from: 0.12, to: 0.32 },
      scale: { from: 0.9, to: 1.15 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Drop Stellar Sky visuals + colliders so overworld stays light. */
  private unloadStellarSkyZone(): void {
    if (!this.stellarLoaded && !this.stellarDestroy) return;
    if (this.stellarAura) {
      this.tweens.killTweensOf(this.stellarAura);
      this.stellarAura.destroy();
      this.stellarAura = undefined;
    }
    this.stellarBeing?.destroy();
    this.stellarBeing = undefined;
    this.stellarDestroy?.();
    this.stellarDestroy = undefined;
    this.stellarLoaded = false;
    this.stellarPortalX = 0;
    this.stellarLandLeft = 0;
    this.stellarLandRight = 0;
    this.zoneLoader?.unload("stellar_sky");
  }

  private loadCollectorsZone(): void {
    this.createCollectorsTerrain();
    this.createCollectorsWaterVisual();
    placeCollectorsIsland(
      this,
      this.groundY,
      this.collectorLeft,
      this.collectorRight,
      this.collectorWestDock,
      this.collectorEastDock,
      this.nightAmbient
    );
    const cMid = (this.collectorLeft + this.collectorRight) / 2;
    this.fishCollector = new BargainerNpc(
      this,
      cMid + 140,
      this.groundY,
      "fish_buy",
      "Fish Collector"
    );
    this.curioTrader = new BargainerNpc(
      this,
      cMid - 80,
      this.groundY,
      "curio_sell",
      "Curio Trader",
      0xf0e0c8
    );
    this.appraiser = new TalkNpc(
      this,
      this.collectorRight - 180,
      this.groundY,
      "The Appraiser",
      ""
    );
    this.appraiser.sprite.setTint(0xd4c878);
    this.spawnFishQuestNpc("collectors");
    this.spawnBaitCrate(this.collectorLeft + 200, "Collector's Island");
    this.spawnFishInZone(this.reefLeft, this.reefRight, 8, "reef");
    this.spawnCollectorsAshencastOceanFish();
  }

  private loadAshencastZone(): void {
    this.createAshencastTerrain();
    this.createAshencastWaterVisual();
    const placed = placeAshencastIsland(
      this,
      this.groundY,
      this.ashenLeft,
      this.ashenRight,
      this.ashenWestDock,
      this.ashenEastDock,
      this.ashenSpringALeft,
      this.ashenSpringARight,
      this.ashenSpringBLeft,
      this.ashenSpringBRight,
      this.inventory.isAshencastForgeReady()
    );
    this.ashenBuildAnvil = placed.buildAnvil;
    this.ashenMerchant = new FishMerchant(
      this,
      placed.harbourX,
      this.groundY,
      "Ashencast Merchant"
    );
    this.ashenForgeNpc = new TalkNpc(
      this,
      placed.forgeX + 70,
      this.groundY,
      "Forge Keeper",
      ""
    );
    this.ashenForgeNpc.sprite.setTint(0xffaa88);
    // Ore peddler — between the two hotspring bridges
    const peddlerX =
      (this.ashenSpringARight + this.ashenSpringBLeft) / 2;
    this.orePeddler = new TalkNpc(
      this,
      peddlerX,
      this.groundY,
      "Ore Peddler",
      ""
    );
    this.orePeddler.sprite.setTint(0xd4a070);
    this.spawnBaitCrate(this.ashenRight - 260, "Ashencast Isle");
    this.spawnFishInZone(this.westWaterLeft, this.ashenLeft, 8, "ocean", true);
    this.spawnCollectorsAshencastOceanFish();
    this.spawnFishInZone(
      this.ashenSpringALeft,
      this.ashenSpringARight,
      4,
      "hotspring"
    );
    this.spawnFishInZone(
      this.ashenSpringBLeft,
      this.ashenSpringBRight,
      4,
      "hotspring"
    );
    this.refreshAnvilOceanFloater();
    if (this.inventory.ashencastQuestStage >= 2) {
      this.refreshAshencastHotspringFish();
    }
  }

  private createAshencastWaterVisual(): void {
    // Own both oceans around the isle so spawn isn't light-blue until collectors loads.
    this.ensureWaterBody(this.westWaterLeft, this.ashenLeft, {
      sandTint: 0x8a6040,
    });
    this.ensureWaterBody(this.ashenRight, this.collectorLeft, {
      sandTint: 0x7a6840,
      sandStep: 48,
    });
    const pier = ashencastPierCollisionBounds(
      this.ashenLeft,
      this.ashenRight,
      this.ashenWestDock,
      this.ashenEastDock
    );
    const addDock = (left: number, right: number) => {
      const w = right - left;
      if (w <= 0) return;
      const dock = this.ground.create(left + w / 2, this.groundY + 8, "dock");
      dock.setDisplaySize(w, 16);
      dock.refreshBody();
      dock.setVisible(false);
    };
    const addDockCap = (centerX: number) => {
      const cap = this.ground.create(centerX, this.groundY + 16, "shore");
      cap.setDisplaySize(64, 32);
      cap.refreshBody();
      cap.setVisible(false);
      cap.setTint(0xd4a070);
    };
    addDock(pier.westLeft, pier.westRight);
    addDockCap(pier.westLeft + 32);
    addDock(pier.eastLeft, pier.eastRight);
    addDockCap(pier.eastRight - 32);
    const westLip = this.ground.create(
      this.ashenLeft + 40,
      this.groundY + 16,
      "shore"
    );
    westLip.setDisplaySize(80, 32);
    westLip.refreshBody();
    westLip.setTint(0xd4a070);
    const eastLip = this.ground.create(
      this.ashenRight - 40,
      this.groundY + 16,
      "shore"
    );
    eastLip.setDisplaySize(80, 32);
    eastLip.refreshBody();
    eastLip.setTint(0xd4a070);

    // Walkable bridges over hotspring ponds
    for (const [pl, pr] of [
      [this.ashenSpringALeft, this.ashenSpringARight],
      [this.ashenSpringBLeft, this.ashenSpringBRight],
    ] as const) {
      const pondW = pr - pl;
      const bridge = this.ground.create(pl + pondW / 2, this.groundY + 6, "dock");
      bridge.setDisplaySize(pondW + 16, 14);
      bridge.refreshBody();
      bridge.setVisible(false);
    }
  }

  private createAshencastTerrain(): void {
    const left = this.ashenLeft;
    const right = this.ashenRight;
    const gy = this.groundY;
    const ponds: [number, number][] = [
      [this.ashenSpringALeft, this.ashenSpringARight],
      [this.ashenSpringBLeft, this.ashenSpringBRight],
    ];
    const inPond = (x: number) =>
      ponds.some(([pl, pr]) => x >= pl && x < pr);

    // Solid scorched floor plate so sky never shows through tile gaps
    const floor = this.add.graphics().setDepth(2.4);
    floor.fillStyle(0xb06038, 1);
    let cursor = left;
    for (const [pl, pr] of ponds) {
      if (pl > cursor) {
        floor.fillRect(cursor, gy - 14, pl - cursor, 50);
      }
      cursor = Math.max(cursor, pr);
    }
    if (cursor < right) {
      floor.fillRect(cursor, gy - 14, right - cursor, 50);
    }
    // Opaque bank lips at each pond so the rim isn't sky
    floor.fillStyle(0xa85830, 1);
    for (const [pl, pr] of ponds) {
      floor.fillRect(pl - 10, gy - 10, 12, 28);
      floor.fillRect(pr - 2, gy - 10, 12, 28);
    }

    for (let x = left; x < left + 110; x += 32) {
      const tile = this.ground.create(x + 16, gy + 16, "shore");
      tile.refreshBody();
      tile.setTint(0xd4a070);
    }
    for (let x = left + 110; x < right - 110; x += 32) {
      if (inPond(x)) continue;
      const nearPondEdge = ponds.some(
        ([pl, pr]) => Math.abs(x - pl) < 40 || Math.abs(x - pr) < 40
      );
      const variant = Math.floor(Math.abs(x) / 32) % 4;
      const tile = this.ground.create(
        x + 16,
        gy + 16,
        nearPondEdge ? "shore" : `grass_${variant}`
      );
      tile.refreshBody();
      tile.setTint(nearPondEdge ? 0xc48858 : 0xc87848);
    }
    for (let x = right - 110; x < right; x += 32) {
      const tile = this.ground.create(x + 16, gy + 16, "shore");
      tile.refreshBody();
      tile.setTint(0xd4a070);
    }
    // Bedrock starts at the surface so nothing under the grass is empty sky
    this.addIslandBedrock(left, right, false, gy);
  }

  /** Re-roll hotspring fish so Ashencast Trout can appear after reaching stage 2. */
  private refreshAshencastHotspringFish(): void {
    for (const fish of this.fishList) {
      if (fish.habitat !== "hotspring") continue;
      if (fish.state !== "idle") continue;
      fish.resetIdle();
    }
  }

  /**
   * Keep one surface anvil shard floating while the quest needs it.
   * Safe to call after failed catches — recreates the floater if it vanished.
   */
  refreshAnvilOceanFloater(): void {
    const need =
      this.inventory.ashencastQuestStage === 1 &&
      !this.inventory.hasItem("anvil_piece_ocean");
    const alive =
      !!this.anvilOceanFish &&
      this.fishList.includes(this.anvilOceanFish) &&
      !!this.anvilOceanFish.sprite?.active;

    if (!need) {
      if (this.anvilOceanFish) {
        const idx = this.fishList.indexOf(this.anvilOceanFish);
        if (idx >= 0) this.fishList.splice(idx, 1);
        if (this.anvilOceanFish.sprite?.active) {
          this.anvilOceanFish.destroy();
        }
        this.anvilOceanFish = undefined;
      }
      return;
    }
    if (alive) return;

    // Stale ref after a bad fight / destroy — clear and respawn.
    if (this.anvilOceanFish) {
      const idx = this.fishList.indexOf(this.anvilOceanFish);
      if (idx >= 0) this.fishList.splice(idx, 1);
      if (this.anvilOceanFish.sprite?.active) {
        this.anvilOceanFish.destroy();
      }
      this.anvilOceanFish = undefined;
    }

    const mid = (this.ashenRight + this.collectorLeft) / 2;
    const fish = new Fish(
      this,
      mid,
      this.waterSurfaceY + 24,
      this.ashenRight + 80,
      this.collectorLeft - 80,
      this.waterSurfaceY,
      () => this.inventory.getFishingStats().luck,
      "ocean",
      "anvil_piece_ocean",
      () => [],
      () => this.weather?.isRainy() ?? false,
      { lockSpecies: true, noDespawn: true },
      () => this.weather?.weather === "sunny"
    );
    // Force surface float (Fish constructor uses depthBand otherwise).
    fish.resetIdle(mid, this.waterSurfaceY + 24);
    this.anvilOceanFish = fish;
    this.fishList.push(fish);
  }

  private loadReefZone(): void {
    placeCoralReef(
      this,
      this.waterSurfaceY,
      this.reefLeft,
      this.reefRight,
      this.reefBlendEnd
    );
  }

  private loadSwampZone(): void {
    this.createJungleTerrain();
    this.createSwampWaterVisual();
    placeJungle(
      this,
      this.groundY,
      this.jungleLeft,
      this.jungleRight,
      this.pondLeft,
      this.pondRight,
      this.nightAmbient
    );
    this.add
      .image(this.secretFallTreeX, this.groundY + 2, "swamp_tree_tall")
      .setDepth(2)
      .setOrigin(0.5, 1)
      .setScale(0.96);
    this.jungleMerchant = new FishMerchant(
      this,
      this.jungleLeft + 320,
      this.groundY,
      "Swamp Merchant"
    );
    this.jungleMerchant.sprite.setTint(0xb8d8a0);
    this.placeWildflowerRodProp();
    this.spawnFishQuestNpc("swamp");
    this.spawnCosmicHaberdasher();
    this.spawnBaitCrate(this.jungleLeft + 140, "Swamp Island");
    this.spawnSwampFrostpeakOceanFish();
    this.spawnFishInZone(this.pondLeft, this.pondRight, 3, "pond");
  }

  /** Between cave rope (~5210) and east swamp port (~5760). */
  private spawnCosmicHaberdasher(): void {
    if (this.cosmicHaberdasher) return;
    const x = Math.round((this.caveCrackX + this.jungleRight - 40) / 2);
    this.cosmicHaberdasher = new TalkNpc(
      this,
      x,
      this.groundY,
      RESONATED_HAT_NPC_NAME,
      ""
    );
    this.cosmicHaberdasher.sprite.clearTint();
    this.cosmicHaberdasher.sprite.setTexture("npc_green_shirt");
  }

  private handleCosmicHaberdasherTalk(): boolean {
    if (!this.cosmicHaberdasher) return false;
    if (this.cosmicHaberdasher.talking) {
      this.cosmicHaberdasher.decline();
      return true;
    }

    const ui = this.scene.get("UIScene") as UIScene;
    const inv = this.inventory;

    if (inv.resonatedHatDone || inv.ownsHat("hat_resonated")) {
      inv.resonatedHatDone = true;
      this.cosmicHaberdasher.speak(RESONATED_HAT_LINES.already);
      return true;
    }

    if (!inv.resonatedHatQuestStarted) {
      inv.resonatedHatQuestStarted = true;
      const early = inv.tryTurnInResonatedHat();
      if (early.ok) {
        this.cosmicHaberdasher.speak(RESONATED_HAT_LINES.done);
        ui.showToast("Resonated Hat crafted!", "#c9a0ff");
        this.syncPlayerHat();
        this.persistSave();
        ui.refreshQuestTracker?.();
        return true;
      }
      const list = resonatedHatChecklist(inv);
      this.cosmicHaberdasher.speak(
        `${RESONATED_HAT_LINES.greet}\n\nBring me:\n${list}`
      );
      ui.showToast("Quest: Resonated Hat", "#c9a0ff");
      this.persistSave();
      ui.refreshQuestTracker?.();
      return true;
    }

    const result = inv.tryTurnInResonatedHat();
    if (result.ok) {
      this.cosmicHaberdasher.speak(RESONATED_HAT_LINES.done);
      ui.showToast("Resonated Hat crafted!", "#c9a0ff");
      this.syncPlayerHat();
      this.persistSave();
      ui.refreshQuestTracker?.();
      return true;
    }

    const list = resonatedHatChecklist(inv);
    this.cosmicHaberdasher.speak(
      `${RESONATED_HAT_LINES.needMore}\n\n${list}`
    );
    return true;
  }

  private loadFrostpeakZone(): void {
    this.createFrostpeakTerrain();
    this.createFrostpeakWaterVisual();
    const frost = placeFrostpeakIsle(
      this,
      this.groundY,
      this.frostLeft,
      this.frostRight,
      this.frostWestDock,
      this.frostEastDock,
      this.nightAmbient,
      this.inventory.frostpeakCaveOpen
    );
    this.frostCaveBoards = frost.caveBoards;
    this.frostHermit = new TalkNpc(
      this,
      (this.frostLeft + this.frostRight) / 2 - 30,
      this.groundY,
      "Hermit",
      ""
    );
    this.frostHermit.sprite.setTint(0xd0e0f0);
    this.spawnFishQuestNpc("frostpeak");
    this.spawnBaitCrate(this.frostRight - 220, "Frostpeak Isle");
    this.spawnSwampFrostpeakOceanFish();
    this.spawnFishInZone(this.frostRight, this.farWaterRight, 4, "ocean");
  }

  private loadFrostpeakCaveZone(): void {
    if (this.caveWaters.length > 0) return;
    const cave = placeFrostpeakCave(
      this,
      this.caveOriginX,
      this.groundY,
      this.ground
    );
    this.caveLands = cave.lands;
    this.caveWaters = cave.waters;
    this.cavePorts = cave.ports;
    for (const w of this.caveWaters) {
      this.waterZoneList.push({ left: w.left, right: w.right });
    }
    this.spawnCaveMerchants();
    this.setupVaultGemQuest();
    this.setupCrystalGalleryChallenge();
    this.setupShellSeeker();
    for (const w of this.caveWaters) {
      this.spawnFishInZone(
        w.left,
        w.right,
        w.id === "lake" ? 10 : w.id === "channel" ? 8 : 6,
        "cave"
      );
    }
  }

  update(_time: number, delta: number): void {
    this.dayNight?.update(delta);
    this.weather?.update(delta);
    this.applyStellarAtmosphereOverride();
    this.updateAshenSkyHeat();
    if (this.dayNight && this.nightAmbient) {
      this.nightAmbient.update(this.dayNight.getNightFactor());
    }
    this.dolphinAbundance?.update(delta);
    this.whaleAbundance?.update(delta);
    this.coralRodSpawn?.update(delta);
    this.updateVaultGemFx(delta);
    if (this.curioStock?.update(Date.now())) {
      this.syncCurioStockToInventory();
    }
    this.syncPlayerCarriedRod();
    this.player.update();
    // Rod VFX after player move/anim so shaft tip tracks the current frame
    this.syncForgeRodVfx();
    this.syncLaserRodVfx();
    this.syncFrostRodVfx();
    this.syncStellarSurferVfx();
    this.syncStarLineVfx();
    this.updateSurferMastery(delta);
    this.updateMoonHover(delta);
    if (!this.inFrostpeakCave && !this.inStellarSky) {
      if (
        Math.abs(this.player.sprite.x - (this.jungleLeft + this.jungleRight) / 2) <
        2400
      ) {
        this.zoneLoader?.forceLoad("swamp");
      }
      this.zoneLoader?.refresh(this.player.sprite.x);
    }
    for (const fish of this.fishList) {
      fish.update(delta);
    }
    this.fishing.update(delta);
    this.sailboat?.update(delta);
    this.updateBaitPlacement(delta);

    const areaId = this.getAreaId(this.player.sprite.x);
    let musicZone: MusicZone;
    if (this.inStellarSky) {
      musicZone = "stellar_sky";
    } else if (this.inFrostpeakCave) {
      musicZone = "frostpeak_cave";
    } else if (areaId === "reef") {
      musicZone = "reef";
    } else if (areaId === "collectors") {
      musicZone = "collectors";
    } else if (areaId === "ashencast") {
      musicZone = "ashencast";
    } else if (areaId === "frostpeak") {
      musicZone = "frostpeak";
    } else {
      musicZone = areaId as MusicZone;
    }
    this.music.setZone(musicZone);

    const ui = this.scene.get("UIScene") as UIScene;
    if (
      !this.inFrostpeakCave &&
      !this.inStellarSky &&
      areaId !== this.lastAreaZone
    ) {
      this.lastAreaZone = areaId;
      ui.showAreaBanner(this.getAreaName(areaId));
    }

    if (
      !this.inStellarSky &&
      (areaId === "ocean" || areaId === "reef")
    ) {
      ui.setOceanMarkers(this.getOceanMarkers(this.player.sprite.x));
    } else {
      ui.setOceanMarkers(null);
    }

    // Cave zone banners (chambers / lakes)
    if (this.inFrostpeakCave) {
      this.refreshCaveAreaBanner(ui);
    }

    if (this.inStellarSky) {
      if (this.isNearStellarPortal()) {
        ui.setPrompt("F — Leave Stellar Sky");
      } else if (this.stellarBeing?.talking) {
        ui.setPrompt("F / X — Close");
      } else if (
        this.stellarBeing?.isNear(this.player.sprite.x, this.player.sprite.y)
      ) {
        ui.setPrompt("F — Approach the Astral Warden");
      } else {
        ui.setPrompt("A/D walk · Tide Compass to leave");
      }
    } else if (this.inFrostpeakCave) {
      this.refreshCavePrompt(ui);
    } else if (this.baitPlacementId) {
      ui.setPrompt("LMB cast bait · X/Esc cancel");
    } else if (this.player.isOnBoat() && this.sailboat) {
      if (this.fishing.isBusy()) {
        ui.setPrompt("Fishing…");
      } else if (this.isNearCoralRodOnBoat()) {
        ui.setPrompt("F — Approach the floating rod");
      } else if (this.isBoatNearAnyPort()) {
        ui.setPrompt(
          this.sailboat.boatId === "stellar_surfer"
            ? "LMB cast · F dock (board returns to hand)"
            : "LMB cast · F leave port"
        );
      } else {
        ui.setPrompt(
          this.sailboat.boatId === "stellar_surfer"
            ? "A/D ride · LMB cast"
            : "A/D sail · LMB cast"
        );
      }
    } else if (ui.isBargainOpen()) {
      ui.setPrompt("");
    } else if (this.anyFishMerchantTalking()) {
      ui.setPrompt("F — Confirm    X — Decline");
    } else if (this.reefGuide.talking) {
      ui.setPrompt("F / X — Close");
    } else if (
      FISH_QUEST_ISLAND_IDS.some((id) => this.fishQuestNpcs[id]?.talking)
    ) {
      ui.setPrompt("F / X — Close");
    } else if (
      this.codeGuy?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt(
        ui.isCodeGuyOpen()
          ? "Type code · Enter redeem · Esc leave"
          : "F — Talk to Code Guy"
      );
    } else if (
      this.reefGuide.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to Dock Guide");
    } else if (
      this.cosmicHaberdasher?.isNear(
        this.player.sprite.x,
        this.player.sprite.y
      )
    ) {
      ui.setPrompt(`F — Talk to ${RESONATED_HAT_NPC_NAME}`);
    } else if (
      this.frostHermit?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Talk to Hermit");
    } else if (
      this.ashenForgeNpc?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt(
        this.inventory.isAshencastForgeReady()
          ? "F — Talk / Open Forge"
          : "F — Talk to Forge Keeper"
      );
    } else if (this.getNearBaitCrate()) {
      ui.setPrompt(
        ui.isBaitVendorOpen()
          ? "Type 1–50 · Enter buy · Esc leave"
          : `F — Buy Bait Crates ($${BAIT_CRATE_PRICE})`
      );
    } else if (
      this.orePeddler?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      const now = Date.now();
      const stock = this.inventory.getOreVendorStock(now);
      if (stock <= 0) {
        const wait = formatCurioRestock(
          this.inventory.getOreVendorRestockMs(now)
        );
        ui.setPrompt(`F — Ore Peddler · Restock ${wait}`);
      } else {
        ui.setPrompt(
          `F — Buy Ore Clusters ($${ORE_CLUSTER_VENDOR_PRICE} · ${stock}/20)`
        );
      }
    } else if (
      FISH_QUEST_ISLAND_IDS.some((id) =>
        this.fishQuestNpcs[id]?.isNear(
          this.player.sprite.x,
          this.player.sprite.y
        )
      )
    ) {
      ui.setPrompt("F — Talk to Fish Quest");
    } else if (
      this.fishCollector?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt("F — Bargain with Fish Collector");
    } else if (
      this.appraiser?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      ui.setPrompt(
        ui.isAppraiserOpen()
          ? "Pick a fish · Appraise · Esc leave"
          : "F — Talk to The Appraiser"
      );
    } else if (
      this.curioTrader?.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      const restock = formatCurioRestock(
        this.curioStock.msUntilRestock(Date.now())
      );
      ui.setPrompt(`F — Bargain with Curio Trader · Restock ${restock}`);
    } else {
      const nearMerchant = this.nearFishMerchant();
      if (nearMerchant) {
        ui.setPrompt(`F — Talk to ${nearMerchant.displayName}`);
      } else if (this.isNearWildflowerRod()) {
        const uiOpen = (
          this.scene.get("UIScene") as UIScene
        ).isWildflowerBuyOpen();
        ui.setPrompt(
          uiOpen
            ? "F — Buy ($14500)    X — Cancel"
            : "F — Inspect Wildflower Rod"
        );
      } else if (
        this.weather?.isNearWhirlpool(
          this.player.sprite.x,
          this.player.sprite.y
        )
      ) {
        ui.setPrompt("F — Enter · Cast into the whirlpool for Thunder");
      } else if (this.isNearFrostpeakCave()) {
        ui.setPrompt("F — Enter Frostpeak Cave");
      } else if (this.isNearCaveCrack()) {
        ui.setPrompt("F — Climb the rope into the cave");
      } else if (this.isNearBlueHouse()) {
        ui.setPrompt("W — Enter Bluefin Tackle Shop");
      } else if (this.isNearRedHouse()) {
        ui.setPrompt("W — Enter Bobber Workshop");
      } else if (this.isNearGreenHouse()) {
        ui.setPrompt("W — Enter Pack Outfitter");
      } else if (this.isNearCollectorSkinHouse()) {
        ui.setPrompt("W — Enter Collectors Skin Boutique");
      } else if (
        this.sailboat &&
        !this.sailboat.occupied &&
        this.sailboat.isNear(this.player.sprite.x, this.player.sprite.y, 100)
      ) {
        ui.setPrompt(`F — Board ${this.sailboat.def.name}`);
      } else if (this.isPlayerOnPort()) {
        if (this.inventory.getEquippedRodId() === "test_rod") {
          ui.setPrompt("Q — Ride Stellar Surfer · B — Boat menu");
        } else {
          ui.setPrompt("B — Boat menu");
        }
      } else {
        ui.setPrompt(null);
      }
    }

    if (!this.player.isOnBoat()) {
      this.clampPlayerToLand();
    }

    // Close wildflower inspect if you walk away
    const uiScene = this.scene.get("UIScene") as UIScene;
    if (uiScene.isWildflowerBuyOpen() && !this.isNearWildflowerRod()) {
      uiScene.closeWildflowerBuy();
    }
    if (uiScene.isOreVendorOpen()) {
      if (!this.orePeddler?.isNear(this.player.sprite.x, this.player.sprite.y)) {
        uiScene.closeOreVendor();
      } else {
        uiScene.syncOreVendorPanel();
      }
    }
    if (uiScene.isCoralRodOfferOpen() && !this.isNearCoralRodOnBoat()) {
      uiScene.closeCoralRodOffer();
    }
    if (uiScene.isBargainOpen()) {
      const near =
        this.fishCollector?.isNear(
          this.player.sprite.x,
          this.player.sprite.y
        ) ||
        this.curioTrader?.isNear(this.player.sprite.x, this.player.sprite.y);
      if (!near) uiScene.closeBargain();
    }
    if (
      this.reefGuide.talking &&
      !this.reefGuide.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      this.reefGuide.decline();
    }
    if (
      this.stellarBeing?.talking &&
      !this.stellarBeing.isNear(this.player.sprite.x, this.player.sprite.y)
    ) {
      this.stellarBeing.decline();
    }
    if (
      this.cosmicHaberdasher?.talking &&
      !this.cosmicHaberdasher.isNear(
        this.player.sprite.x,
        this.player.sprite.y
      )
    ) {
      this.cosmicHaberdasher.decline();
    }
  }

  /** Hide overworld sky while in Stellar Sky; restore it on leave. */
  private applyStellarAtmosphereOverride(): void {
    if (!this.skyVisual) return;
    if (this.inStellarSky) {
      this.skyVisual.sky.setVisible(false);
      this.skyVisual.sun.setVisible(false);
      this.skyVisual.moon.setVisible(false);
      return;
    }
    // WeatherSystem manages sun/moon each frame; only the sky was left stuck off
    if (!this.skyVisual.sky.visible) {
      this.skyVisual.sky.setVisible(true);
    }
  }

  private updateAshenSkyHeat(): void {
    if (!this.weather || this.inFrostpeakCave || this.inStellarSky) {
      this.weather?.setAshenSkyHeat(0);
      return;
    }
    const x = this.player.sprite.x;
    const mid = (this.ashenLeft + this.ashenRight) / 2;
    const dist = Math.abs(x - mid);
    const fullAt = 1600;
    const fadeAt = 4200;
    const heat =
      dist <= fullAt
        ? 1
        : dist >= fadeAt
          ? 0
          : 1 - (dist - fullAt) / (fadeAt - fullAt);
    this.weather.setAshenSkyHeat(heat);
  }

  private getAreaId(x: number): MusicZone | "reef" | "collectors" | "frostpeak" | "ashencast" {
    if (this.inFrostpeakCave || x >= this.caveOriginX) return "frostpeak";
    if (x >= this.ashenWestDock && x <= this.ashenEastDock) {
      return "ashencast";
    }
    if (x >= this.collectorWestDock && x <= this.collectorEastDock) {
      return "collectors";
    }
    if (x >= this.reefLeft && x < this.reefRight) return "reef";
    if (x >= this.frostWestDock && x <= this.frostEastDock) return "frostpeak";
    return musicZoneForX(x, {
      westDockEnd: this.westDockEnd,
      dockEnd: this.dockEnd,
      jungleWestDockEnd: this.jungleWestDockEnd,
      jungleEastDockEnd: this.jungleEastDockEnd,
    });
  }

  private getAreaName(id: MusicZone | "reef" | "collectors" | "frostpeak" | "ashencast"): string {
    if (id === "reef") return "Coral Reef";
    if (id === "collectors") return "Collector's Island";
    if (id === "frostpeak") return "Frostpeak Isle";
    if (id === "ashencast") return "Ashencast Isle";
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
        name: "Ashencast Isle",
        x: (this.ashenLeft + this.ashenRight) / 2,
      },
      {
        name: "Coral Reef",
        x: (this.reefLeft + this.reefRight) / 2,
      },
      {
        name: "Collector's Island",
        x: (this.collectorLeft + this.collectorRight) / 2,
      },
      {
        name: "Starter Island",
        x: (this.islandLeft + this.islandRight) / 2,
      },
      {
        name: "Swamp Island",
        x: (this.jungleLeft + this.jungleRight) / 2,
      },
      {
        name: "Frostpeak Isle",
        x: (this.frostLeft + this.frostRight) / 2,
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

  /** True if X is on walkable village, collectors, ashencast, swamp, or frostpeak docks/island. */
  private isWalkableLandX(x: number): boolean {
    if (x >= this.westDockEnd + 16 && x <= this.dockEnd - 16) return true;
    if (x >= this.ashenWestDock + 8 && x <= this.ashenEastDock - 8) {
      return true;
    }
    if (
      x >= this.collectorWestDock + 8 &&
      x <= this.collectorEastDock - 8
    ) {
      return true;
    }
    if (x >= this.jungleWestDockEnd + 16 && x <= this.jungleEastDockEnd - 16) {
      return true;
    }
    if (x >= this.frostWestDock + 8 && x <= this.frostEastDock - 8) {
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
      if (
        x >= this.collectorWestDock + 8 &&
        x <= this.collectorEastDock - 8
      ) {
        if (x < this.collectorLeft + 40) {
          return { x: this.collectorLeft + 100, y: landY };
        }
        if (x > this.collectorRight - 40) {
          return { x: this.collectorRight - 100, y: landY };
        }
        return { x, y: landY };
      }
      if (x >= this.jungleWestDockEnd + 16 && x < this.jungleLeft + 40) {
        return { x: this.jungleLeft + 100, y: landY };
      }
      if (x > this.jungleRight - 40 && x <= this.jungleEastDockEnd - 16) {
        return { x: this.jungleRight - 100, y: landY };
      }
      if (x >= this.frostWestDock + 8 && x <= this.frostEastDock - 8) {
        if (x < this.frostLeft + 40) {
          return { x: this.frostLeft + 100, y: landY };
        }
        if (x > this.frostRight - 40) {
          return { x: this.frostRight - 100, y: landY };
        }
        return { x, y: landY };
      }
      if (x >= this.ashenWestDock + 8 && x <= this.ashenEastDock - 8) {
        if (x < this.ashenLeft + 40) {
          return { x: this.ashenLeft + 100, y: landY };
        }
        if (x > this.ashenRight - 40) {
          return { x: this.ashenRight - 100, y: landY };
        }
        return { x, y: landY };
      }
      return { x, y: landY };
    }

    // Far west of Ashencast
    if (x < this.ashenWestDock + 8) {
      return { x: this.ashenLeft + 120, y: landY };
    }
    // Between Ashencast and Collectors
    if (x < this.collectorWestDock + 8) {
      const mid = (this.ashenEastDock + this.collectorWestDock) / 2;
      return x < mid
        ? { x: this.ashenRight - 100, y: landY }
        : { x: this.collectorLeft + 120, y: landY };
    }
    // Reef / approach ocean between collectors and starter
    if (x < this.westDockEnd + 16) {
      const mid = (this.reefRight + this.westDockEnd) / 2;
      return x < mid
        ? { x: this.collectorRight - 100, y: landY }
        : { x: this.islandLeft + 100, y: landY };
    }
    // Between starter island and swamp
    if (x < this.jungleWestDockEnd + 16) {
      const mid = (this.dockEnd + this.jungleWestDockEnd) / 2;
      return x < mid
        ? { x: this.islandRight - 100, y: landY }
        : { x: this.jungleLeft + 100, y: landY };
    }
    // Between swamp and Frostpeak Isle
    if (x < this.frostWestDock + 8) {
      const mid = (this.jungleEastDockEnd + this.frostWestDock) / 2;
      return x < mid
        ? { x: this.jungleRight - 100, y: landY }
        : { x: this.frostLeft + 100, y: landY };
    }
    // Far ocean east of Frostpeak Isle
    return { x: this.frostRight - 100, y: landY };
  }

  private clampPlayerToLand(): void {
    const x = this.player.sprite.x;

    if (this.inStellarSky) {
      const minX = this.stellarLandLeft + 16;
      const maxX = this.stellarLandRight - 16;
      if (x < minX) {
        this.player.sprite.x = minX;
        this.player.sprite.setVelocityX(0);
      } else if (x > maxX) {
        this.player.sprite.x = maxX;
        this.player.sprite.setVelocityX(0);
      }
      if (this.player.sprite.y > this.groundY + 80) {
        this.player.sprite.setPosition(
          Phaser.Math.Clamp(this.player.sprite.x, minX, maxX),
          this.groundY - 40
        );
        this.player.sprite.setVelocity(0, 0);
      }
      return;
    }

    if (this.inFrostpeakCave) {
      const zones = caveWalkZones(this.caveOriginX);
      // Hard stop at cave mouth / tip so the body can't hang into the void
      const hardMin = zones[0].min;
      const hardMax = zones[zones.length - 1].max;
      if (x < hardMin) {
        this.player.sprite.x = hardMin;
        this.player.sprite.setVelocityX(0);
      } else if (x > hardMax) {
        this.player.sprite.x = hardMax;
        this.player.sprite.setVelocityX(0);
      } else {
        let inside = false;
        for (const z of zones) {
          if (x >= z.min && x <= z.max) {
            inside = true;
            break;
          }
        }
        if (!inside) {
          let best = zones[0].min;
          let bestD = Math.abs(x - best);
          for (const z of zones) {
            for (const edge of [z.min, z.max]) {
              const d = Math.abs(x - edge);
              if (d < bestD) {
                bestD = d;
                best = edge;
              }
            }
          }
          this.player.sprite.x = best;
          this.player.sprite.setVelocityX(0);
        }
      }
      // Rescue if you somehow fell through the floor
      if (this.player.sprite.y > this.groundY + 80) {
        this.player.sprite.setPosition(
          Phaser.Math.Clamp(this.player.sprite.x, hardMin, hardMax),
          this.groundY - 40
        );
        this.player.sprite.setVelocity(0, 0);
      }
      return;
    }

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

    if (this.isOnCollectorsIsland()) {
      const minX = this.collectorWestDock + 8;
      const maxX = this.collectorEastDock - 8;
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

    if (this.isOnAshencastIsland()) {
      const minX = this.ashenWestDock + 8;
      const maxX = this.ashenEastDock - 8;
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

    if (this.isOnFrostpeak()) {
      const minX = this.frostWestDock + 8;
      const maxX = this.frostEastDock - 8;
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

    // Stranded on reef / between collectors and starter
    if (x > this.collectorEastDock + 40 && x < this.westDockEnd - 40) {
      const mid = (this.reefRight + this.westDockEnd) / 2;
      this.player.sprite.x =
        x < mid ? this.collectorEastDock - 8 : this.westDockEnd + 16;
      this.player.sprite.setVelocityX(0);
      return;
    }

    // Stranded between Ashencast and Collectors
    if (x > this.ashenEastDock + 40 && x < this.collectorWestDock - 40) {
      const mid = (this.ashenEastDock + this.collectorWestDock) / 2;
      this.player.sprite.x =
        x < mid ? this.ashenEastDock - 8 : this.collectorWestDock + 8;
      this.player.sprite.setVelocityX(0);
      return;
    }

    // West of Ashencast into void ocean
    if (x < this.ashenWestDock - 40) {
      this.player.sprite.x = this.ashenWestDock + 8;
      this.player.sprite.setVelocityX(0);
      return;
    }

    // Stranded between starter and swamp
    if (x > this.dockEnd + 80 && x < this.jungleWestDockEnd - 80) {
      const mid = (this.dockEnd + this.jungleWestDockEnd) / 2;
      this.player.sprite.x =
        x < mid ? this.dockEnd - 16 : this.jungleWestDockEnd + 16;
      this.player.sprite.setVelocityX(0);
      return;
    }

    // Stranded between swamp and Frostpeak Isle
    if (x > this.jungleEastDockEnd + 80 && x < this.frostWestDock - 80) {
      const mid = (this.jungleEastDockEnd + this.frostWestDock) / 2;
      this.player.sprite.x =
        x < mid ? this.jungleEastDockEnd - 16 : this.frostWestDock + 8;
      this.player.sprite.setVelocityX(0);
      return;
    }

    // Past Frostpeak Isle east tip (void before cave — never walk into gap)
    if (x > this.frostEastDock + 40 && x < this.caveOriginX) {
      this.player.sprite.x = this.frostEastDock - 8;
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

  /** Sync ember halo to the forge furnace on the rod shaft. */
  private syncForgeRodVfx(): void {
    const show = !this.inFrostpeakCave && !this.inStellarSky && this.player.isForgeRodInHand();
    if (!show) {
      this.forgeRodVfx?.setActive(false);
      return;
    }
    if (!this.forgeRodVfx) {
      this.forgeRodVfx = new ForgeRodTipVfx(this);
    }
    this.forgeRodVfx.setActive(true);
    const furnace = this.player.getForgeFurnaceWorld();
    this.forgeRodVfx.setDepth(this.player.sprite.depth + 1);
    this.forgeRodVfx.update(furnace.x, furnace.y, this.time.now);
  }

  /** Pink/purple energy wrap for Laser Zeus skin while held. */
  private syncLaserRodVfx(): void {
    const show = !this.inFrostpeakCave && !this.inStellarSky && this.player.isLaserRodInHand();
    if (!show) {
      this.laserRodVfx?.setActive(false);
      return;
    }
    if (!this.laserRodVfx) {
      this.laserRodVfx = new LaserRodHeldVfx(this);
    }
    this.laserRodVfx.setActive(true);
    const hand = this.player.getRodHandWorld();
    const tip = this.player.getRodTip();
    this.laserRodVfx.setDepth(this.player.sprite.depth + 2);
    this.laserRodVfx.update(hand.x, hand.y, tip.x, tip.y, this.time.now);
  }

  /** Frostpeak skin held VFX (Hyperthermic / Hyperboreal / Halo / Lotus). */
  private syncFrostRodVfx(): void {
    const theme = !this.inFrostpeakCave && !this.inStellarSky
      ? this.player.getFrostHeldTheme()
      : null;
    if (!theme) {
      this.frostRodVfx?.setActive(false);
      return;
    }
    if (!this.frostRodVfx) {
      this.frostRodVfx = new FrostRodHeldVfx(this);
    }
    this.frostRodVfx.setTheme(theme);
    this.frostRodVfx.setActive(true);
    const hand = this.player.getRodHandWorld();
    const tip = this.player.getRodTip();
    this.frostRodVfx.setDepth(this.player.sprite.depth + 2);
    this.frostRodVfx.update(hand.x, hand.y, tip.x, tip.y, this.time.now);
  }

  /** Galactic sparkles on the held Stellar Surfer (not while the board is underfoot). */
  private syncStellarSurferVfx(): void {
    const show =
      !this.inFrostpeakCave &&
      !this.inStellarSky &&
      !this.isRidingStellarSurfer() &&
      this.player.isStellarSurferInHand();
    if (!show) {
      this.stellarSurferVfx?.setActive(false);
      return;
    }
    if (!this.stellarSurferVfx) {
      this.stellarSurferVfx = new StellarSurferHeldVfx(this);
    }
    this.stellarSurferVfx.setActive(true);
    const hand = this.player.getRodHandWorld();
    const tip = this.player.getRodTip();
    this.stellarSurferVfx.setDepth(this.player.sprite.depth + 2);
    this.stellarSurferVfx.update(hand.x, hand.y, tip.x, tip.y, this.time.now);
  }

  /** Floating rocks + dark-matter bridges on the held Star Line Rod. */
  private syncStarLineVfx(): void {
    const show = !this.inFrostpeakCave && !this.inStellarSky && this.player.isStarLineRodInHand();
    if (!show) {
      this.starLineVfx?.setActive(false);
      return;
    }
    if (!this.starLineVfx) {
      this.starLineVfx = new StarLineHeldVfx(this);
    }
    this.starLineVfx.setActive(true);
    const hand = this.player.getRodHandWorld();
    const tip = this.player.getRodTip();
    this.starLineVfx.setDepth(this.player.sprite.depth + 2);
    this.starLineVfx.update(hand.x, hand.y, tip.x, tip.y, this.time.now);
  }

  /** Surfer mastery: ride time, follower black hole, periodic area fish. */
  private updateSurferMastery(delta: number): void {
    if (this.isRidingStellarSurfer()) {
      this.inventory.recordSurferMasteryRideMs(delta);
      this.sailboat?.setDuckCosmetic(
        this.inventory.isRubberDuckSurferSkinActive()
      );
    }

    const surferEquipped =
      this.inventory.getEquippedRodId() === "test_rod" &&
      this.inventory.isStellarSurferMasteryUnlocked();
    if (!surferEquipped) {
      this.surferMasteryBlackHole?.setActive(false);
      this.surferMasteryGrantMs = 0;
      this.surferMasteryGrantPending = false;
      return;
    }

    if (!this.surferMasteryBlackHole) {
      this.surferMasteryBlackHole = new SurferMasteryBlackHole(this);
    }
    this.surferMasteryBlackHole.setActive(true);
    this.surferMasteryBlackHole.setDuckMode(
      this.inventory.isRubberDuckSurferSkinActive()
    );
    this.surferMasteryBlackHole.setDepth(this.player.sprite.depth - 1);
    this.surferMasteryBlackHole.update(
      this.player.sprite.x,
      this.player.sprite.y,
      this.player.getFacing() === "left",
      delta
    );

    this.surferMasteryGrantMs += delta;
    if (
      this.surferMasteryGrantMs >= InventorySystem.SURFER_MASTERY_GRANT_MS &&
      !this.surferMasteryGrantPending
    ) {
      this.surferMasteryGrantMs = 0;
      this.surferMasteryGrantPending = true;
      const totalMs = this.surferMasteryBlackHole.playGrantBurst();
      // Fish pops at the explode beat (~38% into the burst)
      this.time.delayedCall(totalMs * 0.4, () => {
        this.surferMasteryGrantPending = false;
        this.trySurferMasteryFishGrant();
      });
    }
  }

  private getHabitatNearPlayer(): FishHabitat {
    if (this.inFrostpeakCave) return "cave";
    const x = this.player.sprite.x;
    const zones = getBaitWaterZones(this.getBaitCastBounds());
    for (const z of zones) {
      if (x >= z.left && x <= z.right) return z.habitat;
    }
    let best: FishHabitat = "ocean";
    let bestDist = Infinity;
    for (const z of zones) {
      const mid = (z.left + z.right) / 2;
      const d = Math.abs(x - mid);
      if (d < bestDist) {
        bestDist = d;
        best = z.habitat;
      }
    }
    return best;
  }

  private trySurferMasteryFishGrant(): void {
    if (!this.inventory.isStellarSurferMasteryUnlocked()) return;
    if (this.inventory.getEquippedRodId() !== "test_rod") return;
    const habitat = this.getHabitatNearPlayer();
    const luck = this.inventory.getFishingStats().luck;
    const speciesId = rollFishSpecies(luck, habitat, [
      "dolphin",
      "cave_whale",
    ]);
    if (speciesId === "dolphin" || speciesId === "cave_whale") return;
    if (ITEMS[speciesId]?.abundanceOnly) return;
    const wasNewBySpecies = new Map<ItemId, boolean>([
      [speciesId, !this.inventory.isBestiaryFound(speciesId)],
    ]);
    const mutation: FishMutationId =
      Math.random() < 0.8 ? "starstruck" : "event_horizon";
    const size = rollFishSize();
    const added = this.inventory.addItem(speciesId, 1, mutation, size);
    if (!added) return;
    const ui = this.scene.get("UIScene") as UIScene | undefined;
    ui?.presentCatchToasts(
      [{ speciesId, mutation, size }],
      wasNewBySpecies
    );
    this.persistSave();
  }

  /** Hotbar rod + optional active skin (baked styles; Gallery overlay only). */
  syncPlayerCarriedRod(): void {
    const selected = this.inventory.getSelectedItem();
    const skinId =
      selected && ITEMS[selected]?.isRod
        ? this.inventory.getActiveRodSkinId(selected)
        : null;
    const skin =
      skinId && skinId !== "default"
        ? this.inventory.getActiveRodSkin(selected!)
        : null;
    const skinDef =
      skin && skin.id in ROD_SKINS
        ? ROD_SKINS[skin.id as keyof typeof ROD_SKINS]
        : null;
    this.player.syncCarriedRod(selected, {
      skinId: skinId === "default" ? null : skinId,
      skinTextureKey: skinDef?.overlay ? skin?.textureKey ?? null : null,
      skinLayout: skinDef?.overlay ? skinDef.layout : null,
    });
  }

  /** Cosmetic hat overlay from accessories. */
  syncPlayerHat(): void {
    this.player.syncHat(this.inventory.getEquippedHatId());
  }

  persistSave(): void {
    if (!this.inventory || !this.player) return;
    this.syncCurioStockToInventory();
    // Don't save the player stuck inside the mountain / stellar pocket
    const saveX =
      this.inFrostpeakCave || this.inStellarSky
        ? this.inStellarSky
          ? this.stellarReturnX || (this.islandLeft + this.islandRight) / 2
          : this.frostCaveX
        : this.player.sprite.x;
    const saveY =
      this.inFrostpeakCave || this.inStellarSky
        ? this.groundY - 40
        : this.player.sprite.y;
    saveActiveSave(
      this.inventory.toSave({
        playerX: saveX,
        playerY: saveY,
        tutorialDone: this.tutorialDone,
        gameMinutes: this.dayNight?.getTotalMinutes() ?? 13 * 60,
        weatherId: this.weather?.weather ?? "clear",
      })
    );
  }

  /** Keep curio stall + wall-clock restock in the save buffer. */
  private syncCurioStockToInventory(): void {
    if (!this.curioStock || !this.inventory) return;
    this.inventory.curioStockSave = this.curioStock.exportPersisted();
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
    this.scene.stop("AmuletCaveScene");
    this.scene.stop("CloudShopScene");
    this.scene.stop("ShopScene");
    this.scene.stop("BobberShopScene");
    this.scene.stop("BackpackShopScene");
    this.scene.stop("SkinShopScene");
    this.scene.stop("UIScene");
    this.scene.start("MenuScene");
  }

  shutdown(): void {
    // Local cleanup only. Do NOT stop/start other scenes here — that races
    // Phaser's scene manager and can freeze the menu with dead buttons.
    this.autosaveTimer?.remove(false);
  }
}
