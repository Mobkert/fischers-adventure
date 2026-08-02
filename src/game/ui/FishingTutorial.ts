import Phaser from "phaser";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Welcome to Fischer's Adventure!",
    body:
      "This short guide shows you how to fish.\nYou can skip anytime — finishing or skipping earns $1000.",
  },
  {
    title: "Get to the water",
    body:
      "Walk with A / D toward either port — docks on the left and right shores.\nStand near the water (or press B on a port for a boat) to cast.",
  },
  {
    title: "Cast your rod",
    body:
      "Select your rod on hotbar slot 1, then left-click the water to cast.\nA bobber lands — wait for a fish to bite.",
  },
  {
    title: "The bite",
    body:
      "When a fish bites, a ! appears above you.\nRed = common fish · Gold = legendary Eel.",
  },
  {
    title: "Catch minigame",
    body:
      "Keep the fish inside the white zone on the grey bar.\nHold SPACE or left-click to push the white bar right; release to move left.\nFill the green progress bar to catch the fish!",
  },
  {
    title: "Sell & shop",
    body:
      "Talk to The Merchant (F) to sell fish for coins.\nPress W at the blue house for better rods.\nPress 2 to open your Equipment Bag and equip them.\n\nYou're ready — good luck out there!",
  },
];

/** First-run fishing tutorial with Skip / Next and a $1000 reward. */
export class FishingTutorial {
  private root: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private stepText!: Phaser.GameObjects.Text;
  private nextLabel!: Phaser.GameObjects.Text;
  private step = 0;
  visible = false;
  private onFinished?: (reward: number) => void;
  private isDone: () => boolean;
  private markDone: () => void;

  constructor(
    scene: Phaser.Scene,
    opts?: { isDone?: () => boolean; markDone?: () => void }
  ) {
    this.isDone = opts?.isDone ?? (() => false);
    this.markDone = opts?.markDone ?? (() => undefined);
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    this.root = scene.add.container(cx, cy).setDepth(200).setVisible(false);
    this.root.setScrollFactor(0);

    const dim = scene.add
      .rectangle(0, 0, scene.scale.width + 40, scene.scale.height + 40, 0x000000, 0.55)
      .setInteractive();

    const panel = scene.add
      .rectangle(0, 0, 560, 360, 0x1a1f28, 0.97)
      .setStrokeStyle(2, 0xc4a86a);

    this.titleText = scene.add
      .text(0, -140, "", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
        align: "center",
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5);

    this.bodyText = scene.add
      .text(0, -20, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#d8d8d8",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: 480 },
      })
      .setOrigin(0.5);

    this.stepText = scene.add
      .text(0, 100, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#888888",
      })
      .setOrigin(0.5);

    const skipBtn = scene.add
      .rectangle(-110, 140, 140, 40, 0x3a3a48)
      .setStrokeStyle(1, 0x888888)
      .setInteractive({ useHandCursor: true });
    const skipLabel = scene.add
      .text(-110, 140, "Skip", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const nextBtn = scene.add
      .rectangle(110, 140, 160, 40, 0x3d6b4f)
      .setStrokeStyle(1, 0x7dce7a)
      .setInteractive({ useHandCursor: true });
    this.nextLabel = scene.add
      .text(110, 140, "Next", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    skipBtn.on("pointerover", () => skipBtn.setFillStyle(0x4a4a5a));
    skipBtn.on("pointerout", () => skipBtn.setFillStyle(0x3a3a48));
    skipBtn.on("pointerdown", () => this.finish());

    nextBtn.on("pointerover", () => nextBtn.setFillStyle(0x4a8a62));
    nextBtn.on("pointerout", () => nextBtn.setFillStyle(0x3d6b4f));
    nextBtn.on("pointerdown", () => this.next());

    const rewardHint = scene.add
      .text(0, -175, "Reward: $1000 when you finish or skip", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    this.root.add([
      dim,
      panel,
      rewardHint,
      this.titleText,
      this.bodyText,
      this.stepText,
      skipBtn,
      skipLabel,
      nextBtn,
      this.nextLabel,
    ]);
  }

  setOnFinished(cb: (reward: number) => void): void {
    this.onFinished = cb;
  }

  /** Show tutorial if not already completed. Returns true if shown. */
  tryStart(): boolean {
    if (this.isDone()) return false;
    this.step = 0;
    this.visible = true;
    this.root.setVisible(true);
    this.renderStep();
    return true;
  }

  private next(): void {
    if (this.step >= STEPS.length - 1) {
      this.finish();
      return;
    }
    this.step += 1;
    this.renderStep();
  }

  private renderStep(): void {
    const s = STEPS[this.step];
    this.titleText.setText(s.title);
    this.bodyText.setText(s.body);
    this.stepText.setText(`Step ${this.step + 1} / ${STEPS.length}`);
    this.nextLabel.setText(
      this.step >= STEPS.length - 1 ? "Start fishing!" : "Next"
    );
  }

  private finish(): void {
    if (!this.visible) return;
    this.visible = false;
    this.root.setVisible(false);
    this.markDone();
    this.onFinished?.(1000);
  }
}
