import Phaser from "phaser";
import { ITEMS } from "../data/items";
import { ROD_SKINS } from "../data/rodSkins";
import {
  STELLAR_SHOP_OFFERS,
  StellarShopOffer,
} from "../systems/StellarMerchant";
import { InventorySystem } from "../systems/InventorySystem";

type ShopCell = {
  offer: StellarShopOffer;
  bg: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.Text;
  price: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
};

/**
 * Stellar Merchant shop tab — grid of cosmic skins / rods with icons.
 */
export class StellarShopPanel {
  private root: Phaser.GameObjects.Container;
  private gridRoot: Phaser.GameObjects.Container;
  private coinText!: Phaser.GameObjects.Text;
  private cells: ShopCell[] = [];
  private inventory: InventorySystem | null = null;
  visible = false;
  private onBuy?: (offer: StellarShopOffer) => void;
  private onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2 - 10;

    this.root = scene.add.container(cx, cy).setDepth(160).setVisible(false);
    this.root.setScrollFactor(0);

    const panelW = 560;
    const panelH = 400;
    const bg = scene.add
      .rectangle(0, 0, panelW, panelH, 0x100818, 0.97)
      .setStrokeStyle(2, 0xc9a0ff);
    const glow = scene.add
      .rectangle(0, 0, panelW + 8, panelH + 8, 0x2a1848, 0.25)
      .setStrokeStyle(1, 0x7ec8ff, 0.35);

    const title = scene.add
      .text(0, -panelH / 2 + 28, "Stellar Shop", {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#f0e0ff",
      })
      .setOrigin(0.5);

