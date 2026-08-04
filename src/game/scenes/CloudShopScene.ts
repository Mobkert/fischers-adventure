import Phaser from "phaser";
import { ITEMS, formatRodStats, MUTATIONS } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";
import { Player } from "../entities/Player";

interface CloudShopData {
  inventory: InventorySystem;
  persistSave?: () => void;
}

const WORLD_W = 1400;
const GROUND_Y = 520;

/** Storm-cloud realm — walk the clouds, buy the floating Zeus Rod, Enter to return. */
export class CloudShopScene extends Phaser.Scene {
  private inventory!: InventorySystem;
  private persistSave?: () => void;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private zeusRod?: Phaser.GameObjects.Image;
  private zeusLabel?: Phaser.GameObjects.Text;
  private zeusGlow?: Phaser.GameObjects.Arc;
  private promptText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;
  private inspectOpen = false;
  private inspectRoot?: Phaser.GameObjects.Container;
  private leaving = false;

  constructor() {
    super("CloudShopScene");
  }

  init(data: CloudShopData): void {
    this.inventory = data.inventory;
    this.persistSave = data.persistSave;
    this.inspectOpen = false;
    this.leaving = false;
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_W, 720);
    this.cameras.main.setBounds(0, 0, WORLD_W, 720);
    this.cameras.main.setBackgroundColor(0x3a5578);

    this.drawSky();
    this.platforms = this.physics.add.staticGroup();
    this.buildCloudPlatforms();
    this.placeZeusRod();

    // Spawn on the left landing cloud
    this.player = new Player(this, 180, GROUND_Y - 80);
    this.player.syncCarriedRod(this.inventory.getSelectedItem());
    this.physics.add.collider(this.player.sprite, this.platforms);

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(60, 40);

    this.coinText = this.add
      .text(this.scale.width - 20, 18, `$${this.inventory.coins}`, {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.add
      .text(20, 18, "Storm Clouds", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.promptText = this.add
      .text(this.scale.width / 2, this.scale.height - 36, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffe066",
        backgroundColor: "#00000099",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    this.showToast("The whirlpool lifts you into the clouds…", "#7ec8ff");

    const keyboard = this.input.keyboard!;
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on("down", () => {
      this.returnToSea();
    });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F).on("down", () => {
      this.tryInteractZeus();
    });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X).on("down", () => {
      if (this.inspectOpen) this.closeInspect();
    });
  }

  update(): void {
    if (this.leaving) return;
    this.player.update();
    this.refreshPrompt();

    // Fall off a cloud → back to the starter island
    if (this.player.sprite.y > 700) {
      this.returnToSea(true);
    }
  }

  private drawSky(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x6a8ab8, 0x6a8ab8, 0x243850, 0x243850, 1);
    g.fillRect(0, 0, WORLD_W, 720);

    // Distant soft clouds (decor only)
    for (let i = 0; i < 18; i++) {
      const cx = 40 + i * 90 + (i % 3) * 20;
      const cy = 60 + (i % 5) * 28;
      g.fillStyle(0xe8eef8, 0.22 + (i % 3) * 0.05);
      g.fillEllipse(cx, cy, 120 + (i % 4) * 20, 36 + (i % 3) * 8);
      g.fillEllipse(cx + 35, cy - 8, 80, 28);
    }

    // Soft blue haze
    this.add
      .rectangle(WORLD_W / 2, 360, WORLD_W, 720, 0x4da6ff, 0.08)
      .setDepth(1);
  }

