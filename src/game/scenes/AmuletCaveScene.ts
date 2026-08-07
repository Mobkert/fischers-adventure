import Phaser from "phaser";
import { AMULET_SHOP_IDS, ITEMS, ItemId } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";
import { Player } from "../entities/Player";

interface AmuletCaveData {
  inventory: InventorySystem;
  persistSave?: () => void;
}

const WORLD_W = 1100;
const GROUND_Y = 540;

/** Underground amulet shop — climb the rope crack to enter, Enter to leave. */
export class AmuletCaveScene extends Phaser.Scene {
  private inventory!: InventorySystem;
  private persistSave?: () => void;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private promptText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;
  private shelfItems: Array<{
    id: ItemId;
    x: number;
    img: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
  }> = [];
  private leaving = false;

  constructor() {
    super("AmuletCaveScene");
  }

  init(data: AmuletCaveData): void {
    this.inventory = data.inventory;
    this.persistSave = data.persistSave;
    this.leaving = false;
    this.shelfItems = [];
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_W, 720);
    this.cameras.main.setBounds(0, 0, WORLD_W, 720);
    this.cameras.main.setBackgroundColor(0x1a1410);

    this.drawCave();
    this.platforms = this.physics.add.staticGroup();
    this.platforms
      .create(WORLD_W / 2, GROUND_Y + 24, "sand")
      .setDisplaySize(WORLD_W + 80, 64)
      .refreshBody();

    this.placeShelf();

