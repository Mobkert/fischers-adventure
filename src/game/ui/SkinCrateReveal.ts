import Phaser from "phaser";
import {
  ROD_SKINS,
  RodSkinId,
  SkinCrateKind,
  crateSkinIds,
  crateItemId,
  crateDuplicateRefund,
} from "../data/rodSkins";
import { ITEMS } from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

const CELL_W = 110;
const CELL_H = 120;
const STRIP_LEN = 48;
const WINNER_INDEX = 40;

type SpinOutcome = {
  winner: RodSkinId;
  duplicate: boolean;
  refund: number;
  message: string;
};

type SpinLayer = {
  root: Phaser.GameObjects.Container;
  strip: Phaser.GameObjects.Container;
  outcome: SpinOutcome;
};

/**
 * CSGO-style skin crate reveal — supports 1 or 3 stacked concurrent spins.
 */
export class SkinCrateReveal {
  private root: Phaser.GameObjects.Container;
  private dim!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private layersRoot!: Phaser.GameObjects.Container;
  private resultText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private spinning = false;
  private pending = 0;
  private finished = 0;
  private resultLines: string[] = [];
  private kind: SkinCrateKind = "collectors";
  visible = false;
  private onDone?: (message: string) => void;
  private layers: SpinLayer[] = [];

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.inventory = inventory;
    const w = scene.scale.width;
    const h = scene.scale.height;

    this.root = scene.add.container(0, 0).setDepth(400).setVisible(false);
    this.root.setScrollFactor(0);

