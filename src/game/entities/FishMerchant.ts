import Phaser from "phaser";
import { NpcSpeechBubble } from "../ui/NpcSpeechBubble";

/** Side-view fish buyer NPC with speech bubbles. */
export class FishMerchant {
  sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private bubble?: NpcSpeechBubble;
  private nameTag: Phaser.GameObjects.Text;
  talking = false;
  private mode: "idle" | "offer" | "sold" | "nofish" = "idle";
  private pendingSell?: () => { sold: number; earned: number };
  private pendingKept = 0;

  readonly x: number;
  readonly y: number;
  readonly displayName: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    groundY: number,
    displayName = "The Merchant"
  ) {
    this.scene = scene;
    this.x = x;
    this.y = groundY;
    this.displayName = displayName;

    this.sprite = scene.add.sprite(x, this.y, "npc_merchant");
    this.sprite.setDepth(11);
    this.sprite.setOrigin(0.5, 1);

    this.nameTag = scene.add
      .text(x, this.y - 60, displayName, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffe8a0",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);
  }

  isNear(px: number, py: number, radius = 70): boolean {
    return Phaser.Math.Distance.Between(px, py, this.x, this.y - 28) < radius;
  }

  /** Start or advance dialogue. Returns true if F was consumed. */
  interact(
    fishCount: number,
    onSell: () => { sold: number; earned: number },
    keptCount = 0,
    offerValue = 0
  ): boolean {
    if (this.mode === "idle" || this.mode === "sold" || this.mode === "nofish") {
      if (fishCount <= 0) {
        this.mode = "nofish";
        this.talking = false;
        this.showBubble(
          keptCount > 0
            ? "All your fish are kept!\nRight-click them in your inventory\nto unlock selling."
            : "Got any fish?\nCome back when you've caught some!"
        );
        this.scheduleClose(2800);
        return true;
      }
      this.mode = "offer";
      this.talking = true;
      this.pendingSell = onSell;
      this.pendingKept = keptCount;
      this.showBubble(
        `Would you like to sell all your fish for $${offerValue}?`,
        "#ffffff",
        {
          onYes: () => this.confirmOffer(),
          onNo: () => this.decline(),
          yesLabel: "Yes",
          noLabel: "No",
        }
      );
      return true;
    }

    if (this.mode === "offer") {
      this.confirmOffer();
      return true;
    }

    return false;
  }

  private confirmOffer(): void {
    if (this.mode !== "offer") return;
    const onSell = this.pendingSell;
    const keptCount = this.pendingKept;
    this.pendingSell = undefined;
    const result = onSell?.() ?? { sold: 0, earned: 0 };
    this.mode = "sold";
    this.talking = false;
    if (result.sold <= 0) {
      this.showBubble(
        keptCount > 0
          ? "Nothing to sell — your fish are kept.\nRight-click in inventory to unlock."
          : "Looks like you're out of fish!"
      );
    } else {
      this.showBubble(
        `Pleasure doing business!\nSold ${result.sold} fish for $${result.earned}.`,
        "#d4ffd4"
      );
    }
    this.scheduleClose(3200);
  }

  decline(): void {
    if (this.mode !== "offer") return;
    this.mode = "idle";
    this.talking = false;
    this.pendingSell = undefined;
    this.showBubble("Alright, maybe next time.");
    this.scheduleClose(1800);
  }

  close(): void {
    this.mode = "idle";
    this.talking = false;
    this.pendingSell = undefined;
    this.hideBubble();
  }

  private scheduleClose(ms: number): void {
    this.scene.time.delayedCall(ms, () => {
      if (this.mode === "sold" || this.mode === "nofish") {
        this.close();
      }
    });
  }

  private showBubble(
    text: string,
    color = "#ffffff",
    choices?: {
      onYes: () => void;
      onNo: () => void;
      yesLabel?: string;
      noLabel?: string;
    }
  ): void {
    this.hideBubble();
    this.bubble = new NpcSpeechBubble(this.scene, this.x, this.y - 120, "merchant");
    this.bubble.show(text, color, choices);
  }

  private hideBubble(): void {
    this.bubble?.destroy();
    this.bubble = undefined;
  }

  destroy(): void {
    this.hideBubble();
    this.sprite.destroy();
    this.nameTag.destroy();
  }
}

