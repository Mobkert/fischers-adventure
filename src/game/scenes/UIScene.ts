import Phaser from "phaser";
import { Hotbar } from "../ui/Hotbar";
import { InventoryPanel } from "../ui/InventoryPanel";
import { CatchMinigame } from "../ui/CatchMinigame";
import { SkinCrateReveal } from "../ui/SkinCrateReveal";
import { SkinCrateMenu } from "../ui/SkinCrateMenu";
import { EquipmentBag } from "../ui/EquipmentBag";
import { BestiaryPanel } from "../ui/BestiaryPanel";
import { FishingTutorial } from "../ui/FishingTutorial";
import {
  AUGMENT_UPGRADE_CHANCE,
  ITEMS,
  ItemId,
  RARITY_COLOR,
  RARITY_LABEL,
  MUTATIONS,
  FISH_SIZES,
  sizeScale,
} from "../data/items";
import { BoatMenu } from "../ui/BoatMenu";
import { CoinDisplay } from "../ui/CoinDisplay";
import { QuestTracker } from "../ui/QuestTracker";
import { WildflowerBuyPanel } from "../ui/WildflowerBuyPanel";
import { OreVendorPanel } from "../ui/OreVendorPanel";
import { CoralRodOfferPanel } from "../ui/CoralRodOfferPanel";
import { BargainPanel, BargainSession } from "../ui/BargainPanel";
import { AugmentUpgradePanel } from "../ui/AugmentUpgradePanel";
import { ForgeCraftPanel } from "../ui/ForgeCraftPanel";
import { CodeGuyPanel } from "../ui/CodeGuyPanel";
import { BargainKind } from "../systems/BargainLogic";
import { SettingsMenu } from "../ui/SettingsMenu";
import { MobileControls } from "../ui/MobileControls";
import { isMobileModeEnabled } from "../input/MobileMode";
import { OceanMarkers, OceanMarkerInfo } from "../ui/OceanMarkers";
import { InventorySystem } from "../systems/InventorySystem";
import { FishingSystem } from "../systems/FishingSystem";
import type { CaughtFishResult } from "../systems/FishingSystem";
import { WeatherSystem } from "../systems/WeatherSystem";
import { DayNightCycle } from "../systems/DayNightCycle";
import { CurioStockEntry } from "../systems/CurioTraderStock";
import { playCatchSfx } from "../audio/CatchSfx";
import type { Player } from "../entities/Player";

interface UISceneData {
  inventory: InventorySystem;
  fishing: FishingSystem;
  weather: WeatherSystem;
  dayNight: DayNightCycle;
  player: Player;
  getPointerDown: () => boolean;
  getPointerRightDown: () => boolean;
  tryMobileCast: () => void;
  canOpenBoatMenu: () => boolean;
  spawnBoat: (id: import("../data/boats").BoatId) => void;
  buyBoat: (
    id: import("../data/boats").BoatId
  ) => { ok: boolean; message: string };
  tryBoardOrExitBoat: () => boolean;
  tryTalkToMerchant: () => boolean;
  tryVaultGemInteract: () => boolean;
  declineMerchant: () => void;
  tryBuyJungleRod: () => boolean;
  trySecretFallThrough: () => boolean;
  tryOpenBargain: () => boolean;
  completeBargainDeal: (session: BargainSession, price: number) => void;
  declineBargainers: () => void;
  getCurioStock: () => CurioStockEntry[];
  getCurioRestockMs: () => number;
  tryEnterShop: () => boolean;
  tryEnterBobberShop: () => boolean;
  tryEnterBackpackShop: () => boolean;
  tryEnterSkinShop: () => boolean;
  tryEnterWhirlpoolCloud: () => boolean;
  tryEnterAmuletCave: () => boolean;
  tryEnterFrostpeakCave: () => boolean;
  tryLeaveFrostpeakCave: () => boolean;
  tryUseAmulet: (id: import("../data/items").ItemId) => boolean;
  isNearCaveCrack: () => boolean;
  isInFrostpeakCave: () => boolean;
  isNearCoralRodOnBoat: () => boolean;
  tryOpenCoralRodOffer: () => boolean;
  offerCoralRodGift: (amount: number) => boolean;
  isNearBlueHouse: () => boolean;
  isNearRedHouse: () => boolean;
  isNearGreenHouse: () => boolean;
  isNearCollectorSkinHouse: () => boolean;
  getMusicVolume: () => number;
  setMusicVolume: (v: number) => void;
  isTutorialDone: () => boolean;
  markTutorialDone: () => void;
  quitToMenu: () => void;
  persistSave: () => void;
}

