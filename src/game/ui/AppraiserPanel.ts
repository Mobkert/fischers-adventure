import Phaser from "phaser";
import {
  FISH_SIZES,
  FishMutationId,
  FishSizeId,
  ITEMS,
  ItemId,
  InventorySlot,
  MUTATIONS,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";

type Mode = "pick" | "confirm";

const PANEL_W = 480;
const PANEL_H = 380;
const VIEW_ROWS = 7;
const ROW_H = 34;

/** Collector's Island — pay to re-roll a fish's mutation & size. */
export class AppraiserPanel {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private footerText: Phaser.GameObjects.Text;
  private listRoot: Phaser.GameObjects.Container;
  private actionRoot: Phaser.GameObjects.Container;
  private fishIcon: Phaser.GameObjects.Image;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private mode: Mode = "pick";
  private selected: InventorySlot | null = null;
  private inventory!: InventorySystem;
  private scroll = 0;
  private lastResultMsg = "";
  private wheelHandler: (
    pointer: Phaser.Input.Pointer,
    currentlyOver: Phaser.GameObjects.GameObject[],
    dx: number,
    dy: number
  ) => void;

  private onAppraise?: () => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.panelCx = scene.scale.width / 2;
    this.panelCy = scene.scale.height / 2 - 10;

    this.root = scene.add
      .container(this.panelCx, this.panelCy)
      .setDepth(155)
      .setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x1a2030, 0.96)
      .setStrokeStyle(2, 0xc4a86a)
      .setInteractive();

    this.titleText = scene.add
      .text(0, -162, "The Appraiser", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.bodyText = scene.add
      .text(0, -124, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c8d0d8",
        align: "center",
        lineSpacing: 4,
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5, 0);

    this.fishIcon = scene.add
      .image(0, -118, "fish")
      .setDisplaySize(48, 32)
      .setVisible(false);

    this.listRoot = scene.add.container(0, -70);
    this.actionRoot = scene.add.container(0, 130);

    this.footerText = scene.add
      .text(0, 168, "", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#8899aa",
        align: "center",
      })
      .setOrigin(0.5);

    this.root.add([
      bg,
      this.titleText,
      this.bodyText,
      this.fishIcon,
      this.listRoot,
      this.actionRoot,
      this.footerText,
    ]);

    this.wheelHandler = (pointer, _gos, _dx, dy) => {
      if (!this.visible || this.mode !== "pick") return;
      const localX = pointer.x - this.panelCx;
      const localY = pointer.y - this.panelCy;
      if (Math.abs(localX) > PANEL_W / 2 || Math.abs(localY) > PANEL_H / 2) {
        return;
      }
      if (dy === 0) return;
      const before = this.scroll;
      this.scroll += dy > 0 ? 1 : -1;
      this.showPick();
      if (this.scroll === before) {
        // clamped — no-op
      }
    };
    scene.input.on("wheel", this.wheelHandler);
  }

  setInventory(inv: InventorySystem): void {
    this.inventory = inv;
  }

  setCallbacks(onAppraise: () => void, onClose?: () => void): void {
    this.onAppraise = onAppraise;
    this.onClose = onClose;
  }

  open(): void {
    this.visible = true;
    this.root.setVisible(true);
    this.selected = null;
    this.scroll = 0;
    this.lastResultMsg = "";
    this.showPick();
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (!open) {
      this.selected = null;
      this.lastResultMsg = "";
      this.onClose?.();
    }
  }

  handleKey(event: KeyboardEvent): boolean {
    if (!this.visible) return false;
    if (event.key === "Escape" || event.key === "x" || event.key === "X") {
      if (this.mode === "confirm") {
        this.lastResultMsg = "";
        this.showPick();
        return true;
      }
      this.setOpen(false);
      return true;
    }
    if (event.key === "Enter" && this.mode === "confirm") {
      this.confirmAppraise();
      return true;
    }
    if (this.mode === "pick") {
      if (event.key === "ArrowDown") {
        this.scroll += 1;
        this.showPick();
        return true;
      }
      if (event.key === "ArrowUp") {
        this.scroll = Math.max(0, this.scroll - 1);
        this.showPick();
        return true;
      }
    }
    return false;
  }

  private showPick(): void {
    this.mode = "pick";
    this.selected = null;
    this.clearList();
    this.clearActions();
    this.fishIcon.setVisible(false);

    // Pick mode: full-width copy under the title
    this.bodyText.setPosition(0, -124).setOrigin(0.5, 0);

    const slots = this.inventory.listAppraisableFishSlots();
    this.bodyText.setText(
      slots.length === 0
        ? "Bring me a fish worth appraising."
        : "Choose a fish to re-roll its mutation and size.\nCost scales with the fish's value."
    );
    this.footerText.setText(
      slots.length === 0
        ? "Esc / X — Leave"
        : "Click a fish · Scroll wheel · Esc / X — Leave"
    );

    if (slots.length === 0) return;

    const maxScroll = Math.max(0, slots.length - VIEW_ROWS);
    this.scroll = Phaser.Math.Clamp(this.scroll, 0, maxScroll);
    const shown = slots.slice(this.scroll, this.scroll + VIEW_ROWS);

    shown.forEach((slot, i) => {
      const y = i * ROW_H;
      const cost = this.inventory.getAppraiseCost(slot);
      this.addPickRow(
        this.formatFishLabel(slot),
        `$${cost.toLocaleString("en-US")}`,
        y,
        () => {
          this.lastResultMsg = "";
          this.showConfirm(slot);
        }
      );
    });

    if (maxScroll > 0) {
      this.footerText.setText(
        `Scroll wheel / ↑↓ · ${this.scroll + 1}–${this.scroll + shown.length} of ${slots.length} · Esc leave`
      );
    }
  }

  private showConfirm(slot: InventorySlot, resultNote?: string): void {
    this.mode = "confirm";
    this.selected = slot;
    this.clearList();
    this.clearActions();

    // Confirm: icon under title, text below icon so nothing overlaps
    this.fishIcon.setPosition(0, -118);
    this.bodyText.setPosition(0, -78).setOrigin(0.5, 0);

    const def = ITEMS[slot.itemId!];
    const cost = this.inventory.getAppraiseCost(slot);
    const canPay = this.inventory.coins >= cost;
    const note = resultNote ?? this.lastResultMsg;

    this.bodyText.setText(
      `${this.formatFishLabel(slot)}\n\n` +
        (note ? `${note}\n\n` : "") +
        `Appraisal fee: $${cost.toLocaleString("en-US")}\n` +
        `Your coins: $${this.inventory.coins.toLocaleString("en-US")}\n\n` +
        `Appraise again, or Back to pick another fish.`
    );

    if (this.scene.textures.exists(def.textureKey)) {
      this.fishIcon.setTexture(def.textureKey).setVisible(true);
      const iw = this.fishIcon.width || 48;
      const ih = this.fishIcon.height || 32;
      const s = Math.min(44 / iw, 30 / ih);
      this.fishIcon.setDisplaySize(iw * s, ih * s);
      if (def.facesLeft) this.fishIcon.setFlipX(true);
      else this.fishIcon.setFlipX(false);
    } else {
      this.fishIcon.setVisible(false);
    }

    const appraiseBtn = this.scene.add
      .rectangle(-90, 0, 160, 42, canPay ? 0x3a5a8a : 0x3a3a3a)
      .setStrokeStyle(1, canPay ? 0x7ec8ff : 0x666666)
      .setInteractive({ useHandCursor: canPay });
    const appraiseLabel = this.scene.add
      .text(-90, 0, "Appraise", {
        fontFamily: "Arial",
        fontSize: "17px",
        color: canPay ? "#e8f4ff" : "#888888",
      })
      .setOrigin(0.5);
    if (canPay) {
      appraiseBtn.on("pointerover", () => appraiseBtn.setFillStyle(0x4a6a9a));
      appraiseBtn.on("pointerout", () => appraiseBtn.setFillStyle(0x3a5a8a));
      appraiseBtn.on("pointerdown", () => this.confirmAppraise());
    }

    const backBtn = this.scene.add
      .rectangle(90, 0, 140, 42, 0x2a3444)
      .setStrokeStyle(1, 0x8899aa)
      .setInteractive({ useHandCursor: true });
    const backLabel = this.scene.add
      .text(90, 0, "Back", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#c8d0d8",
      })
      .setOrigin(0.5);
    backBtn.on("pointerover", () => backBtn.setFillStyle(0x3a4454));
    backBtn.on("pointerout", () => backBtn.setFillStyle(0x2a3444));
    backBtn.on("pointerdown", () => {
      this.lastResultMsg = "";
      this.showPick();
    });

    this.actionRoot.add([appraiseBtn, appraiseLabel, backBtn, backLabel]);
    this.footerText.setText(
      canPay
        ? "Enter — Appraise again · Esc / Back — Pick list"
        : "Not enough coins · Esc / Back — Pick list"
    );
  }

  private confirmAppraise(): void {
    if (!this.selected) return;
    this.onAppraise?.();
  }

  /**
   * After a successful appraisal, stay on this fish (updated mut/size).
   * Pass the appraised identity so we can re-select the live stack.
   */
  afterAppraise(
    ok: boolean,
    result?: {
      message: string;
      itemId?: ItemId;
      mutation?: FishMutationId | null;
      size?: FishSizeId | null;
    }
  ): void {
    if (!ok) {
      if (this.selected) this.showConfirm(this.selected);
      return;
    }
    this.lastResultMsg = result?.message ?? "";
    const id = result?.itemId;
    if (!id) {
      this.showPick();
      return;
    }
    const mut = result?.mutation ?? null;
    const size = result?.size ?? null;
    const live =
      this.inventory.listAppraisableFishSlots().find(
        (s) =>
          s.itemId === id &&
          (s.mutation ?? null) === mut &&
          (s.size ?? null) === size
      ) ?? null;
    if (live) {
      this.showConfirm(live, this.lastResultMsg);
    } else {
      this.showPick();
    }
  }

  getSelectedSlot(): InventorySlot | null {
    return this.selected;
  }

  private formatFishLabel(slot: InventorySlot): string {
    const def = ITEMS[slot.itemId!];
    const mut = slot.mutation ? MUTATIONS[slot.mutation].name + " " : "";
    const size =
      slot.size && slot.size !== "normal"
        ? FISH_SIZES[slot.size].name + " "
        : "";
    const count = slot.count > 1 ? ` ×${slot.count}` : "";
    return `${mut}${size}${def.name}${count}`;
  }

  private addPickRow(
    title: string,
    sub: string,
    y: number,
    onClick: () => void
  ): void {
    const hit = this.scene.add
      .rectangle(0, y, 420, 30, 0x2a3544, 0.95)
      .setStrokeStyle(1, 0x6a7a88)
      .setInteractive({ useHandCursor: true });
    const t = this.scene.add
      .text(-195, y, title, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#f0e6d2",
      })
      .setOrigin(0, 0.5);
    const s = this.scene.add
      .text(195, y, sub, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#ffe066",
      })
      .setOrigin(1, 0.5);
    hit.on("pointerover", () => hit.setFillStyle(0x3a4a5a, 0.95));
    hit.on("pointerout", () => hit.setFillStyle(0x2a3544, 0.95));
    hit.on("pointerdown", onClick);
    this.listRoot.add([hit, t, s]);
  }

  private clearList(): void {
    this.listRoot.removeAll(true);
  }

  private clearActions(): void {
    this.actionRoot.removeAll(true);
  }
}

