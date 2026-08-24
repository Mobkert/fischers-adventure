import Phaser from "phaser";
import {
  getActiveSlotIndex,
  listSaveSlots,
  loadActiveSave,
  saveActiveSave,
} from "../save/SaveBank";
import { ITEMS, ItemId } from "../data/items";

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

    this.makeButton(width / 2, height * 0.56, "Accessories", 0x6a4a88, () => {
      if (this.starting) return;
      this.showAccessoriesPanel();
    });

    this.makeButton(width / 2, height * 0.66, "Saves", 0x2a5a88, () => {
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
        height * 0.78,
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
      .text(0, -panelH / 2 + 28, "Ashencast Update", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, -panelH / 2 + 56, "What's New · Changes & Fixes", {
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
      "• Ashencast Isle — a volcanic island past the reef:\n" +
      "  forge quest, anvil repair, local fish, and merchant\n" +
      "• Ashencast Forge — after the quest, craft four rods:\n" +
      "  Tranquil Rod, Recoil Rod, Portal Rod, and Forge Rod\n" +
      "• Code Guy — on starter island between the green and\n" +
      "  blue cottages; type promo codes for rewards:\n" +
      "  FreeBirthdayGift1 → $10,000\n" +
      "  FreeBirthdayGift2 → Sprout Angelfish\n" +
      "  SORRYFORBUGS → $10,000, Starlight Crystalfin Tuna,\n" +
      "  Celestial Amulet, and Ocean Anvil Shard (if needed)\n\n" +
      "CHANGES & FIXES\n\n" +
      "• Ocean Anvil Shard — stays in the water if you fail\n" +
      "  the catch minigame (no more permanent disappear)\n" +
      "• Zeus Rod — lightning zones in the catch minigame;\n" +
      "  warning beeps, then a strike can instant-catch the\n" +
      "  fish or electrify your bar (guarantees Thunder)\n" +
      "• Tranquil Rod — random extra cast depth; bubble\n" +
      "  minigame every 2 catches (fail resets streak)\n" +
      "• Recoil Rod — shotgun kick after the fish dashes\n" +
      "• Portal Rod — rarest nearby fish warps to your bobber\n" +
      "• Forge Rod — swords and axes erupt above the hotbar\n" +
      "  during the fight for progress bursts\n" +
      "• Special rod cast animations fixed — no more missing\n" +
      "  texture freeze when casting crafted rods";

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

    closeBg.on("pointerover", () => closeBg.setFillStyle(0x3a8a5a));
    closeBg.on("pointerout", () => closeBg.setFillStyle(0x2a6b4a));
    const closeUpdateLog = () => {
      this.input.off("wheel", wheelHandler);
      listRoot.clearMask(true);
      maskShape.destroy();
      this.time.delayedCall(0, () => {
        if (root.active) root.destroy(true);
      });
    };
    closeBg.on("pointerdown", closeUpdateLog);
    dim.on("pointerdown", closeUpdateLog);

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

  private showAccessoriesPanel(): void {
    const { width, height } = this.scale;
    const root = this.add.container(width / 2, height / 2).setDepth(60);
    const panelW = 480;
    const panelH = 520;
    const viewH = 340;
    const viewTop = -150;
    const rowH = 72;

    const dim = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.55)
      .setInteractive();
    const panel = this.add
      .rectangle(0, 0, panelW, panelH, 0x1a1c22, 0.97)
      .setStrokeStyle(2, 0xc4a86a);
    const title = this.add
      .text(0, -230, "Accessories", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(0, -195, "Hats for your angler · Equip from here or in-game bag", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    const listRoot = this.add.container(0, viewTop);
    const listContent = this.add.container(0, 0);
    listRoot.add(listContent);
    // Geometry masks use camera/world space — not container-local coords
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(
      width / 2 - panelW / 2 + 20,
      height / 2 + viewTop,
      panelW - 40,
      viewH
    );
    listRoot.setMask(maskShape.createGeometryMask());
    maskShape.setVisible(false);

    let save = loadActiveSave();
    let scrollY = 0;
    let contentH = 0;

    const rebuild = () => {
      listContent.removeAll(true);
      save = loadActiveSave();
      let y = 0;
      const addRow = (
        label: string,
        tex: string | null,
        equipped: boolean,
        onEquip: () => void
      ) => {
        const card = this.add
          .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
          .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
          .setOrigin(0.5, 0);
        listContent.add(card);
        if (tex && this.textures.exists(tex)) {
          const img = this.add.image(-150, y + rowH / 2, tex);
          const src = img.texture.getSourceImage() as {
            width?: number;
            height?: number;
          };
          const tw = Math.max(1, src.width ?? 40);
          const th = Math.max(1, src.height ?? 40);
          const maxSide = 44;
          if (tw >= th) {
            img.setDisplaySize(maxSide, Math.round(maxSide * (th / tw)));
          } else {
            img.setDisplaySize(Math.round(maxSide * (tw / th)), maxSide);
          }
          listContent.add(img);
        }
        listContent.add(
          this.add
            .text(-112, y + rowH / 2, label, {
              fontFamily: "Georgia, serif",
              fontSize: "17px",
              color: equipped ? "#ffe066" : "#ffffff",
            })
            .setOrigin(0, 0.5)
        );
        if (equipped) {
          listContent.add(
            this.add
              .text(140, y + rowH / 2, "Equipped", {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#ffe066",
              })
              .setOrigin(0.5)
          );
        } else {
          const btn = this.add
            .rectangle(140, y + rowH / 2, 100, 34, 0x3d6b4f)
            .setStrokeStyle(1, 0x7dce7a)
            .setInteractive({ useHandCursor: true });
          const bl = this.add
            .text(140, y + rowH / 2, "Equip", {
              fontFamily: "Arial",
              fontSize: "15px",
              color: "#ffffff",
            })
            .setOrigin(0.5);
          btn.on("pointerdown", onEquip);
          listContent.add([btn, bl]);
        }
        y += rowH + 10;
      };

      addRow("No hat", null, save.equippedHatId === null, () => {
        save.equippedHatId = null;
        saveActiveSave(save);
        rebuild();
      });
      for (const hatId of save.ownedHats) {
        const def = ITEMS[hatId as ItemId];
        if (!def?.isHat) continue;
        const id = hatId as ItemId;
        addRow(def.name, def.textureKey, save.equippedHatId === id, () => {
          save.equippedHatId = id;
          saveActiveSave(save);
          rebuild();
        });
      }
      contentH = Math.max(0, y - 10);
      scrollY = 0;
      listContent.setY(0);
    };
    rebuild();

    const maxScroll = () => Math.max(0, contentH - viewH);
    const scrollTrack = this.add
      .rectangle(panelW / 2 - 22, viewTop + viewH / 2, 6, viewH, 0x2a2f3a, 0.9)
      .setOrigin(0.5);
    const scrollThumb = this.add
      .rectangle(panelW / 2 - 22, viewTop, 6, 40, 0xc4a86a, 0.9)
      .setOrigin(0.5, 0);

    const applyScroll = () => {
      scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll());
      listContent.setY(-scrollY);
      const max = maxScroll();
      const show = max > 0;
      scrollTrack.setVisible(show);
      scrollThumb.setVisible(show);
      if (!show) return;
      const thumbH = Math.max(28, (viewH / contentH) * viewH);
      scrollThumb.setY(viewTop + (scrollY / max) * (viewH - thumbH));
      scrollThumb.setSize(6, thumbH);
    };

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
      listRoot.clearMask(true);
      maskShape.destroy();
      this.time.delayedCall(0, () => {
        if (root.active) root.destroy(true);
      });
    };
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
    applyScroll();
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
    this.scene.stop("BobberShopScene");
    this.scene.stop("BackpackShopScene");
    this.scene.stop("CloudShopScene");
    this.scene.stop("AmuletCaveScene");
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
