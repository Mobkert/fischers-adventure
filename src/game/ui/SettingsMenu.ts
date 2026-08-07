import Phaser from "phaser";
import {
  isMobileModeEnabled,
  setMobileModeEnabled,
} from "../input/MobileMode";

/** Gear button + settings panel (music volume, mobile mode). */
export class SettingsMenu {
  private gearBtn: Phaser.GameObjects.Container;
  private panel: Phaser.GameObjects.Container;
  private fill!: Phaser.GameObjects.Rectangle;
  private trackHit!: Phaser.GameObjects.Rectangle;
  private valueText!: Phaser.GameObjects.Text;
  private mobileBtn!: Phaser.GameObjects.Rectangle;
  private mobileLabel!: Phaser.GameObjects.Text;
  private dragging = false;
  visible = false;
  private getVolume: () => number;
  private setVolume: (v: number) => void;
  private onQuitToMenu?: () => void;
  private onMobileModeChange?: (on: boolean) => void;

  constructor(
    scene: Phaser.Scene,
    getVolume: () => number,
    setVolume: (v: number) => void,
    onQuitToMenu?: () => void,
    onMobileModeChange?: (on: boolean) => void
  ) {
    this.getVolume = getVolume;
    this.setVolume = setVolume;
    this.onQuitToMenu = onQuitToMenu;
    this.onMobileModeChange = onMobileModeChange;

    // Top-right gear
    this.gearBtn = scene.add.container(scene.scale.width - 36, 36);
    this.gearBtn.setScrollFactor(0).setDepth(130);
    const gearBg = scene.add
      .circle(0, 0, 22, 0x1a1c22, 0.85)
      .setStrokeStyle(2, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    const gearIcon = scene.add
      .text(0, 0, "⚙", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);
    this.gearBtn.add([gearBg, gearIcon]);
    gearBg.on("pointerover", () => gearBg.setFillStyle(0x2a2f3a, 0.95));
    gearBg.on("pointerout", () => gearBg.setFillStyle(0x1a1c22, 0.85));
    gearBg.on("pointerdown", () => this.toggle());

    // Center panel
    this.panel = scene.add
      .container(scene.scale.width / 2, scene.scale.height / 2 - 20)
      .setScrollFactor(0)
      .setDepth(155)
      .setVisible(false);

    const bg = scene.add
      .rectangle(0, 0, 380, 340, 0x1a1c22, 0.96)
      .setStrokeStyle(2, 0xc4a86a);

    const title = scene.add
      .text(0, -138, "Settings", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const musicLabel = scene.add
      .text(-150, -78, "Music volume", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#d0d0d0",
      })
      .setOrigin(0, 0.5);

    this.valueText = scene.add
      .text(150, -78, "25%", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffe066",
      })
      .setOrigin(1, 0.5);

    const track = scene.add
      .rectangle(0, -30, 300, 10, 0x3a3f4a)
      .setOrigin(0.5);
    this.fill = scene.add
      .rectangle(-150, -30, 75, 10, 0xc4a86a)
      .setOrigin(0, 0.5);

    this.trackHit = scene.add
      .rectangle(0, -30, 300, 36, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    this.mobileBtn = scene.add
      .rectangle(0, 28, 260, 42, 0x2a4a3a)
      .setStrokeStyle(1, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    this.mobileLabel = scene.add
      .text(0, 28, "Mobile Mode: Off", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.mobileBtn.on("pointerover", () => {
      this.mobileBtn.setFillStyle(
        isMobileModeEnabled() ? 0x3a6a4a : 0x3a5a4a
      );
    });
    this.mobileBtn.on("pointerout", () => this.refreshMobileBtn());
    this.mobileBtn.on("pointerdown", () => {
      const next = !isMobileModeEnabled();
      setMobileModeEnabled(next);
      this.refreshMobileBtn();
      this.onMobileModeChange?.(next);
    });

    const quitBtn = scene.add
      .rectangle(0, 90, 240, 40, 0x6a3a2a)
      .setStrokeStyle(1, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    const quitLabel = scene.add
      .text(0, 90, "Save & Quit to Menu", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    quitBtn.on("pointerover", () => quitBtn.setFillStyle(0x8a4a35));
    quitBtn.on("pointerout", () => quitBtn.setFillStyle(0x6a3a2a));
    quitBtn.on("pointerdown", () => {
      this.setOpen(false);
      this.onQuitToMenu?.();
    });

    const hint = scene.add
      .text(0, 140, "Esc / click ⚙ to close", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.panel.add([
      bg,
      title,
      musicLabel,
      this.valueText,
      track,
      this.fill,
      this.trackHit,
      this.mobileBtn,
      this.mobileLabel,
      quitBtn,
      quitLabel,
      hint,
    ]);

    this.trackHit.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.applyPointer(p);
    });
    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !this.visible) return;
      this.applyPointer(p);
    });
    scene.input.on("pointerup", () => {
      this.dragging = false;
    });

    this.refreshSlider();
    this.refreshMobileBtn();
  }

  private refreshMobileBtn(): void {
    const on = isMobileModeEnabled();
    this.mobileBtn.setFillStyle(on ? 0x2a6a4a : 0x2a4a3a);
    this.mobileLabel.setText(on ? "Mobile Mode: On" : "Mobile Mode: Off");
  }

  private applyPointer(p: Phaser.Input.Pointer): void {
    const local = this.panel
      .getWorldTransformMatrix()
      .applyInverse(p.x, p.y);
    const x = Phaser.Math.Clamp(local.x, -150, 150);
    const vol = (x + 150) / 300;
    this.setVolume(vol);
    this.refreshSlider();
  }

  private refreshSlider(): void {
    const v = this.getVolume();
    this.fill.width = Math.max(2, 300 * v);
    this.valueText.setText(`${Math.round(v * 100)}%`);
  }

  toggle(): void {
    this.setOpen(!this.visible);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.panel.setVisible(open);
    if (open) {
      this.refreshSlider();
      this.refreshMobileBtn();
    }
  }

  isOpen(): boolean {
    return this.visible;
  }
}
