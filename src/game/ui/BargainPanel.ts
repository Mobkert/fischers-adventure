import Phaser from "phaser";
import {
  FISH_SIZES,
  ITEMS,
  ItemId,
  MUTATIONS,
  InventorySlot,
} from "../data/items";
import { BargainKind, BargainOutcome, resolveBargainOffer } from "../systems/BargainLogic";
import { InventorySystem } from "../systems/InventorySystem";
import {
  CurioStockEntry,
  formatCurioRestock,
} from "../systems/CurioTraderStock";

type PanelMode = "pick" | "offer" | "result";

export type BargainSession =
  | {
      kind: "fish_buy";
      slot: InventorySlot;
      fair: number;
      label: string;
    }
  | {
      kind: "curio_sell";
      stockId: string;
      itemId: ItemId;
      fair: number;
      label: string;
      stockKind: "fish" | "rod" | "bobber" | "misc";
      mutation: InventorySlot["mutation"];
      size: InventorySlot["size"];
      needsLabel?: string;
    };

/**
 * Collector's Island haggle UI — pick item, type a price, Accept/Reject/Counter.
 */
export class BargainPanel {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private amountText: Phaser.GameObjects.Text;
  private footerText: Phaser.GameObjects.Text;
  private listRoot: Phaser.GameObjects.Container;
  private actionRoot: Phaser.GameObjects.Container;
  visible = false;
  private mode: PanelMode = "pick";
  private digits = "";
  private session: BargainSession | null = null;
  private pendingOutcome: BargainOutcome | null = null;
  private bargainKind: BargainKind = "fish_buy";
  private npcName = "Collector";
  private inventory!: InventorySystem;
  private getCurioStock: () => CurioStockEntry[] = () => [];
  private getCurioRestockMs: () => number = () => 0;
  private lastRestockLabel = "";

  private onDeal?: (session: BargainSession, price: number) => void;
  private onClose?: () => void;
  private onCoins?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 10;