    this.dim = scene.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.72)
      .setInteractive();

    this.title = scene.add
      .text(w / 2, h / 2 - 130, "Opening Skin Crate…", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e0d0",
      })
      .setOrigin(0.5);

    this.layersRoot = scene.add.container(0, 0);

    this.resultText = scene.add
      .text(w / 2, h / 2 + 100, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffe066",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.hintText = scene.add
      .text(w / 2, h / 2 + 168, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaa090",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.root.add([
      this.dim,
      this.title,
      this.layersRoot,
      this.resultText,
      this.hintText,
    ]);

    this.dim.on("pointerdown", () => {
      if (this.spinning) return;
      this.close();
    });
  }

  setOnDone(cb: (message: string) => void): void {
    this.onDone = cb;
  }

  /** Open `count` crates at once (triple opens as 3 vertical reels). */
  open(count: 1 | 3 = 1, kind: SkinCrateKind = "collectors"): boolean {
    if (this.spinning || this.visible) return false;
    this.kind = kind;
    const itemId = crateItemId(kind);
    if (this.inventory.countItem(itemId) < count) return false;

    const winners: RodSkinId[] = [];
    for (let i = 0; i < count; i++) {
      if (!this.inventory.consumeCrate(kind)) {
        break;
      }
      winners.push(this.inventory.peekCrateRoll(kind));
    }
    if (winners.length === 0) return false;

    const outcomes: SpinOutcome[] = winners.map((winner) => {
      const result = this.inventory.resolveCrateRoll(winner, kind);
      return { winner, ...result };
    });

    this.title.setText(
      kind === "frostpeak" ? "Opening Frostpeak Crate…" : "Opening Skin Crate…"
    );
    this.visible = true;
    this.spinning = true;
    this.pending = outcomes.length;
    this.finished = 0;
    this.resultLines = [];
    this.root.setVisible(true);
    this.resultText.setVisible(false);
    this.hintText.setVisible(false);
    this.title.setText(
      outcomes.length === 1
        ? "Opening Skin Crate…"
        : `Opening ${outcomes.length} Skin Crates…`
    );
    const h = this.root.scene.scale.height;
    const w = this.root.scene.scale.width;
    if (outcomes.length > 1) {
      this.title.setPosition(w / 2, 36);
      this.resultText.setPosition(w / 2, h - 72);
      this.hintText.setPosition(w / 2, h - 28);
    } else {
      this.title.setPosition(w / 2, h / 2 - 130);
      this.resultText.setPosition(w / 2, h / 2 + 100);
      this.hintText.setPosition(w / 2, h / 2 + 168);
    }

    this.clearLayers();
    for (let i = 0; i < outcomes.length; i++) {
      this.spawnLayer(outcomes[i]!, i, outcomes.length);
    }
    return true;
  }

  private clearLayers(): void {
    for (const layer of this.layers) {
      layer.root.destroy(true);
    }
    this.layers = [];
    this.layersRoot.removeAll(true);
  }

  private spawnLayer(outcome: SpinOutcome, index: number, total: number): void {
    const scene = this.root.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const winner = outcome.winner;

    const multi = total > 1;
    // Vertical stack so every reel is fully visible
    const rowH = multi ? 132 : 200;
    const rowGap = multi ? 138 : 0;
    const stackOy =
      multi ? (index - (total - 1) / 2) * rowGap : 0;
    const cy = multi ? h / 2 + 8 + stackOy : h / 2;
    const cellW = multi ? 92 : CELL_W;
    const cellH = multi ? 88 : CELL_H;
    const panelW = multi ? 640 : 700;
    const panelH = multi ? rowH : 200;
    const viewW = multi ? 560 : 620;

    const layerRoot = scene.add.container(0, 0);
    const panel = scene.add
      .rectangle(w / 2, cy, panelW, panelH, 0x1a1520, 0.94)
      .setStrokeStyle(2, 0xc4a86a);

    const maskG = scene.make.graphics({ x: 0, y: 0 });
    maskG.fillStyle(0xffffff);
    maskG.fillRect(w / 2 - viewW / 2, cy - cellH / 2 - 4, viewW, cellH + 8);
    const mask = maskG.createGeometryMask();
    maskG.setVisible(false);

    const strip = scene.add.container(w / 2, cy);
    strip.setMask(mask);

    const marker = scene.add
      .rectangle(w / 2, cy, 4, cellH + 20, 0xffe066, 1);
    const markerTop = scene.add
      .triangle(
        w / 2,
        cy - cellH / 2 - 14,
        0,
        0,
        -9,
        -12,
        9,
        -12,
        0xffe066
      )
      .setOrigin(0.5);

    layerRoot.add([panel, maskG, strip, marker, markerTop]);
    this.layersRoot.add(layerRoot);

    this.buildStrip(strip, winner, cellW, cellH);
    strip.x = w / 2 + WINNER_INDEX * cellW * 0.55;

    const layer: SpinLayer = { root: layerRoot, strip, outcome };
    this.layers.push(layer);

    const targetX = w / 2;
    const jitter = Phaser.Math.FloatBetween(-cellW * 0.2, cellW * 0.2);
    const finalX = targetX + jitter;
    const delay = index * 120;
    const duration = 4600 + index * 280;

    scene.tweens.add({
      targets: strip,
      x: finalX,
      duration,
      delay,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.finishOne(outcome);
      },
    });
  }

  private buildStrip(
    strip: Phaser.GameObjects.Container,
    winner: RodSkinId,
    cellW = CELL_W,
    cellH = CELL_H
  ): void {
    strip.removeAll(true);
    const pool = crateSkinIds(this.kind);
    const scene = this.root.scene;
    const iconSize = cellH < 100 ? 36 : 48;
    for (let i = 0; i < STRIP_LEN; i++) {
      const id =
        i === WINNER_INDEX
          ? winner
          : pool[Math.floor(Math.random() * pool.length)]!;
      const def = ROD_SKINS[id];
      const x = (i - WINNER_INDEX) * cellW;
      const cell = scene.add.container(x, 0);
      const bg = scene.add
        .rectangle(0, 0, cellW - 8, cellH, 0x2a2430, 1)
        .setStrokeStyle(2, rarityColor(def.crateWeight));
      const icon = scene.add
        .image(0, cellH < 100 ? -10 : -12, def.textureKey)
        .setDisplaySize(
          id === "pufferfirm" ? iconSize + 16 : iconSize,
          id === "pufferfirm" ? Math.round(iconSize * 0.45) : iconSize
        );
      const label = scene.add
        .text(0, cellH < 100 ? 26 : 36, def.label, {
          fontFamily: "Arial",
          fontSize: cellH < 100 ? "10px" : "11px",
          color: "#e8dcc8",
          align: "center",
          wordWrap: { width: cellW - 16 },
        })
        .setOrigin(0.5);
      cell.add([bg, icon, label]);
      strip.add(cell);
    }
  }

  private finishOne(outcome: SpinOutcome): void {
    const { winner, duplicate, message } = outcome;
    const def = ROD_SKINS[winner];
    const rodName = ITEMS[def.rodId]?.name ?? "rod";

    if (duplicate) {
      this.resultLines.push(
        `Dup · ${def.label} (+$${crateDuplicateRefund(this.kind).toLocaleString()})`
      );
    } else {
      const haveRod = this.inventory.ownsRod(def.rodId);
      this.resultLines.push(
        haveRod
          ? `New · ${def.label} (${rodName})`
          : `New · ${def.label} — saved for ${rodName}`
      );
    }

    this.finished += 1;
    if (this.finished < this.pending) return;

    this.spinning = false;
    this.resultText.setColor("#ffe066");
    this.resultText.setText(this.resultLines.join("\n"));
    this.resultText.setVisible(true);
    this.hintText.setText("Click anywhere to continue");
    this.hintText.setVisible(true);
    this.title.setText(this.pending > 1 ? "Results" : "Opened!");

    const toast =
      this.resultLines.length === 1
        ? message
        : `Opened ${this.pending} crates:\n` + this.resultLines.join("\n");
    this.onDone?.(toast);
  }

  close(): void {
    if (this.spinning) return;
    this.visible = false;
    this.root.setVisible(false);
    this.clearLayers();
    this.resultLines = [];
    this.pending = 0;
    this.finished = 0;
  }

  isBusy(): boolean {
    return this.visible;
  }
}

function rarityColor(weight: number): number {
  if (weight <= 3) return 0xff66aa;
  if (weight <= 7) return 0xc084fc;
  if (weight <= 15) return 0x60a5fa;
  if (weight <= 25) return 0x4ade80;
  return 0x9ca3af;
}
