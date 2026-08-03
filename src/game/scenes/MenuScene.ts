import Phaser from "phaser";
import {
  getActiveSlotIndex,
  listSaveSlots,
  loadActiveSave,
} from "../save/SaveBank";

export class MenuScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.starting = false;

    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }

    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x6eb6e0, 0x6eb6e0, 0x1e4a3a, 0x2a6a4a, 1);
    bg.fillRect(0, 0, width, height);

    this.add.rectangle(
      width / 2,
      height * 0.78,
      width,
      height * 0.45,
      0x2a7a9a,
      0.35
    );

    this.add
      .text(width / 2, height * 0.2, "Fischer's Adventure", {
        fontFamily: "Georgia, serif",
        fontSize: "56px",
        color: "#f5f0e6",
        stroke: "#1a3d2a",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.3, "Cast your line. Chase the mythics.", {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#d8e8d8",
      })
      .setOrigin(0.5);

    this.makeButton(width / 2, height * 0.46, "Play", 0x2a6b4a, () => {
      this.startGame();
    });

    this.makeButton(width / 2, height * 0.58, "Saves", 0x2a5a88, () => {
      if (this.starting) return;
      this.scene.start("SavesScene");
    });

    const active = getActiveSlotIndex();
    const slot = listSaveSlots()[active];
    const save = loadActiveSave();
    const detail = slot.empty
      ? "Empty slot"
      : `$${save.coins.toLocaleString()} · ${save.ownedRods.length} rods`;

    this.add
      .text(
        width / 2,
        height * 0.7,
        `Active: Slot ${active + 1}  ·  ${detail}`,
        {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#ffe066",
        }
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.9,
        "A/D move · LMB cast · E inventory · 2 equipment bag",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#a8c0b0",
        }
      )
      .setOrigin(0.5);

    this.makeButton(width - 90, 40, "Updates", 0x4a3a28, () => {
      this.showUpdateLog();
    }, 140, 40, "16px");

    // Show update log when the menu opens
    this.showUpdateLog();
  }

  private showUpdateLog(): void {
    const { width, height } = this.scale;
    const root = this.add.container(width / 2, height / 2).setDepth(50);

    const panelW = 520;
    const panelH = 520;
    const viewH = 360;
    const viewTop = -170;

    const dim = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.55)
      .setInteractive();

    const panel = this.add
      .rectangle(0, 0, panelW, panelH, 0x1a241c, 0.97)
      .setStrokeStyle(2, 0xc4a86a);

    const title = this.add
      .text(0, -panelH / 2 + 28, "The Swamp Update", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, -panelH / 2 + 56, "Update Log · Scroll for more", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#9aaa9a",
      })
      .setOrigin(0.5);

    const listRoot = this.add.container(0, viewTop);
    const listContent = this.add.container(0, 0);
    listRoot.add(listContent);

    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(
      width / 2 - panelW / 2 + 24,
      height / 2 + viewTop,
      panelW - 48,
      viewH
    );
    maskShape.setVisible(false);
    listRoot.setMask(maskShape.createGeometryMask());

    const bodyText =
      "WHAT'S NEW\n\n" +
      "• Bestiary (hotbar slot 3) — browse Ocean and\n" +
      "  Swamp Pond. Caught fish are revealed; others\n" +
      "  stay as black silhouettes until you catch them\n" +
      "• Claim discovery rewards by rarity:\n" +
      "  Common $30 → Mythical $1000\n" +
      "• Fishable swamp pond with six new catches:\n" +
      "  Swamp Frog, Whisker Catfish, White Perch,\n" +
      "  Mushroom Cluster, Arapaima, and Alligator\n" +
      "• Amber Rod ($7000) in Bluefin Tackle Shop —\n" +
      "  balanced luck, resilience, control, and depth\n" +
      "  plus a chance at the Amber mutation (2× sell)\n" +
      "• Catch mutations: Glowing, Earthly, Starlight,\n" +
      "  Albino, Neon, Bloom, and Amber\n" +
      "• Big & Giant size effects on swimming fish\n" +
      "  (2× / 4× sell) — shown in water and inventory\n" +
      "• Catch ding SFX — triple ding for epic+ or\n" +
      "  mutated fish\n" +
      "• Inventory hover tooltips: name, rarity,\n" +
      "  mutation, size effect, and sell price\n" +
      "• Right-click fish to Keep them (won't sell)\n" +
      "• Spawn luck retuned — epics, legendaries, and\n" +
      "  mythicals use fixed rates that rise with luck\n" +
      "• Pond fishing: max 3 fish, half ocean rates\n" +
      "  for epic / legendary / mythical\n\n" +
      "CHANGES / FIXES\n\n" +
      "• Pond bestiary lists common → mythical order\n" +
      "• Merchant sell-all confirms total value first\n" +
      "• Merchant no longer lists fish prices —\n" +
      "  check sell value in your inventory tooltip\n" +
      "• Bluefin shop rod list is scrollable\n" +
      "• Equipment bag scrolls when you own more rods\n" +
      "• Only one mushroom cluster in the pond at a time\n" +
      "• Mushroom clusters despawn much faster\n" +
      "• Alligator faces the right way and is no longer\n" +
      "  squished\n" +
      "• Swamp Frog is smaller; Arapaima is larger\n" +
      "• Jungle island presented as a swamp with pond,\n" +
      "  bridge, and swamp merchant";

    const body = this.add
      .text(0, 0, bodyText, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#d0d8d0",
        align: "left",
        lineSpacing: 4,
        wordWrap: { width: panelW - 64 },
      })
      .setOrigin(0.5, 0);
    listContent.add(body);

    const contentH = body.height + 16;
    let scrollY = 0;
    const maxScroll = () => Math.max(0, contentH - viewH);

    const scrollTrack = this.add
      .rectangle(panelW / 2 - 22, viewTop + viewH / 2, 6, viewH, 0x2a3a30, 0.9)
      .setVisible(false);
    const scrollThumb = this.add
      .rectangle(panelW / 2 - 22, viewTop, 6, 40, 0xc4a86a, 0.9)
      .setOrigin(0.5, 0)
      .setVisible(false);

    const applyScroll = () => {
      scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll());
      listContent.setY(-scrollY);
      const max = maxScroll();
      const show = max > 0;
      scrollTrack.setVisible(show);
      scrollThumb.setVisible(show);
      if (!show) return;
      const thumbH = Math.max(28, (viewH / contentH) * viewH);
      const travel = viewH - thumbH;
      scrollThumb.setY(viewTop + (scrollY / max) * travel);
      scrollThumb.setSize(6, thumbH);
    };
    applyScroll();

    const wheelHandler = (
      pointer: Phaser.Input.Pointer,
      _gos: unknown,
      _dx: number,
      dy: number
    ) => {
      if (
        Math.abs(pointer.x - width / 2) > panelW / 2 ||
        Math.abs(pointer.y - height / 2) > panelH / 2
      ) {
        return;
      }
      scrollY += dy * 0.5;
      applyScroll();
    };
    this.input.on("wheel", wheelHandler);

    const closeBg = this.add
      .rectangle(0, panelH / 2 - 36, 140, 40, 0x2a6b4a)
      .setStrokeStyle(1, 0xf0e6d2)
      .setInteractive({ useHandCursor: true });
    const closeLabel = this.add
      .text(0, panelH / 2 - 36, "OK", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const close = () => {
      this.input.off("wheel", wheelHandler);
      maskShape.destroy();
      root.destroy(true);
    };
    closeBg.on("pointerover", () => closeBg.setFillStyle(0x3a8a5a));
    closeBg.on("pointerout", () => closeBg.setFillStyle(0x2a6b4a));
    closeBg.on("pointerdown", close);
    dim.on("pointerdown", close);

    root.add([
      dim,
      panel,
      title,
      subtitle,
      listRoot,
      scrollTrack,
      scrollThumb,
      closeBg,
      closeLabel,
    ]);
  }

  private startGame(): void {
    if (this.starting) return;
    this.starting = true;

    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }

    // Tear down anything that could sit on top of / race with the game
    this.scene.stop("UIScene");
    this.scene.stop("ShopScene");
    this.scene.stop("SavesScene");
    this.scene.start("GameScene");
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
    btnW = 280,
    btnH = 56,
    fontSize = "26px"
  ): void {
    const hover = Phaser.Display.Color.IntegerToColor(color).lighten(20).color;
    const bg = this.add
      .rectangle(x, y, btnW, btnH, color, 0.95)
      .setStrokeStyle(2, 0xf0e6d2)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: "Georgia, serif",
        fontSize,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(hover, 0.98));
    bg.on("pointerout", () => bg.setFillStyle(color, 0.95));
    bg.on("pointerdown", onClick);
  }
}