    this.root = scene.add.container(cx, cy).setDepth(155).setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, 460, 340, 0x1a2430, 0.96)
      .setStrokeStyle(2, 0xc4a86a);

    this.titleText = scene.add
      .text(0, -145, "Bargain", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.bodyText = scene.add
      .text(0, -100, "", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c8d0d8",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);

    this.listRoot = scene.add.container(0, -40);
    this.actionRoot = scene.add.container(0, 110);

    this.amountText = scene.add
      .text(0, 95, "$0", {
        fontFamily: "Georgia, serif",
        fontSize: "30px",
        color: "#ffe066",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.footerText = scene.add
      .text(0, 150, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#8899aa",
        align: "center",
      })
      .setOrigin(0.5);

    this.root.add([
      bg,
      this.titleText,
      this.bodyText,
      this.listRoot,
      this.amountText,
      this.actionRoot,
      this.footerText,
    ]);
  }

  setInventory(inv: InventorySystem): void {
    this.inventory = inv;
  }

  setCurioStockProvider(
    getStock: () => CurioStockEntry[],
    getRestockMs?: () => number
  ): void {
    this.getCurioStock = getStock;
    if (getRestockMs) this.getCurioRestockMs = getRestockMs;
  }

  /** Live-update restock countdown while the curio pick list is open. */
  update(): void {
    if (!this.visible || this.bargainKind !== "curio_sell") return;
    if (this.mode !== "pick") return;
    this.refreshCurioRestockLabel();
  }

  setCallbacks(
    onDeal: (session: BargainSession, price: number) => void,
    onClose?: () => void,
    onCoins?: () => void
  ): void {
    this.onDeal = onDeal;
    this.onClose = onClose;
    this.onCoins = onCoins;
  }

  open(kind: BargainKind, npcName: string): void {
    this.bargainKind = kind;
    this.npcName = npcName;
    this.visible = true;
    this.root.setVisible(true);
    this.digits = "";
    this.session = null;
    this.pendingOutcome = null;
    this.showPick();
  }

  close(): void {
    this.visible = false;
    this.root.setVisible(false);
    this.session = null;
    this.pendingOutcome = null;
    this.clearList();
    this.clearActions();
    this.onClose?.();
  }

  handleKey(event: KeyboardEvent): boolean {
    if (!this.visible) return false;
    if (event.key === "Escape") {
      this.close();
      return true;
    }
    if (this.mode === "result" && this.pendingOutcome?.type === "counter") {
      // Accept is via the green button only
      if (event.key === "x" || event.key === "X") {
        this.close();
        return true;
      }
      return true;
    }
    if (this.mode === "result") {
      if (
        event.key === "Enter" ||
        event.key === "f" ||
        event.key === "F" ||
        event.key === "x" ||
        event.key === "X"
      ) {
        this.close();
        return true;
      }
      return true;
    }
    if (this.mode !== "offer" || !this.session) return false;

    if (event.key === "Enter") {
      this.submitOffer();
      return true;
    }
    if (event.key === "Backspace") {
      this.digits = this.digits.slice(0, -1);
      this.refreshAmount();
      return true;
    }
    if (/^\d$/.test(event.key) && this.digits.length < 7) {
      this.digits += event.key;
      this.refreshAmount();
      return true;
    }
    return true;
  }

  private showPick(): void {
    this.mode = "pick";
    this.amountText.setVisible(false);
    this.clearList();
    this.clearActions();
    this.titleText.setText(this.npcName);

    if (this.bargainKind === "fish_buy") {
      const slots = this.inventory.listBargainFishSlots();
      this.bodyText.setText(
        slots.length
          ? "Pick a fish to bargain over."
          : "You have no fish to sell."
      );
      this.footerText.setText("Click a fish · Esc — Leave");
      let y = 0;
      for (const slot of slots.slice(0, 6)) {
        const fair = this.inventory.getFishUnitFairValue(slot);
        const label = this.formatFishLabel(slot);
        this.addPickRow(label, `fair ~$${fair}`, y, () => {
          this.session = {
            kind: "fish_buy",
            slot,
            fair,
            label,
          };
          this.showOffer();
        });
        y += 36;
      }
      if (!slots.length) {
        this.footerText.setText("Esc — Leave");
      }
      return;
    }

    const stock = this.getCurioStock();
    const restock = formatCurioRestock(this.getCurioRestockMs());
    this.lastRestockLabel = restock;
    this.bodyText.setText(
      stock.length
        ? "Pick a curio to bargain for."
        : `Stall's empty — restocks in ${restock}.`
    );
    this.footerText.setText(
      stock.length
        ? `Restock in ${restock} · Click an item · Esc — Leave`
        : `Restock in ${restock} · Esc — Leave`
    );
    let y = 0;
    for (const entry of stock.slice(0, 6)) {
      let sub = `fair ~$${entry.fair}`;
      if (entry.kind === "rod") sub = `rod · fair ~$${entry.fair}`;
      if (entry.kind === "misc") sub = `curios · fair ~$${entry.fair}`;
      if (entry.kind === "bobber") {
        sub = `needs ${entry.needsLabel} · fair ~$${entry.fair}`;
      }
      this.addPickRow(entry.label, sub, y, () => {
        this.session = {
          kind: "curio_sell",
          stockId: entry.id,
          itemId: entry.itemId,
          fair: entry.fair,
          label: entry.label,
          stockKind: entry.kind,
          mutation: entry.kind === "fish" ? entry.mutation : null,
          size: entry.kind === "fish" ? entry.size : null,
          needsLabel: entry.kind === "bobber" ? entry.needsLabel : undefined,
        };
        this.showOffer();
      });
      y += 36;
    }
  }

  private refreshCurioRestockLabel(): void {
    const restock = formatCurioRestock(this.getCurioRestockMs());
    if (restock === this.lastRestockLabel) return;
    this.lastRestockLabel = restock;
    const stock = this.getCurioStock();
    // If the timer hit zero and stock refreshed, rebuild the pick list
    if (stock.length && this.bodyText.text.includes("Stall's empty")) {
      this.showPick();
      return;
    }
    if (!stock.length) {
      this.bodyText.setText(`Stall's empty — restocks in ${restock}.`);
      this.footerText.setText(`Restock in ${restock} · Esc — Leave`);
    } else {
      this.footerText.setText(
        `Restock in ${restock} · Click an item · Esc — Leave`
      );
    }
  }

  private showOffer(): void {
    if (!this.session) return;
    this.mode = "offer";
    this.clearList();
    this.clearActions();
    this.digits = "";
    this.amountText.setVisible(true);
    this.refreshAmount();
    this.bodyText.setText(
      this.session.kind === "fish_buy"
        ? `Selling: ${this.session.label}\nName your price.`
        : this.session.stockKind === "bobber" && this.session.needsLabel
          ? `Buying: ${this.session.label}\nStill needs: ${this.session.needsLabel}\nName what you'll pay.`
          : `Buying: ${this.session.label}\nName what you'll pay.`
    );
    this.footerText.setText("Type digits · Enter — Offer · Esc — Back");
  }

  private submitOffer(): void {
    if (!this.session) return;
    const offer = Number(this.digits || "0");
    const outcome = resolveBargainOffer(
      this.session.kind,
      this.session.fair,
      offer,
      this.session.kind === "fish_buy" ? this.session.slot.mutation : null
    );
    this.pendingOutcome = outcome;
    this.mode = "result";
    this.amountText.setVisible(false);
    this.clearList();
    this.clearActions();

    if (outcome.type === "accept") {
      this.bodyText.setText(`Deal!\n$${outcome.price}`);
      this.footerText.setText("Esc — Done");
      this.onDeal?.(this.session, outcome.price);
      this.onCoins?.();
      this.session = null;
    } else if (outcome.type === "reject") {
      this.bodyText.setText(outcome.message);
      this.footerText.setText("Esc — Leave");
      this.session = null;
    } else {
      this.bodyText.setText(outcome.message);
      this.footerText.setText("X — Walk away");
      this.addAcceptButton(() => this.acceptCounter());
    }
  }

  private acceptCounter(): void {
    if (!this.session || this.pendingOutcome?.type !== "counter") return;
    const price = this.pendingOutcome.price;
    this.onDeal?.(this.session, price);
    this.onCoins?.();
    this.clearActions();
    this.bodyText.setText(`Deal!\n$${price}`);
    this.footerText.setText("Esc — Done");
    this.pendingOutcome = { type: "accept", price };
    this.session = null;
  }

  private addAcceptButton(onClick: () => void): void {
    const btn = this.scene.add
      .rectangle(0, 0, 150, 40, 0x2e8b4a, 1)
      .setStrokeStyle(2, 0x5ed67a)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(0, 0, "Accept", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#e8ffe8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    btn.on("pointerover", () => btn.setFillStyle(0x3aa85a, 1));
    btn.on("pointerout", () => btn.setFillStyle(0x2e8b4a, 1));
    btn.on("pointerdown", onClick);
    this.actionRoot.add([btn, label]);
  }

  private formatFishLabel(slot: InventorySlot): string {
    const def = ITEMS[slot.itemId!];
    const mut = slot.mutation ? MUTATIONS[slot.mutation].name + " " : "";
    const size =
      slot.size && slot.size !== "normal"
        ? FISH_SIZES[slot.size].name + " "
        : "";
    return `${mut}${size}${def.name}`;
  }

  private addPickRow(
    title: string,
    sub: string,
    y: number,
    onClick: () => void
  ): void {
    const hit = this.scene.add
      .rectangle(0, y, 400, 32, 0x2a3544, 0.95)
      .setStrokeStyle(1, 0x6a7a88)
      .setInteractive({ useHandCursor: true });
    const t = this.scene.add
      .text(-185, y - 8, title, {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#f0e6d2",
      })
      .setOrigin(0, 0.5);
    const s = this.scene.add
      .text(185, y - 8, sub, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#a8b8c8",
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

  private refreshAmount(): void {
    const n = this.digits === "" ? 0 : Number(this.digits);
    this.amountText.setText(`$${n}`);
  }
}