  private addCloudPlatform(
    x: number,
    y: number,
    width: number,
    label?: string
  ): void {
    // Visual fluff
    const fluff = this.add.graphics().setDepth(4);
    fluff.fillStyle(0xf4f7fc, 0.92);
    fluff.fillEllipse(x, y - 8, width, 42);
    fluff.fillEllipse(x - width * 0.28, y - 4, width * 0.55, 34);
    fluff.fillEllipse(x + width * 0.28, y - 6, width * 0.5, 32);
    fluff.fillStyle(0xffffff, 0.55);
    fluff.fillEllipse(x - 10, y - 18, width * 0.45, 22);

    // Thin walkable ledge under the fluff
    const ledge = this.add
      .rectangle(x, y + 6, width * 0.85, 18, 0xd0d8e8, 0)
      .setOrigin(0.5);
    this.physics.add.existing(ledge, true);
    this.platforms.add(ledge);

    if (label) {
      this.add
        .text(x, y - 48, label, {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#c8d8f0",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(8);
    }
  }

  private buildCloudPlatforms(): void {
    // Landing pad (left)
    this.addCloudPlatform(180, GROUND_Y, 260, "You arrive here");
    // Stepping stones
    this.addCloudPlatform(420, GROUND_Y - 30, 160);
    this.addCloudPlatform(620, GROUND_Y + 10, 150);
    this.addCloudPlatform(820, GROUND_Y - 40, 170);
    // Zeus cloud (right)
    this.addCloudPlatform(1120, GROUND_Y - 20, 300);
  }

  private placeZeusRod(): void {
    if (this.inventory.ownsRod("zeus_rod")) return;

    const x = 1180;
    const y = GROUND_Y - 100;
    this.zeusRod = this.add
      .image(x, y, "rod_zeus")
      .setOrigin(0.5, 1)
      .setScale(1.35)
      .setAngle(-22)
      .setDepth(10);

    // Soft yellow/blue aura
    this.zeusGlow = this.add
      .circle(x, y - 36, 38, 0xffe066, 0.22)
      .setDepth(9);
    this.tweens.add({
      targets: this.zeusGlow,
      alpha: 0.08,
      scale: 1.25,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.zeusLabel = this.add
      .text(x, y - 110, "Zeus Rod\n$60000 · F to inspect", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffe066",
        align: "center",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.tweens.add({
      targets: [this.zeusRod, this.zeusLabel, this.zeusGlow],
      y: "-=10",
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private isNearZeus(): boolean {
    if (!this.zeusRod || this.inventory.ownsRod("zeus_rod")) return false;
    return Math.abs(this.player.sprite.x - this.zeusRod.x) < 90;
  }

  private refreshPrompt(): void {
    if (this.inspectOpen) {
      this.promptText.setText("F — Buy    X — Cancel    Enter — Return");
      return;
    }
    if (this.isNearZeus()) {
      this.promptText.setText("F — Inspect Zeus Rod    Enter — Return to the sea");
      return;
    }
    this.promptText.setText("A/D move · Space jump · Enter — Return to the sea");
  }

  private tryInteractZeus(): void {
    if (!this.isNearZeus()) return;

    if (this.inspectOpen) {
      const result = this.inventory.buyRod("zeus_rod");
      this.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
      this.coinText.setText(`$${this.inventory.coins}`);
      this.closeInspect();
      if (result.ok) {
        this.tweens.killTweensOf([
          this.zeusRod,
          this.zeusLabel,
          this.zeusGlow,
        ].filter(Boolean));
        this.zeusRod?.destroy();
        this.zeusRod = undefined;
        this.zeusLabel?.destroy();
        this.zeusLabel = undefined;
        this.zeusGlow?.destroy();
        this.zeusGlow = undefined;
        this.inventory.equipRod("zeus_rod");
        this.player.syncCarriedRod("zeus_rod");
        this.persistSave?.();
      }
      return;
    }

    this.openInspect();
  }

  private openInspect(): void {
    if (this.inspectOpen) return;
    this.inspectOpen = true;

    const def = ITEMS.zeus_rod;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 - 20;
    const root = this.add.container(cx, cy).setDepth(150).setScrollFactor(0);

    const bg = this.add
      .rectangle(0, 0, 420, 340, 0x1a2438, 0.96)
      .setStrokeStyle(2, 0xffe066);

    const title = this.add
      .text(0, -130, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    const icon = this.add.image(0, -72, def.textureKey).setDisplaySize(64, 64);

    const price = this.add
      .text(0, -32, `$${def.buyPrice}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    const stats = this.add
      .text(0, 8, formatRodStats(def.rodStats!), {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#d0d8e8",
        align: "center",
        lineSpacing: 5,
      })
      .setOrigin(0.5, 0);

    const thunder = MUTATIONS.thunder;
    const mut = this.add
      .text(
        0,
        110,
        `Thunder mutation  ${Math.round((def.rodMutation?.chance ?? 0) * 100)}%  ·  ${thunder.sellMult}× sell`,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: thunder.toastColor,
        }
      )
      .setOrigin(0.5);

    const hint = this.add
      .text(0, 142, "F — Buy    X — Cancel", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#a8b8c8",
      })
      .setOrigin(0.5);

    root.add([bg, title, icon, price, stats, mut, hint]);
    this.inspectRoot = root;
  }

  private closeInspect(): void {
    this.inspectOpen = false;
    this.inspectRoot?.destroy(true);
    this.inspectRoot = undefined;
  }

  private returnToSea(fellOff = false): void {
    if (this.leaving) return;
    this.leaving = true;
    this.closeInspect();
    const game = this.scene.get("GameScene") as import("./GameScene").GameScene;
    const ui = this.scene.get("UIScene") as import("./UIScene").UIScene;
    this.scene.resume("GameScene");
    this.scene.resume("UIScene");
    game.player.syncCarriedRod(game.inventory.getSelectedItem());
    if (fellOff) {
      const x = game.islandLeft + 420;
      const y = game.groundY - 24;
      game.player.sprite.setPosition(x, y);
      game.player.sprite.setVelocity(0, 0);
      game.cameras.main.centerOn(x, y);
      ui.showToast("You fell from the clouds…", "#7ec8ff");
    }
    ui.onCoinsChanged();
    this.scene.stop();
  }

  private showToast(message: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(this.scale.width / 2, 70, message, {
        fontFamily: "Arial",
        fontSize: "18px",
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
      delay: 1600,
      duration: 400,
      onComplete: () => {
        this.toast?.destroy();
        this.toast = undefined;
      },
    });
  }
}
