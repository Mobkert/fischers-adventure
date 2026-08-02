import Phaser from "phaser";
import { Hotbar } from "../ui/Hotbar";
import { InventoryPanel } from "../ui/InventoryPanel";
import { CatchMinigame } from "../ui/CatchMinigame";
import { EquipmentBag } from "../ui/EquipmentBag";
import { FishingTutorial } from "../ui/FishingTutorial";
import { ITEMS, RARITY_COLOR, RARITY_LABEL, MUTATIONS } from "../data/items";
import { BoatMenu } from "../ui/BoatMenu";
import { CoinDisplay } from "../ui/CoinDisplay";
import { WildflowerBuyPanel } from "../ui/WildflowerBuyPanel";
import { SettingsMenu } from "../ui/SettingsMenu";
import { InventorySystem } from "../systems/InventorySystem";
import { FishingSystem } from "../systems/FishingSystem";

interface UISceneData {
  inventory: InventorySystem;
  fishing: FishingSystem;
  getPointerDown: () => boolean;
  isOnPort: () => boolean;
  canOpenBoatMenu: () => boolean;
  spawnSailboat: () => void;
  tryBoardOrExitBoat: () => boolean;
  tryTalkToMerchant: () => boolean;
  declineMerchant: () => void;
  tryBuyJungleRod: () => boolean;
  tryEnterShop: () => boolean;
  isNearBlueHouse: () => boolean;
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
  private getPointerDown!: () => boolean;
  private isOnPort!: () => boolean;
  private canOpenBoatMenu!: () => boolean;
  private spawnSailboat!: () => void;
  private tryBoardOrExitBoat!: () => boolean;
  private tryTalkToMerchant!: () => boolean;
  private declineMerchant!: () => void;
  private tryBuyJungleRod!: () => boolean;
  private tryEnterShop!: () => boolean;
  private isNearBlueHouse!: () => boolean;
  private getMusicVolume!: () => number;
  private setMusicVolume!: (v: number) => void;
  private isTutorialDone!: () => boolean;
  private markTutorialDone!: () => void;
  private quitToMenu!: () => void;
  private persistSave!: () => void;
  private hotbar!: Hotbar;
  private inventoryPanel!: InventoryPanel;
  private equipmentBag!: EquipmentBag;
  private tutorial!: FishingTutorial;
  private minigame!: CatchMinigame;
  private boatMenu!: BoatMenu;
  private wildflowerBuy!: WildflowerBuyPanel;
  private settings!: SettingsMenu;
  private coins!: CoinDisplay;
  private statusText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;

  constructor() {
    super("UIScene");
  }