/** Independent appraisal rolls — size & mutation. */
export type AppraiseRollResult = {
  mutation: FishMutationId | null;
  size: FishSizeId | null;
  gotMutation: boolean;
  gotSize: boolean;
};

export function rollAppraiseBonuses(): AppraiseRollResult {
  let size: FishSizeId | null = null;
  if (Math.random() < 0.03) size = "giant";
  else if (Math.random() < 0.02) size = "big";

  type MutRoll = { id: FishMutationId; chance: number; rarity: number };
  const candidates: MutRoll[] = [];

  const tryMut = (chance: number, id: FishMutationId, rarity: number) => {
    if (Math.random() < chance) candidates.push({ id, chance, rarity });
  };
  const tryPair = (
    chance: number,
    a: FishMutationId,
    b: FishMutationId,
    rarity: number
  ) => {
    if (Math.random() < chance) {
      candidates.push({
        id: Math.random() < 0.5 ? a : b,
        chance,
        rarity,
      });
    }
  };

  tryMut(0.15, "albino", 1);
  tryPair(0.1, "glowing", "amber", 2);
  tryMut(0.08, "electric", 3);
  tryMut(0.08, "dusty", 3);
  tryPair(0.07, "earthly", "neon", 4);
  tryMut(0.07, "sandy", 4);
  tryMut(0.06, "ash", 5);
  tryMut(0.03, "sprout", 6);
  tryMut(0.02, "tranquil", 7);
  tryMut(0.005, "starlight", 8);
  tryMut(0.0025, "thunder", 9);

  let mutation: FishMutationId | null = null;
  if (candidates.length > 0) {
    candidates.sort((x, y) => y.rarity - x.rarity);
    mutation = candidates[0]!.id;
  }

  return {
    mutation,
    size,
    gotMutation: mutation != null,
    gotSize: size != null,
  };
}