export class UIScene extends Phaser.Scene {
  private inventory!: InventorySystem;
  private fishing!: FishingSystem;
  private weather!: WeatherSystem;
  private dayNight!: DayNightCycle;
  private player!: Player;
  private getPointerDown!: () => boolean;
  private getPointerRightDown!: () => boolean;
  private tryMobileCast!: () => void;
  private canOpenBoatMenu!: () => boolean;
  private spawnBoat!: (id: import("../data/boats").BoatId) => void;
  private buyBoat!: (
    id: import("../data/boats").BoatId
  ) => { ok: boolean; message: string };
  private tryBoardOrExitBoat!: () => boolean;
  private tryTalkToMerchant!: () => boolean;
  private tryVaultGemInteract!: () => boolean;
  private declineMerchant!: () => void;
  private tryBuyJungleRod!: () => boolean;
  private trySecretFallThrough!: () => boolean;
  private tryOpenBargain!: () => boolean;
  private completeBargainDeal!: (session: BargainSession, price: number) => void;
  private declineBargainers!: () => void;
  private getCurioStock!: () => CurioStockEntry[];
  private getCurioRestockMs!: () => number;
  private tryEnterShop!: () => boolean;
  private tryEnterBobberShop!: () => boolean;
  private tryEnterBackpackShop!: () => boolean;
  private tryEnterSkinShop!: () => boolean;
  private tryEnterWhirlpoolCloud!: () => boolean;
  private tryEnterAmuletCave!: () => boolean;
  private tryEnterFrostpeakCave!: () => boolean;
  private tryLeaveFrostpeakCave!: () => boolean;
  private tryUseAmulet!: (id: import("../data/items").ItemId) => boolean;
  private isInFrostpeakCave!: () => boolean;
  private tryOpenCoralRodOffer!: () => boolean;
  private offerCoralRodGift!: (amount: number) => boolean;
  private isNearBlueHouse!: () => boolean;
  private isNearRedHouse!: () => boolean;
  private isNearGreenHouse!: () => boolean;
  private isNearCollectorSkinHouse!: () => boolean;
  private getMusicVolume!: () => number;
  private setMusicVolume!: (v: number) => void;
  private isTutorialDone!: () => boolean;
  private markTutorialDone!: () => void;
  private quitToMenu!: () => void;
  private persistSave!: () => void;
  private hotbar!: Hotbar;
  private inventoryPanel!: InventoryPanel;
  private skinCrateReveal!: SkinCrateReveal;
  private skinCrateMenu!: SkinCrateMenu;
  private equipmentBag!: EquipmentBag;
  private bestiaryPanel!: BestiaryPanel;
  private tutorial!: FishingTutorial;
  private minigame!: CatchMinigame;
  private boatMenu!: BoatMenu;
  private wildflowerBuy!: WildflowerBuyPanel;
  private oreVendor!: OreVendorPanel;
  private coralRodOffer!: CoralRodOfferPanel;
  private bargainPanel!: BargainPanel;
  private forgePanel!: ForgeCraftPanel;
  private codeGuyPanel!: CodeGuyPanel;
  private codeGuyCloseHook?: () => void;
  private augmentUpgrade!: AugmentUpgradePanel;
  private settings!: SettingsMenu;
  private mobileControls!: MobileControls;
  private coins!: CoinDisplay;
  private questTracker!: QuestTracker;
  private oceanMarkers!: OceanMarkers;
  private promptText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;
  private weatherBanner?: Phaser.GameObjects.Text;
  private areaBanner?: Phaser.GameObjects.Text;

  constructor() {
    super("UIScene");
  }

  init(data: UISceneData): void {
    this.inventory = data.inventory;
    this.fishing = data.fishing;
    this.weather = data.weather;
    this.dayNight = data.dayNight;
    this.player = data.player;
    this.getPointerDown = data.getPointerDown;
    this.getPointerRightDown = data.getPointerRightDown;
    this.tryMobileCast = data.tryMobileCast;
    this.canOpenBoatMenu = data.canOpenBoatMenu;
    this.spawnBoat = data.spawnBoat;
    this.buyBoat = data.buyBoat;
    this.tryBoardOrExitBoat = data.tryBoardOrExitBoat;
    this.tryTalkToMerchant = data.tryTalkToMerchant;
    this.tryVaultGemInteract = data.tryVaultGemInteract;
    this.declineMerchant = data.declineMerchant;
    this.tryBuyJungleRod = data.tryBuyJungleRod;
    this.trySecretFallThrough = data.trySecretFallThrough;
    this.tryOpenBargain = data.tryOpenBargain;
    this.completeBargainDeal = data.completeBargainDeal;
    this.declineBargainers = data.declineBargainers;
    this.getCurioStock = data.getCurioStock;
    this.getCurioRestockMs = data.getCurioRestockMs;
    this.tryEnterShop = data.tryEnterShop;
    this.tryEnterBobberShop = data.tryEnterBobberShop;
    this.tryEnterBackpackShop = data.tryEnterBackpackShop;
    this.tryEnterSkinShop = data.tryEnterSkinShop;
    this.tryEnterWhirlpoolCloud = data.tryEnterWhirlpoolCloud;
    this.tryEnterAmuletCave = data.tryEnterAmuletCave;
    this.tryEnterFrostpeakCave = data.tryEnterFrostpeakCave;
    this.tryLeaveFrostpeakCave = data.tryLeaveFrostpeakCave;
    this.tryUseAmulet = data.tryUseAmulet;
    this.isInFrostpeakCave = data.isInFrostpeakCave;
    this.tryOpenCoralRodOffer = data.tryOpenCoralRodOffer;
    this.offerCoralRodGift = data.offerCoralRodGift;
    this.isNearBlueHouse = data.isNearBlueHouse;
    this.isNearRedHouse = data.isNearRedHouse;
    this.isNearGreenHouse = data.isNearGreenHouse;
    this.isNearCollectorSkinHouse = data.isNearCollectorSkinHouse;
    this.getMusicVolume = data.getMusicVolume;
    this.setMusicVolume = data.setMusicVolume;
    this.isTutorialDone = data.isTutorialDone;
    this.markTutorialDone = data.markTutorialDone;
    this.quitToMenu = data.quitToMenu;
    this.persistSave = data.persistSave;
  }