export function generateMerchantTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const w = 36;
  const h = 56;

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(w / 2, h - 2, 20, 5);

  g.fillStyle(0x3a2a1a);
  g.fillRect(10, 38, 7, 16);
  g.fillRect(19, 38, 7, 16);
  g.fillStyle(0x2a1a10);
  g.fillRect(10, 50, 8, 4);
  g.fillRect(19, 50, 8, 4);

  g.fillStyle(0x4a6fa5);
  g.fillRect(8, 20, 20, 20);
  g.fillStyle(0xe8e0d0);
  g.fillRect(10, 28, 16, 12);

  g.fillStyle(0xc4a484);
  g.fillRect(4, 22, 6, 12);
  g.fillRect(26, 22, 6, 12);

  g.fillStyle(0xc4a484);
  g.fillRect(10, 4, 16, 16);
  g.fillStyle(0xb8956e);
  g.fillRect(10, 4, 4, 16);

  g.fillStyle(0x2c3e50);
  g.fillRect(8, 2, 20, 6);
  g.fillRect(12, 0, 12, 4);

  g.fillStyle(0x1a1a1a);
  g.fillRect(20, 10, 2, 2);

  g.fillStyle(0x6b4423);
  g.fillRect(28, 34, 8, 10);
  g.fillStyle(0x58a6ff);
  g.fillRect(29, 36, 6, 3);

  g.generateTexture("npc_merchant", w, h);
  g.destroy();
}

/** Merchant-style NPC in a black suit (Code Guy). */
export function generateCodeGuyTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("npc_code_guy")) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const w = 36;
  const h = 56;

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(w / 2, h - 2, 20, 5);

  g.fillStyle(0x141414);
  g.fillRect(10, 38, 7, 16);
  g.fillRect(19, 38, 7, 16);
  g.fillStyle(0x0a0a0a);
  g.fillRect(10, 50, 8, 4);
  g.fillRect(19, 50, 8, 4);

  g.fillStyle(0x1e1e1e);
  g.fillRect(8, 20, 20, 20);
  g.fillStyle(0xe8e0d0);
  g.fillRect(10, 28, 16, 12);
  g.fillStyle(0x8b2020);
  g.fillRect(17, 28, 2, 10);

  g.fillStyle(0xc4a484);
  g.fillRect(4, 22, 6, 12);
  g.fillRect(26, 22, 6, 12);
  g.fillStyle(0x1e1e1e);
  g.fillRect(4, 28, 6, 8);
  g.fillRect(26, 28, 6, 8);

  g.fillStyle(0xc4a484);
  g.fillRect(10, 4, 16, 16);
  g.fillStyle(0xb8956e);
  g.fillRect(10, 4, 4, 16);

  g.fillStyle(0x141414);
  g.fillRect(8, 2, 20, 6);
  g.fillRect(12, 0, 12, 4);

  g.fillStyle(0x1a1a1a);
  g.fillRect(20, 10, 2, 2);

  g.generateTexture("npc_code_guy", w, h);
  g.destroy();
}

/** Human NPC with a green shirt (Resonated Hat quest). */
export function generateGreenShirtNpcTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("npc_green_shirt")) return;

  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const w = 36;
  const h = 56;

  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(w / 2, h - 2, 20, 5);

  // Legs / shoes
  g.fillStyle(0x3a3428);
  g.fillRect(10, 38, 7, 16);
  g.fillRect(19, 38, 7, 16);
  g.fillStyle(0x2a2418);
  g.fillRect(10, 50, 8, 4);
  g.fillRect(19, 50, 8, 4);

  // Green shirt body
  g.fillStyle(0x3a8a48);
  g.fillRect(8, 20, 20, 20);
  g.fillStyle(0x2e7038);
  g.fillRect(8, 20, 4, 20);
  g.fillStyle(0x4aaa58);
  g.fillRect(24, 22, 3, 16);
  // Shirt placket / buttons
  g.fillStyle(0xe8e0d0);
  g.fillRect(16, 24, 4, 14);
  g.fillStyle(0xd0c8b0);
  g.fillRect(17, 26, 2, 2);
  g.fillRect(17, 30, 2, 2);
  g.fillRect(17, 34, 2, 2);

  // Arms
  g.fillStyle(0xc4a484);
  g.fillRect(4, 22, 6, 12);
  g.fillRect(26, 22, 6, 12);
  // Shirt sleeves
  g.fillStyle(0x3a8a48);
  g.fillRect(4, 20, 6, 8);
  g.fillRect(26, 20, 6, 8);

  // Head
  g.fillStyle(0xc4a484);
  g.fillRect(10, 4, 16, 16);
  g.fillStyle(0xb8956e);
  g.fillRect(10, 4, 4, 16);

  // Short brown hair (no hat — different from merchants)
  g.fillStyle(0x5a3a18);
  g.fillRect(9, 2, 18, 6);
  g.fillRect(9, 6, 4, 8);
  g.fillRect(23, 6, 4, 6);

  // Eyes
  g.fillStyle(0x1a1a1a);
  g.fillRect(14, 10, 2, 2);
  g.fillRect(20, 10, 2, 2);

  g.generateTexture("npc_green_shirt", w, h);
  g.destroy();
}