  init(data: UISceneData): void {
    this.inventory = data.inventory;
    this.fishing = data.fishing;
    this.getPointerDown = data.getPointerDown;
    this.isOnPort = data.isOnPort;
    this.canOpenBoatMenu = data.canOpenBoatMenu;
    this.spawnSailboat = data.spawnSailboat;
    this.tryBoardOrExitBoat = data.tryBoardOrExitBoat;
    this.tryTalkToMerchant = data.tryTalkToMerchant;
    this.declineMerchant = data.declineMerchant;
    this.tryBuyJungleRod = data.tryBuyJungleRod;
    this.tryEnterShop = data.tryEnterShop;
    this.isNearBlueHouse = data.isNearBlueHouse;
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
    this.equipmentBag = new EquipmentBag(this, this.inventory);
    this.equipmentBag.setOnChanged(() => {
      this.hotbar.refresh();
      this.showToast(
        `Equipped ${ITEMS[this.inventory.getEquippedRodId()].name}`,
        "#ffe066"
      );
    });
    this.minigame = new CatchMinigame(this);
    this.boatMenu = new BoatMenu(this);
    this.wildflowerBuy = new WildflowerBuyPanel(this);
    this.wildflowerBuy.setCallbacks(() => {
      // Second confirm (click Buy) — purchase if panel is open
      this.tryBuyJungleRod();
      this.hotbar.refresh();
    });
    this.settings = new SettingsMenu(
      this,
      () => this.getMusicVolume(),
      (v) => this.setMusicVolume(v),
      () => this.quitToMenu()
    );
    this.coins = new CoinDisplay(this, this.inventory);
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
    this.boatMenu.setOnSpawn(() => {
      this.spawnSailboat();
      this.showToast("Sailboat launched! Press F near it to board.", "#7ec8e3");
    });

    this.statusText = this.add
      .text(16, 16, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#00000088",
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

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

    const keyboard = this.input.keyboard!;
    for (let i = 0; i < 5; i++) {
      const key = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + i);
      key.on("down", () => {
        if (this.tutorial.visible) return;
        if (this.minigame.isActive() || this.boatMenu.visible) return;
        this.inventory.selectHotbar(i);
        this.hotbar.refresh();
        // Slot 2 (index 1) = equipment bag
        if (i === 1) {
          this.inventoryPanel.setOpen(false);
          this.equipmentBag.toggle();
        } else if (this.equipmentBag.visible) {
          this.equipmentBag.setOpen(false);
        }
      });
    }

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.minigame.isActive() || this.boatMenu.visible) return;
      this.equipmentBag.setOpen(false);
      this.inventoryPanel.toggle();
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.settings.isOpen()) {
        this.settings.setOpen(false);
        return;
      }
      if (this.equipmentBag.visible) {
        this.equipmentBag.setOpen(false);
        return;
      }
      if (this.inventoryPanel.visible) {
        this.inventoryPanel.setOpen(false);
      }
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.minigame.isActive() || this.boatMenu.visible) return;
      if (this.inventoryPanel.visible || this.equipmentBag.visible) return;
      if (this.tryEnterShop()) return;
      if (this.isNearBlueHouse()) {
        this.showToast("Can't enter right now.", "#ffaa66");
      }
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.minigame.isActive()) return;
      if (this.inventoryPanel.visible || this.equipmentBag.visible) return;
      if (this.boatMenu.visible) {
        this.boatMenu.setOpen(false);
        return;
      }
      if (!this.canOpenBoatMenu()) {
        this.showToast("Stand on the port to open the boat menu.", "#ffaa66");
        return;
      }
      this.boatMenu.setOpen(true);
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.minigame.isActive() || this.boatMenu.visible) return;
      if (this.equipmentBag.visible) return;
      // Confirm wildflower buy if stats panel is open
      if (this.wildflowerBuy.visible) {
        this.tryBuyJungleRod();
        this.hotbar.refresh();
        return;
      }
      // NPC talk takes priority over boarding
      if (this.tryTalkToMerchant()) {
        this.inventoryPanel.refresh();
        return;
      }
      if (this.tryBuyJungleRod()) {
        this.hotbar.refresh();
        return;
      }
      this.tryBoardOrExitBoat();
    });

    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X).on("down", () => {
      if (this.tutorial.visible) return;
      if (this.minigame.isActive() || this.boatMenu.visible) return;
      if (this.wildflowerBuy.visible) {
        this.closeWildflowerBuy();
        return;
      }
      this.declineMerchant();
    });

    // First-run fishing guide
    this.time.delayedCall(200, () => {
      this.tutorial.tryStart();
    });

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
      const rod = this.inventory.getEquippedRodStats();
      const rarity = def.rarity ?? "common";
      this.equipmentBag.setOpen(false);
      this.hotbar.setVisible(false);
      this.minigame.start(
        (success) => {
          this.hotbar.setVisible(true);
          this.hotbar.refresh();
          this.fishing.completeCatch(success);
          if (success) {
            const article = /^[aeiou]/i.test(def.name) ? "an" : "a";
            const mut = this.fishing.lastCatchMutation;
            const mutDef = mut ? MUTATIONS[mut] : null;
            const prefix = mutDef
              ? `${mutDef.label}${RARITY_LABEL[rarity]}`
              : RARITY_LABEL[rarity];
            this.showToast(
              `${prefix}Caught ${article} ${def.name}!`,
              mutDef?.toastColor ?? RARITY_COLOR[rarity]
            );
            this.inventoryPanel.refresh();
            this.persistSave();
          } else {
            this.showToast("The fish got away...", "#ffaa66");
          }
        },
        {
          textureKey: def.textureKey,
          speedMult: def.minigameSpeed ?? 1,
          jerky: def.minigameJerky ?? false,
          chaos: def.minigameChaos ?? 1,
          drainMult: def.drainMult ?? 1,
          unstoppableJerky: def.unstoppableJerky ?? false,
          displayWidth: Math.round((def.displayWidth ?? 48) * 0.9),
          displayHeight: Math.round((def.displayHeight ?? 16) * 0.9),
          control: rod.control,
          resilience: rod.resilience,
          // Rod progress + fish catch penalty (e.g. Bluefin -20%)
          progressSpeed: rod.progressSpeed + (def.catchProgress ?? 0),
        }
      );
    };

    this.fishing.onFishingEnd = () => {
      this.hotbar.refresh();
    };
  }

  onCoinsChanged(): void {
    this.coins.refresh();
    this.inventoryPanel.refresh();
  }

  isBlockingInput(): boolean {
    return (
      this.tutorial.visible ||
      this.inventoryPanel.visible ||
      this.equipmentBag.visible ||
      this.minigame.isActive() ||
      this.boatMenu.visible ||
      this.wildflowerBuy.visible ||
      this.settings.isOpen()
    );
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

  setPrompt(text: string | null): void {
    if (!text) {
      this.promptText.setVisible(false);
      return;
    }
    this.promptText.setText(text).setVisible(true);
  }

  update(_time: number, delta: number): void {
    const rodId = this.inventory.getEquippedRodId();
    const fishCount = this.inventory.getFishCount();
    const state = this.fishing.state;
    const port = this.isOnPort() ? " · Port" : "";
    this.statusText.setText(
      `Rod: ${ITEMS[rodId].name}  |  Fish: ${fishCount}  |  ${state}${port}`
    );
    this.coins.refresh();

    if (this.minigame.isActive()) {
      this.minigame.update(delta, this.getPointerDown());
    }
  }
}