    this.player = new Player(this, 160, GROUND_Y - 80);
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
      .text(20, 18, "Amulet Cave", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#e8dcc8",
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

    this.showToast("You climb the rope into a hidden cavern…", "#c8d0d8");

    const keyboard = this.input.keyboard!;
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on("down", () => {
      this.returnToSurface();
    });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F).on("down", () => {
      this.tryBuyNear();
    });
  }

  update(): void {
    if (this.leaving) return;
    this.player.update();
    this.refreshPrompt();
    if (this.player.sprite.y > 700) this.returnToSurface();
  }

  private drawCave(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x120e0c, 0x120e0c, 0x2a2218, 0x2a2218, 1);
    g.fillRect(0, 0, WORLD_W, 720);

    // Stalactites
    g.fillStyle(0x3a3028);
    for (let x = 40; x < WORLD_W; x += 70) {
      const h = 40 + (x % 90);
      g.fillTriangle(x, 0, x + 18, h, x - 18, h);
    }
    // Floor moss patches
    g.fillStyle(0x3a4a28, 0.35);
    g.fillEllipse(280, GROUND_Y + 8, 160, 18);
    g.fillEllipse(720, GROUND_Y + 6, 200, 16);

    // Soft lantern glow pools
    const lights = [
      [220, 200, 0xffc878],
      [550, 180, 0xa8d0ff],
      [880, 210, 0xffc878],
    ] as const;
    for (const [lx, ly, c] of lights) {
      this.add.circle(lx, ly, 90, c, 0.07).setDepth(1);
      this.add.circle(lx, ly, 40, c, 0.12).setDepth(1);
    }

    // Rope hanging from ceiling (exit)
    const rope = this.add.graphics().setDepth(3);
    rope.lineStyle(3, 0x8b6914);
    rope.lineBetween(140, 0, 148, GROUND_Y - 10);
    rope.lineStyle(2, 0xc4a86a);
    rope.lineBetween(142, 0, 150, GROUND_Y - 10);
    this.add
      .text(150, 80, "Enter — Climb out", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c4a86a",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(4);
  }

  private placeShelf(): void {
    const shelfY = GROUND_Y - 8;
    const startX = 300;
    const gap = 120;

    // Ornate wooden altar shelf
    const wood = this.add.graphics().setDepth(5);
    const shelfW = AMULET_SHOP_IDS.length * gap + 50;
    // Shadow
    wood.fillStyle(0x000000, 0.35);
    wood.fillRoundedRect(startX - 58, shelfY - 64, shelfW + 8, 20, 4);
    // Top plank
    wood.fillStyle(0x2a1a10);
    wood.fillRoundedRect(startX - 55, shelfY - 72, shelfW, 18, 3);
    wood.fillStyle(0x6b4423);
    wood.fillRoundedRect(startX - 53, shelfY - 70, shelfW - 4, 12, 2);
    wood.fillStyle(0x8b5a2b);
    wood.fillRect(startX - 50, shelfY - 68, shelfW - 10, 3);
    // Grain lines
    wood.lineStyle(1, 0x3a2414, 0.4);
    for (let i = 0; i < 5; i++) {
      wood.lineBetween(
        startX - 40 + i * 30,
        shelfY - 66,
        startX - 20 + i * 40,
        shelfY - 60
      );
    }
    // Carved front lip
    wood.fillStyle(0x5c3a21);
    wood.fillRoundedRect(startX - 55, shelfY - 56, shelfW, 8, 2);
    wood.fillStyle(0xc4a86a, 0.35);
    wood.fillRect(startX - 40, shelfY - 54, shelfW - 30, 2);
    // Legs with feet
    const legXs = [startX - 40, startX + shelfW - 70];
    for (const lx of legXs) {
      wood.fillStyle(0x2a1a10);
      wood.fillRect(lx, shelfY - 54, 12, 54);
      wood.fillStyle(0x5c3a21);
      wood.fillRect(lx + 2, shelfY - 54, 8, 54);
      wood.fillStyle(0x3a2414);
      wood.fillRoundedRect(lx - 4, shelfY - 4, 20, 8, 2);
    }

    this.add
      .text(
        startX + ((AMULET_SHOP_IDS.length - 1) * gap) / 2,
        shelfY - 108,
        "Amulet Peddler",
        {
          fontFamily: "Georgia, serif",
          fontSize: "20px",
          color: "#e8dcc8",
          stroke: "#000000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5)
      .setDepth(6);

    AMULET_SHOP_IDS.forEach((id, i) => {
      const def = ITEMS[id];
      const x = startX + i * gap;

      // Pedestal glow under each amulet
      const glow = this.add
        .circle(x, shelfY - 42, 28, 0xffe8a0, 0.12)
        .setDepth(6);
      this.tweens.add({
        targets: glow,
        alpha: 0.04,
        scale: 1.2,
        duration: 1100 + i * 90,
        yoyo: true,
        repeat: -1,
      });

      const img = this.add
        .image(x, shelfY - 48, def.textureKey)
        .setDisplaySize(56, 56)
        .setDepth(8);
      this.tweens.add({
        targets: img,
        y: img.y - 8,
        angle: { from: -4, to: 4 },
        duration: 1400 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      const label = this.add
        .text(
          x,
          shelfY + 16,
          `${def.name.replace(" Amulet", "")}\n$${def.buyPrice!.toLocaleString("en-US")}`,
          {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#f0e6d2",
            align: "center",
            stroke: "#000000",
            strokeThickness: 3,
          }
        )
        .setOrigin(0.5)
        .setDepth(7);
      this.shelfItems.push({ id, x, img, label });
    });
  }

  private nearAmulet(): ItemId | null {
    for (const item of this.shelfItems) {
      if (Math.abs(this.player.sprite.x - item.x) < 48) return item.id;
    }
    return null;
  }

  private refreshPrompt(): void {
    const id = this.nearAmulet();
    if (id) {
      const def = ITEMS[id];
      this.promptText.setText(
        `F — Buy ${def.name} ($${def.buyPrice!.toLocaleString("en-US")}) · Enter — Leave`
      );
      return;
    }
    this.promptText.setText("A/D move · F buy · Enter — Climb rope out");
  }

  private tryBuyNear(): void {
    const id = this.nearAmulet();
    if (!id) return;
    const result = this.inventory.buyAmulet(id);
    this.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
    this.coinText.setText(`$${this.inventory.coins}`);
    if (result.ok) this.persistSave?.();
  }

  private returnToSurface(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.stop("AmuletCaveScene");
    this.scene.resume("GameScene");
    this.scene.resume("UIScene");
  }

  private showToast(message: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(this.scale.width / 2, 64, message, {
        fontFamily: "Arial",
        fontSize: "16px",
        color,
        backgroundColor: "#000000aa",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120);
    this.tweens.add({
      targets: this.toast,
      alpha: 0,
      delay: 2200,
      duration: 400,
      onComplete: () => {
        this.toast?.destroy();
        this.toast = undefined;
      },
    });
  }
}
