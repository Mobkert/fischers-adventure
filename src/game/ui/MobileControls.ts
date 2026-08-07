import Phaser from "phaser";

export type MobileVirtualKey = "left" | "right" | "jump";

export interface MobileControlsCallbacks {
  setVirtual: (key: MobileVirtualKey, down: boolean) => void;
  pressJump: () => void;
  onCast: () => void;
  onInteract: () => void;
  onInventory: () => void;
  onBoat: () => void;
}

/**
 * On-screen D-pad, jump, cast, interact, inventory, and boat buttons.
 * Sized for phone thumbs — visible only while Mobile Mode is on.
 */
export class MobileControls {
  private root: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private cbs: MobileControlsCallbacks;
  private enabled = false;
  /** True while any control is held — blocks world tap-to-cast. */
  capturing = false;

  constructor(scene: Phaser.Scene, cbs: MobileControlsCallbacks) {
    this.scene = scene;
    this.cbs = cbs;
    const { width, height } = scene.scale;

    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(125);
    this.root.setVisible(false);

    // Thumb-sized pads (game is 1280×720 FIT — large game-space = readable on phone)
    const padY = height - 120;
    const leftX = 130;
    const rightX = width - 130;

    this.root.add(
      this.makeHoldBtn(leftX - 72, padY, 118, 118, "◀", 0x2a3540, () => {
        this.cbs.setVirtual("left", true);
      }, () => {
        this.cbs.setVirtual("left", false);
      }, "42px")
    );
    this.root.add(
      this.makeHoldBtn(leftX + 72, padY, 118, 118, "▶", 0x2a3540, () => {
        this.cbs.setVirtual("right", true);
      }, () => {
        this.cbs.setVirtual("right", false);
      }, "42px")
    );
    this.root.add(
      this.makeHoldBtn(leftX, padY - 128, 140, 100, "JUMP", 0x3a5040, () => {
        this.cbs.setVirtual("jump", true);
        this.cbs.pressJump();
      }, () => {
        this.cbs.setVirtual("jump", false);
      }, "28px")
    );

    this.root.add(
      this.makeHoldBtn(rightX, padY - 8, 150, 150, "CAST", 0x3a5a7a, () => {
        this.cbs.onCast();
      }, () => {
        /* hold feeds catch minigame via pointer-down */
      }, "32px")
    );
    this.root.add(
      this.makeTapBtn(rightX - 148, padY + 8, 110, 100, "TALK", 0x5a4a30, () => {
        this.cbs.onInteract();
      }, "24px")
    );
    this.root.add(
      this.makeTapBtn(rightX + 8, padY - 132, 110, 90, "BAG", 0x4a3a28, () => {
        this.cbs.onInventory();
      }, "24px")
    );
    this.root.add(
      this.makeTapBtn(rightX - 148, padY - 132, 110, 90, "BOAT", 0x2a4a5a, () => {
        this.cbs.onBoat();
      }, "24px")
    );

    scene.input.on("gameout", () => this.releaseAll());
    scene.game.events.on("blur", () => this.releaseAll());
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.root.setVisible(on);
    if (!on) this.releaseAll();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private releaseAll(): void {
    this.capturing = false;
    this.cbs.setVirtual("left", false);
    this.cbs.setVirtual("right", false);
    this.cbs.setVirtual("jump", false);
  }

  private makeHoldBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onDown: () => void,
    onUp: () => void,
    fontSize = "28px"
  ): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const bg = this.scene.add
      .rectangle(0, 0, w, h, color, 0.82)
      .setStrokeStyle(3, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Arial",
        fontSize,
        color: "#f0e6d2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    c.add([bg, text]);

    const press = () => {
      this.capturing = true;
      bg.setFillStyle(color, 0.98);
      onDown();
    };
    const release = () => {
      bg.setFillStyle(color, 0.82);
      onUp();
      this.capturing = false;
    };

    bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      press();
    });
    bg.on("pointerup", release);
    bg.on("pointerupoutside", release);
    bg.on("pointerout", release);
    return c;
  }

  private makeTapBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onTap: () => void,
    fontSize = "18px"
  ): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const bg = this.scene.add
      .rectangle(0, 0, w, h, color, 0.82)
      .setStrokeStyle(3, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Arial",
        fontSize,
        color: "#f0e6d2",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    c.add([bg, text]);

    bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      this.capturing = true;
      bg.setFillStyle(color, 0.98);
    });
    bg.on("pointerup", (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      bg.setFillStyle(color, 0.82);
      this.capturing = false;
      onTap();
    });
    bg.on("pointerupoutside", () => {
      bg.setFillStyle(color, 0.82);
      this.capturing = false;
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(color, 0.82);
    });
    return c;
  }
}
