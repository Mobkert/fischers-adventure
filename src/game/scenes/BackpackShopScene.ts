import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  BACKPACK_SHOP_IDS,
  backpackTier,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

interface BackpackShopData {
  inventory: InventorySystem;
}

/** Green-house pack shop — permanent bag upgrades only. */
export class BackpackShopScene extends Phaser.Scene {
  private inventory!: InventorySystem;
  private coinText!: Phaser.GameObjects.Text;
  private ownedText!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;
  private listRoot!: Phaser.GameObjects.Container;

  constructor() {
    super("BackpackShopScene");
  }

  init(data: BackpackShopData): void {
    this.inventory = data.inventory;
  }

  create(): void {
    this.drawInterior();
    this.buildUi();

    const keyboard = this.input.keyboard!;
    const leave = () => this.leaveShop();
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on("down", leave);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on("down", leave);
  }

  private leaveShop(): void {
    this.scene.resume("GameScene");
    this.scene.resume("UIScene");
    this.scene.stop();
  }

  private drawInterior(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x1e3a28, 0x1e3a28, 0x142818, 0x142818, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x3a5a3a, 1);
    g.fillRect(0, h * 0.72, w, h * 0.28);
    g.fillStyle(0x5a7a4a, 1);
    g.fillRect(0, h * 0.72, w, 8);
  }

  private buildUi(): void {
    const w = this.scale.width;

    this.add
      .text(w / 2, 40, "Pack Outfitter", {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#e8f0e0",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(w / 2, 74, "Bigger bag · Permanent upgrades · W / ESC to leave", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#9aba8a",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.coinText = this.add
      .text(w - 24, 28, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffe066",
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.ownedText = this.add
      .text(w / 2, 110, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#d8ffb0",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.listRoot = this.add.container(w / 2, 150).setDepth(12);
    this.refresh();
  }

  private refresh(): void {
    for (const child of [...this.listRoot.list]) {
      child.destroy(true);
    }
    this.coinText.setText(`$${this.inventory.coins}`);
    const cur = ITEMS[this.inventory.getBackpackId()];
    this.ownedText.setText(
      `Current: ${cur.name} · ${cur.bagSlots} bag slots`
    );

    // Starter info card
    let y = 0;
    this.listRoot.add(this.makeOwnedCard("backpack_starter", y));
    y += 100;

    for (const id of BACKPACK_SHOP_IDS) {
      this.listRoot.add(this.makeUpgradeCard(id, y));
      y += 120;
    }
  }

  private makeOwnedCard(id: ItemId, y: number): Phaser.GameObjects.Container {
    const def = ITEMS[id];
    const current = this.inventory.getBackpackId() === id;
    const card = this.add.container(0, y);
    const bg = this.add
      .rectangle(0, 40, 520, 88, 0x243028, 0.95)
      .setStrokeStyle(2, current ? 0x7CFC00 : 0x6a7355);
    const icon = this.add.image(-200, 40, def.textureKey).setDisplaySize(48, 48);
    const name = this.add
      .text(-155, 18, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#f0e6d2",
      })
      .setOrigin(0, 0);
    const desc = this.add
      .text(-155, 46, `${def.description} · Free starter`, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#bbbbbb",
        wordWrap: { width: 340 },
      })
      .setOrigin(0, 0);
    const tag = this.add
      .text(180, 40, current ? "Equipped" : "Owned", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: current ? "#7CFC00" : "#888888",
      })
      .setOrigin(0.5);
    card.add([bg, icon, name, desc, tag]);
    return card;
  }

  private makeUpgradeCard(id: ItemId, y: number): Phaser.GameObjects.Container {
    const def = ITEMS[id];
    const curTier = backpackTier(this.inventory.getBackpackId());
    const tier = backpackTier(id);
    const owned = tier <= curTier;
    const nextUp = tier === curTier + 1;
    const card = this.add.container(0, y);
    const bg = this.add
      .rectangle(0, 50, 520, 108, 0x243028, 0.95)
      .setStrokeStyle(2, owned ? 0x6a7355 : nextUp ? 0xc4a86a : 0x444444);
    const icon = this.add.image(-200, 50, def.textureKey).setDisplaySize(48, 48);
    const name = this.add
      .text(-155, 18, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: owned ? "#aaaaaa" : "#f0e6d2",
      })
      .setOrigin(0, 0);
    const desc = this.add
      .text(-155, 46, def.description, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#bbbbbb",
        wordWrap: { width: 280 },
      })
      .setOrigin(0, 0);

    let label = `Buy $${def.buyPrice}`;
    let color = 0x2a6b4a;
    if (owned) {
      label = tier < curTier ? "Upgraded past" : "Owned";
      color = 0x444444;
    } else if (!nextUp) {
      label = "Locked";
      color = 0x3a3a3a;
    }

    const btn = this.add
      .rectangle(180, 50, 130, 40, color)
      .setStrokeStyle(1, 0xf0e6d2);
    const btnText = this.add
      .text(180, 50, label, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    if (nextUp && !owned) {
      btn.setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        const result = this.inventory.buyBackpack(id);
        this.showToast(result.message, result.ok ? "#7CFC00" : "#ffaa66");
        this.refresh();
      });
    }

    card.add([bg, icon, name, desc, btn, btnText]);
    return card;
  }

  private showToast(message: string, color: string): void {
    this.toast?.destroy();
    this.toast = this.add
      .text(this.scale.width / 2, this.scale.height - 40, message, {
        fontFamily: "Arial",
        fontSize: "16px",
        color,
        backgroundColor: "#00000099",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.time.delayedCall(2200, () => this.toast?.destroy());
  }
}
