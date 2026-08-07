import Phaser from "phaser";

/** Side-view fish buyer NPC with speech bubbles. */
export class FishMerchant {
  sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private bubbleBg?: Phaser.GameObjects.Graphics;
  private bubbleText?: Phaser.GameObjects.Text;
  private nameTag: Phaser.GameObjects.Text;
  talking = false;
  private mode: "idle" | "offer" | "sold" | "nofish" = "idle";

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
    this.sprite.setOrigin(0.5, 1); // feet on the ground

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
        this.showBubble(
          keptCount > 0
            ? "All your fish are kept!\nRight-click them in your inventory\nto unlock selling."
            : "Got any fish?\nCome back when you've caught some!",
          "#ffffff"
        );
        this.scheduleClose(2800);
        return true;
      }
      this.mode = "offer";
      this.talking = true;
      this.showBubble(
        `Would you like to sell all your fish for $${offerValue}?\n\n[F] Sell all    [X] No thanks`,
        "#ffffff"
      );
      return true;
    }

    if (this.mode === "offer") {
      const result = onSell();
      this.mode = "sold";
      if (result.sold <= 0) {
        this.showBubble(
          keptCount > 0
            ? "Nothing to sell — your fish are kept.\nRight-click in inventory to unlock."
            : "Looks like you're out of fish!",
          "#ffffff"
        );
      } else {
        this.showBubble(
          `Pleasure doing business!\nSold ${result.sold} fish for $${result.earned}.`,
          "#d4ffd4"
        );
      }
      this.scheduleClose(3200);
      return true;
    }

    return false;
  }

  decline(): void {
    if (this.mode !== "offer") return;
    this.mode = "idle";
    this.talking = false;
    this.showBubble("Alright, maybe next time.", "#ffffff");
    this.scheduleClose(1800);
  }

  close(): void {
    this.mode = "idle";
    this.talking = false;
    this.hideBubble();
  }

  private scheduleClose(ms: number): void {
    this.scene.time.delayedCall(ms, () => {
      if (this.mode === "sold" || this.mode === "nofish") {
        this.close();
      }
    });
  }

  private showBubble(text: string, color: string): void {
    this.hideBubble();
    const bx = this.x;
    const by = this.y - 120;

    this.bubbleText = this.scene.add
      .text(bx, by, text, {
        fontFamily: "Arial",
        fontSize: "14px",
        color,
        align: "center",
        lineSpacing: 4,
        wordWrap: { width: 220 },
      })
      .setOrigin(0.5)
      .setDepth(30);

    const bounds = this.bubbleText.getBounds();
    const padX = 14;
    const padY = 10;
    this.bubbleBg = this.scene.add.graphics().setDepth(29);
    this.bubbleBg.fillStyle(0x1a1a22, 0.92);
    this.bubbleBg.fillRoundedRect(
      bounds.x - padX,
      bounds.y - padY,
      bounds.width + padX * 2,
      bounds.height + padY * 2,
      10
    );
    this.bubbleBg.lineStyle(2, 0xe8d5a3, 1);
    this.bubbleBg.strokeRoundedRect(
      bounds.x - padX,
      bounds.y - padY,
      bounds.width + padX * 2,
      bounds.height + padY * 2,
      10
    );
    // Tail
    this.bubbleBg.fillStyle(0x1a1a22, 0.92);
    this.bubbleBg.fillTriangle(
      bx - 8,
      bounds.bottom + padY - 2,
      bx + 8,
      bounds.bottom + padY - 2,
      bx,
      bounds.bottom + padY + 12
    );
  }

  private hideBubble(): void {
    this.bubbleBg?.destroy();
    this.bubbleText?.destroy();
    this.bubbleBg = undefined;
    this.bubbleText = undefined;
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

  // shadow
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(w / 2, h - 2, 20, 5);

  // legs
  g.fillStyle(0x3a2a1a);
  g.fillRect(10, 38, 7, 16);
  g.fillRect(19, 38, 7, 16);
  g.fillStyle(0x2a1a10);
  g.fillRect(10, 50, 8, 4);
  g.fillRect(19, 50, 8, 4);

  // apron / coat
  g.fillStyle(0x4a6fa5);
  g.fillRect(8, 20, 20, 20);
  g.fillStyle(0xe8e0d0);
  g.fillRect(10, 28, 16, 12);

  // arms
  g.fillStyle(0xc4a484);
  g.fillRect(4, 22, 6, 12);
  g.fillRect(26, 22, 6, 12);

  // head
  g.fillStyle(0xc4a484);
  g.fillRect(10, 4, 16, 16);
  g.fillStyle(0xb8956e);
  g.fillRect(10, 4, 4, 16);

  // hat
  g.fillStyle(0x2c3e50);
  g.fillRect(8, 2, 20, 6);
  g.fillRect(12, 0, 12, 4);

  // eye
  g.fillStyle(0x1a1a1a);
  g.fillRect(20, 10, 2, 2);

  // fish crate hint
  g.fillStyle(0x6b4423);
  g.fillRect(28, 34, 8, 10);
  g.fillStyle(0x58a6ff);
  g.fillRect(29, 36, 6, 3);

  g.generateTexture("npc_merchant", w, h);
  g.destroy();
}
