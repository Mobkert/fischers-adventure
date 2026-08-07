import Phaser from "phaser";
import {
  AUGMENT_UPGRADE_CAPS,
  AugmentStatKey,
  ITEMS,
  applyAugmentUpgrades,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

const STAT_ORDER: AugmentStatKey[] = [
  "luck",
  "resilience",
  "control",
  "progressSpeed",
  "lineDepth",
];

const ACCENT_HEX: Record<AugmentStatKey, string> = {
  luck: "#d4af37",
  resilience: "#7ec8e3",
  control: "#a8d4a0",
  progressSpeed: "#c4a86a",
  lineDepth: "#b0b8c8",
};

/** Horizontal rod: handle left (−130) → star tip right (+130). */
const STAT_META: Record<
  AugmentStatKey,
  {
    title: string;
    gain: string;
    label: { x: number; y: number };
    tip: { x: number; y: number };
    accent: number;
  }
> = {
  luck: {
    title: "Luck",
    gain: "+5%",
    label: { x: 200, y: -90 },
    tip: { x: 128, y: -2 },
    accent: 0xd4af37,
  },
  resilience: {
    title: "Resilience",
    gain: "+5%",
    label: { x: -200, y: -90 },
    tip: { x: -10, y: 0 },
    accent: 0x7ec8e3,
  },
  control: {
    title: "Control",
    gain: "+5%",
    label: { x: 200, y: 105 },
    tip: { x: 50, y: 2 },
    accent: 0xa8d4a0,
  },
  progressSpeed: {
    title: "Progress",
    gain: "+5%",
    label: { x: -200, y: 105 },
    tip: { x: -70, y: 2 },
    accent: 0xc4a86a,
  },
  lineDepth: {
    title: "Depth",
    gain: "+1m",
    // Bottom center — clear of title / subtitle
    label: { x: 0, y: 145 },
    tip: { x: -115, y: 4 },
    accent: 0xb0b8c8,
  },
};

const ROD_TEX_KEY = "rod_augment_ui";

/**
 * Augment Rod upgrade — sideways crisp rod with callout stats and leader lines.
 */
export class AugmentUpgradePanel {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private stage: Phaser.GameObjects.Container;
  private linesGfx: Phaser.GameObjects.Graphics;
  private rodGlow!: Phaser.GameObjects.Image;
  private rod!: Phaser.GameObjects.Image;
  private subtitle!: Phaser.GameObjects.Text;
  visible = false;
  private inventory!: InventorySystem;
  private onPicked?: () => void;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    ensureAugmentUiTexture(scene);

    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 6;

    this.root = scene.add.container(cx, cy).setDepth(170).setVisible(false);
    this.root.setScrollFactor(0);

    const veil = scene.add
      .rectangle(
        0,
        0,
        scene.scale.width + 40,
        scene.scale.height + 40,
        0x06080c,
        0.55
      )
      .setInteractive();

    const panel = scene.add
      .rectangle(0, 0, 560, 430, 0x12161e, 0.97)
      .setStrokeStyle(2, 0x6a7480);

    const inner = scene.add
      .rectangle(0, 12, 520, 350, 0x1a2030, 0.55)
      .setStrokeStyle(1, 0x3a4454);

    const title = scene.add
      .text(0, -192, "AUGMENT", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#e8eef4",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const titleRule = scene.add.rectangle(0, -172, 120, 2, 0x8a929c, 0.85);

    this.subtitle = scene.add
      .text(0, -152, "The star flares — choose a path.", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#8a96a4",
      })
      .setOrigin(0.5);

    this.stage = scene.add.container(0, 8);
    this.linesGfx = scene.add.graphics();

    this.rodGlow = scene.add
      .image(0, 0, ROD_TEX_KEY)
      .setOrigin(0.5)
      .setScale(1.08)
      .setAlpha(0.28)
      .setTint(0xc0c8d0);

    this.rod = scene.add.image(0, 0, ROD_TEX_KEY).setOrigin(0.5);

    this.stage.add([this.rodGlow, this.rod, this.linesGfx]);

    this.root.add([
      veil,
      panel,
      inner,
      title,
      titleRule,
      this.subtitle,
      this.stage,
    ]);
  }

  setInventory(inv: InventorySystem): void {
    this.inventory = inv;
  }

  setOnPicked(cb: () => void): void {
    this.onPicked = cb;
  }

  open(): void {
    const upgrades = this.inventory.getAugmentUpgrades();
    const available = STAT_ORDER.filter(
      (k) => upgrades[k] < AUGMENT_UPGRADE_CAPS[k]
    );
    if (!available.length) return;

    this.visible = true;
    this.root.setVisible(true);
    this.clearStageExtras();

    const base = ITEMS.augment_rod.rodStats!;
    const current = applyAugmentUpgrades(base, upgrades);
    const left = available.length;
    this.subtitle.setText(
      left === 1
        ? "One upgrade remains — claim it."
        : `The star flares — choose a path · ${left} open`
    );

    this.linesGfx.clear();
    for (const key of STAT_ORDER) {
      const used = upgrades[key];
      const cap = AUGMENT_UPGRADE_CAPS[key];
      const open = used < cap;
      this.drawCallout(key, used, cap, open, current);
    }

    this.pulseTween?.stop();
    this.pulseTween = this.scene.tweens.add({
      targets: this.rodGlow,
      alpha: { from: 0.16, to: 0.38 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  close(): void {
    this.visible = false;
    this.root.setVisible(false);
    this.pulseTween?.stop();
    this.pulseTween = undefined;
    this.clearStageExtras();
    this.linesGfx.clear();
  }

  handleKey(event: KeyboardEvent): boolean {
    if (!this.visible) return false;
    if (event.key >= "1" && event.key <= "5") {
      const upgrades = this.inventory.getAugmentUpgrades();
      const available = STAT_ORDER.filter(
        (k) => upgrades[k] < AUGMENT_UPGRADE_CAPS[k]
      );
      const idx = Number(event.key) - 1;
      if (available[idx]) this.pick(available[idx]);
      return true;
    }
    return true;
  }

  private pick(key: AugmentStatKey): void {
    if (!this.inventory.applyAugmentUpgrade(key)) return;
    this.close();
    this.onPicked?.();
  }

  private clearStageExtras(): void {
    const keep = new Set<Phaser.GameObjects.GameObject>([
      this.rodGlow,
      this.rod,
      this.linesGfx,
    ]);
    const doomed: Phaser.GameObjects.GameObject[] = [];
    this.stage.each((child: Phaser.GameObjects.GameObject) => {
      if (!keep.has(child)) doomed.push(child);
    });
    for (const c of doomed) c.destroy();
  }

  private drawCallout(
    key: AugmentStatKey,
    used: number,
    cap: number,
    open: boolean,
    current: {
      luck: number;
      resilience: number;
      control: number;
      progressSpeed: number;
      lineDepth: number;
    }
  ): void {
    const meta = STAT_META[key];
    const { label, tip, accent, title, gain } = meta;

    const lineColor = open ? accent : 0x4a5560;
    this.linesGfx.lineStyle(1.5, lineColor, open ? 0.85 : 0.35);
    this.linesGfx.beginPath();
    this.linesGfx.moveTo(label.x, label.y);
    const midX = (label.x + tip.x) / 2;
    const midY =
      label.y > tip.y
        ? tip.y + Math.min(28, (label.y - tip.y) * 0.35)
        : tip.y - 18;
    this.linesGfx.lineTo(midX, midY);
    this.linesGfx.lineTo(tip.x, tip.y);
    this.linesGfx.strokePath();

    this.linesGfx.fillStyle(lineColor, open ? 1 : 0.4);
    this.linesGfx.fillCircle(tip.x, tip.y, open ? 4 : 3);
    if (open) {
      this.linesGfx.lineStyle(1, 0xffffff, 0.45);
      this.linesGfx.strokeCircle(tip.x, tip.y, 6);
    }

    const valueNow =
      key === "lineDepth"
        ? `${current.lineDepth}m`
        : `${current[key] > 0 ? "+" : ""}${current[key]}%`;

    const w = 118;
    const h = 52;
    const hit = this.scene.add
      .rectangle(
        label.x,
        label.y,
        w,
        h,
        open ? 0x222833 : 0x181c24,
        open ? 0.95 : 0.7
      )
      .setStrokeStyle(1.5, open ? accent : 0x3a4450);

    const nameText = this.scene.add
      .text(label.x - 48, label.y - 14, title, {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: open ? "#f0f4f8" : "#6a7280",
      })
      .setOrigin(0, 0.5);

    const gainText = this.scene.add
      .text(label.x + 48, label.y - 14, open ? gain : "MAX", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: open ? ACCENT_HEX[key] : "#5a6270",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);

    const subText = this.scene.add
      .text(label.x - 48, label.y + 10, `${valueNow}  ·  ${used}/${cap}`, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: open ? "#9aa4b0" : "#555e6a",
      })
      .setOrigin(0, 0.5);

    this.stage.add([hit, nameText, gainText, subText]);

    if (open) {
      hit.setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => {
        hit.setFillStyle(0x2c3544, 1);
        hit.setStrokeStyle(2, accent);
        nameText.setScale(1.04);
        gainText.setScale(1.04);
      });
      hit.on("pointerout", () => {
        hit.setFillStyle(0x222833, 0.95);
        hit.setStrokeStyle(1.5, accent);
        nameText.setScale(1);
        gainText.setScale(1);
      });
      hit.on("pointerdown", () => this.pick(key));
    }
  }
}

/** High-res horizontal Augment Rod for the upgrade UI (not the 64px icon). */
function ensureAugmentUiTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(ROD_TEX_KEY)) return;

  const W = 320;
  const H = 96;
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);

  const cy = H / 2;
  const left = 28;
  const right = 268;
  const tipX = 292;

  // Soft shadow
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(W / 2, cy + 22, 220, 16);

  // Blank — layered for a smooth taper
  g.lineStyle(14, 0x3a4048, 1);
  g.lineBetween(left, cy + 2, right, cy - 1);
  g.lineStyle(10, 0x6a727c, 1);
  g.lineBetween(left + 2, cy + 1, right, cy - 1);
  g.lineStyle(6, 0x9aa2aa, 1);
  g.lineBetween(left + 6, cy, right - 2, cy - 2);
  g.lineStyle(2.5, 0xd0d8e0, 0.7);
  g.lineBetween(left + 14, cy - 2, right - 8, cy - 4);

  // Thread wraps
  g.lineStyle(3, 0x5a626c, 1);
  for (const x of [90, 120, 150, 180, 210]) {
    g.lineBetween(x, cy - 7, x + 8, cy + 7);
  }

  // Grip / handle
  g.fillStyle(0x2e3238, 1);
  g.fillRoundedRect(left - 10, cy - 12, 36, 26, 5);
  g.fillStyle(0x4a5058, 1);
  g.fillRoundedRect(left - 8, cy - 10, 32, 8, 3);
  g.fillStyle(0x6a7078, 1);
  g.fillRect(left - 10, cy + 12, 36, 4);

  // Reel seat
  g.fillStyle(0xa0a8b0, 1);
  g.fillRoundedRect(left + 24, cy - 8, 14, 16, 2);
  g.fillStyle(0xd8dee4, 1);
  g.fillRect(left + 26, cy - 6, 10, 3);

  // Tip guide
  g.lineStyle(3, 0xc0c8d0, 1);
  g.strokeCircle(right + 4, cy - 2, 7);
  g.fillStyle(0xe8eef2, 1);
  g.fillCircle(right + 4, cy - 2, 2.5);

  // Cool grey star at tip
  drawStar(g, tipX, cy - 4, 16, 7, 0xa8b0b8);
  drawStar(g, tipX, cy - 4, 11, 5, 0xd8e0e8);
  g.fillStyle(0xf4f6f8, 1);
  g.fillCircle(tipX, cy - 4, 3.5);

  g.generateTexture(ROD_TEX_KEY, W, H);
  g.destroy();
}

function drawStar(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  color: number
): void {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) {
    g.lineTo(pts[i]!.x, pts[i]!.y);
  }
  g.closePath();
  g.fillPath();
}