  create(): void {
    this.hotbar = new Hotbar(this, this.inventory);
    this.inventoryPanel = new InventoryPanel(this, this.inventory);
    this.inventoryPanel.setOnChanged(() => {
      this.persistSave();
    });
    this.skinCrateReveal = new SkinCrateReveal(this, this.inventory);
    this.skinCrateReveal.setOnDone((message) => {
      this.inventoryPanel.refresh();
      this.hotbar.refresh();
      this.coins.refresh();
      this.equipmentBag.refresh();
      this.showToast(message, "#ffe066");
      this.persistSave();
      const game = this.scene.get("GameScene") as
        | { syncPlayerCarriedRod?: () => void }
        | undefined;
      game?.syncPlayerCarriedRod?.();
    });
    this.skinCrateMenu = new SkinCrateMenu(this, this.inventory);
    this.skinCrateMenu.setOnOpen((count, kind) => {
      this.skinCrateMenu.close();
      if (!this.skinCrateReveal.open(count, kind)) {
        this.showToast("Couldn't open crate.", "#ff8866");
        return;
      }
      this.inventoryPanel.refresh();
      this.hotbar.refresh();
      this.persistSave();
    });
    this.inventoryPanel.setOnOpenSkinCrate((kind) => {
      if (this.skinCrateReveal.isBusy() || this.skinCrateMenu.isBusy()) return;
      const itemId = kind === "frostpeak" ? "frostpeak_crate" : "skin_crate";
      if (this.inventory.countItem(itemId) <= 0) {
        this.showToast(
          kind === "frostpeak" ? "No Frostpeak Crates." : "No Skin Crates.",
          "#ff8866"
        );
        return;
      }
      this.inventoryPanel.setOpen(false);
      this.skinCrateMenu.open(kind);
    });
    this.inventoryPanel.setOnOpenOreCluster(() => {
      const result = this.inventory.openOreCluster();
      if (!result.ok || !result.oreId) {
        this.showToast(result.message, "#ff8866");
        return;
      }
      this.showOreFound(result.oreId);
      this.onCoinsChanged();
      this.persistSave();
    });
    this.equipmentBag = new EquipmentBag(this, this.inventory);
    this.equipmentBag.setOnChanged((message) => {
      this.hotbar.refresh();
      this.showToast(message, "#ffe066");
      this.persistSave();
      const game = this.scene.get("GameScene") as
        | { syncPlayerCarriedRod?: () => void }
        | undefined;
      game?.syncPlayerCarriedRod?.();
    });
    this.equipmentBag.setOnAmuletUsed((amuletId) => {
      this.equipmentBag.setOpen(false);
      this.tryUseAmulet(amuletId);
      this.equipmentBag.refresh();
      this.persistSave();
    });
    this.equipmentBag.setOnHatChanged(() => {
      const game = this.scene.get("GameScene") as
        | { syncPlayerHat?: () => void }
        | undefined;
      game?.syncPlayerHat?.();
    });
    this.bestiaryPanel = new BestiaryPanel(this, this.inventory);
    this.bestiaryPanel.setOnChanged((message) => {
      this.coins.refresh();
      this.persistSave();
      this.showToast(message, "#ffe066");
    });
    this.minigame = new CatchMinigame(this);
    this.boatMenu = new BoatMenu(this, this.inventory);
    this.boatMenu.setOnSpawn((boatId) => {
      this.spawnBoat(boatId);
      const name =
        boatId === "jetski"
          ? "Jet Ski"
          : boatId === "speedboat"
            ? "Speedboat"
            : "Sailboat";
      this.showToast(`${name} launched! Press F near it to board.`, "#7ec8e3");
    });
    this.boatMenu.setOnBuy((boatId) => {
      const result = this.buyBoat(boatId);
      this.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
      this.coins.refresh();
    });
    this.boatMenu.setOnChanged(() => {
      this.coins.refresh();
      this.persistSave();
    });
    this.wildflowerBuy = new WildflowerBuyPanel(this);
    this.wildflowerBuy.setCallbacks(() => {
      // Second confirm (click Buy) — purchase if panel is open
      this.tryBuyJungleRod();
      this.hotbar.refresh();
    });
    this.oreVendor = new OreVendorPanel(this);
    this.oreVendor.setCallbacks(
      (amount) => {
        const result = this.inventory.buyOreClusters(amount, Date.now());
        this.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
        this.onCoinsChanged();
        this.persistSave();
        this.oreVendor.syncState(
          this.inventory.getOreVendorStock(Date.now()),
          this.inventory.getOreVendorRestockMs(Date.now())
        );
        if (result.ok && this.inventory.getOreVendorStock(Date.now()) <= 0) {
          // keep panel open to show sold-out timer
        }
      },
      () => {
        /* closed */
      }
    );
    this.coralRodOffer = new CoralRodOfferPanel(this);
    this.coralRodOffer.setCallbacks(
      (amount) => {
        this.offerCoralRodGift(amount);
        this.hotbar.refresh();
      },
      () => this.closeCoralRodOffer()
    );
    this.bargainPanel = new BargainPanel(this);
    this.bargainPanel.setInventory(this.inventory);
    this.bargainPanel.setCurioStockProvider(
      () => this.getCurioStock(),
      () => this.getCurioRestockMs()
    );
    this.bargainPanel.setCallbacks(
      (session, price) => {
        this.completeBargainDeal(session, price);
        this.hotbar.refresh();
        this.inventoryPanel.refresh();
        this.equipmentBag.refresh();
      },
      () => {
        this.declineBargainers();
      },
      () => this.onCoinsChanged()
    );
    this.forgePanel = new ForgeCraftPanel(this, this.inventory);
    this.forgePanel.setOnCrafted(() => {
      this.hotbar.refresh();
      this.equipmentBag.refresh();
      this.inventoryPanel.refresh();
      this.persistSave();
      this.showToast("Forged the Tranquil Rod!", "#7CFC00");
    });
    this.codeGuyPanel = new CodeGuyPanel(this);
    this.codeGuyPanel.setInventory(this.inventory);
    this.codeGuyPanel.setCallbacks(
      () => {
        this.setPrompt(null);
        this.codeGuyCloseHook?.();
        this.codeGuyCloseHook = undefined;
      },
      () => {
        this.onCoinsChanged();
        this.equipmentBag.refresh();
        this.inventoryPanel.refresh();
        this.persistSave();
        const game = this.scene.get("GameScene") as {
          refreshAnvilOceanFloater?: () => void;
        };
        game.refreshAnvilOceanFloater?.();
      },
      (msg, color) => this.showToast(msg, color)
    );
    this.augmentUpgrade = new AugmentUpgradePanel(this);
    this.augmentUpgrade.setInventory(this.inventory);
    this.augmentUpgrade.setOnPicked(() => {
      this.equipmentBag.refresh();
      this.hotbar.refresh();
      this.persistSave();
      this.showToast("Augment Rod upgraded!", "#c8d0d8");
    });
    this.settings = new SettingsMenu(
      this,
      () => this.getMusicVolume(),
      (v) => this.setMusicVolume(v),
      () => this.quitToMenu(),
      (on) => this.applyMobileMode(on)
    );
    this.mobileControls = new MobileControls(this, {
      setVirtual: (key, down) => this.player.setVirtualKey(key, down),
      pressJump: () => this.player.queueJump(),
      onCast: () => this.tryMobileCast(),
      onInteract: () => this.handleInteractKey(),
      onInventory: () => this.handleInventoryKey(),
      onBoat: () => this.handleBoatKey(),
    });
    this.hotbar.setOnSlotSelect((i) => this.selectHotbarSlot(i));
    this.coins = new CoinDisplay(this, this.inventory);
    this.coins.setWeather(this.weather);
    this.coins.setDayNight(this.dayNight);
    this.questTracker = new QuestTracker(this, this.inventory);
    this.oceanMarkers = new OceanMarkers(this);
    this.weather.onWeatherChange = (id, name) => {
      this.coins.refresh();
      if (id === "clear") {
        this.showWeatherBanner("Weather clears…", "#c8d0d8");
      } else {
        this.showWeatherBanner(`${name} rolls in!`, this.weather.getDef().iconColor);
      }
    };
    this.weather.onLightningAnnounce = (message) => {
      this.showWeatherBanner(message, "#ffe066");
    };
    this.tutorial = new FishingTutorial(this, {
      isDone: () => this.isTutorialDone(),
      markDone: () => {
        this.markTutorialDone();
        this.persistSave();
      },
    });
    this.tutorial.setOnFinished((reward) => {
      this.inventory.coins += reward;
      this.coins.refresh();
      this.persistSave();
      this.showToast(`Tutorial complete! +$${reward}`, "#ffe066");
    });
    this.promptText = this.add
      .text(this.scale.width / 2, this.scale.height - 100, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffe066",
        backgroundColor: "#00000099",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    // Apply after HUD pieces exist — Mobile Mode touches coins/quests/prompt
    this.applyMobileMode(isMobileModeEnabled());

    const keyboard = this.input.keyboard!;
    for (let i = 0; i < 5; i++) {
      const key = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + i);
      key.on("down", () => {
        if (this.isTextEntryOpen()) return;
        this.selectHotbarSlot(i);
      });
    }

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on("down", () => {
      if (this.isTextEntryOpen()) return;
      this.handleInventoryKey();
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.settings.isOpen()) {
        this.settings.setOpen(false);
        return;
      }
      if (this.forgePanel.isOpen()) {
        this.closeForge();
        return;
      }
      if (this.codeGuyPanel.isOpen()) {
        this.closeCodeGuy();
        return;
      }
      if (this.equipmentBag.visible) {
        this.equipmentBag.setOpen(false);
        return;
      }
      if (this.bestiaryPanel.visible) {
        this.bestiaryPanel.setOpen(false);
        return;
      }
      if (this.inventoryPanel.visible) {
        this.inventoryPanel.setOpen(false);
      }
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on("down", () => {
      if (this.isTextEntryOpen()) return;
      if (this.tutorial.visible) return;
      if (this.isInFrostpeakCave?.()) return;
      if (this.minigame.isActive() || this.boatMenu.visible) return;
      if (
        this.inventoryPanel.visible ||
        this.equipmentBag.visible ||
        this.bestiaryPanel.visible
      )
        return;
      if (this.tryEnterShop()) return;
      if (this.tryEnterBobberShop()) return;
      if (this.tryEnterBackpackShop()) return;
      if (this.tryEnterSkinShop()) return;
      if (
        this.isNearBlueHouse() ||
        this.isNearRedHouse() ||
        this.isNearGreenHouse() ||
        this.isNearCollectorSkinHouse()
      ) {
        this.showToast("Can't enter right now.", "#ffaa66");
      }
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on("down", () => {
      if (this.isTextEntryOpen()) return;
      this.handleBoatKey();
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F).on("down", () => {
      if (this.isTextEntryOpen()) return;
      this.handleInteractKey();
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.minigame.isActive()) return;
      if (this.isBlockingInput()) return;
      if (this.tryLeaveFrostpeakCave()) return;
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X).on("down", () => {
      if (this.isTextEntryOpen()) return;
      if (this.tutorial.visible) return;
      if (this.augmentUpgrade.visible) return;
      if (this.minigame.isActive() || this.boatMenu.visible) return;
      if (this.bargainPanel.visible) {
        this.closeBargain();
        return;
      }
      if (this.coralRodOffer.visible) {
        this.closeCoralRodOffer();
        return;
      }
      if (this.oreVendor.visible) {
        this.closeOreVendor();
        return;
      }
      if (this.wildflowerBuy.visible) {
        this.closeWildflowerBuy();
        return;
      }
      if (this.fishing.isBusy()) {
        this.fishing.cancelCast();
        return;
      }
      this.declineMerchant();
    });

    // Digit entry for coral rod / bargain offer (and Esc/Enter)
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.augmentUpgrade.visible) {
        this.augmentUpgrade.handleKey(event);
        return;
      }
      if (this.bargainPanel.visible) {
        this.bargainPanel.handleKey(event);
        return;
      }
      if (this.codeGuyPanel.isOpen()) {
        this.codeGuyPanel.handleKey(event);
        return;
      }
      if (this.coralRodOffer.visible) {
        this.coralRodOffer.handleKey(event);
        return;
      }
      if (this.oreVendor.visible) {
        this.oreVendor.handleKey(event);
      }
    });

    // First-run fishing guide
    this.time.delayedCall(200, () => {
      this.tutorial.tryStart();
    });

    this.wireFishingCallbacks();
  }

  private wireFishingCallbacks(): void {
    this.fishing.onBite = (speciesId) => {
      const def = ITEMS[speciesId];
      const rarity = def.rarity ?? "common";
      const toastColor =
        rarity === "common" ? "#ff5555" : RARITY_COLOR[rarity];
      this.showToast("Fish on the line!", toastColor);
    };

    this.fishing.onLineTooShort = () => {
      this.showToast(
        "Your line isn't deep enough — rarer fish swim deeper!",
        "#7ec8ff"
      );
    };

    this.fishing.onMinigameStart = () => {
      const speciesId = this.fishing.getTargetSpeciesId() ?? "sockeye_salmon";
      const def = ITEMS[speciesId];
      const rod = this.weather.modifyStats(
        this.inventory.getFishingStats(),
        this.inventory.getEquippedRodId()
      );
      const rarity = def.rarity ?? "common";
      const sizeMult = sizeScale(this.fishing.getTargetSize());
      const worldMut = this.fishing.isBobberInWhirlpool()
        ? "thunder"
        : this.fishing.getTargetMutation();
      const worldMutDef = worldMut ? MUTATIONS[worldMut] : null;
      const dual = this.fishing.hasSecondFish();
      const secondId = this.fishing.getSecondSpeciesId();
      const def2 = secondId ? ITEMS[secondId] : null;
      const sizeMult2 = sizeScale(this.fishing.getSecondSize());
      const worldMut2 = this.fishing.isBobberInWhirlpool()
        ? "thunder"
        : this.fishing.getSecondMutation();
      const worldMutDef2 = worldMut2 ? MUTATIONS[worldMut2] : null;

      // Dual catch: combine both fish stats, but only use the fishs' own
      // progress penalties and cap the result at -80%.
      let speedMult = def.minigameSpeed ?? 1;
      let progressSpeed = rod.progressSpeed + (def.catchProgress ?? 0);
      let chaos = def.minigameChaos ?? 1;
      let drainMult = def.drainMult ?? 1;
      let jerky = def.minigameJerky ?? false;
      let unstoppable = def.unstoppableJerky ?? false;
      if (dual && def2) {
        speedMult = Math.max(speedMult, def2.minigameSpeed ?? 1) * 1.25;
        progressSpeed += def2.catchProgress ?? 0;
        chaos = Math.max(chaos, def2.minigameChaos ?? 1) * 1.15;
        drainMult = Math.max(drainMult, def2.drainMult ?? 1) * 1.2;
        jerky = jerky || !!def2.minigameJerky;
        unstoppable = unstoppable || !!def2.unstoppableJerky;
      }
      // Twin-hook stacks can't go below -80; solo mythicals (whale) can hit -95.
      progressSpeed = Math.max(dual ? -80 : -95, progressSpeed);

      this.equipmentBag.setOpen(false);
      this.bestiaryPanel.setOpen(false);
      this.hotbar.setVisible(false);
      this.minigame.start(
        (success, meta) => {
          this.hotbar.setVisible(true);
          this.hotbar.refresh();
          const wasNew = !this.inventory.isBestiaryFound(speciesId);
          this.fishing.completeCatch(success, meta);
          if (success) {
            const caught = this.fishing.lastCaughtFish;
            if (caught.length > 1) {
              playCatchSfx(this, rarity, caught[0]?.mutation ?? null);
              this.showToast(
                `Twin catch! Landed ${caught.length} fish!`,
                "#ffe066"
              );
            } else {
              const article = /^[aeiou]/i.test(def.name) ? "an" : "a";
              const mut = this.fishing.lastCatchMutation;
              const mutDef = mut ? MUTATIONS[mut] : null;
              const size = this.fishing.lastCatchSize;
              const sizeDef =
                size && size !== "normal" ? FISH_SIZES[size] : null;
              playCatchSfx(this, rarity, mut);
              const bits: string[] = [];
              if (mutDef) bits.push(mutDef.label.trim());
              if (sizeDef) bits.push(sizeDef.name);
              bits.push(RARITY_LABEL[rarity].trim());
              const prefix = bits.length ? `${bits.join(" ")} ` : "";
              const newEntry =
                wasNew && this.inventory.isBestiaryFound(speciesId)
                  ? " · New bestiary entry!"
                  : "";
              this.showToast(
                `${prefix}Caught ${article} ${def.name}!${newEntry}`,
                mutDef?.toastColor ?? RARITY_COLOR[rarity]
              );
            }
            this.inventoryPanel.refresh();
            this.coins.refresh();
            this.persistSave();
            this.maybeOpenAugmentUpgrade();
          } else {
            this.showToast("The fish got away...", "#ffaa66");
          }
        },
        {
          textureKey: def.textureKey,
          speedMult,
          jerky,
          chaos,
          drainMult,
          unstoppableJerky: unstoppable,
          pauseChance: def.minigamePauseChance,
          pauseDuration: def.minigamePauseDuration,
          facesLeft: def.facesLeft ?? false,
          rotateDeg: def.minigameRotateDeg ?? 0,
          tint: worldMutDef?.tint ?? null,
          tintFill: worldMutDef?.tintFill ?? false,
          glowColor: worldMutDef?.glowColor ?? null,
          displayWidth: Math.round(
            (def.minigameDisplayWidth ?? def.displayWidth ?? 48) *
              0.9 *
              sizeMult
          ),
          displayHeight: Math.round(
            (def.minigameDisplayHeight ?? def.displayHeight ?? 16) *
              0.9 *
              sizeMult
          ),
          control: rod.control,
          resilience:
            rod.resilience +
            (def.catchResilience ?? 0) +
            (dual && def2 ? (def2.catchResilience ?? 0) : 0),
          progressSpeed,
          crystalBurst:
            ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
            "crystal_burst",
          zeusStrike:
            ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
            "zeus_strike",
          recoilKick:
            ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
            "recoil_kick",
          recoilBurstMastery: this.inventory.isRecoilBurstMasteryUnlocked(),
          forgeStrike:
            ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
            "forge_strike",
          starweaverWeave:
            ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
            "starweaver_weave",
          birthdayParty:
            ITEMS[this.inventory.getEquippedRodId()]?.rodMinigamePower ===
            "birthday_party",
          rodSkinId: (() => {
            const sid = this.inventory.getActiveRodSkinId(
              this.inventory.getEquippedRodId()
            );
            return sid === "default" ? null : sid;
          })(),
          tranquilBubble: this.fishing.getTranquilBubbleProc(),
          onTranquilBubblePop: () => this.fishing.popTargetTranquilBubble(),
          second:
            dual && def2
              ? {
                  textureKey: def2.textureKey,
                  facesLeft: def2.facesLeft ?? false,
                  tint: worldMutDef2?.tint ?? null,
                  tintFill: worldMutDef2?.tintFill ?? false,
                  glowColor: worldMutDef2?.glowColor ?? null,
                  displayWidth: Math.round(
                    (def2.minigameDisplayWidth ?? def2.displayWidth ?? 48) *
                      0.85 *
                      sizeMult2
                  ),
                  displayHeight: Math.round(
                    (def2.minigameDisplayHeight ?? def2.displayHeight ?? 16) *
                      0.85 *
                      sizeMult2
                  ),
                }
              : undefined,
        }
      );
    };

    this.fishing.onFishingEnd = (success) => {
      this.hotbar.refresh();
      const game = this.scene.get("GameScene") as {
        onCatchCompleteForQuests?: (caught?: CaughtFishResult[]) => void;
        refreshAnvilOceanFloater?: () => void;
      };
      if (success) {
        game.onCatchCompleteForQuests?.(this.fishing.lastCaughtFish);
      } else {
        // Failed fight — respawn ocean anvil shard if it vanished.
        game.refreshAnvilOceanFloater?.();
      }
      this.questTracker.refresh();
    };
  }

  onCoinsChanged(): void {
    this.coins.refresh();
    this.inventoryPanel.refresh();
    this.hotbar.refresh();
    this.questTracker.refresh();
  }

  refreshQuestTracker(): void {
    this.questTracker.refresh();
  }

  private applyMobileMode(on: boolean): void {
    this.mobileControls?.setEnabled(on);
    this.hotbar?.setMobileLayout(on);
    this.settings?.setMobileChrome(on);
    this.minigame?.setMobileLayout(on);
    this.coins?.setMobileLayout(on);
    this.questTracker?.setMobileLayout(on);
    if (this.promptText) {
      this.promptText
        .setFontSize(on ? "22px" : "15px")
        .setY(this.scale.height - (on ? 280 : 100))
        .setPadding(on ? { x: 14, y: 10 } : { x: 10, y: 6 });
    }
  }

  /** True while a mobile control is held (blocks world tap-cast). */
  isMobileCapturing(): boolean {
    return this.mobileControls?.isEnabled() && this.mobileControls.capturing;
  }

  isMobileMode(): boolean {
    return this.mobileControls?.isEnabled() ?? false;
  }

  selectHotbarSlot(i: number): void {
    if (this.isTextEntryOpen()) return;
    if (this.tutorial.visible) return;
    if (this.minigame.isActive() || this.boatMenu.visible) return;
    if (this.coralRodOffer.visible || this.wildflowerBuy.visible) return;
    if (this.codeGuyPanel.isOpen()) return;
    if (this.bargainPanel.visible) return;
    if (this.augmentUpgrade.visible) return;
    if (this.fishing.isBusy()) {
      if (i === 0) return;
      this.fishing.cancelCast();
    }
    this.inventory.selectHotbar(i);
    this.hotbar.refresh();
    // Slot 2 (index 1) = equipment bag · Slot 3 (index 2) = bestiary
    if (i === 1) {
      this.bestiaryPanel.setOpen(false);
      this.inventoryPanel.setOpen(false);
      this.equipmentBag.toggle();
    } else if (i === 2) {
      this.equipmentBag.setOpen(false);
      this.inventoryPanel.setOpen(false);
      this.bestiaryPanel.toggle();
    } else {
      if (this.equipmentBag.visible) this.equipmentBag.setOpen(false);
      if (this.bestiaryPanel.visible) this.bestiaryPanel.setOpen(false);
    }
  }

  private handleInventoryKey(): void {
    if (this.isTextEntryOpen()) return;
    if (this.tutorial.visible) return;
    if (this.minigame.isActive() || this.boatMenu.visible) return;
    this.equipmentBag.setOpen(false);
    this.bestiaryPanel.setOpen(false);
    this.inventoryPanel.toggle();
  }

  private handleBoatKey(): void {
    if (this.isTextEntryOpen()) return;
    if (this.tutorial.visible) return;
    if (this.minigame.isActive()) return;
    if (
      this.inventoryPanel.visible ||
      this.equipmentBag.visible ||
      this.bestiaryPanel.visible
    )
      return;
    if (this.boatMenu.visible) {
      this.boatMenu.setOpen(false);
      return;
    }
    if (!this.canOpenBoatMenu()) {
      this.showToast("Stand on the port to open the boat menu.", "#ffaa66");
      return;
    }
    this.boatMenu.setOpen(true);
  }

  private handleInteractKey(): void {
    if (this.tutorial.visible) return;
    if (this.minigame.isActive() || this.boatMenu.visible) return;
    if (this.equipmentBag.visible || this.bestiaryPanel.visible) return;
    if (this.coralRodOffer.visible) return;
    if (this.codeGuyPanel.isOpen()) return;
    if (this.augmentUpgrade.visible) return;
    if (this.bargainPanel.visible) return;
    if (this.forgePanel.isOpen()) {
      this.closeForge();
      return;
    }
    if (this.wildflowerBuy.visible) {
      this.tryBuyJungleRod();
      this.hotbar.refresh();
      return;
    }
    if (this.trySecretFallThrough()) return;
    if (this.tryTalkToMerchant()) {
      this.inventoryPanel.refresh();
      return;
    }
    if (this.tryVaultGemInteract()) {
      this.inventoryPanel.refresh();
      this.hotbar.refresh();
      return;
    }
    if (this.tryOpenBargain()) return;
    if (this.tryBuyJungleRod()) {
      this.hotbar.refresh();
      return;
    }
    if (this.tryOpenCoralRodOffer()) return;
    if (this.tryEnterWhirlpoolCloud()) return;
    if (this.tryEnterFrostpeakCave()) return;
    if (this.tryEnterAmuletCave()) return;
    this.tryBoardOrExitBoat();
  }

  isBlockingInput(): boolean {
    return (
      this.tutorial.visible ||
      this.inventoryPanel.visible ||
      this.equipmentBag.visible ||
      this.bestiaryPanel.visible ||
      this.minigame.isActive() ||
      this.boatMenu.visible ||
      this.wildflowerBuy.visible ||
      this.oreVendor.visible ||
      this.coralRodOffer.visible ||
      this.bargainPanel.visible ||
      this.codeGuyPanel.isOpen() ||
      this.forgePanel.isOpen() ||
      this.augmentUpgrade.visible ||
      this.settings.isOpen()
    );
  }

  /** Code Guy panel — block game hotkeys so letters go into the code field. */
  private isTextEntryOpen(): boolean {
    return this.codeGuyPanel.isOpen() || this.skinCrateReveal?.isBusy() || this.skinCrateMenu?.isBusy();
  }

  openForge(onClose?: () => void): void {
    this.forgePanel.show(onClose);
    this.setPrompt("ESC / F — Close forge");
  }

  closeForge(): void {
    this.forgePanel.hide();
  }

  isForgeOpen(): boolean {
    return this.forgePanel.isOpen();
  }

  openCodeGuy(onClose?: () => void): void {
    this.codeGuyCloseHook = onClose;
    this.codeGuyPanel.open();
    this.setPrompt("Type code · Enter redeem · Esc leave");
  }

  closeCodeGuy(): void {
    if (this.codeGuyPanel.isOpen()) {
      this.codeGuyPanel.close();
    }
  }

  isCodeGuyOpen(): boolean {
    return this.codeGuyPanel.isOpen();
  }

  private maybeOpenAugmentUpgrade(): void {
    if (this.inventory.getEquippedRodId() !== "augment_rod") return;
    if (!this.inventory.canAugmentUpgrade()) return;
    if (Math.random() >= AUGMENT_UPGRADE_CHANCE) return;
    this.time.delayedCall(400, () => {
      if (this.inventory.getEquippedRodId() !== "augment_rod") return;
      if (!this.inventory.canAugmentUpgrade()) return;
      this.augmentUpgrade.open();
    });
  }

  isWildflowerBuyOpen(): boolean {
    return this.wildflowerBuy.visible;
  }

  openWildflowerBuy(): void {
    this.wildflowerBuy.setOpen(true);
  }

  closeWildflowerBuy(): void {
    this.wildflowerBuy.close();
  }

  openOreVendor(): void {
    const now = Date.now();
    this.oreVendor.open(
      this.inventory.getOreVendorStock(now),
      this.inventory.getOreVendorRestockMs(now)
    );
  }

  closeOreVendor(): void {
    this.oreVendor.setOpen(false);
  }

  isOreVendorOpen(): boolean {
    return this.oreVendor.visible;
  }

  /** Keep sold-out timer live while the panel is open. */
  syncOreVendorPanel(): void {
    if (!this.oreVendor.visible) return;
    const now = Date.now();
    this.oreVendor.syncState(
      this.inventory.getOreVendorStock(now),
      this.inventory.getOreVendorRestockMs(now)
    );
  }

  openCoralRodOffer(): void {
    this.coralRodOffer.setOpen(true);
  }

  closeCoralRodOffer(): void {
    this.coralRodOffer.setOpen(false);
  }

  isCoralRodOfferOpen(): boolean {
    return this.coralRodOffer.visible;
  }

  openBargain(kind: BargainKind, npcName: string): void {
    this.bargainPanel.open(kind, npcName);
  }

  closeBargain(): void {
    if (this.bargainPanel.visible) this.bargainPanel.close();
  }

  isBargainOpen(): boolean {
    return this.bargainPanel.visible;
  }

  showToast(message: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(this.scale.width / 2, 80, message, {
        fontFamily: "Arial",
        fontSize: "22px",
        color,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(160);

    this.tweens.add({
      targets: this.toast,
      alpha: 0,
      y: 60,
      delay: 1200,
      duration: 500,
      onComplete: () => {
        this.toast?.destroy();
        this.toast = undefined;
      },
    });
  }

  /** Top-of-screen ore reveal — icon + rarity-colored name. */
  showOreFound(itemId: ItemId): void {
    const def = ITEMS[itemId];
    if (!def) return;
    const rarity = def.rarity ?? "common";
    const color = RARITY_COLOR[rarity];
    const label =
      rarity.charAt(0).toUpperCase() + rarity.slice(1);

    this.toast?.destroy();
    this.tweens.killTweensOf(this.toast ?? []);

    const cx = this.scale.width / 2;
    const cy = 78;
    const root = this.add.container(cx, cy).setScrollFactor(0).setDepth(160);

    const bg = this.add
      .rectangle(0, 0, 280, 64, 0x111118, 0.88)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);

    const icon = this.add.image(-96, 0, def.textureKey);
    const dw = def.displayWidth ?? 40;
    const dh = def.displayHeight ?? 40;
    const fit = Math.min(44 / dw, 44 / dh);
    icon.setDisplaySize(Math.round(dw * fit), Math.round(dh * fit));

    const name = this.add
      .text(8, -8, def.name, {
        fontFamily: "Arial",
        fontSize: "22px",
        color,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    const sub = this.add
      .text(8, 14, label.trim(), {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#cccccc",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    root.add([bg, icon, name, sub]);
    root.setAlpha(0);
    root.y = cy + 12;

    this.tweens.add({
      targets: root,
      alpha: 1,
      y: cy,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: root,
          alpha: 0,
          y: cy - 18,
          delay: 1600,
          duration: 450,
          onComplete: () => root.destroy(true),
        });
      },
    });
  }

  showWeatherBanner(message: string, color: string): void {
    this.weatherBanner?.destroy();
    this.weatherBanner = this.add
      .text(this.scale.width / 2, 36, message, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color,
        stroke: "#000000",
        strokeThickness: 5,
        backgroundColor: "#00000088",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(165);

    this.time.delayedCall(3000, () => {
      if (!this.weatherBanner) return;
      this.tweens.add({
        targets: this.weatherBanner,
        alpha: 0,
        duration: 450,
        onComplete: () => {
          this.weatherBanner?.destroy();
          this.weatherBanner = undefined;
        },
      });
    });
  }

  showAreaBanner(name: string): void {
    if (this.areaBanner) {
      this.tweens.killTweensOf(this.areaBanner);
      this.areaBanner.destroy();
      this.areaBanner = undefined;
    }
    this.areaBanner = this.add
      .text(this.scale.width / 2, 40, name, {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e6d2",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(164)
      .setAlpha(0);

    this.tweens.add({
      targets: this.areaBanner,
      alpha: 1,
      duration: 250,
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          if (!this.areaBanner) return;
          this.tweens.add({
            targets: this.areaBanner,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              this.areaBanner?.destroy();
              this.areaBanner = undefined;
            },
          });
        });
      },
    });
  }

  setOceanMarkers(markers: OceanMarkerInfo[] | null): void {
    this.oceanMarkers.setMarkers(markers);
  }

  setPrompt(text: string | null): void {
    if (!text) {
      this.promptText.setVisible(false);
      return;
    }
    this.promptText.setText(text).setVisible(true);
  }

  update(_time: number, delta: number): void {
    this.coins.refresh();
    this.coins.refreshClock();
    this.questTracker.refresh();
    this.bargainPanel.update();

    if (this.minigame.isActive()) {
      const p = this.input.activePointer;
      this.minigame.update(
        delta,
        this.getPointerDown(),
        this.getPointerRightDown(),
        p.x,
        p.y
      );
    }
  }
}