    const subtitle = scene.add
      .text(0, -panelH / 2 + 56, "Cosmic goods · click a square to buy", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#a890c0",
      })
      .setOrigin(0.5);

    this.coinText = scene.add
      .text(panelW / 2 - 24, -panelH / 2 + 28, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffe066",
      })
      .setOrigin(1, 0.5);

    this.gridRoot = scene.add.container(0, 8);

    const closeBtn = scene.add
      .rectangle(0, panelH / 2 - 36, 120, 36, 0x3a2a58)
      .setStrokeStyle(1, 0xc9a0ff)
      .setInteractive({ useHandCursor: true });
    const closeLabel = scene.add
      .text(0, panelH / 2 - 36, "Close", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    closeBtn.on("pointerover", () => closeBtn.setFillStyle(0x4a3a68));
    closeBtn.on("pointerout", () => closeBtn.setFillStyle(0x3a2a58));
    closeBtn.on("pointerdown", () => this.setOpen(false));

    const hint = scene.add
      .text(0, panelH / 2 - 68, "Esc / X — leave", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#786890",
      })
      .setOrigin(0.5);

    this.root.add([
      glow,
      bg,
      title,
      subtitle,
      this.coinText,
      this.gridRoot,
      closeBtn,
      closeLabel,
      hint,
    ]);

    this.buildGrid(scene);
  }

  setInventory(inventory: InventorySystem): void {
    this.inventory = inventory;
  }

  setCallbacks(
    onBuy: (offer: StellarShopOffer) => void,
    onClose?: () => void
  ): void {
    this.onBuy = onBuy;
    this.onClose = onClose;
  }

  open(): void {
    this.setOpen(true);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (open) {
      this.refresh();
    } else {
      this.onClose?.();
    }
  }

  handleKey(event: KeyboardEvent): void {
    if (!this.visible) return;
    if (event.key === "Escape" || event.key === "x" || event.key === "X") {
      this.setOpen(false);
    }
  }

  private ownsOffer(offer: StellarShopOffer): boolean {
    if (!this.inventory) return false;
    if (offer.kind === "skin") return this.inventory.ownsRodSkin(offer.skinId);
    return this.inventory.ownsRod(offer.rodId);
  }

  private textureFor(offer: StellarShopOffer): string {
    if (offer.kind === "skin") {
      return ROD_SKINS[offer.skinId]?.textureKey ?? "rod";
    }
    return ITEMS[offer.rodId]?.textureKey ?? "rod";
  }

  private canBuyOffer(offer: StellarShopOffer): boolean {
    if (!this.inventory || this.ownsOffer(offer)) return false;
    if (this.inventory.coins < offer.price) return false;
    if (offer.kind === "rod" && offer.requiresItem) {
      return this.inventory.hasItem(offer.requiresItem);
    }
    return true;
  }

  private priceLabel(offer: StellarShopOffer, owned: boolean): string {
    if (owned) return "—";
    if (offer.kind === "rod" && offer.requiresItem) {
      const mat = ITEMS[offer.requiresItem]?.name ?? offer.requiresItem;
      return `$${offer.price.toLocaleString()}\n+ ${mat}`;
    }
    return `$${offer.price.toLocaleString()}`;
  }

  refresh(): void {
    if (!this.inventory) return;
    this.coinText.setText(`$${this.inventory.coins.toLocaleString()}`);
    for (const cell of this.cells) {
      const owned = this.ownsOffer(cell.offer);
      const canBuy = this.canBuyOffer(cell.offer);
      cell.status.setText(
        owned ? "Owned" : canBuy ? "Buy" : "Can't buy"
      );
      cell.status.setColor(
        owned ? "#7dff9a" : canBuy ? "#ffe066" : "#ff8866"
      );
      cell.bg.setFillStyle(
        owned ? 0x1a3028 : canBuy ? 0x1a1430 : 0x18141c,
        0.95
      );
      cell.bg.setStrokeStyle(
        2,
        owned ? 0x6dff9a : canBuy ? 0xc9a0ff : 0x4a4060
      );
      cell.icon.setAlpha(owned ? 0.55 : 1);
      cell.price.setText(this.priceLabel(cell.offer, owned));
    }
  }

  private buildGrid(scene: Phaser.Scene): void {
    this.gridRoot.removeAll(true);
    this.cells = [];

    const offers = [...STELLAR_SHOP_OFFERS];
    const cols = Math.min(3, Math.max(1, offers.length));
    const cell = 128;
    const gap = 16;
    const rows = Math.ceil(offers.length / cols);
    const gridW = cols * cell + (cols - 1) * gap;
    const gridH = rows * cell + (rows - 1) * gap;
    const startX = -gridW / 2 + cell / 2;
    const startY = -gridH / 2 + cell / 2 - 10;

    offers.forEach((offer, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cell + gap);
      const y = startY + row * (cell + gap);

      const bg = scene.add
        .rectangle(x, y, cell, cell, 0x1a1430, 0.95)
        .setStrokeStyle(2, 0xc9a0ff)
        .setInteractive({ useHandCursor: true });

      const tex = this.textureFor(offer);
      const iconKey = scene.textures.exists(tex) ? tex : "rod";
      const src = scene.textures.get(iconKey).getSourceImage() as
        | HTMLImageElement
        | HTMLCanvasElement;
      const nw = src.width || 64;
      const nh = src.height || 64;
      const maxSide = 56;
      const scale = Math.min(maxSide / nw, maxSide / nh);
      const icon = scene.add
        .image(x, y - 18, iconKey)
        .setDisplaySize(Math.round(nw * scale), Math.round(nh * scale));

      const name = scene.add
        .text(x, y + 24, offer.label, {
          fontFamily: "Georgia, serif",
          fontSize: "11px",
          color: "#f0e0ff",
          align: "center",
          wordWrap: { width: cell - 10 },
        })
        .setOrigin(0.5);

      const price = scene.add
        .text(x, y + 38, `$${offer.price.toLocaleString()}`, {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#ffe066",
          align: "center",
          lineSpacing: 2,
        })
        .setOrigin(0.5);

      const status = scene.add
        .text(x, y + 54, "Buy", {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#c9a0ff",
        })
        .setOrigin(0.5);

      bg.on("pointerover", () => {
        if (!this.ownsOffer(offer)) bg.setFillStyle(0x2a2050, 0.98);
      });
      bg.on("pointerout", () => this.refresh());
      bg.on("pointerdown", () => {
        if (this.ownsOffer(offer)) return;
        this.onBuy?.(offer);
      });

      this.gridRoot.add([bg, icon, name, price, status]);
      this.cells.push({ offer, bg, icon, name, price, status });
    });
  }
}
